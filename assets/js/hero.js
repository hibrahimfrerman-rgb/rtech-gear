(function () {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".heroSlide"));
  const dotsWrap = document.getElementById("heroDots");
  const pill = document.getElementById("heroPillText");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  const pauseBtn = document.getElementById("heroPause");
  const heroWhatsApp = document.getElementById("heroWhatsApp");
  let index = 0;
  let timer = null;
  let paused = false;

  slides.forEach((slide) => {
    const bg = slide.getAttribute("data-bg");
    if (bg) slide.style.backgroundImage = `url('${bg}')`;
  });

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

  let startX = 0;
  slider.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
  });
  slider.addEventListener("pointerup", (e) => {
    const dx = e.clientX - startX;
    if (dx > 50) prev();
    if (dx < -50) next();
  });

  if (heroWhatsApp && window.makeWhatsAppLink) {
    heroWhatsApp.href = window.makeWhatsAppLink("Hi R-Tech Gear, I need help choosing a product.");
  }

  setActive(0);
  start();
})();
