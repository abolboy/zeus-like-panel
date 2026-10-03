(function () {
  "use strict";
  if (window._zexBN) return;
  window._zexBN = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    dashboard: "Home", tickets: "Tickets", profile: "Profile", link: "Link"
  } : {
    dashboard: "داشبورد", tickets: "پشتیبانی", profile: "پروفایل", link: "لینک"
  };

  function buildNav() {
    if (document.getElementById("zexBottomNav")) return;

    var nav = document.createElement("nav");
    nav.id = "zexBottomNav";
    nav.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(10,14,26,0.98);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:2px solid #f2b705;display:flex;justify-content:space-around;padding:10px 0 calc(10px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,0.8)";

    var items = [
      { id: "navDashboard", icon: "🏠", label: L.dashboard, page: "dashboard" },
      { id: "navLink", icon: "🔗", label: L.link, page: "link" },
      { id: "navSupport", icon: "🎫", label: L.tickets, page: "support" },
      { id: "navProfile", icon: "👤", label: L.profile, page: "profile" }
    ];

    items.forEach(function (item) {
      var btn = document.createElement("button");
      btn.id = item.id;
      btn.style.cssText = "flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;background:none;border:none;color:#8892ab;font-size:11px;font-weight:700;cursor:pointer;transition:color .2s;-webkit-tap-highlight-color:transparent";
      btn.innerHTML = '<span style="font-size:22px;line-height:1">' + item.icon + '</span><span style="font-size:10px">' + item.label + '</span>';
      btn.addEventListener("click", function () {
        if (typeof window.showPage === "function") {
          window.showPage(item.page);
        }
      });
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);

    // هایلایت دکمه پیش‌فرض (داشبورد)
    var first = document.getElementById("navDashboard");
    if (first) first.style.color = "#f2b705";
  }

  function init() {
    buildNav();
    setTimeout(buildNav, 1000);
    setTimeout(buildNav, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
