// In production (Vercel), API is served from the same domain, so we use empty string for relative path.
// In development, we use the env var (likely http://127.0.0.1:5000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getHeaders = () => {
    const key = localStorage.getItem('torn_api_key');
    return {
        'Content-Type': 'application/json',
        'X-Torn-Key': key || ''
    };
};

const handleResponse = async (res) => {
    if (res.status === 401) {
        // Clear key if unauthorized (expired/invalid)
        localStorage.removeItem('torn_api_key');
        window.location.reload(); // Reload to show Auth Screen
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'API Error');
    }
    return res.json();
};

export const fetchUser = async () => {
    const res = await fetch(`${API_BASE_URL}/api/user`, { headers: getHeaders() });
    return handleResponse(res);
};

export const fetchFaction = async () => {
    const res = await fetch(`${API_BASE_URL}/api/faction`, { headers: getHeaders() });
    return handleResponse(res);
};

export const fetchItems = async () => {
    const res = await fetch(`${API_BASE_URL}/api/items`, { headers: getHeaders() });
    return handleResponse(res);
};

export const scanLowest = async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/api/scan/lowest/${itemId}`, { headers: getHeaders() });
    return handleResponse(res);
};

export const scanShops = async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/api/scan/shops/${itemId}`, { headers: getHeaders() });
    return handleResponse(res);
};
