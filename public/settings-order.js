(function () {
  "use strict";
  if (window._zexSO) return;
  window._zexSO = 1;

  function title(c) {
    var h = c.querySelector("h3, h2");
    return h ? h.textContent : "";
  }

  var ORDER = [
    function (c) { return /نام پنل|Panel Name/.test(title(c)); },
    function (c) { return /نام کاربری مدیر|Username Admin/.test(title(c)); },
    function (c) { return /رمز عبور مدیر|رمز مدیر|Password Admin/.test(title(c)); },
    function (c) { return c.id === "zexOtpCard"; },
    function (c) { return c.id === "zexPlansCard"; },
    function (c) { return c.id === "zexExpImpCard"; },
    function (c) { return /پشتیبان‌گیری|Backup/.test(title(c)); },
    function (c) { return c.id === "zexTicketCardAdmin"; },
    function (c) { return c.id === "zexAuditCard"; }
  ];

  function idx(c) {
    for (var i = 0; i < ORDER.length; i++) {
      if (ORDER[i](c)) return i;
    }
    return ORDER.length;
  }

  function reorder() {
    var tab = document.getElementById("settings-tab");
    if (!tab) return;
    var grid = tab.querySelector(".settings-grid") || tab;
    var cards = [];
    tab.querySelectorAll(".card").forEach(function (c) { cards.push(c); });
    if (!cards.length) return;
    cards.sort(function (a, b) { return idx(a) - idx(b); });
    cards.forEach(function (c) { grid.appendChild(c); });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    reorder();
    setInterval(reorder, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
