/* order-update-payment.js
   ============================================================
   R-TECH GEAR — ORDER PAYMENT UPDATE ENDPOINT (Sprint 4A)
   ============================================================

   WHAT THIS IS:
   POST /.netlify/functions/order-update-payment

   Updates ONLY the `status` and `payment` fields on an existing
   order, using the shared order-repository.js module. Every other
   field on the order (customer, items, totals, delivery) is left
   exactly as it was — see the IMMUTABILITY CONTRACT in
   order-repository.js.

   WHERE THIS FITS (not wired up yet — Sprint 4A is foundation only):
   In a future sprint, mpesa-callback.js will call this once it
   receives Safaricom's asynchronous confirmation, using the
   `checkoutRequestId` it already reads from the callback body,
   correlated back to an order reference via the existing
   "mpesa-correlations" Blobs store. That integration is
   intentionally NOT part of this sprint.

   REQUEST BODY:
     {
       reference: "RTG-1738583020123",   // required — which order
       status: "paid",                    // optional — new status
       payment: {                         // optional — merged, not replaced
         checkoutRequestId, merchantRequestId, dpoToken, receipt
       }
     }

   RESPONSE:
     200 { ok: true, order }
     400 { ok: false, message }   // missing reference
     404 { ok: false, message }   // no order found for that reference
     500 { ok: false, message }   // repository write failed
   ============================================================ */

const { updateOrderPayment } = require("./order-repository");

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

  const { reference, status, payment } = payload;

  if (!isNonEmptyString(reference)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "reference is required" })
    };
  }

  try {
    const order = await updateOrderPayment(reference, { status, payment });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, order })
    };
  } catch (err) {
    // updateOrderPayment throws a plain Error("Order <ref> not found")
    // when the record doesn't exist — treat that specific case as 404,
    // anything else as an unexpected repository failure.
    const notFound = /not found/i.test(err.message || "");
    return {
      statusCode: notFound ? 404 : 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: notFound ? `Order ${reference} not found` : "Could not update order. Please try again."
      })
    };
  }
};
