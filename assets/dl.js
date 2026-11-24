/* OPTES «نزّل لجهازك»: picks the right download for this device (site-chrome/dl-android-20261107, 2026-11-07).
   Static same-origin file (no inline script, no network, no storage). The links themselves live in the page:
   every download anchor carries data-dl="<key>" and data-dl-label; this file only chooses one of them.
   Keys: android-arm64, android-armv7, windows, linux-deb, linux-appimage, linux-arm64.
   Never blocks: the manual list is always visible; Android starts on 64-bit and the high-entropy client hint
   (Chrome) can only move it to 32-bit when it reports bitness "32". */
(function () {
  "use strict";
  var autos = document.querySelectorAll("[data-dl-auto]");
  if (!autos.length) return;
  var nav = window.navigator || {}, ua = nav.userAgent || "", uad = nav.userAgentData;
  var plat = uad && uad.platform ? String(uad.platform).toLowerCase() : "";

  function os() {
    if (plat === "android" || /android/i.test(ua)) return "android";
    if (plat === "ios" || /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && nav.maxTouchPoints > 1)) return "apple";
    if (plat === "windows" || /windows nt/i.test(ua)) return "windows";
    if (plat === "macos" || /mac os x|macintosh/i.test(ua)) return "apple";
    if (plat === "chrome os" || /\bcros\b/i.test(ua)) return "";
    if (plat === "linux" || /linux|x11/i.test(ua)) return "linux";
    return "";
  }

  var current = null;
  function choose(key) {
    var a = document.querySelector('a[data-dl="' + key + '"]');
    if (!a) return;  // e.g. ARM Linux on a page without the ARM .deb: the manual list stays the answer
    if (current) current.classList.remove("dl-match");
    current = a;
    a.classList.add("dl-match");
    for (var i = 0; i < autos.length; i++) {
      var box = autos[i], btn = box.querySelector("a.dl-auto"), sub = box.querySelector("[data-dl-picked]");
      if (!btn) continue;
      btn.href = a.href;
      if (sub) sub.textContent = a.getAttribute("data-dl-label") || "";
      // on a home the Windows button is already the first button: the extra one only appears for other systems
      box.hidden = box.getAttribute("data-dl-auto") === "home" && key === "windows";
    }
  }

  function showApple() {
    var notes = document.querySelectorAll("[data-dl-apple]");
    for (var i = 0; i < notes.length; i++) notes[i].hidden = false;
    for (var j = 0; j < autos.length; j++) autos[j].hidden = true;
  }

  var kind = os();
  if (kind === "apple") { showApple(); return; }
  if (kind === "windows") { choose("windows"); return; }
  if (kind === "linux") {
    choose(/aarch64|arm64/i.test(ua) ? "linux-arm64" : "linux-deb");
  } else if (kind === "android") {
    // 32-bit only when the browser says so; everything else (and "unknown") gets 64-bit
    choose(/\b(armv7l|armv8l|armeabi)\b/i.test(ua) && !/aarch64|arm64/i.test(ua) ? "android-armv7" : "android-arm64");
  } else {
    return;
  }
  if (uad && typeof uad.getHighEntropyValues === "function") {
    try {
      uad.getHighEntropyValues(["bitness", "architecture", "platform"]).then(function (v) {
        if (!v) return;
        if (kind === "android" && v.bitness === "32") choose("android-armv7");
        if (kind === "linux" && v.architecture === "arm" && v.bitness !== "32") choose("linux-arm64");
      }, function () {});
    } catch (e) { /* keep the first choice */ }
  }
})();
