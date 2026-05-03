import json
from pathlib import Path
import sys



sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from planificateur import tri_topo


def test_tri_topo_avec_donnees_reelles():
  with open(Path(__file__).resolve().parent.parent / "data" / "taches.json") as f:
    data = json.load(f)
    taches = data["taches"]
    ordre = tri_topo(taches)
    assert len(ordre) == len(taches)
    assert set(ordre) == set(t["id"] for t in taches)
 