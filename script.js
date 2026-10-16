document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const hamburger = document.getElementById("hamburger");
  const themeToggle = document.getElementById("themeToggle");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const interactive = finePointer && !reduceMotion;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ---------- Tema claro / oscuro ---------- */
  const savedTheme = localStorage.getItem("ia-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", savedTheme || (prefersDark ? "dark" : "light"));
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("ia-theme", next);
  });

  /* ---------- Menú móvil ---------- */
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("no-scroll", open);
  };
  hamburger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 960) setMenu(false); });

  /* ---------- Scroll suave ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      const target = id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight + 1;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      history.pushState(null, "", id);
    });
  });

  /* ---------- Header y enlace activo ---------- */
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav__link")];
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
    const pos = window.scrollY + header.offsetHeight + 120;
    let current = "";
    sections.forEach((s) => { if (pos >= s.offsetTop) current = s.id; });
    navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${current}`));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Aparición al hacer scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 70}ms`;
        el.classList.add("visible");
        setTimeout(() => { el.style.transitionDelay = ""; }, 1200);
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Contadores ---------- */
  if (!reduceMotion) {
    document.querySelectorAll(".stat__num").forEach((el) => {
      const target = Number(el.dataset.target);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const start = performance.now() + 300;
      const step = (now) => {
        const p = clamp((now - start) / 1600, 0, 1);
        el.textContent = `${prefix}${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = `${prefix}0${suffix}`;
      requestAnimationFrame(step);
    });
  }

  /* ---------- Terminal de definiciones ---------- */
  const tabs = [...document.querySelectorAll(".term__tab")];
  const termCmd = document.getElementById("termCmd");
  const termOut = document.getElementById("termOut");
  let typingToken = 0;
  const typeText = (text) => {
    const token = ++typingToken;
    if (reduceMotion) { termOut.textContent = text; return; }
    termOut.textContent = "";
    let i = 0;
    const tick = () => {
      if (token !== typingToken) return;
      termOut.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 18);
    };
    tick();
  };
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    termCmd.textContent = tab.dataset.cmd;
    typeText(tab.dataset.text);
  };
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  if (tabs[0]) typeText(tabs[0].dataset.text);

  /* ---------- Acordeón ---------- */
  const items = document.querySelectorAll(".accordion__item");
  items.forEach((item) => {
    const trigger = item.querySelector(".accordion__trigger");
    const panel = item.querySelector(".accordion__panel");
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      items.forEach((other) => {
        other.classList.remove("open");
        other.querySelector(".accordion__trigger").setAttribute("aria-expanded", "false");
        other.querySelector(".accordion__panel").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  /* ---------- Validación del formulario ---------- */
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const rules = {
    nombre: (v) => (!v.trim() ? "Por favor, escribe tu nombre." : v.trim().length < 2 ? "El nombre debe tener al menos 2 caracteres." : ""),
    email: (v) => (!v.trim() ? "El correo electrónico es obligatorio." : !emailRe.test(v.trim()) ? "Introduce un correo electrónico válido." : ""),
    asunto: (v) => (!v ? "Selecciona un asunto." : ""),
    mensaje: (v) => (!v.trim() ? "Escribe tu mensaje." : v.trim().length < 10 ? "El mensaje debe tener al menos 10 caracteres." : ""),
    privacidad: (_, el) => (!el.checked ? "Debes aceptar la política de privacidad." : ""),
  };
  const validateField = (el) => {
    const group = el.closest(".form__group");
    const error = rules[el.name](el.value, el);
    group.querySelector(".form__error").textContent = error;
    group.classList.toggle("invalid", !!error);
    group.classList.toggle("valid", !error);
    el.setAttribute("aria-invalid", String(!!error));
    return !error;
  };
  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    const evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur";
    el.addEventListener(evt, () => validateField(el));
    el.addEventListener("input", () => {
      if (el.closest(".form__group").classList.contains("invalid")) validateField(el);
    });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    success.hidden = true;
    const fields = Object.keys(rules).map((n) => form.elements[n]);
    const results = fields.map(validateField);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) { firstInvalid.focus(); return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Enviando...";
    setTimeout(() => {
      form.reset();
      form.querySelectorAll(".form__group").forEach((g) => g.classList.remove("valid", "invalid"));
      btn.disabled = false;
      btn.textContent = "Enviar mensaje";
      success.hidden = false;
    }, 900);
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Pixel art: pausar SMIL si se reduce el movimiento ---------- */
  if (reduceMotion) {
    document.querySelectorAll("svg.pixel").forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());
  }

  /* ---------- Onda al hacer clic ---------- */
  if (!reduceMotion) {
    const rippleTargets = ".btn, .nav__link, .term__tab, .accordion__trigger, .theme-toggle, .to-top, .hamburger, [data-tilt]";
    document.querySelectorAll(rippleTargets).forEach((el) => el.classList.add("ripple-host"));
    document.addEventListener("pointerdown", (e) => {
      const host = e.target.closest(rippleTargets);
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      host.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }

  /* ---------- Lienzo del hero: rayos y píxeles que reaccionan al cursor ---------- */
  const art = document.getElementById("heroArt");
  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d");
  const coords = document.getElementById("artCoords");
  const hero = document.getElementById("inicio");
  const mouse = { x: 0, y: 0, active: false };
  let W = 0, H = 0, dpr = 1, particles = [], pulses = [], running = false, rafId = 0, rotation = 0;

  const RAYS = 120;
  const resizeCanvas = () => {
    const rect = art.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = finePointer ? 46 : 24;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      s: Math.random() < .3 ? 3 : 2,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const r0 = Math.min(W, H) * .2;
    const r1 = Math.hypot(W, H) * .55;
    const mAngle = Math.atan2(mouse.y - cy, mouse.x - cx);
    const mDist = Math.hypot(mouse.x - cx, mouse.y - cy);

    ctx.lineWidth = 1;
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * Math.PI * 2 + rotation;
      let influence = 0;
      if (mouse.active) {
        let diff = Math.atan2(Math.sin(a - mAngle), Math.cos(a - mAngle));
        influence = Math.exp(-(diff * diff) / .05) * clamp(1.4 - mDist / r1, 0, 1);
      }
      const sx = cx + Math.cos(a) * r0, sy = cy + Math.sin(a) * r0;
      const ex = cx + Math.cos(a) * r1, ey = cy + Math.sin(a) * r1;
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      const qx = mx + (mouse.x - mx) * influence * .6;
      const qy = my + (mouse.y - my) * influence * .6;
      ctx.strokeStyle = `rgba(255,255,255,${.16 + influence * .6})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(qx, qy, ex, ey);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.beginPath();
    ctx.arc(cx, cy, r0, 0, Math.PI * 2);
    ctx.stroke();

    pulses = pulses.filter((p) => p.r < r1);
    pulses.forEach((p) => {
      p.r += 6;
      ctx.strokeStyle = `rgba(255,255,255,${.6 * (1 - p.r / r1)})`;
      ctx.strokeRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });

    ctx.fillStyle = "#fff";
    particles.forEach((p) => {
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d > 0) { p.vx += (dx / d) * .25; p.vy += (dy / d) * .25; }
      }
      pulses.forEach((pl) => {
        const d = Math.hypot(p.x - pl.x, p.y - pl.y);
        if (Math.abs(d - pl.r) < 8 && d > 0) { p.vx += ((p.x - pl.x) / d) * .8; p.vy += ((p.y - pl.y) / d) * .8; }
      });
      p.vx *= .96; p.vy *= .96;
      p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02;
      p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    });
  };

  const loop = () => {
    rotation += .0007;
    draw();
    rafId = requestAnimationFrame(loop);
  };
  const start = () => { if (!running && !reduceMotion) { running = true; rafId = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(rafId); };

  resizeCanvas();
  draw();
  window.addEventListener("resize", () => { resizeCanvas(); draw(); });
  if (!reduceMotion) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(art);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  /* ---------- Interacciones solo con ratón ---------- */
  if (!interactive) return;

  root.classList.add("has-cursor");

  /* Cursor con estela de píxeles */
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const TRAIL = 8;
  const trail = Array.from({ length: TRAIL }, (_, i) => {
    const el = document.createElement("div");
    el.className = "cursor-trail";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--trail-o", String(.45 * (1 - i / TRAIL)));
    document.body.appendChild(el);
    return { el, x: 0, y: 0 };
  });
  const pointer = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  const hoverSel = "a, button, input, select, textarea, label, [data-tilt]";

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    root.classList.add("cursor-visible");
    root.classList.toggle("cursor-on-paper", !!e.target.closest(".paper"));
    ring.classList.toggle("is-hover", !!e.target.closest(hoverSel));
  });
  document.addEventListener("mouseleave", () => root.classList.remove("cursor-visible"));
  document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  document.addEventListener("pointerup", () => ring.classList.remove("is-down"));

  const cursorLoop = () => {
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ringPos.x += (pointer.x - ringPos.x) * .2;
    ringPos.y += (pointer.y - ringPos.y) * .2;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    let lx = pointer.x, ly = pointer.y;
    trail.forEach((t) => {
      t.x += (lx - t.x) * .35;
      t.y += (ly - t.y) * .35;
      t.el.style.transform = `translate3d(${Math.round(t.x / 4) * 4}px, ${Math.round(t.y / 4) * 4}px, 0)`;
      lx = t.x; ly = t.y;
    });
    requestAnimationFrame(cursorLoop);
  };
  requestAnimationFrame(cursorLoop);

  /* Inclinación 3D */
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = Number(el.dataset.tilt) || 7;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.setProperty("--ry", `${(px - .5) * max * 2}deg`);
      el.style.setProperty("--rx", `${-(py - .5) * max * 2}deg`);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });

  /* Botones magnéticos */
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.classList.add("mag-active");
      el.style.setProperty("--mgx", `${(e.clientX - r.left - r.width / 2) * .3}px`);
      el.style.setProperty("--mgy", `${(e.clientY - r.top - r.height / 2) * .4}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("mag-active");
      el.style.setProperty("--mgx", "0px");
      el.style.setProperty("--mgy", "0px");
    });
  });

  /* Parallax, ojos del robot y rayos siguiendo al ratón */
  const layers = [...document.querySelectorAll(".parallax")].map((el) => ({ el, depth: Number(el.dataset.depth) || 0, x: 0, y: 0 }));
  const pupils = document.getElementById("robotPupils");
  const robot = document.querySelector(".pixel-robot");
  const target = { x: 0, y: 0 };
  let lastPupil = "";

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const hr = hero.getBoundingClientRect();
    target.x = (e.clientX - hr.left) / hr.width - .5;
    target.y = (e.clientY - hr.top) / hr.height - .5;

    const ar = art.getBoundingClientRect();
    mouse.x = e.clientX - ar.left;
    mouse.y = e.clientY - ar.top;
    mouse.active = true;
    coords.textContent = `X ${String(Math.round(clamp(mouse.x, 0, 999))).padStart(3, "0")} · Y ${String(Math.round(clamp(mouse.y, 0, 999))).padStart(3, "0")}`;

    const rr = robot.getBoundingClientRect();
    const dx = clamp(Math.round((e.clientX - (rr.left + rr.width / 2)) / 120), -1, 1);
    const dy = clamp(Math.round((e.clientY - (rr.top + rr.height * .3)) / 120), -1, 1);
    const t = `translate(${dx} ${dy})`;
    if (t !== lastPupil) { pupils.setAttribute("transform", t); lastPupil = t; }
  });
  hero.addEventListener("pointerleave", () => {
    target.x = 0; target.y = 0;
    mouse.active = false;
    pupils.setAttribute("transform", "translate(0 0)");
    lastPupil = "";
  });
  art.addEventListener("pointerdown", (e) => {
    const ar = art.getBoundingClientRect();
    pulses.push({ x: e.clientX - ar.left, y: e.clientY - ar.top, r: 0 });
  });

  const parallaxLoop = () => {
    layers.forEach((l) => {
      l.x += (target.x * l.depth - l.x) * .08;
      l.y += (target.y * l.depth - l.y) * .08;
      l.el.style.setProperty("--px", `${l.x.toFixed(2)}px`);
      l.el.style.setProperty("--py", `${l.y.toFixed(2)}px`);
    });
    requestAnimationFrame(parallaxLoop);
  };
  requestAnimationFrame(parallaxLoop);
});
