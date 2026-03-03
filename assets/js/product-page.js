/* product-page.js
   Single product view with gallery, variant selection, and purchase actions.
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
      .replace(/Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ/g, "'")
      .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"')
      .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
      .replace(/Ã¢â‚¬Â¢/g, "*")
      .replace(/Ã‚Â°/g, "deg")
      .replace(/Ã‚/g, "")
      .trim();
  }

  function cleanUrl(value) {
    if (!value) return "";
    const str = String(value);
    const match = str.match(/https?:\/\/[^\s]+?(?=https?:\/\/|$)/);
    return match ? match[0] : str;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function makeShortDescription(value) {
    const text = fixText(value || "");
    if (!text) return "";
    if (text.length <= 180) return text;
    const clipped = text.slice(0, 177).replace(/\s+\S*$/, "");
    return `${clipped}...`;
  }

  function normalizeAttributes(attrs, fallbackLabel) {
    const output = {};
    if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
      Object.keys(attrs).forEach(function (key) {
        const cleanKey = fixText(key);
        const cleanValue = fixText(attrs[key]);
        if (cleanKey && cleanValue) output[cleanKey] = cleanValue;
      });
    }
    if (!Object.keys(output).length && fallbackLabel) {
      output.Option = fixText(fallbackLabel);
    }
    return output;
  }

  function normalizeVariant(item, variant, index) {
    const attrs = normalizeAttributes(variant.attributes, variant.label || variant.name);
    const images = Array.isArray(variant.images) ? variant.images.map(cleanUrl).filter(Boolean) : [];
    const longDesc = fixText(variant.long_description || variant.description || variant.desc || item.long_description || item.description || item.desc || "");
    const shortDesc = fixText(variant.short_description || variant.short_desc || "") || makeShortDescription(longDesc);
    return {
      id: fixText(variant.id) || `${item.id || slugify(item.name)}-variant-${index + 1}`,
      sku: fixText(variant.sku || variant.id || `${item.id || slugify(item.name)}-${index + 1}`),
      label: fixText(variant.label || variant.name || ""),
      desc: longDesc,
      shortDesc: shortDesc,
      price: Number(variant.price_ksh || variant.price || item.price_ksh || item.price || 0),
      compareAt: Number(variant.compare_at_ksh || variant.compareAt || item.compare_at_ksh || 0),
      currency: fixText(variant.currency || item.currency || DEFAULT_CURRENCY) || DEFAULT_CURRENCY,
      image: images[0] || "",
      images,
      attributes: attrs
    };
  }

  function minPrice(list, key) {
    const nums = list
      .map(function (item) { return Number(item[key]); })
      .filter(function (value) { return Number.isFinite(value) && value > 0; });
    return nums.length ? Math.min.apply(null, nums) : 0;
  }

  function maxPrice(list, key) {
    const nums = list
      .map(function (item) { return Number(item[key]); })
      .filter(function (value) { return Number.isFinite(value) && value > 0; });
    return nums.length ? Math.max.apply(null, nums) : 0;
  }

  function normalizeProducts(list) {
    return (list || []).map(function (item) {
      const name = fixText(item.name || "");
      const id = slugify(item.id || name).slice(0, 32);
      const images = Array.isArray(item.images) ? item.images.map(cleanUrl).filter(Boolean) : [];
      const variants = Array.isArray(item.variants)
        ? item.variants.map(function (variant, index) { return normalizeVariant(item, variant, index); })
        : [];
      const productPrice = Number(item.price_ksh || item.price || 0);
      const productCompareAt = Number(item.compare_at_ksh || 0);
      const longDesc = fixText(item.long_description || item.description || item.desc || "");
      const shortDesc = fixText(item.short_description || item.short_desc || "") || makeShortDescription(longDesc);
      const basePrice = variants.length ? minPrice(variants, "price") || productPrice : productPrice;
      const baseCompareAt = variants.length
        ? maxPrice(variants, "compareAt") || productCompareAt
        : productCompareAt;

      return {
        id,
        sku: fixText(item.sku || item.id || id),
        name,
        desc: longDesc,
        shortDesc: shortDesc,
        price: basePrice,
        compareAt: baseCompareAt,
        currency: fixText(item.currency || DEFAULT_CURRENCY) || DEFAULT_CURRENCY,
        image: images[0] || (variants[0] ? variants[0].image : ""),
        images,
        tags: item.tags || [],
        variants: variants
      };
    }).filter(function (p) { return p.name; });
  }

  function normalizeFlashProducts(list) {
    return (list || []).map(function (item) {
      const name = fixText(item.name || "");
      const id = slugify(item.id || name).slice(0, 32);
      const image = cleanUrl(item.image || "");
      return {
        id,
        sku: fixText(item.sku || item.id || id),
        name,
        desc: fixText(item.long_description || item.description || item.desc || ""),
        shortDesc: fixText(item.short_description || item.short_desc || "") || makeShortDescription(item.description || item.desc || ""),
        price: Number(item.price || 0),
        compareAt: Number(item.compareAt || item.compare_at_ksh || 0),
        currency: fixText(item.currency || DEFAULT_CURRENCY) || DEFAULT_CURRENCY,
        image,
        images: image ? [image] : [],
        tags: ["Flash Sale", fixText(item.category || "Deals")],
        variants: []
      };
    }).filter(function (p) { return p.name; });
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

  function queryParams() {
    return new URLSearchParams(window.location.search);
  }

  function queryProductId() {
    return (queryParams().get("id") || "").trim().toLowerCase();
  }

  function queryVariantId() {
    return (queryParams().get("variant") || "").trim().toLowerCase();
  }

  function setMainImage(url) {
    const media = byId("productMedia");
    if (!media) return;
    media.style.backgroundImage = url ? `url('${url}')` : "";
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
              <button class="btn btnGhost js-related-add" type="button" data-id="${p.id}">
                ${p.variants && p.variants.length ? "View options" : "Add to cart"}
              </button>
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
        if (p.variants && p.variants.length) {
          window.location.href = productUrl(p.id);
          return;
        }
        window.addToCart({
          id: p.id,
          sku: p.sku || p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          image: p.image
        });
      });
    });
  }

  function optionGroupsFor(variants) {
    const groups = {};
    (variants || []).forEach(function (variant) {
      Object.keys(variant.attributes || {}).forEach(function (key) {
        groups[key] = groups[key] || [];
        const value = variant.attributes[key];
        if (!groups[key].includes(value)) groups[key].push(value);
      });
    });
    return Object.keys(groups).map(function (key) {
      return { name: key, values: groups[key] };
    });
  }

  function isColorGroup(name) {
    return /colou?r/i.test(String(name || ""));
  }

  function colorSwatch(value) {
    const key = String(value || "").trim().toLowerCase();
    const map = {
      black: "#111827",
      white: "#f8fafc",
      silver: "#cbd5e1",
      gray: "#94a3b8",
      grey: "#94a3b8",
      red: "#ef4444",
      blue: "#2563eb",
      green: "#16a34a",
      pink: "#ec4899",
      gold: "#d4a017",
      rose: "#f43f5e",
      purple: "#7c3aed"
    };
    return map[key] || "#e2e8f0";
  }

  function hasMatchingVariant(variants, selection) {
    return variants.some(function (variant) { return matchesSelection(variant, selection); });
  }

  function matchesSelection(variant, selection) {
    return Object.keys(selection).every(function (key) {
      return !selection[key] || variant.attributes[key] === selection[key];
    });
  }

  function findVariant(variants, selection) {
    const exact = variants.find(function (variant) { return matchesSelection(variant, selection); });
    return exact || variants[0] || null;
  }

  function variantName(product, variant) {
    if (!variant) return product.name;
    const parts = Object.keys(variant.attributes || {}).map(function (key) {
      return variant.attributes[key];
    }).filter(Boolean);
    return parts.length ? `${product.name} - ${parts.join(" / ")}` : product.name;
  }

  function variantImageSet(product, variant) {
    const images = variant && variant.images && variant.images.length ? variant.images : product.images;
    return images && images.length ? images : [product.image].filter(Boolean);
  }

  function buildCartItem(product, variant) {
    const active = variant || product;
    return {
      id: active.id || product.id,
      sku: active.sku || product.sku || product.id,
      name: variantName(product, variant),
      price: active.price || product.price,
      currency: active.currency || product.currency,
      image: active.image || product.image
    };
  }

  function renderThumbs(images, activeIndex, onSelect) {
    const thumbs = byId("thumbRow");
    if (!thumbs) return;
    thumbs.innerHTML = images.slice(0, 6).map(function (img, i) {
      return `<button class="thumb${i === activeIndex ? " isActive" : ""}" type="button" style="background-image:url('${img}')"></button>`;
    }).join("");
    const thumbEls = Array.from(thumbs.querySelectorAll(".thumb"));
    thumbEls.forEach(function (thumb, i) {
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
      thumb.addEventListener("click", function () {
        thumbEls.forEach(function (x) { x.classList.remove("isActive"); });
        thumb.classList.add("isActive");
        onSelect(i);
      });
    });
  }

  async function init() {
    const host = byId("productPage");
    if (!host) return;

    try {
      const [resMain, resFlash] = await Promise.all([
        fetch(JSON_PATH),
        fetch(FLASH_JSON_PATH).catch(function () { return null; })
      ]);
      const jsonMain = await resMain.json();
      const mainProducts = normalizeProducts(jsonMain);

      let flashProducts = [];
      if (resFlash && resFlash.ok) {
        const jsonFlash = await resFlash.json();
        flashProducts = normalizeFlashProducts(jsonFlash);
      }

      const allProducts = [].concat(mainProducts);
      flashProducts.forEach(function (fp) {
        if (!allProducts.some(function (p) { return p.id === fp.id; })) {
          allProducts.push(fp);
        }
      });
      if (!allProducts.length) return;

      const qid = queryProductId();
      const qVariantId = queryVariantId();
      const product = allProducts.find(function (p) { return p.id === qid; }) || allProducts[0];
      const rating = ratingFor(product.id);
      const variantPanel = byId("variantPanel");
      const optionsEl = byId("productOptions");
      const summaryEl = byId("variantSummary");
      const optionGroups = optionGroupsFor(product.variants || []);
      const selection = {};
      const preselectedVariant = (product.variants || []).find(function (variant) {
        return variant.id.toLowerCase() === qVariantId;
      }) || null;
      const initialVariant = preselectedVariant || (product.variants || [])[0] || null;
      let currentVariant = initialVariant;
      let activeImageIndex = 0;
      let qty = 1;

      if (currentVariant) {
        Object.keys(currentVariant.attributes || {}).forEach(function (key) {
          selection[key] = currentVariant.attributes[key];
        });
      }

      document.title = `${product.name} - R-Tech Gear`;
      byId("crumbProductName").textContent = product.name;
      byId("productKicker").textContent = (product.tags[0] || "Product").toUpperCase();
      byId("productTitle").textContent = product.name;
      byId("ratingStars").textContent = `${rating.rating} *`;
      byId("ratingMeta").textContent = `${rating.reviews} reviews`;
      byId("tagsValue").textContent = (product.tags || []).join(", ") || "General";

      function renderVariantOptions() {
        if (!variantPanel || !optionsEl || !summaryEl) return;
        if (!optionGroups.length) {
          variantPanel.hidden = true;
          return;
        }

        variantPanel.hidden = false;
        optionsEl.innerHTML = optionGroups.map(function (group) {
          const currentValue = selection[group.name] || "";
          const buttons = group.values.map(function (value) {
            const nextSelection = Object.assign({}, selection, { [group.name]: value });
            const matching = findVariant(product.variants, nextSelection);
            const available = hasMatchingVariant(product.variants, nextSelection);
            const secondary = matching ? money(matching.price, matching.currency) : "";
            const swatch = isColorGroup(group.name)
              ? `<span class="optionChoiceSwatch" style="background:${colorSwatch(value)}"></span>`
              : "";
            const primaryClass = isColorGroup(group.name) ? "optionChoicePrimary optionChoiceColor" : "optionChoicePrimary";
            return `
              <button class="optionChoice${currentValue === value ? " isActive" : ""}" type="button"
                data-group="${escapeHtml(group.name)}" data-value="${escapeHtml(value)}"${available ? "" : " disabled"}>
                <span class="${primaryClass}">${swatch}${escapeHtml(value)}</span>
                <span class="optionChoiceSecondary">${escapeHtml(secondary)}</span>
              </button>
            `;
          }).join("");

          return `
            <div class="optionGroup">
              <div class="optionGroupLabel">
                <span class="optionGroupName">${escapeHtml(group.name)}</span>
                <span class="optionGroupValue">${escapeHtml(currentValue || "Select")}</span>
              </div>
              <div class="optionChoices">${buttons}</div>
            </div>
          `;
        }).join("");

        const chips = Object.keys(currentVariant.attributes || {}).map(function (key) {
          return `<div class="variantSummaryChip">${escapeHtml(key)}: ${escapeHtml(currentVariant.attributes[key])}</div>`;
        });
        chips.push(`<div class="variantSummaryChip">SKU: ${escapeHtml(currentVariant.sku || product.sku || product.id)}</div>`);
        summaryEl.innerHTML = chips.join("");

        optionsEl.querySelectorAll(".optionChoice").forEach(function (btn) {
          btn.addEventListener("click", function () {
            selection[btn.getAttribute("data-group")] = btn.getAttribute("data-value");
            currentVariant = findVariant(product.variants, selection);
            Object.keys(currentVariant.attributes || {}).forEach(function (key) {
              selection[key] = currentVariant.attributes[key];
            });
            activeImageIndex = 0;
            renderPageState();
          });
        });
      }

      function renderPageState() {
        const active = currentVariant || product;
        const images = variantImageSet(product, currentVariant);
        const activeImage = images[activeImageIndex] || images[0] || "";
        const compareAt = active.compareAt || product.compareAt || 0;
        const price = active.price || product.price || 0;
        const shortDesc = active.shortDesc || product.shortDesc || active.desc || product.desc || "No description available.";
        const longDesc = active.desc || product.desc || "No description available.";
        const sku = active.sku || product.sku || product.id;
        const addItem = buildCartItem(product, currentVariant);

        byId("priceNow").textContent = money(price, active.currency || product.currency);
        byId("priceWas").textContent = compareAt > price ? money(compareAt, active.currency || product.currency) : "";
        byId("priceOff").textContent = compareAt > price
          ? `${Math.round(((compareAt - price) / compareAt) * 100)}% off`
          : "";
        byId("productDesc").textContent = shortDesc;
        byId("skuValue").textContent = sku;
        byId("tabDescriptionText").textContent = longDesc;
        byId("tabAdditionalText").textContent = `SKU: ${sku} | Category: ${(product.tags || []).join(", ") || "General"}`;

        setMainImage(activeImage);
        renderThumbs(images, activeImageIndex, function (index) {
          activeImageIndex = index;
          setMainImage(images[index] || "");
        });
        renderVariantOptions();

        const add = byId("addToCartBtn");
        const buyNow = byId("buyNowBtn");
        const wishBtn = byId("wishlistBtn");

        if (add) {
          add.onclick = function () {
            if (typeof window.addToCart !== "function") return;
            window.addToCart(addItem);
            for (let i = 1; i < qty; i += 1) {
              if (typeof window.addOne === "function") window.addOne(addItem.id);
            }
          };
        }

        if (buyNow) {
          buyNow.onclick = function () {
            if (typeof window.addToCart !== "function") return;
            window.addToCart(addItem);
            for (let i = 1; i < qty; i += 1) {
              if (typeof window.addOne === "function") window.addOne(addItem.id);
            }
            window.location.href = "checkout.html";
          };
        }

        if (wishBtn && typeof window.toggleWishlist === "function") {
          wishBtn.onclick = function () {
            window.toggleWishlist(addItem);
          };
        }
      }

      const qtyVal = byId("qtyValue");
      const minus = byId("qtyMinus");
      const plus = byId("qtyPlus");
      if (qtyVal) qtyVal.textContent = String(qty);
      if (minus) {
        minus.addEventListener("click", function () {
          qty = Math.max(1, qty - 1);
          if (qtyVal) qtyVal.textContent = String(qty);
        });
      }
      if (plus) {
        plus.addEventListener("click", function () {
          qty += 1;
          if (qtyVal) qtyVal.textContent = String(qty);
        });
      }

      renderPageState();
      bindTabs();
      renderRelated(product, allProducts);
    } catch (err) {
      console.error("Failed to load product page", err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
