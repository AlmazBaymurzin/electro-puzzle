import { hitTerminal, hitSwitch, toLogical } from './render.js';
import { sfx } from './audio.js';

export function setupInput(canvas, getState, callbacks) {
  let selectedId = null;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const state = getState();
    const nodeMap = new Map(state.nodes.map(n => [n.id, n]));

    // 1. Тап по переключателю
    const sw = hitSwitch(sx, sy, state.components, nodeMap);
    if (sw) {
      sw.closed = !sw.closed;
      sfx.switchClick();
      callbacks.onStateChange?.();
      return;
    }

    // 2. Тап по клемме
    const t = hitTerminal(sx, sy, state.nodes);
    if (!t) {
      // тап мимо — сброс выбора
      if (selectedId) {
        selectedId = null;
        callbacks.onSelectionChange?.(null);
      }
      return;
    }

    if (!selectedId) {
      selectedId = t.id;
      sfx.tap();
      callbacks.onSelectionChange?.(selectedId);
    } else if (selectedId === t.id) {
      selectedId = null;
      callbacks.onSelectionChange?.(null);
    } else {
      // создаём провод
      const exists = state.wires.some(w =>
        (w.from === selectedId && w.to === t.id) ||
        (w.from === t.id && w.to === selectedId)
      );
      if (!exists) {
        state.wires.push({ from: selectedId, to: t.id });
        sfx.connect();
      }
      selectedId = null;
      callbacks.onSelectionChange?.(null);
      callbacks.onStateChange?.();
    }
  });

  return {
    clearSelection() {
      selectedId = null;
      callbacks.onSelectionChange?.(null);
    },
    undo() {
      const state = getState();
      if (state.wires.length) {
        state.wires.pop();
        callbacks.onStateChange?.();
      }
    },
    reset() {
      const state = getState();
      state.wires = state.initialWires.slice();
      callbacks.onStateChange?.();
    },
  };
}
