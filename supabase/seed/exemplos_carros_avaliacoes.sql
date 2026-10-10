-- Parkncharge — carros e avaliações de EXEMPLO (São Mamede de Infesta e arredores)
-- Dados fictícios: locais de recolha sem número de porta, ilustrações (assets/demo/carro-*.svg),
-- avaliações com nomes inventados. Tudo marcado com is_demo = true (selo "Exemplo" no site).
-- Correr DEPOIS de exemplos_sao_mamede.sql. Pode correr-se de novo: apaga e recria.
-- Apagar antes da beta:
--   delete from parkncharge.cars where is_demo;
--   delete from parkncharge.reviews where is_demo;

do $seed$
declare
  admin_id uuid := (select id from public.profiles where is_admin order by created_at limit 1);
  r record; cid uuid; it record; i int; n int;
  nomes text[] := array['Ana R.','Miguel S.','Joana P.','Rui C.','Inês M.','Tiago F.','Marta L.','Pedro A.','Sofia G.','Nuno B.','Carla V.','André T.'];
  bons text[] := array[
    'Muito prático, exatamente como descrito.',
    'Anfitrião simpático e tudo correu bem.',
    'Fácil de encontrar e de usar. Voltarei a usar.',
    'Ótima relação qualidade-preço.',
    'Limpo e bem localizado.',
    'Sem complicações, recomendo.'];
  medios text[] := array[
    'Bom, mas a entrada é um pouco apertada.',
    'Cumpre, embora tenha demorado a encontrar.',
    'Razoável para o preço.'];
begin
  if admin_id is null then raise exception 'Não há administrador em public.profiles'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);

  delete from parkncharge.reviews where is_demo;
  delete from parkncharge.cars where is_demo;

  -- ---------------- Carros ----------------
  for r in select * from (values
    -- título, marca, modelo, ano, categoria, combustível, caixa, lugares, portas, autonomia, extras, km/dia, idade mín., caução, zona, lat, lng, local, foto, €/h, €/dia, €/mês, instantânea, ocupado, horário, descrição
    ('Renault Clio para a cidade', 'Renault', 'Clio', 2021, 'citadino', 'gasolina', 'manual', 5, 5, null::smallint, '{ac,bluetooth}'::text[], 200, 21, 200.00, 'São Mamede de Infesta', 41.19450, -8.61210, 'Rua Óscar da Silva (exemplo)', 'assets/demo/carro-citadino.svg', 6.00, 32.00, 550.00, true, false, '8-22', 'Pequeno, económico e fácil de estacionar.'),
    ('Tesla Model 3 elétrico', 'Tesla', 'Model 3', 2022, 'familiar', 'eletrico', 'automatica', 5, 4, 480, '{ac,gps,bluetooth,camara_marcha_atras,cruise_control}', 300, 25, 500.00, 'São Mamede de Infesta', 41.19180, -8.60870, 'Rua Alfredo Cunha (exemplo)', 'assets/demo/carro-eletrico.svg', 14.00, 75.00, null, true, false, '24h', 'Entregue com 80% de bateria. Carregamento incluído até 300 km.'),
    ('Peugeot 5008 com 7 lugares', 'Peugeot', '5008', 2020, 'monovolume', 'gasoleo', 'automatica', 7, 5, null, '{ac,gps,bluetooth,cadeira_bebe,engate}', 250, 23, 400.00, 'São Mamede de Infesta', 41.19700, -8.61450, 'Rua de Real (exemplo)', 'assets/demo/carro-suv.svg', null, 58.00, 950.00, false, false, '8-20', 'Ideal para famílias. Cadeira de bebé disponível.'),
    ('Renault Kangoo para mudanças', 'Renault', 'Kangoo', 2019, 'carrinha', 'gasoleo', 'manual', 2, 4, null, '{engate,bluetooth}', 150, 23, 300.00, 'São Mamede de Infesta', 41.18950, -8.60620, 'Rua do Godinho (exemplo)', 'assets/demo/carro-carrinha.svg', 9.00, 45.00, null, true, true, '8-20', 'Carrinha de carga, 3,6 m³. Bom para pequenas mudanças.'),
    ('Toyota Corolla híbrido', 'Toyota', 'Corolla', 2022, 'familiar', 'hibrido', 'automatica', 5, 5, null, '{ac,gps,bluetooth,camara_marcha_atras}', 250, 21, 300.00, 'São Mamede de Infesta', 41.19300, -8.61800, 'Rua Tomás Ribeiro (exemplo)', 'assets/demo/carro-familiar.svg', 8.00, 42.00, 700.00, true, false, '24h', 'Consumo baixo, ótimo para viagens.'),
    ('Fiat 500 elétrico', 'Fiat', '500e', 2023, 'citadino', 'eletrico', 'automatica', 4, 3, 300, '{ac,bluetooth}', 200, 21, 250.00, 'São Mamede de Infesta', 41.19580, -8.60800, 'Travessa da Estação (exemplo)', 'assets/demo/carro-eletrico.svg', 7.00, 38.00, null, true, false, 'uteis', 'Citadino elétrico, só em dias úteis.'),
    ('VW Golf na Senhora da Hora', 'Volkswagen', 'Golf', 2020, 'familiar', 'gasolina', 'manual', 5, 5, null, '{ac,gps,bluetooth}', 250, 21, 300.00, 'Senhora da Hora', 41.18800, -8.64400, 'Rua de Recarei (exemplo)', 'assets/demo/carro-familiar.svg', 7.50, 40.00, 650.00, true, false, '24h', 'Junto ao metro da Senhora da Hora.'),
    ('Nissan Leaf em Paranhos', 'Nissan', 'Leaf', 2021, 'familiar', 'eletrico', 'automatica', 5, 5, 270, '{ac,gps,bluetooth}', 200, 21, 300.00, 'Paranhos', 41.18300, -8.60150, 'Rua da Asprela (exemplo)', 'assets/demo/carro-eletrico.svg', 8.00, 40.00, null, true, false, '24h', 'Perto do Hospital São João.'),
    ('SUV Dacia Duster em Custóias', 'Dacia', 'Duster', 2021, 'suv', 'gpl', 'manual', 5, 5, null, '{ac,engate}', 300, 23, 300.00, 'Custóias', 41.20400, -8.63900, 'Rua de Custóias (exemplo)', 'assets/demo/carro-suv.svg', null, 36.00, 600.00, false, false, '8-20', 'Bi-fuel GPL, económico em viagens longas.'),
    ('Mercedes Classe A em Matosinhos', 'Mercedes-Benz', 'Classe A', 2022, 'citadino', 'gasolina', 'automatica', 5, 5, null, '{ac,gps,bluetooth,camara_marcha_atras,teto_panoramico}', 200, 25, 600.00, 'Matosinhos', 41.18350, -8.68900, 'Rua Brito Capelo (exemplo)', 'assets/demo/carro-citadino.svg', 11.00, 60.00, null, true, false, 'uteis', 'Levantamento em dias úteis.')
  ) as t(title, brand, model, year, category, fuel, transmission, seats, doors, range_km, features, km_day, min_age, deposit, zone, lat, lng, address, photo, ph, pd, pm, instant, occupied, sched, descr)
  loop
    insert into parkncharge.cars (host_id, status, is_demo, demo_occupied, title, description, brand, model, year, category, fuel, transmission,
        seats, doors, range_km, features, km_included_day, min_age, deposit, zone, price_hour, price_day, price_month, instant_book, approved_at, approved_by)
    values (admin_id, 'ativo', true, r.occupied, r.title, r.descr, r.brand, r.model, r.year, r.category, r.fuel, r.transmission,
        r.seats, r.doors, r.range_km, r.features, r.km_day, r.min_age, r.deposit, r.zone, r.ph, r.pd, r.pm, r.instant, now(), admin_id)
    returning id into cid;
    insert into parkncharge.car_private (car_id, address, lat, lng, pickup_instructions)
      values (cid, r.address, r.lat, r.lng, 'Exemplo: local exato e chaves combinados após a reserva.');
    insert into parkncharge.car_photos (car_id, storage_path, position) values (cid, r.photo, 0);
    insert into parkncharge.car_schedule (car_id, weekday, opens_at, closes_at)
    select cid, d, o, c from (
      select d, '00:00'::time o, '24:00'::time c from generate_series(0,6) d where r.sched = '24h'
      union all select d, '08:00', '20:00' from generate_series(0,6) d where r.sched = '8-20'
      union all select d, '08:00', '22:00' from generate_series(0,6) d where r.sched = '8-22'
      union all select d, '08:00', '19:00' from generate_series(0,4) d where r.sched = 'uteis'
    ) s;
  end loop;

  -- ---------------- Avaliações de exemplo (2 a 4 por anúncio de exemplo) ----------------
  i := 0;
  for it in
    select id, 'listing' k from parkncharge.listings where is_demo
    union all select id, 'car' from parkncharge.cars where is_demo
    order by 2, 1
  loop
    n := 2 + (i % 3);
    for j in 1..n loop
      insert into parkncharge.reviews (listing_id, car_id, author_id, author_name, rating, comment, is_demo, created_at)
      values (
        case when it.k = 'listing' then it.id end,
        case when it.k = 'car' then it.id end,
        admin_id,
        nomes[1 + ((i * 3 + j) % array_length(nomes, 1))],
        case when (i + j) % 5 = 0 then 3 when (i + j) % 3 = 0 then 4 else 5 end,
        case when (i + j) % 5 = 0 then medios[1 + ((i + j) % array_length(medios, 1))]
             else bons[1 + ((i * 2 + j) % array_length(bons, 1))] end,
        true,
        now() - ((i * 7 + j * 11) % 60 || ' days')::interval
      );
    end loop;
    i := i + 1;
  end loop;
end
$seed$;
