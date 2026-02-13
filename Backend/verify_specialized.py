import requests
import config
import json

# Xanax
ITEM_ID = 206
url = f"https://api.torn.com/v2/market/?selections=bazaar&id={ITEM_ID}&key={config.API_KEY}"

print(f"Fetching Market: {url}")
try:
    resp = requests.get(url)
    data = resp.json()
    bazaar = data.get('bazaar', {})
    specialized = bazaar.get('specialized', [])
    
    print(f"Specialized Shops Found: {len(specialized)}")
    
    if specialized:
        shop = specialized[0]
        print(f"Checking Shop: {shop.get('name')} (ID: {shop.get('id')})")
        
        shop_url = f"https://api.torn.com/v2/user/{shop.get('id')}/bazaar/?key={config.API_KEY}"
        print(f"Fetching Bazaar: {shop_url}")
        
        shop_resp = requests.get(shop_url).json()
        shop_items = shop_resp.get('bazaar', [])
        
        print(f"Items in shop: {len(shop_items)}")
        
        # Check if Xanax is there
        xanax_found = False
        for item in shop_items:
            if str(item.get('id')) == str(ITEM_ID):
                print(f"FOUND XANAX: {item}")
                xanax_found = True
                break
        
        if not xanax_found:
             print("Xanax not found in top shop (might be sold out or specialized in something else?)")

except Exception as e:
    print(f"Error: {e}")
