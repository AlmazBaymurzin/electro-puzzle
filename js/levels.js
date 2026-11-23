// Координаты в «логических» единицах — render масштабирует под экран.
export const levels = [
  {
    id: 1,
    title: 'Первая лампочка',
    hint: 'Соедини фазу (L) с выключателем, выключатель — с лампой. Второй контакт лампы уже соединён с нулём (N).',
    nodes: [
      { id: 'L', x: 60, y: 100, type: 'phase', label: 'L' },
      { id: 'N', x: 60, y: 260, type: 'neutral', label: 'N' },
      { id: 'sw_in', x: 170, y: 100, type: 'terminal' },
      { id: 'sw_out', x: 250, y: 100, type: 'terminal' },
      { id: 'lamp_in', x: 340, y: 100, type: 'terminal' },
      { id: 'lamp_out', x: 420, y: 100, type: 'terminal' },
    ],
    components: [
      { id: 'sw1', type: 'switch', terminals: ['sw_in', 'sw_out'], closed: true },
      { id: 'lamp1', type: 'lamp', terminals: ['lamp_in', 'lamp_out'] },
    ],
    wires: [
      { from: 'lamp_out', to: 'N' },
    ],
  },
  {
    id: 2,
    title: 'Выключатель размыкает цепь',
    hint: 'Выключатель сейчас разомкнут. Замкни его тапом — и лампа загорится.',
    nodes: [
      { id: 'L', x: 60, y: 100, type: 'phase', label: 'L' },
      { id: 'N', x: 60, y: 260, type: 'neutral', label: 'N' },
      { id: 'sw_in', x: 170, y: 100, type: 'terminal' },
      { id: 'sw_out', x: 250, y: 100, type: 'terminal' },
      { id: 'lamp_in', x: 340, y: 100, type: 'terminal' },
      { id: 'lamp_out', x: 420, y: 100, type: 'terminal' },
    ],
    components: [
      { id: 'sw1', type: 'switch', terminals: ['sw_in', 'sw_out'], closed: false },
      { id: 'lamp1', type: 'lamp', terminals: ['lamp_in', 'lamp_out'] },
    ],
    wires: [
      { from: 'L', to: 'sw_in' },
      { from: 'sw_out', to: 'lamp_in' },
      { from: 'lamp_out', to: 'N' },
    ],
  },
  {
    id: 3,
    title: 'Две лампы параллельно',
    hint: 'Соедини фазу к обеим лампам через выключатель, а вторые контакты ламп — к нулю.',
    nodes: [
      { id: 'L', x: 60, y: 90, type: 'phase', label: 'L' },
      { id: 'N', x: 60, y: 280, type: 'neutral', label: 'N' },
      { id: 'sw_in', x: 160, y: 90, type: 'terminal' },
      { id: 'sw_out', x: 240, y: 90, type: 'terminal' },
      { id: 'j1', x: 300, y: 90, type: 'terminal' },
      { id: 'l1_in', x: 380, y: 60, type: 'terminal' },
      { id: 'l1_out', x: 380, y: 150, type: 'terminal' },
      { id: 'l2_in', x: 380, y: 240, type: 'terminal' },
      { id: 'l2_out', x: 380, y: 330, type: 'terminal' },
    ],
    components: [
      { id: 'sw1', type: 'switch', terminals: ['sw_in', 'sw_out'], closed: true },
      { id: 'lamp1', type: 'lamp', terminals: ['l1_in', 'l1_out'] },
      { id: 'lamp2', type: 'lamp', terminals: ['l2_in', 'l2_out'] },
      { id: 'junction1', type: 'junction', terminals: ['j1', 'l1_in', 'l2_in'] },
    ],
    wires: [
      { from: 'L', to: 'sw_in' },
      { from: 'sw_out', to: 'j1' },
    ],
  },
  {
    id: 4,
    title: 'Проходные переключатели',
    hint: 'Свет с двух концов коридора. Соедини так, чтобы оба переключателя были замкнуты в цепь.',
    nodes: [
      { id: 'L', x: 60, y: 100, type: 'phase', label: 'L' },
      { id: 'N', x: 60, y: 280, type: 'neutral', label: 'N' },
      { id: 's1_a', x: 150, y: 100, type: 'terminal' },
      { id: 's1_b', x: 230, y: 100, type: 'terminal' },
      { id: 's2_a', x: 320, y: 100, type: 'terminal' },
      { id: 's2_b', x: 400, y: 100, type: 'terminal' },
      { id: 'lamp_in', x: 320, y: 260, type: 'terminal' },
      { id: 'lamp_out', x: 400, y: 260, type: 'terminal' },
    ],
    components: [
      { id: 'sw1', type: 'switch', terminals: ['s1_a', 's1_b'], closed: true },
      { id: 'sw2', type: 'switch', terminals: ['s2_a', 's2_b'], closed: true },
      { id: 'lamp1', type: 'lamp', terminals: ['lamp_in', 'lamp_out'] },
    ],
    wires: [
      { from: 'L', to: 's1_a' },
      { from: 's1_b', to: 's2_a' },
      { from: 's2_b', to: 'lamp_in' },
      { from: 'lamp_out', to: 'N' },
    ],
  },
  {
    id: 5,
    title: 'Короткое замыкание',
    hint: 'Один из проводов создаёт КЗ. Убери лишний провод (тап по проводу) и собери правильную цепь.',
    nodes: [
      { id: 'L', x: 60, y: 100, type: 'phase', label: 'L' },
      { id: 'N', x: 60, y: 300, type: 'neutral', label: 'N' },
      { id: 'sw_in', x: 160, y: 100, type: 'terminal' },
      { id: 'sw_out', x: 240, y: 100, type: 'terminal' },
      { id: 'lamp_in', x: 340, y: 100, type: 'terminal' },
      { id: 'lamp_out', x: 420, y: 100, type: 'terminal' },
    ],
    components: [
      { id: 'sw1', type: 'switch', terminals: ['sw_in', 'sw_out'], closed: true },
      { id: 'lamp1', type: 'lamp', terminals: ['lamp_in', 'lamp_out'] },
    ],
    wires: [
      { from: 'L', to: 'sw_in' },
      { from: 'sw_out', to: 'lamp_in' },
      { from: 'lamp_out', to: 'N' },
      { from: 'L', to: 'N' }, // лишний провод = КЗ
    ],
  },
];
