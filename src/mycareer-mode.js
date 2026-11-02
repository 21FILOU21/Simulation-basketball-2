/* MyCareer mode — separate player career using the existing league and possession simulator. */
(() => {
"use strict";
const KEY="nba-sim-lab-mycareer-v1",$=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),rand=()=>Math.random();
const fallback=[["finishing","Finition"],["layup","Layup"],["dunk","Dunk"],["closeShot","Tir rapproché"],["midRange","Mi-distance"],["threePoint","Tir à 3 pts"],["freeThrow","Lancers francs"],["shotIQ","QI de tir"],["ballHandle","Contrôle du ballon"],["passing","Passes"],["playmaking","Création"],["offensiveIQ","QI offensif"],["perimeterDefense","Défense extérieure"],["interiorDefense","Défense intérieure"],["steal","Interception"],["block","Contre"],["defensiveIQ","QI défensif"],["defensiveRebound","Rebond défensif"],["offensiveRebound","Rebond offensif"],["speed","Vitesse"],["acceleration","Accélération"],["agility","Agilité"],["strength","Force"],["vertical","Détente"],["stamina","Endurance"],["durability","Durabilité"],["consistency","Régularité"],["clutch","Clutch"],["potential","Potentiel"],["workEthic","Éthique de travail"],["basketballIQ","QI basket"],["intangibles","Intangibles"]];
const attrs=typeof attributeNames!=="undefined"?attributeNames:fallback,groups=typeof attributeGroups!=="undefined"?attributeGroups:{Attributs:fallback};
const profiles={
PG:[{id:"floor_general",name:"Meneur organisateur",core:["playmaking","passing","ballHandle","basketballIQ","passVision","passAccuracy"],secondary:["speed","speedWithBall","midRange","threePoint","shotIQ"]},{id:"scoring_guard",name:"Meneur scoreur",core:["ballHandle","threePoint","midRange","layup","shotIQ","speedWithBall"],secondary:["playmaking","offensiveIQ","freeThrow","agility","clutch"]},{id:"lockdown_guard",name:"Meneur défenseur",core:["perimeterDefense","steal","agility","speed","defensiveIQ","basketballIQ"],secondary:["ballHandle","playmaking","stamina","passPerception","helpDefenseIQ"]}],
SG:[{id:"shooter",name:"Arrière shooteur",core:["threePoint","midRange","freeThrow","shotIQ","offensiveIQ","intangibles"],secondary:["agility","ballHandle","speed","consistency","clutch"]},{id:"slasher",name:"Arrière pénétrateur",core:["layup","dunk","finishing","speed","acceleration","vertical"],secondary:["ballHandle","strength","drawFoul","stamina","midRange"]},{id:"two_way_guard",name:"Arrière two-way",core:["perimeterDefense","threePoint","steal","agility","shotIQ","intangibles"],secondary:["midRange","speed","ballHandle","defensiveIQ","consistency"]}],
SF:[{id:"versatile_wing",name:"Ailier polyvalent",core:["finishing","threePoint","midRange","perimeterDefense","speed","basketballIQ"],secondary:["layup","ballHandle","defensiveIQ","strength","intangibles"]},{id:"three_d_wing",name:"Ailier 3&D",core:["threePoint","perimeterDefense","defensiveIQ","agility","stamina","intangibles"],secondary:["midRange","steal","speed","shotIQ","strength"]},{id:"star_wing",name:"Ailier scoreur",core:["finishing","layup","midRange","threePoint","ballHandle","shotIQ"],secondary:["dunk","speed","offensiveIQ","clutch","strength"]}],
PF:[{id:"stretch_four",name:"Ailier fort stretch",core:["threePoint","midRange","strength","defensiveRebound","interiorDefense","shotIQ"],secondary:["perimeterDefense","vertical","offensiveRebound","stamina","intangibles"]},{id:"inside_finisher",name:"Intérieur finisseur",core:["finishing","dunk","strength","offensiveRebound","vertical","closeShot"],secondary:["interiorDefense","defensiveRebound","layup","stamina","hands"]},{id:"defensive_four",name:"Ailier fort défensif",core:["interiorDefense","block","defensiveRebound","strength","defensiveIQ","vertical"],secondary:["offensiveRebound","perimeterDefense","stamina","intangibles","finishing"]}],
C:[{id:"rim_protector",name:"Pivot protecteur de cercle",core:["block","interiorDefense","defensiveRebound","strength","vertical","defensiveIQ"],secondary:["offensiveRebound","stamina","finishing","intangibles","durability"]},{id:"dominant_center",name:"Pivot dominant",core:["finishing","standingDunk","strength","offensiveRebound","defensiveRebound","closeShot"],secondary:["block","interiorDefense","vertical","stamina","hands"]},{id:"passing_center",name:"Pivot organisateur",core:["passing","playmaking","basketballIQ","interiorDefense","defensiveRebound","strength"],secondary:["midRange","closeShot","block","offensiveRebound","intangibles"]}]
};
const style=document.createElement("style");
style.textContent="#nbaMyCareerRoot{position:fixed;inset:0;z-index:300000;overflow:auto;background:radial-gradient(ellipse at top,#1b3457 0,#070c16 72%);color:#f4f7ff;font-family:inherit;padding:clamp(14px,3vw,36px);box-sizing:border-box}"+
"#nbaMyCareerRoot[hidden]{display:none!important}#nbaMyCareerRoot *{box-sizing:border-box}.mc-shell{width:min(1250px,100%);margin:0 auto}.mc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}.mc-kicker{font-size:11px;font-weight:900;letter-spacing:.2em;color:#f2d76c;text-transform:uppercase}.mc-title{font-size:clamp(32px,5vw,62px);line-height:1.03;margin:8px 0 12px;font-weight:1000}.mc-muted{color:#aebdd5;line-height:1.55}.mc-card{padding:clamp(16px,2.5vw,28px);border:1px solid #334c70;border-radius:16px;background:linear-gradient(145deg,#14243b,#0c1525);box-shadow:0 14px 40px #0005;margin:12px 0}.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mc-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.mc-field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800;color:#cbd8eb}.mc-field input,.mc-field select{width:100%;padding:11px;border:1px solid #405879;border-radius:8px;background:#081426;color:#fff;font:inherit;font-size:14px}.mc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.mc-btn{border:1px solid #587399;border-radius:9px;padding:12px 17px;background:#1b3454;color:#fff;font:inherit;font-weight:900;cursor:pointer}.mc-btn.primary{background:#dfbf45;color:#171b24;border-color:#f4d86b}.mc-btn.secondary{background:#111f33}.mc-btn:disabled{opacity:.45;cursor:not-allowed}.mc-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.mc-mode{min-height:220px;padding:clamp(18px,3vw,30px);display:flex;flex-direction:column;justify-content:flex-end;text-align:left;background:linear-gradient(155deg,#203c61,#0e192b);border:1px solid #49658d;border-radius:16px;color:#fff;cursor:pointer}.mc-mode h2{font-size:clamp(24px,3vw,36px);margin:0 0 8px}.mc-mode p{color:#c4d2e8;margin:0}.mc-metric{padding:14px;border:1px solid #354c6b;border-radius:10px;background:#0b1729}.mc-metric strong{display:block;font-size:26px;color:#f5d76b}.mc-metric span{font-size:10px;letter-spacing:.1em;color:#aebdd5;text-transform:uppercase}.mc-bars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mc-attribute{display:grid;grid-template-columns:minmax(95px,1fr) 45px;gap:6px 10px;align-items:center;padding:9px 10px;border:1px solid #293e5b;border-radius:8px;background:#0b1627}.mc-attribute label{font-size:12px;font-weight:800}.mc-attribute b{text-align:right;color:#f2d76c}.mc-attribute input{grid-column:1/-1;width:100%;accent-color:#e0c24d}.mc-meter{height:9px;border-radius:30px;background:#243b5b;overflow:hidden;margin-top:8px}.mc-meter>span{display:block;height:100%;background:linear-gradient(90deg,#40c98c,#f2d76c);width:0}.mc-choice{display:block;width:100%;text-align:left;padding:15px;margin:9px 0;border:1px solid #405b7f;border-radius:10px;background:#10213a;color:#f4f7ff;cursor:pointer}.mc-choice:hover{border-color:#f2d76c;background:#1a304d}.mc-choice b{display:block;margin-bottom:4px}.mc-result{padding:18px;border:1px solid #b89935;border-radius:12px;background:#292713}.mc-game-result{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;text-align:center}.mc-game-result strong{font-size:clamp(24px,4vw,42px)}.mc-status{min-height:22px;color:#f3d879;font-size:12px}.mc-divider{height:1px;background:#314866;margin:18px 0}.mc-retirement{border:1px solid #d2a64d;background:linear-gradient(135deg,#332719,#111a29);padding:25px;border-radius:15px;text-align:center}.mc-scroll{max-height:65vh;overflow:auto;padding-right:3px}@media(max-width:720px){.mc-mode-grid,.mc-grid,.mc-grid.three,.mc-bars{grid-template-columns:1fr}.mc-mode{min-height:160px}.mc-actions .mc-btn{flex:1 1 100%}.mc-top .mc-btn{width:100%}}";
document.head.appendChild(style);
const root=document.createElement("div");root.id="nbaMyCareerRoot";root.hidden=true;document.body.appendChild(root);
let career=null,draftPlayer=null,activeStory=null,buildBudget=760,saveError="";
const labelFor=key=>{for(const list of Object.values(groups))for(const pair of list)if(pair[0]===key)return pair[1];return key;};
function allPlayers(){return typeof players!=="undefined"&&Array.isArray(players)?players:[];}
function findPlayer(id){return allPlayers().find(p=>String(p.id)===String(id))||null;}
function playerForCareer(){return career&&findPlayer(career.playerId);}
function seasonName(year){return typeof seasonLabel==="function"?seasonLabel(year):String(year)+"-"+String((year+1)%100).padStart(2,"0");}
function render(html){root.innerHTML='<div class="mc-shell">'+html+'</div>';root.hidden=false;}
function header(title,subtitle){return '<div class="mc-top"><div><div class="mc-kicker">NBA SIM LAB · MYCAREER</div><div style="font-weight:900;font-size:13px;color:#aebdd5">'+(subtitle||"Une carrière. Une légende.")+'</div></div><button class="mc-btn secondary" id="mcReturn">↩ Écran de départ</button></div><h1 class="mc-title">'+title+'</h1>';}
function attachReturn(){const b=$("mcReturn");if(b)b.onclick=returnToStart;}
function hideGM(){const gm=$("myGMStart");if(gm)gm.hidden=true;document.body.classList.remove("gm-startup");document.body.style.overflow="";}
function loadStored(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null;}catch(_){return null;}}
function saveCareer(){
 if(!career)return;
 try{
  const data=JSON.stringify({career,players:allPlayers(),seasonYear:typeof seasonYear!=="undefined"?seasonYear:2025,phase:typeof phase!=="undefined"?phase:"regular",seasonCalendar:typeof seasonCalendar!=="undefined"?seasonCalendar:null,seasonResults:typeof seasonResults!=="undefined"?seasonResults:[],retired:typeof retired!=="undefined"?retired:[],actualPlayerStats:window.NBASimActualPlayerStats||{},actualBoxScores:window.NBASimActualBoxScores||{}});
  localStorage.setItem(KEY,data);saveError="";
 }catch(error){saveError="Sauvegarde locale impossible : "+error.message;}
}
function restoreStored(data){
 if(!data||!data.career||!Array.isArray(data.players))return false;
 try{players=data.players;seasonYear=Number(data.seasonYear)||2025;phase=data.phase||"regular";seasonCalendar=data.seasonCalendar||null;seasonResults=data.seasonResults||[];if(typeof retired!=="undefined")retired=data.retired||[];career=data.career;window.NBASimActualPlayerStats=data.actualPlayerStats||{};window.NBASimActualBoxScores=data.actualBoxScores||{};if(!findPlayer(career.playerId)&&career.player)players.push(career.player);if(typeof renderAll==="function")renderAll();return true;}catch(error){saveError="Reprise impossible : "+error.message;return false;}
}
function showPicker(){
 hideGM();render('<div style="padding-top:clamp(25px,8vh,90px)"><div class="mc-kicker">NBA SIM LAB · CHOISIS TON EXPÉRIENCE</div><h1 class="mc-title">Quelle carrière<br>vas-tu écrire ?</h1><p class="mc-muted">Choisis ton mode de jeu. MyGM conserve la gestion de franchise. MyCareer te place dans la peau d’un seul joueur NBA.</p><div class="mc-mode-grid"><button class="mc-mode" id="mcChooseCareer"><div class="mc-kicker">MODE JOUEUR</div><h2>MyCareer</h2><p>Crée ton joueur, passe par la Draft et construis ta légende jusqu’à la retraite.</p></button><button class="mc-mode" id="mcChooseGM"><div class="mc-kicker">MODE FRANCHISE</div><h2>MyGM</h2><p>Contrôle une franchise, gère ton effectif, les transferts, la saison et les playoffs.</p></button></div></div>');
 $("mcChooseCareer").onclick=openCareerHome;
 $("mcChooseGM").onclick=()=>{root.hidden=true;const gm=$("myGMStart");if(gm)gm.hidden=false;document.body.classList.add("gm-startup");document.body.style.overflow="hidden";};
}
function openCareerHome(){
 hideGM();const saved=loadStored();
 render(header("MYCAREER","Ta carrière NBA, de la Draft à la retraite.")+'<div class="mc-card"><h2>Une carrière à ton image</h2><p class="mc-muted">Crée un joueur de 19 ans, choisis sa spécialité, impressionne les recruteurs et gagne ta place dans la ligue. Toutes les autres franchises restent contrôlées par l’IA.</p><div class="mc-actions">'+(saved&&saved.career?'<button class="mc-btn primary" id="mcContinue">Continuer ma carrière</button>':'')+'<button class="mc-btn primary" id="mcNewCareer">Nouvelle carrière</button><button class="mc-btn secondary" id="mcModeSelect">Changer de mode</button></div><p class="mc-status">'+saveError+'</p></div>');
 attachReturn();if($("mcContinue"))$("mcContinue").onclick=()=>{if(restoreStored(loadStored()))renderDashboard();else{saveError="La sauvegarde MyCareer est invalide.";openCareerHome();}};$("mcNewCareer").onclick=beginNewCareer;$("mcModeSelect").onclick=showPicker;
}
function beginNewCareer(){
 if(loadStored()&&!confirm("Remplacer la sauvegarde MyCareer actuelle par une nouvelle carrière ?"))return;
 localStorage.removeItem(KEY);
 if(!allPlayers().length&&$("demo")){$("demo").click();setTimeout(showCreation,180);}else showCreation();
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
 showDraftStory();
}
function showDraftStory(){
 const scene=draftScenes[career.draftScene];if(!scene)return revealDraft();
 render(header("AVANT LA DRAFT","Décision narrative "+(career.draftScene+1)+" / 3")+'<div class="mc-card"><div class="mc-kicker">SCOUTING REPORT</div><h2>'+scene.title+'</h2><p class="mc-muted">'+scene.body+'</p>'+scene.choices.map((x,i)=>'<button class="mc-choice" data-draft-choice="'+i+'"><b>'+x.label+'</b><span class="mc-muted">'+x.detail+'</span></button>').join("")+'</div>');
 attachReturn();root.querySelectorAll("[data-draft-choice]").forEach(b=>b.onclick=()=>{
  const x=scene.choices[Number(b.dataset.draftChoice)];career.draftScore+=x.grade;career.emotions=clamp(career.emotions+(x.emotion||0),0,100);career.chemistry=clamp(career.chemistry+(x.chemistry||0),0,100);career.popularity=clamp(career.popularity+(x.popularity||0),0,100);
  if(x.attribute)draftPlayer.attributes[x.attribute]=clamp((Number(draftPlayer.attributes[x.attribute])||40)+(x.gain||0),20,99);
  career.storyHistory.push({stage:"Draft",event:scene.title,choice:x.label});career.draftScene++;if(career.draftScene>=draftScenes.length)revealDraft();else showDraftStory();
 });
}
function revealDraft(){
 const grade=clamp(Math.round(74+career.draftScore*2.1+(rand()-.5)*8),60,98),pick=clamp(Math.round(18-(grade-74)*.52+(rand()-.5)*5),1,30);
 const list=(typeof nbaTeams!=="undefined"?nbaTeams:[]).slice().sort((a,b)=>((a[0].charCodeAt(0)*13+a[0].charCodeAt(1)*7)%31)-((b[0].charCodeAt(0)*13+b[0].charCodeAt(1)*7)%31));
 const chosen=list[(pick-1)%list.length]||["LAL","Los Angeles Lakers","West"];
 draftPlayer.id=typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now();draftPlayer.team=chosen[0];draftPlayer.age=19;draftPlayer.pts=0;draftPlayer.reb=0;draftPlayer.ast=0;draftPlayer.stl=.8;draftPlayer.blk=.3;draftPlayer.ts=.55;draftPlayer.three=.34;draftPlayer.mpg=24;draftPlayer.season=seasonName(typeof seasonYear!=="undefined"?seasonYear:2025);draftPlayer.source="MyCareer · Draft #"+pick;draftPlayer.rookie=true;draftPlayer.trophies=[];draftPlayer.history=[];draftPlayer.careerGames=[];draftPlayer.myCareer=true;draftPlayer.myCareerProfile={specialty:profileFor(draftPlayer.pos,draftPlayer.specialty).name,core:profileFor(draftPlayer.pos,draftPlayer.specialty).core,secondary:profileFor(draftPlayer.pos,draftPlayer.specialty).secondary};
 draftPlayer.attributes.potential=99;career.draftGrade=grade;career.draftPick=pick;career.teamCode=chosen[0];career.teamName=chosen[1];career.playerId=draftPlayer.id;career.player=draftPlayer;
 const rival=allPlayers().filter(p=>p&&p.team!==chosen[0]&&p.retired!==true).sort((a,b)=>Math.abs((typeof overallRating==="function"?overallRating(a):70)-grade)-Math.abs((typeof overallRating==="function"?overallRating(b):70)-grade))[0];
 career.rivalId=rival?rival.id:null;career.rivalName=rival?rival.name:"Rival à déterminer";players.push(draftPlayer);
 if(typeof window.NBASimEnsureMinimumRoster==="function")(typeof nbaTeams!=="undefined"?nbaTeams:[]).forEach(t=>window.NBASimEnsureMinimumRoster(t[0]));
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();if(typeof phase!=="undefined")phase="regular";career.lastRoundPlayed=0;career.gamesPlayed=0;career.wins=0;career.losses=0;saveCareer();
 render(header("LA DRAFT NBA","Pick #"+pick+" · "+grade+" de scouting")+'<div class="mc-result"><div class="mc-kicker">ON T’A CHOISI</div><h2 style="font-size:clamp(28px,5vw,48px);margin:10px 0">'+chosen[1]+'</h2><p class="mc-muted">'+chosen[0]+' sélectionne '+draftPlayer.name+' au choix #'+pick+'.</p><div class="mc-grid three"><div class="mc-metric"><strong>'+pick+'</strong><span>Choix de Draft</span></div><div class="mc-metric"><strong>'+grade+'</strong><span>Scouting</span></div><div class="mc-metric"><strong>19</strong><span>Âge de départ</span></div></div></div><div class="mc-card"><h3>Ta rivalité commence</h3><p class="mc-muted">'+(rival?"Les recruteurs te comparent déjà à "+rival.name+".":"La ligue va bientôt te trouver un rival.")+'</p><button class="mc-btn primary" id="mcStartSeason">Commencer ma saison rookie →</button></div>');
 attachReturn();$("mcStartSeason").onclick=()=>{career.pendingStory=true;saveCareer();renderStory();};
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
 return Math.round(clamp(total/weight,40,99));
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
function renderDashboard(){
 const p=playerForCareer();if(!p||career.retired)return renderRetirement();installCareerOverall();
 const rival=career.rivalId!=null?findPlayer(career.rivalId):null,next=nextPlayerGame(),game=career.lastGame,injury=p.injury;
 const injuryText=injury?(injury.label||injury.severity)+" · "+(Number(injury.restGamesRemaining)||0)+" matchs avant retour":"En santé";
 render(header("SAISON "+career.seasonNumber,p.name+" · "+p.team+" · "+p.age+" ans")+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN</span></div><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div></div>'+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.emotions+'</strong><span>Émotions</span></div><div class="mc-metric"><strong>'+career.chemistry+'</strong><span>Entente d’équipe</span></div><div class="mc-metric"><strong>'+career.popularity+'</strong><span>Popularité</span></div></div>'+
 '<div class="mc-card"><div class="mc-grid"><div><div class="mc-kicker">STATISTIQUES DE LA SAISON</div><h2>'+statLine()+'</h2><p class="mc-muted">Blessure : '+injuryText+'</p><p class="mc-muted">Prochain match : '+(next?next.home.name+" vs "+next.away.name:"Saison régulière terminée")+'</p></div><div><div class="mc-kicker">TON RIVAL</div><h2>'+(rival?rival.name:career.rivalName||"Rival à déterminer")+'</h2><p class="mc-muted">'+(rival?rival.team+" · GÉN "+(typeof overallRating==="function"?overallRating(rival):"—"):"Un nouveau rival sera identifié.")+'</p></div></div><div class="mc-divider"></div><div class="mc-kicker">DERNIER MATCH</div>'+
 (game?'<div class="mc-game-result"><b>'+game.teamCode+'</b><strong>'+game.teamScore+' – '+game.opponentScore+'</strong><b>'+game.opponentCode+'</b></div><p class="mc-muted" style="text-align:center">'+game.result+' · '+game.line+'</p>':'<p class="mc-muted">Tu n’as pas encore disputé ton premier match NBA.</p>')+
 '<div class="mc-actions"><button class="mc-btn primary" id="mcNextMatch" '+(!next?"disabled":"")+'>Simuler le prochain match →</button><button class="mc-btn secondary" id="mcAttributes">Voir mes attributs</button><button class="mc-btn secondary" id="mcSave">Sauvegarder</button></div><p class="mc-status">'+(saveError||"Les autres franchises et les matchs de la journée sont simulés par l’IA.")+'</p></div>');
 attachReturn();$("mcNextMatch").onclick=()=>{if(career.pendingStory)renderStory();else simulateNextMatch();};$("mcAttributes").onclick=showCareerAttributes;$("mcSave").onclick=()=>{saveCareer();renderDashboard();};
 if(!next&&career.gamesPlayed>=82)finishSeason();
}
function showCareerAttributes(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const blocks=Object.entries(groups).map(([g,list])=>'<div class="mc-card"><h3>'+g+'</h3><div class="mc-bars">'+list.map(x=>'<div class="mc-attribute"><label>'+x[1]+'</label><b>'+(Number(p.attributes[x[0]])||0)+'</b></div>').join("")+'</div></div>').join("");
 render(header("MES ATTRIBUTS","Spécialité · "+(p.myCareerProfile.specialty||"MyCareer"))+'<div class="mc-card"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN actuel</span></div><p class="mc-muted">Les décisions narratives, les blessures et la progression annuelle influencent ton joueur.</p></div>'+blocks+'<div class="mc-actions"><button class="mc-btn primary" id="mcBackDashboard">Retour à ma carrière</button></div>');
 attachReturn();$("mcBackDashboard").onclick=renderDashboard;
}
function createNewRival(p){
 const candidates=(typeof nbaTeams!=="undefined"?nbaTeams:[]).filter(t=>t[0]!==career.teamCode),team=candidates[Math.floor(rand()*candidates.length)];
 const values=Object.fromEntries(attrs.map(x=>[x[0],clamp((Number(p.attributes[x[0]])||65)+(rand()-.5)*12,45,90)]));
 const name="Rival "+["Jordan","Darius","Tyrese","Malik","Cameron","Jaylen"][Math.floor(rand()*6)]+" "+["Carter","Brooks","Williams","Hayes","Mitchell"][Math.floor(rand()*5)];
 const rival={id:typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now(),name,team:team[0],pos:p.pos,age:20,pts:0,reb:0,ast:0,stl:.8,blk:.4,ts:.56,three:.35,mpg:26,height:p.height,weight:p.weight,wingspan:p.wingspan,attributes:values,history:[],trophies:[],careerGames:[],source:"MyCareer · Rival généré"};
 players.push(rival);career.rivalId=rival.id;career.rivalName=name;career.generatedRival=true;
}
function simulateNextMatch(){
 const p=playerForCareer();if(!p||career.retired)return;
 const target=nextPlayerGame();if(!target){finishSeason();return;}
 if(typeof window.simulateScheduledGame!=="function"){saveError="Le moteur de simulation MyGM n’est pas disponible.";renderDashboard();return;}
 const currentRound=Number(target.round)||0,games=seasonCalendar.games.filter(g=>g.status!=="completed"&&Number(g.round)<=currentRound).sort((a,b)=>a.round-b.round);
 for(const game of games){try{window.simulateScheduledGame(game);}catch(error){saveError="Erreur de simulation : "+error.message;break;}}
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
function finishSeason(){
 const p=playerForCareer();if(!p||career.seasonCompleted)return;career.seasonCompleted=true;
 if(typeof phase!=="undefined")phase="playoffs";if(typeof window.updateTeamSeasonAverages==="function"){try{window.updateTeamSeasonAverages();}catch(_){}}if(typeof phase!=="undefined")phase="regular";
 const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||0),label=seasonName(seasonYear);
 const entry={season:label,team:career.teamCode,height:p.height,overall:careerOverall(p),gp:Number(s.gp)||0,pts:(Number(s.pts)||0)/gp,reb:(Number(s.reb)||0)/gp,ast:(Number(s.ast)||0)/gp,stl:(Number(s.stl)||0)/gp,blk:(Number(s.blk)||0)/gp};
 p.history=p.history||[];p.history.push(entry);career.seasonHistory.push(entry);p.age=Number(p.age||19)+1;
 if(typeof window.progress==="function"&&p.age<40)window.progress(p);p.rookie=false;p.season=seasonName(Number(seasonYear)+1);career.seasonCompleted=false;
 if(p.age>=40){career.retired=true;career.retirementReason="Retraite à 40 ans.";career.retiredAt=label;saveCareer();renderRetirement();return;}
 if(!allPlayers().some(x=>String(x.id)===String(p.id))){career.retired=true;career.retirementReason="Carrière terminée à la suite d’une blessure.";saveCareer();renderRetirement();return;}
 seasonYear=Number(seasonYear)+1;career.seasonNumber++;career.gamesPlayed=0;career.wins=0;career.losses=0;career.lossStreak=0;career.lastRoundPlayed=0;career.seasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0};career.lastGame=null;career.pendingStory=true;
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();if(typeof phase!=="undefined")phase="regular";saveCareer();
 render(header("FIN DE SAISON","Saison "+label+" terminée")+'<div class="mc-card"><div class="mc-kicker">BILAN DE TA SAISON</div><h2>'+label+'</h2><div class="mc-grid three"><div class="mc-metric"><strong>'+entry.overall+'</strong><span>GÉN final</span></div><div class="mc-metric"><strong>'+entry.pts.toFixed(1)+'</strong><span>PTS / match</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs joués</span></div></div><p class="mc-muted">Ton âge passe à '+p.age+' ans. Tes attributs évoluent selon ton développement, ton potentiel et ton âge.</p><div class="mc-actions"><button class="mc-btn primary" id="mcNextSeason">Préparer la prochaine saison →</button></div></div>');
 attachReturn();$("mcNextSeason").onclick=renderStory;
}
function renderRetirement(){
 career=career||{};career.retired=true;saveCareer();const p=playerForCareer()||career.player||{};
 render(header("FIN DE CARRIÈRE","Ton histoire NBA restera dans les archives.")+'<div class="mc-retirement"><div style="font-size:70px">🏆</div><div class="mc-kicker">MYCAREER · HALL OF FAME</div><h2 class="mc-title" style="font-size:clamp(28px,4vw,46px)">'+(p.name||"Ta carrière")+'</h2><p class="mc-muted">'+(career.retirementReason||"Fin de carrière")+'</p><p class="mc-muted">Saisons terminées : '+(career.seasonHistory||[]).length+' · Dernière équipe : '+(career.teamCode||"—")+'</p><div class="mc-actions" style="justify-content:center"><button class="mc-btn primary" id="mcCareerHome">Retour à MyCareer</button><button class="mc-btn secondary" id="mcTitle">Écran de départ</button></div></div>');
 attachReturn();$("mcCareerHome").onclick=openCareerHome;$("mcTitle").onclick=showPicker;
}
function returnToStart(){if(career)saveCareer();root.hidden=true;showPicker();}
function installMenuReturn(){
 const shell=document.querySelector(".mynba-menu-shell");if(!shell||$("mcMenuReturn"))return;
 const button=document.createElement("button");button.type="button";button.id="mcMenuReturn";button.className="mc-btn secondary";button.textContent="↩ Retour à l’écran de départ";button.style.margin="12px 0";button.onclick=returnToStart;
 const footer=shell.querySelector(".mynba-menu-footer");if(footer)footer.appendChild(button);else shell.appendChild(button);
}
function install(){
 installCareerOverall();const gm=$("myGMStart");if(gm)gm.hidden=true;showPicker();installMenuReturn();
 const observer=new MutationObserver(()=>installMenuReturn());observer.observe(document.body,{childList:true,subtree:true});
 window.NBASimMyCareerSave=saveCareer;window.NBASimMyCareerState=()=>career;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();