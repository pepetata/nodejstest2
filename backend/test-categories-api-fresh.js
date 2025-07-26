const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWMxYzVkZS01OGQ4LTQzN2EtYWY1Yi0zZGU3ODgzMDEyNWEiLCJlbWFpbCI6ImZsYXZpb19sdWl6X2ZlcnJlaXJhQGhvdG1haWwuY29tIiwicm9sZSI6InJlc3RhdXJhbnRfYWRtaW5pc3RyYXRvciIsInJlc3RhdXJhbnRJZCI6ImM3NzQyODY2LWY3N2ItNGY2OC04NTg2LTU3ZDYzMWFmMzAxYSIsImlhdCI6MTc1MzQ3NzI3NiwiZXhwIjoxNzUzNTYzNjc2fQ.v25SudOdG1_ORsmQZ1NYb-kZ5TTlk0vyjI_HNmHYl-I';

async function testCategoriesAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/menu/categories', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Categories found:', data.data.length);
      console.log('Categories data:', JSON.stringify(data.data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testCategoriesAPI();
