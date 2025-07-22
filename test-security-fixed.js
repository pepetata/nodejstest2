const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function testRestaurantIsolation() {
  console.log("🔒 TESTING RESTAURANT ISOLATION SECURITY");
  console.log("=========================================");

  try {
    // Test 1: Login as Restaurant Administrator
    console.log("🔐 Logging in as flavio_luiz_ferreira@hotmail.com...");

    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: "flavio_luiz_ferreira@hotmail.com",
      password: "admin123",
    });

    if (
      !loginResponse.data ||
      !loginResponse.data.user ||
      !loginResponse.data.token
    ) {
      console.log("❌ TEST ERROR: Invalid login response structure");
      return;
    }

    const { user, token } = loginResponse.data;
    const userRestaurantId = user.restaurant_id;

    console.log(`✅ Login successful! User restaurant_id: ${userRestaurantId}`);
    console.log(`👤 User role: ${user.role || user.primaryRole?.role_name}`);

    // Test 2: Get users (should only return users from same restaurant)
    console.log("\n📋 Testing user access...");

    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (
      !usersResponse.data ||
      !usersResponse.data.data ||
      !Array.isArray(usersResponse.data.data)
    ) {
      console.log("❌ TEST ERROR: Invalid users response structure");
      console.log("Response:", JSON.stringify(usersResponse.data, null, 2));
      return;
    }

    const users = usersResponse.data.data;
    console.log(`📊 Total users returned: ${users.length}`);

    // Check if all users belong to the same restaurant
    const uniqueRestaurantIds = [...new Set(users.map((u) => u.restaurant_id))];
    console.log(
      `🏢 Unique restaurant IDs in results: ${uniqueRestaurantIds.length}`
    );

    if (
      uniqueRestaurantIds.length === 1 &&
      uniqueRestaurantIds[0] === userRestaurantId
    ) {
      console.log(
        "✅ SECURITY CHECK PASSED: All users belong to same restaurant"
      );
      console.log(`✅ Restaurant ID isolation working: ${userRestaurantId}`);
    } else {
      console.log(
        "❌ SECURITY VULNERABILITY: Users from different restaurants found!"
      );
      console.log("Restaurant IDs found:", uniqueRestaurantIds);
      console.log("Expected restaurant ID:", userRestaurantId);

      // Show which users belong to other restaurants
      const foreignUsers = users.filter(
        (u) => u.restaurant_id !== userRestaurantId
      );
      if (foreignUsers.length > 0) {
        console.log("🚨 FOREIGN USERS FOUND:");
        foreignUsers.forEach((u) => {
          console.log(
            `  - ${u.full_name} (${u.email}) from restaurant ${u.restaurant_id}`
          );
        });
      }
    }

    // Test 3: User details for each user
    console.log("\n🔍 Testing individual user access...");
    for (let i = 0; i < Math.min(users.length, 3); i++) {
      const userId = users[i].id;
      try {
        const userDetailResponse = await axios.get(
          `${BASE_URL}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (userDetailResponse.data && userDetailResponse.data.data) {
          const userDetail = userDetailResponse.data.data;
          if (userDetail.restaurant_id === userRestaurantId) {
            console.log(
              `✅ User ${userDetail.full_name}: Access allowed (same restaurant)`
            );
          } else {
            console.log(
              `❌ User ${userDetail.full_name}: SECURITY BREACH (different restaurant: ${userDetail.restaurant_id})`
            );
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log(
            `✅ User ${userId}: Access properly denied (403 Forbidden)`
          );
        } else {
          console.log(`❌ User ${userId}: Unexpected error: ${error.message}`);
        }
      }
    }

    console.log("\n📈 SECURITY TEST SUMMARY:");
    console.log("========================");
    if (
      uniqueRestaurantIds.length === 1 &&
      uniqueRestaurantIds[0] === userRestaurantId
    ) {
      console.log("✅ RESTAURANT ISOLATION: SECURE");
      console.log("✅ All user data properly filtered by restaurant");
    } else {
      console.log("❌ RESTAURANT ISOLATION: VULNERABLE");
      console.log("❌ Cross-restaurant data access detected!");
    }
  } catch (error) {
    console.log("❌ TEST FAILED:", error.message);
    if (error.response) {
      console.log(
        "Error response:",
        error.response.status,
        error.response.data
      );
    }
  }
}

testRestaurantIsolation();
