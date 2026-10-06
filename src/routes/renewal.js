const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { requireUser, requireAdmin } = require("../middleware/auth");
const { loadUsers, saveUsers } = require("../store/users");
const config = require("../config");

const file = path.join(config.rootDir, "data", "renewal-requests.json");
function load() { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return []; } }
function save(l) { fs.writeFileSync(file, JSON.stringify(l, null, 2)); }
function now() { return new Date().toISOString(); }

function notifyUser(username, text) {
  try {
    const users = loadUsers();
    const u = users.find(x => x.username === username);
    if (!u) return;
    if (u.phone) {
      try {
        const { sendSms } = require("../utils/sms");
        sendSms(u.phone, text, function () {});
      } catch (e) {}
    }
    const token = process.env.TG_BOT_TOKEN, admin = process.env.TG_ADMIN_ID;
    if (token && admin) {
      fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: admin, text: " " + text })
      }).catch(function () {});
    }
  } catch (e) {}
}

router.post("/", requireUser, (req, res) => {
  try {
    const planId = String((req.body && req.body.planId) || "").trim();
    if (!planId) return res.status(400).json({ error: "پلن انتخاب نشده" });
    const plansFile = path.join(config.rootDir, "data", "plans.json");
    let plans = [];
    try { plans = JSON.parse(fs.readFileSync(plansFile, "utf8")); } catch (e) {}
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ error: "پلن یافت نشد" });
    const list = load();
    const username = req.session.username;
    const existing = list.find(r => r.username === username && r.status === "pending");
    if (existing) return res.status(400).json({ error: "شما یک درخواست باز دارید" });
    list.push({
      id: "r" + Date.now().toString(36),
      username: username,
      planId: planId,
      planName: plan.name,
      planDays: plan.days,
      planTraffic: plan.traffic,
      status: "pending",
      createdAt: now()
    });
    save(list);
    notifyUser(username, "درخواست تمدید از " + username + " برای پلن " + plan.name);
    res.json({ ok: true });
  } catch (e) {
    console.error("renewal POST error:", e);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/", requireAdmin, (req, res) => {
  try {
    const list = load().filter(r => r.status === "pending").sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ requests: list });
  } catch (e) {
    console.error("renewal GET error:", e);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/:id/approve", requireAdmin, (req, res) => {
  try {
    const list = load();
    const r = list.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "درخواست یافت نشد" });
    const users = loadUsers();
    const u = users.find(x => x.username === r.username);
    if (!u) return res.status(404).json({ error: "کاربر یافت نشد" });
    const nowDate = new Date();
    const expDate = new Date(nowDate.getTime() + r.planDays * 86400000);
    const expStr = String(expDate.getDate()).padStart(2, "0") + "-" + String(expDate.getMonth() + 1).padStart(2, "0") + "-" + expDate.getFullYear();
    u.expiry = expStr;
    u.traffic = (Number(u.traffic) || 0) + r.planTraffic;
    u.active = true;
    u.authVersion = Number(u.authVersion || 0) + 1;
    saveUsers(users);
    r.status = "approved";
    try { sendNotification(u.username, "تأیید تمدید", "درخواست تمدید شما تأیید شد. اشتراک شما به‌روز شد."); } catch(e){}
    r.approvedAt = now();
    save(list);
    try { notifyUser(u.username, "اشتراک شما تمدید شد! انقضا: " + expStr + " | حجم: " + u.traffic + " GB"); } catch (e) {}
    res.json({ ok: true, newExpiry: expStr, newTraffic: u.traffic });
  } catch (e) {
    console.error("approve error:", e.message, e.stack);
    res.status(500).json({ error: "خطای سرور: " + e.message });
  }
});

router.post("/:id/reject", requireAdmin, (req, res) => {
  try {
    const list = load();
    const r = list.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "درخواست یافت نشد" });
    r.status = "rejected";
    r.rejectedAt = now();
    save(list);
    try { notifyUser(r.username, "درخواست تمدید شما رد شد"); } catch (e) {}
    res.json({ ok: true });
  } catch (e) {
    console.error("reject error:", e);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;
