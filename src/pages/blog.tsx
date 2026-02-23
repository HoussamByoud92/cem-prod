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
        <!-- Header Simplifié -->
        <header class="bg-black py-4 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
                 <a href="/" class="text-2xl font-black text-white">CEM<span class="text-[#D4AF37]">GROUP</span></a>
                 <a href="/" class="text-white hover:text-[#D4AF37]"><i class="fas fa-home mr-2"></i>Retour</a>
            </div>
        </header>

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

        <footer class="bg-black text-white py-8 text-center">
            <p>&copy; ${new Date().getFullYear()} CEM GROUP. Tous droits réservés.</p>
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
         <header class="bg-black py-4 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
                 <a href="/" class="text-2xl font-black text-white">CEM<span class="text-[#D4AF37]">GROUP</span></a>
                 <a href="/actualites" class="text-white hover:text-[#D4AF37]"><i class="fas fa-arrow-left mr-2"></i>Actualités</a>
            </div>
        </header>

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
        
        <footer class="bg-black text-white py-8 text-center">
            <p>&copy; ${new Date().getFullYear()} CEM GROUP. Tous droits réservés.</p>
        </footer>
    </body>
    </html>
    `);
});

export default blogApp;
