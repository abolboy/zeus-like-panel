const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { loadLogs, logEvent } = require("../utils/audit");

router.get("/", requireAdmin, (req, res) => {
  try {
    const logs = loadLogs();
    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 500) : 100;
    const recent = logs.slice(-limit).reverse();
    res.json({ logs: recent, total: logs.length, integrity: "verified" });
  } catch {
    res.status(500).json({ error: "یکپارچگی لاگ حسابرسی تأیید نشد" });
  }
});

router.delete("/", requireAdmin, (req, res) => {
  logEvent("audit.delete.rejected", req.session.admin, { reason: "immutable_audit_policy" }, req);
  res.status(405).json({ error: "حذف لاگ‌های حسابرسی مجاز نیست" });
});

module.exports = router;
