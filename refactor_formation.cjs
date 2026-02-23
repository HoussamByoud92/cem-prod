const fs = require('fs');

const oldTsx = fs.readFileSync('src/pages/formation.tsx', 'utf-8');
const newHtmlRaw = fs.readFileSync('new_formation.html', 'utf-8');

// Extract everything between app.get('/formation', (c) => { return c.html(` ... `) })
const htmlMatch = newHtmlRaw.match(/return c\.html\(\`([\s\S]*?)\`\)/);
if (!htmlMatch) {
    console.error("Could not find c.html in new_formation.html");
    process.exit(1);
}
let newHtml = htmlMatch[1];


// 1. Inject Dynamic Formations Accordion
const oldFormationsLogicRegex = /\$\{([^}]*activeFormations[^}]*)\}/s;
const oldFormationsMatch = oldTsx.match(oldFormationsLogicRegex);
let formationsLogic = '';
if (oldFormationsMatch) {
    formationsLogic = '${' + oldFormationsMatch[1] + '}';
}

const servicesRegex = /(<!-- Toutes Nos Formations - ACCORDÉONS PAR CATÉGORIE -->[\s\S]*?<section id="services"[\s\S]*?<!-- Accordéons par Catégorie -->\s*<div class="space-y-6" x-data="\{ activeCategory: null \}">)([\s\S]*?)(<\/div>\s*<\/section>)/i;
const sMatch = newHtml.match(servicesRegex);

if (sMatch) {
    const dynamicFormationsLogic = `
                \${(() => {
                    const activeFormations = formations.filter((f: any) => f.status === 'active').sort((a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0));
                    if (activeFormations.length === 0) {
                        return '<p class="text-center text-gray-500 py-12">Les formations seront bientôt disponibles.</p>';
                    }
                    
                    const categories = [...new Set(activeFormations.map((f: any) => f.category || 'Autres'))];
                    
                    const categoryStyles = {
                        'Digitales': { bg: 'from-[#D4AF37] to-[#FFD700]', text: 'white', icon: 'fa-laptop-code' },
                        'Management': { bg: 'from-gray-900 to-black', text: 'white', icon: 'fa-users-cog' },
                        'Business': { bg: 'from-[#0077B5] to-[#00A0DC]', text: 'white', icon: 'fa-chart-line' },
                        'Industrie': { bg: 'from-green-600 to-emerald-700', text: 'white', icon: 'fa-industry' },
                        'Autres': { bg: 'from-gray-700 to-gray-800', text: 'white', icon: 'fa-graduation-cap' }
                    };
                    
                    const renderCard = (f: any) => {
                        const bullets = (f.bullets || '').split(',').filter(Boolean);
                        const tags = (f.tags || '').split(',').filter(Boolean);
                        return \`
                            <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group relative border-2 border-transparent hover:border-[\${f.borderColor || '#D4AF37'}]">
                                \${f.badge ? \`<div class="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black z-10">\${f.badge}</div>\` : ''}
                                <div class="relative overflow-hidden rounded-lg mb-4">
                                    <img src="\${f.imageUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8'}" 
                                         alt="\${f.title}" 
                                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                                    <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold" style="background-color: \${f.iconColor || '#D4AF37'}">
                                        <i class="\${f.icon || 'fas fa-graduation-cap'} mr-1"></i>\${f.category || ''}
                                    </div>
                                </div>
                                <h4 class="text-xl font-bold mb-2 text-gray-900">\${f.title}</h4>
                                <p class="text-sm text-gray-600 mb-4">\${f.description}</p>
                                <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                    \${bullets.map((b) => \`<li><i class="fas fa-check mr-2" style="color: \${f.iconColor || '#D4AF37'}"></i>\${b.trim()}</li>\`).join('')}
                                </ul>
                                <a href="\${f.ctaLink || '/#contact'}" class="block w-full text-white text-center font-bold py-2 rounded-lg transition text-sm hover:shadow-md" style="background-color: \${f.iconColor || '#D4AF37'}">
                                    <i class="fas fa-envelope mr-2"></i>\${f.ctaText || 'Devis'}
                                </a>
                            </div>\`;
                    };

                    let idx = 1;
                    let html = '';
                    categories.forEach(cat => {
                        const styleKey = Object.keys(categoryStyles).find(k => cat.includes(k)) || 'Autres';
                        const style = categoryStyles[styleKey];
                        const catsFormations = activeFormations.filter((f: any) => (f.category || 'Autres') === cat);
                        
                        html += \`
                        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition mb-6">
                            <button @click="activeCategory = activeCategory === \${idx} ? null : \${idx}" 
                                    class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r \${style.bg} text-\${style.text} hover:opacity-90 transition">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                        <i class="fas \${style.icon} text-3xl"></i>
                                    </div>
                                    <div class="text-left">
                                        <h3 class="text-2xl font-bold">\${cat}</h3>
                                        <p class="text-sm opacity-90">\${catsFormations.length} formations disponibles</p>
                                    </div>
                                </div>
                                <i :class="activeCategory === \${idx} ? 'fa-chevron-up' : 'fa-chevron-down'" class="fas text-2xl transition-transform"></i>
                            </button>
                            
                            <div x-show="activeCategory === \${idx}" x-collapse class="p-8 bg-gray-50">
                                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    \${catsFormations.map(renderCard).join('')}
                                </div>
                            </div>
                        </div>\`;
                        idx++;
                    });
                    return html;
                })()}
`;
    newHtml = newHtml.replace(sMatch[2], dynamicFormationsLogic);
} else {
    console.error("Could not find services accordion in new html");
}

// 2. Inject Dynamic Blogs
const actualitesRegex = /(<section id="actualites"[\s\S]*?<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-[^>]*>)[\s\S]*?(<\/div>\s*<!-- CTA Newsletter -->)/;
const aMatch = newHtml.match(actualitesRegex);
if (aMatch) {
    const dynamicBlogs = `
                    \${latestBlogs.length > 0 ? latestBlogs.map(blog => \`
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37] flex flex-col h-full">
                        <div class="h-48 relative overflow-hidden">
                            <img src="\${blog.coverImage || '/static/default-blog.jpg'}" alt="\${blog.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div class="absolute bottom-4 left-4 text-white">
                                <span class="bg-[#D4AF37] text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">\${blog.category || 'Actualité'}</span>
                            </div>
                        </div>
                        <div class="p-6 flex-1 flex flex-col">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>\${new Date(blog.publishedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </div>
                            <h3 class="text-xl font-bold mb-3 line-clamp-2">\${blog.title}</h3>
                            <p class="text-gray-600 mb-4 line-clamp-3 text-sm flex-1">\${blog.excerpt || ''}</p>
                            <a href="/actualites/\${blog.slug}" class="text-[#D4AF37] font-bold hover:underline mt-auto">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    \`).join('') : '<p class="text-center text-gray-500 col-span-4">Aucune actualité pour le moment.</p>'}
                `;
    newHtml = newHtml.replace(actualitesRegex, `$1${dynamicBlogs}$2`);
} else {
    console.error("Could not find actualites section in new html");
}

// 3. Inject Plaquettes before Footer
const footerRegex = /(<!-- Footer -->\s*<footer)/;
if (footerRegex.test(newHtml)) {
    newHtml = newHtml.replace(footerRegex, `<!-- Section Plaquettes (Brochures & Catalogues) -->\n        \${plaquettesHtml}\n\n        $1`);
} else {
    console.error("Could not find footer in new html");
}

// Assemble final TSX
const tsxHeaderRegex = /^([\s\S]*?return c\.html\(\`)/;
const thMatch = oldTsx.match(tsxHeaderRegex);
if (!thMatch) {
    console.error("Could not find TSX header");
    process.exit(1);
}

const finalTsx = thMatch[1] + newHtml + '\`)\n})\nexport default formationApp;\n';
fs.writeFileSync('src/pages/formation.tsx', finalTsx);
console.log('Successfully updated src/pages/formation.tsx');
