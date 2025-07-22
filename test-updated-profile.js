// Test updated profile endpoint for role assignments
const http = require("http");

const testUpdatedProfile = () => {
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

      console.log("=== UPDATED PROFILE TEST ===");

      // Test updated profile endpoint
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
          console.log("Profile API Response:");
          console.log("Status:", profileRes.statusCode);

          if (profileRes.statusCode === 200) {
            const profileData = JSON.parse(profileBody);
            console.log("✅ SUCCESS: Profile endpoint updated!");
            console.log("Name:", profileData.data?.full_name);
            console.log("Email:", profileData.data?.email);
            console.log(
              "Has role_location_pairs:",
              !!profileData.data?.role_location_pairs
            );
            console.log(
              "Role-location pairs count:",
              profileData.data?.role_location_pairs?.length || 0
            );
            console.log("Is admin:", profileData.data?.is_admin);
            console.log(
              "Permission level:",
              profileData.data?.permission_level
            );

            if (profileData.data?.role_location_pairs?.length > 0) {
              console.log("\nRole assignments:");
              profileData.data.role_location_pairs.forEach((pair, index) => {
                console.log(
                  `  ${index + 1}. ${pair.role_display_name} at ${
                    pair.location_name
                  }`
                );
              });
            }
          } else {
            console.log("❌ ERROR:", profileBody);
          }
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

console.log("Testing updated profile endpoint...");
testUpdatedProfile();
