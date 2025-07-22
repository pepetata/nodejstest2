// Test getting the user by ID from user management endpoint
const http = require("http");

const testUserManagementView = () => {
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
      const userId = loginData.user.id;

      console.log("=== USER MANAGEMENT VIEW COMPARISON ===");
      console.log("User ID:", userId);
      console.log("User Name:", loginData.user?.full_name);

      // Test getting the user via the user management endpoint (/users/:id)
      const userMgmtOptions = {
        hostname: "localhost",
        port: 5000,
        path: `/api/v1/users/${userId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const userMgmtReq = http.request(userMgmtOptions, (userRes) => {
        let userBody = "";
        userRes.on("data", (chunk) => {
          userBody += chunk;
        });

        userRes.on("end", () => {
          console.log("\n1. User Management View (/users/:id):");
          console.log("   Status:", userRes.statusCode);

          if (userRes.statusCode === 200) {
            const userData = JSON.parse(userBody);
            console.log("   User Name:", userData.data?.full_name);
            console.log(
              "   Has role_location_pairs:",
              !!userData.data?.role_location_pairs
            );
            console.log(
              "   Role-location pairs count:",
              userData.data?.role_location_pairs?.length || 0
            );
            if (userData.data?.role_location_pairs?.length > 0) {
              console.log(
                "   Role-location pairs:",
                JSON.stringify(userData.data.role_location_pairs, null, 2)
              );
            }
            console.log("   Is admin:", userData.data?.is_admin);
            console.log(
              "   Permission Level:",
              userData.data?.permission_level
            );
          } else {
            console.log("   Error:", userBody);
          }

          // Also test the users list endpoint to see how this user appears
          const usersListOptions = {
            hostname: "localhost",
            port: 5000,
            path: `/api/v1/users?search=${encodeURIComponent(
              loginData.user.email
            )}`,
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          };

          const usersListReq = http.request(usersListOptions, (listRes) => {
            let listBody = "";
            listRes.on("data", (chunk) => {
              listBody += chunk;
            });

            listRes.on("end", () => {
              console.log("\n2. Users List View (/users with search):");
              console.log("   Status:", listRes.statusCode);

              if (listRes.statusCode === 200) {
                const listData = JSON.parse(listBody);
                const matchingUser = listData.data?.find(
                  (u) => u.id === userId
                );
                if (matchingUser) {
                  console.log("   User Name:", matchingUser.full_name);
                  console.log(
                    "   Has role_location_pairs:",
                    !!matchingUser.role_location_pairs
                  );
                  console.log(
                    "   Role-location pairs count:",
                    matchingUser.role_location_pairs?.length || 0
                  );
                  if (matchingUser.role_location_pairs?.length > 0) {
                    console.log(
                      "   Role-location pairs:",
                      JSON.stringify(matchingUser.role_location_pairs, null, 2)
                    );
                  }
                  console.log("   Is admin:", matchingUser.is_admin);
                } else {
                  console.log("   User not found in search results");
                }
              } else {
                console.log("   Error:", listBody);
              }
            });
          });

          usersListReq.on("error", (error) => {
            console.error("Users list request error:", error.message);
          });

          usersListReq.end();
        });
      });

      userMgmtReq.on("error", (error) => {
        console.error("User management request error:", error.message);
      });

      userMgmtReq.end();
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

console.log("Testing user management view...");
testUserManagementView();
