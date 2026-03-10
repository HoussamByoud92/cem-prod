const fs = require('fs');
const path = require('path');

function processFile(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf-8');

    // 1. Revert Top-Bar hovers (w-8 h-8 bg-white/10)
    content = content.replace(/hover:bg-\[#D4AF37\](\s+transition text-white text-sm"\s*title="LinkedIn")/g, 'hover:bg-[#0077B5]$1');
    content = content.replace(/hover:bg-\[#D4AF37\](\s+transition text-white text-sm"\s*title="Instagram")/g, 'hover:bg-[#E4405F]$1');
    content = content.replace(/hover:bg-\[#D4AF37\](\s+transition text-white text-sm"\s*title="Facebook")/g, 'hover:bg-[#1877F2]$1');
    content = content.replace(/hover:bg-\[#D4AF37\](\s+transition text-white text-sm"\s*title="TikTok")/g, 'hover:bg-black$1');

    // 2. Fix the duplicate footers in index.tsx
    const badWrapper = /class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:[^" ]+\s+hover:scale-110 transition-all group border border-gray-700"/g;
    const goodWrapper = 'class="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white/10"';
    content = content.replace(badWrapper, goodWrapper);

    const generalBadWrapper = /class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center[^"]+"/g;
    content = content.replace(generalBadWrapper, goodWrapper);

    content = content.replace(/<i class="fab fa-linkedin-in text-xl text-gray-400 group-hover:text-white"><\/i>/g, '<i class="fab fa-linkedin-in text-xl text-white"></i>');
    content = content.replace(/<i class="fab fa-instagram text-xl text-gray-400 group-hover:text-white"><\/i>/g, '<i class="fab fa-instagram text-xl text-white"></i>');
    content = content.replace(/<i class="fab fa-facebook-f text-xl text-gray-400 group-hover:text-white"><\/i>/g, '<i class="fab fa-facebook-f text-xl text-white"></i>');
    content = content.replace(/<i class="fab fa-tiktok text-xl text-gray-400 group-hover:text-white"><\/i>/g, '<i class="fab fa-tiktok text-xl text-white"></i>');

    // 3. Fix standard footers that still have old colors
    content = content.replace(/class="w-12 h-12 bg-\[#[0-9A-Fa-f]{6}\] rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white\/10"/g, goodWrapper);
    content = content.replace(/class="w-12 h-12 bg-black rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white\/10"/g, goodWrapper);

    const goodRoundWrapper = 'class="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-white hover:scale-110 transition"';
    content = content.replace(/class="w-12 h-12 bg-\[#[0-9A-Fa-f]{6}\] rounded-full flex items-center justify-center text-white hover:scale-110 transition"/g, goodRoundWrapper);
    content = content.replace(/class="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition"/g, goodRoundWrapper);

    fs.writeFileSync(filename, content);
    console.log(`Processed ${filename}`);
}

const files = ['src/index.tsx', 'src/pages/blog.tsx', 'src/pages/events.tsx', 'src/pages/formation.tsx', 'src/pages/admin.tsx', 'src/pages/demande-catalogue.tsx'];
for (const f of files) { processFile(path.join(__dirname, f)); }
