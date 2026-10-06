require("dotenv").config();

const path = require("path");

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const config = {
  env,
  isProduction,
  port: Number(process.env.PORT || 3000),
  sessionSecret: (() => {
    const secret = process.env.SESSION_SECRET;
    if (!secret && isProduction) {
      throw new Error("SESSION_SECRET در محیط production الزامی است");
    }
    return secret || "zeus-panel-local-secret-change-me";
  })(),
  sessionCookieName: "zeus.sid",
  trustProxy: (() => {
    const raw = String(process.env.TRUST_PROXY ?? "").trim().toLowerCase();
    if (!raw || raw === "false" || raw === "off" || raw === "no") return false;
    if (raw === "true" || raw === "on" || raw === "yes") return true;
    if (/^\d+$/.test(raw)) return Number(raw);
    if (/^(?:[a-f0-9:]+|[a-z0-9.-]+)$/.test(raw)) return raw;
    throw new Error("TRUST_PROXY نامعتبر است");
  })(),
  sessionMaxAge: 24 * 60 * 60 * 1000,
  rememberMeMaxAge: 30 * 24 * 60 * 60 * 1000,
  rootDir: __dirname + "/..",
  dataDir: __dirname + "/..",
  publicDir: path.join(__dirname, "..", "public"),
  usersFile: path.join(__dirname, "..", "users.json"),
  adminFile: path.join(__dirname, "..", "admin.json"),
  settingsFile: path.join(__dirname, "..", "settings.json"),
  serversFile: path.join(__dirname, "..", "servers.json"),
  logLevel: process.env.LOG_LEVEL || "info",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD,
};

module.exports = config;
