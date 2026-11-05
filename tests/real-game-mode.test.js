const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const career = fs.readFileSync(path.join(root, "src", "mycareer-mode.js"), "utf8");
const real = fs.readFileSync(path.join(root, "src", "real-game-mode.js"), "utf8");

assert.match(html, /src="src\/real-game-mode\.js"/, "The independent real-game module must be loaded.");
assert.match(html, /NBASimGetDemoPlayers/, "Demo players should be available to the new mode through a cloned getter.");
assert.match(career, /mcChooseRealGame/, "The mode picker must include the real-game mode.");
assert.match(career, /NBASimOpenRealGameMode/, "MyCareer launcher must call the independent real-game entry point.");
assert.match(career, /buildCareerPublicOpinionComments/, "MyCareer end-of-season public opinion must generate contextual reactions.");
assert.match(career, /publicOpinionComments:/, "Public opinion comments must be stored in the season recap.");
assert.match(career, /GLAZER/, "Public opinion must include enthusiastic fans.");
assert.match(career, /HATER/, "Public opinion must include critical fans.");
assert.match(career, /mcToggleStoryAttributes/, "Story attribute panel must have a visibility toggle.");
assert.match(career, /aria-expanded="false"/, "Story attribute toggle must be accessible and hidden by default.");
assert.match(career, /mcSimulationResultTile/, "Season simulation must show a result tile in real time.");
assert.match(career, /mc-playoff-bracket/, "MyCareer playoffs should be rendered as a bracket.");
assert.match(career, /data-mc-playoff-series/, "Playoff bracket series must be interactive.");

assert.match(real, /NBASimCaptureMyGMState/, "Real-game mode should support active MyGM snapshot import.");
assert.match(real, /NBASimMyCareerBuildSaveSnapshot/, "Real-game mode should support active MyCareer snapshot import.");
assert.match(real, /rgmFileInput/, "Real-game mode should allow importing a JSON file.");
assert.match(real, /teamA\.length!==5\|\|teamB\.length!==5/, "A real-game match requires two five-player teams.");
for (const action of ["three", "mid", "layup", "dunk", "pass", "drive"]) {
  assert.match(real, new RegExp('data-action="' + action + '"'), "Missing real-game action: " + action);
}
assert.match(real, /rgmPointer/, "Shot meter should include a moving timing pointer.");
assert.match(real, /greenStart/, "Shot meter should calculate the green timing window.");
assert.match(real, /perimeterDefense/, "Shot timing difficulty should use opposing defensive attributes.");
assert.match(real, /width="64" height="64"/, "Pixel art editor must use a 64x64 canvas.");
assert.match(real, /spriteFrame="idle"/, "Pixel art editor should have a rest frame.");
assert.match(real, /spriteFrame="idle"/, "Pixel art editor should have selectable frames.");
assert.match(real, /gameSprite\[spriteFrame\]/, "Custom sprites should be stored on the cloned player data.");
assert.match(real, /nba-sim-lab-real-game-sprites/, "Custom sprites should persist locally between mode launches.");
assert.match(real, /JSON\.parse\(JSON\.stringify\(x\|\|\[\]\)\)/, "Imported rosters must be cloned to avoid mutating MyGM/MyCareer source data.");
