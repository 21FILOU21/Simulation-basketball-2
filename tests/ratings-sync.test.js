const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "ratings-sync.js"), "utf8");
const window = { addEventListener() {}, postMessage() {} };
const document = { addEventListener() {}, getElementById() { return null; } };
vm.runInNewContext(source, { window, document, location: { hostname: "localhost" }, URL, setTimeout, clearTimeout, Promise, DOMParser: class {} });

const options = ["ATL","BOS","BKN","CHA","CHI","CLE","DAL","DEN","DET","GSW","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NOP","NYK","OKC","ORL","PHI","PHX","POR","SAC","SAS","TOR","UTA","WAS","FA"].map(value => ({ value, textContent: value }));
assert.equal(window.NBASimExtractRatingsTeamName("Player Team: Los Angeles Clippers Jersey: #2 Position: SF"), "Los Angeles Clippers");
assert.equal(window.NBASimExtractRatingsTeamName("Team: [LA Clippers](https://www.2kratings.com/teams/la-clippers) Jersey: #2"), "LA Clippers");
assert.equal(window.NBASimResolveRatingsTeamCode("Los Angeles Clippers", options), "LAC");
assert.equal(window.NBASimResolveRatingsTeamCode("LA Clippers", options), "LAC");
assert.equal(window.NBASimResolveRatingsTeamCode("Atlanta Hawks", options), "ATL");
assert.equal(window.NBASimResolveRatingsTeamCode("Miami Heat", options), "MIA");
assert.equal(window.NBASimResolveRatingsTeamCode("WAS", options), "WAS");
assert.equal(window.NBASimResolveRatingsTeamCode("Free Agent", options), "FA");
assert.equal(window.NBASimReadRatingsValue("Mid-Range Shot 87", "Mid-Range Shot"), 87);
assert.equal(window.NBASimReadRatingsValue("Intangibles 92", "Intangibles"), 92);
assert.equal(window.NBASimResolveRatingsTeamCode("Unknown Team", options), "");
console.log("OK — synchronisation 2KRatings : extraction du nom d'équipe et correspondance des codes NBA.");
