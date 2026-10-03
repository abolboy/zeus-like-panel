try { require("dotenv").config(); } catch (e) {}
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const TOKEN = String(process.env.TG_BOT_TOKEN || "");
const ADMIN_ID = String(process.env.TG_ADMIN_ID || "");
if (!TOKEN) { console.error("TG_BOT_TOKEN is missing"); process.exit(1); }
const API = "https://api.telegram.org/bot" + TOKEN;

const { loadUsers, saveUsers } = require("../src/store/users");
const { loadServers } = require("../src/store/servers");
const config = require("../src/config");

function api(method, body) {
  return fetch(API + "/" + method, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function (r) { return r.json(); }).catch(function (e) { return { ok: false, description: e.message }; });
}

function send(chatId, text, keyboard) {
  var body = { chat_id: chatId, text: text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = { keyboard: keyboard, resize_keyboard: true };
  return api("sendMessage", body);
}

// کیبورد اصلی با ایموجی
var MAIN_KEYBOARD = [
  ["📊 آمار", "👥 کاربران"],
  ["⏳ انقضا", "📦 بکاپ"],
  ["🔄 قطع خودکار", "❓ راهنما"]
];

function expiryDays(e) {
  if (!e) return null;
  const p = String(e).split("-").map(Number);
  if (p.length !== 3) return null;
  const d = new Date(p[2], p[1] - 1, p[0]);
  const t = new Date();
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.floor((d.getTime() - t0.getTime()) / 86400000);
}

function statusText() {
  const users = loadUsers() || [];
  let active = 0, inactive = 0, exp7 = 0, used = 0, total = 0;
  users.forEach(function (u) {
    const dd = expiryDays(u.expiry);
    const isExp = dd !== null && dd < 0;
    if (u.active && !isExp) active++; else inactive++;
    if (dd !== null && dd >= 0 && dd <= 7) exp7++;
    used += Number(u.trafficUsed) || 0;
    total += Number(u.traffic) || 0;
  });
  return "⚡ وضعیت پنل زئوس\n\n👥 کل کاربران: " + users.length + "\n✅ فعال: " + active + "\n❌ غیرفعال/منقضی: " + inactive + "\n⏳ انقضا تا ۷ روز: " + exp7 + "\n📊 مصرف کل: " + (Math.round(used * 100) / 100) + " از " + (Math.round(total * 100) / 100) + " GB";
}

function usersText() {
  const users = loadUsers() || [];
  if (!users.length) return "هنوز کاربری نیست.";
  return "👥 کاربران:\n\n" + users.slice(0, 30).map(function (u) {
    const dd = expiryDays(u.expiry);
    const st = !u.active ? "❌" : (dd !== null && dd < 0 ? "⛔" : (dd !== null && dd <= 7 ? "⚠️" : "✅"));
    return st + " " + u.username + " | " + (u.expiry || "-");
  }).join("\n");
}

function expireText() {
  const users = (loadUsers() || []).filter(function (u) {
    const dd = expiryDays(u.expiry);
    return dd !== null && dd >= 0 && dd <= 7;
  });
  if (!users.length) return "🎉 کسی تا ۷ روز دیگر منقضی نمی‌شود.";
  return "⏳ انقضای نزدیک:\n\n" + users.map(function (u) { return "⚠️ " + u.username + " — " + expiryDays(u.expiry) + " روز مانده"; }).join("\n");
}

function helpText() {
  return "دستورات:\n/status — آمار پنل\n/users — لیست کاربران\n/expire — انقضای نزدیک\n/toggle username — فعال/غیرفعال\n/backup — بکاپ و ارسال فایل\n/help — راهنما";
}

function toggleUser(name, chatId) {
  if (!name) return send(chatId, "نام کاربر را بنویس: /toggle username", MAIN_KEYBOARD);
  const users = loadUsers() || [];
  const u = users.find(function (x) { return x.username === name; });
  if (!u) return send(chatId, "❌ کاربر پیدا نشد: " + name, MAIN_KEYBOARD);
  u.active = !u.active;
  saveUsers(users);
  send(chatId, (u.active ? "✅ فعال شد: " : "❌ غیرفعال شد: ") + name, MAIN_KEYBOARD);
}

function doBackup(chatId) {
  send(chatId, "⏳ در حال گرفتن بکاپ...", MAIN_KEYBOARD);
  execFile("npm", ["run", "backup"], { cwd: config.rootDir }, function (err) {
    if (err) return send(chatId, "❌ خطا در بکاپ: " + err.message, MAIN_KEYBOARD);
    const dir = path.join(config.rootDir, "backups");
    const files = fs.readdirSync(dir).filter(function (f) { return f.endsWith(".tar.gz"); }).map(function (f) { return { f: f, t: fs.statSync(path.join(dir, f)).mtimeMs }; }).sort(function (a, b) { return b.t - a.t; });
    if (!files.length) return send(chatId, " فایل بکاپ پیدا نشد", MAIN_KEYBOARD);
    const file = path.join(dir, files[0].f);
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", new Blob([fs.readFileSync(file)]), files[0].f);
    fetch(API + "/sendDocument", { method: "POST", body: form }).then(function (r) { return r.json(); }).then(function (d) {
      send(chatId, d.ok ? "✅ بکاپ ارسال شد" : "❌ ارسال نشد: " + (d.description || ""), MAIN_KEYBOARD);
    }).catch(function (e) { send(chatId, "❌ خطا: " + e.message, MAIN_KEYBOARD); });
  });
}

// Handler هوشمند: تشخیص دستور از متن دکمه (با یا بدون ایموجی)
function resolveCommand(text) {
  var t = text.trim();
  // دستورات اسلش
  if (t.startsWith("/")) return t.split(/\s+/)[0];
  // دکمه‌های کیبورد — بررسی با includes برای انعطاف‌پذیری
  if (t.includes("آمار")) return "/status";
  if (t.includes("کاربران")) return "/users";
  if (t.includes("انقضا")) return "/expire";
  if (t.includes("بکاپ")) return "/backup";
  if (t.includes("قطع خودکار")) return "/autocut";
  if (t.includes("راهنما")) return "/help";
  return null;
}

let offset = 0;
function loop() {
  fetch(API + "/getUpdates?timeout=8&offset=" + offset)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok && Array.isArray(d.result)) {
        d.result.forEach(function (up) {
          offset = up.update_id + 1;
          handle(up.message);
        });
      }
    })
    .catch(function () {})
    .finally(function () { setTimeout(loop, 1000); });
}

function handle(msg) {
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  if (ADMIN_ID && String(chatId) !== ADMIN_ID) { send(chatId, "⛔ شما دسترسی ندارید", MAIN_KEYBOARD); return; }
  const text = msg.text.trim();
  const parts = text.split(/\s+/);
  const cmd = resolveCommand(text);
  const arg = parts[1];

  if (!cmd) return send(chatId, "❓ دستور ناشناخته\n\n" + helpText(), MAIN_KEYBOARD);

  if (cmd === "/start" || cmd === "/help") send(chatId, "⚡ به ربات پنل زئوس خوش آمدی!\n\n" + helpText(), MAIN_KEYBOARD);
  else if (cmd === "/status") send(chatId, statusText(), MAIN_KEYBOARD);
  else if (cmd === "/users") send(chatId, usersText(), MAIN_KEYBOARD);
  else if (cmd === "/expire") send(chatId, expireText(), MAIN_KEYBOARD);
  else if (cmd === "/toggle") toggleUser(arg, chatId);
  else if (cmd === "/backup") doBackup(chatId);
  else if (cmd === "/autocut") send(chatId, "✅ قطع خودکار فعال است (هر ۳۰ دقیقه بررسی می‌شود)", MAIN_KEYBOARD);
  else send(chatId, "❓ دستور ناشناخته\n\n" + helpText(), MAIN_KEYBOARD);
}

console.log("🤖 ربات تلگرام زئوس با کیبورد دکمه‌ای روشن شد...");
loop();
