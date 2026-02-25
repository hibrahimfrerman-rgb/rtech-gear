exports.handler = async () => {
  return {
    statusCode: 501,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: false,
      message: "PayPal not configured yet."
    })
  };
};

