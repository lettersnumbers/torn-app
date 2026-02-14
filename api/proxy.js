
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const url = new URL(req.url);
    const target = url.searchParams.get('url'); // ?url=https://api.torn.com/...
    const key = req.headers.get('X-Torn-Key');

    if (!target) {
        return new Response(JSON.stringify({ error: 'Missing URL' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
        });
    }

    // Security: Ensure we only proxy to Torn or Weav3r
    if (!target.startsWith('https://api.torn.com/') && !target.startsWith('https://weav3r.dev/')) {
        return new Response(JSON.stringify({ error: 'Forbidden Target' }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
        });
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        // Inject Key if present (or rely on it being in the URL parameters from frontend)
        // The frontend currently puts the key in the URL for direct calls, but we can support headers too.

        const response = await fetch(target, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Fix CORS
                'Cache-Control': 'no-store'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy Error', details: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}
