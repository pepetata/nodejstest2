// Complete Profile Debug Test
// Run this in browser console to debug the profile data issue

console.log("=== COMPLETE PROFILE DEBUG ===");

// 1. Check current page URL
console.log("1. Current URL:", window.location.href);

// 2. Check localStorage
console.log("2. LocalStorage Data:");
console.log("   Token exists:", !!localStorage.getItem("token"));
console.log("   User data:", localStorage.getItem("user"));

// 3. Check Redux store
if (typeof store !== "undefined") {
  const state = store.getState();

  console.log("3. Redux State:");
  console.log("   Auth user name:", state.auth?.user?.full_name);
  console.log("   Auth user email:", state.auth?.user?.email);
  console.log("   Current user name:", state.users?.currentUser?.full_name);
  console.log("   Current user email:", state.users?.currentUser?.email);
  console.log("   Loading states:", state.users?.loading);

  // 4. Test profile API directly
  const token = localStorage.getItem("token");
  if (token) {
    console.log("4. Testing Profile API directly...");

    fetch("/api/v1/users/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log("   API Response status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("   API Response data:");
        console.log("     Name:", data.data?.full_name);
        console.log("     Email:", data.data?.email);
        console.log("     ID:", data.data?.id);
        console.log("     Phone:", data.data?.phone);
        console.log("     WhatsApp:", data.data?.whatsapp);

        // 5. Compare with Redux state
        console.log("5. Data Comparison:");
        console.log(
          "   API vs Auth user name match:",
          data.data?.full_name === state.auth?.user?.full_name
        );
        console.log(
          "   API vs Current user name match:",
          data.data?.full_name === state.users?.currentUser?.full_name
        );

        // 6. Dispatch getProfile action
        console.log("6. Dispatching getProfile action...");
        store.dispatch({ type: "users/getProfile/pending" });

        // Mock the fulfilled action with API data
        store.dispatch({
          type: "users/getProfile/fulfilled",
          payload: data,
        });

        // Check updated state
        const newState = store.getState();
        console.log("7. After getProfile dispatch:");
        console.log(
          "   Updated current user name:",
          newState.users?.currentUser?.full_name
        );
      })
      .catch((error) => {
        console.error("API Error:", error);
      });
  } else {
    console.log("4. No token found in localStorage");
  }
} else {
  console.log("Redux store not available");
}

// 8. Check if profile components are mounted
console.log("8. DOM Elements:");
console.log(
  "   Profile modal exists:",
  !!document.querySelector(".user-profile-modal")
);
console.log(
  "   User name elements:",
  document.querySelectorAll(".user-name").length
);

// 9. Instructions for manual testing
console.log("\n=== MANUAL TEST INSTRUCTIONS ===");
console.log("1. Navigate to My Profile page");
console.log("2. Check the displayed name in the profile modal");
console.log("3. If still showing wrong data, try:");
console.log("   - Clear browser cache (Ctrl+Shift+R)");
console.log("   - Clear localStorage: localStorage.clear()");
console.log("   - Re-login to the application");
console.log("4. Check Redux DevTools for state changes");

console.log("=== END COMPLETE DEBUG ===");
