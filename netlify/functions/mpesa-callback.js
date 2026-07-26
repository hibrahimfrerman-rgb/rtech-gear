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

  return {
    statusCode: 200,
    body: JSON.stringify({
      ResultCode: 0,
      ResultDesc: "Accepted"
    })
  };

};