/* Shared helpers for the directory and the poster studio. */
(function () {
  const D = window.SEHJEEVAN;

  const EDITIONS = {
    hindi:    { label: 'Hindi Edition',    short: 'Hindi',    hi: 'हिंदी' },
    english:  { label: 'English Edition',  short: 'English',  hi: 'अंग्रेज़ी' },
    children: { label: 'Children Edition', short: 'Children', hi: 'बाल' },
    poetry:   { label: 'Poetry Edition',   short: 'Poetry',   hi: 'कविता' },
  };

  // Focal point + zoom for photos that aren't tight headshots, so faces sit in the frame.
  const FOCUS = {
    'vikas-gautam':        { pos: '52% 27%', zoom: 2.3 },
    'lucky-rajeev':        { pos: '55% 35%', zoom: 1.6 },
    'laxmi-sharma':        { pos: '42% 40%', zoom: 1.9 },
    'kavita-krishnatri-2': { pos: '78% 38%', zoom: 2.2 },
    'heena-parveen':       { pos: '48% 22%', zoom: 1.35 },
    'noor-zaheer':         { pos: '20% 45%', zoom: 1.05 },
    'pramod-pathak-2':     { pos: '47% 50%', zoom: 1.4 },
    'arpna-chandail':      { pos: '48% 30%', zoom: 1.5 },
    'neetu-yadav':         { pos: '50% 35%', zoom: 1.35 },
    'parul-sinha':         { pos: '50% 30%', zoom: 1 },
    'shobha-bajpai':       { pos: '45% 25%', zoom: 1 },
  };
  // Prefer the closer portrait when a storyteller has more than one photo.
  const PRIMARY = { 'arpna-chandail': 1 };

  const byId = Object.fromEntries(D.storytellers.map((p) => [p.id, p]));
  const sessionsById = Object.fromEntries(D.sessions.map((s) => [s.id, s]));

  D.storytellers.forEach((p) => {
    if (PRIMARY[p.id] != null) {
      const [pick] = p.photos.splice(PRIMARY[p.id], 1);
      p.photos.unshift(pick);
    }
  });

  function photoKey(src) {
    return src.split('/').pop().replace(/\.jpg$/, '');
  }

  function photoStyle(src) {
    const f = FOCUS[photoKey(src)];
    if (!f) return 'object-position:50% 30%';
    return `object-position:${f.pos};transform:scale(${f.zoom});transform-origin:${f.pos}`;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function bio(p, lang) {
    return p.bios[lang] || p.bios.hi || p.bios.en || [];
  }

  function fmtDate(iso, opts) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function sessionTitle(s) {
    if (s.series === 'poetry') return s.no ? `Kavita Samvad · Session ${s.no}` : 'Kavita Samvad';
    return `The World of Stories · Session ${s.no}`;
  }

  function matches(p, q) {
    if (!q) return true;
    const hay = [p.name, p.nameHi, ...(p.bios.hi || []), ...(p.bios.en || [])].join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
  }

  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    },
  };

  window.SJ = { D, EDITIONS, byId, sessionsById, photoStyle, esc, bio, fmtDate, sessionTitle, matches, store };
})();
