(function () {
  "use strict";
  if (window._zexLH) return;
  window._zexLH = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var cache = {};

  function fmt(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(lang === "fa" ? "fa-IR" : "en-GB", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return "—"; }
  }

  function load() {
    fetch("/api/users").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list) return;
      list.forEach(function (u) { cache[u.username] = u; });
      paint();
    }).catch(function () {});
  }

  function paint() {
    document.querySelectorAll(".user-card").forEach(function (card) {
      if (card.querySelector("[data-zex-lastlogin]")) return;
      var nameEl = card.querySelector(".user-name");
      var meta = card.querySelector(".user-card-meta");
      if (!nameEl || !meta) return;
      var u = cache[nameEl.textContent.trim()];
      var div = document.createElement("div");
      div.setAttribute("data-zex-lastlogin", "1");
      var hist = (u && u.loginHistory && u.loginHistory.length)
        ? u.loginHistory.slice(-3).reverse().map(function (h) { return fmt(h.time) + " (" + h.ip + ")"; }).join(" | ")
        : "";
      if (hist) div.title = hist;
      div.innerHTML = "<span>" + (lang === "fa" ? "آخرین ورود" : "Last Login") + '</span><b style="font-size:11px">' + fmt(u && u.lastLogin) + "</b>";
      meta.appendChild(div);
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    load();
    setInterval(load, 15000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
