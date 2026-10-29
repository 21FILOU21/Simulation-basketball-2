(function () {
  "use strict";
  const STORAGE_KEY = "nba-sim-lab-ai-trade-settings-v1";
  const $ = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let offerQueue = [];
  let activeOffer = null;
  let offerModal = null;
  let userOfferCooldownRound = -100;
  let wrapped = false;

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; }
    catch (_) { return {}; }
  }
  const stored = readSettings();
  if (typeof window.NBASimAITradeHistory !== "object" || !Array.isArray(window.NBASimAITradeHistory)) {
    window.NBASimAITradeHistory = Array.isArray(stored.history) ? stored.history : [];
  }
  if (typeof window.NBASimAIAutoDecline !== "boolean") {
    window.NBASimAIAutoDecline = stored.autoDecline === true;
  }
  function allPlayers() { return typeof players !== "undefined" && Array.isArray(players) ? players : []; }
  function currentSeason() { return typeof seasonYear !== "undefined" ? Number(seasonYear) || 2025 : 2025; }
  function calendar() { return typeof seasonCalendar !== "undefined" ? seasonCalendar : null; }
  function getHistory() {
    if (!Array.isArray(window.NBASimAITradeHistory)) window.NBASimAITradeHistory = [];
    return window.NBASimAITradeHistory;
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        autoDecline: window.NBASimAIAutoDecline === true,
        history: getHistory().slice(-200)
      }));
    } catch (_) {}
    syncSettingsControls();
  }
  function seasonRound(game) {
    if (game && Number.isFinite(Number(game.round))) return Number(game.round);
    const cal = calendar();
    return cal && Array.isArray(cal.games) ? Math.floor(cal.games.filter(g => g.status === "completed").length / 15) + 1 : 1;
  }
  function position(p) { return String(p && (p.pos || p.position) || "SF").toUpperCase().split(/[\/, ]/)[0]; }
  function potential(p) {
    if (p && p.potential != null && p.attributes == null) return clamp(p.potential, 40, 99);
    const attrs = p && p.attributes || {};
    return clamp(attrs.potential == null ? (typeof window.overallRating === "function" ? window.overallRating(p) : 60) : attrs.potential, 40, 99);
  }
  function rating(p) {
    if (p && p.ovr != null && p.attributes == null) return clamp(p.ovr, 20, 99);
    try { return typeof window.overallRating === "function" ? clamp(window.overallRating(p), 20, 99) : 60; }
    catch (_) { return 60; }
  }
  function playerValue(p) {
    if (!p) return 0;
    const age = Number(p.age) || 27;
    const ageModifier = age <= 23 ? 12 : age <= 27 ? 8 : age <= 30 ? 2 : age <= 33 ? -7 : age <= 36 ? -16 : -24;
    const attrs = p.attributes || {};
    const skillPremium = (Number(attrs.offensiveIQ) || 50) * .06 +
      (Number(attrs.defensiveIQ) || 50) * .04 + (Number(attrs.playmaking) || 50) * .025;
    return Math.round(rating(p) * 1.55 + potential(p) * .62 + ageModifier + skillPremium);
  }
  function snapshot(p) {
    if (p && p.ovr != null && p.potential != null && p.value != null && p.attributes == null) {
      return { id: p.id, name: String(p.name || "Joueur"), pos: position(p), age: Number(p.age) || 0, ovr: rating(p), potential: potential(p), value: Number(p.value) || playerValue(p) };
    }
    return {
      id: p && p.id,
      name: String(p && p.name || "Joueur"),
      pos: position(p),
      age: Number(p && p.age) || 0,
      ovr: rating(p),
      potential: potential(p),
      value: playerValue(p)
    };
  }
  function getTeamCodes() {
    const codes = new Set();
    if (typeof nbaTeams !== "undefined" && Array.isArray(nbaTeams)) nbaTeams.forEach(t => {
      if (Array.isArray(t) && t[0]) codes.add(String(t[0]));
      else if (t && t.code) codes.add(String(t.code));
    });
    if (typeof customTeams !== "undefined" && Array.isArray(customTeams)) customTeams.forEach(t => {
      if (t && t.code) codes.add(String(t.code));
    });
    allPlayers().forEach(p => { if (p.team && String(p.team) !== "FA") codes.add(String(p.team)); });
    codes.delete("FA");
    codes.delete("FREE_AGENT");
    return Array.from(codes);
  }
  function teamName(code) {
    if (typeof customTeams !== "undefined" && Array.isArray(customTeams)) {
      const custom = customTeams.find(t => t && String(t.code) === String(code));
      if (custom && custom.name) return custom.name;
    }
    if (typeof nbaTeams !== "undefined" && Array.isArray(nbaTeams)) {
      const row = nbaTeams.find(t => Array.isArray(t) ? String(t[0]) === String(code) : t && String(t.code) === String(code));
      if (Array.isArray(row)) return row[1] || code;
      if (row) return row.name || code;
    }
    return String(code || "Équipe");
  }
  function currentManagedTeamCode() {
    if (typeof customTeams !== "undefined" && Array.isArray(customTeams)) {
      const managed = customTeams.find(t => t && t.isUserTeam && t.code);
      if (managed) return String(managed.code);
    }
    if (typeof window.NBAMyNBASelectedTeamCode === "function") {
      const selected = window.NBAMyNBASelectedTeamCode();
      if (selected) return String(selected);
    }
    const rosterSelect = $("mynbaRosterTeam");
    if (rosterSelect && rosterSelect.value) return String(rosterSelect.value);
    const teamFilter = $("scheduleTeamFilter");
    if (teamFilter && teamFilter.value) return String(teamFilter.value);
    return null;
  }
  function roster(code) {
    return allPlayers().filter(p => String(p.team) === String(code));
  }
  function updateCustomMembership() {
    if (typeof customTeams === "undefined" || !Array.isArray(customTeams)) return;
    customTeams.forEach(t => {
      if (!t || !t.code) return;
      t.playerIds = roster(t.code).map(p => p.id);
    });
  }
  function enforceRosterCaps() {
    const list = allPlayers();
    let changed = false;
    getTeamCodes().forEach(code => {
      let teamRoster = list.filter(p => String(p.team) === String(code));
      while (teamRoster.length > 15) {
        teamRoster.sort((a, b) => {
          const valueDiff = rating(a) - rating(b);
          if (valueDiff) return valueDiff;
          const rookieDiff = Number(!!b.rookie) - Number(!!a.rookie);
          if (rookieDiff) return rookieDiff;
          return (Number(a.mpg) || 0) - (Number(b.mpg) || 0);
        });
        const cut = teamRoster.shift();
        cut.team = "FA";
        if (cut.rookie || cut.drafted || cut.draftYear) {
          cut.undrafted = true;
          cut.drafted = false;
          cut.draftStatus = "undrafted";
          cut.draftStatusLabel = "Undrafted";
        }
        changed = true;
      }
    });
    if (changed && typeof window.NBAMyNBARosterChanged === "function") window.NBAMyNBARosterChanged();
    updateCustomMembership();
    return changed;
  }
  window.NBASimEnsureRosterCaps = enforceRosterCaps;

  function currentCalendarIsInProgress() {
    const cal = calendar();
    if (!cal || !Array.isArray(cal.games) || !cal.games.length) return false;
    if (typeof phase !== "undefined" && phase === "playoffs") return false;
    const completed = cal.games.filter(g => g.status === "completed").length;
    return completed > 0 && completed < cal.games.length;
  }
  function teamRecentlyTraded(code, round, cooldown) {
    return getHistory().some(t => t && t.accepted && Number(t.season) === currentSeason() &&
      (String(t.from) === String(code) || String(t.to) === String(code)) &&
      Math.abs(Number(round) - Number(t.round || 0)) < cooldown);
  }
  function refreshStrengths() {
    const cal = calendar();
    if (!cal || !Array.isArray(cal.teams)) return;
    cal.teams.forEach(t => {
      const code = String(t.code || t.scheduleCode || "");
      const top = roster(code).sort((a, b) => rating(b) - rating(a)).slice(0, 8);
      if (!top.length) return;
      const avg = top.reduce((sum, p) => sum + rating(p), 0) / top.length;
      t.strength = clamp(.43 + (avg - 65) * .0047, .30, .70);
    });
  }
  function notifyRosterChange() {
    enforceRosterCaps();
    refreshStrengths();
    if (typeof window.NBAMyNBARosterChanged === "function") window.NBAMyNBARosterChanged();
    if (typeof window.NBAMyNBARefreshAfterAITrade === "function") window.NBAMyNBARefreshAfterAITrade();
    else if (typeof window.renderAll === "function") window.renderAll();
  }
  function recordCompletedTrade(data) {
    if (!data || data.accepted === false) return null;
    const outgoing = (Array.isArray(data.outgoing) ? data.outgoing : []).map(snapshot);
    const incoming = (Array.isArray(data.incoming) ? data.incoming : []).map(snapshot);
    if (!outgoing.length || !incoming.length) return null;
    const values = outgoing.concat(incoming).map(p => Number(p.value) || 0);
    const record = {
      id: "trade-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      date: data.date || new Date().toISOString(),
      season: Number(data.season) || currentSeason(),
      round: Number(data.round) || seasonRound(null),
      kind: String(data.kind || "ai-ai"),
      from: String(data.from || ""),
      to: String(data.to || ""),
      outgoing: outgoing,
      incoming: incoming,
      accepted: true,
      headlineValue: Math.max.apply(null, values),
      totalValue: values.reduce((sum, value) => sum + value, 0)
    };
    const h = getHistory();
    h.push(record);
    if (h.length > 200) h.splice(0, h.length - 200);
    persist();
    try { window.dispatchEvent(new CustomEvent("NBASimTradeRecorded", { detail: record })); } catch (_) {}
    return record;
  }
  window.NBASimRecordTrade = recordCompletedTrade;

  function applySwap(teamA, teamB, playerA, playerB, kind, round) {
    if (!playerA || !playerB || String(playerA.team) !== String(teamA) || String(playerB.team) !== String(teamB)) return false;
    const beforeA = snapshot(playerA), beforeB = snapshot(playerB);
    if (roster(teamA).length > 15 || roster(teamB).length > 15) enforceRosterCaps();
    playerA.team = String(teamB);
    playerB.team = String(teamA);
    const record = recordCompletedTrade({
      kind: kind,
      season: currentSeason(),
      round: round,
      from: teamA,
      to: teamB,
      outgoing: [beforeA],
      incoming: [beforeB]
    });
    updateCustomMembership();
    notifyRosterChange();
    return !!record;
  }
  function positionCount(code, pos) {
    return roster(code).filter(p => position(p) === pos).length;
  }
  function teamTradeCandidates(code) {
    const r = roster(code);
    return r.filter(p => rating(p) >= 58).sort((a, b) => playerValue(b) - playerValue(a));
  }
  function chooseFairPair(teamA, teamB) {
    const aRows = teamTradeCandidates(teamA).slice(0, 9);
    const bRows = teamTradeCandidates(teamB).slice(0, 9);
    const candidates = [];
    aRows.forEach(a => bRows.forEach(b => {
      const va = playerValue(a), vb = playerValue(b);
      const ratio = Math.max(va, vb) / Math.max(1, Math.min(va, vb));
      if (ratio > 1.34) return;
      const surplusA = Math.max(0, positionCount(teamA, position(a)) - 3);
      const surplusB = Math.max(0, positionCount(teamB, position(b)) - 3);
      const fitBonus = (surplusA ? .06 : 0) + (surplusB ? .06 : 0);
      const difference = Math.abs(va - vb) / Math.max(1, Math.max(va, vb));
      candidates.push({ a, b, score: difference - fitBonus + Math.random() * .07, headline: Math.max(va, vb) });
    }));
    candidates.sort((a, b) => a.score - b.score);
    if (!candidates.length) return null;
    const pool = candidates.slice(0, Math.min(4, candidates.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function aiTeamCodes(excludeManaged) {
    const managed = currentManagedTeamCode();
    return getTeamCodes().filter(code => code !== "FA" && (!excludeManaged || String(code) !== String(managed)) && roster(code).length >= 5);
  }
  function makeAITrade(round) {
    const teams = aiTeamCodes(true);
    if (teams.length < 2) return false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const a = teams[Math.floor(Math.random() * teams.length)];
      let b = teams[Math.floor(Math.random() * teams.length)];
      if (a === b || teamRecentlyTraded(a, round, 7) || teamRecentlyTraded(b, round, 7)) continue;
      if (roster(a).length > 15 || roster(b).length > 15) enforceRosterCaps();
      const pair = chooseFairPair(a, b);
      if (!pair) continue;
      return applySwap(a, b, pair.a, pair.b, "ai-ai", round);
    }
    return false;
  }
  function makeOffer(round) {
    const userCode = currentManagedTeamCode();
    if (!userCode || roster(userCode).length < 5 || roster(userCode).length > 15) return;
    if (round - userOfferCooldownRound < 8 || offerQueue.length > 1 || activeOffer) return;
    const aiCodes = aiTeamCodes(true).filter(code => !teamRecentlyTraded(code, round, 5));
    const userRows = roster(userCode).slice().sort((a, b) => playerValue(b) - playerValue(a)).slice(0, 8);
    if (!aiCodes.length || !userRows.length) return;
    const userPlayer = userRows[Math.floor(Math.random() * Math.min(5, userRows.length))];
    const requestedValue = playerValue(userPlayer);
    const options = [];
    aiCodes.forEach(code => teamTradeCandidates(code).slice(0, 12).forEach(p => {
      const ratio = playerValue(p) / Math.max(1, requestedValue);
      if (ratio >= .82 && ratio <= 1.16) options.push({ code: code, player: p, value: playerValue(p), score: Math.abs(1 - ratio) + Math.random() * .08 });
    }));
    options.sort((a, b) => a.score - b.score);
    if (!options.length) return;
    const chosen = options[Math.floor(Math.random() * Math.min(options.length, 3))];
    userOfferCooldownRound = round;
    const offer = {
      id: "offer-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      season: currentSeason(),
      round: round,
      userCode: userCode,
      aiCode: chosen.code,
      aiPlayer: chosen.player,
      userPlayer: userPlayer,
      createdAt: new Date().toISOString()
    };
    if (window.NBASimAIAutoDecline === true) {
      window.NBASimLastAITradeNotice = teamName(chosen.code) + " a proposé un échange; refus automatique activé.";
      return;
    }
    offerQueue.push(offer);
    showNextOffer();
  }
  function simulateTradeActivity(game) {
    if (!currentCalendarIsInProgress()) return;
    const round = seasonRound(game);
    const userCode = currentManagedTeamCode();
    if (Math.random() < .006) makeAITrade(round);
    if (userCode && Math.random() < .0018) makeOffer(round);
  }

  function offerStillValid(offer) {
    return offer && offer.aiPlayer && offer.userPlayer &&
      String(offer.aiPlayer.team) === String(offer.aiCode) &&
      String(offer.userPlayer.team) === String(offer.userCode) &&
      roster(offer.aiCode).length <= 15 && roster(offer.userCode).length <= 15;
  }
  function closeOfferModal() {
    if (offerModal && offerModal.parentNode) offerModal.parentNode.removeChild(offerModal);
    offerModal = null;
  }
  function renderOffer(offer) {
    closeOfferModal();
    offerModal = document.createElement("div");
    offerModal.className = "mynba-ai-offer-overlay";
    offerModal.id = "mynbaAITradeOfferOverlay";
    const ai = offer.aiPlayer, user = offer.userPlayer;
    offerModal.innerHTML =
      '<section class="mynba-ai-offer-dialog" role="dialog" aria-modal="true" aria-labelledby="mynbaAITradeTitle">' +
      '<div class="mynba-ai-offer-kicker">MYNBA · PROPOSITION D’ÉCHANGE</div>' +
      '<h2 id="mynbaAITradeTitle">' + escapeHtml(teamName(offer.aiCode)) + ' vous contacte</h2>' +
      '<p>' + escapeHtml(teamName(offer.aiCode)) + ' souhaite acquérir votre joueur et vous propose un échange direct.</p>' +
      '<div class="mynba-ai-offer-trade">' +
      '<div><small>VOUS RECEVEZ</small><h3>' + escapeHtml(ai.name) + '</h3><p>' + escapeHtml(position(ai)) + ' · GÉN ' + rating(ai) + ' · POT ' + potential(ai) + '</p><b>Valeur : ' + playerValue(ai) + '</b></div>' +
      '<div class="mynba-ai-offer-arrow">⇄</div>' +
      '<div><small>VOUS CÉDEZ</small><h3>' + escapeHtml(user.name) + '</h3><p>' + escapeHtml(position(user)) + ' · GÉN ' + rating(user) + ' · POT ' + potential(user) + '</p><b>Valeur : ' + playerValue(user) + '</b></div>' +
      '</div>' +
      '<p class="mynba-ai-offer-note">La proposition reste en attente jusqu’à votre décision. Les échanges entre équipes IA continuent indépendamment.</p>' +
      '<div class="mynba-ai-offer-actions">' +
      '<button type="button" class="btn primary" id="mynbaAITradeAccept">Accepter le trade</button>' +
      '<button type="button" class="btn" id="mynbaAITradeReject">Refuser</button>' +
      '<button type="button" class="btn warn" id="mynbaAITradeAutoDecline">Refuser automatiquement les prochaines offres</button>' +
      '</div>' +
      '<p class="mynba-ai-offer-status" id="mynbaAITradeOfferStatus" role="status"></p>' +
      '</section>';
    document.body.appendChild(offerModal);
    $("mynbaAITradeAccept").onclick = function () {
      if (!offerStillValid(offer)) {
        $("mynbaAITradeOfferStatus").textContent = "Offre expirée : un des joueurs n’est plus disponible.";
        setTimeout(function () { resolveOffer(false, "offre expirée"); }, 700);
        return;
      }
      const ok = applySwap(offer.aiCode, offer.userCode, offer.aiPlayer, offer.userPlayer, "ai-to-player", offer.round);
      if (ok) resolveOffer(true);
      else $("mynbaAITradeOfferStatus").textContent = "Le trade n’a pas pu être appliqué. Vérifiez les effectifs.";
    };
    $("mynbaAITradeReject").onclick = function () { resolveOffer(false, "refusée par le joueur"); };
    $("mynbaAITradeAutoDecline").onclick = function () { setAutoDecline(true); };
  }
  function resolveOffer(accepted, reason) {
    const offer = activeOffer;
    if (!offer) return;
    if (!accepted) {
      window.NBASimLastAITradeNotice = "Proposition de " + teamName(offer.aiCode) + " " + (reason || "refusée") + ".";
    } else {
      window.NBASimLastAITradeNotice = "Trade accepté : " + teamName(offer.aiCode) + " ↔ " + teamName(offer.userCode) + ".";
    }
    activeOffer = null;
    closeOfferModal();
    persist();
    showNextOffer();
  }
  function showNextOffer() {
    if (activeOffer || window.NBASimAIAutoDecline === true) return;
    while (offerQueue.length) {
      const next = offerQueue.shift();
      if (!offerStillValid(next)) continue;
      if (String(currentManagedTeamCode()) !== String(next.userCode)) continue;
      activeOffer = next;
      renderOffer(next);
      return;
    }
  }
  function setAutoDecline(value) {
    window.NBASimAIAutoDecline = value === true;
    persist();
    if (window.NBASimAIAutoDecline) {
      activeOffer = null;
      closeOfferModal();
      offerQueue = [];
      window.NBASimLastAITradeNotice = "Refus automatique activé : les offres IA → votre équipe seront refusées.";
    }
    syncSettingsControls();
  }
  window.NBASimSetAIAutoDecline = setAutoDecline;

  function tradeRecapHtml(prefix) {
    const deals = getHistory().filter(t => t && t.accepted && Number(t.season) === currentSeason())
      .sort((a, b) => (Number(b.headlineValue) || 0) - (Number(a.headlineValue) || 0) || (Number(b.totalValue) || 0) - (Number(a.totalValue) || 0))
      .slice(0, 10);
    const rows = deals.map((t, i) => {
      const aGives = (t.outgoing || []).map(p => escapeHtml(p.name) + ' <small>(GÉN ' + Number(p.ovr || 0) + ' · POT ' + Number(p.potential || 0) + ')</small>').join(", ");
      const bGives = (t.incoming || []).map(p => escapeHtml(p.name) + ' <small>(GÉN ' + Number(p.ovr || 0) + ' · POT ' + Number(p.potential || 0) + ')</small>').join(", ");
      const label = t.kind === "ai-ai" ? "IA ↔ IA" : t.kind === "player-ai" ? "Franchise ↔ IA" : "IA → Franchise";
      return '<tr><td>' + (i + 1) + '</td><td><b>' + escapeHtml(label) + '</b><br><small>Journée ' + Number(t.round || 0) + '</small></td><td>' + escapeHtml(teamName(t.from)) + '<br><small>Envoie : ' + aGives + '</small></td><td>' + escapeHtml(teamName(t.to)) + '<br><small>Envoie : ' + bGives + '</small></td><td><b>' + Number(t.headlineValue || 0) + '</b></td></tr>';
    }).join("");
    return '<div id="' + prefix + '" class="mynba-ai-trade-recap"><div class="mynba-ai-trade-recap-heading"><div><div class="mynba-ai-trade-kicker">TRANSACTIONS · FIN DE SAISON</div><h2>Les plus gros trades de la saison ' + currentSeason() + '</h2><p>Classement par valeur du joueur le plus important de chaque échange. Les valeurs combinent GÉN, potentiel et âge.</p></div><div class="mynba-ai-trade-count">' + deals.length + ' trades</div></div>' +
      (deals.length ? '<div class="tablewrap"><table><thead><tr><th>#</th><th>Type</th><th>Équipe A</th><th>Équipe B</th><th>Valeur vedette</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">Aucun trade n’a été conclu pendant cette saison.</p>') + '</div>';
  }
  function removeOldRecaps() {
    document.querySelectorAll(".mynba-ai-trade-recap").forEach(el => el.remove());
  }
  function renderSeasonRecap() {
    const cal = calendar();
    if (!cal || !Array.isArray(cal.games) || !cal.games.length || !cal.games.every(g => g.status === "completed")) {
      removeOldRecaps();
      return;
    }
    removeOldRecaps();
    ["awardsBox", "seasonAwardsTransitionBox"].forEach((id, index) => {
      const parent = $(id);
      if (!parent) return;
      parent.insertAdjacentHTML("beforeend", tradeRecapHtml(index ? "mynbaAITradeRecapTransition" : "mynbaAITradeRecapAwards"));
    });
  }
  function syncSettingsControls() {
    const checkbox = $("mynbaAIAutoDeclineSetting");
    if (checkbox) checkbox.checked = window.NBASimAIAutoDecline === true;
    const stateLabel = $("mynbaAIAutoDeclineStatus");
    const nextLabel = window.NBASimAIAutoDecline ? "ON · les propositions reçues seront refusées automatiquement." : "OFF · chaque proposition peut être acceptée ou refusée manuellement.";
    if (stateLabel && stateLabel.textContent !== nextLabel) stateLabel.textContent = nextLabel;
  }
  function installSettingsUi() {
    const panel = $("mynbaSimulationSettingsPanel");
    const body = panel && panel.querySelector(".mynba-screen-body");
    if (!body || $("mynbaAITradeSettings")) return;
    const card = document.createElement("section");
    card.className = "mynba-feature-card";
    card.id = "mynbaAITradeSettings";
    card.innerHTML = '<h2>Propositions de trade des IA</h2><p>Ce réglage concerne uniquement les offres envoyées par une IA à votre franchise sélectionnée. Les trades entre équipes IA continueront toujours.</p><label class="mynba-ai-trade-setting"><input type="checkbox" id="mynbaAIAutoDeclineSetting"> <span><b>Refus automatique des offres IA → ma franchise</b><small>ON : refuse directement chaque nouvelle proposition entrante. OFF : demande une décision à chaque offre.</small></span></label><p id="mynbaAIAutoDeclineStatus" role="status"></p>';
    body.appendChild(card);
    $("mynbaAIAutoDeclineSetting").checked = window.NBASimAIAutoDecline === true;
    $("mynbaAIAutoDeclineSetting").addEventListener("change", function () { setAutoDecline(this.checked); });
    syncSettingsControls();
  }
  function installCss() {
    if ($("mynbaAITradeStyles")) return;
    const style = document.createElement("style");
    style.id = "mynbaAITradeStyles";
    style.textContent =
      ".mynba-ai-offer-overlay{position:fixed;inset:0;z-index:100000;background:rgba(4,8,18,.82);backdrop-filter:blur(7px);display:grid;place-items:center;padding:18px;}" +
      ".mynba-ai-offer-dialog{width:min(760px,100%);max-height:92vh;overflow:auto;background:#101a2d;color:#f4f7ff;border:1px solid #455b7b;border-radius:18px;padding:clamp(18px,3vw,30px);box-shadow:0 24px 90px #0009;}" +
      ".mynba-ai-offer-kicker,.mynba-ai-trade-kicker{font-size:.74rem;letter-spacing:.16em;font-weight:900;color:#83b7ff;text-transform:uppercase;}" +
      ".mynba-ai-offer-dialog h2{margin:.45rem 0 .8rem;font-size:clamp(1.4rem,3vw,2rem);}" +
      ".mynba-ai-offer-trade{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;margin:20px 0;align-items:stretch;}" +
      ".mynba-ai-offer-trade>div:not(.mynba-ai-offer-arrow){background:#18253a;border:1px solid #344a69;border-radius:12px;padding:16px;min-width:0;}" +
      ".mynba-ai-offer-trade h3{margin:.5rem 0;overflow-wrap:anywhere;}" +
      ".mynba-ai-offer-trade small{font-size:.72rem;color:#9eb1ce;font-weight:900;letter-spacing:.08em;}" +
      ".mynba-ai-offer-arrow{align-self:center;font-size:1.6rem;color:#82b7ff;}" +
      ".mynba-ai-offer-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}" +
      ".mynba-ai-offer-actions .warn{border-color:#bd8c56;color:#ffd09a;}" +
      ".mynba-ai-offer-note,.mynba-ai-offer-status{color:#b3c0d4;font-size:.9rem;}" +
      ".mynba-ai-trade-setting{display:flex;align-items:flex-start;gap:12px;padding:12px 0;cursor:pointer;}" +
      ".mynba-ai-trade-setting input{width:20px;height:20px;accent-color:#4a98ff;margin-top:2px;}" +
      ".mynba-ai-trade-setting small{display:block;color:#9eacc3;margin-top:5px;}" +
      ".mynba-ai-trade-recap{margin:22px 0;padding:20px;border:1px solid #314562;border-radius:14px;background:rgba(20,33,54,.72);}" +
      ".mynba-ai-trade-recap-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px;}" +
      ".mynba-ai-trade-recap h2{margin:.4rem 0;font-size:1.3rem;}" +
      ".mynba-ai-trade-recap p{color:#aabbd4;margin:.4rem 0 1rem;}" +
      ".mynba-ai-trade-count{border-radius:999px;padding:6px 10px;background:#243a57;color:#d7e8ff;font-weight:800;white-space:nowrap;}" +
      ".mynba-ai-trade-recap td small{display:inline-block;color:#9bafc9;margin-top:3px;}" +
      "@media(max-width:580px){.mynba-ai-offer-trade{grid-template-columns:1fr}.mynba-ai-offer-arrow{transform:rotate(90deg);justify-self:center}.mynba-ai-offer-actions{flex-direction:column}.mynba-ai-offer-actions button{width:100%}.mynba-ai-trade-recap-heading{flex-direction:column;}}";
    document.head.appendChild(style);
  }
  function wrapSimulation() {
    if (wrapped) return;
    const original = window.simulateScheduledGame;
    if (typeof original === "function" && !original.__mynbaAITradesWrapped) {
      const run = function (game) {
        const result = original.apply(this, arguments);
        if (result !== false && game && game.status === "completed") {
          try { enforceRosterCaps(); simulateTradeActivity(game); } catch (err) { console.error("AI trade manager:", err); }
        }
        return result;
      };
      run.__mynbaAITradesWrapped = true;
      window.simulateScheduledGame = run;
    }
    const oldRender = window.renderAll;
    if (typeof oldRender === "function" && !oldRender.__mynbaAITradesWrapped) {
      const render = function () {
        enforceRosterCaps();
        const result = oldRender.apply(this, arguments);
        refreshStrengths();
        renderSeasonRecap();
        installSettingsUi();
        syncSettingsControls();
        return result;
      };
      render.__mynbaAITradesWrapped = true;
      window.renderAll = render;
    }
    const oldLoad = window.load;
    if (typeof oldLoad === "function" && !oldLoad.__mynbaAITradeLoadWrapped) {
      const load = function () {
        const result = oldLoad.apply(this, arguments);
        enforceRosterCaps();
        refreshStrengths();
        persist();
        return result;
      };
      load.__mynbaAITradeLoadWrapped = true;
      window.load = load;
    }
    wrapped = true;
  }
  function install() {
    installCss();
    installSettingsUi();
    const rosterWasRepaired = enforceRosterCaps();
    refreshStrengths();
    wrapSimulation();
    if (rosterWasRepaired && typeof window.NBAMyNBARefreshAfterAITrade === "function") window.NBAMyNBARefreshAfterAITrade();
    syncSettingsControls();
    persist();
    const panelObserver = new MutationObserver(function () { installSettingsUi(); syncSettingsControls(); });
    panelObserver.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();