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
assert.ok(dashboard.includes("/assets/zex-i18n.js?v=1"), "dashboard must load zex-i18n");

console.log("I18N_STATIC_OK");
