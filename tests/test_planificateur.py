import pytest
from datetime import date, timedelta

from planificateur import (
    construire_graphe,
    construire_priorites,
    calcule_indegrees,
    tri_topo,
    valider_taches,
    calculer_planning,
)


def test_construire_graphe_cas_simple_retourne_graphe_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 2, "duree": 2},
    ]

    graphe = construire_graphe(taches)

    assert graphe["A"] == ["B"]
    assert graphe["B"] == []

def test_construire_graphe_cas_dependances_multiples_retourne_graphe_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 2, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["A"], "priorite": 3, "duree": 1},
    ]

    graphe = construire_graphe(taches)

    assert set(graphe["A"]) == {"B", "C"}

def test_construire_graphe_cas_vide_retourne_graphe_vide():
    assert construire_graphe([]) == {}

def test_construire_graphe_cas_dependance_inconnue_leve_erreur():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": ["X"], "priorite": 1, "duree": 1},
    ]

    with pytest.raises(ValueError, match="Dépendance inconnue 'X' pour la tâche 'A'"):
        construire_graphe(taches)

def test_calcule_indegrees_cas_simple_retourne_indegrees_attendus():
    graphe = {"A": ["B"], "B": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1}

def test_calcule_indegrees_cas_multiples_retourne_indegrees_attendus():
    graphe = {"A": ["B", "C"], "B": [], "C": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1, "C": 1}

def test_calcule_indegrees_cas_vide_retourne_dict_vide():
    graphe = {}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {}

def test_calcule_indegrees_cas_chaine_retourne_indegrees_attendus():
    graphe = {"A": ["B"], "B": ["C"], "C": []}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 0, "B": 1, "C": 1}

def test_calcule_indegrees_cas_cycle_retourne_indegrees_attendus():
    graphe = {"A": ["B"], "B": ["C"], "C": ["A"]}
    indegrees = calcule_indegrees(graphe)
    assert indegrees == {"A": 1, "B": 1, "C": 1}

def test_construire_priorites_cas_simple_retourne_priorites_attendues():
    taches = [
        {"id": "A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "dependances": [], "priorite": 3, "duree": 2},
    ]

    priorites = construire_priorites(taches)
    assert priorites == {"A": 1, "B": 3}

def test_tri_topo_cas_simple_retourne_ordre_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["A", "B"], "priorite": 1, "duree": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["A", "B", "C"]

def test_tri_topo_cas_priorites_retourne_ordre_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": [], "priorite": 2, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["A", "B"], "priorite": 1, "duree": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["B", "A", "C"]

def test_tri_topo_cas_cycle_simple_leve_erreur():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": ["B"], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 1, "duree": 1},
    ]

    with pytest.raises(ValueError, match="Cycle de dépendances détecté"):
        tri_topo(taches)

def test_tri_topo_cas_vide_retourne_liste_vide():
    ordre = tri_topo([])
    assert ordre == []

def test_valider_taches_cas_champs_obligatoires_manquants_leve_erreur():
    taches = [{"id": "A", "dependances": [], "priorite": 1, "duree": 1}]

    with pytest.raises(ValueError, match="champs manquants"):
        valider_taches(taches)

def test_valider_taches_cas_priorite_invalide_leve_erreur():
    taches = [{"id": "A", "titre": "Tache A", "dependances": [], "priorite": 0, "duree": 1}]

    with pytest.raises(ValueError, match="entier >= 1"):
        valider_taches(taches)

def test_valider_taches_cas_duree_invalide_leve_erreur():
    taches = [{"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 0}]

    with pytest.raises(ValueError, match="nombre > 0"):
        valider_taches(taches)

def test_valider_taches_cas_id_duplique_leve_erreur():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "A", "titre": "Tache B", "dependances": [], "priorite": 2, "duree": 2},
    ]

    with pytest.raises(ValueError, match="dupliqué"):
        valider_taches(taches)

def test_tri_topo_cas_cycle_complexe_leve_erreur():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": ["B"], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["C"], "priorite": 1, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["A"], "priorite": 1, "duree": 1},
    ]

    with pytest.raises(ValueError, match="Cycle de dépendances détecté"):
        tri_topo(taches)

def test_tri_topo_cas_chaine_longue_retourne_ordre_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 1, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["B"], "priorite": 1, "duree": 1},
        {"id": "D", "titre": "Tache D", "dependances": ["C"], "priorite": 1, "duree": 1},
        {"id": "E", "titre": "Tache E", "dependances": ["D"], "priorite": 1, "duree": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["A", "B", "C", "D", "E"]

def test_tri_topo_cas_priorites_dependances_multiples_retourne_ordre_attendu():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": [], "priorite": 2, "duree": 1},
        {"id": "C", "titre": "Tache C", "dependances": ["A"], "priorite": 3, "duree": 1},
        {"id": "D", "titre": "Tache D", "dependances": ["A"], "priorite": 4, "duree": 1},
        {"id": "E", "titre": "Tache E", "dependances": ["B"], "priorite": 5, "duree": 1},
    ]

    ordre = tri_topo(taches)
    assert ordre == ["B", "E", "A", "D", "C"]


# --- Tests calculer_planning ---

DATE_REF = date(2026, 1, 1)


def test_calculer_planning_cas_simple_sans_dependances():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 3},
    ]
    planning = calculer_planning(taches, date_debut=DATE_REF)
    assert len(planning) == 1
    assert planning[0]["date_debut"] == "2026-01-01"
    assert planning[0]["date_fin"] == "2026-01-04"
    assert planning[0]["duree"] == 3


def test_calculer_planning_cas_chaine_dates_enchainees():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 2},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 1, "duree": 3},
    ]
    planning = calculer_planning(taches, date_debut=DATE_REF)
    par_id = {p["id"]: p for p in planning}

    assert par_id["A"]["date_debut"] == "2026-01-01"
    assert par_id["A"]["date_fin"] == "2026-01-03"
    assert par_id["B"]["date_debut"] == "2026-01-03"
    assert par_id["B"]["date_fin"] == "2026-01-06"


def test_calculer_planning_cas_duree_par_defaut_vaut_1():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1},
    ]
    planning = calculer_planning(taches, date_debut=DATE_REF)
    assert planning[0]["duree"] == 1
    assert planning[0]["date_fin"] == "2026-01-02"


def test_calculer_planning_cas_date_debut_chaine_iso():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
    ]
    planning = calculer_planning(taches, date_debut="2026-06-01")
    assert planning[0]["date_debut"] == "2026-06-01"
    assert planning[0]["date_fin"] == "2026-06-02"


def test_calculer_planning_cas_cycle_leve_erreur():
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": ["B"], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 1, "duree": 1},
    ]
    with pytest.raises(ValueError, match="Cycle de dépendances détecté"):
        calculer_planning(taches)


def test_calculer_planning_cas_debut_max_dependances():
    # B et C sont parallèles, D attend la plus longue (C=5j)
    taches = [
        {"id": "A", "titre": "Tache A", "dependances": [], "priorite": 1, "duree": 1},
        {"id": "B", "titre": "Tache B", "dependances": ["A"], "priorite": 2, "duree": 2},
        {"id": "C", "titre": "Tache C", "dependances": ["A"], "priorite": 1, "duree": 5},
        {"id": "D", "titre": "Tache D", "dependances": ["B", "C"], "priorite": 1, "duree": 1},
    ]
    planning = calculer_planning(taches, date_debut=DATE_REF)
    par_id = {p["id"]: p for p in planning}

    # A: 01-01 → 01-02, B: 01-02 → 01-04, C: 01-02 → 01-07
    # D doit démarrer après max(01-04, 01-07) = 01-07
    assert par_id["D"]["date_debut"] == "2026-01-07"
    assert par_id["D"]["date_fin"] == "2026-01-08"
