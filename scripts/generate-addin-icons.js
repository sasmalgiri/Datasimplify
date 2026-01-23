#!/usr/bin/env node

/**
 * Generate CRK Excel Add-in Icons
 * Creates 4 PNG icons (16x16, 32x32, 64x64, 80x80) for the Office manifest
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 64, 80];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'addin');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient (emerald green)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#10b981');
  gradient.addColorStop(1, '#059669');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = Math.max(1, size / 32);
  ctx.strokeRect(0, 0, size, size);

  // Text (white)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // "CRK" for larger icons, "C" for 16px
  const text = size >= 32 ? 'CRK' : 'C';
  ctx.fillText(text, size / 2, size / 2);

  // Add mini chart for 64px and 80px icons
  if (size >= 64) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, size / 40);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.8);
    ctx.lineTo(size * 0.3, size * 0.6);
    ctx.lineTo(size * 0.5, size * 0.7);
    ctx.lineTo(size * 0.7, size * 0.4);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.stroke();
  }

  return canvas;
}

// Generate all icon sizes
console.log('🎨 Generating CRK Excel Add-in icons...\n');

SIZES.forEach((size) => {
  const canvas = generateIcon(size);
  const filename = `icon-${size}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);

  console.log(`✅ Generated ${filename} (${size}x${size})`);
});

console.log('\n📊 All icons created successfully!');
console.log(`📁 Location: ${OUTPUT_DIR}\n`);
