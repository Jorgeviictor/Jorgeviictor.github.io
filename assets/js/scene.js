/* ============================================================
   TEVOX — Constelação
   Fixed particle field behind the whole page. The cloud
   reorganises into five formations, one per section:
   hero · sobre · servicos · projetos · contato.
   Desktop + WebGL only — mobile keeps the static hero image.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia("(max-width: 720px)").matches;
  if (small || !window.THREE) return;

  var canvas = document.getElementById("scene");
  if (!canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance"
    });
  } catch (e) {
    return;
  }

  // Only worth running with real GPU acceleration — bail on software renderers
  // (SwiftShader / llvmpipe / Microsoft Basic Render) and keep the static hero.
  try {
    var gl = renderer.getContext();
    var info = gl.getExtension("WEBGL_debug_renderer_info");
    var gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
    if (/swiftshader|llvmpipe|software|basic render|paravirtual/i.test(gpu)) {
      renderer.dispose();
      return;
    }
  } catch (e2) { /* keep going if the probe isn't available */ }

  document.documentElement.classList.add("scene-on");

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b131d, 0.045);
  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  var ACCENT = new THREE.Color("#37dcdc");
  var group = new THREE.Group();
  scene.add(group);

  function dotTex() {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  var COUNT = 1800;
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function fSphere() {
    var a = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      var r = 2.4 + Math.random() * 0.5;
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.9;
      a[i * 3 + 2] = r * Math.cos(ph);
    }
    return a;
  }
  function fLayers() {
    var a = new Float32Array(COUNT * 3), layers = 4;
    for (var i = 0; i < COUNT; i++) {
      var L = i % layers;
      a[i * 3] = rnd(-1.7, 1.7) + (L - 1.5) * 0.18;
      a[i * 3 + 1] = (L / (layers - 1) - 0.5) * 3.4 + rnd(-0.12, 0.12);
      a[i * 3 + 2] = rnd(-1.3, 1.3);
    }
    return a;
  }
  function fDome() {
    var a = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT; i++) {
      var r = 2.7 + rnd(-0.06, 0.06);
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(Math.random());
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.cos(ph) - 0.7;
      a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return a;
  }
  function fLattice() {
    var a = new Float32Array(COUNT * 3);
    var n = Math.ceil(Math.cbrt(COUNT));
    var step = 3.6 / (n - 1);
    for (var i = 0; i < COUNT; i++) {
      var ix = i % n, iy = Math.floor(i / n) % n, iz = Math.floor(i / (n * n)) % n;
      a[i * 3] = -1.8 + ix * step + rnd(-0.05, 0.05);
      a[i * 3 + 1] = -1.8 + iy * step + rnd(-0.05, 0.05);
      a[i * 3 + 2] = -1.8 + iz * step + rnd(-0.05, 0.05);
    }
    return a;
  }
  function fBand() {
    var a = new Float32Array(COUNT * 3);
    var centers = [[-2.7, 0.3, 0], [-0.5, -0.2, 0.6], [1.5, 0.4, -0.4], [3.0, -0.1, 0.3]];
    for (var i = 0; i < COUNT; i++) {
      var c = centers[i % centers.length];
      a[i * 3] = c[0] + rnd(-1.1, 1.1);
      a[i * 3 + 1] = c[1] + rnd(-0.5, 0.5);
      a[i * 3 + 2] = c[2] + rnd(-0.85, 0.85);
    }
    return a;
  }

  // order matches the sections: hero, sobre, servicos, projetos, contato
  var forms = [fSphere(), fLayers(), fDome(), fLattice(), fBand()];
  var formColors = ["#37dcdc", "#4fe0c6", "#33d2e8", "#3bd9cd", "#5aa8ff"]
    .map(function (c) { return new THREE.Color(c); });

  var cur = new Float32Array(COUNT * 3);
  cur.set(forms[0]);
  var col = new Float32Array(COUNT * 3);
  var bright = new Float32Array(COUNT);
  for (var b = 0; b < COUNT; b++) bright[b] = 0.5 + Math.random() * 0.5;

  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.03, vertexColors: true, transparent: true, opacity: 0.9,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTex()
  }));
  group.add(pts);

  var LP = 60;
  var pairs = [];
  for (var lp = 0; lp < LP; lp++) pairs.push([(Math.random() * COUNT) | 0, (Math.random() * COUNT) | 0]);
  var linePos = new Float32Array(LP * 6);
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  var lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  group.add(lines);

  // ---- scroll position → progress 0..1 via section checkpoints ----
  var SECTIONS = ["hero", "sobre", "servicos", "projetos", "contato"];
  var marks = [0, 0, 0, 0, 0];
  function measure() {
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = SECTIONS[i] === "hero"
        ? document.querySelector(".hero")
        : document.getElementById(SECTIONS[i]);
      if (!el) { marks[i] = marks[i - 1] || 0; continue; }
      var top = el.getBoundingClientRect().top + window.scrollY;
      marks[i] = top + el.offsetHeight / 2 - window.innerHeight / 2;
    }
  }
  function progress() {
    var y = window.scrollY;
    if (y <= marks[0]) return 0;
    if (y >= marks[4]) return 1;
    for (var i = 0; i < 4; i++) {
      if (y < marks[i + 1]) {
        var span = marks[i + 1] - marks[i] || 1;
        return (i + (y - marks[i]) / span) / 4;
      }
    }
    return 1;
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tri(x, c, w) { return Math.max(0, 1 - Math.abs(x - c) / w); }

  // ---- optional guided tour: only with #demo in the URL ----
  var kiosk = location.hash.toLowerCase().indexOf("demo") >= 0;
  var ATTRACT = kiosk && !reduce;
  var attractStart = 0, lastInteract = performance.now();
  var SEGS = [
    { to: 0.25, tr: 2.6, ho: 2.4 }, { to: 0.5, tr: 2.6, ho: 2.4 },
    { to: 0.75, tr: 2.6, ho: 2.4 }, { to: 1, tr: 2.6, ho: 2.8 },
    { to: 0, tr: 3.4, ho: 2 }
  ];
  var SEG_TOTAL = SEGS.reduce(function (s, x) { return s + x.tr + x.ho; }, 0);
  function attract(el) {
    var t = el % SEG_TOTAL, from = 0;
    for (var i = 0; i < SEGS.length; i++) {
      var s = SEGS[i];
      if (t < s.tr) return from + (s.to - from) * ease(t / s.tr);
      t -= s.tr;
      if (t < s.ho) return s.to;
      t -= s.ho;
      from = s.to;
    }
    return 0;
  }
  if (kiosk) {
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, function () {
        lastInteract = performance.now();
        ATTRACT = false;
      }, { passive: true });
    });
  }

  var smooth = 0, tAnim = 0, last = performance.now();
  measure();

  function render(targetP) {
    smooth += (targetP - smooth) * (reduce ? 1 : 0.06);
    var p = smooth, bf = p * 4;
    var seg = Math.min(3, Math.max(0, Math.floor(bf)));
    var f = Math.min(1, Math.max(0, bf - seg));
    var fe = ease(f);
    var A = forms[seg], B = forms[seg + 1];
    var wob = reduce ? 0 : 1;

    for (var i = 0; i < COUNT; i++) {
      var ix = i * 3;
      var x = A[ix] + (B[ix] - A[ix]) * fe;
      var y = A[ix + 1] + (B[ix + 1] - A[ix + 1]) * fe;
      var z = A[ix + 2] + (B[ix + 2] - A[ix + 2]) * fe;
      if (wob) {
        x += Math.sin(tAnim * 0.6 + i) * 0.024;
        y += Math.cos(tAnim * 0.5 + i * 1.3) * 0.024;
      }
      cur[ix] = x; cur[ix + 1] = y; cur[ix + 2] = z;
    }

    var cA = formColors[seg], cB = formColors[seg + 1];
    var rr = cA.r + (cB.r - cA.r) * fe;
    var gg = cA.g + (cB.g - cA.g) * fe;
    var bl = cA.b + (cB.b - cA.b) * fe;
    // ease the field down over the dense sections (Serviços, Contato)
    var dim = 1 - 0.35 * tri(p, 0.5, 0.14) - 0.45 * tri(p, 1, 0.16);
    for (var j = 0; j < COUNT; j++) {
      var w = bright[j] * dim;
      col[j * 3] = rr * w; col[j * 3 + 1] = gg * w; col[j * 3 + 2] = bl * w;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    for (var k = 0; k < LP; k++) {
      var a2 = pairs[k][0] * 3, b2 = pairs[k][1] * 3;
      linePos[k * 6] = cur[a2]; linePos[k * 6 + 1] = cur[a2 + 1]; linePos[k * 6 + 2] = cur[a2 + 2];
      linePos[k * 6 + 3] = cur[b2]; linePos[k * 6 + 4] = cur[b2 + 1]; linePos[k * 6 + 5] = cur[b2 + 2];
    }
    lgeo.attributes.position.needsUpdate = true;
    lines.material.color.setRGB(rr, gg, bl);
    lines.material.opacity = 0.22 * dim;

    group.rotation.y = (reduce ? 0 : tAnim * 0.035) + p * Math.PI * 0.55;
    group.rotation.x = -0.05 + p * 0.1;
    camera.position.z = 7.4 - ease(p) * 1.4;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    measure();
  }
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", measure);
  setTimeout(measure, 1200);

  if (reduce) {
    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; render(progress()); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    render(progress());
    return;
  }

  var acc = 0, STEP = 1 / 40; // cap the field at ~40fps — plenty for an ambient layer
  function loop() {
    requestAnimationFrame(loop);
    var now = performance.now();
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    acc += dt;
    if (acc < STEP) return;
    tAnim += acc;
    acc = 0;

    var targetP;
    if (ATTRACT) {
      targetP = attract(tAnim - attractStart);
    } else {
      targetP = progress();
      if (kiosk && now - lastInteract > 6000) { ATTRACT = true; attractStart = tAnim; }
    }
    render(targetP);
  }
  loop();
})();
