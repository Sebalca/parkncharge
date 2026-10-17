-- Parkncharge v0.4 — as funções dos triggers deixam de estar expostas na API (não servem para ser chamadas diretamente).
-- Os triggers continuam a funcionar: o PostgreSQL só verifica a permissão EXECUTE ao criar o trigger.
do $r$
declare f record;
begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'parkncharge' and p.prorettype = 'trigger'::regtype loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $r$;
