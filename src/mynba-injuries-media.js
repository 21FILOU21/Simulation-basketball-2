/* Injuries, player/team images, banners and demo database editing. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const DEMO_DB_KEY = "nba-sim-lab-demo-database-v1";
  const TEAM_IMAGES_KEY = "nba-sim-lab-team-images-v1";
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  let banner = null, bannerPlayerId = null, lastDecorate = 0;

  function readStorage(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function allPlayers() { return typeof players !== "undefined" && Array.isArray(players) ? players : []; }
  function currentTeams() { return typeof customTeams !== "undefined" && Array.isArray(customTeams) ? customTeams : []; }
  function teamSettings() {
    if (!window.NBAMyNBATeamSettings || typeof window.NBAMyNBATeamSettings !== "object") window.NBAMyNBATeamSettings = {};
    return window.NBAMyNBATeamSettings;
  }
  function allKnownPlayers() { const active=allPlayers(); const old=typeof retired!=="undefined"&&Array.isArray(retired)?retired:[]; const ids=new Set(active.map(p=>String(p.id))); return active.concat(old.filter(p=>!ids.has(String(p.id)))); }
  function findPlayer(id) { return allKnownPlayers().find(p => String(p.id) === String(id)) || null; }
  function currentSeasonLabel() {
    const year = typeof seasonYear !== "undefined" ? Number(seasonYear) || 2025 : 2025;
    return typeof seasonLabel === "function" ? seasonLabel(year) : year + "-" + String((year + 1) % 100).padStart(2, "0");
  }
  function getTeamImage(code) {
    const setting = teamSettings()[String(code)] || {};
    const custom = currentTeams().find(t => t && String(t.code) === String(code));
    const saved = readStorage(TEAM_IMAGES_KEY, {});
    return setting.image || (custom && custom.image) || saved[String(code)] || "";
  }
  function setTeamImage(code, image) {
    if (!code) return;
    const key = String(code), settings = teamSettings();
    settings[key] = Object.assign({}, settings[key] || {}, { image: image || "" });
    const custom = currentTeams().find(t => t && String(t.code) === key);
    if (custom) custom.image = image || "";
    window.NBAMyNBATeamSettings = settings;
    const saved = readStorage(TEAM_IMAGES_KEY, {});
    if (image) saved[key] = image; else delete saved[key];
    try { localStorage.setItem(TEAM_IMAGES_KEY, JSON.stringify(saved)); } catch (_) {}
    updateTeamMedia();
    decorateDocument();
    if (typeof window.renderAll === "function") window.renderAll();
  }
  window.NBASimSetTeamImage = setTeamImage;
  function getPlayerImage(player) { if(player&&player.image)return String(player.image); const known=player&&player.id!=null?allKnownPlayers().find(p=>String(p.id)===String(player.id)):null; return known&&known.image?String(known.image):""; }
  function playerPortraitMarkup(player, size) {
    const image = getPlayerImage(player);
    if (!image) return "";
    const dimension = clamp(size || 32, 20, 120);
    return '<img class="mynba-player-portrait" src="' + esc(image) + '" alt="" aria-hidden="true" width="' + dimension + '" height="' + dimension + '">';
  }
  function teamImageMarkup(code, size) {
    const image = getTeamImage(code);
    if (!image) return esc(code || "—");
    const dimension = clamp(size || 28, 18, 96);
    return '<img class="mynba-team-logo" data-team-code="' + esc(code) + '" src="' + esc(image) + '" alt="' + esc(code || "Équipe") + '" width="' + dimension + '" height="' + dimension + '">';
  }
  window.NBASimPlayerPortraitMarkup = playerPortraitMarkup;
  window.NBASimTeamImageMarkup = teamImageMarkup;
  window.NBASimGetPlayerImage = getPlayerImage;
  window.NBASimGetTeamImage = getTeamImage;

  async function readImageFile(file) {
    if (!file) return "";
    const name = String(file.name || "").toLowerCase();
    const allowed = (name.endsWith(".png") && file.type === "image/png") || (name.endsWith(".jpg") && file.type === "image/jpeg");
    if (!allowed) throw new Error("Format refusé : sélectionne uniquement une image .png ou .jpg.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Image trop volumineuse : maximum 8 Mo.");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Impossible de lire cette image."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image PNG/JPG invalide."));
      img.src = dataUrl;
    });
    const max = 640, scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", .86);
  }
  window.NBASimReadImageFile = readImageFile;

  const bodyParts = {
    hand:{label:"Main / poignet",keys:["ballHandle","passing","threePoint","freeThrow","finishing"]},
    arm:{label:"Bras / coude",keys:["threePoint","midRange","finishing","passing","block"]},
    shoulder:{label:"Épaule",keys:["threePoint","midRange","finishing","strength","passing"]},
    leg:{label:"Jambe / quadriceps",keys:["speed","acceleration","vertical","finishing","perimeterDefense"]},
    knee:{label:"Genou",keys:["speed","agility","vertical","dunk","perimeterDefense"]},
    ankle:{label:"Cheville",keys:["speed","agility","acceleration","vertical","ballHandle"]},
    foot:{label:"Pied",keys:["speed","agility","vertical","finishing"]},
    back:{label:"Dos",keys:["strength","stamina","interiorDefense","defensiveRebound","shotIQ"]},
    hamstring:{label:"Ischio-jambiers",keys:["speed","acceleration","agility","vertical"]},
    head:{label:"Tête / commotion",keys:["shotIQ","offensiveIQ","defensiveIQ","consistency","clutch"]},
    hip:{label:"Hanche",keys:["speed","agility","strength","finishing"]}
  };
  const severityLabels = {minor:"Mineure",moderate:"Moyenne",severe:"Élevée",careerEnding:"Très élevée — fin de carrière"};
  function injuryPenaltyMap(bodyPart,severity) {
    const part = bodyParts[bodyPart] || bodyParts.leg;
    const base = severity === "minor" ? 3 : severity === "moderate" ? 8 : severity === "severe" ? 14 : 0;
    const penalties = {};
    part.keys.forEach((key,index) => { penalties[key] = Math.max(1,base-(index>2?1:0)); });
    return penalties;
  }
  function newInjury(player,severity,bodyPart,requestedGames,createdGameId) {
    const level = severityLabels[severity] ? severity : "minor";
    const part = bodyParts[bodyPart] ? bodyPart : "leg";
    const randomGames = (min,max) => min + Math.floor(Math.random()*(max-min+1));
    const requested = Number(requestedGames) || 0;
    const rest = requested > 0 ? Math.round(requested) :
      level === "minor" ? randomGames(1,3) :
      level === "moderate" ? randomGames(5,14) :
      level === "severe" ? randomGames(50,82) : 0;
    const recovery = level === "minor" ? randomGames(2,4) : level === "moderate" ? randomGames(4,8) : 0;
    const requiredRest = level === "severe" ? Math.max(50,rest) : rest;
    return {
      id:"injury-"+Date.now()+"-"+Math.floor(Math.random()*100000),
      severity:level,label:severityLabels[level],bodyPart:part,bodyPartLabel:bodyParts[part].label,
      stage:"out",restGamesTotal:requiredRest,restGamesRemaining:requiredRest,
      recoveryGamesTotal:recovery,recoveryGamesRemaining:recovery,
      attributePenalties:injuryPenaltyMap(part,level),createdSeason:currentSeasonLabel(),
      createdGameId:createdGameId || null,manual:!createdGameId
    };
  }
  window.NBASimInjuryCanPlay = function(player) {
    const injury = player && player.injury;
    if (!injury) return true;
    if (injury.severity === "careerEnding" || injury.severity === "severe") return false;
    return injury.stage === "returning" && Number(injury.restGamesRemaining) <= 0;
  };
  window.NBASimInjuryIndicator = function(player) {
    const injury = player && player.injury;
    if (!injury) return "";
    const css = injury.severity === "minor" ? "minor" : injury.severity === "moderate" ? "moderate" : "severe";
    const remaining = Math.max(0,Number(injury.restGamesRemaining)||0)+Math.max(0,Number(injury.recoveryGamesRemaining)||0);
    const title = (injury.label || severityLabels[injury.severity] || "Blessure")+" · "+(injury.bodyPartLabel || "Blessure")+" · "+remaining+" match(s) avant guérison";
    return '<span class="mynba-injury-indicator injury-'+css+'" title="'+esc(title)+'" aria-label="'+esc(title)+'">●</span>';
  };
  window.NBASimBuildInjury = newInjury;

  function retireFromCareerEnding(player,injury) {
    if (!player) return;
    const code = String(player.team || "FA");
    if (typeof retired !== "undefined" && Array.isArray(retired) && !retired.some(x => String(x.id) === String(player.id))) {
      retired.push({
        id:player.id,name:player.name,team:code,pos:player.pos,height:player.height,age:player.age,
        seasons:Array.isArray(player.history)?player.history.length:0,pts:Number(player.pts)||0,
        retiredIn:currentSeasonLabel(),trophies:player.trophies||[],history:player.history||[],
        attributes:player.attributes||{},careerGames:player.careerGames||[],image:player.image||"",
        jerseyNumber:player.jerseyNumber||"",wingspan:player.wingspan||"",weight:player.weight||0,
        nationality:player.nationality||"",
        retirementReason:"Retraité "+currentSeasonLabel()+" — blessure très grave mettant fin à sa carrière",
        careerEndingInjury:injury||player.injury||null
      });
    }
    if (typeof players !== "undefined") players = players.filter(p => String(p.id) !== String(player.id));
    if (typeof starters !== "undefined" && Array.isArray(starters)) starters = starters.map(p => p && String(p.id) === String(player.id) ? null : p);
    if (typeof followedPlayerId !== "undefined" && String(followedPlayerId) === String(player.id)) followedPlayerId = null;
    currentTeams().forEach(t => { t.playerIds=(t.playerIds||[]).filter(id => String(id)!==String(player.id)); });
    if (typeof window.NBAMyNBARosterChanged === "function") window.NBAMyNBARosterChanged();
  }
  function processTeamInjuries(code,gameId) {
    allPlayers().filter(p => String(p.team)===String(code) && p.injury).forEach(player => {
      const injury=player.injury;
      if (injury.createdGameId && String(injury.createdGameId)===String(gameId)) return;
      if (injury.stage==="out") {
        injury.restGamesRemaining=Math.max(0,(Number(injury.restGamesRemaining)||0)-1);
        if (injury.restGamesRemaining<=0) {
          if (injury.severity==="severe") delete player.injury;
          else if (injury.severity==="careerEnding") retireFromCareerEnding(player,injury);
          else if (Number(injury.recoveryGamesRemaining)>0) injury.stage="returning";
          else delete player.injury;
        }
      } else if (injury.stage==="returning") {
        injury.recoveryGamesRemaining=Math.max(0,(Number(injury.recoveryGamesRemaining)||0)-1);
        if (injury.recoveryGamesRemaining<=0) delete player.injury;
      }
    });
  }
  function injuryEnabled() { return !window.NBASimSimulationSettings || window.NBASimSimulationSettings.injuriesEnabled !== false; }
  function teamCodeForGame(scheduleCode) {
    const cal=typeof seasonCalendar!=="undefined"?seasonCalendar:null;
    const entry=cal&&Array.isArray(cal.teams)?cal.teams.find(t=>String(t.scheduleCode||t.code)===String(scheduleCode)):null;
    return entry?String(entry.code):String(scheduleCode);
  }
  function applyNewInjuries(game) {
    if (!injuryEnabled() || !game || !game.playerBoxScores) return;
    [
      {schedule:game.home.code,lines:game.playerBoxScores.home||{}},
      {schedule:game.away.code,lines:game.playerBoxScores.away||{}}
    ].forEach(side => {
      const code=teamCodeForGame(side.schedule);
      allPlayers().filter(p=>String(p.team)===code).forEach(player => {
        if (player.injury || player.retired===true || String(player.team).toUpperCase()==="FA") return;
        const line=side.lines[String(player.id)],minutes=line?Number(line.minutes)||0:0;
        if (minutes<=0) return;
        const attrs=player.attributes||{};
        const ageFactor=1+Math.max(0,(Number(player.age)||25)-29)*.025;
        const durability=clamp(attrs.durability==null?65:attrs.durability,20,99);
        const risk=.0015*clamp(minutes/32,.25,1.5)*ageFactor*(1+(100-durability)*.002);
        if (Math.random()>=risk) return;
        const roll=Math.random();
        const severity=roll<.76?"minor":roll<.965?"moderate":roll<.999?"severe":"careerEnding";
        const parts=Object.keys(bodyParts);
        const injury=newInjury(player,severity,parts[Math.floor(Math.random()*parts.length)],null,game.id);
        player.injury=injury;
        if (severity==="careerEnding") retireFromCareerEnding(player,injury);
      });
    });
  }
  function installInjurySimulation() {
    const original=window.simulateScheduledGame;
    if (typeof original!=="function" || original.__mynbaInjuryWrapped) return;
    const wrapped=function(game) {
      const result=original.apply(this,arguments);
      if (result!==false && game && game.status==="completed") {
        try {
          processTeamInjuries(teamCodeForGame(game.home.code),game.id);
          processTeamInjuries(teamCodeForGame(game.away.code),game.id);
          applyNewInjuries(game);
          if (typeof window.NBAMyNBARosterChanged==="function") window.NBAMyNBARosterChanged();
        } catch(error) { console.error("Injury system:",error); }
      }
      return result;
    };
    wrapped.__mynbaInjuryWrapped=true;
    window.simulateScheduledGame=wrapped;
  }
  function findPlayoffGameRecord(gameId) {
    if (typeof playoffs === "undefined" || !playoffs) return null;
    const games = [];
    const readRounds = rounds => (rounds || []).forEach(round => (round.series || []).forEach(series => {
      (series.games || []).forEach(game => games.push(game));
    }));
    if (playoffs.confRounds) {
      readRounds(playoffs.confRounds.West);
      readRounds(playoffs.confRounds.East);
    }
    readRounds(playoffs.rounds);
    if (playoffs.final && Array.isArray(playoffs.final.games)) games.push(...playoffs.final.games);
    return games.find(game => String(game.id) === String(gameId)) || null;
  }
  function applyPlayoffInjuries(game) {
    if (!injuryEnabled() || !game) return;
    [game.home && game.home.code, game.away && game.away.code].filter(Boolean).forEach(scheduleCode => {
      const code = teamCodeForGame(scheduleCode);
      allPlayers().filter(player => {
        if (String(player.team) !== code || player.injury || player.retired === true || String(player.team).toUpperCase() === "FA") return false;
        if (typeof window.NBAMyNBAIsRostered === "function" && !window.NBAMyNBAIsRostered(player)) return false;
        return true;
      }).forEach(player => {
        const minutes = typeof window.NBAMyNBAMinutes === "function" ? Number(window.NBAMyNBAMinutes(player)) || 0 : Number(player.mpg) || 0;
        if (minutes <= 0) return;
        const attributes = player.attributes || {};
        const ageFactor = 1 + Math.max(0, (Number(player.age) || 25) - 29) * .025;
        const durability = clamp(attributes.durability == null ? 65 : attributes.durability, 20, 99);
        const risk = .0015 * clamp(minutes / 32, .25, 1.5) * ageFactor * (1 + (100 - durability) * .002);
        if (Math.random() >= risk) return;
        const roll = Math.random();
        const severity = roll < .76 ? "minor" : roll < .965 ? "moderate" : roll < .999 ? "severe" : "careerEnding";
        const parts = Object.keys(bodyParts);
        const injury = newInjury(player, severity, parts[Math.floor(Math.random() * parts.length)], null, game.id);
        player.injury = injury;
        if (severity === "careerEnding") retireFromCareerEnding(player, injury);
      });
    });
  }
  function installPlayoffInjurySimulation() {
    const original = window.simulateOnePlayoffGame;
    if (typeof original !== "function" || original.__mynbaPlayoffInjuryWrapped) return;
    const wrapped = function (gameId) {
      const result = original.apply(this, arguments);
      if (result !== false) {
        const game = findPlayoffGameRecord(gameId);
        if (game && game.completed) {
          try {
            processTeamInjuries(teamCodeForGame(game.home.code), game.id);
            processTeamInjuries(teamCodeForGame(game.away.code), game.id);
            applyPlayoffInjuries(game);
            if (typeof window.NBAMyNBARosterChanged === "function") window.NBAMyNBARosterChanged();
            if (typeof window.renderAll === "function") window.renderAll();
          } catch (error) {
            console.error("Playoff injury system:", error);
          }
        }
      }
      return result;
    };
    wrapped.__mynbaPlayoffInjuryWrapped = true;
    window.simulateOnePlayoffGame = wrapped;
  }

  function installOverallRatingInjuryPenalty() {
    const original=window.overallRating;
    if (typeof original!=="function" || original.__injuryPenaltyWrapped) return;
    const wrapped=function(player) {
      if (!player || !player.injury || !player.attributes) return original.apply(this,arguments);
      const injury=player.injury;
      const factor=injury.stage==="returning"
        ? clamp((Number(injury.recoveryGamesRemaining)||0)/Math.max(1,Number(injury.recoveryGamesTotal)||1),0,1)
        : 1;
      const copy=Object.assign({},player,{attributes:Object.assign({},player.attributes)});
      Object.keys(injury.attributePenalties||{}).forEach(key => {
        copy.attributes[key]=Math.max(0,(Number(copy.attributes[key])||0)-(Number(injury.attributePenalties[key])||0)*factor);
      });
      return original.call(this,copy);
    };
    wrapped.__injuryPenaltyWrapped=true;
    window.overallRating=wrapped;
  }

  function installPlayerEditor() {
    const section=$("editorSection");
    if (!section || $("mynbaPlayerMediaEditor")) return;
    const grid=section.querySelector(".editor-grid");
    if (!grid) return;
    const panel=document.createElement("div");
    panel.id="mynbaPlayerMediaEditor";
    panel.className="mynba-feature-card";
    panel.innerHTML =
      '<h3>Informations du joueur · Health & Media</h3>' +
      '<div class="editor-grid">' +
      '<label class="field">Numéro de maillot<input id="mynbaPlayerJersey" type="number" min="0" max="99" placeholder="0"></label>' +
      '<label class="field">Poids (kg)<input id="mynbaPlayerWeight" type="number" min="35" max="220" step="0.1" placeholder="—"></label>' +
      '<label class="field">Envergure (cm)<input id="mynbaPlayerWingspan" type="number" min="140" max="260" step="1" placeholder="—"></label>' +
      '<label class="field">Nationalité<input id="mynbaPlayerNationality" maxlength="48" placeholder="Canada, USA…"></label>' +
      '<label class="field">État de santé<select id="mynbaPlayerInjuryLevel"><option value="healthy">En santé</option><option value="minor">Blessure mineure</option><option value="moderate">Blessure moyenne</option><option value="severe">Blessure élevée</option><option value="careerEnding">Très élevée · Career ending</option></select></label>' +
      '<label class="field">Partie du corps<select id="mynbaPlayerInjuryPart">' +
      Object.entries(bodyParts).map(([key,part])=>'<option value="'+key+'">'+esc(part.label)+'</option>').join("") +
      '</select></label>' +
      '<label class="field">Matchs avant le retour<input id="mynbaPlayerInjuryGames" type="number" min="0" max="82" value="0"></label>' +
      '<label class="field">Portrait du joueur (.png / .jpg)<input id="mynbaPlayerImageFile" type="file" accept=".png,.jpg,image/png,image/jpeg"></label>' +
      '</div><div class="mynba-media-preview-row"><img id="mynbaPlayerImagePreview" alt="Aperçu du portrait" hidden><button type="button" class="btn" id="mynbaPlayerClearImage">Retirer l’image</button><span id="mynbaPlayerMediaStatus" role="status"></span></div>' +
      '<p class="muted">Les attributs diminuent temporairement selon la zone blessée. Après la convalescence et la rééducation, les valeurs originales reviennent automatiquement.</p>';
    grid.insertAdjacentElement("afterend",panel);

    const file=$("mynbaPlayerImageFile");
    file.addEventListener("change",async()=>{
      try {
        window.NBASimPendingPlayerImage=await readImageFile(file.files&&file.files[0]);
        const preview=$("mynbaPlayerImagePreview");
        preview.src=window.NBASimPendingPlayerImage;preview.hidden=!window.NBASimPendingPlayerImage;
        $("mynbaPlayerMediaStatus").textContent="Portrait prêt. Clique sur Créer ou Modifier pour l’enregistrer.";
      } catch(error) {
        file.value="";$("mynbaPlayerMediaStatus").textContent=error.message;
      }
    });
    $("mynbaPlayerClearImage").addEventListener("click",()=>{
      window.NBASimPendingPlayerImage="";
      file.value="";$("mynbaPlayerImagePreview").removeAttribute("src");$("mynbaPlayerImagePreview").hidden=true;
      $("mynbaPlayerMediaStatus").textContent="L’image sera retirée lors du prochain clic sur Modifier.";
    });
    const populate=player=>{
      $("mynbaPlayerJersey").value=player&&player.jerseyNumber!=null?player.jerseyNumber:"";
      $("mynbaPlayerWeight").value=player&&player.weight?player.weight:"";
      $("mynbaPlayerWingspan").value=player&&player.wingspan?player.wingspan:"";
      $("mynbaPlayerNationality").value=player&&player.nationality?player.nationality:"";
      $("mynbaPlayerInjuryLevel").value=player&&player.injury?player.injury.severity:"healthy";
      $("mynbaPlayerInjuryPart").value=player&&player.injury?player.injury.bodyPart||"leg":"leg";
      $("mynbaPlayerInjuryGames").value=player&&player.injury?Number(player.injury.restGamesRemaining)||0:0;
      window.NBASimPendingPlayerImage=undefined;
      const image=player?getPlayerImage(player):"";
      const preview=$("mynbaPlayerImagePreview");preview.src=image;preview.hidden=!image;
      $("mynbaPlayerMediaStatus").textContent="";$("mynbaPlayerImageFile").value="";
    };
    const selector=$("editPlayerSelect");
    if(selector)selector.addEventListener("change",()=>populate(findPlayer(selector.value)));
    const clear=$("clearEditor");if(clear)clear.addEventListener("click",()=>populate(null));
    ["createPlayer","updatePlayer"].forEach(id=>{
      const button=$(id);if(!button)return;
      button.addEventListener("click",()=>{
        const player=selector&&findPlayer(selector.value);if(!player)return;
        player.jerseyNumber=$("mynbaPlayerJersey").value===""?"":clamp($("mynbaPlayerJersey").value,0,99);
        player.weight=Number($("mynbaPlayerWeight").value)||0;
        player.wingspan=Number($("mynbaPlayerWingspan").value)||"";
        player.nationality=$("mynbaPlayerNationality").value.trim();
        if(window.NBASimPendingPlayerImage!==undefined)player.image=window.NBASimPendingPlayerImage;
        const severity=$("mynbaPlayerInjuryLevel").value;
        if(severity==="healthy")delete player.injury;
        else if(severity==="careerEnding") {
          const injury=newInjury(player,"careerEnding",$("mynbaPlayerInjuryPart").value,0,null);
          player.injury=injury;retireFromCareerEnding(player,injury);
          $("editorStatus").textContent=player.name+" a pris sa retraite après une blessure très grave.";
        } else {
          player.injury=newInjury(player,severity,$("mynbaPlayerInjuryPart").value,$("mynbaPlayerInjuryGames").value,null);
          player.injury.stage="out";
        }
        window.NBASimPendingPlayerImage=undefined;
        if(typeof window.renderAll==="function")window.renderAll();
        decorateDocument();
      });
    });
  }

  function installTeamMedia() {
    const pane=$("mynbaPaneDescription"),summary=$("mynbaTeamSummary");
    if(!pane||!summary)return;
    let controls=$("mynbaTeamMediaEditor");
    if(!controls) {
      controls=document.createElement("div");controls.id="mynbaTeamMediaEditor";controls.className="mynba-feature-card";
      controls.innerHTML =
        '<h3>Logo de l’équipe</h3><div class="mynba-media-preview-row"><img id="mynbaTeamImagePreview" alt="Aperçu du logo" hidden>' +
        '<label class="btn" for="mynbaTeamImageFile">Choisir le logo (.png / .jpg)</label><input id="mynbaTeamImageFile" type="file" accept=".png,.jpg,image/png,image/jpeg" hidden>' +
        '<button type="button" class="btn" id="mynbaTeamClearImage">Retirer le logo</button></div>' +
        '<p id="mynbaTeamImageStatus" role="status"></p><div id="mynbaTeamInjuryRoster" class="mynba-team-injury-roster"></div>';
      summary.insertAdjacentElement("afterend",controls);
      $("mynbaTeamImageFile").addEventListener("change",async()=>{
        const code=typeof window.NBAMyNBASelectedTeamCode==="function"?window.NBAMyNBASelectedTeamCode():"";
        try {
          const image=await readImageFile($("mynbaTeamImageFile").files&&$("mynbaTeamImageFile").files[0]);
          setTeamImage(code,image);$("mynbaTeamImageStatus").textContent="Logo de "+code+" enregistré.";updateTeamMedia();
        } catch(error) {$("mynbaTeamImageFile").value="";$("mynbaTeamImageStatus").textContent=error.message;}
      });
      $("mynbaTeamClearImage").addEventListener("click",()=>{
        const code=typeof window.NBAMyNBASelectedTeamCode==="function"?window.NBAMyNBASelectedTeamCode():"";
        setTeamImage(code,"");$("mynbaTeamImageFile").value="";$("mynbaTeamImageStatus").textContent="Logo retiré.";
      });
    }
    updateTeamMedia();
  }
  function updateTeamMedia() {
    const code=typeof window.NBAMyNBASelectedTeamCode==="function"?window.NBAMyNBASelectedTeamCode():"";
    if(!code)return;
    const img=getTeamImage(code),preview=$("mynbaTeamImagePreview");
    if(preview){preview.src=img;preview.hidden=!img;}
    const codeElement=$("mynbaTeamSummary")&&$("mynbaTeamSummary").querySelector(".mynba-team-code");
    if(codeElement&&img) {
      const existing=codeElement.querySelector(".mynba-team-logo");
      if(!existing || existing.getAttribute("src")!==img)codeElement.innerHTML=teamImageMarkup(code,44);
    } else if(codeElement && codeElement.textContent!==code)codeElement.textContent=code;
    const rosterNode=$("mynbaTeamInjuryRoster");
    if(rosterNode) {
      const teamPlayers=allPlayers().filter(p=>String(p.team)===String(code)).sort((a,b)=>(Number(b.mpg)||0)-(Number(a.mpg)||0));
      const signature=JSON.stringify(teamPlayers.map(p=>[p.id,p.name,p.team,p.image?String(p.image).length:0,p.injury&&p.injury.severity,p.injury&&p.injury.bodyPart,p.injury&&p.injury.restGamesRemaining,p.injury&&p.injury.recoveryGamesRemaining,typeof window.overallRating==="function"?Math.round(window.overallRating(p)):0]));
      if(rosterNode.dataset.signature!==signature) {
        rosterNode.dataset.signature=signature;
        rosterNode.innerHTML='<h3>Effectif · santé et portraits</h3>'+(teamPlayers.length?teamPlayers.map(p=>{
          const injury=p.injury;
          const status=injury?'<small class="mynba-injury-detail">'+esc(injury.label||severityLabels[injury.severity]||"Blessure")+' · '+esc(injury.bodyPartLabel||"")+' · '+(Number(injury.restGamesRemaining)||0)+' matchs avant retour</small>':'<small class="mynba-injury-detail">En santé</small>';
          return '<div class="mynba-team-injury-player">'+playerPortraitMarkup(p,38)+window.NBASimInjuryIndicator(p)+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.pos||"")+' · GÉN '+(typeof window.overallRating==="function"?Math.round(window.overallRating(p)):"—")+'</small>'+status+'</span></div>';
        }).join(""):'<p class="muted">Aucun joueur dans cette équipe.</p>');
      }
    }
  }

  function isBannerExcluded(element) {
    return !!(element&&element.closest(
      ".mynba-player-banner,.fullscreen-overlay,.fullscreen-award,.award,.award-reveal,"+
      ".mynba-modal-backdrop,.mynba-modal,.series-modal-card,.mynba-boxscore,#playoffBoxScore,"+
      "#awardsBox,#awardsSection,#historyTable,#seasonAwardsTransitionBox,#seasonAwardsScreen,"+
      "#mynbaPaneDescription,#mynbaTeamScreen,#mynbaTeamInjuryRoster,.mynba-ai-trade-recap,#mynbaTeamMediaEditor,"+
      "select,option,textarea,input,script,style"
    ));
  }
  function decorateNames(root) {
    if(!root||!document.createTreeWalker)return;
    const names=new Map(allKnownPlayers().map(p=>[String(p.name||"").trim(),p]).filter(entry=>entry[0]));
    if(!names.size)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let node;
    while((node=walker.nextNode())) {
      const name=String(node.nodeValue||"").trim(),player=names.get(name),parent=node.parentElement;
      if(!player||!parent||parent.closest("[data-player-id]")||parent.closest("#mynbaTeamInjuryRoster,select,option,input,textarea,script,style"))continue;
      nodes.push({node,player});
    }
    nodes.forEach(({node,player})=>{
      if(!node.parentNode)return;
      const token=document.createElement("span");token.className="mynba-player-name-token";token.dataset.playerId=String(player.id);token.textContent=node.nodeValue;
      node.parentNode.replaceChild(token,node);
    });
  }
  function decoratePortraits(root) {
    if(!root||!document.createTreeWalker)return;
    const byName=new Map(allKnownPlayers().map(p=>[String(p.name||"").trim(),p]).filter(entry=>entry[0]));
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let node;
    while((node=walker.nextNode())) {
      const player=byName.get(String(node.nodeValue||"").trim()),parent=node.parentElement;
      if(!player||!getPlayerImage(player)||!parent)continue;
      if(parent.closest(".mynba-player-banner,#mynbaTeamInjuryRoster,select,option,input,textarea,script,style"))continue;
      if(parent.querySelector(".mynba-player-portrait"))continue;
      const cell=parent.closest("td");if(cell&&cell.querySelector(".mynba-player-portrait"))continue;
      nodes.push({node,player});
    }
    nodes.forEach(({node,player})=>{
      if(!node.parentNode)return;
      const img=document.createElement("img");img.className="mynba-player-portrait";img.alt="";img.setAttribute("aria-hidden","true");img.width=28;img.height=28;img.src=getPlayerImage(player);
      node.parentNode.insertBefore(img,node);
    });
  }
  function decorateTeams(root) {
    if(!root||!document.createTreeWalker)return;
    const codes=new Set(Object.keys(teamSettings()).concat(currentTeams().map(t=>String(t.code))));
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let node;
    while((node=walker.nextNode())) {
      const raw=String(node.nodeValue||""),trimmed=raw.trim(),parent=node.parentElement;
      if(!trimmed||!parent||parent.closest("select,option,input,textarea,script,style"))continue;
      const code=[...codes].sort((a,b)=>b.length-a.length).find(value=>{
        if(!getTeamImage(value))return false;
        return trimmed===value || trimmed.startsWith(value) && /^[\\s·•\\-–—:]/.test(trimmed.slice(value.length));
      });
      if(!code)continue;
      if(parent.querySelector('.mynba-team-logo[data-team-code="'+code.replace(/"/g,'')+'"]'))continue;
      nodes.push({node,code,raw,trimmed});
    }
    nodes.forEach(({node,code,raw,trimmed})=>{
      if(!node.parentNode)return;
      const img=document.createElement("img");img.className="mynba-team-logo";img.dataset.teamCode=code;img.alt=code;img.width=24;img.height=24;img.src=getTeamImage(code);
      const remainder=trimmed.slice(code.length);
      node.parentNode.insertBefore(img,node);
      node.nodeValue=remainder;
    });
  }
  function decorateDocument() {
    decoratePortraits(document.body);
    decorateTeams(document.body);
    decorateNames(document.body);
    updateTeamMedia();
  }

  function ensureBanner() {
    if(banner)return;
    banner=document.createElement("aside");banner.className="mynba-player-banner";banner.id="mynbaPlayerBanner";banner.hidden=true;banner.setAttribute("role","tooltip");
    document.body.appendChild(banner);
  }
  function playerBannerHtml(player) {
    const image=getPlayerImage(player),initials=String(player.name||"?").split(/\s+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase();
    const team=String(player.team||"—"),attributes=player.attributes||{},weight=Number(player.weight)?Number(player.weight)+" kg":"—";
    const height=Number(player.height)?Number(player.height)+" cm":"—",wingspan=Number(player.wingspan)?Number(player.wingspan)+" cm":"—";
    const jersey=player.jerseyNumber!==""&&player.jerseyNumber!=null?"#"+player.jerseyNumber:"N° —";
    const injury=player.injury?'<p class="mynba-banner-injury">'+esc(player.injury.label||"Blessure")+' · '+esc(player.injury.bodyPartLabel||"")+'</p>':"";
    const parts=String(player.name||"").trim().split(/\s+/),first=parts.shift()||"",last=parts.join(" ");
    return '<div class="mynba-player-banner-card"><div class="mynba-banner-photo">'+(image?'<img src="'+esc(image)+'" alt="'+esc(player.name)+'">':'<span>'+esc(initials)+'</span>')+
      '</div><div class="mynba-banner-content"><div class="mynba-banner-top"><div><div class="mynba-banner-kicker">'+esc(team)+' · '+esc(player.pos||"—")+'</div><h3>'+esc(first)+' <b>'+esc(last)+'</b></h3><small>'+esc(jersey)+' · GÉN '+(typeof window.overallRating==="function"?Math.round(window.overallRating(player)):"—")+' · POT '+(Number(attributes.potential)||"—")+'</small></div><div class="mynba-banner-team">'+teamImageMarkup(team,36)+'</div></div>'+
      '<div class="mynba-banner-grid"><span><small>Taille</small><b>'+esc(height)+'</b></span><span><small>Envergure</small><b>'+esc(wingspan)+'</b></span><span><small>Âge</small><b>'+(Number(player.age)||"—")+'</b></span><span><small>Poids</small><b>'+esc(weight)+'</b></span><span><small>Nationalité</small><b>'+esc(player.nationality||"—")+'</b></span></div>'+injury+'</div></div>';
  }
  function positionBanner(event) {
    const rect=banner.getBoundingClientRect(),gap=14;
    let x=event.clientX+gap,y=event.clientY+gap;
    if(x+rect.width>window.innerWidth-8)x=Math.max(8,event.clientX-rect.width-gap);
    if(y+rect.height>window.innerHeight-8)y=Math.max(8,event.clientY-rect.height-gap);
    banner.style.left=clamp(x,8,Math.max(8,window.innerWidth-rect.width-8))+"px";
    banner.style.top=clamp(y,8,Math.max(8,window.innerHeight-rect.height-8))+"px";
  }
  function showBanner(player,event) {
    if(!player||!event||isBannerExcluded(event.target))return;
    ensureBanner();bannerPlayerId=String(player.id);banner.innerHTML=playerBannerHtml(player);banner.hidden=false;positionBanner(event);
  }
  function hideBanner() { if(banner)banner.hidden=true;bannerPlayerId=null; }
  function installBannerEvents() {
    document.addEventListener("pointerover",event=>{
      if(event.pointerType==="touch")return;
      const token=event.target.closest&&event.target.closest("[data-player-id]");
      if(!token||isBannerExcluded(token))return;
      const player=findPlayer(token.dataset.playerId);if(player)showBanner(player,event);
    });
    document.addEventListener("pointermove",event=>{if(banner&&!banner.hidden)positionBanner(event);});
    document.addEventListener("pointerout",event=>{
      if(!banner||banner.hidden)return;
      const from=event.target.closest&&event.target.closest("[data-player-id]");
      const to=event.relatedTarget&&event.relatedTarget.closest&&event.relatedTarget.closest("[data-player-id]");
      if(from&&(!to||from!==to)&&!banner.contains(event.relatedTarget))hideBanner();
    });
    document.addEventListener("pointerdown",event=>{
      if(event.pointerType!=="touch")return;
      const token=event.target.closest&&event.target.closest("[data-player-id]");
      if(!token||isBannerExcluded(token)){if(!banner||!banner.contains(event.target))hideBanner();return;}
      const player=findPlayer(token.dataset.playerId);if(!player)return;
      if(!banner||banner.hidden||bannerPlayerId!==String(player.id))showBanner(player,event);else hideBanner();
    });
    document.addEventListener("keydown",event=>{if(event.key==="Escape")hideBanner();});
    window.addEventListener("resize",hideBanner);window.addEventListener("scroll",hideBanner,true);
  }

  function installDemoDatabaseTools() {
    const section=$("editorSection");if(!section||$("mynbaDemoDatabaseTools"))return;
    const panel=document.createElement("div");panel.id="mynbaDemoDatabaseTools";panel.className="mynba-feature-card";
    panel.innerHTML='<h3>Base de données de démonstration</h3><p>Modifie les joueurs avec le créateur ci-dessus, puis enregistre la base actuelle pour que le bouton Démo recharge tes changements lors des prochaines visites.</p><div class="actions"><button type="button" class="btn primary" id="mynbaSaveDemoDatabase">Enregistrer la base démo</button><button type="button" class="btn" id="mynbaResetDemoDatabase">Restaurer la démo originale</button></div><p id="mynbaDemoDatabaseStatus" role="status"></p>';
    section.appendChild(panel);
    $("mynbaSaveDemoDatabase").onclick=()=>{
      try {
        localStorage.setItem(DEMO_DB_KEY,JSON.stringify({players:allPlayers(),customTeams:currentTeams(),teamSettings:teamSettings()}));
        $("mynbaDemoDatabaseStatus").textContent="Base de démonstration personnalisée enregistrée ("+allPlayers().length+" joueurs).";
      } catch(_) {$("mynbaDemoDatabaseStatus").textContent="Enregistrement impossible : la base et les images dépassent l’espace disponible du navigateur. Utilise aussi une sauvegarde JSON.";}
    };
    $("mynbaResetDemoDatabase").onclick=()=>{
      localStorage.removeItem(DEMO_DB_KEY);$("mynbaDemoDatabaseStatus").textContent="La démo originale sera rechargée au prochain clic sur Démo.";
    };
    const demo=$("demo");
    if(demo&&typeof demo.onclick==="function"&&!demo.__mynbaDemoDatabaseWrapped) {
      const original=demo.onclick;
      demo.onclick=function() {
        const saved=readStorage(DEMO_DB_KEY,null);
        if(!saved||!Array.isArray(saved.players))return original.apply(this,arguments);
        if(typeof window.load==="function") {
          window.load(saved.players,"Base démo personnalisée chargée : "+saved.players.length+" joueurs.",{customTeams:Array.isArray(saved.customTeams)?saved.customTeams:[],seasonYear:2025,phase:"idle"});
          const settings=teamSettings();Object.keys(settings).forEach(key=>delete settings[key]);Object.assign(settings,saved.teamSettings||{});
          window.NBAMyNBATeamSettings=settings;
          if(typeof window.NBAMyNBARefreshAfterAITrade==="function")window.NBAMyNBARefreshAfterAITrade();
        }
      };
      demo.__mynbaDemoDatabaseWrapped=true;
    }
  }

  function installCss() {
    if($("mynbaInjuryMediaStyles"))return;
    const style=document.createElement("style");style.id="mynbaInjuryMediaStyles";
    style.textContent=
      ".mynba-player-portrait{display:inline-block;vertical-align:middle;object-fit:cover;border-radius:7px;margin-right:7px;background:#17263c;border:1px solid #405879;flex:none}"+
      ".mynba-team-logo{display:inline-block;vertical-align:middle;object-fit:contain;border-radius:6px;margin-right:6px;flex:none}"+
      ".mynba-injury-indicator{display:inline-block;font-size:13px;line-height:1;margin-right:7px;vertical-align:middle;text-shadow:0 0 8px currentColor}"+
      ".mynba-injury-indicator.injury-minor{color:#edcf42}.mynba-injury-indicator.injury-moderate{color:#ee8c36}.mynba-injury-indicator.injury-severe{color:#ef4b4b}"+
      ".mynba-player-name-token{cursor:help;text-decoration:underline;text-decoration-style:dotted;text-decoration-color:#8299b7;text-underline-offset:3px}.mynba-player-name-token:hover{color:#b9d7ff}"+
      ".mynba-player-banner{position:fixed;z-index:200000;max-width:min(520px,calc(100vw - 16px));width:min(520px,calc(100vw - 16px));pointer-events:none;border:1px solid #526d92;border-radius:15px;background:linear-gradient(135deg,#13233b,#081321);color:#f4f7ff;box-shadow:0 18px 56px #000b;overflow:hidden}"+
      ".mynba-player-banner[hidden]{display:none!important}.mynba-player-banner-card{display:grid;grid-template-columns:112px minmax(0,1fr);gap:14px;padding:14px}"+
      ".mynba-banner-photo{width:112px;height:132px;border-radius:11px;background:#1e3350;display:grid;place-items:center;overflow:hidden;font-size:34px;font-weight:1000;color:#b9d7ff}.mynba-banner-photo img{width:100%;height:100%;object-fit:cover}"+
      ".mynba-banner-content{min-width:0}.mynba-banner-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.mynba-banner-kicker{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#99b7df;font-weight:900}"+
      ".mynba-banner-top h3{font-size:19px;margin:4px 0;overflow-wrap:anywhere}.mynba-banner-top small{font-size:11px;color:#c6d4e8}.mynba-banner-team{flex:none}"+
      ".mynba-banner-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.mynba-banner-grid span{background:#1b2b43;border:1px solid #304663;border-radius:8px;padding:6px;min-width:0}"+
      ".mynba-banner-grid small{display:block;font-size:9px;text-transform:uppercase;color:#9eb2cc}.mynba-banner-grid b{display:block;font-size:12px;overflow-wrap:anywhere}.mynba-banner-injury{margin:9px 0 0;color:#ffba78;font-size:11px;font-weight:800}"+
      ".mynba-media-preview-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}.mynba-media-preview-row img{max-width:100px;max-height:100px;object-fit:contain;border-radius:9px;border:1px solid #516985;background:#101c2d}.mynba-media-preview-row span{font-size:12px;color:#aebdd5}"+
      ".mynba-team-injury-roster{margin-top:15px;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px}.mynba-team-injury-player{display:flex;align-items:center;gap:6px;padding:8px;border:1px solid #344967;border-radius:9px;background:#101c2d;min-width:0}.mynba-team-injury-player>span{display:grid;min-width:0}.mynba-team-injury-player small{font-size:10px;color:#aebdd5;overflow-wrap:anywhere}.mynba-injury-detail{color:#f1b86a!important}"+
      ".retirement-reason{display:block;color:#e77878;font-size:11px;margin-top:3px}.mynba-injury-setting{display:flex;align-items:flex-start;gap:10px;padding:10px 0}.mynba-injury-setting input{width:19px;height:19px;accent-color:#5e9ef5}.mynba-injury-setting small{display:block;color:#9eacc3;margin-top:4px}"+
      "@media(max-width:520px){.mynba-player-banner-card{grid-template-columns:82px minmax(0,1fr);gap:9px;padding:10px}.mynba-banner-photo{width:82px;height:104px}.mynba-banner-top h3{font-size:16px}.mynba-banner-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}";
    document.head.appendChild(style);
  }

  function install() {
    installCss();installInjurySimulation();installPlayoffInjurySimulation();installOverallRatingInjuryPenalty();
    installPlayerEditor();installTeamMedia();installDemoDatabaseTools();installBannerEvents();decorateDocument();
    if(typeof window.NBAMyNBARefreshAfterAITrade==="function")window.NBAMyNBARefreshAfterAITrade();
    const observer=new MutationObserver(records=>{
      let changed=false;records.forEach(record=>{if(record.addedNodes&&record.addedNodes.length)changed=true;});
      if(changed&&Date.now()-lastDecorate>80){lastDecorate=Date.now();installTeamMedia();decorateDocument();}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("mynba:save-load-result",event=>{
      if(event.detail&&event.detail.ok){installOverallRatingInjuryPenalty();decorateDocument();}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();