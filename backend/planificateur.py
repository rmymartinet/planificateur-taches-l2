

def construire_graphe(taches):
    '''Prend une liste de dicts comme renvoyé par charger_taches()
    Renvoie un graphe sous forme de dict, chaque entrée est une tache :
    key : id, value : liste de dépendants '''

    graphe = {}

    for tache in taches:
        graphe[tache["id"]] = [];
    
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
