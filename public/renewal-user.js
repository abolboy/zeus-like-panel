(function () {
  "use strict";
  if (window._zexRU) return;
  window._zexRU = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    renewal: "Request Renewal", selectPlan: "Select Plan", send: "Send Request",
    noPlan: "No plans available", pending: "You have a pending request",
    sent: "Request sent ✅", error: "Error"
  } : {
    renewal: "درخواست تمدید", selectPlan: "انتخاب پلن", send: "ارسال درخواست",
    noPlan: "پلنی موجود نیست", pending: "شما یک درخواست باز دارید",
    sent: "درخواست ارسال شد ✅", error: "خطا"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function toast(msg) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid #f2b70566;color:#f2b705;padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("#udRenew");
    if (!btn) return;
    e.preventDefault();
    fetch("/api/plans/public").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var plans = (d && d.plans) || [];
      if (!plans.length) { toast(L.noPlan); return; }
      var m = document.createElement("div");
      m.style.cssText = "position:fixed;inset:0;background:rgba(4,6,12,.85);display:flex;align-items:center;justify-content:center;z-index:9000;padding:18px";
      m.innerHTML = '<div style="background:#0e1220;border:1px solid #212942;border-radius:18px;padding:20px;max-width:400px;width:100%"><h3 style="margin:0 0 14px;font-size:15px;color:#eef1f8">⏳ ' + L.renewal + '</h3>' +
        '<div style="max-height:280px;overflow-y:auto;margin-bottom:14px">' +
        plans.map(function (p) {
          return '<label style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #212942;border-radius:10px;margin-bottom:8px;cursor:pointer;background:#131829"><input type="radio" name="renewalPlan" value="' + p.id + '" style="width:18px;height:18px"><div style="flex:1"><b style="font-size:13px;color:#eef1f8">' + esc(p.name) + '</b><div style="font-size:11px;color:#8892ab;margin-top:3px">' + p.days + ' ' + (lang === "fa" ? "روز" : "days") + ' / ' + p.traffic + ' GB</div></div></label>';
        }).join("") + '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="ud-btn ud-ghost" id="renewalCancel" style="border:none;border-radius:10px;padding:10px 16px;font-size:12.5px;font-weight:700;background:#131829;border:1px solid #212942;color:#eef1f8;cursor:pointer">انصراف</button><button class="ud-btn ud-gold" id="renewalSend" style="border:none;border-radius:10px;padding:10px 16px;font-size:12.5px;font-weight:700;background:#f2b705;color:#1a1204;cursor:pointer">' + L.send + '</button></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", function (ev) { if (ev.target === m) m.remove(); });
      document.getElementById("renewalCancel").addEventListener("click", function () { m.remove(); });
      document.getElementById("renewalSend").addEventListener("click", function () {
        var sel = m.querySelector('input[name="renewalPlan"]:checked');
        if (!sel) { toast("پلن را انتخاب کنید"); return; }
        var sendBtn = document.getElementById("renewalSend");
        sendBtn.disabled = true;
        sendBtn.textContent = "⏳ ...";
        fetch("/api/renewal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: sel.value }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) { toast(L.sent); m.remove(); }
            else { sendBtn.disabled = false; sendBtn.textContent = L.send; toast(d.error || L.error); }
          })
          .catch(function () { sendBtn.disabled = false; sendBtn.textContent = L.send; toast(L.error); });
      });
    }).catch(function () { toast(L.error); });
  });
})();
