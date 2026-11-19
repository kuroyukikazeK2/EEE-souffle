(() => {
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- EDIT YOUR SPOTS HERE ---------- */
  // np(name, price, extras) / ntu(name, price, extras)
  // price: a range as text: '<5', '5-10', '10-15', '15-20', '20-25', '25-30' (anything from 25 up is "Over $25")
  // extras (all optional): location, type ('Dessert', 'Tzechar', ...), halal: true, veg: true,
  //                        mrt: 'Clementi', mins: 8 (walk to MRT), notes, maps (a Google Maps link)
  const np = (name, price, x = {}) => ({ campus: 'np', name, price, ...x });
  const ntu = (name, price, x = {}) => ({ campus: 'ntu', name, price, ...x });
  const ut = (name, price, x = {}) => ({ campus: 'ut', name, price, ...x }); // Upper Thomson

  const SPOTS = [
    np('Bronzo Pasta', '15-20', { location: 'Bukit Timah Food Centre' }),
    np('Ding Te Le', '10-15'),
    np('Al Halimah', '10-15'),
    np('Al Azhar', '10-15'),
    np('Time for Thai', '10-15'),
    np('Nyonya Chendol', '<5', { type: 'Dessert' }),
    np('Buta-Kin', '5-10', { location: 'Beauty World Centre' }),
    np('Berempah Bros', '5-10', { location: 'Beauty World Centre' }),
    np('Basil King', '5-10', { location: 'Beauty World Centre' }),
    np('Mixue', '<5', { type: 'Dessert' }),
    np('Chao Baba Freshly Cut Chicken', '25-30', { notes: 'Aka the knockoff HDL.' }),
    np('Mongkok Dimsum', '10-15'),
    np('OMMA Korean Charcoal BBQ', '20-25'),
    np('KahHeng Seafood Restaurant', '15-20', { type: 'Tzechar' }),
    np('Chicken House', '10-15'),
    np("D'Life", '5-10', { veg: true }),
    np("McDonald's", '5-10'),
    np('Springleaf', '5-10', { location: 'Clementi' }),
    np('A-Poh Kitchen', '10-15'),
    np('Boon Tong Kee', '10-15', { location: 'Beauty World Centre' }),

    // Upper Thomson
    ut('The Roti Prata House', '5-10'),
    ut('Beach Road Scissors Curry Cutlet', '5-10'),
    ut('Chicken House', '10-15'),
    ut('Siam Square Mookata', '20-25'),
    ut('Woodlands Sourdough', '10-15'),
    ut('Soi 19', '5-10'),
  ];

  // Optional: Google My Maps embed (the mid= value from your public My Maps link)
  const MY_MAP_ID = '';

  // Each spot is looked up live on OpenStreetMap (name search near the campus) to fill in map pin, MRT distance, opening hours
  // and halal/vegetarian tags. Anything you type in SPOTS wins. To pin an exact place, add osm: 'node/123456' to a spot.
  const OSM = { radius: 3500, campuses: { np: [1.3326, 103.7745], ntu: [1.3483, 103.6831], ut: [1.3555, 103.8340] } }; // [lat, lon]
  const OSM_TTL = 24 * 60 * 60 * 1000;
  /* ------------------------------------------ */

  const CAMPUS = { np: 'Near NP', ntu: 'Near NTU', ut: 'Upper Thomson', other: 'Elsewhere' };
  const key = o => o.campus + '|' + o.name; // two spots can share a name (Chicken House)
  const TR = [['u5', 'Under $5'], ['5-10', '$5 – $10'], ['10-15', '$10 – $15'], ['15-20', '$15 – $20'], ['20-25', '$20 – $25'], ['25+', 'Over $25']];
  const band = p => {
    const s = String(p).trim(), n = parseFloat(s.replace(/[^\d.]/g, ''));
    if (s.startsWith('<') || isNaN(n)) return isNaN(n) ? '' : 'u5';
    return n >= 25 ? '25+' : n >= 20 ? '20-25' : n >= 15 ? '15-20' : n >= 10 ? '10-15' : n >= 5 ? '5-10' : 'u5';
  };
  const fmt = p => { const s = String(p).trim(); return s.startsWith('<') ? '<$' + s.slice(1) : '$' + s.replace('-', '–'); };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = a => [...new Set(a.filter(Boolean))].sort();

  const build = e => SPOTS.map(o => {
    const x = (e && e[key(o)]) || {};
    return {
      ...o, band: band(o.price), location: o.location || '', type: o.type || '',
      halal: o.halal ?? x.halal, veg: o.veg ?? x.veg,
      mrt: o.mrt || x.mrt || '', mins: o.mins || x.mins || null, hours: x.hours || '', osmUrl: x.osmUrl || '',
      url: /^https?:\/\//.test(o.maps || '') ? o.maps
        : x.lat ? `https://www.google.com/maps/search/?api=1&query=${x.lat},${x.lon}`
        : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${o.name} ${o.location || ''} Singapore`),
    };
  });
  let data = build(null);

  const S = { q: '', campus: '', price: '', loc: '', mrt: '', type: '', halal: '', veg: '' };
  const P = new URLSearchParams(location.search);
  for (const k in S) S[k] = P.get(k) || '';
  $('#food-search').value = S.q;

  const hay = d => [d.name, d.type, d.location, d.mrt, d.notes, CAMPUS[d.campus], d.halal ? 'halal' : '', d.veg ? 'vegetarian' : ''].join(' ').toLowerCase();
  const mrtOk = (d, v) => !v || (v.startsWith('walk:') ? d.mins != null && d.mins <= +v.slice(5) : d.mrt === v.slice(4));
  const pass = d =>
    (!S.campus || d.campus === S.campus) && (!S.price || d.band === S.price) && (!S.loc || d.location === S.loc) &&
    mrtOk(d, S.mrt) && (!S.type || d.type === S.type) && (!S.halal || d.halal) && (!S.veg || d.veg) &&
    S.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(d).includes(w));

  const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
  const set = (id, html, key) => {
    const el = $('#f-' + id); el.innerHTML = html;
    if (![...el.options].some(o => o.value === S[key])) S[key] = '';
    el.value = S[key];
  };
  // dropdowns only offer values that exist for the chosen campus
  function options() {
    const base = data.filter(d => !S.campus || d.campus === S.campus);
    set('price', '<option value="">Any price</option>' + TR.map(t => opt(t[0], t[1])).join(''), 'price');
    set('loc', '<option value="">All locations</option>' + uniq(base.map(d => d.location)).map(x => opt(x, x)).join(''), 'loc');
    set('type', '<option value="">All types</option>' + uniq(base.map(d => d.type)).map(x => opt(x, x)).join(''), 'type');
    set('mrt', '<option value="">Any distance</option>' + [5, 10, 15].map(n => opt('walk:' + n, `Within ${n} min walk`)).join('') +
      '<optgroup label="Station">' + uniq(base.map(d => d.mrt)).map(x => opt('stn:' + x, x + ' MRT')).join('') + '</optgroup>', 'mrt');
    $('#f-mrt').closest('label').hidden = !data.some(d => d.mrt || d.mins); // hidden until you add MRT info
  }

  const card = d => {
    const tags = [d.type, d.location, d.mrt && `${d.mrt} MRT${d.mins ? ' · ' + d.mins + ' min' : ''}`].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')
      + (d.halal ? '<span class="tag halal">Halal</span>' : '') + (d.veg ? '<span class="tag veg">Vegetarian-friendly</span>' : '')
      + (d.hours ? `<span class="tag" title="Opening hours (OpenStreetMap)">${esc(d.hours.slice(0, 40))}</span>` : '')
      + (d.osmUrl ? `<a class="tag" href="${esc(d.osmUrl)}" target="_blank" rel="noopener">OpenStreetMap ↗</a>` : '');
    return `<article class="spot"><span class="pr">${d.price ? esc(fmt(d.price)) : '–'}</span>
    <div><h3><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a></h3>
    ${d.notes ? `<p>${esc(d.notes)}</p>` : ''}${tags ? `<p class="meta">${tags}</p>` : ''}</div></article>`;
  };

  function render() {
    const rows = data.filter(pass);
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

  // events
  $('#food-search').addEventListener('input', e => { S.q = e.target.value.trim(); render(); });
  $('#food-clear').addEventListener('click', () => { $('#food-search').value = ''; S.q = ''; render(); $('#food-search').focus(); });
  ['price', 'loc', 'mrt', 'type'].forEach(k => $('#f-' + k).addEventListener('change', e => { S[k] = e.target.value; render(); }));
  document.querySelectorAll('[data-campus]').forEach(b => b.addEventListener('click', () => { S.campus = b.dataset.campus; options(); render(); }));
  $('#food-halal').addEventListener('click', () => { S.halal = S.halal ? '' : '1'; render(); });
  $('#food-veg').addEventListener('click', () => { S.veg = S.veg ? '' : '1'; render(); });
  $('#food-reset').addEventListener('click', () => { for (const k in S) S[k] = ''; $('#food-search').value = ''; options(); render(); });

  // ---- live lookup on OpenStreetMap (Overpass API) ----
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
    const used = [...new Set(SPOTS.map(o => o.campus))].map(k => OSM.campuses[k]).filter(Boolean);
    const free = SPOTS.filter(o => o.osm == null).map(o => keyOf(o.name));
    const q = used.map(c => (free.length ? `nwr["name"~"${ql(free.join('|'))}",i](around:${OSM.radius},${c[0]},${c[1]});` : '') +
      `nwr["railway"="station"]["name"](around:${OSM.radius + 1500},${c[0]},${c[1]});`).join('') +
      SPOTS.filter(o => o.osm).map(o => { const [t, id] = o.osm.split('/'); return `${t}(${+id});`; }).join('');
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(`[out:json][timeout:25];(${q});out center tags;`),
    });
    if (!res.ok) throw 0;
    const els = (await res.json()).elements;
    const stn = els.filter(e => e.tags?.railway === 'station' && e.tags.name).map(e => ({ n: e.tags.name.replace(/\s*(MRT|LRT)?\s*Station$/i, ''), p: pos(e) }));
    const out = {};
    SPOTS.forEach(o => {
      if (o.osm === false) { out[key(o)] = null; return; } // opt out of lookup
      const c = OSM.campuses[o.campus], re = new RegExp(keyOf(o.name), 'i');
      const hits = els.filter(e => o.osm ? `${e.type}/${e.id}` === o.osm : e.tags?.name && !e.tags.railway && re.test(e.tags.name));
      if (c) hits.sort((x, y) => dist(pos(x), c) - dist(pos(y), c)); // chains: take the outlet nearest the campus
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
      if (!force && c && Date.now() - c.t < OSM_TTL && SPOTS.every(o => key(o) in c.e)) msg = 'cached';
      else {
        c = { t: Date.now(), e: await lookup() };
        try { localStorage.setItem('food-osm3', JSON.stringify(c)); } catch (e) {}
        msg = 'live';
      }
      data = build(c.e);
      const n = Object.values(c.e).filter(Boolean).length;
      $('#food-status').textContent = `${n} of ${SPOTS.length} spots matched on OpenStreetMap (${msg}).`;
    } catch (e) {
      $('#food-status').textContent = "Couldn't reach OpenStreetMap, showing your list only.";
    }
    options(); render();
  }
  $('#food-refresh').addEventListener('click', () => enrich(true));

  options(); render();
  enrich();

  if (MY_MAP_ID) {
    const d = $('#food-map'); d.hidden = false;
    d.addEventListener('toggle', () => {
      const f = $('iframe', d);
      if (d.open && !f.getAttribute('src')) f.src = 'https://www.google.com/maps/d/embed?mid=' + encodeURIComponent(MY_MAP_ID);
    });
  }
})();
