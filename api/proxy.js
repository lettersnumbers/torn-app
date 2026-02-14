
// Native fetch (Node 18+)
// We assume Vercel provides Node 18+ environment.

export default async function handler(req, res) {
    // 1. Handle CORS Preflight
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Torn-Key'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 2. Parse Inputs
        const { url } = req.query;
        // const key = req.headers['x-torn-key']; // Not needed if in URL

        if (!url) {
            return res.status(400).json({ error: 'Missing URL' });
        }

        // Security Check
        if (!url.startsWith('https://api.torn.com/') && !url.startsWith('https://weav3r.dev/')) {
            return res.status(403).json({ error: 'Forbidden Target' });
        }

        // 3. Prepare Proxy Request
        // CRITICAL: We forward the User-Agent from the client (Browser) to the destination.
        // This might help convince Cloudflare that this is a real user, even if the IP is AWS.
        const clientUserAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        const headers = {
            'User-Agent': clientUserAgent,
            'Accept': 'application/json, text/plain, */*'
        };

        console.log(`Proxying to: ${url} with UA: ${clientUserAgent}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        // 4. Handle Response
        // Check content type to see if we got HTML (Block) or JSON
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            console.error("Blocked by Cloudflare (HTML Response):", text.substring(0, 100)); // Log first 100 chars
            return res.status(502).json({
                error: 'Upstream Blocked (Cloudflare)',
                details: 'Torn returned HTML instead of JSON. The proxy IP is likely blocked.'
            });
        }

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Proxy Internal Error:", error);
        return res.status(500).json({ error: 'Proxy Internal Error', details: error.message });
    }
}
