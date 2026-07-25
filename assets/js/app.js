/* app.js
   Baby-readable store logic:
   - WhatsApp links (one config place)
   - Cart stored in browser
   - Cart drawer open/close
   - Checkout sends cart summary to WhatsApp
*/

/* PAGE / UI MAP
   - Header mini cart: #cartCount, #cartTotalMini
   - Cart drawer: #cartDrawer, #cartItems, #cartTotal
   - Wishlist drawer: #wishlistDrawer, #wishlistItems
   - Checkout summary: #checkoutItems, #checkoutTotal
   - Home trending carousel: #trendingTrack, #trendingDots
   - Home flash sale ad: #flashSaleAd, #flashSaleAdTitle
*/

/* =========================
   1) CONFIG (CHANGE HERE)
========================= */
const STORE_CONFIG = {
  brandName: "R-Tech Gear",

  // CHANGE THIS NUMBER:
  // Format: 2547XXXXXXXX (no + sign)
  whatsappNumber: "254746343234",

  // Default message (used if cart is empty)
  whatsappHelloMessage: "Hi R-Tech Gear, I need help choosing a product.",

  // Default currency if product does not specify
  currency: "KES",
  freeShippingThreshold: 3000
};

/* =========================
   2) WHATSAPP LINK HELPERS
========================= */
function makeWhatsAppLink(message) {
  const num = STORE_CONFIG.whatsappNumber;
  const text = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${text}`;
}
window.makeWhatsAppLink = makeWhatsAppLink;
window.PRODUCTS = window.PRODUCTS || [];

function normalizeProductCatalog(list = []) {
  return list
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      price: Number(item.price || item.price_ksh || 0),
      href: item.href || `product.html?id=${encodeURIComponent(String(item.id))}`,
      image: item.image || (Array.isArray(item.images) ? item.images[0] : ""),
      category: item.category || "",
      tags: item.tags || []
    }));
}

async function loadGlobalProducts() {
  if (window.PRODUCTS && window.PRODUCTS.length) return window.PRODUCTS;
  try {
    const response = await fetch("assets/data/products.json");
    if (!response.ok) throw new Error("Product feed failed");
    const json = await response.json();
    window.PRODUCTS = normalizeProductCatalog(json).slice(0, 8);
  } catch (err) {
    window.PRODUCTS = window.PRODUCTS || [];
  }
  return window.PRODUCTS;
}

function renderRecommendationGrid() {
  const grid = document.getElementById("recommendGrid");
  if (!grid) return;
  const products = (window.PRODUCTS && window.PRODUCTS.length ? window.PRODUCTS : []).slice(0, 4);
  if (!products.length) {
    grid.innerHTML = `
      <a class="recommendCard" href="shop.html?q=accessories">
        <div class="recommendImage"></div>
        <div class="recommendCopy"><strong>Must-have accessories</strong><span>Explore curated add-ons for your purchase.</span></div>
      </a>
      <a class="recommendCard" href="shop.html?q=portable">
        <div class="recommendImage"></div>
        <div class="recommendCopy"><strong>Portable essentials</strong><span>Everything you need while on the move.</span></div>
      </a>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => `
    <a class="recommendCard" href="${product.href}">
      <div class="recommendImage" style="background-image:url('${product.image}')"></div>
      <div class="recommendCopy">
        <strong>${product.name}</strong>
        <span>${formatMoney(product.price)}</span>
      </div>
    </a>
  `).join("");
}

function refreshWhatsAppLinks() {
  const floatBtn = document.getElementById("floatWhatsAppLink");
  if (floatBtn) floatBtn.href = makeWhatsAppLink(STORE_CONFIG.whatsappHelloMessage);
  const topBtn = document.getElementById("topWhatsAppLink");
  if (topBtn) topBtn.href = makeWhatsAppLink(STORE_CONFIG.whatsappHelloMessage);
}

/* =========================
   3) CART STORAGE
========================= */
const CART_KEY = "rtech_cart_v1";
const WISHLIST_KEY = "rtech_wishlist_v1";

function ensureGlobalDrawers() {
  if (!document.getElementById("cartDrawer")) {
    const cartDrawer = document.createElement("div");
    cartDrawer.innerHTML = `
      <div class="cartDrawer" id="cartDrawer" aria-hidden="true">
        <div class="cartPanel" role="dialog" aria-label="Cart">
          <div class="cartTop">
            <div class="cartTitle">
              <span class="cartIcon" aria-hidden="true"></span>
              Shopping Cart
            </div>
            <button class="accountCloseBtn" id="cartCloseBtn" type="button" aria-label="Close cart">&times;</button>
          </div>
          <div class="cartItems" id="cartItems"></div>
          <div class="cartEmpty" id="cartEmpty">
            <picture class="cartEmptyArt">

              <source
                  media="(max-width:768px)"
                  srcset="assets/img/header pics/shopping cart phone_.png">

              <img
                  src="assets/img/header pics/shopping cart pc.png"
                  alt="Shopping Cart">

            </picture>
            <div class="cartEmptyTitle">No products in the cart.</div>
            <div class="muted small">Your cart is currently empty. Let us help you find the perfect item!</div>
            <a class="btn btnGhost" href="shop.html">Continue Shopping</a>
          </div>
          <div class="cartBottom">
            <div class="cartTotalRow">
              <span class="muted">Subtotal</span>
              <strong id="cartTotal">KES 0</strong>
            </div>
            <div class="cartActionsRow">
              <a class="btn btnGhost w100" href="cart.html">View Cart</a>
              <a class="btn btnPrimary w100" href="checkout.html">Checkout</a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(cartDrawer.firstElementChild);
  }

  if (!document.getElementById("wishlistDrawer")) {
    const wishlistDrawer = document.createElement("div");
    wishlistDrawer.innerHTML = `
      <div class="wishlistDrawer" id="wishlistDrawer" aria-hidden="true">
        <div class="wishlistPanel" role="dialog" aria-label="Wishlist">
          <div class="cartTop">
            <div class="cartTitle">
              <span class="cartIcon" aria-hidden="true"></span>
              Wishlist
            </div>
            <button class="accountCloseBtn" id="wishlistCloseBtn" type="button" aria-label="Close wishlist">&times;</button>
          </div>
          <div class="cartItems" id="wishlistItems"></div>
          <div class="cartEmpty" id="wishlistEmpty" hidden>
            <picture class="cartEmptyArt">
              <source media="(max-width:768px)" srcset="assets/img/header pics/wishlist cart phone_.png">
              <img src="assets/img/header pics/wishlist cart pc.png" alt="Empty wishlist">
            </picture>
            <div class="cartEmptyTitle">Your wishlist is empty.</div>
            <div class="muted small">Save products you love and come back to them anytime.</div>
            <a class="btn btnGhost" href="shop.html">Explore products</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wishlistDrawer.firstElementChild);
  }

  // The account drawer owns the close-button design. Apply that exact
  // component class to existing page-level drawers too.
  document.querySelectorAll("#cartCloseBtn, #wishlistCloseBtn").forEach((button) => {
    button.classList.add("accountCloseBtn");
    button.classList.remove("iconBtn");
    button.innerHTML = '<span aria-hidden="true">&times;</span>';
  });

  document.querySelectorAll(".wishlistPanel").forEach((panel) => {
    if (panel.querySelector("#wishlistEmpty")) return;
    const empty = document.createElement("div");
    empty.className = "cartEmpty";
    empty.id = "wishlistEmpty";
    empty.hidden = true;
    empty.innerHTML = `
      <picture class="cartEmptyArt">
        <source media="(max-width:768px)" srcset="assets/img/header pics/wishlist cart phone_.png">
        <img src="assets/img/header pics/wishlist cart pc.png" alt="Empty wishlist">
      </picture>
      <div class="cartEmptyTitle">Your wishlist is empty.</div>
      <div class="muted small">Save products you love and come back to them anytime.</div>
      <a class="btn btnGhost" href="shop.html">Explore products</a>
    `;
    panel.appendChild(empty);
  });

  document.querySelectorAll(".cartEmptyArt:empty").forEach((art) => {
    art.innerHTML = `
      <picture>
        <source media="(max-width:768px)" srcset="assets/img/header pics/shopping cart phone_.png">
        <img src="assets/img/header pics/shopping cart pc.png" alt="Shopping Cart">
      </picture>
    `;
  });
}

function syncCartState() {
  refreshStoreCounters();
  refreshCartUI();
  renderCheckoutSummary();
  renderCartPage();
  renderRecommendationGrid();
}

function getCart() {
  const readList = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const value = raw ? JSON.parse(raw) : null;
      return Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  };

  const currentCart = readList(CART_KEY);
  if (currentCart) return currentCart;

  // Keep carts created by older storefront builds when the storage key changed.
  for (const legacyKey of ["rtech_cart", "cart"]) {
    const legacyCart = readList(legacyKey);
    if (legacyCart) {
      saveCart(legacyCart);
      return legacyCart;
    }
  }

  return [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function toggleWishlist(item) {
  if (!item || !item.id) return;
  const list = getWishlist();
  const itemId = String(item.id);
  const exists = list.some((x) => String(x.id) === itemId);
  const next = exists
    ? list.filter((x) => String(x.id) !== itemId)
    : [...list, { ...item, id: itemId }];
  saveWishlist(next);
  refreshWishlistUI();
}

function removeFromWishlist(id) {
  const itemId = String(id || "");
  if (!itemId) return;
  saveWishlist(getWishlist().filter((item) => String(item.id) !== itemId));
  refreshWishlistUI();
}

function formatMoney(amount, currency) {
  const cur = currency || STORE_CONFIG.currency;
  const n = Number.isFinite(amount) ? amount : 0;
  const display = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  return `${cur} ${display}`;
}

function totalsByCurrency(cart) {
  const totals = {};
  cart.forEach((item) => {
    const cur = item.currency || STORE_CONFIG.currency;
    const lineTotal = item.price * item.qty;
    totals[cur] = (totals[cur] || 0) + lineTotal;
  });
  return totals;
}

const CHECKOUT_SHIPPING_RATES = {
  normal: 300,
  priority: 550
};

function getCheckoutDeliveryMode() {
  const selected = document.querySelector("input[name='deliveryMode']:checked");
  return selected ? selected.value : "ship";
}

function getCheckoutShippingChoice() {
  const deliveryMode = getCheckoutDeliveryMode();
  const shippingSpeed = document.getElementById("shippingSpeed");
  const value = String(shippingSpeed && shippingSpeed.value ? shippingSpeed.value : "normal|300");
  const parts = value.split("|");
  const speedKey = parts[0] || "normal";
  const rate = Number(parts[1] || CHECKOUT_SHIPPING_RATES[speedKey] || 0);
  const shippingFee = deliveryMode === "pickup" ? 0 : rate;
  const shippingLabel = deliveryMode === "pickup"
    ? "Collection Point"
    : speedKey === "priority"
      ? "Priority delivery"
      : "Normal delivery";

  return {
    deliveryMode,
    speedKey,
    shippingFee,
    shippingLabel
  };
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return result;
}

function formatDeliveryDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
}

function getCheckoutDeliveryEstimate() {
  const shipping = getCheckoutShippingChoice();
  const today = new Date();

  if (shipping.deliveryMode === "pickup") {
    return "Ready for pickup today";
  }

  if (shipping.speedKey === "priority") {
    return `${formatDeliveryDate(today)} - ${formatDeliveryDate(addBusinessDays(today, 1))}`;
  }

  return `${formatDeliveryDate(addBusinessDays(today, 2))} - ${formatDeliveryDate(addBusinessDays(today, 4))}`;
}

function estimateCartWeight(cart) {
  const weight = cart.reduce((sum, item) => {
    const itemWeight = Number(item.weight || item.estimatedWeight || 0.55);
    const qty = Number(item.qty || 1);
    return sum + (Number.isFinite(itemWeight) ? itemWeight : 0.55) * qty;
  }, 0);
  return Number.isFinite(weight) ? weight : 0;
}

function syncCheckoutDeliveryUI() {
  const mode = getCheckoutDeliveryMode();
  const shipOnly = document.querySelector(".checkoutShipOnly");
  const pickupOnly = document.querySelector(".checkoutPickupOnly");
  const locationGroup = document.getElementById("location");
  const shippingSpeed = document.getElementById("shippingSpeed");
  const shippingSpeedGroup = shippingSpeed ? shippingSpeed.closest(".formGroup") : null;
  const pickupStore = document.getElementById("pickupStore");

  if (shipOnly) shipOnly.hidden = mode === "pickup";
  if (pickupOnly) pickupOnly.hidden = mode !== "pickup";
  if (shippingSpeedGroup) shippingSpeedGroup.hidden = mode === "pickup";
  if (locationGroup) locationGroup.required = mode !== "pickup";
  if (shippingSpeed) shippingSpeed.disabled = mode === "pickup";
  if (pickupStore) pickupStore.disabled = mode !== "pickup";
}

function syncPaymentChoiceLabel() {
  const paymentChoice = document.getElementById("paymentChoice");
  const cardFieldsGrid = document.getElementById("cardFieldsGrid");

  const selected = document.querySelector("input[name='payment']:checked");
  const value = selected ? selected.value : "M-Pesa";

  if (cardFieldsGrid) cardFieldsGrid.hidden = value !== "DPO";
  if (!paymentChoice) return;

  const badge = paymentChoice.querySelector(".payBadge");
  const title = paymentChoice.querySelector(".payTitle");
  const subtitle = paymentChoice.querySelector(".muted.small");

  if (badge) {
    badge.textContent = value === "M-Pesa" ? "M-Pesa" : value === "PayPal" ? "PayPal" : "Card";
  }
  if (title) {
    title.textContent = value === "M-Pesa"
      ? "Express M-Pesa checkout"
      : value === "PayPal"
        ? "Pay with PayPal"
        : "Credit or debit card";
  }
  if (subtitle) {
    subtitle.textContent = value === "M-Pesa"
      ? "Fast mobile checkout for Kenya"
      : value === "PayPal"
        ? "Cards and PayPal balance"
        : "Visa, Mastercard, Amex, and bank gateway ready";
  }
}

/* =========================
   4) CART ACTIONS
========================= */
function addToCart(product, options = {}) {
  const cart = getCart();
  const currency = product.currency || STORE_CONFIG.currency;
  const found = cart.find((item) => item.id === product.id);

  if (found) found.qty += 1;
  else cart.push({ ...product, qty: 1, currency, image: product.image || "" });

  saveCart(cart);
  syncCartState();
  if (options.openDrawer !== false && typeof openCart === "function") openCart();
}

function buyNow(product, quantity = 1) {
  addToCart(product, { openDrawer: false });
  for (let index = 1; index < quantity; index += 1) addOne(product.id);
  window.location.assign("checkout.html");
}

function removeOne(id) {
  const cart = getCart();
  const item = cart.find((x) => x.id === id);
  if (!item) return;

  item.qty -= 1;
  const newCart = item.qty <= 0 ? cart.filter((x) => x.id !== id) : cart;

  saveCart(newCart);
  syncCartState();
}

function addOne(id) {
  const cart = getCart();
  const item = cart.find((x) => x.id === id);
  if (!item) return;
  item.qty += 1;
  saveCart(cart);
  syncCartState();
}

function clearCart() {
  saveCart([]);
  syncCartState();
}

/* =========================
   5) CHECKOUT MESSAGE
========================= */
function buildCheckoutMessage(cart) {
  if (cart.length === 0) return STORE_CONFIG.whatsappHelloMessage;

  let lines = [];
  lines.push(`Hi ${STORE_CONFIG.brandName}, I want to order:`);

  const totals = totalsByCurrency(cart);
  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    const cur = item.currency || STORE_CONFIG.currency;
    lines.push(`- ${item.name} x${item.qty} (${formatMoney(itemTotal, cur)})`);
  });

  const shipping = getCheckoutShippingChoice();
  const weight = estimateCartWeight(cart);
  const currencies = Object.keys(totals);
  if (currencies.length === 1) {
    lines.push(`Total: ${formatMoney(totals[currencies[0]], currencies[0])}`);
  } else {
    currencies.forEach((cur) => {
      lines.push(`Total ${cur}: ${formatMoney(totals[cur], cur)}`);
    });
  }
  lines.push(`Shipping: ${shipping.shippingLabel} (${formatMoney(shipping.shippingFee, STORE_CONFIG.currency)})`);
  lines.push(`Estimated delivery: ${getCheckoutDeliveryEstimate()}`);
  lines.push(`Estimated weight: ${weight.toFixed(1)} kg`);
  lines.push("");
  lines.push("My name: ____");
  lines.push("My phone: ____");
  lines.push("Delivery location: ____");
  lines.push("Email: ____");
  lines.push("Delivery mode: ____");

  return lines.join("\n");
}

/* =========================
   6) UI RENDER
========================= */
function refreshStoreCounters() {
  const cartCount = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const wishlistCount = getWishlist().length;

  document.querySelectorAll("#cartCount").forEach((element) => {
    element.textContent = String(cartCount);
  });
  document.querySelectorAll("#wishlistCount").forEach((element) => {
    element.textContent = String(wishlistCount);
  });
}

function refreshCartUI() {
  const cart = getCart();
  const totalMiniEl = document.getElementById("cartTotalMini");

  // Drawer elements
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const emptyEl = document.getElementById("cartEmpty");

  /* Hide the free-shipping progress completely whenever
     the drawer contains products. It returns automatically
     when the cart becomes empty. */
  const progress = document.querySelector(".cartProgress");

  if (!itemsEl || !totalEl) return;

  itemsEl.innerHTML = "";
  const totals = totalsByCurrency(cart);

  if (cart.length === 0) {

    if(progress) progress.style.display = "";

    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.classList.add("isVisible");
    }
    itemsEl.style.display = "none";

  }
   else {

    if(progress) progress.style.display = "none";

    if (emptyEl) {
      emptyEl.classList.remove("isVisible");
      emptyEl.hidden = true;
    }
    itemsEl.style.display = "block";
    cart.forEach((item) => {
      const itemTotal = item.price * item.qty;
      const cur = item.currency || STORE_CONFIG.currency;

      const row = document.createElement("div");
      row.className = "cartRow";
      row.innerHTML = `
        <div class="cartRowLeft">
          <div class="cartThumb" style="background-image:url('${item.image || ""}')"></div>
          <div>
            <div class="cartRowTitle">${item.name}</div>
            <div class="muted small">${formatMoney(item.price, cur)}</div>
            <div class="qtyControl">
              <button class="qtyBtn" type="button" onclick="removeOne('${item.id}')">-</button>
              <span class="qtyVal">${item.qty}</span>
              <button class="qtyBtn" type="button" onclick="addOne('${item.id}')">+</button>
            </div>
          </div>
        </div>

        <button class="cartRowRemove" type="button" aria-label="Remove one"
          onclick="removeOne('${item.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 7h16M9 7V5h6v2m-7 0l1 12h8l1-12"/>
          </svg>
        </button>
      `;
      itemsEl.appendChild(row);
    });
  }

  const currencies = Object.keys(totals);
  if (currencies.length === 1) {
    totalEl.textContent = formatMoney(totals[currencies[0]], currencies[0]);
    if (totalMiniEl) totalMiniEl.textContent = formatMoney(totals[currencies[0]], currencies[0]);
  } else if (currencies.length === 0) {
    totalEl.textContent = formatMoney(0, STORE_CONFIG.currency);
    if (totalMiniEl) totalMiniEl.textContent = formatMoney(0, STORE_CONFIG.currency);
  } else {
    totalEl.textContent = "Mixed";
    if (totalMiniEl) totalMiniEl.textContent = "Mixed";
  }


  const miniItems = document.getElementById("cartMiniItems");
  if (miniItems) {
    miniItems.innerHTML = "";
    if (!cart.length) {
      miniItems.innerHTML = `<div class="muted small">No products in the cart.</div>`;
    } else {
      cart.slice(0, 3).forEach((item) => {
        const row = document.createElement("div");
        row.className = "cartMiniRow";
        row.innerHTML = `
          <div class="cartThumb" style="background-image:url('${item.image || ""}')"></div>
          <div class="cartMiniText">
            <div class="cartRowTitle">${item.name}</div>
            <div class="muted small">${formatMoney(item.price, item.currency)} x${item.qty}</div>
          </div>
        `;
        miniItems.appendChild(row);
      });
    }
  }
}

function refreshWishlistUI() {
  const list = getWishlist();
  const itemsEl = document.getElementById("wishlistItems");
  const emptyEl = document.getElementById("wishlistEmpty");
  if (itemsEl) {
    itemsEl.innerHTML = "";
    if (!list.length) {
      itemsEl.style.display = "none";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.classList.add("isVisible");
      }
    } else {
      itemsEl.style.display = "block";
      if (emptyEl) {
        emptyEl.classList.remove("isVisible");
        emptyEl.hidden = true;
      }
      list.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cartRow";
        row.innerHTML = `
          <div class="cartRowLeft">
            <div class="cartThumb" style="background-image:url('${item.image || ""}')"></div>
            <div>
              <div class="cartRowTitle">${item.name}</div>
              <div class="muted small">${formatMoney(item.price, item.currency)}</div>
            </div>
          </div>
          <button class="cartRowRemove" type="button" aria-label="Remove ${item.name} from wishlist"
            data-wishlist-remove="${item.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 7h16M9 7V5h6v2m-7 0l1 12h8l1-12"/>
            </svg>
          </button>
        `;
        itemsEl.appendChild(row);
      });
    }
  }
  refreshStoreCounters();
  document.querySelectorAll("[data-wishlist-id]").forEach((btn) => {
    const id = btn.getAttribute("data-wishlist-id");
    const active = list.some((x) => String(x.id) === String(id));
    btn.classList.toggle("isActive", active);
  });
}

/* =========================
   6b) CHECKOUT PAGE
========================= */
function renderCheckoutItems() {
  const itemsEl = document.getElementById("checkoutItems");
  if (!itemsEl) return;
  const cart = getCart();
  itemsEl.innerHTML = "";

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="muted">Your cart is empty.</div>`;
    return;
  }

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    const cur = item.currency || STORE_CONFIG.currency;
    const row = document.createElement("div");
    row.className = "summaryRow";
    row.innerHTML = `
      <div class="summaryThumb" style="background-image:url('${item.image || ""}')">
        <span class="summaryQtyBadge">${item.qty}</span>
      </div>
      <div class="summaryRowBody">
        <div class="summaryName">${item.name}</div>
        <div class="summaryRowMeta">
          <span>${formatMoney(item.price, cur)} each</span>
          <strong>${formatMoney(itemTotal, cur)}</strong>
        </div>
      </div>
    `;
    itemsEl.appendChild(row);
  });
}

window.renderCheckoutItems = renderCheckoutItems;

function renderCheckoutSummary() {
  renderCheckoutItems();

  const subtotalEl = document.getElementById("checkoutSubtotal");
  const shippingEl = document.getElementById("checkoutShipping");
  const totalEl = document.getElementById("checkoutTotal");
  const weightEl = document.getElementById("checkoutWeight");
  const shippingLabelEl = document.getElementById("checkoutShippingLabel");
  const deliveryEstimateEl = document.getElementById("checkoutDeliveryEstimate");
  if (!subtotalEl || !shippingEl || !totalEl) return;

  const cart = getCart();
  const totals = totalsByCurrency(cart);
  const shipping = getCheckoutShippingChoice();
  const weight = estimateCartWeight(cart);

  const currencies = Object.keys(totals);
  let subtotalValue = 0;
  let subtotalCurrency = STORE_CONFIG.currency;

  if (currencies.length === 1) {
    subtotalValue = Number(totals[currencies[0]] || 0);
    subtotalCurrency = currencies[0];
  }

  subtotalEl.textContent = formatMoney(subtotalValue, subtotalCurrency);
  shippingEl.textContent = formatMoney(shipping.shippingFee, STORE_CONFIG.currency);
  totalEl.textContent = formatMoney(subtotalValue + shipping.shippingFee, subtotalCurrency);
  if (weightEl) weightEl.textContent = `Estimated weight: ${weight.toFixed(1)} kg`;
  if (shippingLabelEl) shippingLabelEl.innerHTML = shipping.shippingLabel + (shipping.deliveryMode === "pickup" ? " — <span class='freeTag'>Free ✓</span>" : ` - ${formatMoney(shipping.shippingFee, STORE_CONFIG.currency)}`);
  if (deliveryEstimateEl) deliveryEstimateEl.textContent = getCheckoutDeliveryEstimate();
}

/* =========================
   6c) CART PAGE
========================= */
function renderCartPage() {
  const listEl = document.getElementById("cartPageItems");
  const emptyEl = document.getElementById("cartPageEmpty");
  if (!listEl || !emptyEl) return;

  const cart = getCart();
  listEl.innerHTML = "";

  if (!cart.length) {
    emptyEl.style.display = "grid";
    return;
  }

  emptyEl.style.display = "none";
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cartRow";
    row.innerHTML = `
      <div class="cartRowLeft">
        <div class="cartThumb" style="background-image:url('${item.image || ""}')"></div>
        <div>
          <div class="cartRowTitle">${item.name}</div>
          <div class="muted small">${formatMoney(item.price, item.currency)}</div>
          <div class="qtyControl">
            <button class="qtyBtn" type="button" onclick="removeOne('${item.id}')">-</button>
            <span class="qtyVal">${item.qty}</span>
            <button class="qtyBtn" type="button" onclick="addOne('${item.id}')">+</button>
          </div>
        </div>
      </div>
      <button class="cartRowRemove" type="button" aria-label="Remove one"
        onclick="removeOne('${item.id}')">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 7h16M9 7V5h6v2m-7 0l1 12h8l1-12"/>
        </svg>
      </button>
    `;
    listEl.appendChild(row);
  });
}

function connectCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const payNowBtn = document.getElementById("payNowBtn");
  const paymentModal = document.getElementById("paymentModal");
  const closePaymentModal = document.getElementById("closePaymentModal");
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  const paymentChoice = document.getElementById("paymentChoice");
  const expressMoreToggle = document.getElementById("expressMoreToggle");
  const morePaymentMethods = document.getElementById("morePaymentMethods");
  const mpesaExpressBtn = document.getElementById("mpesaExpressBtn");
  const whatsAppSupportBtn = document.getElementById("whatsAppSupportBtn");
  const shippingSpeed = document.getElementById("shippingSpeed");
  const couponCode = document.getElementById("couponCode");
  const summaryCouponCode = document.getElementById("summaryCouponCode");
  const applyCouponBtn = document.getElementById("applyCouponBtn");
  const summaryApplyCouponBtn = document.getElementById("summaryApplyCouponBtn");
  const paymentInputs = Array.from(document.querySelectorAll("input[name='payment']"));
  const deliveryInputs = Array.from(document.querySelectorAll("input[name='deliveryMode']"));
  const shippingSpeedGroup = shippingSpeed ? shippingSpeed.closest(".formGroup") : null;
  const locationInput = document.getElementById("location");
  const pickupStore = document.getElementById("pickupStore");

  function refreshCheckout() {
    syncCheckoutDeliveryUI();
    syncPaymentChoiceLabel();
    renderCheckoutSummary();
  }

  // PAYMENT EXECUTION REMOVED (Patch 1 — Duplicate Payment Handler Removal).
  // first-pass.js's initPayBtn() / handlePayment() is now the single checkout
  // payment controller for #payNowBtn. Do not re-add a click listener here.

  function openModal() {
    if (paymentModal) paymentModal.classList.add("isOpen");
  }

  function closeModal() {
    if (paymentModal) paymentModal.classList.remove("isOpen");
  }

  if (closePaymentModal) closePaymentModal.addEventListener("click", closeModal);
  if (paymentModal) {
    paymentModal.addEventListener("click", (e) => {
      if (e.target === paymentModal) closeModal();
    });
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", () => {
      const modalSelection = document.querySelector("input[name='modalPayment']:checked");
      const target = document.querySelector(`input[name='payment'][value='${modalSelection ? modalSelection.value : "M-Pesa"}']`);
      if (target) target.checked = true;

      if (paymentChoice && modalSelection) {
        syncPaymentChoiceLabel();
      }
      closeModal();
    });
  }

  if (expressMoreToggle && morePaymentMethods) {
    expressMoreToggle.addEventListener("click", () => {
      morePaymentMethods.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (mpesaExpressBtn) {
    mpesaExpressBtn.addEventListener("click", () => {
      const mpesaOption = document.querySelector("input[name='payment'][value='M-Pesa']");
      if (mpesaOption) mpesaOption.checked = true;
      syncPaymentChoiceLabel();
      if (payNowBtn) payNowBtn.click();
    });
  }

  paymentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      refreshCheckout();
      if (payNowBtn) {
        payNowBtn.textContent = input.value === "DPO" ? "Pay with Card" : input.value === "PayPal" ? "Pay with PayPal" : "Pay with M-Pesa";
      }
    });
  });

  deliveryInputs.forEach((input) => {
    input.addEventListener("change", refreshCheckout);
  });

  if (shippingSpeed) shippingSpeed.addEventListener("change", refreshCheckout);
  if (couponCode) couponCode.addEventListener("input", () => {
    if (summaryCouponCode && summaryCouponCode.value !== couponCode.value) summaryCouponCode.value = couponCode.value;
  });
  if (summaryCouponCode) summaryCouponCode.addEventListener("input", () => {
    if (couponCode && couponCode.value !== summaryCouponCode.value) couponCode.value = summaryCouponCode.value;
  });
  if (applyCouponBtn) applyCouponBtn.addEventListener("click", () => {
    const code = String(couponCode ? couponCode.value : "").trim() || String(summaryCouponCode ? summaryCouponCode.value : "").trim();
    alert(code ? `Coupon "${code}" saved for integration.` : "Add a coupon code first.");
  });
  if (summaryApplyCouponBtn) summaryApplyCouponBtn.addEventListener("click", () => {
    const code = String(summaryCouponCode ? summaryCouponCode.value : "").trim() || String(couponCode ? couponCode.value : "").trim();
    alert(code ? `Coupon "${code}" saved for integration.` : "Add a coupon code first.");
  });

  if (locationInput) locationInput.addEventListener("input", refreshCheckout);
  if (pickupStore) pickupStore.addEventListener("change", refreshCheckout);

  if (shippingSpeedGroup) shippingSpeedGroup.hidden = getCheckoutDeliveryMode() === "pickup";
  refreshCheckout();

  if (whatsAppSupportBtn) {
    whatsAppSupportBtn.addEventListener("click", () => {
      window.open(makeWhatsAppLink("Hi R-Tech Gear, I need help with checkout."), "_blank");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (payNowBtn) payNowBtn.click();
  });
}

/* =========================
   7) CART/WISHLIST BUTTONS
   (Moved to assets/js/cart.js and assets/js/wishlist.js)
========================= */

function connectWishlistToggles() {
  document.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-wishlist-remove]");
    if (removeBtn) {
      removeFromWishlist(removeBtn.getAttribute("data-wishlist-remove"));
      return;
    }

    const btn = e.target.closest("[data-wishlist-id]");
    if (!btn) return;
    const payload = {
      id: btn.getAttribute("data-wishlist-id"),
      name: btn.getAttribute("data-wishlist-name"),
      price: Number(btn.getAttribute("data-wishlist-price") || 0),
      currency: btn.getAttribute("data-wishlist-currency") || STORE_CONFIG.currency,
      image: btn.getAttribute("data-wishlist-image") || ""
    };
    toggleWishlist(payload);
  });
}

// Home carousel controls for "Top smartphone trends".
function connectTrendingCarousel() {
  const track = document.getElementById("trendingTrack");
  const dotsWrap = document.getElementById("trendingDots");
  if (!track || !dotsWrap) return;
  const isPhone = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;

  const prev = document.querySelector(".carouselBtn.prev");
  const next = document.querySelector(".carouselBtn.next");
  let autoTimer = null;

  function currentIndex() {
    const width = track.clientWidth;
    return Math.round(track.scrollLeft / width);
  }

  function updateDots() {
    const dots = dotsWrap.querySelectorAll(".carouselDot");
    const idx = currentIndex();
    dots.forEach((d, i) => d.classList.toggle("isActive", i === idx));
  }

  function goTo(idx) {
    const width = track.clientWidth;
    track.scrollTo({ left: width * idx, behavior: "smooth" });
  }

  function autoPlay() {
    const dots = dotsWrap.querySelectorAll(".carouselDot");
    if (!dots.length) return;
    const idx = (currentIndex() + 1) % dots.length;
    goTo(idx);
  }

  if (prev) prev.addEventListener("click", () => goTo(Math.max(0, currentIndex() - 1)));
  if (next) next.addEventListener("click", () => goTo(currentIndex() + 1));

  track.addEventListener("scroll", () => requestAnimationFrame(updateDots));

  function startAuto() {
    if (isPhone) return;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(autoPlay, 5000);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  track.addEventListener("mouseenter", stopAuto);
  track.addEventListener("mouseleave", startAuto);

  let startX = 0;
  let startLeft = 0;
  let isDown = false;
  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = startX - e.clientX;
    track.scrollLeft = startLeft + dx;
  });
  track.addEventListener("pointerup", () => { isDown = false; });
  track.addEventListener("pointercancel", () => { isDown = false; });

  startAuto();
}

// Rotates flash sale ad image/title (left-side ad card).
function connectFlashSaleAd() {
  if (window.__flashSaleManaged) return;
  const ad = document.getElementById("flashSaleAd");
  const titleEl = document.getElementById("flashSaleAdTitle");
  if (!ad || ad.dataset.bound === "1") return;
  const isPhone = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
  ad.dataset.bound = "1";

  const slides = [
    { image: "assets/img/promo-1.jpg", title: "Flash Sale" },
    { image: "assets/img/promo-2.jpg", title: "Weekend Deals" },
    { image: "assets/img/hero-3.jpg", title: "New Market Picks" }
  ];
  let idx = 0;
  let secs = 8;
  let paused = false;

  function draw() {
    const item = slides[idx];
    ad.style.backgroundImage = `url('${item.image}')`;
    if (titleEl) titleEl.textContent = item.title;
  }

  draw();
  if (isPhone) return;
  setInterval(() => {
    if (paused) return;
    secs -= 1;
    if (secs <= 0) {
      idx = (idx + 1) % slides.length;
      secs = 8;
    }
    draw();
  }, 1000);

  ad.addEventListener("mouseenter", () => { paused = true; });
  ad.addEventListener("mouseleave", () => { paused = false; });
}

function encodeFormBody(data) {
  return new URLSearchParams(data).toString();
}

function setFormFeedback(feedbackEl, message, isOk) {
  if (!feedbackEl) return;
  feedbackEl.textContent = message || "";
  feedbackEl.classList.toggle("isSuccess", !!isOk);
  feedbackEl.classList.toggle("isError", !!message && !isOk);
}

function connectNetlifyForms() {
  const forms = document.querySelectorAll("form[data-netlify-ajax='true']");
  if (!forms.length) return;

  forms.forEach((form) => {
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    const submitBtn = form.querySelector("[type='submit']");
    const feedbackId = form.id ? `${form.id}Feedback` : "";
    const feedbackEl = feedbackId ? document.getElementById(feedbackId) : form.nextElementSibling;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const payload = new FormData(form);
      const originalText = submitBtn ? submitBtn.textContent : "";
      setFormFeedback(feedbackEl, "", false);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encodeFormBody(payload)
        });

        if (!res.ok) throw new Error("submit_failed");

        form.reset();
        setFormFeedback(
          feedbackEl,
          form.dataset.successMessage || "Submitted successfully.",
          true
        );

        if (form.id === "newsletterSignupForm") {
          localStorage.setItem("rtech_signed_up_newsletter", "1");
          localStorage.setItem("rtech_hide_newsletter", "1");
          const modal = document.getElementById("newsletterModal");
          if (modal && form.dataset.closeOnSuccess === "true") {
            setTimeout(() => {
              modal.classList.remove("isOpen");
            }, 1400);
          }
        }
      } catch (_) {
        setFormFeedback(
          feedbackEl,
          "Submission failed. Please try again in a moment.",
          false
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText || "Submit";
        }
      }
    });
  });
}

/* =========================
   9) START APP
   Note: header loads after include.js fetches it,
   so we refresh WhatsApp links + connect cart buttons twice.
========================= */
/* =========================
   ACCOUNT DRAWER
   GUEST STATE
========================= */

function connectAccountDrawer() {
  const accountBtn = document.getElementById("accountBtn");
  const accountDrawer = document.getElementById("accountDrawer");

  if (!accountBtn || !accountDrawer) return false;

  if (accountDrawer.dataset.bound === "1") return true;
  accountDrawer.dataset.bound = "1";

  const accountPanel = accountDrawer.querySelector(".accountPanel");
  const closeButtons = accountDrawer.querySelectorAll("[data-account-close]");

  function openAccountDrawer() {
    accountDrawer.classList.add("is-open");
    accountDrawer.setAttribute("aria-hidden", "false");
    accountBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function closeAccountDrawer() {
    accountDrawer.classList.remove("is-open");
    accountDrawer.setAttribute("aria-hidden", "true");
    accountBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    accountBtn.focus();
  }

  accountBtn.addEventListener("click", openAccountDrawer);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeAccountDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      accountDrawer.classList.contains("is-open")
    ) {
      closeAccountDrawer();
    }
  });

  return true;
}

function waitForAccountDrawer() {
  if (connectAccountDrawer()) return;
  setTimeout(waitForAccountDrawer, 120);
}


/* =========================
   APP START
========================= */

document.addEventListener("DOMContentLoaded", () => {
  ensureGlobalDrawers();
  syncCartState();
  refreshWhatsAppLinks();
  connectWishlistToggles();
  refreshWishlistUI();
  connectCheckoutForm();
  connectNetlifyForms();
  connectTrendingCarousel();
  connectFlashSaleAd();
  waitForAccountDrawer();
  loadGlobalProducts().then(renderRecommendationGrid).catch(renderRecommendationGrid);

  // Always render from storage immediately before opening the cart and when a
  // page is restored or another tab changes the basket.
  document.addEventListener("click", (event) => {
    if (event.target.closest("#cartBtn")) syncCartState();
    if (event.target.closest("#wishlistBtn")) refreshWishlistUI();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) syncCartState();
    if (event.key === WISHLIST_KEY) refreshWishlistUI();
  });
  window.addEventListener("pageshow", () => {
    syncCartState();
    refreshWishlistUI();
  });

  const newsletterModal = document.getElementById("newsletterModal");
  const closeNewsletterBtn = document.getElementById("closeNewsletterBtn");
  const newsletterDontShow = document.getElementById("newsletterDontShow");
  const promoRotate = document.getElementById("promoRotate");

  if (newsletterModal) {
    const hide = localStorage.getItem("rtech_hide_newsletter") === "1";
    const signedUp = localStorage.getItem("rtech_signed_up_newsletter") === "1";
    if (!hide && !signedUp) {
      setTimeout(() => {
        newsletterModal.classList.add("isOpen");
      }, 900);
    }
  }

  if (closeNewsletterBtn && newsletterModal) {
    closeNewsletterBtn.addEventListener("click", () => {
      newsletterModal.classList.remove("isOpen");
    });
  }

  if (newsletterDontShow) {
    newsletterDontShow.addEventListener("change", (e) => {
      if (e.target.checked) {
        localStorage.setItem("rtech_hide_newsletter", "1");
      } else {
        localStorage.removeItem("rtech_hide_newsletter");
      }
    });
  }

  if (promoRotate) {
    const lines = [
      "Tech gear that fits real life in Kenya.",
      "Curated tech picks. Fast checkout. Fast support.",
      "Kenya-friendly payments (M-Pesa ready).",
      "Fast support on WhatsApp."
    ];
    promoRotate.innerHTML = lines.map((line, i) =>
      `<div class="promoRotateItem${i === 0 ? " isActive" : ""}">${line}</div>`
    ).join("");
    let idx = 0;
    setInterval(() => {
      const items = promoRotate.querySelectorAll(".promoRotateItem");
      items[idx].classList.remove("isActive");
      idx = (idx + 1) % items.length;
      items[idx].classList.add("isActive");
    }, 4000);
  }

  // After partials load, run again to catch the header/footer elements
  setTimeout(() => {
    ensureGlobalDrawers();
    refreshWhatsAppLinks();
    syncCartState();
    refreshWishlistUI();
    connectNetlifyForms();
    connectTrendingCarousel();
    connectFlashSaleAd();
    connectAccountDrawer();
  }, 250);
});
