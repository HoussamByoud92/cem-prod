import { BlogPost, Event, Popup, Plaquette } from './sheets';

export function generatePlaquettesHtml(plaquettes: Plaquette[]) {
    if (!plaquettes || plaquettes.length === 0) return '';

    const cards = plaquettes.map(p => `
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-lg flex items-center justify-center text-white shrink-0">
                    <i class="fas fa-file-pdf text-xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 line-clamp-1">${p.name}</h3>
                    <span class="text-xs text-gray-500">PDF Document</span>
                </div>
            </div>
            <p class="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">${p.description || ''}</p>
            <a href="/api/plaquettes/download/${p.id}" target="_blank" class="w-full mt-auto inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-[#D4AF37]/10 text-gray-800 hover:text-[#D4AF37] px-4 py-2 rounded-lg font-semibold transition-colors border border-gray-200 hover:border-[#D4AF37]">
                <i class="fas fa-download"></i> Télécharger
            </a>
        </div>
    `).join('');

    return `
    <section id="plaquettes" class="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                 <div class="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    <i class="fas fa-book-open"></i>
                    <span>Documentation</span>
                </div>
                <h2 class="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                    Nos <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8941F]">Brochures & Catalogues</span>
                </h2>
                <p class="text-gray-600 text-lg max-w-2xl mx-auto">
                    Consultez et téléchargez nos supports pour découvrir nos offres en détail.
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${cards}
            </div>
        </div>
    </section>
    `;
}

export function generatePopupHtml(popup: Popup | undefined) {
    if (!popup) return '';
    return `
    <div x-data="{ open: true }" x-show="open" x-cloak class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style="display: none;" x-transition.opacity>
        <div class="bg-white rounded-2xl p-0 max-w-lg w-full relative overflow-hidden shadow-2xl mx-4">
            <button @click="open = false" class="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition z-10">
                <i class="fas fa-times text-xl"></i>
            </button>
            <a href="${popup.link || '#'}" ${popup.link ? 'target="_blank"' : ''} class="block">
                <img src="${popup.image}" alt="${popup.title}" class="w-full h-auto object-cover" loading="lazy" >
            </a>
            ${popup.title ? `<div class="p-4 text-center"><h3 class="text-xl font-bold">${popup.title}</h3></div>` : ''}
        </div>
    </div>
    `;
}

export function generateBlogSectionHtml(blogs: BlogPost[]) {
    if (!blogs || blogs.length === 0) return '';

    const cards = blogs.map(blog => `
        <div class="card-hover bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col h-full">
            <div class="h-48 bg-gray-200 relative overflow-hidden">
                <img src="${blog.coverImage || '/static/default-blog.webp'}" alt="${blog.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy" >
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

    return `
    <section id="actu" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-5xl font-bold gradient-text mb-4">CEM Actu</h2>
                <p class="text-xl text-gray-600">Innovation, Digital, Marketing & Formation - Nos actualités</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                ${cards}
            </div>
            
            <div class="text-center mt-12">
                <a href="/actualites" class="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-3 rounded-full font-bold hover:bg-[#D4AF37] hover:text-white transition">
                    Voir toutes les actualités
                </a>
            </div>
        </div>
    </section>
    `;
}

export function generateEventsSectionHtml(events: Event[]) {
    if (!events || events.length === 0) return '';

    const cards = events.map(event => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition flex flex-col md:flex-row h-full">
            <div class="md:w-1/3 h-48 md:h-auto relative">
                <img src="${event.image || '/static/default-event.webp'}" alt="${event.title}" class="w-full h-full object-cover" loading="lazy" >
                <div class="absolute top-0 left-0 bg-[#D4AF37] text-white p-3 text-center">
                    <div class="text-2xl font-bold leading-none">${new Date(event.date).getDate()}</div>
                    <div class="text-xs uppercase">${new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                </div>
            </div>
            <div class="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <i class="far fa-clock text-[#D4AF37]"></i> ${event.description ? 'Voir détails' : 'Bientôt'}
                        ${event.location ? `<span class="mx-1">•</span> <i class="fas fa-map-marker-alt text-[#D4AF37]"></i> ${event.location}` : ''}
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${event.title}</h3>
                    <p class="text-gray-600 line-clamp-2">${event.description || ''}</p>
                </div>
                <div class="mt-4">
                     <a href="/events" class="text-[#D4AF37] font-semibold hover:text-[#B8941F] text-sm uppercase tracking-wide">
                        Plus d'infos <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    return `
    <section id="events" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-5xl font-bold gradient-text mb-4">Événements à Venir</h2>
                <p class="text-xl text-gray-600">Ne manquez pas nos prochains rendez-vous</p>
            </div>
            
            <div class="grid lg:grid-cols-2 gap-8">
                ${cards}
            </div>
             <div class="text-center mt-12">
                <a href="/events" class="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-3 rounded-full font-bold hover:bg-[#D4AF37] hover:text-white transition">
                    Voir tous les événements
                </a>
            </div>
        </div>
    </section>
    `;
}
