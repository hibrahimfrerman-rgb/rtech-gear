/* flash-sale.js
   Dedicated flash-sale logic for:
   - home flash-sale lane (#flashSaleTrack)
   - dedicated page (flash-sale.html)
*/
(function () {
  const FLASH_DATA_PATH = "assets/data/flash-sales.json";
  const FLASH_MEDIA_PATH = "assets/data/flash-sale-images.json";
  // Easy timer control: change this single value.
  const FLASH_TIMER_HOURS = 24;
  const DEFAULT_HERO_ROTATION_IMAGES = [
    "assets/img/products/flash-sale/flash-power-phone-01.jpg",
    "assets/img/products/flash-sale/flash-smartwatch-02.jpg",
    "assets/img/products/flash-sale/flash-smartwatch-sound-01.jpg"
  ];
  let heroRotationImages = DEFAULT_HERO_ROTATION_IMAGES.slice();
  const HERO_ROTATION_TITLES = [
    "Power Deals Live Now",
    "Wearables Flash Drop",
    "Audio + Watch Combo Sale"
  ];

  window.__flashSaleManaged = true;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(value, currency) {
    const amount = Number(value || 0);
    const cur = currency || "KES";
    return `${cur} ${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
  }

  function discountPercent(item) {
    const now = Number(item.price || 0);
    const old = Number(item.compareAt || 0);
    if (!old || old <= now) return 0;
    return Math.round(((old - now) / old) * 100);
  }

  function parseFlashItem(item, idx) {
    const remaining = Math.max(12, 40 - (idx * 3 % 22));
    const safe = {
      id: item.id || `flash-${idx + 1}`,
      name: item.name || `Flash item ${idx + 1}`,
      description: item.description || "",
      price: Number(item.price || 0),
      compareAt: Number(item.compareAt || 0),
      currency: item.currency || "KES",
      image: item.image || "",
      category: (item.category || "other").toLowerCase(),
      deliverySpeed: (item.deliverySpeed || "standard").toLowerCase(),
      endsAt: item.endsAt || "",
      timerSeconds: Math.max(1800, FLASH_TIMER_HOURS * 3600 - (idx * 777)),
      remainingPct: remaining
    };
    safe.discount = discountPercent(safe);
    return safe;
  }

  function applyMediaConfig(list, media) {
    const heroFromFile = media && Array.isArray(media.heroImages) ? media.heroImages.filter(Boolean) : [];
    if (heroFromFile.length) heroRotationImages = heroFromFile.slice(0, 3);
    const productMap = media && media.productImages ? media.productImages : {};
    return list.map((item) => ({
      ...item,
      image: productMap[item.id] || item.image
    }));
  }

  function toTimeParts(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [d, h, m, s].map((n) => String(n).padStart(2, "0"));
  }

  function countdownMarkup(seconds) {
    return `
      <div class="flashTimer" data-seconds="${Number(seconds || 0)}">
        <span class="flashTimerBox"><span class="flashTimerNum">00</span><span class="flashTimerLbl">Days</span></span>
        <span class="flashTimerBox"><span class="flashTimerNum">00</span><span class="flashTimerLbl">Hrs</span></span>
        <span class="flashTimerBox"><span class="flashTimerNum">00</span><span class="flashTimerLbl">Mins</span></span>
        <span class="flashTimerBox"><span class="flashTimerNum">00</span><span class="flashTimerLbl">Secs</span></span>
      </div>
    `;
  }

  function cartPayload(item) {
    const esc = (v) => String(v || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `{ id:'${esc(item.id)}', name:'${esc(item.name)}', price:${item.price}, currency:'${esc(item.currency)}', image:'${esc(item.image)}' }`;
  }

  function flashCard(item) {
    const safeName = escapeHtml(item.name);
    const safeDesc = escapeHtml(item.description);
    const discount = item.discount > 0 ? `<span class="dealBadge">${item.discount}% off</span>` : "";
    const compareAt = item.compareAt > item.price ? `<div class="priceCompare">${formatPrice(item.compareAt, item.currency)}</div>` : "";
    const payload = cartPayload(item);
    const targetUrl = `product.html?id=${encodeURIComponent(item.id)}`;
    const remaining = Math.max(1, Math.min(100, Math.round(Number(item.remainingPct || 0))));
    return `
      <article class="card productCard flashCard" data-category="${escapeHtml(item.category)}" data-delivery="${escapeHtml(item.deliverySpeed)}" data-price="${item.price}" data-product-url="${targetUrl}">
        <div class="productThumbWrap">
          <a class="productThumbLink" href="${targetUrl}" aria-label="View ${safeName}">
            <div class="productThumb" style="background-image:url('${escapeHtml(item.image)}')"></div>
          </a>
          ${discount}
        </div>
        <div class="productMeta">
          ${countdownMarkup(item.timerSeconds)}
          <a class="productName productNameLink flashTitleHover" href="${targetUrl}">${safeName}</a>
          <div class="productDesc muted small">${safeDesc}</div>
          <div class="flashRemaining">Only ${remaining}% left</div>
          <div class="flashRemainingBar"><span style="width:${remaining}%"></span></div>
          <div class="productBottom">
            <div class="productPriceStack">
              ${compareAt}
              <div class="price">${formatPrice(item.price, item.currency)}</div>
            </div>
            <button class="btn btnPrimary flashAddBtn" type="button" onclick="addToCart(${payload})">Add to cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function wireFlashCardNavigation(root) {
    if (!root) return;
    root.querySelectorAll(".flashCard[data-product-url]").forEach((card) => {
      if (card.dataset.navBound === "1") return;
      card.dataset.navBound = "1";
      card.addEventListener("click", (e) => {
        if (e.target.closest("button, a, input, select, textarea")) return;
        const url = card.getAttribute("data-product-url");
        if (url) window.location.href = url;
      });
    });
  }

  function startTimers(root) {
    if (!root) return;
    root.querySelectorAll(".flashTimer").forEach((timer) => {
      if (timer.dataset.bound === "1") return;
      timer.dataset.bound = "1";
      let total = Number(timer.getAttribute("data-seconds") || "0");
      const nums = timer.querySelectorAll(".flashTimerNum");
      function tick() {
        total = total > 0 ? total - 1 : 0;
        const parts = toTimeParts(total * 1000);
        nums.forEach((el, i) => { if (parts[i] != null) el.textContent = parts[i]; });
      }
      tick();
      setInterval(tick, 1000);
    });
  }

  function startSlowAutoplay(track) {
    if (!track || track.dataset.autoBound === "1") return;
    track.dataset.autoBound = "1";
    let paused = false;
    let direction = 1;
    const step = 0.45; // intentionally slow
    const tickMs = 22;

    const id = setInterval(() => {
      if (paused) return;
      track.scrollLeft += step * direction;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      if (track.scrollLeft >= max - 2) direction = -1;
      if (track.scrollLeft <= 2) direction = 1;
    }, tickMs);

    track.addEventListener("mouseenter", () => { paused = true; });
    track.addEventListener("mouseleave", () => { paused = false; });
    track.addEventListener("pointerdown", () => { paused = true; });
    track.addEventListener("pointerup", () => { paused = false; });
    track.addEventListener("pointercancel", () => { paused = false; });
    track.addEventListener("remove", () => clearInterval(id));
  }

  function startHeroRotation(heroEl, titleEl) {
    if (!heroEl || heroEl.dataset.heroBound === "1") return;
    heroEl.dataset.heroBound = "1";
    let idx = 0;
    let paused = false;

    const render = () => {
      heroEl.style.backgroundImage = `url('${heroRotationImages[idx]}')`;
      if (titleEl) titleEl.textContent = HERO_ROTATION_TITLES[idx] || "Flash Sale";
    };

    render();
    setInterval(() => {
      if (paused) return;
      idx = (idx + 1) % heroRotationImages.length;
      render();
    }, 7000);

    heroEl.addEventListener("mouseenter", () => { paused = true; });
    heroEl.addEventListener("mouseleave", () => { paused = false; });
  }

  function homeInit(list) {
    const track = document.getElementById("flashSaleTrack");
    const ad = document.getElementById("flashSaleAd");
    const adTitle = document.getElementById("flashSaleAdTitle");
    const prev = document.getElementById("flashSalePrev");
    const next = document.getElementById("flashSaleNext");
    if (!track && !ad) return;

    if (track) {
      const top = list.slice(0, 10);
      track.innerHTML = top.map(flashCard).join("");
      wireFlashCardNavigation(track);
      startTimers(track);
      startSlowAutoplay(track);
      if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -340, behavior: "smooth" }));
      if (next) next.addEventListener("click", () => track.scrollBy({ left: 340, behavior: "smooth" }));
    }

    startHeroRotation(ad, adTitle);
  }

  function flashPageInit(list) {
    const page = document.getElementById("flashSalePage");
    if (!page) return;

    const hero = document.getElementById("flashSaleHero");
    const heroTitle = document.getElementById("flashSaleHeroTitle");
    const grid = document.getElementById("flashSaleGrid");
    const empty = document.getElementById("flashSaleEmpty");
    const categorySel = document.getElementById("flashFilterCategory");
    const priceSel = document.getElementById("flashFilterPrice");
    const deliverySel = document.getElementById("flashFilterDelivery");

    if (!grid) return;

    const categories = Array.from(new Set(list.map((x) => x.category))).sort();
    if (categorySel) {
      categorySel.innerHTML = `<option value="all">All categories</option>` + categories
        .map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
        .join("");
    }

    function applyFilters() {
      const category = categorySel ? categorySel.value : "all";
      const price = priceSel ? priceSel.value : "all";
      const delivery = deliverySel ? deliverySel.value : "all";

      const filtered = list.filter((item) => {
        const catOk = category === "all" || item.category === category;
        const deliveryOk = delivery === "all" || item.deliverySpeed === delivery;
        let priceOk = true;
        if (price === "under-3000") priceOk = item.price < 3000;
        if (price === "3000-7000") priceOk = item.price >= 3000 && item.price <= 7000;
        if (price === "7000-plus") priceOk = item.price > 7000;
        return catOk && deliveryOk && priceOk;
      });

      grid.innerHTML = filtered.map(flashCard).join("");
      wireFlashCardNavigation(grid);
      startTimers(grid);
      if (empty) empty.hidden = filtered.length > 0;
    }

    if (categorySel) categorySel.addEventListener("change", applyFilters);
    if (priceSel) priceSel.addEventListener("change", applyFilters);
    if (deliverySel) deliverySel.addEventListener("change", applyFilters);

    startHeroRotation(hero, heroTitle);
    applyFilters();
  }

  function init() {
    Promise.all([
      fetch(FLASH_DATA_PATH).then((res) => res.json()),
      fetch(FLASH_MEDIA_PATH).then((res) => res.json()).catch(() => ({}))
    ])
      .then(([json, media]) => applyMediaConfig((json || []).map(parseFlashItem), media))
      .then((list) => {
        homeInit(list);
        flashPageInit(list);
      })
      .catch((err) => {
        console.error("Flash sale data load failed", err);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
