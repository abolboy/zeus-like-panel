(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var st = document.createElement("style");
  st.textContent = [
    ".user-card.warn-glow{border-color:rgba(245,158,11,.55);box-shadow:0 0 0 1px rgba(245,158,11,.25),0 0 18px rgba(245,158,11,.15);}",
    ".user-card.off-glow{border-color:rgba(255,92,114,.45);box-shadow:0 0 0 1px rgba(255,92,114,.22),0 0 18px rgba(255,92,114,.12);}",
    ".zex-banner{position:fixed;top:10px;right:10px;left:10px;z-index:4000;background:#131829;border:1px solid #f59e0b66;color:#f59e0b;border-radius:12px;padding:10px 14px;font-size:12.5px;display:flex;gap:10px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.4);}",
    ".zex-banner button{margin-inline-start:auto;background:none;border:none;color:#f59e0b;font-size:18px;cursor:pointer;}",
    ".ping-dot{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;margin-inline-start:8px;color:#8892ab;}",
    ".ping-dot i{width:8px;height:8px;border-radius:50%;display:inline-block;}",
    ".ping-dot.on i{background:#35d68f;box-shadow:0 0 6px #35d68f88;}",
    ".ping-dot.off i{background:#ff5c72;box-shadow:0 0 6px #ff5c7288;}",
    ".qr-modal-card{background:#fff;padding:14px;border-radius:14px;display:flex;justify-content:center;min-height:120px;align-items:center;}",
    ".qr-modal-card svg{width:220px;height:220px;}",
    "body.zex-light{--bg:#eef2f9;--panel:#ffffff;--panel-2:#f2f5fb;--border:#d9e0ee;--text:#182135;--muted:#5c6b8a;--gold:#a97a08;--gold-soft:#a97a0822;--danger:#d3384f;--success:#149e63;--warn:#b9770a;}",
    "body.zex-light .modal{background:rgba(238,242,249,.8);}",
    "body.zex-light .modal-card{background:#fff;}",
    "body.zex-light .toast{background:#fff;}",
    "body.zex-light .zex-banner{background:#fff6df;}",
    "body.zex-light .zfx-flake{color:#5a6ba0 !important;text-shadow:0 0 8px rgba(90,107,160,.3) !important;}",
    "#zexThemeBtn{position:fixed;bottom:14px;left:14px;z-index:4500;width:42px;height:42px;border-radius:50%;border:1px solid var(--border,#212942);background:var(--panel,#0e1220);color:var(--gold,#f2b705);font-size:18px;cursor:pointer;}",
    ".zex-traffic-bars{display:flex;align-items:flex-end;gap:3px;height:120px;min-width:300px;}",
    ".zex-traffic-bar{flex:1;background:linear-gradient(180deg,#35d68f,#149e63);border-radius:3px 3px 0 0;min-height:2px;position:relative;}",
    ".zex-traffic-bar:hover::after{content:attr(data-label);position:absolute;bottom:100%;right:50%;transform:translateX(50%);background:var(--panel-2,#131829);border:1px solid var(--border,#212942);padding:3px 7px;border-radius:6px;font-size:11px;white-space:nowrap;margin-bottom:4px;color:var(--text,#eef1f8);}",
    ".zex-top-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:12px;}",
    ".zex-top-row b{width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".zex-top-bar{flex:1;height:8px;border-radius:6px;background:var(--panel-2,#131829);overflow:hidden;}",
    ".zex-top-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold,#f2b705),#c9930a);}",
    ".zex-top-row span{width:80px;text-align:left;color:var(--muted,#8892ab);font-size:11px;}",
    ".zex-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}",
    ".zex-chart-grid canvas{max-height:260px;}",
    ".zex-chart-full{margin-top:8px;max-height:220px;}",
    "@media (max-width:760px){.zex-chart-grid{grid-template-columns:1fr;}}",
    "#reports-tab .card{overflow-x:hidden;}",
    ".zex-chart-grid>div{min-width:0;}"
  ].join("\n");
  document.head.appendChild(st);

  // ---------- QR ----------
  function openQrModal(username) {
    var old = document.getElementById("zexQrModal");
    if (old) old.remove();
    var m = document.createElement("div");
    m.id = "zexQrModal";
    m.className = "modal";
    m.innerHTML =
      '<div class="modal-card"><h3>QR لینک اشتراک: ' + esc(username) + '</h3>' +
      '<div class="qr-modal-card" id="zexQrBox">در حال ساخت…</div>' +
      '<p style="color:#8892ab;font-size:11px;margin-top:10px;word-break:break-all" id="zexQrUrl"></p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" id="zexQrClose">بستن</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target === m) m.remove(); });
    document.getElementById("zexQrClose").addEventListener("click", function () { m.remove(); });
    fetch("/api/sub/qr/" + encodeURIComponent(username))
      .then(function (r) { if (!r.ok) throw new Error("qr"); return r.text(); })
      .then(function (svg) {
        document.getElementById("zexQrBox").innerHTML = svg;
        document.getElementById("zexQrUrl").textContent = window.location.origin + "/sub/" + encodeURIComponent(username);
      })
      .catch(function () { document.getElementById("zexQrBox").textContent = "خطا در ساخت QR"; });
    m.classList.add("show");
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("button[data-action='qr']") : null;
    if (!btn) return;
    var card = btn.closest(".user-card");
    if (!card) return;
    var nameEl = card.querySelector(".user-name");
    if (nameEl) openQrModal(nameEl.textContent.trim());
  });

  // ---------- expiry banner ----------
  function refreshBanner() {
    fetch("/api/stats").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return;
      var old = document.getElementById("zexBanner");
      if (old) old.remove();
      if (!s.expiring) return;
      var b = document.createElement("div");
      b.id = "zexBanner";
      b.className = "zex-banner";
      b.innerHTML = "<span>⚠️ " + s.expiring + " کاربر تا یک هفته دیگر منقضی می‌شوند.</span><button title=\"بستن\">×</button>";
      b.querySelector("button").addEventListener("click", function () { b.remove(); });
      document.body.appendChild(b);
    }).catch(function () {});
  }

  // ---------- server pings ----------
  function refreshPings() {
    var tab = document.getElementById("servers-tab");
    if (!tab || !tab.classList.contains("active")) return;
    fetch("/api/servers/status").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list) return;
      list.forEach(function (s) {
        var tr = document.querySelector('#serversList tr[data-id="' + s.id + '"]');
        if (!tr || !tr.children[3]) return;
        var td = tr.children[3];
        var dot = td.querySelector(".ping-dot");
        if (!dot) {
          dot = document.createElement("span");
          dot.className = "ping-dot";
          dot.innerHTML = "<i></i><b></b>";
          td.appendChild(dot);
        }
        dot.className = "ping-dot " + (s.online ? "on" : "off");
        dot.querySelector("b").textContent = s.online ? (s.ms + "ms") : "قطعی";
      });
    }).catch(function () {});
  }

  // ---------- settings: export/import + OTP ----------
  function injectSettingsCards() {
    var grid = document.querySelector("#settings-tab .settings-grid");
    if (!grid || document.getElementById("zexExpImpCard")) return;

    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexExpImpCard";
    card.innerHTML = '<div class="card-head"><h3>خروجی / ورودی کاربران</h3></div>' +
      '<p style="color:var(--muted,#8892ab);font-size:12px;line-height:1.8;margin-bottom:12px">خروجی شامل هش رمزهاست؛ فایل را جای امن نگه دار.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button class="btn btn-gold" id="zexExportBtn">دانلود خروجی</button>' +
      '<input type="file" id="zexImportFile" accept=".json,application/json" style="padding:8px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:12px">' +
      '<button class="btn btn-ghost" id="zexImportBtn">وارد کردن</button></div>';
    grid.appendChild(card);

    var otp = document.createElement("div");
    otp.className = "card";
    otp.id = "zexOtpCard";
    otp.innerHTML = '<div class="card-head"><h3>امنیت دومرحله‌ای (OTP)</h3></div>' +
      '<p id="zexOtpStatus" style="color:var(--muted,#8892ab);font-size:12px;margin-bottom:12px">وضعیت: در حال بررسی…</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-gold" id="zexOtpSetup">راه‌اندازی / فعال‌سازی</button>' +
      '<button class="btn btn-danger-ghost" id="zexOtpDisable">غیرفعال‌سازی</button></div>';
    grid.appendChild(otp);

    document.getElementById("zexExportBtn").addEventListener("click", function () { window.location.href = "/api/users/export"; });
    document.getElementById("zexImportBtn").addEventListener("click", function () {
      var f = document.getElementById("zexImportFile").files[0];
      if (!f) { alert("اول یک فایل انتخاب کن."); return; }
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(rd.result);
          fetch("/api/users/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              alert(d.ok ? ("وارد شد: " + d.added + " اضافه، " + d.skipped + " رد.") : (d.error || "خطا"));
              if (d.ok && window.loadData) window.loadData();
            })
            .catch(function () { alert("خطای ارتباط"); });
        } catch (e) { alert("فایل JSON معتبر نیست."); }
      };
      rd.readAsText(f);
    });

    function otpStatus() {
      fetch("/api/otp/status").then(function (r) { return r.json(); }).then(function (s) {
        document.getElementById("zexOtpStatus").textContent = "وضعیت: " + (s.enabled ? "فعال ✅" : "غیرفعال");
      }).catch(function () {});
    }
    otpStatus();

    document.getElementById("zexOtpSetup").addEventListener("click", function () {
      fetch("/api/otp/setup").then(function (r) { return r.json(); }).then(function (d) {
        var m = document.createElement("div");
        m.className = "modal show";
        m.innerHTML = '<div class="modal-card"><h3>راه‌اندازی کد دومرحله‌ای</h3>' +
          '<p style="color:#8892ab;font-size:12px;line-height:1.8;margin-bottom:10px">QR را با Google Authenticator یا Authy اسکن کن (یا رمز را دستی وارد کن)، بعد کد ۶ رقمی را بزن تا فعال شود.</p>' +
          '<div class="qr-modal-card">' + (d.qr || "") + '</div>' +
          '<p style="font-size:11px;color:#8892ab;word-break:break-all;margin-top:8px">Secret: ' + esc(d.secret) + '</p>' +
          '<div style="margin-top:12px"><input id="zexOtpCode" inputmode="numeric" maxlength="6" placeholder="کد ۶ رقمی" style="width:100%;padding:11px;background:#131829;border:1px solid #212942;border-radius:8px;color:#eef1f8"></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="zexOtpCancel">انصراف</button><button class="btn btn-gold" id="zexOtpEnable">فعال‌سازی</button></div></div>';
        document.body.appendChild(m);
        m.addEventListener("click", function (e) { if (e.target === m) m.remove(); });
        document.getElementById("zexOtpCancel").addEventListener("click", function () { m.remove(); });
        document.getElementById("zexOtpEnable").addEventListener("click", function () {
          fetch("/api/otp/enable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: document.getElementById("zexOtpCode").value }) })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (res.ok) { m.remove(); alert("دومرحله‌ای فعال شد ✅ از این به بعد ورود = رمز + کد."); otpStatus(); }
              else alert(res.error || "کد معتبر نیست");
            });
        });
      });
    });

    document.getElementById("zexOtpDisable").addEventListener("click", function () {
      var pw = prompt("برای غیرفعال‌سازی رمز مدیر را وارد کن:");
      if (!pw) return;
      fetch("/api/otp/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pw }) })
        .then(function (r) { return r.json(); })
        .then(function (res) { if (res.ok) { alert("غیرفعال شد."); otpStatus(); } else alert(res.error || "خطا"); });
    });
  }

  // ---------- traffic widget ----------
  function injectTrafficCard() {
    var tab = document.getElementById("reports-tab");
    if (!tab || document.getElementById("zexTrafficCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexTrafficCard";
    card.innerHTML = '<div class="card-head"><h3>مصرف کل (۳۰ روز) + پرمصرف‌ها</h3></div>' +
      '<div style="overflow-x:auto"><div class="zex-traffic-bars" id="zexTrafficBars"></div></div>' +
      '<div id="zexTopList" style="margin-top:16px"></div>';
    tab.appendChild(card);
  }

  function refreshTraffic() {
    var tab = document.getElementById("reports-tab");
    if (!tab || !tab.classList.contains("active")) return;
    fetch("/api/reports/traffic").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      var bars = document.getElementById("zexTrafficBars");
      var days = d.days || [];
      var max = 1;
      days.forEach(function (x) { if (x.gb > max) max = x.gb; });
      bars.innerHTML = days.length
        ? days.map(function (x) {
            var h = Math.max(2, Math.round((x.gb / max) * 110));
            return '<div class="zex-traffic-bar" style="height:' + h + 'px" data-label="' + esc(x.date) + ': ' + x.gb + ' GB"></div>';
          }).join("")
        : '<div class="empty-state">هنوز داده‌ای نیست — پس از اولین گزارش Agent ثبت می‌شود.</div>';
      var top = document.getElementById("zexTopList");
      var maxUsed = 1;
      (d.top || []).forEach(function (x) { if (x.used > maxUsed) maxUsed = x.used; });
      top.innerHTML = (d.top || []).map(function (x) {
        var w = Math.round((x.used / maxUsed) * 100);
        return '<div class="zex-top-row"><b>' + esc(x.username) + '</b><div class="zex-top-bar"><i style="width:' + w + '%"></i></div><span>' + x.used + ' GB</span></div>';
      }).join("");
    }).catch(function () {});
  }

  // ---------- Chart.js widget ----------
  var chartsRendered = false;
  function injectChartCard() {
    var tab = document.getElementById("reports-tab");
    if (!tab || document.getElementById("zexChartCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexChartCard";
    card.innerHTML = '<div class="card-head"><h3>نمودار پیشرفته</h3></div>' +
      '<div class="zex-chart-grid"><div style="position:relative;height:260px;min-width:0"><canvas id="zexTrafficChart"></canvas></div><div style="position:relative;height:260px;min-width:0"><canvas id="zexServerChart"></canvas></div></div>' +
      '<div style="position:relative;height:240px"><canvas id="zexStatusChart"></canvas></div>';
    tab.insertBefore(card, tab.firstChild);
  }

  function renderCharts() {
    var tab = document.getElementById("reports-tab");
    if (!tab || !tab.classList.contains("active")) return;
    if (!window.Chart) return;
    var zLang = localStorage.getItem("zex-lang") || "fa";
    if (chartsRendered && window._zexChartLang === zLang) return;
    chartsRendered = true;
    window._zexChartLang = zLang;

    fetch("/api/reports/advanced").then(function(r){return r.ok?r.json():null}).then(function(d){
      if(!d) return;
      var isLight = document.body.classList.contains("zex-light");
      var textColor = isLight ? "#182135" : "#eef1f8";
      var gridColor = isLight ? "#d9e0ee" : "#212942";

      new Chart(document.getElementById("zexTrafficChart"), {
        type: "line",
        data: {
          labels: d.days.map(x => x.date),
          datasets: [{
            label: "مصرف کل (GB)",
            data: d.days.map(x => x.gb),
            borderColor: "#f2b705",
            backgroundColor: "rgba(242,183,5,0.1)",
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor } } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });

      new Chart(document.getElementById("zexServerChart"), {
        type: "bar",
        data: {
          labels: d.serverLabels.length ? d.serverLabels : ["—"],
          datasets: [{
            label: "مصرف (GB)",
            data: d.serverData.length ? d.serverData : [0],
            backgroundColor: ["#f2b705", "#35d68f", "#ff5c72", "#5c6b8a"]
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });

      new Chart(document.getElementById("zexStatusChart"), {
        type: "doughnut",
        data: {
          labels: ["فعال", "نزدیک انقضا", "غیرفعال"],
          datasets: [{
            data: [d.statusCount.active, d.statusCount.expiring, d.statusCount.inactive],
            backgroundColor: ["#35d68f", "#f59e0b", "#ff5c72"]
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { color: textColor } } }
        }
      });
    }).catch(function(e){ console.error("chart error", e); });
  }

  // ---------- theme ----------
  function initTheme() {
    if (document.getElementById("zexThemeBtn")) return;
    var btn = document.createElement("button");
    btn.id = "zexThemeBtn";
    document.body.appendChild(btn);
    function apply(mode) {
      document.body.classList.toggle("zex-light", mode === "light");
      btn.textContent = mode === "light" ? "🌙" : "☀️";
    }
    apply(localStorage.getItem("zex-theme") || "dark");
    btn.addEventListener("click", function () {
      var next = document.body.classList.contains("zex-light") ? "dark" : "light";
      localStorage.setItem("zex-theme", next);
      apply(next);
    });
  }

  // ---------- login intercept + OTP ----------
  function doLogin(form) {
    var userInput = form.querySelector('input[name="username"], input[type="text"], input[type="email"]');
    var passInput = form.querySelector('input[type="password"]');
    var remember = form.querySelector('input[type="checkbox"]');
    var body = { username: userInput ? userInput.value.trim() : "", password: passInput ? passInput.value : "" };
    if (remember && remember.checked) body.rememberMe = true;
    fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d && res.d.otpRequired) { askOtp(); return; }
        if (res.ok) { window.location.href = "/dashboard"; return; }
        alert((res.d && res.d.error) || "خطای ورود");
      })
      .catch(function () { alert("خطای ارتباط"); });
  }

  function askOtp() {
    var m = document.createElement("div");
    m.style.cssText = "position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(4,6,12,.75);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;";
    m.innerHTML = '<div style="background:#0e1220;border:1px solid #212942;border-radius:16px;padding:24px;max-width:360px;width:100%">' +
      '<h3 style="color:#f2b705;margin:0 0 10px;font-size:16px">کد دومرحله‌ای</h3>' +
      '<p style="color:#8892ab;font-size:12px;margin-bottom:12px">کد ۶ رقمی از اپ احراز هویت را وارد کن.</p>' +
      '<input id="zexLoginOtp" inputmode="numeric" maxlength="6" style="width:100%;padding:12px;background:#131829;border:1px solid #212942;border-radius:8px;color:#eef1f8;font-size:16px;letter-spacing:6px;text-align:center">' +
      '<div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="zexLoginOtpOk" style="background:#f2b705;color:#1a1204;border:none;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer">ورود</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("zexLoginOtpOk").addEventListener("click", function () {
      fetch("/api/login/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: document.getElementById("zexLoginOtp").value }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) window.location.href = "/dashboard";
          else alert((res.d && res.d.error) || "کد معتبر نیست");
        });
    });
  }

  function initLoginIntercept() {
    document.addEventListener("submit", function (e) {
      if (!e.target || e.target.tagName !== "FORM") return;
      e.preventDefault();
      e.stopPropagation();
      doLogin(e.target);
    }, true);
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn) return;
      if (!(btn.type === "submit" || btn.type === "")) return;
      var form = btn.closest ? btn.closest("form") : null;
      if (!form) return;
      e.preventDefault();
      e.stopPropagation();
      doLogin(form);
    }, true);
  }

  // ---------- Push Notifications ----------
  function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.register('/assets/sw.js')
      .then(function (registration) { console.log('[SW] Registered'); })
      .catch(function (err) { console.error('[SW] Error:', err); });
  }

  function sendTestNotification() {
    if (!('serviceWorker' in navigator)) { alert('مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند'); return; }
    navigator.serviceWorker.ready.then(function (registration) {
      registration.showNotification('🎉 تست اعلان', {
        body: 'این یک اعلان تست از پنل زئوس است!',
        icon: '/assets/icon.png',
        badge: '/assets/icon.png',
        vibrate: [100, 50, 100]
      });
      alert('✅ اعلان تست ارسال شد!');
    }).catch(function (err) { alert('خطا: ' + err.message); });
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) { alert('مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند'); return; }
    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') { alert('✅ مجوز اعلان داده شد!'); sendTestNotification(); }
      else { alert('❌ مجوز اعلان رد شد'); }
    });
  }

  function injectNotificationButton() {
    var tab = document.getElementById('reports-tab');
    if (!tab || document.getElementById('zexNotifBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'zexNotifBtn';
    btn.className = 'btn btn-gold';
    btn.textContent = '🔔 تست اعلان';
    btn.style.cssText = 'margin-top:16px;width:100%;';
    btn.addEventListener('click', requestNotificationPermission);
    tab.appendChild(btn);
  }

  // ---------- Audit Log ----------
  function injectAuditCard() {
    var tab = document.getElementById("settings-tab");
    if (!tab || document.getElementById("zexAuditCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexAuditCard";
    card.innerHTML = '<div class="card-head"><h3>لاگ فعالیت‌ها</h3></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<button class="btn btn-gold" id="zexAuditRefresh">بروزرسانی</button>' +
      '<button class="btn btn-danger-ghost" id="zexAuditClear">پاک کردن</button></div>' +
      '<div id="zexAuditList" style="max-height:400px;overflow-y:auto"></div>';
    tab.appendChild(card);
    document.getElementById("zexAuditRefresh").addEventListener("click", loadAuditLogs);
    document.getElementById("zexAuditClear").addEventListener("click", function () {
      if (confirm("آیا مطمئن هستید؟ تمام لاگ‌ها پاک می‌شوند.")) {
        fetch("/api/audit", { method: "DELETE" }).then(function (r) {
          if (r.ok) { loadAuditLogs(); alert("پاک شد"); }
        });
      }
    });
  }

  function loadAuditLogs() {
    var list = document.getElementById("zexAuditList");
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;color:#8892ab;padding:20px">در حال بارگذاری...</div>';
    fetch("/api/audit?limit=50").then(function (r) { return r.json(); }).then(function (d) {
      if (!d.logs || d.logs.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8892ab;padding:20px">لاگی ثبت نشده</div>';
        return;
      }
      var eventNames = {
        "admin.login": "🔐 ورود مدیر",
        "admin.logout": "🚪 خروج مدیر",
        "user.create": "➕ ایجاد کاربر",
        "user.delete": "🗑️ حذف کاربر",
        "user.edit": "✏️ ویرایش کاربر",
        "server.create": "🖥️ ایجاد سرور",
        "server.delete": "🗑️ حذف سرور",
        "settings.change": "⚙️ تغییر تنظیمات",
        "otp.enable": "🔑 فعال‌سازی OTP",
        "otp.disable": "🔓 غیرفعال‌سازی OTP",
        "users.export": "📤 خروجی کاربران",
        "users.import": "📥 ورودی کاربران"
      };
      list.innerHTML = d.logs.map(function (l) {
        var name = eventNames[l.event] || l.event;
        var time = new Date(l.timestamp).toLocaleString("fa-IR");
        var detail = l.details && l.details.username ? (" - " + l.details.username) : "";
        return '<div style="padding:10px;border-bottom:1px solid #212942;font-size:12px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<b style="color:#f2b705">' + name + detail + '</b>' +
          '<span style="color:#8892ab;font-size:11px">' + time + '</span></div>' +
          '<div style="color:#5c6b8a;font-size:11px;margin-top:4px">مدیر: ' + l.admin + ' | IP: ' + (l.ip || "-") + '</div></div>';
      }).join("");
    }).catch(function () {
      list.innerHTML = '<div style="text-align:center;color:#ff5c72;padding:20px">خطا در بارگذاری</div>';
    });
  }

  function init() {
    if (/^\/login/.test(location.pathname)) { initLoginIntercept(); return; }
    if (!document.getElementById("usersList")) return;
    refreshBanner();
    setInterval(refreshBanner, 300000);
    refreshPings();
    setInterval(refreshPings, 30000);
    injectSettingsCards();
    injectTrafficCard();
    refreshTraffic();
    setInterval(refreshTraffic, 30000);
    injectChartCard();
    renderCharts();
    setInterval(renderCharts, 60000);
    initTheme();
    initPushNotifications();
    injectNotificationButton();
    injectAuditCard();
    loadAuditLogs();
    document.addEventListener("click", function () { setTimeout(renderCharts, 400); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
