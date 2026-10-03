const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { requireUser, requireAdmin } = require("../middleware/auth");
const config = require("../config");

const file = path.join(config.rootDir, "data", "tickets.json");
function load() { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return []; } }
function save(list) { fs.writeFileSync(file, JSON.stringify(list, null, 2)); }
function now() { return new Date().toISOString(); }
function tgNotify(text) {
  const token = process.env.TG_BOT_TOKEN, admin = process.env.TG_ADMIN_ID;
  if (!token || !admin) return;
  fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: admin, text: text })
  }).catch(function () {});
}

router.post("/", requireUser, (req, res) => {
  const text = String((req.body && req.body.text) || "").trim();
  if (!text) return res.status(400).json({ error: "متن خالی است" });
  const list = load();
  const username = req.session.username;
  let t = list.find(x => x.username === username && x.status === "open");
  if (!t) { t = { id: "t" + Date.now().toString(36), username: username, status: "open", messages: [], createdAt: now() }; list.push(t); }
  t.messages.push({ from: "user", text: text, time: now() });
  t.updatedAt = now();
  save(list);
  tgNotify("🎫 تیکت جدید از " + username + ":\n" + text.slice(0, 200));
  res.json({ ok: true, id: t.id });
});

router.get("/mine", requireUser, (req, res) => {
  const list = load();
  const mine = list.filter(x => x.username === req.session.username);
  const t = mine.find(x => x.status === "open") || mine.slice(-1)[0] || null;
  res.json({ ticket: t });
});

router.get("/", requireAdmin, (req, res) => {
  const list = load().slice().sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  res.json({
    tickets: list.map(t => ({
      id: t.id, username: t.username, status: t.status, count: t.messages.length,
      last: t.messages.length ? t.messages[t.messages.length - 1] : null, updatedAt: t.updatedAt
    }))
  });
});

router.get("/:id", requireAdmin, (req, res) => {
  const t = load().find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "پیدا نشد" });
  res.json({ ticket: t });
});

router.post("/:id/reply", requireAdmin, (req, res) => {
  const text = String((req.body && req.body.text) || "").trim();
  if (!text) return res.status(400).json({ error: "متن خالی است" });
  const list = load();
  const t = list.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "پیدا نشد" });
  t.messages.push({ from: "admin", text: text, time: now() });
  t.updatedAt = now();
  save(list);
  res.json({ ok: true });
});

router.post("/:id/close", requireAdmin, (req, res) => {
  const list = load();
  const t = list.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "پیدا نشد" });
  t.status = "closed";
  t.updatedAt = now();
  save(list);
  res.json({ ok: true });
});

module.exports = router;
