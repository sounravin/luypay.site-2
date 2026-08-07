import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/pwa_icon.svg');
const publicDir = path.resolve('public');

async function generateIcons() {
  try {
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG file not found at ${svgPath}`);
      process.exit(1);
    }

    console.log('Rendering SVG to high-quality opaque PNGs for iOS & Android PWA compatibility...');

    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'favicon-48x48.png', size: 48 },
      { name: 'favicon-96x96.png', size: 96 },
      { name: 'favicon-144x144.png', size: 144 },
      { name: 'favicon-192x192.png', size: 192 },
      { name: 'favicon-512x512.png', size: 512 },
      { name: 'pwa_icon_192.png', size: 192 },
      { name: 'pwa_icon_512.png', size: 512 },
      { name: 'pwa_icon.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'apple-touch-icon-precomposed.png', size: 180 },
    ];

    for (const item of sizes) {
      await sharp(svgPath)
        .resize(item.size, item.size)
        .flatten({ background: '#ffffff' })
        .png({ quality: 100 })
        .toFile(path.join(publicDir, item.name));
      console.log(`✓ Generated ${item.name} (${item.size}x${item.size} Opaque)`);
    }

    console.log('All icons generated successfully with zero transparency!');
  } catch (error) {
    console.error('Error generating PNG icons:', error);
    process.exit(1);
  }
}

generateIcons();

