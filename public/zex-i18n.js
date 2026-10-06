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
  /* Extended coverage for static and dynamically rendered UI text. */
  Object.assign(fa2en, {
    "بخش تنظیمات": "Settings Section",
    "دسترسی کامل": "Full Access",
    "افزودن کاربر جدید": "Add New User",
    "نام نمایشی پنل": "Panel Display Name",
    "در حال بررسی…": "Checking…",
    "در حال بارگذاری...": "Loading...",
    "وضعیت: در حال بررسی…": "Status: Checking…",
    "راه‌اندازی کد دومرحله‌ای": "Set Up Two-Factor Authentication",
    "کد ۶ رقمی": "6-digit code",
    "فعال‌سازی": "Enable",
    "دومرحله‌ای فعال شد ✅ از این به بعد ورود = رمز + کد.": "Two-factor authentication enabled ✅ From now on, sign-in requires the password + code.",
    "درخواست‌های تمدید": "Renewal Requests",
    "درخواستی نیست": "No requests",
    "تأیید شد": "Approved",
    "رد شد": "Rejected",
    "پلن‌های اشتراک": "Subscription Plans",
    "پلن آماده (اختیاری)": "Preset Plan (Optional)",
    "پلن اضافه شد ✅": "Plan added ✅",
    "پلن حذف شد ✅": "Plan deleted ✅",
    "انتخاب شده": "Selected",
    "انتخاب همه": "Select All",
    "لغو انتخاب": "Clear Selection",
    "تیکت‌های پشتیبانی": "Support Tickets",
    "باز": "Open",
    "بسته": "Closed",
    "پاسخ": "Reply",
    "بستن تیکت": "Close Ticket",
    "تیکتی نیست": "No tickets",
    "پشتیبانی": "Support",
    "ارسال": "Send",
    "اعلان‌ها": "Notifications",
    "اعلان جدیدی ندارید 🍃": "You have no new notifications 🍃",
    "✓ خواندن همه": "✓ Mark All Read",
    "خطای شبکه": "Network error",
    "خطای ارتباط": "Connection error",
    "خطا در بارگذاری": "Error loading",
    "خطا در دریافت تنظیمات": "Error loading settings",
    "نام پنل ذخیره شد": "Panel name saved",
    "📊 مصرف ترافیک": "📊 Traffic Usage",
    "⏳ زمان باقی‌مانده": "⏳ Time Remaining",
    "📋 اطلاعات اشتراک": "📋 Subscription Information",
    "🔌 کانفیگ‌های اتصال": "🔌 Connection Configurations",
    "🔗 لینک سابسکریپشن": "🔗 Subscription Link",
    "🔑 تغییر رمز عبور": "🔑 Change Password",
    "🎫 پشتیبانی": "🎫 Support",
    "📤 ارسال تیکت": "📤 Send Ticket",
    "🚪 خروج از حساب کاربری": "🚪 Sign Out",
    "باقی‌مانده": "Remaining",
    "روزهای باقی‌مانده": "Days Remaining",
    "نزدیک انقضا": "Expiring Soon",
    "مصرف (GB)": "Usage (GB)",
    "مصرف کل (GB)": "Total Usage (GB)",
    "درخواست تمدید": "Renewal Request",
    "خطای ورود": "Login Error",
    "فعال": "Active",
    "غیرفعال": "Inactive",
    "نامشخص": "Unknown",
  });

  Object.assign(fa2en, {
    "دریافت بکاپ": "Download Backup",
    "دسترسی کامل": "Full Access",
    "تغییر نام کاربری مدیر": "Change Admin Username",
    "رمز عبور فعلی": "Current Password",
    "تغییر رمز عبور مدیر": "Change Admin Password",
    "رمز عبور جدید (حداقل ۶ کاراکتر)": "New Password (minimum 12 characters)",
    "رمز عبور جدید (حداقل ۱۲ کاراکتر)": "New Password (minimum 12 characters)",
    "نام پنل": "Panel Name",
    "نام نمایشی پنل": "Panel Display Name",
    "نام کاربری جدید": "New Username",
    "پشتیبان‌گیری کامل": "Full Backup",
    "دانلود یک فایل JSON شامل کاربران، سرورها و تنظیمات پنل (رمز مدیر ذخیره نمی‌شود).": "Download a JSON file containing users, servers and panel settings (admin password is not stored).",
    "دانلود بکاپ": "Download Backup",
    "ذخیره تغییرات": "Save Changes",
    "ثبت کاربر": "Create User",
    "افزودن": "Add",
    "حجم (GB)": "Volume (GB)",
    "تاریخ انقضا": "Expiry Date",
    "دسترسی به سرورها (خالی = همه‌ی سرورهای فعال)": "Server access (empty = all active servers)",
    "خالی بگذارید تا تغییر نکند": "Leave empty to keep unchanged",
    "ذخیره": "Save",
    "انصراف": "Cancel",
    "حذف شود؟": "Delete?",
    "این عملیات قابل بازگشت نیست.": "This operation cannot be undone.",
    "هنوز سروری اضافه نشده است.": "No servers have been added yet.",
    "هنوز سروری تعریف نشده است.": "No servers have been defined yet.",
    "بخش تنظیمات": "Settings Section",
    "نام پنل و اطلاعات ورود مدیر": "Panel name and administrator login information",
    "فهرست، وضعیت و اشتراک‌های کاربران سرویس": "List, status and subscriptions of service users",
    "مدیریت کاربران": "User Management",
    "مدیریت سرورهای متصل به سرویس": "Manage connected servers",
    "رشد کاربران و درخواست‌های تمدید در انتظار": "User growth and pending renewal requests",
    "درخواست‌های تمدید در انتظار بررسی": "Pending Renewal Requests",
    "درخواست تمدیدی در انتظار نیست.": "No pending renewal requests.",
    "درخواست‌های تمدید": "Renewal Requests",
    "تأیید (۳۰ روز)": "Approve (30 days)",
    "رد": "Reject",
    "تأیید": "Approve",
    "لیست کاربران": "Users List",
    "جستجوی کاربر...": "Search user...",
    "همه وضعیت‌ها": "All Statuses",
    "نزدیک انقضا": "Expiring Soon",
    "غیرفعال / منقضی": "Inactive / Expired",
    "+ افزودن کاربر": "+ Add User",
    "+ افزودن سرور": "+ Add Server",
    "هنوز داده‌ای نیست — پس از اولین گزارش Agent ثبت می‌شود.": "No data yet — recorded after the first Agent report.",
    "خطا در دریافت نمودار": "Error loading chart",
    "در حال ساخت…": "Building…",
    "در حال بارگذاری...": "Loading...",
    "در حال ساخت": "Building",
    "خطا در ساخت QR": "Error creating QR",
    "اول یک فایل انتخاب کن.": "Select a file first.",
    "وارد شد: ": "Imported: ",
    " اضافه، ": " added, ",
    " رد.": " rejected.",
    "فایل JSON معتبر نیست.": "Invalid JSON file.",
    "کد معتبر نیست": "Invalid code",
    "برای غیرفعال‌سازی رمز مدیر را وارد کن:": "Enter the admin password to disable it:",
    "مصرف کل (۳۰ روز) + پرمصرف‌ها": "Total Usage (30 days) + Top Users",
    "نمودار پیشرفته": "Advanced Charts",
    "کد دومرحله‌ای": "Two-Factor Authentication",
    "لاگ فعالیت‌ها": "Activity Log",
    "بروزرسانی": "Refresh",
    "پاک کردن": "Clear",
    "لاگی ثبت نشده": "No logs recorded",
    "پاک شد": "Cleared",
    "آیا مطمئن هستید؟ تمام لاگ‌ها پاک می‌شوند.": "Are you sure? All logs will be deleted.",
    "خطا در بارگذاری": "Error loading",
    "خطای ورود": "Login error",
    "خطای ارتباط": "Connection error",
    "خطای شبکه": "Network error",
    "مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند": "Your browser does not support notifications",
    "مجوز اعلان داده شد": "Notification permission granted",
    "مجوز اعلان رد شد": "Notification permission denied",
    "تست اعلان": "Test Notification",
    "اعلان‌ها": "Notifications",
    "اعلان جدیدی ندارید 🍃": "You have no new notifications 🍃",
    "✓ خواندن همه": "✓ Mark All Read",
    "ناوبری سریع": "Quick navigation",
    "زئوس": "Zeus",
    "فعال": "Active",
    "غیرفعال": "Inactive",
    "فعال ✅": "Active ✅",
    "غیرفعال ❌": "Inactive ❌",
    "منقضی شده": "Expired",
    "روز مانده": "days left",
    "وضعیت فعلی": "Current Status",
    "تاریخ درخواست": "Request Date",
    "عملیات": "Actions",
  });


  Object.assign(fa2en, {
    "گزارش‌ها": "Reports",
    "داشبورد مدیریت": "Admin Dashboard",
    "بخش کاربران": "Users Section",
    "بخش سرورها": "Servers Section",
    "بخش گزارش‌ها": "Reports Section",
    "مدیریت کاربران": "User Management",
    "مدیریت سرورها": "Server Management",
    "لیست کاربران": "Users List",
    "کل کاربران": "Total Users",
    "رو به انقضا (هفته آینده)": "Expiring (next week)",
    "جستجوی کاربر...": "Search user...",
    "+ افزودن کاربر": "+ Add User",
    "+ افزودن سرور": "+ Add Server",
    "همه وضعیت‌ها": "All Statuses",
    "همه سرورها": "All Servers",
    "همه‌ی سرورها": "All Servers",
    "سرور اختصاصی": "Dedicated Server",
    "سرور": "Server",
    "ویرایش": "Edit",
    "حذف": "Delete",
    "کپی لینک اشتراک": "Copy Subscription Link",
    "QR لینک اشتراک": "Subscription Link QR",
    "وضعیت کاربر تغییر کرد": "User status updated",
    "خطا در تغییر وضعیت": "Error changing status",
    "حذف کاربر ": "Delete user ",
    "این کاربر و دسترسی‌اش برای همیشه حذف می‌شود.": "This user and their access will be permanently deleted.",
    "کاربر حذف شد": "User deleted",
    "خطا در حذف کاربر": "Error deleting user",
    "لینک اشتراک کپی شد": "Subscription link copied",
    "خطا در کپی لینک": "Error copying link",
    "کاربر جدید اضافه شد": "New user added",
    "خطا در افزودن کاربر": "Error adding user",
    "تغییرات ذخیره شد": "Changes saved",
    "خطا در ویرایش کاربر": "Error editing user",
    "خطا در دریافت سرورها": "Error loading servers",
    "سرور اضافه شد": "Server added",
    "خطا در افزودن سرور": "Error adding server",
    "سرور ویرایش شد": "Server updated",
    "خطا در ویرایش سرور": "Error updating server",
    "وضعیت سرور تغییر کرد": "Server status updated",
    "خطا در تغییر وضعیت سرور": "Error changing server status",
    "حذف سرور ": "Delete server ",
    "این سرور از کانفیگ‌های همه‌ی کاربران مرتبط حذف می‌شود.": "This server will be removed from the configurations of all related users.",
    "سرور حذف شد": "Server deleted",
    "خطا در حذف سرور": "Error deleting server",
    "خطا در دریافت نمودار": "Error loading chart",
    "خطا در دریافت درخواست‌های تمدید": "Error loading renewal requests",
    "تمدید به مدت چند روز؟": "Renew for how many days?",
    "تمدید تأیید شد — انقضای جدید: ": "Renewal approved — new expiry: ",
    "خطا در تأیید تمدید": "Error approving renewal",
    "رد درخواست تمدید؟": "Reject renewal request?",
    "این درخواست بدون تمدید حذف می‌شود.": "This request will be removed without renewal.",
    "درخواست رد شد": "Request rejected",
    "خطا در رد درخواست": "Error rejecting request",
    "خطا": "Error",
    "نام کاربری مدیر تغییر کرد": "Admin username changed",
    "رمز عبور مدیر تغییر کرد": "Admin password changed",
    "در حال ساخت...": "Building...",
    "بستن": "Close",
    "وضعیت: ": "Status: ",
    "غیرفعال شد.": "Disabled.",
    "کد دومرحله‌ای": "Two-Factor Authentication",
    "کد ۶ رقمی از اپ احراز هویت را وارد کن.": "Enter the 6-digit code from your authenticator app.",
    "ورود": "Sign In",
    "خطای ورود": "Login error",
    "خطای ارتباط": "Connection error",
    "خطای شبکه": "Network error",
    "تست اعلان": "Test Notification",
    "🎉 تست اعلان": "🎉 Test Notification",
    "این یک اعلان تست از پنل زئوس است!": "This is a test notification from Zeus Panel!",
    "✅ اعلان تست ارسال شد!": "✅ Test notification sent!",
    "❌ مجوز اعلان رد شد": "❌ Notification permission denied",
    "✅ مجوز اعلان داده شد!": "✅ Notification permission granted!",
    "🔔 تست اعلان": "🔔 Test Notification",
    "لاگ فعالیت‌ها": "Activity Log",
    "بروزرسانی": "Refresh",
    "پاک کردن": "Clear",
    "در حال بارگذاری...": "Loading...",
    "لاگی ثبت نشده": "No logs recorded",
    "مدیر: ": "Admin: ",
    "🔐 ورود مدیر": "🔐 Admin login",
    "🚪 خروج مدیر": "🚪 Admin logout",
    "➕ ایجاد کاربر": "➕ Create user",
    "🗑️ حذف کاربر": "🗑️ Delete user",
    "✏️ ویرایش کاربر": "✏️ Edit user",
    "🖥️ ایجاد سرور": "🖥️ Create server",
    "🗑️ حذف سرور": "🗑️ Delete server",
    "⚙️ تغییر تنظیمات": "⚙️ Settings changed",
    "🔑 فعال‌سازی OTP": "🔑 OTP enabled",
    "🔓 غیرفعال‌سازی OTP": "🔓 OTP disabled",
    "📤 خروجی کاربران": "📤 User export",
    "📥 ورودی کاربران": "📥 User import",
    "📊 مصرف ترافیک": "📊 Traffic Usage",
    "مصرف کل (GB)": "Total Usage (GB)",
    "مصرف (GB)": "Usage (GB)",
    "پرمصرف‌ترین‌ها": "Top Consumers",
    "بیشترین مصرف": "Highest Usage",
    "در حال ساخت…": "Building…",
    "خطا در ساخت QR": "Error creating QR",
    "اول یک فایل انتخاب کن.": "Select a file first.",
    "وارد شد: ": "Imported: ",
    " اضافه، ": " added, ",
    " رد.": " rejected.",
    "فایل JSON معتبر نیست.": "Invalid JSON file.",
    "برای غیرفعال‌سازی رمز مدیر را وارد کن:": "Enter the admin password to disable it:",
    "دومرحله‌ای فعال شد ✅ از این به بعد ورود = رمز + کد.": "Two-factor authentication enabled ✅ From now on, sign-in requires the password + code.",
    "مرا به خاطر بسپار": "Remember me",
    "وضعیت فعلی": "Current Status",
    "تاریخ درخواست": "Request Date",
    "عملیات": "Actions",
    "حجم (GB)": "Volume (GB)",
    "روز مانده": "days left",
    "روزهای باقی‌مانده": "Days Remaining",
    "نامشخص": "Unknown",
    "فعال ✅": "Active ✅",
    "غیرفعال ❌": "Inactive ❌"
  });
\n  var en2fa = {};
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
    document.querySelectorAll("[title],[aria-label],[placeholder]").forEach(function (el) {
      ["title", "aria-label", "placeholder"].forEach(function (name) {
        if (!el.hasAttribute(name)) return;
        var value = el.getAttribute(name);
        if (map[value] !== undefined) el.setAttribute(name, map[value]);
      });
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
    if (!window._zexI18nObserver) {
      var observer = new MutationObserver(function () {
        observer.disconnect();
        applyI18n();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      window._zexI18nObserver = observer;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
