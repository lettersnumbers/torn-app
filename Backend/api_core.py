import requests
import time
import config  # Imports your config.py file

class TornEngine:
    def __init__(self):
        # Load API Key from config
        self.api_key = config.API_KEY
        self.base_url = "https://api.torn.com"

    def make_request(self, endpoint, selection, id_val=""):
        """
        Generic method to fetch data from Torn API.
        endpoint: 'user', 'faction', 'market', etc.
        selection: specific data to retrieve (e.g., 'basic', 'stocks')
        id_val: Optional ID (user ID, item ID, etc.)
        """
        
        # Build the URL
        url = f"{self.base_url}/{endpoint}/{id_val}?selections={selection}&key={self.api_key}"

        try:
            response = requests.get(url)
            response.raise_for_status()  # Raises error for 404, 500, etc.
            
            data = response.json()

            # Check for API-specific errors (Torn returns 'error' key if something fails)
            if 'error' in data:
                print(f"API Error Code {data['error']['code']}: {data['error']['error']}")
                return data

            # Apply the delay defined in config.py to avoid rate limits
            if hasattr(config, 'REQUEST_DELAY'):
                time.sleep(config.REQUEST_DELAY)
            
            return data

        except requests.exceptions.RequestException as e:
            print(f"HTTP Request failed: {e}")
            return None