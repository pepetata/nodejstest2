// Test file content and headers
console.log('Testing file content and headers...');

async function testFileDetails() {
  try {
    const url = 'http://localhost:3000/uploads/logo/padre/1752593045052_c2r28c1xzun.jpg';
    console.log(`Testing: ${url}`);

    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);

    // Log all headers
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    console.log(`Content-Length: ${contentLength}`);

    // Get first few bytes to check if it's actually an image
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const firstBytes = Array.from(bytes.slice(0, 10))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`First 10 bytes: ${firstBytes}`);

    // Check if it starts with JPEG header (FF D8 FF)
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      console.log('✅ File is a valid JPEG image');
    } else {
      console.log('❌ File is NOT a valid JPEG image');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFileDetails();
