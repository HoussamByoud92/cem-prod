import { Hono } from 'hono'
import { eventsService } from '../lib/sheets'
import { renderer } from '../renderer'
import { Bindings } from '../bindings'

const eventsApp = new Hono<{ Bindings: Bindings }>()

eventsApp.get('/', async (c) => {
    const events = await eventsService.getAll(c.env);
    const upcomingEvents = events.filter(e => e.status === 'published' && new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = events.filter(e => e.status === 'published' && new Date(e.date) < new Date()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const generateEventCard = (event: any) => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition flex flex-col md:flex-row h-full">
            <div class="md:w-1/3 h-48 md:h-auto relative">
                <img src="${event.image || '/static/default-event.jpg'}" alt="${event.title}" class="w-full h-full object-cover">
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
                     <a href="${event.registrationLink || '#'}" target="_blank" class="text-[#D4AF37] font-semibold hover:text-[#B8941F] text-sm uppercase tracking-wide">
                        ${event.registrationLink ? 'S\'inscrire' : 'Plus d\'infos'} <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Événements - CEM GROUP</title>
    <link rel="icon" type="image/png" href="https://i0.wp.com/cembymazini.ma/wp-content/uploads/2023/07/cem.png?fit=146%2C118&ssl=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
             @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
            body { font-family: 'Montserrat', sans-serif; }
            .gradient-text { background: linear-gradient(to right, #D4AF37, #FFD700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        </style>
    </head>
    <body class="bg-gray-50">
        <header class="bg-black py-4 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
                 <a href="/" class="text-2xl font-black text-white">CEM<span class="text-[#D4AF37]">GROUP</span></a>
                 <a href="/" class="text-white hover:text-[#D4AF37]"><i class="fas fa-home mr-2"></i>Retour</a>
            </div>
        </header>

        <section class="py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h1 class="text-5xl font-bold gradient-text mb-4">Nos Événements</h1>
                    <p class="text-xl text-gray-600">Rejoignez-nous lors de nos prochains événements</p>
                </div>

                <h2 class="text-3xl font-bold text-gray-900 mb-8 border-l-4 border-[#D4AF37] pl-4">À Venir</h2>
                ${upcomingEvents.length > 0 ? `
                <div class="grid lg:grid-cols-2 gap-8 mb-16">
                    ${upcomingEvents.map(generateEventCard).join('')}
                </div>
                ` : '<p class="text-gray-500 mb-16">Aucun événement à venir pour le moment.</p>'}

                <h2 class="text-3xl font-bold text-gray-900 mb-8 border-l-4 border-gray-300 pl-4">Passés</h2>
                ${pastEvents.length > 0 ? `
                <div class="grid lg:grid-cols-2 gap-8 opacity-75 grayscale hover:grayscale-0 transition duration-500">
                    ${pastEvents.map(generateEventCard).join('')}
                </div>
                ` : '<p class="text-gray-500">Aucun événement passé.</p>'}
            </div>
        </section>

        <footer class="bg-black text-white py-8 text-center">
            <p>&copy; ${new Date().getFullYear()} CEM GROUP. Tous droits réservés.</p>
        </footer>
    </body>
    </html>
    `);
});

export default eventsApp;
