/* =========================================================
   APP.JS — Bouaziz Ayoub Louaye
   Langue : français
========================================================= */

(() => {
  "use strict";

  const API_BASE = "http://localhost:5000";
  const ROUTES = {
    taches: "/api/taches",
    ordre: "/api/ordre",
    tache: "/api/tache",
    plan: "/api/plan",
  };

  let taches = [];
  let tacheSelectionneeId = null;
  let dernierPlanning = [];
  let apiDisponible = false;

  const $ = (id) => document.getElementById(id);

  const uid = () =>
    "tache_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  const prochainId = () => {
    const idsNumeriques = taches
      .map((tache) => Number(tache.id))
      .filter((valeur) => Number.isFinite(valeur));

    const max = idsNumeriques.length ? Math.max(...idsNumeriques) : 0;
    return max + 1;
  };

  const escapeHtml = (valeur) =>
    String(valeur)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const libellePriorite = {
    1: "Haute",
    2: "Moyenne",
    3: "Basse",
  };

  const classePriorite = {
    1: "badge-prio-1",
    2: "badge-prio-2",
    3: "badge-prio-3",
  };

  document.addEventListener("DOMContentLoaded", async () => {
    injectStyles();
    injectHighTechWidget();
    brancherBoutonsExistants();
    definirStatutApi("local", "Connexion…");
    await chargerTaches();
    afficherTout();
  });

  function brancherBoutonsExistants() {
    const boutonResetFormulaire = $("resetBtn");
    const boutonSauvegarde = document.querySelector(".left-col .panel .panel-body > .btn-primary");
    const boutonCalcul = document.querySelector(".right-col .plan-btn-wrap .btn-primary");
    const boutonResetTotal = document.querySelector(".right-col .plan-btn-wrap .btn:not(.btn-primary)");

    if (boutonResetFormulaire) {
      boutonResetFormulaire.removeAttribute("onclick");
      boutonResetFormulaire.addEventListener("click", reinitialiserFormulaire);
    }

    if (boutonSauvegarde) {
      boutonSauvegarde.removeAttribute("onclick");
      boutonSauvegarde.addEventListener("click", sauvegarderTache);
    }

    if (boutonCalcul) {
      boutonCalcul.removeAttribute("onclick");
      boutonCalcul.addEventListener("click", calculerPlanning);
    }

    if (boutonResetTotal) {
      boutonResetTotal.removeAttribute("onclick");
      boutonResetTotal.addEventListener("click", reinitialiserTout);
    }
  }

  function definirStatutApi(etat, message) {
    const pastille = $("statusDot");
    const libelle = $("statusLabel");

    if (!pastille || !libelle) return;

    pastille.className = `status-dot ${etat}`;
    libelle.textContent = message;
  }

  async function requeteApi(chemin, options = {}) {
    const parametres = {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    };

    if (options.body) {
      parametres.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const reponse = await fetch(`${API_BASE}${chemin}`, parametres);
    const texte = await reponse.text();
    let donnees = null;

    if (texte) {
      try {
        donnees = JSON.parse(texte);
      } catch {
        donnees = texte;
      }
    }

    if (!reponse.ok) {
      const message =
        donnees?.erreur ||
        donnees?.error ||
        donnees?.message ||
        `Erreur API ${reponse.status}`;
      throw new Error(message);
    }

    return donnees;
  }

  async function chargerTaches({ silencieux = false } = {}) {
    try {
      const donnees = await requeteApi(ROUTES.taches);
      taches = normaliserListeTaches(extraireListe(donnees, ["taches", "data", "items"]));
      apiDisponible = true;
      definirStatutApi("connected", "API connectée");
      dernierPlanning = [];
      masquerPanneauxPlanning();
      afficherTout();
    } catch (erreur) {
      apiDisponible = false;
      taches = [];
      dernierPlanning = [];
      definirStatutApi("error", "API indisponible");
      afficherTout();

      if (!silencieux) {
        showAlert(
          "planAlert",
          "Impossible de charger les tâches depuis l’API. Lancez python backend/api.py puis rechargez la page."
        );
      }
    }
  }

  function extraireListe(donnees, cles) {
    if (Array.isArray(donnees)) return donnees;
    if (!donnees || typeof donnees !== "object") return [];

    for (const cle of cles) {
      if (Array.isArray(donnees[cle])) return donnees[cle];
    }

    return [];
  }

  function normaliserListeTaches(liste) {
    const provisoires = liste.map((element, index) => normaliserTache(element, index));

    return provisoires.map((tache) => ({
      ...tache,
      dependances: tache.dependances
        .map((reference) => convertirReferenceEnId(reference, provisoires))
        .filter(Boolean),
    }));
  }

  function normaliserTache(element, index = 0) {
    const objet = element && typeof element === "object" ? element : { titre: String(element || "") };
    const titre = String(objet.titre ?? `Tâche ${index + 1}`).trim();
    const id = String((objet.id ?? objet.identifiant ?? titre) || uid());
    const duree = Number(objet.duree ?? 1);
    const priorite = Number(objet.priorite ?? 2);
    const dependancesBrutes = objet.dependances ?? [];

    return {
      id,
      titre,
      duree: Number.isFinite(duree) && duree > 0 ? duree : 1,
      priorite: [1, 2, 3].includes(priorite) ? priorite : 2,
      dependances: Array.isArray(dependancesBrutes)
  ? dependancesBrutes.map((x) => Number(x))
  : [],
      referenceApi: String(objet.id ?? objet.identifiant ?? titre),
    };
  }

  function convertirReferenceEnId(reference, liste = taches) {
    const valeur = String(reference);
    const trouvee = liste.find((tache) => tache.id === valeur || tache.titre === valeur || tache.referenceApi === valeur);
    return trouvee ? trouvee.id : null;
  }

  function convertirIdEnReferenceApi(id) {
    const tache = taches.find((element) => element.id === id);
    return tache ? tache.referenceApi || tache.id || tache.titre : id;
  }

  function convertirIdEnTitre(id) {
    const tache = taches.find((element) => element.id === id);
    return tache ? tache.titre : id;
  }

  function preparerTachePourApi(tache) {
    return {
      id: tache.id,
      titre: tache.titre,
      duree: tache.duree,
      priorite: tache.priorite,
      dependances: (tache.dependances || []).map(Number),
    };
  }

  function afficherTout() {
    afficherDependances();
    afficherListeTaches();
    afficherReseau();
    mettreAJourInsightWidget();
  }

  function showAlert(id, message, type = "danger") {
    const alerte = $(id);
    if (!alerte) return;

    alerte.className = `alert alert-${type} show`;
    alerte.textContent = message;

    setTimeout(() => {
      alerte.classList.remove("show");
    }, 3500);
  }

  function afficherDependances() {
    const conteneur = $("depsCheckboxes");
    if (!conteneur) return;

    const editId = $("editId")?.value || "";
    const tacheCourante = taches.find((tache) => tache.id === editId);
    const dependancesSelectionnees = tacheCourante?.dependances || [];
    const tachesDisponibles = taches.filter((tache) => tache.id !== editId);

    if (!tachesDisponibles.length) {
      conteneur.innerHTML = `<span class="text-muted">Aucune tâche disponible</span>`;
      return;
    }

    conteneur.innerHTML = tachesDisponibles
      .map(
        (tache) => `
          <label class="dep-label">
            <input
              type="checkbox"
              value="${escapeHtml(tache.id)}"
              ${dependancesSelectionnees.includes(tache.id) ? "checked" : ""}
            />
            ${escapeHtml(tache.titre)}
          </label>
        `
      )
      .join("");
  }

  function afficherListeTaches() {
    const liste = $("taskList");
    const compteur = $("taskCount");

    if (!liste) return;
    if (compteur) compteur.textContent = taches.length;

    if (!taches.length) {
      liste.innerHTML = `
        <div class="empty-state">
          Aucune tâche pour l'instant.<br>
          Créez votre première tâche ci-dessus.
        </div>
      `;
      return;
    }

    liste.innerHTML = taches
      .map((tache) => {
        const texteDependances = tache.dependances.length
          ? `${tache.dependances.length} dépendance(s)`
          : "Sans dépendance";

        return `
          <div class="task-card ${tacheSelectionneeId === tache.id ? "selected" : ""}" data-tache-id="${escapeHtml(tache.id)}">
            <div class="task-info">
              <div class="task-name">${escapeHtml(tache.titre)}</div>
              <div class="task-meta">${tache.duree}J • ${texteDependances}</div>
            </div>

            <div class="task-actions">
              <span class="badge ${classePriorite[tache.priorite]}">
                ${libellePriorite[tache.priorite]}
              </span>

              <button class="btn btn-sm" data-action="edit" data-id="${escapeHtml(tache.id)}">
                Modifier
              </button>

              <button class="btn btn-sm btn-danger" data-action="delete" data-id="${escapeHtml(tache.id)}">
                Supprimer
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    liste.querySelectorAll(".task-card").forEach((carte) => {
      carte.addEventListener("click", () => {
        selectionnerTache(carte.dataset.tacheId);
      });
    });

    liste.querySelectorAll("[data-action='edit']").forEach((bouton) => {
      bouton.addEventListener("click", (event) => {
        event.stopPropagation();
        modifierTache(bouton.dataset.id);
      });
    });

    liste.querySelectorAll("[data-action='delete']").forEach((bouton) => {
      bouton.addEventListener("click", (event) => {
        event.stopPropagation();
        supprimerTache(bouton.dataset.id);
      });
    });
  }

  async function sauvegarderTache() {
    const titreInput = $("titreInput");
    const dureeInput = $("dureeInput");
    const prioriteInput = $("prioriteInput");
    const editInput = $("editId");

    if (!titreInput || !dureeInput || !prioriteInput || !editInput) return;

    const titre = titreInput.value.trim();
    const duree = Number(dureeInput.value);
    const priorite = Number(prioriteInput.value);
    const editId = editInput.value;

    const dependances = Array.from(
      document.querySelectorAll("#depsCheckboxes input[type='checkbox']:checked")
    ).map((checkbox) => Number(checkbox.value));

    if (!titre) {
      showAlert("formAlert", "Veuillez saisir un titre de tâche.");
      return;
    }

    if (!duree || duree <= 0) {
      showAlert("formAlert", "La durée doit être supérieure à 0.");
      return;
    }

    const tache = {
      id: editId || prochainId(),
      titre,
      duree,
      priorite,
      dependances,
    };

    try {
      definirStatutApi("local", "Envoi API…");

      if (editId) {
        await modifierTacheApi(tache);
        showAlert("formAlert", "Tâche mise à jour avec succès.", "success");
      } else {
        await requeteApi(ROUTES.tache, {
          method: "POST",
          body: preparerTachePourApi(tache),
        });
        showAlert("formAlert", "Tâche ajoutée au planning.", "success");
      }

      await chargerTaches({ silencieux: true });
      reinitialiserFormulaire();
      definirStatutApi("connected", "API connectée");
    } catch (erreur) {
      definirStatutApi("error", "Erreur API");
      showAlert("formAlert", messageEndpointManquant(erreur, editId ? "PUT /api/tache/<id>" : "POST /api/tache"));
    }
  }

  async function modifierTacheApi(tache) {
    const reference = encodeURIComponent(convertirIdEnReferenceApi(tache.id));
    await requeteApi(`${ROUTES.tache}/${reference}`, {
      method: "PUT",
      body: preparerTachePourApi(tache),
    });
  }

  function messageEndpointManquant(erreur, endpoint) {
    const texte = erreur?.message || "Erreur API";

    if (/404|405|not found|method/i.test(texte)) {
      return `Endpoint ${endpoint} indisponible côté backend.`;
    }

    return texte;
  }

  function reinitialiserFormulaire() {
    const titreInput = $("titreInput");
    const dureeInput = $("dureeInput");
    const prioriteInput = $("prioriteInput");
    const editInput = $("editId");
    const titreFormulaire = $("formTitle");
    const libelleBouton = $("btnLabel");
    const boutonReset = $("resetBtn");

    if (titreInput) titreInput.value = "";
    if (dureeInput) dureeInput.value = 1;
    if (prioriteInput) prioriteInput.value = 2;
    if (editInput) editInput.value = "";
    if (titreFormulaire) titreFormulaire.textContent = "Nouvelle tâche";
    if (libelleBouton) libelleBouton.textContent = "Ajouter la tâche";
    if (boutonReset) boutonReset.style.display = "none";

    tacheSelectionneeId = null;

    afficherDependances();
    afficherListeTaches();
    afficherReseau();
  }

  function selectionnerTache(id) {
    tacheSelectionneeId = tacheSelectionneeId === id ? null : id;
    afficherListeTaches();
    afficherReseau();
    animerNoeud(id);
  }

  function modifierTache(id) {
    const tache = taches.find((item) => item.id === id);
    if (!tache) return;

    $("titreInput").value = tache.titre;
    $("dureeInput").value = tache.duree;
    $("prioriteInput").value = tache.priorite;
    $("editId").value = tache.id;
    $("formTitle").textContent = "Modifier la tâche";
    $("btnLabel").textContent = "Enregistrer";
    $("resetBtn").style.display = "inline-flex";

    tacheSelectionneeId = id;

    afficherDependances();
    afficherListeTaches();
    afficherReseau();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function supprimerTache(id) {
    const tache = taches.find((element) => element.id === id);
    if (!tache) return;

    try {
      definirStatutApi("local", "Envoi API…");
      const reference = encodeURIComponent(convertirIdEnReferenceApi(id));
      await requeteApi(`${ROUTES.tache}/${reference}`, { method: "DELETE" });

      if ($("editId")?.value === id) {
        reinitialiserFormulaire();
      }

      tacheSelectionneeId = null;
      dernierPlanning = [];
      await chargerTaches({ silencieux: true });
      masquerPanneauxPlanning();
      definirStatutApi("connected", "API connectée");
      showAlert("formAlert", "Tâche supprimée.", "success");
    } catch (erreur) {
      definirStatutApi("error", "Erreur API");
      showAlert("formAlert", messageEndpointManquant(erreur, "DELETE /api/tache/<id>"));
    }
  }

  function reinitialiserTout() {
      dernierPlanning = [];

      masquerPanneauxPlanning();
      afficherReseau();
      mettreAJourInsightWidget();

      showAlert("planAlert", "Planning réinitialisé.", "success");
  }

  function masquerPanneauxPlanning() {
    if ($("orderedPanel")) $("orderedPanel").style.display = "none";
    if ($("ganttPanel")) $("ganttPanel").style.display = "none";
    if ($("emptyPlanPanel")) $("emptyPlanPanel").style.display = "block";
  }

  async function calculerPlanning() {
    if (!taches.length) {
      showAlert("planAlert", "Ajoutez au moins une tâche avant de calculer.");
      return;
    }

    try {
      definirStatutApi("local", "Calcul API…");
      const donnees = await requeteApi(ROUTES.plan, {
        method: "POST",
        body: {},
      });
      const planning = normaliserPlanningApi(donnees);

      if (!planning.length) {
        showAlert("planAlert", "L’API n’a retourné aucun ordre de tâches.");
        return;
      }

      dernierPlanning = planning;

      afficherOrdre(dernierPlanning);
      afficherGantt(dernierPlanning);
      afficherReseau(dernierPlanning);
      mettreAJourInsightWidget();

      if ($("orderedPanel")) $("orderedPanel").style.display = "block";
      if ($("ganttPanel")) $("ganttPanel").style.display = "block";
      if ($("emptyPlanPanel")) $("emptyPlanPanel").style.display = "none";

      definirStatutApi("connected", "API connectée");
      showAlert("planAlert", "Planning intelligent calculé avec succès.", "success");
    } catch (erreur) {
      definirStatutApi("error", "Erreur API");
      showAlert("planAlert", erreur?.message || "Impossible de calculer le planning via l’API.");
    }
  }

  function normaliserPlanningApi(donnees) {
    const planningBrut = extraireListe(donnees, ["planning", "ordre", "plan", "taches", "data", "items"]);

    return planningBrut.map((entree, index) => {
      const tacheConnue = chercherTacheParReference(String(entree.id)) || {};

      return {
        id: convertirReferenceEnId(entree.id) || String(entree.id),
        titre: entree.titre,
        duree: entree.duree,
        priorite: tacheConnue.priorite ?? 2,
        dependances: tacheConnue.dependances || [],
        etape: index + 1,
        dateDebut: entree.date_debut,
        dateFin: entree.date_fin,
      };
    });
  }

  function chercherTacheParReference(reference) {
    return taches.find(
      (tache) => tache.id === reference || tache.titre === reference || tache.referenceApi === reference
    );
  }

  function afficherOrdre(planning) {
    const liste = $("orderedList");
    if (!liste) return;

    liste.innerHTML = planning
      .map(
        (tache) => `
          <div class="ordered-item">
            <div class="step-num">${tache.etape}</div>

            <div class="step-info">
              <div class="step-name">${escapeHtml(tache.titre)}</div>
              <div class="step-dates">
                Début : ${tache.dateDebut} • Fin : ${tache.dateFin}
              </div>
            </div>

            <span class="badge ${classePriorite[tache.priorite]}">
              ${libellePriorite[tache.priorite]}
            </span>
          </div>
        `
      )
      .join("");
  }

function afficherGantt(planning) {
    const svg = $("ganttSvg");
    if (!svg) return;

    const largeur = 900;
    const gauche = 165;
    const haut = 48;
    const hauteurLigne = 56;
    const hauteur = haut + planning.length * hauteurLigne + 40;
    const largeurGraphique = largeur - gauche - 40;

    const dateProjetDebut = new Date(Math.min(...planning.map((t) => new Date(t.dateDebut))));
    const joursDepuisDebut = (dateIso) =>
      Math.round((new Date(dateIso) - dateProjetDebut) / (1000 * 60 * 60 * 24));

    planning.forEach((tache) => {
      tache.debut = joursDepuisDebut(tache.dateDebut);
      tache.fin = joursDepuisDebut(tache.dateFin);
    });

    const total = Math.max(...planning.map((tache) => tache.fin), 1);

    svg.setAttribute("viewBox", `0 0 ${largeur} ${hauteur}`);
    svg.innerHTML = "";

    const defs = creerSvg("defs");
    defs.innerHTML = `
      <linearGradient id="ganttGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#185FA5"/>
        <stop offset="50%" stop-color="#3CA8FF"/>
        <stop offset="100%" stop-color="#8FE3FF"/>
      </linearGradient>

      <filter id="ganttGlow">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    svg.appendChild(texteSvg(20, 27, "Vue Gantt intelligente", "gantt-title"));
    svg.appendChild(ligneSvg(gauche, 36, largeur - 25, 36, "rgba(120,120,120,.35)"));

    for (let i = 0; i <= total; i++) {
      const x = gauche + (i / total) * largeurGraphique;

      svg.appendChild(ligneSvg(x, 42, x, hauteur - 20, "rgba(120,120,120,.16)"));
      svg.appendChild(texteSvg(x - 7, 27, `J${i}`, "gantt-small"));
    }

    planning.forEach((tache, index) => {
      const y = haut + index * hauteurLigne;
      const x = gauche + (tache.debut / total) * largeurGraphique;
      const w = Math.max(24, ((tache.fin - tache.debut) / total) * largeurGraphique);

      svg.appendChild(texteSvg(20, y + 27, `${tache.etape}. ${tache.titre}`, "gantt-label"));

      const fond = creerSvg("rect");
      fond.setAttribute("x", gauche);
      fond.setAttribute("y", y + 7);
      fond.setAttribute("width", largeurGraphique);
      fond.setAttribute("height", 28);
      fond.setAttribute("rx", 9);
      fond.setAttribute("fill", "rgba(120,120,120,.08)");
      svg.appendChild(fond);

      const barre = creerSvg("rect");
      barre.setAttribute("x", x);
      barre.setAttribute("y", y + 7);
      barre.setAttribute("width", w);
      barre.setAttribute("height", 28);
      barre.setAttribute("rx", 9);
      barre.setAttribute("fill", "url(#ganttGradient)");
      barre.setAttribute("filter", "url(#ganttGlow)");
      barre.classList.add("gantt-bar");
      svg.appendChild(barre);

      svg.appendChild(texteSvg(x + 11, y + 26, `${tache.duree}j`, "gantt-bar-text"));
    });
  }

  function creerSvg(balise) {
    return document.createElementNS("http://www.w3.org/2000/svg", balise);
  }

  function texteSvg(x, y, texte, classe) {
    const noeud = creerSvg("text");
    noeud.setAttribute("x", x);
    noeud.setAttribute("y", y);
    noeud.setAttribute("class", classe);
    noeud.textContent = texte;
    return noeud;
  }

  function ligneSvg(x1, y1, x2, y2, couleur) {
    const ligne = creerSvg("line");
    ligne.setAttribute("x1", x1);
    ligne.setAttribute("y1", y1);
    ligne.setAttribute("x2", x2);
    ligne.setAttribute("y2", y2);
    ligne.setAttribute("stroke", couleur);
    ligne.setAttribute("stroke-width", 1);
    return ligne;
  }

  function injectHighTechWidget() {
    const rightCol = document.querySelector(".right-col");
    if (!rightCol || $("aiLabPanel")) return;

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.id = "aiLabPanel";

    panel.innerHTML = `
      <div class="network-panel">
        <div class="network-header">
          <strong>Carte des dépendances</strong>
          <span id="networkInsight">Analyse en attente…</span>
        </div>

        <svg
          id="dependencyNetwork"
          viewBox="0 0 700 300"
          role="img"
          aria-label="Carte SVG interactive des dépendances">
        </svg>
      </div>
    `;

    rightCol.appendChild(panel);
  }

  function afficherReseau(planning = dernierPlanning) {
    const svg = $("dependencyNetwork");
    if (!svg) return;

    const source = planning.length ? planning : taches;
    svg.innerHTML = "";

    const defs = creerSvg("defs");
    defs.innerHTML = `
      <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8FE3FF"/>
        <stop offset="52%" stop-color="#378ADD"/>
        <stop offset="100%" stop-color="#185FA5"/>
      </linearGradient>

      <filter id="nodeGlow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <marker
        id="arrowHead"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#378ADD"></path>
      </marker>
    `;
    svg.appendChild(defs);

    if (!source.length) {
      const vide = texteSvg(
        350,
        150,
        "Ajoutez des tâches pour générer la carte intelligente.",
        "network-empty"
      );
      vide.setAttribute("text-anchor", "middle");
      svg.appendChild(vide);
      return;
    }

    const positions = source.map((tache, index) => {
      const total = source.length;
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const rayonX = total <= 3 ? 180 : 250;
      const rayonY = total <= 3 ? 80 : 105;

      return {
        id: tache.id,
        tache,
        x: 350 + Math.cos(angle) * rayonX,
        y: 150 + Math.sin(angle) * rayonY,
      };
    });

    const positionMap = new Map(positions.map((item) => [item.id, item]));

    positions.forEach((item) => {
      item.tache.dependances.forEach((dependanceId) => {
        const dependance = positionMap.get(dependanceId);
        if (!dependance) return;

        const chemin = creerSvg("path");
        const milieuX = (dependance.x + item.x) / 2;
        const milieuY = (dependance.y + item.y) / 2 - 35;

        chemin.setAttribute("d", `M ${dependance.x} ${dependance.y} Q ${milieuX} ${milieuY} ${item.x} ${item.y}`);
        chemin.setAttribute("fill", "none");
        chemin.setAttribute("stroke", "#378ADD");
        chemin.setAttribute("stroke-width", "2");
        chemin.setAttribute("stroke-dasharray", "7 7");
        chemin.setAttribute("marker-end", "url(#arrowHead)");
        chemin.classList.add("network-link");

        svg.appendChild(chemin);
      });
    });

    positions.forEach((item) => {
      const groupe = creerSvg("g");
      groupe.classList.add("network-node");
      groupe.dataset.id = item.id;
      groupe.style.cursor = "pointer";

      groupe.addEventListener("click", () => {
        tacheSelectionneeId = item.id;
        afficherListeTaches();
        afficherReseau();
        animerNoeud(item.id);
      });

      const cercle = creerSvg("circle");
      cercle.setAttribute("cx", item.x);
      cercle.setAttribute("cy", item.y);
      cercle.setAttribute("r", tacheSelectionneeId === item.id ? 35 : 29);
      cercle.setAttribute("fill", "url(#nodeGradient)");
      cercle.setAttribute("filter", "url(#nodeGlow)");
      cercle.classList.add("network-circle");

      const icone = texteSvg(
        item.x,
        item.y + 7,
        item.tache.priorite === 1 ? "★" : item.tache.priorite === 2 ? "●" : "✓",
        "network-icon"
      );
      icone.setAttribute("text-anchor", "middle");

      const libelle = texteSvg(
        item.x,
        item.y + 52,
        item.tache.titre.length > 18 ? item.tache.titre.slice(0, 18) + "…" : item.tache.titre,
        "network-label"
      );
      libelle.setAttribute("text-anchor", "middle");

      groupe.appendChild(cercle);
      groupe.appendChild(icone);
      groupe.appendChild(libelle);

      svg.appendChild(groupe);
    });
  }

  function animerNoeud(id) {
    const noeud = Array.from(document.querySelectorAll(".network-node"))
      .find((element) => element.dataset.id === id);
    if (!noeud) return;

    noeud.classList.remove("pulse-node");
    void noeud.offsetWidth;
    noeud.classList.add("pulse-node");
  }

  function mettreAJourInsightWidget() {
    const insight = $("networkInsight");
    if (!insight) return;

    if (!taches.length) {
      insight.textContent = "Analyse en attente…";
      return;
    }

    const totalHeures = taches.reduce((somme, tache) => somme + Number(tache.duree), 0);
    const nombreDependances = taches.reduce((somme, tache) => somme + tache.dependances.length, 0);

    insight.textContent = `${taches.length} tâche(s), ${totalHeures}h, ${nombreDependances} lien(s)`;
  }

  function injectStyles() {
    if ($("highTechInjectedStyles")) return;

    const style = document.createElement("style");
    style.id = "highTechInjectedStyles";

    style.textContent = `
      .network-panel {
        margin-top: 0;
        border: .5px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 45%),
          var(--surface);
      }

      .network-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: .85rem 1rem;
        border-bottom: .5px solid var(--border);
        font-size: 13px;
      }

      .network-header span {
        color: var(--text3);
      }

      #dependencyNetwork {
        width: 100%;
        min-height: 260px;
        display: block;
      }

      .network-link {
        animation: dashMove 1.8s linear infinite;
        opacity: .82;
      }

      @keyframes dashMove {
        to {
          stroke-dashoffset: -28;
        }
      }

      .network-node {
        transition: transform .2s ease;
      }

      .network-node:hover {
        transform: scale(1.04);
      }

      .network-icon {
        fill: white;
        font-size: 20px;
        font-weight: 800;
        pointer-events: none;
      }

      .network-label {
        fill: var(--text2);
        font-size: 12px;
        font-weight: 600;
        pointer-events: none;
      }

      .network-empty {
        fill: var(--text3);
        font-size: 14px;
      }

      .pulse-node {
        animation: nodePulse .7s ease;
      }

      @keyframes nodePulse {
        50% {
          transform: scale(1.15);
        }
      }

      .gantt-title {
        fill: var(--text);
        font-size: 16px;
        font-weight: 700;
      }

      .gantt-small {
        fill: var(--text3);
        font-size: 11px;
      }

      .gantt-label {
        fill: var(--text2);
        font-size: 12px;
        font-weight: 600;
      }

      .gantt-bar-text {
        fill: white;
        font-size: 12px;
        font-weight: 700;
      }

      .gantt-bar {
        animation: barIn .5s ease both;
      }

      @keyframes barIn {
        from {
          opacity: 0;
          transform: translateX(-12px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;

    document.head.appendChild(style);
  }

  window.saveTask = sauvegarderTache;
  window.resetForm = reinitialiserFormulaire;
  window.calculatePlan = calculerPlanning;
  window.resetAll = reinitialiserTout;
})();
