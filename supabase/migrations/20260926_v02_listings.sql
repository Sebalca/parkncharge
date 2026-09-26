-- Parkncharge v0.2 — schema próprio, anúncios do anfitrião, aprovação manual
-- Projeto Supabase partilhado "Sites". Conta única: auth.users + public.profiles.

create schema if not exists parkncharge;
grant usage on schema parkncharge to anon, authenticated;

-- ------------------------------------------------------------
-- Utilitários
-- ------------------------------------------------------------
create or replace function parkncharge.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;
revoke all on function parkncharge.is_admin() from public;
grant execute on function parkncharge.is_admin() to anon, authenticated;

create or replace function parkncharge.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;

-- ------------------------------------------------------------
-- Perfil de anfitrião (específico do site; nome/avatar ficam em public.profiles)
-- ------------------------------------------------------------
create table parkncharge.host_profiles (
  user_id      uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  host_type    text not null default 'particular' check (host_type in ('particular','empresa')),
  company_name text,
  nif          text check (nif is null or nif ~ '^[0-9]{9}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint empresa_tem_nome check (host_type = 'particular' or coalesce(trim(company_name),'') <> '')
);
create trigger host_profiles_touch before update on parkncharge.host_profiles
  for each row execute function parkncharge.touch_updated_at();

alter table parkncharge.host_profiles enable row level security;
create policy "anfitrião vê o próprio perfil" on parkncharge.host_profiles
  for select to authenticated using (user_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "anfitrião cria o próprio perfil" on parkncharge.host_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "anfitrião atualiza o próprio perfil" on parkncharge.host_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Anúncios (dados públicos após aprovação)
-- ------------------------------------------------------------
create table parkncharge.listings (
  id               uuid primary key default gen_random_uuid(),
  host_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status           text not null default 'rascunho'
                   check (status in ('rascunho','pendente','ativo','recusado','pausado')),
  rejection_reason text,
  title            text check (char_length(title) <= 80),
  description      text check (char_length(description) <= 2000),
  spot_type        text check (spot_type in ('garagem','box','lugar_coberto','lugar_descoberto','parque')),
  zone             text,                    -- zona/freguesia mostrada publicamente
  city             text not null default 'Porto',
  approx_lat       double precision,        -- posição aproximada (~300 m), calculada no servidor
  approx_lng       double precision,
  vehicle_types    text[] not null default '{carro}'
                   check (vehicle_types <@ array['moto','carro','carrinha','autocarro','camiao','autocaravana']),
  is_covered       boolean not null default false,
  is_underground   boolean not null default false,
  is_closed        boolean not null default false,
  is_solo          boolean not null default false,
  easy_entry       boolean not null default false,
  max_height_m     numeric(3,2) check (max_height_m is null or max_height_m between 1 and 6),
  has_charger      boolean not null default false,
  charger_type     text check (charger_type in ('schuko','tipo2','ccs','chademo','outro')),
  charger_kw       numeric(5,1) check (charger_kw is null or charger_kw > 0),
  charge_price_mode text check (charge_price_mode in ('incluido','a_parte')),
  charge_price_kwh numeric(6,3) check (charge_price_kwh is null or charge_price_kwh >= 0),
  price_hour       numeric(8,2) check (price_hour  is null or price_hour  > 0),
  price_day        numeric(8,2) check (price_day   is null or price_day   > 0),
  price_month      numeric(8,2) check (price_month is null or price_month > 0),
  instant_book     boolean not null default false,
  cover_photo      text,                    -- caminho no Storage da foto de capa
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  approved_at      timestamptz,
  approved_by      uuid references auth.users(id)
);
create index listings_host_idx   on parkncharge.listings(host_id);
create index listings_status_idx on parkncharge.listings(status);
create index listings_geo_idx    on parkncharge.listings(approx_lat, approx_lng) where status = 'ativo';

-- Dados privados: só o anfitrião (e admin). Mais tarde: condutor com reserva confirmada.
create table parkncharge.listing_private (
  listing_id          uuid primary key references parkncharge.listings(id) on delete cascade,
  address             text not null,
  postal_code         text check (postal_code is null or postal_code ~ '^[0-9]{4}-[0-9]{3}$'),
  lat                 double precision not null check (lat between -90 and 90),
  lng                 double precision not null check (lng between -180 and 180),
  access_instructions text check (char_length(access_instructions) <= 1000),
  updated_at          timestamptz not null default now()
);

create table parkncharge.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references parkncharge.listings(id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);
create index listing_photos_listing_idx on parkncharge.listing_photos(listing_id, position);

-- Horário semanal (0 = segunda … 6 = domingo). Dia sem linha = fechado.
create table parkncharge.listing_schedule (
  listing_id uuid not null references parkncharge.listings(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  opens_at   time not null,
  closes_at  time not null,
  primary key (listing_id, weekday),
  check (closes_at > opens_at)
);

-- ------------------------------------------------------------
-- Regras de negócio nos triggers
-- ------------------------------------------------------------
create or replace function parkncharge.listings_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  admin boolean := parkncharge.is_admin();
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not admin then
      new.host_id := auth.uid();
      if new.status not in ('rascunho','pendente') then new.status := 'rascunho'; end if;
      new.approved_at := null; new.approved_by := null; new.rejection_reason := null;
    end if;
  else
    new.host_id := old.host_id;                       -- dono nunca muda
    if not admin then
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
      new.rejection_reason := old.rejection_reason;
      -- transições permitidas ao anfitrião
      if new.status is distinct from old.status and not (
           (old.status in ('rascunho','recusado') and new.status = 'pendente')
        or (old.status = 'pendente'  and new.status = 'rascunho')
        or (old.status = 'ativo'     and new.status = 'pausado')
        or (old.status = 'pausado'   and new.status = 'ativo')
      ) then
        raise exception 'Alteração de estado não permitida (% → %)', old.status, new.status;
      end if;
    elsif new.status = 'ativo' and old.status is distinct from 'ativo' and old.status <> 'pausado' then
      new.approved_at := now();
      new.approved_by := auth.uid();
      new.rejection_reason := null;
    end if;
  end if;

  -- Ao enviar para aprovação, o anúncio tem de estar completo
  if new.status = 'pendente' and (tg_op = 'INSERT' or old.status is distinct from 'pendente') then
    if coalesce(trim(new.title),'') = '' then raise exception 'Falta o título'; end if;
    if new.spot_type is null then raise exception 'Falta o tipo de lugar'; end if;
    if coalesce(trim(new.zone),'') = '' then raise exception 'Falta a zona'; end if;
    if new.price_hour is null and new.price_day is null and new.price_month is null then
      raise exception 'Indique pelo menos um preço (hora, dia ou mês)';
    end if;
    if new.has_charger and (new.charger_type is null or new.charge_price_mode is null) then
      raise exception 'Complete os dados do carregador';
    end if;
    if tg_op = 'UPDATE' then
      if not exists (select 1 from parkncharge.listing_private p where p.listing_id = new.id) then
        raise exception 'Falta a morada';
      end if;
      if not exists (select 1 from parkncharge.listing_photos f where f.listing_id = new.id) then
        raise exception 'Adicione pelo menos uma fotografia';
      end if;
    else
      raise exception 'Guarde o anúncio antes de o enviar para aprovação';
    end if;
    new.submitted_at := now();
  end if;
  return new;
end;
$$;
create trigger listings_guard before insert or update on parkncharge.listings
  for each row execute function parkncharge.listings_guard();

-- Posição aproximada pública (~300 m) a partir da morada privada
create or replace function parkncharge.sync_approx_location()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  update parkncharge.listings
     set approx_lat = round((new.lat * 300)::numeric) / 300.0,
         approx_lng = round((new.lng * 250)::numeric) / 250.0
   where id = new.listing_id;
  return new;
end;
$$;
create trigger listing_private_sync before insert or update on parkncharge.listing_private
  for each row execute function parkncharge.sync_approx_location();

-- Máximo de 6 fotos por anúncio; a primeira passa a capa
create or replace function parkncharge.photos_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from parkncharge.listing_photos where listing_id = new.listing_id) >= 6 then
    raise exception 'Máximo de 6 fotografias por lugar';
  end if;
  return new;
end;
$$;
create or replace function parkncharge.photos_cover()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update parkncharge.listings l
     set cover_photo = (select f.storage_path from parkncharge.listing_photos f
                         where f.listing_id = l.id order by f.position, f.created_at limit 1)
   where l.id = coalesce(new.listing_id, old.listing_id);
  return null;
end;
$$;
create trigger photos_limit before insert on parkncharge.listing_photos
  for each row execute function parkncharge.photos_limit();
create trigger photos_cover after insert or update or delete on parkncharge.listing_photos
  for each row execute function parkncharge.photos_cover();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table parkncharge.listings         enable row level security;
alter table parkncharge.listing_private  enable row level security;
alter table parkncharge.listing_photos   enable row level security;
alter table parkncharge.listing_schedule enable row level security;

-- listings
create policy "público vê lugares ativos" on parkncharge.listings
  for select to anon, authenticated
  using (status = 'ativo' or host_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "anfitrião cria lugares" on parkncharge.listings
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "anfitrião ou admin edita" on parkncharge.listings
  for update to authenticated
  using (host_id = (select auth.uid()) or (select parkncharge.is_admin()))
  with check (host_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "anfitrião apaga os seus" on parkncharge.listings
  for delete to authenticated using (host_id = (select auth.uid()));

-- função auxiliar: o utilizador é dono do anúncio?
create or replace function parkncharge.owns_listing(lid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from parkncharge.listings l where l.id = lid and l.host_id = auth.uid()); $$;
revoke all on function parkncharge.owns_listing(uuid) from public;
grant execute on function parkncharge.owns_listing(uuid) to authenticated;

-- listing_private: só dono e admin
create policy "dono ou admin vê morada" on parkncharge.listing_private
  for select to authenticated
  using ((select parkncharge.owns_listing(listing_id)) or (select parkncharge.is_admin()));
create policy "dono grava morada" on parkncharge.listing_private
  for insert to authenticated with check ((select parkncharge.owns_listing(listing_id)));
create policy "dono altera morada" on parkncharge.listing_private
  for update to authenticated
  using ((select parkncharge.owns_listing(listing_id))) with check ((select parkncharge.owns_listing(listing_id)));

-- fotos e horário: visíveis se o anúncio for visível; escrita só pelo dono
create policy "fotos visíveis com o anúncio" on parkncharge.listing_photos
  for select to anon, authenticated
  using (exists (select 1 from parkncharge.listings l where l.id = listing_id));
create policy "dono gere fotos (insert)" on parkncharge.listing_photos
  for insert to authenticated with check ((select parkncharge.owns_listing(listing_id)));
create policy "dono gere fotos (update)" on parkncharge.listing_photos
  for update to authenticated using ((select parkncharge.owns_listing(listing_id)));
create policy "dono gere fotos (delete)" on parkncharge.listing_photos
  for delete to authenticated using ((select parkncharge.owns_listing(listing_id)));

create policy "horário visível com o anúncio" on parkncharge.listing_schedule
  for select to anon, authenticated
  using (exists (select 1 from parkncharge.listings l where l.id = listing_id));
create policy "dono gere horário (insert)" on parkncharge.listing_schedule
  for insert to authenticated with check ((select parkncharge.owns_listing(listing_id)));
create policy "dono gere horário (update)" on parkncharge.listing_schedule
  for update to authenticated using ((select parkncharge.owns_listing(listing_id)));
create policy "dono gere horário (delete)" on parkncharge.listing_schedule
  for delete to authenticated using ((select parkncharge.owns_listing(listing_id)));

-- Permissões de tabela (a RLS decide as linhas)
grant select on parkncharge.listings, parkncharge.listing_photos, parkncharge.listing_schedule to anon;
grant select, insert, update, delete on all tables in schema parkncharge to authenticated;
revoke delete on parkncharge.host_profiles from authenticated;

-- ------------------------------------------------------------
-- Storage: fotos dos lugares (leitura pública, escrita na pasta do próprio utilizador)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('parkncharge', 'parkncharge', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "parkncharge: upload na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'parkncharge' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "parkncharge: alterar na própria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'parkncharge' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "parkncharge: apagar na própria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'parkncharge' and (storage.foldername(name))[1] = (select auth.uid())::text);
