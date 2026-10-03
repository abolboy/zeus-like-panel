
(function () {
  if (window._zexPWA) return;
  window._zexPWA = 1;

  // ثبت Service Worker واحد
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/assets/sw-app.js").catch(function () {});
    });
  }

  var deferred = null;

  function showButton() {
    if (document.getElementById("zexInstallBtn")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    var b = document.createElement("button");
    b.id = "zexInstallBtn";
    b.style.cssText = "position:fixed;bottom:86px;left:12px;z-index:99998;background:linear-gradient(135deg,#f2b705,#f59e0b);color:#1a1204;border:none;border-radius:999px;padding:10px 16px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 20px rgba(242,183,5,.4)";
    b.textContent = "📲 نصب اپلیکیشن";
    b.addEventListener("click", function () {
      if (!deferred) {
        alert("برای نصب: منوی مرورگر (⋮) → افزودن به صفحه اصلی / Install app");
        return;
      }
      deferred.prompt();
      deferred.userChoice.then(function (choice) {
        if (choice.outcome === "accepted") b.remove();
        deferred = null;
      });
    });
    document.body.appendChild(b);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    showButton();
  });

  window.addEventListener("appinstalled", function () {
    var b = document.getElementById("zexInstallBtn");
    if (b) b.remove();
  });

  // راهنمای iOS
  if (/(iphone|ipad|ipod)/i.test(navigator.userAgent)) setTimeout(showButton, 4000);
})();
