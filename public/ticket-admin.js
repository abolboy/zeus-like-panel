(function () {
  "use strict";
  if (window._zexTA) return;
  window._zexTA = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    tickets: "Support Tickets", open: "Open", closed: "Closed", reply: "Reply",
    closeT: "Close Ticket", refresh: "Refresh", empty: "No tickets"
  } : {
    tickets: "تیکت‌های پشتیبانی", open: "باز", closed: "بسته", reply: "پاسخ",
    closeT: "بستن تیکت", refresh: "بروزرسانی", empty: "تیکتی نیست"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function inject() {
    var tab = document.getElementById("settings-tab");
    if (!tab || document.getElementById("zexTicketCardAdmin")) return;
    var card = document.createElement("div");
    card.className = "card";
    card.id = "zexTicketCardAdmin";
    card.innerHTML = '<div class="card-head"><h3>🎫 ' + L.tickets + '</h3></div>' +
      '<div style="margin-bottom:10px"><button class="btn btn-gold" id="zexTkRefresh">' + L.refresh + '</button></div>' +
      '<div id="zexTkList" style="max-height:340px;overflow-y:auto"></div>';
    tab.appendChild(card);
    document.getElementById("zexTkRefresh").addEventListener("click", loadList);
    loadList();
  }

  function loadList() {
    var box = document.getElementById("zexTkList");
    if (!box) return;
    fetch("/api/tickets").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.tickets.length) { box.innerHTML = '<div style="color:var(--muted,#8892ab);padding:14px;text-align:center">' + L.empty + '</div>'; return; }
      box.innerHTML = d.tickets.map(function (t) {
        var st = t.status === "open"
          ? '<span style="color:#35d68f;background:#35d68f1a;border:1px solid #35d68f44;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700">' + L.open + '</span>'
          : '<span style="color:#8892ab;background:#8892ab1a;border:1px solid #8892ab44;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700">' + L.closed + '</span>';
        var last = t.last ? esc(String(t.last.text).slice(0, 60)) : "—";
        return '<div data-tk="' + t.id + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px;border:1px solid var(--border,#212942);border-radius:10px;margin-bottom:8px;cursor:pointer;background:var(--panel-2,#131829)">' +
          '<div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(t.username) + '</b> ' + st +
          '<div style="color:var(--muted,#8892ab);font-size:11px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + last + '</div></div>' +
          '<span style="color:var(--muted,#8892ab);font-size:10px">' + (t.count || 0) + ' 💬</span></div>';
      }).join("");
      box.querySelectorAll("[data-tk]").forEach(function (row) {
        row.addEventListener("click", function () { openModal(row.getAttribute("data-tk")); });
      });
    }).catch(function () {});
  }

  function openModal(id) {
    fetch("/api/tickets/" + id).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.ticket) return;
      var t = d.ticket;
      var m = document.createElement("div");
      m.className = "modal show";
      m.innerHTML = '<div class="modal-card" style="max-width:420px"><h3>🎫 ' + esc(t.username) + '</h3>' +
        '<div style="max-height:260px;overflow:auto;margin:12px 0">' +
        t.messages.map(function (msg) {
          var isAdmin = msg.from === "admin";
          return '<div style="margin:6px 0;padding:8px 10px;border-radius:10px;max-width:85%;' +
            (isAdmin ? 'background:#35d68f14;border:1px solid #35d68f33;margin-left:auto' : 'background:#131829;border:1px solid #212942') + '">' +
            '<b style="font-size:10px;color:' + (isAdmin ? '#35d68f' : '#f2b705') + '">' + (isAdmin ? L.reply : t.username) + '</b>' +
            '<div style="margin-top:3px;white-space:pre-wrap;font-size:12.5px">' + esc(msg.text) + '</div></div>';
        }).join("") + '</div>' +
        '<textarea id="zexTkReply" rows="3" placeholder="' + L.reply + '..." style="width:100%;box-sizing:border-box;padding:10px;background:#131829;border:1px solid #212942;border-radius:8px;color:#eef1f8;font-size:13px"></textarea>' +
        '<div class="modal-actions" style="margin-top:10px">' +
        '<button class="btn btn-danger-ghost" id="zexTkClose">' + L.closeT + '</button>' +
        '<button class="btn btn-ghost" id="zexTkCancel">✕</button>' +
        '<button class="btn btn-gold" id="zexTkSend">' + L.reply + '</button></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", function (e) { if (e.target === m) m.remove(); });
      document.getElementById("zexTkCancel").addEventListener("click", function () { m.remove(); });
      document.getElementById("zexTkSend").addEventListener("click", function () {
        var text = document.getElementById("zexTkReply").value.trim();
        if (!text) return;
        fetch("/api/tickets/" + id + "/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) })
          .then(function (r) { return r.json(); })
          .then(function (res) { if (res.ok) { m.remove(); openModal(id); loadList(); } });
      });
      document.getElementById("zexTkClose").addEventListener("click", function () {
        fetch("/api/tickets/" + id + "/close", { method: "POST" }).then(function () { m.remove(); loadList(); });
      });
    });
  }

  function init() {
    if (!document.getElementById("usersList")) return;
    inject();
    setInterval(function () { inject(); }, 5000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
