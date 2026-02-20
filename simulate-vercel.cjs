const http = require('http');

async function start() {
    // Dynamic import to support module
    const handleEntry = await import('./api/index.js');
    const handler = handleEntry.default;

    const server = http.createServer(async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            console.error(err);
            if (!res.headersSent) {
                res.writeHead(500);
                res.end(String(err));
            }
        }
    });

    server.listen(8081, () => {
        console.log('Simulating Vercel API on http://localhost:8081');
    });
}

start();
