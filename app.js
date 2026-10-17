(() => {
  const V = window.VIDEOS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = Object.fromEntries(V.map(v => [v.id, v]));
  const CATS = {
    tutti: 'Tutti',
    interviste: 'Interviste e media',
    negativita: 'Negatività',
    tutela: 'Famiglia e tutela',
    ringraziamenti: 'Ringraziamenti',
    archivio: 'Archivio TV'
  };
  const thumb = (id, q = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const embed = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const fmtDate = d => {
    const [y, m, g] = d.split('-').map(Number);
    return new Date(y, m - 1, g).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
  };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nice = t => {
    // ammorbidisce i titoli tutti in maiuscolo
    const out = t.replace(/[A-ZÀ-Ý][A-ZÀ-Ý ,']*[A-ZÀ-Ý]/g, w => w === 'STORYTIME' ? 'Storytime' : w.toLowerCase()).trim();
    return out[0].toUpperCase() + out.slice(1);
  };

  /* ---------- Tema ---------- */
  const root = document.documentElement;
  const tBtn = $('[data-theme-toggle]');
  tBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    tBtn.setAttribute('aria-label', next === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro');
    tBtn.innerHTML = next === 'dark'
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  });

  /* ---------- Header e menu ---------- */
  const header = $('.header');
  const nav = $('.nav');
  const menuBtn = $('[data-menu]');
  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 10), { passive: true });
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', false); }));
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secObs.observe(s));

  /* ---------- Reveal ---------- */
  const rObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rObs.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => rObs.observe(el));

  /* ---------- Contatori ---------- */
  const cObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * k).toFixed(dec).replace('.', ',') + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cObs.unobserve(el);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cObs.observe(el));

  /* ---------- Prossima diretta (martedì e mercoledì 23:30, lunedì 00:30, ora di Roma) ---------- */
  const romeNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short'
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  };
  const SLOTS = { 1: [0, 30], 2: [23, 30], 3: [23, 30] }; // lunedì 00:30, martedì e mercoledì 23:30
  const LIVE_MIN = 60;
  const onair = $('#onair');
  const tick = () => {
    const now = romeNow();
    let live = false, next = null;
    for (let i = -1; i <= 8; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const sl = SLOTS[d.getDay()]; if (!sl) continue;
      d.setHours(sl[0], sl[1], 0, 0);
      const diff = now - d;
      if (diff >= 0 && diff < LIVE_MIN * 60000) { live = true; next = d; break; }
      if (d > now) { next = d; break; }
    }
    onair.classList.toggle('is-live', live);
    $('#onairLabel').textContent = live ? 'In onda ora' : 'Prossima diretta';
    const day = next.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#onairWhen').textContent = live ? 'Sintonizzati su Canale Italia' : `${day[0].toUpperCase() + day.slice(1)} · ore ${String(next.getHours()).padStart(2,'0')}:${String(next.getMinutes()).padStart(2,'0')}`;
    const ms = live ? 0 : next - now;
    const s = Math.floor(ms / 1000);
    const u = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    $$('#onairCount b').forEach(b => { const k = b.dataset.u; b.textContent = k === 'd' ? u[k] : String(u[k]).padStart(2, '0'); });
  };
  tick(); setInterval(tick, 1000);

  /* ---------- Video in evidenza ---------- */
  const FEAT = ['4SUwoYxFHzM', 'Z0r-XPaeGmE', '5kvQfKarcAE', 'B0LTKYNnd9s'];
  const SHORT = {
    '4SUwoYxFHzM': 'Christopher ospite al programma Happy Hour',
    'Z0r-XPaeGmE': 'Ospite del programma radiofonico Storytime',
    '5kvQfKarcAE': 'Christopher dalla parte del cliente',
    'B0LTKYNnd9s': 'Le varie tipologie di maleficio'
  };
  const feature = $('#feature');
  const strip = $('#featureStrip');
  const metaLine = v => `${CATS[v.c]} · ${v.dur} · ${v.vl} visualizzazioni`;
  strip.innerHTML = FEAT.map((id, i) => `<button aria-pressed="${i === 0}" data-feat="${id}" aria-label="Metti in evidenza: ${esc(byId[id].t)}"><img src="${thumb(id, 'mqdefault')}" alt="" loading="lazy"></button>`).join('');
  const setFeature = id => {
    const v = byId[id];
    feature.classList.remove('is-playing');
    feature.querySelector('iframe')?.remove();
    const poster = feature.querySelector('.feature__poster');
    poster.hidden = false;
    poster.dataset.play = id;
    const im = poster.querySelector('img');
    im.src = thumb(id, id === 'Z0r-XPaeGmE' ? 'maxresdefault' : 'hqdefault');
    poster.querySelector('img').alt = v.t;
    $('#featureTitle').textContent = SHORT[id] || nice(v.t);
    $('#featureSub').textContent = metaLine(v);
    $$('button', strip).forEach(b => b.setAttribute('aria-pressed', b.dataset.feat === id));
  };
  setFeature(FEAT[0]);
  strip.addEventListener('click', e => { const b = e.target.closest('[data-feat]'); if (b) setFeature(b.dataset.feat); });
  feature.querySelector('.feature__poster').addEventListener('click', e => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.play;
    const f = document.createElement('iframe');
    f.src = embed(id); f.title = byId[id].t;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    feature.appendChild(f);
    feature.classList.add('is-playing');
    e.currentTarget.hidden = true;
  });

  /* ---------- Videoteca ---------- */
  const state = { cat: 'tutti', q: '', sort: 'recent', limit: 9 };
  const chips = $('#chips');
  const counts = V.reduce((a, v) => (a[v.c] = (a[v.c] || 0) + 1, a), { tutti: V.length });
  chips.innerHTML = Object.entries(CATS).map(([k, l]) =>
    `<button class="chip" role="tab" data-cat="${k}" aria-selected="${k === 'tutti'}">${l}<span>${counts[k] || 0}</span></button>`).join('');
  const card = v => `
    <button class="card" data-play="${v.id}" aria-label="Guarda: ${esc(v.t)}">
      <div class="card__thumb">
        <img src="${thumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        <span class="card__cat">${CATS[v.c]}</span>
        <span class="card__dur">${v.dur}</span>
        <span class="play-ring" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
      </div>
      <div class="card__title">${esc(nice(v.t))}</div>
      <div class="card__meta">${v.vl} visualizzazioni · ${fmtDate(v.d)}</div>
    </button>`;
  let current = [];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const render = () => {
    const q = norm(state.q.trim());
    let list = V.filter(v => (state.cat === 'tutti' || v.c === state.cat) && (!q || norm(v.t + ' ' + v.desc + ' ' + CATS[v.c]).includes(q)));
    list.sort(state.sort === 'views' ? (a, b) => b.v - a.v : state.sort === 'old' ? (a, b) => a.d.localeCompare(b.d) : (a, b) => b.d.localeCompare(a.d));
    current = list;
    const shown = list.slice(0, state.limit);
    $('#grid').innerHTML = shown.length ? shown.map(card).join('')
      : `<div class="empty">Nessun video trovato per “${esc(state.q)}”. Prova un'altra parola oppure <a href="https://www.youtube.com/@studiochristopher5926/search?query=${encodeURIComponent(state.q)}" target="_blank" rel="noopener">cerca sul canale YouTube</a>.</div>`;
    $('#results').textContent = list.length ? `${Math.min(state.limit, list.length)} di ${list.length} video` : '';
    $('#more').hidden = list.length <= state.limit;
  };
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = b.dataset.cat; state.limit = 9;
    $$('.chip', chips).forEach(c => c.setAttribute('aria-selected', c === b));
    render();
  });
  let tmr;
  $('#search').addEventListener('input', e => { clearTimeout(tmr); tmr = setTimeout(() => { state.q = e.target.value; state.limit = 9; render(); }, 150); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#more').addEventListener('click', () => { state.limit += 9; render(); });
  render();

  /* ---------- Testimonianze ---------- */
  const T = V.filter(v => v.c === 'ringraziamenti').sort((a, b) => b.v - a.v);
  $('#testi').innerHTML = T.map(card).join('');

  /* ---------- Player modale ---------- */
  const dlg = $('#player');
  let queue = V, idx = 0;
  const open = (id, list) => {
    queue = list && list.some(v => v.id === id) ? list : V;
    idx = queue.findIndex(v => v.id === id);
    show();
    if (!dlg.open) dlg.showModal();
  };
  const show = () => {
    const v = queue[idx];
    $('#playerFrame').innerHTML = `<iframe src="${embed(v.id)}" title="${esc(v.t)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    $('#playerCat').textContent = CATS[v.c];
    $('#playerTitle').textContent = nice(v.t);
    $('#playerMeta').textContent = `${v.dur} · ${v.vl} visualizzazioni · ${fmtDate(v.d)}${v.desc ? ' — ' + v.desc.split('\n')[0] : ''}`;
    $('#playerYt').href = `https://www.youtube.com/watch?v=${v.id}`;
    const nexts = [...queue.slice(idx + 1), ...queue.slice(0, idx)].slice(0, 8);
    $('#queue').innerHTML = nexts.map(n => `<button data-q="${n.id}"><img src="${thumb(n.id, 'mqdefault')}" alt="" loading="lazy"><span>${esc(nice(n.t))}</span></button>`).join('');
  };
  const close = () => { dlg.close(); };
  dlg.addEventListener('close', () => { $('#playerFrame').innerHTML = ''; });
  $('#close').addEventListener('click', close);
  $('#prev').addEventListener('click', () => { idx = (idx - 1 + queue.length) % queue.length; show(); });
  $('#next').addEventListener('click', () => { idx = (idx + 1) % queue.length; show(); });
  $('#queue').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { idx = queue.findIndex(v => v.id === b.dataset.q); show(); } });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') $('#next').click();
    if (e.key === 'ArrowLeft') $('#prev').click();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-play]');
    if (!b || b.classList.contains('feature__poster')) return;
    const inTesti = b.closest('#testi');
    const inGrid = b.closest('#grid');
    open(b.dataset.play, inTesti ? T : inGrid ? current : V);
  });


  /* ---------- Numerazione Canale Italia ---------- */
  const LCN_N = {"Valle d'Aosta": 11, "Piemonte": 18, "Lombardia": 71, "Trento": 17, "Bolzano": 13, "Friuli": 17, "Sardegna": 16, "Veneto": 12, "Emilia Romagna": 71, "Molise": 19, "Abruzzo": 19, "Marche": 14, "Puglia": 71, "Calabria": 19, "Sicilia": 71, "Umbria": 14, "Lazio": 71, "Campania": 71, "Liguria": 18, "Toscana": 71};
  const LCN_R = {"Sardegna": 17, "Piemonte": 71, "Emilia Romagna": 83, "Lombardia": 77, "Umbria": 16};
  const lcn = $('#lcn');
  $$('[data-lcn-open]').forEach(b => b.addEventListener('click', () => lcn.showModal()));
  $('[data-lcn-close]').addEventListener('click', () => lcn.close());
  lcn.addEventListener('click', e => { if (e.target === lcn) lcn.close(); });
  $('#lcnRegion').addEventListener('change', e => {
    const r = e.target.value, out = $('#lcnResult');
    $$('.lcn__table tbody tr', lcn).forEach(tr => tr.classList.toggle('is-hit', tr.firstElementChild.textContent === r));
    if (!r) { out.innerHTML = '<span class="lcn__hint">Scegli la regione per vedere su quale numero trovare Canale Italia.</span>'; return; }
    let html = `<div class="lcn__num"><small>Nazionale</small><b>${LCN_N[r]}</b></div>`;
    if (LCN_R[r]) html += `<div class="lcn__num"><small>Regionale</small><b>${LCN_R[r]}</b></div>`;
    html += `<div class="lcn__num"><small>Sky</small><b>913</b></div>`;
    out.innerHTML = html;
  });


  /* ---------- Principato di Monaco ---------- */
  const mc = $('#mc');
  $$('[data-mc-open]').forEach(b => b.addEventListener('click', () => mc.showModal()));
  $('[data-mc-close]').addEventListener('click', () => mc.close());
  mc.addEventListener('click', e => { if (e.target === mc) mc.close(); });
  const mcPlayer = $('#mcPlayer'), mcPoster = mcPlayer.innerHTML;
  mcPlayer.addEventListener('click', e => {
    if (!e.target.closest('[data-mc-play]')) return;
    mcPlayer.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/HJ3JgN9h5YA?autoplay=1&rel=0" title="Sigla ufficiale dell\'inizio dell\'attività nel Principato di Monaco" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  });
  mc.addEventListener('close', () => { mcPlayer.innerHTML = mcPoster; });


  /* ---------- Aiuto a distanza ---------- */
  const rm = $('#rm');
  $$('[data-rm-open]').forEach(b => b.addEventListener('click', () => rm.showModal()));
  $('[data-rm-close]').addEventListener('click', () => rm.close());
  rm.addEventListener('click', e => { if (e.target === rm) rm.close(); });
  const rmPlayer = $('#rmPlayer'), rmPoster = rmPlayer.innerHTML;
  rmPlayer.addEventListener('click', e => {
    if (!e.target.closest('[data-rm-play]')) return;
    rmPlayer.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/2HiM67qNCjM?autoplay=1&rel=0" title="Operatività svolta a distanza per il cliente" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  });
  rm.addEventListener('close', () => { rmPlayer.innerHTML = rmPoster; });


  /* ---------- Privacy Policy ---------- */
  const pv = $('#pv');
  $$('[data-pv-open]').forEach(b => b.addEventListener('click', () => pv.showModal()));
  $('[data-pv-close]').addEventListener('click', () => pv.close());
  pv.addEventListener('click', e => { if (e.target === pv) pv.close(); });
  if (location.hash === '#privacy') pv.showModal();

  /* ---------- Modulo -> WhatsApp ---------- */
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, nome = f.nome.value.trim(), msg = f.msg.value.trim(), tema = f.tema.value;
    const err = $('#formErr');
    if (!nome || !msg) { err.textContent = 'Inserisci il tuo nome e un breve messaggio.'; (nome ? f.msg : f.nome).focus(); return; }
    err.textContent = '';
    const text = `Buongiorno Christopher, sono ${nome}.\nArgomento: ${tema}\n\n${msg}`;
    window.open(`https://api.whatsapp.com/send?phone=393937272376&text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();

/* ---------- Lingue (Google Traduttore) ---------- */
(() => {
  const FLAG = {it:'it',en:'gb',es:'es',fr:'fr',pt:'pt',ro:'ro','ro-md':'md',hu:'hu',sl:'si',de:'de',sv:'se',nl:'nl',el:'gr',lt:'lt',sr:'rs',sq:'al',bs:'ba'};
  const saved = (() => { try { return localStorage.getItem('sc-lang'); } catch (e) { return null; } })();
  const m = document.cookie.match(/googtrans=\/it\/([a-zA-Z-]+)/);
  let cur = m ? (m[1] === 'ro' && saved === 'ro-md' ? 'ro-md' : m[1]) : 'it';
  const btn = document.querySelector('[data-lang-toggle]'), panel = document.querySelector('.lang__panel'), flag = document.querySelector('[data-lang-flag]');
  const mark = () => {
    flag.src = 'assets/flags/' + (FLAG[cur] || 'it') + '.svg';
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('is-on', b.dataset.lang === cur));
  };
  mark();
  const setCookie = v => {
    const host = location.hostname, exp = v ? '' : ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const val = v ? '/it/' + v : '';
    document.cookie = 'googtrans=' + val + ';path=/' + exp;
    if (host.includes('.')) document.cookie = 'googtrans=' + val + ';path=/;domain=.' + host.split('.').slice(-2).join('.') + exp;
  };
  const choose = code => {
    try { localStorage.setItem('sc-lang', code); } catch (e) {}
    const g = code === 'ro-md' ? 'ro' : code;
    if (g === 'it') { setCookie(''); location.reload(); return; }
    setCookie(g);
    cur = code; mark(); close();
    const combo = document.querySelector('.goog-te-combo');
    if (combo) { combo.value = g; combo.dispatchEvent(new Event('change')); }
    else location.reload();
  };
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => { e.stopPropagation(); panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.lang')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => choose(b.dataset.lang)));
  window.gtInit = () => {
    new google.translate.TranslateElement({ pageLanguage: 'it', includedLanguages: 'en,es,fr,pt,ro,hu,sl,de,sv,nl,el,lt,sr,sq,bs', autoDisplay: false }, 'gt');
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=gtInit';
  s.async = true; document.body.appendChild(s);
})();
