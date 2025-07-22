// Test which user is logged in based on URL
const http = require("http");

// From the screenshots, the URL shows padre2.localhost:3000, which suggests
// the chain restaurant user should be logged in

const testChainUser = () => {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/v1/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      const data = JSON.parse(body);
      console.log("Chain User Login Response:");
      console.log("Name:", data.user?.full_name);
      console.log("Email:", data.user?.email);
      console.log("Restaurant:", data.restaurant?.name);
      console.log("Restaurant URL:", data.restaurant?.url);
    });
  });

  req.on("error", (error) => {
    console.error("Request error:", error.message);
  });

  // Test with chain user credentials
  const loginData = JSON.stringify({
    email: "flavio_luiz_ferreira_chain@hotmail.com",
    password: "12345678",
  });

  req.write(loginData);
  req.end();
};

console.log("Testing chain user login...");
testChainUser();
