const express = require("express");
const router = express.Router();

const { loadUsers } = require("../store/users");
const { requireAdmin } = require("../middleware/auth");

router.get("/", requireAdmin, (req, res) => {
  const users = loadUsers();
  const total = users.length;
  const active = users.filter((u) => u.active).length;
  const inactive = total - active;

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const expiring = users.filter((u) => {
    if (!u.expiry) return false;
    const parts = String(u.expiry).trim().split("-");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    const time = new Date(year, month - 1, day, 23, 59, 59).getTime();
    return time >= now && time <= now + week;
  }).length;

  res.json({ total, active, inactive, expiring });
});

module.exports = router;
