/* MyNBA simulation settings and day-by-day batch runner. */
(function () {
  "use strict";
  const KEY = "nba-sim-lab-simulation-settings";
  const DEFAULTS = { speed: "normal", batchDays: "all", pauseMs: 700 };
  const SPEEDS = { slow: 2, normal: 1, fast: 0.25, instant: 0 };
  const $ = id => document.getElementById(id);
  let settings = normalize(window.NBASimSimulationSettings || readLocal());
  let running = false;
  let runningPromise = null;
  let originalSimulateThroughRound = null;
  let originalBuildSeason = null;

  function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    const speed = ["slow", "normal", "fast", "instant"].includes(source.speed) ? source.speed : DEFAULTS.speed;
    const allowedDays = ["1", "5", "10", "20", "all"];
    const batchDays = allowedDays.includes(String(source.batchDays)) ? String(source.batchDays) : DEFAULTS.batchDays;
    const pauseMs = Number.isFinite(Number(source.pauseMs)) ? Math.max(0, Math.min(10000, Number(source.pauseMs))) : DEFAULTS.pauseMs;
    return { speed, batchDays, pauseMs };
  }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return null; }
  }
  function applySpeedStyles() {
    if (!document.body) return;
    document.body.dataset.simulationSpeed = settings.speed;
    let style = $("mynbaSimulationSpeedStyles");
    if (!style) {
      style = document.createElement("style");
      style.id = "mynbaSimulationSpeedStyles";
      document.head.appendChild(style);
    }
    style.textContent = `
      body[data-simulation-speed="slow"] .fullscreen-overlay,
      body[data-simulation-speed="slow"] .schedule-game,
      body[data-simulation-speed="slow"] .playoff-series { animation-duration: .7s !important; transition-duration: .45s !important; }
      body[data-simulation-speed="normal"] .fullscreen-overlay,
      body[data-simulation-speed="normal"] .schedule-game,
      body[data-simulation-speed="normal"] .playoff-series { animation-duration: .35s !important; transition-duration: .25s !important; }
      body[data-simulation-speed="fast"] .fullscreen-overlay,
      body[data-simulation-speed="fast"] .schedule-game,
      body[data-simulation-speed="fast"] .playoff-series { animation-duration: .12s !important; transition-duration: .1s !important; }
      body[data-simulation-speed="instant"] .fullscreen-overlay,
      body[data-simulation-speed="instant"] .schedule-game,
      body[data-simulation-speed="instant"] .playoff-series { animation-duration: .001ms !important; transition-duration: .001ms !important; }
    `;
  }
  function persist() {
    settings = normalize(settings);
    window.NBASimSimulationSettings = { ...settings };
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
    applySpeedStyles();
    renderSettings();
  }
  function effectivePause() { return Math.round(settings.pauseMs * SPEEDS[settings.speed]); }
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function addSettingsCard() {
    const grid = $("mynbaCategoryGrid");
    if (!grid || $("mynbaSimulationSettingsCard")) return;
    const card = document.createElement("button");
    card.type = "button";
    card.id = "mynbaSimulationSettingsCard";
    card.className = "mynba-category-card";
    card.innerHTML = '<span class="mynba-category-icon">⚙️</span><span class="mynba-category-title">Settings</span><span class="mynba-category-desc">Vitesse, simulation et sauvegarde</span>';
    card.addEventListener("click", openSettings);
    grid.appendChild(card);
  }
  function ensurePanel() {
    if ($("mynbaSimulationSettingsPanel")) return;
    const panel = document.createElement("section");
    panel.id = "mynbaSimulationSettingsPanel";
    panel.className = "mynba-screen";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="mynba-screen-header"><div><div class="mynba-screen-kicker">MYNBA · CONFIGURATION</div><h1>Settings</h1><p>Configure la vitesse et l’avancement de la saison régulière.</p></div><button class="btn" type="button" id="mynbaSettingsClose">Fermer</button></div>
      <div class="mynba-screen-body">
        <div class="mynba-feature-card">
          <h2>Vitesse de simulation</h2>
          <p>La vitesse modifie la cadence des animations et la pause effective entre les journées, jamais les probabilités ou les résultats du moteur.</p>
          <label class="field">Vitesse
            <select id="mynbaSimSpeed">
              <option value="slow">Lente</option><option value="normal">Normale</option><option value="fast">Rapide</option><option value="instant">Instantanée</option>
            </select>
          </label>
          <label class="field">Journées par opération
            <select id="mynbaSimBatch">
              <option value="1">1 journée</option><option value="5">5 journées</option><option value="10">10 journées</option><option value="20">20 journées</option><option value="all">Jusqu’à la fin de la saison</option>
            </select>
          </label>
          <label class="field">Pause entre les journées (ms)
            <input id="mynbaSimPause" type="number" min="0" max="10000" step="100" value="700">
          </label>
          <p id="mynbaSimEffectivePause" role="status"></p>
          <div class="controls">
            <button class="btn primary" type="button" id="mynbaSimSaveSettings">Enregistrer les réglages</button>
            <button class="btn gold" type="button" id="mynbaSimRunBatch">Simuler selon ces réglages</button>
          </div>
          <p id="mynbaSimStatus" role="status" aria-live="polite"></p>
        </div>
      </div>`;
    document.body.appendChild(panel);
    $("mynbaSettingsClose").addEventListener("click", closeSettings);
    $("mynbaSimSpeed").addEventListener("change", () => { settings.speed = $("mynbaSimSpeed").value; updateEffectivePause(); });
    $("mynbaSimBatch").addEventListener("change", () => { settings.batchDays = $("mynbaSimBatch").value; });
    $("mynbaSimPause").addEventListener("change", () => { settings.pauseMs = Number($("mynbaSimPause").value); updateEffectivePause(); });
    $("mynbaSimSaveSettings").addEventListener("click", () => {
      settings = normalize({ speed: $("mynbaSimSpeed").value, batchDays: $("mynbaSimBatch").value, pauseMs: $("mynbaSimPause").value });
      persist();
      const status = $("mynbaSimStatus");
      if (status) status.textContent = "Réglages enregistrés et conservés dans les prochaines sauvegardes JSON.";
    });
    $("mynbaSimRunBatch").addEventListener("click", async () => {
      settings = normalize({ speed: $("mynbaSimSpeed").value, batchDays: $("mynbaSimBatch").value, pauseMs: $("mynbaSimPause").value });
      persist();
      await runSeasonBatch();
    });
    renderSettings();
  }
  function updateEffectivePause() {
    const node = $("mynbaSimEffectivePause");
    if (node) node.textContent = "Pause effective : " + effectivePause() + " ms entre les journées.";
  }
  function renderSettings() {
    if (!$("mynbaSimSpeed")) return;
    $("mynbaSimSpeed").value = settings.speed;
    $("mynbaSimBatch").value = settings.batchDays;
    $("mynbaSimPause").value = String(settings.pauseMs);
    updateEffectivePause();
  }
  function openSettings() {
    ensurePanel();
    const panel = $("mynbaSimulationSettingsPanel");
    if (!panel) return;
    document.querySelectorAll(".mynba-screen").forEach(screen => { if (screen !== panel) screen.hidden = true; });
    const menu = $("mynbaMenu");
    if (menu) menu.hidden = true;
    panel.hidden = false;
    renderSettings();
    panel.scrollIntoView({ behavior: settings.speed === "instant" ? "auto" : "smooth", block: "start" });
  }
  function closeSettings() {
    const panel = $("mynbaSimulationSettingsPanel");
    if (panel) panel.hidden = true;
    const menu = $("mynbaMenu");
    if (menu) menu.hidden = false;
  }
  async function runRounds(targetRound, respectBatchLimit) {
    if (running) return runningPromise;
    if (typeof phase !== "undefined" && phase === "playoffs") {
      const status = $("mynbaSimStatus") || $("seasonStatus");
      if (status) status.textContent = "La simulation de saison régulière est indisponible pendant les playoffs.";
      return;
    }
    if (!seasonCalendar || !Array.isArray(seasonCalendar.games) || seasonCalendar.season !== seasonYear) {
      if (typeof initializeSeasonCalendar !== "function" || !initializeSeasonCalendar()) return;
    }
    const rounds = [...new Set(seasonCalendar.games.filter(g => g.status !== "completed" && Number(g.round) <= Number(targetRound)).map(g => Number(g.round)))].sort((a,b) => a-b);
    const cap = respectBatchLimit && settings.batchDays !== "all" ? Number(settings.batchDays) : Infinity;
    const chosenRounds = rounds.slice(0, cap);
    if (!chosenRounds.length) {
      if (typeof updateTeamSeasonAverages === "function") updateTeamSeasonAverages();
      if (typeof renderAll === "function") renderAll();
      return;
    }
    running = true;
    const statusNode = () => $("mynbaSimStatus") || $("seasonStatus");
    runningPromise = (async () => {
      try {
        for (let i=0; i<chosenRounds.length; i++) {
          const round = chosenRounds[i];
          const games = seasonCalendar.games.filter(g => Number(g.round) === round && g.status !== "completed");
          games.forEach(game => { if (typeof simulateScheduledGame === "function") simulateScheduledGame(game); });
          if (typeof updateTeamSeasonAverages === "function") updateTeamSeasonAverages();
          if (typeof renderAll === "function") renderAll();
          const done = seasonCalendar.games.filter(g => g.status === "completed").length;
          const status = statusNode();
          if (status) status.textContent = "Simulation en cours : journée " + round + " terminée (" + done + "/" + seasonCalendar.games.length + " matchs).";
          if (i < chosenRounds.length - 1) await wait(effectivePause());
        }
        const remaining = seasonCalendar.games.filter(g => g.status !== "completed").length;
        const status = statusNode();
        if (status) status.textContent = remaining ? "Lot terminé : " + chosenRounds.length + " journée(s) simulée(s), " + remaining + " match(s) restant(s)." : "Saison régulière terminée : tous les matchs sont simulés.";
        if (typeof renderAll === "function") renderAll();
      } finally {
        running = false;
        runningPromise = null;
      }
    })();
    return runningPromise;
  }
  async function runSeasonBatch() {
    if (!seasonCalendar || !Array.isArray(seasonCalendar.games) || seasonCalendar.season !== seasonYear) {
      if (typeof initializeSeasonCalendar !== "function" || !initializeSeasonCalendar()) return;
    }
    const maxRound = Math.max(0, ...seasonCalendar.games.map(g => Number(g.round) || 0));
    return runRounds(maxRound, true);
  }
  function installBatchRunner() {
    if (typeof window.simulateThroughRound === "function" && !originalSimulateThroughRound) originalSimulateThroughRound = window.simulateThroughRound;
    window.simulateThroughRound = function (targetRound) { return runRounds(targetRound, false); };
    if (typeof window.buildSeason === "function" && !originalBuildSeason) originalBuildSeason = window.buildSeason;
    window.buildSeason = function () { return runSeasonBatch(); };
    // The legacy one-year helpers were synchronous. Await the new batch runner so
    // they cannot start playoffs before the regular season finishes or bypass the draft.
    window.runAll = async function () {
      if (phase !== "playoffs") {
        await runSeasonBatch();
        if (phase === "regular" && typeof initializePlayoffs === "function") initializePlayoffs();
      }
      if (phase === "playoffs" && playoffs && !playoffs.champion) {
        if (typeof simulatePlayoffsToConferenceFinals === "function") simulatePlayoffsToConferenceFinals();
        if (playoffs.final && !playoffs.champion && typeof completePlayoffSeries === "function") completePlayoffSeries(playoffs.final);
      }
      // Keep the Finals MVP -> interactive draft flow under the user's control.
      if (phase === "playoffs" && playoffs && playoffs.champion) return;
    };
    window.runYears = async function (count) {
      const years = Math.max(1, Math.min(20, Number(count) || 1));
      for (let i = 0; i < years; i++) {
        await window.runAll();
        if (phase === "playoffs" && playoffs && playoffs.champion) {
          const status = $("seasonStatus");
          if (status) status.textContent = "Saison terminée. Termine l’écran Finals MVP et le draft avant de lancer l’année suivante.";
          break;
        }
      }
    };
    window.simulateNextSeasonGame = async function () {
      if (phase === "playoffs") return;
      if (!seasonCalendar || seasonCalendar.season !== seasonYear) {
        if (typeof initializeSeasonCalendar !== "function" || !initializeSeasonCalendar()) return;
      }
      const teamCode = ($("scheduleTeamFilter") && $("scheduleTeamFilter").value) || (seasonCalendar.teams[0] && seasonCalendar.teams[0].scheduleCode);
      const nextGame = seasonCalendar.games.filter(game => game.status !== "completed" && (game.home.code === teamCode || game.away.code === teamCode)).sort((a,b) => a.round-b.round)[0];
      if (!nextGame) {
        const status = $("seasonStatus");
        if (status) status.textContent = "Tous les matchs de cette équipe sont déjà simulés.";
        return;
      }
      await window.simulateThroughRound(nextGame.round);
      const log = $("gameLog");
      if (log) log.textContent = "Journée simulée : " + nextGame.home.name + " " + nextGame.homeScore + " – " + nextGame.awayScore + " " + nextGame.away.name + ".";
      if (nextGame.status === "completed" && typeof window.NBAMyNBAShowRegularBox === "function") window.NBAMyNBAShowRegularBox(nextGame);
    };
    document.addEventListener("click", async function (event) {
      const tile = event.target.closest("#seasonCalendarView button[data-game-id]");
      if (!tile || tile.disabled || !seasonCalendar) return;
      const game = seasonCalendar.games.find(item => String(item.id) === String(tile.dataset.gameId));
      if (!game || game.status === "completed") return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      await window.simulateThroughRound(game.round);
      if (game.status === "completed" && typeof window.NBAMyNBAShowRegularBox === "function") window.NBAMyNBAShowRegularBox(game);
    }, true);
    document.addEventListener("click", function (event) {
      const button = event.target.closest("#simulateSeason");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      runSeasonBatch();
    }, true);
  }
  function install() {
    settings = normalize(window.NBASimSimulationSettings || readLocal() || DEFAULTS);
    window.NBASimSimulationSettings = { ...settings };
    applySpeedStyles();
    addSettingsCard();
    ensurePanel();
    installBatchRunner();
    document.addEventListener("mynba:save-load-result", function (event) {
      if (event.detail && event.detail.ok) {
        settings = normalize(window.NBASimSimulationSettings || settings);
        persist();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
