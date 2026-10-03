const { atomicWrite, loadJSON } = require("./base");
const config = require("../config");

const loadUsers = () => loadJSON(config.usersFile, []);
const saveUsers = (users) => atomicWrite(config.usersFile, users);

function sanitizeServerIds(raw) {
  if (!Array.isArray(raw)) return [];
  const { loadServers } = require("./servers");
  const validIds = new Set(loadServers().map((s) => String(s.id)));
  return [...new Set(raw.map(String))].filter((id) => validIds.has(id));
}

function appendUserHistory(user, type, extra = {}) {
  if (!Array.isArray(user.history)) user.history = [];
  user.history.push({ type, date: new Date().toISOString(), ...extra });
  if (user.history.length > 50) user.history = user.history.slice(-50);
}

module.exports = {
  loadUsers,
  saveUsers,
  sanitizeServerIds,
  appendUserHistory,
};
