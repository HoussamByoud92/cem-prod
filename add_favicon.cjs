const fs = require('fs');
const path = require('path');

const faviconCode = '<link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">';

function addFaviconToDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            addFaviconToDir(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            // Check if it has a <head> or <title>
            if (content.includes('</title>')) {
                // Check if it doesn't already have 'rel="icon"' near it
                if (!content.includes('rel="icon"')) {
                    content = content.replace(/<\/title>/g, '</title>\n    ' + faviconCode);
                    fs.writeFileSync(fullPath, content);
                    console.log(`Updated ${fullPath}`);
                } else {
                    console.log(`Favicon already in ${fullPath}`);
                }
            }
        }
    }
}

addFaviconToDir('src/pages');
addFaviconToDir('src/components'); // If any

// Also do index.tsx specifically
if (fs.existsSync('src/index.tsx')) {
    let content = fs.readFileSync('src/index.tsx', 'utf-8');
    if (!content.includes('rel="icon"')) {
        content = content.replace(/<\/title>/g, '</title>\n    ' + faviconCode);
        fs.writeFileSync('src/index.tsx', content);
        console.log(`Updated src/index.tsx`);
    } else {
        console.log(`Favicon already in src/index.tsx`);
    }
}
