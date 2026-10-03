const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { loadAdmin } = require("../store/admin");
const { loadUsers, saveUsers, appendUserHistory } = require("../store/users");
const { isExpired } = require("../utils/date");
const config = require("../config");
const { loginGuard, registerFailure, registerSuccess } = require("../middleware/rate-limit");
const { requireAdmin } = require("../middleware/auth");
const { logEvent } = require("../utils/audit");
const totp = require("../utils/totp");
const { atomicWrite } = require("../store/base");

router.get("/me", (req, res) => {
  if (req.session?.admin) {
    return res.json({ loggedIn: true, role: "admin", username: req.session.admin });
  }
  if (req.session?.userId) {
    return res.json({ loggedIn: true, role: "user", username: req.session.username });
  }
  res.status(401).json({ loggedIn: false });
});

router.post("/login", loginGuard("admin"), async (req, res) => {
  const { username, password, rememberMe } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است" });
  }

  const admin = loadAdmin();
  if (!admin) return res.status(500).json({ error: "مدیر پنل ساخته نشده است" });

  const ok = username === admin.username && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) {
    registerFailure(req._loginGuardKey);
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
  }

  if (admin.otpEnabled && admin.otpSecret) {
    req.session.otpPending = username;
    return res.json({ otpRequired: true });
  }
  registerSuccess(req._loginGuardKey);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    req.session.admin = username;
    logEvent("admin.login", username, { success: true }, req);
    if (rememberMe) req.session.cookie.maxAge = config.rememberMeMaxAge;
    res.json({ success: true, ok: true });
  });
});

router.post("/user-login", loginGuard("user"), async (req, res) => {
  const { username, password, rememberMe } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است" });
  }

  const users = loadUsers();
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    registerFailure(req._loginGuardKey);
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
  }
  if (!user.active) {
    return res.status(403).json({ error: "این حساب غیرفعال شده است. با مدیر پنل تماس بگیرید." });
  }
  if (isExpired(user.expiry)) {
    return res.status(403).json({
      error: "اشتراک شما منقضی شده است. برای تمدید درخواست بفرستید.",
      expired: true,
      renewalRequested: Boolean(user.renewalRequested),
    });
  }

  registerSuccess(req._loginGuardKey);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    req.session.userId = user.id;
    try {
      const { loadUsers, saveUsers } = require("../store/users");
      const usList = loadUsers();
      const uu = usList.find(x => String(x.id) === String(req.session.userId) || x.username === req.session.username);
      if (uu) {
        uu.lastLogin = new Date().toISOString();
        uu.loginHistory = Array.isArray(uu.loginHistory) ? uu.loginHistory : [];
        uu.loginHistory.push({ time: uu.lastLogin, ip: String(req.ip || "-") });
        uu.loginHistory = uu.loginHistory.slice(-10);
        saveUsers(usList);
      }
    } catch (e) {}
    req.session.username = user.username;
    if (rememberMe) req.session.cookie.maxAge = config.rememberMeMaxAge;
    res.json({ success: true, ok: true, username: user.username });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});


router.post("/login/otp", loginGuard("adminotp"), async (req, res) => {
  const pending = req.session && req.session.otpPending;
  if (!pending) return res.status(400).json({ error: "درخواست OTP معلق وجود ندارد" });
  const admin = loadAdmin();
  const code = String((req.body && req.body.code) || "").trim();
  if (!admin || !totp.verify(admin.otpSecret, code)) {
    registerFailure(req._loginGuardKey);
    return res.status(401).json({ error: "کد معتبر نیست" });
  }
  registerSuccess(req._loginGuardKey);
  req.session.otpPending = null;
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    req.session.admin = pending;
    res.json({ success: true, ok: true });
  });
});

router.get("/otp/status", requireAdmin, (req, res) => {
  const admin = loadAdmin();
  res.json({ enabled: Boolean(admin && admin.otpEnabled && admin.otpSecret) });
});

router.get("/otp/setup", requireAdmin, async (req, res) => {
  const admin = loadAdmin();
  if (!admin) return res.status(500).json({ error: "مدیر یافت نشد" });
  const secret = admin.otpPendingSecret || totp.generateSecret();
  admin.otpPendingSecret = secret;
  await atomicWrite(config.adminFile, admin);
  const url = "otpauth://totp/" + encodeURIComponent("Zeus:" + admin.username) + "?secret=" + secret + "&issuer=" + encodeURIComponent("Zeus Panel");
  let qr = null;
  try {
    const QRlib = require("qrcode");
    qr = await QRlib.toString(url, { type: "svg", margin: 1, width: 220 });
  } catch {}
  res.json({ secret, url, qr });
});

router.post("/otp/enable", requireAdmin, async (req, res) => {
  const admin = loadAdmin();
  const code = String((req.body && req.body.code) || "").trim();
  if (!admin || !admin.otpPendingSecret) return res.status(400).json({ error: "ابتدا setup را بگیر" });
  if (!totp.verify(admin.otpPendingSecret, code)) return res.status(401).json({ error: "کد معتبر نیست" });
  admin.otpSecret = admin.otpPendingSecret;
  admin.otpEnabled = true;
  delete admin.otpPendingSecret;
  await atomicWrite(config.adminFile, admin);
  res.json({ ok: true });
});

router.post("/otp/disable", requireAdmin, async (req, res) => {
  const currentPassword = String((req.body && req.body.currentPassword) || "");
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return res.status(401).json({ error: "رمز اشتباه است" });
  }
  admin.otpEnabled = false;
  admin.otpSecret = null;
  await atomicWrite(config.adminFile, admin);
  res.json({ ok: true });
});

module.exports = router;
