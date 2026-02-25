const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const indexTsxPath = path.join(srcDir, 'index.tsx');

// 1. Extract the perfect header and footer from src/index.tsx
const indexContent = fs.readFileSync(indexTsxPath, 'utf8');
const lines = indexContent.split('\n');

const headerLines = lines.slice(747, 891);
const footerLines = lines.slice(1880, 1962);

const newHeader = headerLines.join('\n');
const newFooter = footerLines.join('\n');

// 2. Identify target files
function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx') && !name.includes('.backup')) {
            files.push(name);
        }
    }
    return files;
}

const targetFiles = getFiles(srcDir);

// 3. Replace header and footer
let totalHeadersReplaced = 0;
let totalFootersReplaced = 0;

for (const file of targetFiles) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace headers
    // We want to match:
    // 1. The block starting with <!-- Barre Réseaux Sociaux Top --> up to </nav>
    // 2. Any <nav>...</nav> that doesn't have the comment
    // 3. Any <header>...</header> (with optional <!-- Header Simplifié --> comment)

    // Pattern 1 & 2:
    const navRegex = /(?:[ \t]*<!-- Barre Réseaux Sociaux Top -->[\s\S]*?(?=<nav))?<nav[\s\S]*?<\/nav>/g;

    // Pattern 3:
    const headerTagRegex = /(?:[ \t]*<!-- Header Simplifié -->\s*)?<header[\s\S]*?<\/header>/g;

    let headerReplacedCount = 0;

    content = content.replace(navRegex, (match) => {
        if (match.trim() === newHeader.trim()) return match; // Already perfect
        headerReplacedCount++;
        return newHeader;
    });

    content = content.replace(headerTagRegex, (match) => {
        if (match.trim() === newHeader.trim()) return match;
        headerReplacedCount++;
        return newHeader; // We replace <header> with the new <nav> based header
    });

    // Replace footers
    // Match <!-- Footer -->...</footer> or just <footer>...</footer>
    const footerRegex = /(?:[ \t]*<!-- Footer -->\s*)?<footer[\s\S]*?<\/footer>/g;

    let footerReplacedCount = 0;
    content = content.replace(footerRegex, (match) => {
        if (match.trim() === newFooter.trim()) return match;
        footerReplacedCount++;
        return newFooter;
    });

    if (headerReplacedCount > 0 || footerReplacedCount > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${path.basename(file)}: ${headerReplacedCount} headers, ${footerReplacedCount} footers replaced.`);
        totalHeadersReplaced += headerReplacedCount;
        totalFootersReplaced += footerReplacedCount;
    }
}

console.log(`\nDONE! Replaced ${totalHeadersReplaced} headers and ${totalFootersReplaced} footers in total.`);
