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

for (const contract of [
  "MyCareer", "MyGM", "Meneur organisateur", "Ailier 3&D", "Pivot protecteur de cercle",
  "buildBudget", "draftScore", "simulateScheduledGame", "NBASimEnsureMinimumRoster",
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

console.log("OK — MyCareer mode contracts, specialties and ratings integration.");
