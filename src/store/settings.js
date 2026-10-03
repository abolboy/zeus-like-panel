const fs = require("fs");
const { atomicWrite, loadJSON } = require("./base");
const config = require("../config");

const loadSettings = () => loadJSON(config.settingsFile, { panelName: "Zeus Panel" });
const saveSettings = (s) => atomicWrite(config.settingsFile, s);

function ensureSettings() {
  if (!fs.existsSync(config.settingsFile)) {
    saveSettings({ panelName: "Zeus Panel" });
  }
}

module.exports = { loadSettings, saveSettings, ensureSettings };
