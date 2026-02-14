
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Torn-Key'
            }
        });
    }

    try {
        const urlObj = new URL(req.url);
        const targetUrl = urlObj.searchParams.get('url');
        const key = req.headers.get('X-Torn-Key');

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: 'Missing URL param' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Fetch from Torn
        // We spoof the User-Agent to look like a browser
        const upstreamResponse = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        // 3. Check for HTML (Cloudflare Block)
        const contentType = upstreamResponse.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            const text = await upstreamResponse.text();
            console.error("Blocked by Cloudflare:", text.substring(0, 200));
            return new Response(JSON.stringify({
                error: 'Upstream Blocked (Cloudflare)',
                details: 'The Torn API rejected the request with an HTML page (likely a CAPTCHA).'
            }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 4. Return JSON
        const data = await upstreamResponse.text(); // Get text first to be safe
        return new Response(data, {
            status: upstreamResponse.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500, // 522 is specifically Cloudflare timeout, 500 is generic
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
