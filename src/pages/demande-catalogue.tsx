import { Hono } from 'hono';
import { Bindings } from '../bindings';
import { popupService } from '../lib/sheets';
import { generatePopupHtml } from '../lib/html-generators';

const demandeCatalogueApp = new Hono<{ Bindings: Bindings }>();

demandeCatalogueApp.get('/', async (c) => {
    const env = c.env;
    const popups = await popupService.getAll(env).catch(() => []);
    const activePopup = popups.find(p => p.isActive);
    const popupHtml = generatePopupHtml(activePopup);

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demander le Catalogue | CEM GROUP</title>
        <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <meta name="description" content="Demandez notre catalogue de formations et nos services de marketing digital. CEM GROUP Casablanca."/>
        
        <link href="/styles.css" rel="stylesheet">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"></noscript>
        
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"></noscript>
        
        <style>
            body { font-family: 'Poppins', sans-serif; }
            .gradient-text { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        </style>
    </head>
    <body class="bg-gray-50 flex flex-col min-h-screen">
        
        <!-- Navigation Minimaliste Pour Landing Page -->
        <nav class="w-full bg-white shadow-md z-40 fixed top-0">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20 items-center">
                    <a href="/" class="flex items-center hover:opacity-80 transition no-underline">
                        <img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP" class="h-14 w-auto">
                    </a>
                    <a href="/" class="text-gray-600 hover:text-[#D4AF37] font-medium transition flex items-center">
                        <i class="fas fa-arrow-left mr-2"></i>Retour au site
                    </a>
                </div>
            </div>
        </nav>

        <!-- Hero & Form Section -->
        <div class="flex-grow pt-32 pb-20 relative overflow-hidden bg-black text-white">
            <!-- Decorative Background blob -->
            <div class="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/20 rounded-full filter blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-96 h-96 bg-gray-600/20 rounded-full filter blur-3xl"></div>

            <div class="max-w-6xl mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <!-- Text / Hero part -->
                <div class="space-y-6">
                    <div class="inline-block bg-[#D4AF37]/20 px-4 py-2 rounded-full text-[#D4AF37] font-bold text-sm">
                        <i class="fas fa-book-open mr-2"></i>Catalogue 2026
                    </div>
                    <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
                        Recevez notre <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFD700]">catalogue complet</span> instantanément
                    </h1>
                    <p class="text-gray-300 text-lg">
                        Découvrez nos +15 formations certifiantes, nos services de marketing digital, de production audiovisuelle et nos solutions innovantes autour de l'IA.
                    </p>
                    <ul class="space-y-4 pt-4 text-gray-200">
                        <li class="flex items-center"><i class="fas fa-check-circle text-[#D4AF37] mr-3"></i>Catalogue PDF détaillé</li>
                        <li class="flex items-center"><i class="fas fa-check-circle text-[#D4AF37] mr-3"></i>Programmes de formations complets</li>
                        <li class="flex items-center"><i class="fas fa-check-circle text-[#D4AF37] mr-3"></i>Détail de nos offres et processus marketing</li>
                    </ul>
                </div>

                <!-- Form part -->
                <div class="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 relative">
                    <h2 class="text-2xl font-bold mb-6 text-center">Demandez votre exemplaire</h2>
                    <form id="catalogDemandForm" class="space-y-5" x-data="catalogForm()" @submit.prevent="submitForm">
                        
                        <div x-show="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <strong class="font-bold">Succès !</strong>
                            <span class="block sm:inline">Votre demande a été enregistrée. Le catalogue vous a été envoyé par email.</span>
                        </div>

                        <div x-show="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong class="font-bold">Erreur !</strong>
                            <span class="block sm:inline" x-text="errorMessage"></span>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Nom Complet *</label>
                            <input type="text" x-model="formData.name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none transition">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Email Professionnel *</label>
                            <input type="email" x-model="formData.email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none transition">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                            <input type="tel" x-model="formData.phone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none transition">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Entreprise</label>
                                <input type="text" x-model="formData.company" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none transition">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Fonction</label>
                                <input type="text" x-model="formData.role" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none transition">
                            </div>
                        </div>

                        <button type="submit" :disabled="loading" class="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-bold py-3 rounded-xl hover:shadow-lg transition flex justify-center items-center">
                            <span x-show="!loading">
                                <i class="fas fa-paper-plane mr-2"></i>Recevoir le Catalogue par Email
                            </span>
                            <span x-show="loading">
                                <i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...
                            </span>
                        </button>
                        
                        <p class="text-xs text-gray-500 text-center mt-4">
                            En soumettant ce formulaire, vous acceptez d'être contacté par CEM GROUP pour faire suite à votre demande.
                        </p>
                    </form>
                </div>
            </div>
        </div>

        <script>
            function catalogForm() {
                return {
                    formData: {
                        name: '',
                        email: '',
                        phone: '',
                        company: '',
                        role: '',
                        source: 'Site Web - Page Demande Catalogue'
                    },
                    loading: false,
                    success: false,
                    error: false,
                    errorMessage: '',

                    async submitForm() {
                        this.loading = true;
                        this.success = false;
                        this.error = false;
                        try {
                            const res = await fetch('/api/catalog-demand', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(this.formData)
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                this.success = true;
                                this.formData = { name: '', email: '', phone: '', company: '', role: '', source: 'Site Web - Page Demande Catalogue' };
                            } else {
                                this.error = true;
                                this.errorMessage = data.error || 'Erreur lors de la soumission.';
                            }
                        } catch (err) {
                            this.error = true;
                            this.errorMessage = 'Erreur réseau interceptée.';
                        }
                        this.loading = false;
                    }
                }
            }
        </script>

        <!-- Footer Minimaliste -->
        <footer class="bg-gray-900 text-white py-8 border-t border-gray-800 text-center">
            <div class="max-w-7xl mx-auto px-4">
                <img src="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1" alt="CEM GROUP Logo" class="h-10 mx-auto mb-4 filter grayscale brightness-200 opacity-50">
                <p class="text-gray-500 text-sm">&copy; 2026 CEM GROUP. Tous droits réservés.</p>
                <div class="mt-4 flex justify-center space-x-4">
                    <a href="mailto:contact@cembymazini.ma" class="text-gray-400 hover:text-white transition"><i class="fas fa-envelope"></i> contact@cembymazini.ma</a>
                    <span class="text-gray-700">|</span>
                    <a href="tel:+212688947098" class="text-gray-400 hover:text-white transition"><i class="fas fa-phone"></i> +212 6 88 94 70 98</a>
                </div>
            </div>
        </footer>

        ${popupHtml}
    </body>
    </html>
    `);
});

export default demandeCatalogueApp;
