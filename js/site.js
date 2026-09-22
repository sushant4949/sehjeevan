(function () {
  const { D, EDITIONS, byId, sessionsById, photoStyle, esc, bio, fmtDate, sessionTitle, matches, store } = window.SJ;
  const $ = (s) => document.querySelector(s);

  const state = {
    q: '',
    edition: 'all',
    picked: store.get('sj.picked', []).filter((id) => byId[id]),
  };

  const img = (src, alt = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy" style="${photoStyle(src)}">`;
  const tags = (p) => p.editions.map((e) => `<span class="chip ${e}">${EDITIONS[e].short}</span>`).join('');

  $('#stat-people').textContent = D.storytellers.length;
  $('#stat-sessions').textContent = D.sessions.length;

  /* ---------- Hero mosaic ---------- */
  (function mosaic() {
    const spots = [
      [34, 30, 34], [4, 8, 24], [70, 4, 22], [72, 44, 26], [6, 50, 26], [40, 70, 24], [76, 76, 18], [2, 82, 16], [58, 26, 14], [24, 4, 14],
    ];
    const pool = D.storytellers.slice().sort(() => Math.random() - 0.5);
    $('#mosaic').innerHTML = spots.map(([x, y, s], i) => {
      const p = pool[i];
      return `<div class="bubble" data-id="${p.id}" title="${esc(p.name)}" style="left:${x}%;top:${y}%;width:${s}%;height:${s}%;animation-delay:${-i * 0.7}s">${img(p.photos[0], p.name)}</div>`;
    }).join('');
    $('#mosaic').addEventListener('click', (e) => {
      const b = e.target.closest('.bubble');
      if (b) openProfile(b.dataset.id);
    });
  })();

  /* ---------- Filters ---------- */
  const filterDefs = [['all', 'All'], ...Object.entries(EDITIONS).map(([k, v]) => [k, v.short])];
  $('#filters').innerHTML = filterDefs.map(([k, l]) => `<button type="button" data-ed="${k}" aria-pressed="${k === state.edition}">${l}</button>`).join('');
  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.edition = b.dataset.ed;
    $('#filters').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    renderGrid();
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim(); renderGrid(); });

  /* ---------- Grid ---------- */
  function renderGrid() {
    const list = D.storytellers.filter((p) => (state.edition === 'all' || p.editions.includes(state.edition)) && matches(p, state.q));
    $('#count').textContent = `${list.length} of ${D.storytellers.length}`;
    $('#empty').hidden = list.length > 0;
    $('#grid').innerHTML = list.map((p) => {
      const picked = state.picked.includes(p.id);
      const n = p.sessions.length;
      return `<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="Read about ${esc(p.name)}">
        <div class="frame">${img(p.photos[0], p.name)}</div>
        ${n > 1 ? `<span class="times">${n} sessions</span>` : ''}
        <button class="pick" type="button" data-pick="${p.id}" aria-pressed="${picked}">${picked ? '✓ On poster' : '+ Poster'}</button>
        <h3>${esc(p.name)}</h3>
        ${p.nameHi ? `<div class="hi-name">${esc(p.nameHi)}</div>` : ''}
        <p class="snippet">${esc(bio(p, 'hi')[0] || '')}</p>
        <div class="tags">${tags(p)}</div>
      </article>`;
    }).join('');
  }
  $('#grid').addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { togglePick(pick.dataset.pick); return; }
    const card = e.target.closest('.card');
    if (card) openProfile(card.dataset.id);
  });
  $('#grid').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); openProfile(e.target.dataset.id); }
  });

  /* ---------- Selection tray ---------- */
  function togglePick(id) {
    const i = state.picked.indexOf(id);
    if (i >= 0) state.picked.splice(i, 1); else state.picked.push(id);
    store.set('sj.picked', state.picked);
    renderGrid();
    renderTray();
    if (dlg.open && dlg.dataset.id === id) openProfile(id, true);
  }
  function renderTray() {
    const n = state.picked.length;
    $('#tray').hidden = n === 0;
    if (!n) return;
    $('#trayFaces').innerHTML = state.picked.slice(0, 6).map((id) => `<span class="ph">${img(byId[id].photos[0])}</span>`).join('');
    $('#trayLabel').textContent = `${n} storyteller${n > 1 ? 's' : ''} selected`;
    $('#trayGo').href = `poster.html?ids=${state.picked.join(',')}`;
  }
  $('#trayClear').addEventListener('click', () => { state.picked = []; store.set('sj.picked', []); renderGrid(); renderTray(); });

  /* ---------- Profile dialog ---------- */
  const dlg = $('#profile');
  function openProfile(id, keepLang) {
    const p = byId[id];
    const langs = ['hi', 'en'].filter((l) => p.bios[l]);
    let lang = keepLang && dlg.dataset.lang && p.bios[dlg.dataset.lang] ? dlg.dataset.lang : langs[0];
    let photo = 0;
    const picked = state.picked.includes(id);
    const sessions = p.sessions.map((sid) => sessionsById[sid]).sort((a, b) => b.date.localeCompare(a.date));

    function draw() {
      dlg.dataset.id = id; dlg.dataset.lang = lang;
      $('#profileBody').innerHTML = `
        <aside class="profile-side">
          <div class="frame">${img(p.photos[photo], p.name)}</div>
          ${p.photos.length > 1 ? `<div class="thumbs">${p.photos.map((s, i) => `<button type="button" data-photo="${i}" aria-pressed="${i === photo}" aria-label="Photo ${i + 1}">${img(s)}</button>`).join('')}</div>` : ''}
        </aside>
        <div class="profile-main">
          <h2>${esc(p.name)}</h2>
          ${p.nameHi ? `<div class="hi-name">${esc(p.nameHi)}</div>` : ''}
          <div class="tags">${tags(p)}</div>
          ${langs.length > 1 ? `<div class="lang-toggle" role="group" aria-label="Bio language">${langs.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${l === 'hi' ? 'हिंदी' : 'English'}</button>`).join('')}</div>` : ''}
          <div class="bio" lang="${lang}">${bio(p, lang).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
          <h5>Appeared in</h5>
          <ul class="appear">${sessions.map((s) => `<li><b>${fmtDate(s.date)}</b><span>${esc(sessionTitle(s))}${s.theme && s.series !== 'poetry' ? ` — ${esc(s.theme)}` : ''}</span></li>`).join('')}</ul>
          <div class="profile-actions">
            <button class="btn ${picked ? 'btn-ghost' : 'btn-green'}" type="button" data-pick="${id}">${picked ? 'Remove from poster' : '+ Add to poster'}</button>
            <a class="btn btn-primary" href="poster.html?ids=${[...new Set([...state.picked, id])].join(',')}">Make a poster →</a>
          </div>
        </div>`;
    }
    draw();
    $('#profileBody').onclick = (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.lang) { lang = t.dataset.lang; draw(); }
      else if (t.dataset.photo) { photo = +t.dataset.photo; draw(); }
      else if (t.dataset.pick) togglePick(t.dataset.pick);
    };
    if (!dlg.open) dlg.showModal();
  }
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  /* ---------- Timeline ---------- */
  const sessions = D.sessions.slice().sort((a, b) => b.date.localeCompare(a.date));
  $('#timeline').innerHTML = sessions.map((s) => {
    const [y, m, d] = s.date.split('-');
    const mon = fmtDate(s.date, { month: 'short' });
    return `<li class="session ${s.series} reveal">
      <div class="when"><b>${+d}</b><span>${mon} ${y.slice(2)}</span></div>
      <h4>${esc(sessionTitle(s))}</h4>
      <div class="theme">${esc(s.theme && s.series !== 'poetry' ? s.theme : fmtDate(s.date, { weekday: 'long' }))} · ${esc(s.time)}</div>
      <div class="faces">${s.people.map((id) => `<button class="face" type="button" data-id="${id}"><span class="ph">${img(byId[id].photos[0])}</span><span>${esc(byId[id].name)}</span></button>`).join('')}</div>
    </li>`;
  }).join('');
  $('#timeline').addEventListener('click', (e) => { const f = e.target.closest('.face'); if (f) openProfile(f.dataset.id); });

  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  renderGrid();
  renderTray();
})();
