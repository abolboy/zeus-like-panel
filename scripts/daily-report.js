try { require("dotenv").config(); } catch (e) {}
const { loadUsers } = require("../src/store/users");
const { loadServers } = require("../src/store/servers");

const TG_TOKEN = process.env.TG_BOT_TOKEN || "";
const TG_ADMIN = process.env.TG_ADMIN_ID || "";

function round(x) { return Math.round(x * 100) / 100; }

function expiryDays(e) {
  if (!e) return null;
  const p = String(e).split("-").map(Number);
  if (p.length !== 3) return null;
  const d = new Date(p[2], p[1] - 1, p[0]);
  const t = new Date();
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.floor((d.getTime() - t0.getTime()) / 86400000);
}

function dayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const users = loadUsers() || [];
const servers = loadServers() || [];
const now = new Date();
const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yKey = dayKey(new Date(today0.getTime() - 86400000));

let active = 0, inactive = 0, exp7 = 0, expired = 0, used = 0, total = 0, newYesterday = 0;
const expList = [];
users.forEach(function (u) {
  const dd = expiryDays(u.expiry);
  const isExp = dd !== null && dd < 0;
  if (u.active && !isExp) active++; else inactive++;
  if (isExp) expired++;
  if (dd !== null && dd >= 0 && dd <= 7) { exp7++; expList.push(u.username + ": " + dd + " روز"); }
  used += Number(u.trafficUsed) || 0;
  total += Number(u.traffic) || 0;
  if (String(u.createdAt || "").slice(0, 10) === yKey) newYesterday++;
});

const top = users.map(function (u) { return { n: u.username, g: round(Number(u.trafficUsed) || 0) }; })
  .sort(function (a, b) { return b.g - a.g; }).slice(0, 3);
const srvActive = servers.filter(function (s) { return s.active; }).length;
const dateStr = now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate();

const tgMsg = "📊 گزارش روزانه پنل زئوس\n📅 " + dateStr + "\n\n" +
  "👥 کاربران: " + users.length + " (فعال " + active + " | غیرفعال " + inactive + ")\n" +
  "🆕 جدید دیروز: " + newYesterday + "\n" +
  "⏳ انقضا تا ۷ روز: " + exp7 + "\n" +
  "⛔ منقضی‌شده: " + expired + "\n" +
  "📊 مصرف کل: " + round(used) + " از " + round(total) + " GB\n" +
  "🖥 سرورها: " + srvActive + " فعال از " + servers.length + "\n\n" +
  (expList.length ? "⚠️ انقضای نزدیک:\n- " + expList.join("\n- ") + "\n\n" : "") +
  (top.length ? "🏆 پرمصرف‌ها:\n" + top.map(function (t, i) { return (i + 1) + ". " + t.n + ": " + t.g + " GB"; }).join("\n") : "");

console.log("─── پیش‌نمایش ───\n" + tgMsg + "\n───────────────");

if (TG_TOKEN && TG_ADMIN) {
  fetch("https://api.telegram.org/bot" + TG_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_ADMIN, text: tgMsg })
  }).then(function (r) { return r.json(); })
    .then(function (d) { console.log("Telegram:", d.ok ? "OK ✅" : "FAIL ❌ " + (d.description || "")); })
    .catch(function (e) { console.log("Telegram: FAIL ❌", e.message); });
} else {
  console.log("Telegram: SKIP (توکن/آیدی نیست)");
}
