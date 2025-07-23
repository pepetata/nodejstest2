// Test API endpoints
const test = async () => {
  try {
    // Test available languages endpoint
    console.log('Testing /api/v1/languages/available...');
    const languagesResponse = await fetch('http://localhost:5000/api/v1/languages/available', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token', // This might fail due to auth
        'Content-Type': 'application/json',
      },
    });

    console.log('Languages endpoint status:', languagesResponse.status);
    console.log('Languages endpoint response:', await languagesResponse.text());
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
};

test().catch(console.error);
