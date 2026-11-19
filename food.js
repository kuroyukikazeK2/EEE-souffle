(() => {
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- SETTINGS ---------- */
  // Your spots live in food-data.json in this GitHub repo. Admin edits on the site are committed to that file.
  // Check owner/repo: it must be the repo that GitHub Pages serves this site from.
  const GH = { owner: 'kuroyukikazeK2', repo: 'kuroyukikazeK2.github.io', branch: 'main', path: 'food-data.json' };
  // Optional: Google My Maps embed (the mid= value from your public My Maps link)
  const MY_MAP_ID = '';
  // Each spot is looked up on OpenStreetMap to fill in map pin, MRT distance, hours and halal/veg tags (your own values win).
  // To pin an exact place, add "osm": "node/123456" to a spot; "osm": false turns the lookup off for it.
  const OSM = { radius: 3500, campuses: { np: [1.3326, 103.7745], ntu: [1.3483, 103.6831], ut: [1.3555, 103.8340] } }; // [lat, lon]
  const OSM_TTL = 24 * 60 * 60 * 1000;
  /* ------------------------------ */

  const CAMPUS = { np: 'Near NP', ntu: 'Near NTU', ut: 'Upper Thomson', other: 'Elsewhere' };
  const TR = [['u5', 'Under $5'], ['5-10', '$5 – $10'], ['10-15', '$10 – $15'], ['15-20', '$15 – $20'], ['20-25', '$20 – $25'], ['25+', 'Over $25']];
  const first = p => { const m = String(p).match(/\d+(\.\d+)?/); return m ? +m[0] : NaN; };
  const band = p => {
    const s = String(p).trim(), n = first(s);
    return isNaN(n) ? '' : s.startsWith('<') || n < 5 ? 'u5' : n >= 25 ? '25+' : n >= 20 ? '20-25' : n >= 15 ? '15-20' : n >= 10 ? '10-15' : '5-10';
  };
  const fmt = p => { const s = String(p).trim(); return s.startsWith('<') ? '<$' + s.slice(1) : '$' + s.replace('-', '–'); };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = a => [...new Set(a.filter(Boolean))].sort();
  const key = o => o.campus + '|' + o.name; // two spots can share a name (Chicken House)

  let spots = [], data = [], E = null, sha = '', dirty = false;
  const S = { q: '', campus: '', price: '', loc: '', mrt: '', type: '', rating: '', sort: '', halal: '', veg: '' };
  const P = new URLSearchParams(location.search);
  for (const k in S) S[k] = P.get(k) || '';
  $('#food-search').value = S.q;

  /* ---------- data + derived fields ---------- */
  const build = e => spots.map((o, i) => {
    const x = (e && e[key(o)]) || {};
    return {
      ...o, i, band: band(o.price), location: o.location || '', type: o.type || '',
      halal: o.halal ?? x.halal, veg: o.veg ?? x.veg,
      mrt: o.mrt || x.mrt || '', mins: o.mins || x.mins || null, hours: x.hours || '', osmUrl: x.osmUrl || '',
      url: /^https?:\/\//.test(o.maps || '') ? o.maps
        : x.lat ? `https://www.google.com/maps/search/?api=1&query=${x.lat},${x.lon}`
        : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${o.name} ${o.location || ''} Singapore`),
    };
  });

  /* ---------- filtering, sorting, rendering ---------- */
  const hay = d => [d.name, d.type, d.location, d.mrt, d.notes, CAMPUS[d.campus], d.halal ? 'halal' : '', d.veg ? 'vegetarian' : ''].join(' ').toLowerCase();
  const mrtOk = (d, v) => !v || (v.startsWith('walk:') ? d.mins != null && d.mins <= +v.slice(5) : d.mrt === v.slice(4));
  const pass = d =>
    (!S.campus || d.campus === S.campus) && (!S.price || d.band === S.price) && (!S.loc || d.location === S.loc) &&
    mrtOk(d, S.mrt) && (!S.type || d.type === S.type) && (!S.rating || (d.rating || 0) >= +S.rating) &&
    (!S.halal || d.halal) && (!S.veg || d.veg) && S.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(d).includes(w));
  const num = d => String(d.price).trim().startsWith('<') ? 0 : first(d.price) || 0;
  const SORTS = { rating: (a, b) => (b.rating || 0) - (a.rating || 0), pl: (a, b) => num(a) - num(b), ph: (a, b) => num(b) - num(a) };

  const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
  const set = (id, html, k) => {
    const el = $('#f-' + id); el.innerHTML = html;
    if (![...el.options].some(o => o.value === S[k])) S[k] = '';
    el.value = S[k];
  };
  function options() { // dropdowns only offer values that exist for the chosen category
    const base = data.filter(d => !S.campus || d.campus === S.campus);
    set('price', '<option value="">Any price</option>' + TR.map(t => opt(t[0], t[1])).join(''), 'price');
    set('loc', '<option value="">All locations</option>' + uniq(base.map(d => d.location)).map(x => opt(x, x)).join(''), 'loc');
    set('type', '<option value="">All types</option>' + uniq(base.map(d => d.type)).map(x => opt(x, x)).join(''), 'type');
    set('rating', '<option value="">Any rating</option>' + [4.5, 4, 3.5, 3].map(n => opt(n, n + '+ stars')).join(''), 'rating');
    set('sort', [['', 'Default order'], ['rating', 'Top rated'], ['pl', 'Price: low to high'], ['ph', 'Price: high to low']].map(([v, l]) => opt(v, l)).join(''), 'sort');
    set('mrt', '<option value="">Any distance</option>' + [5, 10, 15].map(n => opt('walk:' + n, `Within ${n} min walk`)).join('') +
      '<optgroup label="Station">' + uniq(base.map(d => d.mrt)).map(x => opt('stn:' + x, x + ' MRT')).join('') + '</optgroup>', 'mrt');
    $('#f-mrt').closest('label').hidden = !data.some(d => d.mrt || d.mins); // hidden until MRT info exists
  }

  const stars = r => r ? `<span class="stars" style="--r:${r}" role="img" aria-label="${r} out of 5 stars">★★★★★</span>` : '';
  const admin = () => { try { return !!localStorage.getItem('food-gh-token'); } catch (e) { return false; } };
  const card = d => {
    const tags = [d.type, d.location, d.mrt && `${d.mrt} MRT${d.mins ? ' · ' + d.mins + ' min' : ''}`].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')
      + (d.halal ? '<span class="tag halal">Halal</span>' : '') + (d.veg ? '<span class="tag veg">Vegetarian-friendly</span>' : '')
      + (d.hours ? `<span class="tag" title="Opening hours (OpenStreetMap)">${esc(d.hours.slice(0, 40))}</span>` : '')
      + (d.osmUrl ? `<a class="tag" href="${esc(d.osmUrl)}" target="_blank" rel="noopener">OpenStreetMap ↗</a>` : '')
      + (admin() ? `<button class="tag edit" type="button" data-i="${d.i}">Edit</button>` : '');
    return `<article class="spot"><span class="pr">${d.price ? esc(fmt(d.price)) : '–'}</span>
    <div><h3><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a>${stars(d.rating)}</h3>
    ${d.notes ? `<p>${esc(d.notes)}</p>` : ''}${tags ? `<p class="meta">${tags}</p>` : ''}</div></article>`;
  };

  function render() {
    const rows = data.filter(pass);
    if (SORTS[S.sort]) rows.sort(SORTS[S.sort]);
    $('#food-count').textContent = `${rows.length} of ${data.length} spots`;
    $('#food-clear').hidden = !S.q;
    $('#food-reset').hidden = !Object.values(S).some(Boolean);
    $('#food-halal').setAttribute('aria-pressed', !!S.halal);
    $('#food-veg').setAttribute('aria-pressed', !!S.veg);
    document.querySelectorAll('[data-campus]').forEach(b => b.setAttribute('aria-pressed', b.dataset.campus === S.campus));
    $('#food-list').innerHTML = Object.keys(CAMPUS).map(k => [k, rows.filter(d => d.campus === k)]).filter(g => g[1].length)
      .map(([k, a]) => `<div class="level-group"><div class="level-sidebar">${CAMPUS[k]}</div><div class="level-content">${a.map(card).join('')}</div></div>`).join('')
      || '<div class="no-results">No spots match those filters.</div>';
    const s = new URLSearchParams(Object.entries(S).filter(([, v]) => v)).toString();
    history.replaceState(null, '', s ? '?' + s : location.pathname);
  }

  $('#food-search').addEventListener('input', e => { S.q = e.target.value.trim(); render(); });
  $('#food-clear').addEventListener('click', () => { $('#food-search').value = ''; S.q = ''; render(); $('#food-search').focus(); });
  ['price', 'loc', 'mrt', 'type', 'rating', 'sort'].forEach(k => $('#f-' + k).addEventListener('change', e => { S[k] = e.target.value; render(); }));
  document.querySelectorAll('[data-campus]').forEach(b => b.addEventListener('click', () => { S.campus = b.dataset.campus; options(); render(); }));
  $('#food-halal').addEventListener('click', () => { S.halal = S.halal ? '' : '1'; render(); });
  $('#food-veg').addEventListener('click', () => { S.veg = S.veg ? '' : '1'; render(); });
  $('#food-reset').addEventListener('click', () => { for (const k in S) S[k] = ''; $('#food-search').value = ''; options(); render(); });

  /* ---------- admin: edit on the site, publish to GitHub ---------- */
  const token = () => { try { return localStorage.getItem('food-gh-token') || ''; } catch (e) { return ''; } };
  const api = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`;
  const hdr = () => ({ Authorization: 'Bearer ' + token(), Accept: 'application/vnd.github+json' });
  const b64d = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));
  const b64e = s => btoa(unescape(encodeURIComponent(s)));
  const say = t => { $('#admin-msg').textContent = t; };
  const adminUI = () => {
    $('#admin-bar').hidden = !admin();
    $('#admin-link').textContent = admin() ? 'Sign out' : 'Admin';
    $('#publish').disabled = !dirty;
  };
  const touched = () => { dirty = true; adminUI(); data = build(E); options(); render(); say('Unpublished changes. Press Publish to save them to the site.'); };

  $('#admin-link').addEventListener('click', () => {
    try {
      if (admin()) { if (dirty && !confirm('Discard unpublished changes?')) return; localStorage.removeItem('food-gh-token'); location.reload(); }
      else {
        const t = prompt('Paste your GitHub token (fine-grained, Contents: read and write, for this repo only). It is stored only in this browser.');
        if (t) { localStorage.setItem('food-gh-token', t.trim()); location.reload(); }
      }
    } catch (e) { alert('Could not store the token in this browser.'); }
  });
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  const dlg = $('#spot-dlg'), form = $('#spot-form');
  const TXT = ['name', 'campus', 'price', 'location', 'type', 'notes', 'maps'];
  function openEdit(i) {
    const o = i == null ? { campus: 'np' } : spots[i];
    form.dataset.i = i ?? '';
    TXT.forEach(k => { $('#sd-' + k).value = o[k] ?? ''; });
    $('#sd-rating').value = String(o.rating ?? '');
    ['halal', 'veg'].forEach(k => { $('#sd-' + k).value = o[k] === true ? 'y' : o[k] === false ? 'n' : ''; });
    $('#sd-del').hidden = i == null;
    $('#sd-title').textContent = i == null ? 'Add a spot' : 'Edit spot';
    dlg.showModal();
  }
  $('#add-spot').addEventListener('click', () => openEdit(null));
  $('#food-list').addEventListener('click', e => { const b = e.target.closest('.edit'); if (b) openEdit(+b.dataset.i); });
  $('#sd-cancel').addEventListener('click', () => dlg.close());
  $('#sd-del').addEventListener('click', () => { if (confirm('Delete this spot?')) { spots.splice(+form.dataset.i, 1); touched(); dlg.close(); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = k => $('#sd-' + k).value.trim(), i = form.dataset.i === '' ? null : +form.dataset.i;
    const o = { ...(i == null ? {} : spots[i]) };
    TXT.forEach(k => { o[k] = v(k); });
    o.rating = v('rating') ? +v('rating') : undefined;
    ['halal', 'veg'].forEach(k => { o[k] = v(k) === 'y' ? true : v(k) === 'n' ? false : undefined; });
    if (!o.name || !band(o.price)) { alert('A name and a price like 10-15 or <5 are required.'); return; }
    i == null ? spots.push(o) : (spots[i] = o);
    touched(); dlg.close();
  });

  $('#publish').addEventListener('click', async () => {
    const clean = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined));
    const body = { message: 'Update food spots', branch: GH.branch, content: b64e(JSON.stringify(spots.map(clean), null, 2) + '\n'), ...(sha && { sha }) };
    say('Publishing…');
    try {
      const r = await fetch(api, { method: 'PUT', headers: hdr(), body: JSON.stringify(body) });
      if (r.ok) { sha = (await r.json()).content.sha; dirty = false; adminUI(); say('Published. Visitors see it after GitHub Pages rebuilds (about a minute).'); enrich(); }
      else if (r.status === 409 || r.status === 422) say('The file changed on GitHub since you loaded it. Reload the page, then redo your edits.');
      else if (r.status === 401 || r.status === 403 || r.status === 404) say('GitHub rejected the token, or it cannot write to ' + GH.owner + '/' + GH.repo + '. Check the token and the repo name in food.js.');
      else say('Publish failed (' + r.status + ').');
    } catch (e) { say('Could not reach GitHub.'); }
  });

  async function loadSpots() {
    if (admin()) { // admins read straight from GitHub so edits show immediately
      try {
        const r = await fetch(`${api}?ref=${GH.branch}`, { headers: hdr() });
        if (r.ok) { const j = await r.json(); sha = j.sha; return JSON.parse(b64d(j.content)); }
        say(r.status === 401 ? 'GitHub rejected the token. Sign out and paste a new one.' : 'Could not read ' + GH.path + ' from GitHub (' + r.status + '), showing the published copy.');
      } catch (e) { say('Could not reach GitHub, showing the published copy.'); }
    }
    const r = await fetch(GH.path + '?v=' + Date.now());
    if (!r.ok) throw 0;
    return r.json();
  }

  /* ---------- OpenStreetMap lookup (Overpass) ---------- */
  const dist = (a, b) => {
    const r = Math.PI / 180, dA = (b[0] - a[0]) * r, dO = (b[1] - a[1]) * r;
    const h = Math.sin(dA / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dO / 2) ** 2;
    return 12742000 * Math.asin(Math.sqrt(h));
  };
  const keyOf = n => n.replace(/[^A-Za-z0-9 ]/g, '.'); // apostrophes etc. match anything
  const ql = t => t.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const pos = e => [e.lat ?? e.center?.lat, e.lon ?? e.center?.lon];
  const yesish = v => v == null ? undefined : ['yes', 'only'].includes(v);

  async function lookup() {
    const used = [...new Set(spots.map(o => o.campus))].map(k => OSM.campuses[k]).filter(Boolean);
    const free = spots.filter(o => o.osm == null).map(o => keyOf(o.name));
    const q = used.map(c => (free.length ? `nwr["name"~"${ql(free.join('|'))}",i](around:${OSM.radius},${c[0]},${c[1]});` : '') +
      `nwr["railway"="station"]["name"](around:${OSM.radius + 1500},${c[0]},${c[1]});`).join('') +
      spots.filter(o => o.osm).map(o => { const [t, id] = o.osm.split('/'); return `${t}(${+id});`; }).join('');
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(`[out:json][timeout:25];(${q});out center tags;`),
    });
    if (!res.ok) throw 0;
    const els = (await res.json()).elements;
    const stn = els.filter(e => e.tags?.railway === 'station' && e.tags.name).map(e => ({ n: e.tags.name.replace(/\s*(MRT|LRT)?\s*Station$/i, ''), p: pos(e) }));
    const out = {};
    spots.forEach(o => {
      if (o.osm === false) { out[key(o)] = null; return; }
      const c = OSM.campuses[o.campus], re = new RegExp(keyOf(o.name), 'i');
      const hits = els.filter(e => o.osm ? `${e.type}/${e.id}` === o.osm : e.tags?.name && !e.tags.railway && re.test(e.tags.name));
      if (c) hits.sort((x, y) => dist(pos(x), c) - dist(pos(y), c)); // chains: outlet nearest its area
      const e = hits[0];
      if (!e) { out[key(o)] = null; return; }
      const t = e.tags, p = pos(e);
      const st = stn.map(x => [x.n, dist(p, x.p)]).sort((x, y) => x[1] - y[1])[0];
      const mins = st ? Math.round(st[1] * 1.3 / 80) : null; // straight line x1.3 at ~80 m/min
      out[key(o)] = {
        lat: p[0], lon: p[1], osmUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`, hours: t.opening_hours || '',
        halal: yesish(t['diet:halal']), veg: t['diet:vegetarian'] || t['diet:vegan'] ? yesish(t['diet:vegetarian']) || yesish(t['diet:vegan']) : undefined,
        mrt: mins != null && mins <= 20 ? st[0] : '', mins: mins != null && mins <= 20 ? mins : null,
      };
    });
    return out;
  }

  async function enrich(force) {
    let c = null, msg;
    try { c = JSON.parse(localStorage.getItem('food-osm3')); } catch (e) {}
    try {
      if (!force && c && Date.now() - c.t < OSM_TTL && spots.every(o => key(o) in c.e)) msg = 'cached';
      else {
        c = { t: Date.now(), e: await lookup() };
        try { localStorage.setItem('food-osm3', JSON.stringify(c)); } catch (e) {}
        msg = 'live';
      }
      E = c.e; data = build(E);
      $('#food-status').textContent = `${Object.values(E).filter(Boolean).length} of ${spots.length} spots matched on OpenStreetMap (${msg}).`;
    } catch (e) { $('#food-status').textContent = "Couldn't reach OpenStreetMap, showing your list only."; }
    options(); render();
  }
  $('#food-refresh').addEventListener('click', () => enrich(true));

  if (MY_MAP_ID) {
    const d = $('#food-map'); d.hidden = false;
    d.addEventListener('toggle', () => {
      const f = $('iframe', d);
      if (d.open && !f.getAttribute('src')) f.src = 'https://www.google.com/maps/d/embed?mid=' + encodeURIComponent(MY_MAP_ID);
    });
  }

  (async () => {
    try { spots = await loadSpots(); } catch (e) { $('#food-status').textContent = "Couldn't load food-data.json."; }
    data = build(null); adminUI(); options(); render();
    if (spots.length) enrich();
  })();
})();
