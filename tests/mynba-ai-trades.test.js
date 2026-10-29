const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ai = fs.readFileSync(path.join(root, "src", "mynba-ai-trades.js"), "utf8");
const nav = fs.readFileSync(path.join(root, "src", "mynba-navigation.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "src", "mynba-simulation-engine.js"), "utf8");
const fixes = fs.readFileSync(path.join(root, "src", "mynba-quality-fixes.js"), "utf8");

new Function(ai);
new Function(nav);
new Function(engine);
new Function(fixes);

assert.match(html, /src="src\/mynba-ai-trades\.js"/, "The AI trade manager must be loaded.");
assert.match(ai, /function makeAITrade\(/, "The AI league must be able to trade players between teams.");
assert.match(ai, /function makeOffer\(/, "The AI must be able to make proposals to the managed franchise.");
assert.match(ai, /if \(Math\.random\(\) < \.006\) makeAITrade\(round\)/, "AI-to-AI trades must continue independently of auto-decline.");
assert.match(ai, /window\.NBASimAIAutoDecline === true/, "The auto-decline preference must be checked.");
assert.match(ai, /mynbaAITradeAutoDecline/, "The incoming offer must expose an auto-decline action.");
assert.match(ai, /mynbaAIAutoDeclineSetting/, "Settings must expose the auto-decline toggle.");
assert.match(ai, /function enforceRosterCaps\(/, "The 15-player roster limit must be enforced.");
assert.match(ai, /cut\.team = "FA"/, "Excess roster players must become free agents.");
assert.match(ai, /cut\.undrafted = true/, "A cut rookie must be marked undrafted.");
assert.match(ai, /function renderSeasonRecap\(/, "A regular-season trade recap must be available.");
assert.match(ai, /headlineValue/, "The recap must rank trades using player value.");
assert.match(nav, /overallGain:overallGain/, "Mentorship must store an OVR benefit.");
assert.match(nav, /potentialGain:gain/, "Mentorship must store a potential benefit.");
assert.doesNotMatch(engine, /baselinePoints|baselineAssists/, "Season PPG/APG must not drive automatic shot/touch tendencies.");
assert.doesNotMatch(engine, /num\(l\.p\.pts,\s*0\)/, "Season PPG must not drive usage in simulated games.");
assert.doesNotMatch(fixes, /previousPPG|previousAPG|previousRPG/, "Season averages must not drive automatic minute assignments.");
assert.match(ai, /window\.NBASimEnsureRosterCaps\s*=\s*enforceRosterCaps/, "Roster-cap enforcement must be available to the rest of the game.");

console.log("OK — trades IA, refus automatique, limite d’effectif, mentorat et minutes basées sur les attributs.");
