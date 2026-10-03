const crypto = require("crypto");

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function canonicalAgentPayload(payload = {}) {
  const users = Array.isArray(payload.users)
    ? payload.users
        .map((item) => ({
          username: String(item?.username || "").trim(),
          totalBytes: Math.max(0, Number(item?.totalBytes) || 0),
        }))
        .filter((item) => item.username && Number.isFinite(item.totalBytes))
        .sort((a, b) => a.username.localeCompare(b.username))
    : [];

  return JSON.stringify({
    serverId: String(payload.serverId || ""),
    reportedAt: String(payload.reportedAt || ""),
    users,
  });
}

function agentSignature(token, timestamp, payload) {
  return crypto
    .createHmac("sha256", String(token))
    .update(String(timestamp) + "." + canonicalAgentPayload(payload))
    .digest("hex");
}

module.exports = {
  sha256,
  safeEqualText,
  canonicalAgentPayload,
  agentSignature,
};
