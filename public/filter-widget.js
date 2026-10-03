(function () {
  "use strict";
  if (window._zexFW) return;
  window._zexFW = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    usage: "Usage", all: "All", over80: "80%+", mid: "50-80%", under50: "Under 50%",
    expiry: "Expiry", expired: "Expired", under7: "Within 7d", under30: "Within 30d",
    server: "Server", allServers: "All Servers", sort: "Sort", none: "Default",
    name: "Name", byUsage: "Usage %", byExpiry: "Nearest Expiry"
  } : {
    usage: "فیلتر مصرف", all: "همه", over80: "۸۰٪ به بالا", mid: "۵۰-۸۰٪", under50: "زیر ۵۰٪",
    expiry: "فیلتر انقضا", expired: "منقضی‌شده", under7: "تا ۷ روز", under30: "تا ۳۰ روز",
    server: "فیلتر سرور", allServers: "همه سرورها", sort: "مرتب‌سازی", none: "پیش‌فرض",
    name: "نام", byUsage: "درصد مصرف", byExpiry: "نزدیک‌ترین انقضا"
  };

  var userData = {};
  var servers = [];

  function load() {
    fetch("/api/users").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list) return;
      userData = {};
      list.forEach(function (u) { userData[u.username] = u; });
      apply();
    }).catch(function () {});
    fetch("/api/servers").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list) return;
      servers = list;
      var s = document.getElementById("zexFServer");
      if (s && s.options.length === 1) {
        servers.forEach(function (sv) {
          var op = document.createElement("option");
          op.value = String(sv.id);
          op.textContent = sv.name;
          s.appendChild(op);
        });
      }
    }).catch(function () {});
  }

  function sel(id, label, opts) {
    return '<label style="flex:1;min-width:110px;font-size:11px;color:var(--muted,#8892ab)">' + label +
      '<select id="' + id + '" style="width:100%;margin-top:4px;padding:9px;background:var(--panel,#0e1220);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:12px">' +
      opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join("") +
      '</select></label>';
  }

  function inject() {
    if (document.getElementById("zexFilterBar")) return;
    var list = document.getElementById("usersList");
    if (!list || !list.parentElement) return;
    var bar = document.createElement("div");
    bar.id = "zexFilterBar";
    bar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;padding:12px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:12px";
    bar.innerHTML =
      sel("zexFUsage", "📊 " + L.usage, [["all", L.all], ["80", L.over80], ["50", L.mid], ["low", L.under50]]) +
      sel("zexFExp", "⏳ " + L.expiry, [["all", L.all], ["expired", L.expired], ["7", L.under7], ["30", L.under30]]) +
      sel("zexFServer", "🖥 " + L.server, [["all", L.allServers]]) +
      sel("zexFSort", "🔃 " + L.sort, [["none", L.none], ["name", L.name], ["usage", L.byUsage], ["expiry", L.byExpiry]]);
    list.parentElement.insertBefore(bar, list);
    ["zexFUsage", "zexFExp", "zexFServer"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", apply);
    });
    document.getElementById("zexFSort").addEventListener("change", sortCards);
  }

  function daysLeft(e) {
    if (!e) return null;
    var p = String(e).split("-").map(Number);
    if (p.length !== 3) return null;
    var d = new Date(p[2], p[1] - 1, p[0]);
    var t = new Date();
    var t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.floor((d.getTime() - t0.getTime()) / 86400000);
  }

  function usagePct(u) {
    if (!u) return -1;
    var t = Number(u.traffic) || 0;
    if (!t) return -1;
    return Math.min(100, ((Number(u.trafficUsed) || 0) / t) * 100);
  }

  function apply() {
    var fuEl = document.getElementById("zexFUsage");
    if (!fuEl) return;
    var fu = fuEl.value, fe = document.getElementById("zexFExp").value, fs = document.getElementById("zexFServer").value;
    document.querySelectorAll(".user-card").forEach(function (card) {
      var nameEl = card.querySelector(".user-name");
      var name = nameEl ? nameEl.textContent.trim() : "";
      var u = userData[name];
      var show = true;
      if (u) {
        if (fu !== "all") {
          var p = usagePct(u);
          if (fu === "80") show = p >= 80;
          else if (fu === "50") show = p >= 50 && p < 80;
          else if (fu === "low") show = p >= 0 && p < 50;
        }
        if (show && fe !== "all") {
          var d = daysLeft(u.expiry);
          if (fe === "expired") show = d !== null && d < 0;
          else if (fe === "7") show = d !== null && d >= 0 && d <= 7;
          else if (fe === "30") show = d !== null && d >= 0 && d <= 30;
        }
        if (show && fs !== "all") {
          var ids = (u.serverIds || []).map(String);
          if (ids.length) show = ids.indexOf(fs) > -1;
        }
      }
      card.style.display = show ? "" : "none";
    });
  }

  function sortCards() {
    var mode = document.getElementById("zexFSort").value;
    if (mode === "none") return;
    var list = document.getElementById("usersList");
    var cards = Array.prototype.slice.call(list.querySelectorAll(".user-card"));
    cards.sort(function (a, b) {
      var na = a.querySelector(".user-name"), nb = b.querySelector(".user-name");
      var sa = na ? na.textContent.trim() : "", sb = nb ? nb.textContent.trim() : "";
      var ua = userData[sa], ub = userData[sb];
      if (mode === "name") return sa.localeCompare(sb);
      if (mode === "usage") return usagePct(ub) - usagePct(ua);
      if (mode === "expiry") {
        var da = daysLeft(ua && ua.expiry), db = daysLeft(ub && ub.expiry);
        return (da === null ? 9999 : da) - (db === null ? 9999 : db);
      }
      return 0;
    });
    cards.forEach(function (c) { list.appendChild(c); });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    inject();
    load();
    setInterval(function () { inject(); apply(); }, 4000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
