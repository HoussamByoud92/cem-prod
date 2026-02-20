import { handle } from '@hono/node-server/vercel'
// @ts-ignore
import app from '../dist/server-internal.js'

export const config = {
    runtime: 'nodejs',
    api: {
        bodyParser: false
    }
}

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
