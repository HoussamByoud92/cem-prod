const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = dir + '/' + file;
        if (fs.statSync(name).isDirectory() && !name.includes('node_modules')) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx') && !name.includes('.backup')) {
            files.push(name);
        }
    }
    return files;
}

const targetFiles = getFiles(srcDir);
let totalModified = 0;

const tailwindTag = '<script src="https://cdn.tailwindcss.com"></script>';
const alpineTag = '<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>';

for (const file of targetFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // We split by tailwindTag. For each occurrence, we check if alpinejs is shortly after it.
    // If not, we append it. However, an even safer approach is to check if the file contains alpinejs.
    // If it DOES NOT contain alpinejs but DOES contain tailwind, we can just replace the first instance of tailwind
    // with tailwind + alpine. Or we can replace all tailwind instances with tailwind + alpine (since multiple tailwind tags mean multiple HTML blocks).

    // Actually, sometimes Alpine is already there but written slightly differently. Let's just do a regex replace.
    // Replace <script src="https://cdn.tailwindcss.com"></script> with both only if 'alpinejs' is not in the next 500 chars

    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, (match, offset, fullText) => {
        const snippet = fullText.substring(offset, offset + 500);
        if (snippet.includes('alpinejs')) {
            return match; // Already there
        }
        modified = true;
        return match + '\n        ' + alpineTag;
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Added Alpine.js to ${path.relative(__dirname, file)}`);
        totalModified++;
    }
}

console.log(`\nDONE! Modified ${totalModified} files.`);
