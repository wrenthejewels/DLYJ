/* ─────────────────────────────────────────────────────────────────────────────
   DLYJ Banner System
   Two layers:
     1. #bg-canvas  — fixed, full-viewport, static topo lines (zoomed out)
     2. #hero-canvas — animated, hero section, denser lines + walking figures
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const C = {
    bg:         '#FAFAFA',
    ink:        '#1C1B18',
    inkSoft:    '#5C5850',
    matcha:     'rgba(77, 122, 82,',   // prefix for rgba()
  };

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
        return noise(x,   y  ) * 0.500
             + noise(x*2, y*2) * 0.250
             + noise(x*4, y*4) * 0.125
             + noise(x*8, y*8) * 0.063;
      }
    };
  }

  // ── Marching Squares ─────────────────────────────────────────────────────
  // Returns array (one per level) of flat [ptA, ptB, ptA, ptB, …] arrays
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
          const idx = (tl >= tv ? 8:0)|(tr >= tv ? 4:0)|(br >= tv ? 2:0)|(bl >= tv ? 1:0);
          if (idx === 0 || idx === 15) continue;

          const ip = (a, b) => {
            const d = b - a;
            return Math.abs(d) < 1e-7 ? 0.5 : Math.max(0, Math.min(1, (tv - a) / d));
          };
          const top = [c + ip(tl, tr), r    ];
          const rgt = [c + 1,          r + ip(tr, br)];
          const bot = [c + ip(bl, br), r + 1];
          const lft = [c,              r + ip(tl, bl)];
          const s = out[li];

          switch (idx) {
            case  1: s.push(lft, bot); break;
            case  2: s.push(bot, rgt); break;
            case  3: s.push(lft, rgt); break;
            case  4: s.push(top, rgt); break;
            case  5: s.push(top, lft); s.push(bot, rgt); break;
            case  6: s.push(top, bot); break;
            case  7: s.push(top, lft); break;
            case  8: s.push(top, lft); break;
            case  9: s.push(top, bot); break;
            case 10: s.push(top, rgt); s.push(lft, bot); break;
            case 11: s.push(top, rgt); break;
            case 12: s.push(lft, rgt); break;
            case 13: s.push(rgt, bot); break;
            case 14: s.push(lft, bot); break;
          }
        }
      }
    }
    return out;
  }

  // ── Segment Chaining ─────────────────────────────────────────────────────
  // Connects marching-squares segments into continuous polylines.
  // Returns array of { pts: [[x,y]…], arcs: [cumLen…], len: totalLen }
  function chainSegments(segs, cellSize) {
    if (!segs.length) return [];

    const PREC = 1000;
    const key  = p => `${Math.round(p[0] * PREC)},${Math.round(p[1] * PREC)}`;

    const segments = [];
    for (let i = 0; i < segs.length; i += 2)
      segments.push({ a: segs[i], b: segs[i + 1], used: false });

    // Endpoint → list of segment indices
    const map = new Map();
    for (let i = 0; i < segments.length; i++) {
      const ka = key(segments[i].a), kb = key(segments[i].b);
      if (!map.has(ka)) map.set(ka, []);
      if (!map.has(kb)) map.set(kb, []);
      map.get(ka).push(i);
      map.get(kb).push(i);
    }

    const chains = [];

    for (let si = 0; si < segments.length; si++) {
      if (segments[si].used) continue;
      segments[si].used = true;
      const pts = [segments[si].a, segments[si].b];

      // Walk forward greedily
      for (let guard = 0; guard < segments.length; guard++) {
        const cur      = pts[pts.length - 1];
        const ck       = key(cur);
        const nbrs     = map.get(ck) || [];
        let found      = false;
        for (const ni of nbrs) {
          if (segments[ni].used) continue;
          segments[ni].used = true;
          pts.push(key(segments[ni].a) === ck ? segments[ni].b : segments[ni].a);
          found = true;
          break;
        }
        if (!found) break;
      }

      if (pts.length < 3) continue;

      // Convert to pixel coords and accumulate arc lengths
      const px   = pts.map(p => [p[0] * cellSize, p[1] * cellSize]);
      const arcs = [0];
      for (let i = 1; i < px.length; i++) {
        const dx = px[i][0] - px[i-1][0], dy = px[i][1] - px[i-1][1];
        arcs.push(arcs[i-1] + Math.hypot(dx, dy));
      }
      chains.push({ pts: px, arcs, len: arcs[arcs.length - 1] });
    }

    return chains;
  }

  // Position + direction at arc-length `dist` along a chain
  function interpChain(chain, dist) {
    const { pts, arcs, len } = chain;
    const d  = ((dist % len) + len) % len;
    let lo   = 0, hi = arcs.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      arcs[mid] <= d ? (lo = mid) : (hi = mid);
    }
    lo = Math.min(lo, pts.length - 2);
    const span = arcs[lo + 1] - arcs[lo];
    const t    = span > 0 ? (d - arcs[lo]) / span : 0;
    const a    = pts[lo], b = pts[lo + 1];
    return {
      x:     a[0] + t * (b[0] - a[0]),
      y:     a[1] + t * (b[1] - a[1]),
      angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  }

  // ── Walking Figure ────────────────────────────────────────────────────────
  function drawWalker(ctx, x, y, dir, scale, color, walkPhase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir);           // face direction of travel
    ctx.scale(scale, scale);

    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const sw = Math.sin(walkPhase) * 3.5;   // leg/arm swing

    // Head
    ctx.beginPath();
    ctx.arc(0, -9, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -6.2); ctx.lineTo(0, 1);
    ctx.stroke();

    // Legs (cross-lateral to arms)
    ctx.beginPath();
    ctx.moveTo(0, 1); ctx.lineTo( sw, 7);
    ctx.moveTo(0, 1); ctx.lineTo(-sw, 7);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(-sw * 0.55, -1);
    ctx.moveTo(0, -4); ctx.lineTo( sw * 0.55, -1);
    ctx.stroke();

    ctx.restore();
  }

  // ── Noise Field Helpers ───────────────────────────────────────────────────
  function buildField(noise, w, h, cellSize, scale) {
    const cols = Math.ceil(w / cellSize) + 2;
    const rows = Math.ceil(h / cellSize) + 2;
    const field = new Float32Array(rows * cols);
    let mn = Infinity, mx = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = noise.fbm(c * cellSize * scale, r * cellSize * scale);
        field[r * cols + c] = v;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    const rng = mx - mn || 1;
    for (let i = 0; i < field.length; i++) field[i] = (field[i] - mn) / rng;
    return { field, rows, cols };
  }

  // ── Page Background (static, rendered once) ───────────────────────────────
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

      const CELL   = 12;
      const noise  = makeNoise();
      const { field, rows, cols } = buildField(noise, W, H, CELL, 0.0014);
      const levels = Array.from({ length: 7 }, (_, i) => 0.08 + 0.84 * i / 6);
      const contours = buildContours(field, rows, cols, levels);

      ctx.lineCap = 'round';
      for (let li = 0; li < contours.length; li++) {
        const segs = contours[li];
        if (!segs.length) continue;
        ctx.beginPath();
        ctx.strokeStyle = `${C.matcha} 0.065)`;
        ctx.lineWidth   = 0.75;
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
    const N_FIGS   = 32;

    let W, H, contours, walkers, animId, t0, lastTs;

    function setup() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      t0 = null; lastTs = null;

      const band = canvas.parentElement;
      W = band.clientWidth;
      H = band.clientHeight;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const noise  = makeNoise();
      const { field, rows, cols } = buildField(noise, W, H, CELL, 0.003);
      const levels = Array.from({ length: N_LEVELS }, (_, i) => 0.05 + 0.90 * i / (N_LEVELS - 1));
      contours = buildContours(field, rows, cols, levels);

      // Build walkable chains from all contour levels
      const allChains = contours.flatMap(segs => chainSegments(segs, CELL));
      const goodChains = allChains.filter(ch => ch.len > 90);

      walkers = [];
      if (goodChains.length) {
        for (let i = 0; i < N_FIGS; i++) {
          const chain = goodChains[Math.floor(Math.random() * goodChains.length)];
          const spd   = (14 + Math.random() * 18) * (Math.random() < 0.5 ? 1 : -1);
          walkers.push({
            chain,
            dist:      Math.random() * chain.len,
            speed:     spd,
            scale:     0.78 + Math.random() * 0.36,
            color:     Math.random() < 0.15 ? '#4d7a52'
                     : Math.random() < 0.45 ? C.inkSoft : C.ink,
            walkPhase: Math.random() * Math.PI * 2,
          });
        }
      }

      animId = requestAnimationFrame(loop);
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Contour lines
      ctx.lineCap = 'round';
      for (let li = 0; li < contours.length; li++) {
        const segs = contours[li];
        if (!segs.length) continue;
        const isIdx  = li % 3 === 1;
        const base   = isIdx ? 0.24 : 0.12;
        const breath = 0.88 + 0.12 * Math.sin(t * 0.28 + li * 0.54);
        ctx.beginPath();
        ctx.strokeStyle = `${C.matcha} ${(base * breath).toFixed(3)})`;
        ctx.lineWidth   = isIdx ? 1.35 : 0.8;
        for (let i = 0; i < segs.length; i += 2) {
          ctx.moveTo(segs[i][0]     * CELL, segs[i][1]     * CELL);
          ctx.lineTo(segs[i + 1][0] * CELL, segs[i + 1][1] * CELL);
        }
        ctx.stroke();
      }

      // Walking figures
      for (const w of walkers) {
        w.dist      += w.speed * dt;
        w.walkPhase += Math.abs(w.speed) * dt * 0.42;
        // Wrap position along chain
        w.dist = ((w.dist % w.chain.len) + w.chain.len) % w.chain.len;

        const pos = interpChain(w.chain, w.dist);
        // If moving backward, flip facing direction
        const dir = w.speed < 0 ? pos.angle + Math.PI : pos.angle;
        drawWalker(ctx, pos.x, pos.y, dir, w.scale, w.color, w.walkPhase);
      }

      // Soft edge fades
      const f = 50;
      const edge = (x1, y1, x2, y2, rx, ry, rw, rh) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, 'rgba(250,250,250,0.90)');
        g.addColorStop(1, 'rgba(250,250,250,0)');
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      };
      edge(0,   0,   0,   f,   0,     0,     W, f);  // top
      edge(0,   H,   0,   H-f, 0,     H - f, W, f);  // bottom
      edge(0,   0,   f,   0,   0,     0,     f, H);  // left
      edge(W,   0,   W-f, 0,   W - f, 0,     f, H);  // right
    }

    function loop(ts) {
      if (!t0)    { t0 = ts; lastTs = ts; }
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs   = ts;
      draw((ts - t0) / 1000, dt);
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
