import json
from pathlib import Path


FICHIER_TACHES = Path(__file__).resolve().parent.parent / "data" / "taches.json"


def charger_taches():
    with FICHIER_TACHES.open("r", encoding="utf-8") as fichier:
        donnees = json.load(fichier)
    return donnees.get("taches", [])


def sauvegarder_taches(taches):
    donnees = {"taches": taches}
    with FICHIER_TACHES.open("w", encoding="utf-8") as fichier:
        json.dump(donnees, fichier, indent=2, ensure_ascii=False)
