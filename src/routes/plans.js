const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const config = require("../config");

const file = path.join(config.rootDir, "data", "plans.json");
function load() { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return []; } }
function save(l) { fs.writeFileSync(file, JSON.stringify(l, null, 2)); }

router.get("/", requireAdmin, (req, res) => {
  res.json({ plans: load() });
});

router.post("/", requireAdmin, (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const days = Number(b.days) || 0;
  const traffic = Number(b.traffic) || 0;
  if (!name || days <= 0) return res.status(400).json({ error: "نام و تعداد روز معتبر لازم است" });
  const list = load();
  list.push({ id: "p" + Date.now().toString(36), name: name, days: days, traffic: traffic });
  save(list);
  res.json({ ok: true });
});

router.delete("/:id", requireAdmin, (req, res) => {
  let list = load();
  const before = list.length;
  list = list.filter(x => x.id !== req.params.id);
  save(list);
  res.json({ ok: list.length < before });
});


router.get("/public", (req, res) => {
  res.json({ plans: load() });
});

module.exports = router;
