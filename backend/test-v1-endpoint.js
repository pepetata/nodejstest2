const https = require('http');

const data = JSON.stringify({
  email: 'joaores',
  password: '12345678',
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

console.log('Testing v1 auth endpoint...');
console.log('URL: http://localhost:5000/api/v1/auth/login');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData);
    if (res.statusCode === 200) {
      console.log('✅ V1 Auth endpoint is working!');
    } else {
      console.log('❌ V1 Auth endpoint has issues');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection error: ${e.message}`);
  console.log('Backend server might not be running on port 5000');
});

req.write(data);
req.end();
