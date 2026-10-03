(function () {
  if (window._adminSPA) return;
  window._adminSPA = 1;

  function tabs() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  }
  function panelFor(tabId) { return document.getElementById(tabId); }

  function fade(el) {
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  function activate(tabId, push) {
    var target = tabs().filter(function (b) { return b.getAttribute("data-tab") === tabId; })[0];
    if (!target) return;
    target.click(); // هندلر موجود خود صفحه کارش را می‌کند
    if (push) history.pushState({ tab: tabId }, "", "#" + tabId);
    else history.replaceState({ tab: tabId }, "", "#" + tabId);
    fade(panelFor(tabId));
  }

  function currentFromHash() { return (location.hash || "").replace("#", ""); }

  function init() {
    // استایل ترنزیشن نرم
    var st = document.createElement("style");
    st.textContent = '[id$="-tab"]{animation:zexFade .25s ease}@keyframes zexFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}';
    document.head.appendChild(st);

    // لینک عمیق اولیه
    var h = currentFromHash();
    if (h && panelFor(h)) {
      setTimeout(function () { activate(h, false); }, 300);
    } else {
      var act = document.querySelector('[data-tab].active');
      if (act) history.replaceState({ tab: act.getAttribute("data-tab") }, "", "#" + act.getAttribute("data-tab"));
    }

    // sync کردن hash با کلیک روی تب‌ها (بدون دست‌کردن در هندلر اصلی)
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      var tabId = btn.getAttribute("data-tab");
      setTimeout(function () {
        history.pushState({ tab: tabId }, "", "#" + tabId);
        fade(panelFor(tabId));
      }, 0);
    });

    // دکمه Back/Forward مرورگر
    window.addEventListener("popstate", function (e) {
      var tabId = (e.state && e.state.tab) || currentFromHash();
      if (!tabId) return;
      var cur = document.querySelector('[data-tab].active');
      if (!cur || cur.getAttribute("data-tab") !== tabId) activate(tabId, false);
      else fade(panelFor(tabId));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
