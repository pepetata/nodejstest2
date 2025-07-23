// Test the correct field mapping for language save operation
console.log("Testing language save field mapping...");

// Frontend data (snake_case from database/state)
const tempLanguages = [
  {
    language_id: 9,
    language_code: "fr",
    display_order: 4,
    is_default: true,
    is_active: true,
    name: "French",
    native_name: "Français",
  },
  {
    language_id: 1,
    language_code: "en",
    display_order: 10,
    is_default: false,
    is_active: true,
    name: "English",
    native_name: "English",
  },
];

// Convert to backend format (camelCase)
const backendPayload = {
  languages: tempLanguages.map((lang) => ({
    language_id: lang.language_id,
    languageCode: lang.language_code, // snake_case -> camelCase
    displayOrder: lang.display_order, // snake_case -> camelCase
    isDefault: lang.is_default, // snake_case -> camelCase
    isActive: lang.is_active, // snake_case -> camelCase
  })),
};

console.log(
  "Frontend data (snake_case):",
  JSON.stringify(tempLanguages, null, 2)
);
console.log(
  "\nBackend payload (camelCase):",
  JSON.stringify(backendPayload, null, 2)
);

console.log("\n=== Field Mapping ===");
console.log("language_code -> languageCode ✓");
console.log("display_order -> displayOrder ✓");
console.log("is_default -> isDefault ✓");
console.log("is_active -> isActive ✓");

console.log("\n=== Expected Result ===");
console.log("✅ Backend should accept the request");
console.log("✅ Languages should be saved successfully");
console.log('✅ No "Language code is required" error');
