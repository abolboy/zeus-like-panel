const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { loadAdmin } = require("../store/admin");
const { atomicWrite } = require("../store/base");
const config = require("../config");
const { requireAdmin } = require("../middleware/auth");

router.post("/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "رمز جدید باید حداقل ۶ کاراکتر باشد" });
  }
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await atomicWrite(config.adminFile, admin);
  res.json({ ok: true, message: "رمز مدیر با موفقیت تغییر کرد" });
});

router.post("/change-username", requireAdmin, async (req, res) => {
  const { newUsername, currentPassword } = req.body || {};
  if (!newUsername?.trim() || !currentPassword) {
    return res.status(400).json({ error: "نام کاربری جدید و رمز فعلی الزامی است" });
  }
  const admin = loadAdmin();
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }
  admin.username = newUsername.trim();
  await atomicWrite(config.adminFile, admin);
  req.session.admin = admin.username;
  res.json({ ok: true, message: "نام کاربری مدیر با موفقیت تغییر کرد" });
});

module.exports = router;
