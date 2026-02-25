import { Hono } from 'hono'
import { blogService } from '../lib/sheets'
import { renderer } from '../renderer'
import { Bindings } from '../bindings'

const blogApp = new Hono<{ Bindings: Bindings }>()

blogApp.get('/', async (c) => {
    const blogs = await blogService.getAll(c.env);
    const publishedBlogs = blogs.filter(b => b.status === 'published').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Reuse the card generator logic or create a dedicated list view
    // For now, I'll create a simple responsive grid
    const cardsHtml = publishedBlogs.map(blog => `
        <div class="card-hover bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col h-full">
            <div class="h-48 bg-gray-200 relative overflow-hidden">
                <img src="${blog.coverImage || '/static/default-blog.jpg'}" alt="${blog.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                <div class="absolute top-4 right-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full">
                    ${blog.category || 'Actualité'}
                </div>
            </div>
            <div class="p-6 flex-1 flex flex-col">
                <span class="text-sm text-gray-500 mb-2 block">${new Date(blog.publishedAt).toLocaleDateString('fr-FR')}</span>
                <h3 class="text-xl font-bold text-gray-800 mb-3 line-clamp-2">${blog.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3 flex-1">${blog.excerpt || ''}</p>
                <a href="/actualites/${blog.slug}" class="text-[#D4AF37] font-semibold hover:text-[#B8941F] mt-auto inline-flex items-center">
                    Lire l'article <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </div>
    `).join('');

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualités - CEM GROUP</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <style>
             @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
            body { font-family: 'Montserrat', sans-serif; }
            .gradient-text { background: linear-gradient(to right, #D4AF37, #FFD700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Barre Réseaux Sociaux Top -->
        <div class="fixed top-0 w-full bg-gradient-to-r from-black via-gray-900 to-black z-50 py-2 border-b border-[#D4AF37]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <span class="text-white text-sm hidden sm:block">
                            <i class="fas fa-heart text-[#D4AF37] mr-2"></i>Suivez-nous
                        </span>
                        <div class="flex space-x-2">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="TikTok">
                                <i class="fab fa-tiktok"></i>
                            </a>
                        </div>
                    </div>
                    <div class="text-white text-xs hidden md:block">
                        <i class="fas fa-phone-alt text-[#D4AF37] mr-2"></i>
                        <a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a>
                        <span class="mx-3">|</span>
                        <i class="fas fa-envelope text-[#D4AF37] mr-2"></i>
                        <a href="mailto:contact@cembymazini.ma" class="hover:text-[#D4AF37] transition">contact@cembymazini.ma</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Navigation (décalée pour barre sociale) -->
        <nav class="fixed w-full top-10 z-40 bg-white shadow-lg" x-data="{ open: false, marketingOpen: false, formationOpen: false }">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto"></a>
                    </div>
                    
                    <!-- Desktop Menu -->
                    <div class="hidden md:flex items-center space-x-6">
                        <a href="/#qui-sommes-nous" class="text-gray-700 hover:text-[#D4AF37] transition font-medium">Qui Sommes-Nous</a>
                        <a href="/innovation" class="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-900 transition font-bold shadow-lg text-sm">
                            <i class="fas fa-lightbulb mr-2"></i>CEM Innovation
                        </a>
                        <!-- Menu déroulant CEM Marketing -->
                        <div class="relative" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                            <a href="/marketing" class="bg-[#D4AF37] text-white px-5 py-2 rounded-full hover:bg-[#B8941F] transition font-bold shadow-lg text-sm inline-flex items-center">
                                <i class="fas fa-bullhorn mr-2"></i>CEM Marketing <i class="fas fa-chevron-down text-xs ml-1"></i>
                            </a>
                            <div x-show="open" 
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 transform scale-95"
                                 x-transition:enter-end="opacity-100 transform scale-100"
                                 x-transition:leave="transition ease-in duration-150"
                                 x-transition:leave-start="opacity-100 transform scale-100"
                                 x-transition:leave-end="opacity-0 transform scale-95"
                                 class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                <a href="/marketing#cem-leads" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">CEM LEADS</div>
                                    <div class="text-sm text-gray-600">Génération de leads B2B</div>
                                </a>
                                <a href="/marketing#cem-studio" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">CEM STUDIO</div>
                                    <div class="text-sm text-gray-600">Production audiovisuelle</div>
                                </a>
                                <a href="/marketing#cem-branding" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition">
                                    <div class="font-bold text-gray-900 mb-1">CEM BRANDING</div>
                                    <div class="text-sm text-gray-600">Personal branding LinkedIn</div>
                                </a>
                            </div>
                        </div>
                        
                        <!-- Menu déroulant CEM Formation -->
                        <div class="relative" x-data="{ open: false }" @click.away="open = false">
                            <button type="button" @click="open = !open" class="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-900 transition font-bold shadow-lg text-sm inline-flex items-center cursor-pointer">
                                <i class="fas fa-graduation-cap mr-2"></i>CEM Formation <i class="fas fa-chevron-down text-xs ml-1 transition-transform" :class="{ 'rotate-180': open }"></i>
                            </button>
                            <div x-show="open" 
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 transform scale-95"
                                 x-transition:enter-end="opacity-100 transform scale-100"
                                 x-transition:leave="transition ease-in duration-150"
                                 x-transition:leave-start="opacity-100 transform scale-100"
                                 x-transition:leave-end="opacity-0 transform scale-95"
                                 class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                <a href="/formation#digital-marketing" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Digital Marketing</div>
                                    <div class="text-sm text-gray-600">+6 formations marketing digital</div>
                                </a>
                                <a href="/formation#management" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Management & Leadership</div>
                                    <div class="text-sm text-gray-600">+5 formations management</div>
                                </a>
                                <a href="/formation#business-dev" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Business Développement</div>
                                    <div class="text-sm text-gray-600">+4 formations business</div>
                                </a>
                                <a href="/formation#industrie-securite" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Industrie & Sécurité</div>
                                    <div class="text-sm text-gray-600">+4 formations HACCP, ISO, BPF</div>
                                </a>
                                <a href="/formation#digitaliser" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition">
                                    <div class="font-bold text-gray-900 mb-1">Digitaliser vos formations</div>
                                    <div class="text-sm text-gray-600">Plateforme e-learning iSpring</div>
                                </a>
                            </div>
                        </div>
                        <a href="/#events" class="border-2 border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition font-bold text-sm">
                            <i class="fas fa-calendar-alt mr-2"></i>Events à venir
                        </a>
                    </div>
                    
                    <!-- Mobile menu button -->
                    <div class="md:hidden flex items-center">
                        <button @click="open = !open" class="text-gray-700">
                            <i class="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Mobile Menu -->
            <div x-show="open" class="md:hidden bg-white border-t">
                <div class="px-4 pt-2 pb-4 space-y-2">
                    <a href="/#qui-sommes-nous" class="block py-2 text-gray-700 font-medium">Qui Sommes-Nous</a>
                    <a href="/innovation" class="block py-2 text-black font-bold"><i class="fas fa-lightbulb mr-2"></i>CEM Innovation</a>
                    <a href="/marketing" class="block py-2 text-[#D4AF37] font-bold"><i class="fas fa-bullhorn mr-2"></i>CEM Marketing</a>
                    <a href="/formation" class="block py-2 text-black font-bold"><i class="fas fa-graduation-cap mr-2"></i>CEM Formation</a>
                    <a href="#events" class="block py-2 text-[#D4AF37] font-bold"><i class="fas fa-calendar-alt mr-2"></i>Events à venir</a>
                </div>
            </div>
        </nav>

        <section class="py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h1 class="text-5xl font-bold gradient-text mb-4">Toutes nos Actualités</h1>
                    <p class="text-xl text-gray-600">Découvrez nos derniers articles et insights</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8">
                    ${cardsHtml}
                </div>
            </div>
        </section>

                <!-- Footer -->
        <footer class="bg-black text-white py-12 border-t border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 class="text-2xl font-bold mb-4 gradient-text" style="-webkit-text-fill-color: white;">CEM GROUP</h3>
                        <p class="text-gray-400 mb-4">Quand la créativité rencontre la stratégie, elle transforme vos ambitions en succès.</p>
                        <div class="text-sm text-gray-500">
                            <p><i class="fas fa-map-marker-alt mr-2 text-[#D4AF37]"></i>17 rue Oraibi Jilali, 2ème étage</p>
                            <p class="ml-6">Casablanca, Maroc</p>
                            <p class="mt-2"><i class="fas fa-phone mr-2 text-[#D4AF37]"></i><a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a></p>
                            <p class="mt-1"><i class="fas fa-envelope mr-2 text-[#D4AF37]"></i><a href="mailto:contact@cembymazini.ma" class="hover:text-[#D4AF37] transition">contact@cembymazini.ma</a></p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-[#D4AF37]">Nos Services</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/marketing" class="hover:text-[#D4AF37] transition flex items-center">
                                <i class="fas fa-bullhorn mr-2 text-xs"></i>CEM Marketing
                            </a></li>
                            <li><a href="/formation" class="hover:text-#D4AF37 transition flex items-center">
                                <i class="fas fa-graduation-cap mr-2 text-xs"></i>CEM Formation
                            </a></li>
                            <li><a href="#innovation" class="hover:text-white transition flex items-center">
                                <i class="fas fa-lightbulb mr-2 text-xs"></i>CEM Innovation
                            </a></li>
                            <li><a href="/recrutement" class="hover:text-white transition flex items-center">
                                <i class="fas fa-briefcase mr-2 text-xs"></i>Rejoignez-nous
                            </a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-#D4AF37">Liens Rapides</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#equipes" class="hover:text-white transition">Nos Équipes</a></li>
                            <li><a href="#clients" class="hover:text-white transition">Ils Nous Font Confiance</a></li>
                            <li><a href="/actualites" class="hover:text-white transition">Actualités</a></li>
                            <li><a href="#contact" class="hover:text-white transition">Contact</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-white">
                            <i class="fas fa-share-alt mr-2"></i>Suivez-nous
                        </h4>
                        <p class="text-gray-400 text-sm mb-4">Rejoignez notre communauté sur les réseaux sociaux</p>
                        <div class="flex flex-wrap gap-3">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#0077B5] hover:scale-110 transition-all group border border-gray-700"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-black hover:to-#D4AF37 hover:scale-110 transition-all group border border-gray-700"
                               title="Instagram">
                                <i class="fab fa-instagram text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#1877F2] hover:scale-110 transition-all group border border-gray-700"
                               title="Facebook">
                                <i class="fab fa-facebook-f text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all group border border-gray-700"
                               title="TikTok">
                                <i class="fab fa-tiktok text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                        </div>
                        <p class="text-gray-500 text-xs mt-4">
                            <i class="fas fa-users mr-1"></i>Rejoignez +5000 abonnés
                        </p>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 pt-8 text-center">
                    <p class="text-gray-500">&copy; 2026 CEM GROUP. Tous droits réservés.</p>
                    <p class="text-gray-600 text-sm mt-2">Créé avec <i class="fas fa-heart text-red-500 mx-1"></i> par CEM Marketing</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
    `);
});

blogApp.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const blogs = await blogService.getAll(c.env);
    const blog = blogs.find(b => b.slug === slug);

    if (!blog) {
        return c.html('<h1>Article non trouvé</h1>', 404);
    }

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${blog.title} - CEM GROUP</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
             @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
            body { font-family: 'Montserrat', sans-serif; }
            .prose h2 { color: #D4AF37; font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
            .prose p { margin-bottom: 1rem; line-height: 1.7; }
            .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
            .gradient-text { background: linear-gradient(to right, #D4AF37, #FFD700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        </style>
    </head>
    <body class="bg-white">
                 <!-- Barre Réseaux Sociaux Top -->
        <div class="fixed top-0 w-full bg-gradient-to-r from-black via-gray-900 to-black z-50 py-2 border-b border-[#D4AF37]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <span class="text-white text-sm hidden sm:block">
                            <i class="fas fa-heart text-[#D4AF37] mr-2"></i>Suivez-nous
                        </span>
                        <div class="flex space-x-2">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition text-white text-sm"
                               title="TikTok">
                                <i class="fab fa-tiktok"></i>
                            </a>
                        </div>
                    </div>
                    <div class="text-white text-xs hidden md:block">
                        <i class="fas fa-phone-alt text-[#D4AF37] mr-2"></i>
                        <a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a>
                        <span class="mx-3">|</span>
                        <i class="fas fa-envelope text-[#D4AF37] mr-2"></i>
                        <a href="mailto:contact@cembymazini.ma" class="hover:text-[#D4AF37] transition">contact@cembymazini.ma</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Navigation (décalée pour barre sociale) -->
        <nav class="fixed w-full top-10 z-40 bg-white shadow-lg" x-data="{ open: false, marketingOpen: false, formationOpen: false }">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto"></a>
                    </div>
                    
                    <!-- Desktop Menu -->
                    <div class="hidden md:flex items-center space-x-6">
                        <a href="/#qui-sommes-nous" class="text-gray-700 hover:text-[#D4AF37] transition font-medium">Qui Sommes-Nous</a>
                        <a href="/innovation" class="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-900 transition font-bold shadow-lg text-sm">
                            <i class="fas fa-lightbulb mr-2"></i>CEM Innovation
                        </a>
                        <!-- Menu déroulant CEM Marketing -->
                        <div class="relative" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                            <a href="/marketing" class="bg-[#D4AF37] text-white px-5 py-2 rounded-full hover:bg-[#B8941F] transition font-bold shadow-lg text-sm inline-flex items-center">
                                <i class="fas fa-bullhorn mr-2"></i>CEM Marketing <i class="fas fa-chevron-down text-xs ml-1"></i>
                            </a>
                            <div x-show="open" 
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 transform scale-95"
                                 x-transition:enter-end="opacity-100 transform scale-100"
                                 x-transition:leave="transition ease-in duration-150"
                                 x-transition:leave-start="opacity-100 transform scale-100"
                                 x-transition:leave-end="opacity-0 transform scale-95"
                                 class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                <a href="/marketing#cem-leads" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">CEM LEADS</div>
                                    <div class="text-sm text-gray-600">Génération de leads B2B</div>
                                </a>
                                <a href="/marketing#cem-studio" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">CEM STUDIO</div>
                                    <div class="text-sm text-gray-600">Production audiovisuelle</div>
                                </a>
                                <a href="/marketing#cem-branding" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition">
                                    <div class="font-bold text-gray-900 mb-1">CEM BRANDING</div>
                                    <div class="text-sm text-gray-600">Personal branding LinkedIn</div>
                                </a>
                            </div>
                        </div>
                        
                        <!-- Menu déroulant CEM Formation -->
                        <div class="relative" x-data="{ open: false }" @click.away="open = false">
                            <button type="button" @click="open = !open" class="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-900 transition font-bold shadow-lg text-sm inline-flex items-center cursor-pointer">
                                <i class="fas fa-graduation-cap mr-2"></i>CEM Formation <i class="fas fa-chevron-down text-xs ml-1 transition-transform" :class="{ 'rotate-180': open }"></i>
                            </button>
                            <div x-show="open" 
                                 x-transition:enter="transition ease-out duration-200"
                                 x-transition:enter-start="opacity-0 transform scale-95"
                                 x-transition:enter-end="opacity-100 transform scale-100"
                                 x-transition:leave="transition ease-in duration-150"
                                 x-transition:leave-start="opacity-100 transform scale-100"
                                 x-transition:leave-end="opacity-0 transform scale-95"
                                 class="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                <a href="/formation#digital-marketing" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Digital Marketing</div>
                                    <div class="text-sm text-gray-600">+6 formations marketing digital</div>
                                </a>
                                <a href="/formation#management" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Management & Leadership</div>
                                    <div class="text-sm text-gray-600">+5 formations management</div>
                                </a>
                                <a href="/formation#business-dev" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Business Développement</div>
                                    <div class="text-sm text-gray-600">+4 formations business</div>
                                </a>
                                <a href="/formation#industrie-securite" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition border-b border-gray-100">
                                    <div class="font-bold text-gray-900 mb-1">Industrie & Sécurité</div>
                                    <div class="text-sm text-gray-600">+4 formations HACCP, ISO, BPF</div>
                                </a>
                                <a href="/formation#digitaliser" @click="open = false" class="block px-6 py-4 hover:bg-[#D4AF37]/10 transition">
                                    <div class="font-bold text-gray-900 mb-1">Digitaliser vos formations</div>
                                    <div class="text-sm text-gray-600">Plateforme e-learning iSpring</div>
                                </a>
                            </div>
                        </div>
                        <a href="/#events" class="border-2 border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition font-bold text-sm">
                            <i class="fas fa-calendar-alt mr-2"></i>Events à venir
                        </a>
                    </div>
                    
                    <!-- Mobile menu button -->
                    <div class="md:hidden flex items-center">
                        <button @click="open = !open" class="text-gray-700">
                            <i class="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Mobile Menu -->
            <div x-show="open" class="md:hidden bg-white border-t">
                <div class="px-4 pt-2 pb-4 space-y-2">
                    <a href="/#qui-sommes-nous" class="block py-2 text-gray-700 font-medium">Qui Sommes-Nous</a>
                    <a href="/innovation" class="block py-2 text-black font-bold"><i class="fas fa-lightbulb mr-2"></i>CEM Innovation</a>
                    <a href="/marketing" class="block py-2 text-[#D4AF37] font-bold"><i class="fas fa-bullhorn mr-2"></i>CEM Marketing</a>
                    <a href="/formation" class="block py-2 text-black font-bold"><i class="fas fa-graduation-cap mr-2"></i>CEM Formation</a>
                    <a href="#events" class="block py-2 text-[#D4AF37] font-bold"><i class="fas fa-calendar-alt mr-2"></i>Events à venir</a>
                </div>
            </div>
        </nav>

        <article>
            <!-- Hero Image -->
            <div class="w-full h-96 relative">
                <img src="${blog.coverImage || '/static/default-blog.jpg'}" alt="${blog.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div class="text-center px-4 max-w-4xl">
                        <span class="bg-[#D4AF37] text-white px-4 py-1 rounded-full text-sm font-bold mb-4 inline-block">${blog.category || 'Actualité'}</span>
                        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">${blog.title}</h1>
                        <p class="text-gray-300 text-lg">Publié le ${new Date(blog.publishedAt).toLocaleDateString('fr-FR')} par ${blog.author}</p>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="max-w-3xl mx-auto px-4 py-16">
                <div class="prose prose-lg mx-auto text-gray-800">
                    ${blog.content} 
                    <!-- Note: In a real app, use a markdown parser appropriately if content is markdown, but here passing raw HTML/Text -->
                </div>
                
                <div class="mt-12 pt-8 border-t border-gray-200">
                    <h3 class="text-xl font-bold mb-4">Tags</h3>
                    <div class="flex flex-wrap gap-2">
                        ${blog.tags ? blog.tags.split(',').map(tag => `<span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">#${tag.trim()}</span>`).join('') : ''}
                    </div>
                </div>
            </div>
        </article>
        
                <!-- Footer -->
        <footer class="bg-black text-white py-12 border-t border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 class="text-2xl font-bold mb-4 gradient-text" style="-webkit-text-fill-color: white;">CEM GROUP</h3>
                        <p class="text-gray-400 mb-4">Quand la créativité rencontre la stratégie, elle transforme vos ambitions en succès.</p>
                        <div class="text-sm text-gray-500">
                            <p><i class="fas fa-map-marker-alt mr-2 text-[#D4AF37]"></i>17 rue Oraibi Jilali, 2ème étage</p>
                            <p class="ml-6">Casablanca, Maroc</p>
                            <p class="mt-2"><i class="fas fa-phone mr-2 text-[#D4AF37]"></i><a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a></p>
                            <p class="mt-1"><i class="fas fa-envelope mr-2 text-[#D4AF37]"></i><a href="mailto:contact@cembymazini.ma" class="hover:text-[#D4AF37] transition">contact@cembymazini.ma</a></p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-[#D4AF37]">Nos Services</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/marketing" class="hover:text-[#D4AF37] transition flex items-center">
                                <i class="fas fa-bullhorn mr-2 text-xs"></i>CEM Marketing
                            </a></li>
                            <li><a href="/formation" class="hover:text-#D4AF37 transition flex items-center">
                                <i class="fas fa-graduation-cap mr-2 text-xs"></i>CEM Formation
                            </a></li>
                            <li><a href="#innovation" class="hover:text-white transition flex items-center">
                                <i class="fas fa-lightbulb mr-2 text-xs"></i>CEM Innovation
                            </a></li>
                            <li><a href="/recrutement" class="hover:text-white transition flex items-center">
                                <i class="fas fa-briefcase mr-2 text-xs"></i>Rejoignez-nous
                            </a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-#D4AF37">Liens Rapides</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#equipes" class="hover:text-white transition">Nos Équipes</a></li>
                            <li><a href="#clients" class="hover:text-white transition">Ils Nous Font Confiance</a></li>
                            <li><a href="/actualites" class="hover:text-white transition">Actualités</a></li>
                            <li><a href="#contact" class="hover:text-white transition">Contact</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-white">
                            <i class="fas fa-share-alt mr-2"></i>Suivez-nous
                        </h4>
                        <p class="text-gray-400 text-sm mb-4">Rejoignez notre communauté sur les réseaux sociaux</p>
                        <div class="flex flex-wrap gap-3">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#0077B5] hover:scale-110 transition-all group border border-gray-700"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-black hover:to-#D4AF37 hover:scale-110 transition-all group border border-gray-700"
                               title="Instagram">
                                <i class="fab fa-instagram text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#1877F2] hover:scale-110 transition-all group border border-gray-700"
                               title="Facebook">
                                <i class="fab fa-facebook-f text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all group border border-gray-700"
                               title="TikTok">
                                <i class="fab fa-tiktok text-xl text-gray-400 group-hover:text-white"></i>
                            </a>
                        </div>
                        <p class="text-gray-500 text-xs mt-4">
                            <i class="fas fa-users mr-1"></i>Rejoignez +5000 abonnés
                        </p>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 pt-8 text-center">
                    <p class="text-gray-500">&copy; 2026 CEM GROUP. Tous droits réservés.</p>
                    <p class="text-gray-600 text-sm mt-2">Créé avec <i class="fas fa-heart text-red-500 mx-1"></i> par CEM Marketing</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
    `);
});

export default blogApp;
