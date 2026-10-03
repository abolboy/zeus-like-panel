(function () {
  if (window._spaNav) return;
  window._spaNav = 1;

  function preserveEffects() {
    var keep = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      var cls = String(el.className || "");
      if (/snow|flake|zfx|effect|fragment/i.test(cls)) keep.push(el);
    });
    return keep;
  }

  window.SPA_NAV = function (url) {
    document.body.style.transition = "opacity .25s ease";
    document.body.style.opacity = "0";

    fetch(url, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");

        // ۱) استایل‌های جدید head را ادغام کن
        Array.prototype.forEach.call(doc.querySelectorAll('link[rel="stylesheet"], style'), function (n) {
          var key = n.getAttribute("href") || n.textContent.slice(0, 60);
          var exists = Array.prototype.some.call(document.querySelectorAll('link[rel="stylesheet"], style'), function (m) {
            return (m.getAttribute("href") || m.textContent.slice(0, 60)) === key;
          });
          if (!exists) document.head.appendChild(n.cloneNode(true));
        });

        // ۲) حفظ افکت‌ها (برف) و تعویض بدنه
        var kept = preserveEffects();
        document.body.innerHTML = doc.body.innerHTML;
        kept.forEach(function (el) { document.body.appendChild(el); });

        // ۳) آدرس جدید
        history.pushState({ spa: 1 }, "", url);

        // ۴) پاک‌کردن گاردها تا اسکریپت‌های صفحه مقصد دوباره init شوند
        Object.keys(window).forEach(function (k) {
          if (/^_(z|zex|spa|admin)/i.test(k)) { try { delete window[k]; } catch (e) {} }
        });

        // ۵) اجرای همه اسکریپت‌ها به ترتیب (inline + خارجی)
        var queue = [];
        Array.prototype.forEach.call(doc.querySelectorAll("script"), function (s) {
          queue.push({ src: s.getAttribute("src"), text: s.textContent });
        });

        function finish() {
          window._spaNavSwapped = true;
          document.body.style.opacity = "1";
          window.scrollTo(0, 0);
          setTimeout(function () {
            try { document.dispatchEvent(new Event("DOMContentLoaded")); } catch (e) {}
            try { window.dispatchEvent(new Event("load")); } catch (e) {}
          }, 50);
        }

        function runNext() {
          if (!queue.length) { finish(); return; }
          var item = queue.shift();
          if (item.src) {
            var el = document.createElement("script");
            el.src = item.src;
            el.onload = runNext;
            el.onerror = runNext;
            document.body.appendChild(el);
          } else {
            var el2 = document.createElement("script");
            el2.textContent = item.text;
            document.body.appendChild(el2);
            runNext();
          }
        }
        runNext();
      })
      .catch(function () {
        // fallback امن: ریدایرکت معمولی
        document.body.style.opacity = "1";
        location.href = url;
      });
  };

  window.addEventListener("popstate", function () {
    if (window._spaNavSwapped) location.href = location.pathname + location.search;
  });
})();
