import re


# ─── Unit Conversion ─────────────────────────────────────────────────────────

def canonical_key(brand: str, model: str, year: int) -> str:
    brand_clean = re.sub(r'[^a-z0-9]', '', brand.lower())
    model_clean = re.sub(r'[^a-z0-9]', '', model.lower())
    return f"{brand_clean}::{model_clean}::{year}"


def normalize_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Simple currency stub — swap in a live forex lookup for production."""
    rates = {'USD': 1.0, 'EUR': 1.05, 'GBP': 1.25}
    if from_currency == to_currency:
        return amount
    usd_amount = amount * rates.get(from_currency, 1.0)
    return round(usd_amount / rates.get(to_currency, 1.0), 2)


def clean_string(s: str) -> str:
    return " ".join(s.strip().split())


def hp_to_kw(hp: float) -> float:
    return round(hp * 0.7457, 1)


def lbs_to_kg(lbs: float) -> float:
    return round(lbs * 0.453592, 1)


def kw_to_hp(kw: float) -> int:
    """Convert kilowatts to horsepower (SAE)."""
    return round(kw / 0.7457)


def ps_to_hp(ps: float) -> int:
    """Convert metric horsepower (PS / CV / pk) to SAE horsepower."""
    return round(ps * 0.98632)


# ─── Power Parser (Wikipedia-safe) ───────────────────────────────────────────

# Regex: capture a leading numeric value + optional unit label
# Handles strings like:
#   "503 PS (496 hp)", "294 kW", "400 bhp", "450", "335 CV", "220 hp"
_POWER_RE = re.compile(
    r'([\d,\.]+)\s*(ps|cv|pk|kw|kilowatt|bhp|hp|horsepower)?',
    re.IGNORECASE,
)


def parse_power_to_hp(value) -> int | None:
    """
    Normalize any power value from Wikipedia or other sources to SAE horsepower.

    Accepts:
      - int / float  → treated as HP already
      - str          → parsed with unit detection
          "503 PS"         → 496 hp
          "294 kW"         → 394 hp
          "503 PS (496 hp)"→ picks the hp figure in parens if present
          "400 bhp"        → 400 hp  (bhp ≈ hp for display purposes)
          "450"            → 450 hp  (bare number assumed HP)

    Returns None if parsing fails.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(round(float(value)))

    s = str(value).strip()

    # Prefer an explicit HP / BHP figure in parentheses  e.g. "503 PS (496 hp; 503 cv)"
    hp_parens = re.search(r'\(([\d,\.]+)\s*(?:hp|bhp|horsepower)', s, re.IGNORECASE)
    if hp_parens:
        try:
            return int(round(float(hp_parens.group(1).replace(',', ''))))
        except ValueError:
            pass

    # Fall back to the first numeric + unit pair
    m = _POWER_RE.search(s)
    if not m:
        return None

    try:
        num = float(m.group(1).replace(',', ''))
    except ValueError:
        return None

    unit = (m.group(2) or '').lower()

    if unit in ('kw', 'kilowatt'):
        return kw_to_hp(num)
    elif unit in ('ps', 'cv', 'pk'):
        return ps_to_hp(num)
    elif unit in ('hp', 'bhp', 'horsepower', ''):
        # bare number or explicit HP → take as-is
        return int(round(num))

    return int(round(num))  # unknown unit, best guess


# ─── Torque Parser ────────────────────────────────────────────────────────────

_TORQUE_RE = re.compile(
    r'([\d,\.]+)\s*(nm|n·m|lb-ft|lbft|lb·ft|ft-lb|ftlb)?',
    re.IGNORECASE,
)


def parse_torque_to_nm(value) -> int | None:
    """
    Normalize torque to Newton-metres.
    Accepts int/float (assumed Nm) or strings like "369 lb-ft", "500 Nm".
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(round(float(value)))

    s = str(value).strip()
    m = _TORQUE_RE.search(s)
    if not m:
        return None

    try:
        num = float(m.group(1).replace(',', ''))
    except ValueError:
        return None

    unit = (m.group(2) or '').lower().replace('·', '')
    if unit in ('lb-ft', 'lbft', 'lb-ft', 'ft-lb', 'ftlb'):
        return int(round(num * 1.35582))
    return int(round(num))  # Nm or bare number


# ─── Main Normalizer ──────────────────────────────────────────────────────────

def normalize_car_data(raw_data: dict) -> dict:
    """
    Canonicalise a raw car record:
      - Strips extra whitespace from all strings
      - Converts weight from lbs → kg
      - Normalises power (HP/PS/kW/bhp) → SAE horsepower stored as `horsepower`
      - Normalises torque (Nm / lb-ft) → Nm stored as `torque`
      - Derives `powerKw` for metric display
    """
    normalized = {}
    for k, v in raw_data.items():
        if isinstance(v, str):
            normalized[k] = clean_string(v)
        else:
            normalized[k] = v

    # Weight
    if 'weightLbs' in raw_data and 'weight' not in raw_data:
        normalized['weight'] = lbs_to_kg(raw_data['weightLbs'])

    # Power — always run through parser to catch PS/kW from Wikipedia
    raw_hp = raw_data.get('horsepower') or raw_data.get('power')
    if raw_hp is not None:
        hp = parse_power_to_hp(raw_hp)
        if hp and hp > 0:
            normalized['horsepower'] = hp
            normalized['powerKw'] = hp_to_kw(hp)

    # Torque — normalize lb-ft → Nm
    raw_torque = raw_data.get('torque')
    if raw_torque is not None:
        nm = parse_torque_to_nm(raw_torque)
        if nm and nm > 0:
            normalized['torque'] = nm

    return normalized
