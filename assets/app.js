// Parkncharge — código comum
// Usa o auth.js partilhado (plataforma-core): window.Auth e window.plataforma.
(function () {
  // Versão atual — atualizar em cada alteração (ver PATCH NOTES.md)
  const APP_VERSAO = 'v0.5';

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.5 5 6.8 5c2 0 3.4 1.1 4.2 2.4C11.8 6.1 13.2 5 15.2 5c3.3 0 5.2 3.3 3.8 6.4C19 15.6 12 20 12 20z"/>',
    bookings: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M9 10h6M9 14h6M9 18h4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.3-2 3.2-3 5.5-3s4.2 1 5.5 3"/>',
    today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><circle cx="12" cy="15" r="1.5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h2M12 14h2M16 14h0M8 17h2M12 17h2"/>',
    garage: '<path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7M7 16h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    chev: '<path d="m9 5 7 7-7 7"/>',
    // categorias
    all: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    bolt: '<path d="M13 2 5 13h6l-1 9 8-11h-6z"/>',
    roof: '<path d="M2 10 12 4l10 6"/><path d="M5 9v11M19 9v11M8 20v-5h8v5"/>',
    under: '<path d="M3 6h18"/><path d="m8 10 4 4 4-4M12 14V8"/><path d="M5 18h14"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    easy: '<path d="M4 18h16"/><path d="M6 18V9l6-4 6 4v9"/><path d="m9 13 3-3 3 3"/>',
    month: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><text x="12" y="18" font-size="6" text-anchor="middle" stroke="none" fill="currentColor">30</text>',
    solo: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 17h6M9 7h6"/>',
    moto: '<circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path d="M6 16h5l3-6h3M14 10l-2-3H9"/>',
    van: '<path d="M2 16V7h12l4 4h3v5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    car: '<path d="M3 16v-3l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v3z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/><path d="M5 12h14"/>',
    parking: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 17V8h3a2.5 2.5 0 0 1 0 5h-3"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    seat: '<path d="M7 4v10h9l2 6"/><path d="M7 14l-1 6"/><path d="M7 9h6"/>',
    baby: '<circle cx="12" cy="7" r="3"/><path d="M7 21v-5a5 5 0 0 1 10 0v5"/>',
    hitch: '<path d="M4 12h10"/><circle cx="17" cy="12" r="3"/>',
    city: '<path d="M3 21V9l5-3v15M8 21V4h8v17M16 21v-9h5v9"/><path d="M11 8h2M11 12h2M11 16h2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h0"/>',
  };
  function icon(name, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  const LOGO = `<svg viewBox="0 0 240 150" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M58 8 L14 78 H44 L30 132 L84 56 H54 Z"/><rect x="62" y="34" width="150" height="72" rx="8"/><rect x="212" y="56" width="12" height="28" rx="3"/><path d="M92 94 L114 46 M112 94 L134 46 M140 94 L162 46 H200 V94 Z"/><circle cx="104" cy="118" r="14"/><circle cx="170" cy="118" r="14"/></svg>`;

  // ---------------- Navegação ----------------
  const GUEST_NAV = [
    ['search', 'Explorar', '/'],
    ['heart', 'Favoritos', '/favoritos.html'],
    ['bookings', 'Reservas', '/reservas.html'],
    ['chat', 'Mensagens', '/mensagens.html'],
    ['user', 'Perfil', '/perfil.html'],
  ];
  const HOST_NAV = [
    ['today', 'Hoje', '/anfitriao.html?v=hoje'],
    ['calendar', 'Calendário', '/anfitriao.html?v=calendario'],
    ['garage', 'Lugares', '/anfitriao.html'],
    ['chat', 'Mensagens', '/mensagens.html?modo=anfitriao'],
    ['menu', 'Menu', '/perfil.html?modo=anfitriao'],
  ];

  function renderChrome({ active, host = false, header = true, footer = true } = {}) {
    // Cabeçalho (visível em ecrãs largos; no telemóvel manda a barra inferior)
    if (header) {
      const h = document.createElement('header');
      h.className = 'site-header';
      h.innerHTML = `
        <a class="brand" href="${host ? '/anfitriao.html' : '/'}">${LOGO}<span>parkncharge</span></a>
        <nav class="header-links">
          ${host
            ? '<a href="/">Mudar para condutor</a>'
            : ''}
          <button class="hdr-profile" id="acct-btn" type="button" aria-label="Menu da conta" aria-haspopup="true" aria-expanded="false">${icon('menu')}<span class="hdr-avatar" id="acct-avatar">${icon('user')}</span></button>
        </nav>
        <div class="acct-menu hidden" id="acct-menu" role="menu"></div>`;
      document.body.prepend(h);
      setupAccountMenu(host);
    }
    // Barra inferior
    const items = host ? HOST_NAV : GUEST_NAV;
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', 'Navegação principal');
    nav.innerHTML = '<div class="nav-inner">' + items.map(([k, label, href]) =>
      `<a href="${href}" class="${label === active ? 'active' : ''}">${icon(k)}<span>${label}</span></a>`
    ).join('') + '</div>';
    document.body.appendChild(nav);
    unreadBadge(host);
    // Rodapé
    if (footer) {
      const f = document.createElement('footer');
      f.className = 'site-footer';
      f.innerHTML = `
        <div class="foot-cols">
          <div><h4>Apoio</h4><a href="/ajuda.html">Centro de ajuda</a><a href="/ajuda.html#cancelamentos">Cancelamentos</a><a href="/ajuda.html#seguranca">Segurança</a><a href="mailto:ola@frisk.pt">Contacto</a></div>
          <div><h4>Anfitriões</h4><a href="/anfitriao.html">Arrendar o meu lugar</a><a href="/ajuda.html#anfitrioes">Como funciona</a><a href="/ajuda.html#carregadores">Lugares com carregador</a></div>
          <div><h4>Parkncharge</h4><a href="/ajuda.html#sobre">Sobre</a><a href="/termos.html">Termos</a><a href="/privacidade.html">Privacidade</a></div>
        </div>
        <p class="foot-legal">© ${new Date().getFullYear()} Parkncharge · parte da plataforma frisk.pt · Porto, Portugal · <span id="app-versao">${APP_VERSAO}</span></p>`;
      document.body.appendChild(f);
    }
    // Faixa "conta de teste" (Entrar como, só admin)
    const tm = testMode();
    if (tm && tm.nome) {
      const bar = document.createElement('div');
      bar.className = 'test-bar'; bar.id = 'test-bar';
      bar.innerHTML = `<span>${icon('user')} A experimentar como <b>${esc(tm.nome)}</b> (conta de teste)</span><button type="button" id="test-back">Voltar à minha conta</button>`;
      document.body.prepend(bar);
      bar.querySelector('#test-back').onclick = () => voltarConta();
    }
    document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  }


  // ---------------- Menu da conta (janela no canto superior direito, como nas Finanças) ----------------
  function setupAccountMenu(host) {
    const btn = document.getElementById('acct-btn'), menu = document.getElementById('acct-menu');
    let downInside = false, built = false;
    const close = () => { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
    const open = async () => {
      menu.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true');
      if (!built) { menu.innerHTML = '<div class="spinner"></div>'; await buildAccountMenu(menu, host); built = true; }
    };
    btn.addEventListener('click', () => menu.classList.contains('hidden') ? open() : close());
    // fecha ao clicar fora, mas não quando se carrega dentro e se larga fora
    document.addEventListener('pointerdown', e => { downInside = menu.contains(e.target) || btn.contains(e.target); });
    document.addEventListener('click', e => {
      if (menu.classList.contains('hidden') || downInside || menu.contains(e.target) || btn.contains(e.target)) return;
      close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    // avatar no botão, se houver sessão
    currentUser().then(async u => {
      if (!u) return;
      const { nome, avatar } = await displayName(u);
      const el = document.getElementById('acct-avatar');
      el.className = 'hdr-avatar on';
      el.style.backgroundImage = avatar ? `url('${esc(avatar)}')` : '';
      el.textContent = avatar ? '' : (nome || '?').trim().charAt(0).toUpperCase();
    });
  }
  async function buildAccountMenu(menu, host) {
    const u = await currentUser();
    const a = (href, ic, label) => `<a role="menuitem" href="${href}">${icon(ic)}<span>${label}</span></a>`;
    const ver = `<span class="acct-ver">${APP_VERSAO}</span>`;
    if (!u) {
      const next = encodeURIComponent(location.pathname + location.search);
      menu.innerHTML = `${ver}
        <a role="menuitem" class="acct-strong" href="/login.html?next=${next}">Entrar</a>
        <a role="menuitem" href="/login.html?modo=registo&next=${next}">Criar conta</a>
        <hr>${a('/anfitriao.html', 'garage', 'Arrendar o meu lugar')}${a('/ajuda.html', 'help', 'Centro de ajuda')}`;
      return;
    }
    const [{ nome }, admin] = await Promise.all([displayName(u), isAdmin()]);
    menu.innerHTML = `${ver}
      <div class="acct-head"><b>${esc(nome)}</b><small>${esc(u.email)}</small></div>
      ${host ? a('/', 'swap', 'Mudar para condutor') : a('/anfitriao.html', 'swap', 'Mudar para anfitrião')}
      <hr>
      ${host ? a('/anfitriao.html', 'garage', 'Os meus lugares') + a('/publicar.html', 'plus', 'Publicar um novo lugar') + a('/anfitriao.html?v=perfil', 'user', 'Dados de anfitrião')
             : a('/reservas.html', 'bookings', 'Reservas') + a('/favoritos.html', 'heart', 'Favoritos') + a('/mensagens.html', 'chat', 'Mensagens')}
      ${admin ? a('/admin.html', 'shield', 'Aprovação de anúncios') : ''}
      ${testSwitchHTML(admin, 'menuitem')}
      <hr>${a('/perfil.html' + (host ? '?modo=anfitriao' : ''), 'user', 'Perfil')}${a('/ajuda.html', 'help', 'Centro de ajuda')}
      ${testMode() ? '' : `<button role="menuitem" type="button" id="acct-logout">${icon('logout')}<span>Terminar sessão</span></button>`}`;
    const lo = menu.querySelector('#acct-logout');
    if (lo) lo.onclick = async () => { await Auth.signOut(); location.replace('/'); };
    bindTestSwitch(menu);
  }

  // ---------------- Entrar como conta de teste (só para o admin) ----------------
  // A troca é feita no servidor (Edge Function parkncharge-entrar-como, que só aceita administradores
  // e só entra nas duas contas de teste). Aqui guarda-se apenas o token para voltar à conta do admin.
  const VOLTAR_KEY = 'pnc_voltar';
  const TEST_ACCOUNTS = [['condutor', 'Condutor Teste', 'car'], ['anfitriao', 'Anfitrião Teste', 'garage']];
  function testMode() { try { return JSON.parse(localStorage.getItem(VOLTAR_KEY)); } catch (e) { return null; } }
  function setTestMode(v) { try { v ? localStorage.setItem(VOLTAR_KEY, JSON.stringify(v)) : localStorage.removeItem(VOLTAR_KEY); } catch (e) { } }
  function testSwitchHTML(admin, role = '') {
    const tm = testMode();
    if (!admin && !tm) return '';
    return `<div class="test-switch"><small>Experimentar como (só administrador)</small>
      ${TEST_ACCOUNTS.filter(([k]) => !tm || tm.conta !== k).map(([k, label, ic]) => `<button type="button" ${role ? `role="${role}"` : ''} data-entrar="${k}">${icon(ic)}<span>${label}</span></button>`).join('')}
      ${tm ? `<button type="button" ${role ? `role="${role}"` : ''} data-voltar>${icon('swap')}<span>Voltar à minha conta</span></button>` : ''}</div>`;
  }
  function bindTestSwitch(root) {
    root.querySelectorAll('[data-entrar]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try { await entrarComo(b.dataset.entrar); location.replace(b.dataset.entrar === 'anfitriao' ? '/anfitriao.html?v=hoje' : '/'); }
      catch (e) { b.disabled = false; toast(e.message || 'Não foi possível entrar na conta de teste.', 'err'); }
    });
    root.querySelectorAll('[data-voltar]').forEach(b => b.onclick = () => voltarConta());
  }
  async function entrarComo(conta) {
    if (testMode()) await voltarConta(false);          // trocar de conta de teste: volta primeiro à do admin
    const { data: { session } } = await plataforma.auth.getSession();
    if (!session) throw new Error('Entre primeiro na sua conta.');
    const { data, error } = await plataforma.functions.invoke('parkncharge-entrar-como', { body: { conta } });
    if (error || !data || !data.token_hash) {
      let msg = 'Não foi possível entrar na conta de teste.';
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { }
      throw new Error(msg);
    }
    setTestMode({ refresh_token: session.refresh_token, email: session.user.email, conta, nome: data.nome });
    const { error: e2 } = await plataforma.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
    if (e2) { await voltarConta(false); throw new Error('Não foi possível entrar na conta de teste.'); }
  }
  // ---------------- Mensagens ----------------
  // Abre (ou cria) a conversa sobre um anúncio. Condutor: { listing } ou { car }. Anfitrião: + { guest }.
  async function openConversation({ listing = null, car = null, guest = null }, btn) {
    const u = await currentUser();
    if (!u) { location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search); return; }
    if (btn) btn.disabled = true;
    const args = { p_listing: listing, p_car: car };
    if (guest) args.p_guest = guest;
    const { data, error } = await db().rpc('open_conversation', args);
    if (btn) btn.disabled = false;
    if (error || !data) return toast(error ? dbError(error) : 'Não foi possível abrir a conversa.', 'err');
    location.href = `/mensagens.html?c=${data}${guest ? '&modo=anfitriao' : ''}`;
  }
  // Número de conversas por ler, na barra inferior (Mensagens)
  async function unreadBadge(host) {
    const d = db(); if (!d || !(await currentUser())) return;
    const { data } = await d.rpc('unread_conversations');
    const r = data && data[0]; if (!r) return;
    const n = host ? r.as_host : r.as_guest;
    document.querySelectorAll('.nav a[href^="/mensagens.html"]').forEach(a => {
      let b = a.querySelector('.nav-badge');
      if (!n) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('i'); b.className = 'nav-badge'; a.appendChild(b); }
      b.textContent = n > 9 ? '9+' : n;
    });
  }

  async function voltarConta(reload = true) {
    const tm = testMode(); if (!tm) return;
    setTestMode(null);
    const { error } = await plataforma.auth.refreshSession({ refresh_token: tm.refresh_token });
    if (error) { try { await plataforma.auth.signOut({ scope: 'local' }); } catch (e) { } location.replace('/login.html'); return; }
    if (reload) location.replace('/');
  }

  // ---------------- Dados ----------------
  const db = () => window.plataforma ? window.plataforma.schema('parkncharge') : null;
  const BUCKET = 'parkncharge';
  function photoUrl(path) {
    if (!path) return '';
    if (/^assets\//.test(path)) return '/' + path;          // ilustrações dos exemplos (no próprio site)
    if (!window.plataforma) return '';
    return window.plataforma.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function currentUser() {
    if (!window.Auth) return null;
    try { return await Auth.getUser(); } catch (e) { return null; }
  }
  // Redireciona para o login se não houver sessão; devolve o utilizador
  async function requireLogin() {
    const user = await currentUser();
    if (!user) {
      location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
      return null;
    }
    return user;
  }
  async function isAdmin() {
    const d = db(); if (!d) return false;
    const { data } = await d.rpc('is_admin');
    return !!data;
  }
  async function displayName(user) {
    let nome = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '';
    try {
      const { data } = await plataforma.from('profiles').select('nome, avatar_url').eq('id', user.id).maybeSingle();
      if (data && data.nome) nome = data.nome;
      return { nome: nome || user.email.split('@')[0], avatar: (data && data.avatar_url) || (user.user_metadata && user.user_metadata.avatar_url) || '' };
    } catch (e) { return { nome: nome || user.email.split('@')[0], avatar: '' }; }
  }


  // ---------------- Localização e disponibilidade ----------------
  // Localização por defeito (fictícia, por agora): São Mamede de Infesta. O botão "usar a minha localização" usa o GPS.
  const DEFAULT_LOC = { lat: 41.1936, lng: -8.6117, locality: 'São Mamede de Infesta' };
  const hhmm = t => (t || '').slice(0, 5);
  // Aberto agora segundo o horário semanal (0 = segunda … 6 = domingo)
  function openNow(schedule, d = new Date()) {
    const wd = (d.getDay() + 6) % 7, now = d.toTimeString().slice(0, 5);
    const s = (schedule || []).find(x => x.weekday === wd);
    if (!s) return false;
    const c = hhmm(s.closes_at) === '00:00' ? '24:00' : hhmm(s.closes_at);
    return now >= hhmm(s.opens_at) && now < c;
  }
  // Próxima abertura, em texto ("abre hoje às 19:00", "abre segunda às 08:00")
  function nextOpening(schedule, d = new Date()) {
    const wd = (d.getDay() + 6) % 7, now = d.toTimeString().slice(0, 5);
    for (let i = 0; i < 7; i++) {
      const s = (schedule || []).find(x => x.weekday === (wd + i) % 7);
      if (!s || (i === 0 && hhmm(s.opens_at) <= now)) continue;
      return `abre ${i === 0 ? 'hoje' : i === 1 ? 'amanhã' : WEEKDAYS[(wd + i) % 7].toLowerCase()} às ${hhmm(s.opens_at)}`;
    }
    return '';
  }
  // Estado agora. Até às reservas (v0.4) a ocupação é simulada nos anúncios de exemplo (demo_occupied).
  const scheduleOf = l => l.listing_schedule || l.car_schedule || l.schedule || [];
  function availability(l, d = new Date()) {
    const car = !!l.car_schedule;
    if (l.occupied || l.demo_occupied) return { key: 'ocupada', label: car ? 'Alugado' : 'Ocupada' };
    const sch = scheduleOf(l);
    if (!openNow(sch, d)) { const n = nextOpening(sch, d); return { key: 'fechada', label: (car ? 'Indisponível agora' : 'Fechada agora') + (n ? ' · ' + n.replace('abre', car ? 'disponível' : 'abre') : '') }; }
    return { key: 'disponivel', label: 'Disponível agora' };
  }

  // Cabe no horário? (igual à regra do servidor: lugares — período inteiro; carros — levantar e entregar;
  // 30 dias ou mais ignoram o horário). Usa a hora local do browser (Portugal).
  function fitsSchedule(sch, s, e, car) {
    if (!(e > s)) return false;
    if (e - s >= 30 * 864e5) return true;
    const wd = d => (d.getDay() + 6) % 7, t = d => d.toTimeString().slice(0, 5);
    const day = d => (sch || []).find(x => x.weekday === wd(d));
    const cl = x => (hhmm(x.closes_at) === '00:00' ? '24:00' : hhmm(x.closes_at));
    if (car) {
      const a = day(s); if (!a || t(s) < hhmm(a.opens_at) || t(s) >= cl(a)) return false;
      if (t(e) === '00:00') { const p = day(new Date(e - 1)); return !!p && cl(p) === '24:00'; }
      const b = day(e); return !!b && t(e) > hhmm(b.opens_at) && t(e) <= cl(b);
    }
    const d = new Date(s); d.setHours(0, 0, 0, 0);
    const endDay = new Date(e); endDay.setHours(0, 0, 0, 0);
    while (d <= endDay) {
      const last = d.getTime() === endDay.getTime();
      if (last && t(e) === '00:00') break;
      const segS = d.getTime() === new Date(new Date(s).setHours(0, 0, 0, 0)).getTime() ? t(s) : '00:00';
      const x = day(d); if (!x || segS < hhmm(x.opens_at)) return false;
      if (last) { if (t(e) > cl(x)) return false; } else if (cl(x) !== '24:00') return false;
      d.setDate(d.getDate() + 1);
    }
    return true;
  }
  const BOOKING_STATUS = {
    pedido: ['Pedido enviado', 'st-pending'], confirmada: ['Confirmada', 'st-live'], recusada: ['Recusada', 'st-rejected'],
    cancelada: ['Cancelada', 'st-paused'], expirada: ['Expirada', 'st-draft'], decorrer: ['A decorrer', 'st-live'], concluida: ['Concluída', 'st-draft'],
  };
  // Estado mostrado (concluída / a decorrer vêm das datas)
  function bookingState(b, now = new Date()) {
    if (b.status === 'confirmada') {
      if (new Date(b.ends_at) <= now) return 'concluida';
      if (new Date(b.starts_at) <= now) return 'decorrer';
    }
    if (b.status === 'pedido' && b.expires_at && new Date(b.expires_at) <= now) return 'expirada';
    return b.status;
  }
  const fmtDT = d => new Date(d).toLocaleString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function fmtRange(s, e) {
    const a = new Date(s), b = new Date(e);
    const same = a.toDateString() === b.toDateString();
    return same ? `${fmtDT(a)} – ${b.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : `${fmtDT(a)} → ${fmtDT(b)}`;
  }

  // ---------------- Avaliações ----------------
  function ratingOf(reviews) {
    const r = (reviews || []).filter(x => x && x.rating);
    if (!r.length) return { avg: 0, n: 0 };
    return { avg: r.reduce((a, x) => a + x.rating, 0) / r.length, n: r.length };
  }
  const fmtRating = v => v.toFixed(2).replace(/0$/, '').replace('.', ',');
  function stars(v, cls = '') {
    return `<span class="stars ${cls}" aria-label="${fmtRating(v)} em 5">` + [1, 2, 3, 4, 5].map(i =>
      `<svg viewBox="0 0 24 24" class="${v >= i - 0.25 ? 'on' : v >= i - 0.75 ? 'half' : ''}"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`).join('') + '</span>';
  }

  // ---------------- Preço estimado ----------------
  // Escolhe a combinação mais barata entre horas, dias (com horas a mais) e meses
  function estimate(l, start, end) {
    const h = (end - start) / 36e5;
    if (!(h > 0)) return null;
    const ph = +l.price_hour || 0, pd = +l.price_day || 0, pm = +l.price_month || 0, opts = [];
    const pl = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    if (ph) opts.push({ total: Math.ceil(h) * ph, label: `${pl(Math.ceil(h), 'hora', 'horas')} × ${euro(ph)}` });
    if (pd) {
      const d = Math.ceil(h / 24);
      opts.push({ total: d * pd, label: `${pl(d, 'dia', 'dias')} × ${euro(pd)}` });
      const fd = Math.floor(h / 24), rh = Math.ceil(h - fd * 24);
      if (ph && fd > 0 && rh > 0 && rh * ph < pd) opts.push({ total: fd * pd + rh * ph, label: `${pl(fd, 'dia', 'dias')} × ${euro(pd)} + ${pl(rh, 'hora', 'horas')} × ${euro(ph)}` });
    }
    if (pm) { const m = Math.ceil(h / 720); opts.push({ total: m * pm, label: `${pl(m, 'mês', 'meses')} × ${euro(pm)}` }); }
    if (!opts.length) return null;
    return opts.sort((a, b) => a.total - b.total)[0];
  }

  // ---------------- Catálogos ----------------
  const CATEGORIES = [
    { id: 'todos', label: 'Todos', icon: 'all' },
    { id: 'carregador', label: 'Com carregador', icon: 'bolt', match: l => l.has_charger },
    { id: 'coberto', label: 'Coberto', icon: 'roof', match: l => l.is_covered },
    { id: 'subterraneo', label: 'Subterrâneo', icon: 'under', match: l => l.is_underground },
    { id: 'fechado', label: 'Fechado', icon: 'lock', match: l => l.is_closed },
    { id: 'acesso', label: 'Acesso fácil', icon: 'easy', match: l => l.easy_entry },
    { id: 'solo', label: 'Lugar só seu', icon: 'solo', match: l => l.is_solo },
    { id: 'mensal', label: 'Mensal', icon: 'month', match: l => !!l.price_month },
    { id: 'moto', label: 'Motas', icon: 'moto', match: l => (l.vehicle_types || []).includes('moto') },
    { id: 'grandes', label: 'Carrinhas', icon: 'van', match: l => (l.vehicle_types || []).some(v => ['carrinha', 'autocaravana', 'camiao', 'autocarro'].includes(v)) },
  ];
  const CAR_CATEGORIES = [
    { id: 'todos', label: 'Todos', icon: 'all' },
    { id: 'eletrico', label: 'Elétrico', icon: 'bolt', match: c => c.fuel === 'eletrico' },
    { id: 'hibrido', label: 'Híbrido', icon: 'leaf', match: c => c.fuel === 'hibrido' },
    { id: 'automatico', label: 'Automático', icon: 'gear', match: c => c.transmission === 'automatica' },
    { id: 'citadino', label: 'Citadino', icon: 'city', match: c => c.category === 'citadino' },
    { id: 'familiar', label: 'Familiar', icon: 'car', match: c => ['familiar', 'monovolume'].includes(c.category) },
    { id: 'suv', label: 'SUV', icon: 'roof', match: c => c.category === 'suv' },
    { id: 'sete', label: '7 lugares', icon: 'seat', match: c => (c.seats || 0) >= 7 },
    { id: 'carrinha', label: 'Carrinhas', icon: 'van', match: c => c.category === 'carrinha' },
    { id: 'bebe', label: 'Cadeira de bebé', icon: 'baby', match: c => (c.features || []).includes('cadeira_bebe') },
    { id: 'engate', label: 'Engate', icon: 'hitch', match: c => (c.features || []).includes('engate') },
  ];
  const CAR_LABELS = {
    category: { citadino: 'Citadino', familiar: 'Familiar', suv: 'SUV', carrinha: 'Carrinha', monovolume: 'Monovolume', desportivo: 'Desportivo' },
    fuel: { gasolina: 'Gasolina', gasoleo: 'Gasóleo', hibrido: 'Híbrido', eletrico: 'Elétrico', gpl: 'GPL' },
    transmission: { manual: 'Manual', automatica: 'Automática' },
    features: { ac: 'Ar condicionado', gps: 'GPS', bluetooth: 'Bluetooth', cadeira_bebe: 'Cadeira de bebé', engate: 'Engate', teto_panoramico: 'Teto panorâmico', camara_marcha_atras: 'Câmara de marcha-atrás', cruise_control: 'Cruise control' },
  };
  const SEATS = [[0, 'Qualquer'], [2, '2+'], [4, '4+'], [5, '5+'], [7, '7+']];
  // Os dois tipos de anúncio: lugares (estacionar) e carros (alugar)
  const MODES = {
    lugares: {
      key: 'lugares', label: 'Estacionar', icon: 'parking', table: 'listings', schedule: 'listing_schedule', reviewKey: 'listing_id', page: '/lugar.html',
      categories: CATEGORIES, localTitle: z => `Garagens em ${z}`, otherTitle: z => `Lugares em ${z}`, noun: ['lugar', 'lugares'],
      fields: 'id,title,zone,approx_lat,approx_lng,cover_photo,vehicle_types,is_covered,is_underground,is_closed,is_solo,easy_entry,has_charger,charger_kw,price_hour,price_day,price_month,is_demo,demo_occupied',
    },
    carros: {
      key: 'carros', label: 'Alugar carro', icon: 'car', table: 'cars', schedule: 'car_schedule', reviewKey: 'car_id', page: '/carro.html',
      categories: CAR_CATEGORIES, localTitle: z => `Carros em ${z}`, otherTitle: z => `Carros em ${z}`, noun: ['carro', 'carros'],
      fields: 'id,title,brand,model,year,category,fuel,transmission,seats,range_km,features,zone,approx_lat,approx_lng,cover_photo,price_hour,price_day,price_month,is_demo,demo_occupied',
    },
  };
  // Lista filtrada por várias categorias ao mesmo tempo (o lugar tem de cumprir todas)
  function matchAll(list, cats, ids) {
    const fs = cats.filter(c => ids.includes(c.id) && c.match);
    return fs.length ? list.filter(l => fs.every(c => c.match(l))) : list;
  }

  const VEHICLES = [
    ['moto', 'Mota'], ['carro', 'Carro'], ['carrinha', 'Carrinha'],
    ['autocarro', 'Autocarro'], ['camiao', 'Camião'], ['autocaravana', 'Autocaravana'],
  ];
  const SPOT_TYPES = [
    ['garagem', 'Garagem', 'Garagem individual, com porta'],
    ['box', 'Box', 'Box fechada num parque ou prédio'],
    ['lugar_coberto', 'Lugar coberto', 'Lugar num parque ou garagem coletiva'],
    ['lugar_descoberto', 'Lugar descoberto', 'Logradouro, pátio ou terreno'],
    ['parque', 'Parque', 'Vários lugares (empresas)'],
  ];
  const ZONES = ['São Mamede de Infesta', 'Senhora da Hora', 'Custóias', 'Leça do Balio', 'Baixa', 'Ribeira', 'Boavista', 'Foz do Douro', 'Campanhã', 'Antas', 'Paranhos', 'Ramalde', 'Cedofeita', 'Bonfim', 'Aldoar', 'Lordelo do Ouro', 'Massarelos', 'Matosinhos', 'Vila Nova de Gaia', 'Maia'];
  const CHARGERS = [['schuko', 'Tomada doméstica (Schuko)'], ['tipo2', 'Tipo 2 (Wallbox)'], ['ccs', 'CCS (rápido)'], ['chademo', 'CHAdeMO'], ['outro', 'Outro']];
  const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const STATUS = {
    rascunho: ['Rascunho', 'st-draft'], pendente: ['Em análise', 'st-pending'], ativo: ['Ativo', 'st-live'],
    recusado: ['Recusado', 'st-rejected'], pausado: ['Pausado', 'st-paused'],
  };

  function euro(v, suffix = '') {
    if (v == null || v === '') return '';
    const n = Number(v);
    return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 }) + suffix;
  }
  // Preço principal do cartão, pela ordem hora → dia → mês
  function mainPrice(l) {
    if (l.price_hour) return euro(l.price_hour, '/h');
    if (l.price_day) return euro(l.price_day, '/dia');
    if (l.price_month) return euro(l.price_month, '/mês');
    return '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // Distância aproximada em metros (haversine)
  function distance(a, b) {
    const R = 6371000, r = x => x * Math.PI / 180;
    const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function walkText(m) {
    const min = Math.max(1, Math.round(m / 80));
    return min > 60 ? `${(m / 1000).toFixed(1)} km` : `${min} min a pé`;
  }

  function toast(text, kind = 'ok') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.className = 'toast ' + kind; t.textContent = text;
    clearTimeout(t._h); t._h = setTimeout(() => t.className = 'toast hidden', 3500);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 6 && h < 13) return 'Bom dia';
    if (h >= 13 && h < 20) return 'Boa tarde';
    return 'Boa noite';
  }

  function authError(err) {
    const m = (err && err.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'Email ou palavra-passe incorretos.';
    if (m.includes('email not confirmed')) return 'Confirme primeiro o seu email (verifique a caixa de entrada).';
    if (m.includes('already registered')) return 'Já existe uma conta com este email. Entre em vez de criar conta.';
    if (m.includes('password should be')) return 'A palavra-passe deve ter pelo menos 6 caracteres.';
    if (m.includes('rate limit')) return 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.';
    if (m.includes('valid email') || m.includes('invalid email')) return 'Email inválido.';
    return 'Ocorreu um erro. Tente novamente.';
  }
  // Erros da base de dados: as mensagens dos triggers já vêm em português
  function dbError(err) {
    if (!err) return '';
    const m = err.message || '';
    if (/schema must be one of|invalid schema/i.test(m)) return 'O servidor ainda não está configurado para o Parkncharge. Tente mais tarde.';
    if (/row-level security|permission denied/i.test(m)) return 'Sem permissão para esta operação.';
    if (err.code === '23P01' || /exclusion|sem_sobreposicao/i.test(m)) return 'Já existe uma reserva nesse período. Escolha outras datas.';
    if (/Falta|Indique|Complete|Adicione|Máximo|Guarde|Alteração|Fora do horário|reserva|Reserva|Não pode|Este anúncio|Este pedido|Só quem|Só se podem|Só o anfitrião|Só pode|Só os participantes|Escreva|Entre na sua conta|Conversa|Anúncio não encontrado|já/.test(m)) return m;
    if (/check constraint/i.test(m)) return 'Há um valor inválido. Verifique os campos.';
    return 'Ocorreu um erro. Tente novamente.';
  }

  window.PNC = {
    APP_VERSAO, DEFAULT_LOC, openNow, nextOpening, availability, scheduleOf, ratingOf, fmtRating, stars, estimate,
    CAR_CATEGORIES, CAR_LABELS, SEATS, MODES, matchAll, fitsSchedule, BOOKING_STATUS, bookingState, fmtDT, fmtRange, icon, LOGO, renderChrome, db, photoUrl, BUCKET, currentUser, requireLogin, openConversation, unreadBadge, testMode, testSwitchHTML, bindTestSwitch, entrarComo, voltarConta, isAdmin, displayName,
    CATEGORIES, VEHICLES, SPOT_TYPES, ZONES, CHARGERS, WEEKDAYS, STATUS,
    euro, mainPrice, esc, distance, walkText, toast, greeting, authError, dbError, SITE_ID: 'parkncharge',
  };
})();
