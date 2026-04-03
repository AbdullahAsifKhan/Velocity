import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
import json

with open("lib/data.ts", "r", encoding="utf-8") as f:
    content = f.read()

urls = set(re.findall(r'https?://[^\/]+[^\"\',\s]+', content))
failed = []

def check_url(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            pass
    except urllib.error.HTTPError as e:
        if e.code not in [403]: # Ignore 403s just in case it's a hotlink protection
            failed.append({"url": url, "error": f"HTTP {e.code}"})
    except Exception as e:
        failed.append({"url": url, "error": str(e)})

with ThreadPoolExecutor(max_workers=20) as executor:
    executor.map(check_url, [u for u in urls if 'wikimedia' in u])

print(json.dumps(failed, indent=2))
