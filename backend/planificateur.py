

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