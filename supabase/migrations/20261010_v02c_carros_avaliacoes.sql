-- Parkncharge v0.2c — aluguer de carros (mesma estrutura dos lugares) e avaliações
-- Carros: só o Explorar e a página do carro nesta versão; publicar carros fica para a próxima.
-- Avaliações: qualquer conta avalia (1 por anúncio), nunca os próprios anúncios; na v0.4 passa a exigir reserva concluída.

-- ============================================================
-- CARROS
-- ============================================================
create table parkncharge.cars (
  id               uuid primary key default gen_random_uuid(),
  host_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status           text not null default 'rascunho'
                   check (status in ('rascunho','pendente','ativo','recusado','pausado')),
  rejection_reason text,
  is_demo          boolean not null default false,
  demo_occupied    boolean not null default false,
  title            text check (char_length(title) <= 80),
  description      text check (char_length(description) <= 2000),
  brand            text check (char_length(brand) <= 40),
  model            text check (char_length(model) <= 60),
  year             smallint check (year is null or year between 1950 and 2100),
  category         text check (category in ('citadino','familiar','suv','carrinha','monovolume','desportivo')),
  fuel             text check (fuel in ('gasolina','gasoleo','hibrido','eletrico','gpl')),
  transmission     text check (transmission in ('manual','automatica')),
  seats            smallint check (seats is null or seats between 1 and 9),
  doors            smallint check (doors is null or doors between 2 and 5),
  range_km         smallint check (range_km is null or range_km > 0),   -- autonomia (elétricos)
  features         text[] not null default '{}'
                   check (features <@ array['ac','gps','bluetooth','cadeira_bebe','engate','teto_panoramico','camara_marcha_atras','cruise_control']),
  km_included_day  smallint check (km_included_day is null or km_included_day >= 0),
  min_age          smallint check (min_age is null or min_age between 18 and 30),
  deposit          numeric(8,2) check (deposit is null or deposit >= 0),
  zone             text,
  city             text not null default 'Porto',
  approx_lat       double precision,
  approx_lng       double precision,
  price_hour       numeric(8,2) check (price_hour  is null or price_hour  > 0),
  price_day        numeric(8,2) check (price_day   is null or price_day   > 0),
  price_month      numeric(8,2) check (price_month is null or price_month > 0),
  instant_book     boolean not null default false,
  cover_photo      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  approved_at      timestamptz,
  approved_by      uuid references auth.users(id)
);
create index cars_host_idx   on parkncharge.cars(host_id);
create index cars_status_idx on parkncharge.cars(status);

-- Dados privados: local exato de recolha, matrícula, instruções (só dono e admin)
create table parkncharge.car_private (
  car_id         uuid primary key references parkncharge.cars(id) on delete cascade,
  address        text not null,
  lat            double precision not null check (lat between -90 and 90),
  lng            double precision not null check (lng between -180 and 180),
  plate          text check (char_length(plate) <= 12),
  pickup_instructions text check (char_length(pickup_instructions) <= 1000),
  updated_at     timestamptz not null default now()
);

create table parkncharge.car_photos (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references parkncharge.cars(id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);
create index car_photos_car_idx on parkncharge.car_photos(car_id, position);

-- Horário em que se pode levantar/entregar o carro (0 = segunda … 6 = domingo)
create table parkncharge.car_schedule (
  car_id    uuid not null references parkncharge.cars(id) on delete cascade,
  weekday   smallint not null check (weekday between 0 and 6),
  opens_at  time not null,
  closes_at time not null,
  primary key (car_id, weekday),
  check (closes_at > opens_at)
);

-- Regras do servidor (iguais às dos lugares)
create or replace function parkncharge.cars_guard()
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
      new.is_demo := false; new.demo_occupied := false;
    end if;
  else
    new.host_id := old.host_id;
    if not admin then
      new.approved_at := old.approved_at; new.approved_by := old.approved_by;
      new.rejection_reason := old.rejection_reason;
      new.is_demo := old.is_demo; new.demo_occupied := old.demo_occupied;
      if new.status is distinct from old.status and not (
           (old.status in ('rascunho','recusado') and new.status = 'pendente')
        or (old.status = 'pendente' and new.status = 'rascunho')
        or (old.status = 'ativo'    and new.status = 'pausado')
        or (old.status = 'pausado'  and new.status = 'ativo')
      ) then
        raise exception 'Alteração de estado não permitida (% → %)', old.status, new.status;
      end if;
    elsif new.status = 'ativo' and old.status is distinct from 'ativo' and old.status <> 'pausado' then
      new.approved_at := now(); new.approved_by := auth.uid(); new.rejection_reason := null;
    end if;
  end if;

  if new.status = 'pendente' and (tg_op = 'INSERT' or old.status is distinct from 'pendente') then
    if coalesce(trim(new.title),'') = '' then raise exception 'Falta o título'; end if;
    if new.category is null or new.fuel is null or new.transmission is null or new.seats is null then
      raise exception 'Complete os dados do carro (categoria, combustível, caixa, lugares)';
    end if;
    if coalesce(trim(new.zone),'') = '' then raise exception 'Falta a zona'; end if;
    if new.price_hour is null and new.price_day is null and new.price_month is null then
      raise exception 'Indique pelo menos um preço (hora, dia ou mês)';
    end if;
    if tg_op = 'UPDATE' then
      if not exists (select 1 from parkncharge.car_private p where p.car_id = new.id) then raise exception 'Falta o local de recolha'; end if;
      if not exists (select 1 from parkncharge.car_photos f where f.car_id = new.id) then raise exception 'Adicione pelo menos uma fotografia'; end if;
    else
      raise exception 'Guarde o anúncio antes de o enviar para aprovação';
    end if;
    new.submitted_at := now();
  end if;
  return new;
end;
$$;
create trigger cars_guard before insert or update on parkncharge.cars
  for each row execute function parkncharge.cars_guard();

create or replace function parkncharge.sync_car_approx()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  update parkncharge.cars
     set approx_lat = round((new.lat * 300)::numeric) / 300.0,
         approx_lng = round((new.lng * 250)::numeric) / 250.0
   where id = new.car_id;
  return new;
end;
$$;
create trigger car_private_sync before insert or update on parkncharge.car_private
  for each row execute function parkncharge.sync_car_approx();

create or replace function parkncharge.car_photos_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from parkncharge.car_photos where car_id = new.car_id) >= 6 then
    raise exception 'Máximo de 6 fotografias por carro';
  end if;
  return new;
end;
$$;
create or replace function parkncharge.car_photos_cover()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update parkncharge.cars c
     set cover_photo = (select f.storage_path from parkncharge.car_photos f
                         where f.car_id = c.id order by f.position, f.created_at limit 1)
   where c.id = coalesce(new.car_id, old.car_id);
  return null;
end;
$$;
create trigger car_photos_limit before insert on parkncharge.car_photos
  for each row execute function parkncharge.car_photos_limit();
create trigger car_photos_cover after insert or update or delete on parkncharge.car_photos
  for each row execute function parkncharge.car_photos_cover();

create or replace function parkncharge.owns_car(cid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from parkncharge.cars c where c.id = cid and c.host_id = auth.uid()); $$;
revoke all on function parkncharge.owns_car(uuid) from public;
grant execute on function parkncharge.owns_car(uuid) to authenticated;

alter table parkncharge.cars         enable row level security;
alter table parkncharge.car_private  enable row level security;
alter table parkncharge.car_photos   enable row level security;
alter table parkncharge.car_schedule enable row level security;

create policy "público vê carros ativos" on parkncharge.cars
  for select to anon, authenticated
  using (status = 'ativo' or host_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "anfitrião cria carros" on parkncharge.cars
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "anfitrião ou admin edita carros" on parkncharge.cars
  for update to authenticated
  using (host_id = (select auth.uid()) or (select parkncharge.is_admin()))
  with check (host_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "anfitrião apaga os seus carros" on parkncharge.cars
  for delete to authenticated using (host_id = (select auth.uid()));

create policy "dono ou admin vê dados privados do carro" on parkncharge.car_private
  for select to authenticated using ((select parkncharge.owns_car(car_id)) or (select parkncharge.is_admin()));
create policy "dono grava dados privados do carro" on parkncharge.car_private
  for insert to authenticated with check ((select parkncharge.owns_car(car_id)));
create policy "dono altera dados privados do carro" on parkncharge.car_private
  for update to authenticated using ((select parkncharge.owns_car(car_id))) with check ((select parkncharge.owns_car(car_id)));

create policy "fotos do carro visíveis com o carro" on parkncharge.car_photos
  for select to anon, authenticated using (exists (select 1 from parkncharge.cars c where c.id = car_id));
create policy "dono gere fotos do carro (insert)" on parkncharge.car_photos
  for insert to authenticated with check ((select parkncharge.owns_car(car_id)));
create policy "dono gere fotos do carro (update)" on parkncharge.car_photos
  for update to authenticated using ((select parkncharge.owns_car(car_id)));
create policy "dono gere fotos do carro (delete)" on parkncharge.car_photos
  for delete to authenticated using ((select parkncharge.owns_car(car_id)));

create policy "horário do carro visível com o carro" on parkncharge.car_schedule
  for select to anon, authenticated using (exists (select 1 from parkncharge.cars c where c.id = car_id));
create policy "dono gere horário do carro (insert)" on parkncharge.car_schedule
  for insert to authenticated with check ((select parkncharge.owns_car(car_id)));
create policy "dono gere horário do carro (update)" on parkncharge.car_schedule
  for update to authenticated using ((select parkncharge.owns_car(car_id)));
create policy "dono gere horário do carro (delete)" on parkncharge.car_schedule
  for delete to authenticated using ((select parkncharge.owns_car(car_id)));

-- ============================================================
-- AVALIAÇÕES (lugares e carros)
-- ============================================================
create table parkncharge.reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references parkncharge.listings(id) on delete cascade,
  car_id      uuid references parkncharge.cars(id) on delete cascade,
  author_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text check (char_length(author_name) <= 40),   -- primeiro nome, copiado do perfil (o perfil não é público)
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 1000),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((listing_id is null) <> (car_id is null))
);
create index reviews_listing_idx on parkncharge.reviews(listing_id, created_at desc);
create index reviews_car_idx     on parkncharge.reviews(car_id, created_at desc);
-- uma avaliação por pessoa e anúncio (os exemplos não contam)
create unique index reviews_one_per_listing on parkncharge.reviews(listing_id, author_id) where not is_demo and listing_id is not null;
create unique index reviews_one_per_car     on parkncharge.reviews(car_id, author_id)     where not is_demo and car_id is not null;

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
  else
    new.author_id := old.author_id; new.listing_id := old.listing_id; new.car_id := old.car_id;
    new.created_at := old.created_at;
    if not admin then new.is_demo := old.is_demo; new.author_name := old.author_name; end if;
  end if;
  return new;
end;
$$;
create trigger reviews_guard before insert or update on parkncharge.reviews
  for each row execute function parkncharge.reviews_guard();

alter table parkncharge.reviews enable row level security;
create policy "avaliações são públicas" on parkncharge.reviews
  for select to anon, authenticated using (true);
create policy "conta avalia" on parkncharge.reviews
  for insert to authenticated with check (author_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "autor edita a sua avaliação" on parkncharge.reviews
  for update to authenticated
  using (author_id = (select auth.uid()) or (select parkncharge.is_admin()))
  with check (author_id = (select auth.uid()) or (select parkncharge.is_admin()));
create policy "autor ou admin apaga" on parkncharge.reviews
  for delete to authenticated using (author_id = (select auth.uid()) or (select parkncharge.is_admin()));

-- Permissões de tabela (a RLS decide as linhas)
grant select on parkncharge.cars, parkncharge.car_photos, parkncharge.car_schedule, parkncharge.reviews to anon;
grant select, insert, update, delete on parkncharge.cars, parkncharge.car_private, parkncharge.car_photos,
  parkncharge.car_schedule, parkncharge.reviews to authenticated;
