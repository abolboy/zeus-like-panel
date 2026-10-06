const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config");

const MAX_LOGS = 500;
const GENESIS = "ZEUS_AUDIT_GENESIS_V1";

function getLogPath() {
  return path.join(config.rootDir, "data", "audit-log.json");
}

function canonicalEntry(entry) {
  return JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp,
    admin: entry.admin,
    event: entry.event,
    details: entry.details || {},
    ip: entry.ip,
    userAgent: entry.userAgent,
    prevHash: entry.prevHash || null,
  });
}

function hashEntry(entry) {
  return crypto.createHash("sha256").update(canonicalEntry(entry)).digest("hex");
}

function verifyLogs(logs) {
  if (!Array.isArray(logs)) throw new Error("Audit log format is invalid");
  let previous = GENESIS;
  for (const entry of logs) {
    if (!entry || typeof entry !== "object") throw new Error("Audit log entry is invalid");
    if (!entry.hash || entry.prevHash !== previous || hashEntry(entry) !== entry.hash) {
      throw new Error("Audit log integrity check failed");
    }
    previous = entry.hash;
  }
  return true;
}

function loadLogs() {
  try {
    const data = fs.readFileSync(getLogPath(), "utf8");
    const logs = JSON.parse(data);
    if (!Array.isArray(logs)) return [];
    if (logs.length && logs[0].hash) verifyLogs(logs);
    return logs;
  } catch (error) {
    if (error && error.message === "Audit log integrity check failed") throw error;
    return [];
  }
}

function saveLogs(logs) {
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
  let previous = GENESIS;
  logs = logs.map((entry) => {
    const next = { ...entry, prevHash: previous };
    next.hash = hashEntry(next);
    previous = next.hash;
    return next;
  });
  const logPath = getLogPath();
  const tempPath = logPath + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(logs, null, 2), { mode: 0o600 });
  fs.renameSync(tempPath, logPath);
}

function logEvent(event, admin, details, req) {
  const logs = loadLogs();
  const entry = {
    id: Date.now().toString(36) + crypto.randomBytes(5).toString("hex"),
    timestamp: new Date().toISOString(),
    admin: admin || "unknown",
    event: event,
    details: details || {},
    ip: req ? (req.ip || req.connection.remoteAddress) : null,
    userAgent: req ? req.headers["user-agent"] : null,
  };
  logs.push(entry);
  saveLogs(logs);
  return entry;
}

module.exports = { logEvent, loadLogs, verifyLogs };
