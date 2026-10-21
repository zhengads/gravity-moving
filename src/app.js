(() => {
  'use strict';
  const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter;
  const W = 1000, H = 680;
  const FLOOR = 604, CEILING = 76, LEFT = 62, RIGHT = 938;
  const CATCH = { x: 808, y: 526, w: 116, h: 79 };
  const DIRECTIONS = [
    { x: 0, y: 1, arrow: '↓', name: '向下' },
    { x: 1, y: 0, arrow: '→', name: '向右' },
    { x: 0, y: -1, arrow: '↑', name: '向上' },
    { x: -1, y: 0, arrow: '←', name: '向左' },
  ];

  const LEVELS = [
    {
      room: '玄关', title: '第一件，轻轻放好。', hint: '倾斜手机，让小球滚进纸箱。也可以点右侧按钮。', color: '#e8f3f4', floor: '#b89174',
      items: [{ id: 'ball', kind: 'ball', label: '网球', x: 189, y: 570, radius: 30, target: true }],
      blocks: [], tip: '倾斜手机或点右侧按钮，看看小球会去哪里。',
    },
    {
      room: '书房', title: '书架挡住了路。', hint: '想办法让物品先经过书架上方。', color: '#eaf1e9', floor: '#ab947d',
      items: [
        { id: 'ball', kind: 'ball', label: '网球', x: 177, y: 574, radius: 30, target: true },
        { id: 'book', kind: 'book', label: '笔记本', x: 296, y: 569, w: 60, h: 70, target: true },
      ],
      blocks: [{ x: 477, y: 388, w: 148, h: 428, kind: 'shelf' }],
      tip: '先往上，再绕过书架。',
    },
    {
      room: '客厅', title: '留给最后一箱。', hint: '把木块送到高处的橙色开关，打开收纳通道。', color: '#f0e9e5', floor: '#b48b71',
      items: [
        { id: 'clock', kind: 'clock', label: '闹钟', x: 180, y: 571, w: 64, h: 66, target: true },
        { id: 'book', kind: 'book', label: '笔记本', x: 304, y: 569, w: 60, h: 70, target: true },
        { id: 'block', kind: 'block', label: '木块', x: 630, y: 394, w: 65, h: 65, target: false },
      ],
      blocks: [
        { x: 478, y: 388, w: 148, h: 428, kind: 'shelf' },
        { x: 697, y: 439, w: 160, h: 24, kind: 'ledge' },
        { x: 775, y: 437, w: 32, h: 334, kind: 'gate' },
      ],
      tip: '只有木块能启动高处的开关。',
    },
  ];

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const roomImage = new Image();
  roomImage.src = '/* ROOM_IMAGE */';
  const objectsImage = new Image();
  objectsImage.src = '/* OBJECTS_IMAGE */';
  const ready = image => image.complete && image.naturalWidth > 0;
  const sprite = (sx, sy, sw, sh, dx, dy, dw, dh) => ctx.drawImage(objectsImage, sx, sy, sw, sh, dx, dy, dw, dh);
  // Crop away transparent padding so the drawn object matches its Matter collider.
  const SPRITES = {
    ball: [118, 157, 299, 299, 64, 64],
    book: [613, 88, 311, 384, 62, 72],
    clock: [1122, 49, 313, 419, 66, 70],
    block: [610, 598, 341, 340, 66, 66],
    shelf: [1150, 520, 270, 443],
    box: [62, 556, 504, 405],
  };
  const elements = {
    stageFrame: document.querySelector('.stage-frame'),
    stageSection: document.querySelector('.stage-section'),
    stageIndex: $('stageIndex'), stageLabel: $('stageLabel'), roomTitle: $('roomTitle'), roomHint: $('roomHint'),
    objectiveList: $('objectiveList'), gravityArrow: $('gravityArrow'), turnCount: $('turnCount'),
    turnLeft: $('turnLeft'), turnRight: $('turnRight'), undoButton: $('undoButton'), resetButton: $('resetButton'),
    railTip: $('railTip'), stageNote: $('stageNote'), result: $('result'), resultTitle: $('resultTitle'),
    resultText: $('resultText'), resultKicker: $('resultKicker'), nextButton: $('nextButton'),
    retryResult: $('retryResult'), soundButton: $('soundButton'), soundState: $('soundState'), helpButton: $('helpButton'), helpDialog: $('helpDialog'),
    startDialog: $('startDialog'), startMotion: $('startMotion'), startButtons: $('startButtons'),
    settingsDialog: $('settingsDialog'), settingsButton: $('settingsButton'), settingsClose: $('settingsClose'),
    modeMotion: $('modeMotion'), modeButtons: $('modeButtons'), motionStatus: $('motionStatus'),
    levelButtons: [...document.querySelectorAll('.level-option')], controlPanel: document.querySelector('.control-panel'),
    hudArrow: $('hudArrow'), hudMode: $('hudMode'),
  };
  const state = {
    level: 0, engine: null, bodies: new Map(), blocks: [], collected: new Set(), gravity: 0,
    turns: 0, history: [], busy: false, won: false, sound: false, audio: null,
    time: 0, accumulator: 0, settleSince: 0, turnStarted: 0, catWake: 0, lastCollision: 0,
    noteTimer: 0, enteredAt: performance.now(), frame: 0, gateOpen: false, gateOpenedAt: 0,
    captures: [], winAt: 0, turnFeedbackUntil: 0, celebrateUntil: 0,
    targetGravity: { x: 0, y: 1 }, displayedGravity: { x: 0, y: 1 },
    motionMode: 'off', motionKind: null, motionLastAt: 0, motionStartedAt: 0, started: false,
  };

  function setGravityTarget(x, y) {
    const length = Math.hypot(x, y);
    const scale = length > 1 ? 1 / length : 1;
    state.targetGravity.x = Math.abs(x) < .035 ? 0 : x * scale;
    state.targetGravity.y = Math.abs(y) < .035 ? 0 : y * scale;
  }

  function updateGravity(time) {
    const gravity = state.engine.world.gravity;
    const rate = state.motionMode === 'on' ? .18 : .12;
    const x = gravity.x + (state.targetGravity.x - gravity.x) * rate;
    const y = gravity.y + (state.targetGravity.y - gravity.y) * rate;
    if (Math.abs(x - gravity.x) + Math.abs(y - gravity.y) > .025 && time - (state.lastWakeAt || 0) > 120) {
      for (const body of state.bodies.values()) Sleeping.set(body, false);
      state.lastWakeAt = time;
    }
    gravity.x = x;
    gravity.y = y;
    state.displayedGravity.x = x;
    state.displayedGravity.y = y;
    const angle = -Math.atan2(x, y);
    const rotation = `rotate(${angle}rad)`;
    elements.gravityArrow.style.transform = rotation;
    elements.hudArrow.style.transform = rotation;
    if (time - (state.lastAriaAt || 0) > 500) {
      canvas.setAttribute('aria-label', `${LEVELS[state.level].room}游戏画面，重力${directionName(x, y)}，已收纳${state.collected.size}件物品`);
      state.lastAriaAt = time;
    }
  }

  function directionName(x, y) {
    if (Math.hypot(x, y) < .18) return '接近水平';
    if (Math.abs(x) > Math.abs(y) * 1.5) return x > 0 ? '向右' : '向左';
    if (Math.abs(y) > Math.abs(x) * 1.5) return y > 0 ? '向下' : '向上';
    return `${y > 0 ? '向下' : '向上'}偏${x > 0 ? '右' : '左'}`;
  }

  function updateMotionUI(message) {
    const motionSelected = state.motionMode !== 'off';
    elements.controlPanel.classList.toggle('motion-mode', motionSelected);
    elements.modeMotion.classList.toggle('selected', motionSelected);
    elements.modeButtons.classList.toggle('selected', !motionSelected);
    elements.modeMotion.setAttribute('aria-pressed', String(motionSelected));
    elements.modeButtons.setAttribute('aria-pressed', String(!motionSelected));
    elements.modeMotion.disabled = state.motionMode === 'waiting';
    elements.motionStatus.textContent = message || (state.motionMode === 'waiting' ? '正在等待手机传感器…' : motionSelected ? '体感已开启，竖屏倾斜手机即可控制。' : '按钮操作中，可随时改为体感。');
    elements.hudMode.textContent = motionSelected ? '手机体感' : '按钮操控';
    if (state.level === 0) {
      elements.roomHint.textContent = motionSelected ? '倾斜手机，让小球滚进纸箱。' : '点右侧按钮，让小球滚进纸箱。';
      elements.railTip.textContent = motionSelected ? '慢慢倾斜手机，观察小球的运动。' : '试试右侧按钮，看看小球会去哪里。';
    }
    if (state.engine) updateUI();
  }

  function stopMotion(message) {
    const { x, y } = state.displayedGravity;
    state.gravity = Math.abs(x) > Math.abs(y) ? (x > 0 ? 1 : 3) : (y > 0 ? 0 : 2);
    setGravityTarget(DIRECTIONS[state.gravity].x, DIRECTIONS[state.gravity].y);
    state.motionMode = 'off';
    state.motionKind = null;
    state.motionLastAt = 0;
    updateMotionUI(message);
    if (message && state.started && !elements.settingsDialog.open) note(message);
  }

  async function toggleMotion() {
    if (state.motionMode === 'on') {
      stopMotion('体感已关闭。可点左右按钮继续。');
      return;
    }
    if (state.motionMode === 'waiting') return;
    if (!window.isSecureContext) {
      stopMotion('体感需要 HTTPS 页面，已切换为按钮操作。');
      return;
    }
    const requests = [];
    for (const SensorEvent of [window.DeviceMotionEvent, window.DeviceOrientationEvent]) {
      if (typeof SensorEvent?.requestPermission === 'function') {
        try { requests.push(SensorEvent.requestPermission()); }
        catch (error) { requests.push(Promise.reject(error)); }
      }
    }
    state.motionMode = 'waiting';
    state.motionStartedAt = performance.now();
    state.motionLastAt = 0;
    updateMotionUI('正在等待手机传感器…');
    if (requests.length) {
      const results = await Promise.allSettled(requests);
      if (state.motionMode !== 'waiting') return;
      if (results.every(r => r.status !== 'fulfilled' || r.value !== 'granted')) {
        stopMotion('没有获得体感权限，已切换为按钮操作。');
        return;
      }
    }
  }

  function acceptMotion(x, y, kind) {
    if (state.motionMode !== 'waiting' && state.motionMode !== 'on') return;
    // Tilt angles describe the phone's direction directly. Prefer them when
    // both event streams are available, then fall back to acceleration.
    if (kind === 'motion' && state.motionKind === 'orientation' && performance.now() - state.motionLastAt < 1000) return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (window.innerWidth > window.innerHeight && window.innerWidth < 900) {
      elements.motionStatus.textContent = '请将手机竖屏，画面和重力方向更容易对应。';
      return;
    }
    const nextX = Math.max(-1, Math.min(1, x));
    const nextY = Math.max(-1, Math.min(1, y));
    const changed = Math.hypot(nextX - state.targetGravity.x, nextY - state.targetGravity.y) > .08;
    setGravityTarget(nextX, nextY);
    state.motionKind = kind;
    state.motionLastAt = performance.now();
    if (state.motionMode === 'waiting') {
      state.motionMode = 'on';
      state.busy = false;
      updateMotionUI('体感已开启。慢慢倾斜手机，让物件沿箭头方向移动。');
      if (state.started && !elements.settingsDialog.open) note('体感已开启，倾斜手机改变重力');
    }
    if (changed) for (const body of state.bodies.values()) Sleeping.set(body, false);
  }

  function onDeviceMotion(event) {
    const a = event.accelerationIncludingGravity;
    if (!a || !Number.isFinite(a.x) || !Number.isFinite(a.y)) return;
    // The accelerometer reports proper acceleration, opposite to gravity.
    // Device y points toward the top; canvas y points down.
    acceptMotion(-a.x / 9.81 * 1.45, a.y / 9.81 * 1.45, 'motion');
  }

  function onDeviceOrientation(event) {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    // Positive beta is upright (down on screen); positive gamma tips right.
    acceptMotion(Math.sin(event.gamma * Math.PI / 180) * 1.45,
      Math.sin(event.beta * Math.PI / 180) * 1.45, 'orientation');
  }

  function roundRect(x, y, w, h, r, fill, stroke, lw = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function text(str, x, y, size, color, weight = 700, align = 'left') {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px NotoSC, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
  }

  function makeItem(item) {
    const opts = { friction: item.kind === 'ball' ? .19 : .42, frictionStatic: .58, frictionAir: item.kind === 'ball' ? .003 : .008, restitution: item.kind === 'ball' ? .66 : .12, density: item.kind === 'block' ? .0016 : .0012, sleepThreshold: 100 };
    let body;
    if (item.radius) body = Bodies.circle(item.x, item.y, item.radius, opts);
    else body = Bodies.rectangle(item.x, item.y, item.w, item.h, { ...opts, chamfer: { radius: item.kind === 'book' ? 4 : 9 } });
    body.itemId = item.id;
    body.itemKind = item.kind;
    return body;
  }

  function setupLevel(index, restore = null) {
    state.level = index;
    state.engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 7 });
    state.engine.world.gravity.scale = .0021;
    state.blocks = [];
    state.bodies = new Map();
    state.collected = new Set(restore?.collected ?? []);
    state.gravity = restore?.gravity ?? 0;
    const restoredGravity = DIRECTIONS[state.gravity];
    setGravityTarget(restoredGravity.x, restoredGravity.y);
    state.displayedGravity = { x: restoredGravity.x, y: restoredGravity.y };
    state.turns = restore?.turns ?? 0;
    state.gateOpen = restore?.gateOpen ?? false;
    state.gateOpenedAt = state.gateOpen ? -1000 : 0;
    state.captures = [];
    state.winAt = 0;
    state.accumulator = 0;
    state.turnFeedbackUntil = 0;
    state.celebrateUntil = 0;
    elements.turnLeft.classList.remove('turn-fired');
    elements.turnRight.classList.remove('turn-fired');
    elements.gravityArrow.classList.remove('arrow-fired');
    elements.stageFrame.classList.remove('gravity-pulse');
    elements.stageFrame.classList.remove('celebrating');
    state.history = restore?.history ?? [];
    state.busy = false;
    state.won = false;
    state.settleSince = 0;
    state.turnStarted = 0;
    state.catWake = 0;
    state.enteredAt = performance.now();
    state.engine.world.gravity.x = state.targetGravity.x;
    state.engine.world.gravity.y = state.targetGravity.y;

    const walls = [
      Bodies.rectangle(500, CEILING - 19, 885, 38, { isStatic: true, restitution: .75 }),
      Bodies.rectangle(500, FLOOR + 18, 885, 38, { isStatic: true, restitution: .75 }),
      Bodies.rectangle(LEFT - 19, 340, 38, 560, { isStatic: true, restitution: .75 }),
      Bodies.rectangle(RIGHT + 19, 340, 38, 560, { isStatic: true, restitution: .75 }),
    ];
    Composite.add(state.engine.world, walls);
    for (const block of LEVELS[index].blocks) {
      const body = Bodies.rectangle(block.x, block.y, block.w, block.h, { isStatic: true, chamfer: { radius: block.kind === 'shelf' ? 5 : 4 } });
      state.blocks.push({ ...block, body });
      if (block.kind !== 'gate' || !state.gateOpen) Composite.add(state.engine.world, body);
    }
    for (const item of LEVELS[index].items) {
      if (state.collected.has(item.id)) continue;
      if (state.gateOpen && item.id === 'block') continue;
      const body = makeItem(item);
      if (restore?.positions?.[item.id]) {
        const p = restore.positions[item.id];
        Body.setPosition(body, { x: p.x, y: p.y });
        Body.setAngle(body, p.angle);
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
      }
      state.bodies.set(item.id, body);
      Composite.add(state.engine.world, body);
    }
    Events.on(state.engine, 'collisionStart', event => {
      const now = performance.now();
      if (now - state.lastCollision < 110) return;
      if (event.pairs.some(p => (p.bodyA.itemId || p.bodyB.itemId) && p.collision.depth > .6)) {
        state.catWake = 1;
        state.lastCollision = now;
        sound('tap');
      }
    });
    elements.stageIndex.textContent = `房间 ${String(index + 1).padStart(2, '0')} / 03`;
    elements.stageLabel.textContent = LEVELS[index].room;
    elements.roomTitle.textContent = LEVELS[index].title;
    elements.roomHint.textContent = LEVELS[index].hint;
    elements.railTip.textContent = LEVELS[index].tip;
    elements.result.hidden = true;
    updateUI();
    updateMotionUI();
  }

  function snapshot() {
    const positions = {};
    for (const [id, body] of state.bodies) positions[id] = { x: body.position.x, y: body.position.y, angle: body.angle };
    return { positions, collected: [...state.collected], gravity: state.gravity, turns: state.turns, gateOpen: state.gateOpen };
  }
  function turn(amount) {
    if (!state.started || (state.busy && state.motionMode === 'off') || state.won || elements.helpDialog.open || elements.settingsDialog.open || elements.startDialog.open) return;
    if (state.motionMode !== 'off') {
      const { x, y } = state.displayedGravity;
      state.gravity = Math.abs(x) > Math.abs(y) ? (x > 0 ? 1 : 3) : (y > 0 ? 0 : 2);
      stopMotion('已切换到触屏操作。');
    }
    state.history.push(snapshot());
    state.gravity = (state.gravity + amount + 4) % 4;
    state.turns++;
    setGravityTarget(DIRECTIONS[state.gravity].x, DIRECTIONS[state.gravity].y);
    for (const body of state.bodies.values()) Sleeping.set(body, false);
    state.busy = true;
    state.turnStarted = performance.now();
    state.turnFeedbackUntil = state.turnStarted + 520;
    const fired = amount < 0 ? elements.turnLeft : elements.turnRight;
    fired.classList.remove('turn-fired');
    void fired.offsetWidth;
    fired.classList.add('turn-fired');
    elements.gravityArrow.classList.remove('arrow-fired');
    void elements.gravityArrow.offsetWidth;
    elements.gravityArrow.classList.add('arrow-fired');
    elements.stageFrame.classList.remove('gravity-pulse');
    void elements.stageFrame.offsetWidth;
    elements.stageFrame.classList.add('gravity-pulse');
    elements.stageFrame.style.setProperty('--pulse-angle', `${state.gravity * 90}deg`);
    state.settleSince = 0;
    sound('turn');
    note(`重力${DIRECTIONS[state.gravity].name} · 房间保持正立`);
    updateUI();
  }
  function undo() {
    if (!state.history.length) return;
    if (state.motionMode !== 'off') stopMotion('已切换到触屏操作。');
    const previous = state.history.pop();
    const rest = [...state.history];
    setupLevel(state.level, { ...previous, history: rest });
    note('回到上一步');
  }
  function reset() { setupLevel(state.level); note('重新开始这一间'); }

  function updateUI() {
    const targets = LEVELS[state.level].items.filter(i => i.target);
    elements.objectiveList.innerHTML = targets.map(i => `<span class="objective-item ${state.collected.has(i.id) ? 'done' : ''}"><span class="dot" aria-hidden="true">${state.collected.has(i.id) ? '✓' : ({ ball: '●', book: '▰', clock: '◉' }[i.kind])}</span>${i.label}</span>`).join('');
    elements.gravityArrow.textContent = '↓';
    elements.turnCount.textContent = state.motionMode !== 'off' ? '手机体感中' : `已转 ${state.turns} 次`;
    elements.turnLeft.disabled = (state.busy && state.motionMode === 'off') || state.won;
    elements.turnRight.disabled = (state.busy && state.motionMode === 'off') || state.won;
    elements.undoButton.disabled = state.history.length === 0;
    for (const button of elements.levelButtons) {
      const selected = Number(button.dataset.level) === state.level;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-current', selected ? 'true' : 'false');
    }
    canvas.setAttribute('aria-label', `${LEVELS[state.level].room}游戏画面，重力${directionName(state.displayedGravity.x, state.displayedGravity.y)}，已收纳${state.collected.size}件物品`);
  }
  function note(message) {
    clearTimeout(state.noteTimer);
    elements.stageNote.textContent = message;
    elements.stageNote.classList.add('show');
    state.noteTimer = setTimeout(() => elements.stageNote.classList.remove('show'), 1750);
  }

  function collectItems() {
    for (const item of LEVELS[state.level].items) {
      if (!item.target || state.collected.has(item.id)) continue;
      const body = state.bodies.get(item.id);
      if (!body) continue;
      const x = body.position.x, y = body.position.y;
      if (x > CATCH.x && x < CATCH.x + CATCH.w && y > CATCH.y && y < CATCH.y + CATCH.h) {
        state.captures.push({ id: item.id, x, y, angle: body.angle, startedAt: performance.now() });
        Composite.remove(state.engine.world, body);
        state.bodies.delete(item.id);
        state.collected.add(item.id);
        state.catWake = 1.6;
        state.celebrateUntil = performance.now() + 1250;
        elements.stageFrame.classList.remove('celebrating');
        void elements.stageFrame.offsetWidth;
        elements.stageFrame.classList.add('celebrating');
        clearTimeout(state.noteTimer);
        elements.stageNote.classList.remove('show');
        sound('collect');
        updateUI();
        if (LEVELS[state.level].items.filter(i => i.target).every(i => state.collected.has(i.id))) {
          state.won = true; state.busy = false; state.winAt = performance.now() + 1350;
        }
      }
    }
  }
  function checkSwitch(time) {
    if (state.level !== 2 || state.gateOpen) return;
    const block = state.bodies.get('block');
    if (!block) return;
    if (block.position.x > 651 && block.position.x < 731 && block.position.y < 142) {
      state.gateOpen = true;
      state.gateOpenedAt = time;
      const gate = state.blocks.find(b => b.kind === 'gate');
      if (gate) Composite.remove(state.engine.world, gate.body);
      Composite.remove(state.engine.world, block);
      state.bodies.delete('block');
      elements.roomHint.textContent = '门开了！现在把闹钟和笔记本送进箱子。';
      note('木块碰到了开关，门打开了');
      sound('collect');
    }
  }
  function win() {
    updateUI();
    elements.resultKicker.textContent = state.level === LEVELS.length - 1 ? '三间房，全部收好' : '打包完成';
    elements.resultTitle.textContent = state.level === LEVELS.length - 1 ? '搬家完成！' : '这一间，收好了。';
    elements.resultText.textContent = `${state.motionMode === 'on' ? '通过手机倾斜改变重力。' : `改变了 ${state.turns} 次重力方向。`}${state.level === LEVELS.length - 1 ? '所有物品都已收纳，可以放心搬进新家。' : '下一间房还有一些小麻烦。'}`;
    elements.nextButton.textContent = state.level === LEVELS.length - 1 ? '再玩一遍 ↗' : '下一间 ↗';
    elements.result.hidden = false;
    sound('win');
    elements.nextButton.focus();
  }

  function sound(kind) {
    if (!state.sound) return;
    try {
      state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (state.audio.state === 'suspended') state.audio.resume();
      const t = state.audio.currentTime;
      const oscillator = state.audio.createOscillator();
      const gain = state.audio.createGain();
      oscillator.type = kind === 'tap' ? 'sine' : 'triangle';
      const base = { tap: 220, turn: 310, collect: 600, win: 510 }[kind];
      oscillator.frequency.setValueAtTime(base, t);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'turn' ? base * .7 : base * 1.35, t + .10);
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(kind === 'tap' ? .028 : .06, t + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, t + (kind === 'win' ? .37 : .17));
      oscillator.connect(gain).connect(state.audio.destination);
      oscillator.start(t); oscillator.stop(t + (kind === 'win' ? .4 : .18));
    } catch { /* Audio is optional. */ }
  }

  function drawBackdrop(time) {
    if (ready(roomImage)) {
      ctx.drawImage(roomImage, 0, 0, W, H);
      return;
    }
    const level = LEVELS[state.level];
    ctx.fillStyle = level.color; ctx.fillRect(0, 0, W, H);
    const wash = ctx.createLinearGradient(0, 0, W, H);
    wash.addColorStop(0, 'rgba(255,255,255,.8)'); wash.addColorStop(.48, 'rgba(255,255,255,.04)'); wash.addColorStop(1, 'rgba(78,108,117,.12)');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
    // Tiny framed room with a visible wall and floor plane.
    roundRect(45, 52, 907, 572, 17, '#ecf6f6', '#91b3c1', 3);
    roundRect(61, 75, 878, 530, 5, level.color, '#d2dfe0', 1);
    ctx.fillStyle = 'rgba(94,122,127,.12)'; ctx.fillRect(65, 77, 870, 16);
    ctx.fillStyle = '#c5d4d1'; ctx.fillRect(65, 584, 870, 22);
    ctx.fillStyle = level.floor; ctx.fillRect(65, 605, 870, 16);
    for (let x = 90; x < 940; x += 120) line(x, 608, x + 12, 620, 'rgba(73,71,63,.23)', 1);
    // Wall seams and illustrated paper texture.
    for (let y = 130; y < 570; y += 82) line(68, y, 930, y, 'rgba(91,135,145,.055)', 1);
    for (let x = 110; x < 920; x += 150) line(x, 87, x, 576, 'rgba(91,135,145,.035)', 1);

    // Window stays behind the play field; it also explains the warm light.
    ctx.save(); ctx.shadowColor = 'rgba(53,93,107,.13)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    roundRect(684, 113, 175, 154, 19, '#d7e9ee', '#7a9aaa', 8); ctx.restore();
    roundRect(697, 126, 149, 128, 10, '#add7db');
    ctx.save(); ctx.beginPath(); ctx.roundRect(697, 126, 149, 128, 10); ctx.clip();
    ctx.fillStyle = '#eaf4ef'; ctx.fillRect(697, 194, 149, 60);
    ellipse(746, 216, 82, 24, '#c9dfce'); ellipse(838, 223, 80, 28, '#9ec7bd');
    ellipse(824, 155, 20, 20, '#f7e3b6');
    ctx.restore();
    line(771, 126, 771, 254, '#edf6f3', 8); line(697, 191, 846, 191, '#edf6f3', 7);
    roundRect(679, 256, 184, 11, 3, '#8baab5');
    // Diagonal sunlight, muted enough not to compete with objects.
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(690, 270); ctx.lineTo(854, 270); ctx.lineTo(924, 592); ctx.lineTo(577, 592); ctx.closePath(); ctx.fill();

    // Picture and taped moving label.
    roundRect(127, 138, 177, 111, 5, '#e8d7c6', '#9b8678', 6);
    roundRect(139, 150, 153, 87, 2, '#e8eef0');
    drawPicture();
    ctx.save(); ctx.translate(326, 125); ctx.rotate(-.045);
    roundRect(0, 0, 111, 46, 3, '#f8f1dc', '#d3c5aa');
    text('搬 家 中', 55, 23, 16, '#927459', 800, 'center'); ctx.restore();

    // Floor rug, illustrated behind all moving objects.
    ellipse(347, 589, 246, 16, 'rgba(40,84,93,.12)');
    roundRect(169, 551, 345, 49, 22, '#b2c7bd');
    roundRect(179, 559, 325, 31, 17, '#d9e5da');
    for (let x = 190; x < 494; x += 18) line(x, 577, x + 8, 571, 'rgba(82,126,117,.21)', 1);

    drawCat(time);
    if (state.level === 0) drawEntryDetails();
    else if (state.level === 1) drawStudyDetails();
    else drawLivingDetails();
  }

  function drawPicture() {
    ctx.fillStyle = '#bcd3d7'; ctx.fillRect(141, 151, 149, 84);
    ctx.fillStyle = '#e5e1c7'; ctx.beginPath(); ctx.moveTo(141, 225); ctx.lineTo(194, 178); ctx.lineTo(228, 211); ctx.lineTo(250, 185); ctx.lineTo(290, 222); ctx.lineTo(290, 235); ctx.lineTo(141, 235); ctx.fill();
    ellipse(256, 169, 11, 11, '#f5e7bd');
    text('HOME', 216, 218, 12, '#608b91', 800, 'center');
  }

  function drawCat(time) {
    const blink = Math.sin(time * .0018) > .994;
    const eyeY = state.catWake > .1 ? 209 : 213;
    // The cat peers from the outside of the illustrated window.
    ellipse(823, 233, 22, 14, '#b88765');
    ctx.fillStyle = '#b88765'; ctx.beginPath(); ctx.moveTo(798, 199); ctx.lineTo(805, 172); ctx.lineTo(820, 193); ctx.lineTo(836, 171); ctx.lineTo(846, 201); ctx.closePath(); ctx.fill();
    ellipse(823, 205, 25, 21, '#c89670');
    ctx.fillStyle = '#dba584'; ctx.beginPath(); ctx.moveTo(805, 187); ctx.lineTo(807, 178); ctx.lineTo(814, 190); ctx.fill();
    ctx.beginPath(); ctx.moveTo(833, 188); ctx.lineTo(838, 179); ctx.lineTo(840, 192); ctx.fill();
    if (blink) { line(813, eyeY, 819, eyeY, '#493b39', 2); line(828, eyeY, 834, eyeY, '#493b39', 2); }
    else { ellipse(816, eyeY, 2.2, 3.2, '#493b39'); ellipse(832, eyeY, 2.2, 3.2, '#493b39'); }
    ellipse(824, 219, 2, 1.5, '#a36a67');
    line(805, 220, 812, 220, '#a37364'); line(835, 220, 843, 219, '#a37364');
    state.catWake = Math.max(0, state.catWake - .012);
  }
  function drawEntryDetails() {
    // Low console table, painted as set dressing outside the collision path.
    roundRect(664, 314, 170, 21, 5, '#9d8570', '#806c5f', 2);
    roundRect(681, 334, 12, 170, 3, '#a88f76'); roundRect(808, 334, 12, 170, 3, '#a88f76');
    roundRect(706, 292, 46, 22, 6, '#7e9c9f');
    line(728, 292, 728, 272, '#628987', 3);
    ellipse(721, 278, 9, 5, '#81a88d'); ellipse(736, 274, 9, 5, '#81a88d');
    text('欢迎回家', 674, 380, 16, 'rgba(80,112,119,.49)', 700);
  }
  function drawStudyDetails() {
    // Decorative board gives the tall obstacle a reason to exist.
    roundRect(558, 325, 86, 20, 4, '#bd9b78');
    roundRect(565, 298, 24, 27, 2, '#6b9ba5'); roundRect(592, 292, 17, 33, 2, '#d69c77');
    roundRect(612, 302, 21, 23, 2, '#93a983');
    text('书房', 535, 136, 20, 'rgba(84,128,118,.43)', 800);
  }
  function drawLivingDetails() {
    roundRect(545, 470, 154, 82, 19, '#b1a5a0', '#8f8781', 2);
    roundRect(536, 457, 161, 39, 11, '#d1b8a7');
    roundRect(551, 470, 52, 39, 11, '#dcbaa8'); roundRect(611, 470, 68, 38, 10, '#c49d90');
    ellipse(616, 551, 85, 13, 'rgba(89,71,68,.12)');
    text('最后一箱', 658, 136, 19, 'rgba(144,106,96,.48)', 800);
  }

  function drawBlocks(time) {
    for (const block of state.blocks) {
      if (block.kind === 'shelf') {
        if (ready(objectsImage)) {
          ctx.save();
          ctx.shadowColor = 'rgba(11,23,25,.28)'; ctx.shadowBlur = 20; ctx.shadowOffsetX = 12;
          sprite(...SPRITES.shelf, block.x - block.w / 2, block.y - block.h / 2, block.w, block.h);
          ctx.restore();
          continue;
        }
        ctx.save(); ctx.shadowColor = 'rgba(46,62,60,.22)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 9;
        roundRect(block.x - block.w / 2, block.y - block.h / 2, block.w, block.h, 5, '#9a745c', '#785b4b', 2); ctx.restore();
        roundRect(block.x - block.w / 2 + 6, block.y - block.h / 2 + 8, block.w - 12, block.h - 16, 3, '#b48a68');
        for (let y = block.y - block.h / 2 + 47; y < block.y + block.h / 2 - 4; y += 78) {
          line(block.x - 18, y, block.x + 18, y, '#765947', 5);
          roundRect(block.x - 13, y - 28, 7, 27, 1, '#648993');
          roundRect(block.x - 4, y - 31, 7, 30, 1, '#d5a67f');
          roundRect(block.x + 5, y - 24, 8, 23, 1, '#d7c5a1');
        }
      } else if (block.kind === 'gate') {
        const progress = state.gateOpen ? Math.min(1, (time - state.gateOpenedAt) / 480) : 0;
        if (progress >= 1) continue;
        const rise = progress * block.h;
        ctx.save(); ctx.translate(0, -rise);
        ctx.shadowColor = 'rgba(37,45,42,.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 7;
        roundRect(block.x - block.w / 2, block.y - block.h / 2, block.w, block.h, 5, '#9c7455', '#523b31', 2);
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0;
        const gateWood = ctx.createLinearGradient(block.x - 14, 0, block.x + 14, 0);
        gateWood.addColorStop(0, '#6c4b38'); gateWood.addColorStop(.48, '#b88961'); gateWood.addColorStop(1, '#73503b');
        roundRect(block.x - 11, block.y - block.h / 2 + 4, 22, block.h - 8, 2, gateWood);
        for (let y = block.y - block.h / 2 + 19; y < block.y + block.h / 2 - 7; y += 33) {
          line(block.x - 11, y, block.x + 11, y, 'rgba(58,40,29,.36)', 2);
          ellipse(block.x, y + 6, 1.5, 1.5, '#e6c299');
        }
        ctx.restore();
      } else {
        ctx.save(); ctx.shadowColor = 'rgba(61,58,52,.17)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8;
        roundRect(block.x - block.w / 2, block.y - block.h / 2, block.w, block.h, 5, '#9e8274', '#876a5c', 2); ctx.restore();
        line(block.x - block.w / 2 + 5, block.y - 2, block.x + block.w / 2 - 5, block.y - 2, '#e1c3a4', 2);
        ctx.fillStyle = '#806356';
        for (const bx of [block.x - block.w / 2 + 23, block.x + block.w / 2 - 23]) {
          ctx.beginPath(); ctx.moveTo(bx - 9, block.y + 10); ctx.lineTo(bx + 9, block.y + 10); ctx.lineTo(bx, block.y + 35); ctx.closePath(); ctx.fill();
        }
      }
    }
    if (state.level === 2) {
      roundRect(651, 81, 80, 15, 7, state.gateOpen ? '#8cba98' : '#de9c6e', '#a57557', 1.5);
      for (let x = 661; x < 722; x += 13) ellipse(x, 88, 2, 2, state.gateOpen ? '#dff5d8' : '#fbe1ba');
      if (!state.gateOpen) text('木块开关', 691, 111, 11, '#bd784b', 800, 'center');
      if (state.gateOpen && ready(objectsImage)) sprite(...SPRITES.block.slice(0, 4), 667, 93, 48, 48);
    }
  }

  function drawBox(time) {
    if (ready(objectsImage)) {
      return () => {
        const last = state.captures.at(-1);
        const age = last ? time - last.startedAt : -1000;
        const impact = Math.max(0, 1 - Math.abs(age - 450) / 240);
        const shake = Math.sin(age * .12) * impact * 3;
        ctx.save();
        ctx.translate(870 + shake, 537.5 - impact * 9);
        ctx.scale(1 + impact * .055, 1 + impact * .055);
        ctx.shadowColor = 'rgba(18,14,11,.28)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 12;
        sprite(...SPRITES.box, -80, -71.5, 160, 143);
        ctx.restore();
      };
    }
    const x = 798, y = 526;
    ellipse(858, 608, 83, 13, 'rgba(64,66,54,.2)');
    // Rear wall and visibly open mouth.
    roundRect(x, y, 123, 80, 6, '#8c644a', '#72543f', 2);
    roundRect(x + 7, y + 7, 109, 48, 3, '#594b42');
    ctx.fillStyle = '#ad7d55'; ctx.beginPath(); ctx.moveTo(x + 4, y + 8); ctx.lineTo(x - 16, y - 17); ctx.lineTo(x + 24, y - 21); ctx.lineTo(x + 34, y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c3966e'; ctx.beginPath(); ctx.moveTo(x + 94, y + 8); ctx.lineTo(x + 108, y - 20); ctx.lineTo(x + 138, y - 11); ctx.lineTo(x + 120, y + 8); ctx.closePath(); ctx.fill();
    // Front of box is drawn after the items to visually hold them inside.
    return () => {
      roundRect(x + 2, y + 36, 119, 79, 4, '#bd916a', '#8b654b', 2);
      ctx.fillStyle = 'rgba(230,198,155,.55)'; ctx.fillRect(x + 9, y + 41, 105, 5);
      line(x + 63, y + 42, x + 63, y + 107, 'rgba(114,79,54,.24)', 2);
      roundRect(x + 32, y + 65, 57, 26, 2, '#f1e5ce', '#c7b79b');
      text('搬家箱', x + 61, y + 78, 11, '#8b6a51', 800, 'center');
      roundRect(x + 3, y + 37, 118, 6, 2, '#d2a47a');
      if (state.collected.size) {
        const phase = Math.max(0, Math.sin(time * .014));
        ctx.save(); ctx.globalAlpha = Math.min(.55, phase * .4); ellipse(x + 61, y + 23, 70, 17, '#fff3ca'); ctx.restore();
      }
    };
  }

  function drawBoxFeedback(time) {
    for (const capture of state.captures) {
      const age = time - capture.startedAt - 230;
      if (age < 0 || age > 1050) continue;
      const p = age / 1050;
      ctx.save();
      ctx.translate(868, 526);
      if (age < 510) {
        const ring = age / 510;
        ctx.globalAlpha = .9 * (1 - ring);
        ctx.strokeStyle = '#fff1b8'; ctx.lineWidth = 6 * (1 - ring) + 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 30 + ring * 116, 12 + ring * 51, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const t = age / 1000;
      for (let i = 0; i < 26; i++) {
        const spread = ((i * 37) % 29 - 14) / 14;
        const lift = 215 + ((i * 53) % 9) * 17;
        const x = spread * 205 * t;
        const y = -14 - lift * t + 265 * t * t;
        ctx.save();
        ctx.globalAlpha = Math.min(1, age / 110) * Math.min(1, (1050 - age) / 250);
        ctx.translate(x, y); ctx.rotate((i % 2 ? -1 : 1) * (t * 8 + i));
        roundRect(-4, -7, 8, 14, 2, ['#ffe7a9', '#f4a66f', '#bde4c5', '#fff4d1'][i % 4]);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawContactShadow(body) {
    const bounds = body.bounds;
    const { x, y } = state.displayedGravity;
    const dir = Math.abs(x) > Math.abs(y) ? DIRECTIONS[x > 0 ? 1 : 3] : DIRECTIONS[y >= 0 ? 0 : 2];
    let gap, px, py, horizontal;
    const surfaces = state.blocks.filter(b => b.kind !== 'gate' || !state.gateOpen);
    if (dir.y === 1) {
      const candidates = [FLOOR, ...surfaces.filter(b => bounds.max.x > b.x - b.w / 2 && bounds.min.x < b.x + b.w / 2 && b.y - b.h / 2 >= bounds.max.y - 5).map(b => b.y - b.h / 2)];
      py = Math.min(...candidates); px = body.position.x; gap = Math.max(0, py - bounds.max.y); horizontal = true;
    } else if (dir.y === -1) {
      const candidates = [CEILING, ...surfaces.filter(b => bounds.max.x > b.x - b.w / 2 && bounds.min.x < b.x + b.w / 2 && b.y + b.h / 2 <= bounds.min.y + 5).map(b => b.y + b.h / 2)];
      py = Math.max(...candidates); px = body.position.x; gap = Math.max(0, bounds.min.y - py); horizontal = true;
    } else if (dir.x === 1) {
      const candidates = [RIGHT, ...surfaces.filter(b => bounds.max.y > b.y - b.h / 2 && bounds.min.y < b.y + b.h / 2 && b.x - b.w / 2 >= bounds.max.x - 5).map(b => b.x - b.w / 2)];
      px = Math.min(...candidates); py = body.position.y; gap = Math.max(0, px - bounds.max.x); horizontal = false;
    } else {
      const candidates = [LEFT, ...surfaces.filter(b => bounds.max.y > b.y - b.h / 2 && bounds.min.y < b.y + b.h / 2 && b.x + b.w / 2 <= bounds.min.x + 5).map(b => b.x + b.w / 2)];
      px = Math.max(...candidates); py = body.position.y; gap = Math.max(0, bounds.min.x - px); horizontal = false;
    }
    const near = Math.max(0, 1 - gap / 190);
    if (near < .04) return;
    ctx.save();
    ctx.filter = `blur(${Math.min(15, 3 + gap * .075)}px)`;
    const alpha = .35 * near;
    if (horizontal) ellipse(px + 4, py - dir.y * 2, Math.max(14, (bounds.max.x - bounds.min.x) * .56), 7 + gap * .025, `rgba(20,16,14,${alpha})`);
    else ellipse(px - dir.x * 2, py + 3, 7 + gap * .025, Math.max(14, (bounds.max.y - bounds.min.y) * .55), `rgba(20,16,14,${alpha})`);
    ctx.restore();
  }

  function drawItem(item, body, time, scale = 1, alpha = 1) {
    const x = body.position.x, y = body.position.y;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(body.angle); ctx.scale(scale, scale);
    if (ready(objectsImage)) {
      ctx.shadowColor = 'rgba(13,20,21,.18)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      const [sx, sy, sw, sh, dw, dh] = SPRITES[item.kind];
      sprite(sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      return;
    }
    if (item.kind === 'ball') {
      ctx.shadowColor = 'rgba(31,72,79,.24)'; ctx.shadowBlur = 11; ctx.shadowOffsetY = 7;
      ellipse(0, 0, item.radius, item.radius, '#dfbc6c'); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      const shade = ctx.createRadialGradient(-9, -11, 3, 1, 2, item.radius);
      shade.addColorStop(0, '#fae3a0'); shade.addColorStop(1, '#c7954d');
      ellipse(0, 0, item.radius - 2, item.radius - 2, shade);
      ctx.beginPath(); ctx.arc(-4, 0, item.radius * .8, -.9, 1.3); ctx.strokeStyle = '#f9edc9'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(10, 4, item.radius * .72, 2.0, 4.2); ctx.stroke();
    } else if (item.kind === 'book') {
      ctx.shadowColor = 'rgba(42,61,69,.22)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
      roundRect(-35, -18, 70, 36, 4, '#416d82', '#294f60', 2); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      roundRect(-29, -15, 59, 29, 2, '#5c91a2');
      line(-23, -8, 17, -8, '#bad6d3', 2); line(-23, -2, 10, -2, '#bad6d3', 1.5);
      roundRect(17, -17, 8, 14, 1, '#e9a77d');
    } else if (item.kind === 'clock') {
      ctx.shadowColor = 'rgba(70,63,50,.25)'; ctx.shadowBlur = 11; ctx.shadowOffsetY = 7;
      roundRect(-27, -28, 54, 56, 11, '#e2a06e', '#af704e', 2); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      roundRect(-16, -20, 32, 40, 9, '#f7e9ca', '#d2b593', 2);
      ellipse(0, 0, 2.2, 2.2, '#7f7880'); line(0, 0, 0, -11, '#516c70', 2); line(0, 0, 9, 3, '#516c70', 2);
      roundRect(-21, -36, 12, 7, 3, '#ac795d'); roundRect(9, -36, 12, 7, 3, '#ac795d');
    } else {
      ctx.shadowColor = 'rgba(69,61,48,.23)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
      roundRect(-29, -29, 58, 58, 7, '#c99e70', '#98704f', 2); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      roundRect(-23, -23, 46, 46, 4, '#dfb688');
      line(-23, 0, 23, 0, '#a67f5c', 3); line(0, -23, 0, 23, '#a67f5c', 3);
      roundRect(-17, -18, 13, 10, 2, '#f6e5c2');
    }
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    drawBackdrop(time);
    drawBlocks(time);
    for (const body of state.bodies.values()) drawContactShadow(body);
    const boxFront = drawBox(time);
    for (const item of LEVELS[state.level].items) {
      const body = state.bodies.get(item.id);
      if (body) drawItem(item, body, time);
    }
    for (const capture of state.captures) {
      const progress = Math.min(1, (time - capture.startedAt) / 480);
      if (progress >= 1) continue;
      const eased = 1 - Math.pow(1 - progress, 3);
      const item = LEVELS[state.level].items.find(i => i.id === capture.id);
      const body = { position: { x: capture.x + (865 - capture.x) * eased, y: capture.y + (568 - capture.y) * eased }, angle: capture.angle + eased * .18 };
      drawItem(item, body, time, 1 - eased * .55, 1 - eased);
    }
    boxFront();
    drawBoxFeedback(time);
    // Soft foreground reflections preserve the glass display case feel.
    ctx.save(); ctx.globalAlpha = .28;
    const gloss = ctx.createLinearGradient(43, 50, 390, 400);
    gloss.addColorStop(0, 'rgba(255,255,255,.65)'); gloss.addColorStop(.5, 'rgba(255,255,255,.04)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss; ctx.beginPath(); ctx.moveTo(56, 60); ctx.lineTo(330, 60); ctx.lineTo(132, 370); ctx.lineTo(56, 370); ctx.closePath(); ctx.fill(); ctx.restore();
    // Direction is displayed with the physical controls below the room.
  }

  function tick(time) {
    state.frame = requestAnimationFrame(tick);
    const delta = Math.min(50, Math.max(0, time - (state.time || time)));
    state.time = time;
    if (state.engine) updateGravity(time);
    if (state.motionMode === 'waiting' && time - state.motionStartedAt > 3500) {
      stopMotion('没有收到传感器数据，已切换为按钮操作。');
    }
    if (state.motionMode === 'on' && state.motionLastAt && time - state.motionLastAt > 2200) {
      stopMotion('传感器暂时没有数据，已切回按钮操作。');
    }
    if (!document.hidden && state.engine && state.started && !state.won && !elements.helpDialog.open && !elements.settingsDialog.open && !elements.startDialog.open) {
      state.accumulator = Math.min(50, state.accumulator + delta);
      while (state.accumulator >= 16.6667) {
        Engine.update(state.engine, 16.6667);
        state.accumulator -= 16.6667;
      }
      checkSwitch(time);
      collectItems();
      if (state.busy && !state.won) {
        const awake = [...state.bodies.values()].some(b => b.speed > .7 || Math.abs(b.angularSpeed) > .035);
        if (!awake) state.settleSince ||= time;
        else state.settleSince = 0;
        if ((state.settleSince && time - state.settleSince > 300) || time - state.turnStarted > 4200) {
          state.busy = false; updateUI();
        }
      }
    }
    if (state.winAt && time >= state.winAt) { state.winAt = 0; win(); }
    if (state.turnFeedbackUntil && time >= state.turnFeedbackUntil) {
      state.turnFeedbackUntil = 0;
      elements.turnLeft.classList.remove('turn-fired');
      elements.turnRight.classList.remove('turn-fired');
      elements.stageFrame.classList.remove('gravity-pulse');
    }
    if (state.celebrateUntil && time >= state.celebrateUntil) {
      state.celebrateUntil = 0;
      elements.stageFrame.classList.remove('celebrating');
    }
    state.captures = state.captures.filter(c => time - c.startedAt < 1300);
    draw(time);
  }

  function toggleSound() {
    state.sound = !state.sound;
    elements.soundButton.setAttribute('aria-pressed', String(state.sound));
    elements.soundButton.setAttribute('aria-label', state.sound ? '关闭游戏音效，当前已开启' : '开启游戏音效，当前已关闭');
    elements.soundButton.title = state.sound ? '音效已开启' : '音效已关闭';
    elements.soundState.textContent = state.sound ? '开' : '关';
    if (state.sound) sound('collect');
  }

  elements.turnLeft.addEventListener('click', () => turn(-1));
  elements.turnRight.addEventListener('click', () => turn(1));
  elements.startMotion.addEventListener('click', () => {
    state.started = true;
    elements.startDialog.close();
    toggleMotion();
  });
  elements.startButtons.addEventListener('click', () => {
    state.started = true;
    elements.startDialog.close();
    updateMotionUI('按钮操作中，可随时在设置里切换体感。');
  });
  elements.startDialog.addEventListener('cancel', event => event.preventDefault());
  elements.settingsButton.addEventListener('click', () => elements.settingsDialog.showModal());
  elements.settingsClose.addEventListener('click', () => elements.settingsDialog.close());
  elements.modeMotion.addEventListener('click', () => {
    if (state.motionMode === 'off') toggleMotion();
  });
  elements.modeButtons.addEventListener('click', () => {
    if (state.motionMode !== 'off') stopMotion('已切换为按钮操作。');
  });
  for (const button of elements.levelButtons) button.addEventListener('click', () => {
    setupLevel(Number(button.dataset.level));
    elements.settingsDialog.close();
    note(`已进入${LEVELS[state.level].room}`);
  });
  window.addEventListener('devicemotion', onDeviceMotion);
  window.addEventListener('deviceorientation', onDeviceOrientation);
  elements.undoButton.addEventListener('click', undo);
  elements.resetButton.addEventListener('click', reset);
  elements.retryResult.addEventListener('click', reset);
  elements.nextButton.addEventListener('click', () => setupLevel((state.level + 1) % LEVELS.length));
  elements.soundButton.addEventListener('click', toggleSound);
  elements.helpButton.addEventListener('click', () => {
    elements.settingsDialog.close();
    elements.helpDialog.showModal();
  });
  window.addEventListener('keydown', event => {
    if (!state.started || elements.helpDialog.open || elements.settingsDialog.open || elements.startDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); turn(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); turn(1); }
    if (event.key.toLowerCase() === 'z') undo();
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key.toLowerCase() === 'm') toggleSound();
  });
  document.addEventListener('visibilitychange', () => { state.time = 0; });
  setupLevel(0);
  elements.startDialog.showModal();
  requestAnimationFrame(tick);
})();
