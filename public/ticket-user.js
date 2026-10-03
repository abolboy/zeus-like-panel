(function () {
  "use strict";
  if (window._zexTU) return;
  window._zexTU = 1;

  var lang = localStorage.getItem("zex-lang") || "fa";
  var L = lang === "en" ? {
    support: "Support", placeholder: "Write your message...", send: "Send",
    you: "You", admin: "Admin", closed: "Ticket closed", sent: "Sent ✅"
  } : {
    support: "پشتیبانی", placeholder: "پیام خود را بنویسید...", send: "ارسال",
    you: "شما", admin: "مدیر", closed: "تیکت بسته شده", sent: "ارسال شد ✅"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function toast(msg) {
    var t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#131829;border:1px solid #35d68f66;color:#35d68f;padding:10px 18px;border-radius:999px;font-size:12.5px;z-index:9500";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  function inject() {
    if (document.getElementById("zexTicketCard")) return;
    var wrap = document.querySelector(".ud-wrap");
    if (!wrap) return;
    var c = document.createElement("div");
    c.id = "zexTicketCard";
    c.className = "ud-glass ud-cfg";
    c.innerHTML = '<p class="ud-title" style="font-size:14px;color:#eef1f8;font-weight:800">🎫 ' + L.support + '</p>' +
      '<div id="zexTicketThread" style="max-height:220px;overflow:auto;margin-bottom:10px;font-size:12.5px"></div>' +
      '<textarea id="zexTicketText" rows="3" placeholder="' + L.placeholder + '" style="width:100%;box-sizing:border-box;padding:11px;background:#0e1220;border:1px solid #212942;border-radius:10px;color:#eef1f8;font-size:13px;resize:vertical"></textarea>' +
      '<div style="margin-top:8px"><button class="ud-btn ud-gold" id="zexTicketSend">' + L.send + '</button></div>';
    wrap.appendChild(c);
    document.getElementById("zexTicketSend").addEventListener("click", sendMsg);
    loadThread();
  }

  function loadThread() {
    fetch("/api/tickets/mine").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var box = document.getElementById("zexTicketThread");
      if (!box) return;
      if (!d || !d.ticket || !d.ticket.messages.length) { box.innerHTML = '<div style="color:#8892ab">—</div>'; return; }
      box.innerHTML = d.ticket.messages.map(function (m) {
        var mine = m.from === "user";
        return '<div style="margin:6px 0;padding:8px 10px;border-radius:10px;max-width:85%;' +
          (mine ? 'background:#f2b70514;border:1px solid #f2b70533;margin-left:auto' : 'background:#131829;border:1px solid #212942') + '">' +
          '<b style="font-size:10px;color:' + (mine ? '#f2b705' : '#35d68f') + '">' + (mine ? L.you : L.admin) + '</b>' +
          '<div style="margin-top:3px;white-space:pre-wrap">' + esc(m.text) + '</div></div>';
      }).join("");
      if (d.ticket.status === "closed") box.innerHTML += '<div style="color:#8892ab;font-size:11px;margin-top:6px">🔒 ' + L.closed + '</div>';
    }).catch(function () {});
  }

  function sendMsg() {
    var ta = document.getElementById("zexTicketText");
    var text = ta.value.trim();
    if (!text) return;
    fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) { ta.value = ""; loadThread(); toast(L.sent); }
        else toast(d.error || "❌");
      })
      .catch(function () { toast("❌"); });
  }

  function init() { setInterval(inject, 3000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
