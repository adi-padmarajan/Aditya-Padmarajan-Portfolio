/* ========================================================
   Aditya Padmarajan — Portfolio
   Shared interactions:
   - Lenis smooth scroll
   - GSAP reveals + char-split hero
   - Custom cursor + ambient spotlight orb
   - Magnetic hover (buttons / circle CTAs)
   - Scroll-velocity skew (marathon cards)
   - Number count-up (stats)
   - Page-exit fade transition
   ======================================================== */

(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches || !window.matchMedia("(hover: hover)").matches;

  /* ───────────────────────────────────────────────────────────
     Ambient gradient mesh — inject once, sitewide
     ─────────────────────────────────────────────────────────── */
  (function injectMesh() {
    if (document.querySelector(".gradient-mesh")) return;
    const mesh = document.createElement("div");
    mesh.className = "gradient-mesh";
    mesh.setAttribute("aria-hidden", "true");
    mesh.innerHTML =
      '<div class="blob b1"></div>' +
      '<div class="blob b2"></div>' +
      '<div class="blob b3"></div>' +
      '<div class="blob b4"></div>' +
      '<div class="blob b5"></div>';
    // Insert as first child of body so it sits behind everything
    if (document.body) document.body.insertBefore(mesh, document.body.firstChild);
    else document.addEventListener("DOMContentLoaded", () => document.body.insertBefore(mesh, document.body.firstChild));
  })();

  /* ───────────────────────────────────────────────────────────
     Mobile hamburger menu
     ─────────────────────────────────────────────────────────── */
  (function mobileMenu() {
    const nav = document.querySelector(".nav");
    const toggle = nav && nav.querySelector(".nav-toggle");
    const panel = nav && nav.querySelector(".links");
    if (!nav || !toggle || !panel) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (window.lenis) { open ? window.lenis.stop() : window.lenis.start(); }
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    panel.addEventListener("click", (e) => { if (e.target.tagName === "A") setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 720 && nav.classList.contains("is-open")) setOpen(false); });
  })();

  /* ───────────────────────────────────────────────────────────
     Lenis smooth scroll
     ─────────────────────────────────────────────────────────── */
  if (window.Lenis && !reducedMotion) {
    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.lenis = lenis;
    if (window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ───────────────────────────────────────────────────────────
     Ambient spotlight + custom cursor
     ─────────────────────────────────────────────────────────── */
  if (!isMobile) {
    /* Inject DOM */
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.innerHTML =
      '<div class="cursor-dot"></div>' +
      '<div class="cursor-ring">' +
        '<svg viewBox="-50 -50 100 100" aria-hidden="true">' +
          '<circle class="ring-circle" cx="0" cy="0" r="22" fill="none"></circle>' +
          '<g class="ring-ticks">' +
            '<line x1="0" y1="-22" x2="0" y2="-17"></line>' +
            '<line x1="22" y1="0" x2="17" y2="0"></line>' +
            '<line x1="0" y1="22" x2="0" y2="17"></line>' +
            '<line x1="-22" y1="0" x2="-17" y2="0"></line>' +
            '<line class="tick-diag" x1="15.5" y1="-15.5" x2="12" y2="-12"></line>' +
            '<line class="tick-diag" x1="15.5" y1="15.5" x2="12" y2="12"></line>' +
            '<line class="tick-diag" x1="-15.5" y1="15.5" x2="-12" y2="12"></line>' +
            '<line class="tick-diag" x1="-15.5" y1="-15.5" x2="-12" y2="-12"></line>' +
          '</g>' +
          '<circle class="ring-progress" cx="0" cy="0" r="22" fill="none" pathLength="100"></circle>' +
        '</svg>' +
      '</div>';
    document.body.appendChild(cursor);

    const dotEl = cursor.querySelector(".cursor-dot");
    const ringEl = cursor.querySelector(".cursor-ring");

    const spot = document.createElement("div");
    spot.className = "spotlight";
    document.body.appendChild(spot);

    const orb = document.createElement("div");
    orb.className = "ambient-orb";
    document.body.appendChild(orb);

    let x = innerWidth / 2, y = innerHeight / 2;
    let cx = x, cy = y;     /* dot — fast follow */
    let rx = x, ry = y;     /* ring — soft trailing follow */
    let sx = x, sy = y;     /* spotlight (slowest lerp) */
    let lastX = x, lastY = y;
    let vel = 0;            /* smoothed pointer velocity */
    let angle = 0;          /* ring rotation */

    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });

    function loop() {
      /* Fast dot */
      cx += (x - cx) * 0.32;
      cy += (y - cy) * 0.32;
      /* Trailing ring — elastic lag */
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      /* Slow spotlight */
      sx += (x - sx) * 0.06;
      sy += (y - sy) * 0.06;

      /* Velocity → ring stretch + faster spin when moving */
      const dx = x - lastX, dy = y - lastY;
      const v = Math.min(40, Math.sqrt(dx*dx + dy*dy));
      vel += (v - vel) * 0.18;
      lastX = x; lastY = y;
      angle += 0.25 + vel * 0.06;

      const stretch = 1 + Math.min(0.35, vel * 0.012);
      const squish  = 1 - Math.min(0.18, vel * 0.006);
      const dir = Math.atan2(dy, dx) * 180 / Math.PI;

      dotEl.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      ringEl.style.transform =
        `translate(${rx}px, ${ry}px) translate(-50%, -50%) ` +
        `rotate(${dir}deg) scale(${stretch}, ${squish}) rotate(${-dir}deg) ` +
        `rotate(${angle}deg)`;
      spot.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    /* Hover targets */
    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      if (t.closest("a, button, [data-hover]")) {
        cursor.classList.add("is-hover");
        if (t.closest("[data-hover='text']")) cursor.classList.add("is-text");
      }
    });
    document.addEventListener("mouseout", (e) => {
      const t = e.target;
      if (t.closest("a, button, [data-hover]")) {
        cursor.classList.remove("is-hover");
        cursor.classList.remove("is-text");
      }
    });

    /* Click pulse */
    addEventListener("mousedown", () => cursor.classList.add("is-down"));
    addEventListener("mouseup",   () => cursor.classList.remove("is-down"));
  }

  /* ───────────────────────────────────────────────────────────
     Char-split for hero (preserves whole-line mask reveal)
     Each .split-line .inner gets per-char spans stacked w/ stagger
     ─────────────────────────────────────────────────────────── */
  function charSplit(el) {
    const text = el.textContent;
    el.textContent = "";
    const frag = document.createDocumentFragment();
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.display = "inline-block";
      span.style.willChange = "transform, opacity";
      span.textContent = ch === " " ? "\u00A0" : ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
  }

  /* ───────────────────────────────────────────────────────────
     Page entrance: veil out + line + char reveal
     ─────────────────────────────────────────────────────────── */
  const veil = document.querySelector(".veil");
  if (veil && window.gsap) {
    gsap.to(veil, {
      scaleY: 0,
      duration: 1.0,
      ease: "expo.inOut",
      delay: 0.05,
      onComplete: () => veil.remove(),
    });
  }

  if (window.gsap) {
    /* line-level reveal */
    gsap.utils.toArray(".split-line .inner").forEach((el, i) => {
      /* Optionally char-split inside */
      if (el.dataset.charSplit !== "false" && el.children.length === 0) {
        charSplit(el);
      }

      gsap.fromTo(
        el,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          delay: 0.3 + (parseFloat(el.dataset.delay) || i * 0.06),
          onComplete: () => {
            /* Open the mask so descenders (y, j, g, p) render fully */
            if (el.parentElement) el.parentElement.style.overflow = "visible";
          },
        }
      );

      /* per-char subtle pop */
      const chars = el.querySelectorAll(".char");
      if (chars.length) {
        gsap.fromTo(
          chars,
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.025,
            delay: 0.45 + (parseFloat(el.dataset.delay) || i * 0.06),
          }
        );
      }
    });

    /* Generic rise on scroll */
    if (window.ScrollTrigger) {
      gsap.utils.toArray("[data-anim='rise']").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1.0, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });
      gsap.utils.toArray("[data-anim='fade']").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1, duration: 1.2, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          }
        );
      });
    }
  }

  /* ───────────────────────────────────────────────────────────
     Hero cinematic — cursor-led italic + scroll exit + marquee handoff
     Index page only; layers on top of the existing char-split reveal.
     ─────────────────────────────────────────────────────────── */
  (function heroMotion() {
    if (reducedMotion || !window.gsap) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const metaCols = hero.querySelectorAll(".hero-meta .col");
    const lead     = hero.querySelector(".hero-bottom .lead");
    const cue      = hero.querySelector(".hero-bottom .scroll-cue");
    const title    = hero.querySelector(".hero-title");
    const rose     = hero.querySelector(".hero-title .rose");
    const status   = hero.querySelector(".hero-status");
    const statusRows = status ? status.querySelectorAll(".hs-row, .hs-block") : [];

    const dateEl = status && status.querySelector("[data-hs-date]");
    if (dateEl) {
      const now = new Date();
      const month = now.toLocaleString("en-US", { month: "long" });
      dateEl.textContent = `Live · ${month} ${now.getFullYear()}`;
    }
    const marquee  = document.querySelector(".marquee");
    const heroTags = hero.querySelectorAll(".hero-tag");

    if (heroTags.length) {
      gsap.fromTo(heroTags,
        { opacity: 0, y: 16, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out", stagger: 0.12, delay: 0.7 }
      );
    }

    /* a) Entrance polish — meta, lead, scroll cue rise after title chars */
    if (metaCols.length) {
      gsap.fromTo(metaCols,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.0, ease: "expo.out", stagger: 0.08, delay: 0.4 }
      );
    }
    if (lead) {
      gsap.fromTo(lead,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", delay: 1.05 }
      );
    }
    if (cue) {
      gsap.fromTo(cue,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 1.1, ease: "expo.out", delay: 1.2 }
      );
    }
    if (statusRows.length) {
      gsap.fromTo(statusRows,
        { opacity: 0, x: 18 },
        { opacity: 1, x: 0, duration: 1.0, ease: "expo.out", stagger: 0.09, delay: 0.85 }
      );
    }

    /* b) Cursor-led italic word — Padmarajan leans toward the pointer */
    if (rose && !isMobile) {
      const xTo    = gsap.quickTo(rose, "x",     { duration: 0.9, ease: "power3.out" });
      const yTo    = gsap.quickTo(rose, "y",     { duration: 0.9, ease: "power3.out" });
      const skewTo = gsap.quickTo(rose, "skewX", { duration: 1.0, ease: "power3.out" });

      hero.addEventListener("mousemove", (e) => {
        const r = rose.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) * 0.04;
        const dy = (e.clientY - cy) * 0.04;
        const skew = Math.max(-3, Math.min(3, (e.clientX - cx) * 0.004));
        xTo(dx); yTo(dy); skewTo(skew);
      });
      hero.addEventListener("mouseleave", () => { xTo(0); yTo(0); skewTo(0); });
    }

    /* c) Scroll-driven exit + marquee handoff */
    if (!window.ScrollTrigger) return;

    if (title) {
      gsap.to(title, {
        yPercent: -22,
        scale: 1.06,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }

    const exitTargets = [lead, cue, status].filter(Boolean);
    if (exitTargets.length) {
      gsap.to(exitTargets, {
        opacity: 0,
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "55% top",
          scrub: 0.8,
        },
      });
    }

    if (marquee) {
      gsap.fromTo(marquee,
        { yPercent: 30, opacity: 0 },
        {
          yPercent: 0, opacity: 1, ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "35% top",
            end: "bottom top",
            scrub: 0.8,
          },
        }
      );
    }
  })();

  /* ───────────────────────────────────────────────────────────
     Magnetic hover — pulls element toward cursor on proximity
     Apply to .btn, .btn-circle, .btn-metal, [data-magnet]
     ─────────────────────────────────────────────────────────── */
  if (!isMobile && window.gsap) {
    document.querySelectorAll(".btn, .btn-circle, .btn-metal, [data-magnet]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnet) || 0.35;
      const radius   = parseFloat(el.dataset.magnetRadius) || 120;

      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const cxEl = r.left + r.width / 2;
        const cyEl = r.top + r.height / 2;
        const dx = e.clientX - cxEl;
        const dy = e.clientY - cyEl;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.5, ease: "power3.out" });
        }
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ───────────────────────────────────────────────────────────
     Scroll-velocity skew — DISABLED (was conflicting with the
     pinned horizontal marathon scroll, causing jitter)
     ─────────────────────────────────────────────────────────── */

  /* ───────────────────────────────────────────────────────────
     Number count-up on stats
     Looks for .stat .num and any element with [data-count]
     ─────────────────────────────────────────────────────────── */
  if (window.gsap && window.ScrollTrigger) {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const obj = { v: 0 };
      el.textContent = (0).toFixed(decimals) + suffix;
      gsap.to(obj, {
        v: target,
        duration: 2.2,
        ease: "expo.out",
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  }

  /* ───────────────────────────────────────────────────────────
     Marquee tracks
     ─────────────────────────────────────────────────────────── */
  document.querySelectorAll("[data-marquee]").forEach((el) => {
    const inner = el.querySelector(".marquee-track");
    if (!inner || !window.gsap) return;
    const clone = inner.cloneNode(true);
    el.appendChild(clone);
    const speed = parseFloat(el.dataset.speed) || 40;
    gsap.to(el.querySelectorAll(".marquee-track"), {
      xPercent: -100,
      duration: speed,
      ease: "none",
      repeat: -1,
    });
  });

  /* ───────────────────────────────────────────────────────────
     Page exit transition
     Intercept same-origin clicks → animate veil → navigate
     ─────────────────────────────────────────────────────────── */
  if (window.gsap) {
    /* inject one veil for exits */
    const exitVeil = document.createElement("div");
    exitVeil.className = "page-veil";
    document.body.appendChild(exitVeil);

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.hash) return; /* in-page anchor */
      } catch (_) { return; }

      e.preventDefault();
      gsap.to(exitVeil, {
        scaleY: 1,
        duration: 0.6,
        ease: "expo.inOut",
        onComplete: () => { window.location.href = a.href; },
      });
    });

    /* Reset state when restored from bfcache (back/forward nav on mobile),
       otherwise the exit veil stays at scaleY:1 and shows a stuck black screen. */
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      gsap.set(exitVeil, { scaleY: 0 });
      const nav = document.querySelector(".nav");
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        document.body.classList.remove("menu-open");
      }
      if (window.lenis && window.lenis.start) window.lenis.start();
    });
  }

})();
