/* =========================================================
   APP.JS — Bouaziz Ayoub Louaye
   Langue : français
========================================================= */

(() => {
  "use strict";

  let tasks = JSON.parse(localStorage.getItem("planner_tasks_fr")) || [];
  let selectedTaskId = null;
  let lastPlan = [];

  const $ = (id) => document.getElementById(id);

  const uid = () =>
    "task_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  const saveLocal = () => {
    localStorage.setItem("planner_tasks_fr", JSON.stringify(tasks));
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const priorityLabel = {
    1: "Haute",
    2: "Moyenne",
    3: "Basse",
  };

  const priorityClass = {
    1: "badge-prio-1",
    2: "badge-prio-2",
    3: "badge-prio-3",
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectHighTechWidget();
    wireExistingButtons();
    setApiStatus();
    createDemoTasks();
    renderAll();
    updateSimulation();
    start3DInteraction();
  });

  function wireExistingButtons() {
    const resetFormBtn = $("resetBtn");
    const saveTaskBtn = document.querySelector(".left-col .panel .panel-body > .btn-primary");
    const calculateBtn = document.querySelector(".right-col .plan-btn-wrap .btn-primary");
    const resetAllBtn = document.querySelector(".right-col .plan-btn-wrap .btn:not(.btn-primary)");

    if (resetFormBtn) {
      resetFormBtn.removeAttribute("onclick");
      resetFormBtn.addEventListener("click", resetForm);
    }

    if (saveTaskBtn) {
      saveTaskBtn.removeAttribute("onclick");
      saveTaskBtn.addEventListener("click", saveTask);
    }

    if (calculateBtn) {
      calculateBtn.removeAttribute("onclick");
      calculateBtn.addEventListener("click", calculatePlan);
    }

    if (resetAllBtn) {
      resetAllBtn.removeAttribute("onclick");
      resetAllBtn.addEventListener("click", resetAll);
    }
  }

  function setApiStatus() {
    const dot = $("statusDot");
    const label = $("statusLabel");

    if (!dot || !label) return;

    dot.className = "status-dot connected";
    label.textContent = "Mode local actif";
  }

  function createDemoTasks() {
    if (tasks.length) return;

    const t1 = uid();
    const t2 = uid();
    const t3 = uid();

    tasks = [
      {
        id: t1,
        title: "Analyse du besoin client",
        duration: 2,
        priority: 1,
        dependencies: [],
      },
      {
        id: t2,
        title: "Créer la maquette interactive",
        duration: 3,
        priority: 2,
        dependencies: [t1],
      },
      {
        id: t3,
        title: "Validation et livraison",
        duration: 1.5,
        priority: 1,
        dependencies: [t2],
      },
    ];

    saveLocal();
  }

  function renderAll() {
    renderDependencies();
    renderTaskList();
    renderNetwork();
    updateWidgetInsight();
  }

  function showAlert(id, message, type = "danger") {
    const alert = $(id);
    if (!alert) return;

    alert.className = `alert alert-${type} show`;
    alert.textContent = message;

    setTimeout(() => {
      alert.classList.remove("show");
    }, 3500);
  }

  function renderDependencies() {
    const container = $("depsCheckboxes");
    if (!container) return;

    const editId = $("editId")?.value || "";
    const currentTask = tasks.find((task) => task.id === editId);
    const selectedDeps = currentTask?.dependencies || [];
    const availableTasks = tasks.filter((task) => task.id !== editId);

    if (!availableTasks.length) {
      container.innerHTML = `<span class="text-muted">Aucune tâche disponible</span>`;
      return;
    }

    container.innerHTML = availableTasks
      .map(
        (task) => `
          <label class="dep-label">
            <input
              type="checkbox"
              value="${task.id}"
              ${selectedDeps.includes(task.id) ? "checked" : ""}
            />
            ${escapeHtml(task.title)}
          </label>
        `
      )
      .join("");
  }

  function renderTaskList() {
    const list = $("taskList");
    const count = $("taskCount");

    if (!list) return;
    if (count) count.textContent = tasks.length;

    if (!tasks.length) {
      list.innerHTML = `
        <div class="empty-state">
          Aucune tâche pour l'instant.<br>
          Créez votre première tâche ci-dessus.
        </div>
      `;
      return;
    }

    list.innerHTML = tasks
      .map((task) => {
        const depText = task.dependencies.length
          ? `${task.dependencies.length} dépendance(s)`
          : "Sans dépendance";

        return `
          <div class="task-card ${selectedTaskId === task.id ? "selected" : ""}" data-task-id="${task.id}">
            <div class="task-info">
              <div class="task-name">${escapeHtml(task.title)}</div>
              <div class="task-meta">${task.duration}h • ${depText}</div>
            </div>

            <div class="task-actions">
              <span class="badge ${priorityClass[task.priority]}">
                ${priorityLabel[task.priority]}
              </span>

              <button class="btn btn-sm" data-action="edit" data-id="${task.id}">
                Modifier
              </button>

              <button class="btn btn-sm btn-danger" data-action="delete" data-id="${task.id}">
                Supprimer
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    list.querySelectorAll(".task-card").forEach((card) => {
      card.addEventListener("click", () => {
        selectTask(card.dataset.taskId);
      });
    });

    list.querySelectorAll("[data-action='edit']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        editTask(button.dataset.id);
      });
    });

    list.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteTask(button.dataset.id);
      });
    });
  }

  function saveTask() {
    const titleInput = $("titreInput");
    const durationInput = $("dureeInput");
    const priorityInput = $("prioriteInput");
    const editInput = $("editId");

    if (!titleInput || !durationInput || !priorityInput || !editInput) return;

    const title = titleInput.value.trim();
    const duration = Number(durationInput.value);
    const priority = Number(priorityInput.value);
    const editId = editInput.value;

    const dependencies = Array.from(
      document.querySelectorAll("#depsCheckboxes input[type='checkbox']:checked")
    ).map((checkbox) => checkbox.value);

    if (!title) {
      showAlert("formAlert", "Veuillez saisir un titre de tâche.");
      return;
    }

    if (!duration || duration <= 0) {
      showAlert("formAlert", "La durée doit être supérieure à 0.");
      return;
    }

    if (editId) {
      tasks = tasks.map((task) =>
        task.id === editId
          ? {
              ...task,
              title,
              duration,
              priority,
              dependencies,
            }
          : task
      );

      showAlert("formAlert", "Tâche mise à jour avec succès.", "success");
    } else {
      tasks.push({
        id: uid(),
        title,
        duration,
        priority,
        dependencies,
      });

      showAlert("formAlert", "Tâche ajoutée au planning.", "success");
    }

    saveLocal();
    resetForm();
    renderAll();
  }

  function resetForm() {
    const titleInput = $("titreInput");
    const durationInput = $("dureeInput");
    const priorityInput = $("prioriteInput");
    const editInput = $("editId");
    const formTitle = $("formTitle");
    const btnLabel = $("btnLabel");
    const resetBtn = $("resetBtn");

    if (titleInput) titleInput.value = "";
    if (durationInput) durationInput.value = 1;
    if (priorityInput) priorityInput.value = 2;
    if (editInput) editInput.value = "";
    if (formTitle) formTitle.textContent = "Nouvelle tâche";
    if (btnLabel) btnLabel.textContent = "Ajouter la tâche";
    if (resetBtn) resetBtn.style.display = "none";

    selectedTaskId = null;

    renderDependencies();
    renderTaskList();
    renderNetwork();
  }

  function selectTask(id) {
    selectedTaskId = selectedTaskId === id ? null : id;
    renderTaskList();
    renderNetwork();
    pulseNode(id);
  }

  function editTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    $("titreInput").value = task.title;
    $("dureeInput").value = task.duration;
    $("prioriteInput").value = task.priority;
    $("editId").value = task.id;
    $("formTitle").textContent = "Modifier la tâche";
    $("btnLabel").textContent = "Enregistrer";
    $("resetBtn").style.display = "inline-flex";

    selectedTaskId = id;

    renderDependencies();
    renderTaskList();
    renderNetwork();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteTask(id) {
    tasks = tasks
      .filter((task) => task.id !== id)
      .map((task) => ({
        ...task,
        dependencies: task.dependencies.filter((depId) => depId !== id),
      }));

    if ($("editId")?.value === id) {
      resetForm();
    }

    selectedTaskId = null;
    lastPlan = [];

    saveLocal();
    renderAll();
    hidePlanPanels();
  }

  function resetAll() {
    tasks = [];
    selectedTaskId = null;
    lastPlan = [];

    saveLocal();
    resetForm();
    renderAll();
    hidePlanPanels();

    showAlert("planAlert", "Planning réinitialisé.", "success");
  }

  function hidePlanPanels() {
    if ($("orderedPanel")) $("orderedPanel").style.display = "none";
    if ($("ganttPanel")) $("ganttPanel").style.display = "none";
    if ($("emptyPlanPanel")) $("emptyPlanPanel").style.display = "block";
  }

  function calculatePlan() {
    if (!tasks.length) {
      showAlert("planAlert", "Ajoutez au moins une tâche avant de calculer.");
      return;
    }

    const result = buildPlan();

    if (result.error) {
      showAlert("planAlert", result.error);
      return;
    }

    lastPlan = result.plan;

    renderOrderedList(lastPlan);
    renderGantt(lastPlan);
    renderNetwork(lastPlan);
    updateWidgetInsight();

    if ($("orderedPanel")) $("orderedPanel").style.display = "block";
    if ($("ganttPanel")) $("ganttPanel").style.display = "block";
    if ($("emptyPlanPanel")) $("emptyPlanPanel").style.display = "none";

    showAlert("planAlert", "Planning intelligent calculé avec succès.", "success");
  }

  function buildPlan() {
    const map = new Map(tasks.map((task) => [task.id, task]));
    const visited = new Set();
    const visiting = new Set();
    const sorted = [];

    function visit(task) {
      if (visiting.has(task.id)) {
        return {
          error: "Dépendance circulaire détectée. Vérifiez l'ordre des tâches.",
        };
      }

      if (visited.has(task.id)) return null;

      visiting.add(task.id);

      for (const depId of task.dependencies) {
        const dep = map.get(depId);
        if (!dep) continue;

        const error = visit(dep);
        if (error) return error;
      }

      visiting.delete(task.id);
      visited.add(task.id);
      sorted.push(task);

      return null;
    }

    const sortedByPriority = [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.duration - b.duration;
    });

    for (const task of sortedByPriority) {
      const error = visit(task);
      if (error) return error;
    }

    let currentTime = 0;

    const plan = sorted.map((task, index) => {
      const start = currentTime;
      const end = start + Number(task.duration);
      currentTime = end;

      return {
        ...task,
        step: index + 1,
        start,
        end,
      };
    });

    return { plan };
  }

  function renderOrderedList(plan) {
    const list = $("orderedList");
    if (!list) return;

    list.innerHTML = plan
      .map(
        (task) => `
          <div class="ordered-item">
            <div class="step-num">${task.step}</div>

            <div class="step-info">
              <div class="step-name">${escapeHtml(task.title)}</div>
              <div class="step-dates">
                Début : ${task.start}h • Fin : ${task.end}h
              </div>
            </div>

            <span class="badge ${priorityClass[task.priority]}">
              ${priorityLabel[task.priority]}
            </span>
          </div>
        `
      )
      .join("");
  }

  function renderGantt(plan) {
    const svg = $("ganttSvg");
    if (!svg) return;

    const width = 900;
    const left = 165;
    const top = 48;
    const rowHeight = 56;
    const height = top + plan.length * rowHeight + 40;
    const total = Math.max(...plan.map((task) => task.end), 1);
    const chartWidth = width - left - 40;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    const defs = createSvg("defs");
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

    svg.appendChild(svgText(20, 27, "Vue Gantt intelligente", "gantt-title"));
    svg.appendChild(svgLine(left, 36, width - 25, 36, "rgba(120,120,120,.35)"));

    for (let i = 0; i <= total; i++) {
      const x = left + (i / total) * chartWidth;

      svg.appendChild(svgLine(x, 42, x, height - 20, "rgba(120,120,120,.16)"));
      svg.appendChild(svgText(x - 7, 27, `${i}h`, "gantt-small"));
    }

    plan.forEach((task, index) => {
      const y = top + index * rowHeight;
      const x = left + (task.start / total) * chartWidth;
      const w = Math.max(24, ((task.end - task.start) / total) * chartWidth);

      svg.appendChild(svgText(20, y + 27, `${task.step}. ${task.title}`, "gantt-label"));

      const bg = createSvg("rect");
      bg.setAttribute("x", left);
      bg.setAttribute("y", y + 7);
      bg.setAttribute("width", chartWidth);
      bg.setAttribute("height", 28);
      bg.setAttribute("rx", 9);
      bg.setAttribute("fill", "rgba(120,120,120,.08)");
      svg.appendChild(bg);

      const bar = createSvg("rect");
      bar.setAttribute("x", x);
      bar.setAttribute("y", y + 7);
      bar.setAttribute("width", w);
      bar.setAttribute("height", 28);
      bar.setAttribute("rx", 9);
      bar.setAttribute("fill", "url(#ganttGradient)");
      bar.setAttribute("filter", "url(#ganttGlow)");
      bar.classList.add("gantt-bar");
      svg.appendChild(bar);

      svg.appendChild(svgText(x + 11, y + 26, `${task.duration}h`, "gantt-bar-text"));
    });
  }

  function createSvg(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function svgText(x, y, text, className) {
    const node = createSvg("text");
    node.setAttribute("x", x);
    node.setAttribute("y", y);
    node.setAttribute("class", className);
    node.textContent = text;
    return node;
  }

  function svgLine(x1, y1, x2, y2, color) {
    const line = createSvg("line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", 1);
    return line;
  }

  function injectHighTechWidget() {
    const rightCol = document.querySelector(".right-col");
    if (!rightCol || $("aiLabPanel")) return;

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.id = "aiLabPanel";

    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">Expérience client augmentée</span>
        <span class="badge badge-prio-3">Démo live</span>
      </div>

      <div class="panel-body">
        <div class="ai-hero">
          <div class="holo-scene" aria-hidden="true">
            <div class="holo-cube" id="holoCube">
              <span class="face front">IA</span>
              <span class="face back">UX</span>
              <span class="face right">3D</span>
              <span class="face left">SVG</span>
              <span class="face top">GO</span>
              <span class="face bottom">+</span>
            </div>
            <div class="holo-shadow"></div>
          </div>

          <div>
            <h3>Widget “Client heureux”</h3>
            <p class="text-muted">
              Simulez l’automatisation du projet et regardez la satisfaction,
              le temps gagné et la clarté du planning évoluer en direct.
            </p>
          </div>
        </div>

        <div class="photo-showcase">
          <article class="smart-photo-card">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
              alt="Équipe projet en collaboration"
            />
            <div class="photo-overlay">
              <strong>Équipe alignée</strong>
              <span>Décisions plus rapides</span>
            </div>
          </article>

          <article class="smart-photo-card">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"
              alt="Planning professionnel sur ordinateur"
            />
            <div class="photo-overlay">
              <strong>Planning lisible</strong>
              <span>Priorités faciles à comprendre</span>
            </div>
          </article>
        </div>

        <div class="happy-widget">
          <div class="widget-top">
            <div>
              <strong>Essayez le boost IA</strong>
              <p class="text-muted">
                Déplacez le curseur pour voir l’impact instantané.
              </p>
            </div>

            <div class="happy-face" id="happyFace">😊</div>
          </div>

          <label for="speedRange">Niveau d’automatisation</label>
          <input type="range" id="speedRange" min="1" max="100" value="62" />

          <div class="sim-grid">
            <div class="sim-card">
              <span id="speedValue">62%</span>
              <small>Automatisation</small>
            </div>

            <div class="sim-card">
              <span id="timeSaved">2.8h</span>
              <small>Temps gagné</small>
            </div>

            <div class="sim-card">
              <span id="happyScore">86%</span>
              <small>Satisfaction</small>
            </div>
          </div>
        </div>

        <div class="network-panel">
          <div class="network-header">
            <strong>Carte SVG des dépendances</strong>
            <span id="networkInsight">Analyse en attente…</span>
          </div>

          <svg
            id="dependencyNetwork"
            viewBox="0 0 700 300"
            role="img"
            aria-label="Carte SVG interactive des dépendances">
          </svg>
        </div>
      </div>
    `;

    rightCol.appendChild(panel);

    const range = $("speedRange");
    if (range) {
      range.addEventListener("input", updateSimulation);
    }
  }

  function updateSimulation() {
    const range = $("speedRange");
    if (!range) return;

    const value = Number(range.value);
    const timeSaved = (0.7 + value * 0.045).toFixed(1);
    const happy = Math.min(99, Math.round(55 + value * 0.48));
    const clarity = Math.min(100, Math.round(40 + value * 0.6));

    if ($("speedValue")) $("speedValue").textContent = `${value}%`;
    if ($("timeSaved")) $("timeSaved").textContent = `${timeSaved}h`;
    if ($("happyScore")) $("happyScore").textContent = `${happy}%`;

    const face = $("happyFace");
    if (face) {
      face.textContent =
        happy > 90 ? "🤩" : happy > 75 ? "😊" : happy > 60 ? "🙂" : "😐";

      face.style.transform = `scale(${1 + value / 350}) rotate(${(value - 50) / 10}deg)`;
    }

    const cube = $("holoCube");
    if (cube) {
      cube.style.animationDuration = `${Math.max(5, 16 - value / 8)}s`;
      cube.style.filter = `drop-shadow(0 0 ${10 + value / 2}px rgba(55,138,221,.45))`;
    }

    const insight = $("networkInsight");
    if (insight && !tasks.length) {
      insight.textContent = `Clarté estimée : ${clarity}%`;
    }

    document.documentElement.style.setProperty("--ai-power", `${value}%`);
  }

  function renderNetwork(plan = lastPlan) {
    const svg = $("dependencyNetwork");
    if (!svg) return;

    const source = plan.length ? plan : tasks;
    svg.innerHTML = "";

    const defs = createSvg("defs");
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
      const empty = svgText(
        350,
        150,
        "Ajoutez des tâches pour générer la carte intelligente.",
        "network-empty"
      );
      empty.setAttribute("text-anchor", "middle");
      svg.appendChild(empty);
      return;
    }

    const positions = source.map((task, index) => {
      const total = source.length;
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const radiusX = total <= 3 ? 180 : 250;
      const radiusY = total <= 3 ? 80 : 105;

      return {
        id: task.id,
        task,
        x: 350 + Math.cos(angle) * radiusX,
        y: 150 + Math.sin(angle) * radiusY,
      };
    });

    const positionMap = new Map(positions.map((item) => [item.id, item]));

    positions.forEach((item) => {
      item.task.dependencies.forEach((depId) => {
        const dep = positionMap.get(depId);
        if (!dep) return;

        const path = createSvg("path");
        const midX = (dep.x + item.x) / 2;
        const midY = (dep.y + item.y) / 2 - 35;

        path.setAttribute("d", `M ${dep.x} ${dep.y} Q ${midX} ${midY} ${item.x} ${item.y}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#378ADD");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-dasharray", "7 7");
        path.setAttribute("marker-end", "url(#arrowHead)");
        path.classList.add("network-link");

        svg.appendChild(path);
      });
    });

    positions.forEach((item) => {
      const group = createSvg("g");
      group.classList.add("network-node");
      group.dataset.id = item.id;
      group.style.cursor = "pointer";

      group.addEventListener("click", () => {
        selectedTaskId = item.id;
        renderTaskList();
        renderNetwork();
        pulseNode(item.id);
      });

      const circle = createSvg("circle");
      circle.setAttribute("cx", item.x);
      circle.setAttribute("cy", item.y);
      circle.setAttribute("r", selectedTaskId === item.id ? 35 : 29);
      circle.setAttribute("fill", "url(#nodeGradient)");
      circle.setAttribute("filter", "url(#nodeGlow)");
      circle.classList.add("network-circle");

      const icon = svgText(
        item.x,
        item.y + 7,
        item.task.priority === 1 ? "★" : item.task.priority === 2 ? "●" : "✓",
        "network-icon"
      );
      icon.setAttribute("text-anchor", "middle");

      const label = svgText(
        item.x,
        item.y + 52,
        item.task.title.length > 18 ? item.task.title.slice(0, 18) + "…" : item.task.title,
        "network-label"
      );
      label.setAttribute("text-anchor", "middle");

      group.appendChild(circle);
      group.appendChild(icon);
      group.appendChild(label);

      svg.appendChild(group);
    });
  }

  function pulseNode(id) {
    const node = document.querySelector(`.network-node[data-id="${id}"]`);
    if (!node) return;

    node.classList.remove("pulse-node");
    void node.offsetWidth;
    node.classList.add("pulse-node");
  }

  function updateWidgetInsight() {
    const insight = $("networkInsight");
    if (!insight) return;

    if (!tasks.length) {
      insight.textContent = "Analyse en attente…";
      return;
    }

    const totalHours = tasks.reduce((sum, task) => sum + Number(task.duration), 0);
    const depCount = tasks.reduce((sum, task) => sum + task.dependencies.length, 0);

    insight.textContent = `${tasks.length} tâche(s), ${totalHours}h, ${depCount} lien(s)`;
  }

  function start3DInteraction() {
    const scene = document.querySelector(".holo-scene");
    const cube = $("holoCube");

    if (!scene || !cube) return;

    scene.addEventListener("mousemove", (event) => {
      const rect = scene.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateY = (x / rect.width - 0.5) * 28;
      const rotateX = (y / rect.height - 0.5) * -28;

      cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(8deg)`;
    });

    scene.addEventListener("mouseleave", () => {
      cube.style.transform = "";
    });
  }

  function injectStyles() {
    if ($("highTechInjectedStyles")) return;

    const style = document.createElement("style");
    style.id = "highTechInjectedStyles";

    style.textContent = `
      :root {
        --ai-power: 62%;
      }

      .ai-hero {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 1.25rem;
        align-items: center;
        padding: 1rem;
        border-radius: var(--radius);
        border: .5px solid var(--border);
        background:
          radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 35%),
          linear-gradient(135deg, var(--surface), var(--surface2));
        overflow: hidden;
      }

      .ai-hero h3 {
        margin: 0 0 .35rem;
        font-size: 20px;
      }

      .holo-scene {
        position: relative;
        width: 130px;
        height: 130px;
        display: grid;
        place-items: center;
        perspective: 850px;
        cursor: grab;
      }

      .holo-cube {
        position: relative;
        width: 74px;
        height: 74px;
        transform-style: preserve-3d;
        animation: cubeSpin 11s linear infinite;
        transition: transform .2s ease, filter .2s ease;
      }

      .face {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
        background:
          linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.04)),
          color-mix(in srgb, var(--accent) 22%, transparent);
        color: var(--accent-text);
        font-weight: 800;
        font-size: 15px;
        letter-spacing: .08em;
        backdrop-filter: blur(8px);
        box-shadow: inset 0 0 20px rgba(255,255,255,.15);
      }

      .front  { transform: translateZ(37px); }
      .back   { transform: rotateY(180deg) translateZ(37px); }
      .right  { transform: rotateY(90deg) translateZ(37px); }
      .left   { transform: rotateY(-90deg) translateZ(37px); }
      .top    { transform: rotateX(90deg) translateZ(37px); }
      .bottom { transform: rotateX(-90deg) translateZ(37px); }

      .holo-shadow {
        position: absolute;
        bottom: 14px;
        width: 92px;
        height: 18px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 28%, transparent);
        filter: blur(12px);
        animation: shadowPulse 2.5s ease-in-out infinite;
      }

      @keyframes cubeSpin {
        from {
          transform: rotateX(-18deg) rotateY(0deg) rotateZ(8deg);
        }
        to {
          transform: rotateX(-18deg) rotateY(360deg) rotateZ(8deg);
        }
      }

      @keyframes shadowPulse {
        50% {
          transform: scale(1.18);
          opacity: .55;
        }
      }

      .photo-showcase {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: .85rem;
        margin-top: 1rem;
      }

      .smart-photo-card {
        position: relative;
        min-height: 145px;
        overflow: hidden;
        border-radius: var(--radius);
        border: .5px solid var(--border);
        background: var(--surface2);
        isolation: isolate;
      }

      .smart-photo-card img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: -2;
        transition: transform .5s ease;
      }

      .smart-photo-card::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(to top, rgba(0,0,0,.70), rgba(0,0,0,.08)),
          radial-gradient(circle at 80% 20%, rgba(80,180,255,.35), transparent 35%);
        z-index: -1;
      }

      .smart-photo-card:hover img {
        transform: scale(1.08);
      }

      .photo-overlay {
        position: absolute;
        left: .9rem;
        right: .9rem;
        bottom: .8rem;
        color: white;
        display: grid;
        gap: .15rem;
      }

      .photo-overlay strong {
        font-size: 14px;
      }

      .photo-overlay span {
        font-size: 12px;
        opacity: .82;
      }

      .happy-widget {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: var(--radius);
        border: .5px solid var(--border);
        background:
          radial-gradient(circle at var(--ai-power) 0%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 32%),
          linear-gradient(135deg, var(--surface), var(--surface2));
      }

      .widget-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: .75rem;
      }

      .widget-top p {
        margin: .15rem 0 0;
      }

      .happy-face {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--accent-light);
        font-size: 27px;
        transition: transform .2s ease;
      }

      #speedRange {
        width: 100%;
        accent-color: var(--accent);
      }

      .sim-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: .7rem;
        margin-top: .85rem;
      }

      .sim-card {
        padding: .85rem;
        border-radius: var(--radius-sm);
        background: var(--bg);
        border: .5px solid var(--border);
      }

      .sim-card span {
        display: block;
        color: var(--accent);
        font-size: 21px;
        font-weight: 800;
        line-height: 1.1;
      }

      .sim-card small {
        color: var(--text3);
        font-size: 11px;
      }

      .network-panel {
        margin-top: 1rem;
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

      @media (max-width: 700px) {
        .ai-hero,
        .photo-showcase,
        .sim-grid {
          grid-template-columns: 1fr;
        }

        .holo-scene {
          margin: auto;
        }
      }
    `;

    document.head.appendChild(style);
  }

  window.saveTask = saveTask;
  window.resetForm = resetForm;
  window.calculatePlan = calculatePlan;
  window.resetAll = resetAll;
})();