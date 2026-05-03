from stockage import charger_taches
from planificateur import tri_topo


#Point d'entrée de l'application
def principal():

    try: 
        taches = charger_taches()
        ordre_execution = tri_topo(taches)
        titre =  {t["id"]: t["titre"] for t in taches}

        print("Ordre d'exécution des tâches :")
        for id_tache in ordre_execution:
            print(f"- {id_tache} - {titre[id_tache]}")
    except ValueError as e:
        print(f"Erreur lors du chargement des tâches : {e}")
    except Exception as e: 
        print(f"Une erreur inattendue est survenue : {e}")


if __name__ == "__main__":
    principal()
