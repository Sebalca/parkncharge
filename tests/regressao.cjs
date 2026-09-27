/* Testes de regressão — confirmam que as decisões do PATCH NOTES.md (secção "Decisões fixas") continuam a valer.
   Correr antes de cada push:  NODE_PATH=$(npm root -g) node tests/regressao.cjs
   Precisa do Playwright (global). Não usa a base de dados real: os scripts do Supabase/auth são bloqueados,
   por isso as páginas correm "sem sessão". As regras do servidor são verificadas no ficheiro SQL das migrações. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
let ok = 0; const falhas = [];
const t = (id, nome, cond, info) => {
  if (cond) { ok++; console.log(`  ✓ ${id} ${nome}`); }
  else { falhas.push(`${id} ${nome}`); console.log(`  ✗ ${id} ${nome}${info !== undefined ? ' → ' + JSON.stringify(info) : ''}`); }
};
const ler = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PAGINAS = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const CODIGO = PAGINAS.map(ler).join('\n') + ler('assets/app.js');
const SQL = fs.readdirSync(path.join(ROOT, 'supabase/migrations')).map(f => ler('supabase/migrations/' + f)).join('\n');
const CSS = ler('assets/style.css');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const U = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  const erros = [];
  p.on('pageerror', e => erros.push(`${p.url()}: ${e.message}`));
  await p.route(/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com|openstreetmap/, r => r.abort()); // sem sessão nem rede
  const ev = (f, a) => p.evaluate(f, a);

  console.log('Geral');
  t('D01', 'todas as páginas em português (lang="pt-PT")', PAGINAS.every(f => /<html lang="pt-PT">/.test(ler(f))), PAGINAS.filter(f => !/<html lang="pt-PT">/.test(ler(f))));
  t('D02', 'login partilhado: todas as páginas com Supabase usam o auth.js do plataforma-core; nenhum createClient próprio',
    PAGINAS.filter(f => /supabase-js/.test(ler(f))).every(f => /plataforma-core@main\/auth\.js/.test(ler(f))) && !/createClient\(/.test(CODIGO));
  t('D02', 'login com email + Google, sem outros fornecedores', /signInWithGoogle/.test(ler('login.html')) && /id="email"/.test(ler('login.html')) && !/facebook|apple|github/i.test(ler('login.html')));
  t('D03', 'sem ecrã de arranque (splash)', !/class="splash"|Brevemente no Porto/.test(CODIGO));
  t('D04', 'cores do Figma no design system', ['#436E91', '#F3E9B5', '#E95322'].every(c => CSS.includes(c)) && /Josefin Sans/.test(CSS) && /Lato/.test(CSS));
  t('D10', 'sem pagamentos na plataforma antes da v1.1 (sem Stripe)', !/stripe/i.test(CODIGO));
  t('D11', 'dados no schema próprio "parkncharge"', /create schema if not exists parkncharge/.test(SQL) && /schema\('parkncharge'\)/.test(ler('assets/app.js')));
  t('S01', 'nenhuma chave privada no código', !/service_role|sb_secret_|SUPABASE_SERVICE/i.test(CODIGO + SQL));

  console.log('Explorar');
  await p.goto(U + '/'); await p.waitForTimeout(400);
  t('D20', 'Explorar abre sem conta (não redireciona para o login)', new URL(p.url()).pathname === '/');
  t('D21', 'barra inferior: Explorar, Favoritos, Reservas, Mensagens, Perfil',
    JSON.stringify(await ev(() => [...document.querySelectorAll('.nav a span')].map(s => s.textContent))) === JSON.stringify(['Explorar', 'Favoritos', 'Reservas', 'Mensagens', 'Perfil']));
  t('D22', 'pesquisa Onde · Quando (início e fim) · Veículo', await ev(() => !!(document.querySelector('#where') && document.querySelector('#start') && document.querySelector('#end')) && document.querySelectorAll('#veh .chip').length === 6
    && [...document.querySelectorAll('.sb-fields b')].map(x => x.textContent).join('|') === 'Onde|Quando|Veículo'));
  const cats = await ev(() => [...document.querySelectorAll('.cat span')].map(s => s.textContent));
  t('D23', 'carregador é categoria, sem separador "Carregar" próprio', cats[0] === 'Todos' && cats.includes('Com carregador') && !(await ev(() => [...document.querySelectorAll('button,a')].some(x => x.textContent.trim() === 'Carregar'))), cats);
  await ev(() => { window.__l = [{ id: '1', title: 'A', zone: 'Boavista', vehicle_types: ['carro'], has_charger: true, price_hour: 1 }, { id: '2', title: 'B', zone: 'Baixa', vehicle_types: ['carro'], price_day: 5 }]; });
  t('D24', 'sem pesquisa: carrosséis por zona', await ev(() => { listings = window.__l; state.cat = 'todos'; render(); return document.querySelectorAll('.rail').length === 2 && /Lugares em Boavista/.test(document.querySelector('#content').innerText); }));
  t('D24', 'com categoria: grelha filtrada', await ev(() => { state.cat = 'carregador'; render(); return document.querySelectorAll('.grid-cards .card').length === 1; }));
  const V = ler('assets/app.js').match(/APP_VERSAO = 'v([^']+)'/)[1];
  t('D26', 'app.js e style.css carregados com ?v= da versão atual (evita cache antiga)', PAGINAS.every(f => (ler(f).match(/assets\/(app\.js|style\.css)(\?v=[^"]*)?"/g) || []).every(x => x.includes('?v=' + V + '"'))),
    PAGINAS.filter(f => (ler(f).match(/assets\/(app\.js|style\.css)(\?v=[^"]*)?"/g) || []).some(x => !x.includes('?v=' + V + '"'))));
  t('D25', 'versão visível no rodapé', await ev(() => document.querySelector('#app-versao')?.textContent === PNC.APP_VERSAO && /^v\d+\.\d+[a-z]?$/.test(PNC.APP_VERSAO)));

  console.log('Anfitrião');
  t('D30', 'modo anfitrião: Hoje, Calendário, Lugares, Mensagens, Menu', await ev(() => {
    document.querySelectorAll('.nav').forEach(n => n.remove()); PNC.renderChrome({ host: true, header: false, footer: false });
    return [...document.querySelectorAll('.nav a span')].map(s => s.textContent).join('|') === 'Hoje|Calendário|Lugares|Mensagens|Menu';
  }));
  t('D30', 'perfil tem "Mudar para anfitrião" e "Mudar para condutor"', /Mudar para anfitrião/.test(ler('perfil.html')) && /Mudar para condutor/.test(ler('perfil.html')));
  t('D31', 'aprovação manual: anfitrião não se auto-aprova (trigger limita as transições)',
    /Alteração de estado não permitida/.test(SQL) && /old\.status in \('rascunho','recusado'\) and new\.status = 'pendente'/.test(SQL) && !/'pendente'\s+and new\.status = 'ativo'/.test(SQL.split('listings_guard')[1] || ''));
  t('D31', 'página de aprovação só para administradores', /isAdmin\(\)/.test(ler('admin.html')) && /só para administradores/.test(ler('admin.html')));
  t('D32', 'empresa: nome obrigatório, NIF opcional com 9 algarismos', /empresa_tem_nome/.test(SQL) && /nif is null or nif ~ '\^\[0-9\]\{9\}\$'/.test(SQL) && /\/\^\\d\{9\}\$\//.test(ler('anfitriao.html')));
  t('D33', '1 a 6 fotografias, a primeira é a capa', /Máximo de 6 fotografias/.test(SQL) && /Adicione pelo menos uma fotografia/.test(SQL) && /order by f\.position/.test(SQL) && /photos\.length < 6/.test(ler('publicar.html')));
  t('D34', 'morada exata privada (sem acesso anónimo) e posição pública aproximada',
    /create table parkncharge\.listing_private/.test(SQL) && !/grant select on[^;]*listing_private[^;]*to anon/.test(SQL) && /round\(\(new\.lat \* 300\)/.test(SQL)
    && !/listing_private/.test(ler('index.html')));
  t('D35', 'sem serviços Clean Up / Workshop antes da v1.0', !/clean ?up|workshop|lavagem|oficina/i.test(CODIGO.replace(/<footer[\s\S]*?<\/footer>/g, '')));
  t('D36', 'recusa sempre com motivo visível ao anfitrião', /Motivo \(o anfitrião vai ver/.test(ler('admin.html')) && /if \(!reason \|\| !reason\.trim\(\)\) return/.test(ler('admin.html')) && /rejection_reason/.test(ler('anfitriao.html')));
  t('D09', 'preços à hora, ao dia e ao mês + reserva instantânea ou com aprovação', ['id="ph"', 'id="pd"', 'id="pm"', 'id="book"', 'Reserva instantânea', 'Aprovo cada pedido'].every(x => ler('publicar.html').includes(x)));

  console.log('Páginas');
  for (const f of PAGINAS) { await p.goto(`${U}/${f}`); await p.waitForTimeout(150); }
  t('P01', 'todas as páginas abrem sem erros de JavaScript', !erros.length, erros);

  await b.close(); srv.close();
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`);
  if (falhas.length) { console.log('Falhas:\n - ' + falhas.join('\n - ')); process.exit(1); }
})();
