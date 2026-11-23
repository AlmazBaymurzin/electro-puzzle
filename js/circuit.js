// Проверка цепи через обход графа.
// state = { nodes, wires, components }
export function checkCircuit(state) {
  const { nodes, wires, components } = state;

  // 1. Граф смежности из проводов
  const adj = new Map();
  const addEdge = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  };

  for (const w of wires) addEdge(w.from, w.to);

  // 2. Проводники внутри компонентов
  const lampPairs = new Set();
  for (const c of components) {
    if (c.type === 'switch' && c.closed) {
      addEdge(c.terminals[0], c.terminals[1]);
    } else if (c.type === 'lamp') {
      addEdge(c.terminals[0], c.terminals[1]);
      lampPairs.add(c.terminals.slice().sort().join('|'));
    } else if (c.type === 'junction') {
      for (let i = 1; i < c.terminals.length; i++) {
        addEdge(c.terminals[0], c.terminals[i]);
      }
    }
  }

  const isLampEdge = (a, b) => lampPairs.has([a, b].sort().join('|'));

  const phaseNodes = nodes.filter(n => n.type === 'phase').map(n => n.id);
  const neutralNodes = new Set(nodes.filter(n => n.type === 'neutral').map(n => n.id));

  // 3. Поиск всех путей фаза -> ноль с пометкой «через лампу»
  const results = [];
  for (const start of phaseNodes) {
    const visited = new Set();
    const stack = [{ node: start, viaLamp: false }];
    while (stack.length) {
      const { node, viaLamp } = stack.pop();
      if (neutralNodes.has(node)) {
        results.push({ viaLamp });
        continue;
      }
      if (visited.has(node)) continue;
      visited.add(node);
      for (const next of adj.get(node) ?? []) {
        stack.push({ node: next, viaLamp: viaLamp || isLampEdge(node, next) });
      }
    }
  }

  const shortCircuit = results.some(r => !r.viaLamp);
  const lampLit = results.some(r => r.viaLamp);

  return { shortCircuit, lampLit };
}

// Какие лампы горят (для отрисовки) — лампа горит, если она на пути фаза->ноль
export function litLamps(state) {
  const { nodes, wires, components } = state;
  const adj = new Map();
  const addEdge = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  };
  for (const w of wires) addEdge(w.from, w.to);
  for (const c of components) {
    if (c.type === 'switch' && c.closed) addEdge(c.terminals[0], c.terminals[1]);
    else if (c.type === 'lamp') addEdge(c.terminals[0], c.terminals[1]);
    else if (c.type === 'junction') {
      for (let i = 1; i < c.terminals.length; i++) addEdge(c.terminals[0], c.terminals[i]);
    }
  }
  const phaseNodes = nodes.filter(n => n.type === 'phase').map(n => n.id);
  const neutralNodes = new Set(nodes.filter(n => n.type === 'neutral').map(n => n.id));

  const reachableFromPhase = new Set();
  for (const p of phaseNodes) {
    const stack = [p];
    while (stack.length) {
      const n = stack.pop();
      if (reachableFromPhase.has(n)) continue;
      reachableFromPhase.add(n);
      for (const next of adj.get(n) ?? []) stack.push(next);
    }
  }

  const lit = new Set();
  for (const c of components) {
    if (c.type !== 'lamp') continue;
    const [a, b] = c.terminals;
    const aPhaseSide = reachableFromPhase.has(a);
    const bPhaseSide = reachableFromPhase.has(b);
    // Лампа горит, если один контакт связан с фазой, а другой — с нулём
    const aToNeutral = canReach(a, neutralNodes, adj);
    const bToNeutral = canReach(b, neutralNodes, adj);
    if ((aPhaseSide && bToNeutral) || (bPhaseSide && aToNeutral)) lit.add(c.id);
  }
  return lit;
}

function canReach(start, targets, adj) {
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const n = stack.pop();
    if (targets.has(n)) return true;
    if (visited.has(n)) continue;
    visited.add(n);
    for (const next of adj.get(n) ?? []) stack.push(next);
  }
  return false;
}
