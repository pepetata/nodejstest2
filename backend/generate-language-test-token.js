require('dotenv').config();
const jwt = require('jsonwebtoken');

// Use the same secret that's being used in the server
const secret = process.env.JWT_SECRET || 'AlAcArteSecret';

// Generate token for the user with configured languages
const payload = {
  userId: 'cac1c5de-58d8-437a-af5b-3de78830125a',
  email: 'flavio_luiz_ferreira@hotmail.com',
  restaurantId: 'c7742866-f77b-4f68-8586-57d631af301a',
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Generated test token for user with configured languages:');
console.log(token);
console.log('\nTo use this token in the frontend, run this in browser console:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\nToken payload:', payload);
