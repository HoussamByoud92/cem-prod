// optimize_images.mjs
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const exts = ['.png', '.jpg', '.jpeg'];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (exts.includes(path.extname(entry.name).toLowerCase())) {
            const out = full.replace(/\.(png|jpe?g)$/i, '.webp');
            sharp(full)
                .webp({ quality: 80 })
                .toFile(out)
                .then(() => console.log(`Converted ${full} → ${out}`))
                .catch(err => console.error('Error converting', full, err));
        }
    }
}

// Convert images
walk(publicDir);

// Update references in .tsx and .html files
function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // replace image extensions
    content = content.replace(/(src|href)=("[^"]+?)\.(png|jpe?g)/gi, (m, attr, url) => `${attr}="${url}.webp`);
    // add loading="lazy" to <img> tags if missing
    content = content.replace(/<img([^>]*?)(?<!loading=)>(?!.*<img)/gi, (m, attrs) => {
        // if already has loading attribute, skip (negative lookbehind ensures)
        return `<img${attrs} loading="lazy">`;
    });
    // also handle self-closing <img .../>
    content = content.replace(/<img([^>]*?)(?<!loading=)\/>/gi, (m, attrs) => {
        return `<img${attrs} loading="lazy"/>`;
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

function walkFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(full);
        else if (['.tsx', '.ts', '.js', '.jsx', '.html'].includes(path.extname(entry.name))) {
            replaceInFile(full);
        }
    }
}

walkFiles(path.resolve('.'));

console.log('Image optimization and reference update complete.');
