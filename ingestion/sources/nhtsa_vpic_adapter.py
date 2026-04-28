import requests
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from ingestion.sources.specs_adapter import SpecsAdapter


class NHTSAVpicAdapter(SpecsAdapter):
    """
    NHTSA vPIC API adapter — the Source of Truth for Velocity.
    
    Two modes:
      1. fetch_by_vin(vin) — full VIN decode (most detailed)
      2. fetch_specs(brand, model, year) — make/model/year lookup (no VIN needed)
    
    100% free, no API key required.
    """

    def __init__(self):
        super().__init__("nhtsa", "NHTSA vPIC API")
        self.base_url = "https://vpic.nhtsa.dot.gov/api"

    def fetch_specs(self, brand: str, model: str, year: int, vin: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetch specs. If VIN is provided, uses VIN decode. 
        Otherwise uses make/model/year lookup.
        """
        if vin:
            return self.fetch_by_vin(vin, brand, model, year)
        return self.fetch_by_make_model_year(brand, model, year)

    def fetch_by_vin(self, vin: str, brand: str = "", model: str = "", year: int = 0) -> Optional[Dict[str, Any]]:
        """Full VIN decode — most authoritative data."""
        print(f"[{self.name}] Decoding VIN {vin}...")
        time.sleep(0.5)

        try:
            resp = requests.get(
                f"{self.base_url}/vehicles/decodevin/{vin}?format=json",
                timeout=15,
            )
            if resp.status_code != 200:
                print(f"[{self.name}] API Error: {resp.status_code}")
                return None

            data = resp.json()
            results = data.get("Results", [])
            return self._parse_vin_results(results)

        except Exception as e:
            print(f"[{self.name}] Error decoding VIN {vin}: {e}")
            return None

    def fetch_by_make_model_year(self, brand: str, model: str, year: int) -> Optional[Dict[str, Any]]:
        """
        Look up a car by make/model/year using NHTSA.
        Validates the car exists and pulls basic data.
        """
        print(f"[{self.name}] Looking up {year} {brand} {model}...")
        time.sleep(0.3)

        try:
            # Step 1: Validate the model exists
            url = f"{self.base_url}/vehicles/GetModelsForMakeYear/make/{brand}/modelyear/{year}"
            resp = requests.get(url, params={"format": "json"}, timeout=15)

            if resp.status_code != 200:
                return None

            data = resp.json()
            results = data.get("Results", [])

            # Find matching model
            matched = None
            model_lower = model.lower()
            for r in results:
                if r.get("Model_Name", "").lower() == model_lower:
                    matched = r
                    break

            if not matched:
                # Fuzzy match — check if model name contains our search
                for r in results:
                    if model_lower in r.get("Model_Name", "").lower():
                        matched = r
                        break

            if not matched:
                return None

            specs = {
                "nhtsa_make_id": matched.get("Make_ID"),
                "nhtsa_model_id": matched.get("Model_ID"),
                "nhtsa_validated": True,
                "ingestedAt": datetime.now(timezone.utc).isoformat(),
            }

            return specs if specs.get("nhtsa_validated") else None

        except Exception as e:
            print(f"[{self.name}] Error looking up {brand} {model}: {e}")
            return None

    def _parse_vin_results(self, results: list) -> Optional[Dict[str, Any]]:
        """Parse VIN decode results into our schema."""
        specs = {}

        field_map = {
            "Engine Brake (hp) From": ("horsepower", lambda v: int(float(v))),
            "Engine Number of Cylinders": ("cylinders", lambda v: int(float(v))),
            "Displacement (L)": ("displacement", lambda v: round(float(v), 1)),
            "Fuel Type - Primary": ("fuelType", lambda v: v),
            "Drive Type": ("drivetrain", lambda v: v),
            "Transmission Style": ("transmission", lambda v: v),
            "Body Class": ("bodyClass", lambda v: v),
            "Doors": ("doors", lambda v: int(float(v))),
            "Gross Vehicle Weight Rating From": ("gvwr", lambda v: v),
            "Plant Country": ("country", lambda v: v),
            "Seat Belts Type": ("seatBelts", lambda v: v),
        }

        for item in results:
            var_name = item.get("Variable", "")
            value = item.get("Value")

            if not value or value == "Not Applicable":
                continue

            if var_name in field_map:
                key, transform = field_map[var_name]
                try:
                    specs[key] = transform(value)
                except (ValueError, TypeError):
                    pass

            # Torque needs special handling (variable name varies)
            if "Torque" in var_name and "From" in var_name:
                try:
                    specs["torque"] = int(float(value))
                except (ValueError, TypeError):
                    pass

        if specs:
            specs["ingestedAt"] = datetime.now(timezone.utc).isoformat()
            return specs

        return None
