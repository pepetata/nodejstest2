// Simple backend connectivity test
const http = require("http");

// Test backend connectivity
const testConnection = () => {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      console.log("Response body:", body);
    });
  });

  req.on("error", (error) => {
    console.error("Request error:", error.message);
  });

  // Send login request
  const loginData = JSON.stringify({
    email: "flavio_luiz_ferreira@hotmail.com",
    password: "12345678",
  });

  req.write(loginData);
  req.end();
};

console.log("Testing backend connection...");
testConnection();
