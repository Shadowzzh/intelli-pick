import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  const svgBuffer = await fs.readFile(join(publicDir, 'favicon.svg'));

  // 生成 Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  console.log('✓ Generated apple-touch-icon.png');

  // 生成多尺寸 PNG 用于 ICO
  const sizes = [16, 32, 48];
  const pngPaths = [];

  for (const size of sizes) {
    const pngPath = join(publicDir, `favicon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    pngPaths.push(pngPath);
    console.log(`✓ Generated favicon-${size}.png`);
  }

  // 生成 ICO 文件
  const icoBuffer = await pngToIco(pngPaths);
  await fs.writeFile(join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico');
}

generateIcons().catch(console.error);
