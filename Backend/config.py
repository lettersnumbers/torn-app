# config.py

import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('TORN_API_KEY')
REQUEST_DELAY = 2          # Seconds to wait between requests (Safety)

# App Settings
HOST = '127.0.0.1'
PORT = 5000
DEBUG_MODE = True