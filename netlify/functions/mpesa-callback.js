exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method Not Allowed"
      })
    };
  }
  let callback = {};

try {
  callback = JSON.parse(event.body || "{}");
} catch (error) {

  console.error("Invalid callback JSON");

  return {
    statusCode: 400,
    body: JSON.stringify({
      error: "Invalid callback data"
    })
  };

}

  console.log("========== M-PESA CALLBACK ==========");
  console.log(JSON.stringify(callback, null, 2));
  console.log("=====================================");
  const stkCallback =
  callback?.Body?.stkCallback ||
  callback?.body?.stkCallback;

  if (!stkCallback) {

    console.log("Waiting for STK callback payload...");

    return {
      statusCode: 200,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Accepted"
    })
  };

}

  const resultCode = stkCallback.ResultCode;
  const resultDescription = stkCallback.ResultDesc;

  console.log("Result Code:", resultCode);
  console.log("Result Description:", resultDescription);

  if (resultCode === 0) {

  console.log("✅ PAYMENT SUCCESSFUL");

  const callbackItems = stkCallback.CallbackMetadata?.Item || [];

  const amount =
    callbackItems.find(item => item.Name === "Amount")?.Value;

  const receipt =
    callbackItems.find(item => item.Name === "MpesaReceiptNumber")?.Value;

  const phone =
    callbackItems.find(item => item.Name === "PhoneNumber")?.Value;

  const transactionDate =
    callbackItems.find(item => item.Name === "TransactionDate")?.Value;

  console.log("Amount:", amount);
  console.log("Receipt:", receipt);
  console.log("Phone:", phone);
  console.log("Transaction Date:", transactionDate);

  const checkoutRequestId = stkCallback.CheckoutRequestID;
  const merchantRequestId = stkCallback.MerchantRequestID;

  const paymentResult = {
    method: "M-Pesa",
    status: "paid",
    resultCode,
    resultDescription,
    checkoutRequestId,
    merchantRequestId,
    amount,
    receipt,
    phone,
    transactionDate
  };

  console.log("M-Pesa Payment Result:");
  console.log(JSON.stringify(paymentResult, null, 2));

} else {

  console.log("❌ PAYMENT FAILED");

}

return {
  statusCode: 200,
  body: JSON.stringify({
    ResultCode: 0,
    ResultDesc: "Accepted"
  })
};

};