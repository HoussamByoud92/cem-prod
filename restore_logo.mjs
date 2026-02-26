import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Restore cem.webp back to cem.png
    content = content.replace(/cem\.webp\?fit=146%2C118&ssl=1/g, 'cem.png?fit=146%2C118&ssl=1');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Restored logo/favicon in ${filePath}`);
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
console.log('Logo and favicon URLs restored.');
