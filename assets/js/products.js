/* products.js
   CSV-driven product rendering for home + shop pages.
*/

(function () {
  /* DOM TARGET MAP (Home + Shop)
     Home:
       - #featuredGrid
       - #dealsGrid
       - #flashSaleTrack
       - #trendingTrack / #trendingDots
       - #audioGrid
       - #smartwatchGrid
       - #dealTimer
     Shop:
       - #shopGrid
  */
  const JSON_PATH = "assets/data/products.json";
  const DEFAULT_CURRENCY = "KES";
  const FLASH_GALLERY_IMAGES = [
    "assets/img/gallary/power and phone.jpg",
    "assets/img/gallary/power and phone 2.jpg",
    "assets/img/gallary/promo smartwatch and sound.jpg",
    "assets/img/gallary/smart watch and sound.jpg",
    "assets/img/gallary/smart watch (2).jpg",
    "assets/img/gallary/sound.jpg"
  ];
  const FLASH_AD_GALLERY = [
    "assets/img/gallary/promo smartwatch and sound.jpg",
    "assets/img/gallary/smart watch and sound.jpg",
    "assets/img/gallary/power and phone 2.jpg",
    "assets/img/gallary/sound.jpg"
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fixText(value) {
    if (!value) return "";
    return String(value)
      .replace(/\s+/g, " ")
      .replace(/â€™|â€˜/g, "'")
      .replace(/â€œ|â€/g, '"')
      .replace(/â€“|â€”/g, "-")
      .replace(/â€¢/g, "*")
      .replace(/Â°/g, "deg")
      .replace(/Â/g, "")
      .trim();
  }

  function cleanUrl(value) {
    if (!value) return "";
    const str = String(value);
    const match = str.match(/https?:\/\/[^\s]+?(?=https?:\/\/|$)/);
    return match ? match[0] : str;
  }

  function normalizeProducts(list) {
    return (list || []).map((item) => {
      const name = fixText(item.name || "");
      const id = (item.id || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);
      const images = Array.isArray(item.images) ? item.images.map(cleanUrl).filter(Boolean) : [];
      const price = Number(item.price_ksh || item.price || 0);
      const compareAt = Number(item.compare_at_ksh || 0);
      return {
        id,
        name,
        desc: fixText(item.description || item.desc || ""),
        price,
        compareAt,
        currency: DEFAULT_CURRENCY,
        image: images[0] || "",
        images,
        tags: item.tags || [],
        flags: item.flags || []
      };
    }).filter((p) => p.name);
  }

  function ratingFor(id) {
    let sum = 0;
    for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
    const base = 4.2 + (sum % 9) / 10;
    const rating = Math.min(5, Math.round(base * 10) / 10);
    const reviews = 20 + (sum % 180);
    return { rating, reviews };
  }

  function shorten(text, n) {
    if (!text) return "";
    return text.length > n ? `${text.slice(0, n - 1)}...` : text;
  }

  function formatPrice(value, currency) {
    const num = Number.isFinite(value) ? value : 0;
    const display = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    const cur = currency || DEFAULT_CURRENCY;
    return `${cur} ${display}`;
  }

  function productUrl(p) {
    return `product.html?id=${encodeURIComponent(p.id)}`;
  }

  // Full product card used in featured/shop/deals grids.
  function productCard(p) {
    const r = ratingFor(p.id);
    const safeName = escapeHtml(p.name);
    const safeDesc = escapeHtml(shorten(p.desc, 90));
    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='100%25' height='100%25' fill='%23eef2ff'/%3E%3Ccircle cx='50%25' cy='45%25' r='80' fill='%23dbeafe'/%3E%3Crect x='35%25' y='60%25' width='30%25' height='10%25' rx='8' fill='%23c7d2fe'/%3E%3C/svg%3E";
    const imageUrl = p.image || placeholder;
    const img = `style="background-image:url('${imageUrl}')"`; 
    const discount = p.compareAt && p.compareAt > p.price
      ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
      : 0;
    const badge = discount ? `<span class="dealBadge">${discount}% off</span>` : "";

    const url = productUrl(p);
    return `
      <article class="card productCard" data-product-url="${url}">
        <div class="productThumbWrap">
          <a class="productThumbLink" href="${url}" aria-label="View ${safeName}">
            <div class="productThumb" ${img}></div>
          </a>
          ${badge}
          <button class="wishlistToggle" type="button"
            data-wishlist-id="${p.id}"
            data-wishlist-name="${safeName.replace(/"/g, "&quot;")}"
            data-wishlist-price="${p.price}"
            data-wishlist-currency="${p.currency}"
            data-wishlist-image="${p.image}">
            ♥
          </button>
        </div>
        <div class="productMeta">
          <a class="productName productNameLink" href="${url}">${safeName}</a>
          <div class="productRating">
            <span class="ratingBadge">${r.rating}</span>
            <span class="ratingCount">${r.reviews} reviews</span>
          </div>
          <div class="productDesc muted small">${safeDesc}</div>
          <div class="productBottom">
            <div class="productPriceStack">
              <div class="price">${formatPrice(p.price, p.currency)}</div>
            </div>
            <button class="btn btnGhost" type="button"
              onclick="addToCart({ id:'${p.id}', name:'${safeName.replace(/'/g, "&apos;")}', price:${p.price}, currency:'${p.currency}', image:'${p.image}' })">
              Add to cart
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // Compact card used in horizontal tracks (trending/flash sale).
  function productCardCompact(p) {
    const r = ratingFor(p.id);
    const safeName = escapeHtml(p.name);
    const safeDesc = escapeHtml(shorten(p.desc, 60));
    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='100%25' height='100%25' fill='%23eef2ff'/%3E%3Ccircle cx='50%25' cy='45%25' r='80' fill='%23dbeafe'/%3E%3Crect x='35%25' y='60%25' width='30%25' height='10%25' rx='8' fill='%23c7d2fe'/%3E%3C/svg%3E";
    const imageUrl = p.image || placeholder;
    const img = `style="background-image:url('${imageUrl}')"`; 
    const discount = p.compareAt && p.compareAt > p.price
      ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
      : 0;
    const badge = discount ? `<span class="dealBadge">${discount}% off</span>` : "";
    const url = productUrl(p);
    return `
      <article class="card productCard compact" data-product-url="${url}">
        <div class="productThumbWrap">
          <a class="productThumbLink" href="${url}" aria-label="View ${safeName}">
            <div class="productThumb" ${img}></div>
          </a>
          ${badge}
          <button class="wishlistToggle" type="button"
            data-wishlist-id="${p.id}"
            data-wishlist-name="${safeName.replace(/"/g, "&quot;")}"
            data-wishlist-price="${p.price}"
            data-wishlist-currency="${p.currency}"
            data-wishlist-image="${p.image}">
            ♥
          </button>
        </div>
        <div class="productMeta">
          <a class="productName productNameLink" href="${url}">${safeName}</a>
          <div class="productRating">
            <span class="ratingBadge">${r.rating}</span>
            <span class="ratingCount">${r.reviews} reviews</span>
          </div>
          <div class="productDesc muted small">${safeDesc}</div>
          <div class="productBottom">
            <div class="productPriceStack">
              <div class="price">${formatPrice(p.price, p.currency)}</div>
            </div>
            <button class="btn btnGhost" type="button"
              onclick="addToCart({ id:'${p.id}', name:'${safeName.replace(/'/g, "&apos;")}', price:${p.price}, currency:'${p.currency}', image:'${p.image}' })">
              Add to cart
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // Flash sale countdown UI boxes injected into flash sale cards.
  function flashTimerMarkup(seed) {
    const base = Number(seed || 0);
    const days = 2 + (base % 5);
    const hours = 8 + (base % 12);
    const mins = 20 + (base % 35);
    const secs = 10 + (base % 49);
    const pad = (n) => String(n).padStart(2, "0");
    return `
      <div class="flashSaleTimer" data-flash-seed="${base}">
        <span class="flashSaleTimerBox"><span class="flashSaleTimerNum">${pad(days)}</span><span class="flashSaleTimerLbl">Days</span></span>
        <span class="flashSaleTimerBox"><span class="flashSaleTimerNum">${pad(hours)}</span><span class="flashSaleTimerLbl">Hrs</span></span>
        <span class="flashSaleTimerBox"><span class="flashSaleTimerNum">${pad(mins)}</span><span class="flashSaleTimerLbl">Mins</span></span>
        <span class="flashSaleTimerBox"><span class="flashSaleTimerNum">${pad(secs)}</span><span class="flashSaleTimerLbl">Secs</span></span>
      </div>
    `;
  }

  function flashSaleCard(p, idx) {
    const card = productCardCompact(p);
    return card.replace('<div class="productMeta">', `<div class="productMeta">${flashTimerMarkup(idx + 1)}`);
  }

  function startFlashTimers(root) {
    if (!root || root.dataset.flashTimersBound === "1") return;
    root.dataset.flashTimersBound = "1";
    root.querySelectorAll(".flashSaleTimer").forEach((el) => {
      const seed = Number(el.getAttribute("data-flash-seed") || "1");
      let total = (2 + (seed % 5)) * 86400 + (8 + (seed % 12)) * 3600 + (20 + (seed % 35)) * 60 + (10 + (seed % 49));
      const nums = el.querySelectorAll(".flashSaleTimerNum");
      function tick() {
        total = total > 0 ? total - 1 : 0;
        const d = Math.floor(total / 86400);
        const h = Math.floor((total % 86400) / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        const vals = [d, h, m, s].map((n) => String(n).padStart(2, "0"));
        nums.forEach((n, i) => { if (vals[i] !== undefined) n.textContent = vals[i]; });
      }
      tick();
      setInterval(tick, 1000);
    });
  }

  // Continuous back-and-forth movement for flash sale product lane.
  function startFlashMotion(track, prevBtn, nextBtn) {
    if (!track || track.dataset.flashMotionBound === "1") return;
    track.dataset.flashMotionBound = "1";
    let dir = 1;
    let paused = false;
    const step = 1.2;
    const tickMs = 16;

    function advance() {
      if (paused) return;
      track.scrollLeft += step * dir;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      if (track.scrollLeft >= max - 2) dir = -1;
      if (track.scrollLeft <= 2) dir = 1;
    }

    const timer = setInterval(advance, tickMs);
    track.addEventListener("mouseenter", () => { paused = true; });
    track.addEventListener("mouseleave", () => { paused = false; });
    track.addEventListener("pointerdown", () => { paused = true; });
    track.addEventListener("pointerup", () => { paused = false; });
    track.addEventListener("pointercancel", () => { paused = false; });

    if (prevBtn) prevBtn.addEventListener("click", () => {
      dir = -1;
      track.scrollBy({ left: -340, behavior: "smooth" });
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
      dir = 1;
      track.scrollBy({ left: 340, behavior: "smooth" });
    });

    track.addEventListener("remove", () => clearInterval(timer));
  }

  function renderInto(el, products, limit) {
    if (!el) return;
    const list = limit ? products.slice(0, limit) : products;
    el.innerHTML = list.map(productCard).join("");
    wireProductCardNavigation(el);
  }

  function wireProductCardNavigation(root) {
    if (!root) return;
    root.querySelectorAll(".productCard[data-product-url]").forEach((card) => {
      if (card.dataset.navBound === "1") return;
      card.dataset.navBound = "1";
      card.addEventListener("click", (e) => {
        if (e.target.closest("button, a, input, select, textarea")) return;
        const url = card.getAttribute("data-product-url");
        if (url) window.location.href = url;
      });
    });
  }

  function filterByTag(products, keyword) {
    const key = keyword.toLowerCase();
    return products.filter((p) =>
      (p.tags || []).some((t) => String(t).toLowerCase().includes(key))
    );
  }

  function uniqueByKey(products) {
    const seen = new Set();
    return products.filter((p) => {
      const key = `${p.name}|${p.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function dealTimer(el) {
    if (!el) return;
    let seconds = 5 * 3600 + 12 * 60 + 33;
    setInterval(() => {
      seconds = seconds > 0 ? seconds - 1 : 0;
      const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  function initFlashSaleAd() {
    const ad = document.getElementById("flashSaleAd");
    const title = document.getElementById("flashSaleAdTitle");
    if (!ad) return;

    // Force gallery-only visuals so this section does not repeat hero promo images.
    let i = 0;
    const apply = () => {
      const img = FLASH_AD_GALLERY[i % FLASH_AD_GALLERY.length];
      ad.style.backgroundImage = `url('${img}')`;
      if (title) title.textContent = i % 2 === 0 ? "Black Friday Picks" : "Flash Sale Picks";
      i += 1;
    };

    apply();
    setInterval(apply, 5000);
  }

  // Page boot: render all product-driven sections if containers exist.
  async function init() {
    const featuredEl = document.getElementById("featuredGrid");
    const shopEl = document.getElementById("shopGrid");
    if (!featuredEl && !shopEl) return;

    try {
      const res = await fetch(JSON_PATH);
      const json = await res.json();
      const products = normalizeProducts(json);

      if (featuredEl) renderInto(featuredEl, products, 6);
      if (shopEl) renderInto(shopEl, products, 0);
      initFlashSaleAd();

      const dealsEl = document.getElementById("dealsGrid");
      const flashSaleTrack = document.getElementById("flashSaleTrack");
      const flashSalePrev = document.getElementById("flashSalePrev");
      const flashSaleNext = document.getElementById("flashSaleNext");
      const trendingTrack = document.getElementById("trendingTrack");
      const trendingDots = document.getElementById("trendingDots");
      const audioEl = document.getElementById("audioGrid");
      const smartwatchEl = document.getElementById("smartwatchGrid");
      const timerEl = document.getElementById("dealTimer");

      if (dealsEl) {
        const deals = products.filter((p) => p.compareAt && p.compareAt > p.price);
        const dedupedDeals = uniqueByKey(deals.length ? deals : products);
        renderInto(dealsEl, dedupedDeals, 6);
      }
      if (flashSaleTrack) {
        const deals = products.filter((p) => p.compareAt && p.compareAt > p.price);
        const base = uniqueByKey(deals.length ? deals : products);
        const list = base.slice(0, 10).map((p, i) => ({
          ...p,
          // Rotate local gallery images to avoid repeated flash visuals.
          image: FLASH_GALLERY_IMAGES[i % FLASH_GALLERY_IMAGES.length] || p.image
        }));
        flashSaleTrack.innerHTML = list.map((p, i) => flashSaleCard(p, i)).join("");
        wireProductCardNavigation(flashSaleTrack);
        startFlashTimers(flashSaleTrack);
        startFlashMotion(flashSaleTrack, flashSalePrev, flashSaleNext);
      }
      if (trendingTrack) {
        const phones = uniqueByKey(filterByTag(products, "phone"));
        const list = phones.length ? phones : uniqueByKey(products);
        trendingTrack.innerHTML = list.map(productCardCompact).join("");
        wireProductCardNavigation(trendingTrack);

        if (trendingDots) {
          const pages = Math.ceil(list.length / 2);
          trendingDots.innerHTML = "";
          for (let i = 0; i < pages; i += 1) {
            const dot = document.createElement("button");
            dot.className = "carouselDot" + (i === 0 ? " isActive" : "");
            dot.addEventListener("click", () => {
              const offset = trendingTrack.clientWidth * i;
              trendingTrack.scrollTo({ left: offset, behavior: "smooth" });
            });
            trendingDots.appendChild(dot);
          }
        }
      }
      if (audioEl) {
        const audio = filterByTag(products, "audio");
        renderInto(audioEl, audio.length ? audio : products, 4);
      }
      if (smartwatchEl) {
        const watches = filterByTag(products, "watch");
        renderInto(smartwatchEl, watches.length ? watches : products, 4);
      }
      dealTimer(timerEl);
    } catch (err) {
      console.error("Failed to load products JSON", err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

