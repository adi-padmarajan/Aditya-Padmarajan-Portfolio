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
