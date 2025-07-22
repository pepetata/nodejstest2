// Test Redux state in browser console
// Copy and paste this into the browser console when on the profile page

console.log("=== PROFILE DATA DEBUG ===");

// Get current Redux state
const state = store.getState();

console.log("1. Auth User Data:");
console.log("   Name:", state.auth?.user?.full_name);
console.log("   Email:", state.auth?.user?.email);
console.log("   ID:", state.auth?.user?.id);

console.log("2. Users CurrentUser Data:");
console.log("   Name:", state.users?.currentUser?.full_name);
console.log("   Email:", state.users?.currentUser?.email);
console.log("   ID:", state.users?.currentUser?.id);

console.log("3. Loading States:");
console.log("   Fetching:", state.users?.loading?.fetching);
console.log("   Updating:", state.users?.loading?.updating);

console.log("4. Errors:");
console.log("   Users error:", state.users?.error);

console.log("5. Profile User Logic:");
const profileUser = state.users?.currentUser || state.auth?.user;
console.log("   Profile User Name:", profileUser?.full_name);
console.log("   Using currentUser?", !!state.users?.currentUser);

// Trigger fresh profile fetch
console.log("6. Triggering fresh profile fetch...");
store.dispatch({ type: "users/getProfile/pending" });

// Test the actual API call
fetch("/api/v1/users/profile", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((data) => {
    console.log("7. Direct API Response:");
    console.log("   API Name:", data.data?.full_name);
    console.log("   API Email:", data.data?.email);
    console.log("   API ID:", data.data?.id);
  })
  .catch((error) => {
    console.error("API Error:", error);
  });

console.log("=== END DEBUG ===");
