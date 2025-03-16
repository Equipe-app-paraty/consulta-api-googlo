/**
 * Build script for teste-googlo-api
 * This script prepares the application for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define build directory
const buildDir = path.resolve(__dirname, '../build');

// Create build directory if it doesn't exist
console.log('Creating build directory...');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy necessary files to build directory
console.log('Copying files to build directory...');
const filesToCopy = [
  'index.js',
  'package.json',
  'package-lock.json',
  '.env.example'
];

filesToCopy.forEach(file => {
  const sourcePath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(sourcePath)) {
    const destPath = path.resolve(buildDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to build directory`);
  }
});

// Copy src directory
console.log('Copying src directory...');
const srcDir = path.resolve(__dirname, '../src');
const buildSrcDir = path.resolve(buildDir, 'src');

if (!fs.existsSync(buildSrcDir)) {
  fs.mkdirSync(buildSrcDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(srcDir, buildSrcDir);
console.log('Source files copied successfully');

// Create a production .env file if needed
if (fs.existsSync(path.resolve(__dirname, '../.env'))) {
  console.log('Creating production .env file...');
  fs.copyFileSync(
    path.resolve(__dirname, '../.env'),
    path.resolve(buildDir, '.env')
  );
}

console.log('Installing production dependencies in build directory...');
try {
  execSync('cd build && npm install --production', { stdio: 'inherit' });
  console.log('Production dependencies installed successfully');
} catch (error) {
  console.error('Error installing production dependencies:', error);
  process.exit(1);
}

console.log('Build completed successfully!');