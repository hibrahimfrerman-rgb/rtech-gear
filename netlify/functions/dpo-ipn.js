function getTag(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const body = event.body || "";
  const token = getTag(body, "TransactionToken") || getTag(body, "TransToken");
  const result = getTag(body, "Result");
  const explanation = getTag(body, "ResultExplanation");

  console.log("DPO IPN:", { token, result, explanation });

  return {
    statusCode: 200,
    body: "OK"
  };
};
