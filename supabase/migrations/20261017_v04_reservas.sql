-- Parkncharge v0.4 — reservas (lugares e carros)
-- Regras (decisões D70–D76):
--  · reserva instantânea → confirmada logo; com aprovação → "pedido" que expira em 24 h ou no início (o que vier primeiro)
--  · lugares: o período inteiro tem de caber no horário; carros: levantar e entregar dentro do horário;
--    reservas de 30 dias ou mais ignoram o horário
--  · preço calculado no servidor (a combinação mais barata de horas, dias e meses)
--  · sem sobreposições (restrição de exclusão); pedidos ativos também bloqueiam o período
--  · condutor cancela até ao início; anfitrião cancela uma confirmada com motivo
--  · morada exata e instruções só para o condutor de uma reserva confirmada, até ao fim
--  · avaliações só depois de uma reserva concluída

create extension if not exists btree_gist with schema extensions;

create table parkncharge.bookings (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references parkncharge.listings(id) on delete cascade,
  car_id        uuid references parkncharge.cars(id) on delete cascade,
  driver_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  host_id       uuid references auth.users(id) on delete cascade,      -- copiado do anúncio (para as regras de acesso)
  driver_name   text check (char_length(driver_name) <= 40),          -- primeiro nome do condutor (o perfil não é público)
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  period        tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  status        text not null default 'pedido'
                check (status in ('pedido','confirmada','recusada','cancelada','expirada')),
  total_price   numeric(10,2),
  price_label   text,
  vehicle_note  text check (char_length(vehicle_note) <= 80),         -- matrícula/modelo (lugares)
  message       text check (char_length(message) <= 500),             -- mensagem ao anfitrião
  expires_at    timestamptz,                                          -- prazo de resposta de um pedido
  decided_at    timestamptz,
  cancel_reason text check (char_length(cancel_reason) <= 300),
  cancelled_by  text check (cancelled_by in ('condutor','anfitriao','admin')),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((listing_id is null) <> (car_id is null)),
  check (ends_at > starts_at)
);
create index bookings_driver_idx  on parkncharge.bookings(driver_id, starts_at desc);
create index bookings_host_idx    on parkncharge.bookings(host_id, starts_at);
create index bookings_listing_idx on parkncharge.bookings(listing_id, starts_at);
create index bookings_car_idx     on parkncharge.bookings(car_id, starts_at);

-- Sem sobreposições (pedidos ativos e confirmadas)
alter table parkncharge.bookings add constraint bookings_sem_sobreposicao_lugar
  exclude using gist (listing_id with =, period with &&) where (listing_id is not null and status in ('pedido','confirmada'));
alter table parkncharge.bookings add constraint bookings_sem_sobreposicao_carro
  exclude using gist (car_id with =, period with &&) where (car_id is not null and status in ('pedido','confirmada'));

-- ------------------------------------------------------------
-- Horário: lugares (período inteiro) e carros (levantar/entregar)
-- ------------------------------------------------------------
create or replace function parkncharge.fits_schedule(p_listing uuid, p_car uuid, s timestamptz, e timestamptz)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  ls timestamp := s at time zone 'Europe/Lisbon';
  le timestamp := e at time zone 'Europe/Lisbon';
  d date; seg_s time; seg_e time; wd int; o time; c time; to_midnight boolean;
begin
  if e - s >= interval '30 days' then return true; end if;   -- reservas mensais ignoram o horário semanal

  if p_car is not null then
    -- carro: levantar dentro do horário do dia de início, entregar dentro do horário do dia de fim
    select cs.opens_at, cs.closes_at into o, c from parkncharge.car_schedule cs
      where cs.car_id = p_car and cs.weekday = extract(isodow from ls::date)::int - 1;
    if not found or ls::time < o or ls::time >= c then return false; end if;
    if le::time = '00:00' then   -- entrega à meia-noite = fim do dia anterior
      select cs.opens_at, cs.closes_at into o, c from parkncharge.car_schedule cs
        where cs.car_id = p_car and cs.weekday = extract(isodow from (le::date - 1))::int - 1;
      return found and c = '24:00'::time;
    end if;
    select cs.opens_at, cs.closes_at into o, c from parkncharge.car_schedule cs
      where cs.car_id = p_car and cs.weekday = extract(isodow from le::date)::int - 1;
    return found and le::time > o and le::time <= c;
  end if;

  -- lugar: cada dia do período tem de estar dentro do horário
  d := ls::date;
  while d <= le::date loop
    seg_s := case when d = ls::date then ls::time else '00:00'::time end;
    if d = le::date then
      exit when le::time = '00:00';
      seg_e := le::time; to_midnight := false;
    else
      to_midnight := true;
    end if;
    wd := extract(isodow from d)::int - 1;          -- 0 = segunda … 6 = domingo
    select ls2.opens_at, ls2.closes_at into o, c from parkncharge.listing_schedule ls2
      where ls2.listing_id = p_listing and ls2.weekday = wd;
    if not found or seg_s < o then return false; end if;
    if to_midnight then
      if c <> '24:00'::time then return false; end if;
    elsif seg_e > c then return false; end if;
    d := d + 1;
  end loop;
  return true;
end;
$$;

-- ------------------------------------------------------------
-- Preço (igual ao estimado no site): a combinação mais barata
-- ------------------------------------------------------------
create or replace function parkncharge.booking_price(ph numeric, pd numeric, pm numeric, s timestamptz, e timestamptz,
  out total numeric, out label text)
language plpgsql immutable set search_path = ''
as $$
declare
  h numeric := extract(epoch from (e - s)) / 3600.0;
  n int; fd int; rh int;
  sph text := replace(round(ph, 2)::text, '.', ',');
  spd text := replace(round(pd, 2)::text, '.', ',');
  spm text := replace(round(pm, 2)::text, '.', ',');
begin
  if ph is not null then n := ceil(h); total := n * ph; label := n || ' h × ' || sph || ' €'; end if;
  if pd is not null then
    n := ceil(h / 24);
    if total is null or n * pd < total then total := n * pd; label := n || ' dia(s) × ' || spd || ' €'; end if;
    if ph is not null then
      fd := floor(h / 24); rh := ceil(h - fd * 24);
      if fd > 0 and rh > 0 and rh * ph < pd and fd * pd + rh * ph < total then
        total := fd * pd + rh * ph; label := fd || ' dia(s) × ' || spd || ' € + ' || rh || ' h × ' || sph || ' €';
      end if;
    end if;
  end if;
  if pm is not null then
    n := ceil(h / 720);
    if total is null or n * pm < total then total := n * pm; label := n || ' mês(es) × ' || spm || ' €'; end if;
  end if;
  total := round(total, 2);
end;
$$;

-- ------------------------------------------------------------
-- Regras das reservas
-- ------------------------------------------------------------
create or replace function parkncharge.bookings_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  admin boolean := parkncharge.is_admin();
  me uuid := auth.uid();
  it record;
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if not admin then new.driver_id := me; new.is_demo := false; end if;

    if new.listing_id is not null then
      select l.host_id, l.status, l.instant_book, l.price_hour ph, l.price_day pd, l.price_month pm into it
        from parkncharge.listings l where l.id = new.listing_id;
    else
      select c.host_id, c.status, c.instant_book, c.price_hour ph, c.price_day pd, c.price_month pm into it
        from parkncharge.cars c where c.id = new.car_id;
    end if;
    if it.host_id is null then raise exception 'Anúncio não encontrado'; end if;
    new.host_id := it.host_id;
    new.driver_name := coalesce(nullif(split_part(trim((select p.nome from public.profiles p where p.id = new.driver_id)), ' ', 1), ''), 'Condutor');

    if not new.is_demo then
      if it.status <> 'ativo' then raise exception 'Este anúncio não está disponível para reservas'; end if;
      if it.host_id = new.driver_id then raise exception 'Não pode reservar os seus próprios anúncios'; end if;
      if new.starts_at < now() - interval '5 minutes' then raise exception 'O início da reserva já passou'; end if;
      if new.ends_at - new.starts_at < interval '30 minutes' then raise exception 'A reserva tem de durar pelo menos 30 minutos'; end if;
      if new.ends_at - new.starts_at > interval '366 days' then raise exception 'A reserva não pode durar mais de um ano'; end if;
      if not parkncharge.fits_schedule(new.listing_id, new.car_id, new.starts_at, new.ends_at) then
        raise exception 'Fora do horário do anúncio. Escolha um período dentro do horário indicado';
      end if;
      -- preço e estado são sempre decididos aqui (nunca pelo browser)
      select bp.total, bp.label into new.total_price, new.price_label
        from parkncharge.booking_price(it.ph, it.pd, it.pm, new.starts_at, new.ends_at) bp;
      if new.total_price is null then raise exception 'Este anúncio não tem preço definido'; end if;
      new.cancel_reason := null; new.cancelled_by := null;
      if it.instant_book then
        new.status := 'confirmada'; new.decided_at := now(); new.expires_at := null;
      else
        new.status := 'pedido'; new.decided_at := null;
        new.expires_at := least(now() + interval '24 hours', new.starts_at);
      end if;
    end if;

    -- pedidos já expirados deixam de bloquear o período
    update parkncharge.bookings b set status = 'expirada'
     where b.status = 'pedido' and b.expires_at <= now()
       and ((new.listing_id is not null and b.listing_id = new.listing_id) or (new.car_id is not null and b.car_id = new.car_id));
    return new;
  end if;

  -- UPDATE: dados da reserva não mudam; só o estado, segundo as regras
  new.listing_id := old.listing_id; new.car_id := old.car_id; new.driver_id := old.driver_id; new.host_id := old.host_id;
  new.driver_name := old.driver_name; new.starts_at := old.starts_at; new.ends_at := old.ends_at;
  new.total_price := old.total_price; new.price_label := old.price_label; new.created_at := old.created_at;
  new.vehicle_note := old.vehicle_note; new.message := old.message; new.expires_at := old.expires_at;
  if not admin then new.is_demo := old.is_demo; end if;

  if new.status is distinct from old.status then
    if old.status = 'pedido' and new.status = 'expirada' and old.expires_at <= now() then
      null;                                                     -- expiração (qualquer pessoa / sistema)
    elsif admin then
      if new.status = 'cancelada' then new.cancelled_by := coalesce(new.cancelled_by, 'admin'); end if;
    elsif me = old.host_id and old.status = 'pedido' and new.status in ('confirmada','recusada') then
      if old.expires_at <= now() then raise exception 'Este pedido já expirou'; end if;
      new.decided_at := now();
      if new.status = 'confirmada' then new.cancel_reason := null; end if;
    elsif me = old.host_id and old.status = 'confirmada' and new.status = 'cancelada' then
      if old.ends_at <= now() then raise exception 'Esta reserva já terminou'; end if;
      if coalesce(trim(new.cancel_reason), '') = '' then raise exception 'Indique o motivo do cancelamento'; end if;
      new.cancelled_by := 'anfitriao';
    elsif me = old.driver_id and old.status = 'pedido' and new.status = 'cancelada' then
      new.cancelled_by := 'condutor';
    elsif me = old.driver_id and old.status = 'confirmada' and new.status = 'cancelada' then
      if now() >= old.starts_at then raise exception 'A reserva já começou e não pode ser cancelada'; end if;
      new.cancelled_by := 'condutor';
    else
      raise exception 'Alteração não permitida (% → %)', old.status, new.status;
    end if;
  else
    -- sem mudança de estado: nada mais pode ser alterado
    new.cancel_reason := old.cancel_reason; new.cancelled_by := old.cancelled_by; new.decided_at := old.decided_at;
  end if;
  return new;
end;
$$;
create trigger bookings_guard before insert or update on parkncharge.bookings
  for each row execute function parkncharge.bookings_guard();

alter table parkncharge.bookings enable row level security;
create policy "condutor, anfitrião ou admin veem a reserva" on parkncharge.bookings
  for select to authenticated
  using (driver_id = (select auth.uid()) or host_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "conta faz reservas" on parkncharge.bookings
  for insert to authenticated with check (driver_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "condutor ou anfitrião mudam o estado" on parkncharge.bookings
  for update to authenticated
  using (driver_id = (select auth.uid()) or host_id = (select auth.uid()) or (select parkncharge.is_admin()))
  with check (driver_id = (select auth.uid()) or host_id = (select auth.uid()) or (select parkncharge.is_admin()));
grant select, insert, update on parkncharge.bookings to authenticated;

-- ------------------------------------------------------------
-- Funções públicas (sem revelar quem reservou)
-- ------------------------------------------------------------
-- Anúncios ocupados agora (para o estado no Explorar)
create or replace function parkncharge.occupied_now()
returns table (listing_id uuid, car_id uuid) language sql stable security definer set search_path = ''
as $$
  select b.listing_id, b.car_id from parkncharge.bookings b
   where b.status = 'confirmada' and now() >= b.starts_at and now() < b.ends_at;
$$;
-- Períodos já ocupados de um anúncio (confirmadas e pedidos por responder)
create or replace function parkncharge.busy_periods(p_listing uuid, p_car uuid)
returns table (starts_at timestamptz, ends_at timestamptz, pending boolean) language sql stable security definer set search_path = ''
as $$
  select b.starts_at, b.ends_at, b.status = 'pedido' from parkncharge.bookings b
   where ((p_listing is not null and b.listing_id = p_listing) or (p_car is not null and b.car_id = p_car))
     and b.ends_at > now()
     and (b.status = 'confirmada' or (b.status = 'pedido' and b.expires_at > now()))
   order by b.starts_at limit 100;
$$;
-- Marca como expirados os pedidos sem resposta a tempo
create or replace function parkncharge.expire_requests()
returns integer language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  update parkncharge.bookings set status = 'expirada' where status = 'pedido' and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;
-- Morada exata e instruções: só para o condutor de uma reserva confirmada (até ao fim), o anfitrião e o admin
create or replace function parkncharge.booking_access(p_booking uuid)
returns json language plpgsql stable security definer set search_path = ''
as $$
declare b record; r json;
begin
  select * into b from parkncharge.bookings where id = p_booking;
  if b.id is null then return null; end if;
  if not (auth.uid() = b.host_id or parkncharge.is_admin()
          or (auth.uid() = b.driver_id and b.status = 'confirmada' and now() < b.ends_at)) then
    return null;
  end if;
  if b.listing_id is not null then
    select json_build_object('address', p.address, 'postal_code', p.postal_code, 'lat', p.lat, 'lng', p.lng, 'instructions', p.access_instructions)
      into r from parkncharge.listing_private p where p.listing_id = b.listing_id;
  else
    select json_build_object('address', p.address, 'lat', p.lat, 'lng', p.lng, 'instructions', p.pickup_instructions, 'plate', p.plate)
      into r from parkncharge.car_private p where p.car_id = b.car_id;
  end if;
  return r;
end;
$$;

revoke all on function parkncharge.fits_schedule(uuid, uuid, timestamptz, timestamptz) from public;
revoke all on function parkncharge.occupied_now() from public;
revoke all on function parkncharge.busy_periods(uuid, uuid) from public;
revoke all on function parkncharge.expire_requests() from public;
revoke all on function parkncharge.booking_access(uuid) from public;
grant execute on function parkncharge.fits_schedule(uuid, uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function parkncharge.occupied_now() to anon, authenticated;
grant execute on function parkncharge.busy_periods(uuid, uuid) to anon, authenticated;
grant execute on function parkncharge.expire_requests() to authenticated;
grant execute on function parkncharge.booking_access(uuid) to authenticated;

-- ------------------------------------------------------------
-- Avaliações: só depois de uma reserva concluída (D62 atualizada)
-- ------------------------------------------------------------
create or replace function parkncharge.reviews_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  admin boolean := parkncharge.is_admin();
  owner uuid; st text;
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not admin then new.author_id := auth.uid(); new.is_demo := false; end if;
    if not new.is_demo then
      new.author_name := coalesce(nullif(split_part(trim((select p.nome from public.profiles p where p.id = new.author_id)), ' ', 1), ''), 'Utilizador');
    end if;
    if new.listing_id is not null then
      select l.host_id, l.status into owner, st from parkncharge.listings l where l.id = new.listing_id;
    else
      select c.host_id, c.status into owner, st from parkncharge.cars c where c.id = new.car_id;
    end if;
    if st is distinct from 'ativo' then raise exception 'Só se podem avaliar anúncios ativos'; end if;
    if owner = new.author_id and not new.is_demo then raise exception 'Não pode avaliar os seus próprios anúncios'; end if;
    if not new.is_demo and not exists (
      select 1 from parkncharge.bookings b
       where b.driver_id = new.author_id and b.status = 'confirmada' and b.ends_at <= now()
         and ((new.listing_id is not null and b.listing_id = new.listing_id) or (new.car_id is not null and b.car_id = new.car_id))
    ) then
      raise exception 'Só quem fez uma reserva concluída pode avaliar';
    end if;
  else
    new.author_id := old.author_id; new.listing_id := old.listing_id; new.car_id := old.car_id;
    new.created_at := old.created_at;
    if not admin then new.is_demo := old.is_demo; new.author_name := old.author_name; end if;
  end if;
  return new;
end;
$$;
