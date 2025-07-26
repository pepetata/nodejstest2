const https = require('https');
const http = require('http');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWMxYzVkZS01OGQ4LTQzN2EtYWY1Yi0zZGU3ODgzMDEyNWEiLCJlbWFpbCI6ImZsYXZpb19sdWl6X2ZlcnJlaXJhQGhvdG1haWwuY29tIiwicm9sZSI6InJlc3RhdXJhbnRfYWRtaW5pc3RyYXRvciIsInJlc3RhdXJhbnRJZCI6ImM3NzQyODY2LWY3N2ItNGY2OC04NTg2LTU3ZDYzMWFmMzAxYSIsImlhdCI6MTc1MzQ3NzU2OSwiZXhwIjoxNzUzNTYzOTY5fQ.4GQkOXoVodg-HkqlWq6xU8E5kBbUJl7m1uZhgrT3vow';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/menu/categories',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
