-- Parkncharge v0.4a — contas de teste para o admin experimentar os dois lados ("Entrar como")
-- As contas são criadas pela Edge Function `parkncharge-entrar-como` (só aceita administradores).
-- Esta função só pode ser chamada com a chave de serviço (dentro da Edge Function), nunca pelo browser.

create table if not exists parkncharge.test_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  kind       text not null unique check (kind in ('condutor','anfitriao')),
  created_at timestamptz not null default now()
);
alter table parkncharge.test_accounts enable row level security;
create policy test_accounts_admin_le on parkncharge.test_accounts for select to authenticated using (parkncharge.is_admin());
grant select on parkncharge.test_accounts to authenticated;

create or replace function parkncharge.setup_test_account(p_user uuid, p_kind text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_kind not in ('condutor','anfitriao') then raise exception 'Tipo de conta de teste inválido'; end if;
  insert into parkncharge.test_accounts(user_id, kind) values (p_user, p_kind) on conflict (user_id) do nothing;
  update public.profiles set nome = case p_kind when 'condutor' then 'Condutor Teste' else 'Anfitrião Teste' end
   where id = p_user and nome is distinct from case p_kind when 'condutor' then 'Condutor Teste' else 'Anfitrião Teste' end;

  if p_kind = 'anfitriao' then
    insert into parkncharge.host_profiles(user_id, host_type) values (p_user, 'particular') on conflict do nothing;
    -- só na primeira vez: passa metade dos exemplos (lugares e carros) e as reservas deles para esta conta
    if not exists (select 1 from parkncharge.listings where host_id = p_user)
       and not exists (select 1 from parkncharge.cars where host_id = p_user) then
      alter table parkncharge.listings disable trigger listings_guard;
      alter table parkncharge.cars     disable trigger cars_guard;
      alter table parkncharge.bookings disable trigger bookings_guard;
      update parkncharge.listings l set host_id = p_user
        from (select id, row_number() over (order by created_at, id) n from parkncharge.listings where is_demo) x
       where l.id = x.id and x.n % 2 = 1;
      update parkncharge.cars c set host_id = p_user
        from (select id, row_number() over (order by created_at, id) n from parkncharge.cars where is_demo) x
       where c.id = x.id and x.n % 2 = 1;
      update parkncharge.bookings b set host_id = p_user
       where b.is_demo and (b.listing_id in (select id from parkncharge.listings where host_id = p_user)
                         or b.car_id in (select id from parkncharge.cars where host_id = p_user));
      alter table parkncharge.listings enable trigger listings_guard;
      alter table parkncharge.cars     enable trigger cars_guard;
      alter table parkncharge.bookings enable trigger bookings_guard;
    end if;
  end if;
end;
$$;
revoke execute on function parkncharge.setup_test_account(uuid, text) from public, anon, authenticated;
grant usage on schema parkncharge to service_role;
grant execute on function parkncharge.setup_test_account(uuid, text) to service_role;
