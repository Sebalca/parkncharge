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
  t('D28', 'localização por defeito: São Mamede de Infesta (fictícia) + botão GPS', await ev(() => state.locality === 'São Mamede de Infesta' && PNC.DEFAULT_LOC.locality === 'São Mamede de Infesta' && !state.gps));
  await ev(() => {
    const h24 = [0, 1, 2, 3, 4, 5, 6].map(w => ({ weekday: w, opens_at: '00:00:00', closes_at: '24:00:00' }));
    window.__l = [
      { id: '1', title: 'A', zone: 'São Mamede de Infesta', approx_lat: 41.195, approx_lng: -8.61, vehicle_types: ['carro'], has_charger: true, price_hour: 1, is_demo: true, listing_schedule: h24 },
      { id: '2', title: 'B', zone: 'São Mamede de Infesta', approx_lat: 41.192, approx_lng: -8.613, vehicle_types: ['carro'], price_hour: 1, demo_occupied: true, listing_schedule: h24 },
      { id: '3', title: 'C', zone: 'Boavista', approx_lat: 41.16, approx_lng: -8.64, vehicle_types: ['carro'], price_day: 5, listing_schedule: h24 },
      { id: '4', title: 'D', zone: 'Baixa', approx_lat: 41.146, approx_lng: -8.61, vehicle_types: ['carro'], price_day: 5, listing_schedule: [] },
    ];
    listings = window.__l; state.cat = 'todos'; state.where = ''; render();
  });
  t('D24', 'Explorar: mapa "Perto de si" + garagens da localidade (mesmo ocupadas) + carrosséis das outras zonas', await ev(() => {
    const c = document.querySelector('#content'), txt = c.innerText;
    return !!c.querySelector('#sec-map #map') && /Garagens em São Mamede de Infesta/.test(txt) && c.querySelectorAll('#sec-local .card').length === 2
      && /Ocupada/.test(c.querySelector('#sec-local').innerText) && c.querySelectorAll('.rail').length === 2 && /Lugares em Boavista/.test(txt)
      && c.querySelector('#sec-map').compareDocumentPosition(c.querySelector('#sec-local')) & Node.DOCUMENT_POSITION_FOLLOWING;
  }));
  t('D24', 'com pesquisa por texto: grelha de resultados', await ev(() => { state.where = 'Boavista'; render(); const ok = document.querySelectorAll('.grid-cards .card').length === 1; state.where = ''; render(); return ok; }));
  t('D24', 'categoria filtra todas as secções', await ev(() => { state.cat = 'carregador'; render(); const n = document.querySelectorAll('#content .card').length; state.cat = 'todos'; render(); return n === 1; }));
  t('D29', 'estado: Disponível (aberto e livre) / Ocupada (simulada) / Fechada (horário)', await ev(() => {
    const [a, b, , d] = window.__l;
    return PNC.availability(a).key === 'disponivel' && PNC.availability(b).key === 'ocupada' && PNC.availability(d).key === 'fechada'
      && PNC.openNow([{ weekday: 0, opens_at: '08:00', closes_at: '20:00' }], new Date(2026, 8, 28, 9)) && !PNC.openNow([{ weekday: 0, opens_at: '08:00', closes_at: '20:00' }], new Date(2026, 8, 28, 21));
  }));
  t('D50', 'garagens de exemplo com selo "Exemplo"', await ev(() => [...document.querySelectorAll('#sec-local .card')].filter(c => /Exemplo/.test(c.innerText)).length === 1));
  t('D50', 'só o admin cria exemplos ou ocupação simulada (regra no servidor)', /new\.is_demo := false; new\.demo_occupied := false;/.test(SQL) && /new\.is_demo := old\.is_demo;/.test(SQL));

  console.log('Menu da conta');
  await ev(() => document.querySelector('#acct-btn').click()); await p.waitForTimeout(100);
  t('D27', 'canto superior direito abre uma janela (não uma página)', new URL(p.url()).pathname === '/' && await ev(() => !document.querySelector('#acct-menu').classList.contains('hidden')));
  const bm = await p.locator('#acct-menu').boundingBox();
  await p.mouse.move(bm.x + 20, bm.y + 20); await p.mouse.down(); await p.mouse.move(bm.x + 20, bm.y + bm.height + 120); await p.mouse.up();
  t('D27', 'carregar dentro e largar fora não fecha', await ev(() => !document.querySelector('#acct-menu').classList.contains('hidden')));
  await p.mouse.click(10, 700);
  t('D27', 'clicar fora fecha', await ev(() => document.querySelector('#acct-menu').classList.contains('hidden')));
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
