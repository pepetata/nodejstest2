const https = require('https');
const http = require('http');

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ data: jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testUpdateUser() {
  try {
    console.log('Testing user update with role_location_pairs...');

    // First, login to get a token
    const loginResponse = await makeRequest('http://localhost:5000/api/v1/auth/login', 'POST', {
      email: 'flavio_luiz_ferreira_chain@hotmail.com',
      password: 'qwerty123',
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (!loginResponse.data || !loginResponse.data.token) {
      throw new Error('Login failed: No token received');
    }

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;

    console.log('Login successful, full response:', JSON.stringify(loginResponse.data, null, 2));
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('User ID:', userId);

    // Test updating user with role_location_pairs
    const updateData = {
      full_name: 'Flavio Ferreira Chain',
      email: 'flavio_luiz_ferreira_chain@hotmail.com',
      phone: '',
      whatsapp: '',
      role_location_pairs: [
        {
          role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
          location_id: 'ce105616-c754-4693-b309-b1c9eb1d3218',
        },
        {
          role_id: 'aeb91604-e30b-4fa4-b36c-d96ad7327f50',
          location_id: '684a5fdb-57c5-400f-b4e6-802d044c74b5',
        },
      ],
      is_active: true,
      is_admin: false,
    };

    console.log('Sending update request with data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await makeRequest(
      `http://localhost:5000/api/v1/users/${userId}`,
      'PUT',
      updateData,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    console.log('Update response status:', updateResponse.status);
    console.log('Update response:', updateResponse.data);
  } catch (error) {
    console.error('Error testing user update:', error.message);
  }
}

testUpdateUser();
