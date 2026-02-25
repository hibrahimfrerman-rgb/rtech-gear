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
  currency: "KSh",
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
            <button class="iconBtn" id="cartCloseBtn" type="button" aria-label="Close cart">x</button>
          </div>
          <div class="cartProgress">
            <div class="cartProgressBar">
              <span class="cartProgressFill" id="cartProgressFill"></span>
              <span class="cartProgressCheck" id="cartProgressCheck" aria-hidden="true"></span>
            </div>
            <div class="cartProgressText" id="cartProgressText">Buy KES 0 more to get Free Delivery</div>
          </div>
          <div class="cartItems" id="cartItems"></div>
          <div class="cartEmpty" id="cartEmpty">
            <div class="cartEmptyArt"></div>
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
            <button class="iconBtn" id="wishlistCloseBtn" type="button" aria-label="Close wishlist">x</button>
          </div>
          <div class="cartItems" id="wishlistItems"></div>
        </div>
      </div>
    `;
    document.body.appendChild(wishlistDrawer.firstElementChild);
  }
}

function syncCartState() {
  refreshCartUI();
  renderCheckoutSummary();
  renderCartPage();
}

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getWishlist() {
  const raw = localStorage.getItem(WISHLIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function toggleWishlist(item) {
  const list = getWishlist();
  const exists = list.find((x) => x.id === item.id);
  const next = exists ? list.filter((x) => x.id !== item.id) : [...list, item];
  saveWishlist(next);
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

/* =========================
   4) CART ACTIONS
========================= */
function addToCart(product) {
  const cart = getCart();
  const currency = product.currency || STORE_CONFIG.currency;
  const found = cart.find((item) => item.id === product.id);

  if (found) found.qty += 1;
  else cart.push({ ...product, qty: 1, currency, image: product.image || "" });

  saveCart(cart);
  syncCartState();
  openCart();
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

  const currencies = Object.keys(totals);
  if (currencies.length === 1) {
    lines.push(`Total: ${formatMoney(totals[currencies[0]], currencies[0])}`);
  } else {
    currencies.forEach((cur) => {
      lines.push(`Total ${cur}: ${formatMoney(totals[cur], cur)}`);
    });
  }
  lines.push("");
  lines.push("My name: ____");
  lines.push("My phone: ____");
  lines.push("Delivery location: ____");

  return lines.join("\n");
}

/* =========================
   6) UI RENDER
========================= */
function refreshCartUI() {
  const cart = getCart();

  // Count badge
  const countEl = document.getElementById("cartCount");
  const totalMiniEl = document.getElementById("cartTotalMini");
  if (countEl) {
    const count = cart.reduce((sum, x) => sum + x.qty, 0);
    countEl.textContent = String(count);
  }

  // Drawer elements
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const emptyEl = document.getElementById("cartEmpty");
  const progressFill = document.getElementById("cartProgressFill");
  const progressText = document.getElementById("cartProgressText");
  const progressWrap = progressText ? progressText.closest(".cartProgress") : null;
  const cartTitleIcon = document.querySelector("#cartDrawer .cartTitle .cartIcon");

  if (!itemsEl || !totalEl) return;

  itemsEl.innerHTML = "";
  const totals = totalsByCurrency(cart);

  if (cart.length === 0) {
    if (emptyEl) emptyEl.classList.add("isVisible");
    itemsEl.style.display = "none";
  } else {
    if (emptyEl) emptyEl.classList.remove("isVisible");
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

  if (progressFill && progressText) {
    const subtotal = totals[STORE_CONFIG.currency] || 0;
    const threshold = STORE_CONFIG.freeShippingThreshold;
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    const hit = subtotal >= threshold;

    progressFill.style.width = `${pct}%`;
    if (hit) {
      progressText.textContent = "Congratulations! You've got FREE DELIVERY";
    } else {
      const remaining = Math.max(0, threshold - subtotal);
      progressText.textContent = `Buy KES ${remaining} more to get Free Delivery`;
    }

    if (progressWrap) {
      progressWrap.classList.remove("fp-free-pending", "fp-free-hit");
      progressWrap.classList.add(hit ? "fp-free-hit" : "fp-free-pending");
      progressWrap.style.setProperty("--fp-progress", `${pct}%`);
    }
    if (cartTitleIcon) {
      cartTitleIcon.classList.toggle("fp-free-hit-icon", hit);
    }
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
  const drawer = document.getElementById("wishlistDrawer");
  const itemsEl = document.getElementById("wishlistItems");
  if (itemsEl) {
    itemsEl.innerHTML = "";
    if (!list.length) {
      itemsEl.innerHTML = `<div class="muted small">Your wishlist is empty.</div>`;
    } else {
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
          <button class="cartRowRemove" type="button" aria-label="Remove"
            onclick="toggleWishlist({ id:'${item.id}', name:'${item.name}', price:${item.price}, currency:'${item.currency}', image:'${item.image || ""}' })">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 7h16M9 7V5h6v2m-7 0l1 12h8l1-12"/>
            </svg>
          </button>
        `;
        itemsEl.appendChild(row);
      });
    }
  }
  if (drawer) {
    const countEl = document.getElementById("wishlistCount");
    if (countEl) countEl.textContent = String(list.length);
  }
  document.querySelectorAll("[data-wishlist-id]").forEach((btn) => {
    const id = btn.getAttribute("data-wishlist-id");
    const active = list.some((x) => x.id === id);
    btn.classList.toggle("isActive", active);
  });
}

/* =========================
   6b) CHECKOUT PAGE
========================= */
function renderCheckoutSummary() {
  const itemsEl = document.getElementById("checkoutItems");
  const totalEl = document.getElementById("checkoutTotal");
  if (!itemsEl || !totalEl) return;

  const cart = getCart();
  itemsEl.innerHTML = "";
  const totals = totalsByCurrency(cart);

  if (cart.length === 0) {
    itemsEl.innerHTML = `<p class="muted">Your cart is empty.</p>`;
  } else {
    cart.forEach((item) => {
      const itemTotal = item.price * item.qty;
      const cur = item.currency || STORE_CONFIG.currency;
      const row = document.createElement("div");
      row.className = "summaryRow";
      row.innerHTML = `
        <div class="summaryLeft">
          <div class="summaryName">${item.name}</div>
          <div class="muted small">${formatMoney(item.price, cur)} - Qty ${item.qty}</div>
        </div>
        <div class="summaryPrice">${formatMoney(itemTotal, cur)}</div>
      `;
      itemsEl.appendChild(row);
    });
  }

  const currencies = Object.keys(totals);
  if (currencies.length === 1) {
    totalEl.textContent = formatMoney(totals[currencies[0]], currencies[0]);
  } else if (currencies.length === 0) {
    totalEl.textContent = formatMoney(0, STORE_CONFIG.currency);
  } else {
    totalEl.textContent = "Mixed";
  }
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
  const changePaymentBtn = document.getElementById("changePaymentBtn");
  const paymentModal = document.getElementById("paymentModal");
  const closePaymentModal = document.getElementById("closePaymentModal");
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  const paymentChoice = document.getElementById("paymentChoice");

  if (payNowBtn) {
    payNowBtn.addEventListener("click", async () => {
      const data = new FormData(form);
      const payment = data.get("payment") || "Cash on delivery";

      if (payment === "DPO") {
        const cart = getCart();
        if (!cart.length) {
          alert("Your cart is empty.");
          return;
        }

        const name = String(data.get("fullName") || "").trim();
        const phone = String(data.get("phone") || "").trim();
        const email = String(data.get("email") || "").trim();
        const location = String(data.get("location") || "").trim();

        if (!name || !phone || !email || !location) {
          alert("Please complete your shipping details first.");
          return;
        }

        const totals = totalsByCurrency(cart);
        const currencies = Object.keys(totals);
        if (currencies.length !== 1) {
          alert("Please checkout with one currency at a time.");
          return;
        }

        const currency = currencies[0];
        const amount = Number(totals[currency] || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          alert("Invalid order total.");
          return;
        }

        const reference = `RTG-${Date.now()}`;
        const payload = {
          amount,
          currency,
          reference,
          description: `${STORE_CONFIG.brandName} order (${cart.length} items)`,
          customer: { name, phone, email },
          shipping: { location },
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            currency: item.currency || STORE_CONFIG.currency
          }))
        };

        try {
          payNowBtn.disabled = true;
          payNowBtn.textContent = "Redirecting...";
          const res = await fetch("/api/dpo-create-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json && json.error ? json.error : "DPO setup pending.");
          }
          if (!json.paymentUrl) {
            throw new Error("DPO setup pending.");
          }

          localStorage.setItem("rtech_last_order", JSON.stringify({
            reference,
            amount,
            currency,
            name,
            phone,
            email
          }));

          window.location.href = json.paymentUrl;
        } catch (err) {
          alert(err.message || "DPO setup pending.");
        } finally {
          payNowBtn.disabled = false;
          payNowBtn.textContent = "Pay now";
        }
        return;
      }

      if (payment === "M-Pesa") {
        try {
          const res = await fetch("/api/mpesa-stk", { method: "POST" });
          const json = await res.json();
          alert(json.message || "M-Pesa setup pending.");
        } catch (err) {
          alert("M-Pesa setup pending.");
        }
        return;
      }

      if (payment === "PayPal") {
        try {
          const res = await fetch("/api/paypal-create-order", { method: "POST" });
          const json = await res.json();
          alert(json.message || "PayPal setup pending.");
        } catch (err) {
          alert("PayPal setup pending.");
        }
        return;
      }

      alert("Cash on delivery does not need Pay now. Use Place order.");
    });
  }

  function openModal() {
    if (paymentModal) paymentModal.classList.add("isOpen");
  }

  function closeModal() {
    if (paymentModal) paymentModal.classList.remove("isOpen");
  }

  if (changePaymentBtn) changePaymentBtn.addEventListener("click", openModal);
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
        paymentChoice.querySelector(".payBadge").textContent = modalSelection.value;
        paymentChoice.querySelector(".payTitle").textContent = modalSelection.value === "PayPal"
          ? "Cards, bank or balance"
          : "Cards, M-Pesa, Bank Transfer or Mobile Money";
        if (modalSelection.value === "DPO") {
          paymentChoice.querySelector(".payTitle").textContent = "Cards, M-Pesa, Bank Transfer or Mobile Money";
          paymentChoice.querySelector(".muted.small").textContent = "Pay securely on checkout.";
        }
      }
      closeModal();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) return;

    const data = new FormData(form);
    const name = data.get("fullName") || "";
    const phone = data.get("phone") || "";
    const location = data.get("location") || "";
    const notes = data.get("notes") || "";
    const payment = data.get("payment") || "Cash on delivery";

    let lines = [];
    lines.push(`Hi ${STORE_CONFIG.brandName}, I want to order:`);
    cart.forEach((item) => {
      const itemTotal = item.price * item.qty;
      const cur = item.currency || STORE_CONFIG.currency;
      lines.push(`- ${item.name} x${item.qty} (${formatMoney(itemTotal, cur)})`);
    });
    const totals = totalsByCurrency(cart);
    const currencies = Object.keys(totals);
    if (currencies.length === 1) {
      lines.push(`Total: ${formatMoney(totals[currencies[0]], currencies[0])}`);
    } else {
      currencies.forEach((cur) => {
        lines.push(`Total ${cur}: ${formatMoney(totals[cur], cur)}`);
      });
    }
    lines.push(`Payment: ${payment}`);
    lines.push("");
    lines.push(`Name: ${name}`);
    lines.push(`Phone: ${phone}`);
    lines.push(`Location: ${location}`);
    if (notes) lines.push(`Notes: ${notes}`);

    window.open(makeWhatsAppLink(lines.join("\n")), "_blank");
  });
}

/* =========================
   7) CART/WISHLIST BUTTONS
   (Moved to assets/js/cart.js and assets/js/wishlist.js)
========================= */

function connectWishlistToggles() {
  document.addEventListener("click", (e) => {
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

/* =========================
   9) START APP
   Note: header loads after include.js fetches it,
   so we refresh WhatsApp links + connect cart buttons twice.
========================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureGlobalDrawers();
  syncCartState();
  refreshWhatsAppLinks();
  connectWishlistToggles();
  refreshWishlistUI();
  connectCheckoutForm();
  connectTrendingCarousel();
  connectFlashSaleAd();

  const newsletterModal = document.getElementById("newsletterModal");
  const closeNewsletterBtn = document.getElementById("closeNewsletterBtn");
  const newsletterDontShow = document.getElementById("newsletterDontShow");
  const promoRotate = document.getElementById("promoRotate");

  if (newsletterModal) {
    const hide = localStorage.getItem("rtech_hide_newsletter") === "1";
    if (!hide) {
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
    connectTrendingCarousel();
    connectFlashSaleAd();
  }, 250);
});
