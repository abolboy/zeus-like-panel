const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { loadUsers, saveUsers, appendUserHistory } = require("../store/users");
const { requireUser } = require("../middleware/auth");
const { logEvent } = require("../utils/audit");

function validPassword(value) {
  return typeof value === "string" && value.length >= 12 && value.length <= 256;
}

router.post("/change-password", requireUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !validPassword(newPassword)) {
    return res.status(400).json({ error: "رمز جدید باید حداقل ۱۲ و حداکثر ۲۵۶ کاراکتر باشد" });
  }

  const users = loadUsers();
  const user = users.find((u) => String(u.id) === String(req.session.userId));
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    logEvent("user.password_change.failure", req.session?.username, { reason: "invalid_current_password" }, req);
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.authVersion = Number(user.authVersion || 0) + 1;
  appendUserHistory(user, "password_changed");
  await saveUsers(users);
  req.session.authVersion = user.authVersion;
  logEvent("user.password_changed", user.username, { success: true }, req);
  res.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد" });
});

module.exports = router;
