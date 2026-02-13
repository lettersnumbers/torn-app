import requests
import json

KEY = "WXLHbhmMZ1P8SH7x"
ITEM_ID = 206 # Xanax
URL = f"https://api.torn.com/v2/market/?selections=bazaar&id={ITEM_ID}&key={KEY}"

print(f"Testing Key: {KEY[:5]}...")
try:
    resp = requests.get(URL)
    data = resp.json()
    
    if 'error' in data:
        print("API Error:", data['error'])
    else:
        bazaar = data.get('bazaar', {})
        print("Bazaar Keys:", bazaar.keys())
        
        listings = bazaar.get('listings', [])
        print(f"Direct Listings Found: {len(listings)}")
        
        specialized = bazaar.get('specialized', [])
        print(f"Specialized Shops Found: {len(specialized)}")

except Exception as e:
    print(f"Failed: {e}")
