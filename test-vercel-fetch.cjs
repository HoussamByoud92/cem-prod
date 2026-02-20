const fs = require('fs');

async function testFetch() {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWrHR_XH9mvTayChD3lahlyDjB6BPR7nwSsvgjTJBP0IuYZY87diNiDM8NRG3Vbp0/exec';
    const TOKEN = 'cem-website-v2-2026';

    const url = new URL(GAS_URL);
    url.searchParams.append('token', TOKEN);
    url.searchParams.append('sheet', 'Blog');
    url.searchParams.append('action', 'getAll');

    console.log(`[Test] Fetching from GAS: ${url.toString()}`);
    console.log('[Test] Native Node Fetch behavior test...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.error('[Timeout] Fetch aborted after 8000ms');
        controller.abort();
    }, 8000);

    const start = Date.now();
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'CEM-Group-App/1.0',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`[Success] Status: ${response.status} in ${Date.now() - start}ms`);
        const text = await response.text();
        console.log(`[Success] Payload length: ${text.length}`);
        console.log(`[Success] First 100 chars: ${text.substring(0, 100)}`);
    } catch (err) {
        clearTimeout(timeoutId);
        console.error(`[Error] Hit error after ${Date.now() - start}ms:`, err);
    }
}

testFetch();
