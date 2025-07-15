// Test what HTML is being returned
console.log('Testing HTML response...');

async function testHtmlResponse() {
  try {
    const url = 'http://localhost:3000/uploads/logo/padre/1752593045052_c2r28c1xzun.jpg';
    console.log(`Testing: ${url}`);

    const response = await fetch(url);
    const text = await response.text();
    console.log('Response HTML:');
    console.log(text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHtmlResponse();
