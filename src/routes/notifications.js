
const express = require("express");
const fs = require("fs");
const path = require("path");

function requireUser(req, res, next) {
  if (req.session && (req.session.username || req.session.user)) {
    req.username = req.session.username || req.session.user.username;
    return next();
  }
  return res.status(401).json({ error: "ورود کاربر لازم است" });
}

const router = express.Router();

const file = path.join(__dirname, "../../data/notifications.json");
function load() { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return []; } }
function save(list) { fs.writeFileSync(file, JSON.stringify(list, null, 2)); }

// دریافت نوتیفیکیشن‌های کاربر
router.get("/", requireUser, (req, res) => {
  const list = load().filter(n => n.username === req.session.username).sort((a,b) => b.time - a.time);
  res.json({ notifications: list });
});

// خواندن یک نوتیفیکیشن
router.post("/:id/read", requireUser, (req, res) => {
  const list = load();
  const n = list.find(x => x.id === req.params.id && x.username === req.session.username);
  if (n) { n.read = true; save(list); }
  res.json({ ok: true });
});

// تابع عمومی برای ارسال نوتیفیکیشن (برای استفاده در سایر روت‌ها)
global.sendNotification = function(username, title, body) {
  const list = load();
  list.push({
    id: "n" + Date.now(),
    username, title, body,
    read: false,
    time: Date.now()
  });
  save(list);
};

module.exports = router;
