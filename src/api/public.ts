import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sendContactEmail, type ContactFormData } from '../lib/email';
import { newsletterService, recruitmentService } from '../lib/sheets';
import { addBrevoContact } from '../lib/email';
import { Bindings } from '../bindings';

const publicApp = new Hono<{ Bindings: Bindings }>();

// Contact form submission
const contactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    service: z.string().optional(),
    message: z.string().min(1),
    source: z.string().optional(),
});

// Debug endpoint to test email configuration and GAS script logic
publicApp.get('/test-email', async (c) => {
    const gasUrl = c.env?.GAS_WEB_APP_URL;
    const gasToken = c.env?.GAS_API_TOKEN;

    if (!gasUrl) {
        return c.json({ error: 'GAS_WEB_APP_URL is missing in environment variables' }, 500);
    }

    try {
        // Test connection to GAS - Try to send a real email to verify the script logic
        const url = new URL(gasUrl);
        url.searchParams.append('action', 'sendContactEmail'); // Use the REAL action
        url.searchParams.append('token', gasToken || '');

        const ts = new Date().toISOString();

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: `[TEST] Debug Email ${ts}`,
                htmlContent: `<h1>Debug Email</h1><p>This is a test sent at ${ts} from /api/test-email.</p><p>If you received this, the GAS script is working correctly.</p>`,
                senderName: 'Debug Tool',
                replyTo: { email: 'debug@cembymazini.ma', name: 'Debug Tool' },
                source: 'Debug Endpoint',
                timestamp: ts
            })
        });

        const responseText = await response.text();
        const responseStatus = response.status;

        // Parse JSON if possible to check for 'success'
        let jsonResponse = null;
        try { jsonResponse = JSON.parse(responseText); } catch (e) { }

        const isSuccess = response.ok && jsonResponse && jsonResponse.success === true;

        return c.json({
            success: isSuccess,
            message: isSuccess
                ? "SUCCESS: The GAS script accepted the request."
                : "FAILURE: The GAS script did NOT accept the request. You must update your Code.gs file.",
            env_check: {
                has_url: !!gasUrl,
                has_token: !!gasToken,
            },
            gas_response: {
                status: responseStatus,
                text: responseText.substring(0, 500),
                json: jsonResponse
            }
        });
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

publicApp.post('/contact', zValidator('json', contactSchema), async (c) => {
    try {
        const data = c.req.valid('json');

        const contactData: ContactFormData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            service: data.service,
            message: data.message,
            source: data.source,
        };

        await sendContactEmail(contactData, c.env);

        return c.json({ success: true, message: 'Message envoyé avec succès' });
    } catch (error) {
        console.error('Contact form error:', error);
        return c.json({ error: 'Échec de l\'envoi du message' }, 500);
    }
});

// Newsletter subscription (public)
const newsletterSchema = z.object({
    email: z.string().email(),
});

publicApp.post('/newsletter/subscribe', zValidator('json', newsletterSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        // Check if already subscribed
        const existing = await newsletterService.getAll(c.env);
        const alreadySubscribed = existing.find(s => s.email === data.email);

        if (alreadySubscribed) {
            return c.json({
                success: false,
                message: 'Cet email est déjà inscrit à notre newsletter'
            }, 400);
        }

        // Add to Google Sheets
        const subscriber = await newsletterService.create({
            email: data.email,
            firstName: '',
            lastName: '',
            subscribedAt: now,
            status: 'active',
            source: 'website',
            tags: '',
            lastCampaignSent: '',
        }, c.env);

        // Add to Brevo if configured
        if ((c.env as any)?.BREVO_API_KEY || process.env.BREVO_API_KEY) {
            try {
                await addBrevoContact({
                    email: subscriber.email,
                    attributes: {
                        FIRSTNAME: subscriber.firstName,
                        LASTNAME: subscriber.lastName,
                    },
                }, c.env);
            } catch (brevoError) {
                console.error('Brevo sync error:', brevoError);
                // Continue even if Brevo fails
            }
        }

        return c.json({
            success: true,
            message: 'Merci de votre inscription à notre newsletter !'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return c.json({ error: 'Échec de l\'inscription' }, 500);
    }
});

// Get pinned events (public)
publicApp.get('/events/pinned', async (c) => {
    try {
        const { eventsService } = await import('../lib/sheets');
        const events = await eventsService.getAll(c.env);
        const pinned = events.filter(e => e.isPinned && e.status === 'published');

        // Sort by date
        pinned.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return c.json(pinned);
    } catch (error) {
        console.error('Error getting pinned events:', error);
        return c.json({ error: 'Failed to get events' }, 500);
    }
});

// Get published blog posts (public)
publicApp.get('/blog', async (c) => {
    try {
        const { blogService } = await import('../lib/sheets');
        const blogs = await blogService.getAll(c.env);
        const published = blogs.filter(b => b.status === 'published');

        // Sort by published date (newest first)
        published.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return c.json(published);
    } catch (error) {
        console.error('Error getting blogs:', error);
        return c.json({ error: 'Failed to get blogs' }, 500);
    }
});

// Get single blog post by slug (public)
publicApp.get('/blog/:slug', async (c) => {
    try {
        const slug = c.req.param('slug');
        const { blogService } = await import('../lib/sheets');
        const blogs = await blogService.getAll(c.env);
        const blog = blogs.find(b => b.slug === slug && b.status === 'published');

        if (!blog) {
            return c.json({ error: 'Blog not found' }, 404);
        }

        return c.json(blog);
    } catch (error) {
        console.error('Error getting blog:', error);
        return c.json({ error: 'Failed to get blog' }, 500);
    }
});

// Get plaquettes (public)
publicApp.get('/plaquettes', async (c) => {
    try {
        const { plaquettesService } = await import('../lib/sheets');
        const plaquettes = await plaquettesService.getAll(c.env);
        return c.json(plaquettes);
    } catch (error) {
        console.error('Error getting plaquettes:', error);
        return c.json({ error: 'Failed to get plaquettes' }, 500);
    }
});

// Download plaquette PDF (public proxy - bypasses Cloudinary authenticated delivery)
publicApp.get('/plaquettes/download/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const { plaquettesService } = await import('../lib/sheets');
        const { generateApiDownloadUrl } = await import('../lib/cloudinary');

        const plaquette = await plaquettesService.getById(id, c.env);
        if (!plaquette || !plaquette.url) {
            return c.json({ error: 'Plaquette not found' }, 404);
        }

        console.log(`Plaquette proxy: fetching ${plaquette.url}`);

        // Strategy 1: Try the direct stored URL (works for type=upload, access_mode=public)
        let response = await fetch(plaquette.url);

        // Strategy 2: If direct fails with 401, use Cloudinary API download URL
        if (!response.ok && response.status === 401) {
            console.log('Plaquette proxy: direct URL returned 401, trying API download URL');
            const downloadUrl = await generateApiDownloadUrl(plaquette.url, {
                CLOUDINARY_CLOUD_NAME: c.env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
                CLOUDINARY_API_KEY: c.env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '',
                CLOUDINARY_API_SECRET: c.env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || '',
            });
            if (downloadUrl) {
                console.log('Plaquette proxy: trying API download URL');
                response = await fetch(downloadUrl);
            }
        }

        if (!response.ok) {
            console.error(`Plaquette proxy failed: ${response.status}`);
            return c.json({ error: 'Failed to fetch PDF', status: response.status }, 502);
        }

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
        const safeName = (plaquette.name || 'document').replace(/[^a-zA-Z0-9_\-. ]/g, '_');
        headers.set('Content-Disposition', `inline; filename="${safeName}.pdf"`);
        if (response.headers.get('Content-Length')) {
            headers.set('Content-Length', response.headers.get('Content-Length')!);
        }

        return new Response(response.body, { status: 200, headers });
    } catch (error) {
        console.error('Plaquette download proxy error:', error);
        return c.json({ error: 'Download failed' }, 500);
    }
});

// Get active popup (public)
publicApp.get('/popup', async (c) => {
    try {
        const { popupService } = await import('../lib/sheets');
        const popups = await popupService.getAll(c.env);
        const active = popups.find(p => p.isActive);

        // Check dates if applicable
        if (active) {
            const now = new Date();
            if (active.startDate && new Date(active.startDate) > now) return c.json(null);
            if (active.endDate && new Date(active.endDate) < now) return c.json(null);
            return c.json(active);
        }

        return c.json(null);
    } catch (error) {
        console.error('Error getting popup:', error);
        return c.json({ error: 'Failed to get popup' }, 500);
    }
});

// Recruitment form submission
const recruitmentSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    position: z.string().min(1),
    coverLetter: z.string().min(1),
    cvUrl: z.string().optional(),
    portfolio: z.string().optional(),
});

publicApp.post('/recruitment/apply', zValidator('json', recruitmentSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        const application = await recruitmentService.create({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            position: data.position,
            coverLetter: data.coverLetter,
            cvUrl: data.cvUrl || '',
            portfolio: data.portfolio || '',
            status: 'new',
            submittedAt: now,
            updatedAt: now,
        }, c.env);

        return c.json({
            success: true,
            message: 'Merci pour votre candidature ! Notre équipe RH vous contactera sous 48h.'
        });
    } catch (error) {
        console.error('Recruitment submission error:', error);
        return c.json({ error: 'Échec de l\'envoi de la candidature' }, 500);
    }
});


publicApp.post('/upload', async (c) => {
    try {
        const body = await c.req.formData();
        const file = body.get('file') as File;
        const folder = (body.get('folder') as string) || 'cem-group/public';

        if (!file) return c.json({ error: 'No file' }, 400);

        // Size limit 10MB
        if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large' }, 400);

        const env = c.env as any;
        const cloudName = env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
        const apiSecret = env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return c.json({ error: 'Server config error' }, 500);
        }

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const uploadParams = new FormData();
        uploadParams.append('file', file);
        uploadParams.append('api_key', apiKey);
        uploadParams.append('timestamp', timestamp);
        uploadParams.append('folder', folder);
        uploadParams.append('type', 'upload');
        uploadParams.append('access_mode', 'public');

        // Generate signature (alphabetical order: access_mode, folder, timestamp, type)
        const signatureStr = `access_mode=public&folder=${folder}&timestamp=${timestamp}&type=upload${apiSecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureStr);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        uploadParams.append('signature', signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        const response = await fetch(uploadUrl, { method: 'POST', body: uploadParams });
        const result = await response.json() as any;

        if (!response.ok) {
            console.error('Cloudinary error:', result);
            return c.json({ error: 'Upload failed' }, 500);
        }

        return c.json({ success: true, url: result.secure_url });
    } catch (e) {
        console.error('Upload error:', e);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

export default publicApp;
