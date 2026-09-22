(function () {
  const { D, EDITIONS, byId, photoStyle, esc, bio, matches, store } = window.SJ;
  const $ = (s) => document.querySelector(s);
  const poster = $('#poster');

  const EDITION_DESC = {
    hindi: 'Stories told in Hindi',
    english: 'Stories told in English',
    children: 'Stories for young listeners',
    poetry: 'Kavita Samvad · poems',
  };
  const DEFAULT_TITLE = { t1: 'THE WORLD OF', t2: 'STORIES' };
  const POETRY_TITLE = { t1: 'KAVITA', t2: 'SAMVAD' };

  function nextSunday() {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const DEFAULTS = () => ({
    edition: 'hindi', date: nextSunday(), day: '', start: '16:30', end: '18:00', tz: 'IST',
    mode: 'ONLINE', venue: 'Google Meet', reg: 'Free Registration', link: '', qr: true, invite: '',
    note: "We'd love to have you at our storytelling session. Register and we'll send you the Google Meet link.",
    t1: DEFAULT_TITLE.t1, t2: DEFAULT_TITLE.t2, shape: 'square', layout: 'zigzag', size: 100, people: [],
  });

  const langFor = (edition, p) => {
    const want = edition === 'english' ? 'en' : 'hi';
    return p.bios[want] ? want : Object.keys(p.bios)[0];
  };
  const entry = (id, edition) => ({ id, lang: langFor(edition, byId[id]), photo: 0, custom: null });

  // ---- initial state: saved draft, then ?ids= from the directory overrides the people ----
  let S = Object.assign(DEFAULTS(), store.get('sj.poster', {}));
  S.people = (S.people || []).filter((x) => byId[x.id]);
  const urlIds = (new URLSearchParams(location.search).get('ids') || '').split(',').filter((id) => byId[id]);
  if (urlIds.length) {
    S.people = urlIds.map((id) => S.people.find((x) => x.id === id) || entry(id, S.edition));
    history.replaceState(null, '', location.pathname);
  }
  if (!S.people.length && !store.get('sj.poster', null)) {
    S.people = ['arpna-chandail', 'ganesh-madulkar', 'noopur-mathur'].map((id) => entry(id, S.edition));
  }

  /* ---------- formatting ---------- */
  function ordinal(n) {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ({ 1: 'ST', 2: 'ND', 3: 'RD' }[n % 10] || 'TH');
    return String(n).padStart(2, '0') + s;
  }
  function dateParts() {
    if (!S.date) return ['DATE TBA', S.day || ''];
    const [y, m, d] = S.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const month = dt.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
    const day = S.day.trim() || dt.toLocaleDateString('en-GB', { weekday: 'long' });
    return [`${ordinal(d)} ${month}`, day.toUpperCase()];
  }
  function clock(t) {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return { txt: `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}`, ap: h < 12 ? 'AM' : 'PM' };
  }
  function timeLine() {
    const a = clock(S.start), b = clock(S.end);
    if (!a) return 'TIME TBA';
    if (!b) return `${a.txt} ${a.ap}`;
    return a.ap === b.ap ? `${a.txt} TO ${b.txt} ${b.ap}` : `${a.txt} ${a.ap} TO ${b.txt} ${b.ap}`;
  }
  function twoLines(text) {
    const w = text.trim().toUpperCase().split(/\s+/);
    return w.length < 2 ? [w[0] || '', ''] : [w[0], w.slice(1).join(' ')];
  }

  // "THE WORLD OF" sits on two lines like the original posters: first word, then the rest.
  function titleLines(t) {
    const w = t.trim().split(/\s+/);
    return w.length >= 3 ? [w[0], w.slice(1).join(' ')] : [t.trim()];
  }

  /* ---------- poster render ---------- */
  function renderPoster() {
    const [dLine, dayLine] = dateParts();
    const [r1, r2] = twoLines(S.reg);
    const ed = EDITIONS[S.edition].label.toUpperCase().split(' ');
    const art = S.edition === 'poetry' ? 'assets/img/quill.png' : 'assets/img/reader.png';
    let qr = '';
    if (S.link && S.qr && window.qrcode) {
      try { const q = qrcode(0, 'M'); q.addData(S.link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { qr = ''; }
    }
    poster.className = `poster ${S.shape === 'circle' ? 'circle' : ''}`;
    poster.style.setProperty('--bio', `${Math.round((18 * S.size) / 100)}px`); // whole px: html-to-image floors sizes

    const rows = S.people.map((x, i) => {
      const p = byId[x.id];
      const src = p.photos[x.photo] || p.photos[0];
      const paras = x.custom != null ? x.custom.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean) : bio(p, x.lang);
      const flip = S.layout === 'zigzag' && i % 2 === 1;
      const showHi = x.lang === 'hi' && p.nameHi;
      return `<div class="p-row ${flip ? 'flip' : ''}">
        <div class="p-person">
          <div class="p-frame"><img src="${src}" alt="" style="${photoStyle(src)}"></div>
          <div class="p-name">${esc(p.name.replace(/^Dr\.\s*/, 'Dr '))}${showHi ? `<small>${esc(p.nameHi)}</small>` : ''}</div>
        </div>
        <div class="p-bio" lang="${x.lang}">${paras.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
      </div>`;
    }).join('');

    poster.innerHTML = `
      <header class="p-head">
        <div class="p-title">${titleLines(S.t1).map((l) => `<span class="t1">${esc(l)}</span>`).join('')}<span class="t2">${esc(S.t2)}</span></div>
        <div class="p-edition">${ed[0]}<br>${ed[1]}</div>
        <div class="p-invite">${esc(S.invite)}</div>
        <div class="p-logo"><img src="assets/img/sehjeevan-logo.png" alt="Sehjeevan"></div>
        <div class="p-info">
          <div><span>${esc(dLine)}</span><span>${esc(dayLine)}</span></div>
          <div><span>${esc(timeLine())}</span><span>${S.tz ? `(${esc(S.tz)})` : ''}</span></div>
          <div><span>${esc(S.mode)}</span><span>${S.venue ? `(${esc(S.venue.toUpperCase())})` : ''}</span></div>
          <div><span>${esc(r1)}</span><span>${esc(r2)}</span></div>
        </div>
      </header>
      ${rows ? `<main class="p-body">${rows}</main>` : '<div class="p-empty">Pick storytellers on the left<br>to fill this poster</div>'}
      ${S.note || S.link ? `<footer class="p-foot">
        <img class="p-art" src="${art}" alt="">
        <div class="p-note">${esc(S.note)}${S.link ? `<span class="p-link">${esc(S.link.replace(/^https?:\/\//, ''))}</span>` : ''}</div>
        ${qr ? `<div class="p-qr">${qr}</div>` : ''}
      </footer>` : ''}`;
    fitText();
    fitPreview();
  }

  // Shrink single-line header text until it fits its cell.
  function fitText() {
    const shrink = (el, box, min) => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while ((box || el).scrollWidth > (box || el).clientWidth + 1 && size > min) {
        size -= 1;
        el.style.fontSize = size + 'px';
      }
    };
    poster.querySelectorAll('.p-title .t1, .p-title .t2').forEach((el) => shrink(el, null, 26));
    const ed = poster.querySelector('.p-edition');
    if (ed) shrink(ed, null, 20);
    const info = poster.querySelector('.p-info');
    if (info) shrink(info, null, 13);
    const inv = poster.querySelector('.p-invite');
    if (inv) { inv.style.fontSize = ''; let z = 18; while (inv.scrollHeight > inv.clientHeight + 1 && z > 11) inv.style.fontSize = --z + 'px'; }
  }

  /* ---------- preview scaling ---------- */
  const scaleBox = $('#posterScale');
  function fitPreview() {
    const avail = $('#stageInner').clientWidth;
    const k = Math.min(1, avail / 1080);
    poster.style.transform = `scale(${k})`;
    scaleBox.style.width = `${1080 * k}px`;
    scaleBox.style.height = `${poster.offsetHeight * k}px`;
    $('#stageMeta').textContent = `1080 × ${poster.offsetHeight}px · preview at ${Math.round(k * 100)}%`;
  }
  new ResizeObserver(fitPreview).observe($('#stageInner'));
  poster.addEventListener('load', fitPreview, true); // images settling change height

  /* ---------- controls ---------- */
  $('#editions').innerHTML = Object.entries(EDITIONS).map(([k, v]) =>
    `<button type="button" role="radio" data-ed="${k}" aria-checked="${k === S.edition}"><b>${v.label}</b><span>${EDITION_DESC[k]}</span></button>`).join('');
  $('#editions').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const prev = S.edition;
    S.edition = b.dataset.ed;
    // swap the default title in or out of the poetry edition, but never overwrite custom titles
    const isDefault = (t) => S.t1 === t.t1 && S.t2 === t.t2;
    if (S.edition === 'poetry' && isDefault(DEFAULT_TITLE)) Object.assign(S, POETRY_TITLE);
    if (prev === 'poetry' && S.edition !== 'poetry' && isDefault(POETRY_TITLE)) Object.assign(S, DEFAULT_TITLE);
    S.people.forEach((x) => { if (x.custom == null) x.lang = langFor(S.edition, byId[x.id]); });
    $('#editions').querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x === b));
    syncFields();
    update();
  });

  const FIELDS = { date: 'f-date', day: 'f-day', start: 'f-start', end: 'f-end', tz: 'f-tz', mode: 'f-mode', venue: 'f-venue', reg: 'f-reg', link: 'f-link', invite: 'f-invite', note: 'f-note', t1: 'f-t1', t2: 'f-t2', shape: 'f-shape', layout: 'f-layout', size: 'f-size' };
  function syncFields() {
    Object.entries(FIELDS).forEach(([k, id]) => { $('#' + id).value = S[k]; });
    $('#f-qr').checked = S.qr;
    $('#sizeOut').textContent = `${S.size}%`;
    const d = S.date ? new Date(S.date + 'T00:00') : null;
    $('#f-day').placeholder = d ? d.toLocaleDateString('en-GB', { weekday: 'long' }) : 'auto';
  }
  Object.entries(FIELDS).forEach(([k, id]) => {
    $('#' + id).addEventListener('input', (e) => {
      S[k] = k === 'size' ? +e.target.value : e.target.value;
      if (k === 'size') $('#sizeOut').textContent = `${S.size}%`;
      if (k === 'date') syncFields();
      update();
    });
  });
  $('#f-qr').addEventListener('change', (e) => { S.qr = e.target.checked; update(); });
  $('#resetBtn').addEventListener('click', () => {
    S = DEFAULTS();
    S.people = ['arpna-chandail', 'ganesh-madulkar', 'noopur-mathur'].map((id) => entry(id, S.edition));
    $('#editions').querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x.dataset.ed === S.edition));
    syncFields();
    update();
  });

  /* selected list */
  function renderSelected() {
    const n = S.people.length;
    $('#selCount').textContent = n ? `${n} selected${n > 4 ? ' · poster grows taller' : ''}` : '';
    $('#selEmpty').hidden = n > 0;
    $('#selected').innerHTML = S.people.map((x, i) => {
      const p = byId[x.id];
      const src = p.photos[x.photo] || p.photos[0];
      const text = x.custom != null ? x.custom : bio(p, x.lang).join('\n\n');
      return `<li class="sel" data-i="${i}">
        <div class="sel-top">
          <span class="ph"><img src="${src}" alt="" style="${photoStyle(src)}"></span>
          <span class="nm">${esc(p.name)}${p.nameHi ? `<small>${esc(p.nameHi)}</small>` : ''}</span>
          <span class="tools">
            <button class="icon-btn" type="button" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn" type="button" data-act="down" aria-label="Move down" ${i === n - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn" type="button" data-act="remove" aria-label="Remove">✕</button>
          </span>
        </div>
        <div class="sel-opts">
          <span class="seg" role="group" aria-label="Bio language">
            <button type="button" data-lang="hi" aria-pressed="${x.lang === 'hi'}" ${p.bios.hi ? '' : 'disabled title="No Hindi bio in the archive"'}>हिंदी</button>
            <button type="button" data-lang="en" aria-pressed="${x.lang === 'en'}" ${p.bios.en ? '' : 'disabled title="No English bio in the archive"'}>English</button>
          </span>
          ${p.photos.length > 1 ? `<span class="seg" role="group" aria-label="Photo">${p.photos.map((_, k) => `<button type="button" data-photo="${k}" aria-pressed="${k === x.photo}">Photo ${k + 1}</button>`).join('')}</span>` : ''}
          <button class="edit-toggle" type="button" data-act="edit">${x.editing ? 'Done' : 'Edit bio'}</button>
          ${x.custom != null ? '<button class="edit-toggle" type="button" data-act="revert">Restore original</button>' : ''}
        </div>
        ${x.editing ? `<textarea data-bio aria-label="Bio for ${esc(p.name)}" lang="${x.lang}">${esc(text)}</textarea>` : ''}
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
    } else if (act === 'remove') S.people.splice(i, 1);
    else if (act === 'edit') x.editing = !x.editing;
    else if (act === 'revert') { x.custom = null; x.editing = false; }
    else if (b.dataset.lang) { x.lang = b.dataset.lang; x.custom = null; }
    else if (b.dataset.photo) x.photo = +b.dataset.photo;
    update();
  });
  $('#selected').addEventListener('input', (e) => {
    if (!e.target.matches('[data-bio]')) return;
    S.people[+e.target.closest('.sel').dataset.i].custom = e.target.value;
    renderPoster();
    save();
  });

  /* picker */
  let pq = '';
  function renderPicker() {
    const on = new Set(S.people.map((x) => x.id));
    const list = D.storytellers.filter((p) => matches(p, pq));
    const edFirst = list.slice().sort((a, b) => (b.editions.includes(S.edition) - a.editions.includes(S.edition)));
    $('#pickerList').innerHTML = edFirst.map((p) => `<button type="button" class="pk" data-id="${p.id}" aria-pressed="${on.has(p.id)}" title="${esc(p.name)}">
      <span class="dot">${p.editions.map((e) => `<i class="${e}" title="${EDITIONS[e].short}"></i>`).join('')}</span>
      <span class="ph"><img src="${p.photos[0]}" alt="" loading="lazy" style="${photoStyle(p.photos[0])}"></span>
      <b>${esc(p.name)}</b></button>`).join('');
  }
  $('#pq').addEventListener('input', (e) => { pq = e.target.value.trim(); renderPicker(); });
  $('#pickerList').addEventListener('click', (e) => {
    const b = e.target.closest('.pk');
    if (!b) return;
    const i = S.people.findIndex((x) => x.id === b.dataset.id);
    if (i >= 0) S.people.splice(i, 1); else S.people.push(entry(b.dataset.id, S.edition));
    update();
  });

  function save() {
    store.set('sj.poster', Object.assign({}, S, { people: S.people.map(({ editing, ...x }) => x) }));
  }
  function update() {
    renderSelected();
    renderPicker();
    renderPoster();
    save();
  }

  /* =========================================================
     Export: PNG / JPG / PDF / Print
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
      pixelRatio: ratio, width: 1080, height: poster.offsetHeight, backgroundColor: '#f6f5f1',
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
    return ['sehjeevan', S.t2.toLowerCase().replace(/[^a-z0-9]+/g, '-'), S.edition, S.date].filter(Boolean).join('-');
  }
  function download(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function imgSize(url) {
    return new Promise((r) => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = url; });
  }

  async function exportAs(fmt) {
    const ratio = +document.querySelector('input[name="q"]:checked').value;
    const status = $('#exportStatus');
    const buttons = document.querySelectorAll('.fmt');
    status.className = 'status';
    status.textContent = 'Rendering poster…';
    buttons.forEach((b) => (b.disabled = true));
    try {
      if (fmt === 'png' || fmt === 'jpg') {
        const url = await render(fmt, ratio);
        download(url, `${fileBase()}.${fmt}`);
      } else if (fmt === 'pdf' || fmt === 'pdf-a4') {
        const url = await render('jpg', Math.max(ratio, 2));
        const [w, h] = await imgSize(url);
        const { jsPDF } = window.jspdf;
        let pdf;
        if (fmt === 'pdf') {
          const pw = (1080 * 72) / 96, ph = (pw * h) / w;
          pdf = new jsPDF({ unit: 'pt', format: [pw, ph], orientation: ph >= pw ? 'portrait' : 'landscape' });
          pdf.addImage(url, 'JPEG', 0, 0, pw, ph);
        } else {
          pdf = new jsPDF({ unit: 'mm', format: 'a4' });
          const m = 8, bw = 210 - 2 * m, bh = 297 - 2 * m;
          const k = Math.min(bw / w, bh / h), iw = w * k, ih = h * k;
          pdf.addImage(url, 'JPEG', (210 - iw) / 2, (297 - ih) / 2, iw, ih);
        }
        pdf.save(`${fileBase()}${fmt === 'pdf-a4' ? '-a4' : ''}.pdf`);
      } else if (fmt === 'print') {
        const url = await render('png', Math.max(ratio, 2));
        printImage(url);
      }
      status.textContent = fmt === 'print' ? 'Opening print dialog…' : 'Done: check your downloads.';
    } catch (err) {
      console.error(err);
      status.className = 'status err';
      status.textContent = 'Could not render the poster. If you opened the file directly, serve the folder over http (see README).';
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  function printImage(url) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const doc = f.contentDocument;
    doc.open();
    doc.write(`<!doctype html><title>${esc(fileBase())}</title><style>@page{size:A4;margin:8mm}html,body{margin:0}img{display:block;width:100%;height:auto;max-height:281mm;object-fit:contain;margin:0 auto}</style><img src="${url}">`);
    doc.close();
    const img = doc.querySelector('img');
    const go = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 60000); };
    if (img.complete) go(); else img.onload = go;
  }

  const dlg = $('#exportDlg');
  $('#printBtn').addEventListener('click', () => {
    $('#exportStatus').textContent = S.people.length ? '' : 'Tip: add at least one storyteller first.';
    dlg.showModal();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
    const b = e.target.closest('.fmt');
    if (b) exportAs(b.dataset.fmt);
  });

  syncFields();
  update();
  document.fonts.ready.then(() => { fitText(); fitPreview(); });
})();
