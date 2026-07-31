const { getStore } = require("@netlify/blobs");

/* mpesa-stk.js
   Production Safaricom Daraja STK Push endpoint.
   Called by first-pass.js's handlePayment() when payment method === "M-Pesa".
   Frontend contract (unchanged): POST { phone, name, email, amount } -> { ok, message }
*/

// Sandbox by default; set MPESA_BASE_URL="https://api.safaricom.co.ke" in Netlify env for production.
const DARAJA_BASE_URL = process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke";

// Daraja requires timestamp as YYYYMMDDHHmmss.
function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// Password = base64(Shortcode + Passkey + Timestamp), per Daraja spec.
function getPassword(shortcode, passkey, timestamp) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// Accepts 07XX/01XX/+2547XX/2547XX and normalises to 2547XXXXXXXX / 2541XXXXXXXX.
function normalizeMsisdn(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

// OAuth: exchange consumer key/secret for a short-lived access token.
async function getAccessToken(consumerKey, consumerSecret) {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${credentials}` }
  });

  if (!res.ok) throw new Error("OAuth token request failed");

  const data = await res.json();
  if (!data.access_token) throw new Error("OAuth token missing in response");

  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method not allowed" })
    };
  }

  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL
  } = process.env;

  // Missing-env-var check (same pattern as dpo-create-token.js in this codebase).
  const missing = [];
  if (!MPESA_CONSUMER_KEY) missing.push("MPESA_CONSUMER_KEY");
  if (!MPESA_CONSUMER_SECRET) missing.push("MPESA_CONSUMER_SECRET");
  if (!MPESA_SHORTCODE) missing.push("MPESA_SHORTCODE");
  if (!MPESA_PASSKEY) missing.push("MPESA_PASSKEY");
  if (!MPESA_CALLBACK_URL) missing.push("MPESA_CALLBACK_URL");

  if (missing.length) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "M-Pesa is not configured. Missing environment variables.",
        missing
      })
    };
  }

  // Request body parsing.
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

  const phone = normalizeMsisdn(payload.phone);
  const amount = Math.round(Number(payload.amount || 0));
  // AccountReference max 12 chars, TransactionDesc max 13 chars per Daraja spec.
  const accountReference =
  String(
    payload.reference ||
    payload.orderNumber ||
    payload.orderId ||
    "RTechGear"
  ).slice(0, 12);
  const description = String(payload.description || "RTech order").slice(0, 13);

  if (!/^254(7|1)\d{8}$/.test(phone)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Invalid or missing phone number" })
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Invalid or missing amount" })
    };
  }

  // OAuth step.
  let accessToken;
  try {
    accessToken = await getAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET);
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Unable to authenticate with M-Pesa. Please try again." })
    };
  }

  const timestamp = getTimestamp();
  const password = getPassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

  const stkPayload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: description
  };

  // STK Push step.
  try {
    const stkRes = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(stkPayload)
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: stkData.errorMessage || stkData.ResponseDescription || "STK Push request was rejected."
        })
      };
    }

    const checkoutRequestId = stkData.CheckoutRequestID;

    const correlationStore = getStore("mpesa-correlations");

    await correlationStore.setJSON(accountReference, {
      accountReference,
      checkoutRequestId,
      merchantRequestId: stkData.MerchantRequestID,
      createdAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "STK Push sent. Check your phone to complete payment.",
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID
      })
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "M-Pesa request failed. Please try again." })
    };
  }
};

