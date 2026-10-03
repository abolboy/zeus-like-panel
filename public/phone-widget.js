(function () {
  "use strict";
  var phoneCache = {};

  function toast(msg) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid #35d68f66;color:#35d68f;padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500;box-shadow:0 10px 30px rgba(0,0,0,.5)";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  // ---------- فیلد شماره داخل مودال ساخت کاربر ----------
  function injectPhoneField() {
    document.querySelectorAll(".modal").forEach(function (m) {
      if (m.querySelector("#zexPhoneField")) return;
      var head = m.querySelector("h3, h2");
      var txt = head ? head.textContent : "";
      if (!/افزودن کاربر|Add New User|کاربر جدید/.test(txt)) return;
      var uInput = m.querySelector("input");
      if (!uInput) return;
      var wrap = document.createElement("div");
      wrap.id = "zexPhoneField";
      wrap.style.cssText = "margin-top:10px";
      wrap.innerHTML = '<label style="font-size:12px;color:var(--muted,#8892ab);display:block;margin-bottom:6px">📞 شماره موبایل (اختیاری — پیامک خوش‌آمد خودکار)</label>' +
        '<input id="zexPhoneInput" inputmode="tel" placeholder="+989121234567" style="width:100%;box-sizing:border-box;padding:11px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:13px">';
      var field = uInput.closest(".field");
      if (field && field.after) field.after(wrap);
      else if (uInput.parentElement && uInput.parentElement.after) uInput.parentElement.after(wrap);
    });
  }

  // ---------- رهگیری ساخت کاربر: ارسال شماره بعد از ساخت ----------
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var isCreate = init && init.method && String(init.method).toUpperCase() === "POST" && /\/api\/users(\?|$)/.test(url);
    var phoneVal = null;
    if (isCreate) {
      var pi = document.getElementById("zexPhoneInput");
      if (pi && pi.value.trim()) phoneVal = pi.value.trim();
    }
    var p = origFetch.call(this, input, init);
    if (isCreate && phoneVal) {
      p.then(function (r) {
        if (r.ok) {
          try {
            var body = JSON.parse(init.body);
            if (body.username) {
              origFetch("/api/users/sms/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: body.username, phone: phoneVal }) });
            }
          } catch (e) {}
        }
        return r;
      });
    }
    return p;
  };

  // ---------- دکمه 📞 روی کارت‌ها ----------
  function loadPhones() {
    origFetch("/api/users").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
      if (!list) return;
      list.forEach(function (u) { phoneCache[u.username] = u.phone || ""; });
      decorate();
    }).catch(function () {});
  }

  function decorate() {
    document.querySelectorAll(".user-card").forEach(function (card) {
      if (card.querySelector("[data-zex-phone]")) return;
      var anyBtn = card.querySelector("button[data-action]");
      if (!anyBtn || !anyBtn.parentElement) return;
      var nameEl = card.querySelector(".user-name");
      var username = nameEl ? nameEl.textContent.trim() : "";
      var btn = document.createElement("button");
      btn.setAttribute("data-zex-phone", "1");
      btn.type = "button";
      btn.title = "ثبت شماره موبایل برای پیامک";
      btn.style.cssText = "width:44px;height:44px;border-radius:10px;border:1px solid #f59e0b55;background:#f59e0b12;color:#f59e0b;font-size:16px;cursor:pointer;transition:all .25s";
      btn.textContent = "📞";
      if (phoneCache[username]) {
        btn.style.borderColor = "#35d68f55";
        btn.style.background = "#35d68f12";
        btn.style.color = "#35d68f";
      }
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var phone = prompt("شماره موبایل " + username + " (مثال: +989121234567):", phoneCache[username] || "");
        if (phone === null) return;
        origFetch("/api/users/sms/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username, phone: phone.trim() }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) {
              phoneCache[username] = d.phone || "";
              if (d.phone) {
                btn.style.borderColor = "#35d68f55";
                btn.style.background = "#35d68f12";
                btn.style.color = "#35d68f";
              }
              if (d.welcomeSent) toast("📬 پیامک خوش‌آمد ارسال شد");
              else toast("✅ شماره ذخیره شد");
            } else toast(d.error || "خطا");
          })
          .catch(function () { toast("خطای ارتباط"); });
      });
      anyBtn.parentElement.appendChild(btn);
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    loadPhones();
    setInterval(loadPhones, 30000);
    injectPhoneField();
    new MutationObserver(function () { injectPhoneField(); }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
