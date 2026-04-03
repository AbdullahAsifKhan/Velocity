import re

def canonical_key(brand: str, model: str, year: int) -> str:
    brand_clean = re.sub(r'[^a-z0-9]', '', brand.lower())
    model_clean = re.sub(r'[^a-z0-9]', '', model.lower())
    return f"{brand_clean}::{model_clean}::{year}"

def normalize_currency(amount: float, from_currency: str, to_currency: str) -> float:
    # A simple stub, in reality would use forex rates
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

def normalize_car_data(raw_data: dict) -> dict:
    normalized = {}
    for k, v in raw_data.items():
        if isinstance(v, str):
            normalized[k] = clean_string(v)
        else:
            normalized[k] = v
            
    if 'weightLbs' in raw_data and 'weight' not in raw_data:
        normalized['weight'] = lbs_to_kg(raw_data['weightLbs'])
    if 'horsepower' in raw_data:
        normalized['powerKw'] = hp_to_kw(raw_data['horsepower'])
        
    return normalized
