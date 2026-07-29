(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }
  function show(e) { if (e) { e.hidden = false; e.setAttribute("aria-hidden", "false"); } }
  function hide(e) { if (e) { e.hidden = true; e.setAttribute("aria-hidden", "true"); } }
  function getRadio(name) {
    const c = document.querySelector(`input[name="${name}"]:checked`);
    return c ? c.value : null;
  }
  function isSafaricomPhone(v) {
    const n = String(v || "").replace(/\s+/g, "").replace(/^\+254/, "0");
    return /^(07|01)\d{8}$/.test(n);
  }
  function normalisePhone(v) {
    const c = String(v || "").replace(/\s+/g, "").replace(/^\+/, "");
    return c.startsWith("0") ? "254" + c.slice(1) : c;
  }

  /* ============================================================
     DELIVERY MODE TOGGLE
     ============================================================ */
  function initDeliveryToggle() {
    const radios        = document.querySelectorAll('input[name="deliveryMode"]');
    const shipGroup     = el("shipAddressGroup");
    const speedGroup    = el("deliverySpeedGroup");
    const instrGroup    = el("deliveryInstructionsGroup");
    const shippingSpeed = el("shippingSpeed");

    function updateMode(value) {
      if (value === "pickup") {
        hide(shipGroup);
        hide(speedGroup);
        hide(instrGroup);
        if (shippingSpeed) shippingSpeed.disabled = true;
      } else {
        show(shipGroup);
        show(speedGroup);
        show(instrGroup);
        if (shippingSpeed) shippingSpeed.disabled = false;
      }
    }

    radios.forEach(r => r.addEventListener("change", function () { updateMode(this.value); }));
    updateMode(getRadio("deliveryMode") || "ship");
  }

  /* ============================================================
     ADDRESS AUTOCOMPLETE — OpenStreetMap / Nominatim
     (free, no API key, Kenya-restricted)
     ============================================================ */
  function initPlacesAutocomplete() {
    const input = el("location");
    if (!input) return;

    let dropdown = null;
    let debounceTimer = null;
    let activeIndex = -1;
    let currentResults = [];

    function closeDropdown() {
      if (dropdown) { dropdown.remove(); dropdown = null; }
      activeIndex = -1;
      currentResults = [];
    }

    function openDropdown(results) {
      closeDropdown();
      if (!results.length) return;

      dropdown = document.createElement("div");
      dropdown.className = "pac-container";
      dropdown.setAttribute("role", "listbox");

      const rect = input.getBoundingClientRect();
      dropdown.style.left  = rect.left + "px";
      dropdown.style.top   = (rect.bottom + 4) + "px";
      dropdown.style.width = rect.width + "px";

      results.forEach((r, i) => {
        const item = document.createElement("div");
        item.className = "pac-item";
        item.setAttribute("role", "option");
        item.textContent = r.display_name;
        item.addEventListener("mousedown", function (e) {
          e.preventDefault();
          selectResult(r);
        });
        dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);
      currentResults = results;
    }

    function selectResult(r) {
      input.value = r.display_name;
      const latField = el("locationLat");
      const lngField = el("locationLng");
      if (latField) latField.value = r.lat;
      if (lngField) lngField.value = r.lon;

      show(el("locationConfirmed"));
      clearFieldError(input);
      closeDropdown();
    }

    async function fetchSuggestions(query) {
      if (!query || query.trim().length < 3) { closeDropdown(); return; }
      try {
        const url = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&countrycodes=ke&limit=6&q=" + encodeURIComponent(query);
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) throw new Error("Nominatim request failed");
        const data = await res.json();
        openDropdown(Array.isArray(data) ? data : []);
      } catch (err) {
        closeDropdown();
      }
    }

    input.addEventListener("input", function () {
      hide(el("locationConfirmed"));
      clearTimeout(debounceTimer);
      const query = input.value;
      debounceTimer = setTimeout(() => fetchSuggestions(query), 350);
    });

    input.addEventListener("keydown", function (e) {
      if (!dropdown || !currentResults.length) return;
      const items = dropdown.querySelectorAll(".pac-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        items.forEach((it, i) => it.classList.toggle("pac-item-selected", i === activeIndex));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        items.forEach((it, i) => it.classList.toggle("pac-item-selected", i === activeIndex));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          e.preventDefault();
          selectResult(currentResults[activeIndex]);
        }
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    input.addEventListener("blur", function () {
      setTimeout(closeDropdown, 150);
    });

    window.addEventListener("resize", closeDropdown);
    window.addEventListener("scroll", closeDropdown, true);
  }

  /* ============================================================
     PAYMENT TOGGLE — "Pay with card or PayPal instead"
     ============================================================ */
  function initExpressToggle() {
    const toggle = el("expressMoreToggle");
    const altCard = el("altPaymentCard");
    if (!toggle || !altCard) return;

    toggle.addEventListener("click", function () {
      const expanded = !altCard.hidden;
      if (expanded) {
        hide(altCard);
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("span").textContent = "Pay with card or PayPal instead";
        const mpesa = document.querySelector('input[name="payment"][value="M-Pesa"]');
        if (mpesa) { mpesa.checked = true; syncPaymentUI("M-Pesa"); }
      } else {
        show(altCard);
        toggle.setAttribute("aria-expanded", "true");
        toggle.querySelector("span").textContent = "Hide card and PayPal options";
      }
    });
  }

  /* ============================================================
     PAYMENT RADIOS
     ============================================================ */
  function initPaymentRadios() {
    document.querySelectorAll('input[name="payment"]').forEach(r => {
      r.addEventListener("change", function () { syncPaymentUI(this.value); });
    });
    syncPaymentUI(getRadio("payment") || "M-Pesa");
  }

  function syncPaymentUI(method) {
    const cardFields = el("cardFieldsGrid");
    const payNowBtn = el("payNowBtn");

    if (cardFields) (method === "DPO" ? show : hide)(cardFields);

    if (payNowBtn) {
      if (method === "M-Pesa") {
        payNowBtn.innerHTML = '<i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i> Pay with M-Pesa';
        payNowBtn.style.background = "#16a34a";
      } else if (method === "DPO") {
        payNowBtn.innerHTML = '<i class="fa-solid fa-credit-card" aria-hidden="true"></i> Pay with card';
        payNowBtn.style.background = "#111827";
      } else if (method === "PayPal") {
        payNowBtn.innerHTML = '<i class="fa-brands fa-paypal" aria-hidden="true"></i> Continue to PayPal';
        payNowBtn.style.background = "#0b69ff";
      }
    }
    if (method !== "M-Pesa") hideStkPendingBanner();
  }

  /* ============================================================
     VALIDATION
     ============================================================
     KEY FIX: every field gets a LIVE listener from the very
     start (not just after first submit). Before the first Pay
     click, the listener only ever REMOVES error state (never
     adds it) — so nothing can show prematurely. After the
     first Pay click (hasAttemptedSubmit = true), the listener
     also re-validates and ADDS error state back if the field
     becomes invalid again. Net effect: once a field is correct,
     its red message disappears immediately and stays gone
     unless the user makes it invalid again.
     ============================================================ */
  let hasAttemptedSubmit = false;

  function clearFieldError(inputEl) {
    const group = inputEl.closest(".formGroup");
    if (group) group.classList.remove("hasError");
  }

  function setFieldValidity(groupEl, isValid) {
    if (!groupEl) return;
    groupEl.classList.toggle("hasError", !isValid);
  }

  function fieldValidators() {
    return {
      fullName: () => (el("fullName")?.value || "").trim().length >= 2,
      phone: () => isSafaricomPhone(el("phone")?.value || ""),
      email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el("email")?.value || ""),
      location: () => {
        if (getRadio("deliveryMode") !== "ship") return true;
        return (el("location")?.value || "").trim().length >= 3;
      },
    };
  }

  function validateField(id) {
    const input = el(id);
    if (!input) return true;
    const group = input.closest(".formGroup");
    const validators = fieldValidators();
    const isValid = validators[id] ? validators[id]() : true;
    setFieldValidity(group, isValid);
    return isValid;
  }

  function validateForm() {
    const ids = ["fullName", "phone", "email", "location"];
    let allValid = true;
    ids.forEach(id => { if (!validateField(id)) allValid = false; });
    return allValid;
  }

  function initLiveValidation() {
    const ids = ["fullName", "phone", "email", "location"];
    ids.forEach(id => {
      const input = el(id);
      if (!input) return;

      const recheck = function () {
        // Before first submit: only ever clear errors, never add them.
        // After first submit: fully re-validate (can add or clear).
        if (hasAttemptedSubmit) {
          validateField(id);
        } else {
          const validators = fieldValidators();
          const isValid = validators[id] ? validators[id]() : true;
          if (isValid) clearFieldError(input);
        }
      };

      input.addEventListener("input", recheck);
      input.addEventListener("blur", recheck);
      input.addEventListener("change", recheck);
    });

    // Re-check location validity whenever delivery mode changes
    document.querySelectorAll('input[name="deliveryMode"]').forEach(r => {
      r.addEventListener("change", function () {
        if (hasAttemptedSubmit) validateField("location");
        else {
          const loc = el("location");
          if (loc && fieldValidators().location()) clearFieldError(loc);
        }
      });
    });
  }

  /* ============================================================
     PAYMENT HANDLERS
     ============================================================ */
  async function handlePayment(method) {
    const name = (el("fullName") || {}).value?.trim() || "";
    const phone = normalisePhone((el("phone") || {}).value || "");
    const email = (el("email") || {}).value?.trim() || "";
    const shipping = typeof getCheckoutShippingChoice === "function" ? getCheckoutShippingChoice() : { shippingFee: 0 };
    const cart = typeof getCart === "function" ? getCart() : [];
    const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const total = subtotal + (Number(shipping.shippingFee) || 0);

    // ORDER OBJECT (Sprint 12) — built once, before any payment request is sent.
    // Not saved to localStorage and not sent to any API yet — this is just the
    // in-memory shape that future sprints (STK response, callback confirm,
    // localStorage save) will read from and fill in further.
    // Edit this block to add/remove fields the order needs to carry.
    const order = {
      reference: "RTG-" + Date.now(),
      status: "pending",
      createdAt: new Date().toISOString(),

      customer: {
        name,
        phone,
        email
      },

      items: cart.map((item) => ({ ...item })), // snapshot copy, not a live reference to cart

      totals: {
        subtotal,
        shippingFee: Number(shipping.shippingFee) || 0,
        total,
        currency: (typeof STORE_CONFIG !== "undefined" && STORE_CONFIG.currency) || "KES"
      },

      delivery: {
        county: (el("countySelect") || {}).value || "",
        location: (el("location") || {}).value || "",
        latitude: (el("locationLat") || {}).value || "",
        longitude: (el("locationLng") || {}).value || "",
        notes: (el("notes") || {}).value || "",
        deliveryMode: shipping.deliveryMode || ""
      },

      payment: {
        method,
        checkoutRequestId: null,
        merchantRequestId: null,
        dpoToken: null,
        receipt: null
      }
    };

    if (!cart.length) { alert("Your cart is empty."); return; }

    if (method === "M-Pesa") {
      try {
        const r = await fetch("/.netlify/functions/mpesa-stk", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, name, email, amount: total, reference: order.reference })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "M-Pesa request failed");
        showStkPendingBanner(phone.replace(/^254/, "0"));
        setPaymentStatus("M-Pesa push sent — check your phone");
      } catch (err) {
        alert(err.message || "M-Pesa request failed. Please try again.");
      }
      return;
    }

    if (method === "DPO") {
      try {
        const r = await fetch("/.netlify/functions/dpo-create-token", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, amount: total })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "DPO request failed");
        if (j.paymentUrl) { window.location.href = j.paymentUrl; return; }
        throw new Error("No payment URL returned from DPO.");
      } catch (err) {
        alert(err.message || "Card payment failed. Please try again.");
      }
      return;
    }

    if (method === "PayPal") {
      try {
        const r = await fetch("/.netlify/functions/paypal-create-order", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total, currency: "USD" })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "PayPal request failed");
        const approvalUrl = (j.links || []).find(l => l.rel === "approve")?.href;
        if (approvalUrl) { window.location.href = approvalUrl; return; }
        throw new Error("PayPal approval URL not found.");
      } catch (err) {
        alert(err.message || "PayPal request failed. Please try again.");
      }
      return;
    }

    alert("Select M-Pesa, Card, or PayPal to continue.");
  }

  function initPayBtn() {
    const payNowBtn = el("payNowBtn");
    const form = el("checkoutForm");
    if (!payNowBtn) return;

    payNowBtn.addEventListener("click", async function () {
      hasAttemptedSubmit = true;
      if (form) form.classList.add("show-errors");

      if (!validateForm()) {
        const firstError = document.querySelector(".hasError");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.querySelector("input, select, textarea")?.focus();
        }
        return;
      }

      const method = getRadio("payment") || "M-Pesa";
      this.disabled = true;
      this.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Processing…';
      await handlePayment(method);
      this.disabled = false;
      syncPaymentUI(method);
    });
  }

  /* ============================================================
     WHATSAPP
     ============================================================ */
  function initWhatsAppSupport() {
    const btn = el("whatsAppSupportBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const url = typeof makeWhatsAppLink === "function"
        ? makeWhatsAppLink("Hi R-Tech Gear, I need help with checkout.")
        : "https://wa.me/254700000000";
      window.open(url, "_blank");
    });
  }

  /* ============================================================
     LIVE BADGE
     ============================================================ */
  function pulseLiveBadge() {
    const badge = document.querySelector(".summaryBadge");
    if (!badge) return;
    badge.classList.add("summaryBadge--updating");
    badge.textContent = "Updating";
    setTimeout(() => {
      badge.classList.remove("summaryBadge--updating");
      badge.textContent = "Live";
    }, 700);
  }

  function initLiveBadgeWatcher() {
    const totalEl = el("checkoutTotal");
    if (!totalEl) return;
    new MutationObserver(pulseLiveBadge).observe(totalEl, { childList: true, characterData: true, subtree: true });
  }

  function setPaymentStatus(text) {
    const s = el("checkoutPaymentStatus");
    if (s) s.textContent = text;
  }

  /* ============================================================
     M-PESA STK BANNER
     ============================================================ */
  function showStkPendingBanner(phoneDisplay) {
    let banner = el("mpesaStkBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "mpesaStkBanner";
      banner.className = "mpesaConfirmBanner";
      el("paymentSection")?.querySelector(".payActionRow")?.before(banner);
    }
    banner.innerHTML =
      '<i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>' +
      '<div><strong>Check your phone</strong>' +
      '<span>We sent an M-Pesa request to ' + phoneDisplay + '. Enter your M-Pesa PIN to complete payment. This page updates automatically once confirmed.</span></div>';
    show(banner);
    banner.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideStkPendingBanner() {
    hide(el("mpesaStkBanner"));
  }

  /* ============================================================
     SPRINT 3.0: SHOP BY CATEGORY DROPDOWN (DESKTOP ONLY)
     ------------------------------------------------------------
     WHAT THIS DOES:
     - On desktop (wider than 900px), clicking the "Shop by
       Category" button opens a dropdown panel instead of
       navigating straight to shop.html.
     - Clicking the button again, clicking outside the panel,
       or pressing ESC all close the panel.
     - On mobile/tablet (900px and below) this code does nothing
       extra: the button keeps working exactly as a normal link
       to shop.html, unchanged from before this sprint.
     ============================================================ */
  function initShopByCategoryDropdown() {
    const dropdownWrap  = el("categoryDropdownWrap");
    const triggerButton = el("shopByCategoryBtn");
    const dropdownPanel = el("categoryDropdownPanel");

    // If this page does not have the dropdown markup (e.g. checkout,
    // cart, track), do nothing. This keeps the function safe to call
    // on every page.
    if (!dropdownWrap || !triggerButton || !dropdownPanel) return;

    const DESKTOP_MIN_WIDTH_PX = 901;

    function isDesktopViewport() {
      return window.innerWidth >= DESKTOP_MIN_WIDTH_PX;
    }

    function isDropdownPanelOpen() {
      return dropdownPanel.classList.contains("categoryDropdownPanel--open");
    }

    function openDropdownPanel() {
      dropdownPanel.classList.add("categoryDropdownPanel--open");
      dropdownPanel.setAttribute("aria-hidden", "false");
      triggerButton.setAttribute("aria-expanded", "true");
    }

    function closeDropdownPanel() {
      dropdownPanel.classList.remove("categoryDropdownPanel--open");
      dropdownPanel.setAttribute("aria-hidden", "true");
      triggerButton.setAttribute("aria-expanded", "false");
    }

    // Clicking the button: on desktop, open/close the panel instead
    // of following the link straight to shop.html. On mobile, do
    // nothing here — the browser follows the link exactly as before.
    triggerButton.addEventListener("click", function (clickEvent) {
      if (!isDesktopViewport()) return;
      clickEvent.preventDefault();
      if (isDropdownPanelOpen()) {
        closeDropdownPanel();
      } else {
        openDropdownPanel();
      }
    });

    // Clicking anywhere outside the button/panel closes the panel.
    document.addEventListener("click", function (clickEvent) {
      if (!isDropdownPanelOpen()) return;
      const clickLandedInsideDropdown = dropdownWrap.contains(clickEvent.target);
      if (!clickLandedInsideDropdown) closeDropdownPanel();
    });

    // Pressing ESC closes the panel and returns focus to the button.
    document.addEventListener("keydown", function (keyEvent) {
      if (keyEvent.key === "Escape" && isDropdownPanelOpen()) {
        closeDropdownPanel();
        triggerButton.focus();
      }
    });

    // If the window is resized down to mobile width while the panel
    // is open, close it so it can never get stuck open on a phone.
    window.addEventListener("resize", function () {
      if (!isDesktopViewport() && isDropdownPanelOpen()) closeDropdownPanel();
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function initCheckoutPage() {
    initDeliveryToggle();
    initExpressToggle();
    initPaymentRadios();
    initPayBtn();
    initWhatsAppSupport();
    initLiveBadgeWatcher();
    initLiveValidation();
    initPlacesAutocomplete();

    // Not checkout-only: this also powers the homepage "Shop by
    // Category" dropdown (Sprint 3.0). Safe to call on every page —
    // it exits immediately if the dropdown markup isn't present.
    initShopByCategoryDropdown();
  }

  document.addEventListener("DOMContentLoaded", initCheckoutPage);
})();

