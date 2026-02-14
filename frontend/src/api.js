const API_BASE_URL = 'https://api.torn.com'; // Direct to Torn
const WEAV3R_API_URL = 'https://weav3r.dev/api/marketplace';

const getApiKey = () => localStorage.getItem('torn_api_key') || '';

const handleResponse = async (res) => {
    if (res.status === 401 || (res.error && res.error.code === 2)) {
        localStorage.removeItem('torn_api_key');
        window.location.reload();
        throw new Error('Unauthorized/Invalid Key');
    }

    // Check for Torn API Error format
    if (res.error) {
        throw new Error(res.error.error || 'Torn API Error');
    }

    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
    }
    return res;
};

// --- HELPER: PROXY CALL ---
const fetchViaProxy = async (targetUrl) => {
    // Determine proxy URL (relative for prod, absolute for dev if needed)
    // We assume the app is served from the same domain
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

    // We don't send headers here because the proxy will add them? 
    // Wait, we need to send the Key to the proxy so it can forward it?
    // No, putting key in URL is safer for the proxy call itself, but 
    // our proxy.js reads headers.get('X-Torn-Key') OR url params.
    // Let's pass the key in the header to the PROXY.

    const key = getApiKey();
    if (!key) throw new Error("No Key");

    const res = await fetch(proxyUrl, {
        headers: {
            'X-Torn-Key': key
        }
    });

    return handleResponse(await res.json());
};

// --- DATA FETCHING ---

export const fetchUser = async () => {
    const key = getApiKey();
    if (!key) throw new Error("No Key");

    const target = `${API_BASE_URL}/user/?selections=basic,profile,bars,money,cooldowns,events&key=${key}`;
    const res = await fetchViaProxy(target);
    return res;
};

export const fetchFaction = async () => {
    const key = getApiKey();
    if (!key) throw new Error("No Key");

    const target = `${API_BASE_URL}/faction/?selections=basic,chain&key=${key}`;
    const res = await fetchViaProxy(target);
    return res;
};

export const fetchItems = async () => {
    // Fetch from local public file
    const res = await fetch('/items_cache.json');
    if (!res.ok) throw new Error("Failed to load item cache");
    const data = await res.json();
    return Object.values(data);
};

// --- SCANNING LOGIC ---

export const scanLowest = async (itemId) => {
    const key = getApiKey();
    if (!key) throw new Error("No Key");

    const target = `${API_BASE_URL}/v2/market/?selections=bazaar,itemmarket&id=${itemId}&key=${key}&limit=50`;
    const data = await fetchViaProxy(target);

    // Parse Data
    let avgPrice = 0;
    if (data.itemmarket?.item?.average_price) {
        avgPrice = data.itemmarket.item.average_price;
    }

    const listings = [];

    // 1. Item Market
    if (data.itemmarket?.listings) {
        data.itemmarket.listings.forEach(item => {
            listings.push({
                source: "Item Market",
                price: item.price,
                qty: item.amount,
                market_value: avgPrice,
                link: `https://www.torn.com/page.php?sid=ItemMarket#/market/view=category&categoryName=Drug&itemID=${itemId}` // Note: Category hardcoded but link works
            });
        });
    }

    // 2. Bazaar Listings
    if (data.bazaar?.listings) {
        data.bazaar.listings.forEach(item => {
            const pid = item.player_id;
            listings.push({
                source: "Bazaar Listing",
                price: item.price,
                qty: item.amount,
                market_value: avgPrice,
                link: pid ? `https://www.torn.com/bazaar.php?userId=${pid}#/` : '#'
            });
        });
    }

    return listings.sort((a, b) => a.price - b.price).slice(0, 10);
};

export const scanShops = async (itemId) => {
    const key = getApiKey();
    if (!key) throw new Error("No Key");

    let listings = [];
    let avgPrice = 0;

    // --- STRATEGY A: Weav3r API ---
    try {
        // Weav3r is also fetched via proxy to be safe (CORS)
        const wTarget = `${WEAV3R_API_URL}/${itemId}`;
        const wData = await fetchViaProxy(wTarget);

        if (wData.listings && wData.listings.length > 0) {

            // Need Avg Price from Torn
            try {
                const pTarget = `${API_BASE_URL}/v2/market/?selections=itemmarket&id=${itemId}&key=${key}`;
                const pRes = await fetchViaProxy(pTarget);
                if (pRes.itemmarket?.item?.average_price) {
                    avgPrice = pRes.itemmarket.item.average_price;
                }
            } catch (e) {
                console.warn("Failed to fetch avg price", e);
            }

            wData.listings.forEach(item => {
                listings.push({
                    source: `Bazaar: ${item.player_name || 'Unknown'}`,
                    price: item.price,
                    qty: item.quantity,
                    market_value: avgPrice,
                    link: `https://www.torn.com/bazaar.php?userId=${item.player_id}#/`
                });
            });

            return listings.sort((a, b) => a.price - b.price).slice(0, 50);
        }
    } catch (e) {
        console.warn("Weav3r failed, falling back...", e);
    }

    // --- STRATEGY B: Official Torn API Fallback (Deep Scan) ---
    const target = `${API_BASE_URL}/v2/market/?selections=bazaar,itemmarket&id=${itemId}&key=${key}`;
    const data = await fetchViaProxy(target);

    if (data.itemmarket?.item?.average_price) {
        avgPrice = data.itemmarket.item.average_price;
    }

    if (data.bazaar?.specialized) {
        // Limit to top 10 shops
        const shops = data.bazaar.specialized.slice(0, 10);

        // Fetch in parallel via proxy
        const promises = shops.map(shop => {
            const shopTarget = `${API_BASE_URL}/v2/user/${shop.id}/bazaar/?key=${key}`;
            return fetchViaProxy(shopTarget)
                .then(shopData => ({ shop, items: shopData.bazaar }))
                .catch(() => null);
        });

        const shopResults = await Promise.all(promises);

        shopResults.forEach(res => {
            if (!res || !res.items) return;
            res.items.forEach(shopItem => {
                if (String(shopItem.id) === String(itemId)) {
                    listings.push({
                        source: `Bazaar: ${res.shop.name}`,
                        price: shopItem.price,
                        qty: shopItem.quantity,
                        market_value: avgPrice,
                        link: `https://www.torn.com/bazaar.php?userId=${res.shop.id}#/`
                    });
                }
            });
        });
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    listings.sort((a, b) => a.price - b.price).forEach(l => {
        const k = `${l.price}-${l.qty}-${l.source}`;
        if (!seen.has(k)) {
            seen.add(k);
            unique.push(l);
        }
    });

    return unique.slice(0, 15);
};
