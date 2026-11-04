/* MyCareer mode — separate player career using the existing league and possession simulator. */
(() => {
"use strict";
function escHtml(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(String.fromCharCode(39),"&#39;");}
const KEY="nba-sim-lab-mycareer-v1",GM_KEY="nba-sim-lab-mygm-mode-v1",$=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),rand=()=>Math.random();
const fallback=[["finishing","Finition"],["layup","Layup"],["dunk","Dunk"],["closeShot","Tir rapproché"],["midRange","Mi-distance"],["threePoint","Tir à 3 pts"],["freeThrow","Lancers francs"],["shotIQ","QI de tir"],["ballHandle","Contrôle du ballon"],["passing","Passes"],["playmaking","Création"],["offensiveIQ","QI offensif"],["perimeterDefense","Défense extérieure"],["interiorDefense","Défense intérieure"],["steal","Interception"],["block","Contre"],["defensiveIQ","QI défensif"],["defensiveRebound","Rebond défensif"],["offensiveRebound","Rebond offensif"],["speed","Vitesse"],["acceleration","Accélération"],["agility","Agilité"],["strength","Force"],["vertical","Détente"],["stamina","Endurance"],["durability","Durabilité"],["consistency","Régularité"],["clutch","Clutch"],["potential","Potentiel"],["workEthic","Éthique de travail"],["basketballIQ","QI basket"],["intangibles","Intangibles"]];
const attrs=typeof attributeNames!=="undefined"?attributeNames:fallback,groups=typeof attributeGroups!=="undefined"?attributeGroups:{Attributs:fallback};
const profiles={
PG:[{id:"floor_general",name:"Meneur organisateur",core:["playmaking","passing","ballHandle","basketballIQ","midRange","threePoint"],secondary:["speed","acceleration","shotIQ","offensiveIQ","perimeterDefense"]},{id:"scoring_guard",name:"Meneur scoreur",core:["ballHandle","threePoint","midRange","layup","shotIQ","acceleration"],secondary:["playmaking","offensiveIQ","freeThrow","agility","clutch"]},{id:"lockdown_guard",name:"Meneur défenseur",core:["perimeterDefense","steal","agility","speed","defensiveIQ","basketballIQ"],secondary:["ballHandle","playmaking","stamina","durability","intangibles"]}],
SG:[{id:"shooter",name:"Arrière shooteur",core:["threePoint","midRange","freeThrow","shotIQ","offensiveIQ","intangibles"],secondary:["agility","ballHandle","speed","consistency","clutch"]},{id:"slasher",name:"Arrière pénétrateur",core:["layup","dunk","finishing","speed","acceleration","vertical"],secondary:["ballHandle","strength","intangibles","stamina","midRange"]},{id:"two_way_guard",name:"Arrière two-way",core:["perimeterDefense","threePoint","steal","agility","shotIQ","intangibles"],secondary:["midRange","speed","ballHandle","defensiveIQ","consistency"]}],
SF:[{id:"versatile_wing",name:"Ailier polyvalent",core:["finishing","threePoint","midRange","perimeterDefense","speed","basketballIQ"],secondary:["layup","ballHandle","defensiveIQ","strength","intangibles"]},{id:"three_d_wing",name:"Ailier 3&D",core:["threePoint","perimeterDefense","defensiveIQ","agility","stamina","intangibles"],secondary:["midRange","steal","speed","shotIQ","strength"]},{id:"star_wing",name:"Ailier scoreur",core:["finishing","layup","midRange","threePoint","ballHandle","shotIQ"],secondary:["dunk","speed","offensiveIQ","clutch","strength"]}],
PF:[{id:"stretch_four",name:"Ailier fort stretch",core:["threePoint","midRange","strength","defensiveRebound","interiorDefense","shotIQ"],secondary:["perimeterDefense","vertical","offensiveRebound","stamina","intangibles"]},{id:"inside_finisher",name:"Intérieur finisseur",core:["finishing","dunk","strength","offensiveRebound","vertical","closeShot"],secondary:["interiorDefense","defensiveRebound","layup","stamina","midRange"]},{id:"defensive_four",name:"Ailier fort défensif",core:["interiorDefense","block","defensiveRebound","strength","defensiveIQ","vertical"],secondary:["offensiveRebound","perimeterDefense","stamina","intangibles","finishing"]}],
C:[{id:"rim_protector",name:"Pivot protecteur de cercle",core:["block","interiorDefense","defensiveRebound","strength","vertical","defensiveIQ"],secondary:["offensiveRebound","stamina","finishing","intangibles","durability"]},{id:"dominant_center",name:"Pivot dominant",core:["finishing","dunk","strength","offensiveRebound","defensiveRebound","closeShot"],secondary:["block","interiorDefense","vertical","stamina","midRange"]},{id:"passing_center",name:"Pivot organisateur",core:["passing","playmaking","basketballIQ","interiorDefense","defensiveRebound","strength"],secondary:["midRange","closeShot","block","offensiveRebound","intangibles"]}]
};
const style=document.createElement("style");
style.textContent="#nbaMyCareerRoot{position:fixed;inset:0;z-index:300000;overflow:auto;background:radial-gradient(ellipse at top,#1b3457 0,#070c16 72%);color:#f4f7ff;font-family:inherit;padding:clamp(14px,3vw,36px);box-sizing:border-box}"+
"#nbaMyCareerRoot[hidden]{display:none!important}#nbaMyCareerRoot *{box-sizing:border-box}.mc-shell{width:min(1250px,100%);margin:0 auto}.mc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}.mc-kicker{font-size:11px;font-weight:900;letter-spacing:.2em;color:#f2d76c;text-transform:uppercase}.mc-title{font-size:clamp(32px,5vw,62px);line-height:1.03;margin:8px 0 12px;font-weight:1000}.mc-muted{color:#aebdd5;line-height:1.55}.mc-card{padding:clamp(16px,2.5vw,28px);border:1px solid #334c70;border-radius:16px;background:linear-gradient(145deg,#14243b,#0c1525);box-shadow:0 14px 40px #0005;margin:12px 0}.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mc-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.mc-field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800;color:#cbd8eb}.mc-field input,.mc-field select{width:100%;padding:11px;border:1px solid #405879;border-radius:8px;background:#081426;color:#fff;font:inherit;font-size:14px}.mc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.mc-btn{border:1px solid #587399;border-radius:9px;padding:12px 17px;background:#1b3454;color:#fff;font:inherit;font-weight:900;cursor:pointer}.mc-btn.primary{background:#dfbf45;color:#171b24;border-color:#f4d86b}.mc-btn.secondary{background:#111f33}.mc-btn:disabled{opacity:.45;cursor:not-allowed}.mc-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.mc-mode{min-height:220px;padding:clamp(18px,3vw,30px);display:flex;flex-direction:column;justify-content:flex-end;text-align:left;background:linear-gradient(155deg,#203c61,#0e192b);border:1px solid #49658d;border-radius:16px;color:#fff;cursor:pointer}.mc-mode h2{font-size:clamp(24px,3vw,36px);margin:0 0 8px}.mc-mode p{color:#c4d2e8;margin:0}.mc-metric{padding:14px;border:1px solid #354c6b;border-radius:10px;background:#0b1729}.mc-metric strong{display:block;font-size:26px;color:#f5d76b}.mc-metric span{font-size:10px;letter-spacing:.1em;color:#aebdd5;text-transform:uppercase}.mc-bars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mc-attribute{display:grid;grid-template-columns:minmax(95px,1fr) 45px;gap:6px 10px;align-items:center;padding:9px 10px;border:1px solid #293e5b;border-radius:8px;background:#0b1627}.mc-attribute label{font-size:12px;font-weight:800}.mc-attribute b{text-align:right;color:#f2d76c}.mc-attribute input{grid-column:1/-1;width:100%;accent-color:#e0c24d}.mc-meter{height:9px;border-radius:30px;background:#243b5b;overflow:hidden;margin-top:8px}.mc-meter>span{display:block;height:100%;background:linear-gradient(90deg,#40c98c,#f2d76c);width:0}.mc-choice{display:block;width:100%;text-align:left;padding:15px;margin:9px 0;border:1px solid #405b7f;border-radius:10px;background:#10213a;color:#f4f7ff;cursor:pointer}.mc-choice:hover{border-color:#f2d76c;background:#1a304d}.mc-choice b{display:block;margin-bottom:4px}.mc-result{padding:18px;border:1px solid #b89935;border-radius:12px;background:#292713}.mc-game-result{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;text-align:center}.mc-game-result strong{font-size:clamp(24px,4vw,42px)}.mc-status{min-height:22px;color:#f3d879;font-size:12px}.mc-divider{height:1px;background:#314866;margin:18px 0}.mc-retirement{border:1px solid #d2a64d;background:linear-gradient(135deg,#332719,#111a29);padding:25px;border-radius:15px;text-align:center}.mc-scroll{max-height:65vh;overflow:auto;padding-right:3px}@media(max-width:720px){.mc-mode-grid,.mc-grid,.mc-grid.three,.mc-bars{grid-template-columns:1fr}.mc-mode{min-height:160px}.mc-actions .mc-btn{flex:1 1 100%}.mc-top .mc-btn{width:100%}}";
document.head.appendChild(style);
style.textContent += "\n.mc-xp-card{border-color:#8f7936;background:linear-gradient(145deg,#292719,#111b2b)}\n.mc-xp-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.mc-xp-heading h2{margin:5px 0;font-size:clamp(19px,2.5vw,27px)}\n.mc-xp-points{text-align:right}.mc-xp-points strong{display:block;color:#f4d257;font-size:30px}.mc-xp-points span{font-size:10px;color:#b8c1d2;letter-spacing:.08em}\n.mc-xp-track{height:14px;margin:13px 0 8px;border-radius:20px;background:#202632;overflow:hidden;border:1px solid #4c5159}.mc-xp-track span{display:block;height:100%;background:repeating-linear-gradient(135deg,#f1d04f 0,#f1d04f 7px,#d8b33a 7px,#d8b33a 11px);border-radius:20px;transition:width .2s}\n.mc-attribute-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding-bottom:105px}\n.mc-attribute-panel{padding:16px;border:1px solid #334154;border-radius:14px;min-width:0;background:#142033}\n.mc-attribute-panel header{display:flex;align-items:center;gap:9px;margin-bottom:14px}.mc-attribute-panel header h3{font-size:14px;letter-spacing:.09em;margin:0}\n.mc-attribute-panel-dot{height:9px;width:9px;border-radius:50%;background:#e6c54e}\n.mc-panel-finish{background:linear-gradient(145deg,#192538,#111a28);border-color:#354e71}.mc-panel-shoot{background:linear-gradient(145deg,#142b25,#0e1e1b);border-color:#2f6550}.mc-panel-shoot .mc-attribute-panel-dot{background:#43d28d}\n.mc-panel-play{background:linear-gradient(145deg,#30291a,#211d16);border-color:#6b5934}.mc-panel-play .mc-attribute-panel-dot{background:#e3b84a}\n.mc-panel-defense{background:linear-gradient(145deg,#301e24,#20151a);border-color:#6b3844}.mc-panel-defense .mc-attribute-panel-dot{background:#e56a77}\n.mc-panel-physical{background:linear-gradient(145deg,#242338,#171625);border-color:#4f486d}.mc-panel-physical .mc-attribute-panel-dot{background:#a99be8}\n.mc-panel-mental{background:linear-gradient(145deg,#192b35,#101d25);border-color:#355b68}.mc-panel-mental .mc-attribute-panel-dot{background:#6bc4d8}\n.mc-attribute-list{display:flex;flex-direction:column;gap:15px}.mc-attribute-row{padding:7px 0 9px;border-bottom:1px solid #ffffff12;min-width:0}.mc-attribute-row:last-child{border-bottom:0}\n.mc-attribute-heading{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:baseline;gap:9px;margin-bottom:7px}\n.mc-attribute-name{font-size:12px;color:#d2d9e4;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mc-attribute-current{color:#f5d04f;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums}.mc-attribute-max{font-size:10px;color:#9299a4;font-weight:800;white-space:nowrap}\n.mc-attribute-track{height:17px;background:#333a43;border:1px solid #4a515b;border-radius:4px;overflow:hidden;position:relative}\n.mc-attribute-fill{position:absolute;inset:0 auto 0 0;background:repeating-linear-gradient(135deg,#f2d04d 0,#f2d04d 6px,#d9b63d 6px,#d9b63d 10px);z-index:1}\n.mc-attribute-preview{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,#b8bdc7 0,#b8bdc7 5px,#858d99 5px,#858d99 9px);z-index:2;opacity:.95}\n.mc-attribute-locked{position:absolute;top:0;bottom:0;right:0;background:#171b22;z-index:3}.mc-attribute-cap-marker{position:absolute;top:-2px;bottom:-2px;width:2px;background:#8d929c;z-index:4;transform:translateX(-1px)}\n.mc-attribute-controls{display:flex;justify-content:space-between;align-items:center;margin-top:5px;color:#929baa;font-size:10px}.mc-attribute-controls>div{display:flex;gap:5px}\n.mc-attribute-arrow{min-width:27px;height:24px;border:1px solid #5f6570;border-radius:5px;background:#333943;color:#f3d25a;font-weight:900;cursor:pointer}.mc-attribute-arrow:disabled{opacity:.22;cursor:not-allowed}\n.mc-attribute-purchase{position:sticky;bottom:8px;z-index:5;display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 14px;margin-top:-88px;background:#0b1424ed;border:1px solid #52617a;border-radius:12px;box-shadow:0 12px 32px #0008;backdrop-filter:blur(10px)}\n.mc-attribute-purchase>div{margin-right:auto}.mc-attribute-purchase strong{display:block;color:#f4d257;font-size:20px}.mc-attribute-purchase span{font-size:10px;color:#aebbd0}\n.mc-story-prompt{margin:15px 0 0;color:#f3d45c;font-weight:800}\n.mc-box-summary{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;text-align:center}.mc-box-summary>div{display:flex;flex-direction:column;gap:5px}.mc-box-summary span{font-size:12px;color:#b4c4dd;letter-spacing:.12em}.mc-box-summary strong{font-size:clamp(32px,6vw,58px);color:#f5d45d}.mc-box-summary>b{font-size:12px;color:#a8b5c9}\n.mc-box-team{margin:15px 0;padding:16px;border:1px solid #344c6c;border-radius:13px;background:#0e1a2b}.mc-box-team-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.mc-box-team-head h2{margin:4px 0 0}.mc-box-team-head>strong{font-size:32px;color:#f3d45c}\n.mc-table-wrap{width:100%;overflow-x:auto}.mc-box-table{width:100%;border-collapse:collapse;font-size:11px;white-space:nowrap;font-variant-numeric:tabular-nums}\n.mc-box-table th,.mc-box-table td{padding:8px 9px;text-align:right;border-bottom:1px solid #ffffff14}.mc-box-table th:first-child,.mc-box-table td:first-child{text-align:left;min-width:145px}\n.mc-box-table th{font-size:10px;color:#aebbd0;letter-spacing:.07em}.mc-box-table td:first-child small{display:block;color:#8696ae;font-size:9px}.mc-box-total{font-weight:900;color:#f5d45d;background:#202c3b}\n@media(max-width:820px){.mc-attribute-panels{grid-template-columns:1fr}.mc-attribute-purchase{flex-wrap:wrap}.mc-attribute-purchase .mc-btn{flex:1}.mc-box-table{font-size:10px}.mc-box-table th,.mc-box-table td{padding:7px 6px}}\n@media(max-width:480px){.mc-attribute-heading{gap:6px}.mc-attribute-name{font-size:11px}.mc-xp-heading{align-items:flex-start}.mc-box-team{padding:9px}.mc-attribute-purchase{bottom:4px;padding:8px}.mc-attribute-purchase .mc-btn{font-size:12px;padding:10px}}\n";
const root=document.createElement("div");root.id="nbaMyCareerRoot";root.hidden=true;document.body.appendChild(root);
let career=null,draftPlayer=null,activeStory=null,buildBudget=760,saveError="";
let activeMode="launcher",mygmSnapshot=null,launcherSnapshot=null;
const labelFor=key=>{for(const list of Object.values(groups))for(const pair of list)if(pair[0]===key)return pair[1];return key;};
function allPlayers(){return typeof players!=="undefined"&&Array.isArray(players)?players:[];}
function findPlayer(id){return allPlayers().find(p=>String(p.id)===String(id))||null;}
function playerForCareer(){return career&&findPlayer(career.playerId);}
function seasonName(year){return typeof seasonLabel==="function"?seasonLabel(year):String(year)+"-"+String((year+1)%100).padStart(2,"0");}
function render(html){root.innerHTML='<div class="mc-shell">'+html+'</div>';root.hidden=false;}
function header(title,subtitle){return '<div class="mc-top"><div><div class="mc-kicker">NBA SIM LAB · MYCAREER</div><div style="font-weight:900;font-size:13px;color:#aebdd5">'+escHtml(subtitle||"Une carrière. Une légende.")+'</div></div><button class="mc-btn secondary" id="mcReturn">↩ Écran de départ</button></div><h1 class="mc-title">'+escHtml(title)+'</h1>';}
function attachReturn(){const b=$("mcReturn");if(b)b.onclick=returnToStart;}
function hideGM(){const gm=$("myGMStart");if(gm)gm.hidden=true;document.body.classList.remove("gm-startup");document.body.style.overflow="";}
function loadStored(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null;}catch(_){return null;}}
function loadGMStored(){try{const raw=localStorage.getItem(GM_KEY),value=raw?JSON.parse(raw):null;return value&&value.format==="nba-sim-lab-save"?value:null;}catch(_){return null;}}
function saveGMStored(snapshot){try{if(snapshot)localStorage.setItem(GM_KEY,JSON.stringify(snapshot));return true;}catch(error){saveError="La sauvegarde MyGM locale est trop volumineuse ou inaccessible : "+error.message;return false;}}
function saveCareer(){
 if(!career)return;
 try{
  const calendar=typeof seasonCalendar!=="undefined"&&seasonCalendar?{seasonType:seasonCalendar.seasonType,gamesPerTeam:seasonCalendar.gamesPerTeam,teamCount:seasonCalendar.teamCount,totalGames:seasonCalendar.totalGames,stages:seasonCalendar.stages,teams:seasonCalendar.teams,season:seasonCalendar.season,games:(seasonCalendar.games||[]).map(game=>{const saved=Object.assign({},game);delete saved.playerBoxScores;return saved;})}:null;
  const data=JSON.stringify({career,draftPlayer,players:allPlayers(),seasonYear:typeof seasonYear!=="undefined"?seasonYear:2025,phase:typeof phase!=="undefined"?phase:"regular",seasonCalendar:calendar,seasonResults:typeof seasonResults!=="undefined"?seasonResults:[],retired:typeof retired!=="undefined"?retired:[],actualPlayerStats:window.NBASimActualPlayerStats||{},actualBoxScores:window.NBASimActualBoxScores||{}});
  localStorage.setItem(KEY,data);saveError="";
 }catch(error){saveError="Sauvegarde locale impossible : "+error.message;}
}
function restoreStored(data){
 if(!data||!data.career||!Array.isArray(data.players))return false;
 try{players=data.players;seasonYear=Number(data.seasonYear)||2025;phase=data.phase||"regular";seasonCalendar=data.seasonCalendar||null;seasonResults=data.seasonResults||[];if(typeof retired!=="undefined")retired=data.retired||[];customTeams=[];nextCustomTeamId=1;nextPlayerId=Math.max(1000,...players.map(p=>(Number(p.id)||0)+1));career=data.career;draftPlayer=data.draftPlayer||career.draftPlayer||null;career.player=findPlayer(career.playerId)||career.player||null;window.NBASimActualPlayerStats=data.actualPlayerStats||{};window.NBASimActualBoxScores=data.actualBoxScores||{};if(!findPlayer(career.playerId)&&career.player&&!career.retired)players.push(career.player);if(typeof window.NBASimPrepareMyCareerMode==="function")window.NBASimPrepareMyCareerMode();if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();if(typeof renderAll==="function")renderAll();return true;}catch(error){saveError="Reprise impossible : "+error.message;return false;}
}
function showPicker(){
 hideGM();render('<div style="padding-top:clamp(25px,8vh,90px)"><div class="mc-kicker">NBA SIM LAB · CHOISIS TON EXPÉRIENCE</div><h1 class="mc-title">Quelle carrière<br>vas-tu écrire ?</h1><p class="mc-muted">Choisis ton mode de jeu. MyGM conserve la gestion de franchise. MyCareer te place dans la peau d’un seul joueur NBA.</p><div class="mc-mode-grid"><button class="mc-mode" id="mcChooseCareer"><div class="mc-kicker">MODE JOUEUR</div><h2>MyCareer</h2><p>Crée ton joueur, passe par la Draft et construis ta légende jusqu’à la retraite.</p></button><button class="mc-mode" id="mcChooseGM"><div class="mc-kicker">MODE FRANCHISE</div><h2>MyGM</h2><p>Contrôle une franchise, gère ton effectif, les transferts, la saison et les playoffs.</p></button></div></div>');
 $("mcChooseCareer").onclick=openCareerHome;
 $("mcChooseGM").onclick=()=>{const hasFranchise=!!mygmSnapshot;if(mygmSnapshot&&typeof window.NBASimRestoreMyGMState==="function"){if(!window.NBASimRestoreMyGMState(mygmSnapshot))saveError="La reprise MyGM a échoué. Tu peux charger une sauvegarde JSON.";}else if(launcherSnapshot&&typeof window.NBASimRestoreMyGMState==="function"){window.NBASimRestoreMyGMState(launcherSnapshot);}activeMode="gm";root.hidden=true;const gm=$("myGMStart");if(gm)gm.hidden=hasFranchise;document.body.classList.toggle("gm-startup",!hasFranchise);document.body.style.overflow=hasFranchise?"":"hidden";if(!hasFranchise&&typeof window.renderAll==="function")window.renderAll();};
}
function openCareerHome(){
 activeMode="career";hideGM();const saved=loadStored();
 render(header("MYCAREER","Ta carrière NBA, de la Draft à la retraite.")+'<div class="mc-card"><h2>Une carrière à ton image</h2><p class="mc-muted">Crée un joueur de 19 ans, choisis sa spécialité, impressionne les recruteurs et gagne ta place dans la ligue. Toutes les autres franchises restent contrôlées par l’IA.</p><div class="mc-actions">'+(saved&&saved.career?'<button class="mc-btn primary" id="mcContinue">Continuer ma carrière</button>':'')+'<button class="mc-btn primary" id="mcNewCareer">Nouvelle carrière</button><button class="mc-btn secondary" id="mcModeSelect">Changer de mode</button></div><p class="mc-status">'+saveError+'</p></div>');
 attachReturn();if($("mcContinue"))$("mcContinue").onclick=()=>{if(restoreStored(loadStored())){if(career.playerId)renderDashboard();else showDraftStory();}else{saveError="La sauvegarde MyCareer est invalide.";openCareerHome();}};$("mcNewCareer").onclick=beginNewCareer;$("mcModeSelect").onclick=showPicker;
}
function beginNewCareer(){
 if(loadStored()&&!confirm("Remplacer la sauvegarde MyCareer actuelle par une nouvelle carrière ?"))return;
 localStorage.removeItem(KEY);career=null;draftPlayer=null;
 players=allPlayers().filter(p=>!p.myCareer&&p.source!=="MyCareer · Rival généré"&&((typeof nbaTeams!=="undefined"&&nbaTeams.some(team=>team[0]===p.team))||String(p.team).toUpperCase()==="FA"||String(p.team).toUpperCase()==="FREE_AGENT"));
 customTeams=[];nextCustomTeamId=1;if(typeof resetLeague==="function")resetLeague();seasonCalendar=null;if(typeof window.NBASimPrepareMyCareerMode==="function")window.NBASimPrepareMyCareerMode();
 if(!players.length&&$("demo")){$("demo").click();showCreation();}else showCreation();
}
function specialtyOptions(pos){return(profiles[pos]||profiles.SF).map(x=>'<option value="'+x.id+'">'+x.name+'</option>').join("");}
function profileFor(pos,id){const list=profiles[pos]||profiles.SF;return list.find(x=>x.id===id)||list[0];}
function showCreation(){
 draftPlayer={name:"",pos:"PG",height:188,weight:82,wingspan:193,specialty:"floor_general",attributes:{}};
 render(header("CRÉE TON JOUEUR","Étape 1 · identité et physique")+'<div class="mc-card"><div class="mc-grid three"><label class="mc-field">Nom du joueur<input id="mcName" maxlength="42" placeholder="Ton nom"></label><label class="mc-field">Poste<select id="mcPosition"><option>PG</option><option>SG</option><option>SF</option><option>PF</option><option>C</option></select></label><label class="mc-field">Spécialité<select id="mcSpecialty">'+specialtyOptions("PG")+'</select></label><label class="mc-field">Taille (cm)<input id="mcHeight" type="number" min="150" max="240" value="188"></label><label class="mc-field">Poids (kg)<input id="mcWeight" type="number" min="50" max="180" value="82"></label><label class="mc-field">Envergure (cm)<input id="mcWingspan" type="number" min="150" max="260" value="193"></label></div><p class="mc-muted">Tu débutes à 19 ans. La taille, le poids et l’envergure influencent les plafonds de progression physique.</p><div class="mc-actions"><button class="mc-btn primary" id="mcBuild">Personnaliser les attributs →</button><button class="mc-btn secondary" id="mcCancel">Annuler</button></div><p class="mc-status" id="mcCreateStatus"></p></div>');
 attachReturn();$("mcPosition").onchange=()=>{$("mcSpecialty").innerHTML=specialtyOptions($("mcPosition").value);};
 $("mcBuild").onclick=()=>{
  const name=$("mcName").value.trim(),pos=$("mcPosition").value,height=clamp($("mcHeight").value,150,240),weight=clamp($("mcWeight").value,50,180),wingspan=clamp($("mcWingspan").value,150,260);
  if(!name){$("mcCreateStatus").textContent="Entre ton nom pour continuer.";return;}
  if(wingspan<height-5){$("mcCreateStatus").textContent="L’envergure doit être proche de la taille ou plus grande.";return;}
  draftPlayer={name,pos,height,weight,wingspan,specialty:$("mcSpecialty").value,attributes:Object.fromEntries(attrs.map(p=>[p[0],40]))};
  draftPlayer.attributes.potential=95;draftPlayer.attributes.workEthic=75;draftPlayer.attributes.consistency=65;draftPlayer.attributes.intangibles=55;
  renderBuilder();
 };
 $("mcCancel").onclick=openCareerHome;
}
function capFor(profile,key){if(key==="potential"||key==="intangibles"||profile.core.includes(key))return 99;if(profile.secondary.includes(key))return 94;return 86;}
function pointsUsed(){return attrs.reduce((n,p)=>n+Math.max(0,(Number(draftPlayer.attributes[p[0]])||40)-40),0);}
function buildOverall(profile){const values=profile.core.map(k=>Number(draftPlayer.attributes[k])||40),base=values.reduce((a,b)=>a+b,0)/Math.max(1,values.length);return Math.round(clamp(base*.94+(Number(draftPlayer.attributes.intangibles)||40)*.06,40,99));}
function updateBuild(){
 const p=profileFor(draftPlayer.pos,draftPlayer.specialty),used=pointsUsed();
 $("mcBuildScore").innerHTML='<div class="mc-metric"><strong>'+buildOverall(p)+'</strong><span>GÉN estimé</span></div><div class="mc-metric"><strong>'+Math.max(0,buildBudget-used)+'</strong><span>Points restants</span></div>';
 $("mcBuildMeter").style.width=Math.min(100,used/buildBudget*100)+"%";$("mcBuildStatus").textContent=used+" / "+buildBudget+" points utilisés. Les attributs de ta spécialité pèsent le plus dans le général.";$("mcConfirmBuild").disabled=used>buildBudget;
}
function renderBuilder(){
 const profile=profileFor(draftPlayer.pos,draftPlayer.specialty);
 const sections=Object.entries(groups).map(([group,items])=>'<div class="mc-card"><h3>'+group+'</h3><div class="mc-bars">'+items.map(pair=>{
  const k=pair[0],v=Number(draftPlayer.attributes[k])||40,m=capFor(profile,k);
  return '<div class="mc-attribute"><label for="mcAttr-'+k+'">'+pair[1]+' <small style="color:#8398b7">MAX '+m+'</small></label><b>'+v+'</b><input id="mcAttr-'+k+'" data-mc-attribute="'+k+'" type="range" min="25" max="'+m+'" value="'+v+'"></div>';
 }).join("")+'</div></div>').join("");
 render(header("RÉPARTIS TES POINTS","Étape 2 · "+profile.name)+'<div class="mc-card"><div class="mc-grid" id="mcBuildScore"></div><div class="mc-meter"><span id="mcBuildMeter"></span></div><p class="mc-status" id="mcBuildStatus"></p><p class="mc-muted">Chaque point dépensé augmente un attribut. Les attributs principaux de ta spécialité peuvent atteindre 99.</p></div><div class="mc-scroll">'+sections+'</div><div class="mc-actions"><button class="mc-btn primary" id="mcConfirmBuild">Confirmer le joueur et préparer la Draft →</button><button class="mc-btn secondary" id="mcBackCreation">Retour</button></div>');
 attachReturn();root.querySelectorAll("[data-mc-attribute]").forEach(input=>input.oninput=()=>{
  const k=input.dataset.mcAttribute,v=Number(input.value),old=Number(draftPlayer.attributes[k])||40;
  if(pointsUsed()-Math.max(0,old-40)+Math.max(0,v-40)>buildBudget){input.value=old;return;}
  draftPlayer.attributes[k]=v;input.previousElementSibling.textContent=v;updateBuild();
 });
 $("mcConfirmBuild").onclick=confirmBuild;$("mcBackCreation").onclick=showCreation;updateBuild();
}
const draftScenes=[
{title:"Le Combine NBA",body:"Les recruteurs observent ton attitude pendant les tests physiques.",choices:[{label:"Tout donner sur les tests athlétiques",detail:"Tu impressionnes par ton explosivité.",grade:3,emotion:5,popularity:2,attribute:"vertical",gain:2},{label:"Montrer ton intelligence de jeu",detail:"Tu lis les exercices comme un vétéran.",grade:2,emotion:3,chemistry:3,attribute:"basketballIQ",gain:2},{label:"Rester prudent et éviter les risques",detail:"Tu protèges ton corps, mais marques moins les esprits.",grade:-1,emotion:1,attribute:"durability",gain:2}]},
{title:"Entretien avec les franchises",body:"Une franchise te demande quel type de coéquipier tu seras.",choices:[{label:"Promettre de faire gagner l’équipe",detail:"Les dirigeants apprécient ton ambition.",grade:2,chemistry:5,popularity:2,attribute:"intangibles",gain:2},{label:"Parler de ton potentiel de superstar",detail:"Tu assumes tes ambitions personnelles.",grade:1,popularity:5,emotion:2,attribute:"clutch",gain:2},{label:"Mettre le collectif avant tout",detail:"Tu rassures les entraîneurs.",grade:2,chemistry:7,attribute:"passing",gain:2}]},
{title:"Dernier entraînement avant la Draft",body:"Il te reste une occasion de convaincre les recruteurs.",choices:[{label:"Travailler ta spécialité",detail:"Tu consolides ce qui te rend unique.",grade:3,emotion:3,attribute:"",gain:0},{label:"Améliorer ton point faible",detail:"Tu montres une grande capacité d’adaptation.",grade:2,chemistry:2,attribute:"consistency",gain:2},{label:"Faire un entraînement médiatique",detail:"Tu gagnes de la visibilité avant la sélection.",grade:1,popularity:8,attribute:"intangibles",gain:1}]}
];
function confirmBuild(){
 if(pointsUsed()>buildBudget)return;
 career={version:1,playerId:null,player:null,teamCode:null,teamName:null,seasonNumber:1,draftScore:0,draftScene:0,emotions:70,chemistry:60,popularity:35,lossStreak:0,rivalId:null,rivalName:"",generatedRival:false,lastRoundPlayed:0,gamesPlayed:0,wins:0,losses:0,seasonStats:{pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0},seasonHistory:[],storyHistory:[],lastGame:null,retired:false,pendingStory:true};
 career.draftPlayer=draftPlayer;saveCareer();showDraftStory();
}
function showDraftStory(){
 const scene=draftScenes[career.draftScene];if(!scene)return revealDraft();
 render(header("AVANT LA DRAFT","Décision narrative "+(career.draftScene+1)+" / 3")+'<div class="mc-card"><div class="mc-kicker">SCOUTING REPORT</div><h2>'+scene.title+'</h2><p class="mc-muted">'+scene.body+'</p>'+scene.choices.map((x,i)=>'<button class="mc-choice" data-draft-choice="'+i+'"><b>'+x.label+'</b><span class="mc-muted">'+x.detail+'</span></button>').join("")+'</div>');
 attachReturn();root.querySelectorAll("[data-draft-choice]").forEach(b=>b.onclick=()=>{
  const x=scene.choices[Number(b.dataset.draftChoice)];career.draftScore+=x.grade;career.emotions=clamp(career.emotions+(x.emotion||0),0,100);career.chemistry=clamp(career.chemistry+(x.chemistry||0),0,100);career.popularity=clamp(career.popularity+(x.popularity||0),0,100);
  if(x.attribute)draftPlayer.attributes[x.attribute]=clamp((Number(draftPlayer.attributes[x.attribute])||40)+(x.gain||0),20,99);
  career.storyHistory.push({stage:"Draft",event:scene.title,choice:x.label});career.draftScene++;career.draftPlayer=draftPlayer;saveCareer();if(career.draftScene>=draftScenes.length)revealDraft();else showDraftStory();
 });
}
function randomAttributes(pos){
 const overall=59+rand()*15;
 const big=["PF","C"].includes(pos),guard=["PG","SG"].includes(pos);
 const result={};
 attrs.forEach(([key])=>{
  let bonus=0;
  if(["threePoint","midRange","freeThrow","shotIQ"].includes(key))bonus=guard?5:big?-5:2;
  if(["block","interiorDefense","defensiveRebound","offensiveRebound","strength"].includes(key))bonus=big?8:-3;
  if(["speed","acceleration","agility","ballHandle","passing","playmaking"].includes(key))bonus=guard?7:big?-6:1;
  if(["finishing","closeShot","dunk","vertical"].includes(key))bonus=big?5:2;
  result[key]=clamp(Math.round(overall+bonus+(rand()-.5)*18),35,88);
 });
 result.potential=clamp(Math.round(76+rand()*19),65,95);
 result.workEthic=clamp(Math.round(55+rand()*40),40,99);
 result.consistency=clamp(Math.round(55+rand()*30),40,90);
 result.intangibles=clamp(Math.round(55+rand()*25),40,90);
 return result;
}
function createLeaguePlayer(team,pos,index){
 const first=["Marcus","Jordan","Darius","Malik","Cameron","Tyler","Jalen","Isaiah","Devin","Andre","Trevor","Noah","Jayden","Aaron","Dylan"];
 const last=["Carter","Brooks","Williams","Hayes","Mitchell","Parker","Reed","Bennett","Morris","Foster","Collins","Price","Turner","Cooper","Ward"];
 const name=first[Math.floor(rand()*first.length)]+" "+last[Math.floor(rand()*last.length)]+" "+team[0];
 const height=(typeof defaultHeight==="function"?defaultHeight(pos,name):({PG:188,SG:195,SF:202,PF:208,C:214}[pos]||198));
 const weight=Math.round((({PG:82,SG:88,SF:98,PF:108,C:116}[pos]||95)+(rand()-.5)*12));
 const age=19+Math.floor(rand()*14);
 return {id:typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now()+index,name,team:team[0],pos,age,height,weight,wingspan:height+Math.round(4+rand()*13),pts:+(4+rand()*12).toFixed(1),reb:+(1.5+rand()*6).toFixed(1),ast:+(.5+rand()*4.5).toFixed(1),stl:+(.3+rand()*1.2).toFixed(1),blk:+(rand()*(pos==="C"?.9:.5)).toFixed(1),ts:.49+rand()*.13,three:.28+rand()*.13,mpg:12+Math.round(rand()*18),season:seasonName(typeof seasonYear!=="undefined"?seasonYear:2025),source:"MyCareer · Joueur généré",attributes:randomAttributes(pos),trophies:[],history:[],careerGames:[],rookie:age<=21};
}
function ensureCareerLeague(){
 if(typeof nbaTeams==="undefined"||!Array.isArray(nbaTeams))return;
 customTeams=[];
 const rotation=["PG","SG","SF","PF","C"];
 nbaTeams.forEach(team=>{
  players.forEach(p=>{if(p.team!==team[0]&&!nbaTeams.some(n=>n[0]===p.team)&&p.team!=="FA"&&!p.myCareer)p.team="FA";});
  let roster=players.filter(p=>p.team===team[0]&&!p.retired&&!p.isRetired);
  let guard=0;
  while(roster.length<10&&guard<12){const created=createLeaguePlayer(team,rotation[roster.length%rotation.length],guard++);players.push(created);roster.push(created);}
 });
 if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();
}
function secureCareerRoster(player){
 if(!player)return;
 const roster=players.filter(p=>p!==player&&p.team===player.team&&!p.retired&&!p.isRetired);
 while(roster.length>14){
  roster.sort((a,b)=>(typeof overallRating==="function"?overallRating(a):Number(a.mpg)||50)-(typeof overallRating==="function"?overallRating(b):Number(b.mpg)||50));
  const released=roster.shift();released.team="FA";released.mpg=0;released.previousTeam=player.team;
 }
 player.mpg=Math.max(30,Number(player.mpg)||0);
 if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();
}
function revealDraft(){
 const grade=clamp(Math.round(74+career.draftScore*2.1+(rand()-.5)*8),60,98),pick=clamp(Math.round(18-(grade-74)*.52+(rand()-.5)*5),1,30);
 const list=(typeof nbaTeams!=="undefined"?nbaTeams:[]).slice().sort((a,b)=>((a[0].charCodeAt(0)*13+a[0].charCodeAt(1)*7)%31)-((b[0].charCodeAt(0)*13+b[0].charCodeAt(1)*7)%31));
 const chosen=list[(pick-1)%list.length]||["LAL","Los Angeles Lakers","West"];
 draftPlayer.id=typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now();draftPlayer.team=chosen[0];draftPlayer.age=19;draftPlayer.pts=0;draftPlayer.reb=0;draftPlayer.ast=0;draftPlayer.stl=.8;draftPlayer.blk=.3;draftPlayer.ts=.55;draftPlayer.three=.34;draftPlayer.mpg=24;draftPlayer.season=seasonName(typeof seasonYear!=="undefined"?seasonYear:2025);draftPlayer.source="MyCareer · Draft #"+pick;draftPlayer.rookie=true;draftPlayer.trophies=[];draftPlayer.history=[];draftPlayer.careerGames=[];draftPlayer.myCareer=true;draftPlayer.myCareerProfile={specialty:profileFor(draftPlayer.pos,draftPlayer.specialty).name,core:profileFor(draftPlayer.pos,draftPlayer.specialty).core,secondary:profileFor(draftPlayer.pos,draftPlayer.specialty).secondary};
 draftPlayer.attributes.potential=99;career.draftGrade=grade;career.draftPick=pick;career.teamCode=chosen[0];career.teamName=chosen[1];career.playerId=draftPlayer.id;career.player=draftPlayer;
 const rival=allPlayers().filter(p=>p&&nbaTeams.some(team=>team[0]===p.team)&&p.team!==chosen[0]&&p.retired!==true&&p.isRetired!==true&&!p.myCareer).sort((a,b)=>Math.abs((typeof overallRating==="function"?overallRating(a):70)-grade)-Math.abs((typeof overallRating==="function"?overallRating(b):70)-grade))[0];
 career.rivalId=rival?rival.id:null;career.rivalName=rival?rival.name:"Rival à déterminer";players.push(draftPlayer);ensureCareerLeague();secureCareerRoster(draftPlayer);
 career.pendingStory=false;career.storyIndex=0;career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(draftPlayer)),levelsEarned:0,lastAward:0};career.gamesPlayed=0;career.wins=0;career.losses=0;
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();if(typeof phase!=="undefined")phase="regular";career.lastRoundPlayed=0;saveCareer();
 render(header("LA DRAFT NBA","Pick #"+pick+" · "+grade+" de scouting")+'<div class="mc-result"><div class="mc-kicker">ON T’A CHOISI</div><h2 style="font-size:clamp(28px,5vw,48px);margin:10px 0">'+chosen[1]+'</h2><p class="mc-muted">'+chosen[0]+' sélectionne '+escHtml(draftPlayer.name)+' au choix #'+pick+'.</p><div class="mc-grid three"><div class="mc-metric"><strong>'+pick+'</strong><span>Choix de Draft</span></div><div class="mc-metric"><strong>'+grade+'</strong><span>Scouting</span></div><div class="mc-metric"><strong>19</strong><span>Âge de départ</span></div></div></div><div class="mc-card"><h3>Ta rivalité commence</h3><p class="mc-muted">'+(rival?"Les recruteurs te comparent déjà à "+escHtml(rival.name)+".":"La ligue va bientôt te trouver un rival.")+'</p><button class="mc-btn primary" id="mcStartSeason">Commencer ma saison rookie →</button></div>');
 attachReturn();$("mcStartSeason").onclick=()=>{career.pendingStory=false;career.gamesPlayed=0;career.lastRoundPlayed=0;saveCareer();renderDashboard();};
}
const stories=[
{title:"La pression médiatique",body:"Un journaliste affirme que tu n’es pas encore prêt pour la NBA.",choices:[{label:"Répondre avec confiance",detail:"Tu assumes la pression.",e:{emotions:7,popularity:4,clutch:1}},{label:"Rester humble et travailler",detail:"Le vestiaire apprécie ton attitude.",e:{chemistry:6,emotions:3,workEthic:1}},{label:"Éviter les médias",detail:"Tu protèges ta concentration.",e:{emotions:2,popularity:-2,consistency:1}}]},
{title:"Un vétéran veut te conseiller",body:"Un coéquipier expérimenté te propose une séance vidéo.",choices:[{label:"Accepter son aide",detail:"Tu renforces tes liens avec l’équipe.",e:{chemistry:8,basketballIQ:1,emotions:3}},{label:"Travailler seul",detail:"Tu privilégies ton rythme personnel.",e:{emotions:2,ballHandle:1}},{label:"Lui demander un défi",detail:"Une compétition amicale s’installe.",e:{chemistry:2,popularity:2,clutch:1}}]},
{title:"Le coach te convoque",body:"Le coach veut savoir comment tu comptes gagner ta place dans la rotation.",choices:[{label:"Promettre une défense intense",detail:"Tu gagnes du crédit auprès du staff.",e:{chemistry:5,perimeterDefense:1,defensiveIQ:1}},{label:"Demander plus de responsabilités offensives",detail:"Tu montres ton ambition.",e:{emotions:5,popularity:2,offensiveIQ:1}},{label:"Accepter n’importe quel rôle",detail:"Tu privilégies le collectif.",e:{chemistry:8,intangibles:1}}]},
{title:"Une publication devient virale",body:"Une vidéo de ton dernier entraînement circule sur les réseaux.",choices:[{label:"Remercier les supporters",detail:"Ta popularité augmente.",e:{popularity:8,emotions:3}},{label:"Défier ton rival",detail:"La rivalité attire l’attention.",e:{popularity:6,emotions:2,clutch:1}},{label:"Ne pas répondre",detail:"Tu restes concentré sur le basket.",e:{consistency:1,emotions:2}}]},
{title:"Dîner avec les coéquipiers",body:"Le groupe organise une sortie après l’entraînement.",choices:[{label:"Participer et apprendre à les connaître",detail:"La cohésion progresse.",e:{chemistry:9,emotions:4}},{label:"Inviter ton rival à discuter",detail:"Un respect mutuel se construit.",e:{popularity:3,chemistry:4,intangibles:1}},{label:"Rentrer pour récupérer",detail:"Tu protèges ton énergie.",e:{durability:1,stamina:1,emotions:1}}]}
];
function renderStory(){
 const scene=stories[(career.gamesPlayed+career.seasonNumber-1)%stories.length];activeStory=scene;
 render(header("UNE DÉCISION À PRENDRE","Entre deux matchs · Saison "+career.seasonNumber)+'<div class="mc-card"><div class="mc-kicker">MYCAREER STORYLINE</div><h2>'+scene.title+'</h2><p class="mc-muted">'+scene.body+'</p>'+scene.choices.map((x,i)=>'<button class="mc-choice" data-story-choice="'+i+'"><b>'+x.label+'</b><span class="mc-muted">'+x.detail+'</span></button>').join("")+'<p class="mc-status">Tes choix modifient les attributs, les émotions, l’entente d’équipe et ta popularité.</p></div>');
 attachReturn();root.querySelectorAll("[data-story-choice]").forEach(b=>b.onclick=()=>{
  const choice=scene.choices[Number(b.dataset.storyChoice)],p=playerForCareer(),e=choice.e||{};
  career.emotions=clamp(career.emotions+(e.emotions||0),0,100);career.chemistry=clamp(career.chemistry+(e.chemistry||0),0,100);career.popularity=clamp(career.popularity+(e.popularity||0),0,100);
  if(p&&p.attributes)Object.keys(e).forEach(k=>{if(!["emotions","chemistry","popularity"].includes(k))p.attributes[k]=clamp((Number(p.attributes[k])||40)+e[k],20,99);});
  career.storyHistory.push({season:seasonName(seasonYear),event:scene.title,choice:choice.label});career.pendingStory=false;saveCareer();renderDashboard();
 });
}
function careerOverall(p){
 const a=p&&p.attributes||{},profile=p&&p.myCareerProfile;if(!profile||!profile.core||!profile.core.length)return typeof overallRating==="function"?overallRating(p):60;
 const injury=p.injury,ratio=!injury?0:injury.stage==="returning"?clamp((Number(injury.recoveryGamesRemaining)||0)/Math.max(1,Number(injury.recoveryGamesTotal)||1),0,1):1;
 const keys=profile.core.concat(["intangibles"]),weights=profile.core.map(()=>1);weights.push(.35);let total=0,weight=0;
 keys.forEach((k,i)=>{const penalty=injury&&injury.attributePenalties?Number(injury.attributePenalties[k])||0:0;total+=(clamp(Number(a[k])||40,0,100)-penalty*ratio)*weights[i];weight+=weights[i];});
 const moodBonus=career&&String(career.playerId)===String(p.id)?(Number(career.emotions||50)-50)*.025+(Number(career.chemistry||50)-50)*.025+(Number(career.popularity||50)-50)*.01:0;
 return Math.round(clamp(total/weight+moodBonus,40,99));
}
function installCareerOverall(){
 if(typeof window.overallRating!=="function"||window.overallRating.__myCareerWrapped)return;
 const original=window.overallRating,wrapped=function(p){if(p&&p.myCareer&&p.myCareerProfile)return careerOverall(p);return original.apply(this,arguments);};
 wrapped.__myCareerWrapped=true;window.overallRating=wrapped;
}
function nextPlayerGame(){
 if(typeof seasonCalendar==="undefined"||!seasonCalendar||!Array.isArray(seasonCalendar.games))return null;
 return seasonCalendar.games.filter(g=>g.status!=="completed"&&(g.home.code===career.teamCode||g.away.code===career.teamCode)&&Number(g.round)>Number(career.lastRoundPlayed||0)).sort((a,b)=>a.round-b.round)[0]||null;
}
function statLine(){const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||0);return (Number(s.gp)||0)+" MJ · "+((Number(s.pts)||0)/gp).toFixed(1)+" PTS · "+((Number(s.reb)||0)/gp).toFixed(1)+" REB · "+((Number(s.ast)||0)/gp).toFixed(1)+" AST";}
const CAREER_ATTRIBUTE_SECTIONS=[
 {title:"FINITION",tone:"finish",keys:["finishing","closeShot","layup","dunk"]},
 {title:"TIR",tone:"shoot",keys:["midRange","threePoint","freeThrow","shotIQ"]},
 {title:"CRÉATION",tone:"play",keys:["passing","ballHandle","playmaking","offensiveIQ"]},
 {title:"DÉFENSE",tone:"defense",keys:["interiorDefense","perimeterDefense","steal","block","defensiveIQ","defensiveRebound","offensiveRebound"]},
 {title:"PHYSIQUE",tone:"physical",keys:["speed","acceleration","agility","strength","vertical","stamina","durability"]},
 {title:"MENTAL",tone:"mental",keys:["consistency","clutch","potential","workEthic","basketballIQ","intangibles"]}
];
let pendingAttributeUpgrades={};
function xpRequiredForNextPoint(overall){
 return Math.max(100,Math.round(220*Math.pow(1.045,Number(overall||70)-70)));
}
function progressionState(player){
 if(!career.progression)career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(player)),levelsEarned:0,lastAward:0};
 const p=career.progression;
 p.xp=Math.max(0,Number(p.xp)||0);p.totalXp=Math.max(0,Number(p.totalXp)||0);p.points=Math.max(0,Math.floor(Number(p.points)||0));
 p.required=Math.max(100,Number(p.required)||xpRequiredForNextPoint(careerOverall(player)));
 return p;
}
function careerXPFromStats(line,won){
 const pts=Math.max(0,Number(line.pts)||0),reb=Math.max(0,Number(line.reb)||0),ast=Math.max(0,Number(line.ast)||0);
 const stl=Math.max(0,Number(line.stl)||0),blk=Math.max(0,Number(line.blk)||0),minutes=Math.max(0,Number(line.minutes)||0),turnovers=Math.max(0,Number(line.tov)||0);
 const doubleDouble=[pts,reb,ast,stl,blk].filter(value=>value>=10).length>=2;
 return Math.max(15,Math.round(22+pts*2.1+reb*1.8+ast*2.2+stl*4+blk*4+minutes*.45-turnovers*.65+(won?15:0)+(doubleDouble?15:0)));
}
function awardCareerXP(line,won){
 const player=playerForCareer();if(!player)return 0;
 const state=progressionState(player),earned=careerXPFromStats(line||{},won);
 state.xp+=earned;state.totalXp+=earned;state.lastAward=earned;
 let loops=0;
 while(state.xp>=state.required&&loops++<20){
  state.xp-=state.required;state.points++;state.levelsEarned++;
  state.required=xpRequiredForNextPoint(careerOverall(player));
 }
 return earned;
}
function pendingUpgradeCount(){
 return Object.values(pendingAttributeUpgrades).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);
}
function attributeUpgradeCap(player,key){
 const profile=player&&player.myCareerProfile||{};
 return capFor({core:Array.isArray(profile.core)?profile.core:[],secondary:Array.isArray(profile.secondary)?profile.secondary:[]},key);
}
function renderCareerBoxScoreSide(side){
 if(!side)return "";
 const rows=Array.isArray(side.players)?side.players:[];
 const totals={pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,pf:0,minutes:0,fgm:0,fga:0,threeMade:0,threeAttempts:0,ftm:0,fta:0};
 const body=rows.map(row=>{
  Object.keys(totals).forEach(key=>totals[key]+=Number(row[key])||0);
  return '<tr><td><b>'+escHtml(row.name)+'</b><small>'+escHtml(row.pos||"")+'</small></td><td>'+Math.round(Number(row.minutes)||0)+'</td><td><b>'+Number(row.pts||0)+'</b></td><td>'+Number(row.fgm||0)+'/'+Number(row.fga||0)+'</td><td>'+Number(row.threeMade||0)+'/'+Number(row.threeAttempts||0)+'</td><td>'+Number(row.ftm||0)+'/'+Number(row.fta||0)+'</td><td>'+Number(row.reb||0)+'</td><td>'+Number(row.ast||0)+'</td><td>'+Number(row.stl||0)+'</td><td>'+Number(row.blk||0)+'</td><td>'+Number(row.tov||0)+'</td><td>'+Number(row.pf||0)+'</td></tr>';
 }).join("");
 return '<section class="mc-box-team"><div class="mc-box-team-head"><div><div class="mc-kicker">'+escHtml(side.code)+'</div><h2>'+escHtml(side.name)+'</h2></div><strong>'+Number(side.score||0)+'</strong></div><div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>Joueur</th><th>MIN</th><th>PTS</th><th>FG</th><th>3PT</th><th>FT</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>PF</th></tr></thead><tbody>'+body+'<tr class="mc-box-total"><td><b>TOTAL ÉQUIPE</b></td><td>'+Math.round(totals.minutes)+'</td><td>'+totals.pts+'</td><td>'+totals.fgm+'/'+totals.fga+'</td><td>'+totals.threeMade+'/'+totals.threeAttempts+'</td><td>'+totals.ftm+'/'+totals.fta+'</td><td>'+totals.reb+'</td><td>'+totals.ast+'</td><td>'+totals.stl+'</td><td>'+totals.blk+'</td><td>'+totals.tov+'</td><td>'+totals.pf+'</td></tr></tbody></table></div></section>';
}
function captureCareerBoxScore(game){
 const makeSide=(sideKey,teamRef,score)=>{
  const code=String(teamRef.code),raw=game.playerBoxScores&&game.playerBoxScores[sideKey]||{};
  const roster=allPlayers().filter(player=>String(player.team)===code&&!player.retired&&!player.isRetired);
  const ids=new Set(roster.map(player=>String(player.id)));
  Object.keys(raw).forEach(id=>{if(!ids.has(String(id))){const player=findPlayer(id);if(player)roster.push(player);}});
  const rows=roster.map(player=>{
   const line=raw[String(player.id)]||{};
   return {id:player.id,name:String(player.name||"Joueur"),pos:String(player.pos||""),minutes:Number(line.minutes)||0,pts:Number(line.pts)||0,reb:Number(line.reb)||0,ast:Number(line.ast)||0,stl:Number(line.stl)||0,blk:Number(line.blk)||0,tov:Number(line.tov)||0,pf:Number(line.pf)||0,fgm:Number(line.fgm)||0,fga:Number(line.fga)||0,threeMade:Number(line.threeMade)||0,threeAttempts:Number(line.threeAttempts)||0,ftm:Number(line.ftm)||0,fta:Number(line.fta)||0};
  }).sort((a,b)=>b.minutes-a.minutes||b.pts-a.pts);
  return {code,name:String(teamRef.name||code),score:Number(score)||0,players:rows};
 };
 return {home:makeSide("home",game.home,game.homeScore),away:makeSide("away",game.away,game.awayScore)};
}
function renderLastBoxScore(){
 const game=career&&career.lastGame;if(!game||!game.boxScore)return renderDashboard();
 const home=game.boxScore.home,away=game.boxScore.away;
 render(header("BOX SCORE","Match "+career.gamesPlayed+" · "+game.result)+
  '<div class="mc-card mc-box-summary"><div><span>'+escHtml(home.code)+'</span><strong>'+home.score+'</strong></div><b>FINAL</b><div><span>'+escHtml(away.code)+'</span><strong>'+away.score+'</strong></div></div>'+
  renderCareerBoxScoreSide(home)+renderCareerBoxScoreSide(away)+
  '<div class="mc-actions"><button class="mc-btn primary" id="mcBoxContinue">'+(career.pendingStory?"Continuer vers ton histoire →":"Retour à ma carrière")+'</button><button class="mc-btn secondary" id="mcBoxAttributes">Voir mes attributs</button></div>');
 attachReturn();
 $("mcBoxContinue").onclick=()=>{if(career.pendingStory)renderStory();else renderDashboard();};
 $("mcBoxAttributes").onclick=showCareerAttributes;
}
function renderDashboard(){
 const p=playerForCareer();if(!p||career.retired)return renderRetirement();installCareerOverall();
 const rival=career.rivalId!=null?findPlayer(career.rivalId):null,next=nextPlayerGame(),game=career.lastGame,injury=p.injury;
 const xp=progressionState(p),storyDue=career.pendingStory===true,seasonComplete=career.gamesPlayed>=82||!next;
 const injuryText=injury?(injury.label||injury.severity)+" · "+(Number(injury.restGamesRemaining)||0)+" matchs avant retour":"En santé";
 render(header("SAISON "+career.seasonNumber,p.name+" · "+p.team+" · "+p.age+" ans")+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN</span></div><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div></div>'+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.emotions+'</strong><span>Émotions</span></div><div class="mc-metric"><strong>'+career.chemistry+'</strong><span>Entente d’équipe</span></div><div class="mc-metric"><strong>'+career.popularity+'</strong><span>Popularité</span></div></div>'+
 '<div class="mc-card"><div class="mc-grid"><div><div class="mc-kicker">STATISTIQUES DE LA SAISON</div><h2>'+statLine()+'</h2><p class="mc-muted">Blessure : '+injuryText+'</p><p class="mc-muted">Prochain match : '+(next?escHtml(next.home.name)+" vs "+escHtml(next.away.name):"Saison régulière terminée")+'</p></div><div><div class="mc-kicker">TON RIVAL</div><h2>'+(rival?escHtml(rival.name):escHtml(career.rivalName||"Rival à déterminer"))+'</h2><p class="mc-muted">'+(rival?escHtml(rival.team)+" · GÉN "+(typeof overallRating==="function"?overallRating(rival):"—"):"Un nouveau rival sera identifié.")+'</p></div></div><div class="mc-divider"></div><div class="mc-kicker">DERNIER MATCH</div>'+
 (game?'<div class="mc-game-result"><b>'+escHtml(game.teamCode)+'</b><strong>'+game.teamScore+' – '+game.opponentScore+'</strong><b>'+escHtml(game.opponentCode)+'</b></div><p class="mc-muted" style="text-align:center">'+escHtml(game.result)+' · '+escHtml(game.line)+'</p>':'<p class="mc-muted">Tu n’as pas encore disputé ton premier match NBA.</p>')+
 '<div class="mc-actions"><button class="mc-btn primary" id="mcNextMatch" '+(!next||storyDue?"disabled":"")+'>Simuler le prochain match →</button><button class="mc-btn primary" id="mcSimSeason" '+(seasonComplete||storyDue?"disabled":"")+'>Simuler la saison →</button><button class="mc-btn secondary" id="mcAttributes">Voir mes attributs'+(xp.points>0?" · "+xp.points+" point(s)":"")+'</button>'+(game&&game.boxScore?'<button class="mc-btn secondary" id="mcViewBox">Voir le box score</button>':'')+'<button class="mc-btn secondary" id="mcSave">Sauvegarder</button></div>'+
 (storyDue?'<p class="mc-story-prompt">Une histoire t’attend après '+career.gamesPlayed+' matchs.</p><div class="mc-actions"><button class="mc-btn primary" id="mcOpenStory">Faire mon choix d’histoire →</button></div>':'')+
 '<p class="mc-status">'+escHtml(saveError||"La simulation MyCareer est isolée de MyGM.")+'</p></div>');
 attachReturn();
 $("mcNextMatch").onclick=()=>simulateNextMatch();
 $("mcSimSeason").onclick=simulateCareerSeason;
 $("mcAttributes").onclick=()=>{pendingAttributeUpgrades={};showCareerAttributes();};
 if($("mcViewBox"))$("mcViewBox").onclick=renderLastBoxScore;
 if($("mcOpenStory"))$("mcOpenStory").onclick=renderStory;
 $("mcSave").onclick=()=>{saveCareer();renderDashboard();};
 if(!next&&career.gamesPlayed>=82)finishSeason();
}
function showCareerAttributes(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const progress=progressionState(p),pending=pendingUpgradeCount(),sections=CAREER_ATTRIBUTE_SECTIONS.map(section=>{
  const items=section.keys.map(key=>{
   const existing=attrs.find(pair=>pair[0]===key);if(!existing)return "";
   const current=clamp(Number(p.attributes[key])||0,0,99),cap=attributeUpgradeCap(p,key),planned=clamp(Number(pendingAttributeUpgrades[key])||0,0,cap-current),preview=current+planned;
   const fill=(current/99*100).toFixed(3),capAt=(cap/99*100).toFixed(3),previewWidth=(planned/99*100).toFixed(3);
   const canAdd=progress.points>pending&&preview<cap,canRemove=planned>0;
   return '<article class="mc-attribute-row"><div class="mc-attribute-heading"><span class="mc-attribute-name">'+escHtml(existing[1])+'</span><span class="mc-attribute-current">'+preview+'</span><span class="mc-attribute-max">'+cap+' MAX</span></div><div class="mc-attribute-track"><span class="mc-attribute-fill" style="width:'+fill+'%"></span><span class="mc-attribute-preview" style="left:'+fill+'%;width:'+previewWidth+'%"></span><span class="mc-attribute-locked" style="left:'+capAt+'%"></span><span class="mc-attribute-cap-marker" style="left:'+capAt+'%"></span></div><div class="mc-attribute-controls"><span>'+current+' / 99</span><div><button type="button" class="mc-attribute-arrow" data-remove-upgrade="'+key+'" '+(!canRemove?"disabled":"")+' aria-label="Retirer le point de '+escHtml(existing[1])+'">←</button><button type="button" class="mc-attribute-arrow" data-add-upgrade="'+key+'" '+(!canAdd?"disabled":"")+' aria-label="Améliorer '+escHtml(existing[1])+'">→</button></div></div></article>';
  }).join("");
  return '<section class="mc-attribute-panel mc-panel-'+section.tone+'"><header><span class="mc-attribute-panel-dot"></span><h3>'+section.title+'</h3></header><div class="mc-attribute-list">'+items+'</div></section>';
 }).join("");
 const ratio=Math.min(100,(progress.xp/progress.required)*100),remaining=Math.max(0,progress.required-progress.xp);
 render(header("MES ATTRIBUTS","Spécialité · "+(p.myCareerProfile.specialty||"MyCareer"))+
  '<div class="mc-card mc-xp-card"><div class="mc-xp-heading"><div><div class="mc-kicker">PROGRESSION DU JOUEUR</div><h2>'+progress.xp+' / '+progress.required+' EXP</h2></div><div class="mc-xp-points"><strong>'+progress.points+'</strong><span>POINTS DISPONIBLES</span></div></div><div class="mc-xp-track"><span style="width:'+ratio.toFixed(2)+'%"></span></div><p class="mc-muted">Encore '+remaining+' EXP pour gagner un point d’attribut · '+progress.totalXp+' EXP gagnée(s) au total.</p><p class="mc-status">'+(progress.lastAward?'Dernier match : +'+progress.lastAward+' EXP.':'Tes performances en match déterminent ton EXP.')+'</p></div>'+
  '<div class="mc-card mc-overall-card"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN actuel</span></div><p class="mc-muted">Les barres jaunes montrent ton niveau. Les zones gris foncé sont au-delà de ton plafond de spécialité. Les flèches préparent les améliorations avant achat.</p></div>'+
  '<div class="mc-attribute-panels">'+sections+'</div>'+
  '<div class="mc-attribute-purchase"><div><strong>'+pending+' / '+progress.points+'</strong><span>Points sélectionnés</span></div><button class="mc-btn primary" id="mcBuyAttributes" '+(pending===0||pending>progress.points?"disabled":"")+'>Acheter les améliorations</button><button class="mc-btn secondary" id="mcClearAttributes" '+(pending===0?"disabled":"")+'>Annuler</button></div>'+
  '<div class="mc-actions"><button class="mc-btn secondary" id="mcBackDashboard">Retour à ma carrière</button></div>');
 attachReturn();
 root.querySelectorAll("[data-add-upgrade]").forEach(button=>button.onclick=()=>{
  const key=button.dataset.addUpgrade,cap=attributeUpgradeCap(p,key),current=Number(p.attributes[key])||0,planned=Number(pendingAttributeUpgrades[key])||0;
  if(progress.points>pendingUpgradeCount()&&current+planned<cap){pendingAttributeUpgrades[key]=planned+1;showCareerAttributes();}
 });
 root.querySelectorAll("[data-remove-upgrade]").forEach(button=>button.onclick=()=>{
  const key=button.dataset.removeUpgrade,planned=Number(pendingAttributeUpgrades[key])||0;
  if(planned>0){if(planned===1)delete pendingAttributeUpgrades[key];else pendingAttributeUpgrades[key]=planned-1;showCareerAttributes();}
 });
 $("mcBuyAttributes").onclick=()=>{
  const count=pendingUpgradeCount();if(!count||count>progress.points)return;
  Object.entries(pendingAttributeUpgrades).forEach(([key,value])=>{
   const cap=attributeUpgradeCap(p,key);
   p.attributes[key]=clamp((Number(p.attributes[key])||0)+Math.max(0,Number(value)||0),0,cap);
  });
  progress.points-=count;progress.required=xpRequiredForNextPoint(careerOverall(p));pendingAttributeUpgrades={};
  if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();
  saveCareer();showCareerAttributes();
 };
 $("mcClearAttributes").onclick=()=>{pendingAttributeUpgrades={};showCareerAttributes();};
 $("mcBackDashboard").onclick=()=>{pendingAttributeUpgrades={};renderDashboard();};
}
function createNewRival(p){
 const candidates=(typeof nbaTeams!=="undefined"?nbaTeams:[]).filter(t=>t[0]!==career.teamCode),team=candidates[Math.floor(rand()*candidates.length)];
 const values=Object.fromEntries(attrs.map(x=>[x[0],clamp((Number(p.attributes[x[0]])||65)+(rand()-.5)*12,45,90)]));
 const name="Rival "+["Jordan","Darius","Tyrese","Malik","Cameron","Jaylen"][Math.floor(rand()*6)]+" "+["Carter","Brooks","Williams","Hayes","Mitchell"][Math.floor(rand()*5)];
 const rival={id:typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now(),name,team:team[0],pos:p.pos,age:20,pts:0,reb:0,ast:0,stl:.8,blk:.4,ts:.56,three:.35,mpg:26,height:p.height,weight:p.weight,wingspan:p.wingspan,attributes:values,history:[],trophies:[],careerGames:[],source:"MyCareer · Rival généré"};
 players.push(rival);secureCareerRoster(rival);career.rivalId=rival.id;career.rivalName=name;career.generatedRival=true;if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();
}
function simulateNextMatch(){
 const p=playerForCareer();if(!p||career.retired)return;
 const target=nextPlayerGame();if(!target){finishSeason();return;}
 if(typeof window.simulateScheduledGame!=="function"){saveError="Le moteur de simulation MyGM n’est pas disponible.";renderDashboard();return;}
 const currentRound=Number(target.round)||0,games=seasonCalendar.games.filter(g=>g.status!=="completed"&&Number(g.round)<=currentRound).sort((a,b)=>a.round-b.round);
 p.myCareerMoodModifiers={consistency:(Number(career.emotions||50)-50)*.09,clutch:(Number(career.emotions||50)-50)*.06,playmaking:(Number(career.chemistry||50)-50)*.08,passing:(Number(career.chemistry||50)-50)*.07,basketballIQ:(Number(career.chemistry||50)-50)*.05,intangibles:(Number(career.popularity||50)-50)*.04};
 try{for(const game of games){try{window.simulateScheduledGame(game);}catch(error){saveError="Erreur de simulation : "+error.message;break;}}}finally{delete p.myCareerMoodModifiers;}
 career.lastRoundPlayed=currentRound;const home=target.home.code===career.teamCode,teamScore=home?target.homeScore:target.awayScore,oppScore=home?target.awayScore:target.homeScore,won=Number(teamScore)>Number(oppScore);
 career.gamesPlayed++;if(won){career.wins++;career.lossStreak=0;}else{career.losses++;career.lossStreak=(career.lossStreak||0)+1;}
 const box=target.playerBoxScores||{},side=home?box.home:box.away,line=side&&side[String(p.id)]||{};
 ["pts","reb","ast","stl","blk","tov","minutes"].forEach(k=>career.seasonStats[k]=(Number(career.seasonStats[k])||0)+(Number(line[k])||0));
 if(Number(line.gp)>0)career.seasonStats.gp=(Number(career.seasonStats.gp)||0)+1;
 career.lastGame={gameId:target.id,teamCode:career.teamCode,opponentCode:home?target.away.code:target.home.code,teamScore:Number(teamScore)||0,opponentScore:Number(oppScore)||0,result:won?"Victoire":"Défaite",line:(Number(line.pts)||0)+" PTS · "+(Number(line.reb)||0)+" REB · "+(Number(line.ast)||0)+" AST · "+(Number(line.minutes)||0)+" MIN"};
 p.careerGames=p.careerGames||[];p.careerGames.push({season:seasonName(seasonYear),gameId:target.id,teamScore:teamScore,opponentScore:oppScore,...line});
 const gp=Math.max(1,Number(career.seasonStats.gp)||0);p.pts=career.seasonStats.pts/gp;p.reb=career.seasonStats.reb/gp;p.ast=career.seasonStats.ast/gp;p.mpg=career.seasonStats.minutes/gp;
 if(career.lossStreak>=4&&!career.generatedRival)createNewRival(p);
 if(!allPlayers().some(x=>String(x.id)===String(p.id))&&typeof retired!=="undefined"&&retired.some(x=>String(x.id)===String(p.id))){career.retired=true;career.retirementReason="Blessure très grave mettant fin à la carrière.";saveCareer();renderRetirement();return;}
 career.pendingStory=true;if(typeof window.renderAll==="function")window.renderAll();saveCareer();renderDashboard();
}
function simulateCareerSeries(teamA,teamB,roundLabel,seriesIndex){
 const homePattern=[0,0,1,1,0,1,0];
 let winsA=0,winsB=0;
 for(let n=0;n<7&&winsA<4&&winsB<4;n++){
  const homeIsA=homePattern[n]===0,homeTeam=homeIsA?teamA:teamB,awayTeam=homeIsA?teamB:teamA;
  const game={id:"MC-PO-"+career.seasonNumber+"-"+roundLabel+"-"+seriesIndex+"-"+(n+1),round:n+1,home:{code:homeTeam.code,name:homeTeam.name},away:{code:awayTeam.code,name:awayTeam.name},status:"scheduled"};
  if(typeof window.simulateScheduledGame!=="function"||window.simulateScheduledGame(game)===false)break;
  const winnerCode=Number(game.homeScore)>Number(game.awayScore)?game.home.code:game.away.code;
  if(winnerCode===teamA.code)winsA++;else winsB++;
  const p=playerForCareer();
  if(p&&(game.home.code===career.teamCode||game.away.code===career.teamCode)){
   const home=game.home.code===career.teamCode;
   const side=home?game.playerBoxScores&&game.playerBoxScores.home:game.playerBoxScores&&game.playerBoxScores.away;
   const line=side&&side[String(p.id)]||null;
   if(line){
    career.postseasonStats=career.postseasonStats||{gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0};
    ["pts","reb","ast","stl","blk","minutes"].forEach(k=>career.postseasonStats[k]=(Number(career.postseasonStats[k])||0)+(Number(line[k])||0));
    if(Number(line.gp)>0)career.postseasonStats.gp++;
    career.postseasonGames=career.postseasonGames||[];
    career.postseasonGames.push({id:game.id,round:roundLabel,teamScore:home?game.homeScore:game.awayScore,opponentScore:home?game.awayScore:game.homeScore,pts:line.pts,reb:line.reb,ast:line.ast,stl:line.stl,blk:line.blk,minutes:line.minutes});
   }
   if(!allPlayers().some(x=>String(x.id)===String(p.id))&&typeof retired!=="undefined"&&retired.some(x=>String(x.id)===String(p.id))){
    career.retired=true;career.retirementReason="Blessure très grave mettant fin à la carrière pendant les playoffs.";
    return {winner:null,loser:null,winsA,winsB,retired:true};
   }
  }
 }
 return {winner:winsA===4?teamA:winsB===4?teamB:null,loser:winsA===4?teamB:winsB===4?teamA:null,winsA,winsB};
}
function simulateCareerPlayoffs(){
 if(typeof window.updateTeamSeasonAverages==="function")window.updateTeamSeasonAverages();
 const standings=Array.isArray(seasonResults)?seasonResults:[];
 const west=standings.filter(t=>t.conference==="West"&&Number(t.seed)>0).sort((a,b)=>a.seed-b.seed).slice(0,8);
 const east=standings.filter(t=>t.conference==="East"&&Number(t.seed)>0).sort((a,b)=>a.seed-b.seed).slice(0,8);
 career.postseasonStats={gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0};career.postseasonGames=[];
 if(west.length!==8||east.length!==8){career.postseason={qualified:false,champion:null,rounds:[]};return;}
 const oldRender=window.renderAll;
 if(typeof oldRender==="function")window.renderAll=function(){};
 const rounds=[];
 try{
  let westTeams=west,eastTeams=east;
  for(const roundIndex of [0,1,2]){
   const label=["Premier tour","Demi-finales","Finales de conférence"][roundIndex];
   const winners={West:[],East:[]};
   for(const pair of [["West",westTeams],["East",eastTeams]]){
    const conference=pair[0],teamList=pair[1];
    const matchups=roundIndex===0?[[teamList[0],teamList[7]],[teamList[3],teamList[4]],[teamList[2],teamList[5]],[teamList[1],teamList[6]]]:roundIndex===1?[[teamList[0],teamList[1]],[teamList[2],teamList[3]]]:[[teamList[0],teamList[1]]];
    for(let i=0;i<matchups.length;i++){
     const result=simulateCareerSeries(matchups[i][0],matchups[i][1],roundIndex+"-"+conference,i);
     rounds.push({round:label,conference,teamA:matchups[i][0].name,teamB:matchups[i][1].name,winsA:result.winsA,winsB:result.winsB,winner:result.winner&&result.winner.name});
     if(result.retired)return;
     if(result.winner)winners[conference].push(result.winner);
    }
   }
   if(!winners.West.length||!winners.East.length)break;
   westTeams=winners.West;eastTeams=winners.East;
  }
  let champion=null,runnerUp=null;
  if(westTeams.length===1&&eastTeams.length===1){
   const final=simulateCareerSeries(westTeams[0],eastTeams[0],"Finale",0);
   rounds.push({round:"Finale NBA",conference:"NBA",teamA:westTeams[0].name,teamB:eastTeams[0].name,winsA:final.winsA,winsB:final.winsB,winner:final.winner&&final.winner.name});
   champion=final.winner&&final.winner.name;runnerUp=final.loser&&final.loser.name;
  }
  career.postseason={qualified:west.some(t=>t.code===career.teamCode)||east.some(t=>t.code===career.teamCode),champion,runnerUp,rounds};
  if(champion&&champion===career.teamName){
   career.championships=(career.championships||0)+1;
   const p=playerForCareer();if(p){p.trophies=p.trophies||[];p.trophies.push({name:"Champion NBA",season:seasonName(seasonYear)});}
  }
 }finally{
  if(typeof oldRender==="function"){window.renderAll=oldRender;oldRender();}
 }
}
function finishSeason(){
 const p=playerForCareer();if(!p||career.seasonCompleted)return;career.seasonCompleted=true;
 try{simulateCareerPlayoffs();}catch(error){saveError="Simulation des playoffs : "+error.message;career.postseason=career.postseason||{qualified:false,champion:null,rounds:[]};}
 if(career.retired){saveCareer();renderRetirement();return;}
 if(!allPlayers().some(x=>String(x.id)===String(p.id))){career.retired=true;career.retirementReason="Carrière terminée à la suite d’une blessure.";saveCareer();renderRetirement();return;}
 if(typeof phase!=="undefined")phase="regular";
 const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||0),label=seasonName(seasonYear);
 const completedPostseasonStats=Object.assign({gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0},career.postseasonStats||{});
 career.lastPostseasonStats=completedPostseasonStats;career.lastPostseason=career.postseason||null;
 const entry={season:label,team:career.teamCode,height:p.height,overall:careerOverall(p),gp:Number(s.gp)||0,pts:(Number(s.pts)||0)/gp,reb:(Number(s.reb)||0)/gp,ast:(Number(s.ast)||0)/gp,stl:(Number(s.stl)||0)/gp,blk:(Number(s.blk)||0)/gp,playoffs:career.postseason,postseasonStats:completedPostseasonStats};
 p.history=p.history||[];p.history.push(entry);career.seasonHistory.push(entry);p.age=Number(p.age||19)+1;
 if(typeof window.progress==="function"&&p.age<40)window.progress(p);
 p.rookie=false;p.season=seasonName(Number(seasonYear)+1);career.seasonCompleted=false;
 if(p.age>=40){career.retired=true;career.retirementReason="Retraite à 40 ans.";career.retiredAt=label;saveCareer();renderRetirement();return;}
 seasonYear=Number(seasonYear)+1;career.seasonNumber++;career.gamesPlayed=0;career.wins=0;career.losses=0;career.lossStreak=0;career.lastRoundPlayed=0;
 career.seasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0};career.postseasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0,gp:0};career.lastGame=null;career.pendingStory=true;
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();
 if(typeof phase!=="undefined")phase="regular";
 saveCareer();
 const postseasonText=career.postseason&&career.postseason.qualified?"Qualifié en playoffs":"Non qualifié pour les playoffs";
 const championText=career.postseason&&career.postseason.champion?career.postseason.champion:"aucun champion déterminé";
 const playoffGames=career.lastPostseasonStats&&career.lastPostseasonStats.gp||0;
 const playoffPoints=career.lastPostseasonStats&&career.lastPostseasonStats.pts||0;
 render(header("FIN DE SAISON","Saison "+label+" terminée")+
  '<div class="mc-card"><div class="mc-kicker">BILAN DE TA SAISON</div><h2>'+label+'</h2>'+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+entry.overall+'</strong><span>GÉN final</span></div><div class="mc-metric"><strong>'+entry.pts.toFixed(1)+'</strong><span>PTS / match</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs joués</span></div></div>'+
  '<p class="mc-muted">'+postseasonText+'. Champion NBA : '+escHtml(championText)+'. Tes playoffs : '+playoffGames+' MJ · '+playoffPoints+' PTS.</p>'+
  '<p class="mc-muted">Ton âge passe à '+p.age+' ans. Tes attributs évoluent selon ton développement, ton potentiel et ton âge.</p>'+
  '<div class="mc-actions"><button class="mc-btn primary" id="mcNextSeason">Préparer la prochaine saison →</button></div></div>');
 attachReturn();$("mcNextSeason").onclick=renderStory;
}
function renderRetirement(){
 career=career||{};career.retired=true;saveCareer();const p=playerForCareer()||career.player||{};
 render(header("FIN DE CARRIÈRE","Ton histoire NBA restera dans les archives.")+'<div class="mc-retirement"><div style="font-size:70px">🏆</div><div class="mc-kicker">MYCAREER · HALL OF FAME</div><h2 class="mc-title" style="font-size:clamp(28px,4vw,46px)">'+escHtml(p.name||"Ta carrière")+'</h2><p class="mc-muted">'+(career.retirementReason||"Fin de carrière")+'</p><p class="mc-muted">Saisons terminées : '+(career.seasonHistory||[]).length+' · Dernière équipe : '+(career.teamCode||"—")+'</p><div class="mc-actions" style="justify-content:center"><button class="mc-btn primary" id="mcCareerHome">Retour à MyCareer</button><button class="mc-btn secondary" id="mcTitle">Écran de départ</button></div></div>');
 attachReturn();$("mcCareerHome").onclick=openCareerHome;$("mcTitle").onclick=showPicker;
}
function returnToStart(){if(activeMode==="gm"&&typeof window.NBASimCaptureMyGMState==="function"){try{mygmSnapshot=window.NBASimCaptureMyGMState();saveGMStored(mygmSnapshot);}catch(error){saveError="Sauvegarde de la session MyGM impossible : "+error.message;}}if(activeMode==="career"&&career)saveCareer();activeMode="launcher";root.hidden=true;showPicker();}
function installMenuReturn(){
 const shell=document.querySelector(".mynba-menu-shell");if(!shell||$("mcMenuReturn"))return;
 const button=document.createElement("button");button.type="button";button.id="mcMenuReturn";button.className="mc-btn secondary";button.textContent="↩ Retour à l’écran de départ";button.style.margin="12px 0";button.onclick=returnToStart;
 const footer=shell.querySelector(".mynba-menu-footer");if(footer)footer.appendChild(button);else shell.appendChild(button);
}
function install(){
 installCareerOverall();mygmSnapshot=loadGMStored();if(typeof window.NBASimCaptureMyGMState==="function"){try{launcherSnapshot=window.NBASimCaptureMyGMState();}catch(_){launcherSnapshot=null;}}const gm=$("myGMStart");if(gm)gm.hidden=true;showPicker();installMenuReturn();
 const observer=new MutationObserver(()=>installMenuReturn());observer.observe(document.body,{childList:true,subtree:true});
 window.NBASimMyCareerSave=saveCareer;window.NBASimMyCareerState=()=>career;window.NBASimReturnToModePicker=function(){activeMode="launcher";root.hidden=true;showPicker();};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();