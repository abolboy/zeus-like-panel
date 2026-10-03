const config = require("./config");

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = levels[config.logLevel] ?? levels.info;

function log(level, message, meta = {}) {
  if (levels[level] > current) return;

  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  });

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  error: (message, meta) => log("error", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  info: (message, meta) => log("info", message, meta),
  debug: (message, meta) => log("debug", message, meta),
};
