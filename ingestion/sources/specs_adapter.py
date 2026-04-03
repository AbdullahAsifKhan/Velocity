from typing import Any, Dict, Optional

class SpecsAdapter:
    """Base class for an adapter that fetches car specs."""
    
    def __init__(self, source_id: str, name: str):
        self.source_id = source_id
        self.name = name

    def fetch_specs(self, brand: str, model: str, year: int) -> Optional[Dict[str, Any]]:
        """Fetch specs for a car, to be implemented by subclass."""
        raise NotImplementedError("Subclasses must implement fetch_specs")

class MockSpecsAdapter(SpecsAdapter):
    """A mock implementation to simulate pulling data during development."""
    
    def __init__(self):
        super().__init__("mock_specs", "Mock Specs Data Provider")
        
    def fetch_specs(self, brand: str, model: str, year: int) -> Optional[Dict[str, Any]]:
        # Simulate an API response
        if brand.lower() == "porsche" and "911" in model.lower():
            return {
                "transmission": "8-speed PDK",
                "drivetrain": "RWD",
                "dimensions": {"length": 4573, "width": 1900, "height": 1322},
                "weight": 1525,
                "warranty": "4 years / 50,000 miles",
                "serviceInterval": "10,000 miles",
                "officialPageUrl": "https://www.porsche.com"
            }
        return None
