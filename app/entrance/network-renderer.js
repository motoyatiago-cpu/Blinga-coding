
export function startNetworkIntro(root, scope, done) {
  const playbackRate = 1.65;
  const setTimeout = (fn, delay) => scope.timeout(fn, delay / playbackRate);
  const clearTimeout = window.clearTimeout.bind(window);
  const requestAnimationFrame = (fn) => scope.frame((time) => { if (!document.hidden) fn(time); else scope.listen(document, 'visibilitychange', () => { if (!document.hidden) requestAnimationFrame(fn); }, { once: true }); });
  scope.timeout(done, 6000);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
  const canvas = root.getElementById('net');
  const ctx = canvas.getContext('2d');
  let W, H, DPR;

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  let expanded = false;
  let resizeTimer;
  scope.listen(window, 'resize', () => {
    resize();
    if (expanded){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(expand, 200);
    }
  });
  resize();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 640;
  const N_CORE = small ? 108 : 184;
  const N_AMB  = small ? 34 : 78;
  const N_DUST = small ? 60 : 140;
  const PALETTE = ['#a78bfa', '#67e8f9', '#f2b774'];

  function rand(a, b){ return a + Math.random() * (b - a); }

  // 生成在整个矩形范围内均匀分布（含边角）的抖动网格坐标，避免纯随机导致的扎堆/留白
  function jitteredFill(count, w, h, bleed){
    bleed = bleed || 1;
    const areaW = w * bleed, areaH = h * bleed;
    const cols = Math.max(1, Math.round(Math.sqrt(count * areaW / areaH)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const cellW = areaW / cols, cellH = areaH / rows;
    const cells = [];
    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++) cells.push([c, r]);
    }
    for (let i = cells.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const pts = [];
    for (let i = 0; i < count; i++){
      const [c, r] = cells[i % cells.length];
      const x = -areaW / 2 + (c + 0.5) * cellW + rand(-cellW * 0.42, cellW * 0.42);
      const y = -areaH / 2 + (r + 0.5) * cellH + rand(-cellH * 0.42, cellH * 0.42);
      pts.push({ x, y });
    }
    return pts;
  }

  // ---- 采样形状轮廓（大脑 / </> / B）----
  function sampleShape(draw, count, w, h){
    const oc = document.createElement('canvas');
    oc.width = w; oc.height = h;
    const octx = oc.getContext('2d');
    octx.fillStyle = '#fff';
    draw(octx, w, h);
    const data = octx.getImageData(0, 0, w, h).data;
    const pts = [];
    const step = 5;
    for (let y = 0; y < h; y += step){
      for (let x = 0; x < w; x += step){
        if (data[(y * w + x) * 4 + 3] > 120) pts.push({ x: x - w / 2, y: y - h / 2 });
      }
    }
    for (let i = pts.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const out = [];
    for (let i = 0; i < count; i++) out.push(pts[i % pts.length] || { x: 0, y: 0 });
    return out;
  }

  const brainShape = sampleShape((c, w, h) => {
    c.font = '220px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🧠', w / 2, h / 2 + 6);
  }, N_CORE, 340, 300);

  const slashShape = sampleShape((c, w, h) => {
    c.font = '700 190px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('</>', w / 2, h / 2);
  }, N_CORE, 380, 260);

  const bShape = sampleShape((c, w, h) => {
    c.font = '800 260px "Space Grotesk", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('B', w / 2, h / 2);
  }, N_CORE, 300, 320);

  // ---- 节点 ----
  class Node{
    constructor(isCore){
      this.core = isCore;
      const ang = Math.random() * Math.PI * 2;
      const rad = rand(260, 760);
      this.x = Math.cos(ang) * rad; this.y = Math.sin(ang) * rad;
      this.x0 = this.x; this.y0 = this.y;
      this.tx = this.x; this.ty = this.y;
      this.cx = this.x; this.cy = this.y;
      this.z = Math.random();
      this.baseSize = rand(1.3, 2.6) + this.z * 1.8;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.phase = Math.random() * Math.PI * 2;
      this.driftAng = Math.random() * Math.PI * 2;
      this.opacity = 0;
      this.targetOpacity = 0;
      this.progress = 1;
      this.duration = 1;
      this.t0 = 0;
    }
    moveTo(tx, ty, duration){
      this.x0 = this.x; this.y0 = this.y;
      this.tx = tx; this.ty = ty;
      const dx = tx - this.x0, dy = ty - this.y0;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist, ny = dx / dist;
      const bulge = rand(-1, 1) * Math.min(dist * 0.4, 150);
      this.cx = (this.x0 + tx) / 2 + nx * bulge;
      this.cy = (this.y0 + ty) / 2 + ny * bulge;
      this.progress = 0; this.duration = duration / playbackRate; this.t0 = performance.now();
    }
    update(now){
      if (this.progress < 1){
        const t = Math.min((now - this.t0) / this.duration, 1);
        const e = 1 - Math.pow(1 - t, 3);
        const mt = 1 - e;
        this.x = mt * mt * this.x0 + 2 * mt * e * this.cx + e * e * this.tx;
        this.y = mt * mt * this.y0 + 2 * mt * e * this.cy + e * e * this.ty;
        this.progress = t;
      } else {
        this.driftAng += 0.0025;
        this.x = this.tx + Math.cos(this.driftAng + this.phase) * 3;
        this.y = this.ty + Math.sin(this.driftAng * 1.3 + this.phase) * 3;
      }
      this.opacity += (this.targetOpacity - this.opacity) * 0.05;
    }
  }

  const coreNodes = Array.from({ length: N_CORE }, () => new Node(true));
  const ambNodes  = Array.from({ length: N_AMB }, () => new Node(false));
  ambNodes.forEach(n => { n.targetOpacity = rand(.1, .28); });
  const allNodes = [...ambNodes, ...coreNodes];

  // 尘埃粒子层：不参与连线，只负责营造空间纵深与漂浮感
  const dustNodes = Array.from({ length: N_DUST }, () => {
    const n = new Node(false);
    n.baseSize = rand(.4, 1.3);
    n.targetOpacity = rand(.05, .22);
    n.dustFloat = rand(.5, 1.6);
    return n;
  });
  const renderNodes = [...dustNodes, ...allNodes];

  let edges = [];
  let edgeNodes = coreNodes;

  function buildEdges(points, k){
    const e = []; const seen = new Set();
    for (let i = 0; i < points.length; i++){
      const dists = [];
      for (let j = 0; j < points.length; j++){
        if (i === j) continue;
        const dx = points[i].x - points[j].x, dy = points[i].y - points[j].y;
        dists.push([j, dx * dx + dy * dy]);
      }
      dists.sort((a, b) => a[1] - b[1]);
      for (let n = 0; n < k && n < dists.length; n++){
        const j = dists[n][0];
        const key = i < j ? i + '_' + j : j + '_' + i;
        if (!seen.has(key)){ seen.add(key); e.push([i, j]); }
      }
    }
    return e;
  }

  let pulses = [];
  function seedPulses(){
    pulses = [];
    if (!edges.length) return;
    const count = Math.min(9, edges.length);
    for (let i = 0; i < count; i++){
      pulses.push({ edge: edges[Math.floor(Math.random() * edges.length)], t: Math.random(), speed: rand(.22, .5) });
    }
  }

  function morphTo(shape, duration){
    coreNodes.forEach((n, i) => { n.moveTo(shape[i].x, shape[i].y, duration); n.targetOpacity = rand(.55, .95); });
    edgeNodes = coreNodes;
    edges = buildEdges(shape, 2);
    seedPulses();
  }

  function expand(){
    const targets = jitteredFill(allNodes.length, W, H, 1.12);
    allNodes.forEach((n, i) => {
      n.moveTo(targets[i].x, targets[i].y, rand(1700, 2600));
      n.targetOpacity = n.core ? rand(.14, .3) : rand(.08, .2);
    });
    edgeNodes = allNodes;
    edges = buildEdges(targets, 1);
    seedPulses();

    // 尘埃层同步铺满整页（略微溢出视口边缘，避免边角留白）
    const dustTargets = jitteredFill(dustNodes.length, W, H, 1.3);
    dustNodes.forEach((n, i) => {
      n.moveTo(dustTargets[i].x, dustTargets[i].y, rand(2000, 3400));
    });
  }

  // ---- 时间线 ----
  const wordmark = root.getElementById('wordmark');
  const subtitle = root.getElementById('subtitle');
  const loader = root.getElementById('loader');
  const vignette = root.getElementById('vignette');
  const site = root.getElementById('site');

  function typewrite(el, text, speed){
    el.textContent = ''; let i = 0;
    (function step(){
      if (i <= text.length){ el.textContent = text.slice(0, i); i++; setTimeout(step, speed); }
      else { wordmark.classList.add('done'); }
    })();
  }

  function sequence(){
    dustNodes.forEach((n, i) => setTimeout(() => { n.targetOpacity = rand(.05, .22); }, 6 * i));
    coreNodes.forEach((n, i) => setTimeout(() => { n.targetOpacity = rand(.45, .85); }, 28 * i));
    setTimeout(() => morphTo(brainShape, 1300), 900);
    setTimeout(() => morphTo(slashShape, 1300), 2500);
    setTimeout(() => morphTo(bShape, 1300), 4100);
    setTimeout(() => { wordmark.classList.add('show'); typewrite(subtitle, 'Building your coding universe...', 34); }, 5500);
    setTimeout(() => {
      vignette.classList.add('fade');
      expand();
      expanded = true;
    }, 7700);
    setTimeout(() => {
      wordmark.classList.remove('show');
      loader.classList.add('hidden');
      site.classList.add('revealed');
    }, 8500);
  }

  if (reduced){
    coreNodes.forEach(n => { n.targetOpacity = .6; });
    ambNodes.forEach(n => { n.targetOpacity = .2; });
    dustNodes.forEach(n => { n.targetOpacity = .12; });
    wordmark.classList.add('show', 'done');
    subtitle.textContent = 'Building your coding universe...';
    setTimeout(() => {
      vignette.classList.add('fade');
      loader.classList.add('hidden');
      site.classList.add('revealed');
      expand();
      expanded = true;
    }, 1100);
  } else {
    sequence();
  }

  // ---- 视差（空间立体感）----
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  scope.listen(window, 'mousemove', e => {
    tmx = (e.clientX - W / 2) / W; tmy = (e.clientY - H / 2) / H;
  });

  function drawGrid(px, py){
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    const gap = 46;
    const ox = (px * 16) % gap, oy = (py * 16) % gap;
    for (let x = ox - gap; x < W + gap; x += gap){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = oy - gap; y < H + gap; y += gap){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  let last = performance.now();
  function render(now){
    const dt = Math.min((now - last) / 1000, .05); last = now;
    mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;

    ctx.clearRect(0, 0, W, H);
    drawGrid(mx, my);

    ctx.save();
    ctx.translate(W / 2, H / 2);

    // 中心呼吸光晕
    const breathe = .5 + Math.sin(now / 900) * .5;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    glow.addColorStop(0, `rgba(167,139,250,${0.06 + breathe * 0.06})`);
    glow.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-W, -H, W * 2, H * 2);

    // 逐节点更新位置 + 按深度(z)计算独立视差偏移，制造立体分层
    renderNodes.forEach(n => {
      n.update(now);
      const depth = 0.2 + n.z * 1.5;
      n.rx = n.x + mx * 58 * depth;
      n.ry = n.y + my * 58 * depth;
    });

    // 连接线
    edges.forEach(([i, j]) => {
      const a = edgeNodes[i], b = edgeNodes[j];
      if (!a || !b) return;
      const op = Math.min(a.opacity, b.opacity) * .5;
      if (op <= 0.01) return;
      const g = ctx.createLinearGradient(a.rx, a.ry, b.rx, b.ry);
      g.addColorStop(0, a.color); g.addColorStop(1, b.color);
      ctx.strokeStyle = g;
      ctx.globalAlpha = op;
      ctx.beginPath(); ctx.moveTo(a.rx, a.ry); ctx.lineTo(b.rx, b.ry); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // 信号脉冲
    pulses.forEach(p => {
      const a = edgeNodes[p.edge[0]], b = edgeNodes[p.edge[1]];
      if (!a || !b) return;
      p.t += dt * p.speed;
      if (p.t > 1) p.t -= 1;
      const x = a.rx + (b.rx - a.rx) * p.t, y = a.ry + (b.ry - a.ry) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12; ctx.shadowColor = '#ffffff';
      ctx.globalAlpha = Math.min(a.opacity, b.opacity);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });

    // 尘埃粒子（远近深度交织，营造空间感）
    dustNodes.forEach(n => {
      if (n.opacity <= 0.01) return;
      const tw = .6 + Math.sin(now / (700 * n.dustFloat) + n.phase) * .4;
      ctx.beginPath();
      ctx.arc(n.rx, n.ry, n.baseSize * (.5 + n.z * .8), 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = n.opacity * tw;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 节点
    allNodes.forEach(n => {
      if (n.opacity <= 0.01) return;
      const pulse = .75 + Math.sin(now / 500 + n.phase) * .25;
      const size = n.baseSize * (.6 + n.z * .9) * pulse;
      ctx.beginPath();
      ctx.arc(n.rx, n.ry, size, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowBlur = 6 + n.z * 14;
      ctx.shadowColor = n.color;
      ctx.globalAlpha = n.opacity;
      ctx.fill();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    ctx.restore();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
