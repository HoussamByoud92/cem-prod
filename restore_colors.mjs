import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

function processFile(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf-8');

    const regexes = [
        { net: 'linkedin', bg: 'bg-[#0077B5]' },
        { net: 'instagram', bg: 'bg-[#E4405F]' },
        { net: 'facebook', bg: 'bg-[#1877F2]' },
        { net: 'tiktok', bg: 'bg-black' },
        { net: 'twitter', bg: 'bg-black' } // Or #1DA1F2, previous standard was white/black or #1DA1F2. We'll use black as Twitter is X now.
    ];

    let parts = content.split('<a ');
    let changed = false;

    for (let i = 1; i < parts.length; i++) {
        let endIdx = parts[i].indexOf('</a>');
        if (endIdx === -1) continue;

        let aTag = parts[i].substring(0, endIdx);

        if (aTag.includes('bg-[#D4AF37]') || aTag.includes('bg-\\[#D4AF37\\]')) {
            for (const { net, bg } of regexes) {
                if (aTag.toLowerCase().includes(`fa-${net}`)) {
                    let replaced = parts[i].substring(0, endIdx).replace(/(?<!hover:)bg-\[#D4AF37\]/g, bg);
                    if (parts[i].substring(0, endIdx) !== replaced) {
                        parts[i] = replaced + parts[i].substring(endIdx);
                        changed = true;
                    }
                    break;
                }
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filename, parts.join('<a '));
        console.log(`Processed ${filename}`);
    }
}

const allFiles = getFiles(path.join(__dirname, 'src/pages'));
allFiles.push(path.join(__dirname, 'src/index.tsx'));

for (const f of allFiles) {
    processFile(f);
}
