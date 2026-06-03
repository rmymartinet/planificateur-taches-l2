from flask import Flask, jsonify, request
from flask_cors import CORS

from planificateur import tri_topo, valider_tache
from stockage import charger_taches, sauvegarder_taches

app = Flask(__name__)

# Permet à notre frontend de faire des requêtes à ce backend depuis un autre domaine (ex: localhost:3000)
CORS(app)


@app.route("/api/taches", methods=["GET"])
def get_taches():
  try:
    taches = charger_taches()
    return jsonify(taches)
  except ValueError as e:
    return jsonify({"error": str(e)}), 400
  except Exception as e:
    return jsonify({"error": str(e)}), 500
  
@app.route("/api/ordre", methods=["GET"])
def get_ordre():
  try:
    taches = charger_taches()
    ordre = tri_topo(taches)
    return jsonify({"ordre": ordre})
  except ValueError as e:
    return jsonify({"error": str(e)}), 400
  except Exception as e:
    return jsonify({"error": str(e)}), 500

@app.route("/api/tache", methods=["POST"])
def add_tache():
  try:
    #silent=True pour éviter une exception si le JSON est mal formé, on gère ça nous même
    data = request.get_json(silent=True)
    if data is None:
      return jsonify({"error": "Requête JSON invalide"}), 400

    taches = charger_taches()

    valider_tache(data)

    if any(t["id"] == data["id"] for t in taches):
      raise ValueError(f"Une tâche avec l'identifiant '{data['id']}' existe déjà.")

    taches.append(data)
    sauvegarder_taches(taches)

    return jsonify({"message": "Tâche ajoutée avec succès!"}), 201

  except ValueError as e:
    return jsonify({"error": str(e)}), 400
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@app.route("/api/tache/<tache_id>", methods=["PUT"])
def update_tache(tache_id):
  try:
    data = request.get_json(silent=True)
    if data is None:
      return jsonify({"error": "Requête JSON invalide"}), 400

    taches = charger_taches()
    index = next((i for i, t in enumerate(taches) if str(t["id"]) == str(tache_id)), None)
    if index is None:
      return jsonify({"error": f"Tâche '{tache_id}' introuvable."}), 404

    tache_existante = taches[index]
    tache_maj = {
      "id": tache_existante["id"],
      "titre": data.get("titre", tache_existante.get("titre")),
      "dependances": data.get("dependances", tache_existante.get("dependances")),
      "priorite": data.get("priorite", tache_existante.get("priorite")),
      "duree": data.get("duree", tache_existante.get("duree")),
    }

    if "id" in data and str(data["id"]) != str(tache_existante["id"]):
      return jsonify({"error": "Le champ 'id' ne peut pas être modifié."}), 400

    valider_tache(tache_maj)

    ids = {str(t["id"]) for t in taches}
    dependances_invalides = [dep for dep in tache_maj["dependances"] if str(dep) not in ids]
    if dependances_invalides:
      return jsonify({"error": f"Dépendance(s) inconnue(s): {dependances_invalides}"}), 400

    taches[index] = tache_maj
    sauvegarder_taches(taches)

    return jsonify({"message": "Tâche modifiée avec succès!", "tache": tache_maj}), 200
  except ValueError as e:
    return jsonify({"error": str(e)}), 400
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@app.route("/api/tache/<tache_id>", methods=["DELETE"])
def delete_tache(tache_id):
  try:
    taches = charger_taches()
    existe = any(str(t["id"]) == str(tache_id) for t in taches)
    if not existe:
      return jsonify({"error": f"Tâche '{tache_id}' introuvable."}), 404


    taches_filtrees = [
      {
        **t,
        "dependances": [dep for dep in t["dependances"] if str(dep) != str(tache_id)],
      }
      for t in taches
      if str(t["id"]) != str(tache_id)
    ]
    sauvegarder_taches(taches_filtrees)

    return jsonify({"message": "Tâche supprimée avec succès!"}), 200
  except Exception as e:
    return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
  app.run(debug=True, port=5000)
