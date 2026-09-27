-- Parkncharge v0.2b — dados de exemplo e ocupação simulada (até às reservas da v0.4)
-- is_demo: anúncio de exemplo (selo "Exemplo" no site; apagar todos antes da beta:
--          delete from parkncharge.listings where is_demo;)
-- demo_occupied: ocupação simulada, só usada enquanto não há reservas reais.
-- Só o admin pode ligar estes campos (regra no trigger listings_guard).

alter table parkncharge.listings
  add column if not exists is_demo boolean not null default false,
  add column if not exists demo_occupied boolean not null default false;

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
      new.is_demo := false; new.demo_occupied := false;   -- só o admin cria exemplos
    end if;
  else
    new.host_id := old.host_id;                       -- dono nunca muda
    if not admin then
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
      new.rejection_reason := old.rejection_reason;
      new.is_demo := old.is_demo;
      new.demo_occupied := old.demo_occupied;
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
