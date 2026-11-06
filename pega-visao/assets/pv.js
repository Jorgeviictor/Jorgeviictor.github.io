(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- entrance on scroll ---------- */
  var rv = document.querySelectorAll(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    rv.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---------- legend: picking a classification isolates it on the map ---------- */
  var map = document.querySelector(".map-svg");
  var legendBtns = document.querySelectorAll(".lg");
  legendBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") === "true";
      legendBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      if (on) {
        map.removeAttribute("data-filter");
      } else {
        btn.setAttribute("aria-pressed", "true");
        map.setAttribute("data-filter", btn.getAttribute("data-zone"));
      }
    });
  });

  /* ---------- dancers: as in the app, the rhythm changes every 20 s ---------- */
  var dance = document.querySelector(".dance");
  if (dance) {
    var names = JSON.parse(dance.getAttribute("data-names"));
    var RHYTHMS = ["samba", "funk", "charme", "pagode", "bossa"];
    var label = dance.querySelector("[data-rhythm-name]");
    var toggle = dance.querySelector(".dance-toggle");
    var idx = 0, timer = null, userPaused = false, onScreen = true;

    var show = function (i) {
      idx = i;
      dance.setAttribute("data-rhythm", RHYTHMS[i]);
      label.textContent = names[RHYTHMS[i]];
    };
    var sync = function () {
      var run = !userPaused && onScreen && !reduceMotion;
      dance.classList.toggle("is-paused", !run);
      if (run && !timer) {
        timer = setInterval(function () { show((idx + 1) % RHYTHMS.length); }, 20000);
      } else if (!run && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    show(0);
    toggle.addEventListener("click", function () {
      userPaused = !userPaused;
      toggle.setAttribute("aria-pressed", String(userPaused));
      sync();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }).observe(dance);
    }
    sync();
  }

  /* ---------- language: suggest, never redirect ---------- */
  var KEY = "pv-lang-choice";
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private window */ } }

  document.querySelectorAll(".langs a").forEach(function (a) {
    a.addEventListener("click", function () { write(a.getAttribute("hreflang")); });
  });

  var HINTS = {
    pt: { text: "Esta página também está em português.", link: "Ver em português", href: "/pega-visao/", close: "Fechar" },
    en: { text: "This page is also available in English.", link: "View in English", href: "/pega-visao/en/", close: "Close" },
    es: { text: "Esta página también está en español.", link: "Ver en español", href: "/pega-visao/es/", close: "Cerrar" },
    zh: { text: "本页面也有简体中文版本。", link: "查看中文版", href: "/pega-visao/zh/", close: "关闭" }
  };
  var page = document.documentElement.lang.slice(0, 2).toLowerCase();
  var wanted = (navigator.language || "").slice(0, 2).toLowerCase();
  if (HINTS[wanted] && wanted !== page && !read()) {
    var h = HINTS[wanted];
    var bar = document.createElement("div");
    bar.className = "lang-hint";
    bar.lang = wanted;
    var wrap = document.createElement("div");
    wrap.className = "wrap";
    var msg = document.createElement("span");
    msg.textContent = h.text + " ";
    var go = document.createElement("a");
    go.href = h.href;
    go.textContent = h.link;
    go.addEventListener("click", function () { write(wanted); });
    msg.appendChild(go);
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", h.close);
    close.textContent = "×";
    close.addEventListener("click", function () { write(page); bar.remove(); });
    wrap.appendChild(msg);
    wrap.appendChild(close);
    bar.appendChild(wrap);
    document.body.insertBefore(bar, document.querySelector(".topbar"));
  }
})();
