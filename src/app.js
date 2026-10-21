(() => {
  'use strict';
  const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter;
  const W = 1000, H = 680;
  const FLOOR = 604, CEILING = 76, LEFT = 62, RIGHT = 938;
  const CATCH = { x: 800, y: 530, w: 88, h: 74 };
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
      room: '书房', title: '等吊灯摆过去。', hint: '绕过书架后，留意会摆动的阅读灯。', color: '#eaf1e9', floor: '#ab947d',
      items: [
        { id: 'ball', kind: 'ball', label: '网球', x: 230, y: 574, radius: 30, target: true },
        { id: 'book', kind: 'book', label: '笔记本', x: 296, y: 569, w: 60, h: 70, target: true },
      ],
      blocks: [{ x: 477, y: 388, w: 148, h: 428, kind: 'shelf' }],
      tip: '先越过书架，再抓住吊灯摆开的空隙。',
    },
    {
      room: '客厅', title: '客厅里有一道门。', hint: '把木块送到高处的橙色开关，打开收纳通道。', color: '#f0e9e5', floor: '#b48b71',
      items: [
        { id: 'clock', kind: 'clock', label: '闹钟', x: 180, y: 571, w: 64, h: 66, target: true },
        { id: 'book', kind: 'book', label: '笔记本', x: 304, y: 569, w: 60, h: 70, target: true },
        { id: 'block', kind: 'block', label: '木块', x: 630, y: 394, w: 65, h: 65, target: false },
      ],
      blocks: [
        { x: 478, y: 388, w: 148, h: 428, kind: 'divider' },
        { x: 697, y: 439, w: 160, h: 24, kind: 'ledge' },
        { x: 775, y: 437, w: 32, h: 334, kind: 'gate' },
      ],
      switch: { item: 'block', minX: 651, maxX: 731, maxY: 142, x: 692, y: 88 },
      tip: '只有木块能启动高处的开关。',
    },
    {
      room: '厨房', title: '借弹簧穿过橱柜。', hint: '弹簧会把物件弹起；瞄准上下橱柜间的空隙。', color: '#e7e8d2', floor: '#b89269',
      items: [
        { id: 'ball', kind: 'ball', label: '网球', x: 155, y: 570, radius: 30, target: true },
        { id: 'book', kind: 'book', label: '食谱', x: 250, y: 569, w: 60, h: 70, target: true },
        { id: 'mug', kind: 'mug', label: '马克杯', x: 315, y: 571, w: 60, h: 66, target: true },
      ],
      blocks: [
        { x: 478, y: 517, w: 148, h: 174, kind: 'counter' },
        { x: 478, y: 188, w: 148, h: 224, kind: 'hangingCabinet' },
        { x: 697, y: 439, w: 160, h: 24, kind: 'ledge' },
      ],
      spring: { x: 365, y: 590, w: 68, h: 24 },
      tip: '先观察弹跳轨迹，再调重力对准橱柜间的空隙。',
    },
    {
      room: '工作间', title: '等传送带转向。', hint: '传送带每隔几秒自行换向；看准它向右的时机。', color: '#dce0e4', floor: '#ad8c78',
      items: [
        { id: 'ball', kind: 'ball', label: '网球', x: 135, y: 570, radius: 30, target: true },
        { id: 'book', kind: 'book', label: '笔记本', x: 218, y: 569, w: 60, h: 70, target: true },
        { id: 'clock', kind: 'clock', label: '闹钟', x: 310, y: 571, w: 64, h: 66, target: true },
        { id: 'mug', kind: 'mug', label: '马克杯', x: 385, y: 571, w: 60, h: 66, target: true },
      ],
      blocks: [
        { x: 490, y: 470, w: 132, h: 264, kind: 'workbench' },
        { x: 650, y: 298, w: 36, h: 444, kind: 'toolRack' },
      ],
      belt: { x: 628, y: 591, w: 154, h: 24, period: 3200 },
      tip: '箭头和刻度会提示下一次换向；只需控制物件何时落下。',
    },
  ];
  const TRANSITION_TIPS = [
    '搬家小贴士：先轻轻推，留出转身的空间。',
    '游戏提示：利用天花板，也能绕开家具。',
    '小猫说：看见橙色开关，就找找能碰它的木块。',
    '游戏提示：厨房的弹簧垫能改变物件的运动轨迹。',
    '小猫说：传送带会自己换向，等它朝纸箱走再落下。',
  ];

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const elements = {
    stageFrame: document.querySelector('.stage-frame'),
    stageSection: document.querySelector('.stage-section'),
    stageIndex: $('stageIndex'), stageLabel: $('stageLabel'), roomTitle: $('roomTitle'), roomHint: $('roomHint'),
    objectiveList: $('objectiveList'),
    turnLeft: $('turnLeft'), turnRight: $('turnRight'), undoButton: $('undoButton'), resetButton: $('resetButton'),
    railTip: $('railTip'), stageNote: $('stageNote'), result: $('result'), resultTitle: $('resultTitle'),
    nextButton: $('nextButton'),
    retryResult: $('retryResult'), soundButton: $('soundButton'), helpButton: $('helpButton'), helpDialog: $('helpDialog'),
    startDialog: $('startDialog'), startMotion: $('startMotion'), startButtons: $('startButtons'),
    settingsDialog: $('settingsDialog'), settingsButton: $('settingsButton'), settingsClose: $('settingsClose'),
    modeMotion: $('modeMotion'), modeButtons: $('modeButtons'), motionStatus: $('motionStatus'),
    levelButtons: [...document.querySelectorAll('.level-option')], controlPanel: document.querySelector('.control-panel'),
    catIntro: $('catIntro'), catIntroText: $('catIntroText'), catIntroTyped: $('catIntroTyped'), catIntroStep: $('catIntroStep'), catIntroNext: $('catIntroNext'),
    catIntroImage: $('catIntroImage'), pixelTransition: $('pixelTransition'), transitionCatImage: $('transitionCatImage'),
    transitionKicker: $('transitionKicker'), transitionRoom: $('transitionRoom'), transitionTip: $('transitionTip'),
  };
  const state = {
    level: 0, engine: null, bodies: new Map(), blocks: [], collected: new Set(), gravity: 0,
    turns: 0, history: [], busy: false, won: false, sound: false, audio: null, noiseBuffer: null,
    time: 0, accumulator: 0, settleSince: 0, turnStarted: 0, catWake: 0, lastCollision: 0, lastObjectCollision: 0,
    noteTimer: 0, enteredAt: performance.now(), frame: 0, gateOpen: false, gateOpenedAt: 0,
    captures: [], winAt: 0, turnFeedbackUntil: 0, celebrateUntil: 0,
    lampBody: null, springCooldown: new Map(), springFlashUntil: 0, beltDirection: -1, beltFlashUntil: 0, beltProgress: 0,
    targetGravity: { x: 0, y: 1 }, displayedGravity: { x: 0, y: 1 },
    motionMode: 'off', motionKind: null, motionLastAt: 0, motionStartedAt: 0, started: false,
    introStep: -1, introTypingTimer: 0, transitionTimer: 0, transitioning: false, levels: LEVELS,
  };
  const art = createPixelArt(ctx, state);

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
    if (time - (state.lastAriaAt || 0) > 500) {
      canvas.setAttribute('aria-label', `${LEVELS[state.level].room}游戏画面，重力${directionName(x, y)}，已收纳${state.collected.size}件物品${state.level === 4 ? `；传送带${state.beltDirection > 0 ? '向右' : '向左'}` : ''}`);
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
    elements.motionStatus.textContent = message || (state.motionMode === 'waiting' ? '正在等待手机传感器…' : motionSelected ? '体感已开启，倾斜手机即可控制。' : '按钮操作中，可随时改为体感。');
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
      updateMotionUI('体感已开启。慢慢倾斜手机，让物件自然移动。');
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
    state.lampBody = null;
    state.springCooldown = new Map();
    state.springFlashUntil = 0;
    state.beltDirection = -1;
    state.beltFlashUntil = 0;
    state.beltProgress = 0;
    state.captures = [];
    state.winAt = 0;
    state.accumulator = 0;
    state.turnFeedbackUntil = 0;
    state.celebrateUntil = 0;
    elements.turnLeft.classList.remove('turn-fired');
    elements.turnRight.classList.remove('turn-fired');
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
    if (index === 1) {
      state.lampBody = Bodies.circle(680, 285, 32, { isStatic: true, restitution: .76, friction: .04, label: 'reading-lamp' });
      Composite.add(state.engine.world, state.lampBody);
    }
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
      const impacts = event.pairs.filter(p => (p.bodyA.itemId || p.bodyB.itemId) && p.collision.depth > .6);
      if (!impacts.length) return;
      // Two moving objects get their own layered sound, even when one of them
      // also touches a wall in this physics step.
      const objectPairs = impacts.filter(p => p.bodyA.itemId && p.bodyB.itemId);
      const candidates = objectPairs.length ? objectPairs : impacts;
      const relativeSpeed = p => Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
      const pair = candidates.reduce((best, current) => relativeSpeed(current) > relativeSpeed(best) ? current : best);
      const speed = relativeSpeed(pair);
      if (speed < .65) return;
      if (objectPairs.length ? now - state.lastObjectCollision < 90 : now - state.lastCollision < 110) return;
      state.catWake = 1;
      if (objectPairs.length) state.lastObjectCollision = now;
      else state.lastCollision = now;
      const intensity = Math.max(.32, Math.min(1, speed / 9));
      if (objectPairs.length) sound('clash', pair.bodyA.itemKind, intensity, pair.bodyB.itemKind);
      else sound('tap', (pair.bodyA.itemId ? pair.bodyA : pair.bodyB).itemKind, intensity);
    });
    elements.stageIndex.textContent = `房间 ${String(index + 1).padStart(2, '0')} / ${String(LEVELS.length).padStart(2, '0')}`;
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
    if (!state.started || state.transitioning || !elements.catIntro.hidden || (state.busy && state.motionMode === 'off') || state.won || elements.helpDialog.open || elements.settingsDialog.open || elements.startDialog.open) return;
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
    state.settleSince = 0;
    sound('turn');
    note(`重力${DIRECTIONS[state.gravity].name}`);
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
    elements.objectiveList.innerHTML = targets.map(i => `<span class="objective-item ${state.collected.has(i.id) ? 'done' : ''}"><span class="dot" aria-hidden="true">${state.collected.has(i.id) ? '✓' : ({ ball: '●', book: '▰', clock: '◉', mug: '▣' }[i.kind])}</span>${i.label}</span>`).join('');
    elements.turnLeft.disabled = (state.busy && state.motionMode === 'off') || state.won;
    elements.turnRight.disabled = (state.busy && state.motionMode === 'off') || state.won;
    elements.undoButton.disabled = state.history.length === 0;
    for (const button of elements.levelButtons) {
      const selected = Number(button.dataset.level) === state.level;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-current', selected ? 'true' : 'false');
    }
    canvas.setAttribute('aria-label', `${LEVELS[state.level].room}游戏画面，重力${directionName(state.displayedGravity.x, state.displayedGravity.y)}，已收纳${state.collected.size}件物品${state.level === 4 ? `；传送带${state.beltDirection > 0 ? '向右' : '向左'}` : ''}`);
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
    const trigger = LEVELS[state.level].switch;
    if (!trigger || state.gateOpen) return;
    const block = state.bodies.get(trigger.item);
    if (!block) return;
    if (block.position.x > trigger.minX && block.position.x < trigger.maxX && block.position.y < trigger.maxY) {
      state.gateOpen = true;
      state.gateOpenedAt = time;
      const gate = state.blocks.find(b => b.kind === 'gate');
      if (gate) Composite.remove(state.engine.world, gate.body);
      Composite.remove(state.engine.world, block);
      state.bodies.delete(trigger.item);
      elements.roomHint.textContent = '门开了！现在把待收纳的物品送进箱子。';
      note('木块碰到了开关，门打开了');
      sound('gate');
    }
  }
  function moveLamp(time) {
    if (!state.lampBody) return;
    const offset = Math.sin((time - state.enteredAt) * .00155) * 75;
    Body.setPosition(state.lampBody, { x: 680 + offset, y: 94 + Math.sqrt(191 * 191 - offset * offset) });
  }
  function applyRoomMechanics(time) {
    const spring = LEVELS[state.level].spring;
    if (spring) {
      for (const [id, body] of state.bodies) {
        if (time - (state.springCooldown.get(id) ?? -1000) < 780) continue;
        if (body.position.x < spring.x - spring.w / 2 || body.position.x > spring.x + spring.w / 2) continue;
        if (body.bounds.max.y < spring.y - spring.h / 2 || body.position.y > spring.y || body.velocity.y < -1) continue;
        const lift = body.itemKind === 'book' ? 22 : body.itemKind === 'mug' ? 20 : 19;
        Body.setVelocity(body, { x: Math.max(9, body.velocity.x), y: -lift });
        Sleeping.set(body, false);
        state.springCooldown.set(id, time);
        state.springFlashUntil = time + 260;
        sound('spring');
      }
    }
    const belt = LEVELS[state.level].belt;
    if (belt) {
      for (const body of state.bodies.values()) {
        if (body.position.x < belt.x - belt.w / 2 || body.position.x > belt.x + belt.w / 2) continue;
        if (body.bounds.max.y < belt.y - belt.h / 2 || body.position.y < belt.y - 76) continue;
        Body.setVelocity(body, { x: Math.max(-11, Math.min(11, body.velocity.x + state.beltDirection * .94)), y: body.velocity.y });
        Sleeping.set(body, false);
      }
    }
  }
  function updateBeltCycle(time) {
    const belt = LEVELS[state.level].belt;
    if (!belt) return;
    const elapsed = Math.max(0, time - state.enteredAt);
    const direction = Math.floor(elapsed / belt.period) % 2 === 0 ? -1 : 1;
    state.beltProgress = (elapsed % belt.period) / belt.period;
    if (direction !== state.beltDirection) {
      state.beltDirection = direction;
      state.beltFlashUntil = time + 340;
      if (state.started && !document.hidden && !state.transitioning) sound('belt');
    }
  }
  function win() {
    updateUI();
    elements.resultTitle.textContent = '打包完成';
    elements.nextButton.textContent = state.level === LEVELS.length - 1 ? '再玩一遍 ↗' : '下一间 ↗';
    elements.result.hidden = false;
    sound('win');
    elements.nextButton.focus();
  }

  function sound(kind, material = 'ball', intensity = 1, otherMaterial = null) {
    if (!state.sound) return;
    try {
      state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (state.audio.state === 'suspended') state.audio.resume();
      const audio = state.audio, t = audio.currentTime;
      const tone = (type, startHz, endHz, at, duration, volume) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startHz, at);
        oscillator.frequency.exponentialRampToValueAtTime(endHz, at + duration);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), at + Math.min(.014, duration * .18));
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(at); oscillator.stop(at + duration + .02);
      };
      const noise = (at, duration, volume, cutoff) => {
        if (!state.noiseBuffer) {
          const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .25), audio.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          state.noiseBuffer = buffer;
        }
        const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
        source.buffer = state.noiseBuffer;
        filter.type = 'lowpass'; filter.frequency.value = cutoff;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), at + .006);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        source.connect(filter).connect(gain).connect(audio.destination);
        source.start(at); source.stop(at + duration + .01);
      };
      if (kind === 'clash') {
        const voices = {
          ball: ['sine', 395, 215, .028],
          book: ['triangle', 155, 92, .021],
          clock: ['sine', 1030, 775, .023],
          mug: ['sine', 725, 515, .025],
          block: ['square', 235, 118, .018],
        };
        const first = voices[material], second = voices[otherMaterial];
        tone(first[0], first[1], first[2], t, .14, first[3] * intensity);
        tone(second[0], second[1], second[2], t + .032, .18, second[3] * intensity);
        if (material === 'book' || otherMaterial === 'book') noise(t, .085, .015 * intensity, 1400);
        if (material === 'block' || otherMaterial === 'block') noise(t, .055, .012 * intensity, 700);
      } else if (kind === 'tap') {
        if (material === 'ball') {
          tone('sine', 340, 165, t, .115, .035 * intensity);
          tone('triangle', 130, 90, t, .07, .012 * intensity);
        } else if (material === 'book') {
          noise(t, .09, .023 * intensity, 1150);
          tone('sine', 125, 85, t, .09, .012 * intensity);
        } else if (material === 'clock') {
          tone('sine', 910, 750, t, .24, .021 * intensity);
          tone('sine', 1350, 1120, t + .035, .28, .012 * intensity);
        } else if (material === 'mug') {
          tone('sine', 725, 515, t, .22, .027 * intensity);
          tone('triangle', 1180, 810, t + .03, .17, .012 * intensity);
        } else {
          tone('triangle', 205, 95, t, .13, .038 * intensity);
          noise(t, .075, .012 * intensity, 650);
        }
      } else if (kind === 'turn') {
        tone('triangle', 310, 185, t, .14, .037);
        noise(t, .055, .009, 900);
      } else if (kind === 'collect') {
        noise(t, .11, .012, 2300);
        tone('sine', 480, 690, t + .035, .25, .042);
        tone('sine', 900, 1180, t + .13, .29, .025);
      } else if (kind === 'gate') {
        tone('square', 260, 190, t, .10, .015);
        tone('sine', 520, 780, t + .11, .2, .025);
      } else if (kind === 'spring') {
        tone('square', 290, 520, t, .14, .026);
        tone('sine', 520, 790, t + .08, .18, .018);
      } else if (kind === 'belt') {
        tone('triangle', 245, 370, t, .18, .028);
        tone('square', 510, 420, t + .1, .08, .009);
      } else if (kind === 'win') {
        [523, 659, 784, 1047].forEach((pitch, index) => {
          tone('sine', pitch, pitch * 1.01, t + index * .15, .44, .03);
          tone('triangle', pitch / 2, pitch / 2, t + index * .15, .27, .012);
        });
      } else if (kind === 'ui') {
        tone('sine', 620, 810, t, .12, .025);
      } else if (kind === 'type') {
        const pitch = 590 + (material.codePointAt(0) % 4) * 42;
        tone('square', pitch, pitch * .8, t, .032, .006);
      }
    } catch { /* Audio is optional. */ }
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    art.drawBackdrop(time);
    art.drawBlocks(time);
    art.drawMechanisms(time);
    for (const body of state.bodies.values()) art.drawContactShadow(body);
    const boxFront = art.drawBox(time);
    for (const item of LEVELS[state.level].items) {
      const body = state.bodies.get(item.id);
      if (body) art.drawItem(item, body, time);
    }
    for (const capture of state.captures) {
      const progress = Math.min(1, (time - capture.startedAt) / 480);
      if (progress >= 1) continue;
      const eased = 1 - Math.pow(1 - progress, 3);
      const item = LEVELS[state.level].items.find(i => i.id === capture.id);
      const body = { position: { x: capture.x + (830 - capture.x) * eased, y: capture.y + (550 - capture.y) * eased }, angle: capture.angle + eased * .18 };
      art.drawItem(item, body, time, 1 - eased * .55, 1 - eased);
    }
    boxFront();
    art.drawBoxFeedback(time);
  }

  function tick(time) {
    state.frame = requestAnimationFrame(tick);
    const delta = Math.min(50, Math.max(0, time - (state.time || time)));
    state.time = time;
    updateBeltCycle(time);
    if (state.engine) updateGravity(time);
    moveLamp(time);
    if (state.motionMode === 'waiting' && time - state.motionStartedAt > 3500) {
      stopMotion('没有收到传感器数据，已切换为按钮操作。');
    }
    if (state.motionMode === 'on' && state.motionLastAt && time - state.motionLastAt > 2200) {
      stopMotion('传感器暂时没有数据，已切回按钮操作。');
    }
    if (!document.hidden && state.engine && state.started && !state.transitioning && elements.catIntro.hidden && !state.won && !elements.helpDialog.open && !elements.settingsDialog.open && !elements.startDialog.open) {
      state.accumulator = Math.min(50, state.accumulator + delta);
      while (state.accumulator >= 16.6667) {
        Engine.update(state.engine, 16.6667);
        applyRoomMechanics(time);
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
    }
    if (state.celebrateUntil && time >= state.celebrateUntil) {
      state.celebrateUntil = 0;
      elements.stageFrame.classList.remove('celebrating');
    }
    state.captures = state.captures.filter(c => time - c.startedAt < 1300);
    draw(time);
  }

  function setSound(enabled, feedback = false) {
    state.sound = enabled;
    elements.soundButton.setAttribute('aria-pressed', String(state.sound));
    elements.soundButton.setAttribute('aria-label', state.sound ? '关闭游戏音效，当前已开启' : '开启游戏音效，当前已关闭');
    elements.soundButton.title = state.sound ? '音效已开启' : '音效已关闭';
    if (state.sound) {
      try {
        state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
        if (state.audio.state === 'suspended') state.audio.resume();
      } catch { /* Audio is optional. */ }
      if (feedback) sound('ui');
    }
  }
  function toggleSound() { setSound(!state.sound, true); }

  function showIntro() {
    state.introStep = 0;
    elements.catIntroImage.src = art.catPortrait();
    elements.catIntro.hidden = false;
    updateIntro();
    elements.catIntroNext.focus();
  }
  function updateIntro() {
    const lines = [
      '喵！搬家开始啦。我会在窗边陪你。先把小球送进右边的纸箱。',
      state.motionMode === 'off' ? '按左、右按钮，每次让重力转 90°。房间不会跟着转，看看物件怎么滚动吧。' : '把手机朝想让物件去的方向倾斜；就像真的把东西放在掌心。',
      '后面的房间有更多物件和机关。木块能触发橙色开关；遇到困难可以撤销，也能在设置里选关。',
    ];
    clearInterval(state.introTypingTimer);
    const line = lines[state.introStep];
    elements.catIntroText.dataset.fullText = line;
    elements.catIntroText.setAttribute('aria-label', line);
    elements.catIntroTyped.textContent = '';
    elements.catIntroText.classList.remove('typing');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.catIntroTyped.textContent = line;
    } else {
      const characters = [...line];
      let length = 0;
      elements.catIntroText.classList.add('typing');
      state.introTypingTimer = setInterval(() => {
        length++;
        elements.catIntroTyped.textContent = characters.slice(0, length).join('');
        if (!/[\s，。！；：、,.!?]/u.test(characters[length - 1])) sound('type', characters[length - 1]);
        if (length >= characters.length) {
          clearInterval(state.introTypingTimer);
          state.introTypingTimer = 0;
          elements.catIntroText.classList.remove('typing');
        }
      }, 52);
    }
    elements.catIntroStep.textContent = `${state.introStep + 1} / ${lines.length}`;
    elements.catIntroNext.textContent = state.introStep === lines.length - 1 ? '开始搬家 ↗' : '继续 ↗';
  }
  function advanceIntro() {
    if (state.introStep < 2) {
      state.introStep++;
      updateIntro();
      sound('ui');
    } else {
      clearInterval(state.introTypingTimer);
      state.introTypingTimer = 0;
      elements.catIntro.hidden = true;
      state.introStep = -1;
      if (state.motionMode === 'off') elements.turnRight.focus();
      else canvas.focus();
    }
  }
  function transitionToLevel(index) {
    if (state.transitioning) return;
    state.transitioning = true;
    elements.result.hidden = true;
    elements.transitionCatImage.src = art.catPortrait();
    elements.transitionKicker.textContent = index === 0 ? '再出发' : `第 ${String(index + 1).padStart(2, '0')} 间`;
    elements.transitionRoom.textContent = LEVELS[index].room;
    elements.transitionTip.textContent = TRANSITION_TIPS[index];
    elements.pixelTransition.hidden = false;
    clearTimeout(state.transitionTimer);
    state.transitionTimer = setTimeout(() => {
      setupLevel(index);
      elements.pixelTransition.hidden = true;
      state.transitioning = false;
      if (state.motionMode === 'off') elements.turnRight.focus();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 1650);
  }

  elements.turnLeft.addEventListener('click', () => turn(-1));
  elements.turnRight.addEventListener('click', () => turn(1));
  elements.startMotion.addEventListener('click', () => {
    state.started = true;
    setSound(true);
    elements.startDialog.close();
    toggleMotion();
    showIntro();
  });
  elements.startButtons.addEventListener('click', () => {
    state.started = true;
    setSound(true);
    elements.startDialog.close();
    updateMotionUI('按钮操作中，可随时在设置里切换体感。');
    showIntro();
  });
  elements.catIntroNext.addEventListener('click', advanceIntro);
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
    elements.settingsDialog.close();
    transitionToLevel(Number(button.dataset.level));
  });
  window.addEventListener('devicemotion', onDeviceMotion);
  window.addEventListener('deviceorientation', onDeviceOrientation);
  elements.undoButton.addEventListener('click', undo);
  elements.resetButton.addEventListener('click', reset);
  elements.retryResult.addEventListener('click', reset);
  elements.nextButton.addEventListener('click', () => transitionToLevel((state.level + 1) % LEVELS.length));
  elements.soundButton.addEventListener('click', toggleSound);
  elements.helpButton.addEventListener('click', () => {
    elements.settingsDialog.close();
    elements.helpDialog.showModal();
  });
  window.addEventListener('keydown', event => {
    if (!state.started || state.transitioning || !elements.catIntro.hidden || elements.helpDialog.open || elements.settingsDialog.open || elements.startDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
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
