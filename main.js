(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- EDIT YOUR CONTENT HERE ---------- */
  const CATS = { 
    art: 'Artwork & Design', 
    elec: 'Electronics', 
    Models: '3d Models', 
    Acads: 'Academics' 
  };
 
  // tags: use "mini" for interactive projects people can play with
  const PROJECTS = [
    { 
      title: 'Project one', 
      blurb: 'One line on what it is and why it exists.', 
      year: 2026, 
      cats: ['dev'], 
      tags: ['personal', 'mini'], 
      href: '#', 
      featured: true 
    },
    { 
      title: 'Project two', 
      blurb: 'A school report I think turned out neat.', 
      year: 2025, 
      cats: ['sci'], 
      tags: ['school', 'report'], 
      href: '#', 
      featured: true },
    { 
      title: 'Project three', 
      blurb: 'A design piece, branding or poster work.', 
      year: 2025, 
      cats: ['art'], 
      tags: ['personal'], 
      href: '#', 
      featured: true },
    { 
      title: 'Project four', 
      blurb: 'Something smaller that did not fit elsewhere.', 
      year: 2024, 
      cats: ['dev', 'art'], 
      tags: ['personal', 'mini'], 
      href: '#', 
      featured: false },
  ];
  const GREETINGS = ['hello', '你好', 'bonjour', 'வணக்கம்', 'hai', 'Gudentag'];
  /* -------------------------------------------- */


  // ---------- motion: headline rise, word fade, row slide-in, cursor ----------
  const root0 = document.documentElement;
  document.querySelectorAll('h1,h2').forEach(h => {
    const line = document.createElement('span'), rise = document.createElement('span');
    line.className = 'line'; rise.className = 'rise';
    while (h.firstChild) rise.appendChild(h.firstChild);
    line.appendChild(rise); h.appendChild(line);
  });
  document.querySelectorAll('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.style.setProperty('--d', Math.min(i * 22, 900) + 'ms'); s.textContent = w + ' ';
      el.appendChild(s);
    });
  });
  document.querySelectorAll('ul.reveal li').forEach((li, i) => li.style.setProperty('--d', i * 90 + 'ms'));

  const io = new IntersectionObserver(entries => {
    let n = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains('row')) e.target.style.setProperty('--d', n++ * 90 + 'ms');
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  const watch = () => document.querySelectorAll('.line,[data-words],.reveal,.row').forEach(el => { if (!el.classList.contains('in')) io.observe(el); });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    const c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<span></span>';
    document.body.append(c);
    let x = 0, y = 0, cx = 0, cy = 0, seen = false;
    addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; cx = x; cy = y; root0.classList.add('has-cursor'); }
      c.classList.add('on');
      c.classList.toggle('hover', !!e.target.closest('a,button'));
    });
    addEventListener('mousedown', () => c.classList.add('down'));
    addEventListener('mouseup', () => c.classList.remove('down'));
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    (function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      c.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    })();
  }
  // -----------------------------------------------------------------------------

  // footer year
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  // theme toggle
  const root = document.documentElement, themeBtn = $('#theme');
  const isDark = () => (root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const syncTheme = () => { themeBtn.textContent = isDark() ? 'light' : 'dark'; };
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  // greeting that cycles when clicked
  const hello = $('#hello');
  if (hello) {
    let i = 0;
    hello.addEventListener('click', () => {
      i = (i + 1) % GREETINGS.length;
      if (reduce) { hello.textContent = GREETINGS[i]; return; }
      hello.classList.remove('swap'); void hello.offsetWidth; hello.classList.add('swap');
      setTimeout(() => { hello.textContent = GREETINGS[i]; }, 140);
    });
  }

  // project rows
  const chip = (k, v, label) => `<a class="chip" href="projects.html?${k}=${v}" data-${k}="${v}">${label}</a>`;
  const row = p => `<article class="row">
    <span class="yr">${p.year}</span>
    <div>
      <h3><a href="${p.href}">${p.title}</a></h3>
      <p>${p.blurb}</p>
      <p class="meta">${p.cats.map(c => chip('cat', c, CATS[c])).join('')}${p.tags.map(t => chip('tag', t, t)).join('')}</p>
    </div></article>`;

  const featured = $('#featured');
  if (featured) featured.innerHTML = PROJECTS.filter(p => p.featured).map(row).join('');
  const cats = $('#cats');
  if (cats) cats.innerHTML = Object.entries(CATS).map(([k, l]) => chip('cat', k, l)).join('');

  watch();

  // filtering on the projects page
  const list = $('#project-list');
  const state = {};
  let draw = () => {};
  if (list) {
    const bar = $('#filters'), tagClear = $('#tagclear');
    const q = new URLSearchParams(location.search);
    if (CATS[q.get('cat')]) state.cat = q.get('cat');
    if (q.get('tag')) state.tag = q.get('tag');
    tagClear.insertAdjacentHTML('beforebegin', Object.entries(CATS).map(([k, l]) =>
      `<button class="chip" type="button" data-cat="${k}" aria-pressed="false">${l}</button>`).join(''));

    draw = () => {
      const shown = PROJECTS.filter(p => (!state.cat || p.cats.includes(state.cat)) && (!state.tag || p.tags.includes(state.tag)));
      list.innerHTML = shown.map(row).join('');
      $('#empty').hidden = shown.length > 0;
      $('#count').textContent = `${shown.length} of ${PROJECTS.length} projects`;
      bar.querySelectorAll('[data-cat]').forEach(b => b.setAttribute('aria-pressed', (state.cat || '') === b.dataset.cat));
      tagClear.hidden = !state.tag;
      tagClear.textContent = `tag: ${state.tag} (clear)`;
      const s = new URLSearchParams(state).toString();
      history.replaceState(null, '', s ? '?' + s : location.pathname);
      watch();
    };
    draw();
  }

  document.addEventListener('click', e => {
    // filter chips on the projects page
    const f = list && e.target.closest('[data-cat],[data-tag]');
    if (f) {
      e.preventDefault();
      const k = 'cat' in f.dataset ? 'cat' : 'tag', v = f.dataset[k];
      v ? (state[k] = v) : delete state[k];
      draw();
      return;
    }
    // fade out before leaving for another page
    const a = e.target.closest('a');
    if (!a || reduce || a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash) || /\.pdf$/i.test(u.pathname)) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 200);
  });

  window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));
})();

/* ---------- NOTES SEARCH & FILTER ENGINE ---------- */
function filterNotes() {
  const searchInput = document.getElementById('notes-search');
  if (!searchInput) return;

  const searchQuery = searchInput.value.toLowerCase().trim();
  const selectedLevel = document.getElementById('filter-level').value;
  const selectedStatus = document.getElementById('filter-status').value;
  
  const cards = document.querySelectorAll('.note-card');
  const categories = document.querySelectorAll('.notes-category');
  
  let visibleCount = 0;
  const totalCount = cards.length;

  const clearBtn = document.getElementById('clear-search');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'inline-block' : 'none';

  cards.forEach(card => {
    const code = (card.dataset.code || '').toLowerCase();
    const title = (card.dataset.title || '').toLowerCase();
    const level = card.dataset.level;
    const status = card.dataset.status;

    const matchesSearch = !searchQuery || code.includes(searchQuery) || title.includes(searchQuery);
    const matchesLevel = selectedLevel === 'all' || level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

    if (matchesSearch && matchesLevel && matchesStatus) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  categories.forEach(cat => {
    const visibleInCat = cat.querySelectorAll('.note-card[style*="display: flex"]');
    cat.style.display = visibleInCat.length > 0 ? 'block' : 'none';
  });

  const visibleElem = document.getElementById('visible-count');
  const totalElem = document.getElementById('total-count');
  const noResults = document.getElementById('no-results');

  if (visibleElem) visibleElem.textContent = visibleCount;
  if (totalElem) totalElem.textContent = totalCount;
  if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
}

function clearSearch() {
  const searchInput = document.getElementById('notes-search');
  if (searchInput) {
    searchInput.value = '';
    filterNotes();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notes-search')) {
    filterNotes();
  }
});

/* ---------- AUTOMATIC GITHUB FILE LOADER ---------- */
async function fetchGithubNotes() {
  const container = document.getElementById('notes-container');
  if (!container) return;

  const repoOwner = 'kuroyukikazeK2';
  const repoName = 'EEE-souffle';
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/main?recursive=1`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return;
    
    const data = await response.json();
    
    // 1. Define allowed extensions (Added .exe, .c, .py, .js, .html, .css, .ino)
    const allowedExts = [
      '.pdf', '.ppt', '.pptx', '.doc', '.docx', 
      '.exe', '.c', '.py', '.js', '.html', '.css', '.ino'
    ];

    // 2. Filter files
    const validFiles = data.tree.filter(item => {
      if (item.type !== 'blob') return false;
      const lowerPath = item.path.toLowerCase();
      if (lowerPath.includes('cv.pdf') || lowerPath.includes('transcript.pdf')) return false;
      return allowedExts.some(ext => lowerPath.endsWith(ext));
    });

    if (validFiles.length === 0) return;

    container.innerHTML = '';
    const levels = {};

    validFiles.forEach(file => {
      const fullPath = file.path;
      
      const lastDotIndex = fullPath.lastIndexOf('.');
      const ext = fullPath.substring(lastDotIndex + 1).toLowerCase();
      const fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1, lastDotIndex);
      
      // Determine format group and badge label
      let formatGroup = 'pdf';
      let badgeLabel = 'PDF';
      
      if (ext.includes('ppt')) { 
        formatGroup = 'ppt'; 
        badgeLabel = 'SLIDES'; 
      } else if (ext.includes('doc')) { 
        formatGroup = 'doc'; 
        badgeLabel = 'DOC'; 
      } else if (ext === 'exe') {
        formatGroup = 'exe';
        badgeLabel = 'EXE';
      } else if (['c', 'py', 'js', 'html', 'css', 'ino'].includes(ext)) {
        formatGroup = 'code';
        badgeLabel = ext.toUpperCase(); // Creates a 'C', 'PY', or 'INO' badge
      }

      // Automatically detect course codes
      const codeMatch = fileName.match(/([A-Z]{2,3}\d{4})/i) || fullPath.match(/([A-Z]{2,3}\d{4})/i);
      const code = codeMatch ? codeMatch[1].toUpperCase() : 'DOC';

      // Determine level category
      const levelDigitMatch = code.match(/\d/);
      const levelDigit = levelDigitMatch ? levelDigitMatch[0] : '0';
      const level = levelDigit === '0' ? '1000' : `${levelDigit}000`;

      let title = fileName;
      if (codeMatch) {
        title = fileName.replace(codeMatch[0], '').replace(/^[\s\-_]+|[\s\-_]+$/g, '');
      }
      if (!title) title = code;

      if (!levels[level]) levels[level] = [];

      levels[level].push({
        code,
        title,
        path: encodeURI(fullPath),
        level,
        formatGroup,
        badgeLabel
      });
    });

    // Render cards
    Object.keys(levels).sort().forEach(lvl => {
      const section = document.createElement('section');
      section.className = 'notes-category';
      section.dataset.category = lvl;

      const header = document.createElement('h2');
      header.textContent = `${lvl}-level`;
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'notes-grid';

      levels[lvl].forEach(note => {
        grid.innerHTML += `
          <a href="${note.path}" class="note-card" data-level="${note.level}" data-status="${note.formatGroup}" data-code="${note.code}" data-title="${note.title}" target="_blank">
            <span class="code">${note.code}</span>
            <span class="title">${note.title}</span>
            <span class="badge ${note.formatGroup}">${note.badgeLabel}</span>
          </a>
        `;
      });

      section.appendChild(grid);
      container.appendChild(section);
    });

    if (typeof filterNotes === 'function') filterNotes();

  } catch (err) {
    console.error('Error fetching notes from GitHub API:', err);
  }
}

document.addEventListener('DOMContentLoaded', fetchGithubNotes);