/* /research/ (site-chrome/research-20261122): binary codeword field, count-up numbers, card light-up.
   Same-origin, no inline script, no network. Under prefers-reduced-motion everything is drawn once, final values only. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in window;

  /* 1. the hero field: real codewords (data-words on the canvas), rows light up as a slow scan passes */
  function field(cv) {
    var words = (cv.getAttribute("data-words") || "").split(" ").filter(Boolean);
    if (!words.length || !cv.getContext) return;
    var ctx = cv.getContext("2d"), rows = [], W = 0, H = 0, dpr = 1, fs = 14, lh = 22, run = false, raf = 0, t0 = 0;
    function prerender(word, lit) {
      var c = document.createElement("canvas"), x = c.getContext("2d"), cw = fs * 0.62, w = Math.ceil(word.length * cw * 1.18);
      c.width = Math.ceil(w * dpr); c.height = Math.ceil(lh * dpr);
      x.scale(dpr, dpr);
      x.font = "500 " + fs + "px " + "Consolas, 'Cascadia Mono', Menlo, monospace";
      x.textBaseline = "middle";
      for (var i = 0; i < word.length; i++) {
        var one = word.charAt(i) === "1";
        x.fillStyle = one ? (lit ? "rgba(255,255,255,1)" : "rgba(220,224,230,.34)") : (lit ? "rgba(200,204,210,.34)" : "rgba(160,164,170,.12)");
        x.fillText(word.charAt(i), i * cw * 1.18, lh / 2);
      }
      return { c: c, w: w };
    }
    function layout() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      fs = W < 600 ? 11 : 14; lh = Math.round(fs * 1.6);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = Math.ceil(H / lh) + 1, cache = {};
      rows = [];
      for (var i = 0; i < n; i++) {
        var wd = words[i % words.length];
        if (!cache[wd]) cache[wd] = [prerender(wd, false), prerender(wd, true)];
        rows.push({ dim: cache[wd][0], lit: cache[wd][1], ph: (i * 2.399) % 6.283 });
      }
    }
    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var scan = ((t / 90) % (H + 240)) - 120;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i], y = i * lh, cols = Math.ceil(W / r.dim.w) + 1, off = (i % 2 ? -r.dim.w / 2 : 0);
        var d = Math.abs(y + lh / 2 - scan), a = Math.max(0, 1 - d / 110);
        var tw = Math.pow(Math.max(0, Math.sin(t / 1700 + r.ph)), 18) * 0.85;
        var lit = Math.min(1, a * a + tw);
        for (var k = 0; k < cols; k++) {
          var x = off + k * r.dim.w;
          ctx.globalAlpha = 1;
          ctx.drawImage(r.dim.c, x, y, r.dim.w, lh);
          if (lit > 0.02) { ctx.globalAlpha = lit; ctx.drawImage(r.lit.c, x, y, r.dim.w, lh); }
        }
      }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!run) return;
      if (!t0) t0 = now;
      if (now - (frame.last || 0) > 33) { frame.last = now; draw(now - t0 + 4000); }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!run && !reduce && !document.hidden) { run = true; raf = requestAnimationFrame(frame); } }
    function stop() { run = false; cancelAnimationFrame(raf); }
    layout(); draw(6000);
    if (reduce) return;
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { layout(); draw(6000); }, 150); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (cv.rsVisible !== false) start(); });
    if (IO) {
      new IntersectionObserver(function (es) { cv.rsVisible = es[0].isIntersecting; if (es[0].isIntersecting) start(); else stop(); }).observe(cv);
    } else start();
  }

  /* 2. count-up: the HTML carries the final value; with motion on, it restarts from data-from when it comes into view */
  function count(el) {
    var from = parseInt(el.getAttribute("data-from"), 10), to = parseInt(el.getAttribute("data-to"), 10);
    if (isNaN(from) || isNaN(to) || from === to) return;
    var t0 = 0, dur = Math.min(2400, 900 + Math.log(Math.abs(to - from) + 1) * 220);
    el.textContent = String(from);
    function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(to);
    }
    requestAnimationFrame(step);
  }

  function init() {
    var cv = document.querySelector("canvas.rs-field");
    if (cv) field(cv);
    if (reduce || !IO) return;
    var nums = [].slice.call(document.querySelectorAll(".rs [data-to]"));
    nums.forEach(function (el) { if (el.getAttribute("data-from") !== null) el.textContent = el.getAttribute("data-from"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.hasAttribute("data-to")) count(e.target);
        else e.target.classList.add("rs-lit");
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    nums.forEach(function (el) { io.observe(el); });
    [].forEach.call(document.querySelectorAll(".rs-card"), function (c) { io.observe(c); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
