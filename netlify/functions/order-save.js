/* order-save.js
   ============================================================
   R-TECH GEAR — ORDER CREATION ENDPOINT (Sprint 4A)
   ============================================================

   WHAT THIS IS:
   POST /.netlify/functions/order-save

   Creates a new order record using the shared order-repository.js
   module, and returns it (including the generated `reference`) to
   the browser.

   WHERE THIS FITS (not wired up yet — Sprint 4A is foundation only):
   In a future sprint, checkout.html's payment flow will call this
   BEFORE mpesa-stk.js / dpo-create-token.js, so the order exists in
   storage first and its `reference` can be sent to the payment
   provider as the AccountReference. That integration is intentionally
   NOT part of this sprint — see Sprint 4A verification checklist.

   REQUEST BODY:
     {
       customer: { name, phone, email },
       items: [ ...cart items... ],
       totals: { subtotal, shippingFee, total, currency },
       delivery: { county, location, latitude, longitude, notes, deliveryMode },
       payment: { method }   // only "method" is meaningful at creation time
     }

   RESPONSE:
     200 { ok: true, order }
     400 { ok: false, message }   // missing/invalid required fields
     500 { ok: false, message }   // repository write failed
   ============================================================ */

const { createOrder } = require("./order-repository");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method not allowed" })
    };
  }

  // Request body parsing — same pattern used by mpesa-stk.js.
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Invalid JSON body" })
    };
  }

  const { customer, items, totals, delivery, payment } = payload;

  // Minimum viable order: someone to deliver to, something to deliver,
  // and a total worth charging. Everything else has safe defaults.
  const errors = [];
  if (!customer || !isNonEmptyString(customer.name)) errors.push("customer.name is required");
  if (!customer || !isNonEmptyString(customer.phone)) errors.push("customer.phone is required");
  if (!Array.isArray(items) || items.length === 0) errors.push("items must be a non-empty array");
  if (!totals || !(Number(totals.total) > 0)) errors.push("totals.total must be greater than 0");

  if (errors.length) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Invalid order data", errors })
    };
  }

  try {
    const order = await createOrder({ customer, items, totals, delivery, payment });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, order })
    };
  } catch (err) {
    // DIAGNOSTIC LOGGING — Sprint 4A/4C forensic fix.
    // The previous catch block discarded `err`, so the real cause of every
    // order-save 500 was invisible in Netlify function logs. This line does
    // NOT change the response the browser sees (still a generic 500) — it
    // only surfaces the real error server-side so we can write the actual fix.
    console.error("order-save: createOrder failed:", err && err.message, err && err.stack);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Could not save order. Please try again." })
    };
  }
};
