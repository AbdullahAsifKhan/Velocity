import re
import json
import urllib.request
import urllib.parse
import time

filepath = "lib/data.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find all Special:FilePath URLs
pattern = r'(https://commons\.wikimedia\.org/wiki/Special:FilePath/([^?"\']+))(?:\?(width=\d+))?'
matches = re.finditer(pattern, content)

unique_filenames = {}
for m in matches:
    full_url = m.group(0)
    filename = urllib.parse.unquote(m.group(2))
    filename = filename.replace("_", " ") # MediaWiki titles usually have spaces
    unique_filenames[filename] = full_url

filenames_list = list(unique_filenames.keys())
print(f"Found {len(filenames_list)} unique files.")

resolved_urls = {}

# Batch processing
batch_size = 50
for i in range(0, len(filenames_list), batch_size):
    batch = filenames_list[i:i+batch_size]
    
    titles = "|".join([f"File:{fn}" for fn in batch])
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(titles)}&prop=imageinfo&iiprop=url&format=json"
    
    req = urllib.request.Request(api_url, headers={"User-Agent": "VelocityCarApp/1.0"})
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            pages = data['query']['pages']
            for page_id, page_info in pages.items():
                if 'imageinfo' in page_info:
                    title = page_info['title'].replace("File:", "")
                    url = page_info['imageinfo'][0]['url']
                    resolved_urls[title] = url
    except Exception as e:
        print(f"Error fetching batch: {e}")
    time.sleep(1)

# Now replace in content
new_content = content
count = 0
for m in re.finditer(pattern, content):
    full_url = m.group(0)
    filename = urllib.parse.unquote(m.group(2)).replace("_", " ")
    
    if filename in resolved_urls:
        new_url = resolved_urls[filename]
        # Keep it simple: just use the original full resolution URL instead of thumbnail to avoid complex thumb logic
        # and because next/image unoptimized might just work fine.
        new_content = new_content.replace(full_url, new_url)
        count += 1

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Replaced {count} URLs.")
