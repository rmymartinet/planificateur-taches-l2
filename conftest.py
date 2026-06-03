import json
import sys
from pathlib import Path

import pytest

# Rend les modules backend importables depuis tous les tests.
RACINE_PROJET = Path(__file__).resolve().parent
sys.path.insert(0, str(RACINE_PROJET / "backend"))

from api import app
import stockage


@pytest.fixture
def fichier_taches_temporaire(tmp_path, monkeypatch):
    fichier_temp = tmp_path / "taches_test.json"
    donnees = {
        "taches": [
            {"id": 1, "titre": "Tache 1", "dependances": [], "priorite": 1, "duree": 1},
            {"id": 2, "titre": "Tache 2", "dependances": [1], "priorite": 2, "duree": 2}
        ]
    }
    fichier_temp.write_text(json.dumps(donnees, ensure_ascii=False, indent=2), encoding="utf-8")
    monkeypatch.setattr(stockage, "FICHIER_TACHES", fichier_temp)
    return fichier_temp


@pytest.fixture
def client(fichier_taches_temporaire):
    # Crée un client de test
    app.config["TESTING"] = True
    return app.test_client()