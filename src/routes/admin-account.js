const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { loadAdmin } = require("../store/admin");
const { atomicWrite } = require("../store/base");
const config = require("../config");
const { requireAdmin } = require("../middleware/auth");
const { logEvent } = require("../utils/audit");
const { isValidPassword, passwordError, BCRYPT_ROUNDS } = require("../utils/password-policy");

function validPassword(value) { return isValidPassword(value); }

router.post("/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !validPassword(newPassword)) {
    return res.status(400).json({ error: passwordError() });
  }
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    logEvent("admin.password_change.failure", req.session?.admin, { reason: "invalid_current_password" }, req);
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }
  admin.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  admin.authVersion = Number(admin.authVersion || 0) + 1;
  await atomicWrite(config.adminFile, admin);
  req.session.authVersion = admin.authVersion;
  logEvent("admin.password_changed", admin.username, { success: true }, req);
  res.json({ ok: true, message: "رمز مدیر با موفقیت تغییر کرد" });
});

router.post("/change-username", requireAdmin, async (req, res) => {
  const { newUsername, currentPassword } = req.body || {};
  if (!newUsername?.trim() || !currentPassword) {
    return res.status(400).json({ error: "نام کاربری جدید و رمز فعلی الزامی است" });
  }
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    logEvent("admin.username_change.failure", req.session?.admin, { reason: "invalid_current_password" }, req);
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }
  const username = newUsername.trim();
  if (username.length < 3 || username.length > 64) {
    return res.status(400).json({ error: "نام کاربری باید بین ۳ تا ۶۴ کاراکتر باشد" });
  }
  admin.username = username;
  admin.authVersion = Number(admin.authVersion || 0) + 1;
  await atomicWrite(config.adminFile, admin);
  req.session.admin = admin.username;
  req.session.authVersion = admin.authVersion;
  logEvent("admin.username_changed", admin.username, { success: true }, req);
  res.json({ ok: true, message: "نام کاربری مدیر با موفقیت تغییر کرد" });
});

module.exports = router;
