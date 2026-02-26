import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const srcDir = './src';

// Helper: optimized head block with deferred FA, deferred fonts, preconnect
const OPTIMIZED_FA = `<link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>`;

const RENDER_BLOCKING_FA = `<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">`;

// Process index.tsx
function processFile(filePath) {
    let content = readFileSync(filePath, 'utf-8');
    const originalLength = content.length;
    let changes = [];

    // 1. Replace render-blocking Font Awesome with deferred version
    // Skip the ones that are already optimized (contain preload)
    const faRegex = /(\s*)<link href="https:\/\/cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free@6\.4\.0\/css\/all\.min\.css" rel="stylesheet">/g;
    let faCount = 0;
    content = content.replace(faRegex, (match, indent) => {
        faCount++;
        return `${indent}<link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
${indent}<noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>`;
    });
    if (faCount) changes.push(`Deferred ${faCount} Font Awesome CSS refs`);

    // 2. Replace @import url() for fonts inside <style> with <link> before the <style>
    // Match: <style>\n            @import url('...');\n
    const importRegex = /(<style>)\s*\n\s*@import url\('(https:\/\/fonts\.googleapis\.com\/css2[^']+)'\);/g;
    let importCount = 0;
    content = content.replace(importRegex, (match, styleTag, fontUrl) => {
        importCount++;
        return `<link rel="preload" href="${fontUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="${fontUrl}" rel="stylesheet"></noscript>
        ${styleTag}`;
    });
    if (importCount) changes.push(`Deferred ${importCount} Google Fonts @import`);

    // 3. Replace render-blocking Google Fonts <link> with deferred version
    const fontLinkRegex = /(\s*)<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)" rel="stylesheet">/g;
    let fontLinkCount = 0;
    content = content.replace(fontLinkRegex, (match, indent, fontUrl) => {
        // Skip if already a preload
        if (match.includes('preload')) return match;
        fontLinkCount++;
        return `${indent}<link rel="preload" href="${fontUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
${indent}<noscript><link href="${fontUrl}" rel="stylesheet"></noscript>`;
    });
    if (fontLinkCount) changes.push(`Deferred ${fontLinkCount} Google Fonts <link> refs`);

    if (content.length !== originalLength) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`${filePath}: ${changes.join(', ')}`);
    } else {
        console.log(`${filePath}: no changes needed`);
    }
}

// Process all files
const files = [
    'src/index.tsx',
    'src/pages/admin.tsx',
    'src/pages/blog.tsx',
    'src/pages/events.tsx',
    'src/pages/formation.tsx',
];

for (const file of files) {
    processFile(file);
}

console.log('\nDone! All pages optimized.');
