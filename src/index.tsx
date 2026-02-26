import { Hono } from 'hono'
import { cors } from 'hono/cors'
import adminApp from './api/admin'
import publicApp from './api/public'
import adminPagesApp from './pages/admin'
import blogApp from './pages/blog'
import eventsApp from './pages/events'
import formationApp from './pages/formation'
import { blogService, eventsService, popupService, plaquettesService } from './lib/sheets'
import { generateBlogSectionHtml, generateEventsSectionHtml, generatePopupHtml, generatePlaquettesHtml } from './lib/html-generators'
import { Bindings } from './bindings'

const app = new Hono<{ Bindings: Bindings }>()
console.log('[App] Hono instance created');

// Enable robust CORS
app.use('/api/*', cors({
    origin: '*',
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}))
console.log('[App] CORS enabled with robust config');

// Mount API routes
app.route('/api/admin', adminApp)
app.route('/api', publicApp)

// Mount admin pages
app.route('/admin', adminPagesApp)

// Mount /actualites route
app.route('/actualites', blogApp)
app.route('/events', eventsApp)
app.route('/formation', formationApp)
app.route('/formations', formationApp)

// Page principale CEM GROUP

app.get('/debug-fetch', async (c) => {
    try {
        const env = c.env;
        const results = await Promise.allSettled([
            blogService.getAll(env),
            eventsService.getAll(env),
            popupService.getAll(env),
            plaquettesService.getAll(env)
        ]);

        return c.json({
            blogs: results[0],
            events: {
                status: results[1].status,
                data: results[1].status === 'fulfilled' ? results[1].value.map(e => ({ title: e.title, isPinned: e.isPinned, typeOfPinned: typeof e.isPinned })) : results[1].reason
            },
            popups: results[2],
            plaquettes: results[3],
            env: {
                GAS_WEB_APP_URL: env.GAS_WEB_APP_URL ? 'Show: ' + env.GAS_WEB_APP_URL.substring(0, 10) + '...' : 'MISSING',
                GAS_API_TOKEN: env.GAS_API_TOKEN ? 'DEFINED' : 'MISSING'
            }
        });
    } catch (e: any) {
        return c.text('Global Error: ' + e.message + '\n' + e.stack);
    }
});

app.get('/', async (c) => {
    // Fetch dynamic content
    const env = c.env;
    const [blogs, events, popups, plaquettes] = await Promise.all([
        blogService.getAll(env).catch(() => []),
        eventsService.getAll(env).catch(() => []),
        popupService.getAll(env).catch(() => []),
        plaquettesService.getAll(env).catch(() => [])
    ]);

    const publishedBlogs = blogs.filter(b => b.status === 'published').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 3);
    // Show events if they are published AND (pinned OR future)
    const upcomingEvents = events.filter(e =>
        e.status === 'published' &&
        ((e.isPinned === true || String(e.isPinned).toLowerCase() === 'true') || new Date(e.date) >= new Date())
    ).sort((a, b) => {
        // Pinned first, then by date
        const aPinned = a.isPinned === true || String(a.isPinned).toLowerCase() === 'true';
        const bPinned = b.isPinned === true || String(b.isPinned).toLowerCase() === 'true';
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(0, 2);
    const activePopup = popups.find(p => p.isActive);
    const catalogueUrl = plaquettes.length > 0 ? plaquettes[0].url : '#';

    const blogHtml = generateBlogSectionHtml(publishedBlogs);
    const eventsHtml = generateEventsSectionHtml(upcomingEvents);
    const popupHtml = generatePopupHtml(activePopup);
    const plaquettesHtml = generatePlaquettesHtml(plaquettes);

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM GROUP - Agence Marketing Digital & Formation Professionnelle Casablanca | Stratégie, IA, Audiovisuel</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="CEM GROUP Casablanca: Expert en marketing digital, production vidéo professionnelle & formations certifiées. +500 clients depuis 2018. Transformez votre business !">
        <meta name="keywords" content="agence marketing digital casablanca, formation professionnelle maroc, production audiovisuelle, social branding, e-learning, intelligence artificielle, stratégie digitale, cem group, meryem mazini, acculturation IA">
        <meta name="author" content="CEM GROUP - Meryem Mazini">
        <meta name="robots" content="index, follow">
        <meta name="language" content="FR">
        <meta name="geo.region" content="MA-CAS">
        <meta name="geo.placename" content="Casablanca">
        <meta name="geo.position" content="33.589976;-7.629206">
        <link rel="canonical" href="https://cembymazini.ma/">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.0/dist/cdn.min.js"></script>
        
        <!-- Open Graph Meta Tags (Facebook, LinkedIn) -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="CEM GROUP - Agence Marketing Digital & Formation | Casablanca">
        <meta property="og:description" content="Leader en Marketing Digital, Production Audiovisuelle et Formation Professionnelle au Maroc. 16 services, 100+ clients satisfaits depuis 2018.">
        <meta property="og:url" content="https://cembymazini.ma/">
        <meta property="og:site_name" content="CEM GROUP">
        <meta property="og:locale" content="fr_MA">
        
        <!-- Twitter Card Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CEM GROUP - Agence Marketing Digital & Formation">
        <meta name="twitter:description" content="Leader en Marketing Digital, Production Audiovisuelle et Formation Professionnelle au Maroc.">
        
        <!-- Structured Data JSON-LD for SEO -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CEM GROUP",
          "alternateName": "CEM BY MAZINI",
          "url": "https://cembymazini.ma",
          "logo": "https://cembymazini.ma/logo.png",
          "description": "Agence de marketing digital et formation professionnelle à Casablanca, Maroc",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "17 rue Oraibi Jilali, 2ème étage",
            "addressLocality": "Casablanca",
            "postalCode": "20250",
            "addressCountry": "MA"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 33.589976,
            "longitude": -7.629206
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+212-5-22-00-00-00",
            "contactType": "customer service",
            "email": "contact@cembymazini.ma",
            "areaServed": "MA",
            "availableLanguage": ["fr", "ar"]
          },
          "founder": {
            "@type": "Person",
            "name": "Meryem Mazini",
            "jobTitle": "Fondatrice & Directrice Générale"
          },
          "sameAs": [
            "https://www.facebook.com/cembymazini",
            "https://www.instagram.com/cembymazini",
            "https://www.linkedin.com/company/cembymazini",
            "https://www.youtube.com/@cembymazini"
          ]
        }
        </script>
        
        <link href="/styles.css" rel="stylesheet">
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        
        <!-- Preload LCP image for fastest paint -->
        <link rel="preload" as="image" type="image/webp" href="/static/mascottes-cem-team.webp">
        
        <!-- Defer Font Awesome (decorative icons, not needed for FCP) -->
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        
        <!-- Defer Google Fonts (text renders with system font first, then swaps) -->
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript>
        
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    </head>
    <body class="smooth-scroll bg-gray-50">
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
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0077B5] transition text-white text-sm"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E4405F] transition text-white text-sm"
                               title="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#1877F2] transition text-white text-sm"
                               title="Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-black transition text-white text-sm"
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section avec Mascottes -->
        <section class="relative bg-black min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden">
            <!-- Animated Background Circles -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-20 left-10 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div class="absolute top-40 right-10 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div class="absolute bottom-20 left-1/2 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
            
            <div class="max-w-7xl mx-auto w-full relative z-10">
                <!-- Grid 2 Colonnes : Hook Gauche + Visuel Droite -->
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    
                    <!-- COLONNE GAUCHE : HOOK + CTA -->
                    <div class="fade-in-up text-left">
                        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            Quand la créativité rencontre la stratégie,<br/>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]">
                                elle transforme vos ambitions en succès
                            </span>
                        </h1>
                        <p class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
                            CEM GROUP réunit l'excellence en marketing digital et formation professionnelle depuis 2018
                        </p>
                        
                        <!-- CTAs -->
                        <div class="flex flex-wrap gap-4">
                            <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
                                <i class="fas fa-rocket mr-2"></i>
                                Démarrer mon projet
                            </a>
                            <a href="/#contact" class="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#D4AF37] hover:text-black transition-all inline-flex items-center">
                                <i class="fas fa-arrow-right mr-2"></i>
                                Demander le catalogue
                            </a>
                        </div>
                    </div>
                    
                    <!-- COLONNE DROITE : MASCOTTES CEM GROUP -->
                    <div class="relative fade-in-up animation-delay-2000">
                        <div class="relative">
                            <!-- Cercle décoratif en arrière-plan -->
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div class="w-full h-full bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/10 rounded-full blur-3xl animate-pulse"></div>
                            </div>
                            
                            <!-- Image Mascottes Équipe CEM -->
                            <div class="relative z-10">
                                <img src="/static/mascottes-cem-team.webp" 
                                     alt="Moumen Hebbour et Meryem Mazini - Fondateurs CEM GROUP Casablanca - Experts Marketing Digital et Formation Maroc" 
                                     fetchpriority="high"
                                     class="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500" loading="lazy" >
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <!-- Wave Separator: Black to White - Design Premium -->
            <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none transform translate-y-1">
                <svg class="relative block w-full h-32 md:h-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#FFFFFF" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </section>

        <!-- Section "Prêt à Transformer" -->
        <section id="qui-sommes-nous" class="relative bg-white py-20 px-4 overflow-hidden">
            <!-- Animated Background Circles -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-10 right-10 w-64 h-64 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div class="absolute bottom-10 left-10 w-80 h-80 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
            </div>
            <!-- Décoration background -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full filter blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full filter blur-3xl"></div>
            
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-12">
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fas fa-quote-left mr-2"></i>Le Mot de la Fondatrice
                    </div>
                    <h2 class="text-5xl font-bold text-gray-900 mb-4">Meryem Mazini</h2>
                    <p class="text-xl text-[#D4AF37] font-semibold">Fondatrice & Directrice Générale de CEM GROUP</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-12 items-start">
                    <!-- Image Meryem -->
                    <div class="relative">
                        <div class="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-3xl transform rotate-3"></div>
                        <div class="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl overflow-hidden p-2">
                            <img src="/static/meryem-mazini-pro-realiste.webp" alt="Meryem Mazini - Fondatrice et CEO CEM GROUP Casablanca - Experte Marketing Digital, Formation Professionnelle et Intelligence Artificielle au Maroc" loading="lazy" class="w-full h-full object-cover rounded-2xl" style="aspect-ratio: 3/4; max-height: 500px;" loading="lazy" >
                        </div>
                    </div>
                    
                    <!-- Storytelling -->
                    <div class="space-y-6">
                        <div class="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-[#D4AF37]">
                            <i class="fas fa-quote-left text-4xl text-[#D4AF37] mb-4"></i>
                            <p class="text-gray-700 text-lg leading-relaxed mb-4">
                                En 2018, j'ai fondé CEM GROUP avec une vision claire : <strong class="text-[#D4AF37]">démocratiser l'excellence</strong> en marketing digital et formation professionnelle au Maroc.
                            </p>
                            <p class="text-gray-700 text-lg leading-relaxed mb-4">
                                Notre mission ? Accompagner les entreprises et talents dans leur transformation digitale, avec <strong class="text-[#D4AF37]">créativité, stratégie et innovation</strong>.
                            </p>
                            <p class="text-gray-700 text-lg leading-relaxed mb-4">
                                Aujourd'hui, CEM GROUP c'est <strong class="text-[#D4AF37]">3 branches</strong> complémentaires : CEM MARKETING pour votre communication, CEM FORMATION pour le développement des compétences, et CEM INNOVATION pour anticiper l'avenir avec l'IA.
                            </p>
                            <p class="text-gray-700 text-lg leading-relaxed">
                                Avec <strong class="text-[#D4AF37]">100+ clients</strong> et <strong>500+ projets</strong>, nous continuons d'innover chaque jour pour vous offrir le meilleur.
                            </p>
                            <div class="mt-6 flex items-center">
                                <div>
                                    <a href="https://www.linkedin.com/in/meryem-mazini-personalbranding-stratégie-conseils-diagnostic/" target="_blank" class="text-gray-900 font-bold text-lg hover:text-[#D4AF37] transition-colors inline-flex items-center gap-2 no-underline">
                                        Meryem Mazini
                                        <i class="fab fa-linkedin text-[#0077B5] text-xl"></i>
                                    </a>
                                    <p class="text-gray-600">Fondatrice & DG</p>
                                </div>
                            </div>
                        </div>
                        

                    </div>
                </div>
            </div>
        </section>

        <!-- L'HISTOIRE DE CEM GROUP - COPYWRITING PUISSANT -->
        <!-- CTA Flottant / Sticky -->
        <div class="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
            <!-- Email Bouton -->
            <a href="mailto:contact@cembymazini.ma?subject=Demande%20d'information%20CEM%20GROUP&body=Bonjour%20CEM%20GROUP,%0A%0AJe%20souhaite%20obtenir%20des%20informations%20sur%20vos%20services.%0A%0ACordialement" 
               class="bg-[#D4AF37] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform hover:shadow-[#D4AF37]/50" 
               title="Email - contact@cembymazini.ma">
                <i class="fas fa-envelope text-2xl"></i>
            </a>
            <!-- WhatsApp Bouton -->
            <a href="https://wa.me/212688947098?text=Bonjour%20CEM%20GROUP,%20je%20souhaite%20obtenir%20des%20informations" 
               target="_blank"
               class="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform animate-pulse" 
               title="WhatsApp - Contact Direct">
                <i class="fab fa-whatsapp text-2xl"></i>
            </a>
        </div>

        <!-- Notre Histoire - Timeline HORIZONTALE FUTURISTE -->
        <section id="histoire" class="py-20 bg-black relative overflow-hidden">
            <!-- Particules animées -->
            <div class="particles">
                <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
                <div class="particle" style="left: 30%; animation-delay: 2s;"></div>
                <div class="particle" style="left: 50%; animation-delay: 4s;"></div>
                <div class="particle" style="left: 70%; animation-delay: 1s;"></div>
                <div class="particle" style="left: 90%; animation-delay: 3s;"></div>
            </div>
            
            <!-- Grille futuriste -->
            <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px); background-size: 50px 50px;"></div>
            
            <!-- Lumières ambiantes -->
            <div class="absolute top-1/2 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full filter blur-[120px] opacity-20 animate-pulse"></div>
            <div class="absolute top-1/2 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full filter blur-[120px] opacity-20 animate-pulse" style="animation-delay: 1.5s;"></div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <!-- Titre compact -->
                <div class="text-center mb-12">
                    <p class="text-[#D4AF37] text-xs mb-2 uppercase tracking-[0.3em]">
                        <span class="inline-block w-8 h-px bg-[#D4AF37] mr-2 align-middle"></span>
                        Notre Parcours
                        <span class="inline-block w-8 h-px bg-[#D4AF37] ml-2 align-middle"></span>
                    </p>
                    <h2 class="text-5xl font-black text-white neon-text mb-3">NOTRE HISTOIRE</h2>
                    <p class="text-gray-400 text-sm">Une évolution constante depuis 2018</p>
                </div>
                
                <div class="timeline-horizontal">
                    <div class="timeline-track">
                        <!-- Rail horizontal -->
                        <div class="timeline-rail-horizontal"></div>
                        
                        <!-- 2018 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2018</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-rocket"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">CRÉATION</h3>
                                <p class="text-gray-300 text-compact text-center">Fondation de CEM par Meryem Mazini avec une vision claire.</p>
                            </div>
                        </div>
                        
                        <!-- 2019 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2019</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">EXPANSION</h3>
                                <p class="text-gray-300 text-compact text-center">Social Branding et Marketing Digital. Premiers grands clients.</p>
                            </div>
                        </div>
                        
                        <!-- 2020 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2020</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-laptop-code"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">DIGITALISATION</h3>
                                <p class="text-gray-300 text-compact text-center">Division Formation et plateformes e-learning innovantes.</p>
                            </div>
                        </div>
                        
                        <!-- 2021 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2021</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-video"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">CEM MARKETING</h3>
                                <p class="text-gray-300 text-compact text-center">Agence de création digitale. Production audiovisuelle.</p>
                            </div>
                        </div>
                        
                        <!-- 2023 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2023</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-brain"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">INNOVATION IA</h3>
                                <p class="text-gray-300 text-compact text-center">Intelligence artificielle dans nos processus créatifs.</p>
                            </div>
                        </div>
                        
                        <!-- 2024 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal">2024</div>
                            <div class="card-compact">
                                <div class="icon-compact">
                                    <i class="fas fa-building"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">CONSOLIDATION</h3>
                                <p class="text-gray-300 text-compact text-center">Structuration CEM GROUP avec deux branches principales.</p>
                            </div>
                        </div>
                        
                        <!-- 2026 -->
                        <div class="timeline-card-horizontal">
                            <div class="year-badge-horizontal" style="border-color: #D4AF37; box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.9), 0 0 0 6px #D4AF37, 0 0 40px rgba(255, 215, 0, 0.9);">2026</div>
                            <div class="card-compact" style="border-color: #D4AF37;">
                                <div class="icon-compact" style="background: linear-gradient(135deg, #D4AF37, #D4AF37); box-shadow: 0 10px 30px rgba(255, 215, 0, 0.8);">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <h3 class="text-white neon-text-small font-black mb-2 text-center">VISION 2026</h3>
                                <p class="text-gray-200 text-compact text-center font-medium">Leader régional en transformation digitale.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CTA compact -->
                <div class="mt-16 text-center">
                    <div class="inline-block">
                        <div class="relative bg-black border border-[#D4AF37] rounded-2xl p-8 backdrop-blur-xl">
                            <h3 class="text-2xl font-black text-white mb-3">PRÊT À FAIRE PARTIE DE NOTRE HISTOIRE ?</h3>
                            <p class="text-gray-300 text-sm mb-6">Rejoignez les 100+ clients qui nous font confiance depuis 2018</p>
                            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="/marketing" class="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black px-8 py-3 rounded-full font-black text-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.8)]">
                                    <i class="fas fa-rocket mr-2"></i>BOOSTER MA VISIBILITÉ
                                </a>
                                <a href="/formation" class="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 rounded-full font-black text-sm transition-all duration-300 hover:bg-[#D4AF37] hover:text-black hover:scale-110">
                                    <i class="fas fa-lightbulb mr-2"></i>FORMER MES ÉQUIPES
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- Section CTAs Avant Footer -->
        <section class="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 relative overflow-hidden">
            <!-- Animated Background -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-10 left-10 w-72 h-72 bg-[#D4AF37] rounded-full filter blur-3xl animate-pulse"></div>
                <div class="absolute bottom-10 right-10 w-96 h-96 bg-#D4AF37 rounded-full filter blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-16">
                    <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
                        Prêt à transformer votre <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-500">vision en réalité</span> ?
                    </h2>
                    <p class="text-gray-300 text-lg max-w-3xl mx-auto">
                        Rejoignez les 100+ entreprises qui ont choisi CEM GROUP pour accélérer leur croissance
                    </p>
                </div>
                
                <!-- 3 CTAs Principaux -->
                <div class="grid md:grid-cols-3 gap-8">
                    <!-- CTA 1: Marketing -->
                    <div class="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl border border-gray-700 hover:border-[#D4AF37] transition-all group">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-bullhorn text-2xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-3">Boostez Votre Marketing</h3>
                        <p class="text-gray-400 mb-6">Production audiovisuelle, stratégie digitale et social branding pour des campagnes impactantes</p>
                        <div class="space-y-2 mb-6 text-sm text-gray-300">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>16 Services Marketing</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>Stratégie 360°</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>ROI Garanti</span>
                            </div>
                        </div>
                        <a href="/marketing" class="block w-full bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold py-4 rounded-xl text-center hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all">
                            Découvrir CEM Marketing <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                    
                    <!-- CTA 2: Formation -->
                    <div class="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl border border-gray-700 hover:border-#D4AF37 transition-all group">
                        <div class="w-16 h-16 bg-gradient-to-br from-#D4AF37 to-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-graduation-cap text-2xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-3">Formez Vos Équipes</h3>
                        <p class="text-gray-400 mb-6">+15 formations pro certifiantes en digital et management pour monter en compétences rapidement</p>
                        <div class="space-y-2 mb-6 text-sm text-gray-300">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-#D4AF37 mr-2"></i>
                                <span>+15 Formations Pro</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-#D4AF37 mr-2"></i>
                                <span>E-Learning + Présentiel</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-#D4AF37 mr-2"></i>
                                <span>95% Satisfaction</span>
                            </div>
                        </div>
                        <a href="/formation" class="block w-full bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold py-4 rounded-xl text-center hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all">
                            Découvrir CEM Formation <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                    
                    <!-- CTA 3: Contact -->
                    <div class="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl border border-gray-700 hover:border-[#D4AF37] transition-all group">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-comments text-2xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-3">Parlons de Votre Projet</h3>
                        <p class="text-gray-400 mb-6">Échangeons pour identifier vos besoins et vous proposer une solution sur-mesure</p>
                        <div class="space-y-2 mb-6 text-sm text-gray-300">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>Audit 30min</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>Devis Personnalisé</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-2"></i>
                                <span>Réponse rapide</span>
                            </div>
                        </div>
                        <a href="#contact" class="block w-full bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold py-4 rounded-xl text-center hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all">
                            Demander un Devis <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Télécharger le Catalogue - Entre Vision et Références -->
        <!-- CTA Télécharger le Catalogue - Design Élégant -->
        ${plaquettesHtml}

        <!-- Ils Nous Font Confiance -->
        <section id="clients" class="py-20 bg-black relative overflow-hidden">
            <!-- Background Effects -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-16">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| Nos Références</p>
                    <h2 class="text-5xl font-bold text-white mb-4">Ils Nous Font Confiance</h2>
                    <p class="text-xl text-gray-300 max-w-3xl mx-auto">Plus de 100 clients nous ont fait confiance depuis 2018. Rejoignez une communauté de marques qui réussissent.</p>
                </div>
                
                <!-- Logos Clients Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-center mb-16">
                    <div class="group bg-white rounded-2xl p-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-[#D4AF37] flex items-center justify-center aspect-video">
                        <img src="/logos/client-logo-1.webp" alt="Client 1" class="max-h-full max-w-full object-contain filter transition-transform duration-300 scale-[1.5] group-hover:scale-[1.7]" / loading="lazy" >
                    </div>
                    <div class="group bg-white rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-[#D4AF37] flex items-center justify-center aspect-video">
                        <img src="/logos/client-logo-2.webp" alt="Client 2" class="max-h-full max-w-full object-contain filter transition-transform duration-300 group-hover:scale-110" / loading="lazy" >
                    </div>
                    <div class="group bg-white rounded-2xl p-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-[#D4AF37] flex items-center justify-center aspect-video">
                        <img src="/logos/client-logo-3.webp" alt="Client 3" class="max-h-full max-w-full object-contain filter transition-transform duration-300 scale-[1.5] group-hover:scale-[1.7]" / loading="lazy" >
                    </div>
                    <div class="group bg-white rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-[#D4AF37] flex items-center justify-center aspect-video">
                        <img src="/logos/client-logo-4.webp" alt="Client 4" class="max-h-full max-w-full object-contain filter transition-transform duration-300 group-hover:scale-110" / loading="lazy" >
                    </div>
                    <div class="group bg-white rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-110 border-2 border-transparent hover:border-[#D4AF37] flex items-center justify-center aspect-video">
                        <img src="/logos/client-logo-5.webp" alt="Client 5" class="max-h-full max-w-full object-contain filter transition-transform duration-300 group-hover:scale-110" / loading="lazy" >
                    </div>
                </div>
                
                <!-- Statistiques Clients -->
                <div class="grid md:grid-cols-4 gap-8 text-center">
                    <div class="group">
                        <div class="text-5xl font-black text-[#D4AF37] mb-2 group-hover:scale-110 transition">100+</div>
                        <p class="text-gray-300 text-lg">Clients satisfaits</p>
                    </div>
                    <div class="group">
                        <div class="text-5xl font-black text-[#D4AF37] mb-2 group-hover:scale-110 transition">500+</div>
                        <p class="text-gray-300 text-lg">Projets réalisés</p>
                    </div>
                    <div class="group">
                        <div class="text-5xl font-black text-[#D4AF37] mb-2 group-hover:scale-110 transition">7+</div>
                        <p class="text-gray-300 text-lg">Années d'expérience</p>
                    </div>
                    <div class="group">
                        <div class="text-5xl font-black text-[#D4AF37] mb-2 group-hover:scale-110 transition">95%</div>
                        <p class="text-gray-300 text-lg">Clients fidèles</p>
                    </div>
                </div>
                
                <!-- CTA -->
                <div class="text-center mt-16">
                    <a href="/#contact" class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl">
                        <i class="fas fa-phone mr-3"></i>Appelez-nous pour votre projet
                        <i class="fas fa-arrow-right ml-3"></i>
                    </a>
                </div>
            </div>
        </section>

        ${eventsHtml}

        <!-- Nos Équipes / La Team -->
        <section id="equipes" class="py-20 bg-black">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-4">
                    <p class="text-[#D4AF37] text-lg mb-2">| La team</p>
                    <h2 class="text-5xl font-bold text-[#D4AF37] mb-8" style="color: #C9A962;">Ravis de vous accompagner</h2>
                </div>
                
                <div class="text-center mb-12">
                    <p class="text-white text-lg max-w-3xl mx-auto">
                        Notre équipe est composée de professionnels passionnés, prêts à vous guider et à transformer vos idées en succès. Ensemble, nous construisons des solutions innovantes et adaptées à vos besoins.
                    </p>
                </div>
                
                <!-- Grille des membres de l'équipe avec leurs informations -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    <!-- Meryem Mazini -->
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                                <img src="https://www.genspark.ai/api/files/s/JwnlUQaA" 
                                     alt="Meryem Mazini - CEO & Fondatrice CEM GROUP" 
                                     class="w-full h-full object-cover"
                                     loading="lazy" >
                            </div>
                        </div>
                        <h3 class="text-white font-bold text-lg mb-1">Meryem Mazini</h3>
                        <p class="text-[#D4AF37] text-sm font-bold">CEO & FONDATRICE</p>
                        <p class="text-gray-400 text-xs mt-1">
                            <a href="https://linkedinlocal.ma/" target="_blank" rel="noopener noreferrer" class="hover:text-[#D4AF37] transition underline">
                                Host of LinkedIn Local Morocco
                            </a>
                        </p>
                    </div>
                    
                    <!-- Moumen Hebbour -->
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                                <img src="https://www.genspark.ai/api/files/s/3xntIAP4" 
                                     alt="Moumen Hebbour - DGA CEM GROUP" 
                                     class="w-full h-full object-cover"
                                     loading="lazy" >
                            </div>
                        </div>
                        <h3 class="text-white font-bold text-lg mb-1">Moumen Hebbour</h3>
                        <p class="text-[#D4AF37] text-sm font-bold">DGA</p>
                    </div>
                    
                    <!-- Zineb Rais -->
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                                <img src="https://www.genspark.ai/api/files/s/QLn8q26N" 
                                     alt="Zineb Rais - Brand Manager CEM GROUP" 
                                     class="w-full h-full object-cover"
                                     loading="lazy" >
                            </div>
                        </div>
                        <h3 class="text-white font-bold text-lg mb-1">Zineb Rais</h3>
                        <p class="text-[#D4AF37] text-sm font-bold">Brand Manager</p>
                    </div>
                    
                    <!-- Ayman Aitmouss -->
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                                <img src="https://www.genspark.ai/api/files/s/RfWSyK7B" 
                                     alt="Ayman Aitmouss - Médiabuyer CEM GROUP" 
                                     class="w-full h-full object-cover"
                                     loading="lazy" >
                            </div>
                        </div>
                        <h3 class="text-white font-bold text-lg mb-1">Ayman Aitmouss</h3>
                        <p class="text-[#D4AF37] text-sm font-bold">Médiabuyer</p>
                    </div>
                    
                    <!-- Houssam Bayoud -->
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                                <img src="https://www.genspark.ai/api/files/s/kXtmzaUx" 
                                     alt="Houssam Bayoud - Développeur Web CEM GROUP" 
                                     class="w-full h-full object-cover"
                                     loading="lazy" >
                            </div>
                        </div>
                        <h3 class="text-white font-bold text-lg mb-1">Houssam Bayoud</h3>
                        <p class="text-[#D4AF37] text-sm font-bold">Développeur Web</p>
                    </div>
                </div>
                
                <!-- CTA après équipe -->
                <div class="mt-16 max-w-4xl mx-auto text-center">
                    <div class="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] rounded-3xl p-12 text-white">
                        <h3 class="text-4xl font-bold mb-4">Travaillons ensemble !</h3>
                        <p class="text-xl mb-8">Notre équipe d'experts est prête à vous accompagner dans votre transformation digitale</p>
                        <div class="flex justify-center">
                            <a href="#contact" class="bg-white text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition">
                                <i class="fas fa-calendar-check mr-2"></i>Prendre rendez-vous
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        ${blogHtml}


        <!-- Newsletter -->
        <section class="py-20 gradient-bg">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">Restez informé</h2>
                <p class="text-xl text-white/90 mb-8">Inscrivez-vous à notre newsletter pour recevoir nos dernières réalisations et conseils</p>
                
                <form x-data="{ email: '', loading: false, message: '' }" 
                      @submit.prevent="loading = true; fetch('/api/newsletter/subscribe', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' }, 
                          body: JSON.stringify({ email }) 
                      }).then(res => res.json()).then(data => { message = data.message || 'Merci !'; email = ''; }).catch(() => message = 'Erreur').finally(() => loading = false)"
                      class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <div class="flex-1 flex flex-col items-start gap-2 w-full">
                        <input type="email" x-model="email" required placeholder="Votre adresse email *" 
                               class="w-full px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50">
                        <span x-show="message" x-text="message" class="text-white text-sm font-semibold pl-4"></span>
                    </div>
                    <button type="submit" :disabled="loading" class="bg-white text-[#D4AF37] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-xl disabled:opacity-50">
                        <i class="fas fa-paper-plane mr-2"></i><span x-text="loading ? '...' : 'S\'inscrire'"></span>
                    </button>
                </form>
            </div>
        </section>

        <!-- REJOIGNEZ-NOUS - Section Recrutement Puissante -->
        <section class="py-20 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
            <!-- Effects lumineux animés -->
            <div class="absolute top-0 left-0 w-full h-full opacity-20">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px] animate-pulse"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px] animate-pulse" style="animation-delay: 1s;"></div>
                <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-#D4AF37 rounded-full blur-[150px] animate-pulse" style="animation-delay: 2s;"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <!-- Header -->
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black px-8 py-3 rounded-full text-sm font-black mb-6 uppercase tracking-wider shadow-2xl">
                        <i class="fas fa-users mr-2"></i>Carrières & Recrutement
                    </div>
                    <h2 class="text-5xl md:text-7xl font-black text-white mb-6">
                        REJOIGNEZ L'AVENTURE<br/>
                        <span class="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">CEM GROUP</span>
                    </h2>
                    <p class="text-2xl text-gray-300 max-w-4xl mx-auto mb-4">
                        Intégrez une équipe passionnée et innovante où talent rime avec épanouissement
                    </p>
                    <p class="text-lg text-gray-400 max-w-3xl mx-auto">
                        Nous recherchons des talents créatifs, stratèges et motivés pour façonner l'avenir du marketing digital et de la formation au Maroc
                    </p>
                </div>
                
                <!-- Grid Avantages + CTA -->
                <div class="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <!-- Avantages -->
                    <div class="space-y-6">
                        <div class="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37] transition-all hover:scale-105">
                            <div class="flex items-start">
                                <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                    <i class="fas fa-rocket text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white mb-2">Innovation Continue</h3>
                                    <p class="text-gray-400">Travaillez avec les dernières technologies : IA, audiovisuel, marketing digital</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37] transition-all hover:scale-105">
                            <div class="flex items-start">
                                <div class="w-16 h-16 bg-gradient-to-br from-#D4AF37 to-black rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                    <i class="fas fa-chart-line text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white mb-2">Croissance Rapide</h3>
                                    <p class="text-gray-400">Évoluez dans une structure dynamique avec de réelles opportunités de développement</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37] transition-all hover:scale-105">
                            <div class="flex items-start">
                                <div class="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                    <i class="fas fa-heart text-white neon-text-small text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white mb-2">Équipe Passionnée</h3>
                                    <p class="text-gray-400">Rejoignez des collaborateurs motivés partageant les mêmes valeurs d'excellence</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37] transition-all hover:scale-105">
                            <div class="flex items-start">
                                <div class="w-16 h-16 bg-gradient-to-br from-#D4AF37 to-#D4AF37 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                    <i class="fas fa-gifts text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white mb-2">Avantages & Culture</h3>
                                    <p class="text-gray-400">Rémunération attractive, formations continues, télétravail flexible, événements d'équipe</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CTA Visuel -->
                    <div class="relative">
                        <div class="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-12 shadow-2xl border-4 border-[#D4AF37]">
                            <div class="text-center mb-8">
                                <div class="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                    <i class="fas fa-briefcase text-white text-4xl"></i>
                                </div>
                                <h3 class="text-3xl font-black text-white neon-text-small mb-4">Postes Ouverts</h3>
                                <p class="text-gray-600 mb-6">Nous recrutons actuellement dans plusieurs domaines</p>
                            </div>
                            
                            <div class="space-y-3 mb-8">
                                <div class="flex items-center bg-gray-100 rounded-xl p-4">
                                    <i class="fas fa-check-circle text-[#D4AF37] text-xl mr-3"></i>
                                    <span class="font-semibold text-gray-800">Chef de Projet Marketing Digital</span>
                                </div>
                                <div class="flex items-center bg-gray-100 rounded-xl p-4">
                                    <i class="fas fa-check-circle text-[#D4AF37] text-xl mr-3"></i>
                                    <span class="font-semibold text-gray-800">Designer Graphique / Motion Designer</span>
                                </div>
                                <div class="flex items-center bg-gray-100 rounded-xl p-4">
                                    <i class="fas fa-check-circle text-[#D4AF37] text-xl mr-3"></i>
                                    <span class="font-semibold text-gray-800">Community Manager</span>
                                </div>
                                <div class="flex items-center bg-gray-100 rounded-xl p-4">
                                    <i class="fas fa-check-circle text-[#D4AF37] text-xl mr-3"></i>
                                    <span class="font-semibold text-gray-800">Formateur(trice) Professionnel(le)</span>
                                </div>
                                <div class="flex items-center bg-gray-100 rounded-xl p-4">
                                    <i class="fas fa-check-circle text-#D4AF37 text-xl mr-3"></i>
                                    <span class="font-semibold text-gray-800">Candidature Spontanée</span>
                                </div>
                            </div>
                            
                            <a href="/recrutement" class="block w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white text-center px-10 py-6 rounded-full font-black text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform">
                                <i class="fas fa-paper-plane mr-3"></i>POSTULER MAINTENANT
                                <i class="fas fa-arrow-right ml-3"></i>
                            </a>
                            
                            <p class="text-center text-gray-500 text-sm mt-4">
                                <i class="fas fa-clock mr-2"></i>Réponse sous 48h garantie
                            </p>
                        </div>
                        
                        <!-- Décorations -->
                        <div class="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-full opacity-20 animate-pulse"></div>
                        <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-#D4AF37 to-black rounded-full opacity-20 animate-pulse" style="animation-delay: 1s;"></div>
                    </div>
                </div>
                

        <!-- Contact -->
        <section id="contact" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-bold gradient-text mb-4">Contactez-nous</h2>
                    <p class="text-xl text-gray-600">Vous avez un projet en tête ? Parlons-en !</p>
                </div>

                <!-- Adresse et Formulaire -->
                <div class="grid md:grid-cols-2 gap-12 mb-16">
                    <!-- Informations de contact -->
                    <div class="space-y-8">
                        <div class="bg-gradient-to-br from-black to-gray-900 rounded-3xl p-8 text-white">
                            <h3 class="text-3xl font-bold mb-6 text-[#D4AF37]">
                                <i class="fas fa-map-marker-alt mr-3"></i>Notre Adresse
                            </h3>
                            <div class="space-y-4">
                                <div class="flex items-start">
                                    <i class="fas fa-building text-[#D4AF37] text-2xl mr-4 mt-1"></i>
                                    <div>
                                        <p class="text-xl font-bold mb-2">CEM GROUP</p>
                                        <a href="https://www.google.com/maps/search/?api=1&query=17+rue+Oraibi+Jilali+Casablanca+Maroc" target="_blank" class="hover:text-[#D4AF37] transition-colors group">
                                            <p class="text-gray-300 group-hover:text-[#D4AF37]">17 rue Oraibi Jilali</p>
                                            <p class="text-gray-300 group-hover:text-[#D4AF37]">2ème étage</p>
                                            <p class="text-gray-300 font-bold group-hover:text-[#D4AF37]">Casablanca, Maroc</p>
                                            <p class="text-xs text-[#D4AF37] mt-2">
                                                <i class="fas fa-map-marked-alt mr-2"></i>Cliquez pour voir sur Google Maps
                                            </p>
                                        </a>
                                    </div>
                                </div>
                                
                                <div class="flex items-center pt-4 border-t border-gray-700">
                                    <i class="fas fa-phone text-[#D4AF37] text-xl mr-4"></i>
                                    <div>
                                        <p class="text-gray-400 text-sm">Téléphone</p>
                                        <a href="tel:+212688947098" class="text-lg hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a>
                                    </div>
                                </div>
                                
                                <div class="flex items-center pt-4 border-t border-gray-700">
                                    <i class="fas fa-envelope text-[#D4AF37] text-xl mr-4"></i>
                                    <div>
                                        <p class="text-gray-400 text-sm">Email</p>
                                        <a href="mailto:contact@cembymazini.ma" class="text-lg hover:text-[#D4AF37] transition">contact@cembymazini.ma</a>
                                    </div>
                                </div>
                                
                                <div class="flex items-center pt-4 border-t border-gray-700">
                                    <i class="fas fa-clock text-[#D4AF37] text-xl mr-4"></i>
                                    <div>
                                        <p class="text-gray-400 text-sm">Horaires</p>
                                        <p class="text-lg">Lun - Ven : 9h - 18h</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Formulaire de contact -->
                    <div class="bg-white rounded-3xl p-8 shadow-2xl border-4 border-[#D4AF37]">
                        <div class="text-center mb-6">
                            <h3 class="text-3xl font-bold text-gray-800 mb-2">Envoyez-nous un message</h3>
                            <p class="text-gray-600">Remplissez le formulaire ci-dessous et nous vous répondrons rapidement</p>
                        </div>
                        <form x-data="{
                            formData: { name: '', email: '', company: '', service: '', message: '' },
                            loading: false, success: false, error: false,
                            async submitForm() {
                                this.loading = true; this.success = false; this.error = false;
                                try {
                                    const res = await fetch('/api/contact', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ...this.formData, source: 'Page Accueil' })
                                    });
                                    if (res.ok) {
                                        this.success = true;
                                        this.formData = { name: '', email: '', company: '', service: '', message: '' };
                                    } else { this.error = true; }
                                } catch(e) { this.error = true; } finally { this.loading = false; }
                            }
                        }" @submit.prevent="submitForm" class="space-y-4">
                            <div x-show="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                                <strong>Succès!</strong> Votre message a été envoyé. Nous vous répondrons rapidement.
                            </div>
                            <div x-show="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                                <strong>Erreur!</strong> Une erreur est survenue. Veuillez réessayer.
                            </div>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-2">Nom complet *</label>
                                    <input type="text" x-model="formData.name" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-2">Email *</label>
                                    <input type="email" x-model="formData.email" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Entreprise</label>
                                <input type="text" x-model="formData.company" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Service concerné *</label>
                                <select x-model="formData.service" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                                    <option value="" class="text-gray-900">Sélectionnez un service</option>
                                    <option value="marketing" class="text-gray-900">CEM Marketing</option>
                                    <option value="formation" class="text-gray-900">CEM Formation</option>
                                    <option value="autre" class="text-gray-900">Autre</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Votre message / Vos exigences</label>
                                <textarea x-model="formData.message" rows="4" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition" placeholder="Décrivez votre projet et vos exigences..."></textarea>
                            </div>
                            
                            <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-[#D4AF37] to-[#000000] text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition">
                                <span x-show="!loading"><i class="fas fa-paper-plane mr-2"></i>Envoyer le message</span>
                                <span x-show="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        
        <!-- Section LinkedIn Newsletter - Style CEM -->
        <section class="py-8 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] relative overflow-hidden">
            <!-- Decoration pattern -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-0 left-0 w-full h-full" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px);"></div>
            </div>
            
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                    <!-- Texte -->
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="text-2xl md:text-3xl font-bold text-black mb-2">
                            On se retrouve sur <span class="italic">LinkedIn</span> ?
                        </h3>
                        <p class="text-black/80 text-base md:text-lg">
                            Abonnez-vous à notre newsletter pour suivre nos projets, nos actus et un peu d'inspiration chaque mois.
                        </p>
                    </div>
                    
                    <!-- Bouton LinkedIn -->
                    <div class="flex-shrink-0">
                        <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
                            <i class="fab fa-linkedin-in text-xl"></i>
                            <span>S'abonner sur LinkedIn</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- FAQ CEM GROUP -->
        <section class="py-20 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Questions Fréquentes</h2>
                    <p class="text-xl text-gray-600">Tout ce que vous devez savoir sur CEM GROUP</p>
                </div>
                
                <div class="space-y-4" x-data="{ openFaq: null }">
                    <!-- FAQ 1 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 1 ? null : 1" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels services propose CEM GROUP ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 1 }"></i>
                        </button>
                        <div x-show="openFaq === 1" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            CEM GROUP propose 4 pôles d'expertise : <strong>CEM MARKETING</strong> (production vidéo, stratégie digitale, leads B2B), <strong>CEM FORMATION</strong> (19 formations professionnelles certifiées), <strong>CEM INNOVATION</strong> (formations IA et transformation digitale), et <strong>CEM STUDIO</strong> (production audiovisuelle).
                        </div>
                    </div>
                    
                    <!-- FAQ 2 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 2 ? null : 2" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Où êtes-vous situés ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 2 }"></i>
                        </button>
                        <div x-show="openFaq === 2" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Nous sommes basés à <strong>Casablanca, Maroc</strong>, au 17 rue Oraibi Jilali, 2ème étage. Nos services sont accessibles partout au Maroc et à l'international en distanciel.
                        </div>
                    </div>
                    
                    <!-- FAQ 3 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 3 ? null : 3" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Combien de clients avez-vous accompagnés ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 3 }"></i>
                        </button>
                        <div x-show="openFaq === 3" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Depuis 2018, nous avons accompagné <strong>plus de 500 clients</strong> (entreprises, startups, PME, grandes entreprises) et formé <strong>plus de 1000 professionnels</strong> au Maroc et à l'international.
                        </div>
                    </div>
                    
                    <!-- FAQ 4 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 4 ? null : 4" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels types d'entreprises travaillez-vous avec ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 4 }"></i>
                        </button>
                        <div x-show="openFaq === 4" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Nous accompagnons des <strong>startups, PME, ETI et grandes entreprises</strong> dans tous les secteurs : tech, retail, industrie, santé, finance, etc. Notre approche s'adapte à votre taille et vos objectifs.
                        </div>
                    </div>
                    
                    <!-- FAQ 5 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 5 ? null : 5" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Proposez-vous un audit ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 5 }"></i>
                        </button>
                        <div x-show="openFaq === 5" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Oui ! Nous offrons un <strong>audit de 30 minutes</strong> pour analyser vos besoins en marketing digital, formation ou transformation IA. Contactez-nous pour réserver votre créneau.
                        </div>
                    </div>
                    
                    <!-- FAQ 6 -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 6 ? null : 6" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Comment puis-je vous contacter ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 6 }"></i>
                        </button>
                        <div x-show="openFaq === 6" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Plusieurs options : <strong>Téléphone</strong> <a href="tel:+212688947098" class="text-[#D4AF37] hover:underline">+212 6 88 94 70 98</a>, <strong>Email</strong> <a href="mailto:contact@cembymazini.ma" class="text-[#D4AF37] hover:underline">contact@cembymazini.ma</a>, ou via notre <a href="#contact" class="text-[#D4AF37] hover:underline">formulaire de contact</a>.
                        </div>
                    </div>
                </div>
                
                <!-- CTA Restons en Contact -->
                <div class="mt-16 text-center bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-2xl p-12">
                    <h3 class="text-3xl font-bold text-white mb-4">Une autre question ?</h3>
                    <p class="text-white/90 text-lg mb-8">Notre équipe est là pour vous répondre</p>
                    <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-2xl">
                        <i class="fab fa-linkedin-in text-2xl"></i>
                        <span>Restons en Contact</span>
                    </a>
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
                               class="w-12 h-12 bg-[#0077B5] rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white/10"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in text-xl text-white"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-[#E4405F] rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white/10"
                               title="Instagram">
                                <i class="fab fa-instagram text-xl text-white"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white/10"
                               title="Facebook">
                                <i class="fab fa-facebook-f text-xl text-white"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-black rounded-lg flex items-center justify-center hover:scale-110 transition-all border border-white/10"
                               title="TikTok">
                                <i class="fab fa-tiktok text-xl text-white"></i>
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
  `)
})

// Routes Services Détaillés CEM MARKETING
app.get('/services/:slug', (c) => {
    const slug = c.req.param('slug')

    // Mapping des services
    const services: any = {
        'strategie-marque': {
            title: 'Stratégie de Marque',
            icon: 'fas fa-chart-line',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
            description: 'Construisez une identité de marque forte et distinctive qui résonne avec votre audience cible.',
            benefits: [
                'Audit complet de votre marque actuelle',
                'Analyse de la concurrence et positionnement',
                'Définition de votre ADN de marque',
                'Création d\'un territoire de communication unique',
                'Guide de style et charte graphique'
            ],
            process: [
                { step: '01', title: 'Audit & Analyse', desc: 'Diagnostic complet de votre marque et de son environnement' },
                { step: '02', title: 'Stratégie', desc: 'Définition du positionnement et des axes de communication' },
                { step: '03', title: 'Création', desc: 'Conception de l\'identité visuelle et verbale' },
                { step: '04', title: 'Déploiement', desc: 'Mise en œuvre sur tous vos supports de communication' }
            ],
            price: 'À partir de 2500€',
            duration: '4-6 semaines'
        },
        'reseaux-sociaux': {
            title: 'Gestion Réseaux Sociaux',
            icon: 'fas fa-hashtag',
            image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop',
            description: 'Développez votre présence sur les réseaux sociaux avec une stratégie cohérente et engageante.',
            benefits: [
                'Gestion complète de vos comptes sociaux',
                'Création de contenu original et engageant',
                'Community management réactif',
                'Analyse des performances et reporting',
                'Campagnes publicitaires ciblées'
            ],
            process: [
                { step: '01', title: 'Audit Social', desc: 'Analyse de votre présence actuelle sur les réseaux' },
                { step: '02', title: 'Stratégie', desc: 'Définition de la ligne éditoriale et du calendrier' },
                { step: '03', title: 'Production', desc: 'Création de contenus visuels et textuels' },
                { step: '04', title: 'Animation', desc: 'Publication, modération et engagement communauté' }
            ],
            price: 'À partir de 800€/mois',
            duration: 'Engagement minimum 6 mois'
        },
        'e-reputation': {
            title: 'E-Réputation',
            icon: 'fas fa-star',
            image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
            description: 'Protégez et améliorez votre réputation en ligne avec une veille et une gestion proactive.',
            benefits: [
                'Veille continue de votre e-réputation',
                'Gestion des avis clients',
                'Stratégie de gestion de crise',
                'Optimisation des résultats de recherche',
                'Reporting mensuel détaillé'
            ],
            process: [
                { step: '01', title: 'Audit', desc: 'État des lieux de votre réputation en ligne' },
                { step: '02', title: 'Veille', desc: 'Surveillance continue des mentions de votre marque' },
                { step: '03', title: 'Action', desc: 'Réponses aux avis et gestion des retours' },
                { step: '04', title: 'Amélioration', desc: 'Stratégie proactive pour renforcer votre image' }
            ],
            price: 'À partir de 600€/mois',
            duration: 'Engagement minimum 12 mois'
        },
        'influence-marketing': {
            title: 'Influence Marketing',
            icon: 'fas fa-users',
            image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
            description: 'Amplifiez votre message grâce à des partenariats stratégiques avec des influenceurs pertinents.',
            benefits: [
                'Identification des influenceurs pertinents',
                'Négociation et gestion des partenariats',
                'Création de campagnes d\'influence',
                'Suivi des performances et ROI',
                'Reporting détaillé des campagnes'
            ],
            process: [
                { step: '01', title: 'Ciblage', desc: 'Sélection des influenceurs alignés avec votre marque' },
                { step: '02', title: 'Brief', desc: 'Définition des objectifs et messages clés' },
                { step: '03', title: 'Campagne', desc: 'Coordination et suivi des publications' },
                { step: '04', title: 'Analyse', desc: 'Mesure des résultats et optimisation' }
            ],
            price: 'À partir de 1500€/campagne',
            duration: '2-4 semaines par campagne'
        },
        'films-institutionnels': {
            title: 'Films Institutionnels',
            icon: 'fas fa-film',
            image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=600&fit=crop',
            description: 'Racontez l\'histoire de votre entreprise avec des films corporate professionnels et impactants.',
            benefits: [
                'Scénarisation professionnelle',
                'Tournage HD/4K avec équipe complète',
                'Post-production et étalonnage',
                'Habillage graphique et animations',
                'Diffusion multi-plateformes'
            ],
            process: [
                { step: '01', title: 'Brief Créatif', desc: 'Définition des objectifs et du message' },
                { step: '02', title: 'Pré-production', desc: 'Scénario, storyboard et repérages' },
                { step: '03', title: 'Tournage', desc: 'Réalisation avec équipe technique pro' },
                { step: '04', title: 'Post-production', desc: 'Montage, étalonnage, sound design' }
            ],
            price: 'À partir de 3500€',
            duration: '3-6 semaines'
        },
        'motion-design': {
            title: 'Motion Design',
            icon: 'fas fa-magic',
            image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop',
            description: 'Animations 2D/3D percutantes pour expliquer vos concepts de manière visuelle et mémorable.',
            benefits: [
                'Animations 2D et 3D sur mesure',
                'Explainer videos pédagogiques',
                'Habillage graphique dynamique',
                'Logo animation et branding',
                'Formats adaptés tous supports'
            ],
            process: [
                { step: '01', title: 'Concept', desc: 'Définition du style et de l\'univers visuel' },
                { step: '02', title: 'Storyboard', desc: 'Création du déroulé et des transitions' },
                { step: '03', title: 'Animation', desc: 'Réalisation des animations 2D/3D' },
                { step: '04', title: 'Finalisation', desc: 'Sound design et exports finaux' }
            ],
            price: 'À partir de 2000€',
            duration: '2-4 semaines'
        },
        'videos-ia': {
            title: 'Vidéos IA',
            icon: 'fas fa-robot',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
            description: 'Production vidéo innovante avec avatars virtuels IA et génération de contenu assistée.',
            benefits: [
                'Avatars virtuels réalistes',
                'Génération de vidéos par IA',
                'Production rapide et économique',
                'Multilingue sans tournage',
                'Personnalisation à l\'infini'
            ],
            process: [
                { step: '01', title: 'Script', desc: 'Rédaction du contenu et messages' },
                { step: '02', title: 'Avatar', desc: 'Choix ou création de l\'avatar IA' },
                { step: '03', title: 'Génération', desc: 'Production vidéo par IA' },
                { step: '04', title: 'Édition', desc: 'Personnalisation et finalisation' }
            ],
            price: 'À partir de 800€',
            duration: '1-2 semaines'
        },
        'capsules-video': {
            title: 'Capsules Vidéo',
            icon: 'fas fa-mobile-alt',
            image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
            description: 'Contenus vidéo courts optimisés pour les réseaux sociaux et le storytelling moderne.',
            benefits: [
                'Formats courts et impactants',
                'Optimisés réseaux sociaux',
                'Tournage et montage rapides',
                'Stories, Reels, TikTok',
                'Production en série possible'
            ],
            process: [
                { step: '01', title: 'Concept', desc: 'Définition du format et du message' },
                { step: '02', title: 'Tournage', desc: 'Captation courte et dynamique' },
                { step: '03', title: 'Montage', desc: 'Édition rythmée avec effets' },
                { step: '04', title: 'Adaptation', desc: 'Déclinaisons pour chaque plateforme' }
            ],
            price: 'À partir de 400€/vidéo',
            duration: '1-2 semaines'
        },
        'strategie-digitale': {
            title: 'Stratégie Digitale',
            icon: 'fas fa-lightbulb',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
            description: 'Élaborez une stratégie digitale globale pour dominer votre marché en ligne.',
            benefits: [
                'Audit complet de votre présence digitale',
                'Définition des objectifs et KPIs',
                'Stratégie multi-canaux cohérente',
                'Plan d\'actions priorisé',
                'Accompagnement dans la mise en œuvre'
            ],
            process: [
                { step: '01', title: 'Diagnostic', desc: 'Analyse complète de votre écosystème digital' },
                { step: '02', title: 'Stratégie', desc: 'Définition des axes et leviers prioritaires' },
                { step: '03', title: 'Roadmap', desc: 'Plan d\'actions détaillé sur 12 mois' },
                { step: '04', title: 'Accompagnement', desc: 'Suivi et optimisation continue' }
            ],
            price: 'À partir de 3000€',
            duration: '4-8 semaines'
        },
        'publicite-en-ligne': {
            title: 'Publicité en Ligne',
            icon: 'fas fa-ad',
            image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop',
            description: 'Campagnes publicitaires performantes sur Google Ads, Meta Ads et LinkedIn Ads.',
            benefits: [
                'Stratégie publicitaire ROI-driven',
                'Création de campagnes optimisées',
                'Gestion quotidienne des budgets',
                'A/B testing et optimisation',
                'Reporting détaillé et transparent'
            ],
            process: [
                { step: '01', title: 'Stratégie', desc: 'Définition des objectifs et ciblages' },
                { step: '02', title: 'Setup', desc: 'Création des campagnes et annonces' },
                { step: '03', title: 'Lancement', desc: 'Activation et monitoring en temps réel' },
                { step: '04', title: 'Optimisation', desc: 'Tests et ajustements continus' }
            ],
            price: 'À partir de 500€/mois + budget pub',
            duration: 'Engagement minimum 3 mois'
        },
        'seo-contenu': {
            title: 'SEO & Contenu',
            icon: 'fas fa-search',
            image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&h=600&fit=crop',
            description: 'Optimisation SEO et création de contenu pour dominer les résultats de recherche Google.',
            benefits: [
                'Audit SEO technique complet',
                'Stratégie de mots-clés',
                'Optimisation on-page et off-page',
                'Création de contenu optimisé',
                'Netlinking et autorité de domaine'
            ],
            process: [
                { step: '01', title: 'Audit', desc: 'Analyse technique et positionnement actuel' },
                { step: '02', title: 'Stratégie', desc: 'Définition des mots-clés et contenus' },
                { step: '03', title: 'Optimisation', desc: 'Corrections techniques et contenus' },
                { step: '04', title: 'Suivi', desc: 'Monitoring des positions et ajustements' }
            ],
            price: 'À partir de 800€/mois',
            duration: 'Engagement minimum 6 mois'
        },
        'identite-visuelle': {
            title: 'Identité Visuelle',
            icon: 'fas fa-palette',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
            description: 'Créez une identité visuelle forte et mémorable qui reflète l\'essence de votre marque.',
            benefits: [
                'Logo professionnel et déclinaisons',
                'Charte graphique complète',
                'Palette de couleurs et typographies',
                'Templates et supports de communication',
                'Brand guidelines détaillées'
            ],
            process: [
                { step: '01', title: 'Briefing', desc: 'Compréhension de votre ADN de marque' },
                { step: '02', title: 'Recherches', desc: 'Exploration créative et moodboards' },
                { step: '03', title: 'Création', desc: 'Design du logo et éléments visuels' },
                { step: '04', title: 'Charte', desc: 'Documentation complète d\'utilisation' }
            ],
            price: 'À partir de 2500€',
            duration: '4-6 semaines'
        },
        'conseil-strategique': {
            title: 'Conseil Stratégique',
            icon: 'fas fa-chess',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
            description: 'Accompagnement stratégique pour les décideurs et transformations marketing majeures.',
            benefits: [
                'Diagnostic stratégique complet',
                'Recommandations personnalisées',
                'Plan de transformation marketing',
                'Accompagnement C-level',
                'Vision long terme et quick wins'
            ],
            process: [
                { step: '01', title: 'Immersion', desc: 'Compréhension approfondie de votre business' },
                { step: '02', title: 'Analyse', desc: 'Diagnostic stratégique et opportunités' },
                { step: '03', title: 'Recommandations', desc: 'Présentation des axes stratégiques' },
                { step: '04', title: 'Roadmap', desc: 'Plan d\'actions priorisé et chiffré' }
            ],
            price: 'Sur devis',
            duration: '6-12 semaines'
        },
        'audits-marketing': {
            title: 'Audits Marketing',
            icon: 'fas fa-clipboard-check',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
            description: 'Audits complets de vos dispositifs marketing pour identifier axes d\'amélioration et opportunités.',
            benefits: [
                'Audit 360° de votre marketing',
                'Analyse de la concurrence',
                'Identification des gaps et opportunités',
                'Recommandations actionnables',
                'Priorisation des actions'
            ],
            process: [
                { step: '01', title: 'Collecte', desc: 'Rassemblement des données et accès' },
                { step: '02', title: 'Analyse', desc: 'Évaluation détaillée de chaque levier' },
                { step: '03', title: 'Benchmark', desc: 'Comparaison avec les best practices' },
                { step: '04', title: 'Restitution', desc: 'Présentation des conclusions et plan d\'action' }
            ],
            price: 'À partir de 2000€',
            duration: '2-4 semaines'
        },
        'copywriting': {
            title: 'Copywriting',
            icon: 'fas fa-pen-fancy',
            image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
            description: 'Rédaction persuasive et storytelling pour capter l\'attention et convertir vos audiences.',
            benefits: [
                'Rédaction persuasive et impactante',
                'Storytelling de marque',
                'Pages de vente optimisées',
                'Contenus SEO-friendly',
                'Adaptation à votre tone of voice'
            ],
            process: [
                { step: '01', title: 'Brief', desc: 'Compréhension de vos objectifs et cibles' },
                { step: '02', title: 'Recherche', desc: 'Analyse du marché et des messages' },
                { step: '03', title: 'Rédaction', desc: 'Création des contenus persuasifs' },
                { step: '04', title: 'Optimisation', desc: 'Tests et ajustements selon performances' }
            ],
            price: 'À partir de 500€',
            duration: '1-3 semaines'
        },
        'creation-graphique': {
            title: 'Création Graphique',
            icon: 'fas fa-paint-brush',
            image: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800&h=600&fit=crop',
            description: 'Design graphique créatif pour tous vos supports print et digital.',
            benefits: [
                'Designs créatifs et professionnels',
                'Supports print (flyers, brochures, affiches)',
                'Visuels digitaux (posts, bannières, ads)',
                'Infographies et présentations',
                'Fichiers sources fournis'
            ],
            process: [
                { step: '01', title: 'Brief', desc: 'Définition du besoin et objectifs' },
                { step: '02', title: 'Création', desc: 'Design des visuels et déclinaisons' },
                { step: '03', title: 'Révisions', desc: 'Ajustements selon vos retours' },
                { step: '04', title: 'Livraison', desc: 'Exports finaux dans tous les formats' }
            ],
            price: 'À partir de 300€',
            duration: '1-2 semaines'
        }
    }

    const service = services[slug]

    if (!service) {
        return c.redirect('/')
    }

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${service.title} - CEM GROUP</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section -->
        <section class="gradient-bg pt-32 pb-20 px-4">
            <div class="max-w-7xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div class="inline-block bg-white/10 px-4 py-2 rounded-full mb-6">
                            <span class="text-[#D4AF37] font-semibold">
                                <i class="${service.icon} mr-2"></i>CEM MARKETING
                            </span>
                        </div>
                        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">${service.title}</h1>
                        <p class="text-xl text-gray-300 mb-8">${service.description}</p>
                        <div class="flex flex-wrap gap-4">
                            <a href="/#contact" class="bg-[#D4AF37] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#B8941F] transition inline-block">
                                <i class="fas fa-rocket mr-2"></i>Démarrer mon projet
                            </a>
                            <a href="/marketing" class="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition inline-block">
                                <i class="fas fa-arrow-left mr-2"></i>Tous les services
                            </a>
                        </div>
                    </div>
                    <div>
                        <img src="${service.image}" alt="${service.title}" loading="lazy" class="rounded-3xl shadow-2xl" loading="lazy" >
                    </div>
                </div>
            </div>
        </section>

        <!-- Bénéfices -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-white neon-text-small mb-4">Ce que nous vous apportons</h2>
                    <p class="text-xl text-gray-600">Une approche complète et personnalisée</p>
                </div>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${service.benefits.map((benefit: string, i: number) => `
                        <div class="bg-gray-50 p-6 rounded-2xl hover:shadow-lg transition">
                            <div class="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center mb-4">
                                <i class="fas fa-check text-white text-xl"></i>
                            </div>
                            <p class="text-gray-800 font-semibold">${benefit}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Notre Processus -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-white neon-text-small mb-4">Notre processus en 4 étapes</h2>
                    <p class="text-xl text-gray-600">Une méthodologie éprouvée pour votre réussite</p>
                </div>
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    ${service.process.map((step: any) => `
                        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
                            <div class="text-6xl font-black text-[#D4AF37] mb-4 opacity-20">${step.step}</div>
                            <h3 class="text-2xl font-bold text-white neon-text-small mb-3">${step.title}</h3>
                            <p class="text-gray-600">${step.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Tarifs -->
        <section class="py-20 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-4xl font-bold text-white neon-text-small mb-8">Tarifs & Durée</h2>
                <div class="bg-gradient-to-br from-black to-gray-900 rounded-3xl p-12 text-white">
                    <div class="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Tarif</div>
                            <div class="text-4xl font-bold">${service.price}</div>
                        </div>
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Durée</div>
                            <div class="text-4xl font-bold">${service.duration}</div>
                        </div>
                    </div>
                    <a href="/#contact" class="bg-[#D4AF37] text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-[#B8941F] transition inline-block">
                        <i class="fas fa-comments mr-2"></i>Demander un devis
                    </a>
                </div>
            </div>
        </section>

        <!-- FAQ CEM MARKETING -->
        <section class="py-20 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Questions Fréquentes - CEM MARKETING</h2>
                    <p class="text-xl text-gray-600">Tout savoir sur nos services marketing digital</p>
                </div>
                
                <div class="space-y-4" x-data="{ openFaq: null }">
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 1 ? null : 1" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels sont les 3 piliers de CEM MARKETING ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 1 }"></i>
                        </button>
                        <div x-show="openFaq === 1" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>CEM LEADS</strong> (génération leads B2B), <strong>CEM STUDIO</strong> (production vidéo & motion design), et <strong>CEM BRANDING</strong> (personal branding LinkedIn & ghostwriting).
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 2 ? null : 2" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels types de vidéos produisez-vous ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 2 }"></i>
                        </button>
                        <div x-show="openFaq === 2" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Vidéos corporate, publicités, motion design, films 3D, reels, interviews, événements, teasers, podcasts vidéo, et contenus social media optimisés.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 3 ? null : 3" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Comment générez-vous des leads B2B qualifiés ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 3 }"></i>
                        </button>
                        <div x-show="openFaq === 3" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Via <strong>LinkedIn prospecting</strong>, content marketing stratégique, campagnes ciblées, automation intelligente et nurturing personnalisé. ROI mesurable garanti.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 4 ? null : 4" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Qu'est-ce que le personal branding LinkedIn ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 4 }"></i>
                        </button>
                        <div x-show="openFaq === 4" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Construction de votre <strong>marque personnelle</strong> sur LinkedIn : optimisation profil, stratégie contenu, ghostwriting de posts, storytelling, visibilité, génération d'opportunités business.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 5 ? null : 5" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels sont vos délais de production vidéo ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 5 }"></i>
                        </button>
                        <div x-show="openFaq === 5" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>2 à 6 semaines</strong> selon complexité : reel simple (2-3 jours), vidéo corporate (1-2 semaines), film 3D (3-6 semaines). Livraison express possible.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 6 ? null : 6" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Proposez-vous un accompagnement sur-mesure ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 6 }"></i>
                        </button>
                        <div x-show="openFaq === 6" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Oui ! Audit, stratégie 360° personnalisée, déploiement adapté à vos objectifs et budget. Contactez-nous : <a href="tel:+212688947098" class="text-[#D4AF37] hover:underline">+212 6 88 94 70 98</a>
                        </div>
                    </div>
                </div>
                
                <div class="mt-16 text-center bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-2xl p-12">
                    <h3 class="text-3xl font-bold text-white mb-4">Prêt à booster votre marketing ?</h3>
                    <p class="text-white/90 text-lg mb-8">Discutons de votre projet dès aujourd'hui</p>
                    <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-2xl">
                        <i class="fab fa-linkedin-in text-2xl"></i>
                        <span>Restons en Contact</span>
                    </a>
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
  `)
})

// Page CEM Marketing
app.get('/marketing', async (c) => {
    // Fetch dynamic content
    const [plaquettes, blogs] = await Promise.all([
        plaquettesService.getAll(c.env).catch(() => []),
        blogService.getAll(c.env).catch(() => []),
    ]);
    const plaquettesHtml = generatePlaquettesHtml(plaquettes);
    const latestBlogs = blogs.filter((b: any) => b.status === 'published').sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 4);

    const mktBlogsHtml = latestBlogs.length > 0 ? latestBlogs.map((blog: any) => `
        <div class="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37] group">
            <div class="h-48 overflow-hidden">
                ${blog.coverImage ? `<img src="${blog.coverImage}" alt="${blog.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" >` : `<div class="h-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center"><i class="fas fa-newspaper text-white text-5xl"></i></div>`}
            </div>
            <div class="p-6">
                <div class="text-[#D4AF37] text-sm font-bold mb-2">
                    <i class="fas fa-calendar mr-2"></i>${new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    ${blog.category ? ` <span class="ml-2 bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full text-xs">${blog.category}</span>` : ''}
                </div>
                <h3 class="text-xl font-bold mb-3 line-clamp-2">${blog.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${blog.excerpt || (blog.content ? blog.content.substring(0, 120) + '...' : '')}</p>
                <a href="/actualites/${blog.slug || blog.id}" class="text-[#D4AF37] font-bold hover:underline">
                    Lire l'article <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </div>
    `).join('') : `
        <div class="col-span-full text-center py-12 text-gray-500">
            <i class="fas fa-newspaper text-4xl mb-4 text-gray-300"></i>
            <p class="text-lg">Aucun article pour le moment.</p>
        </div>
    `;

    // Note: catalogUrl is for the "Demander le catalogue" button that drives to contact
    // For now we keep it hardcoded or use a specific one if needed, but the button uses /#contact

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr" x-data="{ activeService: null }">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM MARKETING - Agence Marketing Digital Casablanca | Vidéo, Social Media & Leads B2B</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="CEM MARKETING Casablanca: Génération de leads B2B, production vidéo professionnelle & personal branding LinkedIn. Agence digitale au Maroc. Audit !">
        <meta name="keywords" content="agence marketing digital casablanca, production vidéo maroc, social media management, leads b2b, linkedin maroc, personal branding, ghostwriting, copywriting maroc">
        <meta name="author" content="CEM GROUP - CEM Marketing">
        <meta name="robots" content="index, follow">
        <meta name="geo.region" content="MA-CAS">
        <meta name="geo.placename" content="Casablanca">
        <link rel="canonical" href="https://cembymazini.ma/marketing">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="CEM MARKETING - Production Vidéo, Social Media & Leads B2B | Casablanca">
        <meta property="og:description" content="CEM STUDIO : Vidéo & Motion Design | CEM LEAD : Acquisition Digitale | CEM BRANDING : Personal Branding LinkedIn. +500 clients satisfaits.">
        <meta property="og:url" content="https://cembymazini.ma/marketing">
        <meta property="og:site_name" content="CEM GROUP">
        <meta property="og:locale" content="fr_MA">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CEM MARKETING - Agence Marketing Digital Casablanca">
        <meta name="twitter:description" content="Production vidéo, social media & leads B2B. Devis 24h.">
        
        <!-- Schema.org JSON-LD -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Marketing Digital",
          "provider": {
            "@type": "Organization",
            "name": "CEM GROUP",
            "url": "https://cembymazini.ma"
          },
          "areaServed": {
            "@type": "Country",
            "name": "Maroc"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Services CEM MARKETING",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "CEM STUDIO - Production Audiovisuelle",
                  "description": "Production vidéo professionnelle, motion design, photo studio"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "CEM LEAD - Génération de Leads",
                  "description": "Acquisition digitale, social media, publicité en ligne"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "CEM BRANDING - Personal Branding",
                  "description": "LinkedIn, copywriting stratégique, stratégie de marque"
                }
              }
            ]
          }
        }
        </script>
        
        <link href="/styles.css" rel="stylesheet">
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            /* Animations blob */
            @keyframes blob {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(20px, -20px) scale(1.1); }
                50% { transform: translate(-20px, 20px) scale(0.9); }
                75% { transform: translate(20px, 20px) scale(1.05); }
            }
            
            .animate-blob {
                animation: blob 7s infinite;
            }
            
            .animation-delay-2000 {
                animation-delay: 2s;
            }
            
            .animation-delay-4000 {
                animation-delay: 4s;
            }
            
            /* Animation float pour mascottes */
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            .animate-float {
                animation: float 3s ease-in-out infinite;
            }
            
            /* Styles 3D */
            .perspective-1000 {
                perspective: 1000px;
            }
            
            .transform-3d {
                transform-style: preserve-3d;
            }
            
            .rotate-y-12 {
                transform: rotateY(12deg);
            }
            
            @keyframes float-3d {
                0%, 100% { 
                    transform: translateY(0px) rotateY(0deg);
                }
                50% { 
                    transform: translateY(-10px) rotateY(5deg);
                }
            }
            
            .group:hover .transform-3d {
                animation: float-3d 2s ease-in-out infinite;
            }
            
            /* Alpine.js - Cacher les éléments avant initialisation */
            [x-cloak] { 
                display: none !important; 
            }
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section : À Propos CEM MARKETING -->
        <section class="relative bg-black min-h-screen flex items-center justify-center pt-20 px-4 pb-32 md:pb-40 overflow-hidden">
            <!-- Grille de points dorés en arrière-plan -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background-image: radial-gradient(circle, #D4AF37 1px, transparent 1px); background-size: 50px 50px;"></div>
            </div>
            
            <!-- Blobs décoratifs dorés animés -->
            <div class="absolute top-20 -left-20 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
            <div class="absolute top-40 -right-20 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div class="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            
            <div class="max-w-7xl mx-auto w-full relative z-10">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    <!-- COLONNE GAUCHE : COPYWRITING STRATÉGIQUE -->
                    <div class="text-left text-white space-y-8">
                        <!-- Badge -->
                        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-[#D4AF37]/30">
                            <div class="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                            <span class="text-sm font-semibold text-[#D4AF37]">Depuis 2018 • Casablanca, Maroc</span>
                        </div>
                        
                        <!-- Titre Principal -->
                        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                            <span class="text-white">Transformez votre</span>
                            <br>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]">présence digitale</span>
                            <br>
                            <span class="text-white">en moteur de croissance</span>
                        </h1>
                        
                        <!-- Description Professionnelle -->
                        <div class="space-y-4">
                            <p class="text-lg md:text-xl text-gray-300 leading-relaxed">
                                <strong class="text-white">CEM MARKETING</strong> est votre partenaire stratégique pour bâtir une présence digitale qui génère des résultats mesurables.
                            </p>
                            <p class="text-base md:text-lg text-gray-400 leading-relaxed">
                                De la production audiovisuelle professionnelle à la génération de leads B2B, en passant par le personal branding LinkedIn — nous déployons une expertise 360° au service de votre croissance.
                            </p>
                        </div>
                        
                        <!-- 3 Piliers avec icônes carrées dorées -->
                        <div class="grid grid-cols-3 gap-4 pt-4">
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fas fa-video text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">CEM STUDIO</p>
                                <p class="text-sm text-white font-bold mt-1">Production Vidéo</p>
                            </div>
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fas fa-rocket text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">CEM LEAD</p>
                                <p class="text-sm text-white font-bold mt-1">Génération Leads</p>
                            </div>
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fab fa-linkedin text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">CEM BRANDING</p>
                                <p class="text-sm text-white font-bold mt-1">Personal Branding</p>
                            </div>
                        </div>
                        
                        <!-- Stats Crédibilité -->
                        <div class="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                            <div>
                                <div class="text-3xl md:text-4xl font-black text-[#D4AF37]">100+</div>
                                <p class="text-sm text-gray-400 mt-1">Clients actifs</p>
                            </div>
                            <div>
                                <div class="text-3xl md:text-4xl font-black text-[#D4AF37]">500+</div>
                                <p class="text-sm text-gray-400 mt-1">Projets livrés</p>
                            </div>
                        </div>
                        
                        <!-- CTAs -->
                        <div class="flex flex-wrap gap-4 pt-4">
                            <a href="/#contact" class="group bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
                                <i class="fas fa-comments mr-2 group-hover:rotate-12 transition-transform"></i>
                                Démarrer un projet
                            </a>
                            <a href="/#contact" class="group bg-white/10 backdrop-blur-sm text-white border-2 border-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all inline-flex items-center">
                                <i class="fas fa-rocket mr-2 group-hover:scale-110 transition-transform"></i>
                                Demander le catalogue
                            </a>
                        </div>
                    </div>
                    
                    <!-- COLONNE DROITE : IMAGE MASCOTTES -->
                    <div class="relative flex items-center justify-center">
                        <img src="/static/mascottes-marketing.webp" 
                             alt="Moumen et Meryem - Équipe CEM MARKETING Casablanca" 
                             loading="lazy" class="w-full h-auto" loading="lazy" >
                    </div>
                </div>
            </div>
            
            <!-- Wave Separator Premium -->
            <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none transform translate-y-1">
                <svg class="relative block w-full h-32 md:h-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#F9FAFB;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#waveGradient)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </section>
        
        <!-- CTA Flottants Marketing -->
        <div class="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
            <!-- Email Bouton -->
            <a href="mailto:contact@cembymazini.ma?subject=Demande%20de%20devis%20CEM%20MARKETING&body=Bonjour%20CEM%20MARKETING,%0A%0AJe%20souhaite%20un%20devis%20pour%20un%20projet.%0A%0ACordialement" 
               class="bg-[#D4AF37] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform hover:shadow-[#D4AF37]/50" 
               title="Email - contact@cembymazini.ma">
                <i class="fas fa-envelope text-2xl"></i>
            </a>
            <!-- WhatsApp Bouton -->
            <a href="https://wa.me/212688947098?text=Bonjour%20CEM%20MARKETING,%20je%20souhaite%20un%20devis%20pour%20un%20projet" 
               target="_blank"
               class="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform animate-pulse" 
               title="WhatsApp - Contact Direct">
                <i class="fab fa-whatsapp text-2xl"></i>
            </a>
        </div>

        <!-- À PROPOS DE CEM MARKETING - Section Professionnelle -->
        <section class="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
            <!-- Décoration d'arrière-plan subtile -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-full filter blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#D4AF37]/5 to-transparent rounded-full filter blur-3xl"></div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    <!-- GAUCHE : Contenu texte professionnel -->
                    <div class="space-y-8">
                        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                            Votre <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFD700]">partenaire stratégique</span> en marketing digital
                        </h2>
                        
                        <p class="text-xl text-gray-600 leading-relaxed">
                            <strong class="text-gray-800">CEM MARKETING</strong> accompagne les entreprises marocaines dans leur transformation digitale depuis 2018. 
                        </p>
                        
                        <p class="text-lg text-gray-600 leading-relaxed">
                            De la <strong>stratégie de marque</strong> à la <strong>production audiovisuelle</strong>, en passant par la <strong>génération de leads B2B</strong> et le <strong>personal branding LinkedIn</strong>, nous combinons créativité, data et ROI pour propulser votre croissance.
                        </p>
                        
                        <!-- Liste des piliers (style épuré professionnel) -->
                        <div class="space-y-4">
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                                    <i class="fas fa-check text-[#D4AF37] text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-900 text-lg">Production Audiovisuelle Premium</h4>
                                    <p class="text-gray-600">Films corporate, motion design 2D/3D, storytelling vidéo qui convertit</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                                    <i class="fas fa-check text-[#D4AF37] text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-900 text-lg">Acquisition Digitale & Leads B2B</h4>
                                    <p class="text-gray-600">Sites web ROI-focused, campagnes ads, social selling LinkedIn, SEO</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                                    <i class="fas fa-check text-[#D4AF37] text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-900 text-lg">Personal Branding & Influence</h4>
                                    <p class="text-gray-600">Positionnement LinkedIn, ghostwriting premium, stratégie éditoriale</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- CTA professionnel (sans urgence) -->
                        <div class="pt-6">
                            <a href="/#contact" class="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all">
                                <i class="fas fa-calendar-check"></i>
                                <span>Demander un rendez-vous</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- DROITE : Image marketing professionnelle -->
                    <div class="relative">
                        <!-- Cadre avec ombre élégante -->
                        <div class="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all duration-500">
                            <img src="https://www.genspark.ai/api/files/s/dYROuCtR" 
                                 alt="CEM MARKETING - Production Audiovisuelle, Acquisition Digitale & Leads B2B, Personal Branding LinkedIn - Services Marketing Digital Premium Maroc" 
                                 loading="lazy" class="w-full h-auto transform hover:scale-105 transition-transform duration-700" loading="lazy" >
                        </div>
                        
                        <!-- Points décoratifs dorés -->
                        <div class="absolute -top-3 -left-3 w-6 h-6 bg-[#D4AF37] rounded-full shadow-lg"></div>
                        <div class="absolute -bottom-3 -right-3 w-6 h-6 bg-[#FFD700] rounded-full shadow-lg"></div>
                    </div>
                </div>
                

            </div>
        </section>


        <!-- Services -->
        <section id="services" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">Nos Services</h2>
                <p class="text-center text-gray-600 text-xl mb-16">Trois piliers pour votre succès digital</p>
                
                <!-- CEM LEADS : Génération de Leads B2B & Acquisition Digitale -->
                <div id="cem-leads" class="mb-20">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-chart-line text-white text-3xl"></i>
                        </div>
                        <h3 class="text-4xl font-bold gradient-text">CEM LEADS</h3>
                    </div>
                    <p class="text-gray-600 text-lg mb-8">Accélérez votre croissance avec une stratégie d'acquisition digitale B2B performante. De la génération de leads qualifiés à la conversion, nous transformons vos prospects en clients.</p>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <!-- Carte 1 : LinkedIn Outreach & Social Selling -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#0077B5] to-[#005885] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fab fa-linkedin text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">LinkedIn Outreach</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Prospection LinkedIn automatisée</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Social selling & personal branding</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Ciblage décideurs B2B précis</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Séquences de messages optimisées</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Suivi & relances automatiques</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 2 : Lead Generation & Conversion -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">

                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-magnet text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Lead Generation</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Landing pages haute conversion</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Lead magnets & contenus premium</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Formulaires intelligents</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Email marketing automation</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Nurturing & lead scoring</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 3 : Campagnes Ads B2B -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#4285F4] to-[#1a73e8] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-bullseye text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Campagnes Ads B2B</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Google Ads (Search & Display)</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>LinkedIn Ads (Sponsored Content)</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Retargeting & remarketing</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>A/B testing & optimisation</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Tracking & analytics avancés</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 4 : CRM & Sales Automation -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#00A4EF] to-[#0078D4] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-users-cog text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">CRM & Automation</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Intégration CRM (HubSpot, Pipedrive)</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Workflows de qualification</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Pipeline management & suivi</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Rapports & dashboards ROI</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Formation équipes commerciales</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Success Stories CEM LEADS -->
                    <div class="mt-12 bg-gradient-to-br from-[#F8F9FA] to-white rounded-3xl p-8 border-2 border-[#D4AF37]/20">
                        <h4 class="text-2xl font-bold text-center mb-8 gradient-text">📈 Résultats Clients</h4>
                        <div class="grid md:grid-cols-3 gap-8">
                            <div class="text-center">
                                <div class="text-5xl font-bold gradient-text mb-2">+250%</div>
                                <p class="text-gray-600">Augmentation leads qualifiés</p>
                                <p class="text-sm text-gray-500 mt-1">(Client industrie B2B, 6 mois)</p>
                            </div>
                            <div class="text-center">
                                <div class="text-5xl font-bold gradient-text mb-2">35%</div>
                                <p class="text-gray-600">Taux de conversion moyen</p>
                                <p class="text-sm text-gray-500 mt-1">(Campagnes LinkedIn Ads 2025)</p>
                            </div>
                            <div class="text-center">
                                <div class="text-5xl font-bold gradient-text mb-2">12 jours</div>
                                <p class="text-gray-600">Cycle de vente réduit</p>
                                <p class="text-sm text-gray-500 mt-1">(Automation CRM & scoring)</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CTA Section -->
                    <div class="mt-12 text-center">
                        <a href="/#contact" class="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-5 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all transform hover:scale-105">
                            <i class="fas fa-rocket"></i>
                            <span>Générer mes premiers leads B2B</span>
                        </a>
                        <p class="text-gray-500 text-sm mt-4">🎁 Audit de votre stratégie d'acquisition offert</p>
                    </div>
                </div>

                <!-- Section Plaquettes (Brochures & Catalogues) -->
                ${plaquettesHtml}
                
                <!-- CEM STUDIO : Production Audiovisuelle & Contenus Visuels -->
                <div id="cem-studio" class="mb-20">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-video text-white text-3xl"></i>
                        </div>
                        <h3 class="text-4xl font-bold gradient-text">CEM STUDIO</h3>
                    </div>
                    <p class="text-gray-600 text-lg mb-8">Studio de création audiovisuelle produisant vidéos institutionnelles, contenus animés 2D/3D et shootings photo pour marques exigeantes.</p>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <!-- Carte 1 : Production Audiovisuelle -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-video text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Production Audiovisuelle</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Films institutionnels et corporate</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Vidéos publicitaires (15-60 sec)</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Capsules réseaux sociaux (Reels, TikTok)</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Interviews & témoignages clients</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Couverture événementielle</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 2 : Motion Design -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-sparkles text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Motion Design & Animation</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Vidéos explicatives animées</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Motion design 2D/3D</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Infographies animées</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>GIFs & stickers pour social media</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 3 : Studio Photo -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-camera text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Studio Photo Pro</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Shooting produits e-commerce</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Portraits corporate</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Reportages événements</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Packshots publicitaires HD</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 4 : Post-Production -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-film text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Post-Production</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Montage & color grading</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Sound design & mixage</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Sous-titrage multilingue</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Adaptation multi-formats</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- CTA Studio -->
                    <div class="mt-8 text-center">
                        <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition inline-flex items-center">
                            <i class="fas fa-paper-plane mr-2"></i>Demander un devis CEM STUDIO
                        </a>
                    </div>
                </div>
                
                <div id="cem-leads" class="mb-20">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-rocket text-white text-3xl"></i>
                        </div>
                        <h3 class="text-4xl font-bold gradient-text">CEM LEAD</h3>
                    </div>
                    <p class="text-gray-600 text-lg mb-8">Service d'acquisition digitale transformant votre présence en ligne en pipeline commercial via sites web performants, stratégies social media et campagnes ads ROI-centrées.</p>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <!-- Carte 1 : Présence Web -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-globe text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Présence digitale</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Solutions web et mobile sur-mesure</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Landing pages optimisées conversion</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>SEO local & national</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Analytics & tracking avancé</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 2 : Réseaux Sociaux -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-mobile-alt text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Réseaux Sociaux</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Stratégie de contenu & planning éditorial</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Community management complet</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Création de contenus engageants</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Social selling B2B (LinkedIn)</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 3 : Publicité Digitale -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-chart-line text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Publicité Digitale</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Facebook & Instagram Ads</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Google Ads & SEA</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>LinkedIn Ads B2B</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Optimisation ROI & A/B testing</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 4 : Reporting & Analytics -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-chart-bar text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Reporting & Analytics</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Reporting mensuel KPIs</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Analyse coût par acquisition</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Mesure ROI & conversions</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Recommandations stratégiques</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- CTA Lead -->
                    <div class="mt-8 text-center">
                        <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition inline-flex items-center">
                            <i class="fas fa-chart-line mr-2"></i>Demander un audit
                        </a>
                    </div>
                </div>
                
                <!-- CEM BRANDING : Personal Branding & Content Strategy -->
                <div id="cem-branding" class="mb-20">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-pen-fancy text-white text-3xl"></i>
                        </div>
                        <h3 class="text-4xl font-bold gradient-text">CEM BRANDING</h3>
                    </div>
                    <p class="text-gray-600 text-lg mb-8">Agence de personal branding et content strategy développant votre influence LinkedIn, votre contenu éditorial et votre image de marque professionnelle.</p>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <!-- Carte 1 : LinkedIn Personal Branding -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fab fa-linkedin text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">LinkedIn Personal Branding</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Optimisation profil LinkedIn</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Stratégie de contenu LinkedIn</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Community management professionnel</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>LinkedIn Ads & prospection</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 2 : Copywriting Stratégique -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-pen-fancy text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Copywriting Stratégique</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Rédaction web SEO-friendly</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Ghostwriting de dirigeants</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Scripts vidéo & storytelling</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Emailings & newsletters</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 3 : Stratégie de Marque -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-bullseye text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Stratégie de Marque</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Audit d'identité de marque</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Plateforme de marque & positioning</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Charte éditoriale</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Storytelling corporate</span>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Carte 4 : Formation & Coaching -->
                        <div class="bg-gradient-to-br from-[#F8F9FA] to-[#F5F5F5] rounded-2xl p-6 border-2 border-[#D4AF37] hover:shadow-2xl transition">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-4">
                                <i class="fas fa-chalkboard-teacher text-white text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 text-black">Formation & Coaching</h4>
                            <ul class="space-y-2 text-gray-700 text-sm">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Formation LinkedIn pour dirigeants</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Coaching prise de parole</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Media training</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-[#D4AF37] mr-2 mt-1"></i>
                                    <span>Atelier Employee Advocacy</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- CTA Branding -->
                    <div class="mt-8 text-center">
                        <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition inline-flex items-center">
                            <i class="fas fa-comments mr-2"></i>Parlons-en
                        </a>
                    </div>
                </div>
                
                
                <!-- Notre Processus -->
                <div class="mt-20">
                    <h3 class="text-4xl font-bold text-center mb-4 gradient-text">Notre Processus</h3>
                    <p class="text-center text-gray-600 mb-12 text-lg">De l'analyse à la diffusion, une méthodologie éprouvée</p>
                    
                    <div class="grid md:grid-cols-4 gap-8">
                        <div class="bg-black text-white rounded-2xl p-8 text-center hover:scale-105 transition">
                            <div class="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">01</div>
                            <h4 class="text-xl font-bold mb-3 text-[#D4AF37]">Analyse</h4>
                            <p class="text-gray-300 text-sm">Plongée au cœur de votre marque pour révéler des insights stratégiques.</p>
                        </div>
                        <div class="bg-black text-white rounded-2xl p-8 text-center hover:scale-105 transition">
                            <div class="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">02</div>
                            <h4 class="text-xl font-bold mb-3 text-[#D4AF37]">Idéation</h4>
                            <p class="text-gray-300 text-sm">Concepts créatifs pour raconter votre histoire et renforcer votre influence.</p>
                        </div>
                        <div class="bg-black text-white rounded-2xl p-8 text-center hover:scale-105 transition">
                            <div class="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">03</div>
                            <h4 class="text-xl font-bold mb-3 text-[#D4AF37]">Conception</h4>
                            <p class="text-gray-300 text-sm">Maquettes et prototypes pour des expériences esthétiques et fonctionnelles.</p>
                        </div>
                        <div class="bg-black text-white rounded-2xl p-8 text-center hover:scale-105 transition">
                            <div class="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">04</div>
                            <h4 class="text-xl font-bold mb-3 text-[#D4AF37]">Diffusion</h4>
                            <p class="text-gray-300 text-sm">Production exigeante pour maximiser votre visibilité et votre impact.</p>
                        </div>
                    </div>
                </div>


            </div>
        </section>


        <!-- CTA Final Professionnel -->
        <section class="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
            <div class="max-w-6xl mx-auto px-4">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-bold mb-6">Parlons de Votre Projet</h2>
                    <p class="text-xl text-gray-300 max-w-3xl mx-auto">
                        Discutons de vos objectifs marketing et définissons ensemble la stratégie qui transformera votre présence digitale.
                    </p>
                </div>
                
                <div class="grid md:grid-cols-3 gap-8 mb-16">
                    <!-- Contact 1 : Téléphone -->
                    <div class="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37] hover:bg-white/10 transition">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-phone text-white text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 text-center">Appelez-nous</h3>
                        <p class="text-gray-400 mb-4 text-center text-sm">Du lundi au vendredi, 9h-18h</p>
                        <a href="tel:+212688947098" class="block text-center text-[#D4AF37] font-bold text-lg hover:text-[#FFD700] transition">
                            +212 6 88 94 70 98
                        </a>
                    </div>
                    
                    <!-- Contact 2 : Email -->
                    <div class="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37] hover:bg-white/10 transition">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-envelope text-white text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 text-center">Écrivez-nous</h3>
                        <p class="text-gray-400 mb-4 text-center text-sm">Réponse sous 24h ouvrées</p>
                        <a href="mailto:contact@cembymazini.ma" class="block text-center text-[#D4AF37] font-bold text-sm hover:text-[#FFD700] transition break-all">
                            contact@cembymazini.ma
                        </a>
                    </div>
                    
                    <!-- Contact 3 : Bureau -->
                    <div class="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37] hover:bg-white/10 transition">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-map-marker-alt text-white text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 text-center">Visitez-nous</h3>
                        <p class="text-gray-400 mb-4 text-center text-sm">Bureau à Casablanca</p>
                        <a href="https://maps.google.com/?q=Casablanca,Morocco" target="_blank" class="block text-center text-[#D4AF37] font-bold text-sm hover:text-[#FFD700] transition">
                            Voir sur Google Maps
                        </a>
                    </div>
                </div>
                
                <!-- CTA Principal -->
                <div class="text-center">
                    <a href="/#contact" class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-12 py-5 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all">
                        <i class="fas fa-comments mr-3"></i>Demander un devis
                    </a>
                    <p class="text-gray-400 text-sm mt-6">
                        <i class="fas fa-shield-alt mr-2"></i>Sans engagement • Réponse rapide • Confidentialité garantie
                    </p>
                </div>
            </div>
        </section>
        
        <section id="actualites" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">CEM ACTUS & NEWS</h2>
                <p class="text-center text-gray-600 text-xl mb-16">Les dernières nouveautés de CEM Marketing</p>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    ${mktBlogsHtml}
                </div>
                
                <!-- CTA Newsletter -->
                <div class="mt-16 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] rounded-2xl p-12 text-center">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        <i class="fas fa-envelope-open-text mr-3"></i>
                        Restez informé de nos actualités
                    </h3>
                    <p class="text-white/90 text-lg mb-8">Inscrivez-vous à notre newsletter pour ne rien manquer de nos innovations et succès clients</p>
                    <form x-data="{ email: '', loading: false, message: '' }" 
                          @submit.prevent="loading = true; fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(res => res.json()).then(data => { message = data.message || data.error || 'Merci !'; email = ''; }).catch(() => message = 'Erreur, veuillez réessayer').finally(() => loading = false)"
                          class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                        <div class="flex-1 flex flex-col items-start gap-2 w-full">
                            <input type="email" x-model="email" required placeholder="Votre adresse email *" 
                                   class="w-full px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50">
                            <span x-show="message" x-text="message" class="text-white text-sm font-semibold pl-4"></span>
                        </div>
                        <button type="submit" :disabled="loading" class="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-900 transition shadow-xl disabled:opacity-50">
                            <i class="fas fa-paper-plane mr-2"></i><span x-text="loading ? '...' : 'S\'inscrire'"></span>
                        </button>
                    </form>
                </div>
            </div>
        </section>

        <!-- Formulaire Contact Marketing -->
        <section id="contact" class="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">Demandez Votre Devis</h2>
                <p class="text-center text-gray-400 text-xl mb-12">Un projet en tête ? Parlons-en ensemble</p>
                
                <form x-data="{
                    formData: { name: '', email: '', phone: '', service: '', budget: '', message: '' },
                    loading: false, success: false, error: false, consent: false,
                    async submitForm() {
                        this.loading = true; this.success = false; this.error = false;
                        try {
                            const res = await fetch('/api/contact', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: this.formData.name,
                                    email: this.formData.email,
                                    phone: this.formData.phone,
                                    service: this.formData.service,
                                    message: this.formData.message,
                                    source: 'CEM Marketing - Devis'
                                })
                            });
                            if (res.ok) {
                                this.success = true;
                                this.formData = { name: '', email: '', phone: '', service: '', message: '' };
                                this.consent = false;
                            } else { this.error = true; }
                        } catch(e) { this.error = true; } finally { this.loading = false; }
                    }
                }" @submit.prevent="submitForm" class="space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37]">
                    <div x-show="success" class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded" role="alert">
                        <strong>Succès!</strong> Votre demande de devis a été envoyée. Nous vous recontacterons rapidement.
                    </div>
                    <div x-show="error" class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded" role="alert">
                        <strong>Erreur!</strong> Une erreur est survenue. Veuillez réessayer.
                    </div>
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-user mr-2"></i>Nom complet *
                            </label>
                            <input type="text" x-model="formData.name" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="Votre nom">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-envelope mr-2"></i>Email *
                            </label>
                            <input type="email" x-model="formData.email" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="votre@email.com">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-phone mr-2"></i>Téléphone
                            </label>
                            <input type="tel" x-model="formData.phone" 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="+212 6 88 94 70 98">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-briefcase mr-2"></i>Service souhaité *
                            </label>
                            <select x-model="formData.service" required 
                                    class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white">
                                <option value="" class="bg-gray-900">Choisir un service...</option>
                                <option class="bg-gray-900">Stratégie de Marque</option>
                                <option class="bg-gray-900">Gestion Réseaux Sociaux</option>
                                <option class="bg-gray-900">E-réputation</option>
                                <option class="bg-gray-900">Marketing d'Influence</option>
                                <option class="bg-gray-900">Films Institutionnels</option>
                                <option class="bg-gray-900">Motion Design</option>
                                <option class="bg-gray-900">Vidéos 3D</option>
                                <option class="bg-gray-900">Capsules Vidéo</option>
                                <option class="bg-gray-900">Stratégie Digitale</option>
                                <option class="bg-gray-900">Publicité en Ligne</option>
                                <option class="bg-gray-900">SEO & Contenu</option>
                                <option class="bg-gray-900">Identité Visuelle</option>
                                <option class="bg-gray-900">Conseil Stratégique</option>
                                <option class="bg-gray-900">Audits Marketing</option>
                                <option class="bg-gray-900">Copywriting</option>
                                <option class="bg-gray-900">Création Graphique</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-comment-dots mr-2"></i>Décrivez votre projet
                        </label>
                        <textarea x-model="formData.message" rows="6" 
                                  class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                  placeholder="Parlez-nous de votre projet, vos objectifs, vos délais..."></textarea>
                    </div>
                    
                    <div class="flex items-start">
                        <input type="checkbox" x-model="consent" required class="mt-1 mr-3">
                        <label class="text-sm text-gray-400">
                            J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande *
                        </label>
                    </div>
                    
                    <button type="submit" :disabled="loading"
                            class="w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                        <span x-show="!loading"><i class="fas fa-paper-plane mr-2"></i>Demander un Devis</span>
                        <span x-show="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
                    </button>
                    
                    <p class="text-center text-gray-500 text-sm">
                        <i class="fas fa-lock mr-2"></i>Vos données sont sécurisées et ne seront jamais partagées
                    </p>
                </form>
                
                <!-- Contact rapide -->
                <div class="mt-12 grid md:grid-cols-3 gap-8 text-center">
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-phone-alt text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Téléphone</h4>
                        <p class="text-gray-400"><a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a></p>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-envelope text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Email</h4>
                        <a href="mailto:contact@cembymazini.ma" class="text-gray-400 hover:text-[#D4AF37] transition block">contact@cembymazini.ma</a>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-map-marker-alt text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Adresse</h4>
                        <p class="text-gray-400">Casablanca, Maroc</p>
                    </div>
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
  `)
})

// Page Formation Detail Dynamique (15 formations)
app.get('/formation/:slug', (c) => {
    const slug = c.req.param('slug')

    // Mapping des formations
    const formations: any = {
        'e-learning-digital': {
            title: 'E-Learning Digital',
            icon: 'fas fa-graduation-cap',
            image: 'https://www.genspark.ai/api/files/s/iFgfNJl7',
            category: 'Digitale',
            description: 'Digitalisez vos contenus de formation et intégrez-les dans une plateforme LMS complète et performante.',
            benefits: [
                'Modules e-learning interactifs et engageants',
                'Plateforme LMS personnalisée à votre image',
                'Suivi des apprenants et analytics détaillés',
                'Certifications automatiques et gamification',
                'Support technique et accompagnement'
            ],
            program: [
                'Digitalisation des contenus existants',
                'Création de modules SCORM',
                'Intégration vidéos et quiz interactifs',
                'Paramétrage de la plateforme LMS',
                'Formation des administrateurs'
            ],
            details: {
                format: 'E-Learning',
                duree: 'Projet sur mesure',
                public: 'Entreprises, Organismes de formation',
                prerequis: 'Contenus de formation existants',
                tarif: 'Sur devis'
            }
        },
        'linkedin-formation-one-to-one': {
            title: 'LinkedIn Formation One-to-One',
            icon: 'fab fa-linkedin',
            image: 'https://www.genspark.ai/api/files/s/iMeFueig',
            category: 'Digitale',
            badge: 'N°1 Growth Morocco 🇲🇦 by FAVIKON',
            description: 'Accompagnement personnalisé pour transformer votre profil LinkedIn en machine à opportunités. N°1 Growth LinkedIn au Maroc !',
            benefits: [
                'Optimisation complète de votre profil LinkedIn',
                'Stratégie de contenu personnalisée alignée à vos objectifs',
                'Personal Branding et positionnement d\'expert',
                'Techniques de networking et Social Selling',
                'Accompagnement individuel avec expert certifié'
            ],
            program: [
                'Audit détaillé de votre profil actuel',
                'Optimisation du profil (photo, bannière, résumé, expériences)',
                'Définition de votre stratégie de contenu',
                'Calendrier éditorial et templates de posts',
                'Suivi hebdomadaire et ajustements'
            ],
            details: {
                format: 'One-to-One en visio',
                duree: '6 sessions de 1h30 sur 6 semaines',
                public: 'Dirigeants, Managers, Consultants, Entrepreneurs',
                prerequis: 'Avoir un profil LinkedIn',
                tarif: 'À partir de 2500€'
            }
        },
        'linkedin-accompagnement-team': {
            title: 'LinkedIn Accompagnement Team',
            icon: 'fab fa-linkedin',
            image: 'https://www.genspark.ai/api/files/s/V72R4i0s',
            category: 'Digitale',
            description: 'Transformez vos collaborateurs en ambassadeurs LinkedIn pour développer la notoriété de votre entreprise.',
            benefits: [
                'Formation collective pour toute l\'équipe',
                'Programme Employee Advocacy structuré',
                'Social Selling pour les équipes commerciales',
                'Stratégie d\'entreprise cohérente sur LinkedIn',
                'Suivi des performances et ROI mesurable'
            ],
            program: [
                'Workshop de lancement (demi-journée)',
                'Formation aux fondamentaux LinkedIn (1 jour)',
                'Atelier stratégie de contenu équipe',
                'Coaching individuel pour les top performers',
                'Reporting mensuel et optimisation'
            ],
            details: {
                format: 'Présentiel ou Distanciel',
                duree: '3 mois d\'accompagnement',
                public: 'Équipes de 5 à 50 personnes',
                prerequis: 'Tous collaborateurs avec LinkedIn',
                tarif: 'À partir de 5000€'
            }
        },
        'marketing-digital': {
            title: 'Marketing Digital',
            icon: 'fas fa-bullhorn',
            image: 'https://www.genspark.ai/api/files/s/q44gmQFC',
            category: 'Digitale',
            description: 'Maîtrisez tous les leviers du marketing digital pour propulser votre présence en ligne et générer des leads qualifiés.',
            benefits: [
                'SEO & SEA : référencement naturel et payant',
                'Social Media Marketing : stratégie multi-plateformes',
                'Content Marketing : création de contenus performants',
                'Analytics & ROI : mesure et optimisation',
                'Email Marketing : campagnes automatisées'
            ],
            program: [
                'Fondamentaux du marketing digital',
                'SEO technique et stratégie de contenu',
                'Google Ads et Meta Ads',
                'Social Media et community management',
                'Analytics, reporting et optimisation'
            ],
            details: {
                format: 'Présentiel Inter/Intra',
                duree: '3 jours (21h)',
                public: 'Responsables marketing, Chefs de projet digital',
                prerequis: 'Bases en marketing',
                tarif: 'À partir de 1800€/personne'
            }
        },
        'creation-contenu': {
            title: 'Création de Contenu',
            icon: 'fas fa-pen-fancy',
            image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop',
            category: 'Digitale',
            description: 'Storytelling, copywriting et content marketing pour créer des contenus qui captivent et convertissent.',
            benefits: [
                'Storytelling de marque et narration persuasive',
                'Copywriting : techniques de rédaction impactante',
                'Content Marketing stratégique et SEO',
                'Visual Branding et cohérence éditoriale',
                'Calendrier éditorial et production de contenu'
            ],
            program: [
                'Les fondamentaux du storytelling',
                'Techniques de copywriting avancées',
                'Content Marketing et stratégie éditoriale',
                'Visual content et design thinking',
                'Atelier pratique de création'
            ],
            details: {
                format: 'Atelier pratique à distance',
                duree: '2 jours (14h)',
                public: 'Content managers, Community managers, Marketeurs',
                prerequis: 'Aucun',
                tarif: 'À partir de 1200€/personne'
            }
        },
        'ia-innovation': {
            title: 'IA & Innovation',
            icon: 'fas fa-robot',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
            category: 'Digitale',
            description: 'Acculturation et démystification de l\'IA générative pour transformer vos métiers et booster la productivité.',
            benefits: [
                'IA générative : ChatGPT, MidJourney, Gemini',
                'Automatisation des tâches et gains de productivité',
                'Cas d\'usage métiers concrets et actionnables',
                'Prompts engineering et techniques avancées',
                'Éthique, risques et bonnes pratiques IA'
            ],
            program: [
                'Panorama des IA génératives actuelles',
                'ChatGPT et LLMs : usages professionnels',
                'Génération d\'images et vidéos par IA',
                'Automatisation et intégration dans les workflows',
                'Atelier pratique : créer avec l\'IA'
            ],
            details: {
                format: 'Workshop Innovation',
                duree: '1 jour (7h)',
                public: 'Tous collaborateurs, Dirigeants, Managers',
                prerequis: 'Aucun',
                tarif: 'À partir de 900€/personne'
            }
        },
        'leadership': {
            title: 'Leadership & Management',
            icon: 'fas fa-crown',
            image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Développez un leadership inspirant et des compétences managériales solides pour emmener vos équipes vers le succès.',
            benefits: [
                'Management d\'équipe efficace et bienveillant',
                'Prise de décision stratégique et gestion des priorités',
                'Leadership inspirant et management par la vision',
                'Délégation, responsabilisation et autonomie',
                'Gestion des talents et développement des équipes'
            ],
            program: [
                'Les fondamentaux du leadership moderne',
                'Styles de management et adaptabilité',
                'Communication managériale et feedback',
                'Prise de décision et résolution de problèmes',
                'Développement et motivation des équipes'
            ],
            details: {
                format: 'Présentiel Inter/Intra',
                duree: '2 jours (14h)',
                public: 'Managers, Chefs d\'équipe, Futurs managers',
                prerequis: 'Expérience managériale souhaitée',
                tarif: 'À partir de 1500€/personne'
            }
        },
        'communication': {
            title: 'Formation en Communication',
            icon: 'fas fa-comments',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Communication efficace, prise de parole en public et gestion des relations interpersonnelles au travail.',
            benefits: [
                'Communication interpersonnelle efficace',
                'Prise de parole en public et pitch convaincant',
                'Communication non-verbale et écoute active',
                'Gestion des conflits et situations tendues',
                'Communication écrite professionnelle'
            ],
            program: [
                'Les bases de la communication efficace',
                'Prise de parole en public et gestion du stress',
                'Communication non-verbale et langage corporel',
                'Techniques d\'écoute active et questionnement',
                'Gestion des conflits et communication assertive'
            ],
            details: {
                format: 'Présentiel Inter/Intra',
                duree: '3 jours (21h)',
                public: 'Tous collaborateurs',
                prerequis: 'Aucun',
                tarif: 'À partir de 1800€/personne'
            }
        },
        'bien-etre': {
            title: 'Bien-être au Travail',
            icon: 'fas fa-spa',
            image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'QVT, gestion du stress, équilibre vie pro/perso et santé mentale pour des équipes épanouies et performantes.',
            benefits: [
                'Gestion du stress et des émotions',
                'Équilibre vie professionnelle / vie personnelle',
                'Santé mentale et prévention du burn-out',
                'Techniques de relaxation et mindfulness',
                'Ergonomie et hygiène de vie au travail'
            ],
            program: [
                'Comprendre le stress et ses mécanismes',
                'Techniques de gestion du stress et relaxation',
                'Équilibre vie pro/vie perso et priorités',
                'Mindfulness et méditation au travail',
                'Plan d\'action personnel bien-être'
            ],
            details: {
                format: 'Atelier Bien-être',
                duree: '1 jour (7h)',
                public: 'Tous collaborateurs',
                prerequis: 'Aucun',
                tarif: 'À partir de 800€/personne'
            }
        },
        'coaching-dirigeants': {
            title: 'Coaching Dirigeants',
            icon: 'fas fa-handshake',
            image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Accompagnement personnalisé des dirigeants et C-level pour révéler le plein potentiel de votre leadership.',
            benefits: [
                'Coaching individuel 100% personnalisé',
                'Plan d\'actions sur mesure adapté à vos enjeux',
                'Révélation de vos talents et zones d\'excellence',
                'Développement de votre posture de leader',
                'Accompagnement confidentiel par coach certifié'
            ],
            program: [
                'Session de diagnostic et définition des objectifs',
                'Séances de coaching individuel (6 x 2h)',
                'Travail sur les enjeux stratégiques et opérationnels',
                'Développement des soft skills de leadership',
                'Bilan et plan d\'action post-coaching'
            ],
            details: {
                format: 'Coaching One-to-One',
                duree: '6 sessions de 2h sur 3 mois',
                public: 'Dirigeants, DG, DGA, C-level',
                prerequis: 'Poste de direction',
                tarif: 'À partir de 5000€'
            }
        },
        'force-vente': {
            title: 'Force de Vente & Négociation',
            icon: 'fas fa-handshake-alt',
            image: 'https://images.unsplash.com/photo-1556742400-b5b7c256ff5e?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Techniques de vente avancées et négociation commerciale pour booster vos performances commerciales.',
            benefits: [
                'Techniques de vente modernes et efficaces',
                'Négociation commerciale et closing',
                'Prospection et qualification de leads',
                'Gestion des objections et argumentaire',
                'Fidélisation et développement du portefeuille'
            ],
            program: [
                'Les fondamentaux de la vente B2B/B2C',
                'Prospection efficace et prise de RDV',
                'Techniques de découverte et qualification',
                'Argumentation, traitement des objections',
                'Négociation et techniques de closing'
            ],
            details: {
                format: 'Formation Intensive Présentiel',
                duree: '3 jours (21h)',
                public: 'Commerciaux, Business Developers, Managers',
                prerequis: 'Expérience commerciale souhaitée',
                tarif: 'À partir de 2000€/personne'
            }
        },
        'management-virtuel': {
            title: 'Management d\'Équipe Virtuelle',
            icon: 'fas fa-video',
            image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Pilotage d\'équipes à distance, télétravail et management hybride pour maintenir performance et cohésion.',
            benefits: [
                'Management à distance efficace et humain',
                'Outils collaboratifs et organisation du télétravail',
                'Communication asynchrone et synchrone',
                'Maintien de la cohésion d\'équipe virtuelle',
                'Gestion de la performance en remote'
            ],
            program: [
                'Spécificités du management à distance',
                'Outils collaboratifs (Slack, Teams, Asana...)',
                'Communication et rituels d\'équipe en remote',
                'Maintenir l\'engagement et la motivation',
                'Gestion de la performance et feedback à distance'
            ],
            details: {
                format: '100% Distanciel',
                duree: '2 jours (14h)',
                public: 'Managers d\'équipes distantes ou hybrides',
                prerequis: 'Expérience managériale',
                tarif: 'À partir de 1400€/personne'
            }
        },
        'gestion-changement': {
            title: 'Gestion du Changement',
            icon: 'fas fa-sync-alt',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Conduite du changement et transformation organisationnelle pour accompagner avec succès vos projets de transformation.',
            benefits: [
                'Méthodologies de conduite du changement',
                'Accompagnement des transformations organisationnelles',
                'Gestion des résistances et adhésion des équipes',
                'Communication du changement efficace',
                'Plan de conduite du changement structuré'
            ],
            program: [
                'Comprendre les dynamiques du changement',
                'Méthodologie de conduite du changement',
                'Identifier et gérer les résistances',
                'Stratégie de communication du changement',
                'Plan d\'action et indicateurs de succès'
            ],
            details: {
                format: 'Présentiel Inter/Intra',
                duree: '2 jours (14h)',
                public: 'Managers, Chefs de projet, RH, Dirigeants',
                prerequis: 'Aucun',
                tarif: 'À partir de 1600€/personne'
            }
        },
        'intelligence-emotionnelle': {
            title: 'Intelligence Émotionnelle',
            icon: 'fas fa-heart-pulse',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Développer son EQ (Quotient Émotionnel) pour des relations professionnelles efficaces et un leadership authentique.',
            benefits: [
                'Développement de l\'intelligence émotionnelle (EQ)',
                'Conscience de soi et régulation émotionnelle',
                'Empathie et compréhension des autres',
                'Relations interpersonnelles de qualité',
                'Leadership émotionnel et management bienveillant'
            ],
            program: [
                'Comprendre l\'intelligence émotionnelle',
                'Auto-diagnostic et prise de conscience',
                'Gestion des émotions et régulation',
                'Empathie et écoute active',
                'Développer son leadership émotionnel'
            ],
            details: {
                format: 'Atelier Expérientiel',
                duree: '2 jours (14h)',
                public: 'Managers, Leaders, Tous collaborateurs',
                prerequis: 'Aucun',
                tarif: 'À partir de 1500€/personne'
            }
        },
        'prise-decision': {
            title: 'Prise de Décision Stratégique',
            icon: 'fas fa-chess',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
            category: 'Management',
            description: 'Méthodes et outils pour prendre des décisions complexes éclairées dans un environnement incertain.',
            benefits: [
                'Méthodes de prise de décision structurées',
                'Analyse de situations complexes et multi-critères',
                'Gestion de l\'incertitude et des risques',
                'Prise de décision collective et consensus',
                'Outils d\'aide à la décision'
            ],
            program: [
                'Les processus de prise de décision',
                'Méthodes et outils d\'analyse décisionnelle',
                'Gestion des biais cognitifs',
                'Prise de décision en situation complexe',
                'Cas pratiques et mises en situation'
            ],
            details: {
                format: 'Présentiel Inter/Intra',
                duree: '2 jours (14h)',
                public: 'Managers, Cadres, Dirigeants',
                prerequis: 'Expérience managériale souhaitée',
                tarif: 'À partir de 1600€/personne'
            }
        }
    }

    const formation = formations[slug]

    if (!formation) {
        return c.redirect('/formation')
    }

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formation.title} - CEM FORMATION</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="${formation.description}">
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { 
                background: ${formation.category === 'Digitale' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'};
            }
            .gradient-text {
                background: ${formation.category === 'Digitale' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)'};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section -->
        <section class="gradient-bg pt-32 pb-20 px-4">
            <div class="max-w-7xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div class="inline-block bg-white/10 px-4 py-2 rounded-full mb-6">
                            <span class="${formation.category === 'Digitale' ? 'text-gray-200' : 'text-[#D4AF37]'} font-semibold">
                                <i class="${formation.icon} mr-2"></i>Formation ${formation.category}
                            </span>
                        </div>
                        ${formation.badge ? `
                        <div class="inline-block bg-gradient-to-r from-red-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-black shadow-2xl mb-4">
                            ${formation.badge}
                        </div>
                        ` : ''}
                        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">${formation.title}</h1>
                        <p class="text-xl text-gray-300 mb-8">${formation.description}</p>
                        <div class="flex flex-wrap gap-4">
                            <a href="/#contact" class="bg-[#D4AF37] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#B8941F] transition inline-block">
                                <i class="fas fa-rocket mr-2"></i>S'inscrire maintenant
                            </a>
                            <a href="/formation" class="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition inline-block">
                                <i class="fas fa-arrow-left mr-2"></i>Toutes les formations
                            </a>
                        </div>
                    </div>
                    <div>
                        <img src="${formation.image}" alt="${formation.title}" loading="lazy" class="rounded-3xl shadow-2xl" loading="lazy" >
                    </div>
                </div>
            </div>
        </section>

        <!-- Bénéfices -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-white neon-text-small mb-4">Ce que vous allez apprendre</h2>
                    <p class="text-xl text-gray-600">Compétences et bénéfices clés de la formation</p>
                </div>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${formation.benefits.map((benefit: string) => `
                        <div class="bg-gray-50 p-6 rounded-2xl hover:shadow-lg transition">
                            <div class="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center mb-4">
                                <i class="fas fa-check text-white text-xl"></i>
                            </div>
                            <p class="text-gray-800 font-semibold">${benefit}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Programme -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-4xl font-bold text-white neon-text-small mb-4">Programme de la formation</h2>
                    <p class="text-xl text-gray-600">Déroulé pédagogique détaillé</p>
                </div>
                <div class="grid gap-4 max-w-3xl mx-auto">
                    ${formation.program.map((item: string, i: number) => `
                        <div class="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition flex items-start">
                            <div class="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                <span class="text-white font-bold">${i + 1}</span>
                            </div>
                            <p class="text-gray-800 font-semibold">${item}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- Détails Formation -->
        <section class="py-20 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-center text-white neon-text-small mb-12">Informations pratiques</h2>
                <div class="bg-gradient-to-br from-black to-gray-900 rounded-3xl p-12 text-white">
                    <div class="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Format</div>
                            <div class="text-2xl font-bold">${formation.details.format}</div>
                        </div>
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Durée</div>
                            <div class="text-2xl font-bold">${formation.details.duree}</div>
                        </div>
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Public</div>
                            <div class="text-lg">${formation.details.public}</div>
                        </div>
                        <div>
                            <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Prérequis</div>
                            <div class="text-lg">${formation.details.prerequis}</div>
                        </div>
                    </div>
                    <div class="border-t border-gray-700 pt-8 text-center">
                        <div class="text-[#D4AF37] text-sm font-semibold mb-2 uppercase">Tarif</div>
                        <div class="text-4xl font-bold mb-6">${formation.details.tarif}</div>
                        <a href="/#contact" class="bg-[#D4AF37] text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-[#B8941F] transition inline-block">
                            <i class="fas fa-paper-plane mr-2"></i>Demander un devis
                        </a>
                    </div>
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
  `)
})

// Page CEM Innovation
app.get('/innovation', async (c) => {
    // Fetch dynamic content
    const [plaquettes, blogs] = await Promise.all([
        plaquettesService.getAll(c.env).catch(() => []),
        blogService.getAll(c.env).catch(() => []),
    ]);
    const plaquettesHtml = generatePlaquettesHtml(plaquettes);
    const latestBlogs = blogs.filter((b: any) => b.status === 'published').slice(0, 4);

    const blogsHtml = latestBlogs.length > 0 ? latestBlogs.map((blog: any) => `
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border border-gray-200 group">
            <div class="h-48 overflow-hidden">
                ${blog.coverImage ? `<img src="${blog.coverImage}" alt="${blog.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" >` : `<div class="h-full bg-gradient-to-br from-[#D4AF37] to-black flex items-center justify-center"><i class="fas fa-newspaper text-white text-5xl"></i></div>`}
            </div>
            <div class="p-6">
                <div class="text-[#D4AF37] text-sm font-bold mb-2">
                    <i class="fas fa-calendar mr-2"></i>${new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    ${blog.category ? ` <span class="ml-2 bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full text-xs">${blog.category}</span>` : ''}
                </div>
                <h3 class="text-xl font-bold mb-3 line-clamp-2">${blog.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${blog.excerpt || (blog.content ? blog.content.substring(0, 120) + '...' : '')}</p>
                <a href="/actualites/${blog.slug || blog.id}" class="text-[#D4AF37] font-bold hover:underline">
                    Lire l'article <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </div>
    `).join('') : `
        <div class="col-span-full text-center py-12 text-gray-500">
            <i class="fas fa-newspaper text-4xl mb-4 text-gray-300"></i>
            <p class="text-lg">Aucun article pour le moment.</p>
        </div>
    `;

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM INNOVATION - Intelligence Artificielle & Transformation Digitale | Acculturation IA Maroc</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="CEM INNOVATION Maroc: Formations IA générative (ChatGPT, MidJourney, Gemini). 50+ entreprises formées, +85% de productivité. Démystifiez l'IA aujourd'hui !">
        <meta name="keywords" content="intelligence artificielle maroc, formation ia maroc, acculturation ia, chatgpt entreprise, transformation digitale, démystification ia, ateliers ia, consulting ia maroc, cem innovation">
        <meta name="author" content="CEM GROUP - CEM Innovation">
        <meta name="robots" content="index, follow">
        <meta name="geo.region" content="MA">
        <link rel="canonical" href="https://cembymazini.ma/innovation">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="CEM INNOVATION - Intelligence Artificielle & Transformation Digitale | Maroc">
        <meta property="og:description" content="Acculturation IA : ateliers pratiques, formation outils IA. Démystification : conférences décideurs, roadmap IA. 50+ entreprises, 200+ collaborateurs formés.">
        <meta property="og:url" content="https://cembymazini.ma/innovation">
        <meta property="og:site_name" content="CEM GROUP">
        <meta property="og:locale" content="fr_MA">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CEM INNOVATION - Intelligence Artificielle Maroc">
        <meta name="twitter:description" content="Acculturation & Démystification IA. 85% gain productivité. Session découverte.">
        
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section : À Propos CEM INNOVATION -->
        <section class="relative bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex items-center justify-center pt-20 px-4 pb-32 md:pb-40 overflow-hidden">
            <!-- Grille de points dorés en arrière-plan -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background-image: radial-gradient(circle, #D4AF37 1px, transparent 1px); background-size: 50px 50px;"></div>
            </div>
            
            <!-- Blobs décoratifs dorés animés -->
            <div class="absolute top-20 -left-20 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
            <div class="absolute top-40 -right-20 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div class="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            
            <div class="max-w-7xl mx-auto w-full relative z-10">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    <!-- COLONNE GAUCHE : COPYWRITING STRATÉGIQUE -->
                    <div class="text-left text-white space-y-8">
                        <!-- Titre Principal -->
                        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                            <span class="text-white">Transformez votre entreprise</span>
                            <br>
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]">avec l'intelligence artificielle</span>
                            <br>
                            <span class="text-white">et boostez votre productivité</span>
                        </h1>
                        
                        <!-- Description Professionnelle -->
                        <div class="space-y-4">
                            <p class="text-lg md:text-xl text-gray-300 leading-relaxed">
                                <strong class="text-white">CEM INNOVATION</strong> est votre partenaire stratégique pour intégrer l'IA générative dans vos process et révolutionner votre façon de travailler.
                            </p>
                            <p class="text-base md:text-lg text-gray-400 leading-relaxed">
                                De l'acculturation de vos équipes à la démystification pour décideurs, en passant par l'accompagnement personnalisé — nous déployons une expertise IA 360° pour accélérer votre transformation digitale.
                            </p>
                        </div>
                        
                        <!-- 3 Piliers avec icônes carrées dorées -->
                        <div class="grid grid-cols-3 gap-4 pt-4">
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fas fa-users text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Acculturation</p>
                                <p class="text-sm text-white font-bold mt-1">Formation IA</p>
                            </div>
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fas fa-lightbulb text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Démystification</p>
                                <p class="text-sm text-white font-bold mt-1">Conseil IA</p>
                            </div>
                            <div class="text-center group">
                                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                    <i class="fas fa-robot text-black text-2xl"></i>
                                </div>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accompagnement</p>
                                <p class="text-sm text-white font-bold mt-1">Roadmap IA</p>
                            </div>
                        </div>
                        
                        <!-- CTAs -->
                        <div class="flex flex-wrap gap-4 pt-4">
                            <a href="#contact" class="group bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
                                <i class="fas fa-calendar-alt mr-2 group-hover:rotate-12 transition-transform"></i>
                                Réserver une session IA
                            </a>
                            <a href="/#contact" class="group bg-white/10 backdrop-blur-sm text-white border-2 border-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all inline-flex items-center">
                                <i class="fas fa-rocket mr-2 group-hover:scale-110 transition-transform"></i>
                                Demander le catalogue
                            </a>
                        </div>
                    </div>
                    
                    <!-- COLONNE DROITE : IMAGE MASCOTTES -->
                    <div class="relative">
                        <!-- Image Mascottes agrandie sans cadre -->
                        <img 
                            src="/static/mascottes-innovation.webp" 
                            alt="Équipe CEM Innovation - Experts en Intelligence Artificielle" 
                            class="w-full h-auto rounded-2xl shadow-2xl"
                        / loading="lazy" >
                    </div>
                </div>
            </div>
            
            <!-- SVG Wave Separator -->
            <div class="absolute bottom-0 left-0 right-0 pointer-events-none">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
                    <path d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="url(#wave-gradient-innovation)"/>
                    <defs>
                        <linearGradient id="wave-gradient-innovation" x1="0" y1="0" x2="1440" y2="0">
                            <stop offset="0%" stop-color="#D4AF37"/>
                            <stop offset="50%" stop-color="#FFD700"/>
                            <stop offset="100%" stop-color="#D4AF37"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </section>
        
        <!-- CTA Flottants Innovation -->
        <div class="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
            <!-- Email Bouton -->
            <a href="mailto:contact@cembymazini.ma?subject=Demande%20d'information%20CEM%20INNOVATION&body=Bonjour%20CEM%20INNOVATION,%0A%0AJe%20souhaite%20des%20informations%20sur%20vos%20services%20IA.%0A%0ACordialement" 
               class="bg-[#D4AF37] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform hover:shadow-[#D4AF37]/50" 
               title="Email - contact@cembymazini.ma">
                <i class="fas fa-envelope text-2xl"></i>
            </a>
            <!-- WhatsApp Bouton -->
            <a href="https://wa.me/212688947098?text=Bonjour%20CEM%20INNOVATION,%20je%20souhaite%20des%20informations%20sur%20vos%20services%20IA" 
               target="_blank"
               class="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform animate-pulse" 
               title="WhatsApp - Contact Direct">
                <i class="fab fa-whatsapp text-2xl"></i>
            </a>
        </div>

        <!-- Acculturation & Démystification IA - DÉVELOPPÉE avec BÉNÉFICES ENTREPRISE -->
        <section id="ia-innovation" class="py-20 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#D4AF37]/20 relative overflow-hidden">
            <!-- Animated Background Blobs -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div class="absolute bottom-20 left-20 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <!-- Header avec Mascotte -->
                <div class="text-center mb-16 relative">
                    <!-- Mascotte IA qui fait coucou -->
                    <div class="absolute -top-10 right-0 md:right-20 animate-bounce">
                        <div class="relative">
                            <div class="w-32 h-32 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                                <i class="fas fa-robot text-white text-5xl"></i>
                            </div>
                            <div class="absolute -top-4 -right-4 text-6xl animate-wave">👋</div>
                            <div class="absolute -bottom-16 -right-8 bg-white rounded-2xl px-4 py-2 shadow-xl border-2 border-[#D4AF37] whitespace-nowrap">
                                <p class="text-sm font-bold text-[#D4AF37]">Bonjour ! <i class="fas fa-robot"></i><i class="fas fa-sparkles"></i></p>
                                <div class="absolute top-0 left-4 transform -translate-y-2">
                                    <div class="w-4 h-4 bg-white border-t-2 border-l-2 border-[#D4AF37] transform rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-white px-8 py-3 rounded-full text-sm font-bold mb-6 shadow-2xl animate-pulse">
                        <i class="fas fa-robot mr-2"></i>Intelligence Artificielle Moderne
                    </div>
                    <h2 class="text-6xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#FFFFFF] bg-clip-text text-transparent mb-6">
                        Acculturation & Démystification de l'IA
                    </h2>
                    <p class="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                        Transformez votre entreprise avec l'intelligence artificielle : formations pratiques, gains de productivité mesurables et accompagnement sur-mesure
                    </p>
                </div>

                <!-- NOUVEAUX BLOCS : BÉNÉFICES & AVANTAGES ENTREPRISE -->
                <div class="grid lg:grid-cols-3 gap-8 mb-16">
                    <!-- Gain de Productivité -->
                    <div class="bg-gradient-to-br from-green-900/40 to-green-800/20 backdrop-blur-sm rounded-3xl p-8 border-2 border-green-500/30 hover:border-green-400 transition-all duration-300 hover:scale-105 shadow-2xl">
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl">
                                <i class="fas fa-rocket text-white text-3xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-green-400 mb-4 text-center">+85% Productivité</h3>
                        <p class="text-gray-300 text-center leading-relaxed mb-4">
                            Gagnez jusqu'à <span class="text-green-400 font-bold">85% de temps</span> sur vos tâches répétitives grâce à l'IA générative
                        </p>
                        <ul class="space-y-3 text-gray-300">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-400 mr-3 mt-1"></i>
                                <span>Rédaction assistée (emails, rapports, contenus)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-400 mr-3 mt-1"></i>
                                <span>Analyse de données en quelques secondes</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-400 mr-3 mt-1"></i>
                                <span>Automatisation des workflows métiers</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Gain de Temps -->
                    <div class="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-sm rounded-3xl p-8 border-2 border-blue-500/30 hover:border-blue-400 transition-all duration-300 hover:scale-105 shadow-2xl">
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                                <i class="fas fa-clock text-white text-3xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-blue-400 mb-4 text-center">10h/semaine</h3>
                        <p class="text-gray-300 text-center leading-relaxed mb-4">
                            Économisez en moyenne <span class="text-blue-400 font-bold">10 heures par semaine</span> et collaborateur avec nos formations IA
                        </p>
                        <ul class="space-y-3 text-gray-300">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-blue-400 mr-3 mt-1"></i>
                                <span>Recherche et veille automatisées</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-blue-400 mr-3 mt-1"></i>
                                <span>Support client intelligent 24/7</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-blue-400 mr-3 mt-1"></i>
                                <span>Traduction et synthèse instantanées</span>
                            </li>
                        </ul>
                    </div>

                    <!-- ROI & Compétitivité -->
                    <div class="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-3xl p-8 border-2 border-purple-500/30 hover:border-purple-400 transition-all duration-300 hover:scale-105 shadow-2xl">
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                                <i class="fas fa-chart-line text-white text-3xl"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-bold text-purple-400 mb-4 text-center">ROI x3 en 6 mois</h3>
                        <p class="text-gray-300 text-center leading-relaxed mb-4">
                            Multipliez par <span class="text-purple-400 font-bold">3 votre retour sur investissement</span> grâce à l'adoption IA
                        </p>
                        <ul class="space-y-3 text-gray-300">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-purple-400 mr-3 mt-1"></i>
                                <span>Réduction des coûts opérationnels</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-purple-400 mr-3 mt-1"></i>
                                <span>Augmentation de la compétitivité</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-purple-400 mr-3 mt-1"></i>
                                <span>Innovation et nouveaux services</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Section : Nos Services d'Acculturation (DÉVELOPPÉE) -->
                <div class="grid lg:grid-cols-2 gap-8 mb-16">
                    <!-- Acculturation IA -->
                    <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-10 border-2 border-[#D4AF37] hover:border-[#FFD700] transition-all duration-300 hover:scale-105 shadow-2xl">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center mr-4 shadow-xl">
                                <i class="fas fa-graduation-cap text-black text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-3xl font-bold text-[#FFD700] mb-1">Acculturation IA</h3>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Former vos équipes</p>
                            </div>
                        </div>
                        
                        <p class="text-gray-300 text-lg mb-6 leading-relaxed">
                            Formations pratiques pour <span class="text-[#D4AF37] font-bold">maîtriser l'IA générative</span> au quotidien et transformer vos process métiers
                        </p>
                        
                        <div class="space-y-4">
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-laptop-code text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Ateliers pratiques IA générative</h4>
                                    <p class="text-sm text-gray-400">Sessions hands-on avec cas d'usage réels de votre entreprise</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i classs="fas fa-tools text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Formation aux outils IA</h4>
                                    <p class="text-sm text-gray-400">ChatGPT, MidJourney, Gemini, Claude, Copilot - maîtrise complète</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-briefcase text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Cas d'usage métiers concrets</h4>
                                    <p class="text-sm text-gray-400">Marketing, RH, Finance, Vente, Support - adaptés à chaque département</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-user-friends text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Accompagnement dans l'adoption</h4>
                                    <p class="text-sm text-gray-400">Suivi post-formation et coaching personnalisé pour garantir le succès</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Démystification IA -->
                    <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-10 border-2 border-[#D4AF37] hover:border-[#FFD700] transition-all duration-300 hover:scale-105 shadow-2xl">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center mr-4 shadow-xl">
                                <i class="fas fa-lightbulb text-black text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-3xl font-bold text-[#FFD700] mb-1">Démystification</h3>
                                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Convaincre vos décideurs</p>
                            </div>
                        </div>
                        
                        <p class="text-gray-300 text-lg mb-6 leading-relaxed">
                            Conférences stratégiques pour <span class="text-[#D4AF37] font-bold">comprendre les enjeux business</span> de l'IA et bâtir votre roadmap
                        </p>
                        
                        <div class="space-y-4">
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-presentation text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Conférences décideurs & CODIR</h4>
                                    <p class="text-sm text-gray-400">Comprendre les opportunités stratégiques de l'IA pour votre secteur</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-road text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Roadmap d'adoption IA</h4>
                                    <p class="text-sm text-gray-400">Plan d'action structuré sur 6-12 mois avec jalons mesurables</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-chart-bar text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Analyse ROI & KPIs IA</h4>
                                    <p class="text-sm text-gray-400">Métriques de performance et retour sur investissement mesurable</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start bg-black/30 rounded-xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">
                                <i class="fas fa-shield-alt text-[#D4AF37] text-xl mr-4 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-white mb-1">Gouvernance & Éthique IA</h4>
                                    <p class="text-sm text-gray-400">Cadre de gouvernance, conformité RGPD et usage responsable</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CTAs -->
                <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <a href="#contact" class="inline-flex items-center bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-5 rounded-full font-black text-xl hover:scale-110 transition-all duration-300 shadow-2xl group">
                        <i class="fas fa-calendar-check mr-3 group-hover:rotate-12 transition"></i>
                        Réserver une Session IA
                        <i class="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition"></i>
                    </a>
                </div>
            </div>

            <!-- Wave Separator doré -->
            <div class="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-full h-24">
                    <path d="M0,0 C300,60 900,60 1200,0 L1200,120 L0,120 Z" fill="#D4AF37" opacity="0.1"></path>
                </svg>
            </div>
        </section>

        <!-- Histoire CEM Innovation - TIMELINE HORIZONTALE COMPACTE -->
        <section id="histoire" class="py-16 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
            <!-- Background doré subtil -->
            <div class="absolute inset-0 opacity-5">
                <div class="absolute top-0 left-1/4 w-64 h-64 bg-[#D4AF37] rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-[#FFD700] rounded-full blur-3xl"></div>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <!-- Header compact -->
                <div class="text-center mb-12">
                    <p class="text-[#D4AF37] text-sm mb-2 uppercase tracking-wider">| Notre parcours</p>
                    <h2 class="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent mb-2">
                        L'émergence de CEM Innovation
                    </h2>
                    <p class="text-gray-400 text-base">2024 - Aujourd'hui</p>
                </div>
                
                <!-- Timeline Horizontale -->
                <div class="relative">
                    <!-- Ligne horizontale dorée -->
                    <div class="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                    
                    <!-- Timeline items en ligne -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <!-- 2024 - Naissance -->
                        <div class="flex flex-col items-center text-center">
                            <!-- Point doré -->
                            <div class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center shadow-2xl border-4 border-black z-10 mb-6">
                                <i class="fas fa-rocket text-black text-xl"></i>
                            </div>
                            <!-- Contenu compact -->
                            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all hover:scale-105">
                                <div class="text-[#D4AF37] font-bold text-xl mb-2">2024</div>
                                <h3 class="text-lg font-bold mb-2 text-white">Naissance</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">
                                    Lancement de CEM Innovation pour l'IA au Maroc
                                </p>
                            </div>
                        </div>
                        
                        <!-- 2025 - Acculturation -->
                        <div class="flex flex-col items-center text-center">
                            <!-- Point blanc -->
                            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#D4AF37] z-10 mb-6">
                                <i class="fas fa-users text-black text-xl"></i>
                            </div>
                            <!-- Contenu compact -->
                            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/30 hover:border-white transition-all hover:scale-105">
                                <div class="text-white font-bold text-xl mb-2">2025</div>
                                <h3 class="text-lg font-bold mb-2 text-white">Acculturation</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">
                                    200+ collaborateurs formés, 50+ entreprises
                                </p>
                            </div>
                        </div>
                        
                        <!-- 2026 - Leader -->
                        <div class="flex flex-col items-center text-center">
                            <!-- Point doré -->
                            <div class="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-full flex items-center justify-center shadow-2xl border-4 border-black z-10 mb-6">
                                <i class="fas fa-crown text-black text-xl"></i>
                            </div>
                            <!-- Contenu compact -->
                            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all hover:scale-105">
                                <div class="text-[#D4AF37] font-bold text-xl mb-2">2026</div>
                                <h3 class="text-lg font-bold mb-2 text-white">Leader IA</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">
                                    Référence nationale, 85% productivité
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Actualités & News Innovation -->
        <section id="actualites" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">CEM ACTUS & NEWS</h2>
                <p class="text-center text-gray-600 text-xl mb-16">Les dernières nouveautés de CEM Innovation</p>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    ${blogsHtml}
                </div>
            </div>
        </section>

        <!-- Section LinkedIn Newsletter - Style CEM -->
        <section class="py-8 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] relative overflow-hidden">
            <!-- Decoration pattern -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-0 left-0 w-full h-full" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px);"></div>
            </div>
            
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                    <!-- Texte -->
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="text-2xl md:text-3xl font-bold text-black mb-2">
                            On se retrouve sur <span class="italic">LinkedIn</span> ?
                        </h3>
                        <p class="text-black/80 text-base md:text-lg">
                            Abonnez-vous à notre newsletter pour suivre nos projets, nos actus et un peu d'inspiration chaque mois.
                        </p>
                    </div>
                    
                    <!-- Bouton LinkedIn -->
                    <div class="flex-shrink-0">
                        <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                           class="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
                            <i class="fab fa-linkedin-in text-xl"></i>
                            <span>S'abonner sur LinkedIn</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>

            </div>
        </section>

        <!-- Section Plaquettes (Brochures & Catalogues) -->
        ${plaquettesHtml}

        <!-- Formulaire Contact Innovation -->
        <section id="contact" class="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">Demandez Votre Audit IA</h2>
                <p class="text-center text-gray-400 text-xl mb-12">Prêt à transformer votre entreprise avec l'IA ? Discutons-en</p>
                
                <form x-data="{
                    formData: { name: '', email: '', phone: '', company: '', service: '', collaborateurs: '', message: '' },
                    loading: false, success: false, error: false, consent: false,
                    submitForm() {
                        this.loading = true; this.success = false; this.error = false;
                        fetch('/api/contact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: this.formData.name,
                                email: this.formData.email,
                                phone: this.formData.phone,
                                company: this.formData.company,
                                service: this.formData.service,
                                message: '[Collaborateurs: ' + this.formData.collaborateurs + '] - ' + this.formData.message,
                                source: 'CEM Innovation - Audit IA'
                            })
                        })
                        .then(res => {
                            if (res.ok) {
                                this.success = true;
                                this.formData = { name: '', email: '', phone: '', company: '', service: '', collaborateurs: '', message: '' };
                                this.consent = false;
                            } else { this.error = true; }
                        })
                        .catch(() => { this.error = true; })
                        .finally(() => { this.loading = false; });
                    }
                }" @submit.prevent="submitForm" class="space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37]">
                    <div x-show="success" style="display: none;" class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded" role="alert">
                        <strong>Succès!</strong> Votre demande d'audit IA a été envoyée. Nous vous recontacterons rapidement.
                    </div>
                    <div x-show="error" style="display: none;" class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded" role="alert">
                        <strong>Erreur!</strong> Une erreur est survenue. Veuillez réessayer.
                    </div>
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-user mr-2"></i>Nom complet *
                            </label>
                            <input type="text" x-model="formData.name" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="Votre nom">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-envelope mr-2"></i>Email *
                            </label>
                            <input type="email" x-model="formData.email" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="votre@email.com">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-phone mr-2"></i>Téléphone
                            </label>
                            <input type="tel" x-model="formData.phone" 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="+212 6 88 94 70 98">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-building mr-2"></i>Entreprise *
                            </label>
                            <input type="text" x-model="formData.company" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="Nom de votre entreprise">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-robot mr-2"></i>Service IA souhaité *
                            </label>
                            <select x-model="formData.service" required 
                                    class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white">
                                <option value="" class="bg-gray-900">Choisir un service...</option>
                                <option class="bg-gray-900">Acculturation IA</option>
                                <option class="bg-gray-900">Démystification IA</option>
                                <option class="bg-gray-900">Formation ChatGPT</option>
                                <option class="bg-gray-900">Formation MidJourney</option>
                                <option class="bg-gray-900">Formation Gemini</option>
                                <option class="bg-gray-900">Automatisation Processus</option>
                                <option class="bg-gray-900">Audit IA Complet</option>
                                <option class="bg-gray-900">Accompagnement IA sur mesure</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-users mr-2"></i>Nombre de collaborateurs
                            </label>
                            <select x-model="formData.collaborateurs" class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white">
                                <option value="" class="bg-gray-900">Choisir...</option>
                                <option class="bg-gray-900">1-10 collaborateurs</option>
                                <option class="bg-gray-900">11-50 collaborateurs</option>
                                <option class="bg-gray-900">51-100 collaborateurs</option>
                                <option class="bg-gray-900">101-500 collaborateurs</option>
                                <option class="bg-gray-900">Plus de 500 collaborateurs</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-comment-dots mr-2"></i>Décrivez vos besoins en IA
                        </label>
                        <textarea x-model="formData.message" rows="6" 
                                  class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                  placeholder="Parlez-nous de vos objectifs d'adoption de l'IA, défis à relever, départements concernés..."></textarea>
                    </div>
                    
                    <div class="flex items-start">
                        <input type="checkbox" x-model="consent" required class="mt-1 mr-3">
                        <label class="text-sm text-gray-400">
                            J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande *
                        </label>
                    </div>
                    
                    <button type="submit" :disabled="loading"
                            class="w-full bg-gradient-to-r from-[#D4AF37] to-black text-white py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                        <span x-show="!loading"><i class="fas fa-paper-plane mr-2"></i>Demander un Audit IA</span>
                        <span x-show="loading" style="display: none;"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
                    </button>
                    
                    <p class="text-center text-gray-500 text-sm">
                        <i class="fas fa-lock mr-2"></i>Vos données sont sécurisées et ne seront jamais partagées
                    </p>
                </form>
                
                <!-- Contact rapide -->
                <div class="mt-12 grid md:grid-cols-3 gap-8 text-center">
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-#D4AF37/30">
                        <i class="fas fa-phone-alt text-#D4AF37 text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Téléphone</h4>
                        <p class="text-gray-400"><a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a></p>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-black/30">
                        <i class="fas fa-envelope text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Email</h4>
                        <a href="mailto:contact@cembymazini.ma" class="text-gray-400 hover:text-[#D4AF37] transition block">contact@cembymazini.ma</a>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-#D4AF37/30">
                        <i class="fas fa-map-marker-alt text-#D4AF37 text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Adresse</h4>
                        <p class="text-gray-400">Casablanca, Maroc</p>
                    </div>
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
  `)
})

// Page Recrutement
app.get('/recrutement', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rejoignez CEM GROUP - Recrutement & Carrières</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <link href="/styles.css" rel="stylesheet">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section -->
        <section class="pt-32 pb-20 bg-gradient-to-br from-black to-gray-900 relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-12">
                    <h1 class="text-6xl font-black text-white mb-6">
                        Rejoignez Notre <span class="gradient-text">Équipe</span>
                    </h1>
                    <p class="text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                        Faites partie d'une agence innovante qui transforme les marques depuis 2018
                    </p>
                    <div class="flex justify-center gap-8 text-white">
                        <div class="text-center">
                            <div class="text-4xl font-black text-[#D4AF37]">100+</div>
                            <div class="text-sm text-gray-400">Clients</div>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl font-black text-[#D4AF37]">7+</div>
                            <div class="text-sm text-gray-400">Années</div>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl font-black text-[#D4AF37]">15+</div>
                            <div class="text-sm text-gray-400">Collaborateurs</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pourquoi nous rejoindre -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| Nos Valeurs</p>
                    <h2 class="text-5xl font-bold text-white neon-text-small mb-4">Pourquoi Nous Rejoindre ?</h2>
                </div>
                
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-lightbulb text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white neon-text-small mb-4">Innovation Continue</h3>
                        <p class="text-gray-600">Travaillez avec les dernières technologies en IA, production audiovisuelle et marketing digital</p>
                    </div>
                    
                    <div class="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-rocket text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white neon-text-small mb-4">Croissance Rapide</h3>
                        <p class="text-gray-600">Évoluez dans une entreprise en pleine expansion avec des opportunités de carrière</p>
                    </div>
                    
                    <div class="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-users text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white neon-text-small mb-4">Équipe Passionnée</h3>
                        <p class="text-gray-600">Intégrez une équipe talentueuse et bienveillante qui partage la passion du succès</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Formulaire de Candidature -->
        <section class="py-20 bg-gradient-to-br from-gray-900 to-black">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| Postulez Maintenant</p>
                    <h2 class="text-5xl font-bold text-white mb-4">Envoyez Votre Candidature</h2>
                    <p class="text-xl text-gray-300">Remplissez le formulaire ci-dessous et joignez votre CV</p>
                </div>
                
                <div class="bg-white rounded-3xl p-10 shadow-2xl">
                    <form x-data="{
                        firstName: '', lastName: '', email: '', phone: '', position: '', coverLetter: '', portfolio: '',
                        cvFile: null, loading: false, message: '', error: false
                    }" @submit.prevent="
                        loading = true; error = false; message = '';
                        let cvUrl = '';
                        try {
                            if (cvFile) {
                                const fd = new FormData();
                                fd.append('file', cvFile);
                                fd.append('folder', 'cem-group/recruitment');
                                const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                                const uploadData = await uploadRes.json();
                                if (uploadData.url) { cvUrl = uploadData.url; } 
                            }
                            const res = await fetch('/api/recruitment/apply', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ firstName, lastName, email, phone, position, coverLetter, cvUrl, portfolio })
                            });
                            const data = await res.json();
                            if (res.ok) {
                                message = data.message || 'Candidature envoy\u00e9e avec succ\u00e8s !';
                                firstName = ''; lastName = ''; email = ''; phone = ''; position = ''; coverLetter = ''; portfolio = ''; cvFile = null;
                            } else {
                                error = true; message = data.error || 'Erreur lors de l\\'envoi';
                            }
                        } catch(e) {
                            error = true; message = 'Erreur de connexion, veuillez r\u00e9essayer';
                        } finally { loading = false; }
                    " class="space-y-6">
                        <div x-show="message" :class="error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'" class="p-4 rounded-xl border text-center font-semibold">
                            <span x-text="message"></span>
                        </div>
                        <div class="grid md:grid-cols-2 gap-8">
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Pr\u00e9nom *</label>
                                <input type="text" x-model="firstName" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Nom *</label>
                                <input type="text" x-model="lastName" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-8">
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Email *</label>
                                <input type="email" x-model="email" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">T\u00e9l\u00e9phone</label>
                                <input type="tel" x-model="phone" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Poste souhait\u00e9 *</label>
                            <select x-model="position" required class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition">
                                <option value="">S\u00e9lectionnez un poste</option>
                                <option value="Chef de Projet Marketing Digital">Chef de Projet Marketing Digital</option>
                                <option value="Designer Graphique">Designer Graphique</option>
                                <option value="Monteur Vid\u00e9o / Motion Designer">Monteur Vid\u00e9o / Motion Designer</option>
                                <option value="Community Manager">Community Manager</option>
                                <option value="D\u00e9veloppeur Web">D\u00e9veloppeur Web</option>
                                <option value="Formateur(trice) Professionnel(le)">Formateur(trice) Professionnel(le)</option>
                                <option value="Charg\u00e9(e) de Client\u00e8le">Charg\u00e9(e) de Client\u00e8le</option>
                                <option value="Candidature Spontan\u00e9e">Candidature Spontan\u00e9e</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Lettre de Motivation</label>
                            <textarea x-model="coverLetter" rows="6" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition" placeholder="Parlez-nous de vous et de vos motivations..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">CV (PDF) - Optionnel</label>
                            <input type="file" accept=".pdf" @change="cvFile = $event.target.files[0]" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#D4AF37] file:text-white file:font-semibold hover:file:bg-[#B8941F] file:cursor-pointer">
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Portfolio / LinkedIn (optionnel)</label>
                            <input type="url" x-model="portfolio" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition" placeholder="https://...">
                        </div>
                        
                        <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white px-8 py-5 rounded-full font-black text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50">
                            <i class="fas fa-paper-plane mr-3"></i><span x-text="loading ? 'Envoi en cours...' : 'Envoyer Ma Candidature'"></span>
                        </button>
                    </form>
                </div>
            </div>
        </section>

        <!-- FAQ CEM FORMATION -->
        <section class="py-20 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Questions Fréquentes - CEM FORMATION</h2>
                    <p class="text-xl text-gray-600">Tout savoir sur nos formations professionnelles</p>
                </div>
                
                <div class="space-y-4" x-data="{ openFaq: null }">
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 1 ? null : 1" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Combien de formations proposez-vous ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 1 }"></i>
                        </button>
                        <div x-show="openFaq === 1" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>19 formations certifiées</strong> réparties en 4 domaines : <strong>Digital & Marketing</strong> (6 formations), <strong>Management & Leadership</strong> (5), <strong>Business Développement</strong> (4), <strong>Industrie & Sécurité</strong> (4).
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 2 ? null : 2" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Vos formations sont-elles certifiées ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 2 }"></i>
                        </button>
                        <div x-show="openFaq === 2" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Oui ! Toutes nos formations délivrent des <strong>certifications professionnelles reconnues</strong>. +500 professionnels formés et certifiés depuis 2018. Taux de satisfaction : <strong>95%</strong>.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 3 ? null : 3" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Quels formats proposez-vous ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 3 }"></i>
                        </button>
                        <div x-show="openFaq === 3" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>Présentiel</strong> (Casablanca), <strong>Distanciel</strong> (visio interactive), <strong>Hybride</strong>, et <strong>E-Learning</strong> (plateforme iSpring LMS 24/7). Durées : 2h à 5 jours selon formation.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 4 ? null : 4" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Proposez-vous des formations sur-mesure ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 4 }"></i>
                        </button>
                        <div x-show="openFaq === 4" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            Oui ! <strong>Diagnostic</strong> de vos besoins → <strong>Programme adapté</strong> à votre secteur → <strong>Formation intra-entreprise</strong> → <strong>Suivi 3 mois</strong>. 100% personnalisable.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 5 ? null : 5" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Qui sont vos formateurs ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 5 }"></i>
                        </button>
                        <div x-show="openFaq === 5" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>Consultants experts</strong> avec +10 ans d'expérience terrain, certifications internationales, pédagogie <strong>70% pratique / 30% théorie</strong>. Mise en situation réelle.
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <button @click="openFaq = openFaq === 6 ? null : 6" 
                                class="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition">
                            <span class="font-semibold text-lg text-gray-900">Comment financer ma formation ?</span>
                            <i class="fas fa-chevron-down text-[#D4AF37] transition-transform" 
                               :class="{ 'rotate-180': openFaq === 6 }"></i>
                        </button>
                        <div x-show="openFaq === 6" x-collapse class="px-6 pb-6 text-gray-600 leading-relaxed">
                            <strong>Financement entreprise</strong>, <strong>Prise en charge ANAPEC/OFPPT</strong>, <strong>Facilités de paiement</strong>. Audit : <a href="tel:+212688947098" class="text-[#D4AF37] hover:underline">+212 6 88 94 70 98</a>
                        </div>
                    </div>
                </div>
                
                <div class="mt-16 text-center bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-2xl p-12">
                    <h3 class="text-3xl font-bold text-white mb-4">Prêt à transformer vos compétences ?</h3>
                    <p class="text-white/90 text-lg mb-8">Construisons ensemble votre parcours de formation</p>
                    <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-2xl">
                        <i class="fab fa-linkedin-in text-2xl"></i>
                        <span>Restons en Contact</span>
                    </a>
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
  `)
})

// Page d'accueil
app.get('/', async (c) => {
    // Fetch dynamic content
    const [blogs, events, popups, plaquettes] = await Promise.all([
        blogService.getAll(c.env).catch(() => []),
        eventsService.getAll(c.env).catch(() => []),
        popupService.getAll(c.env).catch(() => []),
        plaquettesService.getAll(c.env).catch(() => [])
    ]);

    const publishedBlogs = blogs.filter(b => b.status === 'published').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 3);
    const upcomingEvents = events.filter(e => e.status === 'published' && new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 2);
    const activePopup = popups.find(p => p.isActive);
    const catalogueUrl = plaquettes.length > 0 ? plaquettes[0].url : '#';

    const blogHtml = generateBlogSectionHtml(publishedBlogs);
    const eventsHtml = generateEventsSectionHtml(upcomingEvents);
    const popupHtml = generatePopupHtml(activePopup);

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM FORMATION - Formation Professionnelle Digitale Maroc | LinkedIn, E-Learning, IA</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="CEM FORMATION Maroc: 19 formations certifiées (LinkedIn, Marketing, Management, HACCP). 500+ apprenants, 95% satisfaction. Boostez vos compétences !">
        <meta name="keywords" content="formation professionnelle maroc, formation linkedin maroc, e-learning maroc, formation marketing digital, formation ia maroc, certification professionnelle, cem formation, n1 growth favikon">
        <meta name="author" content="CEM GROUP - CEM Formation">
        <meta name="robots" content="index, follow">
        <meta name="geo.region" content="MA">
        <meta name="geo.placename" content="Maroc">
        <link rel="canonical" href="https://cembymazini.ma/formation">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="CEM FORMATION - Formation Professionnelle Digitale | LinkedIn, E-Learning, IA">
        <meta property="og:description" content="15 formations professionnelles : LinkedIn (N°1 Growth Maroc), E-Learning, Marketing Digital, Management, Vente. 500+ apprenants, 95% satisfaction.">
        <meta property="og:url" content="https://cembymazini.ma/formation">
        <meta property="og:site_name" content="CEM GROUP">
        <meta property="og:locale" content="fr_MA">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CEM FORMATION - Formation Professionnelle Digitale Maroc">
        <meta name="twitter:description" content="15 formations : LinkedIn N°1 Growth Maroc, E-Learning, Marketing, IA. 500+ apprenants formés.">
        
        <link href="/styles.css" rel="stylesheet">
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            /* Animations Hero Formation */
            @keyframes blob {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(20px, -50px) scale(1.1); }
                50% { transform: translate(-20px, 20px) scale(0.9); }
                75% { transform: translate(50px, 50px) scale(1.05); }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
            .animate-float { animation: float 3s ease-in-out infinite; }
            
            /* Animation main qui fait coucou */
            @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(20deg); }
                75% { transform: rotate(-10deg); }
            }
            .animate-wave {
                animation: wave 1.5s ease-in-out infinite;
                transform-origin: 70% 70%;
                display: inline-block;
            }
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Formation (FOND NOIR) -->
        <section class="relative bg-black min-h-screen flex items-center justify-center pt-20 px-4 pb-32 md:pb-40 overflow-hidden">
            <!-- Blobs dorés animés en arrière-plan -->
            <div class="absolute inset-0 overflow-hidden">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full opacity-20 blur-3xl animate-blob"></div>
                <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000"></div>
                <div class="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full opacity-20 blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div class="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center z-10">
                <!-- COLONNE GAUCHE : TEXTE -->
                <div class="text-white space-y-6">
                    <h1 class="text-5xl md:text-6xl font-bold leading-tight">
                        Développez les <span class="gradient-text">compétences</span> de demain
                    </h1>
                    <p class="text-xl text-gray-300 leading-relaxed">
                        Formations professionnelles digitales, e-learning sur-mesure et accompagnement certifié pour transformer vos équipes.
                    </p>
                    
                    <!-- CTAs -->
                    <div class="flex flex-wrap gap-4 pt-4">
                        <a href="${catalogueUrl}" target="_blank" download class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
                            <i class="fas fa-download mr-2"></i>
                            Télécharger le catalogue
                        </a>
                        <a href="#services" class="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#D4AF37] hover:text-black transition-all inline-flex items-center">
                            <i class="fas fa-arrow-down mr-2"></i>
                            Découvrir nos formations
                        </a>
                    </div>
                </div>

                <!-- COLONNE DROITE : MASCOTTES -->
                <div class="relative flex items-center justify-center">
                    <div class="relative animate-float">
                        <img src="https://www.genspark.ai/api/files/s/QqzucmtA" alt="Équipe CEM Formation Maroc - Formateurs Certifiés E-Learning, LinkedIn N°1 Growth, Marketing Digital et Intelligence Artificielle" loading="lazy" class="relative z-20 w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300" loading="lazy" >
                        <!-- Cercle doré pulsant -->
                        <div class="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- MINI VAGUE Black → White -->
        <div class="relative -mt-1">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
                <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" 
                      fill="#000000"/>
                <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
                      fill="#FFFFFF"/>
            </svg>
        </div>
        
        <!-- CTA Flottants Formation -->
        <div class="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
            <!-- Email Bouton -->
            <a href="mailto:contact@cembymazini.ma?subject=Demande%20d'information%20CEM%20FORMATION&body=Bonjour%20CEM%20FORMATION,%0A%0AJe%20souhaite%20des%20informations%20sur%20vos%20formations.%0A%0ACordialement" 
               class="bg-[#D4AF37] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform hover:shadow-[#D4AF37]/50" 
               title="Email - contact@cembymazini.ma">
                <i class="fas fa-envelope text-2xl"></i>
            </a>
            <!-- WhatsApp Bouton -->
            <a href="https://wa.me/212688947098?text=Bonjour%20CEM%20FORMATION,%20je%20souhaite%20des%20informations%20sur%20vos%20formations" 
               target="_blank"
               class="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition transform animate-pulse" 
               title="WhatsApp - Contact Direct">
                <i class="fab fa-whatsapp text-2xl"></i>
            </a>
        </div>

        <!-- Pourquoi Choisir CEM Formation -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/20 px-6 py-2 rounded-full text-sm font-bold text-[#D4AF37] mb-4">
                        <i class="fas fa-award mr-2"></i>Pourquoi Nous Choisir
                    </div>
                    <h2 class="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                        L'Excellence CEM Formation
                    </h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                        Des formations de qualité supérieure dispensées par des experts reconnus pour transformer vos équipes
                    </p>
                </div>
                
                <!-- Grid 2x2 -->
                <div class="grid md:grid-cols-2 gap-8 mb-12">
                    
                    <!-- 1. Consultants Experts -->
                    <div class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-[#D4AF37] transition group">
                        <div class="flex items-start gap-4 mb-6">
                            <div class="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <i class="fas fa-user-tie text-white text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 mb-2">Consultants Experts Sélectionnés</h3>
                                <p class="text-[#D4AF37] font-semibold text-sm">+10 ans d'expérience terrain</p>
                            </div>
                        </div>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Praticiens reconnus</strong> : experts terrain avec résultats prouvés</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Certifications internationales</strong> : diplômés et accrédités</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Pédagogie active</strong> : 70% pratique, 30% théorie</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Suivi personnalisé</strong> : accompagnement post-formation inclus</span>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- 2. Modules Sur-Mesure -->
                    <div class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-[#D4AF37] transition group">
                        <div class="flex items-start gap-4 mb-6">
                            <div class="bg-gradient-to-br from-black to-gray-800 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <i class="fas fa-puzzle-piece text-[#D4AF37] text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 mb-2">Modules 100% Personnalisables</h3>
                                <p class="text-[#D4AF37] font-semibold text-sm">Adaptés à vos besoins métier</p>
                            </div>
                        </div>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Diagnostic préalable</strong> : analyse de vos besoins</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Contenus sur-mesure</strong> : cas pratiques issus de votre secteur</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Flexibilité totale</strong> : présentiel, distanciel ou hybride</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Rythme adapté</strong> : intensif, modulaire ou à la carte</span>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- 3. Technologies & Outils -->
                    <div class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-[#D4AF37] transition group">
                        <div class="flex items-start gap-4 mb-6">
                            <div class="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <i class="fas fa-laptop-code text-white text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 mb-2">Plateforme E-Learning Avancée</h3>
                                <p class="text-[#D4AF37] font-semibold text-sm">Technologie iSpring LMS</p>
                            </div>
                        </div>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Accès 24/7</strong> : formation à votre rythme, où vous voulez</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Tableaux de bord analytics</strong> : suivi progression en temps réel</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Contenus interactifs</strong> : vidéos, quiz, simulations</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Mobile-friendly</strong> : compatible smartphone & tablette</span>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- 4. Résultats Garantis -->
                    <div class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border-2 border-transparent hover:border-[#D4AF37] transition group">
                        <div class="flex items-start gap-4 mb-6">
                            <div class="bg-gradient-to-br from-black to-gray-800 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <i class="fas fa-chart-line text-[#D4AF37] text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900 mb-2">ROI & Résultats Mesurables</h3>
                                <p class="text-[#D4AF37] font-semibold text-sm">95% de satisfaction client</p>
                            </div>
                        </div>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Certifications reconnues</strong> : attestations officielles</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>+85% de mise en pratique</strong> : compétences opérationnelles immédiates</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>Suivi post-formation</strong> : hotline & coaching pendant 3 mois</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span><strong>500+ professionnels formés</strong> : témoignages & success stories</span>
                            </li>
                        </ul>
                    </div>
                    
                </div>
                
                <!-- CTA Final -->
                <!-- CTA Catalogue PDF -->
                <div class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-3xl p-12 text-center text-white">
                    <i class="fas fa-file-pdf text-6xl mb-6"></i>
                    <h3 class="text-4xl font-bold mb-4">Téléchargez Notre Catalogue Complet 2026</h3>
                    <p class="text-xl mb-8 opacity-90">19 formations détaillées • Tarifs • Modalités • Certifications</p>
                    <a href="/static/catalogue.html" 
                       target="_blank"
                       download
                       class="inline-block bg-white text-[#D4AF37] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-2xl">
                        <i class="fas fa-download mr-3"></i>Télécharger le Catalogue PDF
                    </a>
                </div>
            </div>
        </section>

        <!-- Section E-Learning & Digitalisation des Formations -->
        <section id="digitaliser" class="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            <!-- Blobs décoratifs animés -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/10 to-[#00D4FF]/10 rounded-full blur-3xl animate-pulse"></div>
            <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#00D4FF]/10 to-[#D4AF37]/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid md:grid-cols-2 gap-16 items-center">
                    
                    <!-- COLONNE GAUCHE : TEXTE EXPLICATIF -->
                    <div class="text-white space-y-8">
                        <!-- Titre principal -->
                        <div>
                            <h2 class="text-4xl md:text-5xl font-bold mb-4">
                                <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#D4AF37]">Apprendre en continu</span>
                            </h2>
                            <p class="text-xl text-gray-300 leading-relaxed">
                                Une plateforme e-learning personnalisée pour simplifier la formation, renforcer l'engagement et développer les compétences au rythme des entreprises contemporaines.
                            </p>
                        </div>
                        
                        <!-- Feature 1 -->
                        <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#00D4FF]/30 hover:border-[#00D4FF] transition">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-[#00D4FF] to-[#0099CC] rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-laptop-code text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold text-[#00D4FF] mb-3">Intégrez iSpring Learn, votre solution e-learning clé en main.</h3>
                                    <p class="text-gray-300 leading-relaxed">
                                        Avec iSpring Learn, Flow Studio vous aide à déployer une plateforme e-learning prête à l'emploi, pensée pour simplifier la gestion, connecter les apprenants et booster la performance de vos programmes de formation.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Feature 2 -->
                        <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-layer-group text-black text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold text-[#D4AF37] mb-3">Simplifiez, centralisez et dynamisez vos formations.</h3>
                                    <p class="text-gray-300 leading-relaxed mb-4">
                                        Flow Studio digitalise vos supports pédagogiques et déploie des solutions e-learning sur mesure pour moderniser vos parcours pédagogiques.
                                    </p>
                                    <ul class="space-y-2 text-gray-300">
                                        <li class="flex items-start">
                                            <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                            <span>Plateforme LMS interactive : centralisez la gestion, suivez les progrès et offrez une expérience d'apprentissage moderne</span>
                                        </li>
                                        <li class="flex items-start">
                                            <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                            <span>Modules interactifs : vidéos, quiz, simulations pour un apprentissage engageant</span>
                                        </li>
                                        <li class="flex items-start">
                                            <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                            <span>Tableaux de bord analytics : suivez la progression en temps réel</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Bénéfices -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gradient-to-br from-[#00D4FF]/10 to-transparent rounded-xl p-4 border border-[#00D4FF]/20">
                                <div class="text-3xl font-black text-[#00D4FF] mb-1">24/7</div>
                                <p class="text-sm text-gray-400">Accès illimité</p>
                            </div>
                            <div class="bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-xl p-4 border border-[#D4AF37]/20">
                                <div class="text-3xl font-black text-[#D4AF37] mb-1">100%</div>
                                <p class="text-sm text-gray-400">Mobile-friendly</p>
                            </div>
                            <div class="bg-gradient-to-br from-[#00D4FF]/10 to-transparent rounded-xl p-4 border border-[#00D4FF]/20">
                                <div class="text-3xl font-black text-[#00D4FF] mb-1">+85%</div>
                                <p class="text-sm text-gray-400">Engagement</p>
                            </div>
                            <div class="bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-xl p-4 border border-[#D4AF37]/20">
                                <div class="text-3xl font-black text-[#D4AF37] mb-1">Support</div>
                                <p class="text-sm text-gray-400">Accompagnement</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- COLONNE DROITE : IMAGE ILLUSTRATIVE -->
                    <div class="relative">
                        <!-- Cadre décoratif avec glow effect -->
                        <div class="absolute -inset-4 bg-gradient-to-r from-[#00D4FF] via-[#D4AF37] to-[#00D4FF] rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                        
                        <!-- Image e-learning avec overlay moderne -->
                        <div class="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-500 transform hover:scale-105">
                            <img src="https://sspark.genspark.ai/cfimages?u1=d4s1MBgGj3TNhfs%2BP8mYDJRIo3d9m7IIfL17RfGgkicld84quvJthRiFvE%2BIcgPevW8NNCTZhpf9GcUUBGS6JdWpfcivMttJP1GIdYnxrn%2BJXYaMPjDsajBUyGoNxQOJtY6AYdTRWLu97C2TNJdV2LTKxsk%3D&u2=Xh6DcWlHXzAB%2B%2FLp&width=2560" 
                                 alt="Dashboard LMS moderne - Plateforme e-learning CEM Formation iSpring Learn" 
                                 class="w-full h-auto object-cover" loading="lazy" >
                            
                            <!-- Badge flottant -->
                            <div class="absolute top-6 right-6 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-6 py-3 rounded-full font-bold text-sm shadow-2xl animate-bounce">
                                <i class="fas fa-star mr-2"></i>iSpring Learn
                            </div>
                        </div>
                        
                        <!-- Stats flottantes -->
                        <div class="absolute -bottom-8 -left-8 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-[#00D4FF]/30 transform hover:scale-110 transition-all duration-300">
                            <div class="text-3xl font-black text-[#00D4FF] mb-1">500+</div>
                            <p class="text-sm text-gray-600 font-semibold">Apprenants actifs</p>
                        </div>
                        
                        <div class="absolute -top-8 -right-8 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-[#D4AF37]/30 transform hover:scale-110 transition-all duration-300">
                            <div class="text-3xl font-black text-[#D4AF37] mb-1">95%</div>
                            <p class="text-sm text-gray-600 font-semibold">Satisfaction</p>
                        </div>
                    </div>
                    
                </div>
                
                <!-- CTA Final -->
                <div class="mt-16 text-center">
                    <div class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-2xl p-8 inline-block">
                        <h3 class="text-2xl font-bold text-black mb-4">
                            <i class="fas fa-rocket mr-3"></i>
                            Prêt à digitaliser vos formations ?
                        </h3>
                        <p class="text-black/80 text-lg mb-6">
                            Plateforme e-learning iSpring, formations sur-mesure et accompagnement personnalisé
                        </p>
                        <div class="flex flex-wrap justify-center gap-4">
                            <a href="/#contact" class="bg-black text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition shadow-xl inline-flex items-center">
                                <i class="fas fa-comments mr-2"></i>
                                Parlons-en
                            </a>
                            <a href="${catalogueUrl}" target="_blank" download class="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl inline-flex items-center">
                                <i class="fas fa-download mr-2"></i>
                                Télécharger le catalogue
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Toutes Nos Formations - ACCORDÉONS PAR CATÉGORIE -->
        <section id="services" class="py-20 bg-gradient-to-br from-gray-50 to-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- Header -->
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/20 px-6 py-2 rounded-full text-sm font-bold text-[#D4AF37] mb-4">
                        <i class="fas fa-graduation-cap mr-2"></i>Catalogue 2026
                    </div>
                    <h2 class="text-5xl font-bold gradient-text mb-4">Nos Formations Professionnelles</h2>
                </div>

                <!-- Accordéons par Catégorie -->
                <div class="space-y-6" x-data="{ activeCategory: null }">
                
                    <!-- CATÉGORIE 1 : DIGITAL & MARKETING -->
                    <div id="digital-marketing" class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition">
                        <button @click="activeCategory = activeCategory === 1 ? null : 1" 
                                class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white hover:opacity-90 transition">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-laptop-code text-3xl"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="text-2xl font-bold">Digital & Marketing</h3>
                                    <p class="text-sm opacity-90">6 formations • E-Learning, LinkedIn, IA...</p>
                                </div>
                            </div>
                            <i :class="activeCategory === 1 ? 'fa-chevron-up' : 'fa-chevron-down'" 
                               class="fas text-2xl transition-transform"></i>
                        </button>
                        
                        <div x-show="activeCategory === 1" 
                             x-collapse
                             class="p-8 bg-gray-50">
                            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                                <!-- 1. E-Learning Digital -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=250&fit=crop" 
                                             alt="E-Learning Digital" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-graduation-cap mr-1"></i>E-Learning
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">E-Learning Digital</h4>
                                    <p class="text-sm text-gray-600 mb-4">Plateforme LMS complète et digitalisation de contenus</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Modules interactifs</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>LMS personnalisée</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Certifications</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-envelope mr-2"></i>Devis
                                    </a>
                                </div>
                                
                                <!-- 2. LinkedIn One-to-One -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group relative">
                                    <div class="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black z-10">
                                        N°1 GROWTH 🇲🇦
                                    </div>
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400&h=250&fit=crop" 
                                             alt="LinkedIn Formation" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#0077B5] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fab fa-linkedin mr-1"></i>1-to-1
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">LinkedIn One-to-One</h4>
                                    <p class="text-sm text-gray-600 mb-4">Accompagnement personnalisé LinkedIn & Personal Branding</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Optimisation profil</li>
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Stratégie contenu</li>
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Personal Branding</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#0077B5] text-white text-center font-bold py-2 rounded-lg hover:bg-black transition text-sm">
                                        <i class="fas fa-calendar-alt mr-2"></i>Réserver
                                    </a>
                                </div>
                                
                                <!-- 3. LinkedIn Team -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop" 
                                             alt="LinkedIn Team" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#0077B5] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-users mr-1"></i>Team
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">LinkedIn Accompagnement Team</h4>
                                    <p class="text-sm text-gray-600 mb-4">Formation collective pour ambassadeurs LinkedIn</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Employee Advocacy</li>
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Social Selling</li>
                                        <li><i class="fas fa-check text-[#0077B5] mr-2"></i>Stratégie équipe</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#0077B5] text-white text-center font-bold py-2 rounded-lg hover:bg-black transition text-sm">
                                        <i class="fas fa-users mr-2"></i>Former l'équipe
                                    </a>
                                </div>
                                
                                <!-- 4. Marketing Digital -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop" 
                                             alt="Marketing Digital" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-bullhorn mr-1"></i>Marketing
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Marketing Digital</h4>
                                    <p class="text-sm text-gray-600 mb-4">Tous les leviers du marketing digital moderne</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>SEO & SEA</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Social Media</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Analytics & ROI</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 5. Création de Contenu -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop" 
                                             alt="Création de Contenu" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-pen-fancy mr-1"></i>Création
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Création de Contenu</h4>
                                    <p class="text-sm text-gray-600 mb-4">Copywriting, storytelling et stratégie éditoriale</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Copywriting pro</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Storytelling</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Stratégie éditoriale</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-edit mr-2"></i>Découvrir
                                    </a>
                                </div>
                                
                                <!-- 6. IA & Innovation -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop" 
                                             alt="IA & Innovation" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-robot mr-1"></i>IA
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">IA & Innovation</h4>
                                    <p class="text-sm text-gray-600 mb-4">Intelligence Artificielle et outils IA génératives</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-black mr-2"></i>IA générative</li>
                                        <li><i class="fas fa-check text-black mr-2"></i>Outils & use cases</li>
                                        <li><i class="fas fa-check text-black mr-2"></i>Transformation IA</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-black text-white text-center font-bold py-2 rounded-lg hover:bg-gray-800 transition text-sm">
                                        <i class="fas fa-lightbulb mr-2"></i>Explorer
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    <!-- CATÉGORIE 2 : MANAGEMENT & LEADERSHIP -->
                    <div id="management" class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition">
                        <button @click="activeCategory = activeCategory === 2 ? null : 2" 
                                class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-gray-900 to-black text-white hover:opacity-90 transition">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-users-cog text-3xl"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="text-2xl font-bold">Management & Leadership</h3>
                                    <p class="text-sm opacity-90">6 formations • Leadership, Communication, Coaching...</p>
                                </div>
                            </div>
                            <i :class="activeCategory === 2 ? 'fa-chevron-up' : 'fa-chevron-down'" 
                               class="fas text-2xl transition-transform"></i>
                        </button>
                        
                        <div x-show="activeCategory === 2" 
                             x-collapse
                             class="p-8 bg-gray-50">
                            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                                <!-- 7. Leadership -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop" 
                                             alt="Leadership" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-crown mr-1"></i>Leadership
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Leadership</h4>
                                    <p class="text-sm text-gray-600 mb-4">Développez vos compétences de leader</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Management d'équipe</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Vision stratégique</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Influence & impact</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-star mr-2"></i>Devenir leader
                                    </a>
                                </div>
                                
                                <!-- 8. Communication -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop" 
                                             alt="Communication" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-comments mr-1"></i>Communication
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Communication Professionnelle</h4>
                                    <p class="text-sm text-gray-600 mb-4">Maîtrisez l'art de la communication efficace</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Prise de parole</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Communication interpersonnelle</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Gestion conflits</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-microphone mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 9. Bien-être au Travail -->
                               <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop" 
                                             alt="Bien-être" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-heart mr-1"></i>Bien-être
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Bien-être au Travail</h4>
                                    <p class="text-sm text-gray-600 mb-4">QVT et équilibre vie pro/perso</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Gestion du stress</li>
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Équilibre vie pro/perso</li>
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Prévention burn-out</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-green-600 text-white text-center font-bold py-2 rounded-lg hover:bg-green-700 transition text-sm">
                                        <i class="fas fa-spa mr-2"></i>En savoir plus
                                    </a>
                                </div>
                                
                                <!-- 10. Coaching Dirigeants -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop" 
                                             alt="Coaching" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-user-tie mr-1"></i>Coaching
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Coaching Dirigeants</h4>
                                    <p class="text-sm text-gray-600 mb-4">Accompagnement personnalisé des leaders</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Coaching individuel</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Performance exec</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Stratégie perso</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-hands-helping mr-2"></i>Réserver
                                    </a>
                                </div>
                                
                                <!-- 11. Force de Vente -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=250&fit=crop" 
                                             alt="Force de Vente" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-chart-line mr-1"></i>Vente
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Force de Vente & Négociation</h4>
                                    <p class="text-sm text-gray-600 mb-4">Techniques de vente et négociation B2B</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Techniques de vente</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Négociation B2B</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Closing efficace</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-handshake mr-2"></i>Rejoindre
                                    </a>
                                </div>
                                
                                <!-- 12. Gestion de Projet -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop" 
                                             alt="Gestion de Projet" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-tasks mr-1"></i>Projet
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Gestion de Projet</h4>
                                    <p class="text-sm text-gray-600 mb-4">Méthodologies Agile, Scrum et gestion projet</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Méthodologie Agile</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Scrum & Kanban</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Outils modernes</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>Découvrir
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    <!-- CATÉGORIE 3 : BUSINESS & DÉVELOPPEMENT -->
                    <div id="business-dev" class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition">
                        <button @click="activeCategory = activeCategory === 3 ? null : 3" 
                                class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:opacity-90 transition">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-briefcase text-3xl"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="text-2xl font-bold">Business & Développement</h3>
                                    <p class="text-sm opacity-90">3 formations • Entrepreneuriat, Stratégie...</p>
                                </div>
                            </div>
                            <i :class="activeCategory === 3 ? 'fa-chevron-up' : 'fa-chevron-down'" 
                               class="fas text-2xl transition-transform"></i>
                        </button>
                        
                        <div x-show="activeCategory === 3" 
                             x-collapse
                             class="p-8 bg-gray-50">
                            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                                <!-- 13. Développement Personnel -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=250&fit=crop" 
                                             alt="Développement Personnel" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-user-check mr-1"></i>Perso
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Développement Personnel</h4>
                                    <p class="text-sm text-gray-600 mb-4">Confiance, assertivité et efficacité personnelle</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>Confiance en soi</li>
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>Assertivité</li>
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>Efficacité perso</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-purple-600 text-white text-center font-bold py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 14. Entrepreneuriat -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=250&fit=crop" 
                                             alt="Entrepreneuriat" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-lightbulb mr-1"></i>Entrepreneur
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Entrepreneuriat</h4>
                                    <p class="text-sm text-gray-600 mb-4">Créer et développer son entreprise</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Business model</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Financement startup</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Développement</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>Lancer mon projet
                                    </a>
                                </div>
                                
                                <!-- 15. Stratégie d'Entreprise -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop" 
                                             alt="Stratégie" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-chess mr-1"></i>Stratégie
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Stratégie d'Entreprise</h4>
                                    <p class="text-sm text-gray-600 mb-4">Vision stratégique et pilotage de la performance</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Vision stratégique</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Pilotage perf</li>
                                        <li><i class="fas fa-check text-[#D4AF37] mr-2"></i>Transformation</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-[#D4AF37] text-white text-center font-bold py-2 rounded-lg hover:bg-[#B8941F] transition text-sm">
                                        <i class="fas fa-chart-line mr-2"></i>En savoir plus
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    
                </div>
                
                <!-- CATÉGORIE 4 : INDUSTRIE & SÉCURITÉ (NOUVELLE) -->
                    <div id="industrie-securite" class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition">
                        <button @click="activeCategory = activeCategory === 4 ? null : 4" 
                                class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:opacity-90 transition">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-industry text-3xl"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="text-2xl font-bold">Industrie & Sécurité</h3>
                                    <p class="text-sm opacity-90">4 formations • HACCP, ISO, Sécurité...</p>
                                </div>
                            </div>
                            <i :class="activeCategory === 4 ? 'fa-chevron-up' : 'fa-chevron-down'" 
                               class="fas text-2xl transition-transform"></i>
                        </button>
                        
                        <div x-show="activeCategory === 4" 
                             x-collapse
                             class="p-8 bg-gray-50">
                            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                                <!-- 16. HACCP & Hygiène Alimentaire -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?w=400&h=250&fit=crop" 
                                             alt="HACCP Hygiène Alimentaire" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-utensils mr-1"></i>Alimentaire
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">HACCP & Hygiène Alimentaire</h4>
                                    <p class="text-sm text-gray-600 mb-4">Normes d'hygiène et sécurité alimentaire</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Principes HACCP</li>
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Hygiène alimentaire</li>
                                        <li><i class="fas fa-check text-green-600 mr-2"></i>Traçabilité</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-green-600 text-white text-center font-bold py-2 rounded-lg hover:bg-green-700 transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 17. ISO & Normes Qualité -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop" 
                                             alt="ISO Normes Qualité" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-certificate mr-1"></i>ISO
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">ISO & Normes Qualité</h4>
                                    <p class="text-sm text-gray-600 mb-4">Certification ISO et management qualité</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-blue-600 mr-2"></i>ISO 9001</li>
                                        <li><i class="fas fa-check text-blue-600 mr-2"></i>ISO 22000</li>
                                        <li><i class="fas fa-check text-blue-600 mr-2"></i>Audit qualité</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-blue-600 text-white text-center font-bold py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 18. Sécurité Industrielle -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=250&fit=crop" 
                                             alt="Sécurité Industrielle" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-hard-hat mr-1"></i>Sécurité
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Sécurité Industrielle</h4>
                                    <p class="text-sm text-gray-600 mb-4">Prévention des risques en milieu industriel</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-orange-600 mr-2"></i>Prévention risques</li>
                                        <li><i class="fas fa-check text-orange-600 mr-2"></i>EPI & sécurité</li>
                                        <li><i class="fas fa-check text-orange-600 mr-2"></i>Réglementation</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-orange-600 text-white text-center font-bold py-2 rounded-lg hover:bg-orange-700 transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                                <!-- 19. Pharmaceutique & BPF -->
                                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                                    <div class="relative overflow-hidden rounded-lg mb-4">
                                        <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=250&fit=crop" 
                                             alt="Pharmaceutique BPF" 
                                             class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" >
                                        <div class="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            <i class="fas fa-pills mr-1"></i>Pharma
                                        </div>
                                    </div>
                                    <h4 class="text-xl font-bold mb-2 text-gray-900">Pharmaceutique & BPF</h4>
                                    <p class="text-sm text-gray-600 mb-4">Bonnes pratiques de fabrication pharmaceutique</p>
                                    <ul class="space-y-2 text-sm text-gray-700 mb-4">
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>BPF / GMP</li>
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>Qualité pharma</li>
                                        <li><i class="fas fa-check text-purple-600 mr-2"></i>Conformité</li>
                                    </ul>
                                    <a href="/#contact" class="block w-full bg-purple-600 text-white text-center font-bold py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                                        <i class="fas fa-rocket mr-2"></i>S'inscrire
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                <!-- CTA Parlons-en -->
                <div class="mt-16 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-2xl p-8 text-center">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        <i class="fas fa-handshake mr-3"></i>
                        Prêt à transformer vos équipes ?
                    </h3>
                    <p class="text-white/90 text-lg mb-6">
                        Échangeons sur vos besoins en formation et construisons ensemble un programme sur-mesure
                    </p>
                    <div class="flex flex-wrap justify-center gap-4">
                        <a href="/#contact" class="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition shadow-xl inline-flex items-center">
                            <i class="fas fa-comments mr-2"></i>
                            Parlons-en
                        </a>
                        <a href="${catalogueUrl}" target="_blank" download class="bg-white text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl inline-flex items-center">
                            <i class="fas fa-download mr-2"></i>
                            Télécharger le catalogue
                        </a>
                    </div>
                </div>
                
            </div>
        </section>


        <!-- LinkedIn Formation & Accompagnement - 3 Niveaux -->
        <section id="linkedin-formation" class="py-20 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#000000]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- Header -->
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37] to-[#0077B5] text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fab fa-linkedin mr-2"></i>Formation LinkedIn Professionnelle
                    </div>
                    <h2 class="text-5xl font-bold text-white mb-4">LinkedIn Formation & Accompagnement</h2>
                    <p class="text-xl text-gray-400 max-w-3xl mx-auto">3 niveaux de formation pour maîtriser LinkedIn et développer votre présence professionnelle</p>
                </div>
                
                <!-- 3 Niveaux de Formation -->
                <div class="grid md:grid-cols-3 gap-8 mb-16">
                    <!-- DÉBUTANT -->
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-2 border-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-seedling text-white text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">DÉBUTANT</h3>
                        <p class="text-center text-[#D4AF37] font-bold mb-6">Les Fondamentaux</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>Créer un profil LinkedIn professionnel complet</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>Optimiser votre headline et résumé</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>Comprendre l'algorithme LinkedIn</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>Développer son réseau stratégiquement</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                                <span>Publier son premier post engageant</span>
                            </li>
                        </ul>
                        
                        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-center">
                            <div class="text-white text-sm mb-1">Durée</div>
                            <div class="text-white text-2xl font-bold">2 jours</div>
                        </div>
                    </div>
                    
                    <!-- INTERMÉDIAIRE -->
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-4 border-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all duration-300 relative">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white px-6 py-1 rounded-full text-sm font-bold">
                            ⭐ POPULAIRE
                        </div>
                        <div class="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-chart-line text-white text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">INTERMÉDIAIRE</h3>
                        <p class="text-center text-[#D4AF37] font-bold mb-6">Croissance & Engagement</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Stratégie de contenu LinkedIn efficace</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Créer des posts viraux (formats, hooks)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Utiliser LinkedIn Creator Mode</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Personal branding & storytelling</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Analyser les statistiques et KPIs</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-[#D4AF37] mr-3 mt-1"></i>
                                <span>Networking avancé & prospection B2B</span>
                            </li>
                        </ul>
                        
                        <div class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-xl p-4 text-center">
                            <div class="text-white text-sm mb-1">Durée</div>
                            <div class="text-white text-2xl font-bold">3 jours</div>
                        </div>
                    </div>
                    
                    <!-- EXPERT -->
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-2 border-black hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        <div class="w-20 h-20 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-crown text-[#D4AF37] text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">EXPERT</h3>
                        <p class="text-center text-black font-bold mb-6">Influence & Monétisation</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>Devenir LinkedIn Top Voice</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>Stratégie d'influence et leadership</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>LinkedIn Ads & Sponsored Content</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>Monétiser votre présence LinkedIn</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>Employee advocacy & team branding</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-black mr-3 mt-1"></i>
                                <span>Coaching personnalisé 1-to-1</span>
                            </li>
                        </ul>
                        
                        <div class="bg-gradient-to-r from-black to-[#1a1a1a] rounded-xl p-4 text-center">
                            <div class="text-white text-sm mb-1">Durée</div>
                            <div class="text-white text-2xl font-bold">5 jours</div>
                        </div>
                    </div>
                </div>
                
                <!-- Accompagnement Personnalisé -->
                <div class="bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] rounded-2xl p-12 text-center">
                    <div class="max-w-4xl mx-auto">
                        <i class="fas fa-hands-helping text-white text-6xl mb-6"></i>
                        <h3 class="text-4xl font-bold text-white mb-4">Accompagnement Personnalisé</h3>
                        <p class="text-white/90 text-xl mb-8">Suivi individuel, audit de profil, stratégie sur-mesure et support continu pendant 3 mois</p>
                        
                        <div class="grid md:grid-cols-3 gap-8 mb-8">
                            <div class="bg-white/90 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-search text-[#D4AF37] text-3xl mb-3"></i>
                                <h4 class="font-bold text-black mb-2">Audit Complet</h4>
                                <p class="text-gray-700 text-sm">Analyse approfondie de votre profil et stratégie</p>
                            </div>
                            <div class="bg-white/90 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-calendar-check text-[#D4AF37] text-3xl mb-3"></i>
                                <h4 class="font-bold text-black mb-2">Sessions 1-to-1</h4>
                                <p class="text-gray-700 text-sm">6 sessions personnalisées avec un expert</p>
                            </div>
                            <div class="bg-white/90 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-headset text-[#D4AF37] text-3xl mb-3"></i>
                                <h4 class="font-bold text-black mb-2">Support 3 mois</h4>
                                <p class="text-gray-700 text-sm">Accompagnement continu et ajustements</p>
                            </div>
                        </div>
                        
                        <div class="flex justify-center">
                            <a href="/#contact" class="bg-black text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-900 transition shadow-2xl">
                                <i class="fas fa-comments mr-2"></i>Parlons-en
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Stats LinkedIn Formation -->
                <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border-2 border-[#D4AF37]">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">300+</div>
                        <div class="text-sm text-white">Profils optimisés</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border-2 border-[#D4AF37]">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">5x</div>
                        <div class="text-sm text-white">Visibilité moyenne</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border-2 border-[#D4AF37]">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">85%</div>
                        <div class="text-sm text-white">Taux de satisfaction</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border-2 border-[#D4AF37]">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">50+</div>
                        <div class="text-sm text-white">Top Voices formés</div>
                    </div>
                </div>
            </div>
        </section>


        <!-- Actualités & News Formation -->
        <section id="actualites" class="py-20 bg-gradient-to-br from-[#D4AF37]/5 via-[#FFFFFF] to-[#F8F9FA]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">CEM ACTUS & NEWS</h2>
                <p class="text-center text-gray-600 text-xl mb-16">Les dernières nouveautés de CEM Formation</p>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <!-- Actu 1 -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37]">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] flex items-center justify-center">
                            <i class="fas fa-robot text-white text-6xl"></i>
                        </div>
                        <div class="p-6">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>Janvier 2026
                            </div>
                            <h3 class="text-xl font-bold mb-3">Nouveau : Formation IA & Innovation</h3>
                            <p class="text-gray-600 mb-4">Lancement de la formation dédiée à l'intelligence artificielle pour transformer vos métiers.</p>
                            <a href="#contact" class="text-[#D4AF37] font-bold hover:underline">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actu 2 -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37]">
                        <div class="h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <i class="fas fa-chart-line text-white text-6xl"></i>
                        </div>
                        <div class="p-6">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>Décembre 2025
                            </div>
                            <h3 class="text-xl font-bold mb-3">+85% de Productivité Clients</h3>
                            <p class="text-gray-600 mb-4">Nos formations IA ont permis à nos clients d'augmenter leur productivité de 85% en moyenne.</p>
                            <a href="#contact" class="text-[#D4AF37] font-bold hover:underline">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actu 3 -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37]">
                        <div class="h-48 bg-gradient-to-br from-#1a1a1a to-#D4AF37 flex items-center justify-center">
                            <i class="fab fa-linkedin text-white text-6xl"></i>
                        </div>
                        <div class="p-6">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>Novembre 2025
                            </div>
                            <h3 class="text-xl font-bold mb-3">N°1 Growth Maroc LinkedIn</h3>
                            <p class="text-gray-600 mb-4">CEM Formation reconnue N°1 Growth au Maroc par Favikon pour ses formations LinkedIn.</p>
                            <a href="#contact" class="text-[#D4AF37] font-bold hover:underline">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actu 4 -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37]">
                        <div class="h-48 bg-gradient-to-br from-#D4AF37 to-#D4AF37 flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-white text-6xl"></i>
                        </div>
                        <div class="p-6">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>Octobre 2025
                            </div>
                            <h3 class="text-xl font-bold mb-3">Plateformes E-Learning Sur Mesure</h3>
                            <p class="text-gray-600 mb-4">Création de plateformes LMS personnalisées pour digitaliser vos formations internes.</p>
                            <a href="#contact" class="text-[#D4AF37] font-bold hover:underline">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- CTA Newsletter -->
                <div class="mt-16 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] rounded-2xl p-12 text-center">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        <i class="fas fa-envelope-open-text mr-3"></i>
                        Restez informé de nos actualités
                    </h3>
                    <p class="text-white/90 text-lg mb-8">Inscrivez-vous à notre newsletter pour ne rien manquer de nos nouvelles formations et innovations</p>
                    <form x-data="{ email: '', loading: false, message: '' }" 
                          @submit.prevent="loading = true; fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(res => res.json()).then(data => { message = data.message || data.error || 'Merci !'; email = ''; }).catch(() => message = 'Erreur, veuillez réessayer').finally(() => loading = false)"
                          class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                        <div class="flex-1 flex flex-col items-start gap-2 w-full">
                            <input type="email" x-model="email" required placeholder="Votre adresse email *" 
                                   class="w-full px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50">
                            <span x-show="message" x-text="message" class="text-white text-sm font-semibold pl-4"></span>
                        </div>
                        <button type="submit" :disabled="loading" class="bg-white text-[#D4AF37] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-xl disabled:opacity-50">
                            <i class="fas fa-paper-plane mr-2"></i><span x-text="loading ? '...' : 'S\'inscrire'"></span>
                        </button>
                    </form>
                </div>
            </div>
        </section>

        <!-- Formulaire Contact Formation -->
        <section id="contact" class="py-20 bg-gradient-to-br from-[#D4AF37] via-[#000000] to-[#1a1a1a] text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">Demandez Votre Devis Formation</h2>
                <p class="text-center text-gray-400 text-xl mb-12">Un besoin en formation ? Discutons-en ensemble</p>
                
                <form x-data="{
                    formData: { name: '', email: '', phone: '', service: '', participants: '', message: '' },
                    loading: false, success: false, error: false, consent: false,
                    async submitForm() {
                        this.loading = true; this.success = false; this.error = false;
                        try {
                            const res = await fetch('/api/contact', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: this.formData.name,
                                    email: this.formData.email,
                                    phone: this.formData.phone,
                                    service: this.formData.service,
                                    message: '[Participants: ' + this.formData.participants + ']\\n' + this.formData.message,
                                    source: 'CEM Formation - Devis'
                                })
                            });
                            if (res.ok) {
                                this.success = true;
                                this.formData = { name: '', email: '', phone: '', service: '', participants: '', message: '' };
                                this.consent = false;
                            } else { this.error = true; }
                        } catch(e) { this.error = true; } finally { this.loading = false; }
                    }
                }" @submit.prevent="submitForm" class="space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37]">
                    <div x-show="success" class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded" role="alert">
                        <strong>Succès!</strong> Votre demande de devis formation a été envoyée. Nous vous recontacterons rapidement.
                    </div>
                    <div x-show="error" class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded" role="alert">
                        <strong>Erreur!</strong> Une erreur est survenue. Veuillez réessayer.
                    </div>
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-user mr-2"></i>Nom complet *
                            </label>
                            <input type="text" x-model="formData.name" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="Votre nom">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-envelope mr-2"></i>Email *
                            </label>
                            <input type="email" x-model="formData.email" required 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="votre@email.com">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-phone mr-2"></i>Téléphone
                            </label>
                            <input type="tel" x-model="formData.phone" 
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="+212 6 88 94 70 98">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-graduation-cap mr-2"></i>Formation souhaitée *
                            </label>
                            <select x-model="formData.service" required 
                                    class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white">
                                <option value="" class="bg-gray-900">Choisir une formation...</option>
                                <optgroup label="Formations Digitales" class="bg-gray-900">
                                    <option class="bg-gray-900">E-Learning Digital</option>
                                    <option class="bg-gray-900">LinkedIn Formation One-to-One</option>
                                    <option class="bg-gray-900">LinkedIn Accompagnement Team</option>
                                    <option class="bg-gray-900">Marketing Digital</option>
                                    <option class="bg-gray-900">Création de Contenu</option>
                                    <option class="bg-gray-900">IA & Innovation</option>
                                </optgroup>
                                <optgroup label="Management & Leadership" class="bg-gray-900">
                                    <option class="bg-gray-900">Leadership & Management</option>
                                    <option class="bg-gray-900">Formation en Communication</option>
                                    <option class="bg-gray-900">Bien-être au Travail</option>
                                    <option class="bg-gray-900">Coaching Dirigeants</option>
                                    <option class="bg-gray-900">Force de Vente & Négociation</option>
                                    <option class="bg-gray-900">Management d'Équipe Virtuelle</option>
                                    <option class="bg-gray-900">Gestion du Changement</option>
                                    <option class="bg-gray-900">Intelligence Émotionnelle</option>
                                    <option class="bg-gray-900">Prise de Décision Stratégique</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-users mr-2"></i>Nombre de participants
                        </label>
                        <select x-model="formData.participants" class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white">
                            <option value="" class="bg-gray-900">Choisir le nombre...</option>
                            <option class="bg-gray-900">1 personne (One-to-One)</option>
                            <option class="bg-gray-900">2-5 personnes</option>
                            <option class="bg-gray-900">6-10 personnes</option>
                            <option class="bg-gray-900">11-20 personnes</option>
                            <option class="bg-gray-900">Plus de 20 personnes</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-comment-dots mr-2"></i>Décrivez vos besoins en formation
                        </label>
                        <textarea x-model="formData.message" rows="6" 
                                  class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                  placeholder="Parlez-nous de vos objectifs de formation, compétences à développer, délais..."></textarea>
                    </div>
                    
                    <div class="flex items-start">
                        <input type="checkbox" x-model="consent" required class="mt-1 mr-3">
                        <label class="text-sm text-gray-400">
                            J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande *
                        </label>
                    </div>
                    
                    <button type="submit" :disabled="loading"
                            class="w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                        <span x-show="!loading"><i class="fas fa-paper-plane mr-2"></i>Demander un Devis</span>
                        <span x-show="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
                    </button>
                    
                    <p class="text-center text-gray-500 text-sm">
                        <i class="fas fa-lock mr-2"></i>Vos données sont sécurisées et ne seront jamais partagées
                    </p>
                </form>
                
                <!-- Contact rapide -->
                <div class="mt-12 grid md:grid-cols-3 gap-8 text-center">
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-phone-alt text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Téléphone</h4>
                        <p class="text-gray-400"><a href="tel:+212688947098" class="hover:text-[#D4AF37] transition">+212 6 88 94 70 98</a></p>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-envelope text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Email</h4>
                        <a href="mailto:contact@cembymazini.ma" class="text-gray-400 hover:text-[#D4AF37] transition block">contact@cembymazini.ma</a>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-map-marker-alt text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Adresse</h4>
                        <p class="text-gray-400">Casablanca, Maroc</p>
                    </div>
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
  `)
})

// Routes SEO
app.get('/sitemap.xml', (c) => {
    return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cembymazini.ma/</loc>
    <lastmod>2025-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cembymazini.ma/marketing</loc>
    <lastmod>2025-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://cembymazini.ma/formation</loc>
    <lastmod>2025-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://cembymazini.ma/innovation</loc>
    <lastmod>2025-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`, 200, { 'Content-Type': 'application/xml' })
})

// Page CEM ACTU - Actualités
app.get('/actualites', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM ACTU - Actualités Marketing, Formation & Innovation | CEM GROUP Maroc</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="CEM ACTU: Actualités marketing, IA & formation au Maroc. Événements, success stories, tendances digitales. Restez connectés à l'innovation !">
        <meta name="keywords" content="actualités cem group, événements marketing maroc, formation professionnelle, innovation ia, linkedin local morocco, success stories, tendances digitales">
        <meta name="author" content="CEM GROUP">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="https://cembymazini.ma/actualites">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="CEM ACTU - Actualités & Événements | CEM GROUP">
        <meta property="og:description" content="Découvrez les dernières actualités, événements et success stories de CEM GROUP au Maroc.">
        <meta property="og:url" content="https://cembymazini.ma/actualites">
        <meta property="og:site_name" content="CEM GROUP">
        <meta property="og:locale" content="fr_MA">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CEM ACTU - Actualités CEM GROUP">
        <meta name="twitter:description" content="Événements, formations, et innovation IA au Maroc">
        
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); }
            .gradient-text {
                background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .card-hover {
                transition: all 0.3s ease;
            }
            .card-hover:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Hero Section -->
        <section class="relative bg-gradient-to-br from-black via-gray-900 to-black min-h-[60vh] flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden">
            <!-- Grille de points dorés en arrière-plan -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background-image: radial-gradient(circle, #D4AF37 1px, transparent 1px); background-size: 50px 50px;"></div>
            </div>
            
            <!-- Blobs décoratifs dorés animés -->
            <div class="absolute top-20 -left-20 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse"></div>
            <div class="absolute top-40 -right-20 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse"></div>
            
            <div class="max-w-7xl mx-auto w-full relative z-10 text-center">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-[#D4AF37]/30 mb-8">
                    <div class="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                    <span class="text-sm font-semibold text-[#D4AF37]">CEM ACTU • Restez Connectés</span>
                </div>
                
                <!-- Titre Principal -->
                <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]">Actualités</span>
                    <br>
                    <span class="text-white">& Événements</span>
                </h1>
                
                <!-- Description -->
                <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                    Découvrez les dernières actualités, événements marquants et success stories de <strong class="text-[#D4AF37]">CEM GROUP</strong>
                </p>
                
                <!-- Stats -->
                <div class="flex flex-wrap justify-center gap-8 mt-12">
                    <div class="text-center">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">+50</div>
                        <div class="text-gray-400 text-sm">Événements Organisés</div>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">+100</div>
                        <div class="text-gray-400 text-sm">Clients Satisfaits</div>
                    </div>
                    <div class="text-center">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">+200</div>
                        <div class="text-gray-400 text-sm">Formations Délivrées</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section Actualités à venir -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| En Direct</p>
                    <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Prochains Événements</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">Ne manquez pas nos événements à venir : formations, conférences et networking</p>
                </div>
                
                <!-- Grille d'événements (À personnaliser avec vos contenus) -->
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Événement 1 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                            <i class="fas fa-calendar-alt text-6xl text-white opacity-50"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <i class="far fa-calendar"></i>
                                <span>Date à venir</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Événement à Annoncer</h3>
                            <p class="text-gray-600 mb-4">Les détails de nos prochains événements seront annoncés très prochainement. Restez connectés !</p>
                            <a href="/#contact" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                Me tenir informé <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Événement 2 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100">
                        <div class="h-48 bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                            <i class="fas fa-users text-6xl text-[#D4AF37] opacity-50"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <i class="far fa-calendar"></i>
                                <span>Date à venir</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Formation à Annoncer</h3>
                            <p class="text-gray-600 mb-4">Découvrez bientôt nos nouvelles formations professionnelles certifiantes.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                Voir les formations <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Événement 3 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-black flex items-center justify-center">
                            <i class="fas fa-lightbulb text-6xl text-white opacity-50"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <i class="far fa-calendar"></i>
                                <span>Date à venir</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">Conférence IA à Annoncer</h3>
                            <p class="text-gray-600 mb-4">Participez à nos conférences sur l'intelligence artificielle et la transformation digitale.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section Articles & Blog -->
        <section class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| Le Blog CEM GROUP</p>
                    <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Articles & Actualités</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">Conseils, tendances et actualités du marketing digital, de la formation et de l'IA</p>
                </div>
                
                <!-- Grid Articles -->
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    
                    <!-- Article 1 - LinkedIn B2B -->
                    <a href="/actualites/linkedin-b2b-leads" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center">
                            <i class="fab fa-linkedin text-8xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full font-semibold">LinkedIn</span>
                                <span>•</span>
                                <span>15 Janvier 2026</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">10 Astuces LinkedIn pour Générer des Leads B2B au Maroc</h3>
                            <p class="text-gray-600 mb-4 text-sm">Découvrez les stratégies éprouvées pour transformer votre profil LinkedIn en machine à générer des opportunités commerciales qualifiées.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        MM
                                    </div>
                                    <span class="text-sm text-gray-600">Meryem Mazini</span>
                                </div>
                                <span class="text-sm text-gray-500">5 min</span>
                            </div>
                        </div>
                    </a>
                    
                    <!-- Article 2 - IA & Marketing -->
                    <a href="/actualites/ia-marketing-2026" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                            <i class="fas fa-robot text-8xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-black/10 text-black px-3 py-1 rounded-full font-semibold">IA & Marketing</span>
                                <span>•</span>
                                <span>10 Janvier 2026</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">Comment l'IA Révolutionne le Marketing Digital en 2026</h3>
                            <p class="text-gray-600 mb-4 text-sm">L'intelligence artificielle transforme radicalement les stratégies marketing. Explorez les outils et méthodes qui changent la donne.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                                        MH
                                    </div>
                                    <span class="text-sm text-gray-600">Moumen Hebbour</span>
                                </div>
                                <span class="text-sm text-gray-500">7 min</span>
                            </div>
                        </div>
                    </a>
                    
                    <!-- Article 3 - Formation Digitale -->
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-8xl text-[#D4AF37] opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full font-semibold">Formation</span>
                                <span>•</span>
                                <span>5 Janvier 2026</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">E-Learning vs Présentiel : Quel Format Choisir pour Votre Entreprise ?</h3>
                            <p class="text-gray-600 mb-4 text-sm">Analyse comparative des formats de formation et conseils pour choisir la solution la plus adaptée à vos objectifs et contraintes.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        CEM
                                    </div>
                                    <span class="text-sm text-gray-600">Équipe Formation</span>
                                </div>
                                <span class="text-sm text-gray-500">6 min</span>
                            </div>
                        </div>
                    </a>
                    
                    <!-- Article 4 - Content Marketing -->
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                            <i class="fas fa-pen-fancy text-8xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full font-semibold">Content Marketing</span>
                                <span>•</span>
                                <span>28 Décembre 2025</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">7 Secrets pour Créer du Contenu Viral sur LinkedIn</h3>
                            <p class="text-gray-600 mb-4 text-sm">Maîtrisez l'art du storytelling et de l'engagement sur LinkedIn avec ces techniques éprouvées par nos experts en personal branding.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        MM
                                    </div>
                                    <span class="text-sm text-gray-600">Meryem Mazini</span>
                                </div>
                                <span class="text-sm text-gray-500">8 min</span>
                            </div>
                        </div>
                    </a>
                    
                    <!-- Article 5 - Video Marketing -->
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
                            <i class="fas fa-video text-8xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-black/10 text-black px-3 py-1 rounded-full font-semibold">Vidéo Marketing</span>
                                <span>•</span>
                                <span>20 Décembre 2025</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">Production Audiovisuelle : Tendances 2026 au Maroc</h3>
                            <p class="text-gray-600 mb-4 text-sm">Découvrez les nouvelles tendances de la vidéo corporate, du motion design et de la production audiovisuelle qui domineront en 2026.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                                        CEM
                                    </div>
                                    <span class="text-sm text-gray-600">CEM Studio</span>
                                </div>
                                <span class="text-sm text-gray-500">10 min</span>
                            </div>
                        </div>
                    </a>
                    
                    <!-- Article 6 - ChatGPT Formation -->
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-100 hover:border-[#D4AF37] transition">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                            <i class="fas fa-brain text-8xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span class="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full font-semibold">ChatGPT & IA</span>
                                <span>•</span>
                                <span>15 Décembre 2025</span>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3 hover:text-[#D4AF37] transition">Formation ChatGPT : Boostez Votre Productivité de 85%</h3>
                            <p class="text-gray-600 mb-4 text-sm">Apprenez à maîtriser ChatGPT et l'IA générative pour automatiser vos tâches et multiplier votre efficacité professionnelle.</p>
                            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        CEM
                                    </div>
                                    <span class="text-sm text-gray-600">CEM Innovation</span>
                                </div>
                                <span class="text-sm text-gray-500">12 min</span>
                            </div>
                        </div>
                    </a>
                    
                </div>
                
                <!-- CTA Voir Plus d'Articles -->
                <div class="text-center mt-12">
                    <a href="/#contact" class="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all">
                        <i class="fas fa-envelope"></i>
                        S'abonner à la Newsletter
                    </a>
                </div>
            </div>
        </section>

        <!-- Section Actualités Récentes -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <p class="text-[#D4AF37] text-lg mb-2 uppercase tracking-wider">| Nos Success Stories</p>
                    <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Actualités Récentes</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">Retour sur nos réalisations marquantes et success stories clients</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Actualité 1 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
                        <div class="p-8">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center">
                                    <i class="fas fa-trophy text-white text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">Success Story</div>
                                    <div class="text-xs text-gray-400">2024</div>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">+100 Clients Nous Font Confiance</h3>
                            <p class="text-gray-600 mb-4">Depuis 2018, CEM GROUP accompagne plus de 100 entreprises dans leur transformation digitale et le développement des compétences de leurs équipes.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                Voir nos clients <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actualité 2 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
                        <div class="p-8">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-graduation-cap text-[#D4AF37] text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">Formation</div>
                                    <div class="text-xs text-gray-400">2024</div>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">+15 Formations Certifiantes</h3>
                            <p class="text-gray-600 mb-4">CEM FORMATION propose un catalogue complet de formations professionnelles certifiantes en digital, marketing et intelligence artificielle.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                Découvrir les formations <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actualité 3 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
                        <div class="p-8">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-black rounded-xl flex items-center justify-center">
                                    <i class="fas fa-rocket text-white text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">Innovation</div>
                                    <div class="text-xs text-gray-400">2024</div>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">Lancement de CEM Innovation</h3>
                            <p class="text-gray-600 mb-4">CEM INNOVATION accompagne les entreprises dans leur acculturation à l'intelligence artificielle et leur transformation digitale.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Actualité 4 - Placeholder -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
                        <div class="p-8">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-black to-[#D4AF37] rounded-xl flex items-center justify-center">
                                    <i class="fas fa-bullhorn text-white text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">Marketing</div>
                                    <div class="text-xs text-gray-400">2024</div>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">+16 Services Marketing Digital</h3>
                            <p class="text-gray-600 mb-4">CEM MARKETING propose une gamme complète de services en stratégie digitale, production audiovisuelle et gestion des réseaux sociaux.</p>
                            <a href="/actualites" class="inline-flex items-center text-[#D4AF37] font-semibold hover:text-[#B8941F] transition">
                                Découvrir nos services <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section CTA -->
        <section class="py-20 bg-gradient-to-br from-black via-gray-900 to-black">
            <div class="max-w-4xl mx-auto text-center px-4">
                <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                    Restez Informé de Nos Actualités
                </h2>
                <p class="text-xl text-gray-300 mb-8">
                    Suivez-nous sur LinkedIn pour ne rien manquer de nos événements, formations et actualités
                </p>
                <div class="flex flex-wrap justify-center gap-4">
                    <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center gap-2 bg-[#0077B5] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#005885] transition shadow-lg">
                        <i class="fab fa-linkedin-in"></i>
                        Suivre sur LinkedIn
                    </a>
                    <a href="/#contact" 
                       class="inline-flex items-center gap-2 bg-[#D4AF37] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#B8941F] transition shadow-lg">
                        <i class="fas fa-envelope"></i>
                        Nous Contacter
                    </a>
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
  `)
})

// ==================== ARTICLES BLOG ====================

// Article 1 : LinkedIn B2B Leads
app.get('/actualites/linkedin-b2b-leads', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>10 Astuces LinkedIn pour Générer des Leads B2B au Maroc | CEM GROUP Blog</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="Découvrez les stratégies éprouvées pour transformer votre profil LinkedIn en machine à générer des opportunités commerciales qualifiées au Maroc.">
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-text { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .article-content h2 { font-size: 2rem; font-weight: 700; margin-top: 3rem; margin-bottom: 1.5rem; color: #1F2937; }
            .article-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #374151; }
            .article-content p { font-size: 1.125rem; line-height: 1.8; margin-bottom: 1.5rem; color: #4B5563; }
            .article-content ul, .article-content ol { margin-bottom: 1.5rem; padding-left: 2rem; }
            .article-content li { font-size: 1.125rem; line-height: 1.8; margin-bottom: 0.75rem; color: #4B5563; }
            .article-content strong { color: #D4AF37; font-weight: 700; }
            .article-content blockquote { border-left: 4px solid #D4AF37; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #6B7280; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Article Header -->
        <article class="pt-32 pb-20">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- Breadcrumb -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

                <!-- Category Badge -->
                <div class="flex items-center gap-2 mb-6">
                    <span class="bg-[#0077B5]/10 text-[#0077B5] px-4 py-2 rounded-full font-semibold text-sm">
                        <i class="fab fa-linkedin mr-2"></i>LinkedIn Marketing
                    </span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-500">15 Janvier 2026</span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-500">5 min de lecture</span>
                </div>

                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    10 Astuces LinkedIn pour Générer des Leads B2B au Maroc
                </h1>

                <!-- Author -->
                <div class="flex items-center gap-4 pb-8 border-b border-gray-200 mb-8">
                    <div class="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center text-white text-xl font-bold">
                        MM
                    </div>
                    <div>
                        <div class="font-bold text-gray-900">Meryem Mazini</div>
                        <div class="text-sm text-gray-600">CEO & Fondatrice CEM GROUP • Experte LinkedIn</div>
                    </div>
                </div>

                <!-- Cover Image -->
                <div class="mb-12 rounded-2xl overflow-hidden shadow-2xl">
                    <div class="h-96 bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center">
                        <i class="fab fa-linkedin text-9xl text-white opacity-20"></i>
                    </div>
                </div>

                <!-- Article Content -->
                <div class="article-content prose prose-lg max-w-none">
                    <p class="text-xl text-gray-700 font-semibold mb-8">
                        LinkedIn est devenu l'outil incontournable pour la génération de leads B2B au Maroc. Avec plus de 3 millions de professionnels marocains actifs sur la plateforme, c'est une mine d'or pour votre développement commercial. Voici 10 stratégies éprouvées pour transformer votre profil en machine à générer des opportunités qualifiées.
                    </p>

                    <h2>1. Optimisez Votre Profil pour les Recherches</h2>
                    <p>
                        Votre profil LinkedIn est votre vitrine digitale. <strong>90% des décideurs</strong> consultent les profils LinkedIn avant de prendre contact. Assurez-vous que le vôtre soit optimisé pour les mots-clés de votre secteur.
                    </p>
                    <ul>
                        <li><strong>Titre accrocheur</strong> : Au lieu de "Directeur Commercial", optez pour "Expert en Solutions B2B | +100 Entreprises Accompagnées | Spécialiste ROI"</li>
                        <li><strong>Photo professionnelle</strong> : Les profils avec photo reçoivent 14x plus de vues</li>
                        <li><strong>Bannière personnalisée</strong> : Affichez votre proposition de valeur visuellement</li>
                        <li><strong>Section "À propos"</strong> : Racontez votre histoire en 3 paragraphes maximum, avec des résultats chiffrés</li>
                    </ul>

                    <blockquote>
                        "Un profil optimisé peut générer jusqu'à 5x plus de demandes de connexion qualifiées par mois." - Étude LinkedIn 2025
                    </blockquote>

                    <h2>2. Publiez du Contenu de Valeur Régulièrement</h2>
                    <p>
                        La clé pour attirer des leads ? <strong>Devenir une référence dans votre domaine</strong>. Publiez 3 à 5 fois par semaine du contenu qui apporte une réelle valeur ajoutée à votre audience.
                    </p>
                    <ul>
                        <li><strong>Partages d'expertise</strong> : Conseils pratiques, retours d'expérience, études de cas</li>
                        <li><strong>Formats variés</strong> : Carrousels, vidéos courtes, articles longs, sondages</li>
                        <li><strong>Storytelling</strong> : Racontez des histoires authentiques de vos réussites clients</li>
                        <li><strong>Call-to-Action subtil</strong> : Incitez à l'échange en commentaires</li>
                    </ul>

                    <h2>3. Utilisez la Recherche Avancée pour Cibler</h2>
                    <p>
                        LinkedIn Sales Navigator est votre meilleur allié pour identifier vos prospects idéaux. Définissez des filtres précis pour trouver vos cibles :
                    </p>
                    <ul>
                        <li>Fonction (CEO, Directeur Marketing, DRH...)</li>
                        <li>Secteur d'activité</li>
                        <li>Taille d'entreprise</li>
                        <li>Géographie (Casablanca, Rabat, Marrakech...)</li>
                        <li>Niveau de séniorité</li>
                    </ul>

                    <h2>4. Personnalisez Vos Demandes de Connexion</h2>
                    <p>
                        <strong>Ne JAMAIS envoyer de demande de connexion sans message personnalisé.</strong> Les demandes personnalisées ont un taux d'acceptation 3x supérieur.
                    </p>
                    <p>
                        <strong>Template efficace :</strong><br>
                        "Bonjour [Prénom],<br>
                        J'ai remarqué que vous êtes [poste] chez [entreprise]. Je suis spécialisé dans [votre expertise] et j'aide des entreprises comme la vôtre à [bénéfice concret].<br>
                        J'aimerais échanger avec vous sur [sujet pertinent]. Seriez-vous ouvert à une connexion ?<br>
                        Bien cordialement,<br>
                        [Votre nom]"
                    </p>

                    <h2>5. Engagez-vous sur les Publications de Vos Prospects</h2>
                    <p>
                        Avant de contacter un prospect, <strong>créez d'abord une relation</strong> en commentant intelligemment ses publications pendant 2-3 semaines.
                    </p>
                    <ul>
                        <li>Commentaires de qualité (pas juste "Super post !")</li>
                        <li>Apportez de la valeur dans vos réponses</li>
                        <li>Partagez son contenu avec votre analyse</li>
                        <li>Mentionnez-le dans vos posts (quand pertinent)</li>
                    </ul>

                    <h2>6. Créez des Campagnes de Messaging Intelligent</h2>
                    <p>
                        Une fois connecté, ne vendez pas immédiatement. Suivez cette séquence éprouvée :
                    </p>
                    <ol>
                        <li><strong>Message 1</strong> : Remerciement pour la connexion + question ouverte sur son activité</li>
                        <li><strong>Message 2 (J+3)</strong> : Partage d'une ressource gratuite pertinente (article, guide)</li>
                        <li><strong>Message 3 (J+7)</strong> : Proposition de valeur spécifique à son contexte</li>
                        <li><strong>Message 4 (J+10)</strong> : Invitation à un appel découverte de 15 minutes</li>
                    </ol>

                    <h2>7. Organisez des Événements LinkedIn</h2>
                    <p>
                        Les événements LinkedIn Live ou Événements sont parfaits pour générer des leads qualifiés :
                    </p>
                    <ul>
                        <li>Webinaires gratuits sur des sujets d'expertise</li>
                        <li>Tables rondes avec des invités experts</li>
                        <li>Sessions Q&A en direct</li>
                        <li>Ateliers pratiques</li>
                    </ul>

                    <h2>8. Exploitez les Recommandations et Témoignages</h2>
                    <p>
                        <strong>85% des acheteurs B2B</strong> vérifient les recommandations avant de prendre contact. Demandez activement des recommandations à vos clients satisfaits.
                    </p>

                    <h2>9. Utilisez les Hashtags Stratégiquement</h2>
                    <p>
                        Les hashtags augmentent la portée de vos publications jusqu'à 30%. Utilisez :
                    </p>
                    <ul>
                        <li>3-5 hashtags par publication</li>
                        <li>Mix de hashtags populaires et de niche</li>
                        <li>Créez votre propre hashtag de marque</li>
                        <li>Suivez les hashtags de votre industrie</li>
                    </ul>

                    <h2>10. Analysez et Optimisez en Continu</h2>
                    <p>
                        Mesurez vos performances avec LinkedIn Analytics :
                    </p>
                    <ul>
                        <li>Taux d'engagement de vos posts</li>
                        <li>Taux d'acceptation des demandes de connexion</li>
                        <li>Taux de réponse aux messages</li>
                        <li>Conversion leads → clients</li>
                    </ul>

                    <h2>Conclusion : Passez à l'Action</h2>
                    <p>
                        LinkedIn est une opportunité en or pour développer votre business B2B au Maroc, mais cela demande de la <strong>stratégie, de la constance et de l'authenticité</strong>. Commencez par optimiser votre profil cette semaine, puis mettez en place une routine de publication régulière.
                    </p>
                    <p>
                        Chez <strong>CEM GROUP</strong>, nous avons aidé plus de 50 entreprises marocaines à générer des millions de dirhams de chiffre d'affaires via LinkedIn. Si vous souhaitez accélérer vos résultats, contactez-nous pour un audit de votre stratégie LinkedIn.
                    </p>
                </div>

                <!-- CTA -->
                <div class="mt-16 p-8 bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 rounded-2xl border-2 border-[#D4AF37]">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Besoin d'aide pour votre stratégie LinkedIn ?</h3>
                    <p class="text-gray-700 mb-6">Nos experts vous accompagnent dans la mise en place d'une stratégie LinkedIn performante et rentable.</p>
                    <a href="/#contact" class="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition">
                        <i class="fas fa-comments"></i>
                        Demander un audit
                    </a>
                </div>

                <!-- Share -->
                <div class="mt-12 pt-8 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="text-gray-600 font-semibold">Partager cet article :</div>
                        <div class="flex gap-4">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" class="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" class="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-facebook"></i>
                            </a>
                            <a href="https://twitter.com" target="_blank" class="w-12 h-12 bg-[#1DA1F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-twitter"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </article>

        <!-- Articles Similaires -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-12">Articles Similaires</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                            <i class="fas fa-robot text-6xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">Comment l'IA Révolutionne le Marketing</h3>
                            <p class="text-gray-600 text-sm">Découvrez les outils IA qui transforment les stratégies marketing en 2026.</p>
                        </div>
                    </a>
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
                            <i class="fas fa-pen-fancy text-6xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">7 Secrets pour du Contenu Viral</h3>
                            <p class="text-gray-600 text-sm">Maîtrisez l'art du storytelling et de l'engagement sur LinkedIn.</p>
                        </div>
                    </a>
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-6xl text-[#D4AF37] opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">E-Learning vs Présentiel</h3>
                            <p class="text-gray-600 text-sm">Analyse comparative pour choisir le bon format de formation.</p>
                        </div>
                    </a>
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
  `)
})

// Article 2 : IA Marketing
app.get('/actualites/ia-marketing-2026', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comment l'IA Révolutionne le Marketing Digital en 2026 | CEM GROUP Blog</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="L'intelligence artificielle transforme radicalement les stratégies marketing. Explorez les outils et méthodes qui changent la donne en 2026.">
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet"></noscript>
        <style>
            * { font-family: 'Poppins', sans-serif; }
            .gradient-text { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .article-content h2 { font-size: 2rem; font-weight: 700; margin-top: 3rem; margin-bottom: 1.5rem; color: #1F2937; }
            .article-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #374151; }
            .article-content p { font-size: 1.125rem; line-height: 1.8; margin-bottom: 1.5rem; color: #4B5563; }
            .article-content ul, .article-content ol { margin-bottom: 1.5rem; padding-left: 2rem; }
            .article-content li { font-size: 1.125rem; line-height: 1.8; margin-bottom: 0.75rem; color: #4B5563; }
            .article-content strong { color: #D4AF37; font-weight: 700; }
            .article-content blockquote { border-left: 4px solid #D4AF37; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #6B7280; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

        <!-- Article Header -->
        <article class="pt-32 pb-20">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- Breadcrumb -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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

                <!-- Category Badge -->
                <div class="flex items-center gap-2 mb-6">
                    <span class="bg-black/10 text-black px-4 py-2 rounded-full font-semibold text-sm">
                        <i class="fas fa-robot mr-2"></i>IA & Marketing
                    </span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-500">10 Janvier 2026</span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-500">7 min de lecture</span>
                </div>

                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    Comment l'IA Révolutionne le Marketing Digital en 2026
                </h1>

                <!-- Author -->
                <div class="flex items-center gap-4 pb-8 border-b border-gray-200 mb-8">
                    <div class="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center text-[#D4AF37] text-xl font-bold">
                        MH
                    </div>
                    <div>
                        <div class="font-bold text-gray-900">Moumen Hebbour</div>
                        <div class="text-sm text-gray-600">Expert Marketing Digital & IA • CEM GROUP</div>
                    </div>
                </div>

                <!-- Cover Image -->
                <div class="mb-12 rounded-2xl overflow-hidden shadow-2xl">
                    <div class="h-96 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
                        <i class="fas fa-robot text-9xl text-white opacity-20"></i>
                    </div>
                </div>

                <!-- Article Content -->
                <div class="article-content prose prose-lg max-w-none">
                    <p class="text-xl text-gray-700 font-semibold mb-8">
                        L'intelligence artificielle n'est plus une promesse futuriste, c'est une réalité qui transforme radicalement le marketing digital en 2026. Des campagnes publicitaires ultra-personnalisées à la création de contenu automatisée, l'IA redéfinit les règles du jeu. Découvrez comment cette révolution technologique impacte votre stratégie marketing.
                    </p>

                    <h2>L'IA Générative : Le Nouvel Assistant des Marketeurs</h2>
                    <p>
                        <strong>ChatGPT, MidJourney, Gemini</strong> : ces noms sont devenus incontournables dans l'arsenal des professionnels du marketing. L'IA générative permet de :
                    </p>
                    <ul>
                        <li><strong>Créer du contenu à grande échelle</strong> : Articles de blog, posts réseaux sociaux, emails marketing en quelques secondes</li>
                        <li><strong>Générer des visuels professionnels</strong> : Images, vidéos, designs sans compétences techniques poussées</li>
                        <li><strong>Personnaliser les messages</strong> : Adaptation automatique du ton et du style selon l'audience</li>
                        <li><strong>Traduire et localiser</strong> : Contenu multilingue instantanément adapté aux cultures locales</li>
                    </ul>

                    <blockquote>
                        "73% des marketeurs qui utilisent l'IA générative affirment avoir augmenté leur productivité de plus de 50%." - Étude McKinsey 2026
                    </blockquote>

                    <h2>Personnalisation Hyper-Ciblée Grâce à l'IA</h2>
                    <p>
                        Fini le marketing de masse générique. L'IA permet aujourd'hui de <strong>personnaliser chaque interaction client</strong> à l'échelle :
                    </p>
                    <ul>
                        <li><strong>Recommandations produits intelligentes</strong> : Analyse comportementale en temps réel pour suggérer les offres les plus pertinentes</li>
                        <li><strong>Contenu dynamique</strong> : Sites web et emails qui s'adaptent automatiquement à chaque visiteur</li>
                        <li><strong>Parcours client optimisés</strong> : Prédiction des intentions d'achat et ajustement du tunnel de conversion</li>
                        <li><strong>Chatbots ultra-performants</strong> : Conversations naturelles disponibles 24/7</li>
                    </ul>

                    <h2>Automatisation Intelligente des Campagnes</h2>
                    <p>
                        Les plateformes publicitaires comme <strong>Meta Ads et Google Ads</strong> intègrent désormais l'IA au cœur de leurs algorithmes :
                    </p>
                    <ol>
                        <li><strong>Optimisation automatique des enchères</strong> : L'IA ajuste vos budgets en temps réel pour maximiser le ROI</li>
                        <li><strong>Création de variants publicitaires</strong> : Génération automatique de dizaines de versions de vos annonces</li>
                        <li><strong>Ciblage prédictif</strong> : Identification des audiences les plus susceptibles de convertir</li>
                        <li><strong>A/B Testing intelligent</strong> : Apprentissage continu et ajustement automatique des stratégies</li>
                    </ol>

                    <h2>Analyse Prédictive et Data Intelligence</h2>
                    <p>
                        L'IA transforme les <strong>montagnes de données</strong> en insights actionnables :
                    </p>
                    <ul>
                        <li><strong>Prédiction du churn</strong> : Identification des clients à risque avant qu'ils ne partent</li>
                        <li><strong>Scoring de leads</strong> : Priorisation automatique des prospects les plus qualifiés</li>
                        <li><strong>Analyse de sentiment</strong> : Compréhension fine de la perception de votre marque sur les réseaux sociaux</li>
                        <li><strong>Prévisions de ventes</strong> : Anticipation des tendances et ajustement des stratégies en conséquence</li>
                    </ul>

                    <h2>Les Outils IA Incontournables en 2026</h2>
                    <p>
                        Voici notre sélection des <strong>outils IA essentiels</strong> pour tout marketeur en 2026 :
                    </p>
                    <h3>Création de Contenu</h3>
                    <ul>
                        <li><strong>ChatGPT/Claude</strong> : Rédaction de textes, brainstorming, stratégie contenu</li>
                        <li><strong>MidJourney/DALL-E</strong> : Génération d'images et de visuels marketing</li>
                        <li><strong>Jasper AI</strong> : Spécialisé dans le copywriting marketing</li>
                    </ul>

                    <h3>Analyse et Optimisation</h3>
                    <ul>
                        <li><strong>Google Analytics 4</strong> : Analyse prédictive intégrée</li>
                        <li><strong>HubSpot AI</strong> : Automatisation marketing intelligente</li>
                        <li><strong>Surfer SEO</strong> : Optimisation SEO assistée par IA</li>
                    </ul>

                    <h3>Personnalisation Client</h3>
                    <ul>
                        <li><strong>Dynamic Yield</strong> : Personnalisation web en temps réel</li>
                        <li><strong>Intercom</strong> : Chatbot IA conversationnel</li>
                        <li><strong>Drift</strong> : Marketing conversationnel B2B</li>
                    </ul>

                    <h2>Les Défis et Limites de l'IA en Marketing</h2>
                    <p>
                        Malgré ses avantages, l'IA présente aussi des <strong>défis qu'il faut anticiper</strong> :
                    </p>
                    <ul>
                        <li><strong>Perte de l'authenticité</strong> : Le contenu généré par IA peut manquer d'âme et de personnalité</li>
                        <li><strong>Dépendance technologique</strong> : Risque de perdre certaines compétences humaines essentielles</li>
                        <li><strong>Questions éthiques</strong> : Protection des données, biais algorithmiques, transparence</li>
                        <li><strong>Coût d'adoption</strong> : Investissements initiaux et formation des équipes</li>
                    </ul>

                    <blockquote>
                        "L'IA ne remplacera pas les marketeurs, mais les marketeurs qui utilisent l'IA remplaceront ceux qui ne l'utilisent pas." - Tendance 2026
                    </blockquote>

                    <h2>Comment Démarrer avec l'IA dans Votre Marketing</h2>
                    <p>
                        Voici notre <strong>roadmap en 5 étapes</strong> pour intégrer l'IA dans votre stratégie marketing :
                    </p>
                    <ol>
                        <li><strong>Audit de vos processus actuels</strong> : Identifiez les tâches répétitives qui peuvent être automatisées</li>
                        <li><strong>Formation de vos équipes</strong> : Investissez dans l'acculturation IA de vos collaborateurs</li>
                        <li><strong>Démarrage progressif</strong> : Testez un outil à la fois, mesurez les résultats</li>
                        <li><strong>Intégration avec vos outils existants</strong> : Assurez-vous de la compatibilité avec votre stack marketing</li>
                        <li><strong>Optimisation continue</strong> : Analysez, apprenez, ajustez vos usages de l'IA</li>
                    </ol>

                    <h2>Conclusion : L'Avenir est Hybride</h2>
                    <p>
                        En 2026, le marketing gagnant ne sera ni 100% humain ni 100% IA, mais une <strong>combinaison intelligente des deux</strong>. L'IA excelle dans l'analyse, l'automatisation et la personnalisation à grande échelle. Les humains apportent la créativité, l'empathie, la stratégie et la vision.
                    </p>
                    <p>
                        Chez <strong>CEM GROUP</strong>, nous accompagnons les entreprises marocaines dans leur transformation IA marketing. De l'audit de vos processus à la mise en place de solutions IA sur-mesure, notre équipe d'experts vous guide vers le succès.
                    </p>
                </div>

                <!-- CTA -->
                <div class="mt-16 p-8 bg-gradient-to-br from-[#D4AF37]/10 to-[#FFD700]/10 rounded-2xl border-2 border-[#D4AF37]">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Prêt à Intégrer l'IA dans Votre Marketing ?</h3>
                    <p class="text-gray-700 mb-6">Découvrez nos formations et accompagnements IA pour booster vos performances marketing.</p>
                    <a href="/innovation" class="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition">
                        <i class="fas fa-robot"></i>
                        Découvrir CEM Innovation
                    </a>
                </div>

                <!-- Share -->
                <div class="mt-12 pt-8 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="text-gray-600 font-semibold">Partager cet article :</div>
                        <div class="flex gap-4">
                            <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" class="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" class="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-facebook"></i>
                            </a>
                            <a href="https://twitter.com" target="_blank" class="w-12 h-12 bg-[#1DA1F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                                <i class="fab fa-twitter"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </article>

        <!-- Articles Similaires -->
        <section class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-12">Articles Similaires</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <a href="/actualites/linkedin-b2b-leads" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center">
                            <i class="fab fa-linkedin text-6xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">10 Astuces LinkedIn B2B</h3>
                            <p class="text-gray-600 text-sm">Transformez votre profil en machine à générer des leads qualifiés.</p>
                        </div>
                    </a>
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-[#10A37F] to-[#1A7F64] flex items-center justify-center">
                            <i class="fas fa-brain text-6xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">Formation ChatGPT +85% Productivité</h3>
                            <p class="text-gray-600 text-sm">Maîtrisez ChatGPT et l'IA générative pour automatiser vos tâches.</p>
                        </div>
                    </a>
                    <a href="/actualites" class="block bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
                        <div class="h-48 bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                            <i class="fas fa-video text-6xl text-white opacity-30"></i>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">Production Audiovisuelle 2026</h3>
                            <p class="text-gray-600 text-sm">Les tendances vidéo corporate et motion design qui dominent.</p>
                        </div>
                    </a>
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
  `)
})

// ==================== PAGE CATALOGUE ====================
app.get('/catalogue', async (c) => {
    const env = c.env;
    const popups = await popupService.getAll(env);
    const activePopup = popups.find(p => p.isActive);
    const popupHtml = generatePopupHtml(activePopup);

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Télécharger le Catalogue CEM GROUP | Formations, Marketing & Innovation Maroc</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="Téléchargez le catalogue CEM GROUP: 19 formations professionnelles + services marketing digital & IA. Tarifs, modalités & certifications. Complet !"/>
        <meta name="keywords" content="catalogue formations, catalogue CEM, télécharger catalogue, formations digitales Maroc, marketing digital Casablanca, CEM GROUP" />
        <meta name="author" content="CEM GROUP - Catalogue" />
        <link rel="canonical" href="https://cembymazini.ma/catalogue" />
        
        <!-- Open Graph -->
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Catalogue CEM GROUP - Formations & Services" />
        <meta property="og:description" content="Téléchargez notre catalogue complet : +15 formations, production audiovisuelle, IA & marketing digital." />
        <meta property="og:url" content="https://cembymazini.ma/catalogue" />
        <meta property="og:site_name" content="CEM GROUP" />
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Catalogue CEM GROUP - Formations & Services" />
        <meta name="twitter:description" content="Téléchargez notre catalogue complet : +15 formations, production audiovisuelle, IA & marketing digital." />
        
        <!-- Styles -->
        <link href="/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">

        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"></noscript>
        
        <style>
            body { font-family: 'Poppins', sans-serif; }
            .gradient-text { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .blob { filter: blur(40px); opacity: 0.3; animation: blob 7s infinite; }
            @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        </style>
    </head>
    <body class="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        
        <!-- Navigation -->
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
                        <a href="/" class="flex items-center hover:opacity-80 transition no-underline"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto" loading="lazy" ></a>
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
        
        <!-- Hero Section -->
        <section class="pt-32 pb-20 px-6 relative overflow-hidden">
            <!-- Blobs animés -->
            <div class="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blob"></div>
            <div class="absolute bottom-10 right-10 w-96 h-96 bg-[#FFD700] rounded-full blob" style="animation-delay: 2s"></div>
            
            <div class="max-w-4xl mx-auto text-center relative z-10">
                <div class="inline-block bg-[#D4AF37]/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
                    <span class="text-[#D4AF37] font-semibold"><i class="fas fa-download mr-2"></i>Téléchargement</span>
                </div>
                
                <h1 class="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    Téléchargez notre <span class="gradient-text">Catalogue</span>
                </h1>
                
                <p class="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Découvrez l'ensemble de nos formations professionnelles, services marketing et solutions IA. Plus de 15 formations certifiées et 3 agences spécialisées.
                </p>
                
                <!-- Stats rapides -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#D4AF37]/30">
                        <div class="text-4xl font-bold gradient-text mb-2">+15</div>
                        <div class="text-gray-400">Formations disponibles</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#D4AF37]/30">
                        <div class="text-4xl font-bold gradient-text mb-2">3</div>
                        <div class="text-gray-400">Agences spécialisées</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-[#D4AF37]/30">
                        <div class="text-4xl font-bold gradient-text mb-2">100+</div>
                        <div class="text-gray-400">Clients satisfaits</div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Formulaire de demande de catalogue -->
        <section id="formulaire-catalogue" class="py-20 px-6 bg-gradient-to-br from-black to-gray-900 relative">
            <div class="max-w-3xl mx-auto">
                <div class="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#D4AF37]/30 shadow-2xl">
                    <div class="text-center mb-10">
                        <i class="fas fa-book text-5xl text-[#D4AF37] mb-4"></i>
                        <h2 class="text-4xl font-bold mb-4">Demandez votre catalogue</h2>
                        <p class="text-gray-400">Remplissez le formulaire ci-dessous et recevez notre catalogue complet par email sous 24h</p>
                    </div>
                    
                    <form class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold mb-2 text-gray-300">Prénom *</label>
                                <input type="text" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="Votre prénom">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2 text-gray-300">Nom *</label>
                                <input type="text" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="Votre nom">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Email professionnel *</label>
                            <input type="email" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="votre.email@entreprise.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Téléphone</label>
                            <input type="tel" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="+212 6 88 94 70 98">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Entreprise *</label>
                            <input type="text" required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="Nom de votre entreprise">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Poste / Fonction</label>
                            <input type="text" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="Votre fonction">
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Domaine d'intérêt *</label>
                            <select required class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white focus:outline-none focus:border-[#D4AF37] transition">
                                <option value="" class="text-gray-900">Choisir un domaine...</option>
                                <option class="text-gray-900">Marketing Digital</option>
                                <option class="text-gray-900">Production Audiovisuelle</option>
                                <option class="text-gray-900">Formations & Coaching</option>
                                <option class="text-gray-900">Transformation IA</option>
                                <option class="text-gray-900">Autre</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold mb-2 text-gray-300">Message (optionnel)</label>
                            <textarea rows="4" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition" placeholder="Parlez-nous de vos besoins..."></textarea>
                        </div>
                        
                        <div class="flex items-start gap-3">
                            <input type="checkbox" required class="mt-1 w-5 h-5 rounded border-[#D4AF37]/30 bg-white/10 text-[#D4AF37] focus:ring-[#D4AF37]">
                            <label class="text-sm text-gray-400">
                                J'accepte de recevoir le catalogue et les communications de CEM GROUP. Je peux me désinscrire à tout moment.
                            </label>
                        </div>
                        
                        <button type="submit" class="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center justify-center group">
                            <i class="fas fa-download mr-3 group-hover:scale-110 transition"></i>
                            Télécharger le catalogue
                            <i class="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition"></i>
                        </button>
                        
                        <p class="text-center text-sm text-gray-500 mt-4">
                            <i class="fas fa-lock mr-2"></i>Vos données sont protégées et ne seront jamais partagées
                        </p>
                    </form>
                </div>
            </div>
        </section>
        
        <!-- Section Avantages du catalogue -->
        <section class="py-20 px-6 bg-black">
            <div class="max-w-6xl mx-auto">
                <h2 class="text-4xl font-bold text-center mb-12">
                    Ce que vous trouverez dans notre <span class="gradient-text">catalogue</span>
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Formations -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-graduation-cap text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">+15 Formations</h3>
                        <p class="text-gray-400">
                            Marketing Digital, Réseaux Sociaux, E-commerce, Création de contenu, IA & ChatGPT, et bien plus.
                        </p>
                    </div>
                    
                    <!-- Marketing -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-video text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Production Audiovisuelle</h3>
                        <p class="text-gray-400">
                            Films corporate, motion design 2D/3D, photos studio, contenus pour réseaux sociaux.
                        </p>
                    </div>
                    
                    <!-- Innovation -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-robot text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Solutions IA</h3>
                        <p class="text-gray-400">
                            Acculturation IA, conseil en transformation digitale, automatisation des processus.
                        </p>
                    </div>
                    
                    <!-- Leads -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-chart-line text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Génération de Leads</h3>
                        <p class="text-gray-400">
                            Stratégies d'acquisition digitale, social selling LinkedIn, campagnes publicitaires ROI-oriented.
                        </p>
                    </div>
                    
                    <!-- Personal Branding -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-user-tie text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Personal Branding</h3>
                        <p class="text-gray-400">
                            Stratégies d'influence LinkedIn, ghostwriting, coaching individuel pour dirigeants.
                        </p>
                    </div>
                    
                    <!-- Tarifs -->
                    <div class="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-8 border border-[#D4AF37]/30 hover:border-[#D4AF37] transition">
                        <div class="bg-[#D4AF37]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-tags text-3xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Grilles Tarifaires</h3>
                        <p class="text-gray-400">
                            Tarifs transparents pour tous nos services, forfaits sur-mesure, modalités de paiement.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- CTA Final -->
        <section class="py-20 px-6 bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0" style="background: repeating-linear-gradient(45deg, #D4AF37, #D4AF37 2px, transparent 2px, transparent 10px);"></div>
            </div>
            
            <div class="max-w-4xl mx-auto text-center relative z-10">
                <h2 class="text-4xl md:text-5xl font-bold mb-6">
                    Besoin d'un accompagnement <span class="gradient-text">personnalisé</span> ?
                </h2>
                <p class="text-xl text-gray-300 mb-8">
                    Notre équipe est disponible pour échanger sur vos besoins et vous conseiller.
                </p>
                <div class="flex flex-wrap gap-4 justify-center">
                    <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center no-underline">
                        <i class="fas fa-comments mr-3"></i>
                        Parler à un conseiller
                    </a>
                    <a href="https://www.linkedin.com/company/consulting-events-by-mazini/posts/?feedView=all" target="_blank" rel="noopener noreferrer" class="bg-black border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#D4AF37] hover:text-black transition-all inline-flex items-center no-underline">
                        <i class="fab fa-linkedin mr-3"></i>
                        Suivre sur LinkedIn
                    </a>
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
        
        <!-- Mascotte Interactive CEM GROUP -->
        <div x-data="{ open: false, showMessage: true }" 
             x-init="setTimeout(() => { showMessage = true }, 2000)"
             class="fixed bottom-6 right-6 z-50">
            
            <!-- Bulle de dialogue animée -->
            <div x-show="showMessage" 
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0 transform scale-95 translate-y-2"
                 x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                 x-transition:leave="transition ease-in duration-200"
                 x-transition:leave-start="opacity-100 transform scale-100"
                 x-transition:leave-end="opacity-0 transform scale-95"
                 class="absolute bottom-20 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 border-2 border-[#D4AF37]">
                <!-- Flèche pointant vers la mascotte -->
                <div class="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-[#D4AF37] transform rotate-45"></div>
                
                <button @click="showMessage = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition">
                    <i class="fas fa-times text-sm"></i>
                </button>
                
                <p class="text-sm text-gray-800 font-medium mb-2">
                    👋 Besoin d'aide ?
                </p>
                <p class="text-xs text-gray-600 mb-3">
                    Discutons de votre projet marketing, formation ou innovation !
                </p>
                <a href="/#contact" 
                   class="block w-full text-center bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black text-xs font-bold py-2 rounded-lg hover:shadow-lg transition">
                    Contactez-nous
                </a>
            </div>
            
            <!-- Mascotte cliquable avec animation -->
            <button @click="showMessage = !showMessage" 
                    class="relative group">
                <!-- Badge de notification -->
                <div x-show="!showMessage" 
                     class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div x-show="!showMessage" 
                     class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                
                <!-- Cercle avec gradient doré + animation pulse -->
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center shadow-2xl hover:shadow-[#D4AF37]/50 transition-all transform hover:scale-110 animate-bounce-slow">
                    <!-- Icône mascotte -->
                    <i class="fas fa-comments text-white text-2xl"></i>
                </div>
                
                <!-- Effet de vague -->
                <div class="absolute inset-0 rounded-full bg-[#D4AF37] opacity-20 animate-ping"></div>
            </button>
            
            <!-- Tooltip au hover -->
            <div class="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="bg-gray-900 text-white text-xs py-1 px-3 rounded-lg whitespace-nowrap">
                    Parlez-nous !
                </div>
            </div>
        </div>
        
        <!-- Styles CSS pour animations personnalisées -->
        <style>
            @keyframes bounce-slow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .animate-bounce-slow {
                animation: bounce-slow 3s ease-in-out infinite;
            }
        </style>
        ${popupHtml}
    </body>
    </html>
  `)
})

app.get('/robots.txt', (c) => {
    return c.text(`# robots.txt pour CEM GROUP
User-agent: *
Allow: /

Sitemap: https://cembymazini.ma/sitemap.xml

Disallow: /api/
Disallow: /_worker.js
Disallow: /admin/

Allow: /static/
Allow: /*.css
Allow: /*.js
Allow: /*.jpg
Allow: /*.png
Allow: /*.webp`, 200, { 'Content-Type': 'text/plain' })
})

export default app

