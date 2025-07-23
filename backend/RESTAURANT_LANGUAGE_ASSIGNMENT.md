# Automatic Restaurant Language Assignment

## Overview

This feature automatically assigns Brazilian Portuguese (pt-BR) as the default language when a new restaurant is created through the Register.jsx flow.

## Implementation Details

### Database Structure

#### `languages` Table

- Stores all available system languages with native names
- Key fields: `id`, `name`, `language_code`, `icon_file`, `display_order`, `is_default`, `is_active`
- Contains 15 pre-seeded languages with Brazilian Portuguese as system default

#### `restaurant_languages` Table

- Links restaurants to their supported languages
- Key fields: `restaurant_id`, `language_id`, `display_order`, `is_default`, `is_active`
- Ensures only one default language per restaurant
- Allows custom ordering of languages per restaurant

### Backend Integration

#### Modified Files

1. **`restaurantService.js`** - Added automatic language assignment after restaurant creation
2. **`RestaurantLanguagesAPI.js`** - Complete API for restaurant language management
3. **Migration files** - Database schema for languages and restaurant_languages tables
4. **Seed files** - Pre-populated language data

#### Automatic Assignment Logic

```javascript
// In RestaurantService.createRestaurant()
try {
  await RestaurantLanguagesAPI.addLanguage(newRestaurant.id, 'pt-BR', 10, true);
  serviceLogger.info('Default language (pt-BR) added to restaurant');
} catch (languageError) {
  serviceLogger.warn('Failed to add default language', { error: languageError.message });
  // Note: Doesn't throw - restaurant creation succeeds even if language assignment fails
}
```

### API Functions Available

#### RestaurantLanguagesAPI Class Methods

- `getAvailableLanguages()` - Get all system languages
- `getRestaurantLanguages(restaurantId)` - Get restaurant's configured languages
- `getDefaultLanguage(restaurantId)` - Get restaurant's default language
- `addLanguage(restaurantId, languageCode, displayOrder, isDefault)` - Add language support
- `removeLanguage(restaurantId, languageCode)` - Remove language support
- `setDefaultLanguage(restaurantId, languageCode)` - Change default language
- `updateDisplayOrder(restaurantId, languageCode, newOrder)` - Reorder languages
- `bulkUpdateLanguages(restaurantId, languages)` - Update multiple languages

## Usage Flow

### Restaurant Registration (Register.jsx)

1. User fills out restaurant registration form
2. Frontend sends POST request to `/api/v1/restaurants`
3. Backend creates restaurant via `RestaurantService.createRestaurant()`
4. After successful restaurant and user creation:
   - **NEW**: Automatically adds Brazilian Portuguese (pt-BR) as default language
   - Restaurant creation continues normally
5. Restaurant owner can later manage languages via admin panel

### Language Management (Post-Creation)

```javascript
// Add additional languages
await RestaurantLanguagesAPI.addLanguage(restaurantId, 'en', 20, false);
await RestaurantLanguagesAPI.addLanguage(restaurantId, 'es', 30, false);

// Change default language
await RestaurantLanguagesAPI.setDefaultLanguage(restaurantId, 'en');

// Get all restaurant languages ordered by display_order
const languages = await RestaurantLanguagesAPI.getRestaurantLanguages(restaurantId);
```

## Benefits

1. **Automatic Setup**: New restaurants immediately have Brazilian Portuguese configured
2. **Consistent Defaults**: All restaurants start with the same default language
3. **Flexible Management**: Restaurant owners can add/remove languages as needed
4. **Graceful Fallback**: Restaurant creation succeeds even if language assignment fails
5. **Scalable**: Easy to add more languages or change default behavior

## Database Queries Examples

```sql
-- Get restaurant's languages
SELECT rl.*, l.name, l.language_code, l.icon_file
FROM restaurant_languages rl
JOIN languages l ON rl.language_id = l.id
WHERE rl.restaurant_id = $1 AND rl.is_active = true
ORDER BY rl.display_order;

-- Get default language for restaurant
SELECT rl.*, l.name, l.language_code
FROM restaurant_languages rl
JOIN languages l ON rl.language_id = l.id
WHERE rl.restaurant_id = $1 AND rl.is_default = true;
```

## Files Created/Modified

### New Files

- `src/db/migrations/015_create_languages_table.sql`
- `src/db/migrations/016_create_restaurant_languages_table.sql`
- `src/db/seeds/003_languages.sql`
- `src/db/seeds/004_restaurant_languages.sql`
- `src/db/RestaurantLanguagesAPI.js`
- `src/db/seed-languages.js`
- `src/db/restaurant-languages.js`

### Modified Files

- `src/services/restaurantService.js` - Added automatic language assignment

## Testing

- Language assignment functionality verified with test scripts
- Integration confirmed with existing restaurant creation flow
- Graceful error handling tested (continues if language assignment fails)

## Future Enhancements

1. Allow configuration of default language per restaurant type
2. Add language-specific content management
3. Implement automatic translation features
4. Add language analytics and usage tracking
