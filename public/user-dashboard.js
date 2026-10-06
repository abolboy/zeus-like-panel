(function () {
  "use strict";
  if (window._zexUD) return;
  window._zexUD = 1;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // تابع اصلی رندر که هر ۴ صفحه را می‌سازد
  function render(user) {
    if (!user) return;

    var trafficTotal = Number(user.trafficTotal || user.traffic || 0);
    var trafficUsed = Number(user.trafficUsed || 0);
    var trafficRemaining = Math.max(0, trafficTotal - trafficUsed);
    var percent = trafficTotal > 0 ? Math.min(100, (trafficUsed / trafficTotal) * 100) : 0;
    var subLink = user.subLink || 'در حال ساخت...';

    var h = '';

    // ========== صفحه ۱: داشبورد ==========
    h += '<div id="udPageDashboard" class="ud-page">';

    // هدر کاربر
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f2b705,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#1a1204;box-shadow:0 0 20px rgba(242,183,5,0.4)">' + esc(user.username.charAt(0).toUpperCase()) + '</div>';
    h += '<div style="flex:1"><h2 style="margin:0;font-size:22px;color:#f2b705;font-weight:800">' + esc(user.username) + '</h2>';
    h += '<div style="font-size:14px;color:' + (user.active ? '#35d68f' : '#ff5c72') + ';margin-top:2px;font-weight:700">' + (user.active ? '✅ فعال' : '❌ غیرفعال') + '</div></div></div>';

    // کارت مصرف ترافیک
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:16px;color:#eef1f8;font-weight:700">📊 مصرف ترافیک</h3>';
    h += '<div style="font-size:26px;font-weight:800;color:#f2b705;margin-bottom:10px">' + trafficUsed + ' <span style="font-size:16px;color:#8892ab">/ ' + trafficTotal + ' GB</span></div>';
    h += '<div style="background:#212942;height:10px;border-radius:5px;overflow:hidden"><div style="width:' + percent + '%;background:linear-gradient(90deg,#f2b705,#f59e0b);height:100%;transition:width 0.5s"></div></div>';
    h += '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px;color:#8892ab"><span>مصرف شده: <b style="color:#f2b705">' + trafficUsed + ' GB</b></span><span>باقی‌مانده: <b style="color:#35d68f">' + trafficRemaining + ' GB</b></span></div>';
    h += '</div>';

    // کارت زمان باقی‌مانده
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:16px;color:#eef1f8;font-weight:700">⏳ زمان باقی‌مانده</h3>';
    h += '<div style="font-size:40px;font-weight:800;color:#35d68f;text-align:center">' + esc(user.daysLeft || '30') + ' <span style="font-size:18px;color:#8892ab">روز</span></div>';
    h += '<div style="text-align:center;color:#8892ab;font-size:13px;margin-top:8px">انقضا: ' + esc(user.expiry || '—') + '</div>';
    h += '</div>';

    // دکمه درخواست تمدید
    h += '<button id="udRenew" style="width:100%;background:linear-gradient(135deg,#f2b705,#f59e0b);border:none;color:#1a1204;padding:12px;border-radius:10px;cursor:pointer;font-weight:800;font-size:16px;box-shadow:0 8px 20px rgba(242,183,5,0.3)">⏳ درخواست تمدید اشتراک</button>';

    h += '</div>';

    // ========== صفحه ۲: لینک ==========
    h += '<div id="udPageLink" class="ud-page" style="display:none">';

    // کانفیگ‌های اتصال
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:16px;color:#eef1f8;font-weight:700">🔌 کانفیگ‌های اتصال</h3>';
    h += '<div style="background:rgba(10,14,26,0.6);padding:12px;border-radius:10px;border:1px solid #212942;margin-bottom:10px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="color:#35d68f;font-size:14px">VLESS • REALITY</b><button id="btnCopyConfig" style="background:#f2b705;color:#1a1204;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer">📋 کپی</button></div>';
    h += '<div style="color:#8892ab;font-size:11px;word-break:break-all;font-family:monospace">vless://...(کانفیگ موجود)</div>';
    h += '</div></div>';

    // لینک سابسکریپشن
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:16px;color:#eef1f8;font-weight:700">🔗 لینک سابسکریپشن</h3>';
    h += '<div style="background:rgba(10,14,26,0.6);padding:12px;border-radius:10px;border:1px solid #212942;margin-bottom:12px;word-break:break-all;font-size:12px;color:#8892ab;font-family:monospace;min-height:50px">' + subLink + '</div>';
    h += '<div style="display:flex;gap:8px">';
    h += '<button data-sub-action="copy" style="flex:1;background:#131829;border:1px solid #212942;color:#eef1f8;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px">📋 کپی</button>';
    h += '<button data-sub-action="qr" style="flex:1;background:#131829;border:1px solid #212942;color:#eef1f8;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px">📱 QR</button>';
    h += '<button data-sub-action="rotate" style="flex:1;background:#131829;border:1px solid #212942;color:#eef1f8;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px">🔄 تغییر توکن</button>';
    h += '</div></div>';

    // دکمه تغییر رمز
    h += '<button id="udPass" style="width:100%;background:#131829;border:1px solid #212942;color:#eef1f8;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;margin-bottom:6px">🔑 تغییر رمز عبور</button>';

    h += '</div>';

    // ========== صفحه ۳: پشتیبانی ==========
    h += '<div id="udPageSupport" class="ud-page" style="display:none">';

    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:18px;color:#eef1f8;font-weight:700">🎫 پشتیبانی</h3>';
    h += '<p style="color:#8892ab;font-size:13px;margin-bottom:16px">پیام خود را بنویسید، تیم پشتیبانی در اسرع وقت پاسخ خواهد داد.</p>';
    h += '<textarea id="ticketText" placeholder="پیام خود را بنویسید..." style="width:100%;background:rgba(10,14,26,0.6);border:1px solid #212942;border-radius:10px;color:#eef1f8;padding:12px;font-size:14px;box-sizing:border-box;resize:vertical;min-height:100px;margin-bottom:12px;font-family:inherit"></textarea>';
    h += '<button id="sendTicket" style="width:100%;background:linear-gradient(135deg,#35d68f,#2bb673);border:none;color:#0a0e1a;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px">📤 ارسال تیکت</button>';
    h += '</div>';

    // لیست تیکت‌های قبلی (اختیاری)
    h += '<div id="ticketList" style="margin-top:8px"></div>';

    h += '</div>';

    // ========== صفحه : پروفایل ==========
    h += '<div id="udPageProfile" class="ud-page" style="display:none">';

    // هدر پروفایل
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f2b705,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#1a1204;margin:0 auto 8px;box-shadow:0 0 30px rgba(242,183,5,0.4)">' + esc(user.username.charAt(0).toUpperCase()) + '</div>';
    h += '<h2 style="margin:0;font-size:24px;color:#f2b705;font-weight:800">' + esc(user.username) + '</h2>';
    h += '<div style="font-size:14px;color:' + (user.active ? '#35d68f' : '#ff5c72') + ';margin-top:2px;font-weight:700">' + (user.active ? '✅ اشتراک فعال' : '❌ اشتراک غیرفعال') + '</div>';
    h += '</div>';

    // اطلاعات کاربر
    h += '<div style="background:rgba(15,20,35,0.6);backdrop-filter:blur(20px);border:1px solid rgba(242,183,5,0.15);border-radius:16px;padding:12px;margin-bottom:6px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">';
    h += '<h3 style="margin:0 0 8px;font-size:16px;color:#eef1f8;font-weight:700">📋 اطلاعات اشتراک</h3>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">وضعیت</div><div style="color:#35d68f;font-weight:700;margin-top:2px;font-size:13px">' + (user.active ? 'فعال' : 'غیرفعال') + '</div></div>';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">تاریخ انقضا</div><div style="color:#eef1f8;font-weight:700;margin-top:2px;font-size:13px">' + esc(user.expiry || '—') + '</div></div>';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">حجم کل</div><div style="color:#eef1f8;font-weight:700;margin-top:2px;font-size:13px">' + trafficTotal + ' GB</div></div>';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">مصرف شده</div><div style="color:#f2b705;font-weight:700;margin-top:2px;font-size:13px">' + trafficUsed + ' GB</div></div>';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">باقی‌مانده</div><div style="color:#35d68f;font-weight:700;margin-top:2px;font-size:13px">' + trafficRemaining + ' GB</div></div>';
    h += '<div style="background:rgba(10,14,26,0.5);padding:12px;border-radius:10px"><div style="color:#8892ab;font-size:12px">روزهای باقی‌مانده</div><div style="color:#f2b705;font-weight:700;margin-top:2px;font-size:13px">' + esc(user.daysLeft || '30') + ' روز</div></div>';
    h += '</div></div>';

    // دکمه خروج
    h += '<button id="udLogout" style="width:100%;background:#2a141a;border:1px solid #582430;color:#ff8fa0;padding:12px;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px">🚪 خروج از حساب کاربری</button>';

    h += '</div>';

    var contentDiv = document.getElementById("udContent");
    if (contentDiv) {
      contentDiv.innerHTML = h;

      attachHandlers();
      addNotificationBell();
      fetchNotifications();
      setInterval(fetchNotifications, 30000);

      // نمایش صفحه پیش‌فرض (داشبورد)
      showPage('dashboard');
    }
  }

  // تابع جابجایی بین صفحات
  function showPage(pageName) {
    // مخفی کردن همه صفحات
    var pages = document.querySelectorAll('.ud-page');
    pages.forEach(function (p) { p.style.display = 'none'; });

    // نمایش صفحه انتخاب شده
    var target = document.getElementById('udPage' + pageName.charAt(0).toUpperCase() + pageName.slice(1));
    if (target) {
      target.style.display = 'block';
      // اسکرول به بالای صفحه
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // به‌روزرسانی رنگ دکمه‌های Bottom Nav
    var navButtons = document.querySelectorAll('#zexBottomNav button');
    navButtons.forEach(function (btn) { btn.style.color = '#8892ab'; });

    var activeBtn = document.getElementById('nav' + pageName.charAt(0).toUpperCase() + pageName.slice(1));
    if (activeBtn) activeBtn.style.color = '#f2b705';
  }

  // اتصال هندلرها
  function attachHandlers() {
    var logoutBtn = document.getElementById("udLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        fetch("/api/logout", { method: "POST" }).then(function () { window.location.href = "/user-login"; });
      });
    }

    var sendTicketBtn = document.getElementById("sendTicket");
    if (sendTicketBtn) {
      sendTicketBtn.addEventListener("click", function () {
        var text = document.getElementById("ticketText").value.trim();
        if (!text) {
          alert("لطفاً پیام خود را بنویسید");
          return;
        }
        fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text })
        }).then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) {
              alert("✅ تیکت شما با موفقیت ارسال شد");
              document.getElementById("ticketText").value = "";
            } else {
              alert("❌ خطا: " + (d.error || "نامشخص"));
            }
          })
          .catch(function () { alert("❌ خطای شبکه"); });
      });
    }

    // دکمه‌های سابسکریپشن
    document.querySelectorAll("[data-sub-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-sub-action");
        if (action === "copy") {
          var link = btn.parentElement.previousElementSibling.textContent.trim();
          navigator.clipboard.writeText(link).then(function () { alert("✅ لینک کپی شد"); });
        } else if (action === "qr") {
          alert("📱 QR Code: " + (window._userData ? window._userData.subLink : ""));
        } else if (action === "rotate") {
          if (confirm("آیا از تغییر توکن اطمینان دارید؟")) {
            fetch("/api/sub/token/" + encodeURIComponent(window._userData.username), { method: "POST" })
              .then(function (r) { return r.json(); })
              .then(function (d) {
                if (d.ok) {
                  alert("✅ توکن تغییر کرد. لینک جدید: " + d.newLink);
                  load();
                }
              });
          }
        }
      });
    });
  }

  // تابع لود داده‌ها
  function load() {
    var username = decodeURIComponent(window.location.pathname.replace(/^\/sub\//, "").replace(/\/+$/, ""));
    var contentDiv = document.getElementById("udContent");
    if (!contentDiv) return;
    contentDiv.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#8892ab"><div style="font-size:40px;margin-bottom:6px">⏳</div><div style="font-size:16px">در حال بارگذاری...</div></div>';

    fetch("/api/sub/" + encodeURIComponent(username))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) {
          contentDiv.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff5c72"><div style="font-size:40px;margin-bottom:6px">❌</div><div style="font-size:16px">خطا در دریافت اطلاعات</div><button onclick="location.reload()" style="margin-top:20px;background:#f2b705;color:#1a1204;border:none;padding:12px 24px;border-radius:10px;font-weight:700;cursor:pointer">تلاش مجدد</button></div>';
          return;
        }
        window._userData = d;
        if (typeof render === "function") render(d);
      })
      .catch(function (e) {
        contentDiv.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff5c72"><div style="font-size:40px;margin-bottom:6px">🌐</div><div style="font-size:16px">خطای شبکه</div></div>';
      });
  }

  // فراخوانی اولیه
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(load, 300); });
  } else {
    setTimeout(load, 300);
  }

  // در دسترس قرار دادن showPage برای Bottom Nav
  window.showPage = showPage;


  function addNotificationBell() {
    var header = document.getElementById("udHead");
    if (!header || document.getElementById("zexNotifBell")) return;
    header.style.position = "relative";
    var bell = document.createElement("div");
    bell.id = "zexNotifBell";
    bell.style.cssText = "position:absolute;top:15px;left:15px;font-size:24px;cursor:pointer;z-index:100";
    bell.innerHTML = "<span id='zexNotifBadge' style='position:absolute;top:-5px;right:-5px;background:#ff5c72;color:white;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:10px;display:none'>0</span>";
    header.appendChild(bell);
    bell.addEventListener("click", toggleNotifPanel);
  }

  function fetchNotifications() {
    fetch("/api/notifications")
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.notifications) {
          var unread = data.notifications.filter(function(n) { return !n.read; }).length;
          var badge = document.getElementById("zexNotifBadge");
          if (badge) {
            if (unread > 0) {
              badge.style.display = "block";
              badge.textContent = unread > 9 ? "9+" : unread;
            } else {
              badge.style.display = "none";
            }
          }
          window._zexNotifList = data.notifications;
        }
      })
      .catch(function() {});
  }

  function toggleNotifPanel() {
    var panel = document.getElementById("zexNotifPanel");
    if (panel) { panel.remove(); return; }
    panel = document.createElement("div");
    panel.id = "zexNotifPanel";
    panel.style.cssText = "position:fixed;top:70px;left:10px;right:10px;max-width:400px;margin:0 auto;background:rgba(15,20,35,0.98);backdrop-filter:blur(20px);border:1px solid #f2b705;border-radius:16px;padding:16px;z-index:10000;box-shadow:0 10px 40px rgba(0,0,0,0.5);max-height:70vh;overflow-y:auto";
    var list = window._zexNotifList || [];
    if (list.length === 0) {
      panel.innerHTML = '<div style="text-align:center;color:#8892ab;padding:20px">اعلان جدیدی ندارید 🍃</div>';
    } else {
      var html = '<h3 style="margin:0 0 12px;color:#f2b705;font-size:16px">اعلان‌ها</h3>';
      list.forEach(function(n) {
        html += '<div style="background:rgba(10,14,26,0.6);border:1px solid ' + (n.read ? '#212942' : '#f2b705') + ';border-radius:10px;padding:12px;margin-bottom:8px">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
        html += '<b style="color:#eef1f8;font-size:13px">' + n.title + '</b>';
        html += '<span style="font-size:10px;color:#8892ab">' + new Date(n.time).toLocaleTimeString('fa-IR') + '</span>';
        html += '</div>';
        html += '<div style="color:#8892ab;font-size:12px">' + n.body + '</div>';
        html += '</div>';
      });
      panel.innerHTML = html;
    }
    document.body.appendChild(panel);
    setTimeout(function() {
      document.addEventListener("click", function close(e) {
        if (!panel.contains(e.target) && e.target.id !== "zexNotifBell") {
          panel.remove();
          document.removeEventListener("click", close);
        }
      });
    }, 100);
  }

})();
