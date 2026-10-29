const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const gm = fs.readFileSync(path.join(root, "src", "mynba-gm.js"), "utf8");
const nav = fs.readFileSync(path.join(root, "src", "mynba-navigation.js"), "utf8");

new Function(gm);
new Function(nav);
assert.match(html, /\.gm-start\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;/, "The MyGM overlay must actually disappear when hidden.");
assert.match(gm, /if \(picks\.length < 5\)[\s\S]*?showCreateFranchiseStep\(\);/, "Completing the fifth pick must reveal the franchise continuation step.");
assert.match(gm, /id="gmCreateFranchise">Continuer →/, "The completed roster must have a clear continue button.");
assert.match(gm, /if \(Array\.isArray\(customTeams\) && customTeams\.length\) \{\s*hideOverlay\(\);/, "Loading a save with a franchise must close the MyGM overlay.");
assert.match(gm, /const loadSave = input\.onchange;[\s\S]*?input\.onchange = async function \(event\)[\s\S]*?mynba:save-load-result/, "MyGM must receive the result from the navigation menu's save loader.");
assert.match(nav, /\$\("importFile"\)\.onchange=async function/, "The navigation menu remains responsible for importing and validating save files.");

console.log("OK — MyGM : fermeture de l’overlay, continuation après cinq choix et chargement de sauvegarde.");
