const express = require("express");
const router = express.Router();

const { loadUsers } = require("../store/users");
const { loadServers } = require("../store/servers");
const { loadLogs } = require("../utils/audit");
const { requireAdmin } = require("../middleware/auth");

function dayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function expiryDate(expiry) {
  if (!expiry) return null;
  const p = String(expiry).split("-").map(Number);
  if (p.length !== 3) return null;
  return new Date(p[2], p[1] - 1, p[0]);
}

router.get("/", requireAdmin, (req, res) => {
  try {
    const users = loadUsers() || [];
    const servers = loadServers() || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let allocated = 0, used = 0, active = 0, inactive = 0, exp7 = 0, exp30 = 0;
    users.forEach(function (u) {
      allocated += Number(u.traffic) || 0;
      used += Number(u.trafficUsed) || 0;
      const ed = expiryDate(u.expiry);
      const isExp = ed ? ed.getTime() < today.getTime() : false;
      if (u.active && !isExp) active += 1; else inactive += 1;
      if (ed) {
        const diff = (ed.getTime() - today.getTime()) / 86400000;
        if (diff >= 0 && diff <= 7) exp7 += 1;
        if (diff >= 0 && diff <= 30) exp30 += 1;
      }
    });

    const growth = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = dayKey(d);
      const count = users.filter(function (u) { return String(u.createdAt || "").slice(0, 10) === key; }).length;
      growth.push({ date: key, count: count });
    }

    const forecast = { w1: 0, w2: 0, m1: 0, later: 0, expired: 0 };
    users.forEach(function (u) {
      const ed = expiryDate(u.expiry);
      if (!ed) return;
      const diff = Math.floor((ed.getTime() - today.getTime()) / 86400000);
      if (diff < 0) forecast.expired += 1;
      else if (diff <= 7) forecast.w1 += 1;
      else if (diff <= 14) forecast.w2 += 1;
      else if (diff <= 30) forecast.m1 += 1;
      else forecast.later += 1;
    });

    const byServer = {};
    users.forEach(function (u) {
      const m = u.trafficUsageByServer;
      if (m && typeof m === "object") {
        Object.keys(m).forEach(function (k) { byServer[k] = (byServer[k] || 0) + (Number(m[k]) || 0); });
      }
    });
    const serverLoad = servers.map(function (s) {
      return { name: s.name, gb: Math.round((byServer[String(s.id)] || 0) * 100) / 100 };
    });

    const topUsers = users
      .filter(function (u) { return (Number(u.traffic) || 0) > 0; })
      .map(function (u) {
        const t = Number(u.traffic) || 1;
        const us = Number(u.trafficUsed) || 0;
        return { username: u.username, used: Math.round(us * 100) / 100, total: Number(u.traffic), pct: Math.min(100, Math.round((us / t) * 100)) };
      })
      .sort(function (a, b) { return b.pct - a.pct; })
      .slice(0, 8);

    const logs = loadLogs();
    const activity = logs.slice(-8).reverse().map(function (l) {
      return { event: l.event, admin: l.admin, time: l.timestamp };
    });

    res.json({
      kpis: {
        total: users.length,
        active: active,
        inactive: inactive,
        exp7: exp7,
        exp30: exp30,
        allocated: Math.round(allocated * 100) / 100,
        used: Math.round(used * 100) / 100,
        usagePct: allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0
      },
      growth: growth,
      forecast: forecast,
      serverLoad: serverLoad,
      topUsers: topUsers,
      activity: activity
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
