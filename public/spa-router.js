(function () {
  "use strict";
  var routes = {};
  function register(p, h) { routes[p] = h; }
  function navigate(p) { history.pushState({}, "", p); render(); }
  function render() {
    // اگر هیچ route ای ثبت نشده، هیچ کاری نکن (هرگز body را پاک نکن)
    if (Object.keys(routes).length === 0) return;
    var h = routes[window.location.pathname];
    if (h) h();
  }
  window.addEventListener("popstate", render);
  window.SPA = { register: register, navigate: navigate };
})();
