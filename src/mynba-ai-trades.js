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
  if (!Array.isArray(window.NBASimAIRosterMoves)) {
    window.NBASimAIRosterMoves = Array.isArray(stored.rosterMoves) ? stored.rosterMoves : [];
  }
  function allPlayers() { return typeof players !== "undefined" && Array.isArray(players) ? players : []; }
  function currentSeason() { return typeof seasonYear !== "undefined" ? Number(seasonYear) || 2025 : 2025; }
  function calendar() { return typeof seasonCalendar !== "undefined" ? seasonCalendar : null; }
  function getHistory() {
    if (!Array.isArray(window.NBASimAITradeHistory)) window.NBASimAITradeHistory = [];
    return window.NBASimAITradeHistory;
  }
  function getRosterMoves() {
    if (!Array.isArray(window.NBASimAIRosterMoves)) window.NBASimAIRosterMoves = [];
    return window.NBASimAIRosterMoves;
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        autoDecline: window.NBASimAIAutoDecline === true,
        history: getHistory().slice(-200),
        rosterMoves: getRosterMoves().slice(-200)
      }));
    } catch (_) {}
    syncSettingsControls();
  }
  function seasonRound(game) {
    if (game && Number.isFinite(Number(game.round))) return Number(game.round);
    const cal = calendar();
    return cal && Array.isArray(cal.games) ? Math.floor(cal.games.filter(g => g.status === "completed").length / 15) + 1 : 1;
  }
  const POSITION_CODES = ["PG", "SG", "SF", "PF", "C"];
  function position(p) { return String(p && (p.pos || p.position) || "SF").toUpperCase().split(/[\/, ]/)[0]; }
  function playerPositions(p) {
    const raw = [p && (p.pos || p.position), p && (p.secondaryPos || p.secondaryPosition)].filter(Boolean).join("/");
    const found = raw.toUpperCase().split(/[\/,| ]+/).filter(value => POSITION_CODES.includes(value));
    return Array.from(new Set(found.length ? found : [position(p)]));
  }
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
  function recordAIRosterMove(code, signedPlayer, releasedPlayer, round) {
    const move = {
      id: "roster-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      date: new Date().toISOString(),
      season: currentSeason(),
      round: Number(round) || seasonRound(null),
      team: String(code || ""),
      kind: signedPlayer && releasedPlayer ? "sign-release" : signedPlayer ? "sign" : "release",
      signed: signedPlayer ? snapshot(signedPlayer) : null,
      released: releasedPlayer ? snapshot(releasedPlayer) : null
    };
    const moves = getRosterMoves();
    moves.push(move);
    if (moves.length > 200) moves.splice(0, moves.length - 200);
    persist();
    try { window.dispatchEvent(new CustomEvent("NBASimAIRosterMove", { detail: move })); } catch (_) {}
    return move;
  }
  window.NBASimAIRosterMoves = getRosterMoves();

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
  function retentionScore(player, teamRoster) {
    const counts = {};
    POSITION_CODES.forEach(pos => { counts[pos] = 0; });
    teamRoster.forEach(member => playerPositions(member).forEach(pos => { counts[pos] = (counts[pos] || 0) + 1; }));
    const covered = playerPositions(player);
    const rarestDepth = covered.length ? Math.min.apply(null, covered.map(pos => counts[pos] || 0)) : 0;
    const depthProtection = rarestDepth <= 1 ? 28 : rarestDepth === 2 ? 12 : rarestDepth === 3 ? 0 : -12 * (rarestDepth - 3);
    return playerValue(player) + depthProtection;
  }
  function enforceRosterCaps() {
    const list = allPlayers();
    let changed = false;
    getTeamCodes().forEach(code => {
      let teamRoster = list.filter(p => String(p.team) === String(code));
      while (teamRoster.length > 15) {
        teamRoster.sort((a, b) => retentionScore(a, teamRoster) - retentionScore(b, teamRoster));
        const cut = teamRoster.shift();
        if (!cut) break;
        cut.team = "FA";
        if (cut.rookie || cut.drafted || cut.draftYear) {
          cut.undrafted = true;
          cut.drafted = false;
          cut.draftStatus = "undrafted";
          cut.draftStatusLabel = "Undrafted";
        }
        if (String(code) !== String(currentManagedTeamCode())) recordAIRosterMove(code, null, cut, seasonRound(null));
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
    const allAssets = outgoing.concat(incoming);
    const values = allAssets.map(p => Number(p.value) || 0);
    const headlinePlayer = allAssets.slice().sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
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
      headlineValue: Number(headlinePlayer && headlinePlayer.value) || 0,
      headlinePlayer: String(headlinePlayer && headlinePlayer.name || ""),
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

  function applyMultiTrade(teamA, teamB, outgoingA, outgoingB, kind, round) {
    const givesA = Array.isArray(outgoingA) ? outgoingA : [];
    const givesB = Array.isArray(outgoingB) ? outgoingB : [];
    if (!givesA.length || !givesB.length || String(teamA) === String(teamB)) return false;
    if (new Set(givesA).size !== givesA.length || new Set(givesB).size !== givesB.length) return false;
    if (givesA.some(p => !p || String(p.team) !== String(teamA)) || givesB.some(p => !p || String(p.team) !== String(teamB))) return false;
    const nextA = roster(teamA).length - givesA.length + givesB.length;
    const nextB = roster(teamB).length - givesB.length + givesA.length;
    if (nextA < 5 || nextB < 5 || nextA > 15 || nextB > 15) return false;
    const beforeA = givesA.map(snapshot), beforeB = givesB.map(snapshot);
    givesA.forEach(p => { p.team = String(teamB); });
    givesB.forEach(p => { p.team = String(teamA); });
    const record = recordCompletedTrade({kind:kind,season:currentSeason(),round:round,from:teamA,to:teamB,outgoing:beforeA,incoming:beforeB});
    updateCustomMembership();
    notifyRosterChange();
    return !!record;
  }
  function applySwap(teamA, teamB, playerA, playerB, kind, round) {
    return applyMultiTrade(teamA, teamB, [playerA], [playerB], kind, round);
  }
  function rosterFitScore(teamRoster) {
    const ranked = teamRoster.slice().sort((a, b) => rating(b) - rating(a)).slice(0, 8);
    const weights = [1, .93, .86, .79, .72, .65, .58, .51];
    let weighted = 0, weightTotal = 0;
    ranked.forEach((p, i) => { weighted += rating(p) * weights[i]; weightTotal += weights[i]; });
    const core = weightTotal ? weighted / weightTotal : 0;
    const counts = {};
    POSITION_CODES.forEach(pos => { counts[pos] = 0; });
    teamRoster.forEach(p => playerPositions(p).forEach(pos => { counts[pos] = (counts[pos] || 0) + 1; }));
    const balance = POSITION_CODES.reduce((sum, pos) => {
      const count = counts[pos] || 0;
      return sum + (count === 0 ? -4 : count === 1 ? -1.5 : count === 2 ? 1.1 : count === 3 ? .45 : -.25);
    }, 0);
    return core + balance + Math.min(teamRoster.length, 12) * .12;
  }
  function teamTradeCandidates(code) {
    return roster(code).filter(p => rating(p) >= 50).sort((a, b) => playerValue(b) - playerValue(a)).slice(0, 7);
  }
  function buildTradePackages(code) {
    const teamRoster=roster(code), candidates=teamTradeCandidates(code);
    const maxSize=Math.min(3,teamRoster.length-5,candidates.length), packages=[];
    function addCombinations(start,picked) {
      if (picked.length) packages.push({players:picked.slice(),value:picked.reduce((sum,p)=>sum+playerValue(p),0)});
      if (picked.length>=maxSize) return;
      for(let i=start;i<candidates.length;i++) addCombinations(i+1,picked.concat(candidates[i]));
    }
    if(maxSize>0) addCombinations(0,[]);
    return packages;
  }
  function chooseFairTrade(teamA,teamB) {
    const rosterA=roster(teamA),rosterB=roster(teamB);
    if(rosterA.length<5||rosterB.length<5||rosterA.length>15||rosterB.length>15)return null;
    const packagesA=buildTradePackages(teamA),packagesB=buildTradePackages(teamB);
    if(!packagesA.length||!packagesB.length)return null;
    const beforeA=rosterFitScore(rosterA),beforeB=rosterFitScore(rosterB),candidates=[];
    packagesA.forEach(packageA=>packagesB.forEach(packageB=>{
      const valueA=packageA.value,valueB=packageB.value;
      if(Math.max(valueA,valueB)/Math.max(1,Math.min(valueA,valueB))>1.2)return;
      const nextA=rosterA.filter(p=>!packageA.players.includes(p)).concat(packageB.players);
      const nextB=rosterB.filter(p=>!packageB.players.includes(p)).concat(packageA.players);
      if(nextA.length<5||nextB.length<5||nextA.length>15||nextB.length>15)return;
      const deltaA=rosterFitScore(nextA)-beforeA,deltaB=rosterFitScore(nextB)-beforeB;
      if(deltaA<-.45||deltaB<-.45||deltaA+deltaB<.7)return;
      const valueGap=Math.abs(valueA-valueB)/Math.max(valueA,valueB);
      const multiBonus=packageA.players.length>1||packageB.players.length>1?.18:0;
      const score=deltaA+deltaB+Math.min(deltaA,deltaB)*.3-valueGap*.8+multiBonus+Math.random()*.12;
      candidates.push({playersA:packageA.players,playersB:packageB.players,valueA,valueB,deltaA,deltaB,score});
    }));
    candidates.sort((a,b)=>b.score-a.score);
    if(!candidates.length)return null;
    return candidates[Math.floor(Math.random()*Math.min(4,candidates.length))];
  }
  function aiTeamCodes(excludeManaged) {
    const managed = currentManagedTeamCode();
    return getTeamCodes().filter(code => code !== "FA" && (!excludeManaged || String(code) !== String(managed)) && roster(code).length >= 5);
  }
  function makeAITrade(round) {
    const teams=aiTeamCodes(true);
    if(teams.length<2)return false;
    for(let attempt=0;attempt<8;attempt++){
      const a=teams[Math.floor(Math.random()*teams.length)],b=teams[Math.floor(Math.random()*teams.length)];
      if(a===b||teamRecentlyTraded(a,round,7)||teamRecentlyTraded(b,round,7))continue;
      if(roster(a).length>15||roster(b).length>15)enforceRosterCaps();
      const deal=chooseFairTrade(a,b);
      if(!deal)continue;
      return applyMultiTrade(a,b,deal.playersA,deal.playersB,"ai-ai",round);
    }
    return false;
  }
  function teamNeedScore(teamRoster,player) {
    const counts={};POSITION_CODES.forEach(pos=>{counts[pos]=0;});
    teamRoster.forEach(member=>playerPositions(member).forEach(pos=>{counts[pos]=(counts[pos]||0)+1;}));
    return Math.max.apply(null,playerPositions(player).map(pos=>{
      const count=counts[pos]||0;return count===0?6:count===1?3:count===2?1:count===3?-1:-3;
    }));
  }
  function manageAIRoster(code,round) {
    if(!code||String(code)===String(currentManagedTeamCode()))return false;
    const teamRoster=roster(code);
    if(teamRoster.length<5||teamRoster.length>15)return false;
    if(getRosterMoves().some(move=>move&&String(move.team)===String(code)&&Number(move.season)===currentSeason()&&Math.abs(Number(round)-Number(move.round||0))<7))return false;
    const freeAgents=allPlayers().filter(p=>p&&(String(p.team)==="FA"||String(p.team)==="FREE_AGENT")&&rating(p)>=50)
      .sort((a,b)=>(playerValue(b)+rating(b)*.15)-(playerValue(a)+rating(a)*.15)).slice(0,24);
    if(!freeAgents.length)return false;
    const before=rosterFitScore(teamRoster);
    const cuts=teamRoster.length>=15?teamRoster.slice().sort((a,b)=>retentionScore(a,teamRoster)-retentionScore(b,teamRoster)).slice(0,7):[null];
    let best=null;
    freeAgents.forEach(freeAgent=>cuts.forEach(cut=>{
      const need=teamNeedScore(teamRoster,freeAgent);
      if(cut&&rating(freeAgent)<rating(cut)+1&&need<4)return;
      const projected=teamRoster.filter(p=>p!==cut).concat(freeAgent);
      if(projected.length<5||projected.length>15)return;
      const gain=rosterFitScore(projected)-before;
      const minGain=teamRoster.length>=15?.85:teamRoster.length<10?-1.4:-.15;
      if(gain<minGain)return;
      const score=gain+need*.12+(rating(freeAgent)-(cut?rating(cut):0))*.012+Math.random()*.08;
      if(!best||score>best.score)best={freeAgent,cut,score};
    }));
    if(!best)return false;
    if(best.cut)best.cut.team="FA";
    best.freeAgent.team=String(code);
    updateCustomMembership();
    recordAIRosterMove(code,best.freeAgent,best.cut,round);
    notifyRosterChange();
    return true;
  }
  function manageAIRosterActivity(round) {
    const teams=aiTeamCodes(true).sort(()=>Math.random()-.5);
    for(const code of teams.slice(0,10))if(manageAIRoster(code,round))return true;
    return false;
  }
  function makeOffer(round) {
    const userCode=currentManagedTeamCode();
    if(!userCode||roster(userCode).length<5||roster(userCode).length>15)return;
    if(round-userOfferCooldownRound<8||offerQueue.length>1||activeOffer)return;
    const aiCodes=aiTeamCodes(true).filter(code=>!teamRecentlyTraded(code,round,5));
    if(!aiCodes.length)return;
    const options=aiCodes.map(code=>{
      const deal=chooseFairTrade(code,userCode);
      return deal?{code,deal,score:deal.score+Math.random()*.12}:null;
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    if(!options.length)return;
    const chosen=options[Math.floor(Math.random()*Math.min(options.length,3))];
    userOfferCooldownRound=round;
    const offer={id:"offer-"+Date.now()+"-"+Math.floor(Math.random()*100000),season:currentSeason(),round:round,
      userCode:userCode,aiCode:chosen.code,aiPlayers:chosen.deal.playersA,userPlayers:chosen.deal.playersB,createdAt:new Date().toISOString()};
    if(window.NBASimAIAutoDecline===true){
      window.NBASimLastAITradeNotice=teamName(chosen.code)+" a proposé un échange; refus automatique activé.";
      return;
    }
    offerQueue.push(offer);
    showNextOffer();
  }
  function simulateTradeActivity(game) {
    if(!currentCalendarIsInProgress())return;
    const round=seasonRound(game),userCode=currentManagedTeamCode();
    if(Math.random()<.006)makeAITrade(round);
    if(Math.random()<.009)manageAIRosterActivity(round);
    if(userCode&&Math.random()<.0018)makeOffer(round);
  }

  function offerStillValid(offer) {
    if(!offer||!Array.isArray(offer.aiPlayers)||!Array.isArray(offer.userPlayers)||!offer.aiPlayers.length||!offer.userPlayers.length)return false;
    if(offer.aiPlayers.some(p=>!p||String(p.team)!==String(offer.aiCode))||offer.userPlayers.some(p=>!p||String(p.team)!==String(offer.userCode)))return false;
    const nextAI=roster(offer.aiCode).length-offer.aiPlayers.length+offer.userPlayers.length;
    const nextUser=roster(offer.userCode).length-offer.userPlayers.length+offer.aiPlayers.length;
    return nextAI>=5&&nextAI<=15&&nextUser>=5&&nextUser<=15;
  }
  function closeOfferModal() {
    if (offerModal && offerModal.parentNode) offerModal.parentNode.removeChild(offerModal);
    offerModal = null;
  }
  function renderOffer(offer) {
    closeOfferModal();
    offerModal=document.createElement("div");
    offerModal.className="mynba-ai-offer-overlay";
    offerModal.id="mynbaAITradeOfferOverlay";
    const renderPlayers=list=>list.map(p=>'<article class="mynba-ai-offer-player"><b>'+escapeHtml(p.name)+'</b><p>'+
      escapeHtml(playerPositions(p).join("/"))+' · GÉN '+rating(p)+' · POT '+potential(p)+'</p><small>Valeur individuelle : '+playerValue(p)+'</small></article>').join("");
    const valueTotal=list=>list.reduce((sum,p)=>sum+playerValue(p),0);
    offerModal.innerHTML='<section class="mynba-ai-offer-dialog" role="dialog" aria-modal="true" aria-labelledby="mynbaAITradeTitle">'+
      '<div class="mynba-ai-offer-kicker">MYNBA · PROPOSITION D’ÉCHANGE</div>'+
      '<h2 id="mynbaAITradeTitle">'+escapeHtml(teamName(offer.aiCode))+' vous contacte</h2>'+
      '<p>'+escapeHtml(teamName(offer.aiCode))+' propose un échange de plusieurs joueurs si nécessaire.</p>'+
      '<div class="mynba-ai-offer-trade"><div><small>VOUS RECEVEZ · '+offer.aiPlayers.length+' JOUEUR(S)</small>'+renderPlayers(offer.aiPlayers)+'<b>Total indicatif : '+valueTotal(offer.aiPlayers)+'</b></div>'+
      '<div class="mynba-ai-offer-arrow">⇄</div><div><small>VOUS CÉDEZ · '+offer.userPlayers.length+' JOUEUR(S)</small>'+renderPlayers(offer.userPlayers)+'<b>Total indicatif : '+valueTotal(offer.userPlayers)+'</b></div></div>'+
      '<p class="mynba-ai-offer-note">La valeur totale équilibre le paquet. Le classement des plus gros échanges regarde uniquement le joueur individuel le plus précieux.</p>'+
      '<div class="mynba-ai-offer-actions"><button type="button" class="btn primary" id="mynbaAITradeAccept">Accepter le trade</button>'+
      '<button type="button" class="btn" id="mynbaAITradeReject">Refuser</button><button type="button" class="btn warn" id="mynbaAITradeAutoDecline">Refuser automatiquement les prochaines offres</button></div>'+
      '<p class="mynba-ai-offer-status" id="mynbaAITradeOfferStatus" role="status"></p></section>';
    document.body.appendChild(offerModal);
    $("mynbaAITradeAccept").onclick=function(){
      if(!offerStillValid(offer)){
        $("mynbaAITradeOfferStatus").textContent="Offre expirée : un des joueurs n’est plus disponible.";
        setTimeout(function(){resolveOffer(false,"offre expirée");},700);return;
      }
      const ok=applyMultiTrade(offer.aiCode,offer.userCode,offer.aiPlayers,offer.userPlayers,"ai-to-player",offer.round);
      if(ok)resolveOffer(true);
      else $("mynbaAITradeOfferStatus").textContent="Le trade n’a pas pu être appliqué. Vérifiez les effectifs.";
    };
    $("mynbaAITradeReject").onclick=function(){resolveOffer(false,"refusée par le joueur");};
    $("mynbaAITradeAutoDecline").onclick=function(){setAutoDecline(true);};
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
      .sort((a, b) => (Number(b.headlineValue) || 0) - (Number(a.headlineValue) || 0))
      .slice(0, 10);
    const rows = deals.map((t, i) => {
      const aGives = (t.outgoing || []).map(p => (typeof window.NBASimPlayerPortraitMarkup === "function" ? window.NBASimPlayerPortraitMarkup(p, 26) : "") + escapeHtml(p.name) + ' <small>(GÉN ' + Number(p.ovr || 0) + ' · POT ' + Number(p.potential || 0) + ')</small>').join(", ");
      const bGives = (t.incoming || []).map(p => (typeof window.NBASimPlayerPortraitMarkup === "function" ? window.NBASimPlayerPortraitMarkup(p, 26) : "") + escapeHtml(p.name) + ' <small>(GÉN ' + Number(p.ovr || 0) + ' · POT ' + Number(p.potential || 0) + ')</small>').join(", ");
      const label = t.kind === "ai-ai" ? "IA ↔ IA" : t.kind === "player-ai" ? "Franchise ↔ IA" : "IA → Franchise";
      const fromLogo = typeof window.NBASimTeamImageMarkup === "function" ? window.NBASimTeamImageMarkup(t.from, 26) : "";
      const toLogo = typeof window.NBASimTeamImageMarkup === "function" ? window.NBASimTeamImageMarkup(t.to, 26) : "";
      return '<tr><td>'+(i+1)+'</td><td><b>'+escapeHtml(label)+'</b><br><small>Journée '+Number(t.round||0)+'</small></td><td>'+fromLogo+escapeHtml(teamName(t.from))+'<br><small>Envoie : '+aGives+'</small></td><td>'+toLogo+escapeHtml(teamName(t.to))+'<br><small>Envoie : '+bGives+'</small></td><td><b>'+Number(t.headlineValue||0)+'</b><br><small>'+escapeHtml(t.headlinePlayer||"Joueur vedette")+'</small></td></tr>';
    }).join("");
    const moves=getRosterMoves().filter(move=>move&&Number(move.season)===currentSeason())
      .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,12);
    const moveRows=moves.map(move=>{
      const signed=move.signed?escapeHtml(move.signed.name)+' <small>(GÉN '+Number(move.signed.ovr||0)+')</small>':'—';
      const released=move.released?escapeHtml(move.released.name)+' <small>(GÉN '+Number(move.released.ovr||0)+')</small>':'—';
      const label=move.signed&&move.released?'Signature + libération':move.signed?'Signature':'Libération';
      return '<tr><td>'+escapeHtml(teamName(move.team))+'</td><td>'+label+'</td><td>'+signed+'</td><td>'+released+'</td></tr>';
    }).join("");
    return '<div id="'+prefix+'" class="mynba-ai-trade-recap"><div class="mynba-ai-trade-recap-heading"><div><div class="mynba-ai-trade-kicker">TRANSACTIONS · FIN DE SAISON</div><h2>Les plus gros trades de la saison '+currentSeason()+'</h2><p>Classement selon la valeur du joueur individuel le plus important de chaque échange, jamais selon la somme des paquets.</p></div><div class="mynba-ai-trade-count">'+deals.length+' trades</div></div>'+
      (deals.length?'<div class="tablewrap"><table><thead><tr><th>#</th><th>Type</th><th>Équipe A</th><th>Équipe B</th><th>Joueur le plus précieux</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="muted">Aucun trade n’a été conclu pendant cette saison.</p>')+
      (moves.length?'<h3>Signatures et libérations des équipes IA</h3><div class="tablewrap"><table><thead><tr><th>Équipe</th><th>Mouvement</th><th>Joueur signé</th><th>Joueur libéré</th></tr></thead><tbody>'+moveRows+'</tbody></table></div>':'')+'</div>';
  }
  function removeOldRecaps() {
    document.querySelectorAll(".mynba-ai-trade-recap").forEach(el => {
      if (!["mynbaAITradeSeasonRecap","mynbaAITradeSeasonRecapContent","mynbaAITradeRecapFullscreen"].includes(el.id)) el.remove();
    });
  }
  function renderSeasonRecap() {
    const cal = calendar();
    const screen = $("seasonAwardsScreen");
    if (!cal || !Array.isArray(cal.games) || !cal.games.length || !cal.games.every(g => g.status === "completed") || !screen) {
      const mount = $("mynbaAITradeSeasonRecap");
      if (mount) mount.remove();
      return;
    }
    let mount = $("mynbaAITradeSeasonRecap");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "mynbaAITradeSeasonRecap";
      mount.className = "mynba-ai-trade-recap-mount";
      const transition = $("seasonAwardsTransitionBox");
      if (transition && transition.parentNode) transition.insertAdjacentElement("afterend", mount);
      else screen.appendChild(mount);
    }
    const recapHtml = tradeRecapHtml("mynbaAITradeSeasonRecapContent");
    if (mount.innerHTML !== recapHtml) mount.innerHTML = recapHtml;
    const fullscreen = $("season-awards-fullscreen");
    const shell = fullscreen && fullscreen.querySelector(".fullscreen-shell");
    const grid = shell && shell.querySelector(".fullscreen-awards-grid");
    if (grid && !fullscreen.querySelector("#mynbaAITradeRecapFullscreen")) {
      grid.insertAdjacentHTML("afterend", tradeRecapHtml("mynbaAITradeRecapFullscreen"));
    }
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
    const panelObserver = new MutationObserver(function () { installSettingsUi(); syncSettingsControls(); renderSeasonRecap(); });
    panelObserver.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();