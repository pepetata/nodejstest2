const http = require('http');

const testLogin = () => {
  const data = JSON.stringify({
    email: 'flavio_luiz_ferreira@hotmail.com',
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

  console.log('🔐 Testing login endpoint...');
  console.log('📤 Request:', options);
  console.log('📤 Body:', data);

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📊 Headers:`, res.headers);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('📥 Response body:', body);
      try {
        const response = JSON.parse(body);
        console.log('📥 Parsed response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('❌ Could not parse JSON response');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.write(data);
  req.end();
};

testLogin();
