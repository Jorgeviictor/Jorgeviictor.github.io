/* ============================================================
   TEVOX — Constelação
   Fixed particle field behind the whole page. The cloud
   reorganises into five formations, one per section:
   hero · sobre · servicos · projetos · contato.
   Runs anywhere WebGL does. Phones get a lighter field — fewer points,
   fewer links, DPR capped at 1. Reduced motion keeps the static hero.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia("(max-width: 720px)").matches;
  if (!window.THREE) return;

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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b131d, 0.045);
  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  var ACCENT = new THREE.Color("#37dcdc");
  var group = new THREE.Group();
  scene.add(group);

  // A portrait phone sees a far narrower slice of the scene than a desktop
  // window, so a formation would land mostly off-screen. Shrink the field
  // on narrow aspects and it still reads as a shape.
  function fitGroup() {
    var a = camera.aspect;
    group.scale.setScalar(a >= 1.3 ? 1 : Math.max(0.6, a / 1.3));
  }
  fitGroup();

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

  var COUNT = small ? 650 : 1800;
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
    size: small ? 0.046 : 0.036, vertexColors: true, transparent: true, opacity: 0.9,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTex()
  }));
  group.add(pts);

  // ---- a network, not scratches: a few bright hub stars, each wired to its
  // nearest neighbours in every formation. Links fade with length, so a
  // stretched link (mid-morph) dims out instead of slicing across the page.
  var HUB = small ? 28 : 72, PER_HUB = small ? 4 : 4;
  var LP = HUB * PER_HUB;
  var MAX_LINK = 0.95;
  function wire(f) {
    var out = new Int32Array(LP * 2), CAND = 320;
    var best = new Float32Array(PER_HUB), bi = new Int32Array(PER_HUB);
    for (var h = 0; h < HUB; h++) {
      var hx = f[h * 3], hy = f[h * 3 + 1], hz = f[h * 3 + 2];
      for (var k = 0; k < PER_HUB; k++) { best[k] = 1e9; bi[k] = h; }
      for (var c = 0; c < CAND; c++) {
        var j = HUB + ((Math.random() * (COUNT - HUB)) | 0);
        var dx = f[j * 3] - hx, dy = f[j * 3 + 1] - hy, dz = f[j * 3 + 2] - hz;
        var d = dx * dx + dy * dy + dz * dz;
        var worst = 0;
        for (var q = 1; q < PER_HUB; q++) if (best[q] > best[worst]) worst = q;
        if (d < best[worst]) { best[worst] = d; bi[worst] = j; }
      }
      for (var m = 0; m < PER_HUB; m++) {
        out[(h * PER_HUB + m) * 2] = h;
        out[(h * PER_HUB + m) * 2 + 1] = bi[m];
      }
    }
    return out;
  }
  var wires = forms.map(wire);

  // two link sets (outgoing and incoming formation) cross-fade during a morph
  var linePos = new Float32Array(LP * 2 * 6);
  var lineCol = new Float32Array(LP * 2 * 6);
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lgeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
  var lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  group.add(lines);

  var hubPos = new Float32Array(HUB * 3), hubCol = new Float32Array(HUB * 3);
  var hgeo = new THREE.BufferGeometry();
  hgeo.setAttribute("position", new THREE.BufferAttribute(hubPos, 3));
  hgeo.setAttribute("color", new THREE.BufferAttribute(hubCol, 3));
  var hubs = new THREE.Points(hgeo, new THREE.PointsMaterial({
    size: small ? 0.1 : 0.085, vertexColors: true, transparent: true, opacity: 1,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, map: pts.material.map
  }));
  group.add(hubs);

  // ---- the visitor as a node: the field parts around the cursor and a few
  // links reach out to it. Fine pointers only — touch has no resting cursor.
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var off = new Float32Array(COUNT * 3);   // eased per-point push away from the cursor
  var TETHERS = 7;
  var tetherPos = new Float32Array(TETHERS * 6);
  var tgeo = new THREE.BufferGeometry();
  tgeo.setAttribute("position", new THREE.BufferAttribute(tetherPos, 3));
  var tethers = new THREE.LineSegments(tgeo, new THREE.LineBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  group.add(tethers);
  var nodePos = new Float32Array(3);
  var ngeo = new THREE.BufferGeometry();
  ngeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  var node = new THREE.Points(ngeo, new THREE.PointsMaterial({
    size: 0.11, color: ACCENT, transparent: true, opacity: 0,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, map: pts.material.map
  }));
  group.add(node);

  var mouse = { x: 0, y: 0, on: false }, presence = 0;
  if (fine) {
    window.addEventListener("pointermove", function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.on = true;
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { mouse.on = false; });
    window.addEventListener("blur", function () { mouse.on = false; });
  }

  // ---- the 4 pillars: point i belongs to layer i % 4 (the same split the
  // Sobre layers and the Contato clusters already use). Hovering a pillar
  // card pulls its layer inward and lights it.
  var focus = -1, focusAmt = 0, shownFocus = -1;
  document.querySelectorAll("[data-pillar]").forEach(function (card) {
    var idx = +card.getAttribute("data-pillar");
    card.addEventListener("pointerenter", function () { focus = idx; });
    card.addEventListener("pointerleave", function () { if (focus === idx) focus = -1; });
  });

  var tmpV = new THREE.Vector3(), camDir = new THREE.Vector3(), cursorL = new THREE.Vector3();
  var mvp = new THREE.Matrix4();

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

    // place the field first, so this frame's matrices drive the cursor maths
    group.rotation.y = (reduce ? 0 : tAnim * 0.035) + p * Math.PI * 0.55;
    group.rotation.x = -0.05 + p * 0.1;
    // wide screens: the hero sphere sits beside the headline, not behind it,
    // then glides to centre as the page moves on
    var side = camera.aspect >= 1.3 ? 1.75 * (1 - ease(Math.min(1, p * 4))) : 0;
    group.position.x = side;
    camera.position.z = 7.4 - ease(p) * 1.4;
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    group.updateMatrixWorld();

    presence += ((fine && mouse.on && !reduce ? 1 : 0) - presence) * 0.12;
    focusAmt += ((focus >= 0 ? 1 : 0) - focusAmt) * 0.14;
    if (focus >= 0) shownFocus = focus;
    else if (focusAmt < 0.01) shownFocus = -1;

    var live = presence > 0.01;
    var e, R = 0.3, R2 = R * R, near = 0;
    if (live) {
      // cursor → a point on the plane through the field's centre, in group space
      tmpV.set(mouse.x, mouse.y, 0.5).unproject(camera);
      camDir.copy(tmpV).sub(camera.position).normalize();
      var t = -camera.position.z / camDir.z;
      cursorL.copy(camera.position).addScaledVector(camDir, t);
      group.worldToLocal(cursorL);
      mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(group.matrixWorld);
      e = mvp.elements;
    }

    for (var i = 0; i < COUNT; i++) {
      var ix = i * 3;
      var x = A[ix] + (B[ix] - A[ix]) * fe;
      var y = A[ix + 1] + (B[ix + 1] - A[ix + 1]) * fe;
      var z = A[ix + 2] + (B[ix + 2] - A[ix + 2]) * fe;
      if (wob) {
        x += Math.sin(tAnim * 0.6 + i) * 0.024;
        y += Math.cos(tAnim * 0.5 + i * 1.3) * 0.024;
      }
      if (shownFocus >= 0 && i % 4 === shownFocus) {
        var k = 1 - 0.3 * focusAmt;   // the pillar's layer draws in toward the core
        x *= k; y *= k; z *= k;
      }

      var tx = 0, ty = 0, tz = 0;
      if (live) {
        var w = e[3] * x + e[7] * y + e[11] * z + e[15];
        var sx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w;
        var sy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
        var dx = (sx - mouse.x) * camera.aspect, dy = sy - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          var fall = 1 - Math.sqrt(d2) / R;
          var vx = x - cursorL.x, vy = y - cursorL.y, vz = z - cursorL.z;
          var len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
          var push = fall * fall * 0.6 * presence / len;
          tx = vx * push; ty = vy * push; tz = vz * push;
          if (near < TETHERS && fall > 0.35 && (i & 7) === 0) {
            tetherPos[near * 6] = cursorL.x; tetherPos[near * 6 + 1] = cursorL.y; tetherPos[near * 6 + 2] = cursorL.z;
            tetherPos[near * 6 + 3] = i; // index for now; resolved after the push below
            near++;
          }
        }
      }
      off[ix] += (tx - off[ix]) * 0.16;
      off[ix + 1] += (ty - off[ix + 1]) * 0.16;
      off[ix + 2] += (tz - off[ix + 2]) * 0.16;
      cur[ix] = x + off[ix]; cur[ix + 1] = y + off[ix + 1]; cur[ix + 2] = z + off[ix + 2];
    }

    // tethers: cursor → the points that just made room for it
    for (var n = 0; n < TETHERS; n++) {
      var o = n * 6;
      if (n < near) {
        var pi = tetherPos[o + 3] * 3;
        tetherPos[o + 3] = cur[pi]; tetherPos[o + 4] = cur[pi + 1]; tetherPos[o + 5] = cur[pi + 2];
      } else {
        tetherPos[o] = tetherPos[o + 3] = cursorL.x;
        tetherPos[o + 1] = tetherPos[o + 4] = cursorL.y;
        tetherPos[o + 2] = tetherPos[o + 5] = cursorL.z;
      }
    }
    tgeo.attributes.position.needsUpdate = true;
    nodePos[0] = cursorL.x; nodePos[1] = cursorL.y; nodePos[2] = cursorL.z;
    ngeo.attributes.position.needsUpdate = true;

    var cA = formColors[seg], cB = formColors[seg + 1];
    var rr = cA.r + (cB.r - cA.r) * fe;
    var gg = cA.g + (cB.g - cA.g) * fe;
    var bl = cA.b + (cB.b - cA.b) * fe;
    // ease the field down over the dense sections (Serviços, Contato)
    var dim = 1 - 0.35 * tri(p, 0.5, 0.14) - 0.45 * tri(p, 1, 0.16);
    var lit = 1 + 2 * focusAmt, unlit = 1 - 0.6 * focusAmt;
    for (var j = 0; j < COUNT; j++) {
      var wj = bright[j] * dim;
      // the lit layer also escapes the section dimming, so it reads through the cards
      if (shownFocus >= 0) wj = (j % 4 === shownFocus) ? bright[j] * (dim + (1 - dim) * focusAmt) * lit : wj * unlit;
      col[j * 3] = rr * wj; col[j * 3 + 1] = gg * wj; col[j * 3 + 2] = bl * wj;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    var linkA = 0.5 * dim * (1 - 0.4 * focusAmt);
    for (var set = 0; set < 2; set++) {
      var W = wires[seg + set], weight = set ? fe : 1 - fe;
      for (var k = 0; k < LP; k++) {
        var a2 = W[k * 2] * 3, b2 = W[k * 2 + 1] * 3, o6 = (set * LP + k) * 6;
        var lx = cur[b2] - cur[a2], ly = cur[b2 + 1] - cur[a2 + 1], lz = cur[b2 + 2] - cur[a2 + 2];
        var fade = 1 - Math.sqrt(lx * lx + ly * ly + lz * lz) / MAX_LINK;
        var la = fade > 0 ? fade * weight * linkA : 0;
        if (shownFocus >= 0 && W[k * 2] % 4 === shownFocus) la *= lit;
        linePos[o6] = cur[a2]; linePos[o6 + 1] = cur[a2 + 1]; linePos[o6 + 2] = cur[a2 + 2];
        linePos[o6 + 3] = cur[b2]; linePos[o6 + 4] = cur[b2 + 1]; linePos[o6 + 5] = cur[b2 + 2];
        lineCol[o6] = lineCol[o6 + 3] = rr * la;
        lineCol[o6 + 1] = lineCol[o6 + 4] = gg * la;
        lineCol[o6 + 2] = lineCol[o6 + 5] = bl * la;
      }
    }
    lgeo.attributes.position.needsUpdate = true;
    lgeo.attributes.color.needsUpdate = true;

    // hubs: brighter, larger stars at the head of each cluster of links
    for (var hb = 0; hb < HUB; hb++) {
      var h3 = hb * 3;
      hubPos[h3] = cur[h3]; hubPos[h3 + 1] = cur[h3 + 1]; hubPos[h3 + 2] = cur[h3 + 2];
      hubCol[h3] = Math.min(1, col[h3] * 1.5 + 0.08);
      hubCol[h3 + 1] = Math.min(1, col[h3 + 1] * 1.5 + 0.08);
      hubCol[h3 + 2] = Math.min(1, col[h3 + 2] * 1.5 + 0.08);
    }
    hgeo.attributes.position.needsUpdate = true;
    hgeo.attributes.color.needsUpdate = true;
    tethers.material.color.setRGB(rr, gg, bl);
    tethers.material.opacity = 0.55 * presence * dim;
    node.material.color.setRGB(rr, gg, bl);
    node.material.opacity = 0.9 * presence * dim;

    renderer.render(scene, camera);
  }

  // Mobile browsers fire resize every time the URL bar slides in or out.
  // Skip those height-only nudges — reallocating the drawing buffer mid-scroll
  // is what makes a phone stutter. Rotation and real resizes still get through.
  var lastW = window.innerWidth, lastH = window.innerHeight;
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitGroup();
    renderer.setSize(w, h, false);
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
