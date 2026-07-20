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

    console.log('Rendering SVG to high-quality opaque PNGs for iOS compatibility...');

    // 1. Generate 512x512 icon (standard large icon) - flattened with white background to prevent any transparency
    await sharp(svgPath)
      .resize(512, 512)
      .flatten({ background: '#ffffff' })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'pwa_icon_512.png'));
    console.log('✓ Generated pwa_icon_512.png (Opaque)');

    // Copy to standard pwa_icon.png
    await sharp(svgPath)
      .resize(512, 512)
      .flatten({ background: '#ffffff' })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'pwa_icon.png'));
    console.log('✓ Generated pwa_icon.png (Opaque)');

    // 2. Generate 192x192 icon (standard medium icon) - flattened with white background
    await sharp(svgPath)
      .resize(192, 192)
      .flatten({ background: '#ffffff' })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'pwa_icon_192.png'));
    console.log('✓ Generated pwa_icon_192.png (Opaque)');

    // 3. Generate 180x180 apple-touch-icon (specifically required for iOS / Safari Add to Home Screen)
    // Opaque and solid to satisfy iOS Safari requirements
    await sharp(svgPath)
      .resize(180, 180)
      .flatten({ background: '#ffffff' })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png (Opaque 180x180)');

    // 4. Generate apple-touch-icon-precomposed.png
    await sharp(svgPath)
      .resize(180, 180)
      .flatten({ background: '#ffffff' })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
    console.log('✓ Generated apple-touch-icon-precomposed.png (Opaque 180x180)');

    console.log('All icons generated successfully with zero transparency!');
  } catch (error) {
    console.error('Error generating PNG icons:', error);
    process.exit(1);
  }
}

generateIcons();
