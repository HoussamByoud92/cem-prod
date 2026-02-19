/**
 * Email service for CEM GROUP
 * Handles contact form emails and newsletter campaigns
 */

// Contact form email configuration
const CONTACT_EMAIL = 'contact@cembymazini.ma';

export interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    service?: string;
    message: string;
    source?: string;
}

/**
 * Send contact form notification email via Google Apps Script (GAS)
 * Uses the existing GAS deployment to send emails via MailApp service
 */
export const sendContactEmail = async (data: ContactFormData, env?: any): Promise<boolean> => {
    const gasUrl = env?.GAS_WEB_APP_URL || process.env.GAS_WEB_APP_URL;
    const gasToken = env?.GAS_API_TOKEN || process.env.GAS_API_TOKEN;

    if (!gasUrl) {
        console.warn('GAS_WEB_APP_URL not configured, logging contact form:', data);
        return true;
    }

    const sourceLabel = data.source || 'Site Web';
    const subject = `[${sourceLabel}] Nouveau contact: ${data.name}`;
    const htmlContent = generateContactEmailHTML(data);

    try {
        const url = new URL(gasUrl);
        url.searchParams.append('action', 'sendContactEmail');
        url.searchParams.append('token', gasToken || '');

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject,
                htmlContent,
                replyTo: { email: data.email, name: data.name },
                senderName: data.name,
                source: sourceLabel,
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('GAS contact email error:', err);
            return false;
        }

        const result = await response.json() as any;
        return result.success === true;
    } catch (error) {
        console.error('Error sending contact email via GAS:', error);
        return false;
    }
};

/**
 * Generate HTML email template for contact form
 */
const generateContactEmailHTML = (data: ContactFormData): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #D4AF37; font-size: 24px; }
        .content { padding: 30px; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
        .field-value { color: #4a5568; padding: 10px; background: #f7fafc; border-radius: 5px; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Nouveau Message de Contact</h1>
          <p style="color: #D4AF37; margin: 8px 0 0 0; font-size: 14px;">Source: ${data.source || 'Site Web'}</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Formulaire source:</div>
            <div class="field-value" style="background: #D4AF37; color: white; font-weight: bold;">${data.source || 'Site Web'}</div>
          </div>
          <div class="field">
            <div class="field-label">Nom:</div>
            <div class="field-value">${data.name}</div>
          </div>
          <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
          </div>
          ${data.phone ? `
          <div class="field">
            <div class="field-label">Téléphone:</div>
            <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
          </div>
          ` : ''}
          ${data.company ? `
          <div class="field">
            <div class="field-label">Entreprise:</div>
            <div class="field-value">${data.company}</div>
          </div>
          ` : ''}
          ${data.service ? `
          <div class="field">
            <div class="field-label">Service demandé:</div>
            <div class="field-value">${data.service}</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="field-label">Message:</div>
            <div class="field-value">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <div class="footer">
          <p>Ce message a été envoyé depuis le formulaire <strong>${data.source || 'Contact'}</strong> de cembymazini.ma</p>
          <p>© ${new Date().getFullYear()} CEM GROUP - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
    `;
};

// ===== BREVO (Newsletter) Integration =====

const BREVO_API_URL = 'https://api.brevo.com/v3';

const getBrevoApiKey = (env?: any): string => {
    return env?.BREVO_API_KEY || process.env.BREVO_API_KEY || '';
};

export interface BrevoContact {
    email: string;
    attributes?: {
        FIRSTNAME?: string;
        LASTNAME?: string;
        [key: string]: any;
    };
    listIds?: number[];
}

export interface BrevoCampaign {
    name: string;
    subject: string;
    sender: {
        name: string;
        email: string;
    };
    htmlContent: string;
    recipients: {
        listIds: number[];
    };
    scheduledAt?: string;
}

export interface CampaignStats {
    campaignId: number;
    name: string;
    subject: string;
    status: string;
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscriptions: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscriptionRate: number;
    sentDate: string;
}

/**
 * Add a contact to Brevo
 */
export const addBrevoContact = async (contact: BrevoContact, env?: any): Promise<boolean> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) { console.warn('No BREVO_API_KEY configured'); return false; }

        const response = await fetch(`${BREVO_API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(contact),
        });

        return response.ok || response.status === 204;
    } catch (error) {
        console.error('Error adding contact to Brevo:', error);
        return false;
    }
};

/**
 * Send a transactional email via Brevo (for quick mail to subscriber list)
 */
export const sendBrevoTransactionalEmail = async (
    recipients: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
    env?: any
): Promise<{ success: boolean; messageId?: string; failedCount?: number }> => {
    const apiKey = getBrevoApiKey(env);
    if (!apiKey) return { success: false };

    // Brevo limits to 50 recipients per transactional call, so batch
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        try {
            const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': apiKey,
                },
                body: JSON.stringify({
                    sender: { name: 'CEM GROUP', email: 'contact@cembymazini.ma' },
                    to: batch.map(r => ({ email: r.email, name: r.name || r.email })),
                    subject: subject,
                    htmlContent: htmlContent,
                }),
            });

            if (response.ok) {
                sentCount += batch.length;
            } else {
                const err = await response.json().catch(() => ({}));
                console.error('Brevo transactional send error:', err);
                failedCount += batch.length;
            }
        } catch (e) {
            console.error('Brevo transactional send error:', e);
            failedCount += batch.length;
        }
    }

    return { success: failedCount === 0, messageId: `batch-${Date.now()}`, failedCount };
};

/**
 * Create an email campaign in Brevo
 */
export const createBrevoCampaign = async (campaign: BrevoCampaign, env?: any): Promise<number> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) throw new Error('No BREVO_API_KEY configured');

        const response = await fetch(`${BREVO_API_URL}/emailCampaigns`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(campaign),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Brevo API error: ${JSON.stringify(err)}`);
        }

        const data = await response.json() as any;
        return data.id;
    } catch (error) {
        console.error('Error creating Brevo campaign:', error);
        throw error;
    }
};

/**
 * Send a campaign immediately
 */
export const sendBrevoCampaign = async (campaignId: number, env?: any): Promise<boolean> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) throw new Error('No BREVO_API_KEY configured');

        const response = await fetch(`${BREVO_API_URL}/emailCampaigns/${campaignId}/sendNow`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
            },
        });

        return response.ok || response.status === 204;
    } catch (error) {
        console.error('Error sending Brevo campaign:', error);
        throw error;
    }
};

/**
 * Get campaign statistics
 */
export const getCampaignStats = async (campaignId: number, env?: any): Promise<CampaignStats> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) throw new Error('No BREVO_API_KEY configured');

        const response = await fetch(`${BREVO_API_URL}/emailCampaigns/${campaignId}`, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
            },
        });

        const data = await response.json() as any;
        const stats = data.statistics?.globalStats || {};

        return {
            campaignId,
            name: data.name || '',
            subject: data.subject || '',
            status: data.status || 'unknown',
            sent: stats.sent || 0,
            delivered: stats.delivered || 0,
            opens: stats.uniqueOpens || 0,
            clicks: stats.uniqueClicks || 0,
            bounces: (stats.hardBounces || 0) + (stats.softBounces || 0),
            unsubscriptions: stats.unsubscriptions || 0,
            openRate: stats.sent > 0 ? ((stats.uniqueOpens || 0) / stats.sent) * 100 : 0,
            clickRate: stats.sent > 0 ? ((stats.uniqueClicks || 0) / stats.sent) * 100 : 0,
            bounceRate: stats.sent > 0 ? (((stats.hardBounces || 0) + (stats.softBounces || 0)) / stats.sent) * 100 : 0,
            unsubscriptionRate: stats.sent > 0 ? ((stats.unsubscriptions || 0) / stats.sent) * 100 : 0,
            sentDate: data.sentDate || data.createdAt || '',
        };
    } catch (error) {
        console.error('Error getting campaign stats:', error);
        throw error;
    }
};

/**
 * Get all campaigns
 */
export const getAllCampaigns = async (env?: any): Promise<any[]> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) return [];

        const response = await fetch(`${BREVO_API_URL}/emailCampaigns?limit=50&sort=desc`, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
            },
        });

        const data = await response.json() as any;
        return data.campaigns || [];
    } catch (error) {
        console.error('Error getting campaigns:', error);
        return [];
    }
};

/**
 * Get Brevo contact lists
 */
export const getBrevoLists = async (env?: any): Promise<any[]> => {
    try {
        const apiKey = getBrevoApiKey(env);
        if (!apiKey) return [];

        const response = await fetch(`${BREVO_API_URL}/contacts/lists?limit=50`, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
            },
        });

        const data = await response.json() as any;
        return data.lists || [];
    } catch (error) {
        console.error('Error getting Brevo lists:', error);
        return [];
    }
};
/**
 * Send a newsletter via Brevo using BCC for privacy
 */
export const sendBrevoNewsletter = async (
    recipients: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
    env?: any
): Promise<{ success: boolean; messageId?: string; failedCount?: number }> => {
    const apiKey = getBrevoApiKey(env);
    if (!apiKey) return { success: false };

    // Brevo limits, batching by 40 to be safe (limit is 50 usually)
    const batchSize = 40;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        try {
            const body = {
                sender: { name: 'CEM GROUP', email: 'm.mazini@cembymazini.ma' },
                to: [{ email: 'Contact@cembymazini.ma', name: 'CEM Newsletter' }], // Placeholder TO
                bcc: batch.map(r => ({ email: r.email, name: r.name || r.email })),
                subject: subject,
                htmlContent: htmlContent,
            };

            const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': apiKey,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                sentCount += batch.length;
            } else {
                const err = await response.json().catch(() => ({}));
                console.error('Brevo newsletter send error:', err);
                failedCount += batch.length;
            }
        } catch (e) {
            console.error('Brevo newsletter send error:', e);
            failedCount += batch.length;
        }

        // Small delay to be gentle
        await new Promise(r => setTimeout(r, 200));
    }

    return { success: failedCount === 0, messageId: `newsletter-${Date.now()}`, failedCount };
};
