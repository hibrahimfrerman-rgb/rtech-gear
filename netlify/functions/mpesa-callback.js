const { getStore } = require("@netlify/blobs");
const { blobOptions } = require("./blob-context");
const { getOrder, updateOrderPayment } = require("./order-repository");
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

  const paymentStatus =
    resultCode === 0 ? "paid" : "failed";

  console.log("Result Code:", resultCode);
  console.log("Result Description:", resultDescription);

  // PATCH 4D — CALLBACK HARDENING.
  // Ids are needed for BOTH paid and failed callbacks, so they are read once here.
  const checkoutRequestId = stkCallback.CheckoutRequestID;
  const merchantRequestId = stkCallback.MerchantRequestID;

  // Fields known for every callback. Success-only fields (amount, receipt,
  // phone, transactionDate) are added below, so a failed callback never
  // overwrites anything with empty values.
  let paymentResult = {
    method: "M-Pesa",
    status: paymentStatus,
    resultCode,
    resultDescription,
    checkoutRequestId,
    merchantRequestId
  };

  if (resultCode === 0) {
    console.log("✅ PAYMENT SUCCESSFUL");

    const callbackItems = stkCallback.CallbackMetadata?.Item || [];

    const amount = callbackItems.find(item => item.Name === "Amount")?.Value;
    const receipt = callbackItems.find(item => item.Name === "MpesaReceiptNumber")?.Value;
    const phone = callbackItems.find(item => item.Name === "PhoneNumber")?.Value;
    const transactionDate = callbackItems.find(item => item.Name === "TransactionDate")?.Value;

    console.log("Amount:", amount);
    console.log("Receipt:", receipt);
    console.log("Phone:", phone);
    console.log("Transaction Date:", transactionDate);

    paymentResult = { ...paymentResult, amount, receipt, phone, transactionDate };
  } else {
    console.log("❌ PAYMENT FAILED");
  }

  console.log("M-Pesa Payment Result:");
  console.log(JSON.stringify(paymentResult, null, 2));

  // Non-200 = "NOT handled". paymentResult is already logged above, so a
  // paid-but-unrecorded payment can always be reconciled from the logs.
  const notHandled = (message) => ({
    statusCode: 500,
    body: JSON.stringify({ ResultCode: 1, ResultDesc: message })
  });

  // Resolve which order this callback belongs to (needed for paid AND failed).
  let correlation = null;
  try {
    correlation = await getStore("mpesa-correlations", blobOptions()).get(checkoutRequestId, {
      type: "json"
    });
  } catch (error) {
    console.error("Correlation lookup failed:", error);
    return notHandled("Correlation lookup failed");
  }

  const accountReference = correlation?.accountReference || null;

  if (!accountReference) {
    console.error("UNRECONCILED M-PESA CALLBACK: no order correlation for", checkoutRequestId);
    return notHandled("No order correlation found");
  }

  const existingOrder = await getOrder(accountReference);

  if (!existingOrder) {
    console.error("UNRECONCILED M-PESA CALLBACK: order not found:", accountReference);
    return notHandled("Order not found");
  }

  // Idempotency: a "paid" order is final. Never rewrite or downgrade it.
  if (existingOrder.status === "paid") {
    if (existingOrder.payment?.checkoutRequestId === checkoutRequestId) {
      console.log("Duplicate callback ignored (already recorded):", checkoutRequestId);
    } else if (paymentStatus === "paid") {
      console.error("DUPLICATE PAYMENT — order already paid, second payment needs refund/review:", accountReference, JSON.stringify(paymentResult));
    } else {
      console.log("Failed callback ignored — order already paid:", accountReference);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" })
    };
  }

  try {
    await updateOrderPayment(accountReference, {
      status: paymentStatus,
      payment: paymentResult
    });
  } catch (error) {
    console.error("Failed to update order payment:", error);
    return notHandled("Order update failed");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ResultCode: 0,
      ResultDesc: "Accepted"
    })
  };

};