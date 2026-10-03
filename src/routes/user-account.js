const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { loadUsers, saveUsers, appendUserHistory } = require("../store/users");
const { requireUser } = require("../middleware/auth");

router.post("/change-password", requireUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "رمز جدید باید حداقل ۶ کاراکتر باشد" });
  }

  const users = loadUsers();
  const user = users.find((u) => String(u.id) === String(req.session.userId));
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "رمز فعلی اشتباه است" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  appendUserHistory(user, "password_changed");
  await saveUsers(users);
  res.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد" });
});

module.exports = router;
