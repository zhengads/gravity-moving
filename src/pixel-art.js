// All artwork is drawn on a 250 × 170 pixel grid and enlarged without smoothing.
// The physics world remains 1000 × 680, so each painted pixel is four world units.
function createPixelArt(ctx, state) {
  const P = 4, W = 250, H = 170;
  const screen = document.createElement('canvas');
  screen.width = W; screen.height = H;
  const g = screen.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const fill = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const palettes = [
    { wall: '#c5d7b7', fleck: '#b4c7a8', trim: '#466369', wood: '#ad785d', floor: '#d1a47b', dark: '#263c48', accent: '#d87c51' },
    { wall: '#b9d0d6', fleck: '#a9c0c6', trim: '#416577', wood: '#7b928e', floor: '#aaaba0', dark: '#294558', accent: '#dfaa5f' },
    { wall: '#dfc9ce', fleck: '#cfb7bd', trim: '#625878', wood: '#a77776', floor: '#c89b91', dark: '#4a405a', accent: '#efad71' },
    { wall: '#d6d9b7', fleck: '#c8cba6', trim: '#657668', wood: '#aa8568', floor: '#c9ab80', dark: '#3b5557', accent: '#e2a45d' },
    { wall: '#bacbd3', fleck: '#aabdc8', trim: '#526677', wood: '#987c78', floor: '#b59b87', dark: '#314b5b', accent: '#eaaa6b' },
  ];

  function frame(c, x, y, w, h, edge, face) {
    fill(c, x, y, w, h, edge);
    fill(c, x + 2, y + 2, w - 4, h - 4, face);
  }

  function paintWindow(c) {
    // One familiar window stays in all three rooms; it is the cat's anchor.
    fill(c, 186, 26, 44, 48, '#243e52');
    fill(c, 189, 29, 38, 41, '#e5e1b7');
    fill(c, 191, 31, 34, 36, '#98cbcf');
    fill(c, 191, 43, 34, 24, '#cce4d1');
    fill(c, 191, 54, 34, 13, '#8ebc9b');
    for (let x = 194; x < 224; x += 7) fill(c, x, 55 + x % 3, 4, 12, '#6caa88');
    fill(c, 188, 28, 40, 3, '#f8e4b7');
    fill(c, 187, 30, 3, 39, '#f4d9a8');
    fill(c, 226, 30, 3, 39, '#a87863');
    fill(c, 190, 31, 2, 35, '#f8e9be');
    fill(c, 224, 31, 2, 35, '#c28769');
    fill(c, 187, 67, 43, 4, '#493f51');
    fill(c, 185, 70, 47, 4, '#c7895b');
    fill(c, 187, 70, 43, 1, '#f6c788');
  }

  function paintEntrance(c, p) {
    // A door, key rack and parcel labels read as a hallway even at phone size.
    frame(c, 25, 37, 42, 111, p.dark, '#e8c597');
    fill(c, 29, 41, 34, 103, '#659795');
    fill(c, 31, 44, 30, 98, '#8bb7a1');
    frame(c, 35, 53, 22, 36, '#507a79', '#afc9a5');
    frame(c, 35, 96, 22, 34, '#507a79', '#a0bea0');
    fill(c, 58, 89, 3, 4, '#f3c474');
    fill(c, 58, 90, 1, 2, '#fff2bd');
    fill(c, 84, 58, 31, 3, p.dark);
    for (let i = 0; i < 3; i++) {
      fill(c, 89 + i * 9, 61, 2, 7, '#775b52');
      fill(c, 88 + i * 9, 68, 4, 2, p.accent);
    }
    frame(c, 135, 34, 28, 23, '#715e5b', '#f2dfb9');
    fill(c, 140, 48, 17, 4, '#86ae9f');
    fill(c, 146, 38, 6, 6, '#d98259');
    fill(c, 74, 120, 31, 3, '#775e5a');
    fill(c, 78, 123, 3, 24, '#8d6f61');
    fill(c, 99, 123, 3, 24, '#8d6f61');
    fill(c, 81, 113, 14, 8, '#e7c38c');
    fill(c, 85, 116, 6, 1, '#b88761');
  }

  function paintStudy(c, p) {
    frame(c, 27, 34, 60, 40, '#35556b', '#eef0d6');
    fill(c, 31, 38, 52, 32, '#698f9a');
    fill(c, 38, 51, 18, 2, '#dbe7d3');
    fill(c, 45, 45, 2, 15, '#dbe7d3');
    fill(c, 64, 42, 8, 7, '#e4b873');
    fill(c, 64, 53, 13, 2, '#b8d6d0');
    fill(c, 64, 58, 9, 2, '#b8d6d0');
    // The real central shelf is drawn from its collider in front of this wall.
    fill(c, 31, 92, 54, 4, '#426577');
    for (let i = 0; i < 10; i++) {
      const colors = ['#d78f72', '#e4bc72', '#6b9b94', '#947ca1'];
      fill(c, 34 + i * 5, 81 + i % 3, 3, 11 - i % 3, colors[i % 4]);
      fill(c, 34 + i * 5, 82 + i % 3, 1, 8, '#f6dca9');
    }
    frame(c, 151, 44, 24, 19, '#547282', '#ece7cf');
    fill(c, 155, 49, 13, 3, '#e9a76e');
    fill(c, 155, 54, 9, 2, '#8caaa9');
  }

  function paintLiving(c, p) {
    frame(c, 27, 35, 61, 42, '#745d6a', '#efddc2');
    fill(c, 31, 39, 53, 34, '#94a9b1');
    fill(c, 31, 61, 53, 12, '#799b8a');
    fill(c, 34, 57, 20, 16, '#5c7f8a');
    fill(c, 57, 49, 21, 24, '#e5b97d');
    fill(c, 69, 43, 8, 8, '#f5dfa2');
    fill(c, 101, 52, 54, 3, p.dark);
    for (let i = 0; i < 4; i++) {
      frame(c, 107 + i * 11, 39 + i % 2 * 3, 8, 12, '#7b6172', ['#eccd9b', '#9caeaa', '#e29a84', '#b3a4be'][i]);
    }
    fill(c, 45, 100, 3, 47, '#716373');
    fill(c, 39, 94, 15, 7, '#efba85');
    fill(c, 42, 94, 9, 2, '#fff0b8');
    fill(c, 93, 119, 38, 3, '#755d73');
    fill(c, 96, 122, 3, 25, '#886a74');
    fill(c, 125, 122, 3, 25, '#886a74');
    fill(c, 103, 108, 18, 11, '#b6a7aa');
    fill(c, 107, 111, 10, 6, '#f0d2b2');
  }

  function paintKitchen(c, p) {
    // Tiles, hanging utensils and a stove make this room distinct from the shelf puzzle.
    for (let x = 24; x < 172; x += 12) for (let y = 29; y < 113; y += 12) {
      fill(c, x, y, 11, 11, (x + y) % 24 ? '#eee9cd' : '#e0dfc1');
      fill(c, x + 11, y, 1, 12, '#c3c8aa');
    }
    frame(c, 28, 43, 55, 37, '#6d8276', '#b4d1b3');
    fill(c, 32, 47, 47, 29, '#8ebdb1');
    fill(c, 34, 69, 43, 5, '#b9d5be');
    fill(c, 96, 44, 2, 45, '#677a70');
    for (let i = 0; i < 4; i++) {
      fill(c, 102 + i * 11, 50, 7, 3, '#5e716b');
      fill(c, 104 + i * 11, 53, 3, 16 + i % 2 * 4, '#9a9e85');
      fill(c, 103 + i * 11, 69 + i % 2 * 4, 5, 3, '#5e716b');
    }
    fill(c, 44, 119, 30, 5, '#72918a');
    fill(c, 47, 124, 4, 23, '#6c867b'); fill(c, 68, 124, 4, 23, '#6c867b');
    fill(c, 50, 112, 15, 7, '#b17b62'); fill(c, 53, 108, 9, 5, '#d9a879');
  }

  function paintWorkshop(c, p) {
    // Tool board, blueprints and lamp sit behind the collidable workbench.
    frame(c, 27, 32, 58, 58, '#4e6774', '#9cb2aa');
    for (let y = 39; y < 86; y += 8) for (let x = 34; x < 80; x += 9) fill(c, x, y, 1, 1, '#e5d6ac');
    fill(c, 40, 44, 2, 25, '#c6a778'); fill(c, 36, 44, 10, 3, '#647c7b');
    fill(c, 58, 47, 3, 23, '#d5bd85'); fill(c, 55, 67, 9, 4, '#6a7377');
    fill(c, 69, 45, 7, 7, '#c8795f'); fill(c, 71, 52, 3, 21, '#c79e73');
    frame(c, 100, 36, 56, 42, '#536a78', '#e9e7cb');
    fill(c, 107, 43, 38, 2, '#81a6ad'); fill(c, 107, 48, 25, 2, '#81a6ad');
    fill(c, 110, 57, 29, 13, '#b7d0c2'); fill(c, 118, 61, 11, 2, '#5a8088');
    fill(c, 34, 110, 34, 4, '#637c85');
    for (let i = 0; i < 3; i++) {
      fill(c, 36 + i * 10, 102 - i % 2 * 4, 8, 8 + i % 2 * 4, ['#dca571','#a4b9a6','#ca8b7b'][i]);
      fill(c, 38 + i * 10, 104 - i % 2 * 4, 4, 1, '#f3dfb0');
    }
  }

  function makeScene(level) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const a = c.getContext('2d'), p = palettes[level];
    fill(a, 0, 0, W, H, p.dark);
    fill(a, 15, 18, 220, 133, p.wall);
    for (let y = 23; y < 145; y += 5) {
      for (let x = 19; x < 232; x += 7) {
        if ((x * 17 + y * 31 + level * 13) % 11 < 3) fill(a, x + (y % 3), y, 1, 1, p.fleck);
      }
    }
    fill(a, 0, 0, W, 18, '#304451');
    fill(a, 0, 0, W, 4, '#1f3442');
    fill(a, 16, 15, 218, 3, '#ebbf86');
    fill(a, 16, 18, 218, 2, '#8d675d');
    fill(a, 12, 18, 4, 133, '#263e4a');
    fill(a, 15, 18, 2, 133, '#f0d29a');
    fill(a, 234, 18, 4, 133, '#233d4c');
    fill(a, 232, 18, 2, 133, '#ad8673');
    if (level === 0) paintEntrance(a, p);
    if (level === 1) paintStudy(a, p);
    if (level === 2) paintLiving(a, p);
    if (level === 3) paintKitchen(a, p);
    if (level === 4) paintWorkshop(a, p);
    paintWindow(a);
    fill(a, 16, 145, 218, 6, p.trim);
    fill(a, 16, 145, 218, 2, '#f2d6aa');
    fill(a, 0, 151, W, 19, p.floor);
    fill(a, 0, 151, W, 3, p.dark);
    for (let x = 0; x < W; x += 39) {
      fill(a, x + level * 6, 155, 2, 15, p.wood);
      fill(a, x + level * 6 + 2, 155, 1, 15, '#f1c692');
    }
    fill(a, 0, 162, W, 1, p.wood);
    fill(a, 0, 168, W, 2, p.dark);
    return c;
  }
  const scenes = [0, 1, 2, 3, 4].map(makeScene);

  function leaf(x, y, light = false) {
    fill(g, x, y, 5, 3, '#355c52');
    fill(g, x + 1, y, 3, 2, light ? '#b8c777' : '#6ca070');
    fill(g, x + 2, y + 2, 2, 1, '#496f5b');
  }

  function paintWind(time) {
    const motion = reducedMotion.matches ? 0 : 1;
    const left = Math.round(Math.sin(time * .001) * 2 * motion);
    const right = Math.round(Math.sin(time * .00115 + 1.5) * 2 * motion);
    const vine = Math.round(Math.sin(time * .00092 + .8) * 3 * motion);
    fill(g, 197, 28, 1, 8, '#486958');
    leaf(193 + left, 33, true); leaf(198 + left, 37); leaf(191 + left, 39);
    fill(g, 223, 29, 1, 10, '#486958');
    leaf(218 + right, 35); leaf(222 + right, 40, true);
    fill(g, 231, 73, 1, 24, '#536a55');
    for (let i = 0; i < 5; i++) {
      const drift = Math.round(vine * (i + 1) / 5);
      leaf(228 + drift - (i % 2) * 4, 75 + i * 5, i % 2 === 0);
    }
  }

  function paintCat(time) {
    // Resting paws never leave the sill; the same pixel cat watches each room.
    fill(g, 204, 65, 17, 5, '#4d4550');
    fill(g, 205, 64, 15, 5, '#e59a65');
    fill(g, 205, 68, 5, 3, '#fff1d8');
    fill(g, 216, 68, 5, 3, '#fff1d8');
    const motion = reducedMotion.matches ? 0 : 1;
    const alert = Math.min(1, state.catWake);
    const hx = 203 + Math.round(Math.sin(time * .0009) * 1.5 * motion);
    const hy = 47 + Math.round((Math.sin(time * .0018 + .4) - alert) * motion);
    fill(g, hx + 2, hy + 3, 19, 17, '#594550');
    fill(g, hx + 4, hy - 1, 4, 9, '#594550');
    fill(g, hx + 15, hy - 1, 4, 9, '#594550');
    fill(g, hx + 5, hy + 1, 2, 5, '#f1bb87');
    fill(g, hx + 16, hy + 1, 2, 5, '#f1bb87');
    fill(g, hx + 3, hy + 4, 17, 15, '#e89459');
    fill(g, hx + 5, hy + 5, 13, 10, '#f7b46e');
    fill(g, hx + 8, hy + 5, 5, 7, '#fff0d2');
    fill(g, hx + 6, hy + 13, 11, 5, '#fff1d9');
    fill(g, hx + 11, hy + 13, 2, 2, '#a86d63');
    fill(g, hx + 3, hy + 12, 3, 1, '#ba684e');
    fill(g, hx + 17, hy + 12, 3, 1, '#ba684e');
    // A relaxed, unhurried blink roughly every eight seconds.
    const blink = time % 8200;
    const closed = blink > 6600 && blink < 7130;
    const halfway = (blink > 6480 && blink <= 6600) || (blink >= 7130 && blink < 7260);
    if (closed) {
      fill(g, hx + 6, hy + 10, 3, 1, '#654e50');
      fill(g, hx + 15, hy + 10, 3, 1, '#654e50');
    } else if (halfway) {
      fill(g, hx + 6, hy + 9, 3, 2, '#654e50');
      fill(g, hx + 15, hy + 9, 3, 2, '#654e50');
    } else {
      fill(g, hx + 6, hy + 8, 3, 4, '#413e49');
      fill(g, hx + 15, hy + 8, 3, 4, '#413e49');
      fill(g, hx + 7, hy + 8, 1, 1, '#fff6dc');
      fill(g, hx + 16, hy + 8, 1, 1, '#fff6dc');
    }
    fill(g, hx + 10, hy + 16, 1, 1, '#7c5a59');
    fill(g, hx + 13, hy + 16, 1, 1, '#7c5a59');
    state.catWake = Math.max(0, state.catWake - .012);
  }

  function drawBackdrop(time) {
    g.clearRect(0, 0, W, H);
    g.drawImage(scenes[state.level], 0, 0);
    paintWind(time);
    paintCat(time);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(screen, 0, 0, W * P, H * P);
    ctx.restore();
  }

  function makeSprite(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    paint(c.getContext('2d'));
    return c;
  }
  const sprites = {
    ball: makeSprite(16, 16, c => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        if (d < 7.6) fill(c, x, y, 1, 1, d > 6.55 ? '#36575a' : y < 8 ? '#dfcc66' : '#bdad4d');
      }
      fill(c, 3, 5, 2, 2, '#f3e99f'); fill(c, 4, 3, 2, 2, '#f4ebbd');
      fill(c, 7, 2, 1, 3, '#fff4d0'); fill(c, 6, 5, 1, 2, '#fff4d0');
      fill(c, 7, 7, 1, 3, '#fff4d0'); fill(c, 9, 10, 1, 3, '#fff4d0');
      fill(c, 12, 5, 1, 3, '#f0e8ae');
    }),
    book: makeSprite(16, 18, c => {
      fill(c, 1, 1, 14, 16, '#304b5d');
      fill(c, 2, 2, 11, 14, '#568b91');
      fill(c, 3, 3, 9, 12, '#67a1a2');
      fill(c, 12, 3, 2, 12, '#f2d9a8');
      fill(c, 4, 5, 6, 2, '#e7c47f');
      fill(c, 5, 10, 4, 1, '#d1e0c8');
      fill(c, 5, 12, 5, 1, '#d1e0c8');
      fill(c, 10, 1, 2, 5, '#d88761');
    }),
    clock: makeSprite(18, 18, c => {
      fill(c, 1, 1, 5, 3, '#4a4355'); fill(c, 12, 1, 5, 3, '#4a4355');
      fill(c, 2, 2, 3, 2, '#e8ac69'); fill(c, 13, 2, 3, 2, '#e8ac69');
      fill(c, 1, 6, 16, 9, '#56495a');
      fill(c, 3, 4, 12, 13, '#56495a');
      fill(c, 4, 5, 10, 11, '#e29c65');
      fill(c, 5, 7, 8, 8, '#fff0c8');
      fill(c, 8, 8, 2, 5, '#586f72');
      fill(c, 9, 11, 3, 1, '#586f72');
      fill(c, 4, 16, 3, 2, '#56495a'); fill(c, 11, 16, 3, 2, '#56495a');
    }),
    mug: makeSprite(17, 18, c => {
      fill(c, 2, 4, 11, 12, '#415963');
      fill(c, 3, 5, 9, 10, '#f3d8ab');
      fill(c, 4, 6, 7, 8, '#e9b885');
      fill(c, 4, 7, 2, 6, '#fff0c8');
      fill(c, 13, 6, 3, 2, '#415963');
      fill(c, 15, 8, 2, 5, '#415963');
      fill(c, 13, 13, 3, 2, '#415963');
      fill(c, 5, 16, 7, 1, '#415963');
    }),
    block: makeSprite(17, 17, c => {
      fill(c, 1, 1, 15, 15, '#644e51');
      fill(c, 2, 2, 13, 13, '#c58c62');
      fill(c, 3, 3, 11, 11, '#e7af73');
      fill(c, 3, 3, 11, 2, '#f3c88d');
      fill(c, 5, 5, 2, 7, '#af785b');
      fill(c, 7, 7, 5, 2, '#af785b');
      fill(c, 12, 5, 2, 7, '#af785b');
      fill(c, 3, 13, 11, 2, '#ad735b');
    }),
  };

  function drawItem(item, body, _time, scale = 1, alpha = 1) {
    const width = item.radius ? item.radius * 2 : item.w;
    const height = item.radius ? item.radius * 2 : item.h;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle); ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprites[item.kind], -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  function worldPixel(x, y, w, h, color) { fill(ctx, x * P, y * P, w * P, h * P, color); }
  function drawBlocks(time) {
    for (const b of state.blocks) {
      const x = Math.round((b.x - b.w / 2) / P), y = Math.round((b.y - b.h / 2) / P);
      const w = Math.round(b.w / P), h = Math.round(b.h / P);
      if (b.kind === 'shelf') {
        worldPixel(x, y, w, h, '#304d57');
        worldPixel(x + 2, y + 2, w - 4, h - 3, '#ad7862');
        worldPixel(x + 3, y + 3, w - 6, h - 6, '#d4a079');
        for (let row = 0; row < 5; row++) {
          const yy = y + 7 + row * 19;
          worldPixel(x + 4, yy + 12, w - 8, 3, '#6a555b');
          for (let i = 0; i < 6; i++) {
            const colors = ['#739c99', '#e3b979', '#b77f78', '#7d7da0'];
            worldPixel(x + 5 + i * 5, yy + i % 2, 3, 12 - i % 2, colors[(row + i) % 4]);
            worldPixel(x + 6 + i * 5, yy + 2, 1, 4, '#ebd9ab');
          }
        }
      } else if (b.kind === 'divider') {
        worldPixel(x, y, w, h, '#554d5e');
        worldPixel(x + 2, y + 2, w - 4, h - 4, '#d7b790');
        for (let yy = y + 5; yy < y + h - 5; yy += 22) {
          worldPixel(x + 4, yy, w - 8, 18, '#625e75');
          worldPixel(x + 6, yy + 2, w - 12, 14, '#b0c1b4');
          worldPixel(x + 7, yy + 3, 9, 12, '#d0c6a0');
          worldPixel(x + 20, yy + 3, 9, 12, '#92aaa7');
          worldPixel(x + 17, yy + 2, 2, 14, '#735f70');
        }
        worldPixel(x + 2, y + h - 7, w - 4, 4, '#806b77');
      } else if (b.kind === 'counter') {
        worldPixel(x, y, w, h, '#526c68');
        worldPixel(x + 1, y, w - 2, 4, '#f2dec0');
        worldPixel(x + 2, y + 5, w - 4, h - 6, '#93aba0');
        for (let yy = y + 9; yy < y + h - 9; yy += 19) {
          worldPixel(x + 4, yy, w - 8, 15, '#d0c49c');
          worldPixel(x + 5, yy + 1, w - 10, 12, '#aabca2');
          worldPixel(x + Math.floor(w / 2), yy + 5, 2, 4, '#e9dcaa');
        }
        worldPixel(x + 3, y + 5, 2, h - 8, '#718b81');
      } else if (b.kind === 'workbench') {
        worldPixel(x - 2, y, w + 4, 6, '#5a6874');
        worldPixel(x - 1, y + 1, w + 2, 3, '#d9ad7b');
        worldPixel(x, y + 6, w, h - 6, '#718894');
        worldPixel(x + 2, y + 9, w - 4, h - 12, '#9eaeb0');
        for (let yy = y + 14; yy < y + h - 9; yy += 20) {
          worldPixel(x + 4, yy, w - 8, 15, '#607983');
          worldPixel(x + 6, yy + 3, w - 12, 9, '#c6a27c');
          worldPixel(x + 8, yy + 6, 2, 2, '#f1d4a4');
        }
      } else if (b.kind === 'ledge') {
        worldPixel(x, y, w, h, '#4c4b5c');
        worldPixel(x + 1, y + 1, w - 2, 2, '#ecc08b');
        for (let i = x + 4; i < x + w - 2; i += 9) worldPixel(i, y + 3, 1, 2, '#886777');
      } else if (b.kind === 'gate') {
        const progress = state.gateOpen ? Math.min(1, (time - state.gateOpenedAt) / 480) : 0;
        if (progress >= 1) continue;
        const rise = Math.round(progress * h);
        worldPixel(x, y - rise, w, h, '#4a405a');
        worldPixel(x + 1, y + 1 - rise, w - 2, h - 2, '#cc936b');
        for (let yy = y + 6; yy < y + h - 3; yy += 10) worldPixel(x + 1, yy - rise, w - 2, 2, '#785567');
        worldPixel(x + 3, y + 1 - rise, 1, h - 2, '#f2bb82');
      }
    }
    const trigger = state.levels?.[state.level]?.switch;
    if (trigger) {
      const sx = Math.round(trigger.x / P) - 11, sy = Math.round(trigger.y / P) - 3;
      worldPixel(sx, sy, 22, 6, state.gateOpen ? '#6dae91' : '#e49665');
      worldPixel(sx + 2, sy + 1, 18, 3, state.gateOpen ? '#c5e3a3' : '#f4c483');
      if (state.gateOpen) worldPixel(sx + 8, sy + 6, 6, 3, '#9cb98f');
    }
  }

  function drawBox(time) {
    const last = state.captures.at(-1);
    const age = last ? time - last.startedAt : -1000;
    const shake = age > 300 && age < 650 ? Math.round(Math.sin(age * .09) * (1 - Math.abs(age - 475) / 175)) : 0;
    const x = 182 + shake;
    // Open cardboard carton: rear flap and dark opening sit behind the items.
    // The left corner stays open so objects can enter at floor height.
    worldPixel(x - 5, 150, 44, 2, '#3f4350');
    worldPixel(x + 5, 130, 34, 20, '#69473c');
    worldPixel(x + 6, 131, 31, 18, '#bc8251');
    worldPixel(x + 8, 132, 26, 5, '#684934');
    worldPixel(x + 9, 133, 23, 3, '#805337');
    worldPixel(x + 6, 129, 31, 2, '#744d37');
    worldPixel(x + 10, 124, 22, 5, '#dba66c');
    worldPixel(x + 12, 123, 18, 1, '#f3ce92');
    worldPixel(x + 10, 128, 22, 1, '#9b653e');
    worldPixel(x + 36, 129, 4, 19, '#8e5a3c');
    worldPixel(x + 37, 131, 2, 15, '#d49a5f');
    // Two unfolded top flaps make the silhouette read as a moving box.
    worldPixel(x - 4, 130, 9, 2, '#825336');
    worldPixel(x - 7, 127, 11, 3, '#d9a36a');
    worldPixel(x - 8, 126, 10, 1, '#f2c88d');
    worldPixel(x + 33, 126, 8, 3, '#d29a60');
    worldPixel(x + 36, 124, 6, 2, '#edbd7c');
    return () => {
      // A broad, uninterrupted kraft front hides collected pieces and reads
      // as cardboard rather than a cabinet door or drawer.
      worldPixel(x + 12, 135, 27, 16, '#694632');
      worldPixel(x + 13, 136, 24, 14, '#d4a067');
      worldPixel(x + 13, 136, 24, 1, '#f1c98d');
      worldPixel(x + 13, 149, 24, 1, '#ad7145');
      worldPixel(x + 25, 136, 3, 14, '#ba8151');
      worldPixel(x + 26, 137, 1, 12, '#e7b77a');
      worldPixel(x + 16, 140, 7, 7, '#f1dfb6');
      worldPixel(x + 19, 141, 1, 5, '#9d7455');
      worldPixel(x + 18, 142, 3, 1, '#9d7455');
      worldPixel(x + 18, 143, 1, 1, '#9d7455');
      worldPixel(x + 20, 143, 1, 1, '#9d7455');
      worldPixel(x + 39, 135, 2, 16, '#8b593c');
      worldPixel(x + 40, 136, 1, 13, '#c88c55');
      worldPixel(x - 6, 146, 12, 3, '#b98351');
      worldPixel(x - 8, 148, 14, 2, '#9c6944');
    };
  }

  function drawContactShadow(body) {
    const gap = 604 - body.bounds.max.y;
    if (gap < 0 || gap > 34) return;
    const x = Math.round(body.position.x / P);
    worldPixel(x - 7, 150, 14, 1, 'rgba(42,46,54,.35)');
  }

  function drawBoxFeedback(time) {
    for (const capture of state.captures) {
      const age = time - capture.startedAt - 180;
      if (age < 0 || age > 900) continue;
      const t = age / 900;
      if (age < 380) {
        ctx.save(); ctx.globalAlpha = 1 - age / 380;
        ctx.strokeStyle = '#fff0ab'; ctx.lineWidth = 8;
        const r = 16 + age / 14;
        ctx.strokeRect(830 - r, 550 - r * .6, r * 2, r * 1.2);
        ctx.restore();
      }
      for (let i = 0; i < 20; i++) {
        const x = 830 + ((i * 37) % 29 - 14) * 8 * t;
        const y = 542 - (110 + (i * 11) % 70) * t + 115 * t * t;
        ctx.save(); ctx.globalAlpha = Math.min(1, (900 - age) / 210);
        fill(ctx, Math.round(x / P) * P, Math.round(y / P) * P, 8, 8, ['#ffe2a3', '#ec9b6a', '#a8d6a2', '#fff4d1'][i % 4]);
        ctx.restore();
      }
    }
  }

  function catPortrait() {
    const portrait = document.createElement('canvas');
    portrait.width = 32; portrait.height = 32;
    const c = portrait.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(screen, 198, 40, 32, 32, 0, 0, 32, 32);
    return portrait.toDataURL('image/png');
  }
  return { drawBackdrop, drawBlocks, drawBox, drawContactShadow, drawItem, drawBoxFeedback, catPortrait };
}
