import re
import time
import logging
import requests
from bs4 import BeautifulSoup
from typing import Any, Dict, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from ingestion.sources.specs_adapter import SpecsAdapter

logger = logging.getLogger(__name__)


class WikipediaScraper(SpecsAdapter):
    """Fetches comprehensive car specs by parsing Wikipedia infoboxes."""

    def __init__(self):
        super().__init__("wikipedia_scraper", "Wikipedia")
        self.session = requests.Session()
        
        retry_strategy = Retry(
            total=5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"],
            backoff_factor=2
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        
        self.session.headers.update({
            "User-Agent": "VelocityBot/1.0 (https://github.com/Alanwalker372/Velocity) python-requests"
        })

    # ── helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _clean_value(td) -> str:
        """Remove footnote superscripts and collapse whitespace."""
        for sup in td.find_all("sup"):
            sup.decompose()
        for br in td.find_all("br"):
            br.replace_with(", ")
        return re.sub(r"\s+", " ", td.get_text(separator=" ", strip=True))

    @staticmethod
    def _parse_weight_kg(text: str) -> Optional[int]:
        """Return weight in kg from a mixed-unit string, or None."""
        m = re.search(r"([\d,]+)\s*(kg|lb)", text)
        if not m:
            return None
        val = int(m.group(1).replace(",", ""))
        return round(val * 0.453592) if m.group(2) == "lb" else val

    @staticmethod
    def _parse_mm(text: str) -> Optional[int]:
        """Return first integer mm value from a dimension string, or None."""
        m = re.search(r"([\d,]+)\s*mm", text)
        if m:
            return int(m.group(1).replace(",", ""))
        # fall back to cm → mm
        m = re.search(r"([\d.]+)\s*cm", text)
        if m:
            return int(float(m.group(1)) * 10)
        return None

    # ── main fetch ────────────────────────────────────────────────────────────

    def fetch_specs(self, brand: str, model: str, year: int) -> Optional[Dict[str, Any]]:
        search_query = f"{brand} {model} car"

        # Polite delay BEFORE the request to prevent flooding when 429s occur
        time.sleep(1.5)

        # 1. Wikipedia search API
        try:
            resp = self.session.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query", "list": "search",
                    "srsearch": search_query, "utf8": "1",
                    "format": "json", "srlimit": 1,
                },
                timeout=8,
            )
            resp.raise_for_status()
            results = resp.json().get("query", {}).get("search", [])
            if not results:
                return None
            page_title = results[0]["title"]
        except Exception as e:
            logger.warning(f"Wikipedia search failed for '{search_query}': {e}")
            return None

        page_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}"

        # 2. Fetch the Wikipedia article
        try:
            page_resp = self.session.get(page_url, timeout=8)
            page_resp.raise_for_status()
        except Exception as e:
            logger.warning(f"Wikipedia fetch failed for '{page_url}': {e}")
            return None

        soup = BeautifulSoup(page_resp.text, "html.parser")
        infobox = soup.find("table", class_="infobox")
        if not infobox:
            return None

        specs: Dict[str, Any] = {"officialPageUrl": page_url}

        # 3. Parse every row in the infobox
        for row in infobox.find_all("tr"):
            th = row.find("th")
            td = row.find("td")
            if not (th and td):
                continue

            label = th.get_text(strip=True).lower()
            value = self._clean_value(td)

            # ── Powertrain ──────────────────────────────────────────────────
            if "engine" in label:
                specs.setdefault("engine", value)

            elif "transmission" in label:
                specs.setdefault("transmission", value)

            elif "layout" in label or "drivetrain" in label or "drive" in label:
                specs.setdefault("drivetrain", value)

            # ── Weight ──────────────────────────────────────────────────────
            elif "curb weight" in label or ("weight" in label and "over" not in label):
                w = self._parse_weight_kg(value)
                if w:
                    specs.setdefault("weight", w)
                else:
                    specs.setdefault("weight_raw", value)

            # ── Dimensions ──────────────────────────────────────────────────
            elif "wheelbase" in label:
                mm = self._parse_mm(value)
                if mm:
                    specs.setdefault("wheelbase", mm)

            elif "length" in label:
                mm = self._parse_mm(value)
                if mm:
                    specs.setdefault("length", mm)

            elif "width" in label:
                mm = self._parse_mm(value)
                if mm:
                    specs.setdefault("width", mm)

            elif "height" in label:
                mm = self._parse_mm(value)
                if mm:
                    specs.setdefault("height", mm)

            elif "ground clearance" in label:
                mm = self._parse_mm(value)
                if mm:
                    specs.setdefault("groundClearance", mm)

            # ── Handling ────────────────────────────────────────────────────
            elif "suspension" in label:
                specs.setdefault("suspension", value)

            elif "brake" in label:
                specs.setdefault("brakes", value)

            elif "tyre" in label or "tire" in label:
                specs.setdefault("tires", value)

            elif "drag" in label or "aerod" in label or "cd" in label:
                specs.setdefault("aerodynamics", value)

            # ── Fuel ────────────────────────────────────────────────────────
            elif "fuel capacity" in label or "fuel tank" in label:
                specs.setdefault("fuelTankCapacity", value)

            elif "emission" in label or "co2" in label:
                specs.setdefault("emissions", value)

            # ── Seats / Doors ───────────────────────────────────────────────
            elif "seating" in label or "seat" in label:
                m = re.search(r"\d+", value)
                if m:
                    specs.setdefault("seats", int(m.group()))

            elif "door" in label:
                m = re.search(r"\d+", value)
                if m:
                    specs.setdefault("doors", int(m.group()))

            # ── Provenance ──────────────────────────────────────────────────
            elif "country" in label or "origin" in label:
                specs.setdefault("country", value)

            elif "production" in label or "launch" in label or "introduced" in label:
                specs.setdefault("launchDate", value)

        # Only return if we found something beyond the URL
        return specs if len(specs) > 1 else None
