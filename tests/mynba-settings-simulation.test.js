const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const settings = fs.readFileSync(path.join(root, "src", "mynba-settings-simulation.js"), "utf8");
const gm = fs.readFileSync(path.join(root, "src", "mynba-gm.js"), "utf8");
const presentation = fs.readFileSync(path.join(root, "src", "season-presentation.js"), "utf8");
const nav = fs.readFileSync(path.join(root, "src", "mynba-navigation.js"), "utf8");

new Function(settings);
new Function(gm);
new Function(presentation);
new Function(nav);

assert.match(html, /src="src\/mynba-settings-simulation\.js"/, "Settings module must be loaded.");
assert.match(html, /simulationSettings: window\.NBASimSimulationSettings/, "Primary save must persist simulation settings.");
assert.match(html, /savedState\.simulationSettings[\s\S]*?window\.NBASimSimulationSettings/, "Loading a save must restore simulation settings.");
assert.match(html, /savedState\.draftState[\s\S]*?window\.NBASimDraftState/, "Loading a save must restore an interrupted draft.");
assert.match(nav, /simulationSettings:window\.NBASimSimulationSettings/, "MyNBA save export must persist simulation settings.");
assert.match(nav, /draftState:window\.NBASimDraftState/, "MyNBA save export must persist an interrupted draft.");
assert.match(nav, /i===cats\.length&&\$\("mynbaSimulationSettingsCard"\)/, "Settings must be reachable through keyboard category navigation.");
assert.match(settings, /speed: "normal", batchDays: "all", pauseMs: 700/, "Defaults should be normal speed, full-season batch, 700 ms.");
assert.match(settings, /const SPEEDS = \{ slow: 2, normal: 1, fast: 0\.25, instant: 0 \}/, "Speed presets must affect batch pacing.");
assert.match(settings, /Number\(g\.round\) === round && g\.status !== "completed"/, "Simulation must process one calendar round at a time.");
assert.match(settings, /await wait\(effectivePause\(\)\)/, "Simulation must pause between rounds.");
assert.match(settings, /event\.key !== "Backspace" \|\| !running/, "Backspace must request cancellation while the season simulation is running.");
assert.match(settings, /cancelRequested \? "Simulation arrêtée avec Backspace/, "The status must confirm a graceful stop and preserve completed results.");
assert.match(nav, /mynbaMentorRookie/, "View Roster must allow choosing a young player for mentorship.");
assert.match(nav, /mynbaMentorVeteran/, "View Roster must allow choosing an older mentor.");
assert.match(nav, /Number\(p\.age\)<25/, "Only players younger than 25 may receive mentorship.");
assert.match(nav, /Number\(p\.age\)>=30/, "Mentors must be veterans aged 30 or older.");
assert.match(nav, /potentialGain:gain/, "Mentorship must store its expected potential gain.");
assert.match(nav, /attributes\.potential=Math\.max\(40,Math\.min\(99,potential\+gain\)\)/, "Mentorship potential gain must be applied at end-of-season progression and capped.");
assert.match(settings, /window\.simulateNextSeasonGame = async function/, "The next-game action must wait until its scheduled day finishes.");
assert.match(settings, /await window\.simulateThroughRound\(game\.round\)/, "Calendar clicks must await the day before opening its box score.");
assert.match(settings, /window\.runAll = async function/, "Full-year simulation must await the day-by-day batch runner.");
assert.match(settings, /Finish the Finals MVP|Finals MVP/, "The batch runner must preserve the interactive offseason flow.");
assert.match(gm, /Ordre de sélection · \$\{orderedTeams\.length\} équipes/, "Interactive draft must show the selection order.");
assert.match(gm, /window\.NBASimDraftState = \{ teamCode: team\.code, pickNo, prospects \}/, "The in-progress draft and available prospects must be persisted.");
assert.match(gm, /window\.NBASimDraftState = null/, "Completed draft state must be cleared.");
assert.match(gm, /Prospects disponibles pour ton choix #\$\{pickNo\}/, "User must be able to choose a prospect for their franchise.");
assert.match(presentation, /offseasonButton\.click\(\);else runOffseason\(\)/, "Finals MVP continuation must route through the interactive draft handler.");

console.log("OK — Settings, sauvegarde des préférences, simulation par journées et transition vers le draft.");
