/* Animated network background for the home hero.
   Decorative only: aria-hidden, paused off-screen, static with reduced motion. */
(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-network";
  canvas.setAttribute("aria-hidden", "true");
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TEAL = "113, 224, 192";
  const LINK_DISTANCE = 135;
  const POINTER_DISTANCE = 190;

  let width = 0;
  let height = 0;
  let nodes = [];
  let pulses = [];
  let frame = 0;
  let lastTime = 0;
  let lastPulse = 0;
  let visible = true;
  const pointer = { x: -9999, y: -9999, active: false };

  function makeNode() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 13;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 1 + Math.random() * 1.5,
      hub: Math.random() < 0.12,
    };
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.round(Math.min(110, Math.max(26, (width * height) / 15000)));
    while (nodes.length < target) nodes.push(makeNode());
    nodes.length = Math.min(nodes.length, target);
    nodes.forEach((node) => {
      node.x = Math.min(node.x, width);
      node.y = Math.min(node.y, height);
    });

    if (reduceMotion.matches) draw(false);
  }

  function update(dt) {
    for (const node of nodes) {
      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.hypot(dx, dy);
        if (dist < POINTER_DISTANCE && dist > 1) {
          const pull = (1 - dist / POINTER_DISTANCE) * 38;
          node.vx += (dx / dist) * pull * dt;
          node.vy += (dy / dist) * pull * dt;
        }
      }

      const speed = Math.hypot(node.vx, node.vy);
      const max = 34;
      if (speed > max) {
        node.vx = (node.vx / speed) * max;
        node.vy = (node.vy / speed) * max;
      }
      node.vx *= 1 - 0.18 * dt;
      node.vy *= 1 - 0.18 * dt;
      if (speed < 5) {
        node.vx += (Math.random() - 0.5) * 6 * dt;
        node.vy += (Math.random() - 0.5) * 6 * dt;
      }

      node.x += node.vx * dt;
      node.y += node.vy * dt;

      if (node.x < -10) node.x = width + 10;
      if (node.x > width + 10) node.x = -10;
      if (node.y < -10) node.y = height + 10;
      if (node.y > height + 10) node.y = -10;
    }
  }

  function draw(animated) {
    ctx.clearRect(0, 0, width, height);
    const links = [];

    ctx.lineWidth = 0.8;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > LINK_DISTANCE * LINK_DISTANCE) continue;
        const dist = Math.sqrt(dist2);
        const alpha = (1 - dist / LINK_DISTANCE) * 0.2;
        ctx.strokeStyle = `rgba(${TEAL}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        links.push([i, j]);
      }
    }

    if (pointer.active) {
      for (const node of nodes) {
        const dist = Math.hypot(pointer.x - node.x, pointer.y - node.y);
        if (dist > POINTER_DISTANCE) continue;
        const alpha = (1 - dist / POINTER_DISTANCE) * 0.5;
        ctx.strokeStyle = `rgba(${TEAL}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      if (node.hub) {
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 14);
        glow.addColorStop(0, `rgba(${TEAL}, 0.28)`);
        glow.addColorStop(1, `rgba(${TEAL}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${TEAL}, ${node.hub ? 0.85 : 0.5})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.hub ? node.r + 0.9 : node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (animated) {
      for (const pulse of pulses) {
        const a = nodes[pulse.a];
        const b = nodes[pulse.b];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * pulse.t;
        const y = a.y + (b.y - a.y) * pulse.t;
        const fade = Math.sin(pulse.t * Math.PI);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
        glow.addColorStop(0, `rgba(255, 255, 255, ${(0.9 * fade).toFixed(3)})`);
        glow.addColorStop(0.35, `rgba(${TEAL}, ${(0.55 * fade).toFixed(3)})`);
        glow.addColorStop(1, `rgba(${TEAL}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return links;
  }

  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || reduceMotion.matches) return;

    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0.016);
    lastTime = time;

    update(dt);
    const links = draw(true);

    for (const pulse of pulses) pulse.t += dt / pulse.duration;
    pulses = pulses.filter((pulse) => pulse.t < 1);

    if (time - lastPulse > 650 && links.length && pulses.length < 6) {
      const [a, b] = links[Math.floor(Math.random() * links.length)];
      const forward = Math.random() < 0.5;
      pulses.push({ a: forward ? a : b, b: forward ? b : a, t: 0, duration: 0.9 + Math.random() * 0.6 });
      lastPulse = time;
    }

    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame || reduceMotion.matches || !visible || document.hidden) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }).observe(hero);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      stop();
      draw(false);
    } else {
      start();
    }
  });

  window.addEventListener("resize", resize);

  resize();
  if (reduceMotion.matches) draw(false);
  else start();
})();
