import { Hono } from 'hono';
import { blogService, plaquettesService, formationsService, type Formation } from '../lib/sheets';
import { generatePlaquettesHtml } from '../lib/html-generators';
import { Bindings } from '../bindings';

const formationApp = new Hono<{ Bindings: Bindings }>();

formationApp.get('/', async (c) => {
    // Fetch dynamic content
    const blogs = await blogService.getAll(c.env).catch(() => []);
    const plaquettes = await plaquettesService.getAll(c.env).catch(() => []);
    const formations = await formationsService.getAll(c.env).catch(() => []);
    const plaquettesHtml = generatePlaquettesHtml(plaquettes);
    const latestBlogs = blogs
        .filter(b => b.status === 'published')
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 4);

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- SEO Meta Tags -->
        <title>CEM FORMATION - Formation Professionnelle Digitale Maroc | LinkedIn, E-Learning, IA</title>
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
        
        <!-- Favicon -->
        <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        
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
                        <a href="/catalogue" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
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
                        <img src="https://www.genspark.ai/api/files/s/QqzucmtA" alt="Équipe CEM Formation Maroc - Formateurs Certifiés E-Learning, LinkedIn N°1 Growth, Marketing Digital et Intelligence Artificielle" loading="lazy" class="relative z-20 w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300">
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
                                 class="w-full h-auto object-cover">
                            
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
                            <a href="/catalogue" class="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl inline-flex items-center">
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
                <div class="space-y-6" x-data="{ activeCategory: window.location.hash ? window.location.hash.substring(1) : null }" @hashchange.window="activeCategory = window.location.hash ? window.location.hash.substring(1) : null">
                ${(() => {
            const activeFormations = formations.filter((f: any) => f.status === 'active').sort((a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0));

            const categories = [
                { id: 'digital-marketing', name: 'Digital Marketing' },
                { id: 'management', name: 'Management & Leadership' },
                { id: 'business-dev', name: 'Business Développement' },
                { id: 'industrie-securite', name: 'Industrie & Sécurité' }
            ];

            const categoryStyles = {
                'Digital Marketing': { bg: 'from-[#D4AF37] to-[#FFD700]', text: 'white', icon: 'fa-laptop-code' },
                'Management & Leadership': { bg: 'from-gray-900 to-black', text: 'white', icon: 'fa-users-cog' },
                'Business Développement': { bg: 'from-[#0077B5] to-[#00A0DC]', text: 'white', icon: 'fa-chart-line' },
                'Industrie & Sécurité': { bg: 'from-green-600 to-emerald-700', text: 'white', icon: 'fa-industry' }
            };

            const renderCard = (f: any, displayCat: string) => {
                const bullets = (f.bullets || '').split(',').filter(Boolean);
                const tags = (f.tags || '').split(',').filter(Boolean);
                return `
                            <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group relative border-2 border-transparent hover:border-[${f.borderColor || '#D4AF37'}] h-full flex flex-col">
                                ${f.badge ? `<div class="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black z-10">${f.badge}</div>` : ''}
                                <div class="relative overflow-hidden rounded-lg mb-4">
                                    <img src="${f.imageUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8'}" 
                                         alt="${f.title}" 
                                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                                    <div class="absolute top-3 right-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-bold" style="background-color: ${f.iconColor || '#D4AF37'}">
                                        <i class="${f.icon || 'fas fa-graduation-cap'} mr-1"></i>${displayCat || ''}
                                    </div>
                                </div>
                                <h4 class="text-xl font-bold mb-2 text-gray-900">${f.title}</h4>
                                <p class="text-sm text-gray-600 mb-4">${f.description}</p>
                                <ul class="space-y-2 text-sm text-gray-700 mb-6 flex-grow">
                                    ${bullets.map((b: string) => `<li><i class="fas fa-check mr-2" style="color: ${f.iconColor || '#D4AF37'}"></i>${b.trim()}</li>`).join('')}
                                </ul>
                                <a href="${f.ctaLink || '/#contact'}" class="block w-full text-white text-center font-bold py-2 rounded-lg transition text-sm hover:shadow-md mt-auto" style="background-color: ${f.iconColor || '#D4AF37'}">
                                    <i class="fas fa-envelope mr-2"></i>${f.ctaText || 'Devis'}
                                </a>
                            </div>`;
            };

            let html = '';
            categories.forEach(catObj => {
                const cat = catObj.name;
                const style = categoryStyles[cat as keyof typeof categoryStyles] || { bg: 'from-gray-700 to-gray-800', text: 'white', icon: 'fa-graduation-cap' };
                const catsFormations = activeFormations.filter((f: any) => {
                    const fCat = f.category || '';
                    if (cat === 'Digital Marketing' && (fCat === 'Digital Marketing' || fCat.includes('Digitales') || fCat.includes('Digital'))) return true;
                    if (cat === 'Management & Leadership' && (fCat === 'Management & Leadership' || fCat.includes('Management'))) return true;
                    if (cat === 'Business Développement' && (fCat === 'Business Développement' || fCat.includes('Business'))) return true;
                    if (cat === 'Industrie & Sécurité' && (fCat === 'Industrie & Sécurité' || fCat.includes('Industrie'))) return true;
                    return fCat === cat;
                });

                html += `
                        <div id="${catObj.id}" class="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition mb-6 scroll-mt-32">
                            <button @click="activeCategory = activeCategory === '${catObj.id}' ? null : '${catObj.id}'" 
                                    class="w-full px-8 py-6 flex items-center justify-between bg-gradient-to-r ${style.bg} text-${style.text} hover:opacity-90 transition">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                        <i class="fas ${style.icon} text-3xl"></i>
                                    </div>
                                    <div class="text-left">
                                        <h3 class="text-2xl font-bold">${cat}</h3>
                                        <p class="text-sm opacity-90">${catsFormations.length} formations disponibles</p>
                                    </div>
                                </div>
                                <i :class="activeCategory === '${catObj.id}' ? 'fa-chevron-up' : 'fa-chevron-down'" class="fas text-2xl transition-transform"></i>
                            </button>
                            
                            <div x-show="activeCategory === '${catObj.id}'" x-collapse class="p-8 bg-gray-50">
                                ${catsFormations.length > 0
                        ? `<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        ${catsFormations.map(f => renderCard(f, cat)).join('')}
                                       </div>`
                        : `<p class="text-center text-gray-500 py-8">Aucune formation dans cette catégorie pour le moment.</p>`}
                            </div>
                        </div>`;
            });
            return html;
        })()}
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
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-2 border-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full flex flex-col">
                        <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-seedling text-white text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">DÉBUTANT</h3>
                        <p class="text-center text-[#D4AF37] font-bold mb-6">Les Fondamentaux</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8 flex-grow">
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
                        
                        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-center mt-auto">
                            <div class="text-white text-sm mb-1">Durée</div>
                            <div class="text-white text-2xl font-bold">2 jours</div>
                        </div>
                    </div>
                    
                    <!-- INTERMÉDIAIRE -->
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-4 border-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all duration-300 relative h-full flex flex-col">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white px-6 py-1 rounded-full text-sm font-bold">
                            ⭐ POPULAIRE
                        </div>
                        <div class="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-chart-line text-white text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">INTERMÉDIAIRE</h3>
                        <p class="text-center text-[#D4AF37] font-bold mb-6">Croissance & Engagement</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8 flex-grow">
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
                        
                        <div class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-xl p-4 text-center mt-auto">
                            <div class="text-white text-sm mb-1">Durée</div>
                            <div class="text-white text-2xl font-bold">3 jours</div>
                        </div>
                    </div>
                    
                    <!-- EXPERT -->
                    <div class="bg-gradient-to-br from-white to-[#F5F5F5] rounded-2xl p-8 border-2 border-black hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full flex flex-col">
                        <div class="w-20 h-20 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i class="fas fa-crown text-[#D4AF37] text-4xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold mb-2 text-center text-black">EXPERT</h3>
                        <p class="text-center text-black font-bold mb-6">Influence & Monétisation</p>
                        
                        <ul class="space-y-3 text-gray-700 mb-8 flex-grow">
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
                        
                        <div class="bg-gradient-to-r from-black to-[#1a1a1a] rounded-xl p-4 text-center mt-auto">
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
                    ${latestBlogs.length > 0 ? latestBlogs.map(blog => `
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition border-2 border-[#D4AF37] flex flex-col h-full">
                        <div class="h-48 relative overflow-hidden">
                            <img src="${blog.coverImage || '/static/default-blog.jpg'}" alt="${blog.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div class="absolute bottom-4 left-4 text-white">
                                <span class="bg-[#D4AF37] text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">${blog.category || 'Actualité'}</span>
                            </div>
                        </div>
                        <div class="p-6 flex-1 flex flex-col">
                            <div class="text-[#D4AF37] text-sm font-bold mb-2">
                                <i class="fas fa-calendar mr-2"></i>${new Date(blog.publishedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </div>
                            <h3 class="text-xl font-bold mb-3 line-clamp-2">${blog.title}</h3>
                            <p class="text-gray-600 mb-4 line-clamp-3 text-sm flex-1">${blog.excerpt || ''}</p>
                            <a href="/actualites/${blog.slug}" class="text-[#D4AF37] font-bold hover:underline mt-auto">
                                En savoir plus <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                    </div>
                    `).join('') : '<p class="text-center text-gray-500 col-span-4">Aucune actualité pour le moment.</p>'}
                </div>
                
                <!-- CTA Newsletter -->
                <div class="mt-16 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] rounded-2xl p-12 text-center">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        <i class="fas fa-envelope-open-text mr-3"></i>
                        Restez informé de nos actualités
                    </h3>
                    <p class="text-white/90 text-lg mb-8">Inscrivez-vous à notre newsletter pour ne rien manquer de nos nouvelles formations et innovations</p>
                    <a href="https://www.linkedin.com/company/cem-group" target="_blank" rel="noopener noreferrer" 
                       class="inline-block bg-white text-[#D4AF37] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                        <i class="fab fa-linkedin mr-2"></i>S'abonner sur LinkedIn
                    </a>
                </div>
            </div>
        </section>

        <!-- Formulaire Contact Formation -->
        <section id="contact" class="py-20 bg-gradient-to-br from-[#D4AF37] via-[#000000] to-[#1a1a1a] text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">Demandez Votre Devis Formation</h2>
                <p class="text-center text-gray-400 text-xl mb-12">Un besoin en formation ? Discutons-en ensemble</p>
                
                <form class="space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37]">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-user mr-2"></i>Nom complet *
                            </label>
                            <input type="text" required 
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
                        <input type="checkbox" required class="mt-1 mr-3">
                        <label class="text-sm text-gray-400">
                            J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande *
                        </label>
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                        <i class="fas fa-paper-plane mr-2"></i>Demander un Devis
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

        <!-- Section Plaquettes (Brochures & Catalogues) -->
        ${plaquettesHtml}

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
export default formationApp;
