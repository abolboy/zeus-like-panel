(function () {
  "use strict";
  if (window._zexML) return;
  window._zexML = 1;

  // اضافه کردن کلاس login-body به body
  if (document.querySelector('input[type="password"]')) { document.body.classList.add("login-body"); }

  // افکت Ripple برای دکمه ورود
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".login-btn");
    if (!btn) return;

    var ripple = document.createElement("span");
    ripple.className = "ripple";
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var x = e.clientX - rect.left - size / 2;
    var y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    btn.appendChild(ripple);

    setTimeout(function () { ripple.remove(); }, 600);
  });

  // انیمیشن ورود فیلدها
  var inputs = document.querySelectorAll(".input-group");
  inputs.forEach(function (input, index) {
    input.style.opacity = "0";
    input.style.transform = "translateY(20px)";
    input.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    setTimeout(function () {
      input.style.opacity = "1";
      input.style.transform = "translateY(0)";
    }, 300 + index * 150);
  });

  console.log("✅ Mobile Login Effects Active");
})();
