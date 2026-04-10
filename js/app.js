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

  const sport = sports[currentSport];
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
    coordEl.textContent = `G:${pos.x}  L:${pos.y}`;
    chip.appendChild(coordEl);

    chip.addEventListener('mousedown', e => beginDrag(e, id));
    chartEl.appendChild(chip);
  });
}

// ---- Drag ----
let drag = null;

function beginDrag(e, id) {
  e.preventDefault();
  e.stopPropagation();

  const t = sports[currentSport].teams[id];

  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.textContent = t.name;
  ghost.style.background = t.bg;
  ghost.style.color = t.fg;
  ghost.style.left = e.clientX + 'px';
  ghost.style.top  = e.clientY + 'px';
  document.body.appendChild(ghost);

  if (placed[id]) {
    delete placed[id];
    renderChips();
    renderTray();
  }

  drag = { id, ghost };
}

document.addEventListener('mousemove', e => {
  if (!drag) return;
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top  = e.clientY + 'px';

  const rect = chartEl.getBoundingClientRect();
  const over = e.clientX >= rect.left && e.clientX <= rect.right &&
               e.clientY >= rect.top  && e.clientY <= rect.bottom;
  chartEl.classList.toggle('drag-over', over);
});

document.addEventListener('mouseup', e => {
  if (!drag) return;

  drag.ghost.remove();
  chartEl.classList.remove('drag-over');

  const rect = chartEl.getBoundingClientRect();
  const rx = e.clientX - rect.left;
  const ry = e.clientY - rect.top;

  if (rx >= 0 && rx <= rect.width && ry >= 0 && ry <= rect.height) {
    const xVal = Math.round(rx / rect.width  * RANGE + MIN);
    const yVal = Math.round((1 - ry / rect.height) * RANGE + MIN);
    placed[drag.id] = {
      x: Math.max(MIN, Math.min(MAX, xVal)),
      y: Math.max(MIN, Math.min(MAX, yVal)),
    };
  }

  renderChips();
  renderTray();
  drag = null;
});

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
    x: pos.x,
    y: pos.y,
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

// ---- Init ----
initChart();
renderTray();
renderChips();
