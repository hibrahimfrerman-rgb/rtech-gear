const DEFAULT_API_URL = "https://secure.3gdirectpay.com/API/v6/";

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getTag(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const {
    DPO_COMPANY_TOKEN,
    DPO_SERVICE_TYPE,
    DPO_API_URL,
    DPO_REDIRECT_URL,
    DPO_BACK_URL,
    DPO_PAYMENT_URL,
    DPO_PAYMENT_TOKEN_PARAM
  } = process.env;

  if (!DPO_COMPANY_TOKEN || !DPO_SERVICE_TYPE || !DPO_REDIRECT_URL || !DPO_BACK_URL || !DPO_PAYMENT_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "DPO is not configured. Missing env vars."
      })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const amount = Number(payload.amount || 0);
  const currency = String(payload.currency || "KES").toUpperCase();
  const reference = String(payload.reference || "").trim();
  const description = String(payload.description || "Order").trim();
  const customer = payload.customer || {};

  if (!Number.isFinite(amount) || amount <= 0 || !reference) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid order amount or reference" }) };
  }

  const [firstName, ...rest] = String(customer.name || "").trim().split(" ");
  const lastName = rest.join(" ");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(DPO_COMPANY_TOKEN)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${escapeXml(amount.toFixed(2))}</PaymentAmount>
    <PaymentCurrency>${escapeXml(currency)}</PaymentCurrency>
    <CompanyRef>${escapeXml(reference)}</CompanyRef>
    <RedirectURL>${escapeXml(DPO_REDIRECT_URL)}</RedirectURL>
    <BackURL>${escapeXml(DPO_BACK_URL)}</BackURL>
    <CompanyRefUnique>1</CompanyRefUnique>
    <PTL>5</PTL>
    <CustomerFirstName>${escapeXml(firstName || "Customer")}</CustomerFirstName>
    <CustomerLastName>${escapeXml(lastName || " ")}</CustomerLastName>
    <CustomerEmail>${escapeXml(customer.email || "no-reply@example.com")}</CustomerEmail>
    <CustomerPhone>${escapeXml(customer.phone || "")}</CustomerPhone>
    <ServiceDescription>${escapeXml(description)}</ServiceDescription>
    <ServiceDate>${escapeXml(new Date().toISOString())}</ServiceDate>
    <ServiceType>${escapeXml(DPO_SERVICE_TYPE)}</ServiceType>
  </Transaction>
</API3G>`;

  try {
    const res = await fetch(DPO_API_URL || DEFAULT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml
    });
    const text = await res.text();
    const result = getTag(text, "Result");
    const explanation = getTag(text, "ResultExplanation");
    const token = getTag(text, "TransToken") || getTag(text, "TransactionToken");

    if (!res.ok || !token) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: explanation || "Failed to create DPO token",
          result
        })
      };
    }

    const param = DPO_PAYMENT_TOKEN_PARAM || "ID";
    const joiner = DPO_PAYMENT_URL.includes("?") ? "&" : "?";
    const paymentUrl = `${DPO_PAYMENT_URL}${joiner}${param}=${encodeURIComponent(token)}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        result,
        paymentUrl
      })
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "DPO request failed" })
    };
  }
};
