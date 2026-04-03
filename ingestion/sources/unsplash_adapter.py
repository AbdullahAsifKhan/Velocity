import os
import requests
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

class UnsplashAdapter:
    def __init__(self):
        self.source_id = "unsplash"
        self.name = "Unsplash API"
        self.access_key = os.environ.get("UNSPLASH_ACCESS_KEY")
        self.base_url = "https://api.unsplash.com"

    def fetch_specs(self, brand: str, model: str, year: int) -> Optional[Dict[str, Any]]:
        """
        Unsplash doesn't provide technical specs, but it provides high-quality images.
        We return a payload with just the image so it can be merged via governance.
        """
        print(f"[{self.name}] Fetching aesthetic image for {brand} {model} {year}...")
        
        if not self.access_key:
            print(f"[{self.name}] UNSPLASH_ACCESS_KEY not found in environment. Skipping.")
            return None

        # To avoid rate limits, be gentle
        time.sleep(1)

        query = f"{brand} {model} car"
        headers = {
            "Authorization": f"Client-ID {self.access_key}",
            "Accept-Version": "v1"
        }
        
        params = {
            "query": query,
            "per_page": 1,
            "orientation": "landscape"
        }

        try:
            resp = requests.get(f"{self.base_url}/search/photos", headers=headers, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results:
                    best_image = results[0]
                    img_url = best_image["urls"]["regular"]
                    return {
                        "image": img_url,
                        "ingestedAt": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    print(f"[{self.name}] No images found for {query}")
            else:
                print(f"[{self.name}] API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"[{self.name}] Error searching Unsplash for {query}: {e}")

        return None
