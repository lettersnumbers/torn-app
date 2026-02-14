import fetch from 'node-fetch'; // Vercel provides this in Node runtime or built-in in Node 18+

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Torn-Key'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query; // Vercel parses query params
    const key = req.headers['x-torn-key'];

    if (!url) {
        return res.status(400).json({ error: 'Missing URL' });
    }

    // Security Check
    if (!url.startsWith('https://api.torn.com/') && !url.startsWith('https://weav3r.dev/')) {
        return res.status(403).json({ error: 'Forbidden Target' });
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: 'Proxy Error', details: error.message });
    }
}
