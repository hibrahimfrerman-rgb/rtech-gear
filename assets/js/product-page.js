/* product-page.js
   Single product view with gallery + quick purchase actions.
*/
(function () {
  const JSON_PATH = "assets/data/products.json";
  const FLASH_JSON_PATH = "assets/data/flash-sales.json";
  const DEFAULT_CURRENCY = "KES";

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "")
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
      return {
        id,
        name,
        desc: fixText(item.description || item.desc || ""),
        price: Number(item.price_ksh || item.price || 0),
        compareAt: Number(item.compare_at_ksh || 0),
        currency: DEFAULT_CURRENCY,
        image: images[0] || "",
        images,
        tags: item.tags || []
      };
    }).filter((p) => p.name);
  }

  function normalizeFlashProducts(list) {
    return (list || []).map((item) => {
      const name = fixText(item.name || "");
      const id = (item.id || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);
      const image = cleanUrl(item.image || "");
      return {
        id,
        name,
        desc: fixText(item.description || item.desc || ""),
        price: Number(item.price || 0),
        compareAt: Number(item.compareAt || item.compare_at_ksh || 0),
        currency: item.currency || DEFAULT_CURRENCY,
        image,
        images: image ? [image] : [],
        tags: ["Flash Sale", fixText(item.category || "Deals")]
      };
    }).filter((p) => p.name);
  }

  function ratingFor(id) {
    let sum = 0;
    for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
    const base = 4.2 + (sum % 9) / 10;
    return { rating: Math.min(5, Math.round(base * 10) / 10), reviews: 20 + (sum % 180) };
  }

  function money(v, cur) {
    const n = Number.isFinite(v) ? v : 0;
    return `${cur || DEFAULT_CURRENCY} ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
  }

  function productUrl(id) {
    return `product.html?id=${encodeURIComponent(id)}`;
  }

  function queryProductId() {
    const p = new URLSearchParams(window.location.search);
    return (p.get("id") || "").trim().toLowerCase();
  }

  function setMainImage(url) {
    const media = byId("productMedia");
    if (!media) return;
    if (!url) {
      media.style.backgroundImage = "";
      return;
    }
    media.style.backgroundImage = `url('${url}')`;
  }

  function bindTabs() {
    const tabs = Array.from(document.querySelectorAll(".tab[data-tab]"));
    const bodies = Array.from(document.querySelectorAll(".tabPane"));
    if (!tabs.length || !bodies.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.toggle("isActive", t === tab); });
        bodies.forEach(function (pane) {
          pane.hidden = pane.id !== target;
        });
      });
    });
  }

  function renderRelated(current, list) {
    const grid = byId("relatedGrid");
    if (!grid) return;
    const related = list.filter(function (p) { return p.id !== current.id; }).slice(0, 4);
    grid.innerHTML = related.map(function (p) {
      const safeName = escapeHtml(p.name);
      const safeDesc = escapeHtml((p.desc || "").slice(0, 82));
      const imageUrl = p.image || "";
      const img = `style="background-image:url('${imageUrl}')"`; 
      const r = ratingFor(p.id);
      return `
        <article class="card productCard">
          <a class="productThumbLink" href="${productUrl(p.id)}" aria-label="View ${safeName}">
            <div class="productThumb" ${img}></div>
          </a>
          <div class="productMeta">
            <a class="productName productNameLink" href="${productUrl(p.id)}">${safeName}</a>
            <div class="productRating">
              <span class="ratingBadge">${r.rating}</span>
              <span class="ratingCount">${r.reviews} reviews</span>
            </div>
            <div class="productDesc muted small">${safeDesc}</div>
            <div class="productBottom">
              <div class="price">${money(p.price, p.currency)}</div>
              <button class="btn btnGhost js-related-add" type="button" data-id="${p.id}">Add to cart</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    grid.querySelectorAll(".js-related-add").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-id");
        const p = list.find(function (x) { return x.id === id; });
        if (!p || typeof window.addToCart !== "function") return;
        window.addToCart({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          image: p.image
        });
      });
    });
  }

  async function init() {
    const host = byId("productPage");
    if (!host) return;

    try {
      const [resMain, resFlash] = await Promise.all([
        fetch(JSON_PATH),
        fetch(FLASH_JSON_PATH).catch(() => null)
      ]);
      const jsonMain = await resMain.json();
      const mainProducts = normalizeProducts(jsonMain);

      let flashProducts = [];
      if (resFlash && resFlash.ok) {
        const jsonFlash = await resFlash.json();
        flashProducts = normalizeFlashProducts(jsonFlash);
      }

      const allProducts = [...mainProducts];
      flashProducts.forEach(function (fp) {
        if (!allProducts.some(function (p) { return p.id === fp.id; })) {
          allProducts.push(fp);
        }
      });
      if (!allProducts.length) return;

      const qid = queryProductId();
      const product = allProducts.find(function (p) { return p.id === qid; }) || allProducts[0];
      const rating = ratingFor(product.id);
      const thumbs = byId("thumbRow");
      const images = product.images.length ? product.images : [product.image];
      let qty = 1;

      document.title = `${product.name} - R-Tech Gear`;
      byId("crumbProductName").textContent = product.name;
      byId("productKicker").textContent = (product.tags[0] || "Product").toUpperCase();
      byId("productTitle").textContent = product.name;
      byId("ratingStars").textContent = `${rating.rating} *`;
      byId("ratingMeta").textContent = `${rating.reviews} reviews`;
      byId("priceNow").textContent = money(product.price, product.currency);
      byId("priceWas").textContent = product.compareAt > product.price ? money(product.compareAt, product.currency) : "";
      byId("priceOff").textContent = product.compareAt > product.price
        ? `${Math.round(((product.compareAt - product.price) / product.compareAt) * 100)}% off`
        : "";
      byId("productDesc").textContent = product.desc || "No description available.";
      byId("skuValue").textContent = product.id;
      byId("tagsValue").textContent = (product.tags || []).join(", ") || "General";
      byId("tabDescriptionText").textContent = product.desc || "No description available.";
      byId("tabAdditionalText").textContent = `SKU: ${product.id} | Category: ${(product.tags || []).join(", ") || "General"}`;

      setMainImage(images[0] || "");
      if (thumbs) {
        thumbs.innerHTML = images.slice(0, 6).map(function (img, i) {
          return `<button class="thumb${i === 0 ? " isActive" : ""}" type="button" style="background-image:url('${img}')"></button>`;
        }).join("");
        const thumbEls = Array.from(thumbs.querySelectorAll(".thumb"));
        thumbEls.forEach(function (thumb, i) {
          thumb.style.backgroundSize = "cover";
          thumb.style.backgroundPosition = "center";
          thumb.addEventListener("click", function () {
            thumbEls.forEach(function (x) { x.classList.remove("isActive"); });
            thumb.classList.add("isActive");
            setMainImage(images[i] || "");
          });
        });
      }

      function addCurrentProduct(amount, openCheckout) {
        if (typeof window.addToCart !== "function") return;
        if (amount <= 0) return;
        window.addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.image
        });
        for (let i = 1; i < amount; i += 1) {
          if (typeof window.addOne === "function") window.addOne(product.id);
        }
        if (openCheckout) window.location.href = "checkout.html";
      }

      const qtyVal = byId("qtyValue");
      const minus = byId("qtyMinus");
      const plus = byId("qtyPlus");
      const add = byId("addToCartBtn");
      const buyNow = byId("buyNowBtn");

      if (qtyVal) qtyVal.textContent = String(qty);
      if (minus) minus.addEventListener("click", function () {
        qty = Math.max(1, qty - 1);
        if (qtyVal) qtyVal.textContent = String(qty);
      });
      if (plus) plus.addEventListener("click", function () {
        qty += 1;
        if (qtyVal) qtyVal.textContent = String(qty);
      });
      if (add) add.addEventListener("click", function () { addCurrentProduct(qty, false); });
      if (buyNow) buyNow.addEventListener("click", function () { addCurrentProduct(qty, true); });

      const wishBtn = byId("wishlistBtn");
      if (wishBtn && typeof window.toggleWishlist === "function") {
        wishBtn.addEventListener("click", function () {
          window.toggleWishlist({
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.image
          });
        });
      }

      bindTabs();
      renderRelated(product, allProducts);
    } catch (err) {
      console.error("Failed to load product page", err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
