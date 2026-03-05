import { nanoid } from 'nanoid';
import fetch from 'node-fetch';

// Google Apps Script configuration
const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || '';
const GAS_API_TOKEN = process.env.GAS_API_TOKEN || '';

// ===== IN-MEMORY CACHE (edge-side, per-isolate) =====
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
interface CacheEntry { data: any; timestamp: number; }
const dataCache = new Map<string, CacheEntry>();

// Full-page HTML cache for the homepage
let homepageHtmlCache: { html: string; timestamp: number } | null = null;
const HOMEPAGE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedHomepage(): string | null {
  if (homepageHtmlCache && (Date.now() - homepageHtmlCache.timestamp) < HOMEPAGE_CACHE_TTL_MS) {
    return homepageHtmlCache.html;
  }
  return null;
}

export function setCachedHomepage(html: string): void {
  homepageHtmlCache = { html, timestamp: Date.now() };
}

export function invalidateHomepageCache(): void {
  homepageHtmlCache = null;
}

// Sheet names
export const SHEETS = {
  BLOG: 'Blog',
  EVENTS: 'Events',
  PLAQUETTES: 'Plaquettes',
  NEWSLETTER: 'Newsletter',
  POPUPS: 'Popups',
  RECRUITMENT: 'Recruitment',
  FORMATIONS: 'Formations',
  REFERENCES: 'References',
  CATALOG_DEMANDS: 'CatalogDemands',
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

export interface Reference {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogDemand {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  source: string;
  requestedAt: string;
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
      // Increase timeout to 45s to avoid 500 errors when GAS is slow (Cloudflare allows 50s)
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const options: any = {
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
    const cacheKey = `getAll:${this.sheetName}`;
    const cached = dataCache.get(cacheKey);

    // If cache is fresh, return instantly
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return Array.isArray(cached.data) ? cached.data : [];
    }

    // If cache exists but is stale, return stale data AND refresh in background
    if (cached) {
      this.request('getAll', {}, 'GET', null, env)
        .then(data => {
          if (Array.isArray(data)) {
            dataCache.set(cacheKey, { data, timestamp: Date.now() });
          }
        })
        .catch(() => { });
      return Array.isArray(cached.data) ? cached.data : [];
    }

    // No cache at all - must fetch (first request)
    try {
      const data = await this.request('getAll', {}, 'GET', null, env);
      const result = Array.isArray(data) ? data : [];
      dataCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (e) {
      return [];
    }
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
    const dataCopy = { ...data };
    if ('id' in dataCopy && !dataCopy.id) {
      delete dataCopy.id;
    }
    const newItem = { id, ...dataCopy } as T;
    const result = await this.request('create', {}, 'POST', newItem, env);
    // Invalidate caches
    dataCache.delete(`getAll:${this.sheetName}`);
    invalidateHomepageCache();
    return result;
  }

  async update(id: string, data: Partial<T>, env?: any): Promise<T | null> {
    const result = await this.request('update', { id }, 'POST', data, env);
    dataCache.delete(`getAll:${this.sheetName}`);
    invalidateHomepageCache();
    return result;
  }

  async delete(id: string, env?: any): Promise<boolean> {
    const result = await this.request('delete', { id }, 'POST', null, env);
    dataCache.delete(`getAll:${this.sheetName}`);
    invalidateHomepageCache();
    return result.success === true;
  }

  // Allow custom actions like subscribeNewsletter to execute complex logic in a single request
  async customAction(action: string, data: any, env?: any): Promise<any> {
    return await this.request(action, {}, 'POST', data, env);
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
export const referencesService = new SheetsService<Reference>(SHEETS.REFERENCES);
export const catalogDemandService = new SheetsService<CatalogDemand>(SHEETS.CATALOG_DEMANDS);

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

