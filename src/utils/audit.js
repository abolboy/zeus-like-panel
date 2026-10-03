const fs = require("fs");
const path = require("path");
const config = require("../config");

const MAX_LOGS = 500;

function getLogPath() {
  return path.join(config.rootDir, "data", "audit-log.json");
}

function loadLogs() {
  try {
    const data = fs.readFileSync(getLogPath(), "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  fs.writeFileSync(getLogPath(), JSON.stringify(logs, null, 2));
}

function logEvent(event, admin, details, req) {
  const logs = loadLogs();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    admin: admin || "unknown",
    event: event,
    details: details || {},
    ip: req ? (req.ip || req.connection.remoteAddress) : null,
    userAgent: req ? req.headers["user-agent"] : null
  };
  logs.push(entry);
  saveLogs(logs);
  return entry;
}

module.exports = { logEvent, loadLogs };