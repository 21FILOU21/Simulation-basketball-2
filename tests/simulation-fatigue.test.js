const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "mynba-simulation-engine.js"), "utf8");
const roster = [];
const teams = ["AAA", "BBB"].map(code => ({
  code, scheduleCode: code, conference: code === "AAA" ? "East" : "West",
  wins: 0, losses: 0, points: 0, oppPoints: 0, assists: 0, rebounds: 0,
  steals: 0, blocks: 0, turnovers: 0
}));
const minutes = [34, 30, 27, 24, 22, 20, 18, 16, 14, 12];
for (const team of teams) {
  minutes.forEach((mpg, index) => roster.push({
    id: team.code + "-" + index, name: team.code + " Player " + index, team: team.code,
    pos: ["PG", "SG", "SF", "PF", "C"][index % 5], mpg, age: 25, height: 198,
    attributes: {
      threePoint: 70, midRange: 68, finishing: 68, layup: 68, closeShot: 65,
      playmaking: 65, passing: 65, ballHandle: 65, offensiveIQ: 65, shotIQ: 65,
      perimeterDefense: 65, interiorDefense: 65, defensiveIQ: 65, steal: 60,
      block: 60, offensiveRebound: 60, defensiveRebound: 60, speed: 65,
      acceleration: 65, agility: 65, strength: 65, vertical: 65, stamina: 70,
      consistency: 70, durability: 80, potential: 80, workEthic: 60, intangibles: 60
    }
  }));
}
const context = {
  window: { NBAMyNBAMinutes: player => player.mpg },
  document: { addEventListener() {} },
  players: roster,
  seasonCalendar: { teams, games: [] },
  console,
  Math
};
vm.runInNewContext(source, context, { filename: "src/mynba-simulation-engine.js" });
const run = context.window.simulateScheduledGame;
assert.equal(typeof run, "function", "Possession simulator should be exposed.");
const makeGame = id => ({
  id, round: 1, status: "scheduled",
  home: { code: "AAA", name: "AAA" }, away: { code: "BBB", name: "BBB" }
});
assert.equal(run(makeGame("fatigue-1")), true, "A valid game should simulate.");
const highWorkload = roster.find(player => player.id === "AAA-0");
const lowWorkload = roster.find(player => player.id === "AAA-9");
assert.ok(highWorkload.nbaFatigue > lowWorkload.nbaFatigue, "Players with more minutes should accumulate more fatigue.");
assert.ok(highWorkload.nbaFatigue < 2, "Recovery should prevent ordinary starters from reaching maximum fatigue after only a few simulated rounds.");
const before = highWorkload.nbaFatigue;
assert.equal(run(makeGame("fatigue-2")), true, "A second valid game should simulate.");
assert.ok(highWorkload.nbaFatigue > before, "Fatigue should carry forward across games.");
assert.ok(lowWorkload.nbaFatigue >= 0 && lowWorkload.nbaFatigue <= 100, "Fatigue must remain within its valid range.");
console.log("OK — league-wide fatigue follows minutes and persists between games.");
