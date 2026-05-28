# planificateur-taches-l2
Système de planification de tâches avec dépendances (projet L2 Informatique IED Paris 8)

## Prérequis et installation

Prérequis:
- Python 3.10+

Installation des dépendances du projet:

```bash
python -m pip install -r requirements.txt
```

## Backend

La documentation du backend est dans le fichier docs/backend.md. 
La documentation spécifique de l'API se trouve dans docs/API.md.

## Tests

La suite de tests est organisée par couche:

- `tests/test_planificateur.py`: tests unitaires des fonctions métier (validation, graphe, tri topologique).
- `tests/test_api.py`: tests API Flask (routes, statuts HTTP, format JSON).
- `tests/test_integration.py`: test d'intégration sur données réelles du projet.

### Conventions

- Nommage homogène: `test_fonction_cas_resultat`.
- Structure: Arrange / Act / Assert.
- Centralisation des fixtures et de la configuration de test dans `conftest.py`.

### Isolation des données

Les tests API utilisent un fichier JSON temporaire injecté via `monkeypatch`.
Ainsi, les tests n'écrivent pas dans `data/taches.json`.

### Exécution

```bash
pytest
```
