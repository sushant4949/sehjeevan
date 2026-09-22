/* Home page and the full storyteller directory share this script; each block runs only if its element exists. */
(function () {
  const { D, EDITIONS, byId, sessionsById, photoStyle, esc, bio, fmtDate, sessionTitle, matches } = window.SJ;
  const $ = (s) => document.querySelector(s);
  const YT = 'https://www.youtube.com/@Sehjeevan/videos';

  const img = (src, alt = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy" style="${photoStyle(src)}">`;
  const tags = (p) => p.editions.map((e) => `<span class="chip ${e}">${EDITIONS[e].short}</span>`).join('');

  $('#stat-people') && ($('#stat-people').textContent = D.storytellers.length);
  $('#stat-sessions') && ($('#stat-sessions').textContent = D.sessions.length);
  $('#allCount') && ($('#allCount').textContent = D.storytellers.length);

  /* ---------- Hero mosaic ---------- */
  if ($('#mosaic')) {
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
  }

  /* ---------- Cards ---------- */
  function card(p) {
    const n = p.sessions.length;
    return `<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="Read about ${esc(p.name)}">
      <div class="frame">${img(p.photos[0], p.name)}${n > 1 ? `<span class="times">${n} sessions</span>` : ''}</div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        ${p.nameHi ? `<div class="hi-name">${esc(p.nameHi)}</div>` : ''}
        <p class="snippet">${esc(bio(p, 'hi')[0] || '')}</p>
        <div class="tags">${tags(p)}</div>
      </div>
    </article>`;
  }
  function wireGrid(grid) {
    grid.addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) openProfile(c.dataset.id); });
    grid.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); openProfile(e.target.dataset.id); }
    });
  }

  // Home: exactly two rows, however many columns the screen fits
  const featured = $('#featured');
  if (featured) {
    const order = D.storytellers.slice().sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));
    let lastCols = 0;
    const fill = () => {
      const cols = getComputedStyle(featured).gridTemplateColumns.split(' ').length || 4;
      if (cols === lastCols) return;
      lastCols = cols;
      featured.innerHTML = order.slice(0, cols * 2).map(card).join('');
    };
    fill();
    new ResizeObserver(fill).observe(featured);
    wireGrid(featured);
  }

  // Directory page: search + edition filters
  const grid = $('#grid');
  if (grid) {
    const state = { q: '', edition: new URLSearchParams(location.search).get('edition') || 'all' };
    if (state.edition !== 'all' && !EDITIONS[state.edition]) state.edition = 'all';
    const filterDefs = [['all', 'All'], ...Object.entries(EDITIONS).map(([k, v]) => [k, v.short])];
    $('#filters').innerHTML = filterDefs.map(([k, l]) => `<button type="button" data-ed="${k}" aria-pressed="${k === state.edition}">${l}</button>`).join('');
    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.edition = b.dataset.ed;
      $('#filters').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      render();
    });
    $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
    function render() {
      const list = D.storytellers.filter((p) => (state.edition === 'all' || p.editions.includes(state.edition)) && matches(p, state.q));
      $('#count').textContent = `${list.length} of ${D.storytellers.length}`;
      $('#empty').hidden = list.length > 0;
      grid.innerHTML = list.map(card).join('');
    }
    render();
    wireGrid(grid);
  }

  /* ---------- Profile dialog ---------- */
  const dlg = $('#profile');
  function openProfile(id) {
    const p = byId[id];
    const langs = ['hi', 'en'].filter((l) => p.bios[l]);
    let lang = langs[0];
    let photo = 0;
    const sessions = p.sessions.map((sid) => sessionsById[sid]).sort((a, b) => b.date.localeCompare(a.date));

    function draw() {
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
          <ul class="appear">${sessions.map((s) => `<li><b>${fmtDate(s.date)}</b><span>${esc(sessionTitle(s))}${s.theme && s.series !== 'poetry' ? ` · ${esc(s.theme)}` : ''}</span></li>`).join('')}</ul>
          <div class="profile-actions">
            <a class="btn btn-yt" href="${YT}" target="_blank" rel="noopener">${ytIcon()} Listen on YouTube</a>
          </div>
        </div>`;
    }
    draw();
    $('#profileBody').onclick = (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.lang) { lang = t.dataset.lang; draw(); }
      else if (t.dataset.photo) { photo = +t.dataset.photo; draw(); }
    };
    if (!dlg.open) dlg.showModal();
  }
  dlg && dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  function ytIcon() {
    return '<svg class="yt-ico" viewBox="0 0 28 20" width="24" height="17" aria-hidden="true"><rect width="28" height="20" rx="5" fill="#FF0000"/><path d="M11 5.5v9l7.8-4.5L11 5.5Z" fill="#fff"/></svg>';
  }


  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
})();
