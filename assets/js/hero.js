(function () {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".heroSlide"));
  /* ==================================================
   PROMO CARDS
   Supports both the original single-card layout and
   the new promo slider containers.
================================================== */
  const promoCards = Array.from(document.querySelectorAll(".promoCard"));
  const dotsWrap = document.getElementById("heroDots");
  const pill = document.getElementById("heroPillText"); // slide caption pill (mobile's main context cue)
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  const pauseBtn = document.getElementById("heroPause");
  const heroWhatsApp = document.getElementById("heroWhatsApp");

  /* =========================================================
   HERO SEARCH PLACEHOLDERS
========================================================= */

const heroSearchWords = [
  "Search Samsung Galaxy...",
  "Search iPhone...",
  "Search JBL Speakers...",
  "Search PS5 Accessories...",
  "Search Smart Watches...",
  "Search Power Banks...",
  "Search Laptops...",
  "Search Earbuds..."
];

const heroSuggestions = [
  "Samsung Galaxy S25 Ultra",
  "Samsung A56",
  "iPhone 16 Pro",
  "iPhone 15",
  "Apple Watch",
  "JBL Flip 7",
  "AirPods Pro",
  "Gaming Mouse",
  "Gaming Keyboard",
  "PS5 Controller",
  "Power Bank",
  "Smart Watch",
  "Laptop",
  "MacBook Air",
  "Tecno Camon",
  "Infinix Note"
];

let placeholderIndex = 0;
  let index = 0;
  let timer = null;
  let paused = false;
  let pointerStartX = null;
  let pointerStartY = null;
  let isTouchDragging = false;
  let touchActive = false;

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

      /* ==================================================
         PROMO SLIDER SUPPORT
         If this promo card contains slides, apply the
         responsive background to every slide.
         Otherwise keep the original single-card behaviour.
      ================================================== */

      const slides = card.querySelectorAll(".promoSlide");

      if (slides.length) {

        slides.forEach((slide) => {

          const desktop = slide.getAttribute("data-bg-desktop");
          const mobile = slide.getAttribute("data-bg-mobile") || desktop;
          const chosen = useMobile ? mobile : desktop;

          if (chosen) {
            slide.style.backgroundImage = `url('${chosen}')`;
          }

        });

        return;

      }

      const desktop = card.getAttribute("data-bg-desktop");
      const mobile = card.getAttribute("data-bg-mobile") || desktop;
      const chosen = useMobile ? mobile : desktop;

      if (chosen) {
        card.style.backgroundImage = `url('${chosen}')`;
      }

    });
  }
    /* =========================================================
     PROMO SLIDERS
     Lightweight independent sliders for each promo card.
     Each promo slider manages its own timer and active slide.
     Duplicate .promoSlide blocks in index.html to add more slides.
  ========================================================= */

  function initPromoSlider(card) {

    const slides = Array.from(card.querySelectorAll(".promoSlide"));

    if (slides.length <= 1) return;

    let index = 0;
    let timer = null;
    let paused = false;

    function show(i) {
      slides.forEach((slide, idx) => {
        slide.classList.toggle("isActive", idx === i);
      });
    }

    function nextPromo() {
      index = (index + 1) % slides.length;
      show(index);
    }

    function startPromo() {
      clearInterval(timer);

      timer = setInterval(() => {
        if (!paused) nextPromo();
      }, 5000);
    }

    card.addEventListener("mouseenter", () => {
      paused = true;
    });

    card.addEventListener("mouseleave", () => {
      paused = false;
    });

    show(0);
    startPromo();

  }

  function setActive(i) {
    slides.forEach((s, idx) => s.classList.toggle("isActive", idx === i));

    // Sync the pill caption with whichever slide is now active —
    // this single function is the only path used by autoplay, arrows,
    // dot clicks, and swipe, so patching here covers every trigger.
    if (pill) pill.textContent = slides[i].getAttribute("data-pill") || "";

    if (dotsWrap) {
      dotsWrap.querySelectorAll("button").forEach((d, idx) =>
        d.classList.toggle("isActive", idx === i)
      );
    }
}
/* =========================================================
   HERO SEARCH
========================================================= */

(function () {

  const input = document.getElementById("heroSearchInput");

  const button = document.getElementById("heroSearchBtn");

  const results = document.getElementById("heroSearchResults");

  /* Animated placeholder */

if (input) {

  input.placeholder = heroSearchWords[0];

  setInterval(() => {

    if (document.activeElement === input) return;

    placeholderIndex++;

    if (placeholderIndex >= heroSearchWords.length) {
      placeholderIndex = 0;
    }

    input.placeholder = heroSearchWords[placeholderIndex];

  }, 2600);

}
  


  if (!input || !button) return;

  function runSearch() {

    const query = input.value.trim();

    if (!query) {
      window.location.href = "shop.html";
      return;
    }

    window.location.href =
      "shop.html?search=" + encodeURIComponent(query);

  }

  /* ==========================
   LIVE SEARCH SUGGESTIONS
========================== */

function showSuggestions(value) {

  if (!results) return;

  const q = value.trim().toLowerCase();

  if (!q) {
    results.innerHTML = "";
    results.style.display = "none";
    return;
  }

  const matches = heroSuggestions.filter(item =>
    item.toLowerCase().includes(q)
  ).slice(0,6);

  if (!matches.length) {
    results.innerHTML = "";
    results.style.display = "none";
    return;
  }

  results.innerHTML = matches.map(item => `
    <div class="heroSuggestion">${item}</div>
  `).join("");

  results.style.display = "block";

}

input.addEventListener("input", () => {
  showSuggestions(input.value);
});

results.addEventListener("click",(e)=>{

  const item = e.target.closest(".heroSuggestion");

  if(!item) return;

  input.value=item.textContent;

  runSearch();

});

document.addEventListener("click",(e)=>{

  if(!e.target.closest(".heroSearch")){
      results.style.display="none";
  }

});

  button.addEventListener("click", runSearch);

  input.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }

  });

})();
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
      if (!paused && !touchActive) next();
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
    pointerStartY = e.clientY;
    isTouchDragging = false;
    if (e.pointerType === "touch") touchActive = true; // pause autoplay while finger is down
  });
  slider.addEventListener("pointermove", (e) => {
    if (pointerStartX === null) return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    // Only flag as a real horizontal drag once movement is deliberate and horizontal-dominant.
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) isTouchDragging = true;
  });
  slider.addEventListener("pointerup", (e) => {
    if (pointerStartX === null || isInteractiveTarget(e.target) || !e.isPrimary) {
      pointerStartX = null;
      pointerStartY = null;
      touchActive = false;
      return;
    }
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    // Ignore accidental / vertical-dominant movement so page scroll stays natural.
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev();
      if (dx < 0) next();
    }
    pointerStartX = null;
    pointerStartY = null;
    touchActive = false;
  });
  slider.addEventListener("pointercancel", () => {
    pointerStartX = null;
    pointerStartY = null;
    touchActive = false;
  });
  // Suppress the click a swipe would otherwise fire on links/buttons underneath it.
  slider.addEventListener("click", (e) => {
    if (isTouchDragging) {
      e.preventDefault();
      e.stopPropagation();
      isTouchDragging = false;
    }
  }, true);

  if (heroWhatsApp && window.makeWhatsAppLink) {
    heroWhatsApp.href = window.makeWhatsAppLink("Hi R-Tech Gear, I need help choosing a product.");
  }

 window.addEventListener("resize", applySlideBackgrounds);

 applySlideBackgrounds();

 /* ==================================================
   START PROMO SLIDERS
   Every .promoSlider manages itself independently.
 ================================================== */
 document.querySelectorAll(".promoSlider").forEach(initPromoSlider);

 setActive(0);
 start();

})();
