/* ============================================================
   TEVOX — Aviso de cookies (consentimento LGPD)
   Nada do Google Analytics é carregado antes do "Aceitar":
   o gtag.js só é inserido na página depois do consentimento.
   Guia ANPD "Cookies e proteção de dados pessoais" (2022).
   ============================================================ */
(function () {
  "use strict";

  var GA_ID = "G-VL9RES16C8";
  var STORAGE_KEY = "tevox-consentimento";
  var VERSION = 1; // aumente quando mudar a finalidade/ferramentas: o aviso volta a aparecer

  var TEXTS = {
    pt: {
      title: "Cookies neste site",
      body: "Usamos cookies do Google Analytics para medir, de forma agregada, as visitas ao site, mas só se você permitir. Sem a sua permissão, nenhum cookie de medição é gravado e o site funciona normalmente.",
      details: "Ver detalhes",
      necessary: "Necessário (sempre ativo): guardamos no seu navegador apenas a sua escolha sobre cookies, com a data, para não perguntar de novo.",
      analytics: "Medição (opcional): Google Analytics, do Google LLC (Estados Unidos). Cookies _ga e _ga_VL9RES16C8, que expiram em até 2 anos. Finalidade: contar visitas e entender quais páginas são mais usadas.",
      change: "Você pode mudar a escolha quando quiser em “Preferências de cookies”, no rodapé.",
      policy: "Política de Privacidade (cookies)",
      accept: "Aceitar",
      reject: "Recusar",
      footer: "Preferências de cookies",
      current: { granted: "Escolha atual: aceito.", denied: "Escolha atual: recusado." }
    },
    en: {
      title: "Cookies on this website",
      body: "We use Google Analytics cookies to measure visits to the website in aggregate, but only if you allow it. Without your permission, no measurement cookie is set and the website works normally.",
      details: "See details",
      necessary: "Necessary (always on): we only store your cookie choice in your browser, with the date, so we don't ask again.",
      analytics: "Measurement (optional): Google Analytics, by Google LLC (United States). Cookies _ga and _ga_VL9RES16C8, which expire within 2 years. Purpose: counting visits and understanding which pages are used most.",
      change: "You can change your choice at any time under “Cookie preferences” in the footer.",
      policy: "Privacy Policy (cookies)",
      accept: "Accept",
      reject: "Reject",
      footer: "Cookie preferences",
      current: { granted: "Current choice: accepted.", denied: "Current choice: rejected." }
    },
    es: {
      title: "Cookies en este sitio",
      body: "Usamos cookies de Google Analytics para medir de forma agregada las visitas al sitio, pero solo si lo permites. Sin tu permiso, no se guarda ninguna cookie de medición y el sitio funciona con normalidad.",
      details: "Ver detalles",
      necessary: "Necesario (siempre activo): solo guardamos en tu navegador tu elección sobre cookies, con la fecha, para no volver a preguntar.",
      analytics: "Medición (opcional): Google Analytics, de Google LLC (Estados Unidos). Cookies _ga y _ga_VL9RES16C8, que caducan en un máximo de 2 años. Finalidad: contar visitas y entender qué páginas se usan más.",
      change: "Puedes cambiar tu elección cuando quieras en “Preferencias de cookies”, en el pie de página.",
      policy: "Política de Privacidad (cookies)",
      accept: "Aceptar",
      reject: "Rechazar",
      footer: "Preferencias de cookies",
      current: { granted: "Elección actual: aceptado.", denied: "Elección actual: rechazado." }
    },
    zh: {
      title: "本网站的 Cookie",
      body: "我们使用 Google Analytics 的 Cookie 以汇总方式统计网站访问量，但仅在您允许时使用。未经您的许可，不会写入任何统计类 Cookie，网站仍可正常使用。",
      details: "查看详情",
      necessary: "必要（始终启用）：我们只在您的浏览器中保存您对 Cookie 的选择及日期，以免再次询问。",
      analytics: "统计（可选）：Google Analytics，由 Google LLC（美国）提供。Cookie 名称为 _ga 和 _ga_VL9RES16C8，最长 2 年后过期。目的：统计访问量，了解哪些页面使用最多。",
      change: "您可以随时通过页脚的“Cookie 偏好设置”更改选择。",
      policy: "隐私政策（Cookie）",
      accept: "接受",
      reject: "拒绝",
      footer: "Cookie 偏好设置",
      current: { granted: "当前选择：已接受。", denied: "当前选择：已拒绝。" }
    }
  };

  var PV_POLICY = {
    pt: "/pega-visao/privacidade#cookies",
    en: "/pega-visao/en/privacy#cookies",
    es: "/pega-visao/es/privacidad#cookies",
    zh: "/pega-visao/zh/privacy#cookies"
  };

  var lang = (document.documentElement.getAttribute("lang") || "pt").slice(0, 2).toLowerCase();
  if (!TEXTS[lang]) lang = "pt";
  var t = TEXTS[lang];
  var isPegaVisao = /^\/pega-visao(\/|$)/.test(location.pathname);
  var policyHref = isPegaVisao ? PV_POLICY[lang] : "/privacidade.html#cookies";

  var gaLoaded = false;
  var banner = null;
  var lastTrigger = null;

  /* ---------- armazenamento da escolha ---------- */

  function readChoice() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== VERSION) return null;
      if (data.analytics !== "granted" && data.analytics !== "denied") return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: VERSION, analytics: value, date: new Date().toISOString() })
      );
    } catch (e) {
      /* sem armazenamento (aba privada etc.): a escolha vale só nesta página */
    }
  }

  /* ---------- Google Analytics (só depois do consentimento) ---------- */

  function loadAnalytics() {
    window["ga-disable-" + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (gaLoaded) {
      window.gtag("consent", "update", { analytics_storage: "granted" });
      return;
    }
    gaLoaded = true;
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }

  function stopAnalytics() {
    window["ga-disable-" + GA_ID] = true;
    if (gaLoaded && typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "denied" });
    }
    deleteAnalyticsCookies();
  }

  function deleteAnalyticsCookies() {
    var names = document.cookie.split(";").map(function (c) {
      return c.split("=")[0].trim();
    }).filter(function (n) {
      return /^_ga($|_)/.test(n) || n === "_gid" || /^_gat/.test(n);
    });
    if (!names.length) return;
    // apaga no host atual e em cada domínio pai (ex.: tevox.co e .tevox.co)
    var parts = location.hostname.split(".");
    var domains = [""];
    for (var i = 0; i < parts.length - 1; i++) {
      var d = parts.slice(i).join(".");
      domains.push("; domain=" + d, "; domain=." + d);
    }
    names.forEach(function (name) {
      domains.forEach(function (dom) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/" + dom;
      });
    });
  }

  /* ---------- aviso ---------- */

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    }
    if (text) node.textContent = text;
    return node;
  }

  function buildBanner(choice) {
    var root = el("section", {
      "class": "consent",
      id: "consentBanner",
      role: "region",
      "aria-labelledby": "consentTitle",
      "aria-describedby": "consentBody"
    });

    var inner = el("div", { "class": "consent-inner" });
    var title = el("h2", { "class": "consent-title", id: "consentTitle", tabindex: "-1" }, t.title);
    var body = el("p", { "class": "consent-text", id: "consentBody" }, t.body);

    var details = el("details", { "class": "consent-details" });
    details.appendChild(el("summary", null, t.details));
    var list = el("ul");
    list.appendChild(el("li", null, t.necessary));
    list.appendChild(el("li", null, t.analytics));
    details.appendChild(list);

    var change = el("p", { "class": "consent-text" }, t.change + " ");
    var link = el("a", { href: policyHref, "class": "consent-link" }, t.policy);
    change.appendChild(link);
    if (choice) {
      change.appendChild(document.createTextNode(" "));
      change.appendChild(el("strong", null, t.current[choice.analytics]));
    }

    var actions = el("div", { "class": "consent-actions" });
    var reject = el("button", { type: "button", "class": "consent-btn", "data-consent": "denied" }, t.reject);
    var accept = el("button", { type: "button", "class": "consent-btn", "data-consent": "granted" }, t.accept);
    actions.appendChild(reject);
    actions.appendChild(accept);

    inner.appendChild(title);
    inner.appendChild(body);
    inner.appendChild(details);
    inner.appendChild(change);
    inner.appendChild(actions);
    root.appendChild(inner);

    actions.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-consent]");
      if (btn) decide(btn.getAttribute("data-consent"));
    });

    root.addEventListener("keydown", function (ev) {
      // Esc fecha só quando já existe uma escolha (reabertura pelo rodapé)
      if ((ev.key === "Escape" || ev.key === "Esc") && readChoice()) {
        ev.preventDefault();
        hideBanner();
      }
    });

    return root;
  }

  function showBanner(fromTrigger) {
    hideBanner(true);
    banner = buildBanner(readChoice());
    // primeiro elemento do body: é o primeiro item na ordem de tabulação
    document.body.insertBefore(banner, document.body.firstChild);
    document.documentElement.classList.add("has-consent-banner");
    if (fromTrigger) {
      lastTrigger = fromTrigger;
      banner.querySelector("#consentTitle").focus();
    }
  }

  function hideBanner(silent) {
    if (!banner) return;
    banner.parentNode.removeChild(banner);
    banner = null;
    document.documentElement.classList.remove("has-consent-banner");
    if (!silent && lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus();
    }
    if (!silent) lastTrigger = null;
  }

  function decide(value) {
    saveChoice(value);
    if (value === "granted") {
      loadAnalytics();
    } else {
      stopAnalytics();
    }
    hideBanner();
  }

  /* ---------- link "Preferências de cookies" no rodapé ---------- */

  function addFooterTrigger() {
    var existing = document.querySelectorAll("[data-consent-open]");
    if (!existing.length) {
      var nav = document.querySelector(".footer-nav");
      if (!nav) return;
      var btn = el("button", { type: "button", "class": "consent-footer-btn", "data-consent-open": "" }, t.footer);
      nav.appendChild(btn);
      existing = [btn];
    }
    Array.prototype.forEach.call(existing, function (btn) {
      btn.setAttribute("aria-controls", "consentBanner");
      btn.addEventListener("click", function () { showBanner(btn); });
    });
  }

  /* ---------- início ---------- */

  function init() {
    var choice = readChoice();
    if (choice && choice.analytics === "granted") {
      loadAnalytics();
    } else {
      // sem escolha válida ou recusado: nada do GA e limpa cookies antigos
      window["ga-disable-" + GA_ID] = true;
      deleteAnalyticsCookies();
      if (!choice) showBanner(null);
    }
    addFooterTrigger();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
