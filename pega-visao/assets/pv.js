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

/* ============================================================
   "Pegar visão", literally. Everything below is built here, so the page
   still reads complete with JS off. Texts come from the app's ARB files.
   Maps and reports are illustrative: no real places, always labelled.
   ============================================================ */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pageLang = document.documentElement.lang.slice(0, 2).toLowerCase();

  var APP = {
    pt: { name: "PT", livre: "Circulação livre", atencao: "Atenção", guia: "Requer guia local", none: "Sem marcação aqui",
      r: ["Via bloqueada", "Evento na rua", "Ação policial"], gone: "Relato de exemplo: some sozinho",
      offline: "Os dados ficam no aparelho; o mapa precisa de internet.", stale: "Dados podem estar levemente desatualizados" },
    en: { name: "EN", livre: "Free circulation", atencao: "Caution", guia: "Local guide required", none: "Not marked here",
      r: ["Blocked road", "Street event", "Police action"], gone: "Sample report: clears on its own",
      offline: "Data stays on your device; the map needs internet.", stale: "Data may be slightly out of date" },
    es: { name: "ES", livre: "Circulación libre", atencao: "Atención", guia: "Requiere guía local", none: "Sin marca aquí",
      r: ["Vía bloqueada", "Evento en la calle", "Acción policial"], gone: "Reporte de ejemplo: desaparece solo",
      offline: "Los datos se guardan en el dispositivo; el mapa necesita internet.", stale: "Los datos pueden estar ligeramente desactualizados" },
    zh: { name: "中文", livre: "自由通行", atencao: "注意", guia: "需要当地向导", none: "此处未标记",
      r: ["道路封闭", "街头活动", "警方行动"], gone: "示例报告：会自动消失",
      offline: "数据保存在设备上；地图需要联网。", stale: "数据可能略有过时" }
  };
  var LANG_ATTR = { pt: "pt-BR", en: "en", es: "es", zh: "zh-CN" };
  var UI = {
    pt: { walk: "Arraste para andar pelo trajeto", signal: "Sem sinal", appLang: "Idioma do app", demo: "Trajeto e relatos fictícios.",
      mouse: "Mova o cursor para pegar visão.", touch: "Toque no mapa para pegar visão.", rhythm: "Trocar o ritmo", tools: "Teste o app" },
    en: { walk: "Drag to walk along the route", signal: "No signal", appLang: "App language", demo: "Route and reports are fictional.",
      mouse: "Move your cursor to get the picture.", touch: "Tap the map to get the picture.", rhythm: "Change the rhythm", tools: "Try the app" },
    es: { walk: "Arrastra para recorrer el trayecto", signal: "Sin señal", appLang: "Idioma de la app", demo: "Trayecto y reportes ficticios.",
      mouse: "Mueve el cursor para informarte.", touch: "Toca el mapa para informarte.", rhythm: "Cambiar el ritmo", tools: "Prueba la app" },
    zh: { walk: "拖动以沿路线行走", signal: "没有信号", appLang: "应用语言", demo: "路线和报告均为虚构。",
      mouse: "移动光标，先了解情况。", touch: "点击地图，先了解情况。", rhythm: "切换节奏", tools: "试用应用" }
  };
  var ui = UI[pageLang] || UI.pt;
  var pageApp = APP[pageLang] || APP.pt;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  /* The same three icons the legend uses, so word, icon and line always agree */
  function iconOf(zone) {
    var s = document.querySelector(".lg-" + zone + " .lg-icon svg");
    return s ? s.cloneNode(true) : document.createElementNS(NS, "svg");
  }

  /* ---------- hero: a lens over the night map ---------- */
  (function lens() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var noteText = document.querySelector(".map-note");
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* Fixed seed: same drawing on every visit and in every language */
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function blob(cx, cy, r) {
      var n = 8, pts = [], i;
      for (i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2, k = r * (0.72 + rnd() * 0.42);
        pts.push([cx + Math.cos(a) * k * 1.25, cy + Math.sin(a) * k]);
      }
      var d = "";
      for (i = 0; i < n; i++) {
        var p = pts[i], q = pts[(i + 1) % n];
        var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        d += (i === 0 ? "M" + ((pts[n - 1][0] + p[0]) / 2).toFixed(1) + " " + ((pts[n - 1][1] + p[1]) / 2).toFixed(1) : "") +
          "Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
      }
      return d + "Z";
    }
    var STREETS = [
      "M-20 180C240 120 420 260 700 210S1200 80 1620 160",
      "M-20 470C260 400 520 560 820 470S1280 360 1620 450",
      "M-20 760C300 690 560 800 860 730S1320 640 1620 720",
      "M220-20C180 200 320 380 260 560S300 800 280 920",
      "M640-20C700 170 580 340 640 520S720 760 660 920",
      "M1060-20C1000 200 1130 330 1080 540S1000 760 1050 920",
      "M1420-20C1480 180 1360 360 1430 560S1500 780 1440 920"
    ];
    function drawStreets(svg) {
      STREETS.forEach(function (d) { svgEl("path", { d: d, "class": "lens-rua" }, svg); });
    }

    var layer = el("div", "lens");
    layer.setAttribute("aria-hidden", "true");
    var attrs = { viewBox: "0 0 1600 900", preserveAspectRatio: "xMidYMid slice" };
    var base = svgEl("svg", attrs);
    base.setAttribute("class", "lens-base");
    drawStreets(base);
    var full = svgEl("svg", attrs);
    full.setAttribute("class", "lens-full");
    drawStreets(full);
    var PATTERN = ["livre", "atencao", "livre", "guia", "livre", "atencao", "livre", "livre"];
    var zones = [], c = 0;
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 6; col++) {
        var zone = PATTERN[c++ % PATTERN.length];
        var g = svgEl("g", { "class": "zone z-" + zone }, full);
        var path = svgEl("path", { d: blob(140 + col * 270 + rnd() * 70, 150 + row * 300 + rnd() * 60, 96 + rnd() * 30) }, g);
        zones.push({ zone: zone, path: path });
      }
    }
    var ring = el("div", "lens-ring");
    var tag = el("div", "lens-tag");
    tag.dataset.z = "";
    layer.appendChild(base);
    layer.appendChild(full);
    layer.appendChild(ring);
    hero.insertBefore(layer, hero.firstChild);
    tag.setAttribute("aria-hidden", "true");
    hero.appendChild(tag);

    var note = el("p", "lens-note", (noteText ? noteText.textContent + " " : "") + (fine ? ui.mouse : ui.touch));
    hero.appendChild(note);

    var W = 0, H = 0, R = 110, x = 0, y = 0, tx = 0, ty = 0, raf = null, last = 0, sweeping = false, shown = null;

    /* at rest the lens always shows "Circulação livre": the page opens calm,
       never on the strongest classification */
    function rest() {
      var wantX = W * (W >= 900 ? 0.55 : 0.76), wantY = W >= 900 ? H * 0.24 : R + 8;
      /* narrow screens show a slice of the map: slide it so a "livre" zone
         sits in the free corner, instead of the lens covering the text */
      if (W < 900) {
        var first = zones.filter(function (z) { return z.zone === "livre"; })[1].path.getBBox();
        var sc = Math.max(W / 1600, H / 900);
        var vx = first.x + first.width / 2 - 800 - (wantX - W / 2) / sc;
        var vy = first.y + first.height / 2 - 450 - (wantY - H / 2) / sc;
        var vb = vx.toFixed(1) + " " + vy.toFixed(1) + " 1600 900";
        base.setAttribute("viewBox", vb);
        full.setAttribute("viewBox", vb);
        tx = wantX; ty = wantY;
        return;
      }
      base.setAttribute("viewBox", "0 0 1600 900");
      full.setAttribute("viewBox", "0 0 1600 900");
      var ctm = full.getScreenCTM(), box = hero.getBoundingClientRect(), best = Infinity;
      tx = wantX; ty = wantY;
      if (!ctm) return;
      zones.forEach(function (z) {
        if (z.zone !== "livre") return;
        var b = z.path.getBBox();
        var sx = (b.x + b.width / 2) * ctm.a + ctm.e - box.left;
        var sy = (b.y + b.height / 2) * ctm.d + ctm.f - box.top;
        var d = (sx - wantX) * (sx - wantX) + (sy - wantY) * (sy - wantY);
        if (d < best) { best = d; tx = sx; ty = sy; }
      });
    }
    function measure() {
      W = hero.clientWidth; H = hero.clientHeight;
      R = Math.max(84, Math.min(140, W * 0.2));
      ring.style.width = ring.style.height = R * 2 + "px";
      ring.style.marginLeft = ring.style.marginTop = -R + "px";
    }
    function paint() {
      full.style.clipPath = "circle(" + R + "px at " + x.toFixed(1) + "px " + y.toFixed(1) + "px)";
      ring.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      tag.style.transform = "translate3d(" + x.toFixed(1) + "px," + (y - R + 14).toFixed(1) + "px,0) translateX(-50%)";
      var ctm = full.getScreenCTM();
      if (!ctm || !full.createSVGPoint) return;
      var box = hero.getBoundingClientRect();
      var pt = full.createSVGPoint();
      pt.x = box.left + x; pt.y = box.top + y;
      pt = pt.matrixTransform(ctm.inverse());
      var found = "";
      for (var i = 0; i < zones.length; i++) {
        if (zones[i].path.isPointInFill(pt)) { found = zones[i].zone; break; }
      }
      if (found !== shown) {
        shown = found;
        tag.textContent = found ? pageApp[found] : "";
        tag.dataset.z = found;
      }
    }
    function tick(now) {
      var dt = Math.min(48, now - last); last = now;
      /* critically damped follow: interruptible, no bounce */
      var f = reduce ? 1 : 1 - Math.exp(-dt / 90);
      x += (tx - x) * f; y += (ty - y) * f;
      paint();
      if (sweeping || Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function goTo(e) {
      var box = hero.getBoundingClientRect();
      sweeping = false;
      tx = e.clientX - box.left; ty = e.clientY - box.top;
      wake();
    }

    measure();
    if (reduce) { rest(); x = tx; y = ty; paint(); }
    else {
      /* the page's single orchestrated moment: the lens crosses the map once */
      var fromX = W * 0.08, fromY = H * 0.82, t0 = performance.now(), DUR = 2200;
      rest();
      var endX = tx, endY = ty;
      x = fromX; y = fromY;
      sweeping = true;
      var sweep = function (now) {
        if (!sweeping) return;
        var p = Math.min(1, (now - t0) / DUR);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        tx = fromX + (endX - fromX) * e;
        ty = fromY + (endY - fromY) * e - Math.sin(p * Math.PI) * H * 0.18;
        if (p < 1) requestAnimationFrame(sweep); else sweeping = false;
      };
      requestAnimationFrame(sweep);
      wake();
    }
    if (fine) hero.addEventListener("pointermove", goTo);
    /* tap, not drag: the hero must keep scrolling on a phone */
    hero.addEventListener("pointerup", function (e) {
      if (e.pointerType !== "mouse" && !e.target.closest("a,button")) goTo(e);
    });
    if (fine) hero.addEventListener("pointerleave", function () { rest(); wake(); });
    window.addEventListener("resize", function () { measure(); rest(); wake(); });
  })();

  /* ---------- the dancers: pick the rhythm ---------- */
  (function rhythm() {
    var dance = document.querySelector(".dance");
    var label = dance && dance.querySelector("[data-rhythm-name]");
    if (!label) return;
    var RHYTHMS = ["samba", "funk", "charme", "pagode", "bossa"];
    var names = JSON.parse(dance.getAttribute("data-names"));
    var btn = el("button", "dance-next", label.textContent);
    btn.type = "button";
    btn.setAttribute("aria-label", ui.rhythm);
    btn.addEventListener("click", function () {
      var next = RHYTHMS[(RHYTHMS.indexOf(dance.getAttribute("data-rhythm")) + 1) % RHYTHMS.length];
      dance.setAttribute("data-rhythm", next);
      btn.textContent = names[next];
    });
    /* the 20 s rotation keeps writing to `label`, so it stays and mirrors here */
    label.hidden = true;
    new MutationObserver(function () { btn.textContent = label.textContent; })
      .observe(label, { childList: true, characterData: true, subtree: true });
    label.parentNode.appendChild(btn);
  })();

  /* ---------- the map: walk a route, watch the classification change ---------- */
  (function simulator() {
    var map = document.querySelector(".map-svg");
    var figure = document.querySelector(".map-figure");
    var legend = document.querySelector(".legend");
    var noteEl = document.querySelector(".map-note");
    if (!map || !figure || !legend || !map.createSVGPoint) return;
    var screen = figure.querySelector(".screen");
    var app = pageApp, appKey = pageLang;

    var ROUTE = "M56 76C96 56 140 54 172 80S252 124 272 182S214 262 170 232S86 186 60 218S84 332 146 382";
    var VB = { w: 320, h: 560 };
    var group = svgEl("g", { "class": "sim" }, map);
    svgEl("path", { d: ROUTE, "class": "sim-route" }, group);
    var trail = svgEl("path", { d: ROUTE, "class": "sim-trail" }, group);
    var pinsG = svgEl("g", {}, group);
    var me = svgEl("g", { "class": "sim-me" }, group);
    svgEl("circle", { r: 13, "class": "sim-halo" }, me);
    svgEl("circle", { r: 7, "class": "sim-dot" }, me);
    var hit = svgEl("circle", { r: 26, "class": "sim-hit" }, me);

    var LEN = trail.getTotalLength();
    trail.style.strokeDasharray = LEN + " " + LEN;
    var SAMPLES = [];
    for (var s = 0; s <= 160; s++) SAMPLES.push(trail.getPointAtLength((s / 160) * LEN));

    var REPORTS = [{ t: 0.2 }, { t: 0.56 }, { t: 0.82 }].map(function (r, i) {
      var p = trail.getPointAtLength(r.t * LEN);
      var g = svgEl("g", { "class": "sim-pin", transform: "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")" }, pinsG);
      svgEl("circle", { r: 10 }, g);
      svgEl("path", { d: "M0-5v5M0 4v.4" }, g);
      return { t: r.t, i: i, armed: true, el: g };
    });

    /* overlays, in the language picked for the app */
    screen.classList.add("sim-screen");
    var status = el("div", "sim-status");
    status.setAttribute("role", "status");
    var statusIcon = el("span", "sim-status-icon");
    var statusText = el("span");
    status.appendChild(statusIcon);
    status.appendChild(statusText);
    var banner = el("div", "sim-banner");
    var toast = el("div", "sim-toast");
    var toastName = el("strong");
    var toastHint = el("span");
    var bar = el("span", "sim-bar");
    toast.appendChild(toastName);
    toast.appendChild(toastHint);
    toast.appendChild(bar);
    [status, banner, toast].forEach(function (n) { screen.appendChild(n); });

    /* the slider is the real, accessible control; dragging the dot drives it */
    var walk = el("label", "sim-walk");
    walk.appendChild(el("span", "", ui.walk));
    var range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = 1000; range.value = 0;
    walk.appendChild(range);
    figure.insertBefore(walk, noteEl);
    if (noteEl) noteEl.textContent += " " + ui.demo;

    var tools = el("div", "sim-tools");
    tools.setAttribute("role", "group");
    tools.setAttribute("aria-label", ui.tools);
    var sw = el("button", "sim-switch");
    sw.type = "button";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", "false");
    sw.appendChild(el("span", "sim-track"));
    sw.appendChild(el("span", "", ui.signal));
    tools.appendChild(sw);
    var langs = el("div", "sim-langs");
    langs.setAttribute("role", "group");
    langs.setAttribute("aria-label", ui.appLang);
    langs.appendChild(el("span", "sim-langs-label", ui.appLang));
    var chips = Object.keys(APP).map(function (k) {
      var b = el("button", "sim-chip", APP[k].name);
      b.type = "button";
      b.lang = LANG_ATTR[k];
      b.dataset.k = k;
      b.setAttribute("aria-pressed", String(k === appKey));
      langs.appendChild(b);
      return b;
    });
    tools.appendChild(langs);
    legend.insertBefore(tools, legend.firstChild);

    var t = 0, here = null, offline = false, touched = false, active = null, barAnim = null;
    var zonePaths = [].slice.call(map.querySelectorAll(".zone")).map(function (g) {
      return { zone: g.classList.contains("z-livre") ? "livre" : g.classList.contains("z-atencao") ? "atencao" : "guia", path: g.querySelector("path") };
    });
    var legendBtns = {};
    ["livre", "atencao", "guia"].forEach(function (z) { legendBtns[z] = document.querySelector(".lg-" + z); });

    function wordOf(z) { return z ? app[z] : app.none; }
    function renderStatus() {
      statusText.textContent = wordOf(here);
      status.dataset.z = here || "";
      statusIcon.textContent = "";
      if (here) statusIcon.appendChild(iconOf(here));
      range.setAttribute("aria-valuetext", wordOf(here));
    }
    function renderBanner() {
      banner.textContent = offline ? app.offline + " " + app.stale : "";
      banner.classList.toggle("is-on", offline);
    }
    function hideToast() {
      toast.classList.remove("is-on");
      if (active) active.el.classList.remove("is-on");
      active = null;
    }
    function renderToast() {
      if (!active) return;
      toastName.textContent = app.r[active.i];
      toastHint.textContent = app.gone;
    }
    function fire(r) {
      if (barAnim) barAnim.cancel();
      if (active && active !== r) active.el.classList.remove("is-on");
      active = r;
      r.el.classList.add("is-on");
      renderToast();
      toast.classList.add("is-on");
      /* the point of a report: it expires by itself, in front of you */
      barAnim = bar.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 6000, easing: "linear", fill: "forwards" });
      barAnim.onfinish = hideToast;
    }
    function camera(p) {
      var r = map.getBoundingClientRect();
      if (!r.width) return;
      var visible = VB.w * (r.height / r.width);
      if (visible >= VB.h - 1) { map.removeAttribute("viewBox"); map.setAttribute("viewBox", "0 0 " + VB.w + " " + VB.h); return; }
      var top = Math.max(0, Math.min(VB.h - visible, p.y - visible / 2));
      map.setAttribute("viewBox", "0 " + top.toFixed(1) + " " + VB.w + " " + visible.toFixed(1));
    }
    function setT(v) {
      t = Math.max(0, Math.min(1, v));
      var p = trail.getPointAtLength(t * LEN);
      me.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
      trail.style.strokeDashoffset = String(LEN * (1 - t));
      range.value = Math.round(t * 1000);
      camera(p);
      var pt = map.createSVGPoint();
      pt.x = p.x; pt.y = p.y;
      var found = null;
      for (var i = 0; i < zonePaths.length; i++) {
        if (zonePaths[i].path.isPointInFill(pt)) { found = zonePaths[i].zone; break; }
      }
      if (found !== here) {
        here = found;
        renderStatus();
        Object.keys(legendBtns).forEach(function (z) { legendBtns[z].classList.toggle("is-here", z === here); });
      }
      REPORTS.forEach(function (r) {
        var d = Math.abs(t - r.t);
        /* offline, reports are not current truth (invariant 6): none arrive */
        if (d < 0.025 && r.armed && !offline) { r.armed = false; fire(r); }
        else if (d > 0.07) r.armed = true;
      });
    }
    function userTouched() { touched = true; }

    range.addEventListener("input", function () { userTouched(); setT(range.value / 1000); });

    hit.addEventListener("pointerdown", function (e) {
      userTouched();
      hit.setPointerCapture(e.pointerId);
      me.classList.add("is-drag");
      e.preventDefault();
    });
    hit.addEventListener("pointermove", function (e) {
      if (!hit.hasPointerCapture || !hit.hasPointerCapture(e.pointerId)) return;
      var ctm = map.getScreenCTM();
      if (!ctm) return;
      var pt = map.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      pt = pt.matrixTransform(ctm.inverse());
      /* nearest point along the route, staying close to where the dot is, so
         the dot never jumps to another stretch where the route passes nearby */
      var best = t, bestD = Infinity;
      for (var i = 0; i < SAMPLES.length; i++) {
        var u = i / 160;
        if (Math.abs(u - t) > 0.18) continue;
        var dx = SAMPLES[i].x - pt.x, dy = SAMPLES[i].y - pt.y, d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = u; }
      }
      setT(best);
    });
    function endDrag() { me.classList.remove("is-drag"); }
    hit.addEventListener("pointerup", endDrag);
    hit.addEventListener("pointercancel", endDrag);

    sw.addEventListener("click", function () {
      offline = !offline;
      sw.setAttribute("aria-checked", String(offline));
      map.classList.toggle("is-offline", offline);
      if (offline) { if (barAnim) barAnim.cancel(); hideToast(); }
      renderBanner();
    });
    chips.forEach(function (b) {
      b.addEventListener("click", function () {
        appKey = b.dataset.k;
        app = APP[appKey];
        chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        [status, banner, toast].forEach(function (n) { n.lang = LANG_ATTR[appKey]; });
        renderStatus(); renderBanner(); renderToast();
      });
    });

    [status, banner, toast].forEach(function (n) { n.lang = LANG_ATTR[appKey]; });
    setT(0);
    renderStatus();
    window.addEventListener("resize", function () { setT(t); });

    /* phones: the legend sits below the map, so a tap brings the map back into view */
    Object.keys(legendBtns).forEach(function (z) {
      legendBtns[z].addEventListener("click", function () {
        var r = screen.getBoundingClientRect();
        if (window.innerWidth < 900 && r.top < 120) figure.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      });
    });

    /* once, on arrival: the dot walks a little, so it is clear it can be moved */
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now(), DUR = 1500, END = 0.15;
        var step = function (now) {
          if (touched) return;
          var p = Math.min(1, (now - t0) / DUR);
          setT(END * (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.5 });
      io.observe(figure);
    }
  })();
})();
