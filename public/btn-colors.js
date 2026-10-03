(function () {
  "use strict";

  var COLORS = {
    toggle: "#35d68f", power: "#35d68f", active: "#35d68f",
    edit: "#5aa7ff",
    qr: "#8b7bff",
    link: "#f2b705", copy: "#f2b705", url: "#f2b705",
    delete: "#ff5c72", remove: "#ff5c72"
  };
  var FALLBACK = ["#35d68f", "#5aa7ff", "#8b7bff", "#f2b705", "#ff5c72"];

  function paintIcon(btn, color) {
    btn.querySelectorAll("svg, svg *").forEach(function (el) {
      if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none") el.setAttribute("stroke", color);
      if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none") el.setAttribute("fill", color);
    });
  }

  function paint() {
    document.querySelectorAll(".user-card").forEach(function (card) {
      var btns = card.querySelectorAll("button[data-action], button[data-zex-phone]");
      btns.forEach(function (b, i) {
        var a = b.getAttribute("data-action") || "";
        var c = COLORS[a];
        if (b.hasAttribute("data-zex-phone")) {
          c = (b.getAttribute("data-phone") || b.style.borderColor === "rgb(53, 214, 143)") ? "#35d68f" : "#f59e0b";
        }
        if (!c) c = FALLBACK[i % FALLBACK.length];
        b.style.color = c;
        b.style.borderColor = c + "55";
        b.style.background = c + "12";
        b.style.transition = "all .25s";
        paintIcon(b, c);
        if (!b.getAttribute("data-zex-colored")) {
          b.setAttribute("data-zex-colored", "1");
          b.addEventListener("mouseenter", function () { b.style.background = c + "28"; b.style.boxShadow = "0 0 14px " + c + "33"; });
          b.addEventListener("mouseleave", function () { b.style.background = c + "12"; b.style.boxShadow = "none"; });
        }
      });
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    paint();
    setInterval(paint, 2500);
    document.addEventListener("click", function () { setTimeout(paint, 400); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
