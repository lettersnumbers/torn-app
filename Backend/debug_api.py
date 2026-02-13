import requests
import config
import json

ITEM_ID = 206 # Xanax
# Try v1 API
url = f"https://api.torn.com/market/{ITEM_ID}?selections=bazaar&key={config.API_KEY}&limit=20"

print(f"Fetching V1: {url}")

try:
    resp = requests.get(url)
    data = resp.json()
    
    if 'bazaar' in data:
        # v1 bazaar is usually a list or dict?
        print("Type of 'bazaar':", type(data['bazaar']))
        if isinstance(data['bazaar'], list):
             print(f"Listings found: {len(data['bazaar'])}")
             if len(data['bazaar']) > 0:
                 print(data['bazaar'][0])
        elif isinstance(data['bazaar'], dict):
             print("Keys:", data['bazaar'].keys())
    else:
        print("No bazaar key in v1")

except Exception as e:
    print(f"Error: {e}")
