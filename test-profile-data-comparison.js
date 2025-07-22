// Test profile endpoint with chain user token
const http = require("http");

// First get the token, then test the profile endpoint
const testChainUserProfile = () => {
  // Step 1: Login to get token
  const loginOptions = {
    hostname: "localhost",
    port: 5000,
    path: "/api/v1/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const loginReq = http.request(loginOptions, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      const loginData = JSON.parse(body);
      const token = loginData.token;

      console.log("=== LOGIN DATA ===");
      console.log("Name:", loginData.user?.full_name);
      console.log("Email:", loginData.user?.email);
      console.log("Restaurant:", loginData.restaurant?.name);
      console.log("User ID:", loginData.user?.id);

      // Step 2: Use token to get profile
      const profileOptions = {
        hostname: "localhost",
        port: 5000,
        path: "/api/v1/users/profile",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const profileReq = http.request(profileOptions, (profileRes) => {
        let profileBody = "";
        profileRes.on("data", (chunk) => {
          profileBody += chunk;
        });

        profileRes.on("end", () => {
          const profileData = JSON.parse(profileBody);

          console.log("\n=== PROFILE API DATA ===");
          console.log("Status:", profileRes.statusCode);
          console.log("Name:", profileData.data?.full_name);
          console.log("Email:", profileData.data?.email);
          console.log("User ID:", profileData.data?.id);
          console.log("Phone:", profileData.data?.phone);
          console.log("WhatsApp:", profileData.data?.whatsapp);

          console.log("\n=== DATA COMPARISON ===");
          console.log("Login name:", loginData.user?.full_name);
          console.log("Profile name:", profileData.data?.full_name);
          console.log(
            "Names match:",
            loginData.user?.full_name === profileData.data?.full_name
          );
        });
      });

      profileReq.on("error", (error) => {
        console.error("Profile request error:", error.message);
      });

      profileReq.end();
    });
  });

  loginReq.on("error", (error) => {
    console.error("Login request error:", error.message);
  });

  const loginData = JSON.stringify({
    email: "flavio_luiz_ferreira_chain@hotmail.com",
    password: "12345678",
  });

  loginReq.write(loginData);
  loginReq.end();
};

console.log("Testing chain user profile API...");
testChainUserProfile();
