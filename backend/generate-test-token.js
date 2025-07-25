const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the same secret that's being used in the server
const secret = process.env.JWT_SECRET || 'AlAcArteSecret';

// Generate token for the actual user from the database
const payload = {
  userId: 'cac1c5de-58d8-437a-af5b-3de78830125a', // Flavio Luiz Ferreira
  email: 'flavio_luiz_ferreira@hotmail.com',
  role: 'restaurant_administrator',
  restaurantId: 'c7742866-f77b-4f68-8586-57d631af301a',
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Generated test token for real user:');
console.log(token);
console.log('\n🔧 TO FIX THE AUTH ISSUE, RUN THIS IN YOUR BROWSER CONSOLE:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log("sessionStorage.removeItem('token');");
console.log('location.reload();');
console.log('\nToken payload:', payload);

// Also verify the token can be decoded
try {
  const decoded = jwt.verify(token, secret);
  console.log('\n✅ Token verification successful:', decoded);
} catch (error) {
  console.log('\n❌ Token verification failed:', error.message);
}
