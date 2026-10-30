/* Full-screen MyNBA navigation, roster management and box-score views. */
(function () {
"use strict";
var $ = function (id) { return document.getElementById(id); };
var state = { menu:false, active:null, selected:0, team:"LAL", rosterOrder:{}, tendencies:{}, teamSettings:{}, coachSettings:{}, gameplans:{}, tradeHistory:[], rosterCache:null, rosterPane:"roster", rosterPlayerId:null, leaderTab:"teams", leaderTeamCode:null, leaderPlayerId:null, teamLeaderSort:"strength", playerLeaderSort:"pts" };
var cats = [
["roster","View Roster","👥","Effectif · 15 joueurs maximum"],
["team","View Team","🏀","Description, gameplan et coach"],
["selection","Team Selection","🛡️","Toutes les équipes NBA et personnalisées"],
["teamCreator","Team Creator","🏟️","Créer, modifier et supprimer des équipes"],
["creator","Player Creator","✍️","Créer et modifier les joueurs"],
["leaders","League Leaders","📊","Classement, puissance et statistiques"],
["career","Career Mode","⭐","Joueur suivi ou contrôlé"],
["load","Load Save","📂","Importer une sauvegarde JSON"],
["save","Save State","💾","Exporter toute la dynastie"],
["awards","Awards & History","🏅","Récompenses et palmarès"],
["database","Player Database","📋","Données et statistiques détaillées"]
];
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function teams(){var a=(typeof nbaTeams!=="undefined"?nbaTeams:[]).map(function(t){var x=state.teamSettings[t[0]]||{};return {code:t[0],name:x.name||t[1],conference:x.conference||t[2],city:x.city||"",custom:false};});var b=(typeof customTeams!=="undefined"?customTeams:[]).map(function(t){var x=state.teamSettings[t.code]||{};return {code:t.code,name:x.name||t.name,conference:x.conference||t.conference,city:x.city||t.city||"",custom:true,id:t.id};});return a.concat(b);}
function team(code){return teams().find(function(t){return t.code===code;})||null;}
function order(code){if(!state.rosterOrder[code])state.rosterOrder[code]=[];return state.rosterOrder[code];}
function roster(code){var a=(typeof players!=="undefined"?players:[]).filter(function(p){return p.team===code;});var o=order(code);a.sort(function(x,y){var ix=o.indexOf(String(x.id)),iy=o.indexOf(String(y.id));if(ix>=0||iy>=0)return (ix<0?999:ix)-(iy<0?999:iy);return (Number(y.mpg)||0)-(Number(x.mpg)||0)||(typeof overallRating==="function"?overallRating(y)-overallRating(x):y.pts-x.pts);});return a.slice(0,15);}
function activeIds(){if(state.rosterCache)return state.rosterCache;var s=new Set();teams().forEach(function(t){roster(t.code).forEach(function(p){s.add(String(p.id));});});state.rosterCache=s;return s;}
function selectedTeam(){return team(state.team)||teams()[0]||null;}
function screen(id,title,desc){var el=document.createElement("section");el.className="mynba-screen";el.id=id;el.hidden=true;el.innerHTML='<header class="mynba-screen-header"><div><div class="mynba-kicker">NBA SIM LAB · MYNBA</div><h1>'+esc(title)+'</h1><p>'+esc(desc||"")+'</p></div><button class="btn mynba-back" data-back>← Retour</button></header><div class="mynba-screen-body"></div>';document.body.appendChild(el);el.querySelector("[data-back]").onclick=back;return el;}
var screens={};
function build(){
 var main=document.querySelector("main"),top=main.querySelector(".top"),actions=top.querySelector(".actions"),oldTeamSection=$("teamSection"),oldSeasonSection=$("seasonSection"),oldDataSection=$("dataSection");var originalExportButton=$("export"),originalExportSave=$("exportSave"),originalImportFile=$("importFile");
 main.classList.add("mynba-main");
 actions.innerHTML='<button class="btn primary" id="mynbaOpenMenu">☰ Menu / Navigation</button><button class="btn mynba-mobile-back" id="mynbaMobileBack" hidden>← Retour</button>';
 var oldNav=$("mobileNav");if(oldNav)oldNav.remove();
 var home=document.createElement("section");home.id="mynbaHome";home.className="mynba-home";home.innerHTML='<div class="mynba-home-title"><div><div class="mynba-kicker">MODE DYNASTIE</div><h2>Calendrier de la saison</h2><p>Choisis une équipe et clique sur une tuile pour simuler sa prochaine rencontre.</p></div><div class="phase" id="mynbaSeasonBadge">Saison NBA</div></div><div id="mynbaHomeToolbar" class="schedule-toolbar"></div><div id="mynbaHomeSchedule"></div><p class="mynba-home-hint">Entrée : menu · Flèches : navigation · Backspace : retour</p>';top.after(home);
 var toolbar=main.querySelector("#seasonSection .schedule-toolbar"),cal=$("seasonCalendarView");if(toolbar)$("mynbaHomeToolbar").append.apply($("mynbaHomeToolbar"),Array.from(toolbar.childNodes));if(cal)$("mynbaHomeSchedule").appendChild(cal);
 var menu=document.createElement("div");menu.id="mynbaMenu";menu.className="mynba-menu";menu.hidden=true;menu.innerHTML='<div class="mynba-menu-shell"><div class="mynba-kicker">NBA SIM LAB 26</div><h1>MYNBA</h1><p>Flèches directionnelles pour choisir une catégorie, puis Entrée pour l’ouvrir.</p><div class="mynba-category-grid" id="mynbaCategoryGrid"></div><div class="mynba-menu-footer"><span>ENTRÉE · OUVRIR</span><span>BACKSPACE · RETOUR</span><button class="btn" id="mynbaCloseMenu">Retour au calendrier</button></div></div>';document.body.appendChild(menu);
 screens.roster=screen("mynbaRosterScreen","VIEW ROSTER","Maximum 15 joueurs actifs");
 screens.team=screen("mynbaTeamScreen","VIEW TEAM","Description, gameplan et coach settings");
 screens.selection=screen("mynbaSelectionScreen","TEAM SELECTION","Choisis une équipe parmi toute la ligue.");
 screens.teamCreator=screen("mynbaTeamCreatorScreen","TEAM CREATOR","Créer, modifier et gérer tes équipes personnalisées.");
 screens.creator=screen("mynbaCreatorScreen","PLAYER CREATOR","Créer ou modifier des joueurs");
 screens.leaders=screen("mynbaLeadersScreen","LEAGUE LEADERS","Classements et statistiques");
 screens.playoffs=screen("mynbaPlayoffsScreen","PLAYOFFS","Tableau et box scores");
 screens.career=screen("mynbaCareerScreen","CAREER MODE","Profil et carrière");
 screens.load=screen("mynbaLoadScreen","LOAD SAVE","Un JSON invalide ne modifiera pas la partie.");
 screens.save=screen("mynbaSaveScreen","SAVE STATE","Exporter la dynastie et ses réglages");
 screens.awards=screen("mynbaAwardsScreen","AWARDS & HISTORY","Récompenses et palmarès");
 screens.database=screen("mynbaDatabaseScreen","PLAYER DATABASE","Données et statistiques par saison");
 function move(id,key){var el=$(id);if(el)screens[key].querySelector(".mynba-screen-body").appendChild(el);}
 move("teamSection","teamCreator");move("editorSection","creator");move("seasonSection","leaders");move("playerStatsSection","database");move("awardsSection","awards");move("playoffsSection","playoffs");move("careerSection","career");move("dataSection","load");

 var rb=screens.roster.querySelector(".mynba-screen-body");
 rb.innerHTML='<div class="mynba-roster-viewer" data-player-banner-host>'+
   '<div id="mynbaRosterBannerMount" class="mynba-roster-banner-mount" data-player-banner-mount></div>'+
   '<div class="mynba-roster-header-row"><label class="field">Équipe<select id="mynbaRosterTeam"></select></label><strong id="mynbaRosterCount">0 / 15 joueurs</strong></div>'+
   '<div class="mynba-roster-tabs"><button class="btn primary" data-roster-tab="roster">Roster</button><button class="btn" data-roster-tab="mentorship">Mentorat</button><button class="btn" data-roster-tab="freeAgency">Free Agency</button></div>'+
   '<section id="mynbaRosterPaneRoster" class="mynba-roster-pane"><div id="mynbaRosterTable" class="tablewrap" data-player-banner-surface></div></section>'+
   '<section id="mynbaRosterPaneMentorship" class="mynba-roster-pane" hidden>'+
     '<div class="mynba-feature-card" id="mynbaMentorshipCard"><h2>Mentorat · Vétéran → jeune joueur</h2><p>Associe un joueur de 30 ans ou plus à un joueur de moins de 25 ans. Le potentiel du jeune joueur progressera légèrement après une saison complète.</p><div class="editor-grid"><label class="field">Jeune joueur / rookie<select id="mynbaMentorRookie"></select></label><label class="field">Mentor vétéran<select id="mynbaMentorVeteran"></select></label></div><div class="controls"><button class="btn primary" id="mynbaStartMentorship" type="button">Lancer le mentorat</button></div><div id="mynbaMentorshipPreview" aria-live="polite"><p>Sélectionne les deux joueurs pour voir les gains estimés et la durée.</p></div><p id="mynbaMentorshipStatus" role="status"></p><div id="mynbaMentorshipActive"></div></div>'+
     '<div class="mynba-feature-card"><h2>Joueurs de l’équipe · Mentorat</h2><p>Sélectionne un rookie ou un vétéran dans la liste pour afficher sa bannière.</p><div id="mynbaMentorshipList" class="mynba-player-leader-list" data-player-banner-surface></div></div>'+
   '</section>'+
   '<section id="mynbaRosterPaneFreeAgency" class="mynba-roster-pane" hidden>'+
     '<div class="mynba-feature-card"><h2>Free Agency</h2><p>Tous les joueurs libres disponibles. Sélectionne un joueur pour consulter sa bannière, puis signe-le avec le contrôle ci-dessous.</p><div class="controls"><label class="field" style="flex:1">Joueur libre<select id="mynbaFreeAgent"></select></label><button class="btn primary" id="mynbaSignPlayer">Signer</button></div><p id="mynbaRosterStatus"></p><div id="mynbaFreeAgencyList" class="mynba-player-leader-list" data-player-banner-surface></div></div>'+
   '</section></div>';
 var tb=screens.team.querySelector(".mynba-screen-body");tb.innerHTML='<div class="mynba-team-tabs"><button class="btn primary" data-team-tab="description">Team Description</button><button class="btn" data-team-tab="gameplan">Gameplan</button><button class="btn" data-team-tab="coach">Coach Settings</button><button class="btn" data-team-tab="trades">Trades</button></div><div id="mynbaPaneDescription" class="mynba-team-pane"><div id="mynbaTeamSummary" class="mynba-selected-team"></div><div class="editor-grid"><label class="field">Nom<input id="mynbaTeamName"></label><label class="field">Code<input id="mynbaTeamCode" maxlength="5"></label><label class="field">Conférence<select id="mynbaTeamConf"><option value="East">Est</option><option value="West">Ouest</option></select></label><label class="field">Ville<input id="mynbaTeamCity"></label></div><div class="actions"><button class="btn primary" id="mynbaSaveDescription">Enregistrer</button><button class="btn" id="mynbaGoRoster">View Roster</button></div><div id="mynbaTeamBuilder"></div><p id="mynbaTeamStatus"></p></div><div id="mynbaPaneGameplan" class="mynba-team-pane" hidden><p>Minutes de jeu prévues pour chaque joueur (0 à 48 minutes).</p><div id="mynbaMinutesEditor" class="tablewrap"></div><button class="btn primary" id="mynbaSaveGameplan">Enregistrer gameplan</button><p id="mynbaGameplanStatus"></p></div><div id="mynbaPaneCoach" class="mynba-team-pane" hidden><div id="mynbaCoachEditor" class="mynba-settings-grid"></div><button class="btn primary" id="mynbaSaveCoach">Enregistrer coach settings</button><p id="mynbaCoachStatus"></p></div><div id="mynbaPaneTrades" class="mynba-team-pane" hidden><div class="mynba-feature-card"><h2>Proposer un échange</h2><p>Choisis une équipe adverse, puis les joueurs que tu offres et ceux que tu demandes. Les valeurs tiennent compte du général, des statistiques de la saison précédente, de l’âge et des besoins de l’effectif.</p><label class="field">Équipe avec laquelle négocier<select id="mynbaTradeTarget"></select></label><div class="editor-grid"><div><h3>Joueurs que tu offres</h3><div id="mynbaTradeOutgoing"></div></div><div><h3>Joueurs demandés</h3><div id="mynbaTradeIncoming"></div></div></div><div class="actions"><button class="btn primary" id="mynbaSubmitTrade">Envoyer l’offre</button><button class="btn" id="mynbaClearTrade">Effacer la sélection</button></div><p id="mynbaTradeStatus" role="status"></p><div id="mynbaTradeAnalysis"></div></div><div class="mynba-feature-card"><h2>Historique des transactions</h2><div id="mynbaTradeHistory"></div></div></div>';var oldTeam=oldTeamSection;if(oldTeam){oldTeam.querySelector("h2").textContent="Création d’équipe personnalisée";oldTeam.querySelector("p").textContent="Choisis cinq joueurs, puis crée ou modifie une équipe personnalisée."; }
 var sel=screens.selection.querySelector(".mynba-screen-body");sel.innerHTML='<div class="mynba-team-select-tools"><label class="field">Rechercher<input id="mynbaTeamSearch" placeholder="Lakers, BOS…"></label><label class="field">Conférence<select id="mynbaTeamFilter"><option value="ALL">Toute la ligue</option><option value="East">Est</option><option value="West">Ouest</option></select></label></div><div class="mynba-team-grid" id="mynbaTeamGrid"></div>';
 var ld=screens.load.querySelector(".mynba-screen-body");ld.innerHTML='<div class="mynba-feature-card"><h2>Importer une sauvegarde</h2><p>Tableau de joueurs JSON ou sauvegarde NBA Sim Lab complète.</p><label class="btn primary" for="importFile">Choisir JSON</label><span id="mynbaLoadStatus" role="status">Aucun fichier chargé.</span><div id="mynbaLoadError" class="mynba-error" hidden></div></div><div id="mynbaDataMount"></div>';if(oldDataSection)$("mynbaDataMount").appendChild(oldDataSection);
 var sv=screens.save.querySelector(".mynba-screen-body");sv.innerHTML='<div class="mynba-feature-card"><h2>Sauvegarder la dynastie</h2><p>Inclut joueurs, équipes, saisons, effectifs et réglages MyNBA.</p><button class="btn primary" id="mynbaExportSave">💾 Télécharger JSON</button><button class="btn" id="mynbaExportStats">Exporter stats .txt</button><p id="mynbaSaveStatus"></p></div>';if(originalExportButton){originalExportButton.hidden=true;sv.appendChild(originalExportButton);}if(originalExportSave){originalExportSave.hidden=true;sv.appendChild(originalExportSave);}if(originalImportFile)ld.appendChild(originalImportFile);

 var leaders=screens.leaders.querySelector(".mynba-screen-body");
 leaders.innerHTML='<div class="mynba-subnav"><button class="btn primary" data-leader-tab="teams">Team Leaders</button><button class="btn" data-leader-tab="players">Player Leaders</button><button class="btn" data-leader-tab="stats">Season Stats</button></div>'+
   '<div id="mynbaLeaderTeams"><div id="mynbaTeamLeaderCards"></div></div>'+
   '<div id="mynbaLeaderPlayers" hidden></div>'+
   '<div id="mynbaLeaderStats" hidden><div id="mynbaLeaderStatsSeasonMount"></div></div>';
 if(oldSeasonSection) {
   var seasonTitle=oldSeasonSection.querySelector("h2");
   if(seasonTitle)seasonTitle.textContent="Saison régulière · 82 matchs";
   $("mynbaLeaderStatsSeasonMount").appendChild(oldSeasonSection);
 }
 var db=screens.database.querySelector(".mynba-screen-body");var playerStatsPanel=$("playerStatsSection");if(playerStatsPanel)db.appendChild(playerStatsPanel);
 var grid=$("mynbaCategoryGrid");cats.forEach(function(c,i){var b=document.createElement("button");b.type="button";b.className="mynba-category-card";b.dataset.index=i;b.innerHTML='<span class="mynba-category-icon">'+c[2]+'</span><span class="mynba-category-title">'+c[1]+'</span><span class="mynba-category-desc">'+c[3]+'</span>';b.onclick=function(){if(window.matchMedia("(max-width:850px)").matches){select(i);b.dataset.taps=String(Number(b.dataset.taps||0)+1);if(Number(b.dataset.taps)>=2){openCategory(i);b.dataset.taps="0";}return;}if(state.selected!==i)select(i);else openCategory(i);};grid.appendChild(b);});
 $("mynbaOpenMenu").onclick=openMenu;$("mynbaCloseMenu").onclick=closeMenu;$("mynbaMobileBack").onclick=back;
 document.querySelectorAll("[data-team-tab]").forEach(function(b){b.onclick=function(){teamTab(b.dataset.teamTab);};});
 document.querySelectorAll("[data-leader-tab]").forEach(function(b){b.onclick=function(){leaderTab(b.dataset.leaderTab);};});
 document.querySelectorAll("[data-roster-tab]").forEach(function(b){b.onclick=function(){rosterTab(b.dataset.rosterTab);};});
}
function select(i){var count=cats.length+($("mynbaSimulationSettingsCard")?1:0);state.selected=(i+count)%count;document.querySelectorAll(".mynba-category-card").forEach(function(b,n){b.classList.toggle("selected",n===state.selected);});}
function openMenu(){if(typeof window.NBASimHidePlayerBanner==="function")window.NBASimHidePlayerBanner();state.menu=true;state.active=null;$("mynbaMenu").hidden=false;document.querySelectorAll(".mynba-screen").forEach(function(s){s.hidden=true;});$("mynbaMobileBack").hidden=true;select(state.selected);}
function closeMenu(){if(typeof window.NBASimHidePlayerBanner==="function")window.NBASimHidePlayerBanner();state.menu=false;$("mynbaMenu").hidden=true;document.querySelectorAll(".mynba-screen").forEach(function(s){s.hidden=true;});$("mynbaMobileBack").hidden=true;}
function openCategory(i){if(typeof window.NBASimHidePlayerBanner==="function")window.NBASimHidePlayerBanner();select(i);if(i===cats.length&&$("mynbaSimulationSettingsCard")){$("mynbaSimulationSettingsCard").click();return;}state.active=cats[i][0];state.menu=false;$("mynbaMenu").hidden=true;document.querySelectorAll(".mynba-screen").forEach(function(s){s.hidden=true;});screens[state.active].hidden=false;$("mynbaMobileBack").hidden=false;renderCategory(state.active);}
function back(){if(state.active){state.active=null;openMenu();}else if(state.menu)closeMenu();else openMenu();}
function teamTab(k){["description","gameplan","coach","trades"].forEach(function(n){$("mynbaPane"+n[0].toUpperCase()+n.slice(1)).hidden=n!==k;var b=document.querySelector('[data-team-tab="'+n+'"]');if(b)b.classList.toggle("primary",n===k);});if(k==="description")renderTeamDescription();if(k==="gameplan")renderGameplan();if(k==="coach")renderCoach();if(k==="trades")renderTrades();}
function leaderTab(k){
 state.leaderTab=k;
 ["teams","players","stats"].forEach(function(n){
  var pane=$("mynbaLeader"+n[0].toUpperCase()+n.slice(1));if(pane)pane.hidden=n!==k;
  var button=document.querySelector('[data-leader-tab="'+n+'"]');if(button)button.classList.toggle("primary",n===k);
 });
 if(k!=="players"&&typeof window.NBASimHidePlayerBanner==="function")window.NBASimHidePlayerBanner();
 if(k==="teams")renderTeamLeaders();
 if(k==="players")renderPlayerLeaders();
 if(k==="stats"&&typeof renderStandings==="function")renderStandings();
}
function rosterTab(k){
 state.rosterPane=k;
 ["roster","mentorship","freeAgency"].forEach(function(n){
  var pane=$("mynbaRosterPane"+n[0].toUpperCase()+n.slice(1));if(pane)pane.hidden=n!==k;
  var button=document.querySelector('[data-roster-tab="'+n+'"]');if(button)button.classList.toggle("primary",n===k);
 });
 var list=k==="freeAgency"?freeAgents():roster(state.team);
 var selected=list.find(function(p){return String(p.id)===String(state.rosterPlayerId);})||list[0];
 if(selected){
  state.rosterPlayerId=selected.id;
  var host=k==="roster"?"mynbaRosterTable":k==="mentorship"?"mynbaMentorshipList":"mynbaFreeAgencyList";
  var row=rosterRowForId(host,selected.id);
  if(typeof window.NBASimSelectPlayerBanner==="function")window.NBASimSelectPlayerBanner(selected,$("mynbaRosterBannerMount"),row);
 } else if(typeof window.NBASimHidePlayerBanner==="function")window.NBASimHidePlayerBanner();
}
function freeAgents(){
 return (typeof players!=="undefined"?players:[]).filter(function(p){return /^(FA|FREE_AGENT)$/i.test(String(p.team||""))&&!p.retired&&!p.isRetired;}).sort(function(a,b){
  return (typeof overallRating==="function"?overallRating(b)-overallRating(a):(Number(b.mpg)||0)-(Number(a.mpg)||0))||String(a.name).localeCompare(String(b.name),"fr");
 });
}
function rosterRowForId(hostId,id){
 var host=$(hostId);if(!host)return null;
 return Array.from(host.querySelectorAll("[data-player-id]")).find(function(row){return String(row.dataset.playerId)===String(id);})||null;
}
function playerBannerRow(player,sub){
 var image=typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(player,36):"";
 var injury=typeof window.NBASimInjuryIndicator==="function"?window.NBASimInjuryIndicator(player):"";
 return '<div class="mynba-player-leader-row" data-player-id="'+esc(player.id)+'"><span class="mynba-player-leader-portrait">'+image+'</span><span class="mynba-player-leader-name"><b>'+esc(player.name)+'</b><small>'+esc(player.pos||"—")+' · '+esc(player.team||"—")+' · '+esc(sub||"")+'</small></span><b class="mynba-player-leader-ovr">'+(typeof overallRating==="function"?Math.round(overallRating(player)):"—")+'</b>'+injury+'</div>';
}
function teamLeaderBannerMarkup(t){
 if(!t)return '<p class="muted">Aucune équipe disponible.</p>';
 return '<div class="mynba-team-leader-banner"><div class="mynba-team-leader-logo">'+(typeof window.NBASimTeamImageMarkup==="function"?window.NBASimTeamImageMarkup(t.code,96):esc(t.code))+'</div><div class="mynba-team-leader-info"><small>TEAM PROFILE · '+esc(t.conference==="East"?"EAST":t.conference==="West"?"WEST":"NBA")+'</small><h2>'+esc(t.name)+'</h2><div class="mynba-team-leader-meta"><b>'+esc(t.code)+'</b><span>'+esc(t.city||"Ville non définie")+'</span><span>'+esc(t.conference==="East"?"Conférence Est":t.conference==="West"?"Conférence Ouest":"Conférence non définie")+'</span></div><strong class="mynba-team-leader-record">'+t.wins+'–'+t.losses+'</strong><small>VICTOIRES – DÉFAITES</small></div></div>';
}
function renderTeamLeaders(){
 var pane=$("mynbaTeamLeaderCards");if(!pane)return;
 var definitions=teams(),results=typeof seasonResults!=="undefined"&&Array.isArray(seasonResults)?seasonResults:[];
 var rows=definitions.map(function(t){
  var result=results.find(function(r){return String(r.code)===String(t.code)||String(r.scheduleCode)===String(t.code);})||{};
  var estimated=typeof strengthRating==="function"?Number(strengthRating(t.code))/100:.5;
  return Object.assign({},t,{wins:Number(result.wins)||0,losses:Number(result.losses)||0,winPct:Number(result.winPct)||0,strength:Number(result.strength)||estimated||.5,ppg:Number(result.ppg)||0,apg:Number(result.apg)||0,rpg:Number(result.rpg)||0,spg:Number(result.spg)||0,bpg:Number(result.bpg)||0});
 });
 var key=state.teamLeaderSort||"strength";
 rows.sort(function(a,b){
  if(key==="name-az")return String(a.name).localeCompare(String(b.name),"fr");
  if(key==="name-za")return String(b.name).localeCompare(String(a.name),"fr");
  if(key==="losses")return a.losses-b.losses;
  if(key==="wins")return b.wins-a.wins;
  return (Number(b[key])||0)-(Number(a[key])||0);
 });
 var selected=rows.find(function(t){return String(t.code)===String(state.leaderTeamCode);})||rows[0];
 if(selected)state.leaderTeamCode=selected.code;
 pane.innerHTML='<div class="mynba-leader-viewer">'+
  '<div id="mynbaTeamLeaderBannerMount">'+teamLeaderBannerMarkup(selected)+'</div>'+
  '<div class="mynba-leader-list-toolbar"><h3>Team Leaders</h3><label class="field">Trier par <select id="mynbaTeamLeaderSort"><option value="strength">Puissance estimée</option><option value="winPct">Pourcentage de victoires</option><option value="wins">Victoires</option><option value="losses">Défaites (moins → plus)</option><option value="ppg">Points par match</option><option value="apg">Passes par match</option><option value="rpg">Rebonds par match</option><option value="spg">Interceptions par match</option><option value="bpg">Contres par match</option><option value="name-az">Nom A–Z</option><option value="name-za">Nom Z–A</option></select></label></div>'+
  '<div id="mynbaTeamLeaderList" class="mynba-team-leader-list">'+rows.map(function(t,index){
   return '<button type="button" class="mynba-team-leader-row '+(selected&&String(t.code)===String(selected.code)?"selected":"")+'" data-leader-team="'+esc(t.code)+'"><span class="mynba-team-leader-rank">'+(index+1)+'</span><span class="mynba-team-leader-row-logo">'+(typeof window.NBASimTeamImageMarkup==="function"?window.NBASimTeamImageMarkup(t.code,34):esc(t.code))+'</span><span class="mynba-team-leader-row-name"><b>'+esc(t.name)+'</b><small>'+esc(t.code)+' · '+esc(t.city||"")+' · '+esc(t.conference==="East"?"Est":"Ouest")+'</small></span><b class="mynba-team-leader-row-record">'+t.wins+'–'+t.losses+'</b><b class="mynba-team-leader-row-power">'+Math.round(t.strength*100)+' POW</b></button>';
  }).join("")+'</div></div>';
 var sort=$("mynbaTeamLeaderSort");if(sort){sort.value=key;sort.onchange=function(){state.teamLeaderSort=sort.value;renderTeamLeaders();};}
 var updateSelection=function(row){
  var picked=rows.find(function(t){return String(t.code)===String(row.dataset.leaderTeam);});if(!picked)return;
  state.leaderTeamCode=picked.code;
  $("mynbaTeamLeaderBannerMount").innerHTML=teamLeaderBannerMarkup(picked);
  $("mynbaTeamLeaderList").querySelectorAll("[data-leader-team]").forEach(function(el){el.classList.toggle("selected",el===row);});
 };
 $("mynbaTeamLeaderList").querySelectorAll("[data-leader-team]").forEach(function(row){row.onclick=function(){updateSelection(row);};row.onpointerenter=function(){updateSelection(row);};});
}
function renderPlayerLeaders(){
 var pane=$("mynbaLeaderPlayers");if(!pane)return;
 var actual=window.NBASimActualPlayerStats||{},boxes=window.NBASimActualBoxScores||{};
 var arr=(typeof players!=="undefined"?players:[]).filter(function(p){return activeIds().has(String(p.id));}).map(function(p){
  var a=actual[String(p.id)]||{},gp=Number(a.gp)||0;
  var lines=Object.values(boxes).map(function(box){return {id:box.id,line:box.players&&box.players[String(p.id)]};}).filter(function(x){return x.line;});
  var best=lines.reduce(function(current,item){return !current||Number(item.line.pts||0)>Number(current.line.pts||0)?item:current;},null);
  return {p:p,gp:gp,pts:gp?(Number(a.pts)||0)/gp:0,ast:gp?(Number(a.ast)||0)/gp:0,reb:gp?(Number(a.reb)||0)/gp:0,stl:gp?(Number(a.stl)||0)/gp:0,blk:gp?(Number(a.blk)||0)/gp:0,totalPts:Number(a.pts)||0,totalAst:Number(a.ast)||0,totalReb:Number(a.reb)||0,totalStl:Number(a.stl)||0,totalBlk:Number(a.blk)||0,bestGamePts:best?Number(best.line.pts)||0:0,bestGameId:best?best.id:""};
 });
 var key=state.playerLeaderSort||"pts";
 arr.sort(function(a,b){
  if(key==="name")return String(a.p.name).localeCompare(String(b.p.name),"fr");
  if(key==="ovr")return overallRating(b.p)-overallRating(a.p);
  return (Number(b[key])||0)-(Number(a[key])||0)||overallRating(b.p)-overallRating(a.p);
 });
 var selected=arr.find(function(x){return String(x.p.id)===String(state.leaderPlayerId);})||arr[0];
 if(selected)state.leaderPlayerId=selected.p.id;
 pane.innerHTML='<div class="mynba-leader-viewer" data-player-banner-host><div id="mynbaPlayerBannerMount" class="mynba-leader-player-banner-mount" data-player-banner-mount></div><div class="mynba-leader-list-toolbar"><h3>Player Leaders</h3><label class="field">Trier par <select id="mynbaPlayerLeaderSort"><option value="pts">Points par match</option><option value="ast">Passes par match</option><option value="reb">Rebonds par match</option><option value="stl">Interceptions par match</option><option value="blk">Contres par match</option><option value="totalPts">Points cumulés</option><option value="ovr">Puissance</option><option value="name">Nom A–Z</option></select></label></div><div id="mynbaPlayerLeaderList" class="mynba-player-leader-list" data-player-banner-surface">'+arr.map(function(x,index){
  return '<div class="mynba-player-leader-row '+(selected&&String(x.p.id)===String(selected.p.id)?"selected":"")+'" data-player-id="'+esc(x.p.id)+'" data-leader-player="'+esc(x.p.id)+'"><span class="mynba-player-leader-rank">'+(index+1)+'</span><span class="mynba-player-leader-portrait">'+(typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(x.p,36):"")+'</span><span class="mynba-player-leader-name"><b>'+esc(x.p.name)+'</b><small>'+esc(x.p.pos||"—")+' · '+esc(x.p.team||"—")+' · '+x.gp+' MJ</small></span><span class="mynba-player-leader-stats"><b>'+x.pts.toFixed(1)+' PPG</b><small>'+x.ast.toFixed(1)+' AST · '+x.reb.toFixed(1)+' REB · '+x.stl.toFixed(1)+' STL · '+x.blk.toFixed(1)+' BLK</small></span><b class="mynba-player-leader-ovr">'+overallRating(x.p)+'</b></div>';
 }).join("")+'</div></div>';
 var sort=$("mynbaPlayerLeaderSort");if(sort){sort.value=key;sort.onchange=function(){state.playerLeaderSort=sort.value;renderPlayerLeaders();};}
 var mount=$("mynbaPlayerBannerMount"),initialRow=rosterRowForId("mynbaPlayerLeaderList",selected&&selected.p.id);
 if(selected&&typeof window.NBASimSelectPlayerBanner==="function")window.NBASimSelectPlayerBanner(selected.p,mount,initialRow);
 $("mynbaPlayerLeaderList").querySelectorAll("[data-leader-player]").forEach(function(row){
  var selectRow=function(){state.leaderPlayerId=row.dataset.leaderPlayer;var p=players.find(function(x){return String(x.id)===String(state.leaderPlayerId);});$("mynbaPlayerLeaderList").querySelectorAll(".mynba-player-leader-row").forEach(function(el){el.classList.toggle("selected",el===row);});if(p&&typeof window.NBASimSelectPlayerBanner==="function")window.NBASimSelectPlayerBanner(p,mount,row);};
  row.onclick=selectRow;row.onpointerenter=selectRow;
 });
}
function renderCategory(k){
 if(k==="roster")renderRoster();
 if(k==="team")renderTeamDescription();
 if(k==="selection")renderTeamSelection();
 if(k==="teamCreator"&&typeof render==="function")render();
 if(k==="leaders"){if(typeof renderStandings==="function")renderStandings();renderTeamLeaders();renderPlayerLeaders();leaderTab(state.leaderTab||"teams");}
 if(k==="playoffs"&&typeof renderPlayoffs==="function")renderPlayoffs();
 if(k==="database"&&typeof render==="function")render();
}
function renderTeamSelection(){var q=($("mynbaTeamSearch").value||"").toLowerCase(),conf=$("mynbaTeamFilter").value;$("mynbaTeamGrid").innerHTML=teams().filter(function(t){return(conf==="ALL"||t.conference===conf)&&((t.name+" "+t.code).toLowerCase().includes(q));}).map(function(t){return '<button class="mynba-team-card '+(t.code===state.team?"selected":"")+'" data-team-code="'+esc(t.code)+'"><span class="mynba-team-code">'+esc(t.code)+'</span><strong>'+esc(t.name)+'</strong><small>'+esc(t.conference)+(t.custom?" · CUSTOM":"")+'</small><b>GÉN. '+strengthRating(t.code)+'</b></button>';}).join("")||'<p>Aucune équipe trouvée.</p>';$("mynbaTeamGrid").querySelectorAll("[data-team-code]").forEach(function(b){b.onclick=function(){state.team=b.dataset.teamCode;if($("scheduleTeamFilter")){$("scheduleTeamFilter").value=state.team;if(typeof renderSeasonCalendar==="function")renderSeasonCalendar();}renderTeamSelection();renderRoster();renderTeamDescription();};});}
function strengthRating(code){var a=roster(code);return a.length&&typeof overallRating==="function"?Math.round(a.reduce(function(s,p){return s+overallRating(p);},0)/a.length):"—";}
function mentorshipGain(rookie,mentor){
 var mentorOvr=typeof overallRating==="function"?overallRating(mentor):60;
 var mentorPotential=Number(mentor&&mentor.attributes&&mentor.attributes.potential)||mentorOvr;
 var power=mentorOvr*.55+mentorPotential*.45;
 return Math.max(1,Math.min(4,Math.round((power-58)/13)));
}
function mentorshipOverallGain(rookie,mentor){
 var mentorOvr=typeof overallRating==="function"?overallRating(mentor):60;
 var mentorPotential=Number(mentor&&mentor.attributes&&mentor.attributes.potential)||mentorOvr;
 return Math.max(1,Math.min(3,Math.round(((mentorOvr*.65+mentorPotential*.35)-55)/15)));
}
function renderMentorship(t,a){
 var rookieSelect=$("mynbaMentorRookie"),mentorSelect=$("mynbaMentorVeteran");
 if(!rookieSelect||!mentorSelect)return;
 var young=a.filter(function(p){return Number(p.age)<25;}),veterans=a.filter(function(p){return Number(p.age)>=30;});
 rookieSelect.innerHTML='<option value="">— Choisir un joueur de moins de 25 ans —</option>'+young.map(function(p){return '<option value="'+esc(p.id)+'" '+(p.mentorship?'disabled':'')+'>'+esc(p.name)+' · '+Number(p.age)+' ans · POT '+Number(p.attributes&&p.attributes.potential||0)+(p.mentorship?' · déjà mentoré':'')+'</option>';}).join("");
 mentorSelect.innerHTML='<option value="">— Choisir un vétéran (30+) —</option>'+veterans.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+Number(p.age)+' ans · GÉN '+(typeof overallRating==="function"?overallRating(p):"—")+' · POT '+Number(p.attributes&&p.attributes.potential||0)+'</option>';}).join("");
 var preview=$("mynbaMentorshipPreview"),status=$("mynbaMentorshipStatus"),active=$("mynbaMentorshipActive");
 function updatePreview(){
  var rookie=young.find(function(p){return String(p.id)===rookieSelect.value;}),mentor=veterans.find(function(p){return String(p.id)===mentorSelect.value;});
  if(!preview)return;
  if(!rookie||!mentor){preview.innerHTML='<p>Sélectionne les deux joueurs pour voir les gains estimés et la durée.</p>';return;}
  var gain=mentorshipGain(rookie,mentor),overallGain=mentorshipOverallGain(rookie,mentor),potential=Number(rookie.attributes&&rookie.attributes.potential)||60,ovr=typeof overallRating==="function"?overallRating(rookie):60;
  preview.innerHTML='<div class="mynba-setting"><b>Gains estimés après une saison</b><p>Général : '+ovr+' → environ '+Math.min(Number(rookie.attributes&&rookie.attributes.potential)||99,ovr+overallGain)+' (+'+overallGain+')</p><p>Potentiel : '+potential+' → '+Math.min(99,potential+gain)+' (+'+Math.min(gain,99-potential)+')</p><p>Durée : 1 saison complète.</p><p>Puissance du mentor : GÉN '+(typeof overallRating==="function"?overallRating(mentor):"—")+' · POT '+(Number(mentor.attributes&&mentor.attributes.potential)||"—")+'. Un mentor plus fort transmet un bonus supérieur.</p></div>';
 }
 rookieSelect.onchange=updatePreview;mentorSelect.onchange=updatePreview;
 var startButton=$("mynbaStartMentorship");
 if(startButton)startButton.onclick=function(){
  var rookie=young.find(function(p){return String(p.id)===rookieSelect.value;}),mentor=veterans.find(function(p){return String(p.id)===mentorSelect.value;});
  if(!rookie||!mentor){if(status)status.textContent="Choisis un jeune joueur et un vétéran de cette équipe.";return;}
  if(rookie.mentorship){if(status)status.textContent="Ce joueur suit déjà un mentorat.";return;}
  var gain=mentorshipGain(rookie,mentor),overallGain=mentorshipOverallGain(rookie,mentor);
  rookie.mentorship={mentorId:mentor.id,mentorName:mentor.name,startedSeason:Number(seasonYear)||0,ageAtStart:Number(rookie.age),durationSeasons:1,potentialGain:gain,overallGain:overallGain};
  if(status)status.textContent="Mentorat lancé : "+rookie.name+" avec "+mentor.name+". Bonus prévu : +"+overallGain+" GÉN. et +"+gain+" POT. à la progression de fin de saison.";
  renderMentorship(t,a);
 };
 if(active){
  var pairs=a.filter(function(p){return p.mentorship;});
  active.innerHTML=pairs.length?'<h3>Mentorats en cours</h3>'+pairs.map(function(p){return '<p><b>'+esc(p.name)+'</b> ← '+esc(p.mentorship.mentorName||"Vétéran")+' · +'+Number(p.mentorship.overallGain||1)+' GÉN. / +'+Number(p.mentorship.potentialGain||1)+' POT. · '+Math.max(0,1-Math.max(0,(Number(seasonYear)||0)-Number(p.mentorship.startedSeason||0)))+' saison restante(s)</p>';}).join(""):'<p class="muted">Aucun mentorat en cours dans cet effectif.</p>';
 }
}
function installMentorshipProgress(){
 if(typeof window.progress!=="function"||window.progress.__mynbaMentorship)return;
 var old=window.progress;
 var wrapped=function(p){
  var result=old.apply(this,arguments),m=p&&p.mentorship;
  if(m&&Number(m.ageAtStart)<25){
   var attributes=p.attributes||(p.attributes={}),potential=Number(attributes.potential)||60,gain=Number(m.potentialGain)||1,overallGain=Number(m.overallGain)||1;
   attributes.potential=Math.max(40,Math.min(99,potential+gain));
   var mentor=(typeof players!=="undefined"?players:[]).find(function(x){return String(x.id)===String(m.mentorId);});
   var keys=["finishing","layup","dunk","closeShot","midRange","threePoint","freeThrow","shotIQ","ballHandle","passing","playmaking","offensiveIQ","perimeterDefense","interiorDefense","steal","block","defensiveIQ","defensiveRebound","offensiveRebound","speed","acceleration","agility","strength","vertical","stamina"];
   var ranked=keys.filter(function(k){return attributes[k]!=null;}).sort(function(a,b){
    var mentorA=mentor&&mentor.attributes?Number(mentor.attributes[a])||50:70,mentorB=mentor&&mentor.attributes?Number(mentor.attributes[b])||50:70;
    return (mentorB-(Number(attributes[b])||50))-(mentorA-(Number(attributes[a])||50));
   });
   ranked.slice(0,3+overallGain).forEach(function(k){
    var mentorValue=mentor&&mentor.attributes?Number(mentor.attributes[k])||50:75,current=Number(attributes[k])||50;
    var transmitted=Math.max(1,Math.min(3,Math.round((mentorValue-current)/40)||1));
    attributes[k]=Math.min(99,current+transmitted);
   });
   Object.keys(attributes).forEach(function(k){if(k!=="potential")attributes[k]=Math.max(20,Math.min(99,Math.round(Number(attributes[k])||50)));});
  }
  if(m)delete p.mentorship;
  return result;
 };
 wrapped.__mynbaMentorship=true;window.progress=wrapped;
}function renderRoster(){
 var t=selectedTeam();if(!t)return;
 $("mynbaRosterTeam").innerHTML=teams().map(function(x){return '<option value="'+esc(x.code)+'" '+(x.code===t.code?"selected":"")+'>'+esc(x.code+" — "+x.name)+'</option>';}).join("");
 $("mynbaRosterTeam").onchange=function(){state.team=this.value;state.rosterCache=null;state.rosterPlayerId=null;renderRoster();renderTeamDescription();};
 var a=roster(t.code);$("mynbaRosterCount").textContent=a.length+" / 15 joueurs";
 $("mynbaRosterTable").innerHTML='<table><thead><tr><th>#</th><th>Joueur</th><th>POS</th><th>GÉN</th><th>MIN</th><th>Shot tendency</th><th>Touch tendency</th><th></th></tr></thead><tbody>'+a.map(function(p,i){
  var te=state.tendencies[p.id]||{},gp=state.gameplans[t.code]&&state.gameplans[t.code][p.id]||{};
  return '<tr class="mynba-player-row" data-player-id="'+esc(p.id)+'"><td>'+(i+1)+'</td><td><b>'+(typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(p,30):"")+(typeof window.NBASimInjuryIndicator==="function"?window.NBASimInjuryIndicator(p):"")+'<span class="mynba-player-row-name">'+esc(p.name)+'</span></b></td><td>'+esc(p.pos)+'</td><td>'+overallRating(p)+(Number(p._mynbaOverallDelta)?' <span class="mynba-development-delta" style="font-weight:900;color:'+(p._mynbaOverallDelta>0?'#39d98a':'#ff4545')+'">'+(p._mynbaOverallDelta>0?'↑ +':'↓ ')+p._mynbaOverallDelta+'</span>':'')+'</td><td><input class="mynba-mini-input" type="number" min="0" max="48" value="'+esc(gp.minutes==null?defaultRotationMinutes(p):gp.minutes)+'" data-minutes="'+esc(p.id)+'"></td><td><input type="range" min="0" max="100" value="'+(te.shot==null?50:te.shot)+'" data-tendency="shot" data-player="'+esc(p.id)+'"><span>'+(te.shot==null?50:te.shot)+'</span></td><td><input type="range" min="0" max="100" value="'+(te.touch==null?50:te.touch)+'" data-tendency="touch" data-player="'+esc(p.id)+'"><span>'+(te.touch==null?50:te.touch)+'</span></td><td><button class="btn" data-release="'+esc(p.id)+'">Libérer</button></td></tr>';
 }).join("")+'</tbody></table>';
 $("mynbaRosterTable").querySelectorAll("[data-tendency]").forEach(function(i){i.oninput=function(){state.tendencies[i.dataset.player]=state.tendencies[i.dataset.player]||{shot:50,touch:50};state.tendencies[i.dataset.player][i.dataset.tendency]=Number(i.value);i.nextElementSibling.textContent=i.value;};});
 $("mynbaRosterTable").querySelectorAll("[data-minutes]").forEach(function(i){i.onchange=function(){state.gameplans[t.code]=state.gameplans[t.code]||{};state.gameplans[t.code][i.dataset.minutes]={minutes:Math.max(0,Math.min(48,Number(i.value)||0))};};});
 $("mynbaRosterTable").querySelectorAll("[data-release]").forEach(function(b){b.onclick=function(){releasePlayer(b.dataset.release);};});
 renderMentorship(t,a);
 var mentorRows=a.slice();
 $("mynbaMentorshipList").innerHTML=mentorRows.map(function(p){
  var label=Number(p.age)<25?(p.mentorship?"ROOKIE · MENTORÉ":"ROOKIE · ÉLIGIBLE"):Number(p.age)>=30?"VÉTÉRAN · MENTOR":"JOUEUR · NON ÉLIGIBLE";
  var mentor=p.mentorship?" · "+(p.mentorship.mentorName||"Mentor associé"):"";
  return playerBannerRow(p,label+mentor);
 }).join("")||'<p class="muted">Aucun rookie ou vétéran admissible dans cet effectif.</p>';
 var fa=freeAgents();
 $("mynbaFreeAgent").innerHTML='<option value="">— Choisir —</option>'+fa.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name+" · GÉN "+overallRating(p))+'</option>';}).join("");
 $("mynbaFreeAgencyList").innerHTML=fa.map(function(p){return playerBannerRow(p,Number(p.age)+" ans · GÉN "+overallRating(p));}).join("")||'<p class="muted">Aucun agent libre disponible.</p>';
 $("mynbaRosterTable").querySelectorAll("[data-player-id]").forEach(function(row){
  var selectRow=function(event){
   if(event&&event.target&&event.target.closest("button,input,select"))return;
   var p=players.find(function(x){return String(x.id)===String(row.dataset.playerId);});
   if(p){state.rosterPlayerId=p.id;row.parentNode.querySelectorAll(".mynba-player-row").forEach(function(el){el.classList.toggle("selected",el===row);});if(typeof window.NBASimSelectPlayerBanner==="function")window.NBASimSelectPlayerBanner(p,$("mynbaRosterBannerMount"),row);}
  };
  row.onclick=selectRow;row.onpointerenter=selectRow;
 });
 ["mynbaMentorshipList","mynbaFreeAgencyList"].forEach(function(hostId){
  $(hostId).querySelectorAll("[data-player-id]").forEach(function(row){
   var selectRow=function(){
    var p=players.find(function(x){return String(x.id)===String(row.dataset.playerId);});
    if(p){state.rosterPlayerId=p.id;$(hostId).querySelectorAll(".mynba-player-leader-row").forEach(function(el){el.classList.toggle("selected",el===row);});if(typeof window.NBASimSelectPlayerBanner==="function")window.NBASimSelectPlayerBanner(p,$("mynbaRosterBannerMount"),row);}
   };
   row.onclick=selectRow;row.onpointerenter=selectRow;
  });
 });
 rosterTab(state.rosterPane||"roster");
}
function releasePlayer(id){var p=players.find(function(x){return String(x.id)===String(id);});if(!p)return;state.rosterCache=null;var oldCode=p.team;p.team="FA";if(typeof customTeams!=="undefined")customTeams.forEach(function(t){t.playerIds=(t.playerIds||[]).filter(function(x){return String(x)!==String(id);});});Object.keys(state.rosterOrder).forEach(function(k){state.rosterOrder[k]=state.rosterOrder[k].filter(function(x){return x!==String(id);});});renderRoster();if(typeof renderAll==="function")renderAll();}
function signPlayer(){var p=players.find(function(x){return String(x.id)===$("mynbaFreeAgent").value;}),t=selectedTeam();if(!p||!t)return;if(roster(t.code).length>=15){$("mynbaRosterStatus").textContent="Effectif complet : 15 joueurs. Libère quelqu’un avant de signer.";return;}p.team=t.code;state.rosterCache=null;order(t.code).push(String(p.id));if(t.custom){var ct=customTeams.find(function(x){return x.code===t.code;});if(ct&&!ct.playerIds.includes(p.id))ct.playerIds.push(p.id);}$("mynbaRosterStatus").textContent=p.name+" a signé avec "+t.name+"." ;renderRoster();renderTeamSelection();if(typeof renderAll==="function")renderAll();}
function renderTeamDescription(){var t=selectedTeam();if(!t)return;var x=state.teamSettings[t.code]||{};$("mynbaTeamSummary").innerHTML='<span class="mynba-team-code">'+esc(t.code)+'</span><div><h2>'+esc(x.name||t.name)+'</h2><p>'+esc(x.city||"")+' · '+esc(t.conference)+' · '+roster(t.code).length+'/15</p></div>';$("mynbaTeamName").value=x.name||t.name;$("mynbaTeamCode").value=x.code||t.code;$("mynbaTeamConf").value=x.conference||t.conference;$("mynbaTeamCity").value=x.city||"";}
function saveTeamDescription(){var t=selectedTeam(),name=$("mynbaTeamName").value.trim(),code=$("mynbaTeamCode").value.trim().toUpperCase(),conf=$("mynbaTeamConf").value,city=$("mynbaTeamCity").value.trim();if(!t||!name||!/^[A-Z0-9]{2,5}$/.test(code)){$("mynbaTeamStatus").textContent="Nom requis et code de 2 à 5 caractères.";return;}if(code!==t.code&&teams().some(function(x){return x.code===code;})){$("mynbaTeamStatus").textContent="Code déjà utilisé.";return;}if(!t.custom&&code!==t.code){$("mynbaTeamStatus").textContent="Le code d’une franchise NBA officielle ne peut pas changer.";return;}state.teamSettings[t.code]=Object.assign({},state.teamSettings[t.code]||{},{name:name,code:code,conference:conf,city:city});state.rosterCache=null;window.NBAMyNBATeamSettings=state.teamSettings;if(t.custom){var ct=customTeams.find(function(x){return x.code===t.code;});if(ct){ct.name=name;ct.code=code;ct.conference=conf;ct.city=city;players.forEach(function(p){if(p.team===t.code)p.team=code;});state.team=code;}}var scheduleMessage=typeof refreshCustomTeamSeasonSchedule==="function"?refreshCustomTeamSeasonSchedule():"Les réglages seront appliqués au prochain calendrier."; $("mynbaTeamStatus").textContent="Description enregistrée. "+scheduleMessage;renderTeamDescription();renderTeamSelection();renderAll();}
function defaultRotationMinutes(p){var ovr=typeof overallRating==="function"?Number(overallRating(p))||60:60;var attrs=p&&p.attributes||{},pos=String(p&&p.pos||"").toUpperCase();var playmaking=(Number(attrs.playmaking)||50)/100,defense=(Number(attrs.perimeterDefense)||50)/100;var base=12+(ovr-50)*.62+(pos==="PG"?playmaking*1.5:0)+(pos==="C"?defense*.6:0);return Math.round(Math.max(6,Math.min(38,base)));}function renderGameplan(){var t=selectedTeam();if(!t)return;state.gameplans[t.code]=state.gameplans[t.code]||{};$("mynbaMinutesEditor").innerHTML='<table><thead><tr><th>Joueur</th><th>Minutes</th><th>Shot</th><th>Touch</th></tr></thead><tbody>'+roster(t.code).map(function(p){var x=state.gameplans[t.code][p.id]||{},te=state.tendencies[p.id]||{};return '<tr><td>'+esc(p.name)+'</td><td><input class="mynba-mini-input" type="number" min="0" max="48" value="'+(x.minutes==null?defaultRotationMinutes(p):x.minutes)+'" data-plan="'+esc(p.id)+'"></td><td>'+(te.shot==null?50:te.shot)+'</td><td>'+(te.touch==null?50:te.touch)+'</td></tr>';}).join("")+'</tbody></table>';$("mynbaMinutesEditor").querySelectorAll("[data-plan]").forEach(function(i){i.onchange=function(){state.gameplans[t.code][i.dataset.plan]={minutes:Math.max(0,Math.min(48,Number(i.value)||0))};};});}
var coachKeys={benchUsage:"Utilisation du banc",performanceFactor:"Facteur de performance",rotationDepth:"Profondeur de rotation",offensiveTempo:"Tempo offensif",defensivePressure:"Pression défensive",starUsage:"Utilisation des vedettes"};
function renderCoach(){var t=selectedTeam();if(!t)return;var x=Object.assign({benchUsage:50,performanceFactor:50,rotationDepth:50,offensiveTempo:50,defensivePressure:50,starUsage:60},state.coachSettings[t.code]||{});$("mynbaCoachEditor").innerHTML=Object.keys(coachKeys).map(function(k){return '<label class="field mynba-setting">'+coachKeys[k]+' <b id="coach-'+k+'">'+x[k]+'</b><input type="range" min="0" max="100" value="'+x[k]+'" data-coach="'+k+'"></label>';}).join("");$("mynbaCoachEditor").querySelectorAll("[data-coach]").forEach(function(i){i.oninput=function(){$("coach-"+i.dataset.coach).textContent=i.value;};});}function tradeSeasonStats(p){var h=Array.isArray(p.history)?p.history:[];if(h.length){var x=h[h.length-1];return {pts:Number(x.pts)||0,ast:Number(x.ast)||0,reb:Number(x.reb)||0,stl:Number(x.stl)||0,blk:Number(x.blk)||0,season:x.season||"saison précédente"};}return {pts:Number(p.pts)||0,ast:Number(p.ast)||0,reb:Number(p.reb)||0,stl:Number(p.stl)||0,blk:Number(p.blk)||0,season:"stats disponibles"};}
function tradePlayerValue(p,teamCode){var s=tradeSeasonStats(p),ovr=typeof overallRating==="function"?overallRating(p):60,age=Number(p.age)||27,pos=String(p.pos||"").toUpperCase(),r=roster(teamCode),same=r.filter(function(x){return String(x.pos||"").toUpperCase()===pos&&String(x.id)!==String(p.id);}).length;var ageFactor=age<=23?1.16:age<=27?1.08:age<=30?1:age<=33 ? .88 : .74;var stats=s.pts*.72+s.ast*1.05+s.reb*.48+s.stl*1.25+s.blk*1.25;var depthFactor=same===0?1.22:same===1?1.1:same>=3 ? .88 : 1;var value=Math.max(1,ovr*.62+stats*.48)*ageFactor*depthFactor;return {value:Math.round(value*10)/10,ovr:ovr,stats:s,age:age,pos:pos,depth:same};}
function renderTradePlayerList(target,side){var host=$(side==="out"?"mynbaTradeOutgoing":"mynbaTradeIncoming");if(!host)return;var code=side==="out"?state.team:target;var list=roster(code);host.innerHTML=list.map(function(p){var v=tradePlayerValue(p,code);return '<label class="mynba-trade-player"><input type="checkbox" data-trade-'+side+'="'+esc(p.id)+'"><span><b>'+esc(p.name)+'</b> · '+esc(p.pos||"—")+' · GÉN '+v.ovr+'<small>Valeur '+v.value.toFixed(1)+' · '+v.stats.pts.toFixed(1)+' PTS / '+v.stats.ast.toFixed(1)+' AST / '+v.stats.reb.toFixed(1)+' REB · '+v.stats.season+'</small></span></label>';}).join("")||'<p class="muted">Aucun joueur dans cet effectif.</p>';}
function renderTrades(){var t=selectedTeam();if(!t)return;var targetSelect=$("mynbaTradeTarget"),prior=targetSelect.value;targetSelect.innerHTML=teams().filter(function(x){return x.code!==t.code;}).map(function(x){return '<option value="'+esc(x.code)+'">'+esc(x.code+" — "+x.name)+'</option>';}).join("");if(prior&&teams().some(function(x){return x.code===prior&&x.code!==t.code;}))targetSelect.value=prior;var target=targetSelect.value;renderTradePlayerList(target,"out");renderTradePlayerList(target,"in");$("mynbaTradeAnalysis").innerHTML='<p class="muted">Valeur indicative : général + statistiques de la dernière saison + âge + profondeur à chaque poste. Les équipes évaluent les besoins de leur effectif avant d’accepter.</p>';$("mynbaTradeHistory").innerHTML=(state.tradeHistory||[]).slice().reverse().map(function(x){return '<p><b>'+(x.accepted?'✅ Accepté':'❌ Refusé')+'</b> · '+esc(x.from)+' ↔ '+esc(x.to)+' · '+esc(x.summary)+' <small>('+esc(x.reason)+')</small></p>';}).join("")||'<p class="muted">Aucune transaction pour le moment.</p>';targetSelect.onchange=function(){renderTradePlayerList(targetSelect.value,"out");renderTradePlayerList(targetSelect.value,"in");};$("mynbaClearTrade").onclick=function(){renderTradePlayerList(targetSelect.value,"out");renderTradePlayerList(targetSelect.value,"in");$("mynbaTradeStatus").textContent="Sélection effacée.";};$("mynbaSubmitTrade").onclick=submitTrade;}
function submitTrade(){var mine=selectedTeam();if(!mine)return;var targetCode=$("mynbaTradeTarget").value,target=team(targetCode);var outIds=Array.from(document.querySelectorAll("[data-trade-out]:checked")).map(function(x){return String(x.dataset.tradeOut);}),inIds=Array.from(document.querySelectorAll("[data-trade-in]:checked")).map(function(x){return String(x.dataset.tradeIn);});if(!target||!outIds.length||!inIds.length){$("mynbaTradeStatus").textContent="Sélectionne au moins un joueur à offrir et un joueur à recevoir.";return;}var out=roster(mine.code).filter(function(p){return outIds.includes(String(p.id));}),incoming=roster(target.code).filter(function(p){return inIds.includes(String(p.id));});if(!out.length||!incoming.length){$("mynbaTradeStatus").textContent="La sélection de joueurs n’est plus valide.";return;}var mineCount=players.filter(function(p){return p.team===mine.code;}).length,targetCount=players.filter(function(p){return p.team===target.code;}).length;if(mineCount-out.length+incoming.length>15||targetCount-incoming.length+out.length>15){$("mynbaTradeStatus").textContent="Échange impossible : une équipe dépasserait la limite de 15 joueurs.";return;}var outgoingValue=out.reduce(function(n,p){return n+tradePlayerValue(p,target.code).value;},0),incomingValue=incoming.reduce(function(n,p){return n+tradePlayerValue(p,mine.code).value;},0);var targetBefore=roster(target.code),targetPositions=targetBefore.map(function(p){return String(p.pos||"").toUpperCase();}),needBonus=out.reduce(function(n,p){var pos=String(p.pos||"").toUpperCase(),count=targetPositions.filter(function(x){return x===pos;}).length;return n+(count===0?8:count===1?3:count>=3?-5:0);},0),lossPenalty=incoming.reduce(function(n,p){var pos=String(p.pos||"").toUpperCase(),count=targetPositions.filter(function(x){return x===pos;}).length;return n+(count<=1?7:count===2?3:0);},0);var targetGets=out.reduce(function(n,p){return n+tradePlayerValue(p,target.code).value;},0),targetGives=incoming.reduce(function(n,p){return n+tradePlayerValue(p,target.code).value;},0);var ageBonus=out.reduce(function(n,p){return n+(Number(p.age)<=24?3:0);},0),teamFit=(targetGets+needBonus+ageBonus)/Math.max(1,targetGives+lossPenalty);var accept=teamFit>=.91;var reason=accept?"La valeur reçue est raisonnable et les joueurs proposés répondent aux besoins de l’effectif.":teamFit<.72?"Offre refusée : valeur insuffisante pour les joueurs cédés.":"Offre refusée : l’équipe préfère conserver ses joueurs ou la compensation ne correspond pas à ses besoins.";var summary=out.map(function(p){return p.name;}).join(", ")+" contre "+incoming.map(function(p){return p.name;}).join(", ");var record={date:new Date().toISOString(),from:mine.code,to:target.code,summary:summary,accepted:accept,reason:reason,outgoingValue:Math.round(outgoingValue*10)/10,incomingValue:Math.round(incomingValue*10)/10,teamFit:Math.round(teamFit*100)/100};state.tradeHistory=state.tradeHistory||[];state.tradeHistory.push(record);if(accept){out.forEach(function(p){p.team=target.code;});incoming.forEach(function(p){p.team=mine.code;});state.rosterCache=null;window.NBAMyNBARosterChanged();if(typeof window.NBASimRecordTrade==="function")window.NBASimRecordTrade({kind:"player-ai",season:Number(seasonYear)||0,from:mine.code,to:target.code,outgoing:out,incoming:incoming});$("mynbaTradeStatus").textContent="Trade accepté ! "+summary+". Valeurs indicatives : "+record.outgoingValue+" contre "+record.incomingValue+".";renderRoster();renderTeamDescription();renderTeamSelection();}else{$("mynbaTradeStatus").textContent="Trade refusé par "+target.name+". "+reason+" Valeurs indicatives : "+record.outgoingValue+" contre "+record.incomingValue+"."; }renderTrades();if(typeof renderAll==="function")renderAll();}
function openPlayoffsScreen(){if(typeof window.NBAMyNBAPreparePlayoffs==="function")window.NBAMyNBAPreparePlayoffs();if(typeof window.NBAMyNBAShowPlayoffs==="function"){window.NBAMyNBAShowPlayoffs();return;}var p=$("playoffsSection");if(p){p.hidden=false;p.scrollIntoView({behavior:"smooth",block:"start"});if(typeof renderPlayoffs==="function")renderPlayoffs();}}

function renderCategoryActions(){ $("mynbaSignPlayer").onclick=signPlayer;$("mynbaSaveDescription").onclick=saveTeamDescription;$("mynbaGoRoster").onclick=function(){openCategory(0);};$("mynbaSaveGameplan").onclick=function(){$("mynbaGameplanStatus").textContent="Gameplan enregistré.";};$("mynbaSaveCoach").onclick=function(){var t=selectedTeam();if(!t)return;state.coachSettings[t.code]={};$("mynbaCoachEditor").querySelectorAll("[data-coach]").forEach(function(i){state.coachSettings[t.code][i.dataset.coach]=Number(i.value);});var scheduleMessage=typeof refreshCustomTeamSeasonSchedule==="function"?refreshCustomTeamSeasonSchedule():"Les réglages seront appliqués au prochain calendrier."; $("mynbaCoachStatus").textContent="Réglages enregistrés. "+scheduleMessage;};$("mynbaTeamSearch").oninput=renderTeamSelection;$("mynbaTeamFilter").onchange=renderTeamSelection;}
function playerBox(code,score,opp){
 if(typeof window.NBASimEnsureMinimumRoster==="function")window.NBASimEnsureMinimumRoster(code);
 state.rosterCache=null;
 var a=roster(code);if(!a.length)return[];
 var mins=a.map(function(p){return Math.max(0,Math.min(48,typeof window.NBAMyNBAMinutes==="function"?Number(window.NBAMyNBAMinutes(p))||0:Number(p.mpg)||20));});
 if(a.length===5){mins=mins.map(function(){return 48;});}
 else{
  var sum=mins.reduce(function(x,y){return x+y;},0),remaining=Math.max(0,Math.min(240,48*a.length)-sum),guard=0;
  while(remaining>0&&guard++<a.length*2){
   var active= a.map(function(p,i){return {p:p,i:i};}).filter(function(x){return mins[x.i]<48;});
   if(!active.length)break;
   var weights=active.map(function(x){return Math.max(1,(typeof overallRating==="function"?overallRating(x.p):60)*.7+(Number(x.p.pts)||0)*.3);}),total=weights.reduce(function(x,y){return x+y;},0),used=0;
   active.forEach(function(x,i){var share=i===active.length-1?remaining-used:Math.max(1,Math.floor(remaining*weights[i]/total));var add=Math.min(48-mins[x.i],share,remaining-used);if(add>0){mins[x.i]+=add;used+=add;}});
   if(!used)break;remaining-=used;
  }
 }
 var active=a.map(function(p,i){return {p:p,min:Math.min(48,mins[i])};}).filter(function(x){return x.min>.1;});
 var weight=function(x){var p=x.p,at=p.attributes||{},te=state.tendencies[p.id]||{};var shooting=Number(at.threePoint||at.shooting)||50,finish=Number(at.finishing)||50,play=Number(at.playmaking||at.passing)||50,touch=Number(te.touch==null?50:te.touch);return Math.max(.1,(Number(p.pts)||8)*.35+(typeof overallRating==="function"?overallRating(p):60)*.12+shooting*.10+finish*.10+play*.06)*(.65+touch/200)*Math.max(.1,x.min/32);};
 var weights=active.map(weight),total=weights.reduce(function(x,y){return x+y;},0)||1,used=0;
 return active.map(function(x,i){
  var p=x.p,at=p.attributes||{},pts=i===active.length-1?Math.max(0,score-used):Math.max(0,Math.min(score-used,Math.round(score*weights[i]/total)));used+=pts;
  var shooting=Number(at.threePoint)||Number(p.three&&p.three*100)||35,ts=Number(p.ts)||.55,te=state.tendencies[p.id]||{};
  var fga=Math.max(0,Math.round(pts/Math.max(1.1,ts*2))),threeA=Math.min(fga,Math.round(fga*(shooting/100)*(.65+(te.shot==null?50:te.shot)/200))),threeM=Math.min(threeA,Math.round(pts/3*.3)),fgm=Math.min(fga,Math.max(0,Math.round((pts-threeM*3)/2))),ftm=Math.max(0,pts-threeM*3-fgm*2);
  var rebSkill=(Number(at.defensiveRebound)||50)+(Number(at.offensiveRebound)||50),defense=(Number(at.interiorDefense)||50)+(Number(at.perimeterDefense)||50),height=Number(p.height)||200;
  return {name:p.name,min:+x.min.toFixed(1),pts:pts,fgm:fgm,fga:fga,threeM:threeM,threeA:threeA,ftm:ftm,fta:Math.max(ftm,Math.round(ftm/.75)),reb:Math.max(0,Math.round(((Number(p.reb)||3)*.35+rebSkill*.035)*x.min/Math.max(1,p.mpg||30))),ast:Math.max(0,Math.round(((Number(p.ast)||2)*.4+(Number(at.playmaking||at.passing)||50)*.025)*x.min/Math.max(1,p.mpg||30))),stl:Math.max(0,Math.round(((Number(p.stl)||.5)*.35+(Number(at.steal)||50)*.012+(Number(at.perimeterDefense)||50)*.006)*x.min/36)),blk:Math.max(0,Math.round(((Number(p.blk)||.3)*.35+(Number(at.block)||50)*.012+(Number(at.interiorDefense)||50)*.006+Math.max(0,height-200)*.01)*x.min/36)),to:Math.max(0,Math.round((Number(p.ast)||2)*.18*x.min/36)),pf:Math.min(6,Math.round(2+x.min/24)),pm:Math.round((score-opp)*x.min/48)};
 });
}
function boxHtml(rows,code){return '<h3>'+(typeof window.NBASimTeamImageMarkup==="function"?window.NBASimTeamImageMarkup(code,30):esc(code))+' — joueurs</h3><div class="tablewrap"><table><thead><tr><th>Joueur</th><th>MIN</th><th>PTS</th><th>FG</th><th>3PT</th><th>FT</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>PF</th><th>+/-</th></tr></thead><tbody>'+rows.map(function(r){var player=(typeof players!=="undefined"?players:[]).find(function(p){return String(p.name)===String(r.name);});return '<tr><td>'+(player&&typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(player,30):"")+'<b>'+esc(r.name)+'</b></td><td>'+r.min+'</td><td>'+r.pts+'</td><td>'+r.fgm+'/'+r.fga+'</td><td>'+r.threeM+'/'+r.threeA+'</td><td>'+r.ftm+'/'+r.fta+'</td><td>'+r.reb+'</td><td>'+r.ast+'</td><td>'+r.stl+'</td><td>'+r.blk+'</td><td>'+r.to+'</td><td>'+r.pf+'</td><td>'+(r.pm>0?"+":"")+r.pm+'</td></tr>';}).join("")+'</tbody></table></div>';}
function recordedPlayerBox(game,sideName,code,score,opp){
 var lines=game&&game.playerBoxScores&&game.playerBoxScores[sideName];
 if(!lines)return playerBox(code,score,opp);
 if(typeof window.NBASimEnsureMinimumRoster==="function")window.NBASimEnsureMinimumRoster(code);
 state.rosterCache=null;
 var teamEntry=typeof seasonCalendar!=="undefined"&&seasonCalendar&&seasonCalendar.teams?seasonCalendar.teams.find(function(t){return String(t.scheduleCode||t.code)===String(code);}):null;
 var rosterCode=teamEntry?teamEntry.code:code;
 return roster(rosterCode).map(function(p){
  var l=lines[String(p.id)]||{};
  var min=Math.max(0,Math.min(48,Number(l.minutes)||0));
  return {name:p.name,min:+min.toFixed(1),pts:Number(l.pts)||0,fgm:Number(l.fgm)||0,fga:Number(l.fga)||0,
   threeM:Number(l.threeMade)||0,threeA:Number(l.threeAttempts)||0,ftm:Number(l.ftm)||0,fta:Number(l.fta)||0,
   reb:Number(l.reb)||0,ast:Number(l.ast)||0,stl:Number(l.stl)||0,blk:Number(l.blk)||0,to:Number(l.tov)||0,
   pf:Number(l.pf)||0,pm:Math.round((score-opp)*min/48)};
 }).filter(function(r){return r.min>0||r.pts||r.reb||r.ast||r.stl||r.blk||r.to;});
}
function showRegularBox(game){if(!game||game.status!=="completed")return;if(game.playerBoxScores){game.mynbaBoxScore={home:recordedPlayerBox(game,"home",game.home.code,game.homeScore,game.awayScore),away:recordedPlayerBox(game,"away",game.away.code,game.awayScore,game.homeScore)};}else if(!game.mynbaBoxScore)game.mynbaBoxScore={home:playerBox(game.home.code,game.homeScore,game.awayScore),away:playerBox(game.away.code,game.awayScore,game.homeScore)};var h=game.mynbaBoxScore.home,a=game.mynbaBoxScore.away,ov=document.createElement("div");ov.className="mynba-modal-backdrop";ov.innerHTML='<div class="mynba-modal"><header><div><div class="mynba-kicker">BOX SCORE · SAISON RÉGULIÈRE</div><h2>'+esc(game.home.name)+' vs '+esc(game.away.name)+'</h2></div><button class="btn" data-close>✕ Fermer</button></header><div class="mynba-boxscore-score"><div><small>'+esc(game.home.code)+'</small><strong>'+game.homeScore+'</strong></div><span>FINAL</span><div><small>'+esc(game.away.code)+'</small><strong>'+game.awayScore+'</strong></div></div>'+boxHtml(h,game.home.code)+boxHtml(a,game.away.code)+'</div>';document.body.appendChild(ov);ov.querySelector("[data-close]").onclick=function(){ov.remove();};ov.onclick=function(e){if(e.target===ov)ov.remove();};}
function patchPlayoffBoxScore(){if(typeof showPlayoffBoxScore!=="function"||showPlayoffBoxScore.__mynba)return;var old=showPlayoffBoxScore;var wrapped=function(){var found=findPlayoffGame(selectedPlayoffGameId);if(!found)return old.apply(this,arguments);var g=found.game;if(!g.mynbaBoxScore)g.mynbaBoxScore={home:playerBox(g.home.code,g.homeScore,g.awayScore),away:playerBox(g.away.code,g.awayScore,g.homeScore)};var h=g.mynbaBoxScore.home,a=g.mynbaBoxScore.away;$("playoffBoxScore").innerHTML="<h2>BOX SCORE · PLAYOFFS · MATCH "+g.number+"</h2><div class=\"mynba-boxscore-score\"><div><small>"+esc(g.home.code)+"</small><strong>"+g.homeScore+"</strong></div><span>FINAL</span><div><small>"+esc(g.away.code)+"</small><strong>"+g.awayScore+"</strong></div></div>"+boxHtml(h,g.home.code)+boxHtml(a,g.away.code);$("playoffBoxScore").hidden=false;};wrapped.__mynba=true;showPlayoffBoxScore=wrapped;}function patchBoxes(){patchPlayoffBoxScore();window.NBAMyNBAShowRegularBox=showRegularBox;}
 window.NBAMyNBAIsRostered=function(p){return activeIds().has(String(p.id));};window.NBAMyNBATendency=function(p){return state.tendencies[p.id]||{shot:50,touch:50};};window.NBAMyNBAMinutes=function(p){
 var g=state.gameplans[p.team]&&state.gameplans[p.team][p.id],base=g&&g.minutes!=null?Number(g.minutes):defaultRotationMinutes(p);
 var coach=state.coachSettings[p.team]||{},r=roster(p.team),i=r.findIndex(function(x){return String(x.id)===String(p.id);});
 var performance=Number(coach.performanceFactor==null?50:coach.performanceFactor)/100,bench=Number(coach.benchUsage==null?50:coach.benchUsage),depth=Number(coach.rotationDepth==null?50:coach.rotationDepth);
 var rating=typeof overallRating==="function"?Number(overallRating(p))||60:60;
 if(i>=5)base+=(bench-50)*.035;
 base+=performance*Math.max(-1,Math.min(1,(rating-75)/20))*3;
 base+=(depth-50)*.015;
 return Math.max(0,Math.min(48,base));
};window.NBAMyNBATeamSettings=state.teamSettings;
 if(typeof strengthOf==="function"&&!strengthOf.__mynba){var oldStrength=strengthOf;var w=function(list){var a=list.filter(function(p){return activeIds().has(String(p.id));}).slice(0,15);var value=oldStrength(a),code=a[0]&&a[0].team,c=state.coachSettings[code]||{};return Math.max(.28,Math.min(.8,value+((Number(c.performanceFactor==null?50:c.performanceFactor)-50)*.0005)));};w.__mynba=true;strengthOf=w;}
 if(typeof rosterOf==="function"){rosterOf=function(r){return roster(r.code);};}if(typeof customTeamStrength==="function"){customTeamStrength=function(t){return strengthOf(roster(t.code));};}
 if(typeof simulateScheduledGame==="function"&&!simulateScheduledGame.__mynba){var oldGame=simulateScheduledGame;var w2=function(g){return oldGame(g);};w2.__mynba=true;simulateScheduledGame=w2;}
 
function setupSaveLoad(){
 function encodeSeriesForSave(s){return {id:s.id,aCode:s.a.code,bCode:s.b.code,winsA:s.winsA,winsB:s.winsB,winnerCode:s.winner&&s.winner.code,loserCode:s.loser&&s.loser.code,conf:s.conf,roundIndex:s.roundIndex,games:(s.games||[]).map(function(g){return {id:g.id,number:g.number,homeCode:g.home.code,awayCode:g.away.code,homeScore:g.homeScore,awayScore:g.awayScore,completed:g.completed,winnerCode:g.winnerCode};})};}
 $("mynbaExportSave").onclick=function(){var data={format:"nba-sim-lab-save",version:4,simulationSettings:window.NBASimSimulationSettings||{speed:"normal",batchDays:"all",pauseMs:700},draftState:window.NBASimDraftState||null,seasonYear:seasonYear,phase:phase,resultsLabel:resultsLabel,nextPlayerId:nextPlayerId,followedPlayerId:followedPlayerId,players:players,customTeams:customTeams,nextCustomTeamId:nextCustomTeamId,history:history,retired:retired,lastAwards:lastAwards,lastOffseason:lastOffseason,lastDraft:lastDraft?{season:lastDraft.season,rows:lastDraft.rows.map(function(r){return {n:r.n,round:r.round,team:r.team,code:r.code,playerId:r.player.id};})}:null,seasonResults:seasonResults,seasonCalendar:seasonCalendar,seasonLines:Object.fromEntries(seasonLines),seasonStatHistory:seasonStatHistory,playoffs:playoffs?{currentRound:playoffs.currentRound,confRounds:{West:(playoffs.confRounds.West||[]).map(function(r){return {index:r.index,name:r.name,conf:r.conf,series:r.series.map(encodeSeriesForSave)};}),East:(playoffs.confRounds.East||[]).map(function(r){return {index:r.index,name:r.name,conf:r.conf,series:r.series.map(encodeSeriesForSave)};})},final:playoffs.final?encodeSeriesForSave(playoffs.final):null,championCode:playoffs.champion&&playoffs.champion.code,runnerUpCode:playoffs.runnerUp&&playoffs.runnerUp.code}:null,mynba:{rosterOrder:state.rosterOrder,tendencies:state.tendencies,teamSettings:state.teamSettings,coachSettings:state.coachSettings,gameplans:state.gameplans,tradeHistory:state.tradeHistory,team:state.team,aiTradeHistory:window.NBASimAITradeHistory||[],aiTradeAutoDecline:window.NBASimAIAutoDecline===true}};data.injuriesEnabled=window.NBASimSimulationSettings?window.NBASimSimulationSettings.injuriesEnabled!==false:true;download(JSON.stringify(data,null,2),"nba_sim_lab_save_"+seasonLabel(seasonYear)+".json","application/json;charset=utf-8");$("mynbaSaveStatus").textContent="Sauvegarde JSON préparée.";};
 $("mynbaExportStats").onclick=function(){$("export").click();};
 $("importFile").onchange=async function(e){var f=e.target.files&&e.target.files[0];if(!f)return;$("mynbaLoadError").hidden=true;var backup={players:players,customTeams:customTeams,nextCustomTeamId:nextCustomTeamId,nextPlayerId:nextPlayerId,seasonYear:seasonYear,phase:phase,resultsLabel:resultsLabel,seasonResults:seasonResults,seasonCalendar:seasonCalendar,seasonLines:seasonLines,seasonStatHistory:seasonStatHistory,playoffs:playoffs,history:history,retired:retired,lastAwards:lastAwards,lastOffseason:lastOffseason,lastDraft:lastDraft};try{var d=typeof parseSaveJsonFile==="function"?await parseSaveJsonFile(f):JSON.parse(await f.text()),list=Array.isArray(d)?d:d&&d.players;if(!Array.isArray(list)||!list.every(function(p){return p&&typeof p==="object";}))throw Error("Le JSON doit contenir un tableau de joueurs ou une sauvegarde NBA Sim Lab.");if(!Array.isArray(d)&&d.format&&d.format!=="nba-sim-lab-save")throw Error("Format de sauvegarde non reconnu.");if(!Array.isArray(d)&&d.customTeams!=null&&!Array.isArray(d.customTeams))throw Error("La liste des équipes est invalide.");if(!Array.isArray(d)&&d.seasonResults!=null&&!Array.isArray(d.seasonResults))throw Error("Le classement de saison est invalide.");load(list,"Import réussi : "+list.length+" joueurs.",Array.isArray(d)?null:d);if(d.mynba){state.rosterOrder=d.mynba.rosterOrder||{};state.rosterCache=null;state.tendencies=d.mynba.tendencies||{};state.teamSettings=d.mynba.teamSettings||{};state.coachSettings=d.mynba.coachSettings||{};state.gameplans=d.mynba.gameplans||{};state.tradeHistory=d.mynba.tradeHistory||[];state.team=d.mynba.team||state.team;if(Array.isArray(d.mynba.aiTradeHistory))window.NBASimAITradeHistory=d.mynba.aiTradeHistory;if(typeof d.mynba.aiTradeAutoDecline==="boolean")window.NBASimAIAutoDecline=d.mynba.aiTradeAutoDecline;window.NBAMyNBATeamSettings=state.teamSettings;}else if(d.teamSettings&&typeof d.teamSettings==="object"){state.teamSettings=d.teamSettings;window.NBAMyNBATeamSettings=state.teamSettings;}if(typeof d.injuriesEnabled==="boolean"){window.NBASimSimulationSettings=Object.assign({},window.NBASimSimulationSettings||{},{injuriesEnabled:d.injuriesEnabled});}renderTeamSelection();renderRoster();renderTeamDescription();renderGameplan();renderCoach();renderAll();$("mynbaLoadStatus").textContent="Fichier chargé : "+f.name;$("mynbaLoadError").hidden=true;}catch(err){players=backup.players;customTeams=backup.customTeams;nextCustomTeamId=backup.nextCustomTeamId;nextPlayerId=backup.nextPlayerId;seasonYear=backup.seasonYear;phase=backup.phase;resultsLabel=backup.resultsLabel;seasonResults=backup.seasonResults;seasonCalendar=backup.seasonCalendar;seasonLines=backup.seasonLines;seasonStatHistory=backup.seasonStatHistory;playoffs=backup.playoffs;history=backup.history;retired=backup.retired;lastAwards=backup.lastAwards;lastOffseason=backup.lastOffseason;lastDraft=backup.lastDraft;renderAll();$("mynbaLoadStatus").textContent="Échec du chargement";$("mynbaLoadError").textContent="Erreur de conversion JSON : "+err.message;$("mynbaLoadError").hidden=false;}finally{e.target.value="";}};
}
function css(){var s=document.createElement("style");s.id="mynbaNavigationCss";s.textContent=".mynba-main{max-width:none!important;margin:0!important;padding:12px!important}.mynba-main>.panel,.mynba-main>section:not(#mynbaHome),.mynba-main>#mobileNav{display:none!important}.mynba-main>.top{max-width:1500px;margin:0 auto 10px}.mynba-main>.top p{display:none}.mynba-home{max-width:1500px;margin:auto;padding:10px}.mynba-home-title{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.mynba-kicker{font-size:11px;letter-spacing:.15em;color:var(--orange);font-weight:900}.mynba-menu,.mynba-screen{position:fixed;inset:0;z-index:1000;overflow:auto;padding:clamp(12px,3vw,36px);background:radial-gradient(ellipse at top,#182e51,#070c16 70%);color:var(--txt)}.mynba-menu[hidden],.mynba-screen[hidden]{display:none!important}.mynba-menu-shell{max-width:1450px;margin:auto;min-height:100%;display:flex;flex-direction:column}.mynba-menu-shell>h1{font-size:clamp(42px,7vw,82px);margin:0}.mynba-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;flex:1;align-content:start}.mynba-category-card{min-height:125px;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;gap:5px 14px;align-content:center;text-align:left;padding:16px;background:linear-gradient(145deg,#172844,#0d1728);border:1px solid #31496b;border-radius:12px;color:var(--txt);cursor:pointer;font:inherit}.mynba-category-card.selected,.mynba-category-card:hover{border-color:var(--gold);background:#1d2e49;box-shadow:0 0 0 2px #ffd16644}.mynba-category-icon{grid-row:1/3;font-size:32px;align-self:center}.mynba-category-title{font-size:clamp(15px,1.5vw,21px);font-weight:900}.mynba-category-desc{font-size:12px;color:var(--muted)}.mynba-menu-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px;margin-top:18px;font-size:11px;font-weight:900}.mynba-screen{z-index:1001;padding:0}.mynba-screen-header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px clamp(12px,3vw,36px);background:#0a1223f2;border-bottom:1px solid var(--line)}.mynba-screen-header h1{font-size:clamp(22px,4vw,42px);margin:0}.mynba-screen-header p{margin:3px 0 0;font-size:12px}.mynba-screen-body{max-width:1500px;margin:auto;padding:clamp(10px,2vw,28px);min-height:calc(100vh - 90px)}.mynba-screen-body>.panel:not([hidden]),.mynba-screen-body>section:not([hidden]){display:block!important;max-width:none;margin:0 0 16px}.mynba-mobile-back{display:none}.mynba-subnav,.mynba-team-tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;padding:10px;background:#0a1426;border:1px solid var(--line);border-radius:12px}.mynba-subnav .field{flex:1;min-width:200px}.mynba-mini-input{width:70px;min-width:0!important;background:#0b1527;color:white;border:1px solid var(--line);border-radius:7px;padding:7px}.mynba-feature-card{margin:14px 0;padding:18px;border:1px solid var(--line);border-radius:14px;background:#111b30}.mynba-team-select-tools{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}.mynba-team-select-tools .field{flex:1;min-width:200px}.mynba-team-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.mynba-team-card{min-height:115px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;text-align:left;padding:12px;border:1px solid var(--line);border-radius:12px;background:#101c30;color:var(--txt);cursor:pointer}.mynba-team-card.selected,.mynba-team-card:hover{border-color:var(--gold);background:#1d2e49}.mynba-team-code{font-size:24px;font-weight:950;color:var(--gold)}.mynba-team-card small{color:var(--muted)}.mynba-selected-team{display:flex;align-items:center;gap:16px;padding:16px;background:#0b1527;border:1px solid var(--line);border-radius:12px;margin-bottom:16px}.mynba-selected-team h2{margin:0}.mynba-team-pane[hidden]{display:none!important}.mynba-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mynba-setting{padding:14px;background:#0b1527;border:1px solid var(--line);border-radius:12px}.mynba-setting b{color:var(--gold)}.mynba-error{padding:12px;margin-top:12px;background:#381820;border:1px solid #a83e4c;border-radius:8px;color:#ffdbe0}.mynba-modal-backdrop{position:fixed;inset:0;z-index:1200;background:#02050bd9;display:flex;align-items:stretch;justify-content:center;padding:10px;overflow:auto}.mynba-modal{width:min(1500px,100%);margin:auto;background:#0b1425;border:1px solid var(--line);border-radius:14px;padding:16px;max-height:96vh;overflow:auto}.mynba-modal>header{display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:-1px;background:#0b1425;padding:8px 0;z-index:1}.mynba-modal table{min-width:900px}.mynba-boxscore-score{display:flex;justify-content:center;align-items:center;gap:clamp(15px,5vw,80px);padding:18px;background:#0b1527;border:1px solid var(--line);border-radius:12px;margin-bottom:16px}.mynba-boxscore-score div{display:grid;text-align:center}.mynba-boxscore-score small{font-weight:900;color:var(--gold)}.mynba-boxscore-score strong{font-size:38px}.mynba-home .schedule-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.mynba-home .schedule-game{min-height:84px}.mynba-home .schedule-toolbar{margin:8px 0}@media(max-width:900px){.mynba-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mynba-team-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mynba-mobile-back{display:inline-flex!important}}@media(max-width:560px){.mynba-main{padding:7px!important}.mynba-main>.top h1{font-size:23px}.mynba-category-grid{grid-template-columns:1fr;gap:7px}.mynba-category-card{min-height:78px;padding:10px}.mynba-category-icon{font-size:26px}.mynba-screen-header{padding:10px;align-items:center}.mynba-screen-header h1{font-size:20px}.mynba-screen-header p{display:none}.mynba-screen-body{padding:8px}.mynba-team-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.mynba-settings-grid{grid-template-columns:1fr}.mynba-team-tabs .btn{flex:1 1 100%}.mynba-modal-backdrop{padding:0}.mynba-modal{border-radius:0;max-height:100vh;min-height:100vh}.mynba-home .schedule-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mynba-home .schedule-game{padding:7px;min-height:88px}}.mynba-trade-player{display:flex;align-items:flex-start;gap:10px;padding:10px;margin:6px 0;border:1px solid var(--line);border-radius:9px;background:#101b2d;cursor:pointer}.mynba-trade-player input{margin-top:5px;min-width:18px;min-height:18px}.mynba-trade-player span{display:flex;flex-direction:column;gap:4px}.mynba-trade-player small{color:var(--muted);font-size:11px}";document.head.appendChild(s);}
function keyboard(){document.addEventListener("keydown",function(e){if(e.key==="Backspace"){if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;if(state.active||state.menu){e.preventDefault();back();}return;}if(e.key==="Escape"&&(state.active||state.menu)){e.preventDefault();back();return;}if(e.key==="Enter"&&!(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))){if(state.active)return;e.preventDefault();if(!state.menu)openMenu();else openCategory(state.selected);return;}if(state.menu&&["ArrowDown","ArrowRight","ArrowUp","ArrowLeft"].includes(e.key)){e.preventDefault();select(state.selected+((e.key==="ArrowDown"||e.key==="ArrowRight")?1:-1));}});}
function boot(){css();build();renderCategoryActions();setupSaveLoad();keyboard();installMentorshipProgress();patchBoxes();window.NBAMyNBARosterChanged=function(){state.rosterCache=null;};window.NBAMyNBASelectedTeamCode=function(){var t=selectedTeam();return t&&t.code||null;};window.NBAMyNBARefreshAfterAITrade=function(){state.rosterCache=null;renderRoster();renderTeamSelection();renderTeamDescription();renderGameplan();renderAll();};
window.NBAMyNBAShowPlayoffs=function(){state.active="playoffs";state.menu=false;$("mynbaMenu").hidden=true;document.querySelectorAll(".mynba-screen").forEach(function(el){el.hidden=true;});screens.playoffs.hidden=false;$("mynbaMobileBack").hidden=false;if(typeof renderPlayoffs==="function")renderPlayoffs();};if(teams().some(function(t){return t.code==="LAL";}))state.team="LAL";else if(teams()[0])state.team=teams()[0].code;if($("scheduleTeamFilter"))$("scheduleTeamFilter").value=state.team;renderTeamSelection();renderRoster();renderTeamDescription();renderGameplan();renderCoach();teamTab("description");leaderTab("teams");var oldRenderFunction=render;render=function(){state.rosterCache=null;return oldRenderFunction.apply(this,arguments);};var old=renderAll;renderAll=function(){old.apply(this,arguments);if($("seasonSection"))$("seasonSection").hidden=false;if(state.active==="roster")renderRoster();if(state.active==="selection")renderTeamSelection();if(state.active==="leaders"){renderTeamLeaders();renderPlayerLeaders();}patchBoxes();};if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();if(typeof renderAll==="function")renderAll();if(typeof phase!=="undefined"&&phase==="playoffs"&&typeof playoffs!=="undefined"&&playoffs)setTimeout(function(){if(typeof window.NBAMyNBAShowPlayoffs==="function")window.NBAMyNBAShowPlayoffs();},0);document.body.classList.add("mynba-ready");}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();