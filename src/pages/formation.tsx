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

    return c.html(`    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CEM FORMATION - Excellence en formation professionnelle</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap');
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
        <!-- Navigation -->
        <nav class="fixed w-full top-0 z-50 bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center hover:opacity-80 transition"><img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto"></a>
                    </div>
                    <div class="flex items-center space-x-8">
                        <a href="/" class="text-gray-700 hover:text-#D4AF37">Accueil</a>
                        <a href="/marketing" class="text-gray-700 hover:text-#D4AF37">CEM Marketing</a>
                        <a href="/formation" class="text-#000000 font-bold">CEM Formation</a>
                    </div>
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
                        <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/50 transition-all inline-flex items-center">
                            <i class="fas fa-paper-plane mr-2"></i>
                            Demander une démo
                        </a>
                        <a href="#services" class="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#D4AF37] hover:text-black transition-all inline-flex items-center">
                            <i class="fas fa-arrow-down mr-2"></i>
                            Découvrir nos formations
                        </a>
                    </div>
                </div>

                <!-- COLONNE DROITE : MASCOTTES -->
                <div class="relative h-96 flex items-center justify-center">
                    <div class="relative animate-float">
                        <img src="/static/mascottes-formation.png" alt="Équipe CEM Formation - Experts Pédagogiques" class="relative z-20 max-w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300">
                        <!-- Cercle doré pulsant -->
                        <div class="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    </div>
                    
                    <!-- Badge Formateurs -->
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] px-6 py-3 rounded-full shadow-2xl z-30">
                        <p class="text-black font-bold text-sm">????? Équipe CEM Formation - Experts Pédagogiques</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- MINI VAGUE Black ? White -->
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

        <!-- Toutes Nos Formations (15 formations catalogue CEM 2026) -->
        <section id="services" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-bold gradient-text mb-4">Toutes Nos Formations Professionnelles</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                        15 formations en présentiel, à distance et e-learning pour développer les compétences de vos équipes
                    </p>
                </div>
                
                ${(() => {
            const activeFormations = formations.filter((f: any) => f.status === 'active').sort((a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0));
            const digitales = activeFormations.filter((f: any) => f.category === 'Digitales');
            const management = activeFormations.filter((f: any) => f.category === 'Management');

            const renderCard = (f: any) => {
                const bullets = (f.bullets || '').split(',').filter(Boolean);
                const tags = (f.tags || '').split(',').filter(Boolean);
                return `
                        <div class="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition border-2 border-gray-100 hover:border-[${f.borderColor || '#D4AF37'}]" style="--hover-border: ${f.borderColor || '#D4AF37'}"${f.badge ? ' style="position:relative"' : ''}>
                            ${f.badge ? `<div class="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-green-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-2xl z-10">${f.badge}</div>` : ''}
                            <img src="${f.imageUrl}" alt="${f.title}" class="w-full h-48 object-cover rounded-xl mb-6">
                            <i class="${f.icon} text-4xl mb-4 block" style="color: ${f.iconColor || '#D4AF37'}"></i>
                            <h4 class="text-2xl font-bold mb-3">${f.title}</h4>
                            <p class="text-gray-600 mb-4">${f.description}</p>
                            <ul class="space-y-2 text-gray-700 mb-6">
                                ${bullets.map((b: string) => `<li><i class="fas fa-check mr-2" style="color: ${f.iconColor || '#D4AF37'}"></i>${b.trim()}</li>`).join('')}
                            </ul>
                            <div class="flex gap-2 mb-4">
                                ${tags.map((t: string) => `<span class="bg-[#F8F9FA] text-[#000000] text-xs font-bold px-3 py-1 rounded-full">${t.trim()}</span>`).join('')}
                            </div>
                            <a href="${f.ctaLink || '/#contact'}" class="block w-full ${f.ctaColor || 'bg-[#D4AF37]'} text-white text-center font-bold py-3 rounded-full hover:shadow-lg transition">
                                <i class="fas fa-envelope mr-2"></i>${f.ctaText || 'Demander un devis'}
                            </a>
                        </div>`;
            };

            if (activeFormations.length === 0) {
                return '<p class="text-center text-gray-500 py-12">Les formations seront bientôt disponibles.</p>';
            }

            let html = '';
            if (digitales.length > 0) {
                html += `
                <div class="mb-16">
                    <h3 class="text-3xl font-bold text-black mb-8 pb-4 border-b-4 border-[#D4AF37]">
                        <i class="fas fa-laptop-code text-[#D4AF37] mr-3"></i>Formations Digitales & E-Learning
                    </h3>
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${digitales.map(renderCard).join('')}
                    </div>
                </div>`;
            }
            if (management.length > 0) {
                html += `
                <div>
                    <h3 class="text-3xl font-bold text-black mb-8 pb-4 border-b-4 border-black">
                        <i class="fas fa-users text-black mr-3"></i>Formations Management & Leadership
                    </h3>
                    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${management.map(renderCard).join('')}
                    </div>
                </div>`;
            }
            return html;
        })()}
                
                <!-- CTA Global -->
                <div class="mt-16 text-center">
                    <div class="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 shadow-2xl border-2 border-gray-100">
                        <h3 class="text-4xl font-bold mb-4">Une formation vous intéresse ?</h3>
                        <p class="text-xl text-gray-600 mb-8">Contactez-nous pour un programme sur mesure adapté à vos besoins</p>
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/#contact" class="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                                <i class="fas fa-envelope mr-2"></i>Demander un devis personnalisé
                            </a>
                            <a href="tel:+212688947098" class="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition transform hover:scale-105">
                                <i class="fas fa-phone mr-2"></i>Appeler maintenant
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>




        <!-- Avantages -->
        <section class="py-20 bg-gradient-to-br from-[#FFFFFF] via-[#F8F9FA] to-[#D4AF37]/10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-16">Pourquoi choisir CEM Formation ?</h2>
                
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center">
                        <div class="w-20 h-20 bg-rgba(0, 0, 0, 0.1) rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-rocket text-4xl text-#000000"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Rapidité de déploiement</h3>
                        <p class="text-gray-600">Plateforme prête à l'emploi en quelques jours</p>
                    </div>
                    
                    <div class="text-center">
                        <div class="w-20 h-20 bg-rgba(212, 175, 55, 0.1) rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-mobile-alt text-4xl text-#D4AF37"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Accessible partout</h3>
                        <p class="text-gray-600">Formations accessibles sur tous les appareils</p>
                    </div>
                    
                    <div class="text-center">
                        <div class="w-20 h-20 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-chart-bar text-4xl text-[#D4AF37]"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Résultats mesurables</h3>
                        <p class="text-gray-600">Tableaux de bord et analytics détaillés</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Final Puissant Formation -->
        <section class="py-20 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#D4AF37] text-white">
            <div class="max-w-6xl mx-auto px-4">
                <div class="text-center mb-12">
                    <h2 class="text-5xl font-bold mb-6">Prêt à digitaliser vos formations ?</h2>
                    <p class="text-2xl mb-4">Plus de 500 apprenants formés avec succès</p>
                    <p class="text-xl text-white/80">Demandez une démo gratuite de notre plateforme E-Learning</p>
                </div>
                
                <div class="grid md:grid-cols-3 gap-6 mb-12">
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <i class="fas fa-laptop text-4xl text-[#D4AF37] mb-4"></i>
                        <h3 class="font-bold text-xl mb-2">Démo en ligne</h3>
                        <p class="text-white/80 mb-4">Découvrez notre plateforme</p>
                        <a href="/#contact" class="text-[#D4AF37] font-bold hover:text-[#D4AF37]">Réserver une démo</a>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <i class="fas fa-file-download text-4xl text-[#D4AF37] mb-4"></i>
                        <h3 class="font-bold text-xl mb-2">Catalogue PDF</h3>
                        <p class="text-white/80 mb-4">Toutes nos formations</p>
                        <a href="/#contact" class="text-[#D4AF37] font-bold hover:text-[#D4AF37]">Demander le catalogue</a>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <i class="fas fa-users text-4xl text-[#D4AF37] mb-4"></i>
                        <h3 class="font-bold text-xl mb-2">Formation sur mesure</h3>
                        <p class="text-white/80 mb-4">Adaptée à vos besoins</p>
                        <a href="/#contact" class="text-[#D4AF37] font-bold hover:text-[#D4AF37]">Demander un devis</a>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/#contact" class="bg-[#D4AF37] text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-[#B8941F] transition shadow-2xl">
                        <i class="fas fa-rocket mr-2"></i>Lancer mon projet E-Learning
                    </a>
                    <a href="/" class="bg-white text-black px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition shadow-2xl">
                        <i class="fas fa-home mr-2"></i>Retour à l'accueil
                    </a>
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
                            ? POPULAIRE
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
                        
                        <div class="grid md:grid-cols-3 gap-6 mb-8">
                            <div class="bg-white/20 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-search text-white text-3xl mb-3"></i>
                                <h4 class="font-bold text-white mb-2">Audit Complet</h4>
                                <p class="text-white/80 text-sm">Analyse approfondie de votre profil et stratégie</p>
                            </div>
                            <div class="bg-white/20 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-calendar-check text-white text-3xl mb-3"></i>
                                <h4 class="font-bold text-white mb-2">Sessions 1-to-1</h4>
                                <p class="text-white/80 text-sm">6 sessions personnalisées avec un expert</p>
                            </div>
                            <div class="bg-white/20 backdrop-blur-lg rounded-xl p-6">
                                <i class="fas fa-headset text-white text-3xl mb-3"></i>
                                <h4 class="font-bold text-white mb-2">Support 3 mois</h4>
                                <p class="text-white/80 text-sm">Accompagnement continu et ajustements</p>
                            </div>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/#contact" class="bg-white text-[#D4AF37] px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition shadow-2xl">
                                <i class="fab fa-linkedin mr-2"></i>Démarrer ma Formation LinkedIn
                            </a>
                            <a href="/" class="bg-black text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-[#D4AF37] transition shadow-2xl">
                                <i class="fas fa-phone mr-2"></i>Nous Contacter
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Stats LinkedIn Formation -->
                <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
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
        
        <!-- Acculturation & Démystification IA - Formation - MODERNE -->
        <section id="ia-formation" class="py-20 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#D4AF37]/20 relative overflow-hidden">
            <!-- Animated Background Blobs -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div class="absolute bottom-20 left-20 w-96 h-96 bg-[#FFD700] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
            </div>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <!-- Header avec Mascotte -->
                <div class="text-center mb-16 relative">
                    <!-- Mascotte IA qui fait coucou (Positionnée en haut à droite) -->
                    <div class="absolute -top-10 right-0 md:right-20 animate-bounce">
                        <div class="relative">
                            <!-- Robot mascotte -->
                            <div class="w-32 h-32 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                                <i class="fas fa-robot text-white text-5xl"></i>
                            </div>
                            <!-- Main qui fait coucou -->
                            <div class="absolute -top-4 -right-4 text-6xl animate-wave">
                                ??
                            </div>
                            <!-- Bulle de dialogue -->
                            <div class="absolute -bottom-16 -right-8 bg-white rounded-2xl px-4 py-2 shadow-xl border-2 border-[#D4AF37] whitespace-nowrap">
                                <p class="text-sm font-bold text-[#D4AF37]">Bonjour ! ???</p>
                                <div class="absolute top-0 left-4 transform -translate-y-2">
                                    <div class="w-4 h-4 bg-white border-t-2 border-l-2 border-[#D4AF37] transform rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="inline-block bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-white px-8 py-3 rounded-full text-sm font-bold mb-6 shadow-2xl animate-pulse">
                        <i class="fas fa-robot mr-2"></i>Formation Intelligence Artificielle Moderne
                    </div>
                    <h2 class="text-6xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#FFFFFF] bg-clip-text text-transparent mb-6">
                        Acculturation & Démystification de l'IA
                    </h2>
                    <p class="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                        Formez vos équipes et décideurs aux enjeux de l'intelligence artificielle avec des experts passionnés ??
                    </p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Acculturation IA - MODERNE -->
                    <div class="bg-gradient-to-br from-white via-[#F8F9FA] to-white rounded-3xl p-10 border-2 border-[#D4AF37] hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                        <!-- Animated corner decoration -->
                        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] opacity-10 rounded-bl-full group-hover:scale-150 transition-transform duration-500"></div>
                        
                        <div class="relative z-10">
                            <div class="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl flex items-center justify-center mb-6 shadow-xl transform group-hover:rotate-6 transition-transform">
                                <i class="fas fa-users text-white text-5xl"></i>
                            </div>
                            <h3 class="text-4xl font-bold mb-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                                Acculturation IA
                            </h3>
                            <p class="text-gray-700 mb-6 text-lg">Sensibiliser et former vos équipes aux opportunités de l'intelligence artificielle</p>
                            <ul class="space-y-4 text-gray-700">
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-white"></i>
                                    </div>
                                    <span class="text-base">Ateliers pratiques d'initiation à l'IA générative</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-white"></i>
                                    </div>
                                    <span class="text-base">Formation aux outils IA (ChatGPT, MidJourney, Gemini, etc.)</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-white"></i>
                                    </div>
                                    <span class="text-base">Cas d'usage concrets adaptés à chaque département</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-white"></i>
                                    </div>
                                    <span class="text-base">Accompagnement dans l'adoption progressive</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Démystification IA - MODERNE -->
                    <div class="bg-gradient-to-br from-[#1a1a1a] via-[#000000] to-[#1a1a1a] rounded-3xl p-10 border-2 border-white hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                        <!-- Animated corner decoration -->
                        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-[#D4AF37] opacity-10 rounded-bl-full group-hover:scale-150 transition-transform duration-500"></div>
                        
                        <div class="relative z-10">
                            <div class="w-24 h-24 bg-gradient-to-br from-white to-[#F8F9FA] rounded-2xl flex items-center justify-center mb-6 shadow-xl transform group-hover:rotate-6 transition-transform">
                                <i class="fas fa-lightbulb text-black text-5xl"></i>
                            </div>
                            <h3 class="text-4xl font-bold mb-4 text-white">
                                Démystification IA
                            </h3>
                            <p class="text-gray-300 mb-6 text-lg">Clarifier les enjeux stratégiques et opérationnels de l'IA pour les décideurs</p>
                            <ul class="space-y-4 text-gray-300">
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-black"></i>
                                    </div>
                                    <span class="text-base">Conférences et workshops pour décideurs</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-black"></i>
                                    </div>
                                    <span class="text-base">Identification des opportunités IA pour votre secteur</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-black"></i>
                                    </div>
                                    <span class="text-base">Roadmap d'intégration de l'IA dans votre organisation</span>
                                </li>
                                <li class="flex items-start group/item hover:translate-x-2 transition-transform">
                                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                        <i class="fas fa-check text-black"></i>
                                    </div>
                                    <span class="text-base">Évaluation des risques et éthique de l'IA</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- CTA Formation IA -->
                <div class="mt-16 text-center bg-gradient-to-r from-[#D4AF37] to-black rounded-2xl p-12">
                    <h3 class="text-3xl font-bold text-white mb-4">Prêt à Former Vos Équipes à l'IA ?</h3>
                    <p class="text-white/90 text-lg mb-8">Réservez une session découverte gratuite avec nos experts IA</p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/#contact" class="bg-white text-[#D4AF37] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                            <i class="fas fa-calendar-alt mr-2"></i>Réserver une Session IA
                        </a>
                        <a href="/marketing" class="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#D4AF37] transition shadow-xl">
                            <i class="fas fa-robot mr-2"></i>Découvrir CEM Innovation
                        </a>
                    </div>
                </div>
                
                <!-- Stats IA Formation -->
                <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-2xl p-6 text-center border-2 border-[#D4AF37] hover:shadow-lg transition">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">85%</div>
                        <div class="text-sm text-gray-600">Gain de productivité</div>
                    </div>
                    <div class="bg-white rounded-2xl p-6 text-center border-2 border-[#D4AF37] hover:shadow-lg transition">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">50+</div>
                        <div class="text-sm text-gray-600">Entreprises formées</div>
                    </div>
                    <div class="bg-white rounded-2xl p-6 text-center border-2 border-[#D4AF37] hover:shadow-lg transition">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">200+</div>
                        <div class="text-sm text-gray-600">Collaborateurs acculturés</div>
                    </div>
                    <div class="bg-white rounded-2xl p-6 text-center border-2 border-[#D4AF37] hover:shadow-lg transition">
                        <div class="text-4xl font-bold text-[#D4AF37] mb-2">15+</div>
                        <div class="text-sm text-gray-600">Cas d'usage IA</div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Bande d'urgence Formation -->
        <div class="bg-[#D4AF37] py-4 text-center">
            <p class="text-white font-bold text-lg">
                <i class="fas fa-gift mr-2"></i>
                Nouveau : Essai gratuit de 14 jours sur notre plateforme E-Learning ! 
                <a href="/#contact" class="underline ml-2 hover:text-black">S'inscrire maintenant</a>
            </p>
        </div>


        <!-- Actualités & News Formation -->
        <section id="actualites" class="py-20 bg-gradient-to-br from-[#D4AF37]/5 via-[#FFFFFF] to-[#F8F9FA]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-5xl font-bold gradient-text text-center mb-4">CEM ACTUS & NEWS</h2>
                <p class="text-center text-gray-600 text-xl mb-16">Les dernières nouveautés de CEM Formation</p>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                
                <form x-data="{ 
                    loading: false, 
                    success: false, 
                    error: false, 
                    formData: {
                        name: '',
                        email: '',
                        phone: '',
                        service: '',
                        participants: '',
                        message: '',
                        consent: false
                    },
                    async submitForm() {
                        this.loading = true;
                        this.success = false;
                        this.error = false;
                        
                        try {
                            // Map form data to API expectation
                            const payload = {
                                name: this.formData.name,
                                email: this.formData.email,
                                phone: this.formData.phone,
                                service: this.formData.service,
                                // Add participants to message if not supported by API
                                message: '[Participants: ' + this.formData.participants + ']\\n' + this.formData.message,
                                company: 'N/A', // Optional
                                source: 'CEM Formation - Contact'
                            };

                            const response = await fetch('/api/contact', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            
                            if (response.ok) {
                                this.success = true;
                                this.formData = { name: '', email: '', phone: '', service: '', participants: '', message: '', consent: false };
                            } else {
                                this.error = true;
                            }
                        } catch (e) {
                            this.error = true;
                        } finally {
                            this.loading = false;
                        }
                    }
                }" @submit.prevent="submitForm" class="space-y-6 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-[#D4AF37]">
                    
                    <!-- Success/Error Messages -->
                    <div x-show="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong class="font-bold">Succès!</strong>
                        <span class="block sm:inline">Votre demande a été envoyée. Nous vous recontacterons bientôt.</span>
                    </div>
                    <div x-show="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong class="font-bold">Erreur!</strong>
                        <span class="block sm:inline">Une erreur s'est produite. Veuillez réessayer.</span>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-user mr-2"></i>Nom complet *
                            </label>
                            <input type="text" required x-model="formData.name"
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="Votre nom">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-envelope mr-2"></i>Email *
                            </label>
                            <input type="email" required x-model="formData.email"
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="votre@email.com">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-phone mr-2"></i>Téléphone *
                            </label>
                            <input type="tel" required x-model="formData.phone"
                                   class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                   placeholder="+212 6XX XXX XXX">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">
                                <i class="fas fa-graduation-cap mr-2"></i>Formation souhaitée *
                            </label>
                            <select required x-model="formData.service"
                                    class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white bg-black/80">
                                <option value="">Choisir une formation...</option>
                                <optgroup label="Formations Digitales">
                                    <option>E-Learning Digital</option>
                                    <option>LinkedIn Formation One-to-One</option>
                                    <option>LinkedIn Accompagnement Team</option>
                                    <option>Marketing Digital</option>
                                    <option>Création de Contenu</option>
                                    <option>IA & Innovation</option>
                                </optgroup>
                                <optgroup label="Management & Leadership">
                                    <option>Leadership & Management</option>
                                    <option>Formation en Communication</option>
                                    <option>Bien-être au Travail</option>
                                    <option>Coaching Dirigeants</option>
                                    <option>Force de Vente & Négociation</option>
                                    <option>Management d'Équipe Virtuelle</option>
                                    <option>Gestion du Changement</option>
                                    <option>Intelligence Émotionnelle</option>
                                    <option>Prise de Décision Stratégique</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-users mr-2"></i>Nombre de participants
                        </label>
                        <select x-model="formData.participants" class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white bg-black/80">
                            <option value="">Choisir le nombre...</option>
                            <option>1 personne (One-to-One)</option>
                            <option>2-5 personnes</option>
                            <option>6-10 personnes</option>
                            <option>11-20 personnes</option>
                            <option>Plus de 20 personnes</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            <i class="fas fa-comment-dots mr-2"></i>Décrivez vos besoins en formation *
                        </label>
                        <textarea rows="6" required x-model="formData.message"
                                  class="w-full px-4 py-3 bg-white/10 border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] transition text-white placeholder-gray-500"
                                  placeholder="Parlez-nous de vos objectifs de formation, compétences à développer, délais..."></textarea>
                    </div>
                    
                    <div class="flex items-start">
                        <input type="checkbox" required x-model="formData.consent" class="mt-1 mr-3">
                        <label class="text-sm text-gray-400">
                            J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande *
                        </label>
                    </div>
                    
                    <button type="submit" :disabled="loading" :class="{'opacity-50 cursor-not-allowed': loading}"
                            class="w-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-white py-4 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                        <span x-show="!loading"><i class="fas fa-paper-plane mr-2"></i>Demander un Devis Gratuit</span>
                        <span x-show="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
                    </button>
                    
                    <p class="text-center text-gray-500 text-sm">
                        <i class="fas fa-lock mr-2"></i>Vos données sont sécurisées et ne seront jamais partagées
                    </p>
                </form>
                
                <!-- Contact rapide -->
                <div class="mt-12 grid md:grid-cols-3 gap-6 text-center">
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-phone-alt text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Téléphone</h4>
                        <p class="text-gray-400">+212 6XX XXX XXX</p>
                    </div>
                    <div class="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-[#D4AF37]/30">
                        <i class="fas fa-envelope text-[#D4AF37] text-3xl mb-3"></i>
                        <h4 class="font-bold mb-2">Email</h4>
                        <p class="text-gray-400">contact@cembymazini.ma</p>
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
        <footer class="bg-gradient-to-br from-gray-900 to-black text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 class="text-2xl font-bold mb-4 text-[#D4AF37]">CEM FORMATION</h3>
                        <p class="text-gray-400">Excellence en formation professionnelle et E-Learning</p>
                        <p class="text-gray-500 text-sm mt-2">
                            <i class="fas fa-map-marker-alt mr-2"></i>Casablanca, Maroc
                        </p>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-[#D4AF37]">Liens Utiles</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/#contact" class="hover:text-white transition"><i class="fas fa-envelope mr-2"></i>Nous contacter</a></li>
                            <li><a href="/" class="hover:text-white transition"><i class="fas fa-home mr-2"></i>Retour à l'accueil</a></li>
                            <li><a href="/marketing" class="hover:text-white transition"><i class="fas fa-bullhorn mr-2"></i>CEM Marketing</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-bold mb-4 text-[#D4AF37]">
                            <i class="fas fa-share-alt mr-2"></i>Suivez-nous
                        </h4>
                        <div class="flex flex-wrap gap-3 mb-4">
                            <a href="https://www.linkedin.com/company/cem-group" target="_blank" rel="noopener noreferrer" 
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37] hover:scale-110 transition-all border border-gray-700"
                               title="LinkedIn">
                                <i class="fab fa-linkedin-in text-xl"></i>
                            </a>
                            <a href="https://www.instagram.com/cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37] hover:scale-110 transition-all border border-gray-700"
                               title="Instagram">
                                <i class="fab fa-instagram text-xl"></i>
                            </a>
                            <a href="https://www.facebook.com/cemgroup" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37] hover:scale-110 transition-all border border-gray-700"
                               title="Facebook">
                                <i class="fab fa-facebook-f text-xl"></i>
                            </a>
                            <a href="https://www.tiktok.com/@cem.group" target="_blank" rel="noopener noreferrer"
                               class="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37] hover:scale-110 transition-all border border-gray-700"
                               title="TikTok">
                                <i class="fab fa-tiktok text-xl"></i>
                            </a>
                        </div>
                        <p class="text-gray-500 text-xs">
                            <i class="fas fa-users mr-1"></i>+5000 abonnés
                        </p>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>&copy; 2026 CEM GROUP - CEM FORMATION. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    </body>
    </html>`)
})
export default formationApp
