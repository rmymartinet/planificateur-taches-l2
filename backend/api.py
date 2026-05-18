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

if __name__ == "__main__":
  app.run(debug=True, port=5000)
