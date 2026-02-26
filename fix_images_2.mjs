import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix src=""url" -> src="url" (handles template string and queries)
    content = content.replace(/(src|href)=""([^"]+)"/gi, '$1="$2"');

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
console.log('Final fixes applied.');
