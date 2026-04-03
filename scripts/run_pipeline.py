import sys
sys.path.insert(0, r'c:\Books\Bluetoot\premium\b_1fcSGJOgqfY-1773930365843')

from ingestion.pipeline import run_image_pipeline
r = run_image_pipeline()
print(f"Done: {r['processedSeeds']}/{r['totalSeeds']} cars processed, {len(r['errors'])} errors")
