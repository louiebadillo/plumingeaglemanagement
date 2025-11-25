// Script to analyze bundle size
// Run with: node analyze-bundle.js

const fs = require('fs');
const path = require('path');

// Check if build folder exists
const buildPath = path.join(__dirname, 'build', 'static', 'js');
if (!fs.existsSync(buildPath)) {
  console.log('❌ Build folder not found. Please run "npm run build" first.');
  process.exit(1);
}

// Get all JS files in build folder
const files = fs.readdirSync(buildPath).filter(file => file.endsWith('.js'));

console.log('\n📦 Bundle Size Analysis\n');
console.log('='.repeat(60));

let totalSize = 0;
const fileSizes = [];

files.forEach(file => {
  const filePath = path.join(buildPath, file);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  const sizeInKB = (stats.size / 1024).toFixed(2);
  totalSize += stats.size;
  
  fileSizes.push({
    name: file,
    size: stats.size,
    sizeMB: parseFloat(sizeInMB),
    sizeKB: parseFloat(sizeInKB)
  });
});

// Sort by size
fileSizes.sort((a, b) => b.size - a.size);

// Display results
fileSizes.forEach((file, index) => {
  const percentage = ((file.size / totalSize) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(percentage / 2));
  console.log(`\n${index + 1}. ${file.name}`);
  console.log(`   Size: ${file.sizeMB} MB (${file.sizeKB} KB)`);
  console.log(`   Percentage: ${percentage}% ${bar}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total Bundle Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
console.log(`\n💡 Tip: Use webpack-bundle-analyzer for detailed analysis:`);
console.log(`   npm run analyze\n`);

