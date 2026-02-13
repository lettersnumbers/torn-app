// In production (Vercel), API is served from the same domain, so we use empty string for relative path.
// In development, we use the env var (likely http://127.0.0.1:5000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const fetchUser = async () => {
    const res = await fetch(`${API_BASE_URL}/api/user`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
};

export const fetchFaction = async () => {
    const res = await fetch(`${API_BASE_URL}/api/faction`);
    if (!res.ok) throw new Error('Failed to fetch faction');
    return res.json();
};

export const fetchItems = async () => {
    const res = await fetch(`${API_BASE_URL}/api/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
};

export const scanLowest = async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/api/scan/lowest/${itemId}`);
    if (!res.ok) throw new Error('Failed to scan lowest');
    return res.json();
};

export const scanShops = async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/api/scan/shops/${itemId}`);
    if (!res.ok) throw new Error('Failed to scan shops');
    return res.json();
};
