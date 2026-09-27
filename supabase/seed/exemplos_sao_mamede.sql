-- Parkncharge — garagens de EXEMPLO (São Mamede de Infesta e arredores)
-- Dados fictícios: moradas sem número de porta, fotografias ilustrativas (assets/demo/*.svg).
-- Ficam na conta do administrador, marcadas com is_demo = true (selo "Exemplo" no site).
-- Apagar todas antes da beta:  delete from parkncharge.listings where is_demo;
-- Correr no editor SQL do Supabase (projeto "Sites"). Pode correr-se de novo: apaga e recria os exemplos.

do $seed$
declare
  admin_id uuid := (select id from public.profiles where is_admin order by created_at limit 1);
  r record;
  lid uuid;
begin
  if admin_id is null then raise exception 'Não há administrador em public.profiles'; end if;
  -- age como o admin, para o trigger aceitar anúncios já ativos e com is_demo
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);

  delete from parkncharge.listings where is_demo;
  insert into parkncharge.host_profiles (user_id, host_type) values (admin_id, 'particular') on conflict (user_id) do nothing;

  for r in select * from (values
    -- título, tipo, zona, lat, lng, morada, foto, veículos, coberto, subterr., fechado, só seu, acesso fácil, carregador, tipo carg., kW, modo, €/kWh, €/h, €/dia, €/mês, instantânea, ocupada, horário, descrição
    ('Garagem fechada com carregador', 'garagem', 'São Mamede de Infesta', 41.19510, -8.60980, 'Rua Óscar da Silva (exemplo)', 'assets/demo/carregador.svg', '{carro}'::text[], true, false, true, true, true, true, 'tipo2', 7.4, 'incluido', null::numeric, 1.50, 9.00, 70.00, true, false, '24h', 'Garagem individual com wallbox de 7,4 kW. Energia incluída no preço.'),
    ('Lugar coberto em condomínio', 'lugar_coberto', 'São Mamede de Infesta', 41.19220, -8.61350, 'Rua Alfredo Cunha (exemplo)', 'assets/demo/coberto.svg', '{carro}', true, true, false, false, false, false, null, null, null, null, 1.00, 6.00, 45.00, false, true, 'uteis+sab', 'Lugar marcado na cave de um prédio, portão com comando.'),
    ('Box perto do Parque de Real', 'box', 'São Mamede de Infesta', 41.19730, -8.61620, 'Rua de Real (exemplo)', 'assets/demo/box.svg', '{carro,moto}', true, false, true, true, true, false, null, null, null, null, null, 7.00, 60.00, true, false, '24h', 'Box fechada com arrumação ao fundo.'),
    ('Logradouro para carrinha ou autocaravana', 'lugar_descoberto', 'São Mamede de Infesta', 41.18980, -8.60540, 'Rua do Godinho (exemplo)', 'assets/demo/descoberto.svg', '{carro,carrinha,autocaravana}', false, false, true, true, true, false, null, null, null, null, null, 8.00, 50.00, false, false, '8-20', 'Espaço amplo em terreno vedado, entrada larga.'),
    ('Parque de empresa (noites e fins de semana)', 'parque', 'São Mamede de Infesta', 41.19330, -8.61940, 'Rua Tomás Ribeiro (exemplo)', 'assets/demo/parque.svg', '{carro,carrinha}', false, false, false, false, true, false, null, null, null, null, 0.80, 5.00, null, true, false, 'noites', 'Lugares livres fora do horário de expediente.'),
    ('Garagem com carregador rápido', 'garagem', 'São Mamede de Infesta', 41.19060, -8.61610, 'Rua Afonso Baldaia (exemplo)', 'assets/demo/garagem.svg', '{carro}', true, false, true, true, true, true, 'ccs', 50, 'a_parte', 0.35, 3.00, 15.00, null, true, true, '24h', 'Carregador CCS de 50 kW, pago à parte por kWh.'),
    ('Lugar para mota', 'lugar_coberto', 'São Mamede de Infesta', 41.19640, -8.60730, 'Travessa da Estação (exemplo)', 'assets/demo/mota.svg', '{moto}', true, false, false, false, true, false, null, null, null, null, 0.50, 3.00, 15.00, true, false, '24h', 'Espaço coberto para uma mota, junto à entrada.'),
    ('Lugar coberto junto ao metro', 'lugar_coberto', 'Senhora da Hora', 41.18780, -8.64520, 'Rua de Recarei (exemplo)', 'assets/demo/coberto.svg', '{carro}', true, true, false, false, true, false, null, null, null, null, 1.20, 7.00, 50.00, true, false, '24h', 'A 3 minutos da estação de metro.'),
    ('Garagem em Custóias', 'garagem', 'Custóias', 41.20450, -8.64020, 'Rua de Custóias (exemplo)', 'assets/demo/garagem.svg', '{carro,carrinha}', true, false, true, true, false, false, null, null, null, null, null, null, 55.00, false, false, '24h', 'Só arrendamento mensal.'),
    ('Box com tomada perto do Hospital São João', 'box', 'Paranhos', 41.18230, -8.60050, 'Rua da Asprela (exemplo)', 'assets/demo/box.svg', '{carro}', true, true, true, true, true, true, 'schuko', 2.3, 'incluido', null, 1.80, 10.00, 80.00, true, false, '24h', 'Tomada doméstica para carregamento lento durante a noite.'),
    ('Terreno vedado em Leça do Balio', 'lugar_descoberto', 'Leça do Balio', 41.21390, -8.62430, 'Rua do Mosteiro (exemplo)', 'assets/demo/descoberto.svg', '{carro,carrinha,autocaravana,camiao}', false, false, true, false, true, false, null, null, null, null, null, 5.00, 35.00, false, false, '24h', 'Vários lugares num terreno vedado.'),
    ('Garagem com wallbox em Matosinhos', 'garagem', 'Matosinhos', 41.18300, -8.69050, 'Rua Brito Capelo (exemplo)', 'assets/demo/carregador.svg', '{carro}', true, false, true, true, true, true, 'tipo2', 11, 'a_parte', 0.28, 2.00, 12.00, null, true, false, 'uteis', 'Wallbox de 11 kW, disponível em dias úteis.')
  ) as t(title, spot_type, zone, lat, lng, address, photo, vehicles, covered, underground, closed, solo, easy, charger, ctype, kw, cmode, kwh, ph, pd, pm, instant, occupied, sched, descr)
  loop
    insert into parkncharge.listings (host_id, status, is_demo, demo_occupied, title, description, spot_type, zone, vehicle_types,
        is_covered, is_underground, is_closed, is_solo, easy_entry, has_charger, charger_type, charger_kw, charge_price_mode, charge_price_kwh,
        price_hour, price_day, price_month, instant_book, approved_at, approved_by)
    values (admin_id, 'ativo', true, r.occupied, r.title, r.descr, r.spot_type, r.zone, r.vehicles,
        r.covered, r.underground, r.closed, r.solo, r.easy, r.charger, r.ctype, r.kw, r.cmode, r.kwh,
        r.ph, r.pd, r.pm, r.instant, now(), admin_id)
    returning id into lid;

    insert into parkncharge.listing_private (listing_id, address, lat, lng, access_instructions)
    values (lid, r.address, r.lat, r.lng, 'Exemplo: instruções de acesso enviadas após a reserva.');

    insert into parkncharge.listing_photos (listing_id, storage_path, position) values (lid, r.photo, 0);

    -- horário (0 = segunda … 6 = domingo)
    insert into parkncharge.listing_schedule (listing_id, weekday, opens_at, closes_at)
    select lid, d, o, c from (
      select d, '00:00'::time o, '24:00'::time c from generate_series(0,6) d where r.sched = '24h'
      union all select d, '08:00', '20:00' from generate_series(0,6) d where r.sched = '8-20'
      union all select d, '07:00', '21:00' from generate_series(0,5) d where r.sched = 'uteis+sab'
      union all select d, '08:00', '19:00' from generate_series(0,4) d where r.sched = 'uteis'
      union all select d, '19:00', '24:00' from generate_series(0,4) d where r.sched = 'noites'
      union all select d, '00:00', '24:00' from generate_series(5,6) d where r.sched = 'noites'
    ) s;
  end loop;
end
$seed$;
