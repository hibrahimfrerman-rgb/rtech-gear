/* order-repository.js
   ============================================================
   R-TECH GEAR — ORDER REPOSITORY (Sprint 4A)
   ============================================================

   WHAT THIS FILE IS:
   A shared data-access module for Order records. It is NOT a Netlify
   Function (it has no exports.handler) — it is a plain library that
   other functions `require()` so every part of the app reads and
   writes orders the exact same way.

   WHY THIS EXISTS:
   Before this sprint, order data only ever lived as an in-memory
   object inside first-pass.js and was thrown away the moment
   handlePayment() returned (see M-PESA_CURRENT_STATE audit, Report 2).
   This file gives that order object a permanent home, and gives every
   future payment provider (M-Pesa, DPO, PayPal) one single place to
   create and update orders instead of each one inventing its own
   Blobs logic.

   STORAGE CONTRACT:
   - Blob store name : "rtech-orders"
   - Blob key         : order.reference   (e.g. "RTG-1738583020123")
   - Stored value     : the full Order object shape below

   ORDER SHAPE (mirrors the in-memory `order` object first-pass.js
   already builds in handlePayment(), so existing checkout code can
   be pointed at this repository later with minimal changes):

     {
       reference   : "RTG-<timestamp>",
       status      : "pending" | "paid" | "failed" | ...,
       createdAt   : ISO date string,
       updatedAt   : ISO date string,
       customer    : { name, phone, email },
       items       : [ ...cart items... ],
       totals      : { subtotal, shippingFee, total, currency },
       delivery    : { county, location, latitude, longitude, notes, deliveryMode },
       payment     : { method, checkoutRequestId, merchantRequestId, dpoToken, receipt }
     }

   IMMUTABILITY CONTRACT (read this before editing updateOrderPayment):
   Once an order is created, ONLY its `status` and `payment` fields are
   ever allowed to change. `customer`, `items`, `totals`, and `delivery`
   are set once at creation and must never be rewritten by a payment
   update — a payment confirming does not change what was ordered or
   who ordered it.
   ============================================================ */

const { getStore } = require("@netlify/blobs");

const ORDER_STORE_NAME = "rtech-orders";

// Single place that opens the Blobs store, so the store name above is
// the only line anyone needs to change if it's ever renamed.
function ordersStore() {
  return getStore(ORDER_STORE_NAME);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/* ------------------------------------------------------------
   buildOrder(input)
   Builds a brand-new Order object with every field the rest of the
   app expects (checkout summary, track.html). Only `reference`,
   `status`, `createdAt`, and `updatedAt` are generated here —
   everything else must be supplied by the caller.
------------------------------------------------------------ */
function buildOrder({ customer, items, totals, delivery, payment } = {}) {
  const now = new Date().toISOString();

  return {
    reference: `RTG-${Date.now()}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,

    customer: {
      name: (customer && customer.name) || "",
      phone: (customer && customer.phone) || "",
      email: (customer && customer.email) || ""
    },

    items: Array.isArray(items) ? items : [],

    totals: {
      subtotal: Number((totals && totals.subtotal) || 0),
      shippingFee: Number((totals && totals.shippingFee) || 0),
      total: Number((totals && totals.total) || 0),
      currency: (totals && totals.currency) || "KES"
    },

    delivery: {
      county: (delivery && delivery.county) || "",
      location: (delivery && delivery.location) || "",
      latitude: (delivery && delivery.latitude) || "",
      longitude: (delivery && delivery.longitude) || "",
      notes: (delivery && delivery.notes) || "",
      deliveryMode: (delivery && delivery.deliveryMode) || "ship"
    },

    payment: {
      method: (payment && payment.method) || "",
      checkoutRequestId: (payment && payment.checkoutRequestId) || null,
      merchantRequestId: (payment && payment.merchantRequestId) || null,
      dpoToken: (payment && payment.dpoToken) || null,
      receipt: (payment && payment.receipt) || null
    }
  };
}

/* ------------------------------------------------------------
   createOrder(orderInput)
   Builds and persists a brand-new order. Refuses to overwrite an
   existing record at the same key — references are timestamp-based
   so a collision should only ever mean a genuine bug or a retried
   request, and silently overwriting an order is never correct.
------------------------------------------------------------ */
async function createOrder(orderInput) {
  const order = buildOrder(orderInput);
  const store = ordersStore();

  const existing = await store.get(order.reference, { type: "json" }).catch(() => null);
  if (existing) {
    throw new Error(`Order ${order.reference} already exists`);
  }

  await store.setJSON(order.reference, order);
  return order;
}

/* ------------------------------------------------------------
   getOrder(reference)
   Reads a single order by its reference. Returns null when the
   record doesn't exist (or the store read fails) — callers decide
   what "not found" should mean for their own response.
------------------------------------------------------------ */
async function getOrder(reference) {
  if (!isNonEmptyString(reference)) return null;
  const store = ordersStore();
  return store.get(reference, { type: "json" }).catch(() => null);
}

/* ------------------------------------------------------------
   updateOrderPayment(reference, { status, payment })
   THE ONLY function in this repository allowed to change an order
   after creation. It only ever touches `status` and `payment`
   (merged field-by-field, not replaced) — everything else on the
   existing record is copied through untouched. See the
   IMMUTABILITY CONTRACT note at the top of this file.
------------------------------------------------------------ */
async function updateOrderPayment(reference, { status, payment } = {}) {
  const existing = await getOrder(reference);
  if (!existing) {
    throw new Error(`Order ${reference} not found`);
  }

  const updated = {
    ...existing,
    status: status || existing.status,
    payment: {
      ...existing.payment,
      ...payment
    },
    updatedAt: new Date().toISOString()
  };

  const store = ordersStore();
  await store.setJSON(reference, updated);
  return updated;
}

module.exports = {
  ORDER_STORE_NAME,
  buildOrder,
  createOrder,
  getOrder,
  updateOrderPayment
};
