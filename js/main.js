import { levels } from './levels.js';
import { checkCircuit, litLamps } from './circuit.js';
import { setupCanvas, computeTransform, render, toScreen } from './render.js';
import { setupInput } from './input.js';
import { initAudio, sfx } from './audio.js';

const canvas = document.getElementById('board');
const statusEl = document.getElementById('status');
const titleEl = document.getElementById('level-title');
const hintEl = document.getElementById('hint-text');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');

let currentLevelIndex = 0;
let state = null;
let selectedId = null;
let litLampIds = new Set();
let flash = 0;
let shakeOffset = 0;
let ctx = null;
let width = 0;
let height = 0;
let input = null;

function loadLevel(index) {
  currentLevelIndex = index;
  const level = levels[index];
  // глубокая копия, чтобы не мутировать исходные данные
  state = {
    nodes: JSON.parse(JSON.stringify(level.nodes)),
    components: JSON.parse(JSON.stringify(level.components)),
    wires: JSON.parse(JSON.stringify(level.wires)),
    initialWires: JSON.parse(JSON.stringify(level.wires)),
  };
  selectedId = null;
  litLampIds = new Set();
  flash = 0;
  shakeOffset = 0;

  titleEl.textContent = `Уровень ${level.id}: ${level.title}`;
  hintEl.textContent = '';
  setStatus('', 'neutral');

  resize();
  updateLitLamps();
  draw();
}

function resize() {
  const { ctx: c, width: w, height: h } = setupCanvas(canvas);
  ctx = c;
  width = w;
  height = h;
  computeTransform(width, height, state.nodes);
}

function updateLitLamps() {
  litLampIds = litLamps(state);
}

function draw() {
  render(ctx, width, height, state, {
    selectedId,
    litLampIds,
    flash,
    shakeOffset,
  });
}

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

function check() {
  const result = checkCircuit(state);
  updateLitLamps();

  if (result.shortCircuit) {
    flash = 1;
    shakeOffset = 8;
    sfx.shortCircuit();
    setStatus('Короткое замыкание! Фаза и ноль соединены напрямую.', 'error');
    setTimeout(() => { flash = 0; shakeOffset = 0; draw(); }, 300);
    draw();
    return;
  }

  if (!result.lampLit) {
    sfx.error();
    setStatus('Цепь разомкнута. Ток не идёт.', 'error');
    draw();
    return;
  }

  // Успех
  sfx.success();
  setStatus('Лампа горит! Цепь собрана.', 'ok');
  draw();

  const level = levels[currentLevelIndex];
  const explanation = getExplanation(level.id);

  setTimeout(() => {
    showOverlay('Готово!', explanation, 'Далее', () => {
      if (currentLevelIndex + 1 < levels.length) {
        loadLevel(currentLevelIndex + 1);
      } else {
        showOverlay('Все уровни пройдены!', 'Ты собрал все цепи. Дальше — только практика под надзором специалиста.', 'Заново', () => {
          loadLevel(0);
        });
      }
      hideOverlay();
    });
  }, 400);
}

function getExplanation(id) {
  const map = {
    1: 'Ты замкнул цепь: фаза → выключатель → лампа → ноль. Ток пошёл, лампа загорелась. Именно так работает обычный свет в комнате.',
    2: 'Выключатель разрывает цепь. Пока он разомкнут — тока нет. Замкнул — ток пошёл. Выключатель всегда ставится в разрыв фазы, а не нуля.',
    3: 'Две лампы подключены параллельно: каждая получает фазу и ноль независимо. Если одна перегорит, вторая продолжит гореть.',
    4: 'Проходные переключатели позволяют управлять одной лампой с двух мест — например, в начале и в конце коридора.',
    5: 'Короткое замыкание — это путь фаза→ноль без нагрузки. Ток огромный, провода греются, выбивает автомат. Лишний провод между L и N и был причиной.',
  };
  return map[id] || 'Цепь собрана верно.';
}

function showOverlay(title, text, btn, onClick) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayBtn.textContent = btn;
  overlay.classList.remove('hidden');
  overlayBtn.onclick = onClick;
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// Инициализация
function init() {
  initAudio();
  loadLevel(0);

  input = setupInput(canvas, () => state, {
    onSelectionChange: (id) => { selectedId = id; draw(); },
    onStateChange: () => { updateLitLamps(); draw(); },
  });

  document.getElementById('btn-check').addEventListener('click', () => {
    initAudio(); // разблокировка звука по первому тапу
    check();
  });
  document.getElementById('btn-undo').addEventListener('click', () => {
    input.undo();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    input.reset();
    updateLitLamps();
    setStatus('', 'neutral');
    draw();
  });
  document.getElementById('btn-hint').addEventListener('click', () => {
    hintEl.textContent = levels[currentLevelIndex].hint;
  });

  window.addEventListener('resize', () => {
    resize();
    draw();
  });
}

init();
