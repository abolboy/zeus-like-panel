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

const OTP_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const OTP_PENDING_SECRET_TTL_MS = 10 * 60 * 1000;
const otpVerificationLock = { chain: Promise.resolve() };

function logOtpEvent(event, admin, details, req) {
  try {
    logEvent(event, admin, details || {}, req);
  } catch {}
}
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
    registerFailure(req._loginGuardKey, req._loginGuardIpKey);
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
  }

  if (admin.otpEnabled && admin.otpSecret) {
    req.session.otpPending = username;
    req.session.otpPendingExpiresAt = Date.now() + OTP_CHALLENGE_TTL_MS;
    return res.json({ otpRequired: true });
  }
  registerSuccess(req._loginGuardKey, req._loginGuardIpKey);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    req.session.admin = username;
    req.session.authVersion = Number(admin.authVersion || 0);
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
    registerFailure(req._loginGuardKey, req._loginGuardIpKey);
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

  registerSuccess(req._loginGuardKey, req._loginGuardIpKey);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    req.session.userId = user.id;
    req.session.authVersion = Number(user.authVersion || 0);
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
  if (!pending) {
    logOtpEvent("otp.login.failure", pending, { reason: "no_pending_challenge" }, req);
    return res.status(400).json({ error: "درخواست OTP معلق وجود ندارد" });
  }

  const expiresAt = Number(req.session.otpPendingExpiresAt);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    req.session.otpPending = null;
    delete req.session.otpPendingExpiresAt;
    logOtpEvent("otp.login.failure", pending, { reason: "challenge_expired" }, req);
    return res.status(401).json({ error: "درخواست OTP منقضی شده است" });
  }

  const admin = loadAdmin();
  const code = String((req.body && req.body.code) || "").trim();
  if (!admin || !admin.otpEnabled || !admin.otpSecret) {
    registerFailure(req._loginGuardKey, req._loginGuardIpKey);
    logOtpEvent("otp.login.failure", pending, { reason: "otp_not_configured" }, req);
    return res.status(401).json({ error: "کد معتبر نیست" });
  }

  const result = await (otpVerificationLock.chain = otpVerificationLock.chain
    .catch(() => {})
    .then(async () => {
      const currentAdmin = loadAdmin();
      const verified = totp.verifyDetailed(currentAdmin && currentAdmin.otpSecret, code);
      if (!verified) return { kind: "invalid" };

      const currentCounter = Number(currentAdmin.otpLastUsedCounter);
      if (Number.isSafeInteger(currentCounter) && verified.counter <= currentCounter) {
        return { kind: "replay" };
      }

      currentAdmin.otpLastUsedCounter = verified.counter;
      await atomicWrite(config.adminFile, currentAdmin);
      return { kind: "success" };
    }));

  if (result.kind === "invalid") {
    registerFailure(req._loginGuardKey, req._loginGuardIpKey);
    logOtpEvent("otp.login.failure", pending, { reason: "invalid_code" }, req);
    return res.status(401).json({ error: "کد معتبر نیست" });
  }

  if (result.kind === "replay") {
    registerFailure(req._loginGuardKey, req._loginGuardIpKey);
    logOtpEvent("otp.login.replay_rejected", pending, { reason: "counter_already_used" }, req);
    return res.status(401).json({ error: "این کد قبلاً استفاده شده است" });
  }

  registerSuccess(req._loginGuardKey, req._loginGuardIpKey);
  req.session.otpPending = null;
  delete req.session.otpPendingExpiresAt;
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "خطای سرور" });
    const currentAdmin = loadAdmin();
    req.session.admin = pending;
    req.session.authVersion = Number(currentAdmin?.authVersion || 0);
    logOtpEvent("otp.login.success", pending, { success: true }, req);
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

  const pendingCreatedAt = Number(admin.otpPendingSecretCreatedAt);
  const pendingExpired =
    admin.otpPendingSecret &&
    (!Number.isFinite(pendingCreatedAt) ||
      Date.now() - pendingCreatedAt >= OTP_PENDING_SECRET_TTL_MS);

  const needsNewSecret = !admin.otpPendingSecret || pendingExpired;
  const secret = needsNewSecret
    ? totp.generateSecret()
    : admin.otpPendingSecret;

  admin.otpPendingSecret = secret;
  if (needsNewSecret) {
    admin.otpPendingSecretCreatedAt = Date.now();
  }
  await atomicWrite(config.adminFile, admin);
  logOtpEvent("otp.setup.success", admin.username, { success: true }, req);

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

  if (!admin || !admin.otpPendingSecret) {
    logOtpEvent("otp.enable.failure", req.session?.admin, { reason: "no_pending_secret" }, req);
    return res.status(400).json({ error: "ابتدا setup را بگیر" });
  }

  const pendingCreatedAt = Number(admin.otpPendingSecretCreatedAt);
  if (
    !Number.isFinite(pendingCreatedAt) ||
    Date.now() - pendingCreatedAt >= OTP_PENDING_SECRET_TTL_MS
  ) {
    delete admin.otpPendingSecret;
    delete admin.otpPendingSecretCreatedAt;
    await atomicWrite(config.adminFile, admin);
    logOtpEvent("otp.enable.failure", req.session?.admin, { reason: "pending_secret_expired" }, req);
    return res.status(401).json({ error: "کد setup منقضی شده است" });
  }

  if (!totp.verify(admin.otpPendingSecret, code)) {
    logOtpEvent("otp.enable.failure", req.session?.admin, { reason: "invalid_code" }, req);
    return res.status(401).json({ error: "کد معتبر نیست" });
  }

  admin.otpSecret = admin.otpPendingSecret;
  admin.otpEnabled = true;
  admin.otpLastUsedCounter = null;
  delete admin.otpPendingSecret;
  delete admin.otpPendingSecretCreatedAt;
  await atomicWrite(config.adminFile, admin);
  logOtpEvent("otp.enable.success", req.session?.admin, { success: true }, req);
  res.json({ ok: true });
});

router.post("/otp/disable", requireAdmin, async (req, res) => {
  const currentPassword = String((req.body && req.body.currentPassword) || "");
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    logOtpEvent("otp.disable.failure", req.session?.admin, { reason: "invalid_password" }, req);
    return res.status(401).json({ error: "رمز اشتباه است" });
  }
  admin.otpEnabled = false;
  admin.otpSecret = null;
  admin.otpLastUsedCounter = null;
  delete admin.otpPendingSecret;
  delete admin.otpPendingSecretCreatedAt;
  await atomicWrite(config.adminFile, admin);
  logOtpEvent("otp.disable.success", req.session?.admin, { success: true }, req);
  res.json({ ok: true });
});

module.exports = router;
