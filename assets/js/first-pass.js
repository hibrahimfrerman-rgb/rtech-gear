/* first-pass.js: focused behavior patch for hero search/trending */
(function () {
  const JSON_PATH = "assets/data/products.json";
  const FREE_SHIPPING_THRESHOLD = 3000;
  const state = {
    products: [],
    suggestEl: null
  };

  function norm(v) {
    return String(v || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function debounce(fn, delay) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }

  function cards() {
    return Array.from(document.querySelectorAll(".productCard"));
  }

  function cardName(card) {
    const el = card.querySelector(".productName");
    return el ? el.textContent.trim() : "";
  }

  function cardText(card) {
    const name = card.querySelector(".productName");
    const desc = card.querySelector(".productDesc");
    return norm((name ? name.textContent : "") + " " + (desc ? desc.textContent : ""));
  }

  function getSearchInput() {
    return document.querySelector(".heroSearch input[type='search']") || document.querySelector("input[type='search']");
  }

  function filterOnPage(q) {
    const key = norm(q);
    const list = cards();
    if (!list.length) return;

    list.forEach(function (card) {
      const show = !key || cardText(card).indexOf(key) !== -1;
      card.style.display = show ? "" : "none";
    });
  }

  function findCardByName(name) {
    const key = norm(name);
    return cards().find(function (card) {
      return norm(cardName(card)) === key;
    }) || null;
  }

  function focusCard(card) {
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("fp-card-hit");
    setTimeout(function () { card.classList.remove("fp-card-hit"); }, 900);
  }

  function topMatches(q, limit) {
    const key = norm(q);
    if (!key) return [];

    const onPage = cards().map(function (card) {
      return {
        name: cardName(card),
        source: "On this page",
        hit: cardText(card).indexOf(key) !== -1
      };
    }).filter(function (x) { return x.hit; });

    if (onPage.length) return onPage.slice(0, limit);

    return state.products.filter(function (p) {
      const text = norm([p.name, p.description, (p.tags || []).join(" ")].join(" "));
      return text.indexOf(key) !== -1;
    }).slice(0, limit).map(function (p) {
      return { name: p.name, source: "Catalog" };
    });
  }

  function ensureSuggestBox(input) {
    if (state.suggestEl) return state.suggestEl;
    const box = document.createElement("div");
    box.className = "fp-suggest";
    box.hidden = true;
    input.parentElement.appendChild(box);
    state.suggestEl = box;
    return box;
  }

  function renderSuggest(input, items) {
    const box = ensureSuggestBox(input);
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }

    box.innerHTML = items.map(function (item, i) {
      return ""
        + "<button class='fp-suggest-btn' type='button' data-fp-idx='" + i + "'>"
        + item.name
        + "<span class='fp-suggest-meta'>" + item.source + "</span>"
        + "</button>";
    }).join("");
    box.hidden = false;

    box.querySelectorAll(".fp-suggest-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-fp-idx") || 0);
        const picked = items[idx];
        if (!picked) return;

        input.value = picked.name;
        filterOnPage(picked.name);
        box.hidden = true;

        const card = findCardByName(picked.name);
        if (card) {
          focusCard(card);
        } else {
          window.location.href = "shop.html?q=" + encodeURIComponent(picked.name);
        }
      });
    });
  }

  function bindSearch() {
    const input = getSearchInput();
    if (!input || input.dataset.fpBound) return;
    input.dataset.fpBound = "1";

    const doSearch = debounce(function () {
      const q = input.value;
      filterOnPage(q);
      renderSuggest(input, topMatches(q, 5));
    }, 140);

    input.addEventListener("input", doSearch);
    input.addEventListener("focus", function () {
      renderSuggest(input, topMatches(input.value, 5));
    });

    const searchBtn = document.querySelector(".heroSearchBtn");
    if (searchBtn && !searchBtn.dataset.fpBound) {
      searchBtn.dataset.fpBound = "1";
      searchBtn.addEventListener("click", function () {
        const q = input.value;
        filterOnPage(q);
        const first = topMatches(q, 1)[0];
        if (!first) return;
        const card = findCardByName(first.name);
        if (card) focusCard(card);
      });
    }

    document.addEventListener("click", function (e) {
      if (!state.suggestEl || !input.parentElement) return;
      if (!input.parentElement.contains(e.target)) {
        state.suggestEl.hidden = true;
      }
    });

    const paramQ = new URLSearchParams(window.location.search).get("q");
    if (paramQ) {
      input.value = paramQ;
      filterOnPage(paramQ);
      renderSuggest(input, topMatches(paramQ, 5));
    }
  }

  function makeTrendDropdown(term) {
    const wrap = document.createElement("span");
    wrap.className = "fp-trend";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fp-trend-btn";
    btn.textContent = term;

    const menu = document.createElement("div");
    menu.className = "fp-trend-menu";

    function fillMenu() {
      const list = topMatches(term, 5);
      menu.innerHTML = "";

      if (!list.length) {
        const fallback = document.createElement("button");
        fallback.type = "button";
        fallback.className = "fp-trend-item";
        fallback.textContent = "Browse " + term + " products";
        fallback.addEventListener("click", function () {
          window.location.href = "shop.html?q=" + encodeURIComponent(term);
        });
        menu.appendChild(fallback);
        return;
      }

      list.forEach(function (item) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "fp-trend-item";
        option.textContent = item.name;
        option.addEventListener("click", function () {
          wrap.classList.remove("is-open");
          const input = getSearchInput();
          if (input) {
            input.value = item.name;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }

          const card = findCardByName(item.name);
          if (card) focusCard(card);
          else window.location.href = "shop.html?q=" + encodeURIComponent(item.name);
        });
        menu.appendChild(option);
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      document.querySelectorAll(".fp-trend.is-open").forEach(function (el) {
        if (el !== wrap) el.classList.remove("is-open");
      });
      fillMenu();
      wrap.classList.toggle("is-open");
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  function bindTrendingDropdowns() {
    const row = document.querySelector(".heroTrending");
    if (!row || row.dataset.fpBound) return;
    row.dataset.fpBound = "1";

    const items = Array.from(row.querySelectorAll("span"));
    items.forEach(function (sp, idx) {
      if (idx === 0 || sp.classList.contains("heroTrendLabel")) return;
      const text = sp.textContent.trim();
      const dd = makeTrendDropdown(text);
      sp.replaceWith(dd);
    });

    document.addEventListener("click", function () {
      document.querySelectorAll(".fp-trend.is-open").forEach(function (el) {
        el.classList.remove("is-open");
      });
    });
  }

  function bindShopNow() {
    const btn = document.querySelector(".heroPill");
    if (!btn || btn.dataset.fpBound) return;
    btn.dataset.fpBound = "1";

    btn.addEventListener("click", function () {
      const featured = document.getElementById("featuredGrid");
      if (featured) {
        featured.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.href = "shop.html";
      }
    });
  }

  function bindMobileMenu() {
    const header = document.getElementById("siteHeaderRoot");
    const inner = document.querySelector(".header-top-inner");
    const nav = document.querySelector(".nav-links");
    const icons = document.querySelector(".header-icons");
    if (!header || !inner || !nav || !icons) return;
    if (header.dataset.fpMobileNavBound) return;
    header.dataset.fpMobileNavBound = "1";

    const leftToggle = document.createElement("button");
    leftToggle.type = "button";
    leftToggle.className = "fp-menu-toggle fp-menu-toggle-left";
    leftToggle.setAttribute("aria-label", "Open navigation");
    leftToggle.setAttribute("aria-expanded", "false");
    leftToggle.innerHTML = "<span class='fp-menu-bars'><span></span><span></span><span></span></span>";

    const rightToggle = document.createElement("button");
    rightToggle.type = "button";
    rightToggle.className = "fp-menu-toggle fp-menu-toggle-right";
    rightToggle.setAttribute("aria-label", "Open categories");
    rightToggle.setAttribute("aria-expanded", "false");
    rightToggle.innerHTML = "<span class='fp-menu-bars'><span></span><span></span><span></span></span>";

    inner.insertBefore(leftToggle, inner.firstChild);
    icons.appendChild(rightToggle);

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "fp-mobile-backdrop";
    backdrop.setAttribute("aria-label", "Close menu");
    backdrop.hidden = true;

    const navDrawer = document.createElement("aside");
    navDrawer.className = "fp-mobile-drawer is-left";
    navDrawer.setAttribute("aria-label", "Mobile navigation");

    const navTitle = document.createElement("div");
    navTitle.className = "fp-mobile-drawer-title";
    navTitle.textContent = "Menu";
    navDrawer.appendChild(navTitle);

    nav.querySelectorAll(".nav-link").forEach(function (a) {
      const link = document.createElement("a");
      link.className = "fp-mobile-drawer-link";
      link.href = a.getAttribute("href") || "#";
      link.textContent = a.textContent || "Link";
      navDrawer.appendChild(link);
    });

    const catDrawer = document.createElement("aside");
    catDrawer.className = "fp-mobile-drawer is-right";
    catDrawer.setAttribute("aria-label", "Mobile categories");

    const catTitle = document.createElement("div");
    catTitle.className = "fp-mobile-drawer-title";
    catTitle.textContent = "Appliances";
    catDrawer.appendChild(catTitle);

    const catNames = Array.from(document.querySelectorAll(".categoryItem .catName"))
      .map(function (el) { return (el.textContent || "").trim(); })
      .filter(Boolean);
    const fallbackCats = ["Audio", "Phones", "Gaming", "Cameras", "Wearables", "Smart Home", "Power", "Accessories"];
    const cats = catNames.length ? catNames : fallbackCats;

    cats.forEach(function (name) {
      const link = document.createElement("a");
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      link.className = "fp-mobile-drawer-link";
      link.href = "shop.html?category=" + encodeURIComponent(slug);
      link.textContent = name;
      catDrawer.appendChild(link);
    });

    header.appendChild(backdrop);
    header.appendChild(navDrawer);
    header.appendChild(catDrawer);

    function setOpen(side) {
      const leftOpen = side === "left";
      const rightOpen = side === "right";
      header.classList.toggle("fp-left-open", leftOpen);
      header.classList.toggle("fp-right-open", rightOpen);
      backdrop.hidden = !(leftOpen || rightOpen);

      leftToggle.setAttribute("aria-expanded", leftOpen ? "true" : "false");
      rightToggle.setAttribute("aria-expanded", rightOpen ? "true" : "false");
      leftToggle.setAttribute("aria-label", leftOpen ? "Close navigation" : "Open navigation");
      rightToggle.setAttribute("aria-label", rightOpen ? "Close categories" : "Open categories");
    }

    leftToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(header.classList.contains("fp-left-open") ? null : "left");
    });

    rightToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(header.classList.contains("fp-right-open") ? null : "right");
    });

    backdrop.addEventListener("click", function () { setOpen(null); });
    navDrawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(null); }); });
    catDrawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(null); }); });

    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) setOpen(null);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(null);
    });
  }

  function bindRevealMotion() {
    const targets = Array.from(document.querySelectorAll(".section, .benefit, .categoryItem, .promoCard"));
    if (!targets.length) return;

    targets.forEach(function (el) {
      if (!el.classList.contains("fp-reveal")) el.classList.add("fp-reveal");
      // Large, long-scrolling sections (like shop grids) can miss high
      // intersection ratios on mobile, leaving content hidden.
      if (el.classList.contains("section") && el.querySelector("#shopGrid")) {
        el.classList.add("is-in");
      }
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -30px 0px" });

    targets.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      io.observe(el);
    });
  }

  function bindCategoryIcons() {
    const row = document.querySelector(".categoryRow");
    if (!row || row.dataset.fpIconsBound) return;
    row.dataset.fpIconsBound = "1";

    const iconByName = {
      "audio": "audio.svg",
      "phones": "phone.svg",
      "gaming": "game.svg",
      "cameras": "camera.svg",
      "wearables": "wearebles.svg",
      "smart home": "home.svg",
      "power": "power.svg",
      "accessories": "accesories.svg"
    };
    const items = Array.from(row.querySelectorAll(".categoryItem"));

    items.forEach(function (item) {
      const nameEl = item.querySelector(".catName");
      const iconEl = item.querySelector(".catIcon");
      if (!nameEl || !iconEl) return;

      const key = norm(nameEl.textContent);
      const file = iconByName[key] || iconByName["accessories"];
      iconEl.classList.add("fp-cat-icon", "fp-cat-icon-image");
      iconEl.innerHTML = "<img src='assets/icons/SVG/" + file + "' alt='' aria-hidden='true' loading='lazy' decoding='async'>";
      item.classList.add("fp-cat-live");
    });
  }

  function bindMobileDock() {
    if (document.querySelector(".fp-mobile-dock")) return;

    const dock = document.createElement("nav");
    dock.className = "fp-mobile-dock";
    dock.setAttribute("aria-label", "Mobile quick navigation");

    const path = (window.location.pathname || "").toLowerCase();
    const links = [
      { label: "Home", href: "index.html", icon: "is-home", active: /(^|\/)index\.html$|\/$/.test(path) },
      { label: "Shop", href: "shop.html", icon: "is-shop", active: path.indexOf("shop.html") !== -1 },
      { label: "Wishlist", href: "wishlist.html", icon: "is-heart", active: path.indexOf("wishlist.html") !== -1 },
      { label: "Account", href: "track.html", icon: "is-user", active: path.indexOf("track.html") !== -1 || path.indexOf("checkout.html") !== -1 }
    ];

    links.forEach(function (item) {
      const a = document.createElement("a");
      a.className = "fp-dock-link" + (item.active ? " is-active" : "");
      a.href = item.href;
      a.innerHTML = "<span class='fp-dock-icon " + item.icon + "' aria-hidden='true'></span><span class='fp-dock-label'>" + item.label + "</span>";
      dock.appendChild(a);
    });

    document.body.appendChild(dock);
    document.body.classList.add("fp-has-mobile-dock");
  }

  function safeParseCart() {
    try {
      const raw = localStorage.getItem("rtech_cart_v1");
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function syncHeaderCartSummary() {
    const cart = safeParseCart();
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotalMini");
    if (!countEl || !totalEl) return;

    const count = cart.reduce(function (sum, item) {
      return sum + Number(item.qty || 0);
    }, 0);
    countEl.textContent = String(count);

    const totals = {};
    cart.forEach(function (item) {
      const cur = item.currency || "KSh";
      totals[cur] = (totals[cur] || 0) + Number(item.price || 0) * Number(item.qty || 0);
    });

    const currencies = Object.keys(totals);
    if (!currencies.length) {
      totalEl.textContent = "KSh 0";
      return;
    }
    if (currencies.length > 1) {
      totalEl.textContent = "Mixed";
      return;
    }

    const cur = currencies[0];
    const val = totals[cur];
    const show = val % 1 === 0 ? String(val.toFixed(0)) : String(val.toFixed(2));
    totalEl.textContent = cur + " " + show;
  }

  function renderWishlistEmptyIllustration() {
    const itemsEl = document.getElementById("wishlistItems");
    if (!itemsEl) return;
    if (itemsEl.querySelector(".cartRow")) return;

    const hasPatch = itemsEl.querySelector(".fp-wishlist-empty");
    const text = (itemsEl.textContent || "").toLowerCase();
    if (hasPatch || text.indexOf("empty") === -1) return;

    itemsEl.innerHTML = ""
      + "<div class='fp-wishlist-empty'>"
      + "  <div class='fp-wishlist-empty-art' aria-hidden='true'></div>"
      + "  <div class='cartEmptyTitle'>Your wishlist is empty.</div>"
      + "  <div class='muted small'>Save favorites to quickly find them later.</div>"
      + "</div>";
  }

  function syncFreeShippingState() {
    const progress = document.getElementById("cartProgressFill");
    const textEl = document.getElementById("cartProgressText");
    const wrap = textEl ? textEl.closest(".cartProgress") : null;
    const bar = wrap ? wrap.querySelector(".cartProgressBar") : null;
    const cartTitleIcon = document.querySelector("#cartDrawer .cartTitle .cartIcon");
    if (!progress || !textEl || !wrap || !bar) return;

    let icon = bar.querySelector(".fp-progress-icon");
    if (!icon) {
      icon = document.createElement("span");
      icon.className = "fp-progress-icon";
      icon.setAttribute("aria-hidden", "true");
      bar.appendChild(icon);
    }

    const cart = safeParseCart();
    const subtotal = cart.reduce(function (sum, item) {
      const cur = String(item.currency || "").toUpperCase();
      const include = cur === "KES" || cur === "KSH" || cur === "";
      if (!include) return sum;
      return sum + Number(item.price || 0) * Number(item.qty || 0);
    }, 0);

    const hit = subtotal >= FREE_SHIPPING_THRESHOLD;
    const pct = hit ? 100 : Math.max(0, Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)));
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

    progress.style.width = String(pct) + "%";
    wrap.style.setProperty("--fp-progress", String(pct) + "%");
    wrap.classList.remove("fp-free-pending", "fp-free-hit");
    wrap.classList.add(hit ? "fp-free-hit" : "fp-free-pending");
    if (cartTitleIcon) {
      cartTitleIcon.classList.toggle("fp-free-hit-icon", hit);
    }

    if (hit) {
      textEl.textContent = "Congratulations! You’ve got FREE SHIPPING";
    } else {
      const amt = remaining % 1 === 0 ? String(remaining.toFixed(0)) : String(remaining.toFixed(2));
      textEl.textContent = "Buy KES " + amt + " more to get Free Delivery";
    }
  }

  function loadProducts() {
    return fetch(JSON_PATH)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        state.products = (json || []).map(function (p) {
          return {
            name: String(p.name || ""),
            description: String(p.description || p.desc || ""),
            tags: Array.isArray(p.tags) ? p.tags : []
          };
        });
      })
      .catch(function () {
        state.products = [];
      });
  }

  function boot() {
    bindShopNow();
    bindSearch();
    bindTrendingDropdowns();
    bindMobileMenu();
    bindCategoryIcons();
    bindMobileDock();
    bindRevealMotion();
    syncHeaderCartSummary();
    renderWishlistEmptyIllustration();
    syncFreeShippingState();
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProducts().finally(function () {
      boot();
      let n = 0;
      const timer = setInterval(function () {
        boot();
        n += 1;
        if (n > 30) clearInterval(timer);
      }, 250);

      // Keep summary synced after async partial/header load and early cart mutations.
      let syncTicks = 0;
      const syncTimer = setInterval(function () {
        syncHeaderCartSummary();
        renderWishlistEmptyIllustration();
        syncFreeShippingState();
        syncTicks += 1;
        if (syncTicks > 40) clearInterval(syncTimer);
      }, 500);

      // Keep shipping progress visual state live when cart content mutates.
      const cartItems = document.getElementById("cartItems");
      if (cartItems && "MutationObserver" in window) {
        const mo = new MutationObserver(function () {
          syncHeaderCartSummary();
          syncFreeShippingState();
        });
        mo.observe(cartItems, { childList: true, subtree: true });
      }

      document.addEventListener("click", function (e) {
        const t = e.target;
        if (!t) return;
        if (t.closest(".btn") || t.closest(".qtyBtn") || t.closest(".cartRowRemove") || t.closest("#cartBtn")) {
          setTimeout(function () {
            syncHeaderCartSummary();
            syncFreeShippingState();
          }, 60);
        }
      });
    });
  });
})();
