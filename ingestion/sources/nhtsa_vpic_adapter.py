import requests
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

class NHTSAVpicAdapter:
    def __init__(self):
        self.source_id = "nhtsa"
        self.name = "NHTSA vPIC API"
        self.base_url = "https://vpic.nhtsa.dot.gov/api"

    def fetch_specs(self, brand: str, model: str, year: int, vin: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        NHTSA requires a VIN to properly decode authoritative engine facts.
        """
        if not vin:
            print(f"[{self.name}] No VIN provided for {year} {brand} {model}. Skipping strict NHTSA audit.")
            return None

        print(f"[{self.name}] Decoding VIN {vin} for strict audit of {year} {brand} {model}...")
        
        # Be nice to government APIs
        time.sleep(0.5)

        try:
            resp = requests.get(f"{self.base_url}/vehicles/decodevin/{vin}?format=json")
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("Results", [])
                
                specs = {}
                for item in results:
                    var_name = item.get("Variable")
                    value = item.get("Value")
                    
                    if not value or value == "Not Applicable":
                        continue
                        
                    if var_name == "Engine Brake (hp) From":
                        try:
                            specs["horsepower"] = int(float(value))
                        except:
                            pass
                    elif "Torque" in var_name and "From" in var_name:
                        # Extract basic torque from NHTSA if available
                        try:
                            specs["torque"] = int(float(value))
                        except:
                            pass

                if specs:
                    print(f"[{self.name}] Successfully audited specs for {vin}: {specs}")
                    return {
                        **specs,
                        "ingestedAt": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    print(f"[{self.name}] No engine specs found for VIN {vin}")
            else:
                print(f"[{self.name}] API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"[{self.name}] Error decoding VIN {vin}: {e}")

        return None
