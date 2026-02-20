import { handle } from '@hono/node-server/vercel'
// @ts-ignore
import rawApp from '../dist/server-internal.js'

export const config = {
    runtime: 'nodejs',
    api: {
        bodyParser: false
    }
}

// Guard against ESM to CJS transpilation throwing away default exports
const app = rawApp?.fetch ? rawApp : (rawApp?.default || rawApp);

const handler = handle(app);

export default async (req: any, res: any) => {
    // RAW BYPASS REMOVED
    /*
    if (req.url.includes('/api/admin/ping')) {
        res.status(200).json({
            pong: true,
            time: Date.now(),
            bypass: 'raw-vercel-entry'
        });
        return;
    }
    */

    // Vercel auto-parses the body and consumes the stream. Hono expects the raw stream
    // or `req.rawBody`. Injecting `rawBody` prevents Hono from hanging on `await req.json()`.
    if (req.body && !req.rawBody) {
        if (Buffer.isBuffer(req.body)) {
            req.rawBody = req.body;
        } else if (typeof req.body === 'object') {
            req.rawBody = Buffer.from(JSON.stringify(req.body));
        } else if (typeof req.body === 'string') {
            req.rawBody = Buffer.from(req.body);
        }
    }

    console.log('[Vercel Entry] Request:', req.url);
    try {
        const start = Date.now();
        await handler(req, res);
        console.log(`[Vercel Exit] Done in ${Date.now() - start}ms`);
    } catch (e) {
        console.error('[Vercel Crash] Error:', e);
        res.status(500).json({ error: 'Function Crashed', details: String(e) });
    }
};
