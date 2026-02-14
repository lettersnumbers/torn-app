import requests
import time

try:
    from . import config
except ImportError:
    import config

class TornEngine:
    def __init__(self):
        # API Key is now passed per request
        self.base_url = "https://api.torn.com"

    def make_request(self, endpoint, selection, id_val="", api_key=None):
        """
        Generic method to fetch data from Torn API.
        endpoint: 'user', 'faction', 'market', etc.
        selection: specific data to retrieve (e.g., 'basic', 'stocks')
        id_val: Optional ID (user ID, item ID, etc.)
        api_key: User's API Key (Required)
        """
        if not api_key:
            return {"error": {"code": 0, "error": "Missing API Key"}}

        # Build the URL
        url = f"{self.base_url}/{endpoint}/{id_val}?selections={selection}&key={api_key}"
        print(f"DEBUG: Requesting {url.replace(api_key, '***')}") # Log URL but hide key

        try:
            response = requests.get(url)
            response.raise_for_status()  # Raises error for 404, 500, etc.
            
            data = response.json()

            # Check for API-specific errors (Torn returns 'error' key if something fails)
            if 'error' in data:
                print(f"API Error Code {data['error']['code']}: {data['error']['error']}")
                return data

            # Apply the delay defined in config.py to avoid rate limits
            # Vercel Optimization: Skip sleep to avoid timeouts/costs
            # if hasattr(config, 'REQUEST_DELAY'):
            #     time.sleep(config.REQUEST_DELAY)
            
            return data

        except requests.exceptions.RequestException as e:
            print(f"HTTP Request failed: {e}")
            return {"error": f"HTTP Failed: {str(e)}"}
        except Exception as e:
            print(f"Unexpected Error in make_request: {e}")
            import traceback
            traceback.print_exc()
            return {"error": f"Internal Error: {str(e)}"}