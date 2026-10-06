const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("public/zex-i18n.js", "utf8");
new vm.Script(source, { filename: "public/zex-i18n.js" });

const required = [
  ["تنظیمات", "Settings"],
  ["بخش تنظیمات", "Settings Section"],
  ["نام پنل", "Panel Name"],
  ["نام نمایشی پنل", "Panel Display Name"],
  ["امنیت دومرحله‌ای (OTP)", "Two-Factor Authentication (OTP)"],
  ["درخواست‌های تمدید", "Renewal Requests"],
  ["در حال بررسی…", "Checking…"],
  ["در حال بارگذاری...", "Loading..."],
  ["خطا در بارگذاری", "Error loading"],
  ["پشتیبانی", "Support"],
  ["اعلان‌ها", "Notifications"]
];

for (const [fa, en] of required) {
  assert.ok(source.includes(JSON.stringify(fa) + ": " + JSON.stringify(en)), "Missing mapping: " + fa);
}

assert.ok(source.includes("MutationObserver"), "Dynamic DOM observer missing");
assert.ok(source.includes('[title],[aria-label],[placeholder]'), "Attribute translation missing");

const dashboard = fs.readFileSync("dashboard.html", "utf8");
assert.ok(dashboard.includes("/assets/zex-i18n.js?v=3"), "dashboard must load zex-i18n v3");

console.log("I18N_STATIC_OK");

const adminSectionsRequired = [
  ["مدیریت کاربران", "User Management"],
  ["مدیریت سرورها", "Server Management"],
  ["ویرایش", "Edit"],
  ["حذف", "Delete"],
  ["QR لینک اشتراک", "Subscription Link QR"],
  ["کپی لینک اشتراک", "Copy Subscription Link"],
  ["کاربر جدید اضافه شد", "New user added"],
  ["سرور اضافه شد", "Server added"],
  ["خطا در دریافت نمودار", "Error loading chart"],
  ["درخواست‌های تمدید", "Renewal Requests"],
  ["لاگ فعالیت‌ها", "Activity Log"],
  ["اعلان‌ها", "Notifications"]
];
for (const [fa, en] of adminSectionsRequired) {
  assert.ok(source.includes(JSON.stringify(fa) + ": " + JSON.stringify(en)), "Missing admin section mapping: " + fa);
}
assert.ok(source.includes("function translateText"), "Dynamic text translation helper missing");
assert.ok(source.includes('["حذف کاربر ", "Delete user "]'), "Dynamic user deletion translation missing");
assert.ok(source.includes('["حذف سرور ", "Delete server "]'), "Dynamic server deletion translation missing");
assert.ok(source.includes("document.title = translateText"), "Document title translation missing");
console.log("ADMIN_SECTIONS_I18N_OK");


const settingsRequired = [
  ["بخش تنظیمات", "Settings Section"],
  ["نام پنل و اطلاعات ورود مدیر", "Panel name and administrator login information"],
  ["تغییر نام کاربری مدیر", "Change Admin Username"],
  ["تغییر رمز عبور مدیر", "Change Admin Password"],
  ["رمز عبور جدید (حداقل ۱۲ کاراکتر)", "New Password (minimum 12 characters)"],
  ["پشتیبان‌گیری کامل", "Full Backup"],
  ["دانلود بکاپ", "Download Backup"],
  ["ذخیره", "Save"],
  ["انصراف", "Cancel"]
];
for (const [fa, en] of settingsRequired) {
  assert.ok(source.includes(JSON.stringify(fa) + ": " + JSON.stringify(en)), "Missing settings mapping: " + fa);
}
assert.ok(source.includes('fa2en["رمز عبور جدید (۱۲ تا ۷۲ بایت UTF-8)"] = "New Password (12–72 UTF-8 bytes)"'), "Updated password policy mapping missing");

const userHtml = fs.readFileSync("sub.html", "utf8");
assert.ok(userHtml.includes('/assets/zex-i18n.js?v=3'), "user dashboard must load zex-i18n v3");
const admin = fs.readFileSync("dashboard.html", "utf8");
assert.ok(admin.includes('minlength="12"'), "admin password UI must require 12 characters");
assert.ok(admin.includes("رمز عبور جدید (حداقل ۱۲ کاراکتر)"), "admin password label is stale");
console.log("SETTINGS_AND_USER_I18N_OK");
