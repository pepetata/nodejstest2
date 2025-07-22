// Test roles and locations endpoints
const http = require("http");

const testRolesAndLocations = () => {
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

      console.log("=== ROLES AND LOCATIONS DEBUG ===");
      console.log("User ID:", loginData.user?.id);
      console.log("User Name:", loginData.user?.full_name);

      // Test /users/roles endpoint
      const rolesOptions = {
        hostname: "localhost",
        port: 5000,
        path: "/api/v1/users/roles",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const rolesReq = http.request(rolesOptions, (rolesRes) => {
        let rolesBody = "";
        rolesRes.on("data", (chunk) => {
          rolesBody += chunk;
        });

        rolesRes.on("end", () => {
          console.log("\n1. /users/roles endpoint:");
          console.log("   Status:", rolesRes.statusCode);

          if (rolesRes.statusCode === 200) {
            const rolesData = JSON.parse(rolesBody);
            console.log("   Roles count:", rolesData.data?.length || 0);
            console.log("   Roles:", JSON.stringify(rolesData.data, null, 2));
          } else {
            console.log("   Error:", rolesBody);
          }

          // Test /users/locations endpoint
          const locationsOptions = {
            hostname: "localhost",
            port: 5000,
            path: "/api/v1/users/locations",
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          };

          const locationsReq = http.request(
            locationsOptions,
            (locationsRes) => {
              let locationsBody = "";
              locationsRes.on("data", (chunk) => {
                locationsBody += chunk;
              });

              locationsRes.on("end", () => {
                console.log("\n2. /users/locations endpoint:");
                console.log("   Status:", locationsRes.statusCode);

                if (locationsRes.statusCode === 200) {
                  const locationsData = JSON.parse(locationsBody);
                  console.log(
                    "   Locations count:",
                    locationsData.data?.length || 0
                  );
                  console.log(
                    "   Locations:",
                    JSON.stringify(locationsData.data, null, 2)
                  );
                } else {
                  console.log("   Error:", locationsBody);
                }

                // Test /users/profile endpoint to see user role assignments
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

                const profileReq = http.request(
                  profileOptions,
                  (profileRes) => {
                    let profileBody = "";
                    profileRes.on("data", (chunk) => {
                      profileBody += chunk;
                    });

                    profileRes.on("end", () => {
                      console.log("\n3. User Profile role assignments:");

                      if (profileRes.statusCode === 200) {
                        const profileData = JSON.parse(profileBody);
                        console.log(
                          "   User has role_location_pairs:",
                          !!profileData.data?.role_location_pairs
                        );
                        console.log(
                          "   Role-location pairs count:",
                          profileData.data?.role_location_pairs?.length || 0
                        );
                        if (profileData.data?.role_location_pairs?.length > 0) {
                          console.log(
                            "   Role-location pairs:",
                            JSON.stringify(
                              profileData.data.role_location_pairs,
                              null,
                              2
                            )
                          );
                        }
                      } else {
                        console.log("   Error:", profileBody);
                      }
                    });
                  }
                );

                profileReq.on("error", (error) => {
                  console.error("Profile request error:", error.message);
                });

                profileReq.end();
              });
            }
          );

          locationsReq.on("error", (error) => {
            console.error("Locations request error:", error.message);
          });

          locationsReq.end();
        });
      });

      rolesReq.on("error", (error) => {
        console.error("Roles request error:", error.message);
      });

      rolesReq.end();
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

console.log("Testing roles and locations endpoints...");
testRolesAndLocations();
