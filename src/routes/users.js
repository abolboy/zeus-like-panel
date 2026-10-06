const express = require("express");
const bcrypt = require("bcryptjs");
const { sendSms, welcomeMessage } = require("../utils/sms");
const config = require("../config");
const router = express.Router();

const { loadUsers, saveUsers, sanitizeServerIds } = require("../store/users");
const { isValidExpiryFormat } = require("../utils/date");
const { requireAdmin } = require("../middleware/auth");
const { logEvent } = require("../utils/audit");

router.get("/", requireAdmin, (req, res) => {
  const users = loadUsers().map(({ passwordHash, ...safe }) => safe);
  res.json(users);
});

router.post("/", requireAdmin, async (req, res) => {
  const { username, password, expiry, traffic } = req.body || {};
  const trafficValue = Number(traffic ?? 0);

  if (!Number.isFinite(trafficValue) || trafficValue < 0) {
    return res.status(400).json({ error: "حجم ترافیک باید عددی معتبر و غیرمنفی باشد" });
  }

  if (!isValidExpiryFormat(expiry)) {
    return res.status(400).json({ error: "فرمت تاریخ انقضا نامعتبر است (روز-ماه-سال، مثال: 31-12-2026)" });
  }

  if (!username?.trim() || !password || String(password).length < 12 || String(password).length > 256) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است و رمز باید بین ۱۲ تا ۲۵۶ کاراکتر باشد" });
  }
  const users = loadUsers();
  if (users.some((u) => u.username === username.trim())) {
    return res.status(400).json({ error: "این نام کاربری قبلاً وجود دارد" });
  }
  const user = {
    id: Date.now().toString(),
    username: username.trim(),
    passwordHash: await bcrypt.hash(password, 12),
    authVersion: 0,
    expiry: expiry || "",
    traffic: trafficValue,
    serverIds: sanitizeServerIds(req.body.serverIds),
    renewalRequested: null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  res.json({ ok: true, id: user.id });
});

router.put("/:id", requireAdmin, async (req, res) => {
  const users = loadUsers();
  const index = users.findIndex((u) => String(u.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ error: "کاربر پیدا نشد" });

  const user = users[index];
  if (req.body.username !== undefined) {
    if (typeof req.body.username !== "string" || !req.body.username.trim()) {
      return res.status(400).json({ error: "نام کاربری باید یک رشته غیرخالی باشد" });
    }
    const newUsername = req.body.username.trim();
    if (
      newUsername !== user.username &&
      users.some((u) => u.username === newUsername && String(u.id) !== String(user.id))
    ) {
      return res.status(400).json({ error: "این نام کاربری قبلاً وجود دارد" });
    }
    user.username = newUsername;
  }
  if (req.body.expiry !== undefined) {
    if (!isValidExpiryFormat(req.body.expiry)) {
      return res.status(400).json({ error: "فرمت تاریخ انقضا نامعتبر است (روز-ماه-سال، مثال: 31-12-2026)" });
    }
    user.expiry = req.body.expiry;
  }
  if (req.body.traffic !== undefined) {
    const trafficValue = Number(req.body.traffic);
    if (!Number.isFinite(trafficValue) || trafficValue < 0) {
      return res.status(400).json({ error: "حجم ترافیک باید عددی معتبر و غیرمنفی باشد" });
    }
    user.traffic = trafficValue;
  }
  if (req.body.active !== undefined) {
    if (typeof req.body.active === "boolean") {
      user.active = req.body.active;
    } else if (req.body.active === "true" || req.body.active === "false") {
      user.active = req.body.active === "true";
    } else {
      return res.status(400).json({ error: "وضعیت فعال باید true یا false باشد" });
    }
  }
  if (req.body.password !== undefined) {
    if (typeof req.body.password !== "string" || req.body.password.length < 12 || req.body.password.length > 256) {
      return res.status(400).json({ error: "رمز باید بین ۱۲ تا ۲۵۶ کاراکتر باشد" });
    }
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.authVersion = Number(user.authVersion || 0) + 1;
  }
  if (req.body.serverIds !== undefined) {
    user.serverIds = sanitizeServerIds(req.body.serverIds);
  }

  users[index] = user;
  await saveUsers(users);
  logEvent("user.update", req.session.admin, { username: user.username }, req);
    res.json({ ok: true });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const users = loadUsers();
  const remaining = users.filter((u) => String(u.id) !== String(req.params.id));
  if (remaining.length === users.length) return res.status(404).json({ error: "کاربر پیدا نشد" });
  await saveUsers(remaining);
  logEvent("user.delete", req.session.admin, { userId: String(req.params.id) }, req);
  res.json({ ok: true });
});

router.post("/:id/toggle", requireAdmin, async (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });
  user.active = !user.active;
  await saveUsers(users);
  logEvent("user.toggle", req.session.admin, { userId: String(req.params.id), active: user.active }, req);
  res.json({ ok: true, active: user.active });
});


router.get("/export", requireAdmin, (req, res) => {
  const users = loadUsers();
  res.setHeader("Content-Disposition", 'attachment; filename="zeus-users-' + Date.now() + '.json"');
  res.json({ exportedAt: new Date().toISOString(), users });
});

router.post("/import", requireAdmin, async (req, res) => {
  const payload = req.body || {};
  const list = Array.isArray(payload.users) ? payload.users : Array.isArray(payload) ? payload : [];
  const users = loadUsers();
  let added = 0;
  let skipped = 0;
  for (const item of list) {
    const username = String(item && item.username ? item.username : "").trim();
    if (!username || !item || !item.passwordHash) { skipped += 1; continue; }
    if (users.some((u) => u.username === username)) { skipped += 1; continue; }
    users.push({
      id: String(item.id || Date.now() + Math.random()),
      username,
      passwordHash: String(item.passwordHash),
      expiry: item.expiry || "",
      traffic: Number(item.traffic) || 0,
      serverIds: Array.isArray(item.serverIds) ? item.serverIds : [],
      renewalRequested: item.renewalRequested || null,
      active: item.active !== false,
      createdAt: item.createdAt || new Date().toISOString(),
      history: Array.isArray(item.history) ? item.history : []
    });
    added += 1;
  }
  await saveUsers(users);
  res.json({ ok: true, added, skipped });
});

router.post("/sms/phone", requireAdmin, (req, res) => {
  const body = req.body || {};
  const username = String(body.username || "");
  const phone = String(body.phone || "").trim();
  if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
    return res.status(400).json({ error: "شماره معتبر نیست (مثال: +989121234567)" });
  }
  const users = loadUsers();
  const u = users.find(x => x.username === username);
  if (!u) return res.status(404).json({ error: "کاربر یافت نشد" });
  const wasEmpty = !u.phone;
  u.phone = phone;
  saveUsers(users);
  let welcomeSent = false;
  if (wasEmpty && phone) {
    const base = config.publicBaseUrl || req.protocol + "://" + req.get("host");
    sendSms(phone, welcomeMessage(u, base), function (err) {
      if (!err) console.log("Welcome SMS sent to", u.username);
    });
    welcomeSent = true;
  }
  res.json({ ok: true, phone: u.phone, welcomeSent: welcomeSent });
});


router.post("/bulk", requireAdmin, (req, res) => {
  const action = String((req.body && req.body.action) || "").trim();
  const usernames = Array.isArray(req.body && req.body.usernames) ? req.body.usernames : [];
  if (!action || !usernames.length) return res.status(400).json({ error: "action و usernames لازم است" });
  const users = loadUsers();
  let changed = 0;
  usernames.forEach(function (name) {
    const u = users.find(x => x.username === name);
    if (!u) return;
    if (action === "activate") { u.active = true; changed++; }
    else if (action === "deactivate") { u.active = false; changed++; }
    else if (action === "delete") { users.splice(users.indexOf(u), 1); changed++; }
  });
  saveUsers(users);
  res.json({ ok: true, changed: changed });
});

module.exports = router;
