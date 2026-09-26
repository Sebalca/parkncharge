// Parkncharge — código comum (v0.1)
// Usa o auth.js partilhado (plataforma-core): window.Auth e window.plataforma.
(function () {
  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    heart: '<path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.5 5 6.8 5c2 0 3.4 1.1 4.2 2.4C11.8 6.1 13.2 5 15.2 5c3.3 0 5.2 3.3 3.8 6.4C19 15.6 12 20 12 20z"/>',
    bookings: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M9 10h6M9 14h6M9 18h4"/>',
    user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.3-2 3.2-3 5.5-3s4.2 1 5.5 3"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    garage: '<path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-7h10v7M7 16h10"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  function icon(name, extra = '') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[name]}</svg>`;
  }

  // Barra inferior (Início, Mapa, Favoritos, Reservas, Conta)
  function renderNav(active) {
    const items = [
      ['home', 'Início', '/'],
      ['map', 'Mapa', '/#mapa'],
      ['heart', 'Favoritos', '/login.html?next=/'],
      ['bookings', 'Reservas', '/login.html?next=/'],
      ['user', 'Conta', '/login.html'],
    ];
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', 'Navegação principal');
    nav.innerHTML = '<div class="nav-inner">' + items.map(([k, label, href]) =>
      `<a href="${href}" data-k="${k}" class="${k === active ? 'active' : ''}" aria-label="${label}">${icon(k)}<span>${label}</span></a>`
    ).join('') + '</div>';
    document.body.appendChild(nav);
    return nav;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 6 && h < 13) return 'Bom dia';
    if (h >= 13 && h < 20) return 'Boa tarde';
    return 'Boa noite';
  }

  // Tradução das mensagens de erro mais comuns do Supabase Auth
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

  window.PNC = { icon, renderNav, greeting, authError, SITE_ID: 'parkncharge' };
})();
