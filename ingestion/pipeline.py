import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict

from ingestion.sources.wikipedia_scraper import WikipediaScraper
from ingestion.sources.unsplash_adapter import UnsplashAdapter
from ingestion.sources.nhtsa_vpic_adapter import NHTSAVpicAdapter
from ingestion.merge import choose_by_priority, citation
from ingestion.normalize import canonical_key, normalize_car_data

def run_image_pipeline(
    seeds_path: Path = None,
    overlay_out: Path = None,
    status_out: Path = None,
) -> Dict[str, Any]:
    """Runs the ingestion pipeline and writes out the catalog overlay."""
    repo = Path(__file__).resolve().parents[1]
    ing_dir = Path(__file__).resolve().parent

    gov_path = ing_dir / "governance.json"
    gov = {}
    if gov_path.exists():
        with gov_path.open() as f:
            gov = json.load(f)

    # Read all current cars as seeds
    cars_path = repo / "data" / "shards" / "cars_list.json"
    seeds = []
    if cars_path.exists():
        with cars_path.open() as f:
            cars_list = json.load(f)
            # Create seed dicts from the list
            for c in cars_list:
                seeds.append({
                    "carId": c.get("id"),
                    "brand": c.get("brand"),
                    "model": c.get("name").replace(c.get("brand", ""), "").strip(),
                    "year": c.get("year", 2024),
                    # carry over type and other things if needed
                })
    else:
        # Minimal default seed if cars_list.json doesn't exist.
        seeds = [
            {"carId": "1", "brand": "Porsche", "model": "911 GT3 RS", "year": 2024},
        ]
        

    
    overlay_path = overlay_out or (repo / "data" / "catalog.overlay.json")
    existing_overlay = {"version": 1, "generatedAt": None, "byCarId": {}}
    if overlay_path.exists():
        with overlay_path.open() as f:
            existing_overlay.update(json.load(f))
    by_car = dict(existing_overlay.get("byCarId", {}))

    adapter = WikipediaScraper()
    unsplash = UnsplashAdapter()
    nhtsa = NHTSAVpicAdapter()

    errors = []
    processed = 0

    for seed in seeds:
        car_id = str(seed["carId"])
        brand = seed["brand"]
        model = seed["model"]
        year = seed.get("year", 2024)
        ck = canonical_key(brand, model, year)

        candidates = []
        
        # 1. Fetch Specs using Mock Adapter
        raw_specs = adapter.fetch_specs(brand, model, year)
        if raw_specs:
            norm_specs = normalize_car_data(raw_specs)
            url = raw_specs.get("officialPageUrl")
            norm_specs["sources"] = [citation(adapter.source_id, adapter.name, url=url)]
            candidates.append((adapter.source_id, norm_specs))
            
            # Persist raw snapshot
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            raw_dir = ing_dir / "raw"
            raw_dir.mkdir(exist_ok=True)
            with (raw_dir / f"{stamp}_{adapter.source_id}_{car_id}.json").open("w") as f:
                json.dump({"carId": car_id, "payload": raw_specs}, f)

        # 1.5 Fetch aesthetic images
        unsplash_payload = unsplash.fetch_specs(brand, model, year)
        if unsplash_payload:
            unsplash_payload["sources"] = [citation(unsplash.source_id, unsplash.name, url=unsplash_payload.get("image"))]
            candidates.append((unsplash.source_id, unsplash_payload))

        # 1.6 Fetch NHTSA truth if VIN exists
        vin = seed.get("vin")
        nhtsa_payload = nhtsa.fetch_specs(brand, model, year, vin=vin)
        if nhtsa_payload:
            nhtsa_payload["sources"] = [citation(nhtsa.source_id, nhtsa.name, url=f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}")]
            norm_nhtsa = normalize_car_data(nhtsa_payload)
            candidates.append((nhtsa.source_id, norm_nhtsa))

        # 2. Merge candidates
        merged = choose_by_priority(gov, candidates)

        if merged:
            prev = by_car.get(car_id, {})
            # Dedup citations
            sources = prev.get("sources", []) + merged.get("sources", [])
            seen = set()
            dedup_sources = []
            for s in sources:
                t = (s.get("sourceId"), s.get("url"))
                if t not in seen:
                    dedup_sources.append(s)
                    seen.add(t)

            by_car[car_id] = {
                **prev,
                **{k: v for k, v in merged.items() if k != "sources"},
                "sources": dedup_sources,
                "canonicalKey": ck,
                "ingestedAt": merged.get("ingestedAt"),
            }
            processed += 1
        else:
            errors.append(f"No data found for {car_id} {brand} {model}")

    generated = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    out_overlay = {
        "version": existing_overlay.get("version", 1),
        "generatedAt": generated,
        "byCarId": by_car,
    }
    
    overlay_path.parent.mkdir(parents=True, exist_ok=True)
    with overlay_path.open("w") as f:
        json.dump(out_overlay, f, indent=2)

    status = {
        "ok": len(errors) == 0,
        "processedSeeds": processed,
        "totalSeeds": len(seeds),
        "errors": errors,
        "generatedAt": generated
    }
    
    status_path = status_out or (repo / "data" / "ingestion-status.json")
    with status_path.open("w") as f:
        json.dump(status, f, indent=2)

    return status
