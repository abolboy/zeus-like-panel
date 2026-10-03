const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { loadUsers } = require("../src/store/users");
const config = require("../src/config");

const WARN_DAYS = Number(process.env.SMS_WARN_DAYS || 3);
const dataDir = path.join(config.rootDir, "data");
fs.mkdirSync(dataDir, { recursive: true });
const sentFile = path.join(dataDir, "sms-sent.json");

function expiryDate(e) {
  if (!e) return null;
  const p = String(e).split("-").map(Number);
  if (p.length !== 3) return null;
  return new Date(p[2], p[1] - 1, p[0]);
}

function todayKey() {
  const n = new Date();
  return n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate();
}

const users = loadUsers() || [];
let sent = {};
try { sent = JSON.parse(fs.readFileSync(sentFile, "utf8")); } catch (e) { sent = {}; }

const today = new Date();
const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const queue = [];

users.forEach(function (u) {
  if (!u.phone) return;
  const ed = expiryDate(u.expiry);
  if (!ed) return;
  const diff = Math.floor((ed.getTime() - t0.getTime()) / 86400000);
  if (diff < 0 || diff > WARN_DAYS) return;
  if (sent[u.username] === todayKey()) return;
  queue.push({ u: u, diff: diff });
});

if (!queue.length) {
  console.log("[" + new Date().toISOString() + "] هیچ پیامکی لازم نیست");
  process.exit(0);
}

let i = 0;
function next() {
  if (i >= queue.length) {
    fs.writeFileSync(sentFile, JSON.stringify(sent, null, 2));
    console.log("[" + new Date().toISOString() + "] ارسال شد: " + queue.length + " پیامک");
    return;
  }
  const item = queue[i++];
  const msg = item.diff === 0
    ? "کاربر گرامی " + item.u.username + "، اشتراک شما امروز منقضی می‌شود. لطفاً برای تمدید اقدام کنید."
    : "کاربر گرامی " + item.u.username + "، اشتراک شما تا " + item.diff + " روز دیگر منقضی می‌شود. لطفاً برای تمدید اقدام کنید.";
  execFile("termux-sms-send", ["-n", item.u.phone, msg], function (err) {
    if (err) {
      console.error("SMS FAIL:", item.u.username, err.message);
    } else {
      sent[item.u.username] = todayKey();
      console.log("SMS OK:", item.u.username, "(" + item.diff + " روز مانده)");
    }
    setTimeout(next, 3000);
  });
}
next();
