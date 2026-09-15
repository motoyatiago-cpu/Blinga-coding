// Adapted from the user's web.html; the caller owns the animation lifetime.
export function startProfileParticles(canvas: HTMLCanvasElement, reducedMotion: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let width = 0, height = 0, frame = 0, lastTime = 0;
  let mouse: { x: number; y: number } | null = null;
  let particles: Array<{ x: number; y: number; dx: number; dy: number; size: number }> = [];
  let rgb = "0,212,255";
  const updateTheme = () => {
    rgb = document.documentElement.dataset.theme === "light" ? "0,125,170" : "0,212,255";
  };
  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: Math.min(220, Math.ceil(width * height / 9000)) }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      dx: Math.random() - .5, dy: Math.random() - .5, size: Math.random() * 2 + 1,
    }));
    if (reducedMotion) draw(0);
  };
  function draw(step: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      if (mouse && step) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const distance = Math.hypot(dx, dy);
        if (distance > .01 && distance < 150) {
          const force = (150 - distance) / 150 * 5 * step;
          p.x -= dx / distance * force;
          p.y -= dy / distance * force;
        }
      }
      p.x += p.dx * step;
      p.y += p.dy * step;
      if (p.x < 0 || p.x > width) p.dx *= -1;
      if (p.y < 0 || p.y > height) p.dy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},.8)`;
      ctx.fill();
    }
    const threshold = Math.min(width / 7 * height / 7, 20000);
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const p = particles[a], q = particles[b];
        const distance = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (distance >= threshold) continue;
        ctx.strokeStyle = `rgba(${rgb},${Math.max(0, 1 - distance / 20000)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }
  const animate = (time: number) => {
    frame = 0;
    if (document.hidden || reducedMotion) return;
    const step = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
    lastTime = time;
    draw(step);
    frame = requestAnimationFrame(animate);
  };
  const visibility = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (canvas.parentElement) canvas.parentElement.dataset.paused = String(document.hidden);
    if (!document.hidden && !reducedMotion) frame = requestAnimationFrame(animate);
  };
  const move = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const leave = () => { mouse = null; };
  const observer = new MutationObserver(() => { updateTheme(); if (reducedMotion) draw(0); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  updateTheme();
  resize();
  visibility();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerleave", leave);
    particles = [];
  };
}
