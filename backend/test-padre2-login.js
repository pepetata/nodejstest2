// Test login with padre2 credentials
async function testPadre2Login() {
  try {
    console.log('🔍 Testing login with padre2 credentials...');

    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio_luiz_ferreira_chain@hotmail.com',
        password: 'Teste@123',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('✅ Token:', data.token);
      console.log('✅ User:', data.user?.full_name);
      console.log('✅ Restaurant:', data.user?.restaurant?.name);
      console.log('✅ Restaurant URL:', data.user?.restaurant?.url);
      console.log('✅ Role:', data.user?.role);
      console.log('✅ Is Admin:', data.user?.is_admin);

      return data;
    } else {
      console.log('❌ Login failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

// Run the test
testPadre2Login();
