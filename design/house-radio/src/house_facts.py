"""Write facts.json, routing.json, wiring.csv and hardware.csv from the geometry."""
import csv
import json
from pathlib import Path

from lib.facts import facts

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    f = facts()
    (ROOT / "facts.json").write_text(json.dumps({k: v for k, v in f.items() if k != "routing"}, indent=2) + "\n")
    (ROOT / "routing.json").write_text(json.dumps({"parameters": f["parameters"], **f["routing"]}, indent=2) + "\n")
    with (ROOT / "wiring.csv").open("w", newline="") as out:
        fields = ("id", "group", "from", "to", "title", "color", "route_length_mm", "suggested_length_mm")
        writer = csv.DictWriter(out, fieldnames=fields)
        writer.writeheader()
        writer.writerows({k: w[k] for k in fields} for w in f["routing"]["wires"])
    with (ROOT / "hardware.csv").open("w", newline="") as out:
        writer = csv.writer(out)
        writer.writerow(["id", "where", "fastener", "count", "stack", "clearance_mm", "pilot_mm", "countersink_mm", "note"])
        for r in f["fasteners"]:
            d = r["drill"]
            writer.writerow([r["id"], r["title"], r["designation"], r["count"], r["stack"], d["clearance"], d["pilot"] or "",
                             d["countersink"] or "", r["note"]])
    print(f"Wrote facts: {len(f['cut_list'])} part types, {len(f['fasteners'])} fastenings, {len(f['shopping'])} shopping lines.")
