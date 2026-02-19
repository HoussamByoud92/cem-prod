import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
    blogService,
    eventsService,
    plaquettesService,
    newsletterService,
    popupService,
    recruitmentService,
    formationsService,
    initializeSheets,
    type BlogPost,
    type Event,
    type Plaquette,
    type NewsletterSubscriber,
    type Recruitment,
    type Formation,
} from '../lib/sheets';
import {
    uploadImage,
    uploadVideo,
    uploadPDF,
    deleteFile,
    generatePDFThumbnail,
    getSignedUrl,
    extractPublicIdFromUrl,
    generateApiDownloadUrl,
} from '../lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import {
    sendContactEmail,
    addBrevoContact,
    createBrevoCampaign,
    sendBrevoCampaign,
    getCampaignStats,
    getAllCampaigns,
    getBrevoLists,
    sendBrevoTransactionalEmail,
    sendBrevoNewsletter, // Imported
    type ContactFormData,
    type BrevoCampaign,
} from '../lib/email';
import {
    authenticateAdmin,
    generateToken,
    requireAuth,
} from '../lib/auth';
import {
    exportSubscribersToExcel,
    generateExportFilename,
} from '../lib/excel';
import { Bindings } from '../bindings';

const adminApp = new Hono<{ Bindings: Bindings }>();

// Enable CORS for admin routes
// Enable CORS handled by main app
// adminApp.use('/*', cors());

// ===== AUTHENTICATION =====

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

adminApp.post('/login', zValidator('json', loginSchema), async (c) => {
    console.log('[API] Login request received');
    try {
        const { email, password } = c.req.valid('json');
        console.log('[API] Validated credentials, authenticating...');

        const user = await authenticateAdmin(email, password);

        if (!user) {
            console.log('[API] Authentication failed: User not found or invalid password');
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        console.log('[API] Authentication successful, generating token...');
        const token = generateToken(user);
        return c.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Login failed' }, 500);
    }
});

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
    let authHeader = c.req.header('Authorization');

    // Support token in query param for cases like <iframe> or direct download links
    if (!authHeader && c.req.query('token')) {
        authHeader = `Bearer ${c.req.query('token')}`;
    }

    const user = await requireAuth(authHeader);

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', user);
    await next();
};

// ===== NEWSLETTER =====

adminApp.get('/newsletter/subscribers', authMiddleware, async (c) => {
    try {
        const subscribers = await newsletterService.getAll(c.env);
        const activeSubscribers = subscribers.filter(s => s.status === 'active');
        return c.json({ total: subscribers.length, active: activeSubscribers.length, subscribers: activeSubscribers });
    } catch (error) {
        return c.json({ error: 'Failed to fetch subscribers' }, 500);
    }
});

adminApp.post('/newsletter/send', authMiddleware, zValidator('json', z.object({
    subject: z.string().min(1),
    htmlContent: z.string().min(1),
})), async (c) => {
    const { subject, htmlContent } = c.req.valid('json');
    try {
        const subscribers = await newsletterService.getAll(c.env);
        const activeSubscribers = subscribers.filter(s => s.status === 'active');

        if (activeSubscribers.length === 0) {
            return c.json({ error: 'No active subscribers found' }, 400);
        }

        const result = await sendBrevoNewsletter(
            activeSubscribers.map(s => ({ email: s.email, name: `${s.firstName} ${s.lastName}`.trim() })),
            subject,
            htmlContent,
            c.env
        );

        return c.json(result);
    } catch (error: any) {
        console.error('Newsletter send error:', error);
        return c.json({ error: error.message || 'Failed to send newsletter' }, 500);
    }
});

// ===== BLOG =====

// Apply auth middleware to all routes except login
adminApp.use('/*', async (c, next) => {
    if (c.req.path === '/api/admin/login') {
        return next();
    }
    return authMiddleware(c, next);
});

// ===== FILE UPLOAD =====

adminApp.post('/upload', authMiddleware, async (c) => {
    try {
        const body = await c.req.formData();
        const file = body.get('file') as File;
        const folder = (body.get('folder') as string) || 'cem-group';

        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }

        console.log('Upload request:', { name: file.name, type: file.type, size: file.size, folder });

        // Validate file size (5MB for images, 20MB for PDFs)
        const maxSize = file.type === 'application/pdf' ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return c.json({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }, 400);
        }

        // Get Cloudinary credentials from env bindings or process.env
        const cloudName = c.env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = c.env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
        const apiSecret = c.env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Missing Cloudinary credentials');
            return c.json({ error: 'Cloudinary not configured' }, 500);
        }

        // Determine resource type
        const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';

        // Generate signature for Cloudinary API
        const timestamp = Math.floor(Date.now() / 1000).toString();
        // Params must be alphabetical: access_mode, folder, timestamp, type
        const paramsToSign = `access_mode=public&folder=${folder}&timestamp=${timestamp}&type=upload`;

        // Create SHA-1 signature using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(paramsToSign + apiSecret);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Build multipart form data for Cloudinary REST API
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('api_key', apiKey);
        uploadData.append('timestamp', timestamp);
        uploadData.append('signature', signature);
        uploadData.append('folder', folder);
        uploadData.append('type', 'upload');
        uploadData.append('access_mode', 'public');

        // Upload to Cloudinary REST API
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
        console.log('Uploading to Cloudinary:', uploadUrl);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: uploadData,
        });

        const result = await response.json() as any;

        if (!response.ok) {
            console.error('Cloudinary error:', result);
            return c.json({ error: 'Cloudinary upload failed: ' + (result?.error?.message || 'Unknown error') }, 500);
        }

        console.log('Upload success:', result.secure_url);

        return c.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes
        });
    } catch (error: any) {
        console.error('Upload error:', error?.message || error);
        console.error('Upload error stack:', error?.stack);
        return c.json({ error: 'Upload failed: ' + (error?.message || String(error)) }, 500);
    }
});

// ===== DASHBOARD STATS =====

adminApp.get('/stats', async (c) => {
    try {
        const env = c.env;
        const [blogs, events, plaquettes, subscribers] = await Promise.all([
            blogService.getAll(env),
            eventsService.getAll(env),
            plaquettesService.getAll(env),
            newsletterService.getAll(env),
        ]);

        return c.json({
            totalBlogs: blogs.length,
            publishedBlogs: blogs.filter(b => b.status === 'published').length,
            totalEvents: events.length,
            pinnedEvents: events.filter(e => e.isPinned).length,
            totalPlaquettes: plaquettes.length,
            totalSubscribers: subscribers.length,
            activeSubscribers: subscribers.filter(s => s.status === 'active').length,
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return c.json({ error: 'Failed to get stats' }, 500);
    }
});

// ===== BLOG ROUTES =====

const blogSchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string(),
    excerpt: z.string(),
    author: z.string(),
    coverImage: z.string().url().optional().or(z.literal('')),
    status: z.enum(['draft', 'published']),
    tags: z.string().optional(),
    category: z.string().optional(),
    isPublished: z.boolean().optional(),
}).passthrough();

adminApp.get('/blog', async (c) => {
    try {
        const blogs = await blogService.getAll(c.env);
        return c.json(blogs);
    } catch (error) {
        return c.json({ error: 'Failed to get blogs' }, 500);
    }
});

adminApp.get('/blog/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const blog = await blogService.getById(id, c.env);

        if (!blog) {
            return c.json({ error: 'Blog not found' }, 404);
        }

        return c.json(blog);
    } catch (error) {
        return c.json({ error: 'Failed to get blog' }, 500);
    }
});

adminApp.post('/blog', zValidator('json', blogSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        const blog = await blogService.create({
            ...data,
            publishedAt: data.status === 'published' ? now : '',
            createdAt: now,
            updatedAt: now,
            tags: data.tags || '',
            category: data.category || '',
            coverImage: data.coverImage || '',
        }, c.env);

        return c.json(blog, 201);
    } catch (error: any) {
        console.error('Error creating blog:', error?.message || error);
        return c.json({ error: 'Failed to create blog: ' + (error?.message || String(error)) }, 500);
    }
});

adminApp.put('/blog/:id', zValidator('json', blogSchema.partial()), async (c) => {
    try {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        // Handle publishedAt logic
        const existing = await blogService.getById(id, c.env);
        let publishedAt = existing?.publishedAt || '';

        if (data.status === 'published' && !publishedAt) {
            publishedAt = new Date().toISOString();
        }

        const updated = await blogService.update(id, {
            ...data,
            publishedAt,
        }, c.env);

        if (!updated) {
            return c.json({ error: 'Blog not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update blog' }, 500);
    }
});

adminApp.delete('/blog/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await blogService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Blog not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete blog' }, 500);
    }
});

// ===== EVENTS ROUTES =====

const eventSchema = z.object({
    title: z.string().min(1),
    date: z.string(),
    location: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal('')),
    registrationLink: z.string().url().optional().or(z.literal('')),
    isPinned: z.boolean().optional(),
}).passthrough();

adminApp.get('/events', async (c) => {
    try {
        const events = await eventsService.getAll(c.env);
        return c.json(events);
    } catch (error) {
        return c.json({ error: 'Failed to get events' }, 500);
    }
});

adminApp.get('/events/pinned', async (c) => {
    try {
        const events = await eventsService.getAll(c.env);
        const pinned = events.filter(e => e.isPinned);
        return c.json(pinned);
    } catch (error) {
        return c.json({ error: 'Failed to get pinned events' }, 500);
    }
});

adminApp.get('/events/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const event = await eventsService.getById(id, c.env);

        if (!event) {
            return c.json({ error: 'Event not found' }, 404);
        }

        return c.json(event);
    } catch (error) {
        return c.json({ error: 'Failed to get event' }, 500);
    }
});

adminApp.post('/events', zValidator('json', eventSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        const event = await eventsService.create({
            title: data.title,
            date: data.date,
            location: data.location,
            description: data.description || '',
            image: data.image || '',
            registrationLink: data.registrationLink || '',
            isPinned: data.isPinned || false,
            status: 'published',
            createdAt: now,
            updatedAt: now,
        }, c.env);

        return c.json(event, 201);
    } catch (error) {
        console.error('Create event error:', error);
        return c.json({ error: 'Failed to create event: ' + ((error as any)?.message || String(error)) }, 500);
    }
});

adminApp.put('/events/:id', zValidator('json', eventSchema.partial()), async (c) => {
    try {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const updated = await eventsService.update(id, data, c.env);

        if (!updated) {
            return c.json({ error: 'Event not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update event' }, 500);
    }
});

adminApp.delete('/events/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await eventsService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Event not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete event' }, 500);
    }
});

// ===== PLAQUETTES ROUTES =====

const plaquetteSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    url: z.string().url().or(z.literal('')),
    thumbnail: z.string().url().optional().or(z.literal('')),
}).passthrough();

adminApp.get('/plaquettes', async (c) => {
    try {
        const plaquettes = await plaquettesService.getAll(c.env);
        return c.json(plaquettes);
    } catch (error) {
        return c.json({ error: 'Failed to get plaquettes' }, 500);
    }
});

adminApp.get('/plaquettes/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const plaquette = await plaquettesService.getById(id, c.env);

        if (!plaquette) {
            return c.json({ error: 'Plaquette not found' }, 404);
        }

        return c.json(plaquette);
    } catch (error) {
        return c.json({ error: 'Failed to get plaquette' }, 500);
    }
});

adminApp.post('/plaquettes', zValidator('json', plaquetteSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        const plaquette = await plaquettesService.create({
            name: data.name,
            description: data.description || '',
            url: data.url,
            thumbnail: data.thumbnail || '',
            uploadedAt: now,
            updatedAt: now,
        }, c.env);

        return c.json(plaquette, 201);
    } catch (error: any) {
        console.error('Create plaquette error:', error?.message || error);
        return c.json({ error: 'Failed to create plaquette: ' + (error?.message || String(error)) }, 500);
    }
});

adminApp.put('/plaquettes/:id', zValidator('json', plaquetteSchema.partial()), async (c) => {
    try {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const updated = await plaquettesService.update(id, data, c.env);

        if (!updated) {
            return c.json({ error: 'Plaquette not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update plaquette' }, 500);
    }
});

adminApp.delete('/plaquettes/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await plaquettesService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Plaquette not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete plaquette' }, 500);
    }
});

// ===== NEWSLETTER ROUTES =====

const subscriberSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    source: z.string().optional(),
    tags: z.string().optional(),
}).passthrough();

adminApp.get('/newsletter', async (c) => {
    try {
        const subscribers = await newsletterService.getAll(c.env);
        return c.json(subscribers);
    } catch (error) {
        return c.json({ error: 'Failed to get subscribers' }, 500);
    }
});

adminApp.get('/newsletter/subscribers', async (c) => {
    try {
        const subscribers = await newsletterService.getAll(c.env);
        return c.json(subscribers);
    } catch (error) {
        return c.json({ error: 'Failed to get subscribers' }, 500);
    }
});

adminApp.post('/newsletter', zValidator('json', subscriberSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        const subscriber = await newsletterService.create({
            ...data,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            source: data.source || 'admin',
            tags: data.tags || '',
            subscribedAt: now,
            status: 'active',
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
            } catch (e) { console.error('Brevo contact add failed:', e); }
        }

        return c.json(subscriber, 201);
    } catch (error: any) {
        console.error('Add subscriber error:', error?.message || error);
        return c.json({ error: 'Failed to add subscriber: ' + (error?.message || String(error)) }, 500);
    }
});

adminApp.delete('/newsletter/subscribers/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await newsletterService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Subscriber not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete subscriber' }, 500);
    }
});

// Quick Send Email via Brevo Transactional API
adminApp.post('/newsletter/send', async (c) => {
    try {
        const { subject, content } = await c.req.json();
        if (!subject || !content) {
            return c.json({ error: 'Subject and content are required' }, 400);
        }

        const subscribers = await newsletterService.getAll(c.env);
        const activeSubscribers = subscribers.filter(s => s.status === 'active');

        if (activeSubscribers.length === 0) {
            return c.json({ error: 'No active subscribers' }, 400);
        }

        console.log(`Sending email "${subject}" to ${activeSubscribers.length} subscribers via Brevo...`);

        // Build HTML email
        const htmlContent = `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">CEM GROUP</h1>
                </div>
                <div style="padding: 30px; background: #fff;">
                    <h2 style="color: #1a1a1a;">${subject}</h2>
                    <div style="color: #4a5568; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>
                </div>
                <div style="background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} CEM GROUP - Tous droits réservés</p>
                </div>
            </div>`;

        const recipients = activeSubscribers.map(s => ({
            email: s.email,
            name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.email
        }));

        const result = await sendBrevoTransactionalEmail(recipients, subject, htmlContent, c.env);

        if (result.success) {
            return c.json({ success: true, count: activeSubscribers.length });
        } else {
            return c.json({ success: false, error: `Failed to send to ${result.failedCount} recipients`, count: activeSubscribers.length - (result.failedCount || 0) });
        }
    } catch (error: any) {
        console.error('Send error:', error);
        return c.json({ error: 'Failed to send emails: ' + (error?.message || String(error)) }, 500);
    }
});

// Export to Excel
adminApp.get('/newsletter/export', async (c) => {
    try {
        const subscribers = await newsletterService.getAll(c.env);
        const buffer = await exportSubscribersToExcel(subscribers);
        const filename = generateExportFilename();

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return c.json({ error: 'Failed to export subscribers' }, 500);
    }
});

// Campaign management
const campaignSchema = z.object({
    name: z.string(),
    subject: z.string(),
    htmlContent: z.string(),
    listIds: z.array(z.number()),
    scheduledAt: z.string().optional(),
});

adminApp.post('/newsletter/campaign', zValidator('json', campaignSchema), async (c) => {
    try {
        const data = c.req.valid('json');

        const campaign: BrevoCampaign = {
            name: data.name,
            subject: data.subject,
            sender: {
                name: 'CEM GROUP',
                email: 'contact@cembymazini.ma',
            },
            htmlContent: data.htmlContent,
            recipients: {
                listIds: data.listIds,
            },
            scheduledAt: data.scheduledAt,
        };

        const campaignId = await createBrevoCampaign(campaign, c.env);

        // Send immediately if no schedule
        if (!data.scheduledAt) {
            await sendBrevoCampaign(campaignId, c.env);
        }

        return c.json({ campaignId, success: true });
    } catch (error) {
        console.error('Campaign creation error:', error);
        return c.json({ error: 'Failed to create campaign' }, 500);
    }
});

adminApp.get('/newsletter/stats/:campaignId', async (c) => {
    try {
        const campaignId = parseInt(c.req.param('campaignId'));
        const stats = await getCampaignStats(campaignId, c.env);
        return c.json(stats);
    } catch (error) {
        return c.json({ error: 'Failed to get campaign stats' }, 500);
    }
});

adminApp.get('/newsletter/campaigns', async (c) => {
    try {
        const campaigns = await getAllCampaigns(c.env);
        return c.json(campaigns);
    } catch (error) {
        return c.json({ error: 'Failed to get campaigns' }, 500);
    }
});

adminApp.get('/newsletter/lists', async (c) => {
    try {
        const lists = await getBrevoLists(c.env);
        return c.json(lists);
    } catch (error) {
        return c.json({ error: 'Failed to get lists' }, 500);
    }
});

// ===== POPUP ROUTES =====

const popupSchema = z.object({
    title: z.string().min(1),
    image: z.string().url().optional().or(z.literal('')),
    link: z.string().url().optional().or(z.literal('')),
    isActive: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
}).passthrough();

adminApp.get('/popups', async (c) => {
    try {
        const popups = await popupService.getAll(c.env);
        return c.json(popups);
    } catch (error) {
        return c.json({ error: 'Failed to get popups' }, 500);
    }
});

adminApp.get('/popups/active', async (c) => {
    try {
        const popups = await popupService.getAll(c.env);
        const active = popups.find(p => p.isActive); // Assuming single active popup for now
        if (!active) return c.json(null);
        return c.json(active);
    } catch (error) {
        return c.json({ error: 'Failed to get active popup' }, 500);
    }
});

adminApp.post('/popups', zValidator('json', popupSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const now = new Date().toISOString();

        // If setting to active, deactivate others (optional logic, enforcing single active popup)
        if (data.isActive) {
            const all = await popupService.getAll(c.env);
            for (const p of all) {
                if (p.isActive) {
                    await popupService.update(p.id, { ...p, isActive: false }, c.env);
                }
            }
        }

        const popup = await popupService.create({
            title: data.title,
            image: data.image || '',
            link: data.link || '',
            isActive: data.isActive,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            createdAt: now,
            updatedAt: now,
        }, c.env);

        return c.json(popup, 201);
    } catch (error) {
        console.error('Create popup error:', error);
        return c.json({ error: 'Failed to create popup' }, 500);
    }
});

adminApp.put('/popups/:id', zValidator('json', popupSchema.partial()), async (c) => {
    try {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        // If setting to active, deactivate others
        if (data.isActive) {
            const all = await popupService.getAll(c.env);
            for (const p of all) {
                if (p.isActive && p.id !== id) {
                    await popupService.update(p.id, { ...p, isActive: false }, c.env);
                }
            }
        }

        const updated = await popupService.update(id, data, c.env);

        if (!updated) {
            return c.json({ error: 'Popup not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update popup' }, 500);
    }
});

adminApp.delete('/popups/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await popupService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Popup not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete popup' }, 500);
    }
});

// ===== MEDIA UPLOAD ROUTES =====

adminApp.post('/media/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        const type = body['type'] as string;
        const folder = body['folder'] as string || 'cem-group';

        if (!file || typeof file === 'string') {
            return c.json({ error: 'No file provided' }, 400);
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let result;

        if (type === 'image') {
            result = await uploadImage(buffer, folder);
        } else if (type === 'video') {
            result = await uploadVideo(buffer, folder);
        } else if (type === 'pdf') {
            result = await uploadPDF(buffer, folder);
        } else {
            return c.json({ error: 'Invalid file type' }, 400);
        }

        return c.json(result);
    } catch (error) {
        console.error('Upload error:', error);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});

adminApp.delete('/media/:publicId', async (c) => {
    try {
        const publicId = c.req.param('publicId');
        const resourceType = c.req.query('type') as 'image' | 'video' | 'raw' || 'image';

        const success = await deleteFile(publicId, resourceType);

        if (!success) {
            return c.json({ error: 'Failed to delete file' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete file' }, 500);
    }
});



// ===== INITIALIZE SHEETS =====
adminApp.post('/init', async (c) => {
    try {
        await initializeSheets(c.env);
        return c.json({ success: true, message: 'Sheets initialized' });
    } catch (error) {
        console.error('Init error:', error);
        return c.json({ error: 'Failed to initialize sheets' }, 500);
    }
});

adminApp.get('/ping', (c) => c.json({ status: 'ok', message: 'pong' }));

adminApp.get('/recruitment/cv/:id', async (c) => {
    const id = c.req.param('id');
    console.log(`CV Proxy Request for ID: ${id}`);

    try {
        const application = await recruitmentService.getById(id, c.env);
        if (!application || !application.cvUrl) {
            console.warn(`CV not found for ID: ${id}`);
            return c.json({ error: 'CV not found' }, 404);
        }

        console.log(`Original CV URL: ${application.cvUrl}`);

        // Strategy 1: Try the direct stored URL (works for type=upload, access_mode=public)
        let response = await fetch(application.cvUrl);

        // Strategy 2: If direct fails with 401, use Cloudinary API download URL
        if (!response.ok && response.status === 401) {
            console.log('CV proxy: direct URL returned 401, trying API download URL');
            const downloadUrl = await generateApiDownloadUrl(application.cvUrl, {
                CLOUDINARY_CLOUD_NAME: c.env?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
                CLOUDINARY_API_KEY: c.env?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '',
                CLOUDINARY_API_SECRET: c.env?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || '',
            });
            if (downloadUrl) {
                console.log('CV proxy: trying API download URL');
                response = await fetch(downloadUrl);
            }
        }

        if (!response.ok) {
            console.error(`CV proxy failed: ${response.status}`);
            return c.json({ error: 'Failed to fetch CV', status: response.status }, 502);
        }

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="CV_${application.firstName}_${application.lastName}.pdf"`);
        if (response.headers.get('Content-Length')) {
            headers.set('Content-Length', response.headers.get('Content-Length')!);
        }

        return new Response(response.body, { status: 200, headers });
    } catch (error) {
        console.error('CV Proxy Fatal Error:', error);
        return c.json({ error: 'Internal proxy error' }, 500);
    }
});

adminApp.get('/recruitment', async (c) => {
    try {
        const applications = await recruitmentService.getAll(c.env);
        return c.json(applications);
    } catch (error) {
        console.error('Failed to get recruitment applications:', error);
        return c.json({ error: 'Failed to get applications' }, 500);
    }
});

adminApp.get('/recruitment/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const application = await recruitmentService.getById(id, c.env);

        if (!application) {
            return c.json({ error: 'Application not found' }, 404);
        }

        return c.json(application);
    } catch (error) {
        return c.json({ error: 'Failed to get application' }, 500);
    }
});

const recruitmentUpdateSchema = z.object({
    status: z.enum(['new', 'reviewed', 'contacted', 'rejected']).optional(),
}).passthrough();

adminApp.put('/recruitment/:id', zValidator('json', recruitmentUpdateSchema), async (c) => {
    try {
        const id = c.req.param('id');
        const data = c.req.valid('json');

        const updated = await recruitmentService.update(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        }, c.env);

        if (!updated) {
            return c.json({ error: 'Application not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update application' }, 500);
    }
});

adminApp.delete('/recruitment/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const success = await recruitmentService.delete(id, c.env);

        if (!success) {
            return c.json({ error: 'Application not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete application' }, 500);
    }
});

// ===== FORMATIONS MANAGEMENT =====

adminApp.get('/formations', async (c) => {
    try {
        const formations = await formationsService.getAll(c.env);
        return c.json(formations);
    } catch (error: any) {
        console.error('Formations GET error:', error?.message || error);
        return c.json({ error: 'Failed to get formations', details: error?.message || String(error) }, 500);
    }
});

adminApp.post('/formations', authMiddleware, async (c) => {
    try {
        const data = await c.req.json();
        const formation = await formationsService.create({
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, c.env);
        return c.json(formation);
    } catch (error) {
        return c.json({ error: 'Failed to create formation' }, 500);
    }
});

adminApp.put('/formations/:id', authMiddleware, async (c) => {
    try {
        const id = c.req.param('id');
        const data = await c.req.json();
        const updated = await formationsService.update(id, {
            ...data,
            updatedAt: new Date().toISOString(),
        }, c.env);
        if (!updated) return c.json({ error: 'Formation not found' }, 404);
        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Failed to update formation' }, 500);
    }
});

adminApp.delete('/formations/:id', authMiddleware, async (c) => {
    try {
        const id = c.req.param('id');
        const success = await formationsService.delete(id, c.env);
        if (!success) return c.json({ error: 'Formation not found' }, 404);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete formation' }, 500);
    }
});

adminApp.post('/formations/seed', authMiddleware, async (c) => {
    try {
        const seedData = [
            { title: 'E-Learning Digital', description: 'Plateforme LMS compl\u00e8te et digitalisation de vos contenus de formation', imageUrl: 'https://www.genspark.ai/api/files/s/iFgfNJl7', icon: 'fas fa-graduation-cap', bullets: 'Modules e-learning interactifs,Plateforme LMS personnalis\u00e9e,Suivi et certifications', tags: 'E-Learning,Intra', category: 'Digitales', ctaText: 'Demander un devis', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]', iconColor: '#D4AF37', order: 1, status: 'active' as const, badge: '' },
            { title: 'LinkedIn Formation One-to-One', description: 'Accompagnement personnalis\u00e9 pour optimiser votre pr\u00e9sence LinkedIn', imageUrl: 'https://www.genspark.ai/api/files/s/iMeFueig', icon: 'fab fa-linkedin', bullets: 'Optimisation profil LinkedIn,Strat\u00e9gie de contenu personnalis\u00e9e,Personal Branding expert', tags: 'One-to-One,Visio', category: 'Digitales', ctaText: 'R\u00e9server ma session', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-[#0077B5]', iconColor: '#0077B5', order: 2, status: 'active' as const, badge: 'N\u00b01 GROWTH by FAVIKON' },
            { title: 'LinkedIn Accompagnement Team', description: 'Formation collective pour transformer vos \u00e9quipes en ambassadeurs LinkedIn', imageUrl: 'https://www.genspark.ai/api/files/s/V72R4i0s', icon: 'fab fa-linkedin', bullets: 'Employee Advocacy,Social Selling Team,Strat\u00e9gie d\'\u00e9quipe', tags: 'Team,Inter/Intra', category: 'Digitales', ctaText: 'Former mon \u00e9quipe', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-[#0077B5]', iconColor: '#0077B5', order: 3, status: 'active' as const, badge: '' },
            { title: 'Marketing Digital', description: 'Ma\u00eetrisez tous les leviers du marketing digital moderne', imageUrl: 'https://www.genspark.ai/api/files/s/q44gmQFC', icon: 'fas fa-bullhorn', bullets: 'SEO & SEA avanc\u00e9s,Social Media Marketing,Analytics & ROI', tags: 'Pr\u00e9sentiel,Inter/Intra', category: 'Digitales', ctaText: 'S\'inscrire', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]', iconColor: '#D4AF37', order: 4, status: 'active' as const, badge: '' },
            { title: 'Cr\u00e9ation de Contenu', description: 'Storytelling, copywriting et content marketing percutants', imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop', icon: 'fas fa-pen-fancy', bullets: 'Storytelling & Copywriting,Content Marketing strat\u00e9gique,Visual Branding', tags: 'Atelier,Distance', category: 'Digitales', ctaText: 'D\u00e9couvrir', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]', iconColor: '#D4AF37', order: 5, status: 'active' as const, badge: '' },
            { title: 'IA & Innovation', description: 'Acculturation et d\u00e9mystification de l\'Intelligence Artificielle', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', icon: 'fas fa-robot', bullets: 'IA g\u00e9n\u00e9rative (ChatGPT, MidJourney),Automatisation & productivit\u00e9,Cas d\'usage m\u00e9tiers', tags: 'Innovation,Workshop', category: 'Digitales', ctaText: 'Explorer', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-gradient-to-r from-[#D4AF37] to-black', iconColor: '#D4AF37', order: 6, status: 'active' as const, badge: '' },
            { title: 'Leadership & Management', description: 'D\u00e9veloppez un leadership inspirant et efficace', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop', icon: 'fas fa-crown', bullets: 'Management d\'\u00e9quipe,Prise de d\u00e9cision strat\u00e9gique,Leadership inspirant', tags: 'Pr\u00e9sentiel,2 jours', category: 'Management', ctaText: 'Rejoindre', ctaLink: '/#contact', borderColor: '#000000', ctaColor: 'bg-black', iconColor: '#000000', order: 7, status: 'active' as const, badge: '' },
            { title: 'Formation en Communication', description: 'Communication efficace et prise de parole en public', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop', icon: 'fas fa-comments', bullets: 'Communication interpersonnelle,Prise de parole en public,Gestion des conflits', tags: 'Inter/Intra,3 jours', category: 'Management', ctaText: 'S\'inscrire', ctaLink: '/#contact', borderColor: '#000000', ctaColor: 'bg-black', iconColor: '#000000', order: 8, status: 'active' as const, badge: '' },
            { title: 'Bien-\u00eatre au Travail', description: 'QVT, gestion du stress et \u00e9quilibre vie pro/perso', imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop', icon: 'fas fa-spa', bullets: 'Gestion du stress,\u00c9quilibre vie pro/perso,Sant\u00e9 mentale', tags: 'Atelier,1 jour', category: 'Management', ctaText: 'D\u00e9couvrir', ctaLink: '/#contact', borderColor: '#22c55e', ctaColor: 'bg-green-600', iconColor: '#16a34a', order: 9, status: 'active' as const, badge: '' },
            { title: 'Coaching Dirigeants', description: 'Accompagnement personnalis\u00e9 des dirigeants et C-level', imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop', icon: 'fas fa-handshake', bullets: 'Coaching individuel sur mesure,Plan d\'actions personnalis\u00e9,R\u00e9v\u00e9lation de talents', tags: 'One-to-One,6 sessions', category: 'Management', ctaText: 'Commencer', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]', iconColor: '#D4AF37', order: 10, status: 'active' as const, badge: '' },
            { title: 'Force de Vente & N\u00e9gociation', description: 'Techniques de vente et n\u00e9gociation commerciale avanc\u00e9es', imageUrl: 'https://images.unsplash.com/photo-1556742400-b5b7c256ff5e?w=400&h=300&fit=crop', icon: 'fas fa-handshake-alt', bullets: 'Techniques de vente avanc\u00e9es,N\u00e9gociation commerciale,Closing et fid\u00e9lisation', tags: 'Intensif,3 jours', category: 'Management', ctaText: 'Booster mes ventes', ctaLink: '/#contact', borderColor: '#ef4444', ctaColor: 'bg-red-600', iconColor: '#dc2626', order: 11, status: 'active' as const, badge: '' },
            { title: 'Management d\'\u00c9quipe Virtuelle', description: 'Pilotage d\'\u00e9quipes \u00e0 distance et t\u00e9l\u00e9travail', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop', icon: 'fas fa-video', bullets: 'Travail \u00e0 distance efficace,Outils collaboratifs,Coh\u00e9sion d\'\u00e9quipe virtuelle', tags: '100% Distanciel,2 jours', category: 'Management', ctaText: 'Rejoindre', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-black', iconColor: '#000000', order: 12, status: 'active' as const, badge: '' },
            { title: 'Gestion du Changement', description: 'Conduite du changement et transformation organisationnelle', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop', icon: 'fas fa-sync-alt', bullets: 'Conduite du changement,Accompagnement transformation,Gestion des r\u00e9sistances', tags: 'Inter/Intra,2 jours', category: 'Management', ctaText: 'Transformer', ctaLink: '/#contact', borderColor: '#f97316', ctaColor: 'bg-orange-600', iconColor: '#ea580c', order: 13, status: 'active' as const, badge: '' },
            { title: 'Intelligence \u00c9motionnelle', description: 'D\u00e9velopper son EQ pour des relations professionnelles efficaces', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop', icon: 'fas fa-heart-pulse', bullets: 'D\u00e9veloppement de l\'EQ,Relations interpersonnelles,Empathie manag\u00e9riale', tags: 'Atelier,2 jours', category: 'Management', ctaText: 'D\u00e9velopper mon EQ', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-[#D4AF37]', iconColor: '#D4AF37', order: 14, status: 'active' as const, badge: '' },
            { title: 'Prise de D\u00e9cision Strat\u00e9gique', description: 'M\u00e9thodes et outils pour des d\u00e9cisions complexes \u00e9clair\u00e9es', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop', icon: 'fas fa-chess', bullets: 'M\u00e9thodes de d\u00e9cision,Analyse de situations complexes,Gestion des risques', tags: 'Managers,2 jours', category: 'Management', ctaText: 'D\u00e9cider mieux', ctaLink: '/#contact', borderColor: '#D4AF37', ctaColor: 'bg-black', iconColor: '#000000', order: 15, status: 'active' as const, badge: '' },
        ];

        const results = [];
        for (const item of seedData) {
            const created = await formationsService.create({
                ...item,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }, c.env);
            results.push(created);
        }

        return c.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('Seed formations error:', error?.message || error);
        return c.json({ error: 'Failed to seed formations', details: error?.message || String(error) }, 500);
    }
});

export default adminApp;
