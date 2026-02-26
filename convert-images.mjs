import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const staticDir = './public/static';

const targets = [
    { src: 'mascottes-cem-team.png', width: 800, quality: 75 },
    { src: 'meryem-mazini-pro-realiste.jpg', width: 600, quality: 70 },
    { src: 'mascottes-marketing.png', width: 800, quality: 75 },
    { src: 'mascottes-innovation.png', width: 800, quality: 75 },
];

for (const t of targets) {
    const inputPath = join(staticDir, t.src);
    const outName = t.src.replace(/\.(png|jpg|jpeg)$/, '.webp');
    const outputPath = join(staticDir, outName);

    try {
        const info = await stat(inputPath);
        console.log(`Converting: ${t.src} (${Math.round(info.size / 1024)} KB)`);

        await sharp(inputPath)
            .resize(t.width, null, { withoutEnlargement: true })
            .webp({ quality: t.quality })
            .toFile(outputPath);

        const outInfo = await stat(outputPath);
        console.log(`  => ${outName} (${Math.round(outInfo.size / 1024)} KB) saved ${Math.round((1 - outInfo.size / info.size) * 100)}%`);
    } catch (e) {
        console.error(`  Error for ${t.src}: ${e.message}`);
    }
}

// Convert logo images
const logosDir = './public/logos';
try {
    const logoFiles = await readdir(logosDir);
    for (const file of logoFiles) {
        if (file.endsWith('.png') || file.endsWith('.jpg')) {
            const inputPath = join(logosDir, file);
            const outName = file.replace(/\.(png|jpg|jpeg)$/, '.webp');
            const outputPath = join(logosDir, outName);

            const info = await stat(inputPath);
            await sharp(inputPath)
                .resize(200, null, { withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(outputPath);

            const outInfo = await stat(outputPath);
            console.log(`Logo: ${file} (${Math.round(info.size / 1024)}KB) => ${outName} (${Math.round(outInfo.size / 1024)}KB)`);
        }
    }
} catch (e) {
    console.error(`Logo dir error: ${e.message}`);
}

console.log('Done!');
