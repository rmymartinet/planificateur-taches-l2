import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from planificateur import (
    construire_graphe,
    construire_priorites,
    calcule_indegrees,
    tri_topo,
    valider_taches,
)


def test_construire_graphe_simple():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 2},
    ]

    graphe = construire_graphe(taches)

    assert graphe["A"] == ["B"]
    assert graphe["B"] == []
    print("Test Simple OK")


def test_construire_graphe_dependances_multiples():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 2},
        {"id": "C", "titre": "Tache C", "dependances": ["A"], "priorite": 3},
    ]

    graphe = construire_graphe(taches)

    assert set(graphe["A"]) == {"B", "C"}
    print("Test Dependances Multiples OK")


def test_construire_graphe_vide():
    assert construire_graphe([]) == {}
    print("Test Vide OK")


def test_construire_graphe_dep_inconnue():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": ["X"], "priorite": 1},
    ]

    with pytest.raises(ValueError, match="Dépendance inconnue 'X' pour la tâche 'A'"):
        construire_graphe(taches)


def test_calcule_indegrees_simple():
    graphe = {"A": ["B"], "B": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1}


def test_calcule_indegrees_multiples():
    graphe = {"A": ["B", "C"], "B": [], "C": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1, "C": 1}


def test_calcule_indegrees_vide():
    graphe = {}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {}


def test_calcule_indegrees_chaine():
    graphe = {"A": ["B"], "B": ["C"], "C": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1, "C": 1}


def test_calcule_indegrees_cycle():
    graphe = {"A": ["B"], "B": ["C"], "C": ["A"]}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 1, "B": 1, "C": 1}


def test_construire_priorites_simple():
    taches = [
        {"id": "A", "dependances": [], "priorite": 1},
        {"id": "B", "dependances": [], "priorite": 3},
    ]

    priorites = construire_priorites(taches)
    assert priorites == {"A": 1, "B": 3}


def test_tri_topo_simple():
    taches = [
        {"id": "A", "dependances": [], "priorite": 1},
        {"id": "B", "dependances": [], "priorite": 1},
        {"id": "C", "dependances": ["A", "B"], "priorite": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["A", "B", "C"]


def test_tri_topo_priorites():
    taches = [
        {"id": "A", "dependances": [], "priorite": 1},
        {"id": "B", "dependances": [], "priorite": 2},
        {"id": "C", "dependances": ["A", "B"], "priorite": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["B", "A", "C"]


def test_tri_topo_cycle_simple():
    taches = [
        {"id": "A", "dependances": ["B"], "priorite": 1},
        {"id": "B", "dependances": ["A"], "priorite": 1},
    ]

    with pytest.raises(ValueError, match="Cycle de dépendances détecté"):
        tri_topo(taches)


def test_tri_topo_vide():
    ordre = tri_topo([])
    assert ordre == []

def test_valider_taches_champs_obligatoires():
    taches = [{"id": "A", "dependances": [], "priorite": 1}]

    with pytest.raises(ValueError, match="champs manquants"):
        valider_taches(taches)


def test_valider_taches_priorite_invalide():
    taches = [{"id": "A", "titre": "Tache A", "dependances": [], "priorite": 0}]

    with pytest.raises(ValueError, match="entier >= 1"):
        valider_taches(taches)


def test_valider_taches_id_duplique():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1},
        {"id": "A", "titre": "Tache B", "dependances": [], "priorite": 2},
    ]

    with pytest.raises(ValueError, match="dupliqué"):
        valider_taches(taches)
