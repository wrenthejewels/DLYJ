/* ─────────────────────────────────────────────────────────────────────────────
   DLYJ Banner System
   · #hero-canvas  — animated topo lines + one walking matcha figure
   · #bg-canvas    — fixed full-page, sparse zoomed-out topo lines, static
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const BG  = '#FAFAFA';
  const MATCHA = '77, 122, 82';   // rgb values for rgba()

  // ── Perlin Noise ─────────────────────────────────────────────────────────
  function makeNoise() {
    const src = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [src[i], src[j]] = [src[j], src[i]];
    }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = src[i & 255];

    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp  = (a, b, t) => a + t * (b - a);
    const grad  = (h, x, y) => {
      switch (h & 7) {
        case 0: return  x + y; case 1: return -x + y;
        case 2: return  x - y; case 3: return -x - y;
        case 4: return  x;     case 5: return -x;
        case 6: return  y;     default: return -y;
      }
    };

    function noise(x, y) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const a = p[X] + Y, b = p[X + 1] + Y;
      return lerp(
        lerp(grad(p[a],     x,   y  ), grad(p[b],     x-1, y  ), u),
        lerp(grad(p[a + 1], x,   y-1), grad(p[b + 1], x-1, y-1), u),
        v
      );
    }

    return {
      fbm(x, y) {
        return noise(x,    y   ) * 0.500
             + noise(x*2,  y*2 ) * 0.250
             + noise(x*4,  y*4 ) * 0.125
             + noise(x*8,  y*8 ) * 0.063;
      }
    };
  }

  // ── Marching Squares ─────────────────────────────────────────────────────
  function buildContours(field, rows, cols, levels) {
    const out = levels.map(() => []);
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const tl = field[ r      * cols + c    ];
        const tr = field[ r      * cols + c + 1];
        const br = field[(r + 1) * cols + c + 1];
        const bl = field[(r + 1) * cols + c    ];
        for (let li = 0; li < levels.length; li++) {
          const tv  = levels[li];
          const idx = (tl>=tv?8:0)|(tr>=tv?4:0)|(br>=tv?2:0)|(bl>=tv?1:0);
          if (idx === 0 || idx === 15) continue;
          const ip = (a, b) => {
            const d = b - a;
            return Math.abs(d) < 1e-7 ? 0.5 : Math.max(0, Math.min(1, (tv-a)/d));
          };
          const top=[c+ip(tl,tr), r    ], rgt=[c+1,          r+ip(tr,br)];
          const bot=[c+ip(bl,br), r+1  ], lft=[c,             r+ip(tl,bl)];
          const s = out[li];
          switch (idx) {
            case  1: s.push(lft,bot); break; case  2: s.push(bot,rgt); break;
            case  3: s.push(lft,rgt); break; case  4: s.push(top,rgt); break;
            case  5: s.push(top,lft); s.push(bot,rgt); break;
            case  6: s.push(top,bot); break; case  7: s.push(top,lft); break;
            case  8: s.push(top,lft); break; case  9: s.push(top,bot); break;
            case 10: s.push(top,rgt); s.push(lft,bot); break;
            case 11: s.push(top,rgt); break; case 12: s.push(lft,rgt); break;
            case 13: s.push(rgt,bot); break; case 14: s.push(lft,bot); break;
          }
        }
      }
    }
    return out;
  }

  function buildField(noise, w, h, cell, scale) {
    const cols = Math.ceil(w / cell) + 2, rows = Math.ceil(h / cell) + 2;
    const field = new Float32Array(rows * cols);
    let mn = Infinity, mx = -Infinity;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = noise.fbm(c * cell * scale, r * cell * scale);
        field[r * cols + c] = v;
        if (v < mn) mn = v; if (v > mx) mx = v;
      }
    const rng = mx - mn || 1;
    for (let i = 0; i < field.length; i++) field[i] = (field[i] - mn) / rng;
    return { field, rows, cols };
  }

  // ── Single Walking Figure ─────────────────────────────────────────────────
  function drawWalker(ctx, x, y, scale, walkPhase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const color = '#4d7a52';
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.6;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const sw = Math.sin(walkPhase) * 3.5;

    // Head
    ctx.beginPath();
    ctx.arc(0, -9, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -6.2); ctx.lineTo(0, 1);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 1); ctx.lineTo( sw, 7);
    ctx.moveTo(0, 1); ctx.lineTo(-sw, 7);
    ctx.stroke();

    // Arms (cross-lateral)
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(-sw * 0.55, -1);
    ctx.moveTo(0, -4); ctx.lineTo( sw * 0.55, -1);
    ctx.stroke();

    ctx.restore();
  }

  // ── Page Background (static) ──────────────────────────────────────────────
  function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function render() {
      const W = window.innerWidth, H = window.innerHeight;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const CELL = 16;
      const { field, rows, cols } = buildField(makeNoise(), W, H, CELL, 0.001);
      const levels   = Array.from({ length: 5 }, (_, i) => 0.10 + 0.80 * i / 4);
      const contours = buildContours(field, rows, cols, levels);

      ctx.lineCap = 'round';
      for (const segs of contours) {
        if (!segs.length) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${MATCHA}, 0.055)`;
        ctx.lineWidth   = 0.7;
        for (let i = 0; i < segs.length; i += 2) {
          ctx.moveTo(segs[i][0]     * CELL, segs[i][1]     * CELL);
          ctx.lineTo(segs[i + 1][0] * CELL, segs[i + 1][1] * CELL);
        }
        ctx.stroke();
      }
    }

    render();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 300); });
  }

  // ── Hero Banner (animated) ────────────────────────────────────────────────
  function initHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CELL     = 6;
    const N_LEVELS = 9;
    const FIG_SPEED = 48;   // px/sec
    const FIG_SCALE = 1.0;

    let W, H, contours, animId, t0, lastTs;
    let figX = 0, figWalkPhase = 0;

    function setup() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      t0 = null; lastTs = null;

      const band = canvas.parentElement;
      W = band.clientWidth;
      H = band.clientHeight;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const { field, rows, cols } = buildField(makeNoise(), W, H, CELL, 0.003);
      const levels = Array.from({ length: N_LEVELS }, (_, i) => 0.05 + 0.90 * i / (N_LEVELS - 1));
      contours = buildContours(field, rows, cols, levels);

      figX = -20; // start just off left edge
      animId = requestAnimationFrame(loop);
    }

    function draw(dt) {
      // Background — same as site
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Contour lines with gentle breathing
      ctx.lineCap = 'round';
      for (let li = 0; li < contours.length; li++) {
        const segs = contours[li];
        if (!segs.length) continue;
        const isIdx  = li % 3 === 1;
        const base   = isIdx ? 0.22 : 0.11;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${MATCHA}, ${base.toFixed(2)})`;
        ctx.lineWidth   = isIdx ? 1.3 : 0.8;
        for (let i = 0; i < segs.length; i += 2) {
          ctx.moveTo(segs[i][0]     * CELL, segs[i][1]     * CELL);
          ctx.lineTo(segs[i + 1][0] * CELL, segs[i + 1][1] * CELL);
        }
        ctx.stroke();
      }

      // Advance figure
      figX += FIG_SPEED * dt;
      figWalkPhase += FIG_SPEED * dt * 0.42;
      if (figX > W + 20) { figX = -20; figWalkPhase = 0; }

      // Figure walks at the bottom of the banner
      const figY = H - 32;
      drawWalker(ctx, figX, figY, FIG_SCALE, figWalkPhase);

      // Soft edge fades
      const f = 48;
      const fade = (x1, y1, x2, y2, rx, ry, rw, rh) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, `rgba(250,250,250,0.92)`);
        g.addColorStop(1, `rgba(250,250,250,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      };
      fade(0,   0,   0,   f,   0,     0,     W, f);
      fade(0,   H,   0,   H-f, 0,     H - f, W, f);
      fade(0,   0,   f,   0,   0,     0,     f, H);
      fade(W,   0,   W-f, 0,   W - f, 0,     f, H);
    }

    function loop(ts) {
      if (!t0) { t0 = ts; lastTs = ts; }
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      draw(dt);
      animId = requestAnimationFrame(loop);
    }

    setup();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 200); });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initBackground(); initHero(); });
  } else {
    initBackground(); initHero();
  }
})();
