// Parkncharge — página de um anúncio (lugar.html ou carro.html)
// O tipo vem de <body data-tipo="lugar|carro">. Mostra galeria, características, horário, zona no mapa,
// avaliações (ler, escrever, editar, apagar) e a caixa de reserva com o preço estimado.
(function () {
  const TIPO = document.body.dataset.tipo === 'carro' ? 'carro' : 'lugar';
  const CAR = TIPO === 'carro';
  const MODE = PNC.MODES[CAR ? 'carros' : 'lugares'];
  const I = PNC.icon, esc = PNC.esc, $ = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const root = $('item');
  let L0, reviews = [], user = null;

  PNC.renderChrome({ active: 'Explorar' });

  const fact = (ic, label, val) => `<li>${I(ic)}<span><b>${esc(label)}</b>${val ? `<small>${esc(val)}</small>` : ''}</span></li>`;
  const fmtMonth = d => new Date(d).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  const pad = n => String(n).padStart(2, '0');
  const toLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  function facts() {
    const l = L0, out = [];
    if (CAR) {
      const lb = PNC.CAR_LABELS;
      out.push(fact('car', `${l.brand || ''} ${l.model || ''}`.trim() || 'Carro', [lb.category[l.category], l.year].filter(Boolean).join(' · ')));
      if (l.fuel) out.push(fact(l.fuel === 'eletrico' ? 'bolt' : l.fuel === 'hibrido' ? 'leaf' : 'car', lb.fuel[l.fuel], l.range_km ? `Autonomia ~${l.range_km} km` : ''));
      if (l.transmission) out.push(fact('gear', `Caixa ${lb.transmission[l.transmission].toLowerCase()}`, ''));
      if (l.seats) out.push(fact('seat', `${l.seats} lugares`, l.doors ? `${l.doors} portas` : ''));
      if (l.km_included_day != null) out.push(fact('target', `${l.km_included_day} km incluídos por dia`, ''));
      if (l.min_age) out.push(fact('user', `Condutor com ${l.min_age} anos ou mais`, ''));
      if (l.deposit != null) out.push(fact('shield', `Caução de ${PNC.euro(l.deposit)}`, 'Devolvida no fim do aluguer'));
    } else {
      const t = PNC.SPOT_TYPES.find(x => x[0] === l.spot_type);
      if (t) out.push(fact('garage', t[1], t[2]));
      if (l.is_covered) out.push(fact('roof', 'Coberto', 'Protegido da chuva'));
      if (l.is_underground) out.push(fact('under', 'Subterrâneo', ''));
      if (l.is_closed) out.push(fact('lock', 'Pode ser fechado', 'Portão, porta ou box com chave'));
      if (l.is_solo) out.push(fact('solo', 'Lugar só seu', 'Não é partilhado'));
      if (l.easy_entry) out.push(fact('easy', 'Acesso fácil', 'Sem manobras difíceis'));
      if (l.max_height_m) out.push(fact('under', `Altura máxima ${String(l.max_height_m).replace('.', ',')} m`, ''));
      out.push(fact('car', 'Veículos aceites', (l.vehicle_types || []).map(v => (PNC.VEHICLES.find(x => x[0] === v) || [, v])[1]).join(', ')));
    }
    out.push(fact(l.instant_book ? 'bolt' : 'check', l.instant_book ? 'Reserva instantânea' : 'O anfitrião aprova cada pedido', ''));
    return `<ul class="facts">${out.join('')}</ul>`;
  }

  function chargerBlock() {
    const l = L0;
    if (CAR || !l.has_charger) return '';
    const ch = PNC.CHARGERS.find(x => x[0] === l.charger_type);
    return `<section class="item-sec"><h2>${I('bolt')} Carregador</h2>
      <p><b>${esc(ch ? ch[1] : 'Carregador')}</b>${l.charger_kw ? ` · ${String(l.charger_kw).replace('.', ',')} kW` : ''}</p>
      <p class="muted">${l.charge_price_mode === 'incluido' ? 'Energia incluída no preço.' : `Energia paga à parte: ${PNC.euro(l.charge_price_kwh, '/kWh')}.`}</p></section>`;
  }
  function featuresBlock() {
    if (!CAR || !(L0.features || []).length) return '';
    return `<section class="item-sec"><h2>Extras</h2><div class="chips">${L0.features.map(f => `<span class="chip">${esc(PNC.CAR_LABELS.features[f] || f)}</span>`).join('')}</div></section>`;
  }
  function scheduleBlock() {
    const sch = PNC.scheduleOf(L0), today = (new Date().getDay() + 6) % 7;
    const rows = PNC.WEEKDAYS.map((d, i) => {
      const s = sch.find(x => x.weekday === i);
      const v = !s ? 'Fechado' : (s.opens_at.startsWith('00:00') && s.closes_at.startsWith('24:00')) ? '24 horas' : `${s.opens_at.slice(0, 5)} – ${s.closes_at.slice(0, 5)}`;
      return `<tr class="${i === today ? 'today' : ''}"><td>${d}</td><td>${v}</td></tr>`;
    }).join('');
    return `<section class="item-sec"><h2>${CAR ? 'Quando se pode levantar' : 'Horário'}</h2><table class="sched">${rows}</table></section>`;
  }

  // ---------- Avaliações ----------
  function reviewsBlock() {
    const rt = PNC.ratingOf(reviews);
    const dist = [5, 4, 3, 2, 1].map(s => [s, reviews.filter(r => r.rating === s).length]);
    const mine = user && reviews.find(r => r.author_id === user.id && !r.is_demo);
    return `<section class="item-sec" id="avaliacoes">
      <h2>${rt.n ? `${I('star')} ${PNC.fmtRating(rt.avg)} · ${rt.n} ${rt.n === 1 ? 'avaliação' : 'avaliações'}` : 'Avaliações'}</h2>
      ${rt.n ? `<div class="rev-sum"><div class="rev-big">${PNC.fmtRating(rt.avg)}${PNC.stars(rt.avg)}</div>
        <div class="rev-bars">${dist.map(([s, n]) => `<div><span>${s}</span><i><b style="width:${rt.n ? n / rt.n * 100 : 0}%"></b></i><span>${n}</span></div>`).join('')}</div></div>` : ''}
      <div id="rev-form">${reviewForm(mine)}</div>
      <div class="rev-list">${reviews.length ? reviews.map(reviewItem).join('') : `<p class="muted">Ainda sem avaliações. Seja o primeiro a avaliar este ${CAR ? 'carro' : 'lugar'}.</p>`}</div>
    </section>`;
  }
  function reviewItem(r) {
    const me = user && r.author_id === user.id && !r.is_demo;
    return `<article class="rev">
      <div class="rev-head"><span class="rev-av">${esc((r.author_name || '?').charAt(0))}</span>
        <div><b>${esc(r.author_name || 'Utilizador')}</b>${r.is_demo ? ' <span class="tag-demo">Exemplo</span>' : ''}${me ? ' <span class="tag-me">A sua avaliação</span>' : ''}<small>${fmtMonth(r.created_at)}</small></div></div>
      ${PNC.stars(r.rating, 'sm')}
      ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}
    </article>`;
  }
  function reviewForm(mine) {
    if (!user) return `<div class="msg info">Para avaliar, <a href="/login.html?next=${encodeURIComponent(location.pathname + location.search)}">entre na sua conta</a>.</div>`;
    if (user.id === L0.host_id) return `<p class="muted">Não pode avaliar os seus próprios anúncios.</p>`;
    const r = mine || { rating: 0, comment: '' };
    return `<form class="rev-form" id="rform">
      <b>${mine ? 'Editar a sua avaliação' : 'Deixe a sua avaliação'}</b>
      <div class="star-input" role="radiogroup" aria-label="Classificação">${[1, 2, 3, 4, 5].map(i =>
        `<button type="button" role="radio" aria-checked="${r.rating === i}" aria-label="${i} ${i === 1 ? 'estrela' : 'estrelas'}" data-s="${i}" class="${i <= r.rating ? 'on' : ''}">${I('star')}</button>`).join('')}</div>
      <textarea class="input" id="rcomment" maxlength="1000" placeholder="Como correu? (opcional)">${esc(r.comment || '')}</textarea>
      <div class="rev-actions"><button class="btn small" type="submit">${mine ? 'Guardar' : 'Publicar avaliação'}</button>
        ${mine ? '<button class="btn small danger" type="button" id="rdel">Apagar</button>' : ''}</div>
      <p class="hint">Uma avaliação por pessoa. Pode editá-la quando quiser. A partir das reservas (v0.4) só quem usou o ${CAR ? 'carro' : 'lugar'} poderá avaliar.</p>
    </form>`;
  }
  function wireReviewForm() {
    const f = $('rform'); if (!f) return;
    const mine = reviews.find(r => r.author_id === user.id && !r.is_demo);
    let rating = mine ? mine.rating : 0;
    f.querySelectorAll('.star-input button').forEach(b => b.onclick = () => {
      rating = +b.dataset.s;
      f.querySelectorAll('.star-input button').forEach(x => { x.classList.toggle('on', +x.dataset.s <= rating); x.setAttribute('aria-checked', +x.dataset.s === rating); });
    });
    f.onsubmit = async e => {
      e.preventDefault();
      if (!rating) return PNC.toast('Escolha de 1 a 5 estrelas.', 'err');
      const comment = $('rcomment').value.trim() || null;
      const db = PNC.db();
      const q = mine
        ? db.from('reviews').update({ rating, comment }).eq('id', mine.id)
        : db.from('reviews').insert({ [MODE.reviewKey]: L0.id, rating, comment });
      const { error } = await q;
      if (error) return PNC.toast(/duplicate|unique/i.test(error.message) ? 'Já avaliou este anúncio.' : (error.message.match(/Não pode|Só se podem/) ? error.message : PNC.dbError(error)), 'err');
      PNC.toast(mine ? 'Avaliação atualizada.' : 'Obrigado pela avaliação!');
      await loadReviews(); paintReviews();
    };
    const del = $('rdel');
    if (del) del.onclick = async () => {
      if (!confirm('Apagar a sua avaliação?')) return;
      const { error } = await PNC.db().from('reviews').delete().eq('id', mine.id);
      if (error) return PNC.toast(PNC.dbError(error), 'err');
      PNC.toast('Avaliação apagada.');
      await loadReviews(); paintReviews();
    };
  }
  function paintReviews() {
    $('avaliacoes').outerHTML = reviewsBlock();
    const rt = PNC.ratingOf(reviews);
    $('item-rating').innerHTML = rt.n ? `${I('star')} <b>${PNC.fmtRating(rt.avg)}</b> · <a href="#avaliacoes">${rt.n} ${rt.n === 1 ? 'avaliação' : 'avaliações'}</a>` : `${I('star')} Novo`;
    wireReviewForm();
  }
  async function loadReviews() {
    const { data } = await PNC.db().from('reviews').select('id,author_id,author_name,rating,comment,is_demo,created_at')
      .eq(MODE.reviewKey, id).order('is_demo').order('created_at', { ascending: false });
    reviews = data || [];
  }

  // ---------- Reserva (preço estimado) ----------
  function bookingBox() {
    const l = L0, av = PNC.availability(l);
    const prices = [l.price_hour && [PNC.euro(l.price_hour), 'hora'], l.price_day && [PNC.euro(l.price_day), 'dia'], l.price_month && [PNC.euro(l.price_month), 'mês']].filter(Boolean);
    const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() + 1);
    const e = new Date(s.getTime() + (l.price_hour ? 2 : 24) * 36e5);
    return `<aside class="book" id="book">
      <div class="book-price"><b>${prices[0][0]}</b> / ${prices[0][1]}${prices.slice(1).map(p => ` <span class="muted">· ${p[0]} / ${p[1]}</span>`).join('')}</div>
      <div class="avail av-${av.key}">${esc(av.label)}</div>
      <div class="book-dates">
        <label><span>${CAR ? 'Levantar' : 'Início'}</span><input type="datetime-local" id="bstart" value="${toLocal(s)}"></label>
        <label><span>${CAR ? 'Entregar' : 'Fim'}</span><input type="datetime-local" id="bend" value="${toLocal(e)}"></label>
      </div>
      <div class="book-est" id="best"></div>
      <button class="btn block orange" type="button" disabled aria-disabled="true">Reservas em breve</button>
      <p class="hint center">As reservas chegam na v0.4. Por agora pode ver o preço estimado.</p>
    </aside>`;
  }
  function updateEstimate() {
    const s = new Date($('bstart').value), e = new Date($('bend').value), out = $('best');
    if (!(e > s)) { out.innerHTML = '<div class="msg err">O fim tem de ser depois do início.</div>'; return; }
    const est = PNC.estimate(L0, s, e);
    out.innerHTML = est ? `<div class="est-row"><span>${esc(est.label)}</span><span>${PNC.euro(est.total)}</span></div>
      <div class="est-row total"><span>Total estimado</span><span>${PNC.euro(est.total)}</span></div>` : '';
  }

  // ---------- Página ----------
  async function render() {
    const photos = (L0[CAR ? 'car_photos' : 'listing_photos'] || []).sort((a, b) => a.position - b.position);
    const rt = PNC.ratingOf(reviews);
    const fallback = `<div class="g-main g-empty">${I(CAR ? 'car' : 'garage')}</div>`;
    document.title = `${L0.title} — Parkncharge`;
    root.innerHTML = `
      <a class="item-back" href="/${CAR ? '?tipo=carros' : ''}">${I('back')} ${CAR ? 'Carros' : 'Lugares'}</a>
      <h1 class="item-title">${esc(L0.title)}</h1>
      <div class="item-meta"><span id="item-rating">${rt.n ? `${I('star')} <b>${PNC.fmtRating(rt.avg)}</b> · <a href="#avaliacoes">${rt.n} ${rt.n === 1 ? 'avaliação' : 'avaliações'}</a>` : `${I('star')} Novo`}</span>
        <span>· ${esc(L0.zone)}, ${esc(L0.city || 'Porto')}</span>${L0.is_demo ? '<span class="tag-demo">Exemplo</span>' : ''}</div>
      <div class="gallery g${Math.min(photos.length, 3)}">
        ${photos.length ? photos.slice(0, 3).map((p, i) => `<a class="${i ? 'g-side' : 'g-main'}" href="${PNC.photoUrl(p.storage_path)}" target="_blank" rel="noopener" style="background-image:url('${PNC.photoUrl(p.storage_path)}')" aria-label="Ver fotografia ${i + 1}"></a>`).join('') : fallback}
      </div>
      <div class="item-grid">
        <div class="item-main">
          <section class="item-sec">
            <h2>${CAR ? 'Sobre o carro' : 'Sobre o lugar'}</h2>
            ${facts()}
          </section>
          ${chargerBlock()}
          ${featuresBlock()}
          ${L0.description ? `<section class="item-sec"><h2>Descrição</h2><p class="item-desc">${esc(L0.description)}</p></section>` : ''}
          ${scheduleBlock()}
          <section class="item-sec">
            <h2>${CAR ? 'Onde se levanta' : 'Onde fica'}</h2>
            <p class="muted">${esc(L0.zone)}, ${esc(L0.city || 'Porto')}. ${CAR ? 'O local exato de recolha' : 'A morada exata'} é enviado depois de a reserva ser confirmada.</p>
            <div class="map-big map-item" id="imap" aria-label="Zona aproximada"></div>
          </section>
          ${reviewsBlock()}
        </div>
        ${bookingBox()}
      </div>`;
    ['bstart', 'bend'].forEach(x => $(x).addEventListener('change', updateEstimate));
    updateEstimate();
    wireReviewForm();
    if (window.L && L0.approx_lat != null) {
      const m = L.map('imap', { scrollWheelZoom: false }).setView([L0.approx_lat, L0.approx_lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      L.circle([L0.approx_lat, L0.approx_lng], { radius: 300, color: '#E95322', weight: 2, fillColor: '#E95322', fillOpacity: .15 }).addTo(m);
    } else if ($('imap')) $('imap').innerHTML = '<div class="map-empty">Mapa indisponível.</div>';
  }

  (async () => {
    const db = PNC.db();
    if (!id || !db) { root.innerHTML = `<div class="empty-card"><strong>Anúncio não encontrado</strong><a href="/">Voltar ao início</a></div>`; return; }
    const [{ data, error }, u] = await Promise.all([
      db.from(MODE.table).select(`*,${MODE.schedule}(weekday,opens_at,closes_at),${CAR ? 'car_photos' : 'listing_photos'}(storage_path,position)`).eq('id', id).maybeSingle(),
      PNC.currentUser(),
    ]);
    user = u;
    if (error || !data) { root.innerHTML = `<div class="empty-card"><strong>Anúncio não encontrado</strong>Pode ter sido retirado. <a href="/">Voltar ao início</a></div>`; return; }
    L0 = data;
    await loadReviews();
    render();
  })();
})();
