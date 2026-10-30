/* MyGM onboarding and interactive post-playoffs draft. Depends on the existing classic-script game model. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const overlay = $("myGMStart");
  const card = $("myGMCard");
  let setup = { name:"", code:"", conference:"East", city:"" };
  let picks = [];
  let wheelRotation = 0;
  let prospects = [];
  let draftPickTeam = null;

  function escGM(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function hideOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("gm-startup");
    document.body.style.overflow = "";
  }
  function setStatus(message) { const node = $("gmStatus"); if (node) node.textContent = message; }
  function setLoadingStatus(message) { const node = $("gmStatus"); if (node) node.innerHTML = '<span class="gm-spinner" aria-hidden="true"></span> ' + escGM(message); }
  function showWelcome() {
    overlay.hidden = false;
    document.body.classList.add("gm-startup");
    document.body.style.overflow = "hidden";
    card.innerHTML = `
      <div class="gm-brand">NBA SIM LAB · MODE GESTIONNAIRE</div>
      <div class="gm-title">Bienvenue<br>dans MyGM.</div>
      <p class="gm-subtitle">Construis ta franchise, choisis tes cinq premiers joueurs à la roue, gère la saison et sélectionne un prospect à la Draft après les playoffs.</p>
      <div class="gm-actions">
        <button class="gm-primary" id="gmLoadSave">Charger une sauvegarde JSON</button>
        <button class="gm-primary" id="gmCreateWheel">Créer une franchise avec la roue</button>
        <button class="gm-secondary" id="gmStartDemo">Commencer une démo</button>
      </div>
      <p class="gm-status" id="gmStatus">Ta carrière commence ici.</p>`;
    $("gmCreateWheel").onclick = () => {
      if (!Array.isArray(players) || players.length < 5) {
        setStatus("Charge une sauvegarde ou commence une démo avant d’utiliser la roue.");
        return;
      }
      beginTeamSetup();
    };
    $("gmLoadSave").onclick = () => {
      const input = $("importFile");
      if (!input) { setStatus("Le chargement JSON est indisponible."); return; }
      setStatus("Choisis un fichier de sauvegarde JSON.");
      input.value = "";
      input.click();
    };
    $("gmStartDemo").onclick = async () => {
      setLoadingStatus("Chargement des joueurs et préparation de ta franchise…");
      const button = $("gmStartDemo"); button.disabled = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      const demo = $("demo");
      if (demo) demo.click();
      await new Promise(resolve => setTimeout(resolve, 250));
      if (!Array.isArray(players) || !players.length) {
        button.disabled = false;
        setStatus("Le chargement de la démo a échoué. Réessaie.");
        return;
      }
      beginTeamSetup();
    };
  }
  function beginTeamSetup() {
    setup = { name:"", code:"", conference:"East", city:"" };
    picks = [];
    card.innerHTML = `
      <div class="gm-brand">ÉTAPE 1 SUR 2 · CRÉATION DE FRANCHISE</div>
      <h1 class="gm-title" style="font-size:clamp(32px,5vw,52px)">Bâtis ton équipe.</h1>
      <p class="gm-subtitle">Définis l'identité de ta franchise avant de faire tourner la roue pour recruter tes cinq premiers joueurs.</p>
      <div class="gm-fields">
        <label class="gm-field">Nom de l'équipe<input id="gmTeamName" maxlength="50" placeholder="Montréal Meteors" required></label>
        <label class="gm-field">Code de l'équipe (3 à 5 caractères)<input id="gmTeamCode" maxlength="5" placeholder="MTL" required></label>
        <label class="gm-field">Ville<input id="gmTeamCity" maxlength="50" placeholder="Montréal" required></label>
        <label class="gm-field">Conférence<select id="gmTeamConference"><option value="East">Est</option><option value="West">Ouest</option></select></label>
        <label class="gm-field">Image de la franchise (.png / .jpg)<input id="gmTeamImage" type="file" accept=".png,.jpg,image/png,image/jpeg"></label>
        <img id="gmTeamImagePreview" alt="Aperçu du logo de la franchise" hidden style="max-width:110px;max-height:110px;object-fit:contain;border-radius:12px">
      </div>
      <p class="gm-status" id="gmSetupStatus">Choisis le nom, le code, la ville et la conférence.</p>
      <div class="gm-actions"><button class="gm-primary" id="gmConfirmTeam">Continuer vers la roue →</button></div>`;
    const teamImageInput = $("gmTeamImage");
    if (teamImageInput) teamImageInput.onchange = async () => {
      if (typeof window.NBASimReadImageFile !== "function") return;
      try {
        setup.image = await window.NBASimReadImageFile(teamImageInput.files && teamImageInput.files[0]);
        const preview = $("gmTeamImagePreview");
        if (preview) { preview.src = setup.image; preview.hidden = !setup.image; }
      } catch (error) {
        setStatus(error.message || "Image invalide. Choisis un fichier PNG ou JPG.");
        teamImageInput.value = "";
      }
    };
    $("gmConfirmTeam").onclick = () => {
      const name = $("gmTeamName").value.trim();
      const city = $("gmTeamCity").value.trim();
      const code = $("gmTeamCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
      const conference = $("gmTeamConference").value;
      const error = $("gmSetupStatus");
      if (!name || !city || code.length < 3 || code.length > 5) {
        error.textContent = "Entre un nom, une ville et un code de 3 à 5 caractères.";
        return;
      }
      if (typeof nbaTeams !== "undefined" && nbaTeams.some(t => String(t[0]).toUpperCase() === code) ||
          typeof customTeams !== "undefined" && customTeams.some(t => String(t.code).toUpperCase() === code)) {
        error.textContent = "Ce code est déjà utilisé. Choisis un autre code.";
        return;
      }
      setup = { name, city, code, conference, image: setup.image || window.NBASimPendingTeamImage || "" };
      beginWheel();
    };
  }
  function beginWheel() {
    picks = [];
    const pool = Array.isArray(players) ? players.filter(p => p && p.id != null) : [];
    if (pool.length < 5) {
      card.innerHTML = '<h1>Il manque des joueurs.</h1><p>Charge au moins cinq joueurs dans la base pour utiliser la roue.</p><button class="gm-primary" id="gmBack">Retour</button>';
      $("gmBack").onclick = beginTeamSetup;
      return;
    }
    card.innerHTML = `
      <div class="gm-brand">ÉTAPE 2 SUR 2 · RECRUTEMENT</div>
      <h1 class="gm-title" style="font-size:clamp(32px,5vw,52px)">Fais tourner la roue.</h1>
      <p class="gm-subtitle">Chaque tour sélectionne un joueur différent. Les cinq joueurs seront ajoutés à ta nouvelle franchise sans retirer les joueurs originaux de leurs équipes NBA.</p>
      <div class="gm-progress"><span id="gmProgress"></span></div>
      <div class="gm-wheel-stage"><span class="gm-wheel-pointer" aria-hidden="true">▼</span><div class="gm-wheel" id="gmWheel" aria-label="Roue de recrutement">MY<br>GM</div></div>
      <div class="gm-roster" id="gmRoster"></div>
      <p class="gm-status" id="gmWheelStatus">Tour 1 sur 5 : prêt à choisir ton premier joueur.</p>
      <div class="gm-actions"><button class="gm-primary" id="gmSpin">🎡 Faire tourner la roue</button></div>`;
    renderRosterSlots();
    $("gmSpin").onclick = spinForPlayer;
  }
  function renderRosterSlots() {
    const box = $("gmRoster");
    if (!box) return;
    box.innerHTML = Array.from({length:5},(_,i) => {
      const p = picks[i];
      return `<div class="gm-player ${p?'active':''}"><b>${p?escGM(p.name):"Joueur "+(i+1)}</b>${p?escGM(p.pos)+" · GÉN "+(typeof overallRating==="function"?overallRating(p):"—"):"En attente de la roue"}</div>`;
    }).join("");
    const progress = $("gmProgress"); if (progress) progress.style.width = (picks.length*20)+"%";
  }
  function animateWheel(wheel, from, to, duration = 2400) {
    // Animate frame by frame instead of relying on CSS transitions: the app's
    // global reduced-motion rule can otherwise reduce transitions to 0.01 ms.
    return new Promise(resolve => {
      const startedAt = performance.now();
      const tick = now => {
        const raw = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - raw, 4);
        wheel.style.transform = "rotate(" + (from + (to - from) * eased) + "deg)";
        if (raw < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
  function showCreateFranchiseStep() {
    // Close the full-screen GM setup. Keep only a small fixed action panel over the game.
    hideOverlay();
    const previous = $("gmCreateAction");
    if (previous) previous.remove();
    const action = document.createElement("section");
    action.id = "gmCreateAction";
    action.className = "gm-create-action";
    action.setAttribute("role", "status");
    action.innerHTML = `
      <div class="gm-brand">RECRUTEMENT TERMINÉ · CINQ DE DÉPART PRÊT</div>
      <p class="gm-create-players">${picks.map(p => escGM(p.name)).join(" · ")}</p>
      <p class="gm-status" id="gmCreateStatus">Prêt à créer ${escGM(setup.city)} ${escGM(setup.name)}.</p>
      <button class="gm-primary" id="gmCreateFranchise">Continuer →</button>`;
    document.body.appendChild(action);
    $("gmCreateFranchise").onclick = finishTeamSetup;
  }
  async function spinForPlayer() {
    const button = $("gmSpin");
    if (!button || button.disabled || picks.length >= 5) return;
    const chosenIds = new Set(picks.map(p => String(p.originalId)));
    const pool = players.filter(p => p && p.id != null && !p.originalId && !chosenIds.has(String(p.id)));
    if (!pool.length) { $("gmWheelStatus").textContent = "Il n'y a plus assez de joueurs disponibles."; return; }
    button.disabled = true;
    const total = pool.reduce((sum,p) => sum + Math.max(1, typeof overallRating==="function" ? overallRating(p) : 60),0);
    let n = Math.random()*total, original = pool[pool.length-1];
    for (const p of pool) { n -= Math.max(1, typeof overallRating==="function" ? overallRating(p) : 60); if (n <= 0) { original=p; break; } }
    const wheel = $("gmWheel");
    if (!wheel) { button.disabled = false; return; }
    const startRotation = wheelRotation;
    wheelRotation += 6*360 + 180 + Math.random()*360;
    wheel.textContent = "🎡";
    $("gmWheelStatus").textContent = "La roue tourne…";
    await animateWheel(wheel, startRotation, wheelRotation, 2400);
    const clone = JSON.parse(JSON.stringify(original));
    clone.originalId = original.id;
    clone.id = typeof nextPlayerId !== "undefined" ? nextPlayerId++ : Date.now()+picks.length;
    clone.previousTeam = original.team;
    clone.team = "FA";
    clone.history = Array.isArray(clone.history) ? clone.history : [];
    clone.trophies = Array.isArray(clone.trophies) ? clone.trophies : [];
    clone.careerGames = Array.isArray(clone.careerGames) ? clone.careerGames : [];
    players.push(clone);
    picks.push(clone);
    wheel.textContent = original.name;
    $("gmWheelStatus").textContent = "Sélection " + picks.length + "/5 : " + original.name + " (" + original.pos + ").";
    renderRosterSlots();
    if (picks.length < 5) {
      button.disabled = false;
      button.textContent = "🎡 Faire tourner la roue";
    } else {
      showCreateFranchiseStep();
    }
  }
  function finishTeamSetup() {
    if (picks.length !== 5) return;
    const button = $("gmCreateFranchise") || $("gmSpin");
    const status = $("gmCreateStatus") || $("gmWheelStatus");
    if (button) { button.disabled = true; button.textContent = "Création de la franchise…"; }
    if (status) status.textContent = "Création de " + setup.name + " et intégration des cinq joueurs…";
    $("customTeamName").value = setup.name;
    $("customTeamCode").value = setup.code;
    $("customTeamCity").value = setup.city;
    $("customTeamConference").value = setup.conference;
    starters = picks.slice(0,5);
    if (typeof renderSlots === "function") renderSlots();
    if (typeof renderPicks === "function") renderPicks();
    const create = $("createCustomTeam");
    if (create) create.click();
    setTimeout(() => {
      const exists = typeof customTeams !== "undefined" && customTeams.some(t => t.code === setup.code);
      if (!exists) {
        if (status) status.textContent = "Impossible de créer l'équipe. Vérifie le code et réessaie.";
        if (button) { button.disabled = false; button.textContent = "Réessayer"; button.onclick = finishTeamSetup; }
        return;
      }
      const team = customTeams.find(t => t.code === setup.code);
      if (team) { team.city = setup.city; if (setup.image && typeof window.NBASimSetTeamImage === "function") window.NBASimSetTeamImage(setup.code, setup.image); }
      if (typeof render === "function") render();
      if (typeof renderAll === "function") renderAll();
      hideOverlay();
      const createAction = $("gmCreateAction"); if (createAction) createAction.remove();
      const statusNode = $("customTeamStatus");
      if (statusNode) statusNode.textContent = "Bienvenue, GM de " + setup.city + " " + setup.name + " (" + setup.code + "). Ton cinq de départ est prêt.";
      window.dispatchEvent(new CustomEvent("mygm:ready",{detail:{teamCode:setup.code,teamName:setup.name}}));
    }, 300);
  }
  function handleSaveLoadResult(event) {
    const result = event.detail || {};
    if (!result.ok) {
      setStatus("Échec du chargement : " + (result.error || "fichier JSON invalide."));
      return;
    }
    if (!Array.isArray(players) || !players.length) {
      setStatus("La sauvegarde ne contient aucun joueur.");
      return;
    }
    // load() already rendered the imported state. Do not call renderAll a second time.
    if (Array.isArray(customTeams) && customTeams.length) {
      hideOverlay();
      if (window.NBASimDraftState && typeof phase !== "undefined" && phase === "playoffs") showInteractiveDraft();
    } else {
      beginTeamSetup();
    }
  }
  function getManagedTeam() {
    if (!Array.isArray(customTeams) || !customTeams.length) return null;
    return customTeams.find(t => t.isUserTeam) || customTeams[0];
  }
  function connectNavigationSaveLoad() {
    const input = $("importFile");
    const status = $("mynbaLoadStatus");
    if (!input || !status || typeof input.onchange !== "function") return;
    const loadSave = input.onchange;
    input.onchange = async function (event) {
      await loadSave.call(this, event);
      if (status.textContent.indexOf("Fichier chargé :") === 0) {
        document.dispatchEvent(new CustomEvent("mynba:save-load-result", {
          detail: { ok: true, players: players.length, hasCustomTeams: Array.isArray(customTeams) && customTeams.length > 0 }
        }));
      } else {
        const error = $("mynbaLoadError");
        document.dispatchEvent(new CustomEvent("mynba:save-load-result", {
          detail: { ok: false, error: error ? error.textContent : "Le chargement de la sauvegarde a échoué." }
        }));
      }
    };
  }
  function showInteractiveDraft() {
    const team = getManagedTeam();
    if (!team || typeof makeRookie !== "function") {
      if (typeof runOffseason === "function") runOffseason();
      return;
    }
    const standings = Array.isArray(seasonResults) ? seasonResults.slice().sort((a,b) => (a.winPct||0)-(b.winPct||0)) : [];
    const championCode = typeof playoffs !== "undefined" && playoffs && playoffs.champion ? playoffs.champion.code : null;
    if (championCode) {
      const championIndex = standings.findIndex(t => t.code === championCode);
      if (championIndex >= 0) standings.push(standings.splice(championIndex, 1)[0]);
    }
    const orderedTeams = standings.slice();
    let position = orderedTeams.findIndex(t => t.code === team.code);
    if (position < 0) position = orderedTeams.length;
    const pickNo = position + 1;
    const draftOrderMarkup = orderedTeams.map((t, i) => '<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 10px;border-bottom:1px solid #263958;'+(t.code === team.code ? 'background:#1c3553;color:#fff;font-weight:800;' : 'color:#aebed8;')+'"><span>#'+(i+1)+' · '+escGM(t.name||t.code)+'</span><span>'+escGM(t.code)+'</span></div>').join("");
    draftPickTeam = team;
    const savedDraftState = window.NBASimDraftState;
    const usedProspectNames = new Set(players.map(p => p.name));
    const restoredProspects = savedDraftState && savedDraftState.teamCode === team.code && Array.isArray(savedDraftState.prospects)
      ? savedDraftState.prospects.filter(p => p && p.id != null && typeof p.name === "string" && typeof p.pos === "string" && ["pts","reb","ast","age"].every(key => Number.isFinite(Number(p[key])))).map(p => ({ ...p, pts: Number(p.pts), reb: Number(p.reb), ast: Number(p.ast), age: Number(p.age) }))
      : [];
    prospects = restoredProspects.length
      ? restoredProspects
      : Array.from({length:6},(_,i) => makeRookie(Math.max(.15,.98-(pickNo-1)*.035-i*.055),team.code,resultsLabel||"MyGM",pickNo+i,usedProspectNames));
    window.NBASimDraftState = { teamCode: team.code, pickNo, prospects };
    overlay.hidden = false;
    document.body.classList.add("gm-startup");
    document.body.style.overflow = "hidden";
    card.innerHTML = `
      <div class="gm-brand">APRÈS LES PLAYOFFS · NBA DRAFT</div>
      <h1 class="gm-title" style="font-size:clamp(32px,5vw,52px)">À toi de choisir.</h1>
      <p class="gm-subtitle">${escGM(team.city||"")} ${escGM(team.name)} sélectionne au choix #${pickNo}. Les équipes sont classées du moins bon bilan au meilleur; le champion sélectionne en dernier. L’IA gérera les autres choix.</p>
      <details open style="text-align:left;margin:16px 0;background:#0c1628;border:1px solid #263958;border-radius:12px;padding:10px"><summary style="cursor:pointer;font-weight:800">Ordre de sélection · ${orderedTeams.length} équipes</summary><div style="max-height:240px;overflow:auto;margin-top:8px">${draftOrderMarkup}</div></details>
      <h2 style="text-align:left">Prospects disponibles pour ton choix #${pickNo}</h2>
      <div class="gm-prospects" id="gmProspects"></div>
      <p class="gm-status">Choisis un prospect. Les choix des autres équipes seront simulés automatiquement, puis l’intersaison sera finalisée.</p>`;
    $("gmProspects").innerHTML = prospects.map((p,i) => `
      <button class="gm-prospect" data-prospect="${i}">
        <b>${escGM(p.name)} · ${escGM(p.pos)}</b><br>
        Âge ${p.age} · GÉN ${typeof overallRating==="function"?overallRating(p):"—"}<br>
        ${p.pts.toFixed(1)} PTS · ${p.reb.toFixed(1)} REB · ${p.ast.toFixed(1)} AST<br>
        Potentiel ${p.attributes&&p.attributes.potential||"—"}
      </button>`).join("");
    $("gmProspects").addEventListener("click",event => {
      const btn = event.target.closest("[data-prospect]");
      if (!btn) return;
      const selected = prospects[Number(btn.dataset.prospect)];
      if (!selected) return;
      btn.disabled = true;
      selected.team = draftPickTeam.code;
      selected.source = "Draft MyGM — choix utilisateur";
      const chosenId = selected.id;
      if (typeof runOffseason === "function") runOffseason();
      // Replace the automatic rookie allocated to the managed franchise with the user's chosen prospect.
      const autoIds = lastDraft && Array.isArray(lastDraft.rows) ? lastDraft.rows.filter(r => r.code === draftPickTeam.code).map(r => r.player.id) : [];
      players = players.filter(p => !autoIds.includes(p.id));
      draftPickTeam.playerIds = (draftPickTeam.playerIds||[]).filter(id => !autoIds.includes(id));
      selected.season = typeof seasonLabel === "function" ? seasonLabel(seasonYear) : selected.season;
      if (!players.some(p => p.id === chosenId)) players.push(selected);
      if (!draftPickTeam.playerIds.includes(chosenId)) draftPickTeam.playerIds.push(chosenId);
      if (lastDraft && Array.isArray(lastDraft.rows)) {
        lastDraft.rows = lastDraft.rows.filter(r => !autoIds.includes(r.player.id));
        lastDraft.rows.push({n:pickNo,round:1,team:draftPickTeam.name,code:draftPickTeam.code,player:selected});
      }
      if (typeof renderAll === "function") renderAll();
      window.NBASimDraftState = null;
      hideOverlay();
      const note = $("customTeamStatus");
      if (note) note.textContent = "Draft terminée : "+selected.name+" rejoint "+draftPickTeam.name+".";
    });
  }
  function install() {
    document.body.classList.add("gm-startup");
    document.body.style.overflow = "hidden";
    showWelcome();
    connectNavigationSaveLoad();
    document.addEventListener("mynba:save-load-result", handleSaveLoadResult);
    document.addEventListener("click",event => {
      const button = event.target.closest("#runOffseason");
      if (!button || !overlay.hidden) return;
      if (typeof phase !== "undefined" && phase === "playoffs" && typeof playoffs !== "undefined" && playoffs && playoffs.champion) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        showInteractiveDraft();
      }
    }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();