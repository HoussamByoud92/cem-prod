import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 1. Fix src=""url.webp" -> src="url.webp"
    content = content.replace(/(src|href)=""([^"]+?\.webp")/gi, '$1="$2');

    // 2. Fix multiple loading="lazy"
    content = content.replace(/(loading="lazy"[\s/]*)+/gi, 'loading="lazy" ');

    // 3. Fix loading="lazy" loading="lazy">
    content = content.replace(/loading="lazy"\s*loading="lazy"/gi, 'loading="lazy"');

    // 4. Sometimes it might be loading="lazy" / loading="lazy"
    content = content.replace(/(\/\s*loading="lazy"|loading="lazy"\s*\/)\s*loading="lazy"/gi, '/ loading="lazy"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    }
}

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (full.includes('node_modules') || full.includes('.git') || full.includes('public')) continue;
        if (entry.isDirectory()) processDir(full);
        else if (['.tsx', '.ts', '.html', '.js'].includes(path.extname(entry.name))) {
            fixFile(full);
        }
    }
}

processDir(path.resolve('.'));
console.log('Fixes applied.');
