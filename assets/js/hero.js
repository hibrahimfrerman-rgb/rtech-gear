(function () {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".heroSlide"));
  const promoCards = Array.from(document.querySelectorAll(".promoCard[data-bg-desktop]"));
  const dotsWrap = document.getElementById("heroDots");
  const pill = document.getElementById("heroPillText");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  const pauseBtn = document.getElementById("heroPause");
  const heroWhatsApp = document.getElementById("heroWhatsApp");
  let index = 0;
  let timer = null;
  let paused = false;
  let pointerStartX = null;

  function isInteractiveTarget(target) {
    return !!target.closest(
      "#heroPrev, #heroNext, #heroPause, .heroDot, .heroCta, a, button, input, select, textarea, label"
    );
  }

  function applySlideBackgrounds() {
    const useMobile = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
    slides.forEach((slide) => {
      const desktop = slide.getAttribute("data-bg-desktop") || slide.getAttribute("data-bg");
      const mobile = slide.getAttribute("data-bg-mobile") || desktop;
      const chosen = useMobile ? mobile : desktop;
      if (chosen) slide.style.backgroundImage = `url('${chosen}')`;
    });
    promoCards.forEach((card) => {
      const desktop = card.getAttribute("data-bg-desktop");
      const mobile = card.getAttribute("data-bg-mobile") || desktop;
      const chosen = useMobile ? mobile : desktop;
      if (chosen) card.style.backgroundImage = `url('${chosen}')`;
    });
  }

  function setActive(i) {
    slides.forEach((s, idx) => s.classList.toggle("isActive", idx === i));
    if (pill) pill.textContent = slides[i].getAttribute("data-pill") || "";
    if (dotsWrap) {
      dotsWrap.querySelectorAll("button").forEach((d, idx) =>
        d.classList.toggle("isActive", idx === i)
      );
    }
  }

  function next() {
    index = (index + 1) % slides.length;
    setActive(index);
  }

  function prev() {
    index = (index - 1 + slides.length) % slides.length;
    setActive(index);
  }

  function start() {
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) return;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!paused) next();
    }, 6000);
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "heroDot" + (i === 0 ? " isActive" : "");
      dot.addEventListener("click", () => {
        index = i;
        setActive(index);
      });
      dotsWrap.appendChild(dot);
    });
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.textContent = paused ? ">" : "||";
      pauseBtn.setAttribute("aria-label", paused ? "Play" : "Pause");
    });
  }

  slider.addEventListener("mouseenter", () => { paused = true; });
  slider.addEventListener("mouseleave", () => { paused = false; });

  slider.addEventListener("pointerdown", (e) => {
    if (isInteractiveTarget(e.target) || !e.isPrimary) return;
    pointerStartX = e.clientX;
  });
  slider.addEventListener("pointerup", (e) => {
    if (pointerStartX === null || isInteractiveTarget(e.target) || !e.isPrimary) {
      pointerStartX = null;
      return;
    }
    const dx = e.clientX - pointerStartX;
    if (dx > 50) prev();
    if (dx < -50) next();
    pointerStartX = null;
  });
  slider.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  if (heroWhatsApp && window.makeWhatsAppLink) {
    heroWhatsApp.href = window.makeWhatsAppLink("Hi R-Tech Gear, I need help choosing a product.");
  }

  window.addEventListener("resize", applySlideBackgrounds);
  applySlideBackgrounds();
  setActive(0);
  start();
})();
