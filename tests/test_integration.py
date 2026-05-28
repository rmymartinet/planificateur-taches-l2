import json
from pathlib import Path
from planificateur import tri_topo


def test_tri_topo_cas_donnees_reelles_retourne_ordre_coherent():
  with open(Path(__file__).resolve().parent.parent / "data" / "taches.json") as f:
    data = json.load(f)
    taches = data["taches"]
    ordre = tri_topo(taches)
    assert len(ordre) == len(taches)
    assert set(ordre) == set(t["id"] for t in taches)
 