import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from api import app

@pytest.fixture
def client():
    # crée un client de test
    return app.test_client()

def test_get_taches(client):
  
    # simule un appel à GET /api/taches
    response = client.get('/api/taches')
    
    # vérifie le code HTTP
    assert response.status_code == 200
    
    # récupère le JSON
    data = response.get_json()
    
    assert isinstance(data, list)
    assert len(data) > 0

    for tache in data:
        assert "id" in tache
        assert "titre" in tache
        assert "dependances" in tache
        assert "priorite" in tache

def test_get_ordre(client):
  
    taches_response = client.get('/api/taches')
    taches = taches_response.get_json()
    taches_ids = {t["id"] for t in taches}
    
    response = client.get('/api/ordre')
    assert response.status_code == 200
    
    data = response.get_json()
    assert "ordre" in data
    assert isinstance(data["ordre"], list)
    assert len(data["ordre"]) > 0
    
    # vérifie que tous les IDs de l'ordre sont dans les taches
    assert set(data["ordre"]) == taches_ids

def test_add_tache(client):
    
    nouvelle_tache = {
        "id": 999,
        "titre": "Tâche de test",
        "dependances": [],
        "priorite": 1
    }

    response = client.post('/api/tache', json=nouvelle_tache)

    assert response.status_code == 201
    data = response.get_json()
    assert "message" in data
    assert data["message"] == "Tâche ajoutée avec succès!"

    # Vérifie que la tâche a été ajoutée
    taches_response = client.get('/api/taches')
    taches = taches_response.get_json()
    assert any(t["id"] == 999 for t in taches)

def test_add_tache_champs_manquants(client):
    
    tache_incomplete ={
        "id": 1000,
        "titre": "Tâche incomplète"
    } 

    response = client.post('/api/tache', json = tache_incomplete)

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "dependances" in data["error"] or "priorite" in data["error"]

def test_add_tache_id_duplique(client): 
    
    tache_dupliquee = {
        "id": 1,  # Même ID que dans test_add_tache
        "titre": "Tâche dupliquée",
        "dependances": [],
        "priorite": 1
    }

    response = client.post('/api/tache', json=tache_dupliquee)

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "existe déjà" in data["error"]