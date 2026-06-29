# Documentation API | Planificateur de Taches

## Description

API REST minimaliste pour gérer et planifier des taches avec gestion des dépendances et des priorités.

L'API permet de :

- Récupérer la liste des taches
- Calculer l'ordre d'exécution optimal (tri topologique)
- Calculer un planning avec dates de début et de fin
- Ajouter, modifier et supprimer des taches

## Configuration

**URL de base:** `http://localhost:5000`

**Format:** JSON

---

## Endpoints

### 1. GET /api/taches

**Description:** Récupère la liste complète de toutes les taches stockées.

**Méthode HTTP:** `GET`

**URL:** `/api/taches`

**Paramètres:** Aucun

**Réponse (200 - Succès):**

```json
[
  {
    "id": 1,
    "titre": "Installer le projet",
    "dependances": [],
    "priorite": 1,
    "duree": 1
  },
  {
    "id": 2,
    "titre": "Configurer le backend",
    "dependances": [1],
    "priorite": 2,
    "duree": 2
  },
  {
    "id": 3,
    "titre": "Tester le chargement des taches",
    "dependances": [2],
    "priorite": 3,
    "duree": 1.5
  }
]
```

**Codes HTTP possibles:**

- `200 OK` : Succès, retourne la liste des taches
- `400 Erreur` : Requete invalide (ex: paramètres incorrects)
- `500 Erreur serveur` : Problème lors du chargement des taches

---

### 2. GET /api/ordre

**Description:** Calcule et retourne l'ordre d'exécution optimal des taches en respectant les dépendances et les priorités.

**Méthode HTTP:** `GET`

**URL:** `/api/ordre`

**Paramètres:** Aucun

**Réponse (200 - Succès):**

```json
{
  "ordre": [1, 2, 3]
}
```

**Codes HTTP possibles:**

- `200 OK` : Succès, retourne l'ordre trié
- `400 Erreur` : Cycle détecté dans les dépendances
- `500 Erreur serveur` : Problème lors du calcul

**Exemple d'erreur (cycle détecté):**

```json
{
  "error": "Cycle de dépendances détecté"
}
```

---

### 3. POST /api/plan

**Description:** Calcule un planning avec les dates de début et de fin pour chaque tâche, en respectant les dépendances.

**Méthode HTTP:** `POST`

**URL:** `/api/plan`

**En-têtes:** `Content-Type: application/json` (optionnel si body absent)

**Corps de la requête (optionnel):**

```json
{
  "date_debut": "2026-07-01"
}
```

**Paramètres optionnels:**

- `date_debut` (chaîne `YYYY-MM-DD`) : date de départ du planning. Défaut: aujourd'hui.

Le body peut être absent ou vide `{}` ; un JSON mal formé retourne une erreur 400.

**Réponse (200 - Succès):**

```json
{
  "planning": [
    {
      "id": 1,
      "titre": "Installer le projet",
      "duree": 1,
      "date_debut": "2026-07-01",
      "date_fin": "2026-07-02"
    },
    {
      "id": 2,
      "titre": "Configurer le backend",
      "duree": 2,
      "date_debut": "2026-07-02",
      "date_fin": "2026-07-04"
    }
  ]
}
```

**Codes HTTP possibles:**

- `200 OK` : Planning calculé avec succès
- `400 Bad Request` : JSON mal formé, `date_debut` invalide, ou cycle détecté
- `500 Erreur serveur` : Problème lors du calcul

---

### 4. POST /api/tache

**Description:** Ajoute une nouvelle tâche à la liste et la sauvegarde dans le fichier JSON.

**Méthode HTTP:** `POST`

**URL:** `/api/tache`

**En-têtes requis:**

```
Content-Type: application/json
```

**Corps de la requête:**

```json
{
  "id": 999,
  "titre": "Ma nouvelle tâche",
  "dependances": [1, 2],
  "priorite": 5,
  "duree": 2
}
```

**Paramètres obligatoires:**

- `id` (entier) : Identifiant unique de la tâche
- `titre` (chaîne) : Nom/description de la tâche
- `dependances` (liste) : Liste des IDs des taches dont dépend celle-ci
- `priorite` (entier >= 1) : Niveau de priorité

**Paramètres optionnels:**

- `duree` (nombre > 0) : Durée en jours (défaut: 1)

**Réponse (201 - Créée avec succès):**

```json
{
  "message": "Tâche ajoutée avec succès!"
}
```

**Réponse d'erreur (400 - Mauvaise requête):**

```json
{
  "error": "La tâche à l'index 0 est incomplète: champs manquants ['priorite']."
}
```

**Réponse d'erreur (ID dupliqué):**

```json
{
  "error": "Une tâche avec cet ID existe déjà."
}
```

**Codes HTTP possibles:**

- `201 Created` : Tâche ajoutée avec succès
- `400 Bad Request` : Données invalides (champs manquants, ID dupliqué, etc.)
- `500 Erreur serveur` : Problème lors de la sauvegarde

---

### 5. PUT /api/tache/<tache_id>

**Description:** Modifie une tâche existante identifiée par son ID. L'`id` de la tâche ne peut pas être changé.

**Méthode HTTP:** `PUT`

**URL:** `/api/tache/<tache_id>`

**En-têtes requis:**

```
Content-Type: application/json
```

**Corps de la requête:** Les champs à modifier (les champs absents conservent leur valeur actuelle).

```json
{
  "titre": "Nouveau titre",
  "priorite": 4,
  "dependances": [1],
  "duree": 3
}
```

**Réponse (200 - Succès):**

```json
{
  "message": "Tâche modifiée avec succès!",
  "tache": {
    "id": 2,
    "titre": "Nouveau titre",
    "dependances": [1],
    "priorite": 4,
    "duree": 3
  }
}
```

**Codes HTTP possibles:**

- `200 OK` : Tâche modifiée avec succès
- `400 Bad Request` : JSON invalide, tentative de modifier l'`id`, ou dépendance inconnue
- `404 Not Found` : Tâche introuvable
- `500 Erreur serveur` : Problème lors de la sauvegarde

---

### 6. DELETE /api/tache/<tache_id>

**Description:** Supprime une tâche par son ID. Les références à cette tâche dans les `dependances` des autres tâches sont automatiquement retirées.

**Méthode HTTP:** `DELETE`

**URL:** `/api/tache/<tache_id>`

**Paramètres:** Aucun

**Réponse (200 - Succès):**

```json
{
  "message": "Tâche supprimée avec succès!"
}
```

**Codes HTTP possibles:**

- `200 OK` : Tâche supprimée avec succès
- `404 Not Found` : Tâche introuvable
- `500 Erreur serveur` : Problème lors de la sauvegarde

---

## Utilisation générale

### Exemple d'utilisation complète

1. **Récupérer les taches existantes:**

```bash
curl http://localhost:5000/api/taches
```

2. **Ajouter une nouvelle tâche:**

```bash
curl -X POST http://localhost:5000/api/tache \
  -H "Content-Type: application/json" \
  -d '{"id": 100, "titre": "Tâche test", "dependances": [], "priorite": 1, "duree": 1}'
```

3. **Récupérer l'ordre d'exécution:**

```bash
curl http://localhost:5000/api/ordre
```

4. **Calculer le planning:**

```bash
curl -X POST http://localhost:5000/api/plan \
  -H "Content-Type: application/json" \
  -d '{"date_debut": "2026-07-01"}'
```

5. **Modifier une tâche:**

```bash
curl -X PUT http://localhost:5000/api/tache/100 \
  -H "Content-Type: application/json" \
  -d '{"priorite": 5}'
```

6. **Supprimer une tâche:**

```bash
curl -X DELETE http://localhost:5000/api/tache/100
```

---

## Notes importantes

- **Doublons :** L'API empêche l'ajout de deux taches avec le même ID
- **Durée :** Le champ `duree` est optionnel (défaut: 1 jour) et doit être un nombre strictement supérieur à 0
- **Cycles :** Si une dépendance circulaire est détectée, l'API retourne une erreur 400
- **Persistance :** Les taches sont sauvegardées dans `data/taches.json`
- **CORS :** L'API supporte CORS, le frontend peut l'appeler depuis n'importe quel domaine
- **Port par défaut :** 5000 (modifiable dans `backend/api.py`)

---

## Comment lancer le projet

### Prérequis

- Python 3.7+
- pip (gestionnaire de paquets Python)
- Un terminal (zsh, bash, etc.)

### Installation initiale

```bash
# 1. Cloner le projet (si nécessaire)
git clone <url-du-repo>
cd planificateur-taches-l2

# 2. Créer et activer le virtualenv
python3 -m venv .venv
source .venv/bin/activate  # Sur Mac/Linux
# .venv\Scripts\activate   # Sur Windows

# 3. Installer les dépendances
pip install -r requirements.txt
```

### Lancer le backend (API)

```bash
# 1. Activer le virtualenv (si pas déjà activé)
source .venv/bin/activate

# 2. Lancer le serveur API
python backend/api.py
```

Le serveur démarre sur `http://localhost:5000`

Vous devriez voir :

```
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

### Lancer le frontend

**Dans un AUTRE terminal :**

```bash
# 1. Se placer dans le dossier frontend
cd frontend

# 2. Lancer un serveur HTTP simple
python3 -m http.server 8000
```

Le frontend sera accessible sur `http://localhost:8000`

### Lancer les tests

**Dans un AUTRE terminal (avec le virtualenv activé) :**

```bash
# Lancer TOUS les tests
pytest -v

# Lancer seulement les tests du backend
pytest tests/test_planificateur.py -v

# Lancer les tests d'intégration
pytest tests/test_integration.py -v

# Lancer les tests de l'API
pytest tests/test_api.py -v

# Lancer un test spécifique
pytest tests/test_api.py::test_get_taches -v
```

### Architecture du projet

```
planificateur-taches-l2/
├── backend/
│   ├── api.py              # API Flask avec les endpoints
│   ├── planificateur.py    # Logique du tri topologique
│   ├── stockage.py         # Gestion du fichier JSON
│   └── application.py      # Application principale
├── frontend/
│   ├── index.html          # Page HTML
│   ├── css/
│   │   └── style.css       # Styles
│   └── js/
│       └── app.js          # JavaScript
├── data/
│   └── taches.json         # Données persistantes
├── tests/
│   ├── test_planificateur.py
│   ├── test_integration.py
│   └── test_api.py
├── conftest.py             # Configuration pytest
└── pytest.ini              # Configuration pytest
```

### Vérifier que tout fonctionne

1. **API opérationnelle :**

   ```bash
   curl http://localhost:5000/api/taches
   ```

   Vous devriez recevoir une liste JSON de tâches.

2. **Frontend accessible :**
   Ouvrez `http://localhost:8000` dans votre navigateur

3. **Tests passants :**
   ```bash
   pytest -v
   ```
   Tous les tests doivent afficher `PASSED`

### Dépannage

**Le port 5000 est déjà utilisé :**

```bash
# Modifier le port dans backend/api.py (dernière ligne)
app.run(debug=True, port=5001)  # Utiliser 5001 à la place
```

**Erreur "module not found" :**

```bash
# Vérifier que le virtualenv est activé
source .venv/bin/activate
pip install -r requirements.txt
```

**Les tests échouent :**

```bash
# Réinitialiser le virtualenv
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```
