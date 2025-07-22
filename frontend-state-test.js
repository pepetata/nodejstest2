// Frontend Redux State Test
// This test will help us understand what's happening with the Redux state

console.log("=== FRONTEND STATE DEBUGGING ===");

// Check if window is available (browser environment)
if (typeof window !== "undefined") {
  // Wait for Redux store to be available
  const checkStore = () => {
    if (window.__REDUX_DEVTOOLS_EXTENSION__ && window.store) {
      const state = window.store.getState();

      console.log("Current Redux State:");
      console.log("Auth user:", state.auth?.user?.full_name);
      console.log("Auth user ID:", state.auth?.user?.id);
      console.log("Users currentUser:", state.users?.currentUser?.full_name);
      console.log("Users currentUser ID:", state.users?.currentUser?.id);
      console.log("Loading states:", state.users?.loading);

      return true;
    }
    return false;
  };

  // Try to check immediately
  if (!checkStore()) {
    // If not available immediately, try again in 2 seconds
    setTimeout(() => {
      if (!checkStore()) {
        console.log(
          "Redux store not found. Make sure you are in the browser with the app loaded."
        );
      }
    }, 2000);
  }
} else {
  console.log("This script should be run in the browser console.");
}

// Instructions for manual testing
console.log("\n=== MANUAL TESTING INSTRUCTIONS ===");
console.log("1. Open browser console on the frontend page");
console.log("2. Navigate to My Profile page");
console.log("3. Check which data is being displayed");
console.log("4. Run this in console to check Redux state:");
console.log("   store.getState().auth.user.full_name");
console.log("   store.getState().users.currentUser?.full_name");
