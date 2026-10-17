-- Parkncharge v0.5 — mensagens entre condutor e anfitrião
-- Uma conversa por anúncio (lugar ou carro) e por condutor. Começa com uma pergunta (antes de reservar)
-- e continua depois; as reservas desse condutor nesse anúncio aparecem dentro da conversa.
-- Telefones e emails são escondidos (no servidor) até haver uma reserva confirmada entre os dois.

create table parkncharge.conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid references parkncharge.listings(id) on delete cascade,
  car_id          uuid references parkncharge.cars(id) on delete cascade,
  guest_id        uuid not null references auth.users(id) on delete cascade,   -- condutor
  host_id         uuid not null references auth.users(id) on delete cascade,   -- anfitrião
  guest_name      text not null default 'Condutor',
  host_name       text not null default 'Anfitrião',
  last_message_at timestamptz,
  last_preview    text,
  last_sender_id  uuid,
  guest_read_at   timestamptz not null default now(),
  host_read_at    timestamptz not null default 'epoch',
  created_at      timestamptz not null default now(),
  check ((listing_id is null) <> (car_id is null)),
  check (guest_id <> host_id)
);
create unique index conversations_um_por_lugar on parkncharge.conversations(listing_id, guest_id) where listing_id is not null;
create unique index conversations_um_por_carro on parkncharge.conversations(car_id, guest_id) where car_id is not null;
create index conversations_host on parkncharge.conversations(host_id, last_message_at desc);
create index conversations_guest on parkncharge.conversations(guest_id, last_message_at desc);

create table parkncharge.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references parkncharge.conversations(id) on delete cascade,
  sender_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  masked          boolean not null default false,          -- true = tinha contactos escondidos
  created_at      timestamptz not null default now()
);
create index messages_conversa on parkncharge.messages(conversation_id, created_at);

alter table parkncharge.conversations enable row level security;
alter table parkncharge.messages enable row level security;

-- ---------- Leitura: só os dois participantes (e o admin) ----------
create policy conversations_participantes on parkncharge.conversations for select to authenticated
  using (auth.uid() in (guest_id, host_id) or parkncharge.is_admin());
create policy messages_participantes on parkncharge.messages for select to authenticated
  using (exists (select 1 from parkncharge.conversations c where c.id = conversation_id
                 and (auth.uid() in (c.guest_id, c.host_id) or parkncharge.is_admin())));
-- Escrever: só participantes, em nome próprio (o trigger confirma e esconde contactos). Ninguém edita nem apaga.
create policy messages_escrever on parkncharge.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (select 1 from parkncharge.conversations c where c.id = conversation_id
                 and auth.uid() in (c.guest_id, c.host_id)));
grant select on parkncharge.conversations to authenticated;
grant select, insert on parkncharge.messages to authenticated;

-- ---------- Há reserva confirmada entre os dois neste anúncio? ----------
create or replace function parkncharge.conversation_has_booking(p_conv uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from parkncharge.conversations c join parkncharge.bookings b
                   on b.driver_id = c.guest_id and b.status = 'confirmada'
                  and ((c.listing_id is not null and b.listing_id = c.listing_id) or (c.car_id is not null and b.car_id = c.car_id))
                  where c.id = p_conv);
$$;

-- esconde emails e telefones de um texto (sequências com 9 ou mais algarismos; datas e preços ficam)
create or replace function parkncharge.mask_contacts(t text)
returns text language plpgsql immutable set search_path = ''
as $$
declare m text;
begin
  t := regexp_replace(t, '[A-Za-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}', '•••', 'gi');
  for m in select (regexp_matches(t, '((\+|00)?\d[\d\s.()-]{7,}\d)', 'g'))[1] loop
    if length(regexp_replace(m, '\D', '', 'g')) >= 9 then t := replace(t, m, '•••'); end if;
  end loop;
  return t;
end;
$$;

-- ---------- Regras ao escrever uma mensagem ----------
create or replace function parkncharge.messages_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare c record; clean text;
begin
  select * into c from parkncharge.conversations where id = new.conversation_id;
  if c.id is null then raise exception 'Conversa não encontrada'; end if;
  new.sender_id := auth.uid();
  if new.sender_id is null or new.sender_id not in (c.guest_id, c.host_id) then raise exception 'Só os participantes podem escrever nesta conversa'; end if;
  new.body := trim(new.body);
  if new.body = '' then raise exception 'Escreva uma mensagem'; end if;
  new.created_at := now(); new.masked := false;
  if not parkncharge.conversation_has_booking(c.id) then
    clean := parkncharge.mask_contacts(new.body);
    if clean <> new.body then new.body := clean; new.masked := true; end if;
  end if;
  update parkncharge.conversations
     set last_message_at = new.created_at, last_preview = left(new.body, 120), last_sender_id = new.sender_id,
         guest_read_at = case when new.sender_id = c.guest_id then new.created_at else guest_read_at end,
         host_read_at  = case when new.sender_id = c.host_id  then new.created_at else host_read_at end
   where id = c.id;
  return new;
end;
$$;
create trigger messages_guard before insert on parkncharge.messages for each row execute function parkncharge.messages_guard();
revoke execute on function parkncharge.messages_guard() from public, anon, authenticated;

-- ---------- Abrir (ou criar) a conversa ----------
-- Condutor: p_guest vazio → a conversa dele com o anfitrião do anúncio (anúncio tem de estar ativo).
-- Anfitrião: p_guest = condutor → só se esse condutor tiver uma reserva no anúncio.
create or replace function parkncharge.open_conversation(p_listing uuid, p_car uuid, p_guest uuid default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare me uuid := auth.uid(); it record; g uuid; cid uuid;
begin
  if me is null then raise exception 'Entre na sua conta para enviar mensagens'; end if;
  if (p_listing is null) = (p_car is null) then raise exception 'Indique um lugar ou um carro'; end if;
  if p_listing is not null then
    select l.host_id, l.status into it from parkncharge.listings l where l.id = p_listing;
  else
    select c.host_id, c.status into it from parkncharge.cars c where c.id = p_car;
  end if;
  if it.host_id is null then raise exception 'Anúncio não encontrado'; end if;

  if p_guest is null or p_guest = me then
    g := me;
    if it.host_id = me then raise exception 'Não pode enviar mensagens a si próprio'; end if;
  else
    if it.host_id <> me and not parkncharge.is_admin() then raise exception 'Só o anfitrião deste anúncio pode abrir esta conversa'; end if;
    if not exists (select 1 from parkncharge.bookings b where b.driver_id = p_guest
                     and ((p_listing is not null and b.listing_id = p_listing) or (p_car is not null and b.car_id = p_car))) then
      raise exception 'Só pode escrever a condutores que reservaram este anúncio';
    end if;
    g := p_guest;
  end if;

  select id into cid from parkncharge.conversations
   where guest_id = g and ((p_listing is not null and listing_id = p_listing) or (p_car is not null and car_id = p_car));
  if cid is not null then return cid; end if;

  if g = me and it.status <> 'ativo' then raise exception 'Este anúncio não está disponível'; end if;
  insert into parkncharge.conversations(listing_id, car_id, guest_id, host_id, guest_name, host_name)
  values (p_listing, p_car, g, it.host_id,
          coalesce(nullif(split_part(trim((select p.nome from public.profiles p where p.id = g)), ' ', 1), ''), 'Condutor'),
          coalesce(nullif(split_part(trim((select p.nome from public.profiles p where p.id = it.host_id)), ' ', 1), ''), 'Anfitrião'))
  returning id into cid;
  return cid;
end;
$$;
revoke execute on function parkncharge.open_conversation(uuid, uuid, uuid) from public, anon;
grant execute on function parkncharge.open_conversation(uuid, uuid, uuid) to authenticated;

-- ---------- Marcar como lida ----------
create or replace function parkncharge.mark_conversation_read(p_conv uuid)
returns void language sql security definer set search_path = ''
as $$
  update parkncharge.conversations
     set guest_read_at = case when guest_id = auth.uid() then now() else guest_read_at end,
         host_read_at  = case when host_id  = auth.uid() then now() else host_read_at end
   where id = p_conv and auth.uid() in (guest_id, host_id);
$$;
revoke execute on function parkncharge.mark_conversation_read(uuid) from public, anon;
grant execute on function parkncharge.mark_conversation_read(uuid) to authenticated;

-- ---------- Conversas por ler (para o número na barra) ----------
create or replace function parkncharge.unread_conversations()
returns table(as_guest int, as_host int) language sql stable security definer set search_path = ''
as $$
  select count(*) filter (where c.guest_id = auth.uid() and c.last_message_at > c.guest_read_at and c.last_sender_id <> auth.uid())::int,
         count(*) filter (where c.host_id  = auth.uid() and c.last_message_at > c.host_read_at  and c.last_sender_id <> auth.uid())::int
    from parkncharge.conversations c where auth.uid() in (c.guest_id, c.host_id);
$$;
revoke execute on function parkncharge.unread_conversations() from public, anon;
grant execute on function parkncharge.unread_conversations() to authenticated;

revoke execute on function parkncharge.conversation_has_booking(uuid) from public, anon, authenticated;
revoke execute on function parkncharge.mask_contacts(text) from public, anon, authenticated;
