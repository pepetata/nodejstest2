const https = require("https");
const fs = require("fs");
const path = require("path");

// Directory where flag images will be saved
const flagsDir = path.join(
  __dirname,
  "frontend",
  "public",
  "images",
  "languages"
);

// Flag mappings based on your database icon_file values
const flagMappings = {
  // Countries you need based on console logs
  "uk.png": "https://flagcdn.com/w40/gb.png", // UK (for English)
  "france.png": "https://flagcdn.com/w40/fr.png", // France (for French)
  "germany.png": "https://flagcdn.com/w40/de.png", // Germany (for German)
  "italy.png": "https://flagcdn.com/w40/it.png", // Italy (for Italian)
  "russia.png": "https://flagcdn.com/w40/ru.png", // Russia (for Russian)
  "korea.png": "https://flagcdn.com/w40/kr.png", // South Korea (for Korean)
  "netherlands.png": "https://flagcdn.com/w40/nl.png", // Netherlands (for Dutch)
  "sweden.png": "https://flagcdn.com/w40/se.png", // Sweden (for Swedish)
  "japan.png": "https://flagcdn.com/w40/jp.png", // Japan (for Japanese)
  "china.png": "https://flagcdn.com/w40/cn.png", // China (for Chinese)
  "saudi-arabia.png": "https://flagcdn.com/w40/sa.png", // Saudi Arabia (for Arabic)
  "israel.png": "https://flagcdn.com/w40/il.png", // Israel (for Hebrew)
  "turkey.png": "https://flagcdn.com/w40/tr.png", // Turkey (for Turkish)
};

// Function to download a file
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(flagsDir, filename));

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${filename}: ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`✅ Downloaded: ${filename}`);
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(path.join(flagsDir, filename), () => {}); // Delete the file on error
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Main function to download all flags
async function downloadAllFlags() {
  console.log("🏁 Starting flag download...");
  console.log(`📁 Target directory: ${flagsDir}`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(flagsDir)) {
    fs.mkdirSync(flagsDir, { recursive: true });
    console.log("📁 Created directory");
  }

  // Download each flag
  for (const [filename, url] of Object.entries(flagMappings)) {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
    }
  }

  console.log("🎉 Flag download complete!");
  console.log("\n📋 Downloaded files:");

  // List all files in the directory
  const files = fs.readdirSync(flagsDir);
  files.forEach((file) => {
    console.log(`   - ${file}`);
  });
}

// Run the download
downloadAllFlags().catch(console.error);
