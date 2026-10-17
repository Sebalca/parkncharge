-- Parkncharge v0.4a — todas as reservas são instantâneas (decisão de 17/10/2026, revê D09 e D71)
-- Deixa de haver pedidos: a reserva fica confirmada logo. O anfitrião só pode cancelar com motivo.
-- Os estados 'pedido', 'recusada' e 'expirada' ficam na tabela só para o histórico.

-- 1) anúncios: instant_book deixa de ter efeito; fica sempre true
alter table parkncharge.listings alter column instant_book set default true;
alter table parkncharge.cars     alter column instant_book set default true;
alter table parkncharge.listings disable trigger listings_guard;
alter table parkncharge.cars     disable trigger cars_guard;
update parkncharge.listings set instant_book = true where not instant_book;
update parkncharge.cars     set instant_book = true where not instant_book;
alter table parkncharge.listings enable trigger listings_guard;
alter table parkncharge.cars     enable trigger cars_guard;

-- 2) pedidos pendentes passam a confirmados (os vencidos a expirados)
alter table parkncharge.bookings disable trigger bookings_guard;
update parkncharge.bookings set status = 'expirada', updated_at = now()
 where status = 'pedido' and expires_at <= now();
update parkncharge.bookings set status = 'confirmada', decided_at = now(), expires_at = null, updated_at = now()
 where status = 'pedido';
alter table parkncharge.bookings enable trigger bookings_guard;

-- 3) regras: criar → sempre confirmada; já não há aceitar/recusar
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
      select l.host_id, l.status, l.price_hour ph, l.price_day pd, l.price_month pm into it
        from parkncharge.listings l where l.id = new.listing_id;
    else
      select c.host_id, c.status, c.price_hour ph, c.price_day pd, c.price_month pm into it
        from parkncharge.cars c where c.id = new.car_id;
    end if;
    if it.host_id is null then raise exception 'Anúncio não encontrado'; end if;
    new.host_id := it.host_id;
    if not (admin and new.is_demo and new.driver_name is not null) then   -- exemplos podem ter um nome fictício
      new.driver_name := coalesce(nullif(split_part(trim((select p.nome from public.profiles p where p.id = new.driver_id)), ' ', 1), ''), 'Condutor');
    end if;

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
      new.status := 'confirmada'; new.decided_at := now(); new.expires_at := null;
    elsif new.status not in ('confirmada','cancelada') then
      new.status := 'confirmada';
    end if;
    return new;
  end if;

  -- UPDATE: dados da reserva não mudam; só o estado, segundo as regras
  new.listing_id := old.listing_id; new.car_id := old.car_id; new.driver_id := old.driver_id; new.host_id := old.host_id;
  new.driver_name := old.driver_name; new.starts_at := old.starts_at; new.ends_at := old.ends_at;
  new.total_price := old.total_price; new.price_label := old.price_label; new.created_at := old.created_at;
  new.vehicle_note := old.vehicle_note; new.message := old.message; new.expires_at := old.expires_at;
  if not admin then new.is_demo := old.is_demo; end if;

  if new.status is distinct from old.status then
    if admin then
      if new.status = 'cancelada' then new.cancelled_by := coalesce(new.cancelled_by, 'admin'); end if;
    elsif me = old.host_id and old.status = 'confirmada' and new.status = 'cancelada' then
      if old.ends_at <= now() then raise exception 'Esta reserva já terminou'; end if;
      if coalesce(trim(new.cancel_reason), '') = '' then raise exception 'Indique o motivo do cancelamento'; end if;
      new.cancelled_by := 'anfitriao';
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
revoke execute on function parkncharge.bookings_guard() from public, anon, authenticated;
