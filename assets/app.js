// Parkncharge — código comum
// Usa o auth.js partilhado (plataforma-core): window.Auth e window.plataforma.
(function () {
  // Versão atual — atualizar em cada alteração (ver PATCH NOTES.md)
  const APP_VERSAO = 'v0.2b';

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
            : '<a href="/anfitriao.html" id="hdr-host">Arrendar o meu lugar</a>'}
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
      <hr>${a('/perfil.html' + (host ? '?modo=anfitriao' : ''), 'user', 'Perfil')}${a('/ajuda.html', 'help', 'Centro de ajuda')}
      <button role="menuitem" type="button" id="acct-logout">${icon('logout')}<span>Terminar sessão</span></button>`;
    menu.querySelector('#acct-logout').onclick = async () => { await Auth.signOut(); location.replace('/'); };
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
  function availability(l, d = new Date()) {
    if (l.demo_occupied) return { key: 'ocupada', label: 'Ocupada' };
    if (!openNow(l.listing_schedule, d)) { const n = nextOpening(l.listing_schedule, d); return { key: 'fechada', label: 'Fechada agora' + (n ? ' · ' + n : '') }; }
    return { key: 'disponivel', label: 'Disponível agora' };
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
    if (/Falta|Indique|Complete|Adicione|Máximo|Guarde|Alteração de estado/.test(m)) return m;
    if (/check constraint/i.test(m)) return 'Há um valor inválido. Verifique os campos.';
    return 'Ocorreu um erro. Tente novamente.';
  }

  window.PNC = {
    APP_VERSAO, DEFAULT_LOC, openNow, nextOpening, availability, icon, LOGO, renderChrome, db, photoUrl, BUCKET, currentUser, requireLogin, isAdmin, displayName,
    CATEGORIES, VEHICLES, SPOT_TYPES, ZONES, CHARGERS, WEEKDAYS, STATUS,
    euro, mainPrice, esc, distance, walkText, toast, greeting, authError, dbError, SITE_ID: 'parkncharge',
  };
})();
