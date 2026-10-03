const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
let snapshot = {};
const notified = new Set();

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")); }
  catch (e) { return null; }
}

function listFiles() {
  try { return fs.readdirSync(dataDir).filter(f => f.endsWith(".json")); }
  catch (e) { return []; }
}

function usernameOf(item) {
  return item.username || item.user || item.userName || null;
}

function notify(username, title, body, key) {
  if (!username || notified.has(key)) return;
  notified.add(key);
  try {
    if (typeof global.sendNotification === "function") {
      global.sendNotification(username, title, body);
    }
  } catch (e) {}
}

function daysLeft(expiry) {
  if (!expiry) return null;
  const parts = String(expiry).trim().split("-");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) ||
      day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2200) {
    return null;
  }
  const expiryDate = new Date(year, month - 1, day, 23, 59, 59);
  if (expiryDate.getFullYear() !== year ||
      expiryDate.getMonth() !== month - 1 ||
      expiryDate.getDate() !== day ||
      isNaN(expiryDate.getTime())) {
    return null;
  }
  return Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
}

function scan() {
  const files = listFiles();
  const current = {};

  files.forEach(file => {
    const data = readJson(file);
    if (!Array.isArray(data)) return;
    current[file] = data;
    const prev = snapshot[file] || [];

    data.forEach(item => {
      const uname = usernameOf(item);
      if (!uname) return;
      const id = item.id || (uname + "_" + (item.time || item.createdAt || ""));
      const prevItem = prev.find(p => (p.id || (usernameOf(p) + "_" + (p.time || p.createdAt || ""))) === id);

      // ۱) تأیید تمدید
      if (item.status && prevItem && prevItem.status !== item.status && /approved|accepted|تایید|تأیید/i.test(item.status)) {
        notify(uname, "✅ تأیید تمدید", "درخواست تمدید شما تأیید شد و اشتراک به‌روزرسانی شد.", "renew_" + id);
      }

      // ۲) پاسخ به تیکت
      const replies = Array.isArray(item.replies) ? item.replies.length : (Array.isArray(item.messages) ? item.messages.length : 0);
      const prevReplies = prevItem ? (Array.isArray(prevItem.replies) ? prevItem.replies.length : (Array.isArray(prevItem.messages) ? prevItem.messages.length : 0)) : 0;
      if (prevItem && replies > prevReplies) {
        notify(uname, "💬 پاسخ تیکت", "به تیکت شما پاسخ داده شد. لطفاً بررسی کنید.", "ticket_" + id + "_" + replies);
      }
      if (item.status && prevItem && prevItem.status !== item.status && /answered|answered|پاسخ/i.test(item.status)) {
        notify(uname, "💬 پاسخ تیکت", "به تیکت شما پاسخ داده شد. لطفاً بررسی کنید.", "ticketst_" + id);
      }

      // ۳) نزدیک‌بودن انقضا (فقط برای فایل کاربران)
      if (item.expiry) {
        const dl = daysLeft(item.expiry);
        if (dl !== null && dl <= 3 && dl >= 0) {
          const today = new Date().toDateString();
          notify(uname, "⏳ انقضای نزدیک", "اشتراک شما تا " + dl + " روز دیگر منقضی می‌شود. لطفاً تمدید کنید.", "exp_" + uname + "_" + today);
        }
      }
    });
  });

  snapshot = current;
}

// اسکن اولیه + هر ۲۰ ثانیه
setTimeout(scan, 3000);
setInterval(scan, 20000);
console.log("✅ Notifier Watcher فعال شد");
