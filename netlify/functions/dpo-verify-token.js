const DEFAULT_API_URL = "https://secure.3gdirectpay.com/API/v6/";

function getTag(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

exports.handler = async (event) => {
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const { DPO_COMPANY_TOKEN, DPO_API_URL } = process.env;
  if (!DPO_COMPANY_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "DPO is not configured." }) };
  }

  let token = "";
  if (event.httpMethod === "GET") {
    token = (event.queryStringParameters && (event.queryStringParameters.token || event.queryStringParameters.id)) || "";
  } else {
    try {
      const body = JSON.parse(event.body || "{}");
      token = body.token || "";
    } catch {
      token = "";
    }
  }

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing token" }) };
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${token}</TransactionToken>
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
    const status = getTag(text, "TransactionStatus") || getTag(text, "Status");
    const amount = getTag(text, "PaymentAmount");
    const currency = getTag(text, "PaymentCurrency");
    const companyRef = getTag(text, "CompanyRef");

    return {
      statusCode: 200,
      body: JSON.stringify({
        result,
        explanation,
        status,
        amount,
        currency,
        companyRef
      })
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "DPO verify failed" }) };
  }
};
