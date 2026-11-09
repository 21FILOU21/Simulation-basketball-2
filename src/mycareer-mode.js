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
style.textContent += ".mc-playoff-bracket{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:10px;align-items:start}.mc-playoff-round{margin:0;padding:12px}.mc-playoff-series{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;padding:10px;margin:7px 0;background:#101e30;border:1px solid #405777;border-radius:9px;color:#f4f7ff;cursor:pointer}.mc-playoff-series:hover{border-color:#f2d76c}.mc-playoff-series b{font-size:13px}.mc-playoff-series b span{color:#f2d76c}.mc-playoff-series small,.mc-playoff-series em{font-size:10px;color:#aebdd5;font-style:normal}.mc-playoff-detail{font-size:11px;min-height:35px}@media(max-width:900px){.mc-playoff-bracket{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.mc-playoff-bracket{grid-template-columns:1fr}}";
style.textContent += ".mc-sim-progress-card .mc-calendar-game{display:flex;flex-direction:column;gap:7px;border:1px solid #405777;background:#10213a;color:#fff}.mc-sim-progress-card .mc-calendar-game.is-win{border-color:#36bd7c;background:#123324}.mc-sim-progress-card .mc-calendar-game.is-loss{border-color:#ef4444;background:#35191e}.mc-sim-progress-card .mc-calendar-game b{font-size:20px}.mc-sim-progress-card .mc-calendar-game span{font-size:12px;color:#cbd5e1}";
style.textContent += ".mc-story-outcome{display:flex;gap:6px 10px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid #ffffff1c;font-size:11px}.mc-story-gain{color:#86efac}.mc-story-loss{color:#fca5a5}.mc-story-cap{color:#fcd34d}.mc-story-fatigue{color:#fb923c}.mc-story-recovery{color:#67e8f9}.mc-story-outcome small{opacity:.78}";
style.textContent += "\n.mc-sim-progress-card{max-width:760px;margin:clamp(28px,8vh,90px) auto;text-align:center}.mc-sim-progress-card h2{font-size:clamp(22px,4vw,34px);margin:14px 0}.mc-sim-progress-card .mc-meter{height:12px;margin:24px 0 10px}.mc-sim-progress-card .mc-meter span{transition:width .12s ease}\n";
style.textContent += "\n.mc-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.mc-calendar-month{margin:18px 0}.mc-calendar-month h3{color:#f5d76b}.mc-calendar-game{display:flex;flex-direction:column;gap:3px;padding:8px 5px;border-radius:7px;text-align:center;min-width:0;width:100%;min-height:82px;color:#f4f7ff;font:inherit;background:#1b293d;border:1px solid #43536b;cursor:pointer}.mc-calendar-game:hover,.mc-calendar-game:focus-visible{outline:2px solid #f5d76b;outline-offset:2px;filter:brightness(1.2)}.mc-calendar-game small{font-size:8px;color:#aab8ce}.mc-calendar-game b{font-size:13px}.mc-calendar-game span{font-size:11px}.mc-calendar-game em{font-size:9px;color:#bac6d8;font-style:normal;margin-top:auto}.mc-calendar-game.is-win{border-color:#258c56;background:#173425}.mc-calendar-game.is-loss{border-color:#b33942;background:#3a1e25}.mc-calendar-game.is-pending{opacity:.9}@media(max-width:700px){.mc-calendar-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}";
style.textContent += "\n.mc-my-team-player{background:#253344}.mc-my-team-player td:first-child{color:#f5d45d}.mc-my-team-player small{display:block;color:#f5d45d;font-size:9px;letter-spacing:.1em}\n.mc-team-injury{color:#f28c8c;font-weight:800}.mc-team-healthy{color:#7be0ad;font-weight:800}\n.mc-box-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0;color:#aebbd0;font-size:12px}.mc-box-nav button:disabled{opacity:.3}\n";
style.textContent += "\n.mc-xp-card{border-color:#8f7936;background:linear-gradient(145deg,#292719,#111b2b)}\n.mc-xp-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.mc-xp-heading h2{margin:5px 0;font-size:clamp(19px,2.5vw,27px)}\n.mc-xp-points{text-align:right}.mc-xp-points strong{display:block;color:#f4d257;font-size:30px}.mc-xp-points span{font-size:10px;color:#b8c1d2;letter-spacing:.08em}\n.mc-xp-track{height:14px;margin:13px 0 8px;border-radius:20px;background:#202632;overflow:hidden;border:1px solid #4c5159}.mc-xp-track span{display:block;height:100%;background:repeating-linear-gradient(135deg,#f1d04f 0,#f1d04f 7px,#d8b33a 7px,#d8b33a 11px);border-radius:20px;transition:width .2s}\n.mc-attribute-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding-bottom:105px}\n.mc-attribute-panel{padding:16px;border:1px solid #334154;border-radius:14px;min-width:0;background:#142033}\n.mc-attribute-panel header{display:flex;align-items:center;gap:9px;margin-bottom:14px}.mc-attribute-panel header h3{font-size:14px;letter-spacing:.09em;margin:0}\n.mc-attribute-panel-dot{height:9px;width:9px;border-radius:50%;background:#e6c54e}\n.mc-panel-finish{background:linear-gradient(145deg,#192538,#111a28);border-color:#354e71}.mc-panel-shoot{background:linear-gradient(145deg,#142b25,#0e1e1b);border-color:#2f6550}.mc-panel-shoot .mc-attribute-panel-dot{background:#43d28d}\n.mc-panel-play{background:linear-gradient(145deg,#30291a,#211d16);border-color:#6b5934}.mc-panel-play .mc-attribute-panel-dot{background:#e3b84a}\n.mc-panel-defense{background:linear-gradient(145deg,#301e24,#20151a);border-color:#6b3844}.mc-panel-defense .mc-attribute-panel-dot{background:#e56a77}\n.mc-panel-physical{background:linear-gradient(145deg,#242338,#171625);border-color:#4f486d}.mc-panel-physical .mc-attribute-panel-dot{background:#a99be8}\n.mc-panel-mental{background:linear-gradient(145deg,#192b35,#101d25);border-color:#355b68}.mc-panel-mental .mc-attribute-panel-dot{background:#6bc4d8}\n.mc-attribute-list{display:flex;flex-direction:column;gap:15px}.mc-attribute-row{padding:7px 0 9px;border-bottom:1px solid #ffffff12;min-width:0}.mc-attribute-row:last-child{border-bottom:0}\n.mc-attribute-heading{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:baseline;gap:9px;margin-bottom:7px}\n.mc-attribute-name{font-size:12px;color:#d2d9e4;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mc-attribute-current{color:#f5d04f;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums}.mc-attribute-preview-level{color:#aeb5c0;font-size:11px;font-weight:800}.mc-attribute-max{font-size:10px;color:#9299a4;font-weight:800;white-space:nowrap}\n.mc-attribute-track{height:17px;background:#333a43;border:1px solid #4a515b;border-radius:4px;overflow:hidden;position:relative}\n.mc-attribute-fill{position:absolute;inset:0 auto 0 0;background:repeating-linear-gradient(135deg,#f2d04d 0,#f2d04d 6px,#d9b63d 6px,#d9b63d 10px);z-index:1}\n.mc-attribute-preview{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,#b8bdc7 0,#b8bdc7 5px,#858d99 5px,#858d99 9px);z-index:2;opacity:.95}\n.mc-attribute-locked{position:absolute;top:0;bottom:0;right:0;background:#171b22;z-index:3}.mc-attribute-cap-marker{position:absolute;top:-2px;bottom:-2px;width:2px;background:#8d929c;z-index:4;transform:translateX(-1px)}\n.mc-attribute-controls{display:flex;justify-content:space-between;align-items:center;margin-top:5px;color:#929baa;font-size:10px}.mc-attribute-controls>div{display:flex;gap:5px}\n.mc-attribute-arrow{min-width:27px;height:24px;border:1px solid #5f6570;border-radius:5px;background:#333943;color:#f3d25a;font-weight:900;cursor:pointer}.mc-attribute-arrow:disabled{opacity:.22;cursor:not-allowed}\n.mc-attribute-purchase{position:sticky;bottom:8px;z-index:5;display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 14px;margin-top:-88px;background:#0b1424ed;border:1px solid #52617a;border-radius:12px;box-shadow:0 12px 32px #0008;backdrop-filter:blur(10px)}\n.mc-attribute-purchase>div{margin-right:auto}.mc-attribute-purchase strong{display:block;color:#f4d257;font-size:20px}.mc-attribute-purchase span{font-size:10px;color:#aebbd0}\n.mc-story-prompt{margin:15px 0 0;color:#f3d45c;font-weight:800}\n.mc-box-summary{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;text-align:center}.mc-box-summary>div{display:flex;flex-direction:column;gap:5px}.mc-box-summary span{font-size:12px;color:#b4c4dd;letter-spacing:.12em}.mc-box-summary strong{font-size:clamp(32px,6vw,58px);color:#f5d45d}.mc-box-summary>b{font-size:12px;color:#a8b5c9}\n.mc-box-team{margin:15px 0;padding:16px;border:1px solid #344c6c;border-radius:13px;background:#0e1a2b}.mc-box-team-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.mc-box-team-head h2{margin:4px 0 0}.mc-box-team-head>strong{font-size:32px;color:#f3d45c}\n.mc-table-wrap{width:100%;overflow-x:auto}.mc-box-table{width:100%;border-collapse:collapse;font-size:11px;white-space:nowrap;font-variant-numeric:tabular-nums}\n.mc-box-table th,.mc-box-table td{padding:8px 9px;text-align:right;border-bottom:1px solid #ffffff14}.mc-box-table th:first-child,.mc-box-table td:first-child{text-align:left;min-width:145px}\n.mc-box-table th{font-size:10px;color:#aebbd0;letter-spacing:.07em}.mc-box-table td:first-child small{display:block;color:#8696ae;font-size:9px}.mc-box-total{font-weight:900;color:#f5d45d;background:#202c3b}\n@media(max-width:820px){.mc-attribute-panels{grid-template-columns:1fr}.mc-attribute-purchase{flex-wrap:wrap}.mc-attribute-purchase .mc-btn{flex:1}.mc-box-table{font-size:10px}.mc-box-table th,.mc-box-table td{padding:7px 6px}}\n@media(max-width:480px){.mc-attribute-heading{gap:6px}.mc-attribute-name{font-size:11px}.mc-xp-heading{align-items:flex-start}.mc-box-team{padding:9px}.mc-attribute-purchase{bottom:4px;padding:8px}.mc-attribute-purchase .mc-btn{font-size:12px;padding:10px}}\n";
style.textContent += "\n.mc-story-outcome{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid #344b68}.mc-story-gain,.mc-story-loss,.mc-story-cap,.mc-story-fatigue,.mc-story-recovery,.mc-story-social-gain,.mc-story-risk{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border-radius:6px;font-size:11px;font-weight:800;background:#172b43}.mc-story-gain,.mc-story-social-gain{color:#75e0a7}.mc-story-loss{color:#ff9a9a;background:#3a2029}.mc-story-cap{color:#f2d76c}.mc-story-fatigue,.mc-story-risk{color:#ffad67;background:#3a2920}.mc-story-recovery{color:#77dfb1;background:#183429}.mc-save-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.mc-save-slot{min-width:0;padding:15px;border:1px solid #405777;border-radius:12px;background:linear-gradient(145deg,#14243b,#0b1627)}.mc-save-slot-head{display:flex;justify-content:space-between;gap:8px;color:#9db0ca;font-size:10px;font-weight:900;letter-spacing:.12em}.mc-save-slot-head b{color:#f2d76c}.mc-save-slot h3{margin:12px 0 4px}.mc-save-updated{margin:0 0 10px;color:#91a5c0;font-size:11px}.mc-save-summary,.mc-save-season{display:flex;flex-direction:column;gap:5px;margin:9px 0;padding:10px;border-radius:8px;background:#091626}.mc-save-summary>strong{font-size:17px}.mc-save-summary>span{font-size:12px;color:#b9c8dc}.mc-save-season>p{margin:4px 0;font-size:11px}.mc-save-player-stats{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.mc-save-stat{padding:4px 6px;border-radius:5px;background:#1a2c43;color:#dce6f4;font-size:10px}.mc-save-stat b{color:#f2d76c;margin-right:3px}.mc-save-roster{margin-top:11px;border-top:1px solid #354c6b;padding-top:9px}.mc-save-roster>summary,.mc-save-player>summary{cursor:pointer;font-size:12px;font-weight:800;color:#f2d76c}.mc-save-player{padding:7px 0;border-bottom:1px solid #293e5b}.mc-save-player>summary{color:#e2eaf6}.mc-save-attributes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:8px}.mc-save-attribute{display:flex;justify-content:space-between;gap:4px;padding:4px 5px;border-radius:4px;background:#0b1729;color:#aebdd5;font-size:10px}.mc-save-attribute b{color:#f2d76c}.mc-save-injury{color:#ffad67;font-size:11px}.mc-field{margin-top:12px}.mc-field input{margin-top:5px}.mc-save-player{margin-left:8px}.mc-save-player-stats{margin-bottom:7px}@media(max-width:760px){.mc-save-grid{grid-template-columns:1fr}.mc-save-attributes{grid-template-columns:repeat(2,minmax(0,1fr))}}";
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
function buildCareerSaveData(){
 const calendar=typeof seasonCalendar!=="undefined"&&seasonCalendar?{seasonType:seasonCalendar.seasonType,gamesPerTeam:seasonCalendar.gamesPerTeam,teamCount:seasonCalendar.teamCount,totalGames:seasonCalendar.totalGames,stages:seasonCalendar.stages,teams:seasonCalendar.teams,season:seasonCalendar.season,games:(seasonCalendar.games||[]).map(game=>{const saved=Object.assign({},game);delete saved.playerBoxScores;return saved;})}:null;
 return {career,draftPlayer,players:allPlayers(),seasonYear:typeof seasonYear!=="undefined"?seasonYear:2025,phase:typeof phase!=="undefined"?phase:"regular",seasonCalendar:calendar,seasonResults:typeof seasonResults!=="undefined"?seasonResults:[],retired:typeof retired!=="undefined"?retired:[],customTeams:typeof customTeams!=="undefined"?customTeams:[],nextCustomTeamId:typeof nextCustomTeamId!=="undefined"?nextCustomTeamId:1,actualPlayerStats:window.NBASimActualPlayerStats||{},actualBoxScores:window.NBASimActualBoxScores||{}};
}
function saveCareer(){
 if(!career)return;
 try{localStorage.setItem(KEY,JSON.stringify(buildCareerSaveData()));saveError="";}
 catch(error){saveError="Sauvegarde locale impossible : "+error.message;}
}

function careerSaveFileName(index){return "mycareer-slot-"+String(index+1).padStart(2,"0")+".json";}
function openCareerSaveHandleDb(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error("IndexedDB n’est pas disponible dans ce navigateur."));return;}
  const request=window.indexedDB.open(CAREER_SAVE_DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(CAREER_SAVE_STORE))request.result.createObjectStore(CAREER_SAVE_STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error("Impossible d’ouvrir le stockage des dossiers."));
 });
}
async function storeCareerSaveDirectory(handle){
 const db=await openCareerSaveHandleDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(CAREER_SAVE_STORE,"readwrite");
  tx.objectStore(CAREER_SAVE_STORE).put(handle,"directory");
  tx.oncomplete=()=>{db.close();resolve(true);};
  tx.onerror=()=>{const error=tx.error;db.close();reject(error||new Error("Impossible de mémoriser le dossier."));};
 });
}
async function readCareerSaveDirectory(){
 const db=await openCareerSaveHandleDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(CAREER_SAVE_STORE,"readonly");
  const request=tx.objectStore(CAREER_SAVE_STORE).get("directory");
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(request.error||new Error("Impossible de retrouver le dossier de sauvegarde."));
  tx.oncomplete=()=>db.close();
  tx.onerror=()=>{const error=tx.error;db.close();reject(error||new Error("Lecture du dossier impossible."));};
 });
}
async function careerSavePermission(handle,ask){
 if(!handle)return "denied";
 let permission=await handle.queryPermission({mode:"readwrite"});
 if(permission!=="granted"&&ask&&typeof handle.requestPermission==="function")permission=await handle.requestPermission({mode:"readwrite"});
 return permission;
}
async function scanCareerSaveSlots(){
 careerSaveSlots=Array(10).fill(null);
 if(!careerSaveDirectoryHandle||careerSaveDirectoryPermission!=="granted")return;
 for(let index=0;index<10;index++){
  try{
   const fileHandle=await careerSaveDirectoryHandle.getFileHandle(careerSaveFileName(index));
   const file=await fileHandle.getFile(),parsed=JSON.parse(await file.text());
   const data=parsed&&parsed.data&&parsed.data.career?parsed.data:parsed&&parsed.career?parsed:null;
   if(data)careerSaveSlots[index]={label:String(parsed.label||parsed.name||"Carrière "+(index+1)),updatedAt:parsed.updatedAt||file.lastModified||null,data};
  }catch(error){if(error&&error.name!=="NotFoundError")careerSaveSlots[index]={error:error.message||"Fichier illisible"};}
 }
}
function careerSaveOverall(player,savedCareer){
 const profile=player&&player.myCareerProfile;
 if(!profile||!Array.isArray(profile.core)||!profile.core.length)return typeof overallRating==="function"?overallRating(player):"—";
 const attributes=player.attributes||{},keys=profile.core.concat(["intangibles"]),weights=profile.core.map(()=>1).concat([.35]);
 let total=0,weight=0;const injury=player.injury,ratio=!injury?0:injury.stage==="returning"?clamp((Number(injury.recoveryGamesRemaining)||0)/Math.max(1,Number(injury.recoveryGamesTotal)||1),0,1):1;
 keys.forEach((key,index)=>{const penalty=injury&&injury.attributePenalties?Number(injury.attributePenalties[key])||0:0;total+=(clamp(Number(attributes[key])||0,0,100)-penalty*ratio)*weights[index];weight+=weights[index];});
 const mood=(Number(savedCareer.emotions||50)-50)*.025+(Number(savedCareer.chemistry||50)-50)*.025+(Number(savedCareer.popularity||50)-50)*.01;
 return Math.round(clamp(total/Math.max(.01,weight)+mood,40,99));
}
function careerSavePlayerCard(player,isCareerPlayer,savedCareer){
 const statKeys=[["PTS",player.pts],["REB",player.reb],["AST",player.ast],["STL",player.stl],["BLK",player.blk],["TO",player.tov],["MIN",player.mpg],["FG%",player.fg],["3P%",player.three],["FT%",player.ft],["TS%",player.ts]];
 const statMarkup=statKeys.map(([label,value])=>'<span class="mc-save-stat"><b>'+label+'</b> '+(value==null||value===""?"—":label.endsWith("%")?(Number(value)*100).toFixed(1)+"%":Number(value).toFixed(1))+'</span>').join("");
 const attributeMarkup=attrs.map(([key,label])=>'<span class="mc-save-attribute">'+escHtml(label)+' <b>'+Math.round(Number(player.attributes&&player.attributes[key])||0)+'</b></span>').join("");
 const overall=isCareerPlayer?careerSaveOverall(player,savedCareer):(typeof overallRating==="function"?overallRating(player):"—");
 return '<details class="mc-save-player"><summary><b>'+escHtml(player.name||"Joueur")+'</b> · '+escHtml(player.pos||"—")+' · GÉN '+overall+' · '+Math.round(Number(player.age)||0)+' ans</summary><div class="mc-save-player-stats">'+statMarkup+'</div><div class="mc-save-attributes">'+attributeMarkup+'</div>'+(player.injury?'<p class="mc-save-injury">Blessure : '+escHtml(player.injury.label||player.injury.severity||"En cours")+'</p>':"")+'</details>';
}
function careerSaveSlotMarkup(slot,index){
 const number=String(index+1).padStart(2,"0");
 if(!slot)return '<article class="mc-save-slot"><div class="mc-save-slot-head"><span>EMPLACEMENT '+number+'</span><b>LIBRE</b></div><p class="mc-muted">Aucune sauvegarde dans cet emplacement.</p><button class="mc-btn primary" data-save-slot="'+index+'" '+(careerSaveDirectoryPermission==="granted"?"":"disabled")+'>Enregistrer ici</button></article>';
 if(slot.error)return '<article class="mc-save-slot"><div class="mc-save-slot-head"><span>EMPLACEMENT '+number+'</span><b>FICHIER ILLISIBLE</b></div><p class="mc-muted">'+escHtml(slot.error)+'</p><button class="mc-btn secondary" data-save-slot="'+index+'" '+(careerSaveDirectoryPermission==="granted"?"":"disabled")+'>Remplacer le fichier</button></article>';
 const data=slot.data||{},savedCareer=data.career||{},savedPlayers=Array.isArray(data.players)?data.players:[],player=savedPlayers.find(item=>String(item.id)===String(savedCareer.playerId))||savedCareer.player||{},teamCode=String(savedCareer.teamCode||player.team||""),teamRoster=savedPlayers.filter(item=>String(item.team)===teamCode&&!item.retired&&!item.isRetired).sort((a,b)=>(Number(b.mpg)||0)-(Number(a.mpg)||0)),stats=savedCareer.seasonStats||{},games=Number(stats.gp)||0,profile=player.myCareerProfile||{},build=profile.specialty||player.specialty||"Profil personnalisé",record=(Number(savedCareer.wins)||0)+"-"+(Number(savedCareer.losses)||0),seasonStats=[["PTS",stats.pts],["REB",stats.reb],["AST",stats.ast],["STL",stats.stl],["BLK",stats.blk],["MIN",stats.minutes]].map(([label,value])=>'<span class="mc-save-stat"><b>'+label+'</b> '+(value==null?"—":(games>0?(Number(value)||0)/games:0).toFixed(1))+'</span>').join("");
 const rosterMarkup=teamRoster.map(item=>careerSavePlayerCard(item,String(item.id)===String(savedCareer.playerId),savedCareer)).join("");
 const updated=slot.updatedAt?new Date(slot.updatedAt).toLocaleString():"Date inconnue";
 const playerName=String(player.name||"Joueur MyCareer"),teamName=String(savedCareer.teamName||teamCode||"Équipe inconnue"),ovr=careerSaveOverall(player,savedCareer);
 return '<article class="mc-save-slot mc-save-slot-filled"><div class="mc-save-slot-head"><span>EMPLACEMENT '+number+'</span><b>SAUVEGARDÉ</b></div><h3>'+escHtml(slot.label)+'</h3><p class="mc-save-updated">'+escHtml(updated)+'</p><div class="mc-save-summary"><strong>'+escHtml(playerName)+'</strong><span>'+escHtml(teamName)+' · GÉN '+ovr+' · '+record+'</span><span>'+escHtml(build)+' · '+escHtml(String(player.pos||"—"))+' · '+Math.round(Number(player.age)||0)+' ans</span></div><div class="mc-save-season"><b>Saison '+Math.max(1,Number(savedCareer.seasonNumber)||1)+' · '+games+' MJ</b><div class="mc-save-player-stats">'+seasonStats+'</div><p class="mc-muted">Émotions '+Math.round(Number(savedCareer.emotions)||0)+' · Entente '+Math.round(Number(savedCareer.chemistry)||0)+' · Popularité '+Math.round(Number(savedCareer.popularity)||0)+' · Fatigue '+Math.round(Number(savedCareer.fatigue)||0)+'</p></div><details class="mc-save-roster"><summary>Effectif et statistiques détaillées ('+teamRoster.length+' joueurs)</summary>'+ (rosterMarkup||'<p class="mc-muted">Aucun joueur trouvé dans l’effectif.</p>')+'</details><div class="mc-actions"><button class="mc-btn primary" data-load-slot="'+index+'">Charger</button><button class="mc-btn secondary" data-save-slot="'+index+'" '+(careerSaveDirectoryPermission==="granted"?"":"disabled")+'>Remplacer</button></div></article>';
}
function renderCareerSaveManager(message){
 const slots=careerSaveSlots.map((slot,index)=>careerSaveSlotMarkup(slot,index)).join("");
 const folder=careerSaveDirectoryHandle?escHtml(careerSaveDirectoryHandle.name||"Dossier sélectionné"):"Aucun dossier sélectionné";
 const canWrite=careerSaveDirectoryPermission==="granted";
 const currentPlayer=playerForCareer(),defaultName="Carrière "+(currentPlayer&&currentPlayer.name?currentPlayer.name:"MyCareer");
 const firstFree=careerSaveSlots.findIndex(slot=>!slot),quickSave=loadStored(),quickSaveMarkup=quickSave&&quickSave.career?'<div class="mc-card"><div class="mc-kicker">SAUVEGARDE RAPIDE LOCALE</div><h3>Carrière enregistrée dans ce navigateur</h3><button class="mc-btn primary" id="mcLoadQuickCareer">Charger cette sauvegarde</button></div>':"";
 render(header("GESTION DES SAUVEGARDES","10 emplacements · Fichiers JSON sur ton ordinateur")+
 '<div class="mc-card"><div class="mc-kicker">DOSSIER DE DESTINATION</div><h2>'+folder+'</h2><p class="mc-muted">Les sauvegardes sont enregistrées dans ce dossier sous forme de fichiers JSON. Le dossier choisi est mémorisé sur cet ordinateur.</p><div class="mc-actions"><button class="mc-btn primary" id="mcChooseSaveDirectory">Choisir un dossier dans Windows</button>'+(careerSaveDirectoryHandle?'<button class="mc-btn secondary" id="mcReconnectSaveDirectory">Autoriser l’accès au dossier</button>':"")+'</div><label class="mc-field" for="mcSaveLabel">Nom de la sauvegarde<input id="mcSaveLabel" maxlength="64" value="'+escHtml(defaultName)+'" placeholder="Ex. Ma carrière NBA"></label><div class="mc-actions"><button class="mc-btn primary" id="mcCreateCareerSave" '+(firstFree<0?"disabled":"")+'>Créer une nouvelle sauvegarde</button><button class="mc-btn secondary" id="mcSaveBack">Retour à ma carrière</button></div><p class="mc-status">'+escHtml(message||(canWrite?"Dossier prêt. Choisis un emplacement libre ou charge une sauvegarde existante.":careerSaveDirectoryHandle?"Réautorise l’accès au dossier pour afficher les 10 emplacements.":"Choisis un dossier pour créer tes fichiers de sauvegarde."))+'</p></div>'+quickSaveMarkup+'<div class="mc-save-grid">'+slots+'</div>');
 attachReturn();
 if($("mcLoadQuickCareer"))$("mcLoadQuickCareer").onclick=()=>{if(restoreStored(quickSave)){saveCareer();renderDashboard();}else renderCareerSaveManager("La sauvegarde rapide est invalide.");};$("mcSaveBack").onclick=renderDashboard;
 $("mcChooseSaveDirectory").onclick=chooseCareerSaveDirectory;
 if($("mcReconnectSaveDirectory"))$("mcReconnectSaveDirectory").onclick=authorizeCareerSaveDirectory;
 $("mcCreateCareerSave").onclick=()=>createCareerSaveInFirstAvailableSlot();
 root.querySelectorAll("[data-save-slot]").forEach(button=>button.onclick=()=>saveCareerToSlot(Number(button.dataset.saveSlot)));
 root.querySelectorAll("[data-load-slot]").forEach(button=>button.onclick=()=>loadCareerFromSlot(Number(button.dataset.loadSlot)));
}
async function chooseCareerSaveDirectory(){
 if(typeof window.showDirectoryPicker!=="function"){
  renderCareerSaveManager("La sélection de dossier est disponible dans Chrome/Edge en ouvrant le jeu avec localhost ou HTTPS.");
  return false;
 }
 try{
  careerSaveDirectoryHandle=await window.showDirectoryPicker({id:"nba-sim-lab-mycareer",mode:"readwrite"});
  await storeCareerSaveDirectory(careerSaveDirectoryHandle);
  careerSaveDirectoryPermission="granted";
  await scanCareerSaveSlots();
  renderCareerSaveManager("Dossier sélectionné : "+careerSaveDirectoryHandle.name);
  return true;
 }catch(error){
  if(error&&error.name==="AbortError")return false;
  renderCareerSaveManager("Impossible d’utiliser ce dossier : "+(error.message||"erreur inconnue"));
  return false;
 }
}
async function authorizeCareerSaveDirectory(){
 try{
  careerSaveDirectoryPermission=await careerSavePermission(careerSaveDirectoryHandle,true);
  if(careerSaveDirectoryPermission==="granted"){await scanCareerSaveSlots();renderCareerSaveManager("Accès au dossier autorisé.");}
  else renderCareerSaveManager("Accès refusé. Choisis à nouveau le dossier de sauvegarde.");
 }catch(error){renderCareerSaveManager("Autorisation impossible : "+(error.message||"erreur inconnue"));}
}
async function openCareerSaveManager(){
 careerSaveDirectoryPermission="prompt";
 renderCareerSaveManager("Recherche du dossier de sauvegarde…");
 try{
  if(!careerSaveDirectoryHandle)careerSaveDirectoryHandle=await readCareerSaveDirectory();
  if(careerSaveDirectoryHandle){
   careerSaveDirectoryPermission=await careerSavePermission(careerSaveDirectoryHandle,false);
   if(careerSaveDirectoryPermission==="granted")await scanCareerSaveSlots();
  }else careerSaveSlots=Array(10).fill(null);
 }catch(error){careerSaveDirectoryPermission="prompt";}
 renderCareerSaveManager();
}
async function saveCareerToSlot(index){
 if(index<0||index>=10||!career)return;
 const inputBeforePicker=$("mcSaveLabel"),requestedLabel=(inputBeforePicker&&inputBeforePicker.value||"").trim();
 if(!careerSaveDirectoryHandle){const chosen=await chooseCareerSaveDirectory();if(!chosen)return;const refreshedInput=$("mcSaveLabel");if(refreshedInput&&requestedLabel)refreshedInput.value=requestedLabel;}
 if(careerSaveDirectoryPermission!=="granted"){
  careerSaveDirectoryPermission=await careerSavePermission(careerSaveDirectoryHandle,true);
  if(careerSaveDirectoryPermission!=="granted"){renderCareerSaveManager("Autorise l’accès au dossier avant d’enregistrer.");return;}
 }
 if(careerSaveSlots[index]&&!confirm("Remplacer la sauvegarde de l’emplacement "+(index+1)+" ?"))return;
 const input=$("mcSaveLabel"),label=requestedLabel||(input&&input.value||"").trim()||("Carrière "+(playerForCareer()&&playerForCareer().name||"MyCareer"));
 try{
  const payload={format:"nba-sim-lab-mycareer-slot",version:1,slot:index+1,label,updatedAt:new Date().toISOString(),data:buildCareerSaveData()};
  const handle=await careerSaveDirectoryHandle.getFileHandle(careerSaveFileName(index),{create:true});
  const writable=await handle.createWritable();
  await writable.write(JSON.stringify(payload,null,2));
  await writable.close();
  saveCareer();
  await scanCareerSaveSlots();
  renderCareerSaveManager("Sauvegarde « "+label+" » créée dans l’emplacement "+(index+1)+".");
 }catch(error){renderCareerSaveManager("Échec de l’enregistrement : "+(error.message||"erreur inconnue"));}
}
async function createCareerSaveInFirstAvailableSlot(){
 const index=careerSaveSlots.findIndex(slot=>!slot);
 if(index<0){renderCareerSaveManager("Les 10 emplacements sont utilisés. Remplace une sauvegarde existante.");return;}
 await saveCareerToSlot(index);
}
async function loadCareerFromSlot(index){
 const slot=careerSaveSlots[index];if(!slot||slot.error||!slot.data)return;
 if(!confirm("Charger « "+slot.label+" » ? La carrière actuellement ouverte sera remplacée."))return;
 if(!restoreStored(slot.data)){renderCareerSaveManager("Cette sauvegarde ne peut pas être chargée.");return;}
 saveCareer();renderDashboard();
}

function restoreStored(data){
 if(!data||!data.career||!Array.isArray(data.players))return false;
 try{players=data.players;seasonYear=Number(data.seasonYear)||2025;phase=data.phase||"regular";seasonCalendar=data.seasonCalendar||null;seasonResults=data.seasonResults||[];if(typeof retired!=="undefined")retired=data.retired||[];customTeams=Array.isArray(data.customTeams)?data.customTeams:[];nextCustomTeamId=Math.max(1,Number(data.nextCustomTeamId)||1);nextPlayerId=Math.max(1000,...players.map(p=>(Number(p.id)||0)+1));career=data.career;draftPlayer=data.draftPlayer||career.draftPlayer||null;career.player=findPlayer(career.playerId)||career.player||null;if(!career.progression)career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(career.player||{})),levelsEarned:0,lastAward:0};if(career.storyIndex==null)career.storyIndex=0;if(Number(career.storyInterval)!==0){career.storyInterval=0;career.pendingStory=false;career.pendingStoryMonth=null;career.lastStoryMonth=career.lastPlayedMonth||"";}if(typeof career.pendingStory!=="boolean")career.pendingStory=false;if(!career.attributeCaps)career.attributeCaps={};if(career.fatigue==null)career.fatigue=0;if(typeof career.autoSeasonSimulation!=="boolean")career.autoSeasonSimulation=false;if(!Array.isArray(career.autoBatchBoxScores))career.autoBatchBoxScores=[];if(career.autoBatchBoxIndex==null)career.autoBatchBoxIndex=career.autoBatchBoxScores.length?career.autoBatchBoxScores.length-1:0;window.NBASimActualPlayerStats=data.actualPlayerStats||{};window.NBASimActualBoxScores=data.actualBoxScores||{};if(!findPlayer(career.playerId)&&career.player&&!career.retired)players.push(career.player);if(typeof window.NBASimPrepareMyCareerMode==="function")window.NBASimPrepareMyCareerMode();if(typeof window.NBAMyNBARosterChanged==="function")window.NBAMyNBARosterChanged();if(typeof renderAll==="function")renderAll();return true;}catch(error){saveError="Reprise impossible : "+error.message;return false;}
}
function showPicker(){
 hideGM();render('<div style="padding-top:clamp(25px,8vh,90px)"><div class="mc-kicker">NBA SIM LAB · CHOISIS TON EXPÉRIENCE</div><h1 class="mc-title">Quelle carrière<br>vas-tu écrire ?</h1><p class="mc-muted">Choisis ton mode de jeu. MyGM conserve la gestion de franchise. MyCareer te place dans la peau d’un seul joueur NBA.</p><div class="mc-mode-grid"><button class="mc-mode" id="mcChooseCareer"><div class="mc-kicker">MODE JOUEUR</div><h2>MyCareer</h2><p>Crée ton joueur, passe par la Draft et construis ta légende jusqu’à la retraite.</p></button><button class="mc-mode" id="mcChooseGM"><div class="mc-kicker">MODE FRANCHISE</div><h2>MyGM</h2><p>Contrôle une franchise, gère ton effectif, les transferts, la saison et les playoffs.</p></button><button class="mc-mode" id="mcChooseRealGame" style="grid-column:1/-1"><div class="mc-kicker">NOUVEAU · MATCH INTERACTIF</div><h2>Démo partie réelle</h2><p>Joue un match 2D 5v5 action par action, avec timing de tir et sprites personnalisés.</p></button></div></div>');
 $("mcChooseCareer").onclick=openCareerHome;$("mcChooseRealGame").onclick=()=>{if(typeof window.NBASimOpenRealGameMode==="function")window.NBASimOpenRealGameMode();else saveError="Le mode Démo partie réelle n’est pas chargé.";};
 $("mcChooseGM").onclick=()=>{const hasFranchise=!!mygmSnapshot;if(mygmSnapshot&&typeof window.NBASimRestoreMyGMState==="function"){if(!window.NBASimRestoreMyGMState(mygmSnapshot))saveError="La reprise MyGM a échoué. Tu peux charger une sauvegarde JSON.";}else if(launcherSnapshot&&typeof window.NBASimRestoreMyGMState==="function"){window.NBASimRestoreMyGMState(launcherSnapshot);}activeMode="gm";root.hidden=true;const gm=$("myGMStart");if(gm)gm.hidden=hasFranchise;document.body.classList.toggle("gm-startup",!hasFranchise);document.body.style.overflow=hasFranchise?"":"hidden";if(!hasFranchise&&typeof window.renderAll==="function")window.renderAll();};
}
function openCareerHome(){
 activeMode="career";hideGM();const saved=loadStored();
 render(header("MYCAREER","Ta carrière NBA, de la Draft à la retraite.")+'<div class="mc-card"><h2>Une carrière à ton image</h2><p class="mc-muted">Crée un joueur de 19 ans, choisis sa spécialité, impressionne les recruteurs et gagne ta place dans la ligue. Toutes les autres franchises restent contrôlées par l’IA.</p><div class="mc-actions">'+'<button class="mc-btn primary" id="mcContinue">Continuer ma carrière</button>'+'<button class="mc-btn primary" id="mcNewCareer">Nouvelle carrière</button><button class="mc-btn secondary" id="mcModeSelect">Changer de mode</button></div><p class="mc-status">'+saveError+'</p></div>');
 attachReturn();if($("mcContinue"))$("mcContinue").onclick=()=>openCareerSaveManager();$("mcNewCareer").onclick=beginNewCareer;$("mcModeSelect").onclick=showPicker;
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
function physiqueAttributeCap(profile,key,player){let cap=key==="potential"||key==="intangibles"||profile.core.includes(key)?99:profile.secondary.includes(key)?94:86;const height=Number(player&&player.height)||188,weight=Number(player&&player.weight)||82,wingspan=Number(player&&player.wingspan)||height,h=(height-188)/5,w=(weight-82)/5,r=(wingspan-height)/5,shooting=["midRange","threePoint","freeThrow","shotIQ"].includes(key),rebounding=["offensiveRebound","defensiveRebound"].includes(key),mobility=["speed","acceleration","agility"].includes(key);if(shooting)cap-=Math.round(h*.7+r*.45);if(key==="block"||key==="interiorDefense"||rebounding)cap+=Math.round(h*.8+r*.8);if(key==="perimeterDefense"||key==="steal")cap+=Math.round(r*.9+h*.25-w*.25);if(mobility)cap-=Math.round(h*.7+w*.5);if(key==="vertical")cap-=Math.round(w*.65);if(key==="dunk")cap+=Math.round(r*.9+w*.2);if(key==="strength"||key==="finishing"||key==="closeShot")cap+=Math.round(w*.7);return clamp(cap,25,99);}
function capFor(profile,key){return physiqueAttributeCap(profile,key,draftPlayer);}
function pointsUsed(){return attrs.reduce((n,p)=>{const key=p[0],base=40+(Number(draftPlayer.physicalBonus&&draftPlayer.physicalBonus[key])||0);return n+Math.max(0,(Number(draftPlayer.attributes[key])||40)-base);},0);}
function applyPhysiqueBaseline(player){const height=Number(player.height)||188,weight=Number(player.weight)||82,wingspan=Number(player.wingspan)||height,h=(height-188)/5,w=(weight-82)/5,r=(wingspan-height)/5,bonus={};const add=(key,value)=>{const delta=clamp(Math.round(value),-8,10);bonus[key]=(Number(bonus[key])||0)+delta;player.attributes[key]=clamp((Number(player.attributes[key])||40)+delta,25,99);};
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
 const rival=allPlayers().filter(p=>p&&nbaTeams.some(team=>team[0]===p.team)&&p.team!==chosen[0]&&p.retired!==true&&p.isRetired!==true&&!p.myCareer).sort((a,b)=>Math.abs((typeof overallRating==="function"?overallRating(a):70)-careerOverall(draftPlayer))-Math.abs((typeof overallRating==="function"?overallRating(b):70)-careerOverall(draftPlayer)))[0];
 career.rivalId=rival?rival.id:null;career.rivalName=rival?rival.name:"Rival à déterminer";players.push(draftPlayer);ensureCareerLeague();secureCareerRoster(draftPlayer);
 career.pendingStory=false;career.storyIndex=0;career.storyInterval=0;career.pendingStoryMonth=null;career.lastStoryMonth="";career.lastPlayedMonth="";career.attributeCaps={};career.fatigue=0;draftPlayer.nbaFatigue=0;career.seasonStartOverall=careerOverall(draftPlayer);career.seasonStartAttributes=Object.assign({},draftPlayer.attributes);career.progression={xp:0,totalXp:0,points:0,required:xpRequiredForNextPoint(careerOverall(draftPlayer)),levelsEarned:0,lastAward:0};career.gamesPlayed=0;career.wins=0;career.losses=0;
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

stories.push({title:"Le pari physique qui peut tout changer",body:"Un entraîneur privé te propose une séance extrême, sans repos, pour repousser tes limites. Le staff médical t'avertit : une blessure catastrophique pourrait mettre un terme à ta carrière.",choices:[
 {label:"Faire la séance extrême sans aucune pause",detail:"Gain physique potentiel, risque très élevé de blessure catastrophique et de fin de carrière.",e:{workEthic:2,clutch:1}},
 {label:"Accepter seulement avec surveillance médicale",detail:"Tu réduis l'intensité et privilégies la sécurité.",e:{durability:2,basketballIQ:1}},
 {label:"Refuser et récupérer",detail:"Tu protèges ta santé et ta longévité.",e:{durability:2,stamina:1}}
]});
const STORY_RISK_REWARD={
 "6:0":{changes:{finishing:3,layup:2,stamina:-1},fatigue:10,capIncrease:{finishing:1}},
 "6:1":{changes:{threePoint:3,midRange:2,stamina:-1},fatigue:11,capIncrease:{threePoint:1}},
 "6:2":{changes:{basketballIQ:2,passing:2},fatigue:3},
 "7:0":{changes:{stamina:2,durability:1},fatigue:-18,capIncrease:{durability:1}},
 "7:1":{changes:{workEthic:2,consistency:2,stamina:-2},fatigue:18,capIncrease:{workEthic:1,consistency:1}},
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
 "26:0":{changes:{clutch:4,speed:2},socialChanges:{emotions:4,popularity:2},fatigue:26,capIncrease:{clutch:2},injuryRisk:18},
 "26:1":{changes:{passing:4,basketballIQ:2},socialChanges:{chemistry:5},fatigue:12,capIncrease:{passing:2}},
 "27:0":{changes:{speed:4,acceleration:3,stamina:2},socialChanges:{emotions:2},fatigue:32,capIncrease:{speed:3,acceleration:2},injuryRisk:28},
 "28:0":{changes:{midRange:4,consistency:2},socialChanges:{popularity:6},fatigue:5,capIncrease:{midRange:2}},
 "29:1":{changes:{workEthic:4,consistency:4},socialChanges:{chemistry:4},fatigue:24,capIncrease:{workEthic:2},injuryRisk:20},
 "30:0":{changes:{threePoint:4,stamina:3},socialChanges:{popularity:4,emotions:4},fatigue:24,capIncrease:{threePoint:3},injuryRisk:22},
 "31:0":{changes:{clutch:4,shotIQ:3},socialChanges:{emotions:4,chemistry:2},fatigue:21,capIncrease:{clutch:2},injuryRisk:14},
 "32:0":{changes:{speed:4,acceleration:3,stamina:-8},socialChanges:{emotions:3},fatigue:48,capIncrease:{speed:2,acceleration:2},injuryRisk:95,careerEnding:true},
 "32:1":{changes:{durability:2,stamina:1},fatigue:12,capIncrease:{durability:1},injuryRisk:12},
 "32:2":{changes:{durability:2,stamina:2},fatigue:-20,capIncrease:{durability:1}}
};
function storyChoiceOutcome(sceneIndex,choiceIndex,choice){
 const social={},attributes={};Object.entries(choice&&choice.e||{}).forEach(([key,value])=>{if(["emotions","chemistry","popularity"].includes(key))social[key]=Number(value)||0;else attributes[key]=Number(value)||0;});
 const rule=STORY_RISK_REWARD[sceneIndex+":"+choiceIndex]||{};
 Object.entries(rule.changes||{}).forEach(([key,value])=>attributes[key]=(Number(attributes[key])||0)+(Number(value)||0));
 Object.entries(rule.socialChanges||{}).forEach(([key,value])=>social[key]=(Number(social[key])||0)+(Number(value)||0));
 return {social,attributes,fatigue:Number(rule.fatigue)||0,capIncrease:rule.capIncrease||{},injuryRisk:Number(rule.injuryRisk)||0,careerEnding:rule.careerEnding===true};
}
function storyAttributeLabel(key){const found=attrs.find(item=>item[0]===key);return found?found[1]:key;}
function storyAttributeCategory(key){const section=CAREER_ATTRIBUTE_SECTIONS.find(item=>item.keys.includes(key));return section?section.title:"ATTRIBUTS";}
function storyGainText(value){return value>=4?"+"+value:"+".repeat(Math.max(0,Math.round(value)));}
function storyOutcomeMarkup(outcome,currentFatigue,durability){
 const gains=Object.entries(outcome.attributes).filter(([,v])=>v>0).map(([key,v])=>'<span class="mc-story-gain"><b>'+storyGainText(v)+'</b> '+escHtml(storyAttributeLabel(key))+' <small>· '+escHtml(storyAttributeCategory(key))+'</small></span>');
 const losses=Object.entries(outcome.attributes).filter(([,v])=>v<0).map(([key,v])=>'<span class="mc-story-loss">−'+Math.abs(v)+' '+escHtml(storyAttributeLabel(key))+'</span>');
 const socialLabels={emotions:"Émotions",chemistry:"Entente d’équipe",popularity:"Popularité"};
 const socialGains=Object.entries(outcome.social).filter(([,v])=>v>0).map(([key,v])=>'<span class="mc-story-social-gain"><b>'+storyGainText(v)+'</b> '+escHtml(socialLabels[key]||key)+'</span>');
 const socialLosses=Object.entries(outcome.social).filter(([,v])=>v<0).map(([key,v])=>'<span class="mc-story-loss">−'+Math.abs(v)+' '+escHtml(socialLabels[key]||key)+'</span>');
 const caps=Object.entries(outcome.capIncrease).map(([key,v])=>'<span class="mc-story-cap">Plafond +'+v+' · '+escHtml(storyAttributeLabel(key))+'</span>');
 const fatigue=outcome.fatigue>0?'<span class="mc-story-fatigue">Fatigue +'+outcome.fatigue+'</span>':outcome.fatigue<0?'<span class="mc-story-recovery">Récupération '+Math.abs(outcome.fatigue)+'</span>':"";
 const injuryRisk=outcome.injuryRisk>0?'<span class="mc-story-risk">Risque de blessure : environ '+Math.round(clamp(outcome.injuryRisk+Math.max(0,(Number(currentFatigue)||0)+outcome.fatigue-55)*.6-(Number(durability)||50)*.35,0,outcome.careerEnding?95:85))+'%</span>'+(outcome.careerEnding?'<span class="mc-story-risk">⚠ Si la blessure survient : fin de carrière</span>':""):"";
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
 const teamLabel=String(career.teamName||player.team||career.teamCode||"Équipe NBA");
 return '<section class="mc-story-overview"><div class="mc-story-overview-heading"><div><div class="mc-kicker">ÉTAT ACTUEL DE TON JOUEUR · '+escHtml(teamLabel)+'</div><h3>'+escHtml(player.name||"Mon joueur")+' · GÉN '+careerOverall(player)+'</h3></div><span class="mc-story-fatigue-label">Fatigue '+Math.round(Number(career.fatigue)||0)+'/100</span></div><div class="mc-grid three mc-story-social-grid">'+social+'</div><button type="button" class="mc-btn secondary" id="mcToggleStoryAttributes" aria-expanded="false">Voir attributs</button><div class="mc-story-attribute-grid" id="mcStoryAttributes" hidden style="margin-top:12px">'+sections+extraMarkup+'</div></section>';
}
function renderStory(){
 const index=Math.max(0,Number(career.storyIndex)||0)%stories.length,scene=stories[index],month=career.pendingStoryMonth||career.lastPlayedMonth||"Fin de mois";activeStory=scene;
 const player=playerForCareer();
 const options=scene.choices.map((choice,i)=>{const outcome=storyChoiceOutcome(index,i,choice);return '<button class="mc-choice" data-story-choice="'+i+'"><b>'+escHtml(choice.label)+'</b><span class="mc-muted">'+escHtml(choice.detail)+'</span>'+storyOutcomeMarkup(outcome,career.fatigue,Number(player&&player.attributes&&player.attributes.durability)||50)+'</button>';}).join("");
 render(header("UNE DÉCISION À PRENDRE",escHtml(month)+" · Saison "+career.seasonNumber)+'<div class="mc-card"><div class="mc-kicker">MYCAREER STORYLINE · '+(index+1)+' / '+stories.length+'</div><h2>'+escHtml(scene.title)+'</h2><p class="mc-muted">'+escHtml(scene.body)+'</p><p class="mc-muted">Certains choix offrent des gains de 4 points ou plus et peuvent relever un plafond de +2 ou +3. Les séances les plus intenses augmentent fortement la fatigue et le risque de blessure.</p>'+renderCareerStoryOverview(player)+'<h3 class="mc-story-choices-heading">CHOISIS TON ACTION</h3>'+options+'</div>');
 attachReturn();const attrToggle=$("mcToggleStoryAttributes"),attrPanel=$("mcStoryAttributes");if(attrToggle&&attrPanel)attrToggle.onclick=()=>{const show=attrPanel.hidden;attrPanel.hidden=!show;attrToggle.setAttribute("aria-expanded",String(show));attrToggle.textContent=show?"Masquer les attributs":"Voir attributs";};root.querySelectorAll("[data-story-choice]").forEach(button=>button.onclick=()=>{
  const choiceIndex=Number(button.dataset.storyChoice),choice=scene.choices[choiceIndex],outcome=storyChoiceOutcome(index,choiceIndex,choice),player=playerForCareer();
  Object.entries(outcome.social).forEach(([key,value])=>career[key]=clamp((Number(career[key])||0)+value,0,100));
  career.attributeCaps=career.attributeCaps||{};Object.entries(outcome.capIncrease).forEach(([key,value])=>career.attributeCaps[key]=clamp((Number(career.attributeCaps[key])||0)+Number(value||0),0,20));
  if(player&&player.attributes)Object.entries(outcome.attributes).forEach(([key,value])=>player.attributes[key]=clamp((Number(player.attributes[key])||40)+value,20,attributeUpgradeCap(player,key)));
  career.fatigue=clamp((Number(career.fatigue)||0)+outcome.fatigue,0,100);
  const durability=Number(player&&player.attributes&&player.attributes.durability)||50;const effectiveInjuryRisk=clamp(outcome.injuryRisk+Math.max(0,career.fatigue-55)*.6-durability*.35,0,outcome.careerEnding?95:85);
  let storyInjury=null;
  if(player&&(!player.injury||outcome.careerEnding)&&effectiveInjuryRisk>0&&rand()*100<effectiveInjuryRisk){
   if(typeof window.NBASimBuildInjury==="function")storyInjury=window.NBASimBuildInjury(player,effectiveInjuryRisk>=55?"moderate":"minor","leg",null,null);
   if(!storyInjury)storyInjury={id:"story-injury-"+Date.now(),severity:outcome.careerEnding?"career-ending":"minor",label:outcome.careerEnding?"Blessure catastrophique · carrière terminée":"Blessure légère",bodyPart:"leg",bodyPartLabel:"Jambe",stage:"out",restGamesTotal:outcome.careerEnding?999:2,restGamesRemaining:outcome.careerEnding?999:2,recoveryGamesTotal:outcome.careerEnding?999:2,recoveryGamesRemaining:outcome.careerEnding?999:2,attributePenalties:{},createdSeason:seasonName(seasonYear),createdGameId:null,manual:true};
   if(outcome.careerEnding){storyInjury.severity="career-ending";storyInjury.label="Blessure catastrophique · carrière terminée";storyInjury.restGamesTotal=999;storyInjury.restGamesRemaining=999;}
   player.injury=storyInjury;
  }
  career.storyHistory=Array.isArray(career.storyHistory)?career.storyHistory:[];
  career.storyHistory.push({season:seasonName(seasonYear),month,event:scene.title,choice:choice.label,storyIndex:index,attributeChanges:outcome.attributes,socialChanges:outcome.social,capIncrease:outcome.capIncrease,fatigue:outcome.fatigue,injuryRisk:effectiveInjuryRisk,injuryApplied:!!storyInjury});
  if(outcome.careerEnding&&storyInjury){career.retired=true;career.careerEndingInjury=true;career.retirementReason="Blessure catastrophique causée par une décision d’histoire à risque extrême. Ta carrière NBA est terminée.";career.retiredAt=seasonName(seasonYear);career.pendingStory=false;career.pendingStoryMonth=null;saveCareer();renderRetirement();return;}career.storyIndex=(index+1)%stories.length;career.pendingStory=false;career.pendingStoryMonth=null;const resumeSimulation=career.autoSeasonSimulation===true;saveCareer();if(resumeSimulation){simulateCareerSeason({resume:true});return;}renderDashboard();
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
  '<div class="mc-actions"><button class="mc-btn primary" id="mcBoxContinue">'+(career.pendingStory?"Continuer vers ton histoire →":careerLeagueScheduleComplete()?"Terminer la saison →":career.gamesPlayed>=82?"Terminer les matchs de la ligue →":career.autoSeasonSimulation?"Reprendre la simulation →":"Retour à ma carrière")+'</button><button class="mc-btn secondary" id="mcBoxAttributes">Voir mes attributs</button></div>');
 attachReturn();
 if($("mcBoxPrevious"))$("mcBoxPrevious").onclick=()=>{career.autoBatchBoxIndex=Math.max(0,career.autoBatchBoxIndex-1);renderLastBoxScore();};
 if($("mcBoxNext"))$("mcBoxNext").onclick=()=>{career.autoBatchBoxIndex=Math.min(source.length-1,career.autoBatchBoxIndex+1);renderLastBoxScore();};
 $("mcBoxContinue").onclick=()=>{
  if(career.pendingStory){renderStory();return;}
  if(careerLeagueScheduleComplete()){finishSeason();return;}if(career.gamesPlayed>=82){simulateCareerSeason();return;}
  if(career.autoSeasonSimulation){career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;saveCareer();simulateCareerSeason({resume:true});return;}
  renderDashboard();
 };
 $("mcBoxAttributes").onclick=showCareerAttributes;
}
function renderCareerLeagueLeaders(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const actual=window.NBASimActualPlayerStats||{},mine=career.seasonStats||{},results=Array.isArray(seasonResults)?seasonResults:[];
 const teams=(typeof nbaTeams!=="undefined"?nbaTeams:[]).map(t=>({code:String(t[0]),name:String(t[1]),conference:String(t[2]||"—"),custom:false})).concat((typeof customTeams!=="undefined"?customTeams:[]).map(t=>({code:String(t.code),name:String(t.name),conference:String(t.conference||"—"),custom:true})));
 const teamSortKey=career.leaderTeamSort||"wins";
 const teamRows=teams.map(team=>{
  const result=results.find(row=>String(row.code)===team.code||String(row.scheduleCode)===team.code)||{},wins=Number(result.wins)||0,losses=Number(result.losses)||0,roster=allPlayers().filter(player=>String(player.team)===team.code&&!player.retired&&!player.isRetired),strength=roster.length?Math.round(roster.reduce((sum,player)=>sum+(typeof overallRating==="function"?Number(overallRating(player))||60:60),0)/roster.length):0;
  return Object.assign({},team,{wins,losses,pct:Number(result.winPct)||((wins+losses)?wins/(wins+losses):0),ppg:Number(result.ppg)||0,apg:Number(result.apg)||0,rpg:Number(result.rpg)||0,spg:Number(result.spg)||0,bpg:Number(result.bpg)||0,strength});
 }).sort((a,b)=>teamSortKey==="name"?a.name.localeCompare(b.name,"fr"):teamSortKey==="losses"?a.losses-b.losses:(Number(b[teamSortKey==="power"?"strength":teamSortKey])||0)-(Number(a[teamSortKey==="power"?"strength":teamSortKey])||0)||b.wins-a.wins);
 const league=allPlayers().filter(player=>player&&!player.retired&&!player.isRetired).map(player=>{
  let raw=actual[String(player.id)]||{},gp=Number(raw.gp)||0;
  if(String(player.id)===String(p.id)&&!gp){raw={pts:mine.pts,reb:mine.reb,ast:mine.ast,stl:mine.stl,blk:mine.blk,minutes:mine.minutes,gp:mine.gp,fgm:mine.fgm,fga:mine.fga,threeMade:mine.threeMade,threeAttempts:mine.threeAttempts,ftm:mine.ftm,fta:mine.fta};gp=Number(raw.gp)||0;}
  if(gp<=0)return null;
  const total=key=>Number(raw[key])||0;
  return {player,gp,pts:total("pts")/gp,reb:total("reb")/gp,ast:total("ast")/gp,stl:total("stl")/gp,blk:total("blk")/gp,mpg:total("minutes")/gp,fg:total("fga")?total("fgm")/total("fga")*100:0,three:total("threeAttempts")?total("threeMade")/total("threeAttempts")*100:0,ft:total("fta")?total("ftm")/total("fta")*100:0};
 }).filter(Boolean);
 const tab=career.leaderTab==="players"?"players":"teams",sortKey=career.leaderPlayerSort||"pts";
 const playerMetric={pts:"pts",reb:"reb",ast:"ast",stl:"stl",blk:"blk",ovr:"ovr",mpg:"mpg",fg:"fg",three:"three",ft:"ft"}[sortKey]||"pts";
 const playerRows=league.slice().sort((a,b)=>sortKey==="name"?String(a.player.name).localeCompare(String(b.player.name),"fr"):playerMetric==="ovr"?(careerOverall(b.player)-careerOverall(a.player)):((Number(b[playerMetric])||0)-(Number(a[playerMetric])||0))||careerOverall(b.player)-careerOverall(a.player)).slice(0,15);
 const teamMarkup='<div class="mc-leader-toolbar"><label class="mc-field">Classer les équipes par <select id="mcCareerTeamLeaderSort"><option value="wins">Victoires</option><option value="losses">Défaites</option><option value="pct">% de victoires</option><option value="ppg">Points / match</option><option value="apg">Passes / match</option><option value="rpg">Rebonds / match</option><option value="spg">Interceptions / match</option><option value="bpg">Contres / match</option><option value="power">Puissance</option><option value="name">Nom</option></select></label></div><div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>#</th><th>Équipe</th><th>Conf.</th><th>V</th><th>D</th><th>%V</th><th>PPM</th><th>APM</th><th>RPM</th><th>SPM</th><th>BPM</th><th>POW</th></tr></thead><tbody>'+teamRows.map((row,index)=>'<tr class="'+(String(row.code)===String(career.teamCode)?"mc-my-team-player":"")+'"><td>'+ (index+1) +'</td><td><b>'+escHtml(row.name)+'</b><small>'+escHtml(row.code)+(row.custom?" · CUSTOM":"")+'</small></td><td>'+escHtml(row.conference)+'</td><td>'+row.wins+'</td><td>'+row.losses+'</td><td>'+(row.pct*100).toFixed(1)+'%</td><td>'+row.ppg.toFixed(1)+'</td><td>'+row.apg.toFixed(1)+'</td><td>'+row.rpg.toFixed(1)+'</td><td>'+row.spg.toFixed(1)+'</td><td>'+row.bpg.toFixed(1)+'</td><td>'+row.strength+'</td></tr>').join("")+'</tbody></table></div>';
 const playerMarkup='<div class="mc-leader-toolbar"><label class="mc-field">Classer par <select id="mcCareerLeaderSort"><option value="pts">Points par match</option><option value="reb">Rebonds par match</option><option value="ast">Passes par match</option><option value="stl">Interceptions par match</option><option value="blk">Contres par match</option><option value="fg">FG %</option><option value="three">3P %</option><option value="ft">LF %</option><option value="mpg">Minutes / match</option><option value="ovr">Puissance (GÉN)</option><option value="name">Nom</option></select></label></div><div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>#</th><th>Joueur</th><th>Équipe</th><th>GÉN</th><th>PPG</th><th>RPG</th><th>APG</th><th>STL</th><th>BLK</th><th>FG%</th><th>3P%</th><th>LF%</th><th>MPG</th><th>MJ</th></tr></thead><tbody>'+playerRows.map((row,index)=>'<tr class="'+(String(row.player.id)===String(p.id)?"mc-my-team-player":"")+'"><td>'+(index+1)+'</td><td><b>'+escHtml(row.player.name)+'</b><small>'+escHtml(row.player.pos||"—")+'</small></td><td>'+escHtml(careerTeamLabel(row.player.team))+'</td><td>'+careerOverall(row.player)+'</td><td>'+row.pts.toFixed(1)+'</td><td>'+row.reb.toFixed(1)+'</td><td>'+row.ast.toFixed(1)+'</td><td>'+row.stl.toFixed(1)+'</td><td>'+row.blk.toFixed(1)+'</td><td>'+row.fg.toFixed(1)+'%</td><td>'+row.three.toFixed(1)+'%</td><td>'+row.ft.toFixed(1)+'%</td><td>'+row.mpg.toFixed(1)+'</td><td>'+row.gp+'</td></tr>').join("")+'</tbody></table></div>';
 render(header("LEAGUE LEADERS · MYGM","Classements de la ligue · Saison "+seasonName(seasonYear))+
  '<div class="mc-card"><div class="mc-actions"><button class="mc-btn '+(tab==="teams"?"primary":"secondary")+'" id="mcLeaderTeams">Team Leaders · Équipes</button><button class="mc-btn '+(tab==="players"?"primary":"secondary")+'" id="mcLeaderPlayers">Player Leaders · Joueurs</button></div>'+
  (tab==="teams"?'<h3>Classement des équipes</h3>'+teamMarkup:'<h3>Classement des joueurs</h3>'+playerMarkup)+
  '<div class="mc-actions"><button class="mc-btn secondary" id="mcLeadersBack">Retour à ma carrière</button></div></div>');
 attachReturn();
 $("mcLeaderTeams").onclick=()=>{career.leaderTab="teams";saveCareer();renderCareerLeagueLeaders();};
 $("mcLeaderPlayers").onclick=()=>{career.leaderTab="players";saveCareer();renderCareerLeagueLeaders();};
 if($("mcCareerLeaderSort")){$("mcCareerLeaderSort").value=sortKey;$("mcCareerLeaderSort").onchange=()=>{career.leaderPlayerSort=$("mcCareerLeaderSort").value;saveCareer();renderCareerLeagueLeaders();};}
 if($("mcCareerTeamLeaderSort")){$("mcCareerTeamLeaderSort").value=teamSortKey;$("mcCareerTeamLeaderSort").onchange=()=>{career.leaderTeamSort=$("mcCareerTeamLeaderSort").value;saveCareer();renderCareerLeagueLeaders();};}
 $("mcLeadersBack").onclick=renderDashboard;
}
function renderCareerTeam(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const teamMeta=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(team=>String(team[0])===String(career.teamCode));
 const teamName=teamMeta?teamMeta[1]:career.teamName||career.teamCode,actual=window.NBASimActualPlayerStats||{};
 const roster=allPlayers().filter(player=>String(player.team)===String(career.teamCode)&&player.retired!==true&&player.isRetired!==true).sort((a,b)=>{
  if(String(a.id)===String(p.id))return -1;if(String(b.id)===String(p.id))return 1;
  return (typeof overallRating==="function"?overallRating(b):Number(b.pts)||0)-(typeof overallRating==="function"?overallRating(a):Number(a.pts)||0);
 }).slice(0,15);
 const body=roster.map(player=>{
  const isCareerPlayer=String(player.id)===String(p.id),injury=player.injury,raw=actual[String(player.id)]||{},line=isCareerPlayer?career.seasonStats||raw:raw,gp=Math.max(1,Number(line.gp)||1),fgm=Number(line.fgm)||0,fga=Number(line.fga)||0,threeMade=Number(line.threeMade)||0,threeAttempts=Number(line.threeAttempts)||0,ftm=Number(line.ftm)||0,fta=Number(line.fta)||0;
  const ovr=isCareerPlayer?careerOverall(player):(typeof overallRating==="function"?overallRating(player):"—"),portrait=typeof window.NBASimPlayerPortraitMarkup==="function"?window.NBASimPlayerPortraitMarkup(player,34):"";
  const average=key=>((Number(line[key])||Number(player[key])||0)/gp).toFixed(1);
  return '<tr class="'+(isCareerPlayer?"mc-my-team-player":"")+'"><td><b>'+portrait+escHtml(player.name)+'</b>'+(isCareerPlayer?'<small>TON JOUEUR</small>':"")+'</td><td>'+escHtml(player.pos||"—")+'</td><td><b>'+ovr+'</b></td><td>'+Math.round(Number(player.age)||0)+'</td><td>'+Math.round(Number(player.height)||0)+' cm</td><td>'+Math.round(Number(line.minutes)||Number(player.mpg)||0)+'</td><td>'+average("pts")+'</td><td>'+average("reb")+'</td><td>'+average("ast")+'</td><td>'+average("stl")+'</td><td>'+average("blk")+'</td><td>'+(fga?(fgm/fga*100).toFixed(1)+"%":"—")+'</td><td>'+(threeAttempts?(threeMade/threeAttempts*100).toFixed(1)+"%":"—")+'</td><td>'+(fta?(ftm/fta*100).toFixed(1)+"%":"—")+'</td><td>'+(injury?'<span class="mc-team-injury">Blessé</span>':'<span class="mc-team-healthy">Disponible</span>')+'</td></tr>';
 }).join("");
 render(header("VIEW ROSTER · MON ÉQUIPE",teamName+" · "+roster.length+" joueurs")+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan de l’équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div><div class="mc-metric"><strong>'+roster.length+'/15</strong><span>Effectif</span></div></div>'+
  '<div class="mc-card"><div class="mc-kicker">EFFECTIF NBA · LECTURE SEULE</div><p class="mc-muted">Vue d’effectif inspirée du View Roster MyGM. Les minutes sont consultables, mais aucune rotation, minute, tendance ou transaction ne peut être modifiée en MyCareer.</p><div class="mc-table-wrap"><table class="mc-box-table mc-roster-table"><thead><tr><th>Joueur</th><th>POS</th><th>GÉN</th><th>ÂGE</th><th>TAILLE</th><th>MIN · lecture seule</th><th>PPG</th><th>RPG</th><th>APG</th><th>SPG</th><th>BPG</th><th>FG%</th><th>3P%</th><th>FT%</th><th>ÉTAT</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="mc-actions"><button class="mc-btn secondary" id="mcTeamBack">Retour à ma carrière</button></div></div>');
 attachReturn();$("mcTeamBack").onclick=renderDashboard;
}
function renderCareerViewTeam(){
 const p=playerForCareer();if(!p)return renderDashboard();
 const meta=(typeof nbaTeams!=="undefined"?nbaTeams:[]).find(team=>String(team[0])===String(career.teamCode)),custom=(typeof customTeams!=="undefined"?customTeams:[]).find(team=>String(team.code)===String(career.teamCode)),name=meta?meta[1]:custom&&custom.name||career.teamName||career.teamCode,conference=meta?meta[2]:custom&&custom.conference||"—",roster=allPlayers().filter(player=>String(player.team)===String(career.teamCode)&&!player.retired&&!player.isRetired),strength=roster.length?Math.round(roster.reduce((sum,player)=>sum+(typeof overallRating==="function"?Number(overallRating(player))||60:60),0)/roster.length):careerOverall(p),logo=typeof window.NBASimTeamImageMarkup==="function"?window.NBASimTeamImageMarkup(career.teamCode,80):escHtml(career.teamCode);
 render(header("VIEW TEAM · MA FRANCHISE",name)+'<div class="mc-card"><div class="mc-grid"><div style="display:flex;align-items:center;gap:16px">'+logo+'<div><div class="mc-kicker">'+escHtml(career.teamCode)+'</div><h2>'+escHtml(name)+'</h2><p class="mc-muted">'+escHtml(conference)+' · '+(custom?"Franchise personnalisée":"NBA")+'</p></div></div><div class="mc-grid three"><div class="mc-metric"><strong>'+career.wins+'–'+career.losses+'</strong><span>Bilan saison</span></div><div class="mc-metric"><strong>'+roster.length+'/15</strong><span>Effectif</span></div><div class="mc-metric"><strong>'+strength+'</strong><span>Puissance moyenne · GÉN</span></div></div><p class="mc-muted">Vue franchise en lecture seule, reprenant les informations principales de View Team MyGM. Les réglages de gameplan, coach et transactions restent réservés à MyGM.</p><div class="mc-actions"><button class="mc-btn primary" id="mcViewTeamRoster">View Roster</button><button class="mc-btn secondary" id="mcViewTeamBack">Retour à ma carrière</button></div></div>');
 attachReturn();$("mcViewTeamRoster").onclick=renderCareerTeam;$("mcViewTeamBack").onclick=renderDashboard;
}
function renderCareerPlayoffs(){
 const postseason=career.lastPostseason||career.postseason,rounds=postseason&&Array.isArray(postseason.rounds)?postseason.rounds:[],phases=["Premier tour","Demi-finales","Finales de conférence","Finale NBA"];
 if(!postseason||!rounds.length)return renderDashboard();
 const phaseMarkup='<div class="mc-playoff-bracket">'+phases.map((name,index)=>{const rows=rounds.filter(row=>row.round===name);return '<section class="mc-card mc-playoff-round"><h3>'+name+'</h3>'+(rows.length?rows.map((row,i)=>'<button type="button" class="mc-playoff-series" data-mc-playoff-series="'+index+'-'+i+'"><small>'+escHtml(row.conference||"NBA")+'</small><b>'+escHtml(row.teamA)+' <span>'+row.winsA+'–'+row.winsB+'</span> '+escHtml(row.teamB)+'</b><em>Vainqueur : '+escHtml(row.winner||"série incomplète")+'</em></button>').join(""):'<p class="mc-muted">Aucune série disputée dans cette phase.</p>')+'<p class="mc-muted mc-playoff-detail" id="mcPlayoffDetail'+index+'">Clique une série pour son résumé.</p></section>';}).join("")+'</div>';
 render(header("PLAYOFFS NBA · TABLEAU COMPLET","Saison "+(career.lastSeasonRecap&&career.lastSeasonRecap.season||seasonName(Math.max(2025,Number(seasonYear)-1))))+'<div class="mc-card"><div class="mc-kicker">POST-SAISON DE TOUTE LA LIGUE</div><h2>Champion NBA : '+escHtml(postseason.champion||"Non déterminé")+'</h2><p class="mc-muted">'+(postseason.qualified?"Ton équipe a participé aux playoffs.":"Ton équipe n’était pas qualifiée, mais tu peux consulter l’intégralité du tableau NBA.")+'</p>'+phaseMarkup+'<div class="mc-actions"><button class="mc-btn secondary" id="mcPlayoffsBack">Retour à ma carrière</button></div></div>');
 attachReturn();root.querySelectorAll("[data-mc-playoff-series]").forEach(button=>button.onclick=()=>{const parts=button.dataset.mcPlayoffSeries.split("-"),detail=$("mcPlayoffDetail"+parts[0]);if(detail){const roundRows=rounds.filter(row=>row.round===phases[Number(parts[0])]),series=roundRows[Number(parts[1])],gameScores=series&&Array.isArray(series.games)?series.games.map(game=>"M"+game.game+" "+game.home+" "+game.homeScore+"–"+game.awayScore+" "+game.away).join(" | "):"";detail.textContent=button.querySelector("b").textContent+" · "+button.querySelector("em").textContent+" · "+(gameScores||"Série au meilleur de 7.");}});$("mcPlayoffsBack").onclick=renderDashboard;
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
 const xp=progressionState(p),storyDue=career.pendingStory===true,leagueComplete=careerLeagueScheduleComplete(),remainingLeagueGames=careerRemainingLeagueGames(),seasonComplete=leagueComplete,fatigue=clamp(Number(career.fatigue)||0,0,100);
 const injuryText=injury?(injury.label||injury.severity)+" · "+(Number(injury.restGamesRemaining)||0)+" matchs avant retour":"En santé";
 render(header("SAISON "+career.seasonNumber,p.name+" · "+p.team+" · "+p.age+" ans")+
 (career.autoSeasonSimulation?'<div class="mc-card"><b>Simulation de la saison en cours · les résultats de tes matchs s’inscrivent sur les tuiles du calendrier.</b><div class="mc-actions"><button class="mc-btn secondary" id="mcStopSimulation">Arrêter la simulation</button></div></div>':"")+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+careerOverall(p)+'</strong><span>GÉN</span></div><div class="mc-metric"><strong>'+career.wins+'-'+career.losses+'</strong><span>Bilan équipe</span></div><div class="mc-metric"><strong>'+career.gamesPlayed+'/82</strong><span>Matchs joués</span></div></div>'+
 '<div class="mc-grid three"><div class="mc-metric"><strong>'+career.emotions+'</strong><span>Émotions</span></div><div class="mc-metric"><strong>'+career.chemistry+'</strong><span>Entente d’équipe</span></div><div class="mc-metric"><strong>'+career.popularity+'</strong><span>Popularité</span></div></div><div class="mc-card mc-fatigue-card"><div class="mc-kicker">CONDITION PHYSIQUE</div><div class="mc-fatigue-heading"><b>Fatigue</b><strong>'+fatigue+'/100</strong></div><div class="mc-fatigue-track"><span style="width:'+fatigue+'%"></span></div><p class="mc-muted">La fatigue réduit progressivement ta vitesse, ton agilité, ton endurance et ta régularité. Les choix de récupération peuvent la réduire.</p></div>'+
 '<div class="mc-card">'+(tradeNotice?'<div class="mc-result"><div class="mc-kicker">TRADE · NOUVELLE FRANCHISE</div><h2>'+escHtml(tradeNotice.to||career.teamName)+'</h2><p class="mc-muted">Tu as été échangé par '+escHtml(tradeNotice.from||"ton ancienne équipe")+' vers '+escHtml(tradeNotice.toCode||career.teamCode)+'. L’affichage est actualisé sur ta nouvelle équipe.</p><button class="mc-btn secondary" id="mcDismissTrade">Compris</button></div>':"")+'<div class="mc-grid"><div><div class="mc-kicker">STATISTIQUES DE LA SAISON</div><h2>'+statLine()+'</h2><p class="mc-muted">Blessure : '+injuryText+'</p><p class="mc-muted">Prochain match : '+(next?escHtml(next.home.name)+" vs "+escHtml(next.away.name):leagueComplete?"Saison régulière terminée":career.gamesPlayed>=82?"Tes 82 matchs sont terminés · "+remainingLeagueGames+" matchs de ligue restent à jouer":"Calendrier personnel terminé · "+remainingLeagueGames+" matchs de ligue restent à jouer")+'</p></div><div><div class="mc-kicker">TON RIVAL</div><h2>'+(rival?escHtml(rival.name):escHtml(career.rivalName||"Rival à déterminer"))+'</h2><p class="mc-muted">'+(rival?escHtml(rival.team)+" · GÉN "+(typeof overallRating==="function"?overallRating(rival):"—"):"Un nouveau rival sera identifié.")+'</p></div></div><div class="mc-divider"></div><div class="mc-kicker">DERNIER MATCH</div>'+
 (game?'<div class="mc-game-result"><b>'+escHtml(game.teamCode)+'</b><strong>'+game.teamScore+' – '+game.opponentScore+'</strong><b>'+escHtml(game.opponentCode)+'</b></div><p class="mc-muted" style="text-align:center">'+escHtml(game.result)+' · '+escHtml(game.line)+'</p>':'<p class="mc-muted">Tu n’as pas encore disputé ton premier match NBA.</p>')+
 '<div class="mc-actions"><button class="mc-btn primary" id="mcNextMatch" '+(!next||storyDue?"disabled":"")+'>Simuler le prochain match →</button><button class="mc-btn primary" id="mcSimSeason" '+(seasonComplete||storyDue?"disabled":"")+'>Simuler la saison →</button><button class="mc-btn secondary" id="mcAttributes">Voir mes attributs'+(xp.points>0?" · "+xp.points+" point(s)":"")+'</button><button class="mc-btn secondary" id="mcTeam">View Roster · Mon équipe</button><button class="mc-btn secondary" id="mcViewTeam">View Team · Ma franchise</button><button class="mc-btn secondary" id="mcLeagueLeaders">League Leaders · MyGM</button>'+(career.lastPostseason&&Array.isArray(career.lastPostseason.rounds)&&career.lastPostseason.rounds.length?'<button class="mc-btn secondary" id="mcPlayoffs">Voir les playoffs NBA complets</button>':"")+''+(game&&game.boxScore?'<button class="mc-btn secondary" id="mcViewBox">Voir le box score</button>':'')+'<button class="mc-btn secondary" id="mcSave">Sauvegarder</button></div>'+
 (storyDue?'<p class="mc-story-prompt">Une histoire t’attend à la fin de '+escHtml(career.pendingStoryMonth||"ce mois")+'.</p><div class="mc-actions"><button class="mc-btn primary" id="mcOpenStory">Faire mon choix d’histoire →</button></div>':'')+
 '<p class="mc-status">'+escHtml(saveError||"La simulation MyCareer est isolée de MyGM.")+'</p></div>'+renderCareerCalendarMarkup());
 attachReturn();if($("mcStopSimulation"))$("mcStopSimulation").onclick=()=>{career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();};
 if($("mcDismissTrade"))$("mcDismissTrade").onclick=()=>{career.tradeNotice=null;saveCareer();renderDashboard();};
 $("mcNextMatch").onclick=()=>simulateNextMatch();
 $("mcSimSeason").onclick=simulateCareerSeason;
 $("mcAttributes").onclick=()=>{pendingAttributeUpgrades={};showCareerAttributes();};
 $("mcTeam").onclick=renderCareerTeam;$("mcViewTeam").onclick=renderCareerViewTeam;$("mcLeagueLeaders").onclick=renderCareerLeagueLeaders;if($("mcPlayoffs"))$("mcPlayoffs").onclick=renderCareerPlayoffs;
 if($("mcViewBox"))$("mcViewBox").onclick=renderLastBoxScore;
 if($("mcOpenStory"))$("mcOpenStory").onclick=renderStory;
 $("mcSave").onclick=()=>openCareerSaveManager();
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
  '<button type="button" class="mc-btn secondary" id="mcRevealAttributes" aria-expanded="false">Afficher les attributs</button><div class="mc-attribute-panels" id="mcCareerAttributePanels" hidden>'+sections+'</div>'+
  '<div class="mc-attribute-purchase"><div><strong id="mcSelectedPoints">'+pending+' / '+progress.points+'</strong><span>Points sélectionnés</span></div><button class="mc-btn primary" id="mcBuyAttributes" '+(pending===0||pending>progress.points?"disabled":"")+'>Acheter les améliorations</button><button class="mc-btn secondary" id="mcClearAttributes" '+(pending===0?"disabled":"")+'>Annuler</button></div>'+
  '<div class="mc-actions"><button class="mc-btn secondary" id="mcBackDashboard">Retour à ma carrière</button></div>');
 attachReturn();const revealButton=$("mcRevealAttributes"),attributePanels=$("mcCareerAttributePanels");if(revealButton&&attributePanels)revealButton.onclick=()=>{const show=attributePanels.hidden;attributePanels.hidden=!show;revealButton.setAttribute("aria-expanded",String(show));revealButton.textContent=show?"Masquer les attributs":"Afficher les attributs";};
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
function refreshCareerRivalForSeason(p){const oldId=career.rivalId,oldName=career.rivalName||"",rating=careerOverall(p),candidates=allPlayers().filter(x=>x&&String(x.id)!==String(p.id)&&x.team&&String(x.team)!==String(career.teamCode)&&!x.retired&&!x.isRetired&&!x.myCareer&&x.source!=="MyCareer · Rival généré"&&nbaTeams.some(t=>t[0]===x.team)).sort((a,b)=>Math.abs((typeof overallRating==="function"?overallRating(a):70)-rating)-Math.abs((typeof overallRating==="function"?overallRating(b):70)-rating));let rival=candidates[0]||null;if(!rival){createNewRival(p);rival=findPlayer(career.rivalId);}if(rival){career.rivalId=rival.id;career.rivalName=rival.name;career.rivalSeasonNotice={season:career.seasonNumber,name:rival.name,team:rival.team,overall:typeof overallRating==="function"?overallRating(rival):rating,changed:String(oldId)!==String(rival.id),previousName:oldName};}return rival;}
function createNewRival(p){
 const candidates=(typeof nbaTeams!=="undefined"?nbaTeams:[]).filter(t=>t[0]!==career.teamCode),team=candidates[Math.floor(rand()*candidates.length)];
 const values=Object.fromEntries(attrs.map(x=>[x[0],clamp((Number(p.attributes[x[0]])||65)+(rand()-.5)*10,45,99)]));
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
function careerLeagueScheduleComplete(){
 return typeof seasonCalendar!=="undefined"&&!!seasonCalendar&&Array.isArray(seasonCalendar.games)&&seasonCalendar.games.length>0&&seasonCalendar.games.every(game=>game&&game.status==="completed");
}
function careerRemainingLeagueGames(){
 return typeof seasonCalendar!=="undefined"&&seasonCalendar&&Array.isArray(seasonCalendar.games)?seasonCalendar.games.filter(game=>game&&game.status!=="completed").length:0;
}
function renderCareerSimulationProgress(targetGameId){renderDashboard();}
function updateCareerSimulationProgress(game,targetGameId){if(game&&(String(game.home.code)===String(career.teamCode)||String(game.away.code)===String(career.teamCode)))renderDashboard();}
function finishCareerPlayerGame(target){
 const p=playerForCareer();if(!p)return {ok:false};
 const currentRound=Number(target.round)||0,home=target.home.code===career.teamCode,teamScore=home?target.homeScore:target.awayScore,oppScore=home?target.awayScore:target.homeScore,won=Number(teamScore)>Number(oppScore);
 career.lastRoundPlayed=currentRound;career.gamesPlayed++;
 if(won){career.wins++;career.lossStreak=0;}else{career.losses++;career.lossStreak=(career.lossStreak||0)+1;}
 const box=target.playerBoxScores||{},side=home?box.home:box.away,line=side&&side[String(p.id)]||{};
 ["pts","reb","ast","stl","blk","tov","minutes","fgm","fga","threeMade","threeAttempts","ftm","fta"].forEach(key=>career.seasonStats[key]=(Number(career.seasonStats[key])||0)+(Number(line[key])||0));
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
 const playedMinutes=clamp(Number(line.minutes)||0,0,48),endurance=clamp(Number(p.attributes&&p.attributes.stamina)||50,25,99);if(Number.isFinite(Number(p.nbaFatigue)))career.fatigue=clamp(Number(p.nbaFatigue),0,100);else{career.fatigue=clamp((Number(career.fatigue)||0)+playedMinutes*(.72-endurance*.0055)-Math.max(0,28-playedMinutes)*.45-5,0,100);p.nbaFatigue=career.fatigue;}
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
  p.myCareerMoodModifiers={consistency:(Number(career.emotions||50)-50)*.025-fatiguePenalty*.10,clutch:(Number(career.emotions||50)-50)*.04-fatiguePenalty*.07,playmaking:(Number(career.chemistry||50)-50)*.035-fatiguePenalty*.055,passing:(Number(career.chemistry||50)-50)*.035-fatiguePenalty*.055,basketballIQ:(Number(career.chemistry||50)-50)*.03-fatiguePenalty*.045,intangibles:(Number(career.popularity||50)-50)*.02-fatiguePenalty*.035,speed:-fatiguePenalty*.09,acceleration:-fatiguePenalty*.09,agility:-fatiguePenalty*.085,stamina:-fatiguePenalty*.18,shotIQ:-fatiguePenalty*.075,threePoint:-fatiguePenalty*.07,midRange:-fatiguePenalty*.065,layup:-fatiguePenalty*.065,dunk:-fatiguePenalty*.07,finishing:-fatiguePenalty*.065,offensiveIQ:-fatiguePenalty*.06,perimeterDefense:-fatiguePenalty*.065,interiorDefense:-fatiguePenalty*.065,defensiveIQ:-fatiguePenalty*.06,steal:-fatiguePenalty*.055,block:-fatiguePenalty*.06,offensiveRebound:-fatiguePenalty*.05,defensiveRebound:-fatiguePenalty*.05,ballHandle:-fatiguePenalty*.07,freeThrow:-fatiguePenalty*.04};
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
  if(careerLeagueScheduleComplete()){finishSeason();return {ok:false,finished:true};}
  simulateCareerSeason();
  return {ok:true,started:true,finishingLeague:true};
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
 renderDashboard();
 const step=()=>{
  if(!career||career.retired){career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;return;}
  if(!career.autoSeasonSimulation){career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();return;}
  if(career.pendingStory){saveCareer();renderStory();return;}
  const requestedGame=targetId&&seasonCalendar&&seasonCalendar.games.find(game=>String(game.id)===targetId);
  if(requestedGame&&requestedGame.status==="completed"){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();return;
  }
  syncCareerTeamFromPlayer(playerForCareer());
  const nextGame=nextCareerLeagueGame(targetId);
  if(!nextGame){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();
   if(!targetId&&careerLeagueScheduleComplete()){finishSeason();return;}
   renderDashboard();
   return;
  }
  const result=simulateCareerScheduledGame(nextGame);
  if(!result||!result.ok){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();
   if(result&&result.retired)renderRetirement();else renderDashboard();
   return;
  }
  if(result.playerGame)renderDashboard();
  if(career.pendingStory){saveCareer();renderStory();return;}
  if(targetId&&String(nextGame.id)===targetId){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();return;
  }
  if(!targetId&&careerLeagueScheduleComplete()){
   career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();finishSeason();return;
  }
  const progressGames=careerLeagueGamesThrough(targetId),completed=progressGames.filter(game=>game.status==="completed").length;
  if(completed%10===0||result.playerGame)saveCareer();
  setTimeout(step,20);
 };
 step();
}
function simulateCareerSeries(teamA,teamB,roundLabel,seriesIndex){
 const homePattern=[0,0,1,1,0,1,0];let winsA=0,winsB=0;const games=[];
 for(let n=0;n<7&&winsA<4&&winsB<4;n++){
  const homeIsA=homePattern[n]===0,homeTeam=homeIsA?teamA:teamB,awayTeam=homeIsA?teamB:teamA;
  const game={id:"MC-PO-"+career.seasonNumber+"-"+roundLabel+"-"+seriesIndex+"-"+(n+1),round:n+1,home:{code:homeTeam.code,name:homeTeam.name},away:{code:awayTeam.code,name:awayTeam.name},status:"scheduled"};
  let simulationResult=false;window.NBASimMyCareerSimulationInProgress=true;
  try{simulationResult=typeof window.simulateScheduledGame==="function"?window.simulateScheduledGame(game):false;}
  finally{window.NBASimMyCareerSimulationInProgress=false;}
  if(simulationResult===false||game.status!=="completed")break;
  recordCareerPlayoffLeagueStats(game,roundLabel);
  const winnerCode=Number(game.homeScore)>Number(game.awayScore)?game.home.code:game.away.code;
  games.push({game:n+1,home:game.home.name,away:game.away.name,homeScore:Number(game.homeScore)||0,awayScore:Number(game.awayScore)||0,winner:winnerCode});
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
    return {winner:null,loser:null,winsA,winsB,games,retired:true};
   }
  }
 }
 return {winner:winsA===4?teamA:winsB===4?teamB:null,loser:winsA===4?teamB:winsB===4?teamA:null,winsA,winsB,games};
}
function simulateCareerPlayoffs(){
 if(!careerLeagueScheduleComplete()){career.postseason={qualified:false,champion:null,rounds:[],incomplete:true};return;}
 if(typeof window.updateTeamSeasonAverages==="function")window.updateTeamSeasonAverages();
 const standings=Array.isArray(seasonResults)?seasonResults:[];
 const buildConference=conference=>{const rows=standings.filter(t=>t.conference===conference).slice(),known=new Set(rows.map(t=>String(t.code)));if(typeof nbaTeams!=="undefined")nbaTeams.filter(t=>t[2]===conference&&!known.has(String(t[0]))).forEach(t=>rows.push({code:t[0],name:t[1],conference,seed:99,wins:0,losses:0,diff:0}));rows.sort((a,b)=>(Number(b.wins)||0)-(Number(a.wins)||0)||(Number(b.diff)||0)-(Number(a.diff)||0)||String(a.name||a.code).localeCompare(String(b.name||b.code)));return rows.slice(0,8).map((t,i)=>Object.assign({},t,{seed:i+1}));};
 const west=buildConference("West");
 const east=buildConference("East");
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
     rounds.push({round:label,conference,teamA:matchups[i][0].name,teamB:matchups[i][1].name,winsA:result.winsA,winsB:result.winsB,winner:result.winner&&result.winner.name,games:result.games||[]});
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
   rounds.push({round:"Finale NBA",conference:"NBA",teamA:westTeams[0].name,teamB:eastTeams[0].name,winsA:final.winsA,winsB:final.winsB,winner:final.winner&&final.winner.name,games:final.games||[]});
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
function buildCareerPublicOpinionComments(entry,awards,postseason){
 const s=career.seasonStats||{},gp=Math.max(1,Number(entry&&entry.gp)||Number(s.gp)||1),ppg=Number(entry&&entry.pts)||0,rpg=Number(entry&&entry.reb)||0,apg=Number(entry&&entry.ast)||0,ovr=Number(entry&&entry.overall)||careerOverall(playerForCareer()),wins=Number(career.wins)||0,losses=Number(career.losses)||0,pop=clamp(Number(career.popularity)||50,0,100),awardList=Array.isArray(awards)?awards:[],post=postseason||career.postseason||{},champion=!!post.champion&&(String(post.champion)===String(career.teamCode)||String(post.champion)===String(career.teamName)||String(post.champion)===String(careerTeamLabel(career.teamCode))),qualified=!!post.qualified,trophy=awardList.map(a=>a.title).filter(Boolean).slice(0,3).join(", ")||"aucun trophée majeur";
 const strong=ppg>=Math.max(18,ovr*.22)||awardList.length>=2||champion,weak=(ppg<Math.max(6,ovr*.09)&&gp>=40)||(losses>wins*1.35&&ppg<12);
 const phrases=[
 ["GLAZER","Fan inconditionnel",strong?"C’est une superstar, son impact et ses récompenses parlent pour lui.":"Je le défends : il travaille et progresse à chaque saison."],
 ["HATER","Hater sur les réseaux",weak?"Il disparaît trop souvent, on attend bien mieux.":"Les fans le surestiment encore, il doit prouver sa valeur."],
 ["ANALYSTE","Analyste NBA","Avec "+ppg.toFixed(1)+" PTS, "+rpg.toFixed(1)+" REB et "+apg.toFixed(1)+" AST, son rôle est "+(ppg>=20?"celui d’une star offensive.":"encore en développement.")],
 ["FANBASE","Supporter de l’équipe",wins>=losses?"Il aide notre équipe à gagner, gardons-le !":"Le bilan collectif déçoit, il faut transformer les stats en victoires."],
 ["MÉDIAS","Chronique sportive",champion?"Champion NBA : sa saison entre dans l’histoire.":qualified?"Les playoffs ont confirmé son niveau.":"Sans playoffs, il devra relancer le récit la saison prochaine."],
 ["GLAZER","Fan des trophées",awardList.length?"Les récompenses sont là : "+trophy+".":"Il mérite une récompense, son travail est sous-estimé."],
 ["HATER","Commentaire viral",pop<35?"Popularité au plus bas : il doit reconquérir les fans.":"Les médias lui donnent trop de crédit."],
 ["ANALYSTE","Observateur du jeu","Son général de "+ovr+" implique des attentes élevées."],
 ["FAN","Fan de statistiques",ppg>=25?"25 points par match ou plus, c’est une vraie machine.":"Il doit viser une production offensive plus constante."],
 ["HATER","Critique de plateau",losses>wins?"Son équipe perd trop, les chiffres individuels ne suffisent pas.":"Je reste sceptique malgré le bilan positif."],
 ["GLAZER","Fan du clutch",ovr>=90?"Un joueur de haut niveau qui répond présent.":"Il a le potentiel pour devenir un grand."],
 ["ANALYSTE","Spécialiste défense","Ses "+(Number(entry&&entry.stl)||0).toFixed(1)+" interceptions et "+(Number(entry&&entry.blk)||0).toFixed(1)+" contres montrent son activité défensive."],
 ["FAN","Supporter optimiste",pop>=70?"La ville l’adore, sa popularité est méritée.":"Il peut encore gagner le cœur des supporters."],
 ["HATER","Rival sur Internet",ppg<12?"Il n’est pas assez productif pour son général.":"Même avec de bonnes stats, il ne porte pas assez son équipe."],
 ["GLAZER","Glazer certifié",champion?"Le titre NBA suffit à fermer toutes les critiques.":"Sa progression et son ambition sont impressionnantes."],
 ["ANALYSTE","Journaliste NBA","Le bilan "+wins+"-"+losses+" influence fortement le débat autour de lui."],
 ["FAN","Fan du vestiaire",apg>=7?"Il rend ses coéquipiers meilleurs grâce à sa création.":"Il pourrait partager davantage le ballon."],
 ["HATER","Hater anonyme",rpg<4?"Il ne domine pas assez les rebonds.":"Ses statistiques sont gonflées par son rôle."],
 ["GLAZER","Fan des highlights",ppg>=20?"Chaque match offre du spectacle.":"Même dans un rôle plus discret, il mérite du respect."],
 ["MÉDIAS","Débat télé",awardList.length>=2?"Sa collection de trophées fait parler toute la ligue.":"La saison ne lui a pas offert assez de distinctions."],
 ["FAN","Fan fidèle",pop>=50?"On croit en lui pour la suite.":"Il doit renouer avec les supporters."],
 ["ANALYSTE","Évaluateur de talents","À "+ovr+" GÉN, il "+(ovr>=90?"est un joueur franchise.":"a une marge de progression importante.")],
 ["HATER","Critique des résultats",qualified?"Il devra mieux performer en postseason.":"L’absence de playoffs est difficile à défendre."],
 ["GLAZER","Fan des records",ppg>=30?"Une saison de scoring exceptionnelle.":"Sa constance mérite d’être remarquée."],
 ["FANBASE","Voix de la communauté",pop>=80?"Il est devenu l’un des favoris de la communauté.":"Les opinions restent partagées autour de lui."]
 ];
 return phrases.map(([type,author,text],index)=>({type,sentiment:type==="GLAZER"||type==="FAN"&&pop>=50||type==="ANALYSTE"&&strong?"positive":type==="HATER"||type==="FAN"&&pop<50?"negative":"mixed",author,text,reason:"Popularité "+pop+"/100 · "+ppg.toFixed(1)+" PTS · "+wins+"-"+losses+" · "+awardList.length+" récompense(s)"+(index===4?" · playoffs "+(qualified?"qualifié":"non qualifié"):"")}));
}
function finishSeason(){
 const p=playerForCareer();if(!p||career.seasonCompleted)return;if(!careerLeagueScheduleComplete()){career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveError="La saison régulière ne peut pas se terminer avant que tous les matchs de la ligue soient simulés.";saveCareer();renderDashboard();return;}career.lastSeasonAwards=buildCareerSeasonAwards();career.lastSeasonTrades=careerBiggestTradesForSeason();career.seasonCompleted=true;career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;career.autoBatchBoxScores=[];career.autoBatchBoxIndex=0;
 try{simulateCareerPlayoffs();}catch(error){saveError="Simulation des playoffs : "+error.message;career.postseason=career.postseason||{qualified:false,champion:null,rounds:[]};}
 if(career.retired){saveCareer();renderRetirement();return;}
 if(!allPlayers().some(x=>String(x.id)===String(p.id))){career.retired=true;career.retirementReason="Carrière terminée à la suite d’une blessure.";saveCareer();renderRetirement();return;}
 if(typeof phase!=="undefined")phase="regular";
 const s=career.seasonStats||{},gp=Math.max(1,Number(s.gp)||Number(career.gamesPlayed)||0),ppg=(Number(s.pts)||0)/gp,mpg=(Number(s.minutes)||0)/gp,ovr=careerOverall(p),expectedPpg=clamp(2+(ovr-40)*.24,2,18),poorScoring=ppg<Math.max(3.5,expectedPpg*.42),attempts=Number(s.fga)||0,fgPct=attempts?(Number(s.fgm)||0)/attempts:1,poorEfficiency=attempts>=100&&fgPct<.36,poorRole=mpg>=18,stagnant=careerOverall(p)-Number(career.seasonStartOverall||careerOverall(p))<=0;
 if(poorRole&&poorScoring&&(ovr<90||stagnant||poorEfficiency||ppg<=5.5)){career.retired=true;career.firedFromNBA=true;career.retirementReason="Tu as été viré de la NBA après une saison insuffisante : "+ppg.toFixed(1)+" PPG, "+ovr+" GÉN et "+mpg.toFixed(1)+" minutes par match. Tu dois recommencer une carrière.";saveCareer();renderRetirement();return;}
 const label=seasonName(seasonYear);
 const completedPostseasonStats=Object.assign({gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0},career.postseasonStats||{});
 career.lastPostseasonStats=completedPostseasonStats;career.lastPostseason=career.postseason||null;
 const entry={season:label,team:career.teamCode,height:p.height,overall:careerOverall(p),gp:Number(s.gp)||0,pts:(Number(s.pts)||0)/gp,reb:(Number(s.reb)||0)/gp,ast:(Number(s.ast)||0)/gp,stl:(Number(s.stl)||0)/gp,blk:(Number(s.blk)||0)/gp,playoffs:career.postseason,postseasonStats:completedPostseasonStats};
 p.history=p.history||[];p.history.push(entry);career.seasonHistory.push(entry);p.age=Number(p.age||19)+1;
 if(typeof window.progress==="function"&&p.age<40)window.progress(p);
 const startAttrs=career.seasonStartAttributes||{},gains=attrs.map(([key,label])=>({key,label,delta:(Number(p.attributes&&p.attributes[key])||0)-(Number(startAttrs[key])||0)})).filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta),startOverall=Number(career.seasonStartOverall)||Number(entry.overall)||careerOverall(p),endOverall=careerOverall(p),publicOpinion=Number(career.popularity)||0;
 career.lastSeasonAwards=[...(career.lastSeasonAwards||[]),...(career.postseasonAwards||[])];career.lastSeasonRecap={season:label,overallStart:startOverall,overallEnd:endOverall,overallDelta:endOverall-startOverall,topAttributeGains:gains.slice(0,6),publicOpinion,publicOpinionLabel:publicOpinion>=80?"Très positive":publicOpinion>=60?"Positive":publicOpinion>=40?"Mitigée":publicOpinion>=20?"Négative":"Très négative",publicOpinionComments:buildCareerPublicOpinionComments(entry,career.lastSeasonAwards,career.postseason),tradeHistory:(career.tradeHistory||[]).filter(x=>x.season===label),biggestTrades:career.lastSeasonTrades||[],awards:career.lastSeasonAwards,stats:entry};
 entry.overall=endOverall;
 if(career.progression)career.progression.required=xpRequiredForNextPoint(careerOverall(p));
 p.rookie=false;p.season=seasonName(Number(seasonYear)+1);career.seasonCompleted=false;
 if(p.age>=40){career.retired=true;career.retirementReason="Retraite à 40 ans.";career.retiredAt=label;saveCareer();renderRetirement();return;}
 seasonYear=Number(seasonYear)+1;career.seasonNumber++;career.gamesPlayed=0;career.wins=0;career.losses=0;career.lossStreak=0;career.lastRoundPlayed=0;
 career.seasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,minutes:0,gp:0};career.postseasonStats={pts:0,reb:0,ast:0,stl:0,blk:0,minutes:0,gp:0};career.lastGame=null;career.storyInterval=0;career.pendingStory=false;career.pendingStoryMonth=null;career.lastStoryMonth="";career.lastPlayedMonth="";career.fatigue=0;p.nbaFatigue=0;career.seasonStartOverall=careerOverall(p);career.seasonStartAttributes=Object.assign({},p.attributes||{});
 if(typeof initializeSeasonCalendar==="function")initializeSeasonCalendar();
 if(typeof phase!=="undefined")phase="regular";
 saveCareer();
 const recap=career.lastSeasonRecap||{},gainsMarkup=(recap.topAttributeGains||[]).map(x=>'<li>'+escHtml(x.label)+' : +'+x.delta+'</li>').join("")||'<li>Aucun attribut n’a progressé.</li>',tradeMarkup=(recap.tradeHistory||[]).map(x=>'<li>'+escHtml(careerTeamLabel(x.from))+' → '+escHtml(careerTeamLabel(x.to))+'</li>').join("")||'<li>Aucun changement d’équipe cette saison.</li>',opinionMarkup=(recap.publicOpinionComments||[]).map(x=>'<article class="mc-season-award"><span>'+(x.type==="GLAZER"?"😍":x.type==="HATER"?"🧂":"🎙️")+"</span><div><b>"+escHtml(x.type+" · "+x.author)+"</b><strong>"+escHtml(x.text)+"</strong><small>"+escHtml(x.reason)+"</small></div></article>").join("")||'<p class="mc-muted">Aucune réaction enregistrée.</p>',awardMarkup=(recap.awards||[]).map(x=>'<article class="mc-season-award"><span>'+escHtml(x.icon||"🏆")+'</span><div><b>'+escHtml(x.title)+'</b><strong>'+escHtml(x.name)+'</strong><small>'+escHtml(careerTeamLabel(x.team))+' · '+escHtml(x.detail||"")+'</small></div></article>').join("")||'<p class="mc-muted">Aucune récompense calculable cette saison.</p>',biggestTradesMarkup=(recap.biggestTrades||[]).map((x,i)=>{const outgoing=(x.outgoing||[]).map(p=>escHtml(p.name)+" (GÉN "+Number(p.ovr||0)+")").join(", ")||escHtml(x.headlinePlayer||"—"),incoming=(x.incoming||[]).map(p=>escHtml(p.name)+" (GÉN "+Number(p.ovr||0)+")").join(", ")||"—";return '<tr><td>'+(i+1)+'</td><td>'+escHtml(careerTeamLabel(x.from))+' ↔ '+escHtml(careerTeamLabel(x.to))+'</td><td>'+outgoing+'</td><td>'+incoming+'</td><td>'+escHtml(x.headlinePlayer||"—")+' · '+Number(x.headlineValue||0)+'</td></tr>';}).join(""),rounds=career.lastPostseason&&career.lastPostseason.rounds||[],phaseNames=["Premier tour","Demi-finales","Finales de conférence","Finale NBA"],phaseMarkup='<div class="mc-playoff-bracket">'+phaseNames.map((name,phaseIndex)=>{const rows=rounds.filter(x=>x.round===name);return '<section class="mc-card mc-playoff-round"><h3>'+name+'</h3>'+(rows.length?rows.map((x,i)=>'<button type="button" class="mc-playoff-series" data-mc-playoff-series="'+phaseIndex+'-'+i+'"><small>'+escHtml(x.conference||"NBA")+'</small><b>'+escHtml(x.teamA)+' <span>'+x.winsA+'–'+x.winsB+'</span> '+escHtml(x.teamB)+'</b><em>Champion de série : '+escHtml(x.winner||"série incomplète")+'</em></button>').join(""):'<p class="mc-muted">Aucune série disputée dans cette phase.</p>')+'<p class="mc-muted mc-playoff-detail" id="mcPlayoffDetail'+phaseIndex+'">Clique une série pour afficher son résumé.</p></section>';}).join("")+'</div>',postseasonText=career.postseason&&career.postseason.qualified?"Qualifié en playoffs":"Non qualifié pour les playoffs";
 const championText=career.postseason&&career.postseason.champion?career.postseason.champion:"aucun champion déterminé";
 const playoffGames=career.lastPostseasonStats&&career.lastPostseasonStats.gp||0;
 const playoffPoints=career.lastPostseasonStats&&career.lastPostseasonStats.pts||0;
 render(header("FIN DE SAISON","Saison "+label+" terminée")+
  '<div class="mc-card"><div class="mc-kicker">BILAN DE TA SAISON</div><h2>'+label+'</h2>'+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+entry.overall+'</strong><span>GÉN final</span></div><div class="mc-metric"><strong>'+entry.pts.toFixed(1)+'</strong><span>PTS / match</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs joués</span></div></div>'+
  '<p class="mc-muted">'+postseasonText+'. Champion NBA : '+escHtml(championText)+'. Tes playoffs : '+playoffGames+' MJ · '+playoffPoints+' PTS.</p>'+
  '<div class="mc-grid three"><div class="mc-metric"><strong>'+recap.overallStart+' → '+recap.overallEnd+'</strong><span>Progression du général ('+(recap.overallDelta>=0?"+":"")+recap.overallDelta+')</span></div><div class="mc-metric"><strong>'+recap.publicOpinion+'/100</strong><span>Opinion publique · '+escHtml(recap.publicOpinionLabel||"Mitigée")+'</span></div><div class="mc-metric"><strong>'+entry.gp+'</strong><span>Matchs de saison régulière</span></div></div>'+
  '<div class="mc-card"><h3>🏆 Récompenses et trophées de la saison</h3><div class="mc-season-awards">'+awardMarkup+'</div></div><div class="mc-card"><h3>📣 Opinion publique · Haters et glazers</h3><p class="mc-muted">Réactions basées sur tes statistiques, le bilan collectif, les trophées et les playoffs.</p><div class="mc-season-awards">'+opinionMarkup+'</div></div>'+
  '<div class="mc-card"><h3>Les plus gros trades de la saison</h3>'+(biggestTradesMarkup?'<div class="mc-table-wrap"><table class="mc-box-table"><thead><tr><th>#</th><th>Équipes</th><th>Joueurs envoyés</th><th>Joueurs reçus</th><th>Joueur vedette · valeur</th></tr></thead><tbody>'+biggestTradesMarkup+'</tbody></table></div>':'<p class="mc-muted">Aucun échange enregistré cette saison.</p>')+'<h3>Tes changements d’équipe</h3><ul>'+tradeMarkup+'</ul><h3>Attributs les plus améliorés</h3><ul>'+gainsMarkup+'</ul><p class="mc-muted">Statistiques saison régulière : '+entry.pts.toFixed(1)+' PTS · '+entry.reb.toFixed(1)+' REB · '+entry.ast.toFixed(1)+' AST · '+entry.stl.toFixed(1)+' STL · '+entry.blk.toFixed(1)+' BLK.</p></div>'+
  '<h2>Parcours complet des playoffs</h2>'+phaseMarkup+
  '<p class="mc-muted">Ton âge passe à '+p.age+' ans. Tes attributs évoluent selon ton développement, ton potentiel et ton âge.</p>'+
  '<div class="mc-actions"><button class="mc-btn primary" id="mcNextSeason">Préparer la prochaine saison →</button></div></div>');
 attachReturn();root.querySelectorAll("[data-mc-playoff-series]").forEach(button=>button.onclick=()=>{const parts=button.dataset.mcPlayoffSeries.split("-"),detail=$("mcPlayoffDetail"+parts[0]),card=button;if(detail)detail.textContent=card.querySelector("b").textContent+" · "+card.querySelector("em").textContent+" · Série au meilleur de 7 (résultats de la saison terminée).";});
 $("mcNextSeason").onclick=()=>{
  const p=playerForCareer(),rival=refreshCareerRivalForSeason(p),notice=career.rivalSeasonNotice||[],label=notice.changed?"Un nouveau rival t’est attribué cette saison.":"Ton rival poursuit la rivalité cette saison.",eligible=(typeof nbaTeams!=="undefined"?nbaTeams:[]).filter(team=>String(team[0])!==String(career.teamCode)),offerTeam=eligible.length?eligible[Math.floor(rand()*eligible.length)]:null;
  career.offseasonTradeOffer=rand()<.45&&offerTeam?{teamCode:String(offerTeam[0]),teamName:String(offerTeam[1]),season:seasonName(seasonYear),reason:careerOverall(p)>=85?"Une franchise veut bâtir autour de ton talent.":"Une équipe cherche à renforcer sa rotation avec toi."}:null;saveCareer();
  const offer=career.offseasonTradeOffer,offerMarkup=offer?'<div class="mc-result"><div class="mc-kicker">📨 OFFRE DE TRADE · INTERSAISON</div><h2>'+escHtml(offer.teamName)+' ('+escHtml(offer.teamCode)+')</h2><p class="mc-muted">'+escHtml(offer.reason)+' Tu peux accepter l’échange ou rester avec '+escHtml(career.teamName)+'.</p><div class="mc-actions"><button class="mc-btn primary" id="mcAcceptTrade">Accepter le trade →</button><button class="mc-btn secondary" id="mcDeclineTrade">Refuser et rester</button></div></div>':'<div class="mc-card"><div class="mc-kicker">INTERSAISON · AUCUNE OFFRE DE TRADE</div><p class="mc-muted">Aucune franchise n’a formulé d’offre cette fois-ci. Tu restes avec '+escHtml(career.teamName)+'.</p><button class="mc-btn primary" id="mcBeginNewSeason">Commencer la saison →</button></div>';
  render(header("TON RIVAL · SAISON "+career.seasonNumber,"Nouvelle saison NBA")+'<div class="mc-card"><div class="mc-kicker">RIVAL OFFICIEL</div><h2>'+escHtml(rival&&rival.name||"Rival à déterminer")+'</h2><p class="mc-muted">'+escHtml(rival&&rival.team||"NBA")+' · GÉN '+(rival&&typeof overallRating==="function"?overallRating(rival):"—")+'</p><p class="mc-muted">'+label+(notice.changed&&notice.previousName?" Rival précédent : "+escHtml(notice.previousName)+".":"")+'</p></div>'+offerMarkup);
  attachReturn();
  const begin=()=>{career.offseasonTradeOffer=null;saveCareer();renderDashboard();};
  if($("mcBeginNewSeason"))$("mcBeginNewSeason").onclick=begin;
  if($("mcDeclineTrade"))$("mcDeclineTrade").onclick=begin;
  if($("mcAcceptTrade"))$("mcAcceptTrade").onclick=()=>{const player=playerForCareer(),offer=career.offseasonTradeOffer;if(!player||!offer)return;const oldCode=String(career.teamCode||player.team);player.previousTeam=oldCode;player.team=String(offer.teamCode);secureCareerRoster(player);syncCareerTeamFromPlayer(player);career.offseasonTradeOffer=null;saveCareer();renderDashboard();};
 };
}
function renderRetirement(){
 career=career||{};career.retired=true;saveCareer();const p=playerForCareer()||career.player||{};
 render(header(career.firedFromNBA?"TU AS ÉTÉ VIRÉ DE LA NBA":career.careerEndingInjury?"FIN DE CARRIÈRE · BLESSURE CATASTROPHIQUE":"FIN DE CARRIÈRE",career.firedFromNBA?"Tes performances n’ont pas été suffisantes pour conserver ta place.":career.careerEndingInjury?"Une blessure catastrophique met fin à ton parcours NBA.":"Ton histoire NBA restera dans les archives.")+'<div class="mc-retirement"><div style="font-size:70px">'+(career.firedFromNBA?"🏀":career.careerEndingInjury?"🩼":"🏆")+'</div><div class="mc-kicker">'+(career.firedFromNBA?"MYCAREER · FIN DE CONTRAT":career.careerEndingInjury?"MYCAREER · BLESSURE FATALE":"MYCAREER · HALL OF FAME")+'</div><h2 class="mc-title" style="font-size:clamp(28px,4vw,46px)">'+escHtml(p.name||"Ta carrière")+'</h2><p class="mc-muted">'+(career.retirementReason||"Fin de carrière")+'</p><p class="mc-muted">Saisons terminées : '+(career.seasonHistory||[]).length+' · Dernière équipe : '+(career.teamCode||"—")+'</p><div class="mc-actions" style="justify-content:center"><button class="mc-btn primary" id="mcCareerHome">'+(career.firedFromNBA?"Recommencer une carrière":"Retour à MyCareer")+'</button><button class="mc-btn secondary" id="mcTitle">Écran de départ</button></div></div>');
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
 document.addEventListener("keydown",event=>{if(event.key!=="Backspace"||activeMode!=="career"||!career||career.autoSeasonSimulation!==true)return;const target=event.target;if(target&&(/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)||target.isContentEditable))return;event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();career.autoSeasonSimulation=false;career.autoSimulationTargetGameId=null;saveCareer();renderDashboard();},true);
 installMyCareerIsolation();installCareerOverall();mygmSnapshot=loadGMStored();if(typeof window.NBASimCaptureMyGMState==="function"){try{launcherSnapshot=window.NBASimCaptureMyGMState();}catch(_){launcherSnapshot=null;}}const gm=$("myGMStart");if(gm)gm.hidden=true;showPicker();installMenuReturn();
 const observer=new MutationObserver(()=>installMenuReturn());observer.observe(document.body,{childList:true,subtree:true});
 window.NBASimMyCareerStoryOutcome=storyChoiceOutcome;window.NBASimMyCareerStoryCount=stories.length;window.NBASimMyCareerBuildSaveSnapshot=buildCareerSaveData;window.NBASimMyCareerNextLeagueGame=nextCareerLeagueGame;window.NBASimMyCareerSave=saveCareer;window.NBASimMyCareerState=()=>career;window.NBASimMyCareerHoldIntervalMs=ATTRIBUTE_HOLD_INTERVAL_MS;window.NBASimMyCareerXPRequired=xpRequiredForNextPoint;window.NBASimMyCareerXPFromStats=careerXPFromStats;window.NBASimReturnToModePicker=function(){activeMode="launcher";root.hidden=true;showPicker();};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();