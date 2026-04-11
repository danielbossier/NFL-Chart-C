const MIN = -10; const MAX = 10; const RANGE = 20;

let currentSport = 'nfl';

// placed[teamId] = { x: -10–10, y: -10–10 }
const placed = {};

const chartEl = document.getElementById('chart');
const trayEl  = document.getElementById('tray');

// ---- Build static chart decorations ----
function initChart() {
  [-5, 0, 5].forEach(v => {
    const vl = document.createElement('div');
    vl.className = 'gl v' + (v === 0 ? ' center' : '');
    vl.style.left = ((v - MIN) / RANGE * 100) + '%';
    chartEl.appendChild(vl);

    const hl = document.createElement('div');
    hl.className = 'gl h' + (v === 0 ? ' center' : '');
    hl.style.top = ((1 - (v - MIN) / RANGE) * 100) + '%';
    chartEl.appendChild(hl);
  });

  [
    { cx: 75, cy: 75, text: 'Good\n& Likeable' },
    { cx: 25, cy: 75, text: 'Bad\n& Likeable' },
    { cx: 75, cy: 25, text: 'Good\n& Unlikeable' },
    { cx: 25, cy: 25, text: 'Bad\n& Unlikeable' },
  ].forEach(q => {
    const el = document.createElement('div');
    el.className = 'qlabel';
    el.style.left = q.cx + '%';
    el.style.top  = (100 - q.cy) + '%';
    el.textContent = q.text;
    chartEl.appendChild(el);
  });

  [-10, -5, 0, 5, 10].forEach(v => {
    const t = document.createElement('div');
    t.className = 'xtick';
    t.textContent = v;
    t.style.left = ((v - MIN) / RANGE * 100) + '%';
    chartEl.appendChild(t);
  });

  [-10, -5, 0, 5, 10].forEach(v => {
    const t = document.createElement('div');
    t.className = 'ytick';
    t.textContent = v;
    t.style.top = ((1 - (v - MIN) / RANGE) * 100) + '%';
    chartEl.appendChild(t);
  });
}

// ---- Render tray ----
function renderTray() {
  trayEl.innerHTML = '';
  const sport = sports[currentSport];
  const count = Object.keys(placed).length;
  document.getElementById('tray-count').textContent = count + ' / ' + sport.total + ' placed';
  document.getElementById('btn-save').disabled = count < sport.total;
  document.getElementById('btn-clear').disabled = count === 0;

  const [conf1, conf2] = sport.conferences;
  const n = sport.divsPerConf;
  [[conf1, sport.divisions.slice(0, n)], [conf2, sport.divisions.slice(n)]].forEach(([conf, confDivs]) => {
    const col = document.createElement('div');
    col.className = 'conf-col';

    const head = document.createElement('div');
    head.className = 'conf-head';
    head.textContent = conf;
    col.appendChild(head);

    confDivs.forEach(div => {
      const group = document.createElement('div');
      group.className = 'div-group';

      const h4 = document.createElement('h4');
      h4.textContent = div.label.replace(/^\S+ /, '');
      group.appendChild(h4);

      const wrap = document.createElement('div');
      wrap.className = 'div-chips';

      [...div.ids].sort((a, b) => sport.teams[a].name.localeCompare(sport.teams[b].name)).forEach(id => {
        const t = sport.teams[id];
        const chip = document.createElement('div');
        chip.className = 'tray-chip' + (placed[id] ? ' on-chart' : '');
        chip.textContent = t.name;
        chip.style.background = t.bg;
        chip.style.color = t.fg;
        if (!placed[id]) {
          chip.addEventListener('mousedown', e => beginDrag(e, id));
          chip.addEventListener('touchstart', e => beginDragTouch(e, id), { passive: true });
        }
        wrap.appendChild(chip);
      });

      group.appendChild(wrap);
      col.appendChild(group);
    });

    trayEl.appendChild(col);
  });
}

// ---- Render chart chips ----
function renderChips() {
  chartEl.querySelectorAll('.chip').forEach(el => el.remove());
  activeFan = null;

  const sport = sports[currentSport];
  const chipMap = {};

  Object.entries(placed).forEach(([id, pos]) => {
    const t = sport.teams[id];
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.background = t.bg;
    chip.style.color = t.fg;
    chip.style.left = ((pos.x - MIN) / RANGE * 100) + '%';
    chip.style.top  = ((1 - (pos.y - MIN) / RANGE) * 100) + '%';

    const nameEl = document.createElement('span');
    nameEl.textContent = t.name;
    chip.appendChild(nameEl);

    const coordEl = document.createElement('span');
    coordEl.className = 'chip-coords';
    coordEl.textContent = `G:${Math.round(pos.x)}  L:${Math.round(pos.y)}`;
    chip.appendChild(coordEl);

    chip.addEventListener('mousedown', e => beginDrag(e, id));
    chip.addEventListener('touchstart', e => beginDrag(e, id), { passive: false });
    chartEl.appendChild(chip);
    chipMap[id] = chip;
  });

  // Group chips by rounded position and wire up hover fan for stacks
  const groups = {};
  Object.entries(placed).forEach(([id, pos]) => {
    const key = `${Math.round(pos.x)},${Math.round(pos.y)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(chipMap[id]);
  });

  Object.values(groups).filter(g => g.length > 1).forEach(els => {
    els.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (activeFan && activeFan !== els) applyFan(activeFan, false);
        applyFan(els, true);
        activeFan = els;
      });
      el.addEventListener('mouseleave', e => {
        if (!els.includes(e.relatedTarget)) {
          applyFan(els, false);
          activeFan = null;
        }
      });
    });
  });
}

// ---- Fan (hover to separate overlapping chips) ----
let activeFan = null;

function applyFan(els, expanded) {
  const n = els.length;
  els.forEach((el, i) => {
    if (expanded) {
      const offset = (i - (n - 1) / 2) * 68;
      el.style.transform = `translate(calc(-50% + ${offset}px), -50%)`;
      el.style.zIndex = 20 + i;
    } else {
      el.style.transform = '';
      el.style.zIndex = '';
    }
  });
}

// ---- Drag ----
const DRAG_THRESHOLD = 8; // px finger must move before a touch becomes a drag
let drag = null;
let pendingTouch = null; // { id, startX, startY }

function clientXY(e) {
  return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                   : { x: e.clientX, y: e.clientY };
}

function startDrag(id, x, y) {
  const t = sports[currentSport].teams[id];

  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.style.background = t.bg;
  ghost.style.color = t.fg;
  ghost.style.left = x + 'px';
  ghost.style.top  = y + 'px';

  const ghostName = document.createElement('span');
  ghostName.textContent = t.name;
  ghost.appendChild(ghostName);

  const ghostCoord = document.createElement('span');
  ghostCoord.className = 'chip-coords';
  ghost.appendChild(ghostCoord);

  document.body.appendChild(ghost);

  if (placed[id]) {
    delete placed[id];
    renderChips();
    renderTray();
  }

  drag = { id, ghost, ghostCoord };
  document.addEventListener('touchmove', onDragMove, { passive: false });
}

function beginDrag(e, id) {
  e.preventDefault();
  e.stopPropagation();
  const { x, y } = clientXY(e);
  startDrag(id, x, y);
}

function beginDragTouch(e, id) {
  // Don't preventDefault here — let the browser decide scroll vs drag
  const touch = e.touches[0];
  pendingTouch = { id, startX: touch.clientX, startY: touch.clientY };
  document.addEventListener('touchmove', onDragMove, { passive: false });
}

function onDragMove(e) {
  if (pendingTouch && e.touches) {
    const dx = e.touches[0].clientX - pendingTouch.startX;
    const dy = e.touches[0].clientY - pendingTouch.startY;
    if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      // Finger moved enough — commit to drag and block scroll
      e.preventDefault();
      startDrag(pendingTouch.id, e.touches[0].clientX, e.touches[0].clientY);
      pendingTouch = null;
    }
    return;
  }

  if (!drag) return;
  if (e.cancelable) e.preventDefault();
  const { x, y } = clientXY(e);
  drag.ghost.style.left = x + 'px';
  drag.ghost.style.top  = y + 'px';

  const rect = chartEl.getBoundingClientRect();
  const over = x >= rect.left && x <= rect.right &&
               y >= rect.top  && y <= rect.bottom;
  chartEl.classList.toggle('drag-over', over);

  if (over) {
    const xVal = Math.max(MIN, Math.min(MAX, Math.round((x - rect.left) / rect.width  * RANGE + MIN)));
    const yVal = Math.max(MIN, Math.min(MAX, Math.round((1 - (y - rect.top) / rect.height) * RANGE + MIN)));
    drag.ghostCoord.textContent = `G:${xVal}  L:${yVal}`;
  } else {
    drag.ghostCoord.textContent = '';
  }
}

function onDragEnd(e) {
  if (pendingTouch) {
    document.removeEventListener('touchmove', onDragMove);
    pendingTouch = null;
  }

  if (!drag) return;

  drag.ghost.remove();
  chartEl.classList.remove('drag-over');

  const pt = e.changedTouches ? e.changedTouches[0] : e;
  const rect = chartEl.getBoundingClientRect();
  const rx = pt.clientX - rect.left;
  const ry = pt.clientY - rect.top;

  if (rx >= 0 && rx <= rect.width && ry >= 0 && ry <= rect.height) {
    const xVal = Math.max(MIN, Math.min(MAX, Math.round(rx / rect.width  * RANGE + MIN)));
    const yVal = Math.max(MIN, Math.min(MAX, Math.round((1 - ry / rect.height) * RANGE + MIN)));
    const overlap = Object.values(placed).some(p => Math.round(p.x) === xVal && Math.round(p.y) === yVal);
    const JITTER = 0.4;
    placed[drag.id] = {
      x: overlap ? Math.max(MIN, Math.min(MAX, xVal + (Math.random() * 2 - 1) * JITTER)) : xVal,
      y: overlap ? Math.max(MIN, Math.min(MAX, yVal + (Math.random() * 2 - 1) * JITTER)) : yVal,
    };
  }

  renderChips();
  renderTray();
  document.removeEventListener('touchmove', onDragMove);
  drag = null;
}

document.addEventListener('mousemove', onDragMove);
document.addEventListener('mouseup', onDragEnd);
document.addEventListener('touchend', onDragEnd);

// ---- Save / Modal ----
function buildCSV(rows) {
  const header = 'Team,Goodness,Likeability';
  const lines = rows.map(r => `${r.name},${r.x},${r.y}`);
  return [header, ...lines].join('\n');
}

function openModal() {
  const sport = sports[currentSport];
  document.querySelector('.modal-header h2').textContent = sport.label + ' Team Rankings';
  const rows = Object.entries(placed).map(([id, pos]) => ({
    id,
    name: sport.teams[id].name,
    bg: sport.teams[id].bg,
    fg: sport.teams[id].fg,
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    _x: pos.x,
    _y: pos.y,
  })).sort((a, b) => b._x - a._x || b._y - a._y);

  const tbody = document.getElementById('modal-tbody');
  tbody.innerHTML = '';
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><span class="team-swatch" style="background:${r.bg}"></span>${r.name}</td>
      <td>${r.x}</td>
      <td>${r.y}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('modal-bg').classList.remove('hidden');

  document.getElementById('btn-copy').onclick = () => {
    navigator.clipboard.writeText(buildCSV(rows)).then(() => {
      const btn = document.getElementById('btn-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy CSV'; }, 1800);
    });
  };

  document.getElementById('btn-dl').onclick = () => {
    const blob = new Blob([buildCSV(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rankings.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
}

document.getElementById('btn-save').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-bg').classList.add('hidden');
});
document.getElementById('modal-bg').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-bg'))
    document.getElementById('modal-bg').classList.add('hidden');
});

// ---- Sport toggle ----
function setSport(key) {
  if (key === currentSport) return;
  currentSport = key;
  Object.keys(placed).forEach(k => delete placed[k]);
  document.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sport === key);
  });
  document.getElementById('app-title').textContent = sports[key].label + ' Team Ranker';
  renderTray();
  renderChips();
}

document.querySelectorAll('.btn-toggle').forEach(btn => {
  btn.addEventListener('click', () => setSport(btn.dataset.sport));
});

document.getElementById('btn-clear').addEventListener('click', () => {
  Object.keys(placed).forEach(k => delete placed[k]);
  renderChips();
  renderTray();
});

document.getElementById('btn-load').addEventListener('click', () => {
  document.getElementById('csv-input').click();
});

document.getElementById('csv-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const sport = sports[currentSport];
    const nameToId = {};
    Object.entries(sport.teams).forEach(([id, t]) => { nameToId[t.name] = id; });

    Object.keys(placed).forEach(k => delete placed[k]);

    ev.target.result.trim().split('\n').slice(1).forEach(line => {
      const parts = line.split(',');
      if (parts.length < 3) return;
      const name = parts[0].trim();
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const id = nameToId[name];
      if (!id || isNaN(x) || isNaN(y)) return;
      placed[id] = {
        x: Math.max(MIN, Math.min(MAX, Math.round(x))),
        y: Math.max(MIN, Math.min(MAX, Math.round(y))),
      };
    });

    renderChips();
    renderTray();
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ---- Init ----
initChart();
renderTray();
renderChips();
