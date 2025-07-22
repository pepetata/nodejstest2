// Compare auth/me vs users/profile endpoints
const http = require("http");

const compareEndpoints = () => {
  // First login to get token
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

      console.log("=== ENDPOINT COMPARISON ===");

      // Test /auth/me endpoint
      const authMeOptions = {
        hostname: "localhost",
        port: 5000,
        path: "/api/v1/auth/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const authMeReq = http.request(authMeOptions, (authRes) => {
        let authBody = "";
        authRes.on("data", (chunk) => {
          authBody += chunk;
        });

        authRes.on("end", () => {
          console.log("1. /auth/me endpoint:");
          console.log("   Status:", authRes.statusCode);

          if (authRes.statusCode === 200) {
            const authData = JSON.parse(authBody);
            console.log("   User name:", authData.user?.full_name);
            console.log("   User email:", authData.user?.email);
            console.log("   User ID:", authData.user?.id);
          } else {
            console.log("   Error:", authBody);
          }

          // Test /users/profile endpoint
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
              console.log("\n2. /users/profile endpoint:");
              console.log("   Status:", profileRes.statusCode);

              if (profileRes.statusCode === 200) {
                const profileData = JSON.parse(profileBody);
                console.log("   User name:", profileData.data?.full_name);
                console.log("   User email:", profileData.data?.email);
                console.log("   User ID:", profileData.data?.id);

                // Compare the two
                console.log("\n3. COMPARISON:");
                if (authRes.statusCode === 200) {
                  const authData = JSON.parse(authBody);
                  console.log(
                    "   Names match:",
                    authData.user?.full_name === profileData.data?.full_name
                  );
                  console.log("   /auth/me name:", authData.user?.full_name);
                  console.log(
                    "   /users/profile name:",
                    profileData.data?.full_name
                  );
                }
              } else {
                console.log("   Error:", profileBody);
              }
            });
          });

          profileReq.on("error", (error) => {
            console.error("Profile request error:", error.message);
          });

          profileReq.end();
        });
      });

      authMeReq.on("error", (error) => {
        console.error("Auth/me request error:", error.message);
      });

      authMeReq.end();
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

console.log("Comparing /auth/me vs /users/profile endpoints...");
compareEndpoints();
