const express = require("express");
const config = require("../config");
const crypto = require("crypto");
const router = express.Router();
const { loadUsers, saveUsers } = require("../store/users");
const { loadServers } = require("../store/servers");
const { safeEqualText } = require("../utils/crypto");
const { isExpired } = require("../utils/date");
const { requireUserOrAdmin } = require("../middleware/auth");

function buildConfigs(user) {
  const allServers = loadServers().filter((s) => s.active);
  const servers =
    Array.isArray(user.serverIds) && user.serverIds.length > 0
      ? allServers.filter((s) => user.serverIds.includes(String(s.id)))
      : allServers;
  const seed = crypto.createHash("md5").update(user.id).digest("hex");
  const uuid = [
    seed.slice(0, 8),
    seed.slice(8, 12),
    seed.slice(12, 16),
    seed.slice(16, 20),
    seed.slice(20, 32),
  ].join("-");
  return servers.map((s) => ({
    name: s.name,
    link: "vless://" + uuid + "@" + s.address + ":" + s.port + "?security=reality&type=tcp#" + encodeURIComponent("Zeus-" + s.name),
  }));
}

router.get("/:username", requireUserOrAdmin, (req, res) => {
  const { username } = req.params;
  if (req.session.userId && req.session.username !== username) {
    return res.status(403).json({ error: "اجازه‌ی مشاهده‌ی این اشتراک را ندارید" });
  }
  const user = loadUsers().find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
  if (!user.active) return res.status(403).json({ error: "این حساب غیرفعال است" });
  if (req.session.userId && isExpired(user.expiry)) {
    return res.status(403).json({ error: "اشتراک شما منقضی شده است. برای تمدید با مدیر پنل تماس بگیرید." });
  }
  res.json({
    username: user.username,
    active: user.active,
    trafficTotal: Math.round((Number(user.traffic) || 0) * 100) / 100,
    trafficUsed: Math.round((Number(user.trafficUsed) || 0) * 100) / 100,
    expiry: user.expiry,
    configs: buildConfigs(user),
    createdAt: user.createdAt || null,
    subToken: user.subToken || null,
    history: Array.isArray(user.history) ? user.history.slice(-50).reverse() : [],
  });
});

let QR = null;
try { QR = require("qrcode"); } catch {}

router.get("/qr/:username", requireUserOrAdmin, async (req, res) => {
  const { username } = req.params;
  if (req.session.userId && req.session.username !== username) {
    return res.status(403).json({ error: "اجازه‌ی مشاهده‌ی این اشتراک را ندارید" });
  }
  const user = loadUsers().find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
  if (!QR) return res.status(500).json({ error: "ماژول qrcode نصب نیست" });
  const url = (config.publicBaseUrl || req.protocol + "://" + req.get("host")) + "/sub/" + encodeURIComponent(username);
  const svg = await QR.toString(url, { type: "svg", margin: 1, width: 240 });
  res.type("svg").send(svg);
});

router.get("/qrlink/:username/:idx", requireUserOrAdmin, async (req, res) => {
  const { username, idx } = req.params;
  if (req.session.userId && req.session.username !== username) {
    return res.status(403).json({ error: "اجازه‌ی مشاهده‌ی این اشتراک را ندارید" });
  }
  const user = loadUsers().find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
  if (!QR) return res.status(500).json({ error: "ماژول qrcode نصب نیست" });
  const configs = buildConfigs(user);
  const i = Number(idx);
  if (!configs[i]) return res.status(404).json({ error: "کانفیگ یافت نشد" });
  const svg = await QR.toString(configs[i].link, { type: "svg", margin: 1, width: 240 });
  res.type("svg").send(svg);
});

router.get("/b64/:username", (req, res) => {
  const user = loadUsers().find((u) => u.username === req.params.username);
  if (!user || !user.active || isExpired(user.expiry) || !user.subToken || !safeEqualText(user.subToken, String(req.query.token || ""))) {
    return res.status(403).send("Forbidden");
  }
  const links = buildConfigs(user).map((c) => c.link);
  const b64 = Buffer.from(links.join("\n"), "utf8").toString("base64");
  const usedB = Math.round((Number(user.trafficUsed) || 0) * 1073741824);
  const totB = Math.round((Number(user.traffic) || 0) * 1073741824);
  const p = String(user.expiry || "").split("-").map(Number);
  const exp = p.length === 3 ? Math.floor(new Date(p[2], p[1] - 1, p[0]).getTime() / 1000) : 0;
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  res.set("content-type", "text/plain; charset=utf-8");
  res.set("profile-update-interval", "12");
  res.set("subscription-userinfo", "upload=0; download=" + usedB + "; total=" + totB + "; expire=" + exp);
  res.send(b64);
});

router.post("/token/:username", requireUserOrAdmin, async (req, res) => {
  const { username } = req.params;
  if (req.session.userId && req.session.username !== username) {
    return res.status(403).json({ error: "دسترسی ندارید" });
  }
  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
  user.subToken = crypto.randomBytes(32).toString("hex");
  await saveUsers(users);
  res.json({ ok: true, token: user.subToken });
});

router.get("/qrsub/:username", requireUserOrAdmin, async (req, res) => {
  const { username } = req.params;
  if (req.session.userId && req.session.username !== username) {
    return res.status(403).json({ error: "دسترسی ندارید" });
  }
  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
  if (!user.subToken) {
    user.subToken = crypto.randomBytes(32).toString("hex");
    await saveUsers(users);
  }
  if (!QR) return res.status(500).json({ error: "ماژول qrcode نصب نیست" });
  const url = (config.publicBaseUrl || req.protocol + "://" + req.get("host")) + "/api/sub/b64/" + encodeURIComponent(username) + "?token=" + user.subToken;
  const svg = await QR.toString(url, { type: "svg", margin: 1, width: 240 });
  res.type("svg").send(svg);
});

module.exports = router;
