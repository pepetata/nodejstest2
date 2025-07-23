const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a token for the current user shown in the logs
// User ID: be833b40-af07-4f51-8be0-761eb7c0e64d
const token = jwt.sign({ userId: 'be833b40-af07-4f51-8be0-761eb7c0e64d' }, process.env.JWT_SECRET, {
  expiresIn: '24h',
});

console.log('Test token for current user:');
console.log(token);
