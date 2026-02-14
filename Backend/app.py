from flask import Flask, jsonify, request
from flask_cors import CORS

# vvv FIXED: Handle imports for both Script (Local) and Package (Vercel) execution
try:
    from .api_core import TornEngine
    from . import config
except ImportError:
    from api_core import TornEngine
    import config

import requests

app = Flask(__name__)
CORS(app)  # Allows React to communicate with Flask

# Initialize the API Engine
engine = TornEngine()

import json
import os

# Global Cache for Items
# Global Cache for Items
ITEM_CACHE = {}
# vvv FIXED: Use absolute path relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ITEM_CACHE_FILE = os.path.join(BASE_DIR, 'items_cache.json')

# DEBUG: Return Server Errors to Frontend for Troubleshooting
@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    tb = traceback.format_exc()
    print(f"❌ 500 ERROR: {tb}") # Log to Vercel/Server logs
    return jsonify({"error": str(e), "traceback": tb}), 500

def get_api_key():
    """Retrieves API Key from Client Headers."""
    key = request.headers.get('X-Torn-Key')
    return key

def load_items_on_startup():
    """Fetches all items from Torn once when the server starts, using local cache if available."""
    global ITEM_CACHE
    
    # Try loading from local file first
    if os.path.exists(ITEM_CACHE_FILE):
        print(f"📂 Loading items from local cache: {ITEM_CACHE_FILE}...")
        try:
            with open(ITEM_CACHE_FILE, 'r') as f:
                ITEM_CACHE = json.load(f)
            print(f"✅ Loaded {len(ITEM_CACHE)} items from cache.")
            return
        except Exception as e:
            print(f"⚠️ Failed to load cache: {e}.")
    
    # NOTE: In BYOK mode, we cannot fetch from API on startup because we don't have a key yet.
    # We rely on the cache file being present (committed to repo).
    print("⚠️ server started without item cache. Items dropdown may be empty until cache is updated manually.")

# --- Run the load function immediately on startup ---
load_items_on_startup()


# ==========================
#        API ROUTE: USER
# ==========================
@app.route('/api/user', methods=['GET'])
def get_user():
    """Fetches User Profile + Bars + MONEY."""
    key = get_api_key()
    if not key: return jsonify({"error": "Missing API Key"}), 401

    # Added 'money,cooldowns,events' to fetch comprehensive user data
    data = engine.make_request('user', 'basic,profile,bars,money,cooldowns,events', api_key=key)
    if data:
        if 'error' in data:
            return jsonify(data), 400
        return jsonify(data)
    return jsonify({"error": "Failed to fetch user data"}), 500


# ==========================
#      API ROUTE: FACTION
# ==========================
@app.route('/api/faction', methods=['GET'])
def get_faction():
    """Fetches Faction Data (Chain, Basic Info)."""
    key = get_api_key()
    if not key: return jsonify({"error": "Missing API Key"}), 401

    data = engine.make_request('faction', 'basic,chain', api_key=key)
    
    if data:
        if 'error' in data:
             return jsonify(data), 400
        return jsonify(data)
    
    return jsonify({"name": "No Faction Data", "tag": "", "chain": {"current": 0, "maximum": 0}})


# ==========================
#       API ROUTE: ITEMS
# ==========================
@app.route('/api/items', methods=['GET'])
def get_all_items():
    """Returns the full list of items for the dropdown."""
    return jsonify(list(ITEM_CACHE.values()))


# ==========================
#   API ROUTE: SCAN (LOWEST)
# ==========================
@app.route('/api/scan/lowest/<item_id>', methods=['GET'])
def scan_lowest(item_id):
    """
    BUTTON 1: 'SCAN' - Fetches 10 absolute lowest listings.
    """
    key = get_api_key()
    if not key: return jsonify({"error": "Missing API Key"}), 401

    url = f"https://api.torn.com/v2/market/?selections=bazaar,itemmarket&id={item_id}&key={key}&limit=50"
    
    # Get Category for the Link
    item_info = ITEM_CACHE.get(str(item_id))
    category = item_info['type'] if item_info else 'Drug'
    
    item_market_link = f"https://www.torn.com/page.php?sid=ItemMarket#/market/view=category&categoryName={category}&itemID={item_id}"

    try:
        resp = requests.get(url)
        data = resp.json()
        if 'error' in data: return jsonify({"error": data['error'].get('error', 'API Error')}), 400
        
        # --- NEW: Get Average Price Safely ---
        avg_price = 0
        im_data = data.get('itemmarket')
        if isinstance(im_data, dict) and 'item' in im_data:
             item_details = im_data.get('item')
             if isinstance(item_details, dict):
                 avg_price = item_details.get('average_price', 0)

        listings = []

        # 1. Item Market
        # im_data was already fetched above
        if isinstance(im_data, dict):
            im_listings = im_data.get('listings')
            if isinstance(im_listings, list):
                for item in im_listings:
                    listings.append({
                        "source": "Item Market", 
                        "price": item.get('price', 0),
                        "qty": item.get('amount', 0),
                        "market_value": avg_price, # Send avg price to frontend
                        "link": item_market_link 
                    })

        # 2. Individual Bazaar Listings
        bazaar_data = data.get('bazaar', {})
        if isinstance(bazaar_data, dict):
            for item in bazaar_data.get('listings', []):
                pid = item.get('player_id')
                link = f"https://www.torn.com/bazaar.php?userId={pid}#/" if pid else item_market_link
                listings.append({
                    "source": "Bazaar Listing",
                    "price": item.get('price', 0),
                    "qty": item.get('amount', 0),
                    "market_value": avg_price,
                    "link": link
                })

        listings.sort(key=lambda x: x['price'])
        return jsonify(listings[:10])

    except Exception as e:
        print(f"❌ Server Exception: {e}")
        return jsonify([]), 500


# ==========================
#   API ROUTE: SCAN (SHOPS)
# ==========================
@app.route('/api/scan/shops/<item_id>', methods=['GET'])
def scan_shops(item_id):
    """
    BUTTON 2: 'BAZAARS' - Deep scans top bulk sellers.
    """
    key = get_api_key()
    if not key: return jsonify({"error": "Missing API Key"}), 401

    # Added itemmarket to selections just to get the average price metadata safely
    url = f"https://api.torn.com/v2/market/?selections=bazaar,itemmarket&id={item_id}&key={key}"
    
    listings = []
    
    # --- STRATEGY A: Community API (Weav3r) ---
    # Used by major userscripts, returns actual bazaar listings.
    # We try this first because it gives 100+ results vs 0 from official API.
    try:
        # User-Agent is polite for public APIs
        headers = {'User-Agent': 'TornApp/1.0'}
        weav_url = f"https://weav3r.dev/api/marketplace/{item_id}"
        print(f"DEBUG: Fetching from Weav3r: {weav_url}")
        
        w_resp = requests.get(weav_url, headers=headers, timeout=5)
        if w_resp.status_code == 200:
            w_data = w_resp.json()
            w_listings = w_data.get('listings', [])
            
            if w_listings:
                print(f"DEBUG: Weav3r returned {len(w_listings)} listings.")
                
                # Fetch Average Price from Torn API for Profit Calculation
                avg_price = 0
                try:
                    # Quick fetch of itemmarket to get 'average_price' metadata
                    price_url = f"https://api.torn.com/v2/market/?selections=itemmarket&id={item_id}&key={key}"
                    p_resp = requests.get(price_url).json()
                    if 'itemmarket' in p_resp and 'item' in p_resp['itemmarket']:
                        avg_price = p_resp['itemmarket']['item'].get('average_price', 0)
                except Exception as e:
                    print(f"DEBUG: Failed to fetch average price: {e}")

                for item in w_listings:
                    listings.append({
                        "source": f"Bazaar: {item.get('player_name', 'Unknown')}", 
                        "price": item.get('price', 0),
                        "qty": item.get('quantity', 0),
                        "market_value": avg_price, 
                        "link": f"https://www.torn.com/bazaar.php?userId={item.get('player_id')}#/"
                    })
                
                # If we got results, return them immediately (sorted)
                listings.sort(key=lambda x: x['price'])
                return jsonify(listings[:50]) # Return top 50
    except Exception as e:
        print(f"⚠️ Weav3r API failed: {e}. Falling back to official API...")

    # --- STRATEGY B: Official Torn API (Fallback) ---
    # Only if Strategy A fails. Scans 'specialized' shops.
    try:
        print(f"DEBUG: Fallback to Official API for {item_id}...")
        resp = requests.get(url)
        data = resp.json()
        
        if 'error' in data:
            return jsonify({"error": data['error']}), 400

        # Get Average Price Safely
        avg_price = 0
        im_data = data.get('itemmarket')
        if isinstance(im_data, dict) and 'item' in im_data:
             item_details = im_data.get('item')
             if isinstance(item_details, dict):
                 avg_price = item_details.get('average_price', 0)

        bazaar_data = data.get('bazaar', {})
        
        # Deep Scan Specialized Shops
        if isinstance(bazaar_data, dict):
            specialized = bazaar_data.get('specialized', [])
            
            if specialized:
                # Increase limit to top 15 to find more results since we removed itemmarket fallback
                for shop in specialized[:15]:
                    try:
                        shop_url = f"https://api.torn.com/v2/user/{shop.get('id')}/bazaar/?key={key}"
                        shop_resp = requests.get(shop_url).json()
                        
                        shop_items = shop_resp.get('bazaar', [])
                        if isinstance(shop_items, list):
                            for shop_item in shop_items:
                                if str(shop_item.get('id')) == str(item_id):
                                    listings.append({
                                        "source": f"Bazaar: {shop.get('name')}", 
                                        "price": shop_item.get('price', 0),
                                        "qty": shop_item.get('quantity', 0),
                                        "market_value": avg_price,
                                        "link": f"https://www.torn.com/bazaar.php?userId={shop.get('id')}#/"
                                    })
                    except Exception: 
                        continue

        listings.sort(key=lambda x: x['price'])
        
        # Deduplicate
        unique_listings = []
        seen = set()
        for l in listings:
            key = f"{l['price']}-{l['qty']}-{l['source']}"
            if key not in seen:
                unique_listings.append(l)
                seen.add(key)
        
        return jsonify(unique_listings[:15])

    except Exception as e:
        print(f"❌ Server Exception: {e}")
        return jsonify([]), 500


if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG_MODE)