const fetch = require('node-fetch');

async function testCategoriesAPI() {
  try {
    // Test the categories API endpoint that the frontend is calling
    const response = await fetch('http://localhost:5000/api/v1/menu/categories', {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODZiYmZhZS0zNTUzLTQ4YzgtOTNjMS1iZTQ0ZmI5OTRiMDYiLCJ1c2VybmFtZSI6ImpvYW8xIiwicmVzdGF1cmFudElkIjoiYzc3NDI4NjYtZjc3Yi00ZjY4LTg1ODYtNTdkNjMxYWYzMDFhIiwicm9sZSI6ImFkbWluaXN0cmF0b3IiLCJpYXQiOjE3Mzc5NzEzNzN9.p1ZeJqvUqOiXEYzQKB9h41r8MZdVWL6vrlzCRK_rFJk',
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log('Response size:', data.length, 'characters');
    console.log('Response (first 500 chars):', data.substring(0, 500));

    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(data);
      console.log('JSON parsed successfully');
      console.log('Data type:', typeof jsonData);
      console.log('Success:', jsonData.success);

      if (jsonData.data) {
        console.log('Data is array:', Array.isArray(jsonData.data));
        console.log('Categories count:', jsonData.data.length);

        if (jsonData.data.length > 0) {
          console.log('First category:', jsonData.data[0]);
        } else {
          console.log('No categories found!');
        }
      }

      if (jsonData.meta) {
        console.log('Meta info:', jsonData.meta);
      }
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testCategoriesAPI();
