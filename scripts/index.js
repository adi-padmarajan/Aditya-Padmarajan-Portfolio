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

/* === Marathon horizontal scroll — native CSS scroll (no JS needed) === */
