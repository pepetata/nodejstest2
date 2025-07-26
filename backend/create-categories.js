// Test script to create some basic categories
const axios = require('axios');

async function createTestCategories() {
  const baseURL = 'http://localhost:5000';
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWMxYzVkZS01OGQ4LTQzN2EtYWY1Yi0zZGU3ODgzMDEyNWEiLCJ1c2VybmFtZSI6bnVsbCwicmVzdGF1cmFudElkIjoiYzc3NDI4NjYtZjc3Yi00ZjY4LTg1ODYtNTdkNjMxYWYzMDFhIiwicm9sZSI6InJlc3RhdXJhbnRfYWRtaW5pc3RyYXRvciIsImlhdCI6MTczNzQ3NTcyOH0.Vyx5P3DJNaA_kLWCYUNgCfvJZPVAC4I_nJwGjYOCPWM';

  const categories = [
    { name: 'Entradas', display_order: 1 },
    { name: 'Pratos Principais', display_order: 2 },
    { name: 'Sobremesas', display_order: 3 },
    { name: 'Bebidas', display_order: 4 },
    { name: 'Especiais', display_order: 5 },
  ];

  console.log('Creating test categories...\n');

  try {
    for (const category of categories) {
      const response = await axios.post(`${baseURL}/api/v1/menu/categories`, category, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        console.log(`✅ Created: ${category.name}`);
      } else {
        console.log(`❌ Failed to create: ${category.name}`);
      }
    }

    console.log('\n🎉 Categories created successfully!');

    // Verify by fetching categories
    const listResponse = await axios.get(`${baseURL}/api/v1/menu/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`\n📋 Total categories: ${listResponse.data.data.length}`);
    listResponse.data.data.forEach((cat) => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createTestCategories();
