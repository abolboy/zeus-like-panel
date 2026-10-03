(function () {
  "use strict";
  if (window._zexBO) return;
  window._zexBO = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    selected: "selected", activate: "Activate", deactivate: "Deactivate",
    delete: "Delete", confirmDelete: "Delete {n} user(s)?", cancel: "Cancel",
    all: "Select All", none: "Deselect All"
  } : {
    selected: "انتخاب شده", activate: "فعال‌سازی", deactivate: "غیرفعال‌سازی",
    delete: "حذف", confirmDelete: "حذف {n} کاربر؟", cancel: "انصراف",
    all: "انتخاب همه", none: "لغو انتخاب"
  };

  var selected = new Set();

  function toast(msg, color) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid " + (color || "#f2b705") + "66;color:" + (color || "#f2b705") + ";padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function renderBar() {
    var list = document.getElementById("usersList");
    if (!list) return;
    var bar = document.getElementById("zexBulkBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "zexBulkBar";
      bar.style.cssText = "position:sticky;top:0;z-index:100;display:none;gap:8px;flex-wrap:wrap;padding:12px;background:rgba(19,24,41,.95);border:1px solid #212942;border-radius:12px;margin-bottom:14px;backdrop-filter:blur(10px)";
      list.parentElement.insertBefore(bar, list);
    }
    if (selected.size === 0) {
      bar.style.display = "none";
      return;
    }
    bar.style.display = "flex";
    bar.innerHTML =
      '<b style="color:#f2b705;font-size:13px">' + selected.size + ' ' + L.selected + '</b>' +
      '<button class="ud-btn ud-ghost" id="zexBulkActivate" style="border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;background:#35d68f1a;border:1px solid #35d68f44;color:#35d68f;cursor:pointer">✅ ' + L.activate + '</button>' +
      '<button class="ud-btn ud-ghost" id="zexBulkDeactivate" style="border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;background:#f59e0b1a;border:1px solid #f59e0b44;color:#f59e0b;cursor:pointer">⏸ ' + L.deactivate + '</button>' +
      '<button class="ud-btn ud-ghost" id="zexBulkDelete" style="border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;background:#ff5c721a;border:1px solid #ff5c7244;color:#ff5c72;cursor:pointer">🗑 ' + L.delete + '</button>' +
      '<button class="ud-btn ud-ghost" id="zexBulkNone" style="border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;background:#131829;border:1px solid #212942;color:#8892ab;cursor:pointer;margin-left:auto">✕ ' + L.none + '</button>';

    document.getElementById("zexBulkActivate").addEventListener("click", function () { doBulk("activate"); });
    document.getElementById("zexBulkDeactivate").addEventListener("click", function () { doBulk("deactivate"); });
    document.getElementById("zexBulkDelete").addEventListener("click", function () {
      if (confirm(L.confirmDelete.replace("{n}", selected.size))) doBulk("delete");
    });
    document.getElementById("zexBulkNone").addEventListener("click", function () {
      selected.clear();
      updateCheckboxes();
      renderBar();
    });
  }

  function doBulk(action) {
    var btn = document.getElementById("zexBulk" + action.charAt(0).toUpperCase() + action.slice(1));
    if (btn) { btn.disabled = true; btn.textContent = "⏳"; }
    fetch("/api/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, usernames: Array.from(selected) })
    }).then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) {
        toast((action === "delete" ? " " : "✅ ") + d.changed + " کاربر", action === "delete" ? "#ff5c72" : "#35d68f");
        selected.clear();
        setTimeout(function () { location.reload(); }, 600);
      } else {
        if (btn) { btn.disabled = false; }
        toast(d.error || "خطا", "#ff5c72");
      }
    })
    .catch(function () {
      if (btn) { btn.disabled = false; }
      toast("خطای ارتباط", "#ff5c72");
    });
  }

  function updateCheckboxes() {
    document.querySelectorAll("[data-zex-checkbox]").forEach(function (cb) {
      var name = cb.getAttribute("data-zex-checkbox");
      cb.checked = selected.has(name);
    });
  }

  function injectCheckboxes() {
    document.querySelectorAll(".user-card").forEach(function (card) {
      if (card.querySelector("[data-zex-checkbox]")) return;
      var nameEl = card.querySelector(".user-name");
      if (!nameEl) return;
      var name = nameEl.textContent.trim();
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.setAttribute("data-zex-checkbox", name);
      cb.style.cssText = "position:absolute;top:12px;left:12px;width:20px;height:20px;cursor:pointer;z-index:10";
      cb.checked = selected.has(name);
      cb.addEventListener("change", function () {
        if (cb.checked) selected.add(name);
        else selected.delete(name);
        renderBar();
      });
      card.style.position = "relative";
      card.insertBefore(cb, card.firstChild);
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    injectCheckboxes();
    renderBar();
    setInterval(function () { injectCheckboxes(); renderBar(); }, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
