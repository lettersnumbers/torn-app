import requests
import json

KEY = "WXLHbhmMZ1P8SH7x"
ITEM_ID = 206 # Xanax

def test_torn_api():
    print(f"\n--- TESTING OFFICIAL TORN API (Key: {KEY[:5]}...) ---")
    
    # 1. Check Key Access
    try:
        url = f"https://api.torn.com/user/?selections=basic&key={KEY}"
        data = requests.get(url).json()
        if 'error' in data:
            print(f"Key Check Failed: {data['error']}")
        else:
            print(f"Key Valid. Owner ID: {data.get('player_id')}, Name: {data.get('name')}")
    except Exception as e:
        print(f"Key Check Exception: {e}")

    # 2. Check Market (v2)
    try:
        url = f"https://api.torn.com/v2/market/?selections=bazaar&id={ITEM_ID}&key={KEY}"
        print(f"Fetching v2 Bazaar: {url}")
        data = requests.get(url).json()
        bazaar = data.get('bazaar', {})
        if 'listings' in bazaar:
             print(f"v2 Bazaar Listings Found: {len(bazaar['listings'])}")
        else:
             print("v2 Bazaar 'listings' Key Missing")
        
        specialized = bazaar.get('specialized', [])
        print(f"v2 Specialized Shops: {len(specialized)}")

    except Exception as e:
        print(f"v2 Check Exception: {e}")

def test_weav3r_api():
    print(f"\n--- TESTING WEAV3R API (From Userscript) ---")
    # The script uses: https://weav3r.dev/api/marketplace/${itemId}
    # It does NOT appear to pass the User's API key to this endpoint?
    
    url = f"https://weav3r.dev/api/marketplace/{ITEM_ID}"
    print(f"Fetching: {url}")
    
    try:
        # Mimic browser headers just in case
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
        }
        resp = requests.get(url, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            listings = data.get('listings', [])
            print(f"Weav3r Listings Found: {len(listings)}")
            if len(listings) > 0:
                print("Sample Weav3r Listing:", listings[0])
        else:
            print(f"Weav3r Failed: Status {resp.status_code}")
            print(resp.text[:200])
            
    except Exception as e:
        print(f"Weav3r Exception: {e}")

if __name__ == "__main__":
    test_torn_api()
    test_weav3r_api()
