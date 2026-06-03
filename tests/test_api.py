import json


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


def test_add_tache_cas_valide_persiste_duree(client, fichier_taches_temporaire):
    nouvelle_tache = {
        "id": 1100,
        "titre": "Tache avec duree persistante",
        "dependances": [],
        "priorite": 2,
        "duree": 7.5,
    }

    response = client.post("/api/tache", json=nouvelle_tache)
    assert response.status_code == 201

    contenu = json.loads(fichier_taches_temporaire.read_text(encoding="utf-8"))
    taches = contenu["taches"]
    tache_creee = next((t for t in taches if t["id"] == 1100), None)

    assert tache_creee is not None
    assert tache_creee["duree"] == 7.5


def test_update_tache_cas_valide_persiste_duree(client, fichier_taches_temporaire):
    payload_update = {"duree": 9.25}

    response = client.put("/api/tache/1", json=payload_update)
    assert response.status_code == 200

    contenu = json.loads(fichier_taches_temporaire.read_text(encoding="utf-8"))
    taches = contenu["taches"]
    tache_maj = next((t for t in taches if str(t["id"]) == "1"), None)

    assert tache_maj is not None
    assert tache_maj["duree"] == 9.25


def test_add_tache_cas_duree_invalide_retourne_400(client):
    valeurs_invalides = [0, -3, "abc", True, False]

    for i, duree_invalide in enumerate(valeurs_invalides, start=1):
        payload = {
            "id": f"invalid-duree-post-{i}",
            "titre": "Duree invalide",
            "dependances": [],
            "priorite": 1,
            "duree": duree_invalide,
        }

        response = client.post("/api/tache", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "duree" in data["error"].lower()


def test_update_tache_cas_duree_invalide_retourne_400(client):
    valeurs_invalides = [0, -1, "pas-un-nombre", True, False]

    for duree_invalide in valeurs_invalides:
        response = client.put("/api/tache/1", json={"duree": duree_invalide})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "duree" in data["error"].lower()


def test_add_tache_cas_json_invalide_retourne_400(client):
    response = client.post(
        "/api/tache",
        data='{"id": 2000, "titre": "JSON casse",',
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "json invalide" in data["error"].lower()


def test_update_tache_cas_json_invalide_retourne_400(client):
    response = client.put(
        "/api/tache/1",
        data='{"titre": "JSON casse",',
        content_type="application/json",
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "json invalide" in data["error"].lower()


def test_update_tache_cas_tente_modifier_id_retourne_400(client):
    response = client.put("/api/tache/1", json={"id": 9999})

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "id" in data["error"].lower()
    assert "ne peut pas" in data["error"].lower()


def test_update_tache_cas_dependances_inconnues_retourne_400(client):
    response = client.put("/api/tache/1", json={"dependances": [9999, "inconnu"]})

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "dépendance" in data["error"].lower() or "dependance" in data["error"].lower()
    assert "inconnue" in data["error"].lower()


def test_delete_tache_cas_valide_nettoie_dependances_des_autres_taches(client):
    response = client.delete("/api/tache/1")
    assert response.status_code == 200

    taches_response = client.get("/api/taches")
    assert taches_response.status_code == 200
    taches = taches_response.get_json()

    tache_dependante = next((t for t in taches if str(t["id"]) == "2"), None)
    assert tache_dependante is not None
    assert tache_dependante["dependances"] == []
