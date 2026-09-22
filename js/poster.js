(function () {
  const { D, EDITIONS, byId, photoStyle, esc, bio, matches, store } = window.SJ;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const poster = $('#poster');

  /* ---------- edition themes (mirrors the .ed-* poster classes) ---------- */
  const THEME = {
    hindi:    { bg: '#f7f2e8', tile: '#3f8f4e', badge: '#9b2a2b', hi: 'हिंदी संस्करण', desc: 'Hindi bios · green date card, leaves' },
    english:  { bg: '#f5f3ee', tile: '#9b2a2b', badge: '#1f5a35', hi: 'अंग्रेज़ी संस्करण', desc: 'English bios · red date card' },
    children: { bg: '#fbf3df', tile: '#e8913a', badge: '#3f8f4e', hi: 'बाल संस्करण', desc: 'Warm cream · kids illustration' },
    poetry:   { bg: '#f8efe9', tile: '#7a2224', badge: '#7a2224', hi: 'कविता संवाद', desc: 'Kavita Samvad · maroon accents' },
  };
  const TITLES = {
    stories: { t1: 'The World of', t2: 'Stories' },
    poetry:  { t1: 'The World of', t2: 'Poetry' },
  };
  const STEPS = ['Edition', 'When & where', 'Storytellers', 'Finish'];
  const VENUES = { ONLINE: ['Google Meet', 'Zoom', 'YouTube Live'], 'IN PERSON': [], HYBRID: ['Google Meet', 'Zoom'] };
  const REGS = ['Free registration', 'All are welcome', 'Free entry'];

  function nextSunday() {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const DEFAULTS = () => ({
    v: 2, step: 0, edition: 'hindi',
    date: nextSunday(), day: '', start: '16:30', end: '18:00', tz: 'IST',
    mode: 'ONLINE', venue: 'Google Meet', reg: 'Free registration',
    hasLink: false, link: '', qr: true, hasSession: false, session: '',
    t1: TITLES.stories.t1, t2: TITLES.stories.t2, bioLen: 'short', shape: 'rounded', showHi: true,
    note: '',
    q: 2, scope: 'edition', people: [],
  });

  const langFor = (edition, p) => {
    const want = edition === 'english' ? 'en' : 'hi';
    return p.bios[want] ? want : Object.keys(p.bios)[0] || want;
  };
  const entry = (id, edition) => ({ id, lang: langFor(edition, byId[id]), photo: 0, custom: null, nameHi: null });

  /* ---------- people added in this browser (never uploaded anywhere) ---------- */
  const CUSTOM_KEY = 'sj.custom';
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]') || []; } catch (e) { custom = []; }
  custom.forEach((p) => { byId[p.id] = p; });
  function saveCustom() {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); return true; } catch (e) { return false; }
  }

  // saved draft (v2 only: older drafts had a different shape), then ?ids= from the directory
  const saved = store.get('sj.poster', null);
  let S = Object.assign(DEFAULTS(), saved && saved.v === 2 ? saved : {});
  S.people = (S.people || []).filter((x) => byId[x.id]);
  // the old default closing line duplicated the invite line that is now always on the poster
  if (S.note === "We'd love to have you! Tell us you're coming and we'll send you the joining link.") S.note = '';
  const urlIds = (new URLSearchParams(location.search).get('ids') || '').split(',').filter((id) => byId[id]);
  if (urlIds.length) {
    S.people = urlIds.map((id) => S.people.find((x) => x.id === id) || entry(id, S.edition));
    history.replaceState(null, '', location.pathname);
  }
  let editing = null; // index of the storyteller whose bio is open for editing

  /* ---------- formatting ---------- */
  function dateBits() {
    if (!S.date) return null;
    const [y, m, d] = S.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      wd: (S.day.trim() || dt.toLocaleDateString('en-GB', { weekday: 'long' })),
      dd: String(d).padStart(2, '0'),
      my: `${dt.toLocaleDateString('en-GB', { month: 'short' })} ${y}`,
    };
  }
  function clock(t) {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return { txt: `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}`, ap: h < 12 ? 'AM' : 'PM' };
  }
  function timeLine() {
    const a = clock(S.start), b = clock(S.end);
    if (!a) return 'Time TBA';
    if (!b) return `${a.txt} ${a.ap}`;
    return a.ap === b.ap ? `${a.txt} – ${b.txt} ${b.ap}` : `${a.txt} ${a.ap} – ${b.txt} ${b.ap}`;
  }
  function whereLine() {
    const v = S.venue.trim();
    if (S.mode === 'ONLINE') return v ? `Online · ${v}` : 'Online';
    if (S.mode === 'HYBRID') return v ? `Hybrid · ${v}` : 'Hybrid';
    return v || 'Venue TBA';
  }
  function bioParas(x) {
    const p = byId[x.id];
    if (x.custom != null) return x.custom.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
    const all = bio(p, x.lang);
    if (S.bioLen === 'full') return all;
    // short: first paragraph, plus the next one if the first is only a line
    return all[0] && all[0].length < 140 && all[1] ? all.slice(0, 2) : all.slice(0, 1);
  }

  const LEAVES = `<svg viewBox="0 0 200 200" fill="currentColor" aria-hidden="true">
    <path d="M100 190C60 150 40 100 70 40c40 30 60 90 30 150Z"/>
    <path d="M104 186c10-50 40-86 88-96-6 50-40 86-88 96Z"/><path d="M96 186C80 140 44 116 4 116c14 42 50 66 92 70Z"/></svg>`;

  /* ---------- poster ---------- */
  function renderPoster() {
    const th = THEME[S.edition];
    const dt = dateBits();
    const people = S.people;
    let qr = '';
    if (S.hasLink && S.link && S.qr && window.qrcode) {
      try { const q = qrcode(0, 'M'); q.addData(S.link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { qr = ''; }
    }
    poster.className = `poster ed-${S.edition} ${S.shape === 'circle' ? 'circle' : ''}`;
    poster.style.setProperty('--bio', `${people.length >= 4 ? 17 : people.length <= 2 ? 21 : 19}px`); // whole px: html-to-image floors sizes

    const cards = people.map((x) => {
      const p = byId[x.id];
      const src = p.photos[x.photo] || p.photos[0];
      const paras = S.bioLen === 'none' && x.custom == null ? [] : bioParas(x);
      const hiName = (x.nameHi != null ? x.nameHi : p.nameHi || '').trim();
      const showHi = S.showHi && hiName && hiName !== p.name;
      return `<article class="p-card">
        <div class="p-ph"><img src="${src}" alt="" style="${photoStyle(src)}"></div>
        <div>
          <div class="p-name">${esc(p.name)}${showHi ? `<span class="hi">${esc(hiName)}</span>` : ''}</div>
          ${paras.length ? `<div class="p-bio" lang="${x.lang}">${paras.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
        </div>
      </article>`;
    }).join('');

    poster.innerHTML = `
      <div class="p-grain"></div>
      <div class="p-leaves">${LEAVES}</div>
      <div class="p-leaves low">${LEAVES}</div>
      ${S.edition === 'children' ? '<div class="p-dots"></div>' : ''}
      <div class="p-main">
        <div class="p-hero">
          <div class="p-titles">
            ${S.hasSession && S.session.trim() ? `<div class="p-session">${esc(S.session)}</div>` : ''}
            <div class="p-over">Sehjeevan Foundation presents</div>
            <div class="p-t1">${esc(S.t1)}</div>
            <div class="p-t2">${esc(S.t2)}</div>
            <div class="p-edition">${esc(EDITIONS[S.edition].label)}<span class="hi">${esc(th.hi)}</span></div>
          </div>
          <div class="p-side">
          <img class="p-logo" src="assets/img/sehjeevan-logo.png" alt="Sehjeevan">
          <div class="p-date ${dt ? '' : 'tba'}">
            ${dt ? `<div class="wd">${esc(dt.wd)}</div><div class="dd">${dt.dd}</div><div class="my">${esc(dt.my)}</div>` : '<div class="dd">TBA</div>'}
            <div class="tm">${esc(timeLine())}${S.tz ? `<small>${esc(S.tz)}</small>` : ''}</div>
          </div>
          </div>
        </div>
        ${cards ? `<section class="p-people ${S.bioLen === 'none' ? 'names' : ''}">${cards}</section>` : '<div class="p-empty">Storytellers appear here</div>'}
      </div>
      ${S.edition === 'children' ? '<img class="p-kids" src="assets/img/kids.png" alt="">' : ''}
      <footer class="p-band">
        <svg class="p-wave" viewBox="0 0 1080 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 46V28C160 4 330 -2 520 16s380 32 560 -6V46Z"/></svg>
        <div class="p-band-art"><div class="lf a">${LEAVES}</div><div class="lf b">${LEAVES}</div><div class="lf c">${LEAVES}</div></div>
        <div class="p-band-row">
          <div>
            <div class="p-facts">
              <div class="p-fact"><small>Where</small><b>${esc(whereLine())}</b></div>
              <div class="p-fact"><small>Entry</small><b>${esc(S.reg || 'Free')}</b></div>
            </div>
            <div class="p-invite"><span>Interested? Write to us and we’ll send you an invite.</span><b>sehjeevans@gmail.com</b></div>
            ${S.note.trim() ? `<div class="p-note">${esc(S.note)}</div>` : ''}
            ${S.hasLink && S.link ? `<div class="p-link">${esc(S.link.replace(/^https?:\/\/(www\.)?/, ''))}</div>` : ''}
          </div>
          ${qr ? `<div class="p-qr"><div class="box">${qr}</div><small>Scan to register</small></div>` : ''}
        </div>
        <div class="p-sign"><span>Sehjeevan Foundation</span><span>Alternatives of Life with Sustainability &amp; Harmony</span></div>
      </footer>`;
    fitText();
    fitPreview();
  }

  // shrink one-line titles until they fit the column
  function fitText() {
    const col = poster.querySelector('.p-titles');
    if (!col) return;
    poster.querySelectorAll('.p-t1, .p-t2').forEach((el) => {
      el.style.fontSize = '';
      let z = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > col.clientWidth + 1 && z > 30) el.style.fontSize = `${(z -= 2)}px`;
    });
  }

  /* ---------- preview: fit the whole poster in the right half ---------- */
  const box = $('#stageBox'), scaleBox = $('#posterScale');
  function fitPreview() {
    const h = poster.offsetHeight;
    const k = Math.min(box.clientWidth / 1080, box.clientHeight / h, 0.62);
    poster.style.transform = `scale(${k})`;
    scaleBox.style.width = `${1080 * k}px`;
    scaleBox.style.height = `${h * k}px`;
    $('#stageMeta').textContent = `${EDITIONS[S.edition].label} · 1080 × ${h}px${h === 1527 ? ' (A4)' : ''}`;
  }
  new ResizeObserver(fitPreview).observe(box);
  poster.addEventListener('load', fitPreview, true);

  /* ---------- steps ---------- */
  function showStep(i) {
    S.step = i;
    $$('.step').forEach((el) => { el.hidden = +el.dataset.step !== i; });
    $$('#stepper button').forEach((b) => {
      const n = +b.dataset.step;
      b.toggleAttribute('aria-current', false);
      if (n === i) b.setAttribute('aria-current', 'step');
      b.classList.toggle('done', n < i);
    });
    $('#backBtn').disabled = i === 0;
    $('#nextBtn').hidden = i === STEPS.length - 1;
    if (i < STEPS.length - 1) $('#nextBtn').textContent = `Next: ${STEPS[i + 1]} →`;
    $('.steps').scrollTop = 0;
    if (i === 2) renderPicker();
    save();
  }
  $('#stepper').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showStep(+b.dataset.step); });
  $('#backBtn').addEventListener('click', () => showStep(Math.max(0, S.step - 1)));
  $('#nextBtn').addEventListener('click', () => showStep(Math.min(STEPS.length - 1, S.step + 1)));
  $('#jumpDownload').addEventListener('click', () => {
    showStep(3);
    const d = $('#download');
    d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash');
  });

  /* ---------- step 1: edition ---------- */
  $('#editions').innerHTML = Object.entries(EDITIONS).map(([k, v]) => {
    const t = THEME[k];
    const title = k === 'poetry' ? TITLES.poetry : TITLES.stories;
    return `<button type="button" class="ed" role="radio" data-ed="${k}" aria-checked="false">
      <span class="sw" style="background:${t.bg};color:#9b2a2b"><i style="background:${t.badge}"></i><i style="background:${t.tile}"></i>
        <span class="a">${esc(title.t1)}</span><span class="b" style="color:#3f8f4e">${esc(title.t2)}</span></span>
      <span class="tx"><b>${v.label} <span class="hi">${t.hi}</span></b><small>${t.desc}</small></span>
    </button>`;
  }).join('');
  $('#editions').addEventListener('click', (e) => {
    const b = e.target.closest('.ed');
    if (!b) return;
    const prev = S.edition, next = b.dataset.ed;
    if (prev === next) return;
    // swap the default title between stories and poetry, but keep custom titles
    const from = prev === 'poetry' ? TITLES.poetry : TITLES.stories;
    const to = next === 'poetry' ? TITLES.poetry : TITLES.stories;
    if (S.t1 === from.t1 && S.t2 === from.t2) Object.assign(S, to);
    S.edition = next;
    S.people.forEach((x) => { if (x.custom == null) x.lang = langFor(next, byId[x.id]); });
    syncControls();
    update();
  });

  /* ---------- step 2: when & where ---------- */
  const FIELDS = { date: 'f-date', day: 'f-day', start: 'f-start', end: 'f-end', tz: 'f-tz', venue: 'f-venue', reg: 'f-reg', link: 'f-link', session: 'f-session', t1: 'f-t1', t2: 'f-t2', note: 'f-note' };
  Object.entries(FIELDS).forEach(([k, id]) => {
    $('#' + id).addEventListener('input', (e) => {
      S[k] = e.target.value;
      if (k === 'date') $('#f-day').placeholder = dateBits() ? new Date(S.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long' }) : 'auto';
      if (k === 'venue' || k === 'reg') syncChips();
      update(false);
    });
  });
  $('#modeSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S.mode = b.dataset.mode;
    if (S.mode === 'IN PERSON' && VENUES.ONLINE.includes(S.venue)) S.venue = '';
    if (S.mode !== 'IN PERSON' && !S.venue) S.venue = 'Google Meet';
    syncControls();
    update(false);
  });
  $('#venueSuggest').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.venue = b.dataset.v; syncControls(); update(false); } });
  $('#regSuggest').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.reg = b.dataset.v; syncControls(); update(false); } });
  $('#f-haslink').addEventListener('change', (e) => { S.hasLink = e.target.checked; syncControls(); update(false); if (S.hasLink) $('#f-link').focus(); });
  $('#f-qr').addEventListener('change', (e) => { S.qr = e.target.checked; update(false); });
  $('#f-hassession').addEventListener('change', (e) => { S.hasSession = e.target.checked; syncControls(); update(false); if (S.hasSession) $('#f-session').focus(); });

  function syncChips() {
    $('#venueSuggest').innerHTML = VENUES[S.mode].map((v) => `<button type="button" data-v="${v}" aria-pressed="${S.venue === v}">${v}</button>`).join('');
    $('#regSuggest').innerHTML = REGS.map((v) => `<button type="button" data-v="${v}" aria-pressed="${S.reg === v}">${v}</button>`).join('');
  }
  function syncControls() {
    Object.entries(FIELDS).forEach(([k, id]) => { const el = $('#' + id); if (el.value !== S[k]) el.value = S[k]; });
    $$('#editions .ed').forEach((b) => b.setAttribute('aria-checked', b.dataset.ed === S.edition));
    $$('#modeSeg button').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === S.mode));
    $('#venueLabel').textContent = S.mode === 'ONLINE' ? 'Platform' : S.mode === 'HYBRID' ? 'Venue & platform' : 'Venue';
    $('#f-venue').placeholder = S.mode === 'ONLINE' ? 'Google Meet' : 'e.g. Community library, Bhopal';
    $('#f-haslink').checked = S.hasLink; $('#linkBox').hidden = !S.hasLink; $('#f-qr').checked = S.qr;
    $('#f-hassession').checked = S.hasSession; $('#sessionBox').hidden = !S.hasSession;
    $$('#bioSeg button').forEach((b) => b.setAttribute('aria-checked', b.dataset.bio === S.bioLen));
    $$('#shapeSeg button').forEach((b) => b.setAttribute('aria-checked', b.dataset.shape === S.shape));
    $$('#hiSeg button').forEach((b) => b.setAttribute('aria-checked', (b.dataset.hi === '1') === S.showHi));
    $$('#qualSeg button').forEach((b) => b.setAttribute('aria-checked', +b.dataset.q === +S.q));
    $$('#scopeSeg button').forEach((b) => b.setAttribute('aria-checked', b.dataset.scope === S.scope));
    const d = dateBits();
    $('#f-day').placeholder = d ? new Date(S.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long' }) : 'auto';
    syncChips();
  }

  /* ---------- step 3: storytellers ---------- */
  const ICON = {
    up: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M8 13V3m0 0L3.5 7.5M8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M8 3v10m0 0 4.5-4.5M8 13 3.5 8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    edit: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    remove: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };
  function renderSelected() {
    const n = S.people.length;
    $('#selected').innerHTML = S.people.map((x, i) => {
      const p = byId[x.id];
      const src = p.photos[x.photo] || p.photos[0];
      const hiName = x.nameHi != null ? x.nameHi : (p.nameHi || '');
      return `<li class="sel ${editing === i ? 'open' : ''}" data-i="${i}">
        <div class="sel-row">
          <span class="ph"><img src="${src}" alt="" style="${photoStyle(src)}"></span>
          <div class="sel-names">
            <span class="nm">${esc(p.name)}</span>
            <input class="hi-input" data-hi type="text" lang="hi" value="${esc(hiName)}" placeholder="Hindi name" aria-label="Hindi name for ${esc(p.name)}">
          </div>
          <span class="seg mini" role="group" aria-label="Bio language">
            <button type="button" data-lang="hi" aria-pressed="${x.lang === 'hi'}" ${p.bios.hi ? `title="Hindi bio${(p.translated || []).includes('hi') ? ' (translated)' : ''}"` : 'disabled title="No Hindi bio"'}>हिं</button>
            <button type="button" data-lang="en" aria-pressed="${x.lang === 'en'}" ${p.bios.en ? `title="English bio${(p.translated || []).includes('en') ? ' (translated)' : ''}"` : 'disabled title="No English bio"'}>EN</button>
          </span>
          <span class="tools">
            <button class="icon-btn ${editing === i ? 'on' : ''}" type="button" data-act="edit" aria-label="Edit bio" title="Edit bio">${ICON.edit}</button>
            <button class="icon-btn" type="button" data-act="up" aria-label="Move up" title="Move up" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
            <button class="icon-btn" type="button" data-act="down" aria-label="Move down" title="Move down" ${i === n - 1 ? 'disabled' : ''}>${ICON.down}</button>
            <button class="icon-btn" type="button" data-act="remove" aria-label="Remove ${esc(p.name)}" title="Remove">${ICON.remove}</button>
          </span>
        </div>
        ${editing === i ? `<div class="sel-edit">
          ${p.photos.length > 1 ? `<div class="sel-photos"><span>Photo</span>${p.photos.map((ph, k) => `<button type="button" data-photo="${k}" aria-pressed="${k === x.photo}" aria-label="Photo ${k + 1}"><img src="${ph}" alt="" style="${photoStyle(ph)}"></button>`).join('')}</div>` : ''}
          <textarea data-bio aria-label="Bio for ${esc(p.name)}" lang="${x.lang}">${esc(x.custom != null ? x.custom : bioParas(x).join('\n\n'))}</textarea>
          ${x.custom != null ? '<button class="linkish" type="button" data-act="revert">Restore original bio</button>' : ''}
        </div>` : ''}
      </li>`;
    }).join('');
  }
  $('#selected').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const i = +b.closest('.sel').dataset.i;
    const x = S.people[i];
    const act = b.dataset.act;
    if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1;
      [S.people[i], S.people[j]] = [S.people[j], S.people[i]];
      editing = null;
    } else if (act === 'remove') { S.people.splice(i, 1); editing = null; }
    else if (act === 'edit' && x && byId[x.id].custom) { openPerson(x.id); return; }
    else if (act === 'edit') editing = editing === i ? null : i;
    else if (act === 'revert') { x.custom = null; editing = null; }
    else if (b.dataset.lang) { x.lang = b.dataset.lang; x.custom = null; }
    else if (b.dataset.photo) x.photo = +b.dataset.photo;
    update();
  });
  $('#selected').addEventListener('input', (e) => {
    const x = S.people[+e.target.closest('.sel').dataset.i];
    if (e.target.matches('[data-hi]')) x.nameHi = e.target.value;
    else if (e.target.matches('[data-bio]')) x.custom = e.target.value;
    else return;
    renderPoster();
    save();
  });

  let pq = '';
  function renderPicker() {
    const on = new Set(S.people.map((x) => x.id));
    let list = D.storytellers.filter((p) => matches(p, pq));
    if (S.scope === 'edition') {
      const inEd = list.filter((p) => p.editions.includes(S.edition));
      if (inEd.length) list = inEd;
    }
    const mine = custom.filter((p) => matches(p, pq));
    const tile = (p) => `<button type="button" class="pk" data-id="${p.id}" aria-pressed="${on.has(p.id)}">
      <span class="ph"><img src="${p.photos[0]}" alt="" loading="lazy" style="${photoStyle(p.photos[0])}"></span>
      <b>${esc(p.name)}</b></button>`;
    $('#pickerList').innerHTML = `<button type="button" class="pk pk-add" data-add>
        <span class="ph"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>
        <b>Add someone new</b></button>`
      + mine.map((p) => `<div class="pk-wrap">${tile(p)}<button type="button" class="pk-edit" data-edit="${p.id}">Edit</button></div>`).join('')
      + list.map(tile).join('');
  }
  $('#pq').addEventListener('input', (e) => { pq = e.target.value.trim(); renderPicker(); });
  $('#scopeSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.scope = b.dataset.scope; syncControls(); renderPicker(); save(); } });
  $('#pickerList').addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) { openPerson(null); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) { openPerson(ed.dataset.edit); return; }
    const b = e.target.closest('.pk');
    if (!b) return;
    const i = S.people.findIndex((x) => x.id === b.dataset.id);
    if (i >= 0) S.people.splice(i, 1); else S.people.push(entry(b.dataset.id, S.edition));
    editing = null;
    update();
  });

  /* ---------- add / edit someone new ---------- */
  const pDlg = $('#personDlg');
  let pId = null;      // id being edited, null when adding
  let pPhoto = null;   // processed data URL
  let photoJob = 0;    // bumps on every new file or reopen, so a slow decode can't land in the wrong form

  function openPerson(id) {
    const p = id ? byId[id] : null;
    pId = id;
    pPhoto = p ? p.photos[0] : null;
    photoJob++;
    setBusy(false);
    $('#personTitle').textContent = p ? 'Edit person' : 'Add someone new';
    $('#pdSave').textContent = p ? 'Save changes' : 'Add to poster';
    $('#pdDelete').hidden = !p;
    $('#pdName').value = p ? (p.name === p.nameHi ? '' : p.name) : '';
    $('#pdNameHi').value = p ? p.nameHi || '' : '';
    $('#pdBioEn').value = p && p.bios.en ? p.bios.en.join('\n\n') : '';
    $('#pdBioHi').value = p && p.bios.hi ? p.bios.hi.join('\n\n') : '';
    $('#pdError').textContent = '';
    $('#pdFile').value = '';
    showPhoto();
    pDlg.showModal();
    $('#pdName').focus();
  }
  function showPhoto() {
    $('#pdImg').hidden = !pPhoto;
    if (pPhoto) $('#pdImg').src = pPhoto;
    $('#drop').classList.toggle('has', !!pPhoto);
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const el = document.createElement('script');
      el.src = src; el.onload = res; el.onerror = rej;
      document.head.appendChild(el);
    });
  }
  async function decode(blob) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(blob); } catch (e) { /* fall through to <img> */ }
    }
    const url = URL.createObjectURL(blob);
    try {
      return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  // Any size, most formats: decode natively, convert HEIC/HEIF when the browser can't,
  // then shrink to 900px so it fits in browser storage.
  async function processPhoto(file) {
    const heic = /hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    let img = null;
    try { img = await decode(file); } catch (e) { img = null; }
    if (!img && heic) {
      await loadScript('vendor/heic2any.min.js');
      const out = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      img = await decode(Array.isArray(out) ? out[0] : out);
    }
    if (!img) throw new Error('unreadable');
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const k = Math.min(1, 900 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    if (img.close) img.close();
    return c.toDataURL('image/jpeg', 0.86);
  }
  // Placeholder portrait with initials when no photo is given
  function initialsPhoto(name) {
    const c = document.createElement('canvas');
    c.width = c.height = 600;
    const g = c.getContext('2d');
    g.fillStyle = '#3f8f4e'; g.fillRect(0, 0, 600, 600);
    const letters = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    g.fillStyle = '#fff'; g.font = '700 240px Inter, "Anek Devanagari", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(letters || '?', 300, 320);
    return c.toDataURL('image/jpeg', 0.9);
  }

  function setBusy(on) {
    $('#pdBusy').hidden = !on;
    $('#pdSave').disabled = on;
  }
  async function takeFile(file) {
    if (!file) return;
    const job = ++photoJob;
    $('#pdError').textContent = '';
    setBusy(true);
    try {
      const url = await processPhoto(file);
      if (job !== photoJob) return;
      pPhoto = url;
      showPhoto();
    } catch (e) {
      console.error(e);
      if (job === photoJob) $('#pdError').textContent = 'That file couldn’t be read as a photo. Try a JPG, PNG or HEIC image.';
    } finally {
      if (job === photoJob) setBusy(false);
    }
  }
  $('#pdFile').addEventListener('change', (e) => takeFile(e.target.files[0]));
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); takeFile(e.dataTransfer.files[0]); });
  pDlg.addEventListener('click', (e) => { if (e.target === pDlg || e.target.closest('[data-close]')) pDlg.close(); });

  const paras = (t) => t.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  $('#personForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#pdName').value.trim(), nameHi = $('#pdNameHi').value.trim();
    if (!name && !nameHi) { $('#pdError').textContent = 'Add a name in English or Hindi.'; $('#pdName').focus(); return; }
    const bios = {};
    if (paras($('#pdBioEn').value).length) bios.en = paras($('#pdBioEn').value);
    if (paras($('#pdBioHi').value).length) bios.hi = paras($('#pdBioHi').value);
    const person = {
      id: pId || `custom-${Date.now().toString(36)}`, custom: true,
      name: name || nameHi, nameHi, bios, photos: [pPhoto || initialsPhoto(name || nameHi)], editions: [], sessions: [],
    };
    const prev = custom.slice();
    const at = custom.findIndex((p) => p.id === person.id);
    if (at >= 0) custom[at] = person; else custom.unshift(person);
    if (!saveCustom()) {
      custom = prev;
      $('#pdError').textContent = 'This browser’s storage is full. Delete someone you added earlier, then try again.';
      return;
    }
    byId[person.id] = person;
    const inPoster = S.people.filter((x) => x.id === person.id);
    if (!inPoster.length) S.people.push(entry(person.id, S.edition));
    inPoster.forEach((x) => { x.nameHi = null; x.custom = null; if (!person.bios[x.lang]) x.lang = langFor(S.edition, person); });
    editing = null;
    pDlg.close();
    update();
  });
  $('#pdDelete').addEventListener('click', () => {
    if (!pId) return;
    custom = custom.filter((p) => p.id !== pId);
    saveCustom();
    S.people = S.people.filter((x) => x.id !== pId);
    delete byId[pId];
    pDlg.close();
    update();
  });

  /* ---------- step 4: finish ---------- */
  $('#hiSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.showHi = b.dataset.hi === '1'; syncControls(); update(false); } });
  $('#bioSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.bioLen = b.dataset.bio; syncControls(); update(); } });
  $('#shapeSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.shape = b.dataset.shape; syncControls(); update(false); } });
  $('#qualSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.q = +b.dataset.q; syncControls(); save(); } });
  $('#resetBtn').addEventListener('click', () => { S = DEFAULTS(); editing = null; syncControls(); update(); showStep(0); });

  function save() {
    store.set('sj.poster', S);
  }
  function update(lists = true) {
    if (lists) { renderSelected(); if (S.step === 2) renderPicker(); }
    renderPoster();
    save();
  }

  /* =========================================================
     Export: PNG / JPG / PDF (A4) / Print
     ========================================================= */
  let fontCSS = null;
  async function embedFonts() {
    if (fontCSS) return fontCSS;
    const base = new URL('assets/fonts/', location.href);
    const css = await (await fetch(new URL('fonts.css', base))).text();
    const urls = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, '')))];
    const map = {};
    await Promise.all(urls.map(async (u) => {
      const blob = await (await fetch(new URL(u, base))).blob();
      map[u] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    }));
    fontCSS = css.replace(/url\(([^)]+)\)/g, (m, u) => `url(${map[u.replace(/['"]/g, '')]})`);
    return fontCSS;
  }

  async function render(kind, ratio) {
    await document.fonts.ready;
    const opts = {
      pixelRatio: ratio, width: 1080, height: poster.offsetHeight, backgroundColor: THEME[S.edition].bg,
      style: { transform: 'none' }, fontEmbedCSS: await embedFonts(), quality: 0.95,
    };
    const fn = kind === 'jpg' ? htmlToImage.toJpeg : htmlToImage.toPng;
    // capture at true size so text wraps exactly as it will print
    const prev = poster.style.transform;
    poster.style.transform = 'none';
    try {
      await fn(poster, opts); // first pass warms image decoding (Safari)
      return await fn(poster, opts);
    } finally {
      poster.style.transform = prev;
    }
  }

  function fileBase() {
    return ['sehjeevan', S.edition, 'edition', S.date].filter(Boolean).join('-');
  }
  function download(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function exportAs(fmt) {
    const status = $('#exportStatus');
    const buttons = $$('.fmt');
    status.className = 'status';
    status.textContent = 'Rendering poster…';
    buttons.forEach((b) => (b.disabled = true));
    try {
      if (fmt === 'png' || fmt === 'jpg') {
        download(await render(fmt, S.q), `${fileBase()}.${fmt}`);
      } else if (fmt === 'pdf') {
        // page is exactly the poster: 1080px wide at 96dpi, height follows the content
        const url = await render('jpg', Math.max(S.q, 2));
        const [pw, ph] = posterMM();
        const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: [pw, ph], orientation: 'portrait' });
        pdf.addImage(url, 'JPEG', 0, 0, pw, ph);
        pdf.save(`${fileBase()}.pdf`);
      } else if (fmt === 'print') {
        printImage(await render('png', Math.max(S.q, 2)));
      }
      status.textContent = fmt === 'print' ? `Page size is set to the poster (${posterMM().map((v) => Math.round(v)).join(' × ')} mm), no margins.` : 'Done. Check your downloads.';
    } catch (err) {
      console.error(err);
      status.className = 'status err';
      status.textContent = 'Could not render the poster. If you opened the file directly, serve the folder over http (see README).';
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  $('.formats').addEventListener('click', (e) => { const b = e.target.closest('.fmt'); if (b) exportAs(b.dataset.fmt); });

  function posterMM() {
    const mm = 25.4 / 96;
    return [1080 * mm, poster.offsetHeight * mm];
  }

  // Browsers always show their print dialog; we set the page to the poster's exact size so nothing is scaled or padded.
  function printImage(url) {
    const [pw, ph] = posterMM();
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const doc = f.contentDocument;
    doc.open();
    doc.write(`<!doctype html><title>${esc(fileBase())}</title><style>@page{size:${pw.toFixed(2)}mm ${ph.toFixed(2)}mm;margin:0}html,body{margin:0;padding:0}img{display:block;width:${pw.toFixed(2)}mm;height:${ph.toFixed(2)}mm}</style><img src="${url}">`);
    doc.close();
    const img = doc.querySelector('img');
    const go = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 60000); };
    if (img.complete) go(); else img.onload = go;
  }

  syncControls();
  update();
  showStep(urlIds.length ? 2 : Math.min(S.step || 0, 3));
  document.fonts.ready.then(() => { fitText(); fitPreview(); });
})();
