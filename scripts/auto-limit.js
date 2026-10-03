try { require("dotenv").config(); } catch (e) {}
const { loadUsers, saveUsers } = require("../src/store/users");
const { sendSms } = require("../src/utils/sms");
const { logEvent } = require("../src/utils/audit");

if (String(process.env.AUTO_LIMIT || "1") === "0") { console.log("Auto-limit غیرفعال است"); process.exit(0); }

const TG_TOKEN = process.env.TG_BOT_TOKEN || "";
const TG_ADMIN = process.env.TG_ADMIN_ID || "";

const users = loadUsers() || [];
const changed = [];
users.forEach(function (u) {
  const total = Number(u.traffic) || 0;
  const used = Number(u.trafficUsed) || 0;
  if (total > 0 && used >= total && u.active) {
    u.active = false;
    changed.push(u);
  }
});

if (!changed.length) { console.log("✅ هیچ کاربری به سقف مصرف نرسیده"); process.exit(0); }

saveUsers(users);

changed.forEach(function (u) {
  console.log("⛔ غیرفعال شد:", u.username);
  try { logEvent("user.auto-disable", "system", { username: u.username, reason: "traffic-limit" }, null); } catch (e) {}
  if (u.phone) {
    sendSms(u.phone, "کاربر گرامی " + u.username + "، حجم اشتراک شما به پایان رسید. برای تمدید با مدیر تماس بگیرید.", function (err) {
      if (!err) console.log("SMS OK:", u.username);
    });
  }
});

if (TG_TOKEN && TG_ADMIN) {
  const msg = "⛔ قطع خودکار حجم:\n" + changed.map(function (u) {
    return "- " + u.username + " (" + (Number(u.trafficUsed) || 0) + "/" + (Number(u.traffic) || 0) + " GB)";
  }).join("\n");
  fetch("https://api.telegram.org/bot" + TG_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_ADMIN, text: msg })
  }).catch(function () {});
}
