(function () {
  "use strict";
  if (window._zexSB) return;
  window._zexSB = 1;

  function toast(msg) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid #f2b70566;color:#f2b705;padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500;box-shadow:0 10px 30px rgba(0,0,0,.5)";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { toast("لینک کپی شد!"); }).catch(function () { fallbackCopy(t); });
    } else fallbackCopy(t);
  }
  function fallbackCopy(t) {
    var ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("لینک کپی شد!"); } catch (e) { toast("خطا در کپی"); }
    ta.remove();
  }

  function getUsername() {
    var h1 = document.querySelector(".ud-head h1");
    return h1 ? h1.textContent.trim() : "";
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sub-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-sub-action");
    var linkEl = document.getElementById("udSubLink");
    var link = linkEl ? linkEl.textContent.trim() : "";
    var username = getUsername();

    if (action === "copy") {
      if (link) copyText(link);
      else toast("لینکی نیست");
    } else if (action === "qr") {
      if (!username) { toast("نام کاربر پیدا نشد"); return; }
      var m = document.createElement("div");
      m.style.cssText = "position:fixed;inset:0;background:rgba(4,6,12,.85);display:flex;align-items:center;justify-content:center;z-index:9000;padding:18px";
      m.innerHTML = '<div style="background:#0e1220;border:1px solid #212942;border-radius:18px;padding:20px;max-width:340px;width:100%;text-align:center"><h3 style="margin:0 0 12px;font-size:15px;color:#eef1f8"> کد QR سابسکریپشن</h3><div id="udQrSubBox" style="background:#fff;border-radius:14px;padding:12px;display:inline-block;margin:10px auto;min-width:200px;min-height:200px"></div><div style="margin-top:12px"><button id="udQrSubClose" style="border:none;border-radius:10px;padding:10px 20px;font-size:12.5px;font-weight:700;background:#131829;border:1px solid #212942;color:#eef1f8;cursor:pointer">بستن</button></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", function (ev) { if (ev.target === m) m.remove(); });
      document.getElementById("udQrSubClose").addEventListener("click", function () { m.remove(); });
      fetch("/api/sub/qrsub/" + encodeURIComponent(username)).then(function (r) { return r.ok ? r.text() : Promise.reject(); })
        .then(function (svg) { var b = document.getElementById("udQrSubBox"); if (b) b.innerHTML = svg; })
        .catch(function () { var b = document.getElementById("udQrSubBox"); if (b) b.textContent = "❌ خطا"; });
    } else if (action === "rotate" || action === "make") {
      if (!username) { toast("نام کاربر پیدا نشد"); return; }
      btn.disabled = true;
      btn.textContent = "⏳ ...";
      fetch("/api/sub/token/" + encodeURIComponent(username), { method: "POST" }).then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { toast("توکن جدید ساخته شد — صفحه رفرش می‌شود"); setTimeout(function () { location.reload(); }, 800); }
          else { btn.disabled = false; btn.textContent = action === "make" ? " ساخت لینک" : "🔄 تغییر توکن"; toast(d.error || "خطا"); }
        })
        .catch(function () { btn.disabled = false; btn.textContent = action === "make" ? "🔗 ساخت لینک" : " تغییر توکن"; toast("خطای ارتباط"); });
    }
  });

  console.log("✅ sub-buttons.js فعال شد");
})();
