import re, json

with open("lib/data.ts", encoding="utf-8") as f:
    content = f.read()

# Extract all car objects
car_blocks = re.findall(r'\{[^{}]*?id:\s*[\'"](\d+)[\'"][^{}]*?\}', content, re.DOTALL)

# Check for duplicate IDs
ids = []
for b in re.finditer(r'id:\s*[\'"](\d+)[\'"]', content):
    ids.append(b.group(1))
from collections import Counter
dup_ids = {k: v for k, v in Counter(ids).items() if v > 1}
print("Duplicate IDs:", json.dumps(dup_ids, indent=2))

# Check for duplicate names
names = re.findall(r'name:\s*[\'"]([^\'"]+)[\'"]', content)
dup_names = {k: v for k, v in Counter(names).items() if v > 1}
print("Duplicate names with count:", json.dumps(dup_names, indent=2))

# Check image URL formats remaining
commons_urls = re.findall(r'https://commons\.wikimedia\.org[^\s\'"]+', content)
print(f"\nRemaining commons.wikimedia.org URLs: {len(commons_urls)}")

upload_urls = re.findall(r'https://upload\.wikimedia\.org[^\s\'"]+', content)
print(f"Direct upload.wikimedia.org URLs: {len(upload_urls)}")
