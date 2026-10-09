const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { requireUser, requireAdmin } = require("../middleware/auth");
const { loadUsers, saveUsers } = require("../store/users");
const config = require("../config");

const file = path.join(config.rootDir, "data", "renewal-requests.json");
const approving = new Set();
function load() {
  if (!fs.existsSync(file)) return [];
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(list)) {
    throw new Error("ساختار فایل درخواست‌های تمدید معتبر نیست");
  }
  return list;
}

function save(list) {
  if (!Array.isArray(list)) {
    throw new Error("فهرست درخواست‌های تمدید معتبر نیست");
  }
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, file);
}
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

router.post("/:id/approve", requireAdmin, async (req, res) => {
  const requestId = String(req.params.id);
  if (approving.has(requestId)) {
    return res.status(409).json({ error: "این درخواست در حال پردازش است" });
  }
  approving.add(requestId);
  try {
    const list = load();
    const r = list.find(x => String(x.id) === requestId);
    if (!r) return res.status(404).json({ error: "درخواست یافت نشد" });
    if (r.status === "approved") {
      const currentUsers = loadUsers();
      const currentUser = currentUsers.find(x => x.username === r.username);
      if (!currentUser) return res.status(404).json({ error: "کاربر یافت نشد" });
      return res.json({
        ok: true,
        alreadyApproved: true,
        newExpiry: currentUser.expiry,
        newTraffic: currentUser.traffic
      });
    }
    if (r.status !== "pending") {
      return res.status(409).json({ error: "وضعیت درخواست اجازه تأیید نمی‌دهد" });
    }
    const users = loadUsers();
    const u = users.find(x => x.username === r.username);
    if (!u) return res.status(404).json({ error: "کاربر یافت نشد" });

    const appliedIds = Array.isArray(u._renewalAppliedIds)
      ? u._renewalAppliedIds.map(String)
      : [];

    if (appliedIds.includes(requestId)) {
      r.status = "approved";
      r.approvedAt = r.approvedAt || now();
      save(list);
      return res.json({
        ok: true,
        alreadyApplied: true,
        newExpiry: u.expiry,
        newTraffic: u.traffic
      });
    }

    const planDays = Number(r.planDays);
    const planTraffic = Number(r.planTraffic);
    const currentTraffic = Number(u.traffic ?? 0);

    if (!Number.isFinite(planDays) || planDays <= 0 ||
        !Number.isFinite(planTraffic) || planTraffic < 0 ||
        !Number.isFinite(currentTraffic) || currentTraffic < 0) {
      return res.status(400).json({ error: "اطلاعات طرح تمدید معتبر نیست" });
    }

    const newTraffic = currentTraffic + planTraffic;
    if (!Number.isFinite(newTraffic)) {
      return res.status(400).json({ error: "مقدار ترافیک نهایی معتبر نیست" });
    }

    const nowDate = new Date();
    const expDate = new Date(nowDate.getTime() + planDays * 86400000);
    if (!Number.isFinite(expDate.getTime())) {
      return res.status(400).json({ error: "مدت تمدید معتبر نیست" });
    }

    const expStr = String(expDate.getDate()).padStart(2, "0") + "-" + String(expDate.getMonth() + 1).padStart(2, "0") + "-" + expDate.getFullYear();

    u.expiry = expStr;
    u.traffic = newTraffic;
    u.active = true;
    u.authVersion = Number(u.authVersion || 0) + 1;
    u._renewalAppliedIds = [...appliedIds, requestId];

    await saveUsers(users);

    r.status = "approved";
    try { sendNotification(u.username, "تأیید تمدید", "درخواست تمدید شما تأیید شد. اشتراک شما به‌روز شد."); } catch(e){}
    r.approvedAt = now();
    save(list);
    try { notifyUser(u.username, "اشتراک شما تمدید شد! انقضا: " + expStr + " | حجم: " + u.traffic + " GB"); } catch (e) {}
    res.json({ ok: true, newExpiry: expStr, newTraffic: u.traffic });
  } catch (e) {
    console.error("approve error:", e.message, e.stack);
    res.status(500).json({ error: "خطای سرور: " + e.message });
  } finally {
    approving.delete(requestId);
  }
});

router.post("/:id/reject", requireAdmin, (req, res) => {
  const requestId = String(req.params.id);

  if (approving.has(requestId)) {
    return res.status(409).json({ error: "این درخواست در حال پردازش است" });
  }

  try {
    const list = load();
    const r = list.find(x => String(x.id) === requestId);
    if (!r) return res.status(404).json({ error: "درخواست یافت نشد" });
    if (r.status !== "pending") {
      return res.status(409).json({ error: "وضعیت درخواست اجازه رد نمی‌دهد" });
    }

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
