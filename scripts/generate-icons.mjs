import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const sizes = [16, 48, 128];
const outDir = join(process.cwd(), 'dist', 'icons');

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// SVG 内容 - VSCode 风格搜索图标
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#3c3c3c"/>
  <g fill="#cccccc" stroke="#cccccc" stroke-width="8" stroke-linecap="round">
    <circle cx="52" cy="52" r="28" fill="none"/>
    <line x1="72" y1="72" x2="108" y2="108"/>
  </g>
</svg>`;

try {
  await Promise.all(sizes.map(async (size) => {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon${size}.png`));
    console.log(`生成 icon${size}.png`);
  }));
} catch (err) {
  console.error('生成图标失败:', err);
  process.exitCode = 1;
}