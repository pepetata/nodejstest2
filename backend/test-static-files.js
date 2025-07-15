// Test if static file serving is working
console.log('Testing static file serving...');

// Test the URLs from the database
const testUrls = [
  'http://localhost:3000/uploads/restaurant_images/padre/matriz/1752593082461_lys575qvel.jpg',
  'http://localhost:3000/uploads/logo/padre/1752593045052_c2r28c1xzun.jpg',
  'http://localhost:3000/uploads/restaurant_videos/padre/matriz/1752593101828_fjf0kao1pzm.mp4',
  'http://localhost:3000/uploads/favicons/padre/1752593058167_hwy4vtvozx.ico',
  'http://localhost:3000/uploads/favicons/padre/1752586385709_7r1s2vkg1qw.ico', // Original favicon
];

async function testStaticFiles() {
  for (const url of testUrls) {
    try {
      console.log(`\nTesting: ${url}`);
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        console.log('✅ File accessible');
      } else {
        console.log('❌ File not accessible');
      }
    } catch (error) {
      console.error(`❌ Error accessing ${url}:`, error.message);
    }
  }
}

testStaticFiles();
