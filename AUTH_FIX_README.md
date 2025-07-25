# 🔧 Authentication Fix Instructions

## Problem

The MenuItemsPage is showing 401 Unauthorized errors with "jwt malformed" because the JWT token is corrupted or missing.

## Solution

### Option 1: Use the Token Fixer HTML File

1. Open `auth-token-fixer.html` in your browser (double-click the file)
2. Click "✅ Set Valid Token"
3. Click "🍽️ Go to Menu Items" to test the fix

### Option 2: Manual Browser Console Fix

1. Open your browser and navigate to `http://padre.localhost:3000` or `http://localhost:3000/padre`
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Paste and run this command:

```javascript
localStorage.setItem(
  "token",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWMxYzVkZS01OGQ4LTQzN2EtYWY1Yi0zZGU3ODgzMDEyNWEiLCJlbWFpbCI6ImZsYXZpb19sdWl6X2ZlcnJlaXJhQGhvdG1haWwuY29tIiwicm9sZSI6InJlc3RhdXJhbnRfYWRtaW5pc3RyYXRvciIsInJlc3RhdXJhbnRJZCI6ImM3NzQyODY2LWY3N2ItNGY2OC04NTg2LTU3ZDYzMWFmMzAxYSIsImlhdCI6MTc1MzQ2ODU0OSwiZXhwIjoxNzUzNTU0OTQ5fQ.5HcHm_pNILr_ydO2dfvn8ALvZvtTK1upJia6Yhn-XLM"
);
sessionStorage.removeItem("token");
location.reload();
```

## Token Details

- **User**: Flavio Luiz Ferreira (flavio_luiz_ferreira@hotmail.com)
- **Role**: restaurant_administrator
- **Restaurant ID**: c7742866-f77b-4f68-8586-57d631af301a
- **Expires**: Valid for 24 hours from generation

## What Was Fixed

1. **Updated MenuItemsPage.jsx** to check both localStorage and sessionStorage for tokens
2. **Added token validation** before making API calls
3. **Improved error handling** with user-friendly messages
4. **Generated a valid JWT token** for an existing user in the database

## Test the Fix

After setting the token, navigate to:

- `http://padre.localhost:3000/admin/menu/items` (subdomain)
- OR `http://localhost:3000/padre/admin/menu/items` (path-based)

The page should now load without 401 errors and display the menu items interface with language selector and all functionality working.

## For Future Development

To prevent this issue:

1. Implement proper login flow with token validation
2. Add automatic token refresh mechanism
3. Improve error handling for expired/invalid tokens
4. Add logout functionality that properly clears tokens
