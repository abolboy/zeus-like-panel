(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var booted = false;

  var CSS = [
    ".zfx-layer{position:fixed;top:0;right:0;bottom:0;left:0;pointer-events:none;overflow:hidden;z-index:5;}",
    ".zfx-p{position:absolute;top:0;will-change:transform;animation:zfx-fall var(--dur) linear var(--delay) infinite;}",
    ".zfx-s{animation:zfx-sway var(--sway) ease-in-out var(--sdelay) infinite alternate;}",
    ".zfx-dot{display:block;border-radius:50%;}",
    ".zfx-dot.snow{background:radial-gradient(circle at 35% 35%, rgba(255,255,255,.95), rgba(210,228,255,.75) 55%, rgba(160,190,255,0) 75%);}",
    ".zfx-dot.ember{background:radial-gradient(circle at 40% 40%, #ffd76a, #ff8a25 55%, rgba(255,80,0,0) 78%);box-shadow:0 0 6px 2px rgba(255,150,60,.35);animation:zfx-flicker var(--flick) ease-in-out infinite alternate;}",
    ".zfx-bolt{position:absolute;top:-15%;width:2px;height:16vh;background:linear-gradient(180deg,rgba(255,255,255,0),#fff4b0 30%,#f2b705 60%,rgba(242,183,5,0));filter:drop-shadow(0 0 4px rgba(242,183,5,.8));opacity:0;animation:zfx-bolt 900ms cubic-bezier(.25,.6,.35,1) forwards;}",
    "@keyframes zfx-fall{0%{transform:translate3d(0,-8vh,0);opacity:0;}8%{opacity:var(--op);}88%{opacity:var(--op);}100%{transform:translate3d(var(--drift),108vh,0);opacity:0;}}",
    "@keyframes zfx-sway{from{transform:translate3d(calc(var(--amp) * -1),0,0);}to{transform:translate3d(var(--amp),0,0);}}",
    "@keyframes zfx-flicker{from{opacity:.55;transform:scale(.92);}to{opacity:1;transform:scale(1.06);}}",
    "@keyframes zfx-bolt{0%{transform:translate3d(0,0,0) rotate(var(--tilt));opacity:0;}12%{opacity:.9;}100%{transform:translate3d(var(--bdrift),115vh,0) rotate(var(--tilt));opacity:0;}}"
  ].join("\n");

  function rand(min, max) { return min + Math.random() * (max - min); }

  function injectStyle() {
    var s = document.createElement("style");
    s.id = "zfx-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function particle(layer, kind) {
    var p = document.createElement("div");
    var s = document.createElement("div");
    var d = document.createElement("i");
    p.className = "zfx-p";
    s.className = "zfx-s";
    d.className = "zfx-dot " + kind;

    var size = kind === "snow" ? rand(2.5, 6.5) : rand(2, 4.5);
    var dur = kind === "snow" ? rand(10, 18) : rand(8, 14);
    d.style.width = d.style.height = size.toFixed(1) + "px";
    if (kind === "snow" && size < 4) d.style.filter = "blur(1px)";

    // پخش مساوی در کل عرض صفحه + ریزش از بالا به پایین
    p.style.left = rand(0, 100).toFixed(2) + "%";
    p.style.setProperty("--drift", rand(-8, 8).toFixed(1) + "vw");

    p.style.setProperty("--dur", dur.toFixed(2) + "s");
    p.style.setProperty("--delay", (-rand(0, dur)).toFixed(2) + "s");
    p.style.setProperty("--op", (kind === "snow" ? rand(0.35, 0.8) : rand(0.4, 0.85)).toFixed(2));
    s.style.setProperty("--amp", rand(6, 22).toFixed(0) + "px");
    s.style.setProperty("--sway", rand(2.4, 5.2).toFixed(2) + "s");
    s.style.setProperty("--sdelay", (-rand(0, 5)).toFixed(2) + "s");
    if (kind === "ember") s.style.setProperty("--flick", rand(0.6, 1.6).toFixed(2) + "s");

    s.appendChild(d);
    p.appendChild(s);
    layer.appendChild(p);
  }

  function spawnBolt(layer) {
    var b = document.createElement("div");
    b.className = "zfx-bolt";
    b.style.left = rand(5, 95).toFixed(1) + "%";
    b.style.setProperty("--tilt", rand(14, 28).toFixed(0) + "deg");
    b.style.setProperty("--bdrift", rand(4, 14).toFixed(1) + "vw");
    b.addEventListener("animationend", function () { b.remove(); });
    layer.appendChild(b);
  }

  function scheduleBolts(layer) {
    (function loop() {
      setTimeout(function () {
        if (!document.hidden) spawnBolt(layer);
        loop();
      }, rand(3500, 9000));
    })();
  }

  function takeover() {
    if (booted || REDUCED) return;
    booted = true;

    ["zeusSnow", "zeusFire"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    var old = document.querySelectorAll(".zeus-flake, .zeus-ember, .electric-fragment");
    for (var i = 0; i < old.length; i++) old[i].remove();

    if (!document.getElementById("zfx-style")) injectStyle();

    var layer = document.createElement("div");
    layer.className = "zfx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    // تعداد مساوی برف و آتش، متناسب با عرض صفحه
    var w = window.innerWidth || 360;
    var half = Math.min(14, Math.round(w / 64));
    for (var j = 0; j < half; j++) particle(layer, "snow");
    for (var k = 0; k < half; k++) particle(layer, "ember");
    scheduleBolts(layer);
  }

  function boot() { setTimeout(takeover, 0); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
