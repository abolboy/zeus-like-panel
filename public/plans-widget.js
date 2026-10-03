(function () {
  "use strict";
  if (window._zexPW) return;
  window._zexPW = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    plans: "Subscription Plans", add: "+ Add", del: "Delete", noPlan: "— No plan —",
    planField: "Ready Plan (optional)", namePh: "Plan name", daysPh: "Days", gbPh: "GB",
    added: "Plan added ✅", deleted: "Plan deleted ✅", days: "days"
  } : {
    plans: "پلن‌های اشتراک", add: "+ افزودن", del: "حذف", noPlan: "— بدون پلن —",
    planField: "پلن آماده (اختیاری)", namePh: "نام پلن (مثلاً ماهانه طلایی)", daysPh: "روز", gbPh: "گیگ",
    added: "پلن اضافه شد ✅", deleted: "پلن حذف شد ✅", days: "روز"
  };

  var plansCache = [];

  function toast(msg) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid #f2b70566;color:#f2b705;padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function loadPlans(cb) {
    fetch("/api/plans").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      plansCache = (d && d.plans) || [];
      renderList();
      refreshSelects();
      if (cb) cb();
    }).catch(function () {});
  }

  function renderList() {
    var box = document.getElementById("zexPlanList");
    if (!box) return;
    if (!plansCache.length) { box.innerHTML = '<div style="color:var(--muted,#8892ab);font-size:12px;text-align:center;padding:10px">—</div>'; return; }
    box.innerHTML = plansCache.map(function (p) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;border:1px solid var(--border,#212942);border-radius:10px;margin-bottom:8px;background:var(--panel-2,#131829)">' +
        '<b style="font-size:13px">💰 ' + p.name + '</b>' +
        '<span style="color:var(--muted,#8892ab);font-size:11px">' + p.days + " " + L.days + ' / ' + p.traffic + ' GB</span>' +
        '<button class="btn btn-danger-ghost" data-del="' + p.id + '" style="padding:5px 12px;font-size:11px">' + L.del + '</button></div>';
    }).join("");
    box.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        fetch("/api/plans/" + b.getAttribute("data-del"), { method: "DELETE" }).then(function (r) { return r.json(); })
          .then(function (d) { if (d.ok) { toast(L.deleted); loadPlans(); } });
      });
    });
  }

  function injectPlansCard() {
    var tab = document.getElementById("settings-tab");
    if (!tab || document.getElementById("zexPlansCard")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexPlansCard";
    card.innerHTML = '<div class="card-head"><h3>💰 ' + L.plans + '</h3></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<input id="zexPlanName" placeholder="' + L.namePh + '" style="flex:2;min-width:140px;padding:10px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:12px">' +
      '<input id="zexPlanDays" type="number" min="1" placeholder="' + L.daysPh + '" style="width:70px;padding:10px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:12px">' +
      '<input id="zexPlanTraffic" type="number" min="0" placeholder="' + L.gbPh + '" style="width:70px;padding:10px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:12px">' +
      '<button class="btn btn-gold" id="zexPlanAdd">' + L.add + '</button></div>' +
      '<div id="zexPlanList"></div>';
    tab.appendChild(card);
    document.getElementById("zexPlanAdd").addEventListener("click", function () {
      var name = document.getElementById("zexPlanName").value.trim();
      var days = Number(document.getElementById("zexPlanDays").value) || 0;
      var traffic = Number(document.getElementById("zexPlanTraffic").value) || 0;
      if (!name || days <= 0) { toast("❌"); return; }
      fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, days: days, traffic: traffic }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            document.getElementById("zexPlanName").value = "";
            document.getElementById("zexPlanDays").value = "";
            document.getElementById("zexPlanTraffic").value = "";
            toast(L.added);
            loadPlans();
          }
        });
    });
    loadPlans();
  }

  function fillModal(plan) {
    var m = document.querySelector(".modal");
    if (!m) return;
    var expInput = null, expSelect = null, trafficInput = null;
    m.querySelectorAll("input, select").forEach(function (el) {
      var ctx = (el.placeholder || "") + " " + ((el.closest(".field") && el.closest(".field").textContent) || "");
      var isExp = /انقضا|Expiry|expiry/.test(ctx);
      if (isExp && !expInput && el.tagName === "INPUT") expInput = el;
      else if (isExp && !expSelect && el.tagName === "SELECT") expSelect = el;
      else if (!trafficInput && el.tagName === "INPUT" && (el.type === "number" || /حجم|traffic|GB|گیگ/.test(ctx))) trafficInput = el;
    });
    var faDigits = String(plan.days).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[Number(d)]; });
    if (expInput) {
      var d = new Date(Date.now() + plan.days * 86400000);
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      if (expInput.type === "date") expInput.value = d.getFullYear() + "-" + mm + "-" + dd;
      else expInput.value = dd + "-" + mm + "-" + d.getFullYear();
      expInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (expSelect) {
      var opts = Array.prototype.slice.call(expSelect.options);
      var hit = opts.find(function (o) {
        var v = String(o.value), t = String(o.textContent);
        return v === String(plan.days) || t.indexOf(String(plan.days)) > -1 || t.indexOf(faDigits) > -1 || v.indexOf(faDigits) > -1;
      });
      if (!hit) {
        var d2 = new Date(Date.now() + plan.days * 86400000);
        var ds = String(d2.getDate()).padStart(2, "0") + "-" + String(d2.getMonth() + 1).padStart(2, "0") + "-" + d2.getFullYear();
        hit = opts.find(function (o) { return o.value === ds || String(o.textContent).indexOf(ds) > -1; });
      }
      if (hit) {
        expSelect.value = hit.value;
        expSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    if (trafficInput && plan.traffic > 0) trafficInput.value = plan.traffic;
  }

function refreshSelects() {
    document.querySelectorAll("#zexPlanSelect").forEach(function (sel) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">' + L.noPlan + '</option>';
      plansCache.forEach(function (p) {
        var op = document.createElement("option");
        op.value = p.id;
        op.textContent = p.name + " (" + p.days + " " + L.days + " / " + p.traffic + " GB)";
        sel.appendChild(op);
      });
      sel.value = cur;
    });
  }

  function injectPlanSelect() {
    document.querySelectorAll(".modal").forEach(function (m) {
      if (m.querySelector("#zexPlanField")) return;
      var head = m.querySelector("h3, h2");
      if (!head || !/افزودن کاربر|Add New User|کاربر جدید/.test(head.textContent)) return;
      var firstInput = m.querySelector("input");
      if (!firstInput) return;
      var wrap = document.createElement("div");
      wrap.id = "zexPlanField";
      wrap.style.cssText = "margin-top:10px";
      wrap.innerHTML = '<label style="font-size:12px;color:var(--muted,#8892ab);display:block;margin-bottom:6px">💰 ' + L.planField + '</label>' +
        '<select id="zexPlanSelect" style="width:100%;box-sizing:border-box;padding:11px;background:var(--panel-2,#131829);border:1px solid var(--border,#212942);border-radius:8px;color:var(--text,#eef1f8);font-size:13px"></select>';
      var field = firstInput.closest(".field");
      if (field && field.after) field.after(wrap);
      else if (firstInput.parentElement && firstInput.parentElement.after) firstInput.parentElement.after(wrap);
      wrap.querySelector("select").addEventListener("change", function () {
        var p = plansCache.find(function (x) { return x.id === this.value; }.bind(this));
        if (p) fillModal(p);
      });
      refreshSelects();
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    injectPlansCard();
    loadPlans();
    setInterval(function () { injectPlansCard(); injectPlanSelect(); }, 3000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
