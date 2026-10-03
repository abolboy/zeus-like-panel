(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    title: "Advanced Analytics", total: "Total Users", active: "Active", inactive: "Inactive",
    exp7: "Expiring (7d)", used: "Used", usage: "Usage", growth: "New Users (30 days)",
    forecast: "Expiry Forecast", server: "Server Load", top: "Top Consumption",
    activity: "Recent Activity", d07: "0-7d", d814: "8-14d", d1530: "15-30d", dl: ">30d", ex: "Expired", gb: "GB"
  } : {
    title: "تحلیل پیشرفته", total: "کل کاربران", active: "فعال", inactive: "غیرفعال",
    exp7: "انقضا تا ۷ روز", used: "مصرف کل", usage: "نرخ مصرف", growth: "کاربران جدید (۳۰ روز)",
    forecast: "پیش‌بینی انقضا", server: "بار سرورها", top: "پرمصرف‌ترین‌ها",
    activity: "فعالیت‌های اخیر", d07: "۰-۷ روز", d814: "۸-۱۴ روز", d1530: "۱۵-۳۰ روز", dl: "بیش از ۳۰ روز", ex: "منقضی شده", gb: "گیگ"
  };

  var charts = {};

  function inject() {
    var tab = document.getElementById("reports-tab");
    if (!tab || document.getElementById("zexAnalyticsCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexAnalyticsCard";
    card.style.overflowX = "hidden";
    card.innerHTML =
      '<div class="card-head"><h3>' + L.title + '</h3></div>' +
      '<div id="zexKpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:10px;margin-bottom:16px"></div>' +
      '<h4 style="margin:0 0 8px;font-size:13px;color:var(--muted,#8892ab)">' + L.growth + '</h4>' +
      '<div style="margin-bottom:16px"><div style="position:relative;height:220px"><canvas id="zexGrowthChart"></canvas></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      '<div><h4 style="margin:0 0 8px;font-size:13px;color:var(--muted,#8892ab)">' + L.forecast + '</h4><div style="position:relative;height:220px"><canvas id="zexForecastChart"></canvas></div></div>' +
      '<div><h4 style="margin:0 0 8px;font-size:13px;color:var(--muted,#8892ab)">' + L.server + '</h4><div style="position:relative;height:220px"><canvas id="zexServerLoadChart"></canvas></div></div></div>' +
      '<h4 style="margin:0 0 8px;font-size:13px;color:var(--muted,#8892ab)">' + L.top + '</h4>' +
      '<div id="zexTopUsers" style="margin-bottom:16px"></div>' +
      '<h4 style="margin:0 0 8px;font-size:13px;color:var(--muted,#8892ab)">' + L.activity + '</h4>' +
      '<div id="zexActivity" style="font-size:12px"></div>';
    tab.insertBefore(card, tab.firstChild);
  }

  function kpi(label, value, color) {
    return '<div style="background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:10px;padding:10px;text-align:center">' +
      '<div style="font-size:11px;color:var(--muted,#8892ab)">' + label + '</div>' +
      '<div style="font-size:19px;font-weight:bold;color:' + color + ';margin-top:4px">' + value + '</div></div>';
  }

  function render(d) {
    var k = d.kpis;
    var kpisEl = document.getElementById("zexKpis");
    if (kpisEl) {
      kpisEl.innerHTML =
        kpi(L.total, k.total, "var(--gold,#f2b705)") +
        kpi(L.active, k.active, "#35d68f") +
        kpi(L.inactive, k.inactive, "#ff5c72") +
        kpi(L.exp7, k.exp7, "#f59e0b") +
        kpi(L.used + " (" + L.gb + ")", k.used, "#eef1f8") +
        kpi(L.usage, k.usagePct + "%", "#f2b705");
    }
    if (!window.Chart) return;

    var isLight = document.body.classList.contains("zex-light");
    var tc = isLight ? "#182135" : "#eef1f8";
    var gc = isLight ? "#d9e0ee" : "#212942";

    Object.keys(charts).forEach(function (key) { charts[key].destroy(); });
    charts = {};

    var gEl = document.getElementById("zexGrowthChart");
    if (gEl) {
      charts.growth = new Chart(gEl, {
        type: "bar",
        data: {
          labels: d.growth.map(function (g) { return g.date.slice(5); }),
          datasets: [{ data: d.growth.map(function (g) { return g.count; }), backgroundColor: "#f2b70588", borderColor: "#f2b705", borderWidth: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tc, font: { size: 9 } }, grid: { color: gc } }, y: { ticks: { color: tc, precision: 0 }, grid: { color: gc } } } }
      });
    }

    var fEl = document.getElementById("zexForecastChart");
    if (fEl) {
      charts.forecast = new Chart(fEl, {
        type: "doughnut",
        data: {
          labels: [L.d07, L.d814, L.d1530, L.dl, L.ex],
          datasets: [{ data: [d.forecast.w1, d.forecast.w2, d.forecast.m1, d.forecast.later, d.forecast.expired], backgroundColor: ["#f59e0b", "#f2b705", "#35d68f", "#5c6b8a", "#ff5c72"] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: tc, font: { size: 10 } } } } }
      });
    }

    var sEl = document.getElementById("zexServerLoadChart");
    if (sEl) {
      charts.server = new Chart(sEl, {
        type: "polarArea",
        data: {
          labels: d.serverLoad.map(function (s) { return s.name; }),
          datasets: [{ data: d.serverLoad.map(function (s) { return s.gb; }), backgroundColor: ["#f2b70577", "#35d68f77", "#ff5c7277", "#5c6b8a77"] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: tc, font: { size: 10 } } } }, scales: { r: { ticks: { color: tc, backdropColor: "transparent" }, grid: { color: gc } } } }
      });
    }

    var topEl = document.getElementById("zexTopUsers");
    if (topEl) {
      topEl.innerHTML = d.topUsers.length ? d.topUsers.map(function (u) {
        var barColor = u.pct > 80 ? "#ff5c72" : (u.pct > 50 ? "#f59e0b" : "#35d68f");
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px">' +
          '<b style="width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(u.username) + '</b>' +
          '<div style="flex:1;height:8px;border-radius:6px;background:var(--panel-2,#131829);overflow:hidden"><i style="display:block;height:100%;width:' + u.pct + '%;background:' + barColor + '"></i></div>' +
          '<span style="width:80px;text-align:left;color:var(--muted,#8892ab);font-size:11px">' + u.used + "/" + u.total + " " + L.gb + '</span></div>';
      }).join("") : '<div style="color:var(--muted,#8892ab)">—</div>';
    }

    var actEl = document.getElementById("zexActivity");
    if (actEl) {
      actEl.innerHTML = d.activity.length ? d.activity.map(function (a) {
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--border,#212942)">' +
          '<span>' + esc(a.event) + ' (' + esc(a.admin) + ')</span>' +
          '<span style="color:var(--muted,#8892ab);font-size:11px">' + new Date(a.time).toLocaleString(lang === "fa" ? "fa-IR" : "en-GB") + '</span></div>';
      }).join("") : '<div style="color:var(--muted,#8892ab)">—</div>';
    }
  }

  function refresh() {
    var tab = document.getElementById("reports-tab");
    if (!tab || !tab.classList.contains("active")) return;
    fetch("/api/analytics").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d) render(d);
    }).catch(function () {});
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    inject();
    refresh();
    setInterval(refresh, 60000);
    document.addEventListener("click", function () { setTimeout(refresh, 400); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
