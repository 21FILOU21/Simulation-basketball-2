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
assert.match(career, /function careerMonthForScheduledGame\(/, "Monthly events should follow the player's own schedule month.");
assert.match(career, /upcomingPlayerGame=nextPlayerGame\(\),monthEnded/, "Monthly events should trigger when the player's schedule changes stage.");
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

const storyMatch = career.match(/const stories=(\[[\s\S]*?\]);\s*stories\.push\(([\s\S]*?)\);\s*const STORY_RISK_REWARD/);
assert.ok(storyMatch, "The MyCareer story library should be a JSON-compatible array.");
const storyLibrary = JSON.parse(storyMatch[1]);
const storyExtensionCount = (storyMatch[2].match(/\{title:/g) || []).length;
assert.ok(storyLibrary.length + storyExtensionCount >= 33, "There should be at least 33 different story events after the new story pack.");
assert.equal(storyExtensionCount, 7, "The new story pack should add seven events, including the extreme injury event.");
assert.equal((storyMatch[2].match(/choices:\[/g) || []).length, 7, "Each added event should include its own choices.");
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
const seasonCalendar = {games:[]};
const context = { document, window, localStorage, seasonCalendar, MutationObserver, console, confirm(){return true;}, setTimeout, clearTimeout };
vm.runInNewContext(career, context, { filename: "src/mycareer-mode.js" });
assert.equal(typeof domReady, "function", "MyCareer should install on DOMContentLoaded.");
domReady();
assert.equal(typeof window.NBASimMyCareerXPRequired, "function");
assert.equal(typeof window.NBASimMyCareerXPFromStats, "function");
assert.equal(window.NBASimMyCareerXPRequired(90), 531, "At 90 OVR, the next attribute point should require about five solid games.");
assert.equal(window.NBASimMyCareerStoryCount, 33, "MyCareer should expose all 33 story events.");
assert.equal(typeof window.NBASimMyCareerStoryOutcome, "function", "Story outcomes should be independently testable.");
const highRiskStory = window.NBASimMyCareerStoryOutcome(26, 0, {e:{}});
assert.equal(highRiskStory.attributes.clutch, 4, "A high-reward story choice must apply all four attribute points.");
assert.equal(highRiskStory.social.emotions, 4, "A high-reward story choice must apply all four social points.");
assert.equal(highRiskStory.capIncrease.clutch, 2, "A high-reward story choice must raise the attribute ceiling by two.");
assert.equal(highRiskStory.injuryRisk, 18, "High-intensity choices must carry a visible injury risk.");
const catastrophicChoice = window.NBASimMyCareerStoryOutcome(32, 0, {e:{}});
assert.equal(catastrophicChoice.careerEnding, true, "The extreme story choice must explicitly carry a career-ending injury possibility.");
assert.equal(catastrophicChoice.injuryRisk, 95, "The extreme story choice must have a very high injury risk before durability mitigation.");
assert.ok(career.includes("-durability*.35"), "Durability must reduce story injury risk.");
assert.match(career, /career-retirement|career-ending/, "MyCareer must support a career-ending injury state.");
assert.equal(typeof window.NBASimMyCareerBuildSaveSnapshot, "function", "MyCareer should expose its complete save snapshot builder.");
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
seasonCalendar.games = [
  {id:"same-round-after",round:2,status:"scheduled"},
  {id:"target-game",round:2,status:"scheduled"},
  {id:"round-one-next",round:1,status:"scheduled"},
  {id:"round-one-done",round:1,status:"completed"}
];
assert.equal(window.NBASimMyCareerNextLeagueGame("target-game").id, "round-one-next", "The earliest unplayed league game must be selected first.");
seasonCalendar.games.find(game=>game.id==="round-one-next").status="completed";
assert.equal(window.NBASimMyCareerNextLeagueGame("target-game").id, "same-round-after", "Games before the clicked game on its round must be simulated in schedule order.");
seasonCalendar.games.find(game=>game.id==="same-round-after").status="completed";
assert.equal(window.NBASimMyCareerNextLeagueGame("target-game").id, "target-game", "The clicked game must be the final game in the queue.");
seasonCalendar.games.find(game=>game.id==="target-game").status="completed";
assert.equal(window.NBASimMyCareerNextLeagueGame("target-game"), null, "Games scheduled after the clicked game must remain untouched.");

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


assert.match(career, /function careerLeagueGamesThrough\(/, "Calendar simulation should build a chronological game queue.");
assert.match(career, /function nextCareerLeagueGame\(/, "MyCareer should select only the next uncompleted league game.");
assert.match(career, /function simulateCareerScheduledGame\(/, "Each calendar game should be simulated independently.");
assert.match(career, /setTimeout\(step,20\)/, "Sequential simulation should yield between individual league games.");
assert.match(career, /function renderCareerSimulationProgress\(targetGameId\)\{renderDashboard\(\);\}/, "Season simulation should remain on the calendar instead of opening a progress screen.");
assert.doesNotMatch(career, /id="mcSimulationScore"|id="mcSimulationCounter"|id="mcSimulationProgressBar"|id="mcSimulationResultTile"/, "The league-wide loading meter and other-team scores must be absent.");
assert.match(career, /mcStopSimulation/, "The user should be able to stop a running simulation.");


assert.match(career, /function buildCareerSaveData\(/, "Save files should capture the full MyCareer state.");
assert.match(career, /function renderCareerSaveManager\(/, "MyCareer should display a save manager.");
assert.match(career, /careerSaveSlots=Array\(10\)\.fill\(null\)/, "The save manager should contain ten slots.");
assert.match(career, /mycareer-slot-/ , "Each slot should have its own JSON file.");
assert.match(career, /window\.showDirectoryPicker/, "Players should choose a Windows destination folder.");
assert.match(career, /CAREER_SAVE_DB/, "The selected directory handle should be persisted in IndexedDB.");
assert.match(career, /function careerSavePlayerCard\(/, "Save previews should show complete roster player details.");
assert.match(career, /mcCreateCareerSave/, "The save manager should offer creation when no slot is selected.");
assert.match(career, /data-load-slot/, "Existing career saves should be loadable.");
assert.match(career, /data-save-slot/, "Existing career saves should be replaceable.");
assert.match(career, /storyGainText\(v\)/, "Story previews should show exact gains of four or more.");
assert.match(career, /socialGains/, "Story options should preview emotion, chemistry and popularity gains.");
assert.match(career, /effectiveInjuryRisk/, "High-fatigue story choices should increase injury probability.");
console.log("OK — MyCareer : XP, attributs, histoires, blessures, sauvegardes, box scores et isolation MyGM.");

assert.match(career, /function applyPhysiqueBaseline\(/, "Body measurements should directly adjust starting attributes.");
assert.match(career, /function renderCareerLeagueLeaders\(/, "MyCareer should include League Leaders.");
assert.match(career, /function renderCareerCalendarMarkup\(/, "MyCareer should show the 82-game schedule as a calendar grid.");
assert.match(career, /mc-calendar-grid/, "The schedule should render monthly game tiles.");
assert.match(career, /career\.firedFromNBA/, "Dynamic NBA job security should provide a dismissal ending.");
assert.match(career, /career\.tradeHistory/, "MyCareer should record team changes for the season recap.");
assert.match(career, /topAttributeGains/, "The end-of-season recap should show the most improved attributes.");
assert.match(career, /publicOpinionLabel/, "The end-of-season recap should show public opinion.");
assert.match(career, /rounds\.filter\(x=>x\.round===name\)/, "The postseason recap should display each playoff phase separately.");
assert.match(career, /setTimeout\(step,20\)/, "Full-season simulation should yield between games to avoid blocking the UI.");
assert.match(career, /GÉN après améliorations/, "Attribute allocation should show the preview overall.");
assert.match(career, /"SHOOTING".*"DEFENSE".*"REBOND".*"FINITION".*"ORGANISATION".*"QUALITÉ ATHLÉTIQUE"/, "Attribute categories should follow the requested NBA 2K organization.");

assert.match(career, /function physiqueAttributeCap\(/, "Physical measurements should change each player's attribute ceilings.");
assert.match(career, /const STORY_RISK_REWARD=/, "Story choices should include risk/reward variants.");
assert.match(career, /capIncrease/, "Story choices should be able to increase an attribute ceiling.");
assert.match(career, /career\.fatigue=clamp/, "Story choices and matches should update player fatigue.");
assert.match(career, /myCareerMoodModifiers=.*fatiguePenalty/, "Fatigue should impact in-game attributes.");
assert.match(career, /function simulateCareerCalendarTarget\(/, "Calendar tiles should simulate through the selected game.");
assert.match(career, /data-mc-calendar-game/, "Calendar games should be clickable controls.");
assert.match(career, /function renderCareerCalendarGameBoxScore\(/, "Previously played calendar games should open their box score.");
assert.match(career, /function careerBiggestTradesForSeason\(/, "Season recap should collect the league's biggest trades.");
assert.match(career, /function buildCareerSeasonAwards\(/, "Season recap should display award winners.");
assert.match(career, /function recordCareerPlayoffLeagueStats\(/, "Playoff games should record league-wide player stats.");
assert.match(career, /function buildCareerFinalsMvp\(/, "The recap should include Finals MVP.");

assert.match(career, /function renderCareerStoryOverview\(player\)/, "The story menu should show the player's current profile.");
assert.match(career, /ENTENTE D’ÉQUIPE/, "The story overview should show team chemistry.");
assert.match(career, /POPULARITÉ/, "The story overview should show popularity.");
assert.match(career, /ÉMOTIONS/, "The story overview should show emotions.");
assert.match(career, /CAREER_ATTRIBUTE_SECTIONS\.map/, "The story overview should render grouped attributes.");
assert.match(career, /mc-story-attribute-row/, "Every story attribute should display its current level and ceiling.");
const careerSimulationBlock = career.slice(career.indexOf("function simulateCareerSeason(options)"), career.indexOf("function simulateCareerSeries(", career.indexOf("function simulateCareerSeason(options)")));
assert.equal((careerSimulationBlock.match(/if\(career\.pendingStory\)\{saveCareer\(\);renderStory\(\);return;\}/g)||[]).length, 3, "Every monthly-story pause should show the story menu directly.");
assert.doesNotMatch(careerSimulationBlock, /if\(career\.pendingStory\)\{saveCareer\(\);renderLastBoxScore\(\);return;\}/, "A monthly-story pause must not show a box score.");

assert.match(career, /window\.NBASimActualPlayerStats/, "League Leaders should use raw season box-score totals.");
assert.match(career, /threeAttempts\?x\.threeMade\/x\.threeAttempts\*100/, "League Leaders should calculate current-season 3P percentage.");
assert.match(career, /Statistiques réelles · Saison/, "League Leaders should identify the active season.");

assert.match(career, /\$\("mcContinue"\)\.onclick=\(\)=>openCareerSaveManager\(\)/, "Continue MyCareer should open a save chooser directly.");
assert.match(career, /mcLoadQuickCareer/, "The save chooser should allow loading the browser quick-save.");
assert.match(career, /mcCareerAttributePanels" hidden/, "Player attributes should be hidden until explicitly revealed.");
assert.match(career, /mcRevealAttributes/, "Player attributes should have a reveal toggle.");
assert.match(career, /playedMinutes\*\(\.72-endurance\*\.0055\)/, "Post-game fatigue should depend on minutes and endurance.");
assert.match(career, /fatiguePenalty\*\.10/, "Fatigue should have a substantial in-game performance effect.");
assert.match(career, /refreshCareerRivalForSeason/, "The rival should be recalculated and introduced every season.");
assert.match(career, /career\.rivalSeasonNotice/, "Seasonal rival changes should be recorded for the introduction screen.");
assert.match(career, /const buildConference=conference/, "The playoff bracket should select eight teams per conference.");
assert.match(career, /careerOverall\(myPlayer\)>=90/, "Elite MyCareer players should not be repeatedly left out of postseason.");
const opinionBlock = career.slice(career.indexOf("function buildCareerPublicOpinionComments("), career.indexOf("function finishSeason(", career.indexOf("function buildCareerPublicOpinionComments(")));
assert.equal((opinionBlock.match(/\["(?:GLAZER|HATER|ANALYSTE|FANBASE|MÉDIAS|FAN)",/g) || []).length, 25, "Public opinion should offer 25 distinct comments based on player and season context.");

assert.match(career, /if\(!career\.autoSeasonSimulation\)\{career\.autoSimulationTargetGameId=null;saveCareer\(\);renderDashboard\(\);return;\}/, "Stopping the simulation should prevent the next queued game from starting.");
assert.match(career, /-careerOverall\(draftPlayer\)/, "The initial rival should be selected relative to the drafted player's overall.");

assert.match(career, /id="mcContinue">Continuer ma carrière/, "Continue should remain available to select an external save even when local quick-save is empty.");

assert.match(html, /categories\[key\]!=null&&categories\[key\]!==\x27\x27&&Number\.isFinite\(Number\(categories\[key\]\)\)/, "Null category ratings should render as empty inputs, not the string null.");
assert.match(html, /attrs\[key\]!=null&&attrs\[key\]!==\x27\x27&&Number\.isFinite\(Number\(attrs\[key\]\)\)/, "Null individual ratings should render as empty inputs.");
assert.match(html, /values\.totalAttributes!=null&&values\.totalAttributes!==\x27\x27&&Number\.isFinite\(Number\(values\.totalAttributes\)\)/, "Null total attributes should render as an empty input.");
