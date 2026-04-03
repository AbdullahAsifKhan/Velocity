from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple, Optional

def _iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def citation(source_id: str, source_name: str, url: str = None, field: str = None) -> Dict[str, Any]:
    c = {
        "sourceId": source_id,
        "sourceName": source_name,
        "retrievedAt": _iso_now(),
    }
    if url: c["url"] = url
    if field: c["field"] = field
    return c

def choose_by_priority(governance: Dict[str, Any], candidates: List[Tuple[str, Dict[str, Any]]]) -> Optional[Dict[str, Any]]:
    if not candidates:
        return None
    order = governance.get("sourcePriority", [])
    rank = {sid: i for i, sid in enumerate(order)}
    candidates_sorted = sorted(candidates, key=lambda x: rank.get(x[0], len(order)))
    
    merged = {}
    citations = []
    
    for _source_id, fragment in candidates_sorted:
        contributed = False
        for k, v in fragment.items():
            if k == "sources":
                continue
            if k not in merged and v is not None:
                merged[k] = v
                contributed = True
        if contributed and "sources" in fragment:
            citations.extend(fragment["sources"])
            
    if merged:
        merged["sources"] = citations
        merged["ingestedAt"] = _iso_now()
        
    return merged if merged else None
