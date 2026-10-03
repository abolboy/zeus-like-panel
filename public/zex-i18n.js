(function () {
  "use strict";
  var fa2en = {
    "کاربران": "Users", "سرورها": "Servers", "گزارش‌ها": "Reports", "تنظیمات": "Settings", "خروج": "Logout",
    "کل کاربران": "Total Users", "فعال": "Active", "غیرفعال": "Inactive",
    "رو به انقضا (هفته آینده)": "Expiring (next week)", "لیست کاربران": "Users List",
    "جستجوی کاربر...": "Search user...", "+ افزودن کاربر": "+ Add User", "همه وضعیت‌ها": "All Statuses",
    "همه سرورها": "All Servers", "تاریخ انقضا": "Expiry Date", "حجم": "Volume", "نامحدود": "Unlimited",
    "روز مانده": "days left", "مدیریت کاربران": "User Management",
    "فهرست، وضعیت و اشتراک‌های کاربران سرویس": "List, status and subscriptions of service users",
    "مدیریت سرورها": "Server Management", "مدیریت سرورهای متصل به سرویس": "Manage connected servers",
    "افزودن سرور جدید": "Add New Server", "نام سرور": "Server Name", "آدرس": "Address", "پورت": "Port",
    "وضعیت": "Status", "عملیات": "Actions", "نام": "Name", "آنلاین": "Online", "آفلاین": "Offline", "قطعی": "Down",
    "رشد کاربران و درخواست‌های تمدید در انتظار": "User growth and pending renewal requests",
    "درخواست‌های تمدید در انتظار بررسی": "Pending Renewal Requests",
    "درخواست تمدیدی در انتظار نیست.": "No pending renewal requests.",
    "مصرف کل (۳۰ روز) + پرمصرف‌ها": "Total Usage (30 days) + Top Users",
    "هنوز داده‌ای نیست — پس از اولین گزارش Agent ثبت می‌شود.": "No data yet — recorded after first Agent report.",
    "نمودار پیشرفته": "Advanced Charts", "تحلیل پیشرفته": "Advanced Analytics",
    "کاربران جدید (۳۰ روز)": "New Users (30 days)", "پیش‌بینی انقضا": "Expiry Forecast",
    "بار سرورها": "Server Load", "پرمصرف‌ترین‌ها": "Top Consumption", "فعالیت‌های اخیر": "Recent Activity",
    "نرخ مصرف": "Usage", "مصرف کل": "Total Used", "انقضا تا ۷ روز": "Expiring (7d)",
    "۰-۷ روز": "0-7d", "۸-۱۴ روز": "8-14d", "۱۵-۳۰ روز": "15-30d", "بیش از ۳۰ روز": ">30d", "منقضی شده": "Expired",
    "تست اعلان": "Test Notification", "خروجی / ورودی کاربران": "Export / Import Users",
    "دانلود خروجی": "Download Export", "وارد کردن": "Import",
    "امنیت دومرحله‌ای (OTP)": "Two-Factor Authentication (OTP)",
    "وضعیت: غیرفعال": "Status: Disabled", "وضعیت: فعال ✅": "Status: Enabled ✅",
    "راه‌اندازی / فعال‌سازی": "Setup / Enable", "غیرفعال‌سازی": "Disable",
    "لاگ فعالیت‌ها": "Activity Log", "بروزرسانی": "Refresh", "پاک کردن": "Clear", "لاگی ثبت نشده": "No logs recorded",
    "نام پنل": "Panel Name", "نام نمایشی پنل": "Panel display name", "ذخیره": "Save",
    "پشتیبان‌گیری کامل": "Full Backup", "دانلود بکاپ": "Download Backup",
    "ورود به پنل مدیریت": "Admin Login", "نام کاربری": "Username", "رمز عبور": "Password",
    "مرا به خاطر بسپار": "Remember me", "ورود": "Sign In", "کاربر": "User", "وضعیت فعلی": "Current Status",
    "تاریخ درخواست": "Request Date", "تأیید": "Approve", "رد": "Reject", "بستن": "Close", "انصراف": "Cancel", "گیگ": "GB"
  };
  var en2fa = {};
  Object.keys(fa2en).forEach(function (k) { if (en2fa[fa2en[k]] === undefined) en2fa[fa2en[k]] = k; });
  function currentLang() { return localStorage.getItem("zex-lang") || "fa"; }
  function applyI18n() {
    var lang = currentLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    var map = lang === "en" ? fa2en : en2fa;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node, batch = [];
    while ((node = walker.nextNode())) {
      var trimmed = node.textContent.trim();
      if (trimmed && map[trimmed] !== undefined) batch.push([node, map[trimmed]]);
    }
    batch.forEach(function (p) { p[0].textContent = p[1]; });
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(function (el) {
      var p = el.getAttribute("placeholder");
      if (map[p] !== undefined) el.setAttribute("placeholder", map[p]);
    });
    var btn = document.getElementById("zexLangBtn");
    if (btn) btn.textContent = lang === "fa" ? "EN" : "فا";
  }
  function injectLangButton() {
    if (document.getElementById("zexLangBtn")) return;
    var btn = document.createElement("button");
    btn.id = "zexLangBtn";
    btn.style.cssText = "position:fixed;bottom:14px;left:64px;z-index:4500;width:42px;height:42px;border-radius:50%;border:1px solid var(--border,#212942);background:var(--panel,#0e1220);color:var(--gold,#f2b705);font-size:13px;font-weight:bold;cursor:pointer;";
    btn.addEventListener("click", function () {
      var next = currentLang() === "fa" ? "en" : "fa";
      localStorage.setItem("zex-lang", next);
      applyI18n();
      window.dispatchEvent(new Event("zex-lang-change"));
    });
    document.body.appendChild(btn);
  }
  function init() {
    injectLangButton();
    applyI18n();
    if (typeof window.loadData === "function" && !window._zexLoadWrapped) {
      var orig = window.loadData;
      window.loadData = function () { var r = orig.apply(this, arguments); setTimeout(applyI18n, 250); return r; };
      window._zexLoadWrapped = true;
    }
    setInterval(applyI18n, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
