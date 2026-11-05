/* MyCareer mode — separate player career using the existing league and possession simulator. */
(() => {
"use strict";
function escHtml(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(String.fromCharCode(39),"&#39;");}
const KEY="nba-sim-lab-mycareer-v1",GM_KEY="nba-sim-lab-mygm-mode-v1",$=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),rand=()=>Math.random();
const fallback=[["finishing","Finition"],["layup","Layup"],["dunk","Dunk"],["closeShot","Tir rapproché"],["midRange","Mi-distance"],["threePoint","Tir à 3 pts"],["freeThrow","Lancers francs"],["shotIQ","QI de tir"],["ballHandle","Contrôle du ballon"],["passing","Passes"],["playmaking","Création"],["offensiveIQ","QI offensif"],["perimeterDefense","Défense extérieure"],["interiorDefense","Défense intérieure"],["steal","Interception"],["block","Contre"],["defensiveIQ","QI défensif"],["defensiveRebound","Rebond défensif"],["offensiveRebound","Rebond offensif"],["speed","Vitesse"],["acceleration","Accélération"],["agility","Agilité"],["strength","Force"],["vertical","Détente"],["stamina","Endurance"],["durability","Durabilité"],["consistency","Régularité"],["clutch","Clutch"],["potential","Potentiel"],["workEthic","Éthique de travail"],["basketballIQ","QI basket"],["intangibles","Intangibles"]];
const attrs=typeof attributeNames!=="undefined"?attributeNames:fallback,groupKeys={"SHOOTING":["midRange","threePoint","freeThrow","shotIQ"],"DEFENSE":["perimeterDefense","interiorDefense","steal","block","defensiveIQ"],"REBOND":["offensiveRebound","defensiveRebound"],"FINITION":["finishing","layup","dunk","closeShot"],"ORGANISATION":["passing","ballHandle","playmaking","offensiveIQ","basketballIQ"],"QUALITÉ ATHLÉTIQUE":["speed","acceleration","agility","strength","vertical","stamina","durability"]},groups=Object.fromEntries(Object.entries(groupKeys).map(([title,keys])=>[title,attrs.filter(pair=>keys.includes(pair[0]))]).concat([["MENTAL",attrs.filter(pair=>!Object.values(groupKeys).flat().includes(pair[0]))]]));
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
style.textContent += "\n.mc-panel-rebound{background:linear-gradient(145deg,#302039,#201629);border-color:#8e44ad}.mc-panel-rebound .mc-attribute-panel-dot{background:#b57bd5}.mc-panel-physical{background:linear-gradient(145deg,#393321,#211e16);border-color:#e9d8a6}.mc-panel-physical .mc-attribute-panel-dot{background:#e9d8a6}.mc-panel-play{background:linear-gradient(145deg,#30291a,#211d16);border-color:#ef6c00}.mc-panel-play .mc-attribute-panel-dot{background:#ef6c00}";
document.head.appendChild(style);
style.textContent += ".mc-attribute-arrow{touch-action:none;user-select:none;-webkit-user-select:none}";
style.textContent += ".mc-fatigue-card{padding:12px 16px}.mc-fatigue-heading{display:flex;justify-content:space-between;align-items:center}.mc-fatigue-heading strong{color:#fb923c}.mc-fatigue-track{height:9px;background:#26364b;border-radius:20px;overflow:hidden;margin:8px 0}.mc-fatigue-track span{height:100%;display:block;background:linear-gradient(90deg,#36bd7c,#f59e0b,#ef4444);border-radius:20px}.mc-season-awards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mc-season-award{display:flex;align-items:flex-start;gap:10px;padding:11px;border:1px solid #4b5b74;border-radius:10px;background:#101c2e}.mc-season-award>span{font-size:25px}.mc-season-award div{display:flex;flex-direction:column;gap:4px;min-width:0}.mc-season-award b{color:#f5d76b}.mc-season-award strong{font-size:14px}.mc-season-award small{color:#aebdd5;font-size:11px}@media(max-width:700px){.mc-season-awards{grid-template-columns:1fr}}";
style.textContent += `
.mc-story-overview{margin:20px 0 8px;padding:15px;border:1px solid #405777;border-radius:13px;background:#091626}
.mc-story-overview-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.mc-story-overview-heading h3{margin:5px 0 0;font-size:19px}
.mc-story-fatigue-label{color:#fb923c;font-size:11px;font-weight:900}
.mc-story-social-grid{margin-bottom:13px}
.mc-story-social-metric strong{font-size:23px}
.mc-story-social-track{height:6px;border-radius:20px;background:#27364a;overflow:hidden;margin-top:8px}
.mc-story-social-track i{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#39c78b,#f2d76c)}
.mc-story-attribute-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.mc-story-attribute-panel{min-width:0;padding:12px;border:1px solid #344b68;border-radius:10px;background:#101e30}
.mc-story-attribute-panel h4{font-size:10px;letter-spacing:.13em;color:#f2d76c;margin:0 0 9px}
.mc-story-attribute-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}
.mc-story-attribute-row{min-width:0}
.mc-story-attribute-row>div:first-child{display:flex;align-items:baseline;justify-content:space-between;gap:5px}
.mc-story-attribute-row span{font-size:10px;color:#c9d5e6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-story-attribute-row strong{font-size:11px;color:#f5d76b;font-variant-numeric:tabular-nums;white-space:nowrap}
.mc-story-attribute-row strong small{font-size:9px;color:#8d9bb0}
.mc-story-attribute-track{position:relative;height:5px;margin-top:4px;background:#28384d;border-radius:20px;overflow:visible}
.mc-story-attribute-track span{display:block;height:100%;background:#5dbb92;border-radius:20px}
.mc-story-attribute-track i{position:absolute;top:-2px;height:9px;width:2px;background:#f5d76b;transform:translateX(-1px)}
.mc-story-choices-heading{margin:20px 0 8px;color:#f2d76c;font-size:11px;letter-spacing:.15em}
@media(max-width:760px){.mc-story-attribute-grid{grid-template-columns:1fr}.mc-story-attribute-list{grid-template-columns:repeat(2,minmax(0,1fr))}.mc-story-overview{padding:10px}}
`;
style.textContent += ".mc-story-outcome{display:flex;gap:6px 10px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid #ffffff1c;font-size:11px}.mc-story-gain{color:#86efac}.mc-story-loss{color:#fca5a5}.mc-story-cap{color:#fcd34d}.mc-story-fatigue{color:#fb923c}.mc-story-recovery{color:#67e8f9}.mc-story-outcome small{opacity:.78}";
style.textContent += "\n.mc-sim-progress-card{max-width:760px;margin:clamp(28px,8vh,90px) auto;text-align:center}.mc-sim-progress-card h2{font-size:clamp(22px,4vw,34px);margin:14px 0}.mc-sim-progress-card .mc-meter{height:12px;margin:24px 0 10px}.mc-sim-progress-card .mc-meter span{transition:width .12s ease}\n";
style.textContent += "\n.mc-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.mc-calendar-month{margin:18px 0}.mc-calendar-month h3{color:#f5d76b}.mc-calendar-game{display:flex;flex-direction:column;gap:3px;padding:8px 5px;border-radius:7px;text-align:center;min-width:0;width:100%;min-height:82px;color:#f4f7ff;font:inherit;background:#1b293d;border:1px solid #43536b;cursor:pointer}.mc-calendar-game:hover,.mc-calendar-game:focus-visible{outline:2px solid #f5d76b;outline-offset:2px;filter:brightness(1.2)}.mc-calendar-game small{font-size:8px;color:#aab8ce}.mc-calendar-game b{font-size:13px}.mc-calendar-game span{font-size:11px}.mc-calendar-game em{font-size:9px;color:#bac6d8;font-style:normal;margin-top:auto}.mc-calendar-game.is-win{border-color:#258c56;background:#173425}.mc-calendar-game.is-loss{border-color:#b33942;background:#3a1e25}.mc-calendar-game.is-pending{opacity:.9}@media(max-width:700px){.mc-calendar-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}";
style.textContent += "\n.mc-my-team-player{background:#253344}.mc-my-team-player td:first-child{color:#f5d45d}.mc-my-team-player small{display:block;color:#f5d45d;font-size:9px;letter-spacing:.1em}\n.mc-team-injury{color:#f28c8c;font-weight:800}.mc-team-healthy{color:#7be0ad;font-weight:800}\n.mc-box-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0;color:#aebbd0;font-size:12px}.mc-box-nav button:disabled{opacity:.3}\n";
style.textContent += "\n.mc-xp-card{border-color:#8f7936;background:linear-gradient(145deg,#292719,#111b2b)}\n.mc-xp-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.mc-xp-heading h2{margin:5px 0;font-size:clamp(19px,2.5vw,27px)}\n.mc-xp-points{text-align:right}.mc-xp-points strong{display:block;color:#f4d257;font-size:30px}.mc-xp-points span{font-size:10px;color:#b8c1d2;letter-spacing:.08em}\n.mc-xp-track{height:14px;margin:13px 0 8px;border-radius:20px;background:#202632;overflow:hidden;border:1px solid #4c5159}.mc-xp-track span{display:block;height:100%;background:repeating-linear-gradient(135deg,#f1d04f 0,#f1d04f 7px,#d8b33a 7px,#d8b33a 11px);border-radius:20px;transition:width .2s}\n.mc-attribute-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding-bottom:105px}\n.mc-attribute-panel{padding:16px;border:1px solid #334154;border-radius:14px;min-width:0;background:#142033}\n.mc-attribute-panel header{display:flex;align-items:center;gap:9px;margin-bottom:14px}.mc-attribute-panel header h3{font-size:14px;letter-spacing:.09em;margin:0}\n.mc-attribute-panel-dot{height:9px;width:9px;border-radius:50%;background:#e6c54e}\n.mc-panel-finish{background:linear-gradient(145deg,#192538,#111a28);border-color:#354e71}.mc-panel-shoot{background:linear-gradient(145deg,#142b25,#0e1e1b);border-color:#2f6550}.mc-panel-shoot .mc-attribute-panel-dot{background:#43d28d}\n.mc-panel-play{background:linear-gradient(145deg,#30291a,#211d16);border-color:#6b5934}.mc-panel-play .mc-attribute-panel-dot{background:#e3b84a}\n.mc-panel-defense{background:linear-gradient(145deg,#301e24,#20151a);border-color:#6b3844}.mc-panel-defense .mc-attribute-panel-dot{background:#e56a77}\n.mc-panel-physical{background:linear-gradient(145deg,#242338,#171625);border-color:#4f486d}.mc-panel-physical .mc-attribute-panel-dot{background:#a99be8}\n.mc-panel-mental{background:linear-gradient(145deg,#192b35,#101d25);border-color:#355b68}.mc-panel-mental .mc-attribute-panel-dot{background:#6bc4d8}\n.mc-attribute-list{display:flex;flex-direction:column;gap:15px}.mc-attribute-row{padding:7px 0 9px;border-bottom:1px solid #ffffff12;min-width:0}.mc-attribute-row:last-child{border-bottom:0}\n.mc-attribute-heading{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:baseline;gap:9px;margin-bottom:7px}\n.mc-attribute-name{font-size:12px;color:#d2d9e4;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mc-attribute-current{color:#f5d04f;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums}.mc-attribute-preview-level{color:#aeb5c0;font-size:11px;font-weight:800}.mc-attribute-max{font-size:10px;color:#9299a4;font-weight:800;white-space:nowrap}\n.mc-attribute-track{height:17px;background:#333a43;border:1px solid #4a515b;border-radius:4px;overflow:hidden;position:relative}\n.mc-attribute-fill{position:absolute;inset:0 auto 0 0;background:repeating-linear-gradient(135deg,#f2d04d 0,#f2d04d 6px,#d9b63d 6px,#d9b63d 10px);z-index:1}\n.mc-attribute-preview{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,#b8bdc7 0,#b8bdc7 5px,#858d99 5px,#858d99 9px);z-index:2;opacity:.95}\n.mc-attribute-locked{position:absolute;top:0;bottom:0;right:0;background:#171b22;z-index:3}.mc-attribute-cap-marker{position:absolute;top:-2px;bottom:-2px;width:2px;background:#8d929c;z-index:4;transform:translateX(-1px)}\n.mc-attribute-controls{display:flex;justify-content:space-between;align-items:center;margin-top:5px;color:#929baa;font-size:10px}.mc-attribute-controls>div{display:flex;gap:5px}\n.mc-attribute-arrow{min-width:27px;height:24px;border:1px solid #5f6570;border-radius:5px;background:#333943;color:#f3d25a;font-weight:900;cursor:pointer}.mc-attribute-arrow:disabled{opacity:.22;cursor:not-allowed}\n.mc-attribute-purchase{position:sticky;bottom:8px;z-index:5;display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 14px;margin-top:-88px;background:#0b1424ed;border:1px solid #52617a;border-radius:12px;box-shadow:0 12px 32px #0008;backdrop-filter:blur(10px)}\n.mc-attribute-purchase>div{margin-right:auto}.mc-attribute-purchase strong{display:block;color:#f4d257;font-size:20px}.mc-attribute-purchase span{font-size:10px;color:#aebbd0}\n.mc-story-prompt{margin:15px 0 0;color:#f3d45c;font-weight:800}\n.mc-box-summary{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;text-align:center}.mc-box-summary>div{display:flex;flex-direction:column;gap:5px}.mc-box-summary span{font-size:12px;color:#b4c4dd;letter-spacing:.12em}.mc-box-summary strong{font-size:clamp(32px,6vw,58px);color:#f5d45d}.mc-box-summary>b{font-size:12px;color:#a8b5c9}\n.mc-box-team{margin:15px 0;padding:16px;border:1px solid #344c6c;border-radius:13px;background:#0e1a2b}.mc-box-team-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.mc-box-team-head h2{margin:4px 0 0}.mc-box-team-head>strong{font-size:32px;color:#f3d45c}\n.mc-table-wrap{width:100%;overflow-x:auto}.mc-box-table{width:100%;border-collapse:collapse;font-size:11px;white-space:nowrap;font-variant-numeric:tabular-nums}\n.mc-box-table th,.mc-box-table td{padding:8px 9px;text-align:right;border-bottom:1px solid #ffffff14}.mc-box-table th:first-child,.mc-box-table td:first-child{text-align:left;min-width:145px}\n.mc-box-table th{font-size:10px;color:#aebbd0;letter-spacing:.07em}.mc-box-table td:first-child small{display:block;color:#8696ae;font-size:9px}.mc-box-total{font-weight:900;color:#f5d45d;background:#202c3b}\n@media(max-width:820px){.mc-attribute-panels{grid-template-columns:1fr}.mc-attribute-purchase{flex-wrap:wrap}.mc-attribute-purchase .mc-btn{flex:1}.mc-box-table{font-size:10px}.mc-box-table th,.mc-box-table td{padding:7px 6px}}\n@media(max-width:480px){.mc-attribute-heading{gap:6px}.mc-attribute-name{font-size:11px}.mc-xp-heading{align-items:flex-start}.mc-box-team{padding:9px}.mc-attribute-purchase{bottom:4px;padding:8px}.mc-attribute-purchase .mc-btn{font-size:12px;padding:10px}}\n";
const root=document.createElement("div");root.id="nbaMyCareerRoot";root.hidden=true;document.body.appendChild(root);
let career=null,draftPlayer=null,activeStory=null,buildBudget=760,saveError="";
let activeMode="launcher",mygmSnapshot=null,launcherSnapshot=null,careerBaseSource="";
const CAREER_SAVE_DB="nba-sim-lab-mycareer-files-v1",CAREER_SAVE_STORE="handles";
let careerSaveDirectoryHandle=null,careerSaveDirectoryPermission="prompt",careerSaveSlots=Array(10).fill(null);
const ATTRIBUTE_HOLD_INTERVAL_MS=50;
let attributeHoldSession=null;
const labelFor=key=>{for(const list of Object.values(groups))for(const pair of list)if(pair[0]===key)return pair[1];return key;};
function allPlayers(){return typeof players!=="undefined"&&Array.isArray(players)?players:[];}
function findPlayer(id){return allPlayers().find(p=>String(p.id)===String(id))||null;}
function playerForCareer(){return career&&findPlayer(career.playerId);}
function seasonName(year){return typeof seasonLabel==="function"?seasonLabel(year):String(year)+"-"+String((year+1)%100).padStart(2,"0");}
function render(html){stopAttributeHold(false);root.innerHTML='<div class="mc-shell">'+html+'</div>';root.hidden=false;}
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
 try{players=data.players;seasonYear=Number(data.seasonYear)||2025;phase=data.phase||"regular";seasonCalendar=data.seasonCalendar||null;seasonResults=data.seasonResults||[];if(typeof retired!=="undefined")retired=data.retired||[];customTeams=[];nextCustomTeamId=1;nextPlayerId=Math.max(1000,...players.map(p=>(Number(p.id)||0)+1));career=data.career;draftPlayer=data.draftPlayer||career.draftPlayer||null;career.player=findPlayer(career.playerId)||career.player||null;if(!career.progression)career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(career.player||{})),levelsEarned:0,lastAward:0};if(career.storyIndex==null)career.storyIndex=0;if(Number(career.storyInterval)!==0){career.storyInterval=0;career.pendingStory=false;career.pendingStoryMonth=null;career.lastStoryMonth=career.lastPlayedMonth||"";}if(typeof career.pendingStory!=="boolean")career.pendingStory=false;if(!career.attributeCaps)career.attributeCaps={};if(career.fatigue==null)career.fatigue=0;if(typeof career.autoSeasonSimulation!=="boolean")career.autoSeasonSimulation=false;if(!Array.isArray(career.autoBatchBoxScores))career.autoBatchBoxScores=[];if(career.autoBatchBoxIndex==null)career.autoBatchBoxIndex=career.autoBatchBoxScores.length?career.autoBatchBoxScores.length-1:0;window.NBASimActualPlayerStats=data.actualPlayerStats||{};window.NBASimActualBoxScores=data.actualBoxScores||{};if(!findPlayer(career.playerId)&&career.player&&!career.retired)players.push(career.player);if(typeof window.NBASimPrepareMyCareerMode==="function")window.NBASimPrepareMyCareerMode();if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();if(typeof renderAll==="function")renderAll();return true;}catch(error){saveError="Reprise impossible : "+error.message;return false;}
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
 showCareerBaseChoice();
}
function showCareerBaseChoice(){
 render(header("CHOISIR LES JOUEURS NBA","Sélectionne la base qui composera les effectifs de ta ligue.")+
  '<div class="mc-grid" style="gap:16px"><button class="mc-mode" id="mcUseDemo"><div class="mc-kicker">BASE INTÉGRÉE</div><h2>Charger les joueurs de la démo</h2><p>Utiliser les joueurs de démonstration et conserver leurs équipes NBA.</p></button><button class="mc-mode" id="mcUseSave"><div class="mc-kicker">FICHIER JSON</div><h2>Charger les joueurs d’une sauvegarde</h2><p>Importer les joueurs et leurs équipes depuis une sauvegarde NBA Sim Lab.</p></button></div><input id="mcCareerBaseFile" type="file" accept=".json,.txt,application/json" hidden><p id="mcBaseStatus" class="mc-status"></p><div class="mc-actions"><button class="mc-btn secondary" id="mcBaseCancel">Annuler</button></div>');
 attachReturn();
 $("mcUseDemo").onclick=()=>{
  if(typeof demoPlayers==="undefined"||!Array.isArray(demoPlayers)||!demoPlayers.length){$("mcBaseStatus").textContent="La base de démonstration est indisponible.";return;}
  prepareCareerPlayerBase(demoPlayers,"Démo NBA");
 };
 $("mcUseSave").onclick=()=>$("mcCareerBaseFile").click();
 $("mcCareerBaseFile").onchange=async event=>{
  const file=event.target.files&&event.target.files[0];if(!file)return;
  $("mcBaseStatus").textContent="Lecture de "+file.name+"…";
  try{
   const data=typeof parseSaveJsonFile==="function"?await parseSaveJsonFile(file):JSON.parse(await file.text());
   const list=Array.isArray(data)?data:data&&data.players;
   if(!Array.isArray(list)||!list.length)throw new Error("Le fichier doit contenir un tableau de joueurs ou une sauvegarde NBA Sim Lab.");
   prepareCareerPlayerBase(list,"Sauvegarde · "+file.name);
  }catch(error){$("mcBaseStatus").textContent="Chargement impossible : "+error.message;}
 };
 $("mcBaseCancel").onclick=openCareerHome;
}
function prepareCareerPlayerBase(sourcePlayers,sourceLabel){
 const teams=typeof nbaTeams!=="undefined"?nbaTeams:[];
 const valid=[];
 sourcePlayers.forEach(player=>{
  if(!player||typeof player!=="object"||player.retired===true||player.isRetired===true||player.myCareer||player.source==="MyCareer · Rival généré")return;
  const rawTeam=String(player.team??player.teamAbbreviation??"").trim();
  const found=teams.find(team=>String(team[0]).toUpperCase()===rawTeam.toUpperCase()||String(team[1]).toLowerCase()===rawTeam.toLowerCase());
  const teamCode=found?found[0]:(["FA","FREE_AGENT","FREE AGENT"].includes(rawTeam.toUpperCase())?"FA":null);
  if(teamCode)valid.push(Object.assign({},player,{team:teamCode}));
 });
 if(!valid.length){const status=$("mcBaseStatus");if(status)status.textContent="Aucun joueur d’une équipe NBA ou agent libre n’a été trouvé dans cette base.";return false;}
 try{
  players=typeof normalize==="function"?normalize(valid):valid.map(player=>Object.assign({},player));
  customTeams=[];nextCustomTeamId=1;nextPlayerId=Math.max(1000,...players.map(player=>(Number(player.id)||0)+1));
  if(typeof resetLeague==="function")resetLeague();
  seasonCalendar=null;seasonResults=[];phase="idle";seasonYear=2025;
  if(typeof window.NBASimPrepareMyCareerMode==="function")window.NBASimPrepareMyCareerMode();
  career=null;draftPlayer=null;pendingAttributeUpgrades={};careerBaseSource=sourceLabel;
  localStorage.removeItem(KEY);
  if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();
  showCreation();
  return true;
 }catch(error){const status=$("mcBaseStatus");if(status)status.textContent="Préparation de la ligue impossible : "+error.message;return false;}
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
  draftPlayer={name,pos,height,weight,wingspan,specialty:$("mcSpecialty").value,attributes:Object.fromEntries(attrs.map(p=>[p[0],40]))};applyPhysiqueBaseline(draftPlayer);
  draftPlayer.attributes.potential=95;draftPlayer.attributes.workEthic=75;draftPlayer.attributes.consistency=65;draftPlayer.attributes.intangibles=55;
  renderBuilder();
 };
 $("mcCancel").onclick=openCareerHome;
}
function physiqueAttributeCap(profile,key,player){let cap=key==="potential"||key==="intangibles"||profile.core.includes(key)?99:profile.secondary.includes(key)?94:86;const height=Number(player&&player.height)||188,weight=Number(player&&player.weight)||82,wingspan=Number(player&&player.wingspan)||height,h=(height-188)/10,w=(weight-82)/10,r=(wingspan-height)/10,shooting=["midRange","threePoint","freeThrow","shotIQ"].includes(key),rebounding=["offensiveRebound","defensiveRebound"].includes(key),mobility=["speed","acceleration","agility"].includes(key);if(shooting)cap-=Math.round(h*.7+r*.45);if(key==="block"||key==="interiorDefense"||rebounding)cap+=Math.round(h*.8+r*.8);if(key==="perimeterDefense"||key==="steal")cap+=Math.round(r*.9+h*.25-w*.25);if(mobility)cap-=Math.round(h*.7+w*.5);if(key==="vertical")cap-=Math.round(w*.65);if(key==="dunk")cap+=Math.round(r*.9+w*.2);if(key==="strength"||key==="finishing"||key==="closeShot")cap+=Math.round(w*.7);return clamp(cap,25,99);}
function capFor(profile,key){return physiqueAttributeCap(profile,key,draftPlayer);}
function pointsUsed(){return attrs.reduce((n,p)=>{const key=p[0],base=40+(Number(draftPlayer.physicalBonus&&draftPlayer.physicalBonus[key])||0);return n+Math.max(0,(Number(draftPlayer.attributes[key])||40)-base);},0);}
function applyPhysiqueBaseline(player){const height=Number(player.height)||188,weight=Number(player.weight)||82,wingspan=Number(player.wingspan)||height,h=(height-188)/10,w=(weight-82)/10,r=(wingspan-height)/10,bonus={};const add=(key,value)=>{const delta=clamp(Math.round(value),-5,8);bonus[key]=(Number(bonus[key])||0)+delta;player.attributes[key]=clamp((Number(player.attributes[key])||40)+delta,25,99);};
["midRange","threePoint","freeThrow","shotIQ"].forEach(k=>add(k,-h*.65));
add("interiorDefense",h*1.15);add("perimeterDefense",h*.3);add("block",h*1.35);add("defensiveRebound",h*1.1);add("offensiveRebound",h*.85);add("speed",-h*.85);add("acceleration",-h*.75);add("agility",-h*.9);
add("strength",w*1.35);add("speed",-w*.8);add("acceleration",-w*.7);add("agility",-w*.75);add("interiorDefense",w*.55);add("perimeterDefense",-w*.3);add("vertical",-w*.75);add("finishing",w*.65);add("dunk",w*.35);
add("dunk",r*.85);["midRange","threePoint","freeThrow","shotIQ"].forEach(k=>add(k,-r*.5));add("interiorDefense",r*.65);add("perimeterDefense",r*.65);add("block",r*1.05);add("steal",r*.8);add("defensiveRebound",r*.75);add("offensiveRebound",r*.55);
player.physicalBonus=bonus;player.physicalProfileApplied=true;return player;}
function buildOverall(profile){const values=profile.core.map(k=>Number(draftPlayer.attributes[k])||40),base=values.reduce((a,b)=>a+b,0)/Math.max(1,values.length),height=Number(draftPlayer.height)||188,weight=Number(draftPlayer.weight)||82,wingspan=Number(draftPlayer.wingspan)||height,reach=clamp((wingspan-height)*.55,-12,16),size=clamp((height-188)*.22,-10,10),mass=clamp((weight-82)*.10,-8,8),pos=draftPlayer.pos,physicalFit=(pos==="C"||pos==="PF"?size+reach*.55+mass*.35:pos==="PG"||pos==="SG"?-size*.35+reach*.4-mass*.3:size*.25+reach*.5+mass*.1);return Math.round(clamp(base*.82+(Number(draftPlayer.attributes.intangibles)||40)*.06+physicalFit*.75,40,99));}
function updateBuild(){
 const p=profileFor(draftPlayer.pos,draftPlayer.specialty),used=pointsUsed();
 $("mcBuildScore").innerHTML='<div class="mc-metric"><strong>'+buildOverall(p)+'</strong><span>GÉN estimé</span></div><div class="mc-metric"><strong>'+Math.max(0,buildBudget-used)+'</strong><span>Points restants</span></div>';
 $("mcBuildMeter").style.width=Math.min(100,used/buildBudget*100)+"%";$("mcBuildStatus").textContent=used+" / "+buildBudget+" points utilisés. Les attributs de ta spécialité pèsent le plus dans le général.";$("mcConfirmBuild").disabled=used>buildBudget;
}
function renderBuilder(){
 const profile=profileFor(draftPlayer.pos,draftPlayer.specialty);
 const groupColors={"SHOOTING":"#16803C","DEFENSE":"#C62828","REBOND":"#8E44AD","FINITION":"#1976D2","ORGANISATION":"#EF6C00","QUALITÉ ATHLÉTIQUE":"#E9D8A6","MENTAL":"#64748B"},sections=Object.entries(groups).map(([group,items])=>'<div class="mc-card mc-build-category" style="border-top:4px solid '+(groupColors[group]||"#64748B")+'"><h3 style="color:'+ (group==="QUALITÉ ATHLÉTIQUE"?"#E9D8A6":groupColors[group]||"#fff") +'">'+group+'</h3><div class="mc-bars">'+items.map(pair=>{
  const k=pair[0],v=Number(draftPlayer.attributes[k])||40,m=capFor(profile,k);
  return '<div class="mc-attribute"><label for="mcAttr-'+k+'">'+pair[1]+' <small style="color:#8398b7">MAX '+m+'</small></label><b>'+v+'</b><input id="mcAttr-'+k+'" data-mc-attribute="'+k+'" type="range" min="25" max="'+m+'" value="'+v+'"></div>';
 }).join("")+'</div></div>').join("");
 render(header("RÉPARTIS TES POINTS","Étape 2 · "+profile.name)+'<div class="mc-card"><div class="mc-grid" id="mcBuildScore"></div><div class="mc-meter"><span id="mcBuildMeter"></span></div><p class="mc-status" id="mcBuildStatus"></p><p class="mc-muted">Chaque point dépensé augmente un attribut. Les attributs principaux de ta spécialité peuvent atteindre 99.</p></div><div class="mc-scroll">'+sections+'</div><div class="mc-actions"><button class="mc-btn primary" id="mcConfirmBuild">Confirmer le joueur et préparer la Draft →</button><button class="mc-btn secondary" id="mcBackCreation">Retour</button></div>');
 attachReturn();root.querySelectorAll("[data-mc-attribute]").forEach(input=>input.oninput=()=>{
  const k=input.dataset.mcAttribute,v=Number(input.value),old=Number(draftPlayer.attributes[k])||40;
  const base=40+(Number(draftPlayer.physicalBonus&&draftPlayer.physicalBonus[k])||0);if(pointsUsed()-Math.max(0,old-base)+Math.max(0,v-base)>buildBudget){input.value=old;return;}
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
 career={version:1,baseSource:careerBaseSource,playerId:null,player:null,teamCode:null,teamName:null,seasonNumber:1,draftScore:0,draftScene:0,emotions:70,chemistry:60,popularity:35,lossStreak:0,rivalId:null,rivalName:"",generatedRival:false,lastRoundPlayed:0,gamesPlayed:0,wins:0,losses:0,autoSeasonSimulation:false,autoBatchBoxScores:[],autoBatchBoxIndex:0,seasonStats:{pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0},seasonHistory:[],storyHistory:[],lastGame:null,retired:false,pendingStory:true};
 career.draftPlayer=draftPlayer;saveCareer();showDraftStory();
}
function showDraftStory(){
 const scene=draftScenes[career.draftScene];if(!scene)return revealDraft();
 render(header("AVANT LA DRAFT","Décision narrative "+(career.draftScene+1)+" / 3")+'<div class="mc-card"><div class="mc-kicker">SCOUTING REPORT</div><h2>'+scene.title+'</h2><p class="mc-muted">'+scene.body+'</p>'+scene.choices.map((x,i)=>'<button class="mc-choice" data-draft-choice="'+i+'"><b>'+x.label+'</b><span class="mc-muted">'+x.detail+'</span></button>').join("")+'</div>');
 attachReturn();root.querySelectorAll("[data-draft-choice]").forEach(b=>b.onclick=()=>{
  const x=scene.choices[Number(b.dataset.draftChoice)];career.draftScore+=x.grade;career.emotions=clamp(career.emotions+Math.sign(x.emotion||0),0,100);career.chemistry=clamp(career.chemistry+Math.sign(x.chemistry||0),0,100);career.popularity=clamp(career.popularity+Math.sign(x.popularity||0),0,100);
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
 const profile=profileFor(draftPlayer.pos,draftPlayer.specialty),playerOverall=buildOverall(profile),grade=clamp(Math.round(playerOverall+career.draftScore*1.1+(rand()-.5)*4),40,99),pick=clamp(Math.round(31-(grade-40)*.72+(rand()-.5)*2),1,30);
 const list=(typeof nbaTeams!=="undefined"?nbaTeams:[]).slice().sort((a,b)=>((a[0].charCodeAt(0)*13+a[0].charCodeAt(1)*7)%31)-((b[0].charCodeAt(0)*13+b[0].charCodeAt(1)*7)%31));
 const chosen=list[(pick-1)%list.length]||["LAL","Los Angeles Lakers","West"];
 draftPlayer.id=typeof nextPlayerId!=="undefined"?nextPlayerId++:Date.now();draftPlayer.team=chosen[0];draftPlayer.age=19;draftPlayer.pts=0;draftPlayer.reb=0;draftPlayer.ast=0;draftPlayer.stl=.8;draftPlayer.blk=.3;draftPlayer.ts=.55;draftPlayer.three=.34;draftPlayer.mpg=24;draftPlayer.season=seasonName(typeof seasonYear!=="undefined"?seasonYear:2025);draftPlayer.source="MyCareer · Draft #"+pick;draftPlayer.rookie=true;draftPlayer.trophies=[];draftPlayer.history=[];draftPlayer.careerGames=[];draftPlayer.myCareer=true;draftPlayer.myCareerProfile={specialty:profileFor(draftPlayer.pos,draftPlayer.specialty).name,core:profileFor(draftPlayer.pos,draftPlayer.specialty).core,secondary:profileFor(draftPlayer.pos,draftPlayer.specialty).secondary};
 draftPlayer.attributes.potential=99;career.draftGrade=grade;career.draftPick=pick;career.teamCode=chosen[0];career.teamName=chosen[1];career.playerId=draftPlayer.id;career.player=draftPlayer;
 const rival=allPlayers().filter(p=>p&&nbaTeams.some(team=>team[0]===p.team)&&p.team!==chosen[0]&&p.retired!==true&&p.isRetired!==true&&!p.myCareer).sort((a,b)=>Math.abs((typeof overallRating==="function"?overallRating(a):70)-grade)-Math.abs((typeof overallRating==="function"?overallRating(b):70)-grade))[0];
 career.rivalId=rival?rival.id:null;career.rivalName=rival?rival.name:"Rival à déterminer";players.push(draftPlayer);ensureCareerLeague();secureCareerRoster(draftPlayer);
 career.pendingStory=false;career.storyIndex=0;career.storyInterval=0;career.pendingStoryMonth=null;career.lastStoryMonth="";career.lastPlayedMonth="";career.attributeCaps={};career.fatigue=0;career.seasonStartOverall=careerOverall(draftPlayer);career.seasonStartAttributes=Object.assign({},draftPlayer.attributes);career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(draftPlayer)),levelsEarned:0,lastAward:0};career.gamesPlayed=0;career.wins=0;career.losses=0;
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();if(typeof phase!=="undefined")phase="regular";career.lastRoundPlayed=0;saveCareer();
 render(header("LA DRAFT NBA","Pick #"+pick+" · "+grade+" de scouting")+'<div class="mc-result"><div class="mc-kicker">ON T’A CHOISI</div><h2 style="font-size:clamp(28px,5vw,48px);margin:10px 0">'+chosen[1]+'</h2><p class="mc-muted">'+chosen[0]+' sélectionne '+escHtml(draftPlayer.name)+' au choix #'+pick+'.</p><div class="mc-grid three"><div class="mc-metric"><strong>'+pick+'</strong><span>Choix de Draft</span></div><div class="mc-metric"><strong>'+grade+'</strong><span>Scouting</span></div><div class="mc-metric"><strong>19</strong><span>Âge de départ</span></div></div></div><div class="mc-card"><h3>Ta rivalité commence</h3><p class="mc-muted">'+(rival?"Les recruteurs te comparent déjà à "+escHtml(rival.name)+".":"La ligue va bientôt te trouver un rival.")+'</p><button class="mc-btn primary" id="mcStartSeason">Commencer ma saison rookie →</button></div>');
 attachReturn();$("mcStartSeason").onclick=()=>{career.pendingStory=false;career.gamesPlayed=0;career.lastRoundPlayed=0;saveCareer();renderDashboard();};
}
const stories=[{"title":"Ton rival te provoque","body":"Ton rival affirme que tu n'es pas encore à son niveau.","choices":[{"label":"Accepter le défi","detail":"Tu transformes la rivalité en motivation.","e":{"emotions":1,"popularity":1,"clutch":1}},{"label":"Répondre avec respect","detail":"Tu évites la polémique.","e":{"chemistry":1,"consistency":1}},{"label":"L'ignorer et travailler","detail":"Tu protèges ta concentration.","e":{"emotions":1,"workEthic":1,"popularity":-1}}]},{"title":"Le coach revoit ton rôle","body":"Le coach te propose de changer ton rôle dans la rotation.","choices":[{"label":"Accepter plus de responsabilités","detail":"Tu gagnes sa confiance.","e":{"chemistry":1,"emotions":-1,"offensiveIQ":1}},{"label":"Demander un rôle défensif","detail":"Tu privilégies les besoins de l'équipe.","e":{"chemistry":1,"defensiveIQ":1}},{"label":"Garder ton rôle actuel","detail":"Tu préfères tes repères.","e":{"consistency":1,"emotions":1}}]},{"title":"Un vétéran te reprend","body":"Un vétéran estime que tu prends de mauvaises habitudes à l'entraînement.","choices":[{"label":"Écouter ses conseils","detail":"Tu gagnes du respect.","e":{"chemistry":1,"basketballIQ":1}},{"label":"Lui demander une séance privée","detail":"Tu transformes la critique en travail.","e":{"workEthic":1,"ballHandle":1}},{"label":"Défendre ta méthode","detail":"Tu affirmes ton indépendance.","e":{"emotions":1,"popularity":1,"chemistry":-1}}]},{"title":"Les médias parlent de ton tir","body":"Une émission sportive analyse ton pourcentage au tir.","choices":[{"label":"Promettre de travailler ton tir","detail":"Tu assumes le défi.","e":{"workEthic":1,"midRange":1}},{"label":"Mettre en avant le collectif","detail":"Tu rappelles la priorité.","e":{"chemistry":1,"passing":1}},{"label":"Répondre avec humour","detail":"Tu détends l'atmosphère.","e":{"emotions":1,"popularity":1}}]},{"title":"Une marque veut collaborer","body":"Un équipementier te propose une campagne locale.","choices":[{"label":"Rencontrer les fans","detail":"Ta visibilité progresse.","e":{"popularity":1,"emotions":1}},{"label":"Refuser pour rester concentré","detail":"Tu gardes ta routine.","e":{"consistency":1,"workEthic":1}},{"label":"Proposer une action communautaire","detail":"Tu associes ton image à une bonne cause.","e":{"popularity":1,"chemistry":1}}]},{"title":"Les supporters réclament plus de minutes","body":"Les fans veulent te voir davantage sur le terrain.","choices":[{"label":"Dire que tu es prêt","detail":"Tu affiches ta confiance.","e":{"emotions":1,"popularity":1,"clutch":1}},{"label":"Rappeler que le coach décide","detail":"Tu respectes la hiérarchie.","e":{"chemistry":1,"intangibles":1}},{"label":"Promettre de mériter chaque minute","detail":"Tu mets l'accent sur le travail.","e":{"workEthic":1,"consistency":1}}]},{"title":"Choix d'entraînement","body":"Le staff te laisse choisir le thème d'une séance individuelle.","choices":[{"label":"Travail de finition","detail":"Tu répètes les gestes près du panier.","e":{"finishing":1,"layup":1}},{"label":"Séance de tir extérieur","detail":"Tu enchaînes les tirs.","e":{"threePoint":1,"midRange":1}},{"label":"Lecture du jeu","detail":"Tu étudies les prises à deux.","e":{"basketballIQ":1,"passing":1}}]},{"title":"La fatigue du voyage","body":"Après plusieurs déplacements, la récupération devient importante.","choices":[{"label":"Faire une séance de récupération","detail":"Tu protèges ton énergie.","e":{"stamina":1,"durability":1,"emotions":1}},{"label":"Continuer l'entraînement","detail":"Tu gardes ton rythme.","e":{"workEthic":1,"consistency":1,"emotions":-1}},{"label":"Demander un jour léger","detail":"Tu privilégies la fraîcheur.","e":{"durability":1,"chemistry":-1}}]},{"title":"Une tension dans le vestiaire","body":"Deux coéquipiers se disputent après une défaite.","choices":[{"label":"Rassembler le groupe","detail":"Tu essaies d'apaiser la situation.","e":{"chemistry":1,"intangibles":1}},{"label":"Parler séparément à chacun","detail":"Tu écoutes les deux côtés.","e":{"basketballIQ":1,"chemistry":1}},{"label":"Ne pas intervenir","detail":"Tu évites le conflit.","e":{"consistency":1,"chemistry":-1}}]},{"title":"Une vidéo de ton match circule","body":"Une séquence de ton dernier match devient populaire.","choices":[{"label":"Remercier les supporters","detail":"Tu reconnais leur soutien.","e":{"popularity":1,"emotions":1}},{"label":"Partager le crédit avec l'équipe","detail":"Tu mets tes coéquipiers en avant.","e":{"chemistry":1,"popularity":1}},{"label":"Ne rien publier","detail":"Tu gardes tes habitudes.","e":{"consistency":1}}]},{"title":"Le préparateur physique te conseille","body":"Le staff remarque que ton profil physique pourrait être mieux exploité.","choices":[{"label":"Travailler la vitesse","detail":"Tu travailles les premiers pas.","e":{"speed":1,"acceleration":1}},{"label":"Développer la force","detail":"Tu travailles le contact.","e":{"strength":1,"durability":1}},{"label":"Améliorer l'endurance","detail":"Tu veux garder ton intensité.","e":{"stamina":1,"workEthic":1}}]},{"title":"Un classement des rookies","body":"Un classement te place derrière plusieurs joueurs de ta Draft.","choices":[{"label":"Prendre cela comme motivation","detail":"Tu veux prouver ta valeur.","e":{"emotions":1,"clutch":1}},{"label":"Dire que les victoires comptent davantage","detail":"Tu privilégies les résultats collectifs.","e":{"chemistry":1,"intangibles":1}},{"label":"Ne pas commenter","detail":"Tu évites les distractions.","e":{"consistency":1,"popularity":-1}}]},{"title":"Le coach veut revoir la défense","body":"Le staff prépare une séance vidéo sur les rotations.","choices":[{"label":"Étudier les aides défensives","detail":"Tu travailles les lectures.","e":{"defensiveIQ":1,"interiorDefense":1}},{"label":"Travailler les duels extérieurs","detail":"Tu te concentres sur le un contre un.","e":{"perimeterDefense":1,"agility":1}},{"label":"Étudier les interceptions","detail":"Tu lis mieux les lignes de passe.","e":{"steal":1,"basketballIQ":1}}]},{"title":"Une association locale te sollicite","body":"Une association organise une activité avec les jeunes.","choices":[{"label":"Participer à la journée","detail":"Tu rencontres la communauté.","e":{"popularity":1,"chemistry":1}},{"label":"Offrir une séance de basket","detail":"Tu partages ton expérience.","e":{"popularity":1,"passing":1}},{"label":"Envoyer un message de soutien","detail":"Tu aides sans bouleverser ton programme.","e":{"emotions":1,"intangibles":1}}]},{"title":"Ton agent parle de ton avenir","body":"Ton agent veut connaître tes priorités pour les prochaines saisons.","choices":[{"label":"Devenir important dans l'équipe","detail":"Tu montres ton attachement au collectif.","e":{"chemistry":1,"intangibles":1}},{"label":"Construire une image de superstar","detail":"Tu assumes tes ambitions.","e":{"popularity":1,"emotions":1}},{"label":"Te concentrer sur ton développement","detail":"Tu veux progresser avant tout.","e":{"workEthic":1,"consistency":1}}]},{"title":"Une séance de visionnement","body":"Un assistant-coach te propose d'analyser tes dernières possessions.","choices":[{"label":"Étudier les passes disponibles","detail":"Tu travailles la création.","e":{"passing":1,"playmaking":1}},{"label":"Étudier les tirs refusés","detail":"Tu veux mieux choisir tes tirs.","e":{"shotIQ":1,"offensiveIQ":1}},{"label":"Analyser tes replis défensifs","detail":"Tu veux être plus fiable.","e":{"defensiveIQ":1,"consistency":1}}]},{"title":"Une petite série de défaites","body":"L'équipe traverse une période difficile.","choices":[{"label":"Organiser une discussion","detail":"Tu remets le groupe ensemble.","e":{"chemistry":1,"emotions":1}},{"label":"Proposer un entraînement supplémentaire","detail":"Tu veux retrouver le rythme.","e":{"workEthic":1,"stamina":1}},{"label":"Rassurer les jeunes","detail":"Tu évites la panique.","e":{"intangibles":1,"chemistry":1}}]},{"title":"Une série de victoires","body":"Les résultats augmentent les attentes autour de l'équipe.","choices":[{"label":"Garder la même routine","detail":"Tu veux rester constant.","e":{"consistency":1,"chemistry":1}},{"label":"Fixer un objectif collectif","detail":"Tu encourages le groupe.","e":{"chemistry":1,"emotions":1}},{"label":"Accepter plus de responsabilités","detail":"Tu assumes la confiance.","e":{"clutch":1,"popularity":1}}]},{"title":"Le capitaine te demande ton avis","body":"Le capitaine veut améliorer la communication sur le terrain.","choices":[{"label":"Parler davantage en défense","detail":"Tu aides les rotations.","e":{"defensiveIQ":1,"chemistry":1}},{"label":"Communiquer sur les écrans","detail":"Tu rends les actions plus fluides.","e":{"playmaking":1,"passing":1}},{"label":"Donner l'exemple par l'effort","detail":"Tu privilégies l'intensité.","e":{"workEthic":1,"intangibles":1}}]},{"title":"Une mauvaise soirée au tir","body":"Tu viens de traverser un match difficile offensivement.","choices":[{"label":"Reprendre les bases au gymnase","detail":"Tu travailles les gestes simples.","e":{"midRange":1,"consistency":1}},{"label":"Étudier tes choix de tirs","detail":"Tu améliores tes décisions.","e":{"shotIQ":1,"offensiveIQ":1}},{"label":"Faire confiance aux coéquipiers","detail":"Tu privilégies les bonnes lectures.","e":{"passing":1,"chemistry":1}}]},{"title":"Un jeune joueur te demande conseil","body":"Un jeune joueur te demande de l'aider à s'adapter à la NBA.","choices":[{"label":"L'aider à lire les défenses","detail":"Tu partages tes connaissances.","e":{"basketballIQ":1,"chemistry":1}},{"label":"Faire une séance de tir avec lui","detail":"Tu aides par l'exemple.","e":{"threePoint":1,"intangibles":1}},{"label":"L'encourager à trouver sa routine","detail":"Tu lui laisses construire sa méthode.","e":{"emotions":1,"workEthic":1}}]},{"title":"Une invitation à un événement","body":"La ville organise une soirée pour les joueurs.","choices":[{"label":"Y participer","detail":"Tu rencontres les supporters.","e":{"popularity":1,"emotions":1}},{"label":"Inviter des coéquipiers","detail":"Tu renforces les liens.","e":{"chemistry":1,"popularity":1}},{"label":"Rester chez toi pour récupérer","detail":"Tu privilégies le repos.","e":{"durability":1,"consistency":1}}]},{"title":"Un défi physique","body":"Tu peux consacrer ta séance à un test athlétique précis.","choices":[{"label":"Travailler la détente","detail":"Tu répètes les sauts.","e":{"vertical":1,"stamina":1}},{"label":"Travailler les changements de direction","detail":"Tu cherches plus d'agilité.","e":{"agility":1,"speed":1}},{"label":"Travailler le contact","detail":"Tu renforces ta stabilité.","e":{"strength":1,"finishing":1}}]},{"title":"La pression d'un match important","body":"Le prochain match attire l'attention des médias et des supporters.","choices":[{"label":"Accepter la responsabilité","detail":"Tu veux prendre tes responsabilités.","e":{"clutch":1,"emotions":1}},{"label":"Rappeler que le collectif passe avant tout","detail":"Tu gardes l'équipe au centre.","e":{"chemistry":1,"intangibles":1}},{"label":"Préparer une routine calme","detail":"Tu gères mieux la pression.","e":{"consistency":1,"stamina":1}}]},{"title":"Un ancien joueur te contacte","body":"Un ancien joueur professionnel te propose un conseil.","choices":[{"label":"Parler de ton développement","detail":"Tu veux mieux gérer ta progression.","e":{"basketballIQ":1,"potential":1}},{"label":"Demander un exercice technique","detail":"Tu recherches un conseil concret.","e":{"ballHandle":1,"workEthic":1}},{"label":"Parler de pression","detail":"Tu veux rester stable émotionnellement.","e":{"clutch":1,"consistency":1}}]},{"title":"Le vestiaire veut une activité d'équipe","body":"Les joueurs souhaitent renforcer la cohésion.","choices":[{"label":"Proposer un dîner","detail":"Tout le monde peut échanger.","e":{"chemistry":1,"emotions":1}},{"label":"Organiser un défi sportif","detail":"Tu encourages une compétition amicale.","e":{"chemistry":1,"stamina":1}},{"label":"Laisser le capitaine décider","detail":"Tu respectes le leadership.","e":{"intangibles":1,"consistency":1}}]} ];

stories.push(
 {title:"Le capitaine te confie le vestiaire",body:"Avant un match important, le capitaine te demande de prendre la parole devant le groupe.",choices:[
  {label:"Rassembler tout le monde et fixer un objectif",detail:"Tu prends un rôle de leader.",e:{chemistry:1,emotions:1,intangibles:1}},
  {label:"Motiver chacun individuellement",detail:"Tu renforces les liens dans le vestiaire.",e:{chemistry:2,popularity:1}},
  {label:"Laisser le capitaine mener le discours",detail:"Tu respectes son expérience.",e:{consistency:1,chemistry:1}}
 ]},
 {title:"Le coach te lance un défi physique",body:"Le staff pense qu'une séance très intense pourrait débloquer ton potentiel athlétique.",choices:[
  {label:"Accepter la séance complète",detail:"Un gros risque pour une grosse progression.",e:{workEthic:1,stamina:1}},
  {label:"Adapter la séance avec le préparateur",detail:"Tu cherches un équilibre entre progrès et récupération.",e:{durability:1,basketballIQ:1}},
  {label:"Privilégier la récupération",detail:"Tu protèges ton corps pour les prochains matchs.",e:{stamina:1,emotions:1}}
 ]},
 {title:"Une interview devient virale",body:"Une réponse après-match fait beaucoup parler sur les réseaux et dans les émissions sportives.",choices:[
  {label:"Assumer tes propos et parler aux fans",detail:"Tu renforces ton image publique.",e:{popularity:2,emotions:1}},
  {label:"Présenter des excuses à l'équipe",detail:"Tu protèges le vestiaire.",e:{chemistry:2,intangibles:1}},
  {label:"Ne pas alimenter la polémique",detail:"Tu gardes ton calme.",e:{consistency:1,emotions:1}}
 ]},
 {title:"Ton coéquipier veut travailler avec toi",body:"Un titulaire te propose de faire une séance supplémentaire à deux.",choices:[
  {label:"Travailler les automatismes offensifs",detail:"Vous améliorez votre complémentarité.",e:{passing:2,chemistry:1}},
  {label:"Organiser un duel très compétitif",detail:"Tu progresses sous pression.",e:{clutch:1,workEthic:1}},
  {label:"Faire une séance légère de récupération",detail:"Vous prenez soin de votre condition.",e:{durability:1,chemistry:1}}
 ]},
 {title:"La communauté veut te rencontrer",body:"Une école et plusieurs associations organisent une journée autour du basket.",choices:[
  {label:"Participer à toute la journée",detail:"Tu prends le temps de rencontrer les jeunes.",e:{popularity:2,emotions:1}},
  {label:"Animer un atelier de basket",detail:"Tu transmets tes connaissances.",e:{popularity:1,passing:1,intangibles:1}},
  {label:"Envoyer un message vidéo",detail:"Tu soutiens l'événement sans surcharger ton programme.",e:{popularity:1,consistency:1}}
 ]},
 {title:"Le match de revanche approche",body:"Ton rival affirme qu'il dominera votre prochain duel et les médias reprennent ses déclarations.",choices:[
  {label:"Accepter un duel individuel",detail:"Tu prends un risque pour montrer ton niveau.",e:{clutch:1,emotions:1}},
  {label:"Préparer un plan avec le coach",detail:"Tu privilégies la stratégie collective.",e:{basketballIQ:1,chemistry:1}},
  {label:"Répondre sur le terrain sans commentaire",detail:"Tu restes concentré sur ton jeu.",e:{consistency:1,workEthic:1}}
 ]}
);

const STORY_RISK_REWARD={
 "6:0":{changes:{finishing:3,layup:2,stamina:-1},fatigue:10,capIncrease:{finishing:1}},
 "6:1":{changes:{threePoint:3,midRange:2,stamina:-1},fatigue:11,capIncrease:{threePoint:1}},
 "6:2":{changes:{basketballIQ:2,passing:2},fatigue:3},
 "7:0":{changes:{stamina:2,durability:1},fatigue:-18},
 "7:1":{changes:{workEthic:2,consistency:2,stamina:-2},fatigue:18,capIncrease:{workEthic:1}},
 "10:0":{changes:{speed:3,acceleration:2,stamina:-1},fatigue:13,capIncrease:{speed:1}},
 "10:1":{changes:{strength:3,finishing:1,speed:-1},fatigue:12,capIncrease:{strength:2}},
 "10:2":{changes:{stamina:3,durability:1},fatigue:4},
 "12:0":{changes:{defensiveIQ:2,interiorDefense:2},fatigue:5,capIncrease:{interiorDefense:1}},
 "12:1":{changes:{perimeterDefense:2,agility:2},fatigue:7,capIncrease:{perimeterDefense:1}},
 "19:0":{changes:{midRange:3,consistency:1,stamina:-1},fatigue:12,capIncrease:{midRange:1}},
 "22:0":{changes:{vertical:3,stamina:-1},fatigue:12,capIncrease:{vertical:2}},
 "22:1":{changes:{agility:3,speed:2,stamina:-1},fatigue:11,capIncrease:{agility:1}},
 "22:2":{changes:{strength:2,finishing:2,speed:-1},fatigue:10,capIncrease:{finishing:1}},
 "24:1":{changes:{ballHandle:3,workEthic:1,stamina:-1},fatigue:9,capIncrease:{ballHandle:1}},
 "25:0":{changes:{clutch:4,speed:2},socialChanges:{emotions:4,popularity:2},fatigue:26,capIncrease:{clutch:2},injuryRisk:18},
 "25:1":{changes:{passing:4,basketballIQ:2},socialChanges:{chemistry:5},fatigue:12,capIncrease:{passing:2}},
 "26:0":{changes:{speed:4,acceleration:3,stamina:2},socialChanges:{emotions:2},fatigue:32,capIncrease:{speed:3,acceleration:2},injuryRisk:28},
 "27:0":{changes:{midRange:4,consistency:2},socialChanges:{popularity:6},fatigue:5,capIncrease:{midRange:2}},
 "28:1":{changes:{workEthic:4,consistency:4},socialChanges:{chemistry:4},fatigue:24,capIncrease:{workEthic:2},injuryRisk:20},
 "29:0":{changes:{threePoint:4,stamina:3},socialChanges:{popularity:4,emotions:4},fatigue:24,capIncrease:{threePoint:3},injuryRisk:22},
 "30:0":{changes:{clutch:4,shotIQ:3},socialChanges:{emotions:4,chemistry:2},fatigue:21,capIncrease:{clutch:2},injuryRisk:14}
};
function storyChoiceOutcome(sceneIndex,choiceIndex,choice){
 const social={},attributes={};Object.entries(choice&&choice.e||{}).forEach(([key,value])=>{if(["emotions","chemistry","popularity"].includes(key))social[key]=Number(value)||0;else attributes[key]=Number(value)||0;});
 const rule=STORY_RISK_REWARD[sceneIndex+":"+choiceIndex]||{};
 Object.entries(rule.changes||{}).forEach(([key,value])=>attributes[key]=(Number(attributes[key])||0)+(Number(value)||0));
 Object.entries(rule.socialChanges||{}).forEach(([key,value])=>social[key]=(Number(social[key])||0)+(Number(value)||0));
 return {social,attributes,fatigue:Number(rule.fatigue)||0,capIncrease:rule.capIncrease||{},injuryRisk:Number(rule.injuryRisk)||0};
}
function storyAttributeLabel(key){const found=attrs.find(item=>item[0]===key);return found?found[1]:key;}
function storyAttributeCategory(key){const section=CAREER_ATTRIBUTE_SECTIONS.find(item=>item.keys.includes(key));return section?section.title:"ATTRIBUTS";}
function storyGainText(value){return value>=4?"+"+value:"+".repeat(Math.max(0,Math.round(value)));}
function storyOutcomeMarkup(outcome,currentFatigue){
 const gains=Object.entries(outcome.attributes).filter(([,v])=>v>0).map(([key,v])=>'<span class="mc-story-gain"><b>'+storyGainText(v)+'</b> '+escHtml(storyAttributeLabel(key))+' <small>· '+escHtml(storyAttributeCategory(key))+'</small></span>');
 const losses=Object.entries(outcome.attributes).filter(([,v])=>v<0).map(([key,v])=>'<span class="mc-story-loss">−'+Math.abs(v)+' '+escHtml(storyAttributeLabel(key))+'</span>');
 const socialLabels={emotions:"Émotions",chemistry:"Entente d’équipe",popularity:"Popularité"};
 const socialGains=Object.entries(outcome.social).filter(([,v])=>v>0).map(([key,v])=>'<span class="mc-story-social-gain"><b>'+storyGainText(v)+'</b> '+escHtml(socialLabels[key]||key)+'</span>');
 const socialLosses=Object.entries(outcome.social).filter(([,v])=>v<0).map(([key,v])=>'<span class="mc-story-loss">−'+Math.abs(v)+' '+escHtml(socialLabels[key]||key)+'</span>');
 const caps=Object.entries(outcome.capIncrease).map(([key,v])=>'<span class="mc-story-cap">Plafond +'+v+' · '+escHtml(storyAttributeLabel(key))+'</span>');
 const fatigue=outcome.fatigue>0?'<span class="mc-story-fatigue">Fatigue +'+outcome.fatigue+'</span>':outcome.fatigue<0?'<span class="mc-story-recovery">Récupération '+Math.abs(outcome.fatigue)+'</span>':"";
 const injuryRisk=outcome.injuryRisk>0?'<span class="mc-story-risk">Risque de blessure : environ '+Math.round(outcome.injuryRisk+Math.max(0,(Number(currentFatigue)||0)+outcome.fatigue-55)*.6)+'%</span>':"";
 return '<div class="mc-story-outcome">'+(gains.join("")||'<span class="mc-muted">Aucun gain d’attribut direct</span>')+losses.join("")+socialGains.join("")+socialLosses.join("")+caps.join("")+fatigue+injuryRisk+'</div>';
}
function renderCareerStoryOverview(player){
 if(!player)return "";
 const usedKeys=new Set(),sections=CAREER_ATTRIBUTE_SECTIONS.map(section=>{
  const rows=section.keys.map(key=>{
   const meta=attrs.find(pair=>pair[0]===key);if(!meta)return "";
   usedKeys.add(key);
   const value=clamp(Number(player.attributes&&player.attributes[key])||0,0,99),cap=attributeUpgradeCap(player,key);
   return '<div class="mc-story-attribute-row"><div><span>'+escHtml(meta[1])+'</span><strong>'+value+' <small>/ '+cap+'</small></strong></div><div class="mc-story-attribute-track"><span style="width:'+value+'%"></span><i style="left:'+cap+'%"></i></div></div>';
  }).filter(Boolean).join("");
  return rows?'<section class="mc-story-attribute-panel mc-panel-'+escHtml(section.tone)+'"><h4>'+escHtml(section.title)+'</h4><div class="mc-story-attribute-list">'+rows+'</div></section>':"";
 }).join("");
 const extras=attrs.filter(pair=>!usedKeys.has(pair[0]));
 const extraMarkup=extras.length?'<section class="mc-story-attribute-panel"><h4>AUTRES ATTRIBUTS</h4><div class="mc-story-attribute-list">'+extras.map(([key,label])=>{
  const value=clamp(Number(player.attributes&&player.attributes[key])||0,0,99),cap=attributeUpgradeCap(player,key);
  return '<div class="mc-story-attribute-row"><div><span>'+escHtml(label)+'</span><strong>'+value+' <small>/ '+cap+'</small></strong></div><div class="mc-story-attribute-track"><span style="width:'+value+'%"></span><i style="left:'+cap+'%"></i></div></div>';
 }).join("")+'</div></section>':"";
 const social=[
  ["emotions","ÉMOTIONS"],["chemistry","ENTENTE D’ÉQUIPE"],["popularity","POPULARITÉ"]
 ].map(([key,label])=>{
  const value=clamp(Number(career[key])||0,0,100);
  return '<div class="mc-metric mc-story-social-metric"><strong>'+value+'/100</strong><span>'+label+'</span><div class="mc-story-social-track"><i style="width:'+value+'%"></i></div></div>';
 }).join("");
 return '<section class="mc-story-overview"><div class="mc-story-overview-heading"><div><div class="mc-kicker">ÉTAT ACTUEL DE TON JOUEUR</div><h3>'+escHtml(player.name||"Mon joueur")+' · GÉN '+careerOverall(player)+'</h3></div><span class="mc-story-fatigue-label">Fatigue '+Math.round(Number(career.fatigue)||0)+'/100</span></div><div class="mc-grid three mc-story-social-grid">'+social+'</div><div class="mc-story-attribute-grid">'+sections+extraMarkup+'</div></section>';
}
function renderStory(){
 const index=Math.max(0,Number(career.storyIndex)||0)%stories.length,scene=stories[index],month=career.pendingStoryMonth||career.lastPlayedMonth||"Fin de mois";activeStory=scene;
 const player=playerForCareer();
 const options=scene.choices.map((choice,i)=>{const outcome=storyChoiceOutcome(index,i,choice);return '<button class="mc-choice" data-story-choice="'+i+'"><b>'+escHtml(choice.label)+'</b><span class="mc-muted">'+escHtml(choice.detail)+'</span>'+storyOutcomeMarkup(outcome,career.fatigue)+'</button>';}).join("");
 render(header("UNE DÉCISION À PRENDRE",escHtml(month)+" · Saison "+career.seasonNumber)+'<div class="mc-card"><div class="mc-kicker">MYCAREER STORYLINE · '+(index+1)+' / '+stories.length+'</div><h2>'+escHtml(scene.title)+'</h2><p class="mc-muted">'+escHtml(scene.body)+'</p><p class="mc-muted">Certains choix offrent des gains de 4 points ou plus et peuvent relever un plafond de +2 ou +3. Les séances les plus intenses augmentent fortement la fatigue et le risque de blessure.</p>'+renderCareerStoryOverview(player)+'<h3 class="mc-story-choices-heading">CHOISIS TON ACTION</h3>'+options+'</div>');
 attachReturn();root.querySelectorAll("[data-story-choice]").forEach(button=>button.onclick=()=>{
  const choiceIndex=Number(button.dataset.storyChoice),choice=scene.choices[choiceIndex],outcome=storyChoiceOutcome(index,choiceIndex,choice),player=playerForCareer();
  Object.entries(outcome.social).forEach(([key,value])=>career[key]=clamp((Number(career[key])||0)+value,0,100));
  career.attributeCaps=career.attributeCaps||{};Object.entries(outcome.capIncrease).forEach(([key,value])=>career.attributeCaps[key]=clamp((Number(career.attributeCaps[key])||0)+Number(value||0),0,20));
  if(player&&player.attributes)Object.entries(outcome.attributes).forEach(([key,value])=>player.attributes[key]=clamp((Number(player.attributes[key])||40)+value,20,attributeUpgradeCap(player,key)));
  career.fatigue=clamp((Number(career.fatigue)||0)+outcome.fatigue,0,100);
  const effectiveInjuryRisk=clamp(outcome.injuryRisk+Math.max(0,career.fatigue-55)*.6,0,85);
  let storyInjury=null;
  if(player&&!player.injury&&effectiveInjuryRisk>0&&rand()*100<effectiveInjuryRisk){
   if(typeof window.NBASimBuildInjury==="function")storyInjury=window.NBASimBuildInjury(player,effectiveInjuryRisk>=55?"moderate":"minor","leg",null,null);
   if(!storyInjury)storyInjury={id:"story-injury-"+Date.now(),severity:"minor",label:"Blessure légère",bodyPart:"leg",bodyPartLabel:"Jambe",stage:"out",restGamesTotal:2,restGamesRemaining:2,recoveryGamesTotal:2,recoveryGamesRemaining:2,attributePenalties:{},createdSeason:seasonName(seasonYear),createdGameId:null,manual:true};
   player.injury=storyInjury;
  }
  career.storyHistory=Array.isArray(career.storyHistory)?career.storyHistory:[];
  career.storyHistory.push({season:seasonName(seasonYear),month,event:scene.title,choice:choice.label,storyIndex:index,attributeChanges:outcome.attributes,socialChanges:outcome.social,capIncrease:outcome.capIncrease,fatigue:outcome.fatigue,injuryRisk:effectiveInjuryRisk,injuryApplied:!!storyInjury});
  career.storyIndex=(index+1)%stories.length;career.pendingStory=false;career.pendingStoryMonth=null;const resumeSimulation=career.autoSeasonSimulation===true;saveCareer();if(resumeSimulation){simulateCareerSeason({resume:true});return;}renderDashboard();
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
function careerMonthForScheduledGame(game,teamCode){
 if(!game)return "Calendrier";const number=String(game.home&&game.home.code)===String(teamCode)?Number(game.homeGameNumber||game.gameNumberHome):Number(game.awayGameNumber||game.gameNumberHome),stages=seasonCalendar&&Array.isArray(seasonCalendar.stages)?seasonCalendar.stages:[];
 let remaining=number;for(const stage of stages){remaining-=Number(stage.count)||0;if(remaining<=0)return String(stage.label||"Calendrier");}
 return String(game.stage||"Calendrier");
}
function statLine(){const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||0);return (Number(s.gp)||0)+" MJ · "+((Number(s.pts)||0)/gp).toFixed(1)+" PTS · "+((Number(s.reb)||0)/gp).toFixed(1)+" REB · "+((Number(s.ast)||0)/gp).toFixed(1)+" AST";}
const CAREER_ATTRIBUTE_SECTIONS=[
 {title:"SHOOTING",tone:"shoot",keys:["midRange","threePoint","freeThrow","shotIQ"]},
 {title:"DEFENSE",tone:"defense",keys:["perimeterDefense","interiorDefense","steal","block","defensiveIQ"]},
 {title:"REBOND",tone:"rebound",keys:["offensiveRebound","defensiveRebound"]},
 {title:"FINITION",tone:"finish",keys:["finishing","closeShot","layup","dunk"]},
 {title:"ORGANISATION",tone:"play",keys:["passing","ballHandle","playmaking","offensiveIQ","basketballIQ"]},
 {title:"QUALITÉ ATHLÉTIQUE",tone:"physical",keys:["speed","acceleration","agility","strength","vertical","stamina","durability"]},
 {title:"MENTAL",tone:"mental",keys:["consistency","clutch","potential","workEthic","intangibles"]}
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
 return Math.max(15,Math.round(22+pts*1.7+reb*1.4+ast*1.7+stl*3+blk*3+minutes*.4-turnovers*.5+(won?12:0)+(doubleDouble?10:0)));
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
 const profile=player&&player.myCareerProfile||{},base=physiqueAttributeCap({core:Array.isArray(profile.core)?profile.core:[],secondary:Array.isArray(profile.secondary)?profile.secondary:[]},key,player),careerBonus=Number(career&&career.attributeCaps&&career.attributeCaps[key])||0;
 return clamp(base+careerBonus,25,99);
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
  Object.keys(raw).forEach(id=>{if(!ids.has(String(id))){const player=findPlayer(id)||(career.player&&String(career.player.id)===String(id)?career.player:null);if(player)roster.push(player);}});
  const rows=roster.map(player=>{
   const line=raw[String(player.id)]||{};
   return {id:player.id,name:String(player.name||"Joueur"),pos:String(player.pos||""),minutes:Number(line.minutes)||0,pts:Number(line.pts)||0,reb:Number(line.reb)||0,ast:Number(line.ast)||0,stl:Number(line.stl)||0,blk:Number(line.blk)||0,tov:Number(line.tov)||0,pf:Number(line.pf)||0,fgm:Number(line.fgm)||0,fga:Number(line.fga)||0,threeMade:Number(line.threeMade)||0,threeAttempts:Number(line.threeAttempts)||0,ftm:Number(line.ftm)||0,fta:Number(line.fta)||0};
  }).sort((a,b)=>b.minutes-a.minutes||b.pts-a.pts);
  return {code,name:String(teamRef.name||code),score:Number(score)||0,players:rows};
 };
 return {home:makeSide("home",game.home,game.homeScore),away:makeSide("away",game.away,game.awayScore)};
}
function renderLastBoxScore(){
 const batch=career&&Array.isArray(career.autoBatchBoxScores)?career.autoBatchBoxScores:[];
 const source=batch.length?batch:[career&&career.lastGame].filter(Boolean);
 if(!source.length)return renderDashboard();
 const index=clamp(career.autoBatchBoxIndex==null?source.length-1:Number(career.autoBatchBoxIndex),0,source.length-1);
 career.autoBatchBoxIndex=index;
 const game=source[index];if(!game||!game.boxScore)return renderDashboard();
 const home=game.boxScore.home,away=game.boxScore.away;
 let batchNav="";
 if(source.length>1){
  batchNav='<div class="mc-box-nav"><button class="mc-btn secondary" id="mcBoxPrevious" '+(index<=0?"disabled":"")+'>← Match précédent</button><span>Match '+(index+1)+' / '+source.length+'</span><button class="mc-btn secondary" id="mcBoxNext" '+(index>=source.length-1?"disabled":"")+'>Match suivant →</button></div>';
 }
 render(header("BOX SCORE","Match "+(game.gameNumber||career.gamesPlayed)+" · "+game.result)+
  '<p class="mc-story-prompt">+'+(Number(game.xpEarned)||0)+' EXP après ce match · '+(progressionState(playerForCareer()).points||0)+' point(s) d’attribut disponibles.</p>'+
  '<div class="mc-card mc-box-summary"><div><span>'+escHtml(home.code)+'</span><strong>'+home.score+'</strong></div><b>FINAL</b><div><span>'+escHtml(away.code)+'</span><strong>'+away.score+'</strong></div></div>'+
  batchNav+renderCareerBoxScoreSide(home)+renderCareerBoxScoreSide(away)+
  '<div class="mc-actions"><button class="mc-btn primary" id="mcBoxContinue">'+(career.pendingStory?"Continuer vers ton histoire →":career.gamesPlayed>=82?"Terminer la saison →":career.autoSeasonSimulation?"Reprendre la simulation →":"Retour à ma carrière")+'</button><button class="mc-btn secondary" id="mcBoxAttributes">Voir mes attributs</button></div>');
 attachReturn();
 if($("mcBoxPrevious"))$("mcBoxPrevious").onclick=()=>{career.autoBatchBoxIndex=Math.max(0,career.autoBatchBoxIndex-1);renderLastBoxScore();};
 if($("mcBoxNext"))$("mcBoxNext").onclick=()=>{career.autoBatchBoxIndex=Math.min(source.length-1,career.autoBatchBoxIndex+1);renderLastBoxScore();};
 $("mcBoxContinue").onclick=()=>{
  if(career.pendingStory){renderStory();return;}
  if(career.gamesPlayed>=82){finishSeason();return;}
  if(career.autoSeasonSimulation){career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;saveCareer();simulateCareerSeason({resume:true});return;}
  renderDashboard();
 };
 $("mcBoxAttributes").onclick=showCareerAttributes;
}
function renderCareerLeagueLeaders(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const actual=window.NBASimActualPlayerStats||{},mine=career.seasonStats||{};
 const categories=[
  ["pts","PPG","Points par match",x=>x.pts],
  ["reb","RPG","Rebonds par match",x=>x.reb],
  ["ast","APG","Passes décisives par match",x=>x.ast],
  ["stl","SPG","Interceptions par match",x=>x.stl],
  ["blk","BPG","Contres par match",x=>x.blk],
  ["fg","FG%","Pourcentage au tir",x=>x.fga?x.fgm/x.fga*100:0],
  ["three","3P%","Pourcentage à trois points",x=>x.threeAttempts?x.threeMade/x.threeAttempts*100:0],
  ["ft","FT%","Pourcentage aux lancers francs",x=>x.fta?x.ftm/x.fta*100:0]
 ];
 const league=allPlayers().filter(x=>x&&!x.retired&&!x.isRetired).map(player=>{
  let raw=actual[String(player.id)]||{},gp=Number(raw.gp)||0;
  if(String(player.id)===String(p.id)&&!gp){raw={pts:mine.pts,reb:mine.reb,ast:mine.ast,stl:mine.stl,blk:mine.blk,minutes:mine.minutes,gp:mine.gp};gp=Number(raw.gp)||0;}
  if(gp<=0)return null;
  const total=k=>Number(raw[k])||0;return {player,gp,pts:total("pts")/gp,reb:total("reb")/gp,ast:total("ast")/gp,stl:total("stl")/gp,blk:total("blk")/gp,mpg:total("minutes")/gp,fgm:total("fgm"),fga:total("fga"),threeMade:total("threeMade"),threeAttempts:total("threeAttempts"),ftm:total("ftm"),fta:total("fta")};
 }).filter(Boolean);
 const markup=categories.map(([key,title,description,selector])=>{
  const rows=league.map(row=>({player:row.player,gp:row.gp,value:selector(row)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value).slice(0,10);
  const body=rows.map((row,i)=>'<tr class="'+(String(row.player.id)===String(p.id)?"mc-my-team-player":"")+'"><td>'+(i+1)+'</td><td><b>'+escHtml(row.player.name)+'</b></td><td>'+escHtml(careerTeamLabel(row.player.team))+'</td><td><b>'+(["fg","three","ft"].includes(key)?row.value.toFixed(1)+"%":row.value.toFixed(1))+'</b></td><td>'+row.gp+'</td></tr>').join("");
  return '<section class="mc-card"><h3>'+title+' · '+description+'</h3><div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>#</th><th>Joueur</th><th>Équipe</th><th>Moyenne</th><th>MJ</th></tr></thead><tbody>'+body+'</tbody></table></div></section>';
 }).join("");
 render(header("LEAGUE LEADERS","Statistiques réelles · Saison "+seasonName(seasonYear))+(league.length?markup:'<div class="mc-card"><p class="mc-muted">Aucun match n’a encore été comptabilisé dans cette saison.</p></div>')+'<div class="mc-actions"><button class="mc-btn secondary" id="mcLeadersBack">Retour à ma carrière</button></div>');
 attachReturn();$("mcLeadersBack").onclick=renderDashboard;
}

function renderCareerTeam(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const teamMeta=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(team=>String(team[0])===String(career.teamCode));
 const teamName=teamMeta?teamMeta[1]:career.teamName||career.teamCode;
 const roster=allPlayers().filter(player=>String(player.team)===String(career.teamCode)&&player.retired!==true&&player.isRetired!==true).sort((a,b)=>{
  if(String(a.id)===String(p.id))return -1;if(String(b.id)===String(p.id))return 1;
  return (typeof overallRating==="function"?overallRating(b):Number(b.pts)||0)-(typeof overallRating==="function"?overallRating(a):Number(a.pts)||0);
 }).slice(0,15);
 const body=roster.map(player=>{
  const isCareerPlayer=String(player.id)===String(p.id),injury=player.injury;
  const ovr=isCareerPlayer?careerOverall(player):(typeof overallRating==="function"?overallRating(player):"—");
  const portrait=typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(player,34):"";
  return '<tr class="'+(isCareerPlayer?"mc-my-team-player":"")+'"><td><b>'+portrait+escHtml(player.name)+'</b>'+(isCareerPlayer?'<small>TON JOUEUR</small>':"")+'</td><td>'+escHtml(player.pos||"—")+'</td><td><b>'+ovr+'</b></td><td>'+Math.round(Number(player.age)||0)+'</td><td>'+Math.round(Number(player.height)||0)+' cm</td><td>'+Math.round(Number(player.mpg)||0)+'</td><td>'+(Number(player.pts)||0).toFixed(1)+'</td><td>'+(Number(player.reb)||0).toFixed(1)+'</td><td>'+(Number(player.ast)||0).toFixed(1)+'</td><td>'+(injury?'<span class="mc-team-injury">Blessé</span>':'<span class="mc-team-healthy">Disponible</span>')+'</td></tr>';
 }).join("");
 render(header("MON ÉQUIPE",teamName+" · "+roster.length+" joueurs")+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan de l’équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div><div class="mc-metric"><strong>'+roster.length+'/15</strong><span>Effectif</span></div></div>'+
  '<div class="mc-card"><div class="mc-kicker">EFFECTIF NBA · LECTURE SEULE</div><p class="mc-muted">Voici les joueurs actuellement enregistrés dans ta franchise. Les minutes, la rotation, les tendances et les contrats ne peuvent pas être modifiés depuis MyCareer.</p><div class="mc-table-wrap"><table class="mc-box-table mc-roster-table"><thead><tr><th>Joueur</th><th>POS</th><th>GÉN</th><th>ÂGE</th><th>TAILLE</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>ÉTAT</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="mc-actions"><button class="mc-btn secondary" id="mcTeamBack">Retour à ma carrière</button></div></div>');
 attachReturn();$("mcTeamBack").onclick=renderDashboard;
}
function renderCareerCalendarMarkup(){
 const p=playerForCareer();if(!p||!career.teamCode||typeof seasonCalendar==="undefined"||!seasonCalendar||!Array.isArray(seasonCalendar.games))return "";
 const games=seasonCalendar.games.filter(g=>g.home&&g.away&&(String(g.home.code)===String(career.teamCode)||String(g.away.code)===String(career.teamCode))),stages=[];
 games.forEach(g=>{const stage=careerMonthForScheduledGame(g,career.teamCode);let group=stages.find(x=>x.name===stage);if(!group){group={name:stage,games:[]};stages.push(group);}group.games.push(g);});
 const html=stages.map(group=>'<section class="mc-calendar-month"><h3>'+escHtml(group.name)+'</h3><div class="mc-calendar-grid">'+group.games.map(g=>{const home=String(g.home.code)===String(career.teamCode),opponent=home?g.away:g.home,played=g.status==="completed",score=played?(home?g.homeScore+"–"+g.awayScore:g.awayScore+"–"+g.homeScore):"À jouer",won=played&&Number(home?g.homeScore:g.awayScore)>Number(home?g.awayScore:g.homeScore),lost=played&&!won;return '<button type="button" class="mc-calendar-game '+(won?"is-win":lost?"is-loss":"is-pending")+'" data-mc-calendar-game="'+escHtml(g.id)+'" aria-label="'+(played?"Consulter":"Simuler jusqu’à")+' '+escHtml(opponent.name||opponent.code)+'"><small>'+(home?"DOMICILE":"EXTÉRIEUR")+' · J'+Number(home?(g.homeGameNumber||g.gameNumberHome):(g.awayGameNumber||g.gameNumberHome))+'</small><b>'+escHtml(opponent.code||opponent.name)+'</b><span>'+score+'</span><em>'+(played?"Voir le box score":"Cliquer pour simuler")+'</em></button>';}).join("")+'</div></section>').join("");
 return '<div class="mc-card mc-calendar-card"><div class="mc-kicker">CALENDRIER · 82 MATCHS</div><h2>Grille interactive des matchs</h2><p class="mc-muted">Clique sur un match déjà joué pour revoir son box score, ou sur un match à venir pour simuler toutes les journées précédentes jusqu’à cette rencontre. La simulation s’arrête aux choix mensuels.</p>'+html+'</div>';
}
function renderCareerCalendarGameBoxScore(game){
 if(!game||!game.playerBoxScores)return renderDashboard();const box=captureCareerBoxScore(game),home=box.home,away=box.away;
 render(header("BOX SCORE","Calendrier · "+escHtml(careerMonthForScheduledGame(game,career.teamCode))+' · '+(Number(game.round)||"") )+'<div class="mc-card mc-box-summary"><div><span>'+escHtml(home.code)+'</span><strong>'+home.score+'</strong></div><b>FINAL</b><div><span>'+escHtml(away.code)+'</span><strong>'+away.score+'</strong></div></div>'+renderCareerBoxScoreSide(home)+renderCareerBoxScoreSide(away)+'<div class="mc-actions"><button class="mc-btn secondary" id="mcCalendarBoxBack">Retour au calendrier</button></div>');
 attachReturn();$("mcCalendarBoxBack").onclick=renderDashboard;
}
function simulateCareerCalendarTarget(gameId){
 const game=seasonCalendar&&seasonCalendar.games.find(g=>String(g.id)===String(gameId));if(!game)return;
 if(game.status==="completed"){renderCareerCalendarGameBoxScore(game);return;}
 career.autoSimulationTargetGameId=String(game.id);career.autoSeasonSimulation=true;career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;saveCareer();simulateCareerSeason({targetGameId:String(game.id)});
}
function renderDashboard(){
 const p=playerForCareer();if(!p||career.retired)return renderRetirement();installCareerOverall();
 const rival=career.rivalId!=null?findPlayer(career.rivalId):null,next=nextPlayerGame(),game=career.lastGame,injury=p.injury,tradeNotice=career.tradeNotice;
 const xp=progressionState(p),storyDue=career.pendingStory===true,seasonComplete=career.gamesPlayed>=82||!next,fatigue=clamp(Number(career.fatigue)||0,0,100);
 const injuryText=injury?(injury.label||injury.severity)+" · "+(Number(injury.restGamesRemaining)||0)+" matchs avant retour":"En santé";
 render(header("SAISON "+career.seasonNumber,p.name+" · "+p.team+" · "+p.age+" ans")+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN</span></div><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div></div>'+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.emotions+'</strong><span>Émotions</span></div><div class="mc-metric"><strong>'+career.chemistry+'</strong><span>Entente d’équipe</span></div><div class="mc-metric"><strong>'+career.popularity+'</strong><span>Popularité</span></div></div><div class="mc-card mc-fatigue-card"><div class="mc-kicker">CONDITION PHYSIQUE</div><div class="mc-fatigue-heading"><b>Fatigue</b><strong>'+fatigue+'/100</strong></div><div class="mc-fatigue-track"><span style="width:'+fatigue+'%"></span></div><p class="mc-muted">La fatigue réduit progressivement ta vitesse, ton agilité, ton endurance et ta régularité. Les choix de récupération peuvent la réduire.</p></div>'+
 '<div class="mc-card">'+(tradeNotice?'<div class="mc-result"><div class="mc-kicker">TRADE · NOUVELLE FRANCHISE</div><h2>'+escHtml(tradeNotice.to||career.teamName)+'</h2><p class="mc-muted">Tu as été échangé par '+escHtml(tradeNotice.from||"ton ancienne équipe")+' vers '+escHtml(tradeNotice.toCode||career.teamCode)+'. L’affichage est actualisé sur ta nouvelle équipe.</p><button class="mc-btn secondary" id="mcDismissTrade">Compris</button></div>':"")+'<div class="mc-grid"><div><div class="mc-kicker">STATISTIQUES DE LA SAISON</div><h2>'+statLine()+'</h2><p class="mc-muted">Blessure : '+injuryText+'</p><p class="mc-muted">Prochain match : '+(next?escHtml(next.home.name)+" vs "+escHtml(next.away.name):"Saison régulière terminée")+'</p></div><div><div class="mc-kicker">TON RIVAL</div><h2>'+(rival?escHtml(rival.name):escHtml(career.rivalName||"Rival à déterminer"))+'</h2><p class="mc-muted">'+(rival?escHtml(rival.team)+" · GÉN "+(typeof overallRating==="function"?overallRating(rival):"—"):"Un nouveau rival sera identifié.")+'</p></div></div><div class="mc-divider"></div><div class="mc-kicker">DERNIER MATCH</div>'+
 (game?'<div class="mc-game-result"><b>'+escHtml(game.teamCode)+'</b><strong>'+game.teamScore+' – '+game.opponentScore+'</strong><b>'+escHtml(game.opponentCode)+'</b></div><p class="mc-muted" style="text-align:center">'+escHtml(game.result)+' · '+escHtml(game.line)+'</p>':'<p class="mc-muted">Tu n’as pas encore disputé ton premier match NBA.</p>')+
 '<div class="mc-actions"><button class="mc-btn primary" id="mcNextMatch" '+(!next||storyDue?"disabled":"")+'>Simuler le prochain match →</button><button class="mc-btn primary" id="mcSimSeason" '+(seasonComplete||storyDue?"disabled":"")+'>Simuler la saison →</button><button class="mc-btn secondary" id="mcAttributes">Voir mes attributs'+(xp.points>0?" · "+xp.points+" point(s)":"")+'</button><button class="mc-btn secondary" id="mcTeam">Voir mon équipe</button><button class="mc-btn secondary" id="mcLeagueLeaders">League Leaders</button>'+(game&&game.boxScore?'<button class="mc-btn secondary" id="mcViewBox">Voir le box score</button>':'')+'<button class="mc-btn secondary" id="mcSave">Sauvegarder</button></div>'+
 (storyDue?'<p class="mc-story-prompt">Une histoire t’attend à la fin de '+escHtml(career.pendingStoryMonth||"ce mois")+'.</p><div class="mc-actions"><button class="mc-btn primary" id="mcOpenStory">Faire mon choix d’histoire →</button></div>':'')+
 '<p class="mc-status">'+escHtml(saveError||"La simulation MyCareer est isolée de MyGM.")+'</p></div>'+renderCareerCalendarMarkup());
 attachReturn();
 if($("mcDismissTrade"))$("mcDismissTrade").onclick=()=>{career.tradeNotice=null;saveCareer();renderDashboard();};
 $("mcNextMatch").onclick=()=>simulateNextMatch();
 $("mcSimSeason").onclick=simulateCareerSeason;
 $("mcAttributes").onclick=()=>{pendingAttributeUpgrades={};showCareerAttributes();};
 $("mcTeam").onclick=renderCareerTeam;$("mcLeagueLeaders").onclick=renderCareerLeagueLeaders;
 if($("mcViewBox"))$("mcViewBox").onclick=renderLastBoxScore;
 if($("mcOpenStory"))$("mcOpenStory").onclick=renderStory;
 $("mcSave").onclick=()=>{saveCareer();renderDashboard();};
 root.querySelectorAll("[data-mc-calendar-game]").forEach(button=>button.onclick=()=>simulateCareerCalendarTarget(button.dataset.mcCalendarGame));
 if(!next&&career.gamesPlayed>=82&&!career.pendingStory)finishSeason();
}
function refreshAttributeUpgradeUI(player,progress){
 const selected=pendingUpgradeCount();
 root.querySelectorAll("[data-attribute-row]").forEach(row=>{
  const key=row.dataset.attributeRow,current=clamp(Number(player.attributes[key])||0,0,99),cap=attributeUpgradeCap(player,key),planned=clamp(Number(pendingAttributeUpgrades[key])||0,0,cap-current);
  const currentLabel=row.querySelector(".mc-attribute-current"),previewLabel=row.querySelector(".mc-attribute-preview-level"),trackPreview=row.querySelector(".mc-attribute-preview");
  if(currentLabel)currentLabel.textContent=String(current);
  if(previewLabel)previewLabel.textContent=planned>0?"→ "+(current+planned):"";
  if(trackPreview){trackPreview.style.left=(current/99*100).toFixed(3)+"%";trackPreview.style.width=(planned/99*100).toFixed(3)+"%";}
  const add=row.querySelector("[data-add-upgrade]"),remove=row.querySelector("[data-remove-upgrade]");
  if(add)add.disabled=!(progress.points>selected&&current+planned<cap);
  if(remove)remove.disabled=planned<=0;
 });
 const countLabel=$("mcSelectedPoints");if(countLabel)countLabel.textContent=selected+" / "+progress.points;
 const buy=$("mcBuyAttributes"),clear=$("mcClearAttributes");
 if(buy)buy.disabled=selected===0||selected>progress.points;
 if(clear)clear.disabled=selected===0;
}
function addPendingAttributePoint(key,player,progress){
 if(!player||player!==playerForCareer())return false;
 const cap=attributeUpgradeCap(player,key),current=clamp(Number(player.attributes[key])||0,0,99),planned=Number(pendingAttributeUpgrades[key])||0;
 if(progress.points<=pendingUpgradeCount()||current+planned>=cap)return false;
 pendingAttributeUpgrades[key]=planned+1;
 refreshAttributeUpgradeUI(player,progress);
 return true;
}
function stopAttributeHold(addSingle){
 const session=attributeHoldSession;if(!session)return;
 clearInterval(session.timer);attributeHoldSession=null;
 if(addSingle&&session.ticks===0)addPendingAttributePoint(session.key,session.player,session.progress);
}
function startAttributeHold(button,key,player,progress,event){
 if(event.button!=null&&event.button!==0)return;
 event.preventDefault();stopAttributeHold(false);
 const session={button,key,player,progress,pointerId:event.pointerId,ticks:0,timer:null};
 attributeHoldSession=session;
 try{if(button.setPointerCapture&&event.pointerId!=null)button.setPointerCapture(event.pointerId);}catch(_){}
 session.timer=setInterval(()=>{
  if(attributeHoldSession!==session)return;
  if(!addPendingAttributePoint(key,player,progress)){stopAttributeHold(false);return;}
  session.ticks++;
 },ATTRIBUTE_HOLD_INTERVAL_MS);
 button.addEventListener("pointerup",()=>{if(attributeHoldSession===session)stopAttributeHold(true);},{once:true});
 button.addEventListener("pointercancel",()=>{if(attributeHoldSession===session)stopAttributeHold(false);},{once:true});
 button.addEventListener("lostpointercapture",()=>{if(attributeHoldSession===session)stopAttributeHold(false);},{once:true});
}
function showCareerAttributes(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const progress=progressionState(p),pending=pendingUpgradeCount(),previewPlayer={...p,attributes:Object.assign({},p.attributes||{})};Object.entries(pendingAttributeUpgrades).forEach(([key,value])=>previewPlayer.attributes[key]=clamp((Number(previewPlayer.attributes[key])||0)+(Number(value)||0),0,99));const previewOverall=careerOverall(previewPlayer),sections=CAREER_ATTRIBUTE_SECTIONS.map(section=>{
  const items=section.keys.map(key=>{
   const existing=attrs.find(pair=>pair[0]===key);if(!existing)return "";
   const current=clamp(Number(p.attributes[key])||0,0,99),cap=attributeUpgradeCap(p,key),planned=clamp(Number(pendingAttributeUpgrades[key])||0,0,cap-current),preview=current+planned;
   const fill=(current/99*100).toFixed(3),capAt=(cap/99*100).toFixed(3),previewWidth=(planned/99*100).toFixed(3);
   const canAdd=progress.points>pending&&preview<cap,canRemove=planned>0;
   const arrowControls=progress.points>0?'<div><button type="button" class="mc-attribute-arrow" data-remove-upgrade="'+key+'" '+(!canRemove?"disabled":"")+' aria-label="Retirer le point de '+escHtml(existing[1])+'">←</button><button type="button" class="mc-attribute-arrow" data-add-upgrade="'+key+'" '+(!canAdd?"disabled":"")+' aria-label="Améliorer '+escHtml(existing[1])+'">→</button></div>':"";
   return '<article class="mc-attribute-row" data-attribute-row="'+key+'"><div class="mc-attribute-heading"><span class="mc-attribute-name">'+escHtml(existing[1])+'</span><span class="mc-attribute-current">'+current+'</span><span class="mc-attribute-preview-level">'+(planned>0?"→ "+preview:"")+'</span><span class="mc-attribute-max">'+cap+' MAX</span></div><div class="mc-attribute-track"><span class="mc-attribute-fill" style="width:'+fill+'%"></span><span class="mc-attribute-preview" style="left:'+fill+'%;width:'+previewWidth+'%"></span><span class="mc-attribute-locked" style="left:'+capAt+'%"></span><span class="mc-attribute-cap-marker" style="left:'+capAt+'%"></span></div><div class="mc-attribute-controls"><span>'+current+' / 99</span>'+arrowControls+'</div></article>';
  }).join("");
  return '<section class="mc-attribute-panel mc-panel-'+section.tone+'"><header><span class="mc-attribute-panel-dot"></span><h3>'+section.title+'</h3></header><div class="mc-attribute-list">'+items+'</div></section>';
 }).join("");
 const ratio=Math.min(100,(progress.xp/progress.required)*100),remaining=Math.max(0,progress.required-progress.xp);
 render(header("MES ATTRIBUTS","Spécialité · "+(p.myCareerProfile.specialty||"MyCareer"))+
  '<div class="mc-card mc-xp-card"><div class="mc-xp-heading"><div><div class="mc-kicker">PROGRESSION DU JOUEUR</div><h2>'+progress.xp+' / '+progress.required+' EXP</h2></div><div class="mc-xp-points"><strong>'+progress.points+'</strong><span>POINTS DISPONIBLES</span></div></div><div class="mc-xp-track"><span style="width:'+ratio.toFixed(2)+'%"></span></div><p class="mc-muted">Encore '+remaining+' EXP pour gagner un point d’attribut · '+progress.totalXp+' EXP gagnée(s) au total.</p><p class="mc-status">'+(progress.lastAward?'Dernier match : +'+progress.lastAward+' EXP.':'Tes performances en match déterminent ton EXP.')+'</p></div>'+
  '<div class="mc-card mc-overall-card"><div class="mc-grid"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN actuel</span></div><div class="mc-metric"><strong>'+previewOverall+'</strong><span>GÉN après améliorations</span></div></div><p class="mc-muted">Les barres jaunes montrent ton niveau. Les zones gris foncé sont au-delà de ton plafond de spécialité. Les flèches préparent les améliorations avant achat.</p></div>'+
  '<div class="mc-attribute-panels">'+sections+'</div>'+
  '<div class="mc-attribute-purchase"><div><strong id="mcSelectedPoints">'+pending+' / '+progress.points+'</strong><span>Points sélectionnés</span></div><button class="mc-btn primary" id="mcBuyAttributes" '+(pending===0||pending>progress.points?"disabled":"")+'>Acheter les améliorations</button><button class="mc-btn secondary" id="mcClearAttributes" '+(pending===0?"disabled":"")+'>Annuler</button></div>'+
  '<div class="mc-actions"><button class="mc-btn secondary" id="mcBackDashboard">Retour à ma carrière</button></div>');
 attachReturn();
 root.querySelectorAll("[data-add-upgrade]").forEach(button=>{
  const key=button.dataset.addUpgrade;
  button.addEventListener("pointerdown",event=>startAttributeHold(button,key,p,progress,event));
  button.addEventListener("click",event=>{if(event.detail===0){event.preventDefault();addPendingAttributePoint(key,p,progress);}});
 });
 root.querySelectorAll("[data-remove-upgrade]").forEach(button=>button.onclick=()=>{
  const key=button.dataset.removeUpgrade,planned=Number(pendingAttributeUpgrades[key])||0;
  if(planned>0){if(planned===1)delete pendingAttributeUpgrades[key];else pendingAttributeUpgrades[key]=planned-1;refreshAttributeUpgradeUI(p,progress);}
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
function syncCareerTeamFromPlayer(player){
 if(!player||!player.team||String(player.team)===String(career.teamCode))return;
 const oldCode=career.teamCode,oldMeta=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(t=>String(t[0])===String(oldCode)),newMeta=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(t=>String(t[0])===String(player.team));
 career.teamCode=String(player.team);career.teamName=newMeta?newMeta[1]:String(player.team);
 career.tradeNotice={from:oldMeta?oldMeta[1]:String(oldCode||"ancienne équipe"),fromCode:oldCode,to:career.teamName,toCode:career.teamCode,season:seasonName(seasonYear)};
 career.tradeHistory=Array.isArray(career.tradeHistory)?career.tradeHistory:[];
 career.tradeHistory.push(Object.assign({},career.tradeNotice));saveCareer();
}
function careerLeagueGamesThrough(targetGameId){
 if(typeof seasonCalendar==="undefined"||!seasonCalendar||!Array.isArray(seasonCalendar.games))return [];
 const ordered=seasonCalendar.games.map((game,index)=>({game,index})).sort((a,b)=>(Number(a.game.round)||0)-(Number(b.game.round)||0)||a.index-b.index);
 const limit=targetGameId==null||targetGameId===""?ordered.length-1:ordered.findIndex(item=>String(item.game.id)===String(targetGameId));
 return limit<0?[]:ordered.slice(0,limit+1).map(item=>item.game);
}
function nextCareerLeagueGame(targetGameId){
 return careerLeagueGamesThrough(targetGameId).find(game=>game.status!=="completed")||null;
}
function renderCareerSimulationProgress(targetGameId){
 const games=careerLeagueGamesThrough(targetGameId),target=targetGameId&&games.find(game=>String(game.id)===String(targetGameId));
 render(header("SIMULATION EN COURS",target?"Simulation de la ligue jusqu’au match sélectionné.":"Simulation progressive de la saison régulière.")+
  '<div class="mc-card mc-sim-progress-card"><div class="mc-kicker">MATCHS DE LA LIGUE · UN À LA FOIS</div><h2 id="mcSimulationMatchup">Préparation de la simulation…</h2><p class="mc-muted" id="mcSimulationScore">Chaque rencontre est simulée séparément dans l’ordre du calendrier.</p><div class="mc-meter"><span id="mcSimulationProgressBar" style="width:0%"></span></div><p class="mc-status" id="mcSimulationCounter">0 / '+games.length+' matchs</p><div class="mc-actions"><button class="mc-btn secondary" id="mcStopSimulation">Arrêter la simulation</button></div></div>');
 attachReturn();
 $("mcStopSimulation").onclick=()=>{
  career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();
 };
}
function updateCareerSimulationProgress(game,targetGameId){
 const games=careerLeagueGamesThrough(targetGameId),completed=games.filter(item=>item.status==="completed").length,total=games.length;
 const matchup=$("mcSimulationMatchup"),score=$("mcSimulationScore"),counter=$("mcSimulationCounter"),bar=$("mcSimulationProgressBar");
 if(matchup)matchup.textContent=(game.home.name||game.home.code)+" vs "+(game.away.name||game.away.code);
 if(score)score.textContent=Number(game.homeScore)+" – "+Number(game.awayScore)+" · "+(game.homeScore>game.awayScore?game.home.code:game.away.code)+" gagne";
 if(counter)counter.textContent=completed+" / "+total+" matchs simulés";
 if(bar)bar.style.width=(total?completed/total*100:100).toFixed(1)+"%";
}
function finishCareerPlayerGame(target){
 const p=playerForCareer();if(!p)return {ok:false};
 const currentRound=Number(target.round)||0,home=target.home.code===career.teamCode,teamScore=home?target.homeScore:target.awayScore,oppScore=home?target.awayScore:target.homeScore,won=Number(teamScore)>Number(oppScore);
 career.lastRoundPlayed=currentRound;career.gamesPlayed++;
 if(won){career.wins++;career.lossStreak=0;}else{career.losses++;career.lossStreak=(career.lossStreak||0)+1;}
 const box=target.playerBoxScores||{},side=home?box.home:box.away,line=side&&side[String(p.id)]||{};
 ["pts","reb","ast","stl","blk","tov","minutes"].forEach(key=>career.seasonStats[key]=(Number(career.seasonStats[key])||0)+(Number(line[key])||0));
 if(Number(line.gp)>0)career.seasonStats.gp=(Number(career.seasonStats.gp)||0)+1;
 const xpEarned=awardCareerXP(line,won),points=Number(line.pts)||0,assists=Number(line.ast)||0;
 career.lastGame={gameId:target.id,teamCode:career.teamCode,opponentCode:home?target.away.code:target.home.code,teamScore:Number(teamScore)||0,opponentScore:Number(oppScore)||0,result:won?"Victoire":"Défaite",line:(points)+" PTS · "+(Number(line.reb)||0)+" REB · "+assists+" AST · "+(Number(line.minutes)||0)+" MIN",xpEarned,boxScore:captureCareerBoxScore(target)};
 career.lastGame.gameNumber=career.gamesPlayed;
 if(career.autoSeasonSimulation){
  career.autoBatchBoxScores=Array.isArray(career.autoBatchBoxScores)?career.autoBatchBoxScores:[];
  career.autoBatchBoxScores.push(JSON.parse(JSON.stringify(career.lastGame)));
  career.autoBatchBoxScores=career.autoBatchBoxScores.slice(-5);
  career.autoBatchBoxIndex=career.autoBatchBoxScores.length-1;
 }
 p.careerGames=p.careerGames||[];p.careerGames.push({season:seasonName(seasonYear),gameId:target.id,teamScore:teamScore,opponentScore:oppScore,...line,xpEarned});
 const gp=Math.max(1,Number(career.seasonStats.gp)||0);
 p.pts=career.seasonStats.pts/gp;p.reb=career.seasonStats.reb/gp;p.ast=career.seasonStats.ast/gp;p.mpg=career.seasonStats.minutes/gp;
 if(career.lossStreak>=4&&!career.generatedRival)createNewRival(p);
 if(!allPlayers().some(player=>String(player.id)===String(p.id))&&typeof retired!=="undefined"&&retired.some(player=>String(player.id)===String(p.id))){
  career.retired=true;career.retirementReason="Blessure très grave mettant fin à la carrière.";saveCareer();return {ok:false,retired:true,playerGame:true};
 }
 career.fatigue=clamp((Number(career.fatigue)||0)+Math.max(0,(Number(line.minutes)||0)-28)*.35-1.5,0,100);
 const currentMonth=careerMonthForScheduledGame(target,career.teamCode);career.lastPlayedMonth=currentMonth;
 const upcomingPlayerGame=nextPlayerGame(),monthEnded=!upcomingPlayerGame||careerMonthForScheduledGame(upcomingPlayerGame,career.teamCode)!==currentMonth;
 career.pendingStory=monthEnded&&career.lastStoryMonth!==currentMonth;
 if(career.pendingStory){career.pendingStoryMonth=currentMonth;career.lastStoryMonth=currentMonth;}
 saveCareer();
 return {ok:true,storyDue:career.pendingStory,xpEarned,playerGame:true};
}
function simulateCareerScheduledGame(game){
 const p=playerForCareer();if(!p||!game)return {ok:false};
 const isPlayerGame=game.home.code===career.teamCode||game.away.code===career.teamCode;
 if(isPlayerGame){
  const fatiguePenalty=clamp(Number(career.fatigue)||0,0,100);
  p.myCareerMoodModifiers={consistency:(Number(career.emotions||50)-50)*.025-fatiguePenalty*.025,clutch:(Number(career.emotions||50)-50)*.04-fatiguePenalty*.02,playmaking:(Number(career.chemistry||50)-50)*.035,passing:(Number(career.chemistry||50)-50)*.035,basketballIQ:(Number(career.chemistry||50)-50)*.03,intangibles:(Number(career.popularity||50)-50)*.02,speed:-fatiguePenalty*.035,acceleration:-fatiguePenalty*.035,agility:-fatiguePenalty*.03,stamina:-fatiguePenalty*.05,shotIQ:-fatiguePenalty*.02};
 }
 let simulationResult=false,simulationError=null;
 window.NBASimMyCareerSimulationInProgress=true;
 try{simulationResult=window.simulateScheduledGame(game);}
 catch(error){simulationError=error;}
 finally{if(p.myCareerMoodModifiers)delete p.myCareerMoodModifiers;window.NBASimMyCareerSimulationInProgress=false;}
 if(simulationError||simulationResult===false&&game.status!=="completed")return {ok:false,error:simulationError||new Error("Le match "+game.id+" n'a pas pu être simulé.")};
 return isPlayerGame?finishCareerPlayerGame(game):{ok:true,playerGame:false};
}
function simulateNextMatch(){
 const p=playerForCareer();if(!p||career.retired)return {ok:false};
 if(career.pendingStory){renderStory();return {ok:false,storyDue:true};}
 syncCareerTeamFromPlayer(p);
 const target=nextPlayerGame();
 if(!target){
  if(career.gamesPlayed>=82){finishSeason();return {ok:false,finished:true};}
  renderDashboard();return {ok:false};
 }
 if(typeof window.simulateScheduledGame!=="function"){saveError="Le moteur de simulation par possessions n'est pas disponible.";renderDashboard();return {ok:false,error:saveError};}
 simulateCareerSeason({targetGameId:String(target.id)});
 return {ok:true,started:true,targetGameId:String(target.id)};
}
function simulateCareerSeason(options){
 if(!career||career.retired)return;
 const isResume=!!(options&&options.resume),requestedId=options&&options.targetGameId!=null?String(options.targetGameId):"";
 if(!isResume){
  career.autoSeasonSimulation=true;career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;
  career.autoSimulationTargetGameId=requestedId||null;
 }else career.autoSeasonSimulation=true;
 if(career.pendingStory){saveCareer();renderStory();return;}
 const targetId=career.autoSimulationTargetGameId==null?"":String(career.autoSimulationTargetGameId);
 const targetGame=targetId&&seasonCalendar&&seasonCalendar.games.find(game=>String(game.id)===targetId);
 if(targetId&&!targetGame){career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();return;}
 renderCareerSimulationProgress(targetId);
 const step=()=>{
  if(!career||career.retired){career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;return;}
  if(career.pendingStory){saveCareer();renderStory();return;}
  const requestedGame=targetId&&seasonCalendar&&seasonCalendar.games.find(game=>String(game.id)===targetId);
  if(requestedGame&&requestedGame.status==="completed"){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderLastBoxScore();return;
  }
  syncCareerTeamFromPlayer(playerForCareer());
  const nextGame=nextCareerLeagueGame(targetId);
  if(!nextGame){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();
   if(career.gamesPlayed>=82)renderLastBoxScore();else renderDashboard();
   return;
  }
  const result=simulateCareerScheduledGame(nextGame);
  if(!result||!result.ok){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();
   if(result&&result.retired)renderRetirement();else if(career.lastGame)renderLastBoxScore();else renderDashboard();
   return;
  }
  updateCareerSimulationProgress(nextGame,targetId);
  if(career.pendingStory){saveCareer();renderStory();return;}
  if(targetId&&String(nextGame.id)===targetId||!targetId&&seasonCalendar.games.every(game=>game.status==="completed")){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderLastBoxScore();return;
  }
  const progressGames=careerLeagueGamesThrough(targetId),completed=progressGames.filter(game=>game.status==="completed").length;
  if(completed%10===0||result.playerGame)saveCareer();
  setTimeout(step,20);
 };
 step();
}
function simulateCareerSeries(teamA,teamB,roundLabel,seriesIndex){
 const homePattern=[0,0,1,1,0,1,0];let winsA=0,winsB=0;
 for(let n=0;n<7&&winsA<4&&winsB<4;n++){
  const homeIsA=homePattern[n]===0,homeTeam=homeIsA?teamA:teamB,awayTeam=homeIsA?teamB:teamA;
  const game={id:"MC-PO-"+career.seasonNumber+"-"+roundLabel+"-"+seriesIndex+"-"+(n+1),round:n+1,home:{code:homeTeam.code,name:homeTeam.name},away:{code:awayTeam.code,name:awayTeam.name},status:"scheduled"};
  let simulationResult=false;window.NBASimMyCareerSimulationInProgress=true;
  try{simulationResult=typeof window.simulateScheduledGame==="function"?window.simulateScheduledGame(game):false;}
  finally{window.NBASimMyCareerSimulationInProgress=false;}
  if(simulationResult===false||game.status!=="completed")break;
  recordCareerPlayoffLeagueStats(game,roundLabel);
  const winnerCode=Number(game.homeScore)>Number(game.awayScore)?game.home.code:game.away.code;
  if(winnerCode===teamA.code)winsA++;else winsB++;
  const player=playerForCareer();
  if(player&&(game.home.code===career.teamCode||game.away.code===career.teamCode)){
   const home=game.home.code===career.teamCode,side=home?game.playerBoxScores&&game.playerBoxScores.home:game.playerBoxScores&&game.playerBoxScores.away;
   const line=side&&side[String(player.id)]||null;
   if(line){
    career.postseasonStats=career.postseasonStats||{gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0};
    ["pts","reb","ast","stl","blk","minutes"].forEach(key=>career.postseasonStats[key]=(Number(career.postseasonStats[key])||0)+(Number(line[key])||0));
    if(Number(line.gp)>0)career.postseasonStats.gp++;
    const xpEarned=awardCareerXP(line,winnerCode===career.teamCode);
    career.postseasonGames=career.postseasonGames||[];
    career.postseasonGames.push({id:game.id,round:roundLabel,teamScore:home?game.homeScore:game.awayScore,opponentScore:home?game.awayScore:game.homeScore,pts:line.pts,reb:line.reb,ast:line.ast,stl:line.stl,blk:line.blk,minutes:line.minutes,xpEarned});
   }
   if(!allPlayers().some(x=>String(x.id)===String(player.id))&&typeof retired!=="undefined"&&retired.some(x=>String(x.id)===String(player.id))){
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
 career.postseasonStats={gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0};career.postseasonGames=[];career.playoffLeagueStats={};career.finalsLeagueStats={};career.postseasonAwards=[];
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
  const finalsMvp=buildCareerFinalsMvp();if(finalsMvp)career.postseasonAwards.push(finalsMvp);
  if(champion)career.postseasonAwards.push({icon:"🏆",title:"Champion NBA",name:champion,team:champion,detail:"Vainqueur des Finales NBA"});
  if(finalsMvp&&String(finalsMvp.name)===String(playerForCareer()&&playerForCareer().name)){const player=playerForCareer();player.trophies=player.trophies||[];player.trophies.push({name:"MVP des Finales",season:seasonName(seasonYear)});}
  if(champion&&champion===career.teamName){
   career.championships=(career.championships||0)+1;
   const p=playerForCareer();if(p){p.trophies=p.trophies||[];p.trophies.push({name:"Champion NBA",season:seasonName(seasonYear)});}
  }
 }finally{
  if(typeof oldRender==="function"){window.renderAll=oldRender;oldRender();}
 }
}
function buildCareerSeasonAwards(){
 const actual=window.NBASimActualPlayerStats||{},self=playerForCareer(),records=allPlayers().filter(p=>p&&!p.retired&&!p.isRetired).map(player=>{
  let raw=actual[String(player.id)]||{},gp=Number(raw.gp)||0;
  if(String(player.id)===String(career.playerId)&&!gp){const own=career.seasonStats||{};raw={pts:own.pts,reb:own.reb,ast:own.ast,stl:own.stl,blk:own.blk,tov:own.tov,minutes:own.minutes,gp:own.gp};gp=Number(raw.gp)||0;}
  if(gp<=0)return null;
  const total=key=>Number(raw[key])||0,avg=key=>total(key)/gp,fgm=total("fgm"),fga=total("fga"),threes=total("threeMade"),threeAtt=total("threeAttempts"),ftm=total("ftm"),fta=total("fta"),points=total("pts");
  return {player,gp,pts:avg("pts"),reb:avg("reb"),ast:avg("ast"),stl:avg("stl"),blk:avg("blk"),mpg:avg("minutes"),fg:fga?fgm/fga:0,three:threeAtt?threes/threeAtt:0,ft:fta?ftm/fta:0,ts:(fga+fta*.44)>0?points/(2*(fga+fta*.44)):0};
 }).filter(Boolean);
 const eligible=records.filter(x=>x.gp>=Math.min(30,Math.max(1,career.gamesPlayed||30))),pool=eligible.length?eligible:records;
 const best=(list,score)=>list.reduce((winner,item)=>!winner||score(item)>score(winner)?item:winner,null);
 const detail=x=>x.pts.toFixed(1)+" PTS · "+x.reb.toFixed(1)+" REB · "+x.ast.toFixed(1)+" AST";
 const awards=[];
 const add=(icon,title,winner,description)=>{if(winner)awards.push({icon,title,name:winner.player.name,team:winner.player.team,detail:description||detail(winner)});};
 add("🏆","MVP",best(pool,x=>x.pts+x.reb*.55+x.ast*.9+x.stl+x.blk+(x.ts-.54)*45));
 add("🛡️","Défenseur de l’année",best(pool,x=>x.stl*3+x.blk*3+x.reb*.35+(Number(x.player.attributes&&x.player.attributes.defensiveIQ)||50)*.02),null);
 add("🌟","Recrue de l’année",best(pool.filter(x=>x.player.rookie),x=>x.pts+x.ast*.8+x.reb*.5));
 add("🪑","Sixième homme",best(pool.filter(x=>x.mpg<=27).length?pool.filter(x=>x.mpg<=27):pool,x=>x.pts+x.ast*.5+x.reb*.3));
 const improved=pool.filter(x=>Array.isArray(x.player.history)&&x.player.history.length).map(x=>{const old=x.player.history[x.player.history.length-1]||{};return {...x,improvement:x.pts-(Number(old.pts)||0)+(x.ast-(Number(old.ast)||0))*.5+(x.reb-(Number(old.reb)||0))*.25};});
 add("📈","Joueur le plus amélioré",best(improved,x=>x.improvement));
 add("🎯","Meilleur marqueur",best(pool,x=>x.pts));
 add("💪","Meilleur rebondeur",best(pool,x=>x.reb));
 add("🎩","Meilleur passeur",best(pool,x=>x.ast));
 return awards;
}
function careerTeamLabel(code){const team=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(t=>String(t[0])===String(code));if(team)return team[1];const custom=(typeof customTeams!=="undefined"?customTeams:[]).find(t=>String(t.code)===String(code));return custom?custom.name:String(code||"—");}
function careerBiggestTradesForSeason(){
 const year=Number(seasonYear),label=seasonName(year),history=Array.isArray(window.NBASimAITradeHistory)?window.NBASimAITradeHistory:[],trades=history.filter(t=>t&&t.accepted!==false&&(Number(t.season)===year||String(t.season)===String(label))).map(t=>Object.assign({},t));
 (career.tradeHistory||[]).filter(t=>t&&(Number(t.season)===year||String(t.season)===String(label))).forEach(t=>{
  if(trades.some(x=>String(x.from)===String(t.fromCode||t.from)&&String(x.to)===String(t.toCode||t.to)&&String(x.headlinePlayer||"")===String(career.player&&career.player.name||"")))return;
  const player=career.player||playerForCareer();trades.push({kind:"trade de carrière",from:t.fromCode||t.from,to:t.toCode||t.to,round:t.round||0,headlinePlayer:player&&player.name||"Ton joueur",headlineValue:Math.round(careerOverall(player)*2),outgoing:[{name:player&&player.name||"Ton joueur",ovr:careerOverall(player)}],incoming:[],accepted:true});
 });
 return trades.sort((a,b)=>(Number(b.headlineValue)||0)-(Number(a.headlineValue)||0)).slice(0,5);
}
function recordCareerPlayoffLeagueStats(game,roundLabel){
 if(!career||!game||!game.playerBoxScores)return;
 career.playoffLeagueStats=career.playoffLeagueStats||{};career.finalsLeagueStats=career.finalsLeagueStats||{};
 [["home",game.playerBoxScores.home],["away",game.playerBoxScores.away]].forEach(([side,lines])=>Object.entries(lines||{}).forEach(([id,line])=>{
  const player=findPlayer(id);if(!player)return;
  const addTo=(store)=>{const row=store[id]||(store[id]={id,name:player.name,team:player.team,gp:0,pts:0,reb:0,ast:0,stl:0,blk:0});if(Number(line.gp)>0)row.gp++;["pts","reb","ast","stl","blk"].forEach(key=>row[key]+=Number(line[key])||0);};
  addTo(career.playoffLeagueStats);if(String(roundLabel)==="Finale")addTo(career.finalsLeagueStats);
 }));
}
function buildCareerFinalsMvp(){
 const rows=Object.values(career.finalsLeagueStats||{}).filter(x=>x.gp>0).sort((a,b)=>(b.pts+b.reb*.5+b.ast*.8+b.stl+b.blk)-(a.pts+a.reb*.5+a.ast*.8+a.stl+a.blk));
 const winner=rows[0];if(!winner)return null;
 const player=findPlayer(winner.id);return {icon:"🏆",title:"MVP des Finales",name:winner.name,team:player?player.team:winner.team,detail:(winner.pts/winner.gp).toFixed(1)+" PTS · "+(winner.reb/winner.gp).toFixed(1)+" REB · "+(winner.ast/winner.gp).toFixed(1)+" AST"};
}
function finishSeason(){
 const p=playerForCareer();if(!p||career.seasonCompleted)return;career.lastSeasonAwards=buildCareerSeasonAwards();career.lastSeasonTrades=careerBiggestTradesForSeason();career.seasonCompleted=true;career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;
 try{simulateCareerPlayoffs();}catch(error){saveError="Simulation des playoffs : "+error.message;career.postseason=career.postseason||{qualified:false,champion:null,rounds:[]};}
 if(career.retired){saveCareer();renderRetirement();return;}
 if(!allPlayers().some(x=>String(x.id)===String(p.id))){career.retired=true;career.retirementReason="Carrière terminée à la suite d’une blessure.";saveCareer();renderRetirement();return;}
 if(typeof phase!=="undefined")phase="regular";
 const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||Number(career.gamesPlayed)||0),ppg=(Number(s.pts)||0)/gp,mpg=(Number(s.minutes)||0)/gp,ovr=careerOverall(p),expectedPpg=clamp(2+(ovr-40)*.24,2,16),poorScoring=ppg<Math.max(2.5,expectedPpg*.42),poorRole=mpg>=14,lowRating=ovr<=49,stagnant=careerOverall(p)-Number(career.seasonStartOverall||careerOverall(p))<=0;
 if((lowRating&&poorScoring&&poorRole)||(ovr<=55&&ppg<3.5&&mpg>=20)||(ovr<=60&&ppg<4&&mpg>=28&&stagnant)){career.retired=true;career.firedFromNBA=true;career.retirementReason="Tu as été viré de la NBA après une saison insuffisante : "+ppg.toFixed(1)+" PPG, "+ovr+" GÉN et "+mpg.toFixed(1)+" minutes par match. Tu dois recommencer une carrière.";saveCareer();renderRetirement();return;}
 const label=seasonName(seasonYear);
 const completedPostseasonStats=Object.assign({gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0},career.postseasonStats||{});
 career.lastPostseasonStats=completedPostseasonStats;career.lastPostseason=career.postseason||null;
 const entry={season:label,team:career.teamCode,height:p.height,overall:careerOverall(p),gp:Number(s.gp)||0,pts:(Number(s.pts)||0)/gp,reb:(Number(s.reb)||0)/gp,ast:(Number(s.ast)||0)/gp,stl:(Number(s.stl)||0)/gp,blk:(Number(s.blk)||0)/gp,playoffs:career.postseason,postseasonStats:completedPostseasonStats};
 p.history=p.history||[];p.history.push(entry);career.seasonHistory.push(entry);p.age=Number(p.age||19)+1;
 if(typeof window.progress==="function"&&p.age<40)window.progress(p);
 const startAttrs=career.seasonStartAttributes||{},gains=attrs.map(([key,label])=>({key,label,delta:(Number(p.attributes&&p.attributes[key])||0)-(Number(startAttrs[key])||0)})).filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta),startOverall=Number(career.seasonStartOverall)||Number(entry.overall)||careerOverall(p),endOverall=careerOverall(p),publicOpinion=Number(career.popularity)||0;
 career.lastSeasonAwards=[...(career.lastSeasonAwards||[]),...(career.postseasonAwards||[])];career.lastSeasonRecap={season:label,overallStart:startOverall,overallEnd:endOverall,overallDelta:endOverall-startOverall,topAttributeGains:gains.slice(0,6),publicOpinion,publicOpinionLabel:publicOpinion>=80?"Très positive":publicOpinion>=60?"Positive":publicOpinion>=40?"Mitigée":publicOpinion>=20?"Négative":"Très négative",tradeHistory:(career.tradeHistory||[]).filter(x=>x.season===label),biggestTrades:career.lastSeasonTrades||[],awards:career.lastSeasonAwards,stats:entry};
 entry.overall=endOverall;
 if(career.progression)career.progression.required=xpRequiredForNextPoint(careerOverall(p));
 p.rookie=false;p.season=seasonName(Number(seasonYear)+1);career.seasonCompleted=false;
 if(p.age>=40){career.retired=true;career.retirementReason="Retraite à 40 ans.";career.retiredAt=label;saveCareer();renderRetirement();return;}
 seasonYear=Number(seasonYear)+1;career.seasonNumber++;career.gamesPlayed=0;career.wins=0;career.losses=0;career.lossStreak=0;career.lastRoundPlayed=0;
 career.seasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0};career.postseasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0,gp:0};career.lastGame=null;career.storyInterval=0;career.pendingStory=false;career.pendingStoryMonth=null;career.lastStoryMonth="";career.lastPlayedMonth="";career.fatigue=0;career.seasonStartOverall=careerOverall(p);career.seasonStartAttributes=Object.assign({},p.attributes||{});
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();
 if(typeof phase!=="undefined")phase="regular";
 saveCareer();
 const recap=career.lastSeasonRecap||{},gainsMarkup=(recap.topAttributeGains||[]).map(x=>'<li>'+escHtml(x.label)+' : +'+x.delta+'</li>').join("")||'<li>Aucun attribut n’a progressé.</li>',tradeMarkup=(recap.tradeHistory||[]).map(x=>'<li>'+escHtml(careerTeamLabel(x.from))+' → '+escHtml(careerTeamLabel(x.to))+'</li>').join("")||'<li>Aucun changement d’équipe cette saison.</li>',awardMarkup=(recap.awards||[]).map(x=>'<article class="mc-season-award"><span>'+escHtml(x.icon||"🏆")+'</span><div><b>'+escHtml(x.title)+'</b><strong>'+escHtml(x.name)+'</strong><small>'+escHtml(careerTeamLabel(x.team))+' · '+escHtml(x.detail||"")+'</small></div></article>').join("")||'<p class="mc-muted">Aucune récompense calculable cette saison.</p>',biggestTradesMarkup=(recap.biggestTrades||[]).map((x,i)=>{const outgoing=(x.outgoing||[]).map(p=>escHtml(p.name)+" (GÉN "+Number(p.ovr||0)+")").join(", ")||escHtml(x.headlinePlayer||"—"),incoming=(x.incoming||[]).map(p=>escHtml(p.name)+" (GÉN "+Number(p.ovr||0)+")").join(", ")||"—";return '<tr><td>'+(i+1)+'</td><td>'+escHtml(careerTeamLabel(x.from))+' ↔ '+escHtml(careerTeamLabel(x.to))+'</td><td>'+outgoing+'</td><td>'+incoming+'</td><td>'+escHtml(x.headlinePlayer||"—")+' · '+Number(x.headlineValue||0)+'</td></tr>';}).join(""),rounds=career.lastPostseason&&career.lastPostseason.rounds||[],phaseNames=["Premier tour","Demi-finales","Finales de conférence","Finale NBA"],phaseMarkup=phaseNames.map(name=>{const rows=rounds.filter(x=>x.round===name);return '<section class="mc-card"><h3>'+name+'</h3>'+(rows.length?rows.map(x=>'<p class="mc-muted">'+escHtml(x.conference)+': '+escHtml(x.teamA)+' <b>'+x.winsA+'–'+x.winsB+'</b> '+escHtml(x.teamB)+' · Gagnant : '+escHtml(x.winner||"série incomplète")+'</p>').join(""):'<p class="mc-muted">Aucune série disputée dans cette phase.</p>')+'</section>';}).join(""),postseasonText=career.postseason&&career.postseason.qualified?"Qualifié en playoffs":"Non qualifié pour les playoffs";
 const championText=career.postseason&&career.postseason.champion?career.postseason.champion:"aucun champion déterminé";
 const playoffGames=career.lastPostseasonStats&&career.lastPostseasonStats.gp||0;
 const playoffPoints=career.lastPostseasonStats&&career.lastPostseasonStats.pts||0;
 render(header("FIN DE SAISON","Saison "+label+" terminée")+
  '<div class="mc-card"><div class="mc-kicker">BILAN DE TA SAISON</div><h2>'+label+'</h2>'+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+entry.overall+'</strong><span>GÉN final</span></div><div class="mc-metric"><strong>'+entry.pts.toFixed(1)+'</strong><span>PTS / match</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs joués</span></div></div>'+
  '<p class="mc-muted">'+postseasonText+'. Champion NBA : '+escHtml(championText)+'. Tes playoffs : '+playoffGames+' MJ · '+playoffPoints+' PTS.</p>'+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+recap.overallStart+' → '+recap.overallEnd+'</strong><span>Progression du général ('+(recap.overallDelta>=0?"+":"")+recap.overallDelta+')</span></div><div class="mc-metric"><strong>'+recap.publicOpinion+'/100</strong><span>Opinion publique · '+escHtml(recap.publicOpinionLabel||"Mitigée")+'</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs de saison régulière</span></div></div>'+
  '<div class="mc-card"><h3>🏆 Récompenses et trophées de la saison</h3><div class="mc-season-awards">'+awardMarkup+'</div></div>'+
  '<div class="mc-card"><h3>Les plus gros trades de la saison</h3>'+(biggestTradesMarkup?'<div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>#</th><th>Équipes</th><th>Joueurs envoyés</th><th>Joueurs reçus</th><th>Joueur vedette · valeur</th></tr></thead><tbody>'+biggestTradesMarkup+'</tbody></table></div>':'<p class="mc-muted">Aucun échange enregistré cette saison.</p>')+'<h3>Tes changements d’équipe</h3><ul>'+tradeMarkup+'</ul><h3>Attributs les plus améliorés</h3><ul>'+gainsMarkup+'</ul><p class="mc-muted">Statistiques saison régulière : '+entry.pts.toFixed(1)+' PTS · '+entry.reb.toFixed(1)+' REB · '+entry.ast.toFixed(1)+' AST · '+entry.stl.toFixed(1)+' STL · '+entry.blk.toFixed(1)+' BLK.</p></div>'+
  '<h2>Parcours complet des playoffs</h2>'+phaseMarkup+
  '<p class="mc-muted">Ton âge passe à '+p.age+' ans. Tes attributs évoluent selon ton développement, ton potentiel et ton âge.</p>'+
  '<div class="mc-actions"><button class="mc-btn primary" id="mcNextSeason">Préparer la prochaine saison →</button></div></div>');
 attachReturn();$("mcNextSeason").onclick=renderDashboard;
}
function renderRetirement(){
 career=career||{};career.retired=true;saveCareer();const p=playerForCareer()||career.player||{};
 render(header(career.firedFromNBA?"TU AS ÉTÉ VIRÉ DE LA NBA":"FIN DE CARRIÈRE",career.firedFromNBA?"Tes performances n’ont pas été suffisantes pour conserver ta place.":"Ton histoire NBA restera dans les archives.")+'<div class="mc-retirement"><div style="font-size:70px">'+(career.firedFromNBA?"🏀":"🏆")+'</div><div class="mc-kicker">'+(career.firedFromNBA?"MYCAREER · FIN DE CONTRAT":"MYCAREER · HALL OF FAME")+'</div><h2 class="mc-title" style="font-size:clamp(28px,4vw,46px)">'+escHtml(p.name||"Ta carrière")+'</h2><p class="mc-muted">'+(career.retirementReason||"Fin de carrière")+'</p><p class="mc-muted">Saisons terminées : '+(career.seasonHistory||[]).length+' · Dernière équipe : '+(career.teamCode||"—")+'</p><div class="mc-actions" style="justify-content:center"><button class="mc-btn primary" id="mcCareerHome">'+(career.firedFromNBA?"Recommencer une carrière":"Retour à MyCareer")+'</button><button class="mc-btn secondary" id="mcTitle">Écran de départ</button></div></div>');
 attachReturn();$("mcCareerHome").onclick=career.firedFromNBA?showPicker:openCareerHome;$("mcTitle").onclick=showPicker;
}
function returnToStart(){if(activeMode==="gm"&&typeof window.NBASimCaptureMyGMState==="function"){try{mygmSnapshot=window.NBASimCaptureMyGMState();saveGMStored(mygmSnapshot);}catch(error){saveError="Sauvegarde de la session MyGM impossible : "+error.message;}}if(activeMode==="career"&&career)saveCareer();activeMode="launcher";root.hidden=true;showPicker();}
function installMenuReturn(){
 const shell=document.querySelector(".mynba-menu-shell");if(!shell||$("mcMenuReturn"))return;
 const button=document.createElement("button");button.type="button";button.id="mcMenuReturn";button.className="mc-btn secondary";button.textContent="↩ Retour à l’écran de départ";button.style.margin="12px 0";button.onclick=returnToStart;
 const footer=shell.querySelector(".mynba-menu-footer");if(footer)footer.appendChild(button);else shell.appendChild(button);
}
function installMyCareerIsolation(){
 if(typeof window.simulateScheduledGame==="function"&&!window.simulateScheduledGame.__myCareerModeGuard){
  const original=window.simulateScheduledGame;
  const guarded=function(game){
   if(activeMode!=="gm"&&window.NBASimMyCareerSimulationInProgress!==true)return false;
   return original.apply(this,arguments);
  };
  guarded.__myCareerModeGuard=true;window.simulateScheduledGame=guarded;
 }
 if(!document.documentElement.dataset.myCareerClickGuard){
  document.documentElement.dataset.myCareerClickGuard="1";
  document.addEventListener("click",event=>{
   if(activeMode!=="career"||root.contains(event.target))return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  },true);
 }
 window.NBASimIsMyCareerActive=()=>activeMode==="career";
}
function install(){
 installMyCareerIsolation();installCareerOverall();mygmSnapshot=loadGMStored();if(typeof window.NBASimCaptureMyGMState==="function"){try{launcherSnapshot=window.NBASimCaptureMyGMState();}catch(_){launcherSnapshot=null;}}const gm=$("myGMStart");if(gm)gm.hidden=true;showPicker();installMenuReturn();
 const observer=new MutationObserver(()=>installMenuReturn());observer.observe(document.body,{childList:true,subtree:true});
 window.NBASimMyCareerNextLeagueGame=nextCareerLeagueGame;window.NBASimMyCareerSave=saveCareer;window.NBASimMyCareerState=()=>career;window.NBASimMyCareerHoldIntervalMs=ATTRIBUTE_HOLD_INTERVAL_MS;window.NBASimMyCareerXPRequired=xpRequiredForNextPoint;window.NBASimMyCareerXPFromStats=careerXPFromStats;window.NBASimReturnToModePicker=function(){activeMode="launcher";root.hidden=true;showPicker();};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();