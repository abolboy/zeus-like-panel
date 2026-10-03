const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { loadLogs } = require("../utils/audit");

router.get("/", requireAdmin, (req, res) => {
  const logs = loadLogs();
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const recent = logs.slice(-limit).reverse();
  res.json({ logs: recent, total: logs.length });
});

router.delete("/", requireAdmin, (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const config = require("../config");
  const logPath = path.join(config.dataDir, "audit-log.json");
  fs.writeFileSync(logPath, "[]");
  res.json({ ok: true });
});

module.exports = router;