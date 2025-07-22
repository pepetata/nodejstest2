// Test script for My Profile functionality
// Run this with: node test-profile-api.js

const https = require("https");
const http = require("http");

const API_BASE = "http://localhost:5000/api/v1";

// Test credentials
const testUser = {
  email: "flavio_luiz_ferreira@hotmail.com",
  password: "12345678",
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const httpModule = urlObj.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = httpModule.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testProfileAPI() {
  console.log("🧪 Testing My Profile API functionality...\n");

  try {
    // 1. Login to get token
    console.log("1. Logging in...");
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: "POST",
      body: testUser,
    });

    console.log(
      "Login response structure:",
      JSON.stringify(loginResponse, null, 2)
    );

    const token = loginResponse.data?.token || loginResponse.token;
    const user = loginResponse.data?.user || loginResponse.user;

    if (!token) {
      throw new Error("No token found in login response");
    }

    console.log("✅ Login successful");
    console.log(`   User: ${user.full_name || user.name} (${user.email})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // 2. Test profile GET endpoint
    console.log("\n2. Testing GET profile...");
    const getProfileResponse = await makeRequest(`${API_BASE}/users/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ GET Profile successful");
    console.log("   Current profile:", {
      name: getProfileResponse.data?.full_name,
      email: getProfileResponse.data?.email,
      phone: getProfileResponse.data?.phone,
      whatsapp: getProfileResponse.data?.whatsapp,
    });

    // 3. Test profile update
    console.log("\n3. Testing PUT profile update...");
    const profileData = {
      full_name: "Flavio Luiz Ferreira (Updated)",
      phone: "(11) 99999-8888",
      whatsapp: "(11) 99999-9999",
    };

    const updateResponse = await makeRequest(`${API_BASE}/users/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: profileData,
    });

    console.log("✅ Profile update successful");
    console.log("   Updated profile:", {
      name: updateResponse.data?.full_name,
      phone: updateResponse.data?.phone,
      whatsapp: updateResponse.data?.whatsapp,
    });

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.data || error.message);
    if (error.status === 404) {
      console.log(
        "💡 This might mean the backend needs to be restarted to load the new route"
      );
    }
  }
}

// Run the test
testProfileAPI();
