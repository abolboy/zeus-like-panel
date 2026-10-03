(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var booted = false;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeFlake() {
    var d = document.createElement("div");
    d.textContent = "\u2744";
    d.className = "zfx-flake";
    var size = rand(14, 30);
    d.style.cssText =
      "position:fixed;left:0;top:0;display:block;pointer-events:none;z-index:9999;" +
      "font-size:" + size.toFixed(0) + "px;line-height:1;color:#ffffff;" +
      "text-shadow:0 0 8px rgba(190,220,255,.45);";
    document.body.appendChild(d);
    return d;
  }

  var parts = [];

  function spawn() {
    var el = makeFlake();
    var W = window.innerWidth || 360;
    var H = window.innerHeight || 640;
    parts.push({
      el: el,
      x0: rand(0, W),
      y: rand(-H, H),
      vy: rand(45, 95),
      amp: rand(8, 26),
      sp: rand(0.35, 0.9),
      ph: rand(0, 6.28),
      op: rand(0.35, 0.8),
      rot: rand(0, 360),
      vr: rand(-40, 40)
    });
  }

  var last = 0;
  function frame(t) {
    if (!last) last = t;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    var W = window.innerWidth || 360;
    var H = window.innerHeight || 640;

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 30) { p.y = -30; p.x0 = rand(0, W); }

      var x = p.x0 + Math.sin((t / 1000) * p.sp + p.ph) * p.amp;
      var op = p.op;
      if (p.y < 40) op = p.op * Math.max(0, (p.y + 30) / 70);
      else if (p.y > H - 40) op = p.op * Math.max(0, (H - p.y + 30) / 70);

      p.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0) rotate(" + p.rot.toFixed(0) + "deg)";
      p.el.style.opacity = op.toFixed(2);
    }
    requestAnimationFrame(frame);
  }

  function takeover() {
    if (booted) return;
    booted = true;

    ["zeusSnow", "zeusFire"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    var old = document.querySelectorAll(".zeus-flake, .zeus-ember, .electric-fragment, .zfx-layer, .zfx-p");
    for (var i = 0; i < old.length; i++) old[i].remove();

    var w = window.innerWidth || 360;
    var count = Math.min(50, Math.round(w / 16));

    if (REDUCED || !window.requestAnimationFrame) {
      for (var s = 0; s < count; s++) {
        var d = makeFlake();
        d.style.transform = "translate3d(" + rand(0, w).toFixed(0) + "px," + rand(0, window.innerHeight || 640).toFixed(0) + "px,0)";
        d.style.opacity = "0.5";
      }
    } else {
      for (var j = 0; j < count; j++) spawn();
      requestAnimationFrame(frame);
    }

  }

  function boot() { setTimeout(takeover, 0); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
