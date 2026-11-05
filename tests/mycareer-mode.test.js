const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const career = fs.readFileSync(path.join(root, "src", "mycareer-mode.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /src="src\/mycareer-mode\.js"/);
assert.match(html, /\['intangibles',\s*'Intangibles'\]/);
assert.match(html, /midRange:\['midRange'\]/);
assert.match(html, /intangibles:\['intangibles'\]/);
assert.match(html, /intangibles:\s*1\.55/);
assert.match(html, /value !== null && value !== undefined && value !== ''/);

for (const contract of [
  "MyCareer", "MyGM", "Meneur organisateur", "Ailier 3&D", "Pivot protecteur de cercle",
  "buildBudget", "draftScore", "simulateScheduledGame", "ensureCareerLeague", "secureCareerRoster", "NBASimCaptureMyGMState", "NBASimRestoreMyGMState",
  "lossStreak>=4", "seasonStats", "pendingStory", "localStorage", "p.age>=40",
  "emotions", "chemistry", "popularity", "rivalId"
]) {
  assert.ok(career.includes(contract), "MyCareer must include: " + contract);
}

const profileKeys = [...career.matchAll(/(?:core|secondary):\[([^\]]+)\]/g)]
  .flatMap(match => [...match[1].matchAll(/"([^"]+)"/g)].map(item => item[1]));
const mainAttributeKeys = new Set(
  [...html.matchAll(/\['([A-Za-z]+)',\s*'[^']+'\]/g)].map(match => match[1])
);
for (const key of new Set(profileKeys)) {
  assert.ok(mainAttributeKeys.has(key), "Specialty references unsupported attribute: " + key);
}


const vm = require("node:vm");

assert.match(career, /function simulateCareerSeason\(/, "MyCareer should offer a full-season simulation.");
assert.match(career, /career\.gamesPlayed%storyInterval===0/, "Narrative choices should occur on the five-game cadence.");
assert.match(career, /function awardCareerXP\(/, "Every played game should award XP.");
assert.match(career, /function careerXPFromStats\(/, "XP should be based on the player's box-score production.");
assert.match(career, /function xpRequiredForNextPoint\(/, "XP requirements should grow with overall rating.");
assert.match(career, /function captureCareerBoxScore\(/, "The completed match should retain both team box scores.");
assert.match(career, /function renderCareerBoxScoreSide\(/, "The postgame UI should show complete team stat tables.");
assert.match(career, /function installMyCareerIsolation\(/, "MyGM simulation must be guarded during MyCareer.");
assert.match(career, /NBASimMyCareerSimulationInProgress/, "Only MyCareer's own simulation calls may pass the guard.");
assert.match(career, /mc-attribute-preview/, "Attribute upgrades should show a grey preview.");
assert.match(career, /mc-attribute-locked/, "Unreachable attribute levels should be dark grey.");
assert.match(career, /Acheter les améliorations/, "Attribute points should be purchased explicitly.");
assert.match(career, /mc-xp-track/, "The attribute screen should contain the XP progress bar.");

const storyMatch = career.match(/const stories=(\[[\s\S]*?\]);\s*function renderStory/);
assert.ok(storyMatch, "The MyCareer story library should be a JSON-compatible array.");
const storyLibrary = JSON.parse(storyMatch[1]);
assert.ok(storyLibrary.length >= 25, "There should be at least 25 different story events.");
assert.ok(storyLibrary.every(story => story.choices.length >= 3), "Each story should offer at least three choices.");
assert.ok(storyLibrary.every(story => new Set(story.choices.map(choice => choice.label)).size === story.choices.length), "Story choices should be distinct.");

const elements = new Map();
const fakeElement = id => {
  if (!elements.has(id)) elements.set(id, { id, hidden: false, dataset: {}, style: {}, classList: { add(){}, remove(){}, toggle(){} }, appendChild(){}, querySelector(){return null;}, contains(){return false;} });
  return elements.get(id);
};
let domReady = null;
const document = {
  readyState: "loading",
  documentElement: { dataset: {} },
  head: { appendChild(){} },
  body: { style: {}, classList: { add(){}, remove(){}, toggle(){} }, appendChild(){} },
  createElement(tag) { const element=fakeElement("created-"+elements.size);element.tagName=tag;element.textContent="";element.innerHTML="";element.contains=node=>!!(node&&node.insideMyCareerRoot);return element; },
  getElementById(id) { return fakeElement(id); },
  querySelector() { return null; },
  addEventListener(type, callback) { if(type==="DOMContentLoaded")domReady=callback; else if(type==="click")this.clickGuard=callback; }
};
const localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
let simulationCalls=0;
const window = { simulateScheduledGame(){simulationCalls++;return true;}, NBASimCaptureMyGMState:null };
class MutationObserver { observe(){} }
const context = { document, window, localStorage, MutationObserver, console, confirm(){return true;}, setTimeout, clearTimeout };
vm.runInNewContext(career, context, { filename: "src/mycareer-mode.js" });
assert.equal(typeof domReady, "function", "MyCareer should install on DOMContentLoaded.");
domReady();
assert.equal(typeof window.NBASimMyCareerXPRequired, "function");
assert.equal(typeof window.NBASimMyCareerXPFromStats, "function");
assert.equal(window.NBASimMyCareerXPRequired(90), 531, "At 90 OVR, the next attribute point should require about five solid games.");
const averageLine = {pts:20,reb:5,ast:5,stl:1,blk:0.5,minutes:32,tov:2};
const averageXp = window.NBASimMyCareerXPFromStats(averageLine, true);
assert.ok(averageXp >= 95 && averageXp <= 125, "A representative strong game should award roughly 100–120 XP.");
assert.ok(window.NBASimMyCareerXPFromStats({...averageLine,pts:30,reb:12,ast:10,stl:3,blk:2,minutes:40}, true) > averageXp, "Better box-score performances should award more XP.");
elements.get("mcChooseCareer").onclick();
assert.equal(window.NBASimIsMyCareerActive(), true);
assert.equal(window.simulateScheduledGame({}), false, "A MyGM simulation must be rejected while MyCareer is active.");
window.NBASimMyCareerSimulationInProgress = true;
assert.equal(window.simulateScheduledGame({}), true, "MyCareer's own authorised simulation should still work.");
window.NBASimMyCareerSimulationInProgress = false;
assert.equal(simulationCalls, 1);
let stopped = false;
document.clickGuard({target:{},preventDefault(){stopped=true;},stopPropagation(){},stopImmediatePropagation(){}});
assert.equal(stopped, true, "Clicks outside MyCareer must be blocked while the mode is active.");


assert.match(career, /function simulateCareerSeason\(options\)/, "Season simulation should support resuming automatically.");
assert.match(career, /resumeSimulation=career\.autoSeasonSimulation===true/, "Story choices should resume a running season simulation without another click.");
assert.match(career, /career\.autoBatchBoxScores\.push/, "Automatic simulation should retain a box score for every player game in the batch.");
assert.match(career, /mcBoxPrevious/);
assert.match(career, /mcBoxNext/);
assert.match(career, /function renderCareerTeam\(/, "MyCareer should include a roster screen.");
const teamScreen = career.slice(career.indexOf("function renderCareerTeam("), career.indexOf("function renderDashboard(", career.indexOf("function renderCareerTeam(")));
assert.match(teamScreen, /EFFECTIF NBA · LECTURE SEULE/);
assert.doesNotMatch(teamScreen, /<input|data-minutes|data-release|data-tendency|mynbaSubmitTrade/, "MyCareer team roster must not expose MyGM management controls.");
assert.match(career, /function showCareerBaseChoice\(/, "New careers should ask which player database to load.");
assert.match(career, /Charger les joueurs de la démo/);
assert.match(career, /Charger les joueurs d’une sauvegarde/);
assert.match(career, /function prepareCareerPlayerBase\(/, "Demo/save players should be normalized while preserving NBA team codes.");
assert.match(career, /careerBaseSource/);
assert.match(career, /const ATTRIBUTE_HOLD_INTERVAL_MS=50/);
assert.match(career, /setInterval\([\s\S]*?ATTRIBUTE_HOLD_INTERVAL_MS\)/, "Holding an attribute arrow should repeat every 50ms.");
assert.match(career, /if\(addSingle&&session\.ticks===0\)addPendingAttributePoint/, "A quick click/release should add exactly one point.");
assert.match(career, /event\.detail===0/, "Keyboard activation should add one attribute point.");
assert.match(career, /pointerup/);
assert.match(career, /window\.NBASimMyCareerHoldIntervalMs=ATTRIBUTE_HOLD_INTERVAL_MS/);

console.log("OK — MyCareer : XP, attributs, histoires, box scores et isolation MyGM.");
