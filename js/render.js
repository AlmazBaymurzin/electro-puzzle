const COLORS = {
  bg: '#12161f',
  wire: '#e8edf5',
  phase: '#ef4444',
  neutral: '#3b82f6',
  ground: '#a3e635',
  terminal: '#8a95a8',
  terminalActive: '#fbbf24',
  lampOff: '#4a5568',
  lampOn: '#fde047',
  switchClosed: '#4ade80',
  switchOpen: '#f87171',
  text: '#e8edf5',
};

let scale = 1;
let offsetX = 0;
let offsetY = 0;

export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

// Пересчёт логических координат в экранные
export function computeTransform(width, height, nodes) {
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 40;
  const scaleX = (width - pad * 2) / Math.max(maxX - minX, 1);
  const scaleY = (height - pad * 2) / Math.max(maxY - minY, 1);
  scale = Math.min(scaleX, scaleY, 1.6);
  offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale;
  offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;
}

export function toScreen(x, y) {
  return { x: x * scale + offsetX, y: y * scale + offsetY };
}

export function toLogical(sx, sy) {
  return { x: (sx - offsetX) / scale, y: (sy - offsetY) / scale };
}

export function render(ctx, width, height, state, opts = {}) {
  const { nodes, wires, components } = state;
  const { selectedId = null, litLampIds = new Set(), flash = 0, shakeOffset = 0 } = opts;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(shakeOffset, 0);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 1. Провода
  for (const w of wires) {
    const a = nodeMap.get(w.from);
    const b = nodeMap.get(w.to);
    if (!a || !b) continue;
    const pa = toScreen(a.x, a.y);
    const pb = toScreen(b.x, b.y);
    ctx.strokeStyle = COLORS.wire;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  // 2. Компоненты (переключатели и лампы) — рисуем между их клеммами
  for (const c of components) {
    if (c.type === 'switch') {
      drawSwitch(ctx, c, nodeMap, flash);
    } else if (c.type === 'lamp') {
      drawLamp(ctx, c, nodeMap, litLampIds.has(c.id));
    } else if (c.type === 'junction') {
      drawJunction(ctx, c, nodeMap);
    }
  }

  // 3. Клеммы
  for (const n of nodes) {
    const p = toScreen(n.x, n.y);
    let color = COLORS.terminal;
    if (n.type === 'phase') color = COLORS.phase;
    else if (n.type === 'neutral') color = COLORS.neutral;
    else if (n.type === 'ground') color = COLORS.ground;
    else if (n.id === selectedId) color = COLORS.terminalActive;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#12161f';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (n.id === selectedId) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.terminalActive;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (n.label) {
      ctx.fillStyle = COLORS.text;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, p.x, p.y - 16);
    }
  }

  ctx.restore();
}

function drawSwitch(ctx, comp, nodeMap, flash) {
  const a = nodeMap.get(comp.terminals[0]);
  const b = nodeMap.get(comp.terminals[1]);
  if (!a || !b) return;
  const pa = toScreen(a.x, a.y);
  const pb = toScreen(b.x, b.y);
  const mx = (pa.x + pb.x) / 2;
  const my = (pa.y + pb.y) / 2;

  ctx.strokeStyle = comp.closed ? COLORS.switchClosed : COLORS.switchOpen;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  if (comp.closed) {
    ctx.lineTo(pb.x, pb.y);
  } else {
    // разомкнут — рисуем под углом
    const dx = pb.x - pa.x, dy = pb.y - pa.y;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) - 0.5;
    ctx.lineTo(pa.x + Math.cos(angle) * len, pa.y + Math.sin(angle) * len);
  }
  ctx.stroke();

  // маркер-кружок посередине для тапа
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#1a2030';
  ctx.fill();
  ctx.strokeStyle = comp.closed ? COLORS.switchClosed : COLORS.switchOpen;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLamp(ctx, comp, nodeMap, isLit) {
  const a = nodeMap.get(comp.terminals[0]);
  const b = nodeMap.get(comp.terminals[1]);
  if (!a || !b) return;
  const pa = toScreen(a.x, a.y);
  const pb = toScreen(b.x, b.y);
  const mx = (pa.x + pb.x) / 2;
  const my = (pa.y + pb.y) / 2;

  if (isLit) {
    const grd = ctx.createRadialGradient(mx, my, 4, mx, my, 30);
    grd.addColorStop(0, 'rgba(253,224,71,0.6)');
    grd.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(mx, my, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(mx, my, 12, 0, Math.PI * 2);
  ctx.fillStyle = isLit ? COLORS.lampOn : COLORS.lampOff;
  ctx.fill();
  ctx.strokeStyle = '#12161f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // крестик внутри лампы
  ctx.strokeStyle = isLit ? '#854d0e' : '#12161f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - 6, my - 6); ctx.lineTo(mx + 6, my + 6);
  ctx.moveTo(mx + 6, my - 6); ctx.lineTo(mx - 6, my + 6);
  ctx.stroke();
}

function drawJunction(ctx, comp, nodeMap) {
  const nodes = comp.terminals.map(id => nodeMap.get(id)).filter(Boolean);
  if (nodes.length < 2) return;
  const pts = nodes.map(n => toScreen(n.x, n.y));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

  for (const p of pts) {
    ctx.strokeStyle = '#8a95a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#8a95a8';
  ctx.fill();
}

// Хит-тест клемм с радиусом попадания
export function hitTerminal(sx, sy, nodes, radius = 24) {
  const logical = toLogical(sx, sy);
  let best = null;
  let bestDist = Infinity;
  for (const n of nodes) {
    const d = Math.hypot(n.x - logical.x, n.y - logical.y) * scale;
    if (d < radius && d < bestDist) {
      best = n;
      bestDist = d;
    }
  }
  return best;
}

export function hitSwitch(sx, sy, components, nodeMap) {
  const logical = toLogical(sx, sy);
  for (const c of components) {
    if (c.type !== 'switch') continue;
    const a = nodeMap.get(c.terminals[0]);
    const b = nodeMap.get(c.terminals[1]);
    if (!a || !b) continue;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = Math.hypot(mx - logical.x, my - logical.y) * scale;
    if (d < 24) return c;
  }
  return null;
}
