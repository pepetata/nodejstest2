const jwt = require('jsonwebtoken');

// Use the same secret that's being used in the server
const secret = process.env.JWT_SECRET || 'your-secret-key-for-testing-123';

// Generate token for the restaurant owner from the seed data
const payload = {
  userId: '770e8400-e29b-41d4-a716-446655440001',
  email: 'admin@pizzariabellavista.com.br',
  restaurantId: '550e8400-e29b-41d4-a716-446655440001',
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Generated test token:');
console.log(token);
console.log('\nTo use this token in the frontend, run this in browser console:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\nToken payload:', payload);
