/* === Hero entrance: portrait + floating cards stagger in === */
(function () {
  if (!window.gsap) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portrait = document.querySelector(".hero-portrait");
  const cards = gsap.utils.toArray(".hero-card");

  if (reduced) {
    if (portrait) gsap.set(portrait, { opacity: 1 });
    if (cards.length) gsap.set(cards, { opacity: 1 });
    return;
  }

  if (portrait) {
    gsap.fromTo(portrait,
      { opacity: 0, y: 28, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out", delay: 0.25, clearProps: "transform" }
    );
  }
  if (cards.length) {
    gsap.fromTo(cards,
      { opacity: 0, y: 22, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "expo.out", stagger: 0.07, delay: 0.55, clearProps: "transform" }
    );
  }
})();

/* === Hero connector lines: card-dots → laptop edges === */
(function () {
  'use strict';
  if (!window.gsap) return;

  const DESKTOP = window.matchMedia("(min-width: 1100px)");
  const stage   = document.querySelector(".hero-stage");
  const portrait = document.querySelector(".hero-portrait");
  const cards   = Array.from(document.querySelectorAll(".hero-stage .hero-card"));
  if (!stage || !portrait || !cards.length) return;

  /* ── SVG overlay ──────────────────────────────────────────── */
  const NS  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("hero-connector-svg");
  stage.appendChild(svg);

  /* ── Card accent colors ───────────────────────────────────── */
  const COLORS = {
    rose:    "#ff7e90",
    emerald: "#6dc395",
    violet:  "#9c84e0",
    amber:   "#e8a55c",
  };

  /*
   * Laptop anchor positions as fractions of the portrait image rect.
   * Measured from the actual Potrait.png (1270×939):
   *   Bezel left edge  ≈ 9%   Bezel right edge ≈ 90%
   *   Bezel top edge   ≈ 5%   Laptop body bottom ≈ 76%
   */
  /* Which axis to lock so lines are perfectly parallel to the laptop frame edges */
  const AXIS = {
    "hc-1": "x", "hc-4": "x",   // top cards   → vertical lines   (lock x to card dot)
    "hc-2": "y", "hc-3": "y",   // left cards  → horizontal lines (lock y to card dot)
    "hc-5": "y", "hc-7": "y",   // right cards → horizontal lines (lock y to card dot)
    "hc-6": "x",                 // bottom card → vertical line    (lock x to card dot)
  };

  const ANCHORS = {
    "hc-1": { px: 0.23, py: 0.16 },   // top-left area of bezel  (top-left card)
    "hc-4": { px: 0.78, py: 0.16 },   // top-right area of bezel (top-right card)
    "hc-2": { px: 0.2, py: 0.41},   // left edge upper         (left-top card)
    "hc-3": { px: 0.2, py: 0.61},   // left edge lower         (left-bottom card)
    "hc-5": { px: 0.81, py: 0.41 },   // right edge upper        (right-top card)
    "hc-7": { px: 0.81, py: 0.56 },   // right edge lower        (right-bottom card)
    "hc-6": { px: 0.50, py: 0.76 },   // bottom center           (bottom card)
  };

  /* ── Build SVG elements per card ─────────────────────────── */
  const lineItems = cards.map((card) => {
    const color  = COLORS[card.dataset.c] || "#d4a574";
    const hcClass = Array.from(card.classList).find((c) => /^hc-\d+$/.test(c));

    /* Dashed connector path */
    const path = document.createElementNS(NS, "path");
    path.setAttribute("fill",           "none");
    path.setAttribute("stroke",         color);
    path.setAttribute("stroke-width",   "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("opacity",        "0.72");
    svg.appendChild(path);

    /* Anchor dot — sits on the laptop edge */
    const anchorDot = document.createElementNS(NS, "circle");
    anchorDot.setAttribute("r",       "4");
    anchorDot.setAttribute("fill",    color);
    anchorDot.setAttribute("opacity", "0.9");
    svg.appendChild(anchorDot);

    /* Halo ring that pulses around the anchor dot */
    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("r",             "4");
    halo.setAttribute("fill",          "none");
    halo.setAttribute("stroke",        color);
    halo.setAttribute("stroke-width",  "1.5");
    halo.setAttribute("opacity",       "0");
    svg.appendChild(halo);

    const cardDot = card.querySelector(".card-dot");
    return { card, cardDot, path, anchorDot, halo, color, hcClass };
  });

  /* ── Position helper ──────────────────────────────────────── */
  function centerOf(el, refEl) {
    const er = el.getBoundingClientRect();
    const rr = refEl.getBoundingClientRect();
    return { x: er.left + er.width * 0.5 - rr.left, y: er.top + er.height * 0.5 - rr.top };
  }

  let flowTweens = [];

  function rebuildLines() {
    flowTweens.forEach((t) => t.kill());
    flowTweens = [];

    if (!DESKTOP.matches) {
      svg.style.opacity = "0";
      return;
    }
    if (linesReady) svg.style.opacity = "1";

    const sr = stage.getBoundingClientRect();
    const pr = portrait.getBoundingClientRect();
    if (pr.width === 0) return;  // image not yet laid out

    lineItems.forEach(({ card, cardDot, path, anchorDot, halo, hcClass }, i) => {
      if (!cardDot || !hcClass) { path.setAttribute("d", ""); return; }

      const anchor = ANCHORS[hcClass];
      if (!anchor) { path.setAttribute("d", ""); return; }

      const start = centerOf(cardDot, stage);
      const tgt = {
        x: pr.left + pr.width  * anchor.px - sr.left,
        y: pr.top  + pr.height * anchor.py - sr.top,
      };

      /* Lock axis so line is perfectly parallel to the nearest laptop frame edge */
      if (AXIS[hcClass] === "x") tgt.x = start.x;  // vertical
      if (AXIS[hcClass] === "y") tgt.y = start.y;  // horizontal

      /* Perfectly straight line */
      const d = `M${start.x.toFixed(1)},${start.y.toFixed(1)} L${tgt.x.toFixed(1)},${tgt.y.toFixed(1)}`;
      path.setAttribute("d", d);

      /* Dash pattern — dense and crisp */
      const len  = path.getTotalLength();
      const dash = 5;
      const gap  = Math.max(7, len * 0.036);
      path.setAttribute("stroke-dasharray",  `${dash} ${gap}`);
      path.setAttribute("stroke-dashoffset", "0");

      /* Position anchor dot + halo */
      anchorDot.setAttribute("cx", tgt.x.toFixed(1));
      anchorDot.setAttribute("cy", tgt.y.toFixed(1));
      halo.setAttribute("cx", tgt.x.toFixed(1));
      halo.setAttribute("cy", tgt.y.toFixed(1));

      /* Flowing dashes: card → laptop */
      const flow = gsap.to(path, {
        strokeDashoffset: -(dash + gap),
        duration:  1.3 + (i % 5) * 0.15,
        ease:      "none",
        repeat:    -1,
        delay:     0,
      });
      flowTweens.push(flow);

      /* Halo pulse at anchor point */
      const pulse = gsap.timeline({ repeat: -1, delay: i * 0.28 });
      pulse
        .fromTo(halo,
          { attr: { r: 4 }, opacity: 0.7 },
          { attr: { r: 14 }, opacity: 0, duration: 1.6, ease: "power2.out" }
        )
        .to(halo, { duration: 0.6 });  // brief pause before next pulse
      flowTweens.push(pulse);
    });
  }

  /* ── Initialize ────────────────────────────────────────────── */
  /*
   * Lines are hidden until two conditions are both met:
   *   1. document.fonts.ready  — real fonts loaded, card sizes are stable
   *   2. 2100 ms have elapsed  — entrance animations have completed
   *      (delay 0.55s + duration 0.9s + max stagger 0.42s = ~1.87s, +230ms margin)
   *
   * Waiting for both prevents the 22px GSAP-transform offset (cards start at
   * y:22 during their entrance, skewing every dot measurement) and the
   * font-swap layout shift. Lines then fade in smoothly once everything settles.
   */
  let linesReady = false;
  svg.style.opacity = "0";

  const fontsPromise  = document.fonts ? document.fonts.ready : Promise.resolve();
  const delayPromise  = new Promise(resolve => setTimeout(resolve, 2100));

  Promise.all([fontsPromise, delayPromise]).then(() => {
    linesReady = true;
    rebuildLines();
    if (DESKTOP.matches) {
      gsap.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    }
  });

  /* ── Resize ───────────────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildLines, 150);
  });

  DESKTOP.addEventListener("change", rebuildLines);
})();

/* === Project hover preview with cursor follow === */
(function () {
  const isTouch = window.matchMedia("(hover: none)").matches || window.innerWidth < 900;
  if (isTouch) return;

  const list = document.querySelector(".projects-list");
  const preview = document.getElementById("proj-preview");
  const cap = preview && preview.querySelector("[data-preview-cap]");
  const imgs = preview ? preview.querySelectorAll(".pv-img") : [];
  if (!list || !preview) return;

  let mx = 0, my = 0, cx = 0, cy = 0;
  let active = false;

  list.addEventListener("mousemove", (e) => {
    const r = list.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });

  document.querySelectorAll(".project-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      active = true;
      preview.style.opacity = "1";
      const key = row.dataset.previewName || "";
      imgs.forEach((im) => im.classList.toggle("is-active", im.dataset.key === key));
      if (cap) cap.textContent = key ? key + " — case study" : "View case study";
    });
    row.addEventListener("mouseleave", () => {
      active = false;
      preview.style.opacity = "0";
    });
  });

  function step() {
    cx += (mx - cx) * 0.13;
    cy += (my - cy) * 0.13;
    preview.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) ${active ? "scale(1)" : "scale(0.92)"}`;
    requestAnimationFrame(step);
  }
  step();
})();

/* === Marathon horizontal scroll === */
(function () {
  const section = document.getElementById("mar-scroll");
  if (!section || !window.gsap || !window.ScrollTrigger) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  if (isMobile) return; /* mobile uses native horizontal touch scroll */

  const track = section.querySelector(".scroll-track");
  const progress = document.getElementById("mar-progress");

  const getDistance = () => {
    const gutterEl = document.querySelector(".wrap");
    const gutter = gutterEl ? parseFloat(getComputedStyle(gutterEl).paddingLeft) || 24 : 24;
    return Math.max(0, track.scrollWidth - window.innerWidth + gutter * 2);
  };

  gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      start: "top top",
      end: () => `+=${getDistance()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progress) progress.style.transform = `scaleX(${self.progress})`;
      },
    },
  });
})();
