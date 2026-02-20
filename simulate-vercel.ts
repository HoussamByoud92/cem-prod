import http from 'http';
import handler from './api/index.js';

async function start() {
    const server = http.createServer(async (req, res) => {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk.toString());
        req.on('end', async () => {
            if (bodyStr) {
                try {
                    (req as any).body = JSON.parse(bodyStr);
                } catch (e) {
                    (req as any).body = bodyStr;
                }
            }

            try {
                await handler(req as any, res as any);
            } catch (err) {
                console.error(err);
                if (!res.headersSent) {
                    res.writeHead(500);
                    res.end(String(err));
                }
            }
        });
    });

    server.listen(8082, () => {
        console.log('Simulating Vercel API on http://localhost:8082');
    });
}

start();
