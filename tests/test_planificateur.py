import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from planificateur import construire_graphe, calcule_indegrees

def test_construire_graphe_simple():
    taches = [
        {"id": "A", "dependances": []},
        {"id": "B", "dependances": ["A"]},
    ]

    graphe = construire_graphe(taches)

    assert graphe["A"] == ["B"]
    assert graphe["B"] == []
    print("Test Simple OK")


def test_construire_graphe_dependances_multiples():
    taches = [
        {"id": "A", "dependances": []},
        {"id": "B", "dependances": ["A"]},
        {"id": "C", "dependances": ["A"]},
    ]

    graphe = construire_graphe(taches)

    assert set(graphe["A"]) == {"B", "C"}
    print("Test Dependances Multiples OK")


def test_construire_graphe_vide():
    assert construire_graphe([]) == {}
    print("Test Vide OK")


def test_construire_graphe_dep_inconnue():
    taches = [
        {"id": "A", "dependances": ["X"]},
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