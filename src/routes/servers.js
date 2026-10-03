const express = require("express");
const net = require("net");
const crypto = require("crypto");
const router = express.Router();

const { loadServers, saveServers } = require("../store/servers");
const { sha256, safeEqualText, agentSignature } = require("../utils/crypto");
const { loadUsers, saveUsers } = require("../store/users");
const { requireAdmin } = require("../middleware/auth");
const config = require("../config");
const logger = require("../logger");

function appendAudit(event, req, meta = {}) {
  logger.info("audit", {
    event,
    ip: req.ip,
    user: req.session?.admin || req.session?.username || "agent",
    ...meta,
  });
}

router.get("/", requireAdmin, (req, res) => {
  res.json(loadServers().map(({ agentTokenHash, agentTokenCreatedAt, ...safe }) => safe));
});

router.get("/:id/agent-token", requireAdmin, async (req, res) => {
  const servers = loadServers();
  const server = servers.find((item) => String(item.id) === String(req.params.id));
  if (!server) return res.status(404).json({ error: "سرور پیدا نشد" });

  const token = crypto.randomBytes(32).toString("hex");
  server.agentTokenHash = sha256(token);
  server.agentTokenCreatedAt = new Date().toISOString();

  await saveServers(servers);
  appendAudit("xray_agent_token_created", req, {
    serverId: server.id,
    name: server.name,
  });

  res.json({
    ok: true,
    token,
    serverId: String(server.id),
    panelUrl: String(config.publicBaseUrl || req.protocol + "://" + req.get("host")),
    xrayApi: "127.0.0.1:10085",
    intervalSeconds: 60,
    warning: "این توکن فقط همین بار نمایش داده می‌شود.",
  });
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, address, port } = req.body || {};
  const portValue = Number(port);
  if (
    !String(name || "").trim() ||
    !String(address || "").trim() ||
    !Number.isInteger(portValue) ||
    portValue < 1 ||
    portValue > 65535
  ) {
    return res.status(400).json({ error: "نام، آدرس و پورت معتبر الزامی است" });
  }
  const servers = loadServers();
  const server = {
    id: Date.now().toString(),
    name: String(name).trim(),
    address: String(address).trim(),
    port: portValue,
    active: true,
  };
  servers.push(server);
  await saveServers(servers);
  res.json(server);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const servers = loadServers();
  const index = servers.findIndex((s) => String(s.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ error: "سرور پیدا نشد" });

  const server = servers[index];
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ error: "نام سرور نمی‌تواند خالی باشد" });
    server.name = name;
  }
  if (req.body.address !== undefined) {
    const address = String(req.body.address).trim();
    if (!address) return res.status(400).json({ error: "آدرس سرور نمی‌تواند خالی باشد" });
    server.address = address;
  }
  if (req.body.port !== undefined) {
    const portValue = Number(req.body.port);
    if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
      return res.status(400).json({ error: "پورت معتبر نیست" });
    }
    server.port = portValue;
  }
  if (req.body.active !== undefined) {
    if (typeof req.body.active === "boolean") {
      server.active = req.body.active;
    } else if (req.body.active === "true" || req.body.active === "false") {
      server.active = req.body.active === "true";
    } else {
      return res.status(400).json({ error: "وضعیت فعال باید true یا false باشد" });
    }
  }

  servers[index] = server;
  await saveServers(servers);
  res.json({ ok: true });
});

router.post("/:id/toggle", requireAdmin, async (req, res) => {
  const servers = loadServers();
  const server = servers.find((s) => String(s.id) === String(req.params.id));
  if (!server) return res.status(404).json({ error: "سرور پیدا نشد" });
  server.active = !server.active;
  await saveServers(servers);
  res.json({ ok: true, active: server.active });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const servers = loadServers();
  const remaining = servers.filter((s) => String(s.id) !== String(req.params.id));
  if (remaining.length === servers.length) return res.status(404).json({ error: "سرور پیدا نشد" });
  await saveServers(remaining);
  res.json({ ok: true });
});

router.post("/usage", async (req, res) => {
  const timestampText = String(req.get("X-Zeus-Agent-Timestamp") || "");
  const timestamp = Number(timestampText);
  const payload = req.body || {};
  const serverId = String(payload.serverId || "").trim();
  const token = String(req.get("X-Zeus-Agent-Token") || "");
  const signature = String(req.get("X-Zeus-Agent-Signature") || "").toLowerCase();

  if (!serverId || !token || !timestampText || !Number.isFinite(timestamp)) {
    return res.status(401).json({ error: "اعتبارنامه Agent ناقص است" });
  }

  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return res.status(401).json({ error: "زمان گزارش Agent منقضی شده است" });
  }

  const server = loadServers().find((item) => String(item.id) === serverId);
  if (!server || !server.agentTokenHash || !safeEqualText(server.agentTokenHash, sha256(token))) {
    return res.status(401).json({ error: "اعتبارنامه Agent معتبر نیست" });
  }

  const expectedSignature = agentSignature(token, timestampText, payload);
  if (!safeEqualText(expectedSignature, signature)) {
    return res.status(401).json({ error: "امضای گزارش Agent معتبر نیست" });
  }

  const reportedAt = new Date(payload.reportedAt || 0);
  if (Number.isNaN(reportedAt.getTime())) {
    return res.status(400).json({ error: "زمان گزارش Agent معتبر نیست" });
  }

  const reportUsers = Array.isArray(payload.users) ? payload.users.slice(0, 5000) : [];
  const users = loadUsers();
  const reportTime = reportedAt.getTime();
  let updated = 0;
  let ignored = 0;

  for (const item of reportUsers) {
    const username = String(item?.username || "").trim();
    const totalBytes = Number(item?.totalBytes);

    if (!username || !Number.isFinite(totalBytes) || totalBytes < 0) {
      ignored += 1;
      continue;
    }

    const user = users.find((candidate) => candidate.username === username);
    if (!user) {
      ignored += 1;
      continue;
    }

    if (
      Array.isArray(user.serverIds) &&
      user.serverIds.length > 0 &&
      !user.serverIds.map(String).includes(serverId)
    ) {
      ignored += 1;
      continue;
    }

    const lastMap = user.trafficUsageLastAtByServer || {};
    const lastAt = Number(lastMap[serverId] || 0);
    if (lastAt && reportTime <= lastAt) continue;

    if (!user.trafficUsageByServer || typeof user.trafficUsageByServer !== "object") {
      user.trafficUsageByServer = {
        manual: Math.max(0, Number(user.trafficUsed) || 0),
      };
    }

    if (!user.trafficUsageBaselineByServer || typeof user.trafficUsageBaselineByServer !== "object") {
      user.trafficUsageBaselineByServer = {};
    }

    if (!Object.prototype.hasOwnProperty.call(user.trafficUsageBaselineByServer, serverId)) {
      user.trafficUsageBaselineByServer[serverId] = 0;
    }

    const baseline = Number(user.trafficUsageBaselineByServer[serverId]) || 0;
    const usedBytes = Math.max(0, totalBytes - baseline);

    user.trafficUsageByServer[serverId] = Math.round((usedBytes / 1024 ** 3) * 100) / 100;

    user.trafficUsageLastAtByServer = {
      ...lastMap,
      [serverId]: reportTime,
    };

    user.trafficUsed = Object.values(user.trafficUsageByServer).reduce(
      (sum, value) => sum + Math.max(0, Number(value) || 0),
      0
    );

    user.trafficUsageUpdatedAt = reportedAt.toISOString();
    updated += 1;
  }

  if (updated) await saveUsers(users);
  try {
    const pathMod = require("path");
    const cfg = require("../config");
    const base = require("../store/base");
    const nowD = new Date();
    const key = nowD.getFullYear() + "-" + String(nowD.getMonth() + 1).padStart(2, "0") + "-" + String(nowD.getDate()).padStart(2, "0");
    const histFile = pathMod.join(cfg.dataDir, "traffic-daily.json");
    const hist = base.loadJSON(histFile, {});
    hist[key] = Math.round(users.reduce((sum, u) => sum + (Number(u.trafficUsed) || 0), 0) * 100) / 100;
    await base.atomicWrite(histFile, hist);
  } catch {}
  try {
    const pathMod = require("path");
    const cfg = require("../config");
    const base = require("../store/base");
    const nowD = new Date();
    const key = nowD.getFullYear() + "-" + String(nowD.getMonth() + 1).padStart(2, "0") + "-" + String(nowD.getDate()).padStart(2, "0");
    const histFile = pathMod.join(cfg.dataDir, "traffic-history.json");
    const hist = base.loadJSON(histFile, {});
    hist[key] = Math.round(users.reduce((sum, u) => sum + (Number(u.trafficUsed) || 0), 0) * 100) / 100;
    await base.atomicWrite(histFile, hist);
  } catch {}

  appendAudit("xray_usage_report_received", req, {
    serverId,
    updated,
    ignored,
    reportedAt: reportedAt.toISOString(),
  });

  res.json({
    ok: true,
    serverId,
    updated,
    ignored,
    reportedAt: reportedAt.toISOString(),
  });
});


function probe(address, port, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.connect({ host: address, port: port, timeout: timeoutMs });
    const done = (online) => { socket.destroy(); resolve({ online: online, ms: Date.now() - started }); };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

let statusCache = { at: 0, data: null };

router.get("/status", requireAdmin, async (req, res) => {
  const now = Date.now();
  if (statusCache.data && now - statusCache.at < 30000) {
    return res.json(statusCache.data);
  }
  const servers = loadServers();
  const results = await Promise.all(servers.map(async (sv) => {
    const r = await probe(sv.address, sv.port, 3000);
    return { id: String(sv.id), name: sv.name, online: r.online, ms: r.ms };
  }));
  statusCache = { at: now, data: results };
  res.json(results);
});

module.exports = router;
