const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a token for user ze1 (id: 0533eac6-d4ab-403a-985f-32e49b80fbe2)
// This user has restaurant_id: c7742866-f77b-4f68-8586-57d631af301a
const token = jwt.sign({ userId: '0533eac6-d4ab-403a-985f-32e49b80fbe2' }, process.env.JWT_SECRET, {
  expiresIn: '24h',
});

console.log('Test token for user ze1:');
console.log(token);
console.log('\nUse this token to test the API endpoints.');
console.log('Restaurant ID for this user: c7742866-f77b-4f68-8586-57d631af301a');
