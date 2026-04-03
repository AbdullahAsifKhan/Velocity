import requests
import json
import time
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CX = os.getenv("GOOGLE_CX")
WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "CarDatabaseBot/1.0 (your-email@example.com)"}

cars_data = [

    # Italian
    {"brand": "Ferrari", "model": "SF90 Stradale"},
    {"brand": "Lamborghini", "model": "Huracan STO"},
    {"brand": "Lamborghini", "model": "Urus Performante"},
    {"brand": "Maserati", "model": "MC20"},
    {"brand": "Pagani", "model": "Huayra R"},

]

# 🔹 Manufacturer press site search URLs
MANUFACTURER_SITES = {
    "ferrari": "site:media.ferrari.com",
    "lamborghini": "site:media.lamborghini.com",
    "maserati": "site:media.maserati.com",
    "pagani": "site:pagani.com",
    "alfa romeo": "site:media.alfaromeo.com",
}

def get_manufacturer_site(brand):
    """Returns the site filter for a brand if available."""
    brand_lower = brand.lower()
    for key in MANUFACTURER_SITES:
        if key in brand_lower:
            return MANUFACTURER_SITES[key]
    return None


# 🔹 Source 1: Google Custom Search
def get_google_image(brand, model, site_filter=None):
    query = f"{brand} {model} official"
    if site_filter:
        query += f" {site_filter}"

    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CX,
        "q": query,
        "searchType": "image",
        "imgType": "photo",
        "num": 1,
        "imgSize": "large",
    }

    try:
        res = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params=params
        ).json()

        items = res.get("items", [])
        if items:
            return items[0]["link"]
        
    except Exception as e:
        print(f"Google search error for {brand} {model}: {e}")

    return None


# 🔹 Source 2: Wikipedia Fallback
def get_wiki_image(brand, model):
    search_query = f"{brand} {model}"

    try:
        search_params = {
            "action": "query", "list": "search",
            "srsearch": search_query, "format": "json"
        }
        search_res = requests.get(WIKI_API, params=search_params, headers=HEADERS).json()
        if not search_res.get("query", {}).get("search"):
            return None

        title = search_res["query"]["search"][0]["title"]

        img_params = {
            "action": "query", "titles": title,
            "prop": "pageimages", "piprop": "name", "format": "json"
        }
        img_res = requests.get(WIKI_API, params=img_params, headers=HEADERS).json()
        pages = img_res.get("query", {}).get("pages", {})

        filename = None
        for page_id in pages:
            if "pageimage" in pages[page_id]:
                filename = pages[page_id]["pageimage"]

        if not filename:
            return None

        info_params = {
            "action": "query", "titles": f"File:{filename}",
            "prop": "imageinfo", "iiprop": "url", "format": "json"
        }
        info_res = requests.get(WIKI_API, params=info_params, headers=HEADERS).json()
        info_pages = info_res.get("query", {}).get("pages", {})

        for page_id in info_pages:
            info = info_pages[page_id].get("imageinfo", [])
            if info:
                return info[0]["url"]

    except Exception as e:
        print(f"Wikipedia error for {brand} {model}: {e}")

    return None


# 🔹 Main Scraper
def run_scraper():
    final_database = []
    print(f"🚀 Scraping images for {len(cars_data)} cars...\n")

    for car in cars_data:
        brand = car["brand"]
        model = car["model"]
        print(f"Processing: {brand} {model}...", end=" ")

        image_url = None
        source = None

        # Try manufacturer site via Google first
        manufacturer_site = get_manufacturer_site(brand)
        if manufacturer_site:
            image_url = get_google_image(brand, model, site_filter=manufacturer_site)
            if image_url:
                source = "Google (Manufacturer)"

        # Try general Google search
        if not image_url:
            image_url = get_google_image(brand, model)
            if image_url:
                source = "Google (Web)"

        # Final fallback: Wikipedia
        if not image_url:
            image_url = get_wiki_image(brand, model)
            if image_url:
                source = "Wikipedia"

        if image_url:
            car["image"] = image_url
            car["image_source"] = source
            print(f"✅ {source}")
        else:
            car["image"] = "No image found"
            car["image_source"] = None
            print("❌ Not Found")

        final_database.append(car)
        time.sleep(0.5)

    with open("updated_car_database.json", "w", encoding="utf-8") as f:
        json.dump(final_database, f, indent=4)

    print(f"\n🎉 Done! Database saved to 'updated_car_database.json'")


if __name__ == "__main__":
    run_scraper()