from stockage import charger_taches


#Point d'entrée de l'application
def principal():
    taches = charger_taches()
    print("Taches chargees :")
    for tache in taches:
        print(
            f"- {tache['id']}: {tache['titre']} "
            f"(dependances={tache.get('dependances', [])})"
        )


if __name__ == "__main__":
    principal()
