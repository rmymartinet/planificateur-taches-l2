# Documentation Backend

## Vue d'ensemble

Le backend fournit une API HTTP pour gérer des tâches avec dépendances, calculer un ordre d'exécution valide, et persister les données dans un fichier JSON.

Technologies principales:
- Python
- Flask
- Flask-CORS
- Pytest (tests)

Objectifs fonctionnels:
- Lire la liste des tâches.
- Ajouter, modifier, supprimer une tâche.
- Calculer un ordre d'exécution compatible avec les dépendances.
- Prioriser les tâches avec un tri topologique pondéré par la priorité.

## Structure backend

- [backend/api.py](backend/api.py): API REST Flask.
- [backend/planificateur.py](backend/planificateur.py): validation métier, graphe de dépendances, tri topologique.
- [backend/stockage.py](backend/stockage.py): lecture/écriture du JSON de données.
- [backend/application.py](backend/application.py): point d'entrée CLI (affichage de l'ordre d'exécution).

Fichier de données:
- [data/taches.json](data/taches.json)

## Modèle de données

Chaque tâche est un objet JSON avec les champs obligatoires suivants:

- id: int ou str, identifiant unique.
- titre: str non vide.
- dependances: list des identifiants de tâches dont elle dépend.
- priorite: int >= 1 (plus grand = plus prioritaire).

Exemple:

```json
{
	"id": "A",
	"titre": "Initialiser le projet",
	"dependances": [],
	"priorite": 3
}
```

Le fichier [data/taches.json](data/taches.json) est stocké sous la forme:

```json
{
	"taches": [
		{
			"id": "A",
			"titre": "...",
			"dependances": [],
			"priorite": 1
		}
	]
}
```

## Lancement du backend

Depuis la racine du projet:

```bash
python backend/api.py
```

Le serveur démarre en mode debug sur le port 5000:
- URL de base: http://localhost:5000

## API REST

La description détaillée des routes, formats de requêtes/réponses et codes de statut est centralisée dans la documentation API dédiée du projet (API.md).

Ce document backend se concentre sur l'architecture interne, les règles métier et la persistance.

## Règles métier et tri des tâches

Les règles métier sont dans [backend/planificateur.py](backend/planificateur.py):

1. Validation des tâches (format et contraintes).
2. Construction d'un graphe orienté des dépendances.
3. Calcul des indegrees (nombre de dépendances restantes).
4. Tri topologique de Kahn.
5. En cas de choix multiple, sélection de la tâche de priorité la plus élevée.

Détail du tri:
- Un noeud est disponible si son indegree vaut 0.
- Parmi les noeuds disponibles, le backend prend celui avec la valeur priorite la plus élevée.
- Si un cycle existe, aucune solution complète n'est possible et une erreur est levée.

Erreur cycle:
- ValueError: Cycle de dépendances détecté dans les taches

## Persistance des données

Le module [backend/stockage.py](backend/stockage.py):
- Lit [data/taches.json](data/taches.json) en UTF-8.
- Écrit [data/taches.json](data/taches.json) en UTF-8 avec indentation (2 espaces) et caractères non ASCII conservés.

Chemin de stockage utilisé:
- Calculé dynamiquement depuis le dossier backend vers data/taches.json.

## Comportement CLI

Le script [backend/application.py](backend/application.py) permet un usage terminal:
- Charge les tâches.
- Calcule l'ordre d'exécution.
- Affiche chaque id avec son titre.

Commande:

```bash
python backend/application.py
```

## CORS

Le backend active CORS globalement dans [backend/api.py](backend/api.py), ce qui permet au frontend (origine différente) d'appeler l'API.

## Tests associés

Les tests backend sont principalement dans:
- [tests/test_api.py](tests/test_api.py)
- [tests/test_planificateur.py](tests/test_planificateur.py)
- [tests/test_integration.py](tests/test_integration.py)

Ils couvrent notamment:
- Lecture des tâches et de l'ordre.
- Ajout, modification, suppression via API.
- Validation des champs.
- Détection des cycles et dépendances inconnues.
- Cohérence du tri sur données réelles.

Lancer les tests:

```bash
pytest
```
