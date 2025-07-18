require('dotenv').config();
const jwt = require('jsonwebtoken');

// Use the same secret that's being used in the server
const secret = process.env.JWT_SECRET || 'AlAcArteSecret';

// Generate token for an existing user
const payload = {
  userId: 'be833b40-af07-4f51-8be0-761eb7c0e64d',
  email: 'flavio_luiz_ferreira_chain@hotmail.com',
  restaurantId: '550e8400-e29b-41d4-a716-446655440001',
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Generated test token for existing user:');
console.log(token);
console.log('\nTo use this token in the frontend, run this in browser console:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\nToken payload:', payload);
