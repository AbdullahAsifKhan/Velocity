"""
enrich_all.py — One command to scrape Wikipedia for all cars and update the database.
Run: .venv\Scripts\python enrich_all.py
"""
import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime, timezone

repo = Path(__file__).resolve().parent

# Step 1: Run the Wikipedia scraper pipeline
print("=" * 60)
print("[1/3] Scraping Wikipedia for car specs...")
print("=" * 60)

# Temporarily set seeds limit to ALL cars (remove the slice)
pipeline_path = repo / "ingestion" / "pipeline.py"
pipeline_text = pipeline_path.read_text()

# Patch out the limit for this run
patched = pipeline_text.replace("seeds = seeds[:5]", "pass  # no limit")
pipeline_path.write_text(patched)

import ingestion.pipeline as p
result = p.run_image_pipeline()

# Restore the limit
pipeline_path.write_text(pipeline_text)

print(f"  ✓ Processed: {result['processedSeeds']} cars")
if result['errors']:
    print(f"  ⚠ Errors: {len(result['errors'])}")

# Step 2: Bake the scraped data back into the shards
print()
print("[2/3] Baking enriched data into JSON shards...")
import ingestion.bake_shards as b
b.bake_shards()

# Step 3: Re-seed the database
print()
print("[3/3] Updating the database (run manually)...")
print("  → Run: node prisma\\seed.mjs")
print()
print("=" * 60)
print("Done! Reload the site to see the enriched specs.")
print("=" * 60)
