(function () {
  if (window._zexNotif) return;
  window._zexNotif = 1;

  function addBell() {
    if (document.getElementById("zexNotifBell")) return;
    var bell = document.createElement("div");
    bell.id = "zexNotifBell";
    bell.style.cssText = "position:fixed;top:12px;left:12px;z-index:99998;width:44px;height:44px;border-radius:50%;background:rgba(15,20,35,0.9);backdrop-filter:blur(10px);border:1px solid rgba(242,183,5,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.4)";
    bell.innerHTML = '🔔<span id="zexNotifBadge" style="position:absolute;top:-4px;right:-4px;background:#ff5c72;color:#fff;font-size:10px;font-weight:bold;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:9px;display:none;padding:0 4px">0</span>';
    bell.addEventListener("click", togglePanel);
    document.body.appendChild(bell);
    fetchNotifications();
  }

  function fetchNotifications(cb) {
    fetch("/api/notifications", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.notifications) {
          window._zexNotifList = data.notifications;
          updateBadge();
          if (cb) cb();
        }
      })
      .catch(function () {});
  }

  function updateBadge() {
    var unread = (window._zexNotifList || []).filter(function (n) { return !n.read; }).length;
    var badge = document.getElementById("zexNotifBadge");
    if (badge) {
      badge.style.display = unread > 0 ? "block" : "none";
      badge.textContent = unread > 9 ? "9+" : unread;
    }
  }

  function markRead(id, cb) {
    fetch("/api/notifications/" + encodeURIComponent(id) + "/read", { method: "POST", credentials: "same-origin" })
      .then(function () { fetchNotifications(cb); })
      .catch(function () {});
  }

  function markAllRead(cb) {
    var list = (window._zexNotifList || []).filter(function (n) { return !n.read; });
    if (list.length === 0) { if (cb) cb(); return; }
    var done = 0;
    list.forEach(function (n) {
      fetch("/api/notifications/" + encodeURIComponent(n.id) + "/read", { method: "POST", credentials: "same-origin" })
        .then(function () { done++; if (done === list.length) fetchNotifications(cb); })
        .catch(function () { done++; if (done === list.length) fetchNotifications(cb); });
    });
  }

  function togglePanel() {
    var old = document.getElementById("zexNotifPanel");
    if (old) { old.remove(); return; }
    renderPanel();
  }

  function renderPanel() {
    var old = document.getElementById("zexNotifPanel");
    if (old) old.remove();

    var panel = document.createElement("div");
    panel.id = "zexNotifPanel";
    panel.style.cssText = "position:fixed;top:64px;left:10px;right:10px;max-width:400px;margin:0 auto;background:rgba(15,20,35,0.98);backdrop-filter:blur(20px);border:1px solid #f2b705;border-radius:16px;padding:16px;z-index:99999;box-shadow:0 10px 40px rgba(0,0,0,0.6);max-height:70vh;overflow-y:auto";

    var list = window._zexNotifList || [];
    var unread = list.filter(function (n) { return !n.read; }).length;

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<h3 style="margin:0;color:#f2b705;font-size:16px">🔔 اعلان‌ها</h3>';
    if (unread > 0) {
      html += '<button id="zexNotifReadAll" style="background:#131829;border:1px solid #212942;color:#35d68f;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">✓ خواندن همه</button>';
    }
    html += '</div>';

    if (list.length === 0) {
      html += '<div style="text-align:center;color:#8892ab;padding:20px;font-size:13px">اعلان جدیدی ندارید 🍃</div>';
    } else {
      list.forEach(function (n) {
        html += '<div style="background:rgba(10,14,26,0.6);border:1px solid ' + (n.read ? '#212942' : '#f2b705') + ';border-radius:10px;padding:12px;margin-bottom:8px">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
        html += '<b style="color:#eef1f8;font-size:13px">' + n.title + '</b>';
        html += '<span style="display:flex;align-items:center;gap:6px">';
        html += '<span style="font-size:10px;color:#8892ab">' + new Date(n.time).toLocaleTimeString('fa-IR') + '</span>';
        if (!n.read) {
          html += '<button data-read="' + n.id + '" style="background:#35d68f;border:none;color:#0a0e1a;width:22px;height:22px;border-radius:50%;font-size:12px;font-weight:800;cursor:pointer;line-height:1">✓</button>';
        } else {
          html += '<span style="color:#35d68f;font-size:12px">✓</span>';
        }
        html += '</span></div>';
        html += '<div style="color:#8892ab;font-size:12px">' + n.body + '</div></div>';
      });
    }

    panel.innerHTML = html;
    document.body.appendChild(panel);

    var readAll = document.getElementById("zexNotifReadAll");
    if (readAll) {
      readAll.addEventListener("click", function () { markAllRead(renderPanel); });
    }
    panel.querySelectorAll("[data-read]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        markRead(btn.getAttribute("data-read"), renderPanel);
      });
    });
  }

  function init() {
    addBell();
    setTimeout(addBell, 1500);
    setTimeout(addBell, 4000);
    setInterval(function () { fetchNotifications(); }, 30000);

    // بستن پنل با کلیک بیرون (فقط یک‌بار نصب می‌شود)
    document.addEventListener("click", function (e) {
      var panel = document.getElementById("zexNotifPanel");
      if (!panel) return;
      if (!panel.contains(e.target) && !e.target.closest("#zexNotifBell")) panel.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
