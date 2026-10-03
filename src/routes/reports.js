const express = require("express");
const path = require("path");
const router = express.Router();
const { loadUsers } = require("../store/users");
const { loadServers } = require("../store/servers");
const { loadJSON } = require("../store/base");
const { requireAdmin } = require("../middleware/auth");
const config = require("../config");

function isExpired(expiry) {
  try {
    if (!expiry) return false;
    const parts = String(expiry).split("-").map(Number);
    if (parts.length !== 3) return false;
    return new Date(parts[2], parts[1] - 1, parts[0], 23, 59, 59).getTime() < Date.now();
  } catch { return false; }
}

router.get("/traffic", requireAdmin, (req, res) => {
  try {
    const hist = loadJSON(path.join(config.dataDir, "traffic-history.json"), {});
    const users = loadUsers() || [];
    const top = users.map(u => ({ username: u.username, used: Math.round((Number(u.trafficUsed)||0)*100)/100, total: Number(u.traffic)||0 })).sort((a,b)=>b.used-a.used).slice(0,8);
    const days = Object.keys(hist).sort().slice(-30).map(k => ({ date: k, gb: hist[k] }));
    res.json({ days, top });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/advanced", requireAdmin, (req, res) => {
  try {
    const users = loadUsers() || [];
    const servers = loadServers() || [];
    const daily = loadJSON(path.join(config.dataDir, "traffic-daily.json"), {});
    const days = Object.keys(daily).sort().slice(-30).map(k => ({ date: k, gb: daily[k] }));
    const byServer = {};
    users.forEach(u => {
      if (u.trafficUsageByServer && typeof u.trafficUsageByServer === "object") {
        Object.entries(u.trafficUsageByServer).forEach(([sid, val]) => { byServer[sid] = (byServer[sid]||0) + (Number(val)||0); });
      }
    });
    const serverLabels = servers.map(s => s.name);
    const serverData = servers.map(s => byServer[String(s.id)] || 0);
    const statusCount = {
      active: users.filter(u => u.active && !isExpired(u.expiry)).length,
      expiring: users.filter(u => { if (!u.active || isExpired(u.expiry)) return false; const p = String(u.expiry).split("-").map(Number); return new Date(p[2], p[1]-1, p[0]).getTime() < Date.now() + 7*86400000; }).length,
      inactive: users.filter(u => !u.active || isExpired(u.expiry)).length
    };
    res.json({ days, serverLabels, serverData, statusCount });
  } catch (err) { console.error("Advanced error:", err); res.status(500).json({ error: err.message }); }
});
module.exports = router;