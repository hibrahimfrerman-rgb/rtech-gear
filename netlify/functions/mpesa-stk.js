exports.handler = async () => {
  return {
    statusCode: 501,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: false,
      message: "M-Pesa not configured yet. Add Daraja credentials in Netlify env vars."
    })
  };
};

