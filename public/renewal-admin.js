(function () {
  "use strict";
  if (window._zexRA) return;
  window._zexRA = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    renewals: "Renewal Requests", approve: "Approve", reject: "Reject",
    empty: "No pending requests", approved: "Approved", rejected: "Rejected"
  } : {
    renewals: "درخواست‌های تمدید", approve: "تأیید", reject: "رد",
    empty: "درخواستی نیست", approved: "تأیید شد", rejected: "رد شد"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function toast(msg, color) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid " + (color || "#35d68f") + "66;color:" + (color || "#35d68f") + ";padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function loadRequests() {
    var box = document.getElementById("zexRenewalList");
    if (!box) return;
    fetch("/api/renewal").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var list = (d && d.requests) || [];
      if (!list.length) {
        box.innerHTML = '<div style="color:#8892ab;font-size:12px;text-align:center;padding:14px">' + L.empty + '</div>';
        return;
      }
      box.innerHTML = list.map(function (r) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px;border:1px solid #212942;border-radius:10px;margin-bottom:8px;background:#131829">' +
          '<div style="flex:1"><b style="font-size:13px;color:#eef1f8">' + esc(r.username) + '</b>' +
          '<div style="font-size:11px;color:#8892ab;margin-top:3px">' + esc(r.planName) + ' (' + r.planDays + ' ' + (lang === "fa" ? "روز" : "days") + ' / ' + r.planTraffic + ' GB)</div></div>' +
          '<div style="display:flex;gap:6px">' +
          '<button data-approve="' + r.id + '" style="padding:6px 12px;font-size:11px;border:none;border-radius:8px;background:#f2b705;color:#1a1204;cursor:pointer">' + L.approve + '</button>' +
          '<button data-reject="' + r.id + '" style="padding:6px 12px;font-size:11px;border:none;border-radius:8px;background:#2a141a;border:1px solid #582430;color:#ff8fa0;cursor:pointer">' + L.reject + '</button>' +
          '</div></div>';
      }).join("");

      box.querySelectorAll("[data-approve]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-approve");
          fetch("/api/renewal/" + id + "/approve", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d.ok) {
                toast(L.approved, "#35d68f");
                setTimeout(function () { location.reload(); }, 600);
              } else {
                toast(d.error || "خطا", "#ff5c72");
              }
            });
        });
      });

      box.querySelectorAll("[data-reject]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-reject");
          fetch("/api/renewal/" + id + "/reject", { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d.ok) {
                toast(L.rejected, "#ff5c72");
                setTimeout(function () { location.reload(); }, 600);
              } else {
                toast(d.error || "خطا", "#ff5c72");
              }
            });
        });
      });
    }).catch(function () {});
  }

  function inject() {
    var tab = document.getElementById("users-tab");
    if (!tab || document.getElementById("zexRenewalCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexRenewalCard";
    card.innerHTML = '<div class="card-head"><h3>⏳ ' + L.renewals + '</h3></div><div id="zexRenewalList"></div>';
    tab.appendChild(card);
    loadRequests();
    setInterval(loadRequests, 10000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
