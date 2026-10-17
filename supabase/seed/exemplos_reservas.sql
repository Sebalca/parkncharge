-- Parkncharge — reservas de EXEMPLO (substituem a ocupação simulada demo_occupied)
-- Correr DEPOIS dos outros exemplos. Datas relativas ao momento em que se corre.
-- Condutores com nomes inventados; tudo com is_demo = true. Apagar antes da beta:
--   delete from parkncharge.bookings where is_demo;
do $seed$
declare
  admin uuid := (select id from public.profiles where is_admin order by created_at limit 1);
  t0 timestamptz := date_trunc('day', now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon';
  r record;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  for r in select * from (values
    ('l', 'Lugar coberto em condomínio',    now() - interval '2 hours', now() + interval '3 days',  'confirmada', 'Ana R.',   'Renault Clio · AA-00-AA', null, 18.00),
    ('l', 'Garagem com carregador rápido',  now() - interval '1 hour',  now() + interval '5 hours', 'confirmada', 'Miguel S.','Tesla Model Y', 'Vou carregar durante a tarde.', 18.00),
    ('c', 'Renault Kangoo',                 now() - interval '3 hours', now() + interval '1 day',   'confirmada', 'Rui C.',   null, 'Para uma mudança.', 45.00),
    ('l', 'Garagem fechada com carregador', t0 + interval '1 day 9 hours',  t0 + interval '1 day 18 hours', 'confirmada', 'Joana P.', 'Nissan Leaf', null, 13.50),
    ('l', 'Box perto do Parque de Real',    t0 + interval '2 days',         t0 + interval '5 days',          'confirmada', 'Tiago F.', 'Peugeot 208', null, 21.00),
    ('c', 'Tesla Model 3',                  t0 + interval '3 days 10 hours',t0 + interval '4 days 10 hours', 'confirmada', 'Marta L.', null, 'Viagem a Braga.', 75.00),
    ('l', 'Lugar coberto em condomínio',    t0 + interval '4 days 8 hours', t0 + interval '4 days 12 hours', 'pedido',     'Pedro A.', 'VW Golf', 'Preciso só da manhã.', 4.00),
    ('c', 'Peugeot 5008',                   t0 + interval '6 days 9 hours', t0 + interval '8 days 18 hours', 'pedido',     'Sofia G.', null, 'Fim de semana em família, com cadeira de bebé.', 174.00),
    ('l', 'Garagem fechada com carregador', now() - interval '6 days',      now() - interval '5 days',       'confirmada', 'Nuno B.',  'BMW i3', null, 9.00),
    ('c', 'Toyota Corolla',                 now() - interval '10 days',     now() - interval '8 days',       'confirmada', 'Carla V.', null, null, 84.00)
  ) as t(k, title, s, e, st, who, note, msg, price)
  loop
    insert into parkncharge.bookings (listing_id, car_id, driver_id, driver_name, starts_at, ends_at, status, vehicle_note, message,
                                      total_price, price_label, expires_at, decided_at, is_demo)
    values (
      case when r.k = 'l' then (select id from parkncharge.listings where is_demo and title like r.title || '%' limit 1) end,
      case when r.k = 'c' then (select id from parkncharge.cars where is_demo and title like r.title || '%' limit 1) end,
      admin, r.who, r.s, r.e, r.st, r.note, r.msg, r.price, 'Exemplo',
      case when r.st = 'pedido' then now() + interval '20 hours' end,
      case when r.st = 'confirmada' then now() end, true);
  end loop;
  update parkncharge.listings set demo_occupied = false where demo_occupied;
  update parkncharge.cars set demo_occupied = false where demo_occupied;
end $seed$;
