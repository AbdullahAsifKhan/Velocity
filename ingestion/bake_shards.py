import json
from pathlib import Path

def bake_shards():
    repo = Path(__file__).resolve().parents[1]
    overlay_path = repo / "data" / "catalog.overlay.json"
    shards_dir = repo / "data" / "shards"
    list_path = shards_dir / "cars_list.json"
    
    if not overlay_path.exists():
        print("overlay not found, nothing to bake")
        return
        
    with overlay_path.open("r") as f:
        overlay = json.load(f)
    
    by_car = overlay.get("byCarId", {})
    
    # 1. Update the cars_list.json if needed (optional, we usually just update the specific car shards)
    # But since cars_list is lightweight, we'll keep it mostly unchanged unless it needs the overlay.
    
    # 2. Iterate through shards and apply the overlay
    shards_updated = 0
    for shard_file in shards_dir.glob("car_*.json"):
        car_id = shard_file.stem.split("_")[1]
        
        if car_id in by_car:
            with shard_file.open("r") as f:
                car_data = json.load(f)
                
            # Apply overlay
            overlay_data = by_car[car_id]
            
            # Avoid overwriting core identifying properties
            skip_keys = ["id", "brand", "name", "canonicalKey", "ingestedAt", "sources"]
            
            for k, v in overlay_data.items():
                if k not in skip_keys:
                    car_data[k] = v
                    
            # Inject sources
            if "sources" in overlay_data:
                # Merge sources
                existing_sources = car_data.get("sources", [])
                
                # Dedup
                seen = {s.get("url") for s in existing_sources if "url" in s}
                for s in overlay_data["sources"]:
                    if s.get("url") not in seen:
                        existing_sources.append(s)
                        seen.add(s.get("url"))
                        
                car_data["sources"] = existing_sources
                
            with shard_file.open("w") as f:
                json.dump(car_data, f, indent=2)
            
            shards_updated += 1
            print(f"Biked overlay into {shard_file.name}")
            
    print(f"Baked overlay into {shards_updated} shards.")

if __name__ == "__main__":
    bake_shards()
