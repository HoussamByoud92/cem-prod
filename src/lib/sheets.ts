import { nanoid } from 'nanoid';

// Google Apps Script configuration
const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || '';
const GAS_API_TOKEN = process.env.GAS_API_TOKEN || '';

// Sheet names
export const SHEETS = {
  BLOG: 'Blog',
  EVENTS: 'Events',
  PLAQUETTES: 'Plaquettes',
  NEWSLETTER: 'Newsletter',
  POPUPS: 'Popups',
  RECRUITMENT: 'Recruitment',
  FORMATIONS: 'Formations',
} as const;

// Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  coverImage: string;
  status: 'draft' | 'published';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: string;
  category: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  isPinned: boolean;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  registrationLink: string;
}

export interface Plaquette {
  id: string;
  name: string;
  description: string;
  url: string;
  thumbnail: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  source: string;
  tags: string;
  lastCampaignSent: string;
}

export interface Popup {
  id: string;
  title: string;
  image: string;
  link: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recruitment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  coverLetter: string;
  cvUrl: string;
  portfolio: string;
  status: 'new' | 'reviewed' | 'contacted' | 'rejected';
  submittedAt: string;
  updatedAt: string;
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  icon: string;
  bullets: string;
  tags: string;
  category: string;
  ctaText: string;
  ctaLink: string;
  borderColor: string;
  ctaColor: string;
  iconColor: string;
  order: number;
  status: 'active' | 'draft';
  badge: string;
  createdAt: string;
  updatedAt: string;
}

// Generic CRUD operations interfacing with GAS
export class SheetsService<T extends { id: string }> {
  constructor(private sheetName: string) { }

  private async request(action: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET', body: any = null, env?: any, retried = false): Promise<any> {
    const baseUrl = env?.GAS_WEB_APP_URL || process.env.GAS_WEB_APP_URL;
    const token = env?.GAS_API_TOKEN || process.env.GAS_API_TOKEN;

    if (!baseUrl) {
      console.warn('GAS_WEB_APP_URL not configured');
      return [];
    }

    const url = new URL(baseUrl);
    url.searchParams.append('token', token || '');
    url.searchParams.append('sheet', this.sheetName);
    url.searchParams.append('action', action);

    // Add extra params to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    try {
      const controller = new AbortController();
      // Vercel Hobby is max 10s, give GAS 8s before failing gracefully
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'CEM-Group-App/1.0',
        },
        signal: controller.signal,
      };

      if (body) {
        options.body = JSON.stringify(body);
        // GAS requires POST to handle body payload effectively in strict modes
        options.method = 'POST';
      } else if (method === 'POST') {
        options.method = 'POST';
      }

      const response = await fetch(url.toString(), options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GAS Error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      if (data.error) {
        // If sheet not found, try to create it automatically and retry
        if (data.error.includes('not found') && !retried) {
          console.log(`Sheet '${this.sheetName}' not found, creating automatically...`);
          await this.createSheet(env);
          return this.request(action, params, method, body, env, true);
        }
        throw new Error(`GAS API Error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error(`Error in SheetsService (${this.sheetName}, ${action}):`, error);
      throw error;
    }
  }

  private async createSheet(env?: any) {
    const baseUrl = env?.GAS_WEB_APP_URL || process.env.GAS_WEB_APP_URL;
    const token = env?.GAS_API_TOKEN || process.env.GAS_API_TOKEN;

    if (!baseUrl) return;

    try {
      const url = new URL(baseUrl);
      url.searchParams.append('token', token || '');
      url.searchParams.append('sheet', this.sheetName);
      url.searchParams.append('action', 'setup');

      const response = await fetch(url.toString(), { method: 'POST' });
      const data = await response.json() as any;
      console.log(`Sheet setup result for '${this.sheetName}':`, data);
    } catch (error) {
      console.error(`Failed to create sheet '${this.sheetName}':`, error);
    }
  }

  async getAll(env?: any): Promise<T[]> {
    const data = await this.request('getAll', {}, 'GET', null, env);
    return Array.isArray(data) ? data : [];
  }

  async getById(id: string, env?: any): Promise<T | null> {
    try {
      return await this.request('getById', { id }, 'GET', null, env);
    } catch (e) {
      return null;
    }
  }

  async create(data: Omit<T, 'id'>, env?: any): Promise<T> {
    const id = nanoid();
    const newItem = { id, ...data };
    return await this.request('create', {}, 'POST', newItem, env);
  }

  async update(id: string, data: Partial<T>, env?: any): Promise<T | null> {
    return await this.request('update', { id }, 'POST', data, env);
  }

  async delete(id: string, env?: any): Promise<boolean> {
    const result = await this.request('delete', { id }, 'POST', null, env);
    return result.success === true;
  }
}

// Service instances
export const blogService = new SheetsService<BlogPost>(SHEETS.BLOG);
export const eventsService = new SheetsService<Event>(SHEETS.EVENTS);
export const plaquettesService = new SheetsService<Plaquette>(SHEETS.PLAQUETTES);
export const newsletterService = new SheetsService<NewsletterSubscriber>(SHEETS.NEWSLETTER);
export const popupService = new SheetsService<Popup>(SHEETS.POPUPS);
export const recruitmentService = new SheetsService<Recruitment>(SHEETS.RECRUITMENT);
export const formationsService = new SheetsService<Formation>(SHEETS.FORMATIONS);

// Initialize sheets
export const initializeSheets = async (env?: any) => {
  const baseUrl = env?.GAS_WEB_APP_URL || process.env.GAS_WEB_APP_URL;
  const token = env?.GAS_API_TOKEN || process.env.GAS_API_TOKEN;

  if (!baseUrl) {
    console.log('⚠️ GAS_WEB_APP_URL missing, skipping initialization');
    return;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.append('token', token || '');
    url.searchParams.append('sheet', 'SETUP_TRIGGER');
    url.searchParams.append('action', 'setup');

    const response = await fetch(url.toString(), { method: 'POST' });
    const data = await response.json() as any;

    if (data.error && data.error !== "Sheet 'SETUP_TRIGGER' not found") {
      console.error('❌ Error initializing sheets:', data.error);
    } else {
      console.log('✅ Google Sheets initialized successfully');
    }

  } catch (error) {
    console.error('❌ Error initializing sheets:', error);
  }
};

