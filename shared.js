// Riempie locandina.html e og.html con i valori di CONFIG (da config.js).
(function () {
  var C = window.CONFIG;
  if (!C) { document.body.insertAdjacentHTML("afterbegin", "<p style='color:red;font:30px sans-serif'>config.js mancante: lancia npm run render</p>"); return; }
  var deadline = new Date(C.DEADLINE);
  function part(opts) { return new Intl.DateTimeFormat("it-IT", Object.assign({ timeZone: "Europe/Rome" }, opts)).format(deadline); }
  var fill = function (sel, val) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; }); };

  fill("[data-phone]", C.PHONE_DISPLAY);
  fill("[data-piva]", C.PIVA ? " · P.IVA " + C.PIVA : "");
  document.querySelectorAll("[data-tel]").forEach(function (a) { a.href = "tel:" + C.PHONE_TEL; });
  fill("[data-total]", C.SPOTS_TOTAL);
  var left = Math.min(C.SPOTS_TOTAL, Math.max(0, C.SPOTS_LEFT));
  document.querySelectorAll("[data-dots]").forEach(function (el) {
    var html = "";
    for (var i = 0; i < C.SPOTS_TOTAL; i++) html += '<i class="' + (i < left ? "free" : "") + '"></i>';
    el.innerHTML = html;
  });
  document.querySelectorAll("[data-left-text]").forEach(function (el) {
    el.innerHTML = left === 1 ? "Resta <b>1</b> posto" : "Restano <b>" + left + "</b> posti";
  });
  fill("[data-day]", part({ day: "numeric" }));
  fill("[data-month]", part({ month: "short" }).replace(".", "").toUpperCase());
  fill("[data-time]", part({ hour: "2-digit", minute: "2-digit" }));

  document.querySelectorAll(".wave").forEach(function (w) {
    var n = Number(w.getAttribute("data-bars")) || 60, html = "";
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1);
      var env = 0.35 + 0.65 * Math.sin(Math.PI * x);
      var h = Math.max(0.08, env * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37 + 1))));
      html += '<i style="height:' + (h * 100).toFixed(0) + "%" + (x > 0.62 ? ";opacity:.38" : "") + '"></i>';
    }
    w.innerHTML = html;
  });
})();
