const express = require("express");
const router = express.Router();

const { loadSettings, saveSettings } = require("../store/settings");
const { requireAdmin } = require("../middleware/auth");

router.get("/", requireAdmin, (req, res) => res.json(loadSettings()));

router.post("/", requireAdmin, async (req, res) => {
  const { panelName } = req.body || {};
  if (!panelName?.trim() || panelName.trim().length > 80) return res.status(400).json({ error: "نام پنل باید بین 1 تا 80 کاراکتر باشد" });
  const settings = loadSettings();
  settings.panelName = panelName.trim();
  await saveSettings(settings);
  res.json({ ok: true, message: "نام پنل با موفقیت ذخیره شد", settings });
});

module.exports = router;
