
CHAMPS_OBLIGATOIRES = ("id", "titre", "dependances", "priorite", "duree")


def valider_taches(taches):
    """Valide le format final des tâches

    Champs obligatoires:
    - id: int ou str
    - titre: str non vide
    - dependances: list
    - priorite: int >= 1
    - duree: int ou float > 0
    """

    if not isinstance(taches, list):
        raise ValueError("Le jeu de tâches doit être une liste.")

    ids_vus = set()
    for index, tache in enumerate(taches):
        if not isinstance(tache, dict):
            raise ValueError(f"La tâche à l'index {index} doit être un objet JSON.")

        champs_manquants = [champ for champ in CHAMPS_OBLIGATOIRES if champ not in tache]
        if champs_manquants:
            raise ValueError(
                f"La tâche à l'index {index} est incomplète: champs manquants {champs_manquants}."
            )

        if not isinstance(tache["id"], (int, str)):
            raise ValueError(f"Le champ 'id' de la tâche à l'index {index} doit être int ou str.")

        if tache["id"] in ids_vus:
            raise ValueError(f"Identifiant de tâche dupliqué: '{tache['id']}'.")
        ids_vus.add(tache["id"])

        if not isinstance(tache["titre"], str) or not tache["titre"].strip():
            raise ValueError(f"Le champ 'titre' de la tâche '{tache['id']}' doit être une chaîne non vide.")

        if not isinstance(tache["dependances"], list):
            raise ValueError(f"Le champ 'dependances' de la tâche '{tache['id']}' doit être une liste.")

        if not isinstance(tache["priorite"], int) or tache["priorite"] < 1:
            raise ValueError(f"Le champ 'priorite' de la tâche '{tache['id']}' doit être un entier >= 1.")

        if (
            not isinstance(tache["duree"], (int, float))
            or isinstance(tache["duree"], bool) # Python considère True et False comme int
            or tache["duree"] <= 0
        ):
            raise ValueError(f"Le champ 'duree' de la tâche '{tache['id']}' doit être un nombre > 0.")

def valider_tache(tache):
    """Valide une tâche individuelle, utile pour l'API POST /api/tache"""

    if not isinstance(tache, dict):
        raise ValueError("La tâche doit être un objet JSON.")

    champs_manquants = [champ for champ in CHAMPS_OBLIGATOIRES if champ not in tache]
    if champs_manquants:
        raise ValueError(
            f"La tâche est incomplète: champs manquants {champs_manquants}."
        )

    if not isinstance(tache["id"], (int, str)):
        raise ValueError("Le champ 'id' doit être int ou str.")

    if not isinstance(tache["titre"], str) or not tache["titre"].strip():
        raise ValueError("Le champ 'titre' doit être une chaîne non vide.")

    if not isinstance(tache["dependances"], list):
        raise ValueError("Le champ 'dependances' doit être une liste.")

    if not isinstance(tache["priorite"], int) or tache["priorite"] < 1:
        raise ValueError("Le champ 'priorite' doit être un entier >= 1.")

    if (
        not isinstance(tache["duree"], (int, float))
        or isinstance(tache["duree"], bool) # Python considère True et False comme int
        or tache["duree"] <= 0
    ):
        raise ValueError("Le champ 'duree' doit être un nombre > 0.")


def construire_graphe(taches):
    """Construit un graphe des dépendances validé

    key: id de tâche
    value: liste des tâches qui dépendent de cette clé
    """

    valider_taches(taches)

    graphe = {}
    for tache in taches:
        graphe[tache["id"]] = []

    for tache in taches:
        for dep in tache["dependances"]:
            if dep not in graphe:
                raise ValueError(
                    f"Dépendance inconnue '{dep}' pour la tâche '{tache['id']}'"
                )
            graphe[dep].append(tache["id"])

    return graphe

def calcule_indegrees(graphe):
    '''Prend un graphe comme renvoyé par construire_graphe
    Renvoie un dict indiquant le nombre de dépendances restantes 
    pour chaque noeud du graphe '''
    indegrees = {noeud: 0 for noeud in graphe}

    for dependants in graphe.values():
        for dependant in dependants:
            indegrees[dependant] += 1

    return indegrees

def construire_priorites(taches):
    '''Prend une liste de dicts comme renvoyé par charger_taches()
    Renvoie un dict indiquant la priorité de chaque noeud du graphe '''

    priorites = {}

    for tache in taches:
        priorites[tache["id"]] = tache["priorite"]
    
    return priorites

def tri_topo(taches):
    '''Prend une liste de dicts comme renvoyé par charger_taches() et
    fait un tri topologique des taches en utilisant l'algorithme de 
    Kahn avec priorités, renvoie un ordre valide des taches'''

    graphe = construire_graphe(taches)
    priorites = construire_priorites(taches)
    indegrees = calcule_indegrees(graphe)
    resultat = []

    #Initialise une liste de noeuds disponibles (sans dépendances)
    prochaines = []
    for id in indegrees:
        if indegrees[id] == 0:
            prochaines.append(id)
    
    #Tant qu'il y a au moins un noeud de disponible (indegrees == 0)
    while prochaines:

        #Choisi le noeud le plus prioritaire parmi ceux disponibles
        prochaines.sort(key=lambda id: priorites[id], reverse=True)
        noeud = prochaines.pop(0)

        resultat.append(noeud)

        #Met à jour les dépendances et les noeuds disponibles
        for dependant in graphe[noeud]:
            indegrees[dependant] -= 1
            if indegrees[dependant] == 0:
                prochaines.append(dependant)

    #Détection de cycle si tous les noeuds n'ont pas été ajoutés au résultat
    if len(resultat) != len(graphe):
        raise ValueError("Cycle de dépendances détecté dans les taches")
    
    return resultat
