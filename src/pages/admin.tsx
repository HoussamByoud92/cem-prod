import { Hono } from 'hono';
import { Bindings } from '../bindings';

const adminPagesApp = new Hono<{ Bindings: Bindings }>();

// ===== SHARED LAYOUT =====
const adminLayout = (content: string, title: string, script: string = '') => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - CEM GROUP Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Poppins', sans-serif; }
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-gray-100" x-data="layout()">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-black to-gray-900 text-white z-50">
        <div class="p-6">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                CEM GROUP
            </h1>
            <p class="text-sm text-gray-400 mt-1">Admin Dashboard</p>
        </div>

        <nav class="mt-6">
            <a href="/admin/dashboard" class="flex items-center px-6 py-3 ${title === 'Dashboard' ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-home w-6"></i>
                <span class="ml-3">Dashboard</span>
            </a>
            <a href="/admin/blog" class="flex items-center px-6 py-3 ${title.includes('Blog') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-blog w-6"></i>
                <span class="ml-3">Blog</span>
            </a>
            <a href="/admin/events" class="flex items-center px-6 py-3 ${title.includes('Événements') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-calendar-alt w-6"></i>
                <span class="ml-3">Événements</span>
            </a>
            <a href="/admin/plaquettes" class="flex items-center px-6 py-3 ${title.includes('Plaquettes') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-file-pdf w-6"></i>
                <span class="ml-3">Plaquettes</span>
            </a>
            <a href="/admin/formations" class="flex items-center px-6 py-3 ${title.includes('Formations') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-chalkboard-teacher w-6"></i>
                <span class="ml-3">Formations</span>
            </a>
            <a href="/admin/newsletter" class="flex items-center px-6 py-3 ${title.includes('Newsletter') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-envelope w-6"></i>
                <span class="ml-3">Newsletter</span>
            </a>
            <a href="/admin/recruitment" class="flex items-center px-6 py-3 ${title.includes('Recrutement') ? 'bg-[#D4AF37]/20 border-l-4 border-[#D4AF37] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white transition'}">
                <i class="fas fa-briefcase w-6"></i>
                <span class="ml-3">Recrutement</span>
            </a>
        </nav>

        <div class="absolute bottom-0 w-64 p-6 border-t border-gray-700">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-white"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-semibold" x-text="user.name || 'Admin'"></p>
                    <p class="text-xs text-gray-400" x-text="user.email || '...'"></p>
                </div>
            </div>
            <button @click="logout()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition">
                <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
            </button>
        </div>
    </div>

    <!-- Main Content -->
    <div class="ml-64 p-8">
        ${content}
    </div>

    <script>
        function layout() {
            return {
                user: {},
                init() {
                    const token = localStorage.getItem('admin_token');
                    if (!token) {
                        window.location.href = '/admin/login';
                        return;
                    }
                    this.user = JSON.parse(localStorage.getItem('admin_user') || '{}');
                },
                logout() {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_user');
                    window.location.href = '/admin/login';
                }
            }
        }
        ${script}
    </script>
</body>
</html>
`;

// Admin Login Page (No Layout)
adminPagesApp.get('/login', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login - CEM GROUP</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap');
            * { font-family: 'Poppins', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); }
            .gradient-text { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        </style>
    </head>
    <body class="gradient-bg min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full">
            <div class="text-center mb-8">
                <h1 class="text-5xl font-bold gradient-text mb-2">CEM GROUP</h1>
                <p class="text-white/70">Administration Dashboard</p>
            </div>
            <div class="bg-white rounded-2xl shadow-2xl p-8">
                <div class="text-center mb-6">
                    <div class="inline-block p-4 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-full mb-4">
                        <i class="fas fa-lock text-white text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900">Connexion Admin</h2>
                </div>
                <form id="loginForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input type="email" id="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] transition">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                        <input type="password" id="password" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] transition">
                    </div>
                    <div id="error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <span id="errorMessage"></span>
                    </div>
                    <button type="submit" class="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition duration-200">
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
        <script>
            console.log('Login script loaded');
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                console.log('Login form found');
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    console.log('Form submitted');
                    
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    const errorDiv = document.getElementById('error');
                    const errorMessage = document.getElementById('errorMessage');
                    
                    // Show loading state
                    const btn = document.querySelector('button[type="submit"]');
                    const originalText = btn.innerText;
                    btn.innerText = 'Connexion...';
                    btn.disabled = true;

                    try {
                        console.log('Fetching /api/admin/login...');
                        const response = await fetch('/api/admin/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password }),
                        });
                        console.log('Response status:', response.status);
                        
                        const data = await response.json();
                        console.log('Response data:', data);
                        
                        if (response.ok) {
                            alert('Connexion réussie! Redirection...');
                            localStorage.setItem('admin_token', data.token);
                            localStorage.setItem('admin_user', JSON.stringify(data.user));
                            window.location.href = '/admin/dashboard';
                        } else {
                            const msg = data.error || 'Identifiants invalides';
                            alert('Erreur: ' + msg);
                            errorMessage.textContent = msg;
                            errorDiv.classList.remove('hidden');
                        }
                    } catch (error) {
                        console.error('Login error:', error);
                        alert('Erreur réseau ou serveur: ' + error.message);
                        errorMessage.textContent = 'Erreur de connexion: ' + error.message;
                        errorDiv.classList.remove('hidden');
                    } finally {
                        btn.innerText = originalText;
                        btn.disabled = false;
                    }
                });
            } else {
                console.error('Login form NOT found');
                alert('Erreur critique: Formulaire non trouvé');
            }
        </script>
    </body>
    </html>
    `);
});

// Dashboard Page
adminPagesApp.get('/dashboard', (c) => {
    return c.html(adminLayout(`
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Tableau de bord</h2>
            <p class="text-gray-600 mt-2">Vue d'ensemble de votre contenu</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" x-data="dashboardStats()">
            <!-- Blog Stats -->
            <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-semibold">Articles</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" x-text="stats.totalBlogs || 0"></p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-blog text-blue-500 text-xl"></i>
                    </div>
                </div>
            </div>
            <!-- Similarly for other stats... -->
             <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-semibold">Événements</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" x-text="stats.totalEvents || 0"></p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-calendar-alt text-purple-500 text-xl"></i>
                    </div>
                </div>
            </div>
             <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-semibold">Plaquettes</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" x-text="stats.totalPlaquettes || 0"></p>
                    </div>
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-file-pdf text-red-500 text-xl"></i>
                    </div>
                </div>
            </div>
             <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-semibold">Abonnés</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" x-text="stats.totalSubscribers || 0"></p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-envelope text-green-500 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Actions rapides</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <a href="/admin/blog/create" class="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition">
                    <i class="fas fa-plus-circle mr-2"></i> Nouvel article
                </a>
                <a href="/admin/events/create" class="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition">
                    <i class="fas fa-calendar-plus mr-2"></i> Nouvel événement
                </a>
                 <a href="/admin/plaquettes/create" class="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition">
                    <i class="fas fa-upload mr-2"></i> Upload PDF
                </a>
                 <a href="/admin/newsletter" class="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition">
                    <i class="fas fa-paper-plane mr-2"></i> Campagne
                </a>
            </div>
        </div>
    `, 'Dashboard', `
        function dashboardStats() {
            return {
                stats: {},
                async init() {
                    const token = localStorage.getItem('admin_token');
                    try {
                        const res = await fetch('/api/admin/stats', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if(res.ok) this.stats = await res.json();
                    } catch(e) { console.error(e); }
                }
            }
        }
    `));
});

// Blog List Page
adminPagesApp.get('/blog', (c) => {
    return c.html(adminLayout(`
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">Blog</h2>
                <p class="text-gray-600 mt-1">Gérez vos articles de blog</p>
            </div>
            <a href="/admin/blog/create" class="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
                <i class="fas fa-plus mr-2"></i>Nouvel article
            </a>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden" x-data="blogList()">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template x-for="post in posts" :key="post.id">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900" x-text="post.title"></div>
                                    <div class="text-sm text-gray-500" x-text="post.slug"></div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="post.author"></td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                          :class="post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                                          x-text="post.status">
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="new Date(post.createdAt).toLocaleDateString()"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a :href="'/admin/blog/edit/' + post.id" class="text-blue-600 hover:text-blue-900 mr-4"><i class="fas fa-edit"></i></a>
                                    <button @click="deletePost(post.id)" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        </template>
                        <tr x-show="posts.length === 0">
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                                <span x-show="loading">Chargement...</span>
                                <span x-show="!loading">Aucun article trouvé.</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `, 'Blog Management', `
        function blogList() {
            return {
                posts: [],
                loading: true,
                async init() {
                    const token = localStorage.getItem('admin_token');
                    try {
                        const res = await fetch('/api/admin/blog', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if(res.ok) this.posts = await res.json();
                    } catch(e) { console.error(e); }
                    this.loading = false;
                },
                async deletePost(id) {
                    if(!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
                    const token = localStorage.getItem('admin_token');
                    try {
                        const res = await fetch('/api/admin/blog/' + id, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if(res.ok) {
                            this.posts = this.posts.filter(p => p.id !== id);
                        } else {
                            alert('Erreur lors de la suppression');
                        }
                    } catch(e) { alert('Erreur réseau'); }
                }
            }
        }
    `));
});

// Blog Create/Edit Page
const blogEditor = (isEdit = false) => `
    <div class="max-w-4xl mx-auto" x-data="blogForm(${isEdit})">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900" x-text="isEdit ? 'Modifier l\\'article' : 'Nouvel article'"></h2>
            <a href="/admin/blog" class="text-gray-600 hover:text-gray-900">
                <i class="fas fa-arrow-left mr-2"></i>Retour
            </a>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-8">
            <form @submit.prevent="submitForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                        <input type="text" x-model="form.title" @input="generateSlug" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Slug (URL)</label>
                        <input type="text" x-model="form.slug" required class="w-full px-4 py-2 border rounded-lg bg-gray-50">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Extrait / Description courte</label>
                    <textarea x-model="form.excerpt" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Contenu (HTML)</label>
                    <textarea x-model="form.content" rows="10" class="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#D4AF37]"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Vous pouvez utiliser du HTML directement.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Auteur</label>
                        <input type="text" x-model="form.author" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                        <input type="text" x-model="form.category" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-image mr-2"></i>Image de couverture</label>
                    <div 
                        @dragover.prevent="dragOver = true"
                        @dragleave.prevent="dragOver = false"
                        @drop.prevent="handleDrop($event, 'coverImage', 'blog')"
                        :class="{ 'border-[#D4AF37] bg-yellow-50': dragOver }"
                        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all hover:border-gray-400"
                    >
                        <input type="file" accept="image/*" @change="handleFileSelect($event, 'coverImage', 'blog')" class="hidden" id="file-coverImage" />
                        
                        <label for="file-coverImage" class="cursor-pointer" x-show="!form.coverImage && !uploadingFile">
                            <div><i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-3"></i></div>
                            <p class="text-sm text-gray-600 font-medium">Glisser-déposer ou <span class="text-[#D4AF37] underline">cliquez ici</span></p>
                            <p class="text-xs text-gray-400 mt-2">JPG, PNG, GIF — Max 5MB</p>
                        </label>
                        
                        <div x-show="uploadingFile" x-cloak class="py-4">
                            <div class="flex items-center justify-center space-x-3">
                                <div class="animate-spin rounded-full h-10 w-10 border-4 border-[#D4AF37] border-t-transparent"></div>
                                <span class="text-sm text-gray-600 font-medium">Téléchargement...</span>
                            </div>
                        </div>
                        
                        <div x-show="form.coverImage && !uploadingFile" x-cloak>
                            <img :src="form.coverImage" class="max-h-52 mx-auto rounded-lg shadow-md" />
                            <div class="mt-3 flex gap-2 justify-center">
                                <label for="file-coverImage" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm cursor-pointer"><i class="fas fa-sync-alt mr-1"></i>Remplacer</label>
                                <button @click.prevent="form.coverImage = ''" type="button" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"><i class="fas fa-trash mr-1"></i>Supprimer</button>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" x-model="form.coverImage" />
                </div>

                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" x-model="form.isPublished" class="w-5 h-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]">
                        <span class="text-gray-900 font-medium">Publier immédiatement</span>
                    </label>
                </div>

                <div class="pt-4 border-t flex justify-end gap-4">
                    <a href="/admin/blog" class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">Annuler</a>
                    <button type="submit" class="bg-[#D4AF37] text-white px-8 py-2 rounded-lg hover:bg-[#B8941F] transition shadow-lg font-bold">
                        <span x-show="!saving">Enregistrer</span>
                        <span x-show="saving">Enregistrement...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
`;

const blogScript = (isEdit = false) => `
    function blogForm(isEdit) {
        return {
            isEdit: isEdit,
            saving: false,
            uploadingFile: false,
            dragOver: false,
            form: {
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                author: 'Admin',
                category: '',
                coverImage: '',
                isPublished: false,
                status: 'draft'
            },
            async init() {
                if (this.isEdit) {
                    const id = window.location.pathname.split('/').pop();
                    await this.loadPost(id);
                }
            },
            async loadPost(id) {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/blog/' + id, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        this.form = { ...data, isPublished: data.status === 'published' };
                    }
                } catch(e) { console.error(e); }
            },
            generateSlug() {
                if (!this.isEdit) {
                    this.form.slug = this.form.title
                        .toLowerCase()
                        .replace(/[^\\w ]+/g, '')
                        .replace(/ +/g, '-');
                }
            },
            async handleFileSelect(event, fieldName, folder) {
                const file = event.target.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async handleDrop(event, fieldName, folder) {
                this.dragOver = false;
                const file = event.dataTransfer.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async uploadFile(file, fieldName, folder) {
                if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                    alert('Type de fichier non supporté.');
                    return;
                }
                const maxSize = file.type === 'application/pdf' ? 20*1024*1024 : 5*1024*1024;
                if (file.size > maxSize) {
                    alert('Fichier trop volumineux. Max: ' + (maxSize/1024/1024) + 'MB');
                    return;
                }
                this.uploadingFile = true;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'cem-group/' + folder);
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: fd
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.form[fieldName] = data.url;
                    } else {
                        alert('Erreur: ' + (data.error || 'Upload failed'));
                    }
                } catch(e) {
                    console.error(e);
                    alert('Erreur réseau lors du téléchargement');
                }
                this.uploadingFile = false;
            },
            async submitForm() {
                this.saving = true;
                this.form.status = this.form.isPublished ? 'published' : 'draft';
                const token = localStorage.getItem('admin_token');
                const url = this.isEdit 
                    ? '/api/admin/blog/' + window.location.pathname.split('/').pop()
                    : '/api/admin/blog';
                const method = this.isEdit ? 'PUT' : 'POST';

                try {
                    const res = await fetch(url, {
                        method: method,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token 
                        },
                        body: JSON.stringify(this.form)
                    });
                    
                    if (res.ok) {
                        window.location.href = '/admin/blog';
                    } else {
                        alert('Erreur lors de l\\'enregistrement');
                    }
                } catch(e) { 
                    console.error(e);
                    alert('Erreur réseau'); 
                } finally {
                    this.saving = false;
                }
            }
        }
    }
`;

adminPagesApp.get('/blog/create', (c) => c.html(adminLayout(blogEditor(false), 'Créer un article', blogScript(false))));
adminPagesApp.get('/blog/edit/:id', (c) => c.html(adminLayout(blogEditor(true), 'Modifier un article', blogScript(true))));


// ===== EVENTS MANAGEMENT =====
adminPagesApp.get('/events', (c) => c.html(adminLayout(`
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-3xl font-bold text-gray-900">Événements</h2>
            <p class="text-gray-600 mt-1">Gérez vos événements à venir et passés</p>
        </div>
        <a href="/admin/events/create" class="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
            <i class="fas fa-plus mr-2"></i>Nouvel événement
        </a>
    </div>

    <div class="bg-white rounded-xl shadow-lg overflow-hidden" x-data="eventsList()">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Épinglé</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <template x-for="event in events" :key="event.id">
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900" x-text="event.title"></div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="new Date(event.date).toLocaleDateString()"></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="event.location"></td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <span x-show="event.isPinned" class="text-[#D4AF37]"><i class="fas fa-thumbtack"></i></span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a :href="'/admin/events/edit/' + event.id" class="text-blue-600 hover:text-blue-900 mr-4"><i class="fas fa-edit"></i></a>
                                <button @click="deleteEvent(event.id)" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    </template>
                     <tr x-show="events.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                            <span x-show="loading">Chargement...</span>
                            <span x-show="!loading">Aucun événement trouvé.</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
`, 'Événements', `
    function eventsList() {
        return {
            events: [],
            loading: true,
            async init() {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/events', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if(res.ok) this.events = await res.json();
                } catch(e) { console.error(e); }
                this.loading = false;
            },
            async deleteEvent(id) {
                if(!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/events/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
                    if(res.ok) this.events = this.events.filter(e => e.id !== id);
                } catch(e) { alert('Erreur réseau'); }
            }
        }
    }
`)));

const eventEditor = (isEdit = false) => `
    <div class="max-w-4xl mx-auto" x-data="eventForm(${isEdit})">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900" x-text="isEdit ? 'Modifier l\\'événement' : 'Nouvel événement'"></h2>
            <a href="/admin/events" class="text-gray-600 hover:text-gray-900"><i class="fas fa-arrow-left mr-2"></i>Retour</a>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8">
            <form @submit.prevent="submitForm" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                    <input type="text" x-model="form.title" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                        <input type="date" x-model="form.date" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Lieu</label>
                        <input type="text" x-model="form.location" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea x-model="form.description" rows="4" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Lien d'inscription (Optionnel)</label>
                    <input type="url" x-model="form.registrationLink" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                </div>
                 <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-image mr-2"></i>Image de l'événement</label>
                    <div 
                        @dragover.prevent="dragOver = true"
                        @dragleave.prevent="dragOver = false"
                        @drop.prevent="handleDrop($event, 'image', 'events')"
                        :class="{ 'border-[#D4AF37] bg-yellow-50': dragOver }"
                        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all hover:border-gray-400"
                    >
                        <input type="file" accept="image/*" @change="handleFileSelect($event, 'image', 'events')" class="hidden" id="file-event-image" />
                        <label for="file-event-image" class="cursor-pointer" x-show="!form.image && !uploadingFile">
                            <div><i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-3"></i></div>
                            <p class="text-sm text-gray-600 font-medium">Glisser-déposer ou <span class="text-[#D4AF37] underline">cliquez ici</span></p>
                            <p class="text-xs text-gray-400 mt-2">JPG, PNG, GIF — Max 5MB</p>
                        </label>
                        <div x-show="uploadingFile" x-cloak class="py-4">
                            <div class="flex items-center justify-center space-x-3">
                                <div class="animate-spin rounded-full h-10 w-10 border-4 border-[#D4AF37] border-t-transparent"></div>
                                <span class="text-sm text-gray-600 font-medium">Téléchargement...</span>
                            </div>
                        </div>
                        <div x-show="form.image && !uploadingFile" x-cloak>
                            <img :src="form.image" class="max-h-52 mx-auto rounded-lg shadow-md" />
                            <div class="mt-3 flex gap-2 justify-center">
                                <label for="file-event-image" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm cursor-pointer"><i class="fas fa-sync-alt mr-1"></i>Remplacer</label>
                                <button @click.prevent="form.image = ''" type="button" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"><i class="fas fa-trash mr-1"></i>Supprimer</button>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" x-model="form.image" />
                </div>
                <div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" x-model="form.isPinned" class="w-5 h-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]">
                        <span class="text-gray-900 font-medium">Épingler cet événement (Mettre en avant)</span>
                    </label>
                </div>
                <div class="pt-4 border-t flex justify-end gap-4">
                    <a href="/admin/events" class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">Annuler</a>
                    <button type="submit" class="bg-[#D4AF37] text-white px-8 py-2 rounded-lg hover:bg-[#B8941F] transition shadow-lg font-bold">
                        <span x-show="!saving">Enregistrer</span>
                        <span x-show="saving">...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
const eventScript = (isEdit = false) => `
    function eventForm(isEdit) {
        return {
            isEdit, saving: false, uploadingFile: false, dragOver: false,
            form: { title: '', date: '', location: '', description: '', registrationLink: '', image: '', isPinned: false },
            async init() {
                if(this.isEdit) {
                    const id = window.location.pathname.split('/').pop();
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/events/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
                    if(res.ok) {
                        const data = await res.json();
                        // Format date to YYYY-MM-DD for input[type=date]
                        if (data.date) {
                            data.date = new Date(data.date).toISOString().split('T')[0];
                        }
                        this.form = data;
                    }
                }
            },
            async handleFileSelect(event, fieldName, folder) {
                const file = event.target.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async handleDrop(event, fieldName, folder) {
                this.dragOver = false;
                const file = event.dataTransfer.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async uploadFile(file, fieldName, folder) {
                if (!file.type.startsWith('image/')) { alert('Seules les images sont acceptées.'); return; }
                if (file.size > 5*1024*1024) { alert('Image trop volumineuse. Max: 5MB'); return; }
                this.uploadingFile = true;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'cem-group/' + folder);
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: fd
                    });
                    const data = await res.json();
                    if (data.success) { this.form[fieldName] = data.url; }
                    else { alert('Erreur: ' + (data.error || 'Upload failed')); }
                } catch(e) { console.error(e); alert('Erreur réseau'); }
                this.uploadingFile = false;
            },
            async submitForm() {
                this.saving = true;
                const token = localStorage.getItem('admin_token');
                const url = this.isEdit ? '/api/admin/events/' + window.location.pathname.split('/').pop() : '/api/admin/events';
                const method = this.isEdit ? 'PUT' : 'POST';
                try {
                    const res = await fetch(url, {
                        method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify(this.form)
                    });
                    if(res.ok) window.location.href = '/admin/events';
                    else alert('Erreur');
                } catch(e) { alert('Erreur réseau'); }
                this.saving = false;
            }
        }
    }
`;
adminPagesApp.get('/events/create', (c) => c.html(adminLayout(eventEditor(false), 'Nouvel événement', eventScript(false))));
adminPagesApp.get('/events/edit/:id', (c) => c.html(adminLayout(eventEditor(true), 'Modifier événement', eventScript(true))));

// ===== PLAQUETTES MANAGEMENT =====
adminPagesApp.get('/plaquettes', (c) => c.html(adminLayout(`
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-3xl font-bold text-gray-900">Plaquettes</h2>
            <p class="text-gray-600 mt-1">Gérez les documents PDF téléchargeables</p>
        </div>
        <a href="/admin/plaquettes/create" class="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
            <i class="fas fa-upload mr-2"></i>Nouveau PDF
        </a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" x-data="plaquettesList()">
        <template x-for="pdf in plaquettes" :key="pdf.id">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative group">
                    <img :src="pdf.thumbnail || 'https://via.placeholder.com/300x400?text=PDF'" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                        <a :href="pdf.url" target="_blank" class="text-white hover:text-[#D4AF37]"><i class="fas fa-eye fa-lg"></i></a>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-gray-900 mb-2" x-text="pdf.name"></h3>
                    <p class="text-sm text-gray-500 mb-4" x-text="pdf.description || 'Aucune description'"></p>
                    <div class="flex justify-between items-center text-sm">
                         <span class="text-gray-400" x-text="new Date(pdf.uploadedAt).toLocaleDateString()"></span>
                         <button @click="deletePdf(pdf.id)" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i> Supprimer</button>
                    </div>
                </div>
            </div>
        </template>
        <div x-show="plaquettes.length === 0 && !loading" class="col-span-full text-center py-12 text-gray-500">
            Aucune plaquette trouvée.
        </div>
    </div>
`, 'Plaquettes', `
    function plaquettesList() {
        return {
            plaquettes: [],
            loading: true,
            async init() {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/plaquettes', { headers: { 'Authorization': 'Bearer ' + token } });
                    if(res.ok) this.plaquettes = await res.json();
                } catch(e) {}
                this.loading = false;
            },
            async deletePdf(id) {
                if(!confirm('Supprimer ce document ?')) return;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/plaquettes/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
                    if(res.ok) this.plaquettes = this.plaquettes.filter(p => p.id !== id);
                } catch(e) { alert('Erreur'); }
            }
        }
    }
`)));

const plaquetteEditor = () => `
    <div class="max-w-2xl mx-auto" x-data="plaquetteForm()">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Ajouter une plaquette</h2>
            <a href="/admin/plaquettes" class="text-gray-600 hover:text-gray-900"><i class="fas fa-arrow-left mr-2"></i>Retour</a>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8">
            <form @submit.prevent="submitForm" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Nom du document</label>
                    <input type="text" x-model="form.name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea x-model="form.description" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-file-pdf mr-2 text-red-500"></i>Fichier PDF</label>
                    <div 
                        @dragover.prevent="dragOver = true"
                        @dragleave.prevent="dragOver = false"
                        @drop.prevent="handleDrop($event, 'url', 'plaquettes')"
                        :class="{ 'border-red-400 bg-red-50': dragOver }"
                        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all hover:border-gray-400"
                    >
                        <input type="file" accept="application/pdf" @change="handleFileSelect($event, 'url', 'plaquettes')" class="hidden" id="file-pdf-url" />
                        <label for="file-pdf-url" class="cursor-pointer" x-show="!form.url && !uploadingPdf">
                            <div><i class="fas fa-file-pdf text-5xl text-red-400 mb-3"></i></div>
                            <p class="text-sm text-gray-600 font-medium">Glisser-déposer ou <span class="text-[#D4AF37] underline">cliquez ici</span></p>
                            <p class="text-xs text-gray-400 mt-2">PDF — Max 20MB</p>
                        </label>
                        <div x-show="uploadingPdf" x-cloak class="py-4">
                            <div class="flex items-center justify-center space-x-3">
                                <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
                                <span class="text-sm text-gray-600 font-medium">Téléchargement du PDF...</span>
                            </div>
                        </div>
                        <div x-show="form.url && !uploadingPdf" x-cloak>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                                <i class="fas fa-file-pdf text-5xl text-red-500 mb-2"></i>
                                <p class="text-sm text-green-700 font-medium">✓ PDF téléchargé</p>
                            </div>
                            <div class="mt-3 flex gap-2 justify-center">
                                <label for="file-pdf-url" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm cursor-pointer"><i class="fas fa-sync-alt mr-1"></i>Remplacer</label>
                                <button @click.prevent="form.url = ''" type="button" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"><i class="fas fa-trash mr-1"></i>Supprimer</button>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" x-model="form.url" />
                </div>
                 <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-image mr-2"></i>Vignette (optionnel)</label>
                    <div 
                        @dragover.prevent="dragOverThumb = true"
                        @dragleave.prevent="dragOverThumb = false"
                        @drop.prevent="handleDropThumb($event)"
                        :class="{ 'border-[#D4AF37] bg-yellow-50': dragOverThumb }"
                        class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-all hover:border-gray-400"
                    >
                        <input type="file" accept="image/*" @change="handleThumbSelect($event)" class="hidden" id="file-thumbnail" />
                        <label for="file-thumbnail" class="cursor-pointer" x-show="!form.thumbnail && !uploadingThumb">
                            <i class="fas fa-image text-3xl text-gray-400 mb-2"></i>
                            <p class="text-xs text-gray-600">Ajouter une vignette</p>
                        </label>
                        <div x-show="uploadingThumb" x-cloak class="py-2">
                            <div class="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent mx-auto"></div>
                        </div>
                        <div x-show="form.thumbnail && !uploadingThumb" x-cloak>
                            <img :src="form.thumbnail" class="max-h-32 mx-auto rounded-lg shadow-sm" />
                            <div class="mt-2 flex gap-2 justify-center">
                                <label for="file-thumbnail" class="text-xs text-blue-600 cursor-pointer hover:underline">Remplacer</label>
                                <button @click.prevent="form.thumbnail = ''" type="button" class="text-xs text-red-600 hover:underline">Supprimer</button>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" x-model="form.thumbnail" />
                </div>
                <div class="pt-4 border-t flex justify-end gap-4">
                    <a href="/admin/plaquettes" class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">Annuler</a>
                    <button type="submit" class="bg-[#D4AF37] text-white px-8 py-2 rounded-lg hover:bg-[#B8941F] transition shadow-lg font-bold">
                        <span x-show="!saving">Ajouter</span>
                        <span x-show="saving">Ajout...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
const plaquetteScript = () => `
    function plaquetteForm() {
        return {
            saving: false,
            uploadingPdf: false,
            uploadingThumb: false,
            dragOver: false,
            dragOverThumb: false,
            form: { name: '', description: '', url: '', thumbnail: '' },
            async handleFileSelect(event, fieldName, folder) {
                const file = event.target.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async handleDrop(event, fieldName, folder) {
                this.dragOver = false;
                const file = event.dataTransfer.files[0];
                if (!file) return;
                await this.uploadFile(file, fieldName, folder);
            },
            async handleThumbSelect(event) {
                const file = event.target.files[0];
                if (!file) return;
                await this.uploadThumb(file);
            },
            async handleDropThumb(event) {
                this.dragOverThumb = false;
                const file = event.dataTransfer.files[0];
                if (!file) return;
                await this.uploadThumb(file);
            },
            async uploadFile(file, fieldName, folder) {
                if (file.type !== 'application/pdf') { alert('Seuls les fichiers PDF sont acceptés.'); return; }
                if (file.size > 20*1024*1024) { alert('Fichier trop volumineux. Max: 20MB'); return; }
                this.uploadingPdf = true;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'cem-group/' + folder);
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: fd
                    });
                    const data = await res.json();
                    if (data.success) { this.form[fieldName] = data.url; }
                    else { alert('Erreur: ' + (data.error || 'Upload failed')); }
                } catch(e) { console.error(e); alert('Erreur réseau'); }
                this.uploadingPdf = false;
            },
            async uploadThumb(file) {
                if (!file.type.startsWith('image/')) { alert('Seules les images sont acceptées.'); return; }
                if (file.size > 5*1024*1024) { alert('Image trop volumineuse. Max: 5MB'); return; }
                this.uploadingThumb = true;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'cem-group/plaquettes');
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: fd
                    });
                    const data = await res.json();
                    if (data.success) { this.form.thumbnail = data.url; }
                    else { alert('Erreur: ' + (data.error || 'Upload failed')); }
                } catch(e) { console.error(e); alert('Erreur réseau'); }
                this.uploadingThumb = false;
            },
            async submitForm() {
                this.saving = true;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/plaquettes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify(this.form)
                    });
                    if(res.ok) window.location.href = '/admin/plaquettes';
                    else alert('Erreur');
                } catch(e) { alert('Erreur réseau'); }
                this.saving = false;
            }
        }
    }
`;
adminPagesApp.get('/plaquettes/create', (c) => c.html(adminLayout(plaquetteEditor(), 'Ajouter Plaquette', plaquetteScript())));



// ===== NEWSLETTER MANAGEMENT =====
adminPagesApp.get('/newsletter', (c) => c.html(adminLayout(`
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-3xl font-bold text-gray-900">Newsletter</h2>
            <p class="text-gray-600 mt-1">Gérez vos abonnés et vos campagnes</p>
        </div>
        <div class="flex gap-4">
            <button onclick="exportSubscribers()" class="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition shadow-sm">
                <i class="fas fa-download mr-2"></i>Exporter CSV
            </button>
            <a href="/admin/newsletter/campaigns" class="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
                <i class="fas fa-paper-plane mr-2"></i>Nouvelle campagne
            </a>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" x-data="newsletter()">
        <!-- Subscribers List -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 class="font-bold text-gray-900">Abonnés récents</h3>
                <span class="text-sm text-gray-500" x-text="subscribers.length + ' total'"></span>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template x-for="sub in subscribers" :key="sub.email">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" x-text="sub.email"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="sub.subscribedAt || sub.date || '-'"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span class="px-2 py-1 text-xs rounded-full" :class="sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" x-text="sub.status || 'active'"></span>
                                </td>
                            </tr>
                        </template>
                        <tr x-show="subscribers.length === 0">
                            <td colspan="3" class="px-6 py-4 text-center text-gray-500">Aucun abonné pour le moment.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Quick Send -->
        <div class="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h3 class="font-bold text-gray-900 mb-4">Envoyer un email rapide</h3>
            <form @submit.prevent="sendEmail" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Sujet</label>
                    <input type="text" x-model="email.subject" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Message (HTML)</label>
                    <textarea x-model="email.content" rows="6" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]"></textarea>
                </div>
                <button type="submit" :disabled="sending" class="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
                    <span x-text="sending ? 'Envoi...' : 'Envoyer via Brevo'"></span>
                </button>
            </form>
        </div>
    </div>

    <script>
        function exportSubscribers() {
            alert('Fonctionnalité à venir: Export CSV');
        }
    </script>
`, 'Newsletter', `
    function newsletter() {
        return {
            subscribers: [],
            email: { subject: '', content: '' },
            sending: false,
            async init() {
                var token = localStorage.getItem('admin_token');
                try {
                    var res = await fetch('/api/admin/newsletter/subscribers', { headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                        var data = await res.json();
                        this.subscribers = data.subscribers || data || [];
                    }
                } catch(e) { console.error('Load error:', e); }
            },
            async sendEmail() {
                if (!this.email.subject || !this.email.content) { alert('Veuillez remplir le sujet et le message.'); return; }
                this.sending = true;
                var token = localStorage.getItem('admin_token');
                try {
                    var res = await fetch('/api/admin/newsletter/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ subject: this.email.subject, htmlContent: this.email.content })
                    });
                    var data = await res.json();
                    if (data.success) {
                        alert('Newsletter envoyée avec succès !');
                        this.email = { subject: '', content: '' };
                    } else {
                        alert('Erreur: ' + (data.error || 'Échec'));
                    }
                } catch(e) { alert('Erreur réseau'); }
                this.sending = false;
            }
        }
    }
`)));


// ===== CAMPAIGNS MANAGEMENT =====
adminPagesApp.get('/newsletter/campaigns', (c) => c.html(adminLayout(`
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-3xl font-bold text-gray-900">Campagnes Email</h2>
            <p class="text-gray-600 mt-1">Créez et gérez vos campagnes marketing</p>
        </div>
        <a href="/admin/newsletter" class="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition shadow-sm">
            <i class="fas fa-arrow-left mr-2"></i>Retour Newsletter
        </a>
    </div>

    <div x-data="campaigns()">
        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-5 border-t-4 border-blue-500">
                <div class="text-sm text-gray-500 mb-1">Campagnes</div>
                <div class="text-2xl font-bold text-gray-900" x-text="allCampaigns.length">0</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-5 border-t-4 border-green-500">
                <div class="text-sm text-gray-500 mb-1">Total Envoyés</div>
                <div class="text-2xl font-bold text-gray-900" x-text="globalStats.sent">0</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-5 border-t-4 border-purple-500">
                <div class="text-sm text-gray-500 mb-1">Taux d'ouverture</div>
                <div class="text-2xl font-bold text-gray-900" x-text="globalStats.openRate + '%'">0%</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-5 border-t-4 border-yellow-500">
                <div class="text-sm text-gray-500 mb-1">Taux de clics</div>
                <div class="text-2xl font-bold text-gray-900" x-text="globalStats.clickRate + '%'">0%</div>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-5 border-t-4 border-red-500">
                <div class="text-sm text-gray-500 mb-1">Bounces</div>
                <div class="text-2xl font-bold text-gray-900" x-text="globalStats.bounces">0</div>
            </div>
        </div>

        <!-- Create Campaign -->
        <div class="bg-white rounded-xl shadow-lg mb-8" x-show="showCreateForm">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 class="font-bold text-gray-900"><i class="fas fa-plus-circle mr-2 text-[#D4AF37]"></i>Nouvelle campagne</h3>
                <button @click="showCreateForm = false" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
            </div>
            <form @submit.prevent="createCampaign" class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nom de la campagne</label>
                        <input type="text" x-model="form.name" required placeholder="Ex: Newsletter Février" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Sujet de l'email</label>
                        <input type="text" x-model="form.subject" required placeholder="Ex: Nos dernières actualités" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Liste de destinataires</label>
                    <select x-model="form.listId" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent">
                        <option value="">Sélectionner une liste...</option>
                        <template x-for="list in lists" :key="list.id">
                            <option :value="list.id" x-text="list.name + ' (' + list.totalSubscribers + ' contacts)'"></option>
                        </template>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Contenu HTML</label>
                    <textarea x-model="form.htmlContent" rows="10" required placeholder="Collez votre HTML ici ou écrivez votre message..." class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent font-mono text-sm"></textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Planifier l'envoi (optionnel)</label>
                        <input type="datetime-local" x-model="form.scheduledAt" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent">
                    </div>
                    <div class="flex items-end gap-4">
                        <button type="submit" class="flex-1 bg-[#D4AF37] text-white py-2.5 px-6 rounded-lg hover:bg-[#B8941F] transition font-semibold" :disabled="creating">
                            <span x-show="!creating"><i class="fas fa-paper-plane mr-2"></i>Lancer la campagne</span>
                            <span x-show="creating"><i class="fas fa-spinner fa-spin mr-2"></i>Création...</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <button x-show="!showCreateForm" @click="showCreateForm = true" class="mb-6 bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
            <i class="fas fa-plus mr-2"></i>Nouvelle campagne
        </button>

        <!-- Campaigns List -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="font-bold text-gray-900"><i class="fas fa-list mr-2 text-[#D4AF37]"></i>Historique des campagnes</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sujet</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Envoyés</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ouvertures</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clics</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template x-for="c in allCampaigns" :key="c.id">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" x-text="c.name"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600" x-text="c.subject"></td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full"
                                        :class="{
                                            'bg-green-100 text-green-800': c.status === 'sent',
                                            'bg-blue-100 text-blue-800': c.status === 'draft',
                                            'bg-yellow-100 text-yellow-800': c.status === 'queued' || c.status === 'scheduled',
                                            'bg-gray-100 text-gray-800': !['sent','draft','queued','scheduled'].includes(c.status)
                                        }"
                                        x-text="c.status === 'sent' ? 'Envoyée' : c.status === 'draft' ? 'Brouillon' : c.status === 'queued' ? 'En file' : c.status === 'scheduled' ? 'Planifiée' : c.status">
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                    <span x-text="c.statistics?.globalStats?.sent || '-'"></span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                    <span x-text="c.statistics?.globalStats?.uniqueOpens || '-'"></span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                    <span x-text="c.statistics?.globalStats?.uniqueClicks || '-'"></span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <button @click="viewStats(c.id)" class="text-[#D4AF37] hover:text-[#B8941F] mr-2" title="Voir KPIs">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                </td>
                            </tr>
                        </template>
                        <tr x-show="allCampaigns.length === 0 && !loading">
                            <td colspan="7" class="px-6 py-8 text-center text-gray-500">Aucune campagne pour le moment.</td>
                        </tr>
                        <tr x-show="loading">
                            <td colspan="7" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Stats Modal -->
        <div x-show="showStatsModal" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showStatsModal = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 class="font-bold text-gray-900"><i class="fas fa-chart-line mr-2 text-[#D4AF37]"></i>KPIs de campagne</h3>
                    <button @click="showStatsModal = false" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-6" x-show="selectedStats">
                    <div class="mb-4">
                        <h4 class="text-xl font-bold text-gray-900" x-text="selectedStats?.name"></h4>
                        <p class="text-gray-500 text-sm" x-text="'Sujet: ' + (selectedStats?.subject || '')"></p>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-blue-600" x-text="selectedStats?.sent || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Envoyés</div>
                        </div>
                        <div class="bg-green-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-green-600" x-text="selectedStats?.delivered || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Délivrés</div>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-purple-600" x-text="selectedStats?.opens || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Ouvertures</div>
                        </div>
                        <div class="bg-yellow-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-yellow-600" x-text="selectedStats?.clicks || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Clics</div>
                        </div>
                        <div class="bg-red-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-red-600" x-text="selectedStats?.bounces || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Bounces</div>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4 text-center">
                            <div class="text-3xl font-bold text-gray-600" x-text="selectedStats?.unsubscriptions || 0"></div>
                            <div class="text-xs text-gray-500 mt-1">Désabonnements</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div class="bg-white border rounded-xl p-3 text-center">
                            <div class="text-lg font-bold text-purple-600" x-text="(selectedStats?.openRate || 0).toFixed(1) + '%'"></div>
                            <div class="text-xs text-gray-500">Taux ouverture</div>
                        </div>
                        <div class="bg-white border rounded-xl p-3 text-center">
                            <div class="text-lg font-bold text-yellow-600" x-text="(selectedStats?.clickRate || 0).toFixed(1) + '%'"></div>
                            <div class="text-xs text-gray-500">Taux clics</div>
                        </div>
                        <div class="bg-white border rounded-xl p-3 text-center">
                            <div class="text-lg font-bold text-red-600" x-text="(selectedStats?.bounceRate || 0).toFixed(1) + '%'"></div>
                            <div class="text-xs text-gray-500">Taux bounce</div>
                        </div>
                        <div class="bg-white border rounded-xl p-3 text-center">
                            <div class="text-lg font-bold text-gray-600" x-text="(selectedStats?.unsubscriptionRate || 0).toFixed(1) + '%'"></div>
                            <div class="text-xs text-gray-500">Taux désabo.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`, 'Newsletter Campagnes', `
    function campaigns() {
        return {
            allCampaigns: [],
            lists: [],
            loading: true,
            creating: false,
            showCreateForm: false,
            showStatsModal: false,
            selectedStats: null,
            form: { name: '', subject: '', htmlContent: '', listId: '', scheduledAt: '' },
            globalStats: { sent: 0, openRate: '0', clickRate: '0', bounces: 0 },

            async init() {
                await Promise.all([this.loadCampaigns(), this.loadLists()]);
            },

            async loadCampaigns() {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/newsletter/campaigns', { headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                        this.allCampaigns = await res.json();
                        this.computeGlobalStats();
                    }
                } catch(e) { console.error('Load campaigns error:', e); }
                this.loading = false;
            },

            async loadLists() {
                const token = localStorage.getItem('admin_token');
                try {
                    // Load Google Sheets subscribers as a virtual list
                    const res = await fetch('/api/admin/newsletter/subscribers', { headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                        const data = await res.json();
                        this.lists = [{
                            id: 'google-sheets',
                            name: 'Abonnés Newsletter (Google Sheets)',
                            totalSubscribers: data.active || 0
                        }];
                    }
                } catch(e) { console.error('Load lists error:', e); }
            },

            computeGlobalStats() {
                let totalSent = 0, totalOpens = 0, totalClicks = 0, totalBounces = 0;
                this.allCampaigns.forEach(c => {
                    const s = c.statistics?.globalStats || {};
                    totalSent += s.sent || 0;
                    totalOpens += s.uniqueOpens || 0;
                    totalClicks += s.uniqueClicks || 0;
                    totalBounces += (s.hardBounces || 0) + (s.softBounces || 0);
                });
                this.globalStats = {
                    sent: totalSent,
                    openRate: totalSent > 0 ? (totalOpens / totalSent * 100).toFixed(1) : '0',
                    clickRate: totalSent > 0 ? (totalClicks / totalSent * 100).toFixed(1) : '0',
                    bounces: totalBounces
                };
            },

            async createCampaign() {
                if (!this.form.name || !this.form.subject || !this.form.htmlContent || !this.form.listId) {
                    alert('Veuillez remplir tous les champs obligatoires.');
                    return;
                }
                this.creating = true;
                const token = localStorage.getItem('admin_token');
                try {
                    // Send via Brevo transactional (Google Sheets subscribers)
                    const res = await fetch('/api/admin/newsletter/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ subject: this.form.subject, htmlContent: this.form.htmlContent })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert('Campagne "' + this.form.name + '" envoyée avec succès !');
                        this.form = { name: '', subject: '', htmlContent: '', listId: '', scheduledAt: '' };
                        this.showCreateForm = false;
                    } else {
                        alert('Erreur: ' + (data.error || 'Échec de la création'));
                    }
                } catch(e) { alert('Erreur réseau'); console.error(e); }
                this.creating = false;
            },

            async viewStats(campaignId) {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/newsletter/stats/' + campaignId, { headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                        this.selectedStats = await res.json();
                        this.showStatsModal = true;
                    } else {
                        alert('Impossible de charger les statistiques.');
                    }
                } catch(e) { alert('Erreur réseau'); }
            }
        }
    }
`)));


// ===== POPUP MANAGEMENT =====
adminPagesApp.get('/marketing', (c) => c.html(adminLayout(`
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-3xl font-bold text-gray-900">Marketing Popup</h2>
            <p class="text-gray-600 mt-1">Configurez le popup promotionnel du site</p>
        </div>
    </div>

    <div class="bg-white rounded-xl shadow-lg p-6 max-w-2xl" x-data="popupEditor()">
        <form @submit.prevent="savePopup" class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                   <label class="font-semibold text-gray-900">Statut du Popup</label>
                   <p class="text-sm text-gray-500">Activer ou désactiver l'affichage sur le site</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" x-model="popup.isActive" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4AF37]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
            </div>

            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Titre (Interne)</label>
                <input type="text" x-model="popup.title" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
            </div>

            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Lien de redirection (Optionnel)</label>
                <input type="url" x-model="popup.link" placeholder="https://..." class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
            </div>

            <!-- Image Upload -->
            <div>
                 <label class="block text-sm font-semibold text-gray-700 mb-2">Image du Popup</label>
                 
                 <div x-show="!popup.image" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer" @click="$refs.fileInput.click()">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">Cliquez pour ajouter une image</p>
                 </div>

                 <div x-show="popup.image" class="relative group mt-2">
                    <img :src="popup.image" class="w-full h-64 object-cover rounded-lg shadow-sm">
                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                        <button type="button" @click="$refs.fileInput.click()" class="text-white mr-4 hover:text-[#D4AF37]"><i class="fas fa-edit fa-lg"></i></button>
                        <button type="button" @click="popup.image = ''" class="text-white hover:text-red-500"><i class="fas fa-trash fa-lg"></i></button>
                    </div>
                 </div>
                 <input type="file" x-ref="fileInput" @change="uploadImage" class="hidden" accept="image/*">
                 <p x-show="uploading" class="text-sm text-[#D4AF37] mt-2"><i class="fas fa-spinner fa-spin mr-1"></i> Téléchargement...</p>
            </div>

            <div class="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" class="bg-[#D4AF37] text-white px-8 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md flex items-center">
                    <i class="fas fa-save mr-2"></i>
                    <span x-show="!saving">Enregistrer</span>
                    <span x-show="saving">Enregistrement...</span>
                </button>
            </div>
        </form>
    </div>
`, 'Configuration Popup', `
    function popupEditor() {
        return {
            popup: {
                id: '',
                title: '',
                image: '',
                link: '',
                isActive: false
            },
            uploading: false,
            saving: false,
            async init() {
                const token = localStorage.getItem('admin_token');
                try {
                    // Fetch active or all popups. For simplicity, we'll implement a 'get active' or 'get latest' on the API
                    // But here reusing the list endpoint and taking the first active or just the first one if created.
                    // Ideally, we handle a single configuration object.
                    const res = await fetch('/api/admin/popups', { headers: { 'Authorization': 'Bearer ' + token } });
                    if(res.ok) {
                        const data = await res.json();
                        if (data.length > 0) {
                            // Find active or take the last created
                            this.popup = data.find(p => p.isActive) || data[data.length - 1];
                        }
                    }
                } catch(e) {}
            },
            async uploadImage(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                this.uploading = true;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'cem-group/popups');

                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.popup.image = data.url;
                    } else {
                        alert('Erreur: ' + (data.error || 'Upload failed'));
                    }
                } catch (err) {
                    alert('Erreur lors du téléchargement');
                }
                this.uploading = false;
            },
            async savePopup() {
                this.saving = true;
                const token = localStorage.getItem('admin_token');
                const method = this.popup.id ? 'PUT' : 'POST';
                const url = this.popup.id ? '/api/admin/popups/' + this.popup.id : '/api/admin/popups';
                
                try {
                    const res = await fetch(url, {
                        method: method,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify(this.popup)
                    });
                    
                    if(res.ok) {
                        const saved = await res.json();
                        this.popup = saved; // Update with ID
                        alert('Configuration sauvegardée !');
                    } else {
                        alert('Erreur lors de la sauvegarde');
                    }
                } catch(e) {
                    alert('Erreur réseau');
                }
                this.saving = false;
            }
        }
    }
`)));

const recruitmentContent = `
    <div x-data="recruitmentManager()" x-init="init()">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Candidatures</h1>
            <div class="flex gap-4">
               <select x-model="filterStatus" class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none">
                   <option value="all">Tous les statuts</option>
                   <option value="new">Nouveau</option>
                   <option value="reviewed">En revue</option>
                   <option value="contacted">Contacté</option>
                   <option value="rejected">Rejeté</option>
               </select>
               <button @click="init()" class="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                   <i class="fas fa-sync-alt mr-2"></i>Actualiser
               </button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                            <th class="py-3 px-6">Date</th>
                            <th class="py-3 px-6">Candidat</th>
                            <th class="py-3 px-6">Poste</th>
                            <th class="py-3 px-6">Contact</th>
                            <th class="py-3 px-6">Statut</th>
                            <th class="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-600 text-sm font-light">
                        <template x-for="app in filteredApplications" :key="app.id">
                            <tr class="border-b border-gray-200 hover:bg-gray-100 transition">
                                <td class="py-3 px-6 whitespace-nowrap">
                                    <span x-text="new Date(app.submittedAt).toLocaleDateString('fr-FR')"></span>
                                </td>
                                <td class="py-3 px-6">
                                    <div class="flex items-center">
                                        <div class="mr-2">
                                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold" x-text="app.firstName.charAt(0) + app.lastName.charAt(0)"></div>
                                        </div>
                                        <span class="font-medium" x-text="app.firstName + ' ' + app.lastName"></span>
                                    </div>
                                </td>
                                <td class="py-3 px-6" x-text="app.position"></td>
                                <td class="py-3 px-6">
                                    <div class="flex flex-col">
                                        <a :href="'mailto:' + app.email" class="text-blue-600 hover:underline" x-text="app.email"></a>
                                        <a :href="'tel:' + app.phone" class="text-gray-500 hover:text-gray-700" x-text="app.phone"></a>
                                    </div>
                                </td>
                                <td class="py-3 px-6">
                                    <span :class="{
                                        'bg-blue-100 text-blue-800': app.status === 'new',
                                        'bg-yellow-100 text-yellow-800': app.status === 'reviewed',
                                        'bg-green-100 text-green-800': app.status === 'contacted',
                                        'bg-red-100 text-red-800': app.status === 'rejected'
                                    }" class="py-1 px-3 rounded-full text-xs font-bold uppercase" x-text="statusLabel(app.status)"></span>
                                </td>
                                <td class="py-3 px-6 text-center">
                                    <div class="flex item-center justify-center gap-2">
                                        <button @click="viewApplication(app)" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition" title="Voir détails">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <a x-show="app.cvUrl" :href="getProxyUrl(app)" target="_blank" class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition" title="Télécharger CV via Proxy">
                                            <i class="fas fa-file-download"></i>
                                        </a>
                                        <button @click="deleteApplication(app.id)" class="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <tr x-show="filteredApplications.length === 0">
                            <td colspan="6" class="py-8 text-center text-gray-500">Aucune candidature trouvée</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Detail Modal -->
        <div x-show="selectedApp" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" x-transition x-cloak>
            <template x-if="selectedApp">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto" @click.away="selectedApp = null">
                    <div class="p-8">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-800" x-text="selectedApp.firstName + ' ' + selectedApp.lastName"></h2>
                                <p class="text-[#D4AF37] font-semibold" x-text="selectedApp.position"></p>
                            </div>
                            <button @click="selectedApp = null" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>

                        <div class="grid md:grid-cols-2 gap-8 mb-8">
                            <div class="bg-gray-50 p-6 rounded-xl">
                                <h3 class="font-bold text-gray-700 mb-4 border-b pb-2">Coordonnées</h3>
                                <div class="space-y-3">
                                    <p><i class="fas fa-envelope w-6 text-gray-400"></i> <a :href="'mailto:' + selectedApp.email" class="text-blue-600 hover:underline" x-text="selectedApp.email"></a></p>
                                    <p><i class="fas fa-phone w-6 text-gray-400"></i> <a :href="'tel:' + selectedApp.phone" class="text-gray-700" x-text="selectedApp.phone"></a></p>
                                    <p x-show="selectedApp.portfolio"><i class="fas fa-link w-6 text-gray-400"></i> <a :href="selectedApp.portfolio" target="_blank" class="text-blue-600 hover:underline">Portfolio / LinkedIn</a></p>
                                    <p><i class="fas fa-calendar w-6 text-gray-400"></i> <span x-text="new Date(selectedApp.submittedAt).toLocaleString('fr-FR')"></span></p>
                                </div>
                            </div>

                            <div class="bg-gray-50 p-6 rounded-xl">
                                <h3 class="font-bold text-gray-700 mb-4 border-b pb-2">Gestion</h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-2">Changer le statut</label>
                                        <select x-model="selectedApp.status" @change="updateStatus(selectedApp)" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                                            <option value="new">Nouveau</option>
                                            <option value="reviewed">En revue</option>
                                            <option value="contacted">Contacté</option>
                                            <option value="rejected">Rejeté</option>
                                        </select>
                                    </div>
                                    <div x-show="selectedApp.cvUrl">
                                        <button @click="showCvModal = true" class="block w-full text-center bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition">
                                            <i class="fas fa-eye mr-2"></i>Voir le CV (Modal)
                                        </button>
                                        <a :href="cvProxyUrl" target="_blank" class="block w-full text-center mt-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
                                            <i class="fas fa-external-link-alt mr-2"></i>Ouvrir lien direct
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-bold text-gray-700 mb-4">Lettre de Motivation</h3>
                            <div class="bg-gray-50 p-6 rounded-xl text-gray-600 whitespace-pre-wrap leading-relaxed" x-text="selectedApp.coverLetter"></div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- CV Preview Modal -->
        <div x-show="showCvModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75" x-transition x-cloak>
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col" @click.away="showCvModal = false">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="font-bold text-gray-800">Aperçu du CV</h3>
                    <div class="flex gap-4">
                        <a :href="cvProxyUrl" download class="bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#B8941F] transition text-sm font-bold">
                            <i class="fas fa-download mr-2"></i>Télécharger
                        </a>
                        <button @click="showCvModal = false" class="text-gray-500 hover:text-gray-800">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                <div class="flex-1 bg-gray-100 p-4 relative">
                    <template x-if="selectedApp?.cvUrl">
                        <div class="w-full h-full">
                            <!-- Try iframe for PDF -->
                            <iframe :src="cvProxyUrl" class="w-full h-full rounded-lg border bg-white" frameborder="0"></iframe>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
`;

const recruitmentScript = `
    function recruitmentManager() {
        return {
            applications: [],
            filterStatus: 'all',
            selectedApp: null,
            showCvModal: false,
            get cvProxyUrl() {
                return this.getProxyUrl(this.selectedApp);
            },
            getProxyUrl(app) {
                if (!app || !app.id) return '';
                const token = localStorage.getItem('admin_token');
                return '/api/admin/recruitment/cv/' + app.id + '?token=' + token;
            },
            init() {
                this.loadApplications();
            },
            async loadApplications() {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/recruitment', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        this.applications = await res.json();
                        // Sort by date desc
                        this.applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                    }
                } catch (e) {
                    console.error('Error loading applications:', e);
                }
            },
            get filteredApplications() {
                if (this.filterStatus === 'all') return this.applications;
                return this.applications.filter(app => app.status === this.filterStatus);
            },
            statusLabel(status) {
                const labels = {
                    'new': 'Nouveau',
                    'reviewed': 'En revue',
                    'contacted': 'Contacté',
                    'rejected': 'Rejeté'
                };
                return labels[status] || status;
            },
            viewApplication(app) {
                this.selectedApp = { ...app }; // Clone to avoid direct mutation issues before save
            },
            async updateStatus(app) {
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/recruitment/' + app.id, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ status: app.status })
                    });
                    
                    if (res.ok) {
                        // Update local list
                        const idx = this.applications.findIndex(a => a.id === app.id);
                        if (idx !== -1) {
                            this.applications[idx].status = app.status;
                        }
                    } else {
                        alert('Erreur lors de la mise à jour du statut');
                    }
                } catch (e) {
                    alert('Erreur réseau');
                }
            },
            async deleteApplication(id) {
                if (!confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) return;
                
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/recruitment/' + id, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    
                    if (res.ok) {
                        this.applications = this.applications.filter(a => a.id !== id);
                        if (this.selectedApp && this.selectedApp.id === id) {
                            this.selectedApp = null;
                        }
                    } else {
                        alert('Erreur lors de la suppression');
                    }
                } catch (e) {
                    alert('Erreur réseau');
                }
            }
        }
    }
`;



adminPagesApp.get('/recruitment', (c) => c.html(adminLayout(recruitmentContent, 'Recrutement', recruitmentScript)));

// ===== FORMATIONS MANAGEMENT =====
const formationsContent = `
    <div x-data="formationsManager()" x-init="init()">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-3xl font-bold text-gray-900">Formations</h2>
                <p class="text-gray-600 mt-1">Gérez vos formations professionnelles</p>
            </div>
            <div class="flex gap-3">
                <button @click="seedFormations()" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
                    <i class="fas fa-database mr-2"></i>Importer les 15 formations
                </button>
                <button @click="openCreate()" class="bg-[#D4AF37] text-white px-6 py-3 rounded-lg hover:bg-[#B8941F] transition shadow-md">
                    <i class="fas fa-plus mr-2"></i>Ajouter une formation
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div x-show="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-[#D4AF37]"></i>
            <p class="mt-2 text-gray-500">Chargement...</p>
        </div>

        <!-- Empty state -->
        <div x-show="!loading && formations.length === 0" class="text-center py-12">
            <i class="fas fa-chalkboard-teacher text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">Aucune formation. Cliquez sur "Importer les 15 formations" pour démarrer.</p>
        </div>

        <!-- Formations Table -->
        <div x-show="!loading && formations.length > 0" class="bg-white rounded-xl shadow-lg overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Image</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Titre</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Catégorie</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tags</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ordre</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                        <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <template x-for="f in sortedFormations" :key="f.id">
                        <tr class="hover:bg-gray-50 transition">
                            <td class="px-4 py-3">
                                <img :src="f.imageUrl" :alt="f.title" class="w-16 h-12 object-cover rounded-lg">
                            </td>
                            <td class="px-4 py-3">
                                <div class="font-semibold text-gray-900" x-text="f.title"></div>
                                <div class="text-xs text-gray-500 truncate max-w-xs" x-text="f.description"></div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 text-xs rounded-full font-bold" :class="f.category === 'Digitales' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'" x-text="f.category"></span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex flex-wrap gap-1">
                                    <template x-for="tag in (f.tags || '').split(',')" :key="tag">
                                        <span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded" x-text="tag.trim()"></span>
                                    </template>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-center" x-text="f.order"></td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 text-xs rounded-full font-bold" :class="f.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" x-text="f.status === 'active' ? 'Actif' : 'Brouillon'"></span>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button @click="openEdit(f)" class="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button @click="deleteFormation(f.id)" class="text-red-600 hover:text-red-800" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Create/Edit Modal -->
        <div x-show="showModal" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showModal = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 class="font-bold text-gray-900" x-text="isEditing ? 'Modifier la formation' : 'Ajouter une formation'"></h3>
                    <button @click="showModal = false" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-1">Titre</label>
                            <input type="text" x-model="form.title" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea x-model="form.description" rows="2" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                            <select x-model="form.category" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                                <option value="Digitales">Digitales & E-Learning</option>
                                <option value="Management">Management & Leadership</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Ordre d'affichage</label>
                            <input type="number" x-model.number="form.order" min="1" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-1">Image</label>
                            <div class="flex gap-4 items-start">
                                <div class="flex-1">
                                    <input type="text" x-model="form.imageUrl" placeholder="URL de l'image" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                                    <div class="mt-2">
                                        <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm inline-block transition">
                                            <i class="fas fa-upload mr-2"></i>Uploader une image
                                            <input type="file" accept="image/*" @change="uploadImage($event)" class="hidden">
                                        </label>
                                        <span x-show="uploading" class="ml-2 text-sm text-gray-500"><i class="fas fa-spinner fa-spin"></i> Upload...</span>
                                    </div>
                                </div>
                                <img x-show="form.imageUrl" :src="form.imageUrl" class="w-24 h-16 object-cover rounded-lg border">
                            </div>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">Icône <span class="text-xs font-normal text-gray-400 ml-1">Sélectionnez une icône</span></label>
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-14 h-14 rounded-xl border-2 border-[#D4AF37] flex items-center justify-center bg-[#D4AF37]/5">
                                    <i :class="form.icon" class="text-3xl" :style="'color:' + form.iconColor"></i>
                                </div>
                                <span class="text-sm text-gray-500" x-text="form.icon"></span>
                            </div>
                            <div class="grid grid-cols-10 gap-2 p-3 bg-gray-50 rounded-xl border max-h-40 overflow-y-auto">
                                <template x-for="ic in iconOptions" :key="ic.value">
                                    <button type="button" @click="form.icon = ic.value" class="w-9 h-9 flex items-center justify-center rounded-lg transition hover:bg-[#D4AF37]/20 cursor-pointer" :class="form.icon === ic.value ? 'bg-[#D4AF37]/30 ring-2 ring-[#D4AF37] shadow' : 'bg-white hover:shadow'" :title="ic.label">
                                        <i :class="ic.value" class="text-lg" :style="form.icon === ic.value ? 'color:' + form.iconColor : 'color:#374151'"></i>
                                    </button>
                                </template>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Couleur icône</label>
                            <input type="color" x-model="form.iconColor" class="w-full h-10 border rounded-lg cursor-pointer">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Point 1</label>
                            <input type="text" x-model="bullet1" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Point 2</label>
                            <input type="text" x-model="bullet2" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Point 3</label>
                            <input type="text" x-model="bullet3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Tags (séparés par virgule)</label>
                            <input type="text" x-model="form.tags" placeholder="E-Learning,Intra" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Texte du bouton CTA</label>
                            <input type="text" x-model="form.ctaText" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Lien CTA</label>
                            <input type="text" x-model="form.ctaLink" placeholder="/#contact" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Couleur bordure</label>
                            <input type="color" x-model="form.borderColor" class="w-full h-10 border rounded-lg cursor-pointer">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Badge (optionnel)</label>
                            <input type="text" x-model="form.badge" placeholder="N°1 GROWTH" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1 opacity-50">Classe CSS bouton CTA</label>
                            <input type="text" x-model="form.ctaColor" placeholder="bg-[#D4AF37]" disabled class="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                            <select x-model="form.status" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                                <option value="active">Actif</option>
                                <option value="draft">Brouillon</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 pt-4 border-t">
                        <button @click="showModal = false" class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">Annuler</button>
                        <button @click="saveFormation()" class="bg-[#D4AF37] text-white px-6 py-2 rounded-lg hover:bg-[#B8941F] transition" :disabled="saving">
                            <span x-show="!saving" x-text="isEditing ? 'Modifier' : 'Créer'"></span>
                            <span x-show="saving"><i class="fas fa-spinner fa-spin mr-1"></i>Enregistrement...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

const formationsScript = `
    function formationsManager() {
        return {
            formations: [],
            loading: true,
            showModal: false,
            isEditing: false,
            editingId: null,
            saving: false,
            uploading: false,
            bullet1: '',
            bullet2: '',
            bullet3: '',
            iconOptions: [
                { value: 'fas fa-graduation-cap', label: 'Graduation' },
                { value: 'fas fa-book', label: 'Livre' },
                { value: 'fas fa-chalkboard-teacher', label: 'Formation' },
                { value: 'fas fa-laptop', label: 'Laptop' },
                { value: 'fas fa-desktop', label: 'Bureau' },
                { value: 'fab fa-linkedin', label: 'LinkedIn' },
                { value: 'fas fa-bullhorn', label: 'Marketing' },
                { value: 'fas fa-pen-fancy', label: 'Contenu' },
                { value: 'fas fa-robot', label: 'IA / Robot' },
                { value: 'fas fa-brain', label: 'Intelligence' },
                { value: 'fas fa-crown', label: 'Leadership' },
                { value: 'fas fa-users', label: 'Equipe' },
                { value: 'fas fa-comments', label: 'Communication' },
                { value: 'fas fa-spa', label: 'Bien-etre' },
                { value: 'fas fa-handshake', label: 'Coaching' },
                { value: 'fas fa-chart-line', label: 'Performance' },
                { value: 'fas fa-video', label: 'Video' },
                { value: 'fas fa-sync-alt', label: 'Changement' },
                { value: 'fas fa-heart', label: 'Emotion' },
                { value: 'fas fa-chess', label: 'Strategie' },
                { value: 'fas fa-rocket', label: 'Lancement' },
                { value: 'fas fa-lightbulb', label: 'Idee' },
                { value: 'fas fa-star', label: 'Etoile' },
                { value: 'fas fa-medal', label: 'Medaille' },
                { value: 'fas fa-cogs', label: 'Parametres' },
                { value: 'fas fa-shield-alt', label: 'Securite' },
                { value: 'fas fa-globe', label: 'International' },
                { value: 'fas fa-microphone', label: 'Micro' },
                { value: 'fas fa-magic', label: 'Magie' },
                { value: 'fas fa-wifi', label: 'Distanciel' },
            ],
            form: {
                title: '', description: '', imageUrl: '', icon: 'fas fa-graduation-cap',
                bullets: '', tags: '', category: 'Digitales', ctaText: 'Demander un devis',
                ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-[#D4AF37]',
                iconColor: '#D4AF37', order: 1, status: 'active', badge: ''
            },
            get sortedFormations() {
                return [...this.formations].sort((a, b) => (a.order || 0) - (b.order || 0));
            },
            init() {
                this.loadFormations();
            },
            async loadFormations() {
                this.loading = true;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/formations', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        this.formations = await res.json();
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        console.error('API Error:', errData);
                        alert('Erreur chargement formations: ' + (errData.details || errData.error || res.statusText));
                    }
                } catch (e) {
                    console.error('Error loading formations:', e);
                }
                this.loading = false;
            },
            openCreate() {
                this.isEditing = false;
                this.editingId = null;
                this.form = {
                    title: '', description: '', imageUrl: '', icon: 'fas fa-graduation-cap',
                    bullets: '', tags: '', category: 'Digitales', ctaText: 'Demander un devis',
                    ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-[#D4AF37]',
                    iconColor: '#D4AF37', order: this.formations.length + 1, status: 'active', badge: ''
                };
                this.bullet1 = '';
                this.bullet2 = '';
                this.bullet3 = '';
                this.showModal = true;
            },
            openEdit(f) {
                this.isEditing = true;
                this.editingId = f.id;
                this.form = { ...f };
                const bullets = (f.bullets || '').split(',');
                this.bullet1 = bullets[0] || '';
                this.bullet2 = bullets[1] || '';
                this.bullet3 = bullets[2] || '';
                this.showModal = true;
            },
            async uploadImage(e) {
                const file = e.target.files[0];
                if (!file) return;
                this.uploading = true;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'image');
                formData.append('folder', 'cem-group/formations');
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('/api/admin/media/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: formData
                    });
                    const data = await res.json();
                    if (data.url) {
                        this.form.imageUrl = data.url;
                    } else {
                        alert('Erreur: ' + (data.error || 'Upload failed'));
                    }
                } catch (err) {
                    alert('Erreur lors du téléchargement');
                }
                this.uploading = false;
            },
            async saveFormation() {
                this.saving = true;
                this.form.bullets = [this.bullet1, this.bullet2, this.bullet3].filter(Boolean).join(',');
                const token = localStorage.getItem('admin_token');
                try {
                    const url = this.isEditing ? '/api/admin/formations/' + this.editingId : '/api/admin/formations';
                    const method = this.isEditing ? 'PUT' : 'POST';
                    const res = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify(this.form)
                    });
                    if (res.ok) {
                        this.showModal = false;
                        await this.loadFormations();
                    } else {
                        alert("Erreur lors de l'enregistrement");
                    }
                } catch (e) {
                    alert('Erreur réseau');
                }
                this.saving = false;
            },
            async deleteFormation(id) {
                if (!confirm('Supprimer cette formation ?')) return;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/formations/' + id, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        this.formations = this.formations.filter(f => f.id !== id);
                    } else {
                        alert("Erreur lors de la suppression");
                    }
                } catch (e) {
                    alert('Erreur réseau');
                }
            },
            async seedFormations() {
                if (!confirm('Importer les 15 formations par défaut ? Les formations existantes ne seront pas supprimées.')) return;
                const token = localStorage.getItem('admin_token');
                try {
                    const res = await fetch('/api/admin/formations/seed', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert(data.count + ' formations importées avec succès !');
                        await this.loadFormations();
                    } else {
                        alert('Erreur: ' + (data.error || 'Seed failed'));
                    }
                } catch (e) {
                    alert('Erreur réseau');
                }
            }
        }
    }
`;

adminPagesApp.get('/formations', (c) => c.html(adminLayout(formationsContent, 'Formations', formationsScript)));

export default adminPagesApp;
