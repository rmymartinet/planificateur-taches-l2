def test_get_taches_cas_valide_retourne_liste(client):
    # Simule un appel à GET /api/taches.
    response = client.get("/api/taches")

    # Vérifie le code HTTP.
    assert response.status_code == 200

    # Récupère le JSON.
    data = response.get_json()

    assert isinstance(data, list)
    assert len(data) > 0

    for tache in data:
        assert "id" in tache
        assert "titre" in tache
        assert "dependances" in tache
        assert "priorite" in tache
        assert "duree" in tache

def test_get_ordre_cas_valide_retourne_ordre(client):
    taches_response = client.get("/api/taches")
    taches = taches_response.get_json()
    taches_ids = {t["id"] for t in taches}

    response = client.get("/api/ordre")
    assert response.status_code == 200

    data = response.get_json()
    assert "ordre" in data
    assert isinstance(data["ordre"], list)
    assert len(data["ordre"]) > 0

    # Vérifie que tous les IDs de l'ordre sont dans les tâches.
    assert set(data["ordre"]) == taches_ids

def test_add_tache_cas_valide_retourne_201(client):
    nouvelle_tache = {
        "id": 999,
        "titre": "Tâche de test",
        "dependances": [],
        "priorite": 1,
        "duree": 2,
    }

    response = client.post("/api/tache", json=nouvelle_tache)

    assert response.status_code == 201
    data = response.get_json()
    assert "message" in data
    assert data["message"] == "Tâche ajoutée avec succès!"

    # Vérifie que la tâche a été ajoutée.
    taches_response = client.get("/api/taches")
    taches = taches_response.get_json()
    assert any(t["id"] == 999 for t in taches)


def test_add_tache_cas_champs_manquants_retourne_400(client):
    tache_incomplete = {
        "id": 1000,
        "titre": "Tâche incomplète"
    }

    response = client.post("/api/tache", json=tache_incomplete)

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert any(champ in data["error"] for champ in ("dependances", "priorite", "duree"))

def test_add_tache_cas_id_duplique_retourne_400(client):
    tache_dupliquee = {
        "id": 1,  # Même ID que dans le jeu de données initial.
        "titre": "Tâche dupliquée",
        "dependances": [],
        "priorite": 1,
        "duree": 1,
    }

    response = client.post("/api/tache", json=tache_dupliquee)

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "existe déjà" in data["error"]


def test_update_tache_cas_valide_modifie_tache(client):
    nouvelle_tache = {
        "id": 1001,
        "titre": "Tâche à modifier",
        "dependances": [],
        "priorite": 2,
        "duree": 3,
    }
    client.post("/api/tache", json=nouvelle_tache)

    payload_update = {
        "titre": "Tâche modifiée",
        "dependances": [],
        "priorite": 1,
        "duree": 4,
    }

    response = client.put("/api/tache/1001", json=payload_update)
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data
    assert data["tache"]["titre"] == "Tâche modifiée"
    assert data["tache"]["priorite"] == 1
    assert data["tache"]["duree"] == 4


def test_update_tache_cas_introuvable_retourne_404(client):
    response = client.put("/api/tache/inconnue", json={"titre": "x"})
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data
    assert "introuvable" in data["error"]


def test_delete_tache_cas_valide_supprime_tache(client):
    nouvelle_tache = {
        "id": 1002,
        "titre": "Tâche à supprimer",
        "dependances": [],
        "priorite": 3,
        "duree": 1,
    }
    client.post("/api/tache", json=nouvelle_tache)

    response = client.delete("/api/tache/1002")
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data

    taches_response = client.get("/api/taches")
    taches = taches_response.get_json()
    assert not any(str(t["id"]) == "1002" for t in taches)


def test_delete_tache_cas_introuvable_retourne_404(client):
    response = client.delete("/api/tache/inconnue")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data
    assert "introuvable" in data["error"]
