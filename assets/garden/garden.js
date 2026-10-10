/*!
 * Beyond Our Gallery - living painting background
 * ------------------------------------------------------------------------
 * A fixed layer behind the page made of two parts:
 *   1. plate.webp  - the painting with its loose petals, butterflies and koi
 *                    painted out (an <img>, panned with a CSS transform)
 *   2. a WebGL canvas that draws those pieces back on top and animates them
 *
 * Scroll drives everything:
 *   - the "camera" pans down the painting (keyframes: [data-garden-focus])
 *   - loose petals tumble down, new ones detach from the lily, and the ones
 *     that reach the pond land, float and ripple
 *   - the two butterflies take off and flutter away once the first clear
 *     window (.garden-window) slides under them
 *   - the three koi swim their loops; scrolling makes them swim faster
 * At scroll 0 every piece sits exactly where it was painted.
 *
 * Needs garden-data.js (generated geometry) loaded first. No dependencies.
 * prefers-reduced-motion: shows the still painting, no panning, no motion.
 *
 * Optional config, set before this script runs:
 *   window.BOG_GARDEN_CONFIG = { petals: 10, idle: false }
 */
(function () {
  "use strict";

  var D = window.BOG_GARDEN_DATA;
  if (!D || !document.body) return;

  // ------------------------------------------------------------------ config
  var CFG = {
    petals: 10,                   // most petals in the air at once (scaled down on small screens)
    fall: 0.5,                    // screen px a petal falls per px scrolled
    idleFall: 10,                 // px/s petals keep drifting when you stop scrolling
    koiSpeed: [0.34, 0.42, 0.3],  // painting px each koi swims per px scrolled
    koiIdle: [7, 9, 6],           // painting px/s cruising speed when idle
    flight: 0.9,                  // screens of scrolling a butterfly takes to fly off
    idle: true,                   // gentle motion while not scrolling (false = only moves on scroll)
    assets: null                  // optional {plate, plate2x, painting, sprites} URLs; default: next to this script
  };
  var user = window.BOG_GARDEN_CONFIG || {};
  for (var key in user) if (Object.prototype.hasOwnProperty.call(user, key)) CFG[key] = user[key];

  var script = document.currentScript;
  var BASE = (script && script.src) ? script.src.replace(/[^\/]*$/, "") : "assets/garden/";
  var A = CFG.assets || {};
  var URL_ = {
    plate: A.plate || BASE + "plate.webp",          // painting with the moving pieces removed
    plate2x: A.plate2x || BASE + "plate@2x.webp",   // same, upscaled for large / high-DPI screens
    painting: A.painting || BASE + "painting.webp", // the untouched painting (reduced motion / no WebGL)
    sprites: A.sprites || BASE + "sprites.webp"     // petals, wings and straightened koi
  };
  function plateSrcset() { return URL_.plate + " 767w, " + URL_.plate2x + " 1534w"; }
  var PW = D.painting.w, PH = D.painting.h;
  var AW = D.atlas.w, AH = D.atlas.h, AS = D.atlas.scale;   // atlas size, sprite px per painting px

  // ------------------------------------------------------------------ helpers
  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function damp(dt, rate) { return 1 - Math.exp(-dt * rate); }
  function angleTo(from, to) { var d = (to - from) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  var seed = 1 + Math.floor(Math.random() * 2147483640);
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ------------------------------------------------------------------ DOM
  var root = document.querySelector(".garden");
  if (!root) {
    root = document.createElement("div");
    root.className = "garden";
    document.body.insertBefore(root, document.body.firstChild);
  }
  root.setAttribute("aria-hidden", "true");
  document.documentElement.classList.add("has-garden");

  var plate = new Image();
  plate.className = "garden__plate";
  plate.alt = "";
  plate.decoding = "async";
  plate.draggable = false;
  var canvas = document.createElement("canvas");
  canvas.className = "garden__fx";
  root.appendChild(plate);
  root.appendChild(canvas);

  var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(reduceQuery && reduceQuery.matches);

  // ------------------------------------------------------------------ layout + camera
  var vw = 1, vh = 1, s = 1, dw = 1, dh = 1, ox = 0, maxCam = 0, dpr = 1;
  var anchors = [], maxScroll = 0;

  function layout() {
    vw = root.clientWidth || window.innerWidth;
    vh = root.clientHeight || window.innerHeight;
    s = Math.max(vw / PW, vh / PH);            // cover: fill width (portrait painting)
    dw = PW * s; dh = PH * s;
    ox = (vw - dw) / 2;
    maxCam = Math.max(0, dh - vh);
    plate.style.width = dw + "px";
    plate.style.height = dh + "px";
    plate.sizes = Math.ceil(dw) + "px";
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var budget = 4.2e6;                         // cap backing-store pixels for weak GPUs
    if (vw * vh * dpr * dpr > budget) dpr = Math.sqrt(budget / (vw * vh));
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    readAnchors();
  }

  // [data-garden-focus="0.4"] = "when this element is centred on screen, centre
  // the point 40% down the painting". Between keyframes the camera glides.
  var takeoffAt = [0, 0];
  function readAnchors() {
    var y0 = window.scrollY || window.pageYOffset || 0;
    var ih = window.innerHeight;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - ih);
    anchors = [];
    var els = document.querySelectorAll("[data-garden-focus]");
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      var f = parseFloat(els[i].getAttribute("data-garden-focus"));
      if (isNaN(f)) continue;
      anchors.push({ at: clamp(r.top + y0 + r.height / 2 - ih / 2, 0, maxScroll), focus: f });
    }
    anchors.sort(function (a, b) { return a.at - b.at; });
    if (!anchors.length) anchors = [{ at: 0, focus: 0 }, { at: Math.max(1, maxScroll), focus: 1 }];
    for (var j = 0; j < anchors.length; j++) anchors[j].cam = clamp(anchors[j].focus * dh - vh / 2, 0, maxCam);
    // Each butterfly waits until it is on screen and the first clear window has slid
    // under it (so it isn't hidden behind the hero copy), then takes off.
    var win = document.querySelector("[data-garden-takeoff]") || document.querySelector(".garden-window");
    var winTop = win ? win.getBoundingClientRect().top + y0 : -Infinity;
    for (var b = 0; b < D.butterflies.length; b++) {
      var y = 0.03 * ih, by;
      while (y < maxScroll) {
        by = D.butterflies[b].cy * s - camFor(y);           // its resting spot on screen
        if (by < 0.8 * vh && winTop - y < by + 40) break;
        y += 16;
      }
      takeoffAt[b] = y;
    }
  }

  function camFor(y) {
    var A = anchors, n = A.length;
    if (y <= A[0].at) return A[0].cam;
    if (y >= A[n - 1].at) return A[n - 1].cam;
    for (var i = 1; i < n; i++) {
      if (y < A[i].at) {
        var t = (y - A[i - 1].at) / (A[i].at - A[i - 1].at || 1);
        return lerp(A[i - 1].cam, A[i].cam, t * 0.6 + t * t * (3 - 2 * t) * 0.4);
      }
    }
    return A[n - 1].cam;
  }

  // painting px -> screen css px
  function sx(x) { return ox + x * s; }
  function sy(y) { return y * s - cam; }

  // ------------------------------------------------------------------ geometry from the data file
  function frameUV(r) { return [r[0] / AW, r[1] / AH, (r[0] + r[2]) / AW, (r[1] + r[3]) / AH]; }

  var PETAL_FRAMES = D.petals.map(function (p) {
    return { uv: frameUV(p.rect), w: p.rect[2] / AS, h: p.rect[3] / AS };
  });
  var RIPPLE = { uv: frameUV(D.ripple), w: D.ripple[2] / AS, h: D.ripple[3] / AS };

  function waterLine(x) {
    var W = D.water;
    if (x <= W[0][0]) return W[0][1];
    for (var i = 1; i < W.length; i++) {
      if (x <= W[i][0]) return lerp(W[i - 1][1], W[i][1], (x - W[i - 1][0]) / (W[i][0] - W[i - 1][0]));
    }
    return W[W.length - 1][1];
  }

  // ------------------------------------------------------------------ state
  var cam = 0, scrollS = 0, scrollPrev = 0, activity = 0, clock = 0, life = 0;
  var petals = [], ripples = [], butterflies = [], koi = [];

  // --- petals: airborne ones live in screen space, landed ones in painting space
  function makePetal(i) {
    return { i: i, state: "wait", wait: 0, f: 0, x0: 0, y0: 0, x: 0, y: 0, rot0: 0, rot: 0, mirror: 1,
      scale: 1, fallen: 0, speed: 1, amp: 0, freq: 0.012, ph0: 0, spin: 0, drift: 0, flipRate: 1,
      depth: 100, a: 1, fadeIn: false, wx: 0, wy: 0, wt: 0, wr: 0 };
  }

  function seedPetals() {
    petals = [];
    var n = Math.round(clamp(vw * vh / 120000, 5, CFG.petals));
    for (var i = 0; i < n; i++) petals.push(makePetal(i));
    // the three painted petals start exactly where they were painted
    D.petals.forEach(function (p, i) {
      var q = petals[i], F = PETAL_FRAMES[i];
      launch(q, sx(p.x + F.w / 2), sy(p.y + F.h / 2), i, 1, 0, 1, false);
    });
    for (var j = D.petals.length; j < petals.length; j++) petals[j].wait = 120 + rnd() * 900;
  }

  function launch(q, x, y, f, scale, rot0, mirror, fadeIn) {
    q.state = "air"; q.f = f; q.x0 = q.x = x; q.y0 = q.y = y; q.scale = scale; q.rot0 = q.rot = rot0;
    q.mirror = mirror; q.fallen = 0; q.speed = 0.75 + rnd() * 0.6;
    q.amp = (12 + rnd() * 26) * Math.min(1.4, s); q.freq = 0.009 + rnd() * 0.008; q.ph0 = rnd() * TAU;
    q.spin = (rnd() - 0.5) * 0.004; q.drift = (rnd() - 0.35) * 0.12; q.flipRate = 0.5 + rnd() * 0.9;
    q.depth = 30 + rnd() * 300; q.fadeIn = fadeIn; q.a = fadeIn ? 0 : 1;
  }

  function spawnPetal(q) {
    var L = D.lily, top = sy(L[1]), bottom = sy(L[3]);
    var f = Math.floor(rnd() * PETAL_FRAMES.length);
    var x, y;
    if (bottom > 0 && top < vh * 0.85) {         // lily on screen: detach from its blossoms
      x = sx(lerp(L[0], L[2], rnd())); y = sy(lerp(L[1], L[3], rnd()));
    } else {                                      // otherwise drift in from above
      x = vw * (0.03 + 0.94 * Math.pow(rnd(), 1.25)); y = -50 - rnd() * 80;
    }
    launch(q, x, y, f, 0.55 + rnd() * 0.45, rnd() * TAU, rnd() < 0.5 ? -1 : 1, true);
  }

  function updatePetals(dt, dScroll) {
    var idleDrift = CFG.idle ? CFG.idleFall * dt * life : 0;
    for (var i = 0; i < petals.length; i++) {
      var q = petals[i];
      if (q.state === "wait") {
        q.wait -= dScroll + idleDrift * 6;
        if (q.wait <= 0) spawnPetal(q);
        continue;
      }
      if (q.state === "air") {
        var d = (CFG.fall * dScroll + idleDrift) * q.speed;
        q.fallen += d;
        var ph = q.fallen * q.freq;
        q.x = q.x0 + q.amp * (Math.sin(ph + q.ph0) - Math.sin(q.ph0)) + q.drift * q.fallen;
        q.y = q.y0 + q.fallen;
        q.rot = q.rot0 + q.spin * q.fallen + 0.45 * (Math.sin(ph * 0.7 + q.ph0) - Math.sin(q.ph0));
        if (q.fadeIn) q.a = Math.min(1, q.fallen / 30);
        // reached the pond? (convert to painting space)
        var px = (q.x - ox) / s, py = (q.y + cam) / s;
        if (py > waterLine(px) + q.depth && py < PH - 20 && px > 8 && px < PW - 8) {
          q.state = "water"; q.wx = px; q.wy = py; q.wt = 0; q.wr = q.rot;
          ripples.push({ x: px, y: py, age: 0 });
        } else if (q.y > vh + 80 || q.x < -120 || q.x > vw + 120) {
          q.state = "wait"; q.wait = 80 + rnd() * 500;
        }
        continue;
      }
      // floating: circle lazily around the pond's swirl, then fade away
      var cx = 520, cy = 1765, ang = 0.00016 * dScroll + 0.012 * dt * life;
      var rx = q.wx - cx, ry = q.wy - cy, ca = Math.cos(ang), sa = Math.sin(ang);
      q.wx = cx + rx * ca - ry * sa; q.wy = cy + rx * sa + ry * ca;
      q.wr += ang * 1.4;
      q.wt += dScroll + dt * 45 * life;
      q.a = 1 - smooth(500, 1300, q.wt);
      if (q.a <= 0) { q.state = "wait"; q.wait = 60 + rnd() * 400; }
    }
    for (var r = ripples.length - 1; r >= 0; r--) {
      ripples[r].age += dt + dScroll * 0.0015;
      if (ripples[r].age > 1.8) ripples.splice(r, 1);
    }
  }

  // --- butterflies: scrubbed by scroll position (they return if you scroll back up)
  var FLIGHT = [   // cubic Bezier per butterfly, painting px; ends beyond the top edge
    [[540, 539.5], [612, 455], [778, 405], [760, -170]],
    [[387.5, 661.5], [446, 560], [262, 420], [500, -190]]
  ];
  function bezier(P, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
  }
  function seedButterflies() {
    butterflies = D.butterflies.map(function (b, i) {
      return { d: b, i: i, e: 0, prevE: 0, dir: 1, heading: b.heading * DEG, flapT: i * 0.37, flap: 0,
        L: { uv: frameUV(b.L.rect), w: b.L.rect[2] / AS, h: b.L.rect[3] / AS, ax: b.L.ax, ay: b.L.ay },
        R: { uv: frameUV(b.R.rect), w: b.R.rect[2] / AS, h: b.R.rect[3] / AS, ax: b.R.ax, ay: b.R.ay } };
    });
  }
  function updateButterflies(dt) {
    var ih = window.innerHeight;
    for (var i = 0; i < butterflies.length; i++) {
      var b = butterflies[i];
      var start = takeoffAt[i] + i * 0.06 * ih, end = start + (CFG.flight + i * 0.08) * ih;
      var d = clamp((scrollS - start) / (end - start), 0, 1);
      b.prevE = b.e;
      b.e = d * d * (3 - 2 * d);
      if (Math.abs(b.e - b.prevE) > 1e-5) b.dir = b.e > b.prevE ? 1 : -1;
      var flying = b.e > 0.0005 && b.e < 0.9995;
      // heading follows the direction of travel, settles back to its painted pose at rest
      var p0 = bezier(FLIGHT[i], b.e), p1 = bezier(FLIGHT[i], Math.min(1, b.e + 0.01));
      var travelHeading = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (b.dir < 0 ? Math.PI : 0);
      var target = lerp(b.d.heading * DEG, b.d.heading * DEG + angleTo(b.d.heading * DEG, travelHeading), smooth(0, 0.07, b.e));
      b.heading += angleTo(b.heading, target) * damp(dt, 9);
      // wings: quick beats in flight, an occasional slow open/close at rest
      if (flying) { b.flapT += dt * 7.5; b.flap = lerp(b.flap, 1.15, damp(dt, 6)); }
      else { b.flapT += dt * 0.35 * life; b.flap = lerp(b.flap, 0.55 * life, damp(dt, 3)); }
    }
  }

  // --- koi: distance swum accumulates from scroll (+ a slow idle cruise)
  function seedKoi() {
    koi = D.koi.map(function (k, i) {
      var P = k.loop.pts, n = P.length / 2, T = new Float32Array(P.length);
      for (var j = 0; j < n; j++) {        // per-point tangents: central difference over +-3 points
        var a = (j - 3 + n) % n, b = (j + 3) % n;
        var tx = P[2 * b] - P[2 * a], ty = P[2 * b + 1] - P[2 * a + 1], m = Math.sqrt(tx * tx + ty * ty) || 1;
        T[2 * j] = tx / m; T[2 * j + 1] = ty / m;
      }
      return { k: k, i: i, swum: 0, amp: 0, phase: i * 2.1, uv: frameUV(k.rect),
        pts: P, tan: T, n: n, step: k.loop.step, len: k.loop.length, sTail: k.loop.sTail };
    });
  }
  var tmp = [0, 0, 0, 0];
  // the same sampling rule the asset pipeline used to straighten each fish, so the
  // bent mesh lands exactly on the painted pose before the koi start to move
  function sampleLoop(K, s_) {
    var len = K.len, n = K.n, P = K.pts, T = K.tan;
    s_ = ((s_ % len) + len) % len;
    var f = s_ / K.step, i0 = Math.floor(f), t = f - i0;
    i0 = i0 % n;
    var i1 = (i0 + 1) % n;
    tmp[0] = P[2 * i0] * (1 - t) + P[2 * i1] * t;
    tmp[1] = P[2 * i0 + 1] * (1 - t) + P[2 * i1 + 1] * t;
    var tx = T[2 * i0] * (1 - t) + T[2 * i1] * t, ty = T[2 * i0 + 1] * (1 - t) + T[2 * i1 + 1] * t;
    var m = Math.sqrt(tx * tx + ty * ty) || 1;
    tmp[2] = tx / m; tmp[3] = ty / m;
    return tmp;
  }
  function updateKoi(dt, dScroll) {
    var push = clamp(activity / 1400, 0, 1);
    for (var i = 0; i < koi.length; i++) {
      var K = koi[i];
      K.swum += CFG.koiSpeed[i % CFG.koiSpeed.length] * dScroll +
        (CFG.idle ? CFG.koiIdle[i % CFG.koiIdle.length] * dt * life : 0);
      var targetAmp = (CFG.idle ? 2.4 * life : 0) + 5.5 * push;
      K.amp = lerp(K.amp, targetAmp, damp(dt, 3));
      K.phase += dt * (3.0 + 7 * push) * (K.amp > 0.01 ? 1 : 0);
    }
  }

  // ------------------------------------------------------------------ WebGL
  var gl = null, prog = null, buf = null, tex = null, atlasImg = null, glOK = false;
  var verts = new Float32Array(5 * 12000), nv = 0;      // grows if ever needed
  var uView = null;

  function initGL() {
    glOK = false;
    gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false,
      depth: false, stencil: false, powerPreference: "low-power" }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) return false;
    var vs = "attribute vec2 p;attribute vec2 t;attribute float a;uniform vec2 v;varying vec2 vt;varying float va;" +
      "void main(){gl_Position=vec4(p.x/v.x*2.0-1.0,1.0-p.y/v.y*2.0,0.0,1.0);vt=t;va=a;}";
    // highp where available: mediump texture coords quantise a 2048px atlas into visible blocks
    var fs = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
      "uniform sampler2D tex;varying vec2 vt;varying float va;" +
      "void main(){gl_FragColor=texture2D(tex,vt)*va;}";
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    var lp = gl.getAttribLocation(prog, "p"), lt = gl.getAttribLocation(prog, "t"), la = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(lt); gl.vertexAttribPointer(lt, 2, gl.FLOAT, false, 20, 8);
    gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 1, gl.FLOAT, false, 20, 16);
    uView = gl.getUniformLocation(prog, "v");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied alpha
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasImg);
    } catch (err) {                                  // e.g. opened from file:// - serve over http
      if (window.console) console.info("[garden] sprites unavailable (" + err.name + "), showing the still painting");
      return false;
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    glOK = true;
    return true;
  }

  function grow() {
    var bigger = new Float32Array(verts.length * 2);
    bigger.set(verts);
    verts = bigger;
  }
  function vtx(x, y, u, v, a) {
    if (nv * 5 + 5 > verts.length) grow();
    var o = nv * 5;
    verts[o] = x; verts[o + 1] = y; verts[o + 2] = u; verts[o + 3] = v; verts[o + 4] = a;
    nv++;
  }
  // a textured quad: frame F (uv + size in painting px), anchored at (ax, ay) within the
  // frame, placed at screen (X, Y), scaled by k (css px per painting px) * (kx, ky), rotated rot
  function quad(F, ax, ay, X, Y, k, kx, ky, rot, a) {
    var c = Math.cos(rot), sn = Math.sin(rot);
    var x0 = -ax * k * kx, x1 = (F.w - ax) * k * kx, y0 = -ay * k * ky, y1 = (F.h - ay) * k * ky;
    var u0 = F.uv[0], v0 = F.uv[1], u1 = F.uv[2], v1 = F.uv[3];   // negative kx/ky mirror for free
    var ax0 = X + x0 * c - y0 * sn, ay0 = Y + x0 * sn + y0 * c;
    var ax1 = X + x1 * c - y0 * sn, ay1 = Y + x1 * sn + y0 * c;
    var ax2 = X + x1 * c - y1 * sn, ay2 = Y + x1 * sn + y1 * c;
    var ax3 = X + x0 * c - y1 * sn, ay3 = Y + x0 * sn + y1 * c;
    vtx(ax0, ay0, u0, v0, a); vtx(ax1, ay1, u1, v0, a); vtx(ax2, ay2, u1, v1, a);
    vtx(ax0, ay0, u0, v0, a); vtx(ax2, ay2, u1, v1, a); vtx(ax3, ay3, u0, v1, a);
  }

  // The straightened fish is laid back along its loop as a grid mesh: columns follow
  // the path, rows split the width so every cell stays close to a parallelogram
  // (one tall strip per column would kink the texture along each diagonal on curves).
  var KSEG = 48, KROWS = 8, colA = new Float32Array((KROWS + 1) * 2), colB = new Float32Array((KROWS + 1) * 2);
  function drawKoi(K) {
    var k = K.k, half = 0.5 / AS;
    var uA = k.u0 - half, uB = k.u1 + half, vA = k.v0 - half, vB = k.v1 + half, L = k.spine;
    var prev = colA, cur = colB, pu = 0;
    for (var j = 0; j <= KSEG; j++) {
      var u = lerp(uA, uB, j / KSEG);
      var P = sampleLoop(K, K.sTail + K.swum + u);
      var nx = -P[3], ny = P[2], cx = P[0], cy = P[1];
      var back = clamp((L - u) / L, 0, 1.15);        // 0 at the head, 1 at the tail
      var w = K.amp * Math.pow(back, 1.6) * Math.sin(K.phase - back * 5.0);
      for (var r = 0; r <= KROWS; r++) {
        var v = lerp(vA, vB, r / KROWS) + w;
        cur[2 * r] = sx(cx + nx * v);
        cur[2 * r + 1] = sy(cy + ny * v);
      }
      var tu = lerp(K.uv[0], K.uv[2], j / KSEG);
      if (j > 0) {
        for (var q = 0; q < KROWS; q++) {
          var t0 = lerp(K.uv[1], K.uv[3], q / KROWS), t1 = lerp(K.uv[1], K.uv[3], (q + 1) / KROWS);
          vtx(prev[2 * q], prev[2 * q + 1], pu, t0, 1);
          vtx(cur[2 * q], cur[2 * q + 1], tu, t0, 1);
          vtx(cur[2 * q + 2], cur[2 * q + 3], tu, t1, 1);
          vtx(prev[2 * q], prev[2 * q + 1], pu, t0, 1);
          vtx(cur[2 * q + 2], cur[2 * q + 3], tu, t1, 1);
          vtx(prev[2 * q + 2], prev[2 * q + 3], pu, t1, 1);
        }
      }
      var swap = prev; prev = cur; cur = swap; pu = tu;
    }
  }

  function render() {
    if (!glOK) return;
    nv = 0;
    var i, q;
    // 1. koi (under the surface)
    for (i = 0; i < koi.length; i++) drawKoi(koi[i]);
    // 2. ripples and floating petals (on the surface)
    for (i = 0; i < ripples.length; i++) {
      var r = ripples[i], t = r.age / 1.8, size = 0.25 + t * 1.25;
      quad(RIPPLE, RIPPLE.w / 2, RIPPLE.h / 2, sx(r.x), sy(r.y), s, size, size * 0.78, 0, 0.55 * Math.pow(1 - t, 1.6));
    }
    for (i = 0; i < petals.length; i++) {
      q = petals[i];
      if (q.state !== "water") continue;
      var F = PETAL_FRAMES[q.f];
      quad(F, F.w / 2, F.h / 2, sx(q.wx), sy(q.wy), s * q.scale * 0.8, q.mirror, 0.8, q.wr, q.a);
    }
    // 3. butterflies
    for (i = 0; i < butterflies.length; i++) {
      var b = butterflies[i];
      if (b.e >= 0.9995) continue;
      var pos = bezier(FLIGHT[i], b.e), e = b.e;
      var wob = Math.sin(e * Math.PI) * 16;
      var bx = pos[0] + Math.sin(e * 23 + i) * wob + (e > 0 && e < 1 ? Math.sin(clock * 1.7 + i) * 2.5 : 0);
      var by = pos[1] + Math.cos(e * 17 + i * 2) * wob * 0.6 + (e > 0 && e < 1 ? Math.sin(clock * 2.3 + i) * 3 : 0);
      var open = Math.cos(b.flap * (0.5 - 0.5 * Math.cos(b.flapT * TAU)));   // 1 = wings flat open
      var scale = s * (1 - 0.28 * e);
      var rot = b.heading + Math.PI / 2;                                       // sprite faces up
      quad(b.L, b.L.ax, b.L.ay, sx(bx), sy(by), scale, open, 1, rot, 1);
      quad(b.R, b.R.ax, b.R.ay, sx(bx), sy(by), scale, open, 1, rot, 1);
    }
    // 4. petals in the air (screen space)
    for (i = 0; i < petals.length; i++) {
      q = petals[i];
      if (q.state !== "air") continue;
      var G = PETAL_FRAMES[q.f], flip = Math.cos(q.fallen * q.freq * q.flipRate);
      if (Math.abs(flip) < 0.14) flip = flip < 0 ? -0.14 : 0.14;
      quad(G, G.w / 2, G.h / 2, q.x, q.y, s * q.scale, q.mirror, flip, q.rot, q.a);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!nv) return;
    gl.uniform2f(uView, vw, vh);
    gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, nv * 5), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, nv);
  }

  // ------------------------------------------------------------------ loop
  var running = false, last = 0, ready = false;

  // While you read a frosted section (no clear window on screen) and aren't
  // scrolling, the idle motion behind it only needs half the frame rate.
  var clearOnScreen = true, skip = false;
  if (window.IntersectionObserver) {
    var onScreen = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var k = onScreen.indexOf(e.target);
        if (e.isIntersecting && k < 0) onScreen.push(e.target);
        if (!e.isIntersecting && k >= 0) onScreen.splice(k, 1);
      });
      clearOnScreen = onScreen.length > 0;
    });
    var clearEls = document.querySelectorAll("[data-garden-focus], [data-garden-clear]");
    for (var ce = 0; ce < clearEls.length; ce++) io.observe(clearEls[ce]);
  }

  var stats = { ms: 0 };                 // average JS time per frame, for tuning
  function tick(now) {
    if (!running) return;
    if (!clearOnScreen && activity < 5 && Math.abs((window.scrollY || 0) - scrollS) < 0.5 && (skip = !skip)) {
      requestAnimationFrame(tick);
      return;
    }
    var t0 = performance.now();
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    if (!(dt > 0.0005)) dt = 0.0005;        // repeated timestamps would divide by zero below
    last = now;
    clock += dt;
    life = CFG.idle ? smooth(0.8, 2.6, clock) : 0;    // idle motion eases in after load
    var target = window.scrollY || window.pageYOffset || 0;
    scrollS += (target - scrollS) * damp(dt, 16);
    if (Math.abs(target - scrollS) < 0.05) scrollS = target;
    var dScroll = Math.min(160, Math.abs(scrollS - scrollPrev));
    scrollPrev = scrollS;
    activity = lerp(activity, dScroll / dt, damp(dt, 5));

    cam = camFor(scrollS);
    plate.style.transform = "translate3d(" + ox.toFixed(2) + "px," + (-cam).toFixed(2) + "px,0)";
    updatePetals(dt, dScroll);
    updateButterflies(dt);
    updateKoi(dt, dScroll);
    render();
    stats.ms += (performance.now() - t0 - stats.ms) * 0.05;

    // with idle motion off, sleep once everything has settled; scrolling wakes it
    if (!CFG.idle && dScroll < 0.01 && activity < 1) { running = false; last = 0; return; }
    requestAnimationFrame(tick);
  }
  function wake() {
    if (running || reduced || !ready || document.hidden) return;
    running = true; last = 0;
    requestAnimationFrame(tick);
  }

  // The untouched painting (sprites baked in). Reduced motion: also stop panning.
  // No WebGL: keep panning with scroll, just without the animated pieces.
  function showStill() {
    canvas.style.display = "none";
    plate.removeAttribute("srcset");
    plate.src = URL_.painting;
    if (reduced) { running = false; cam = 0; }
    else cam = camFor(window.scrollY || 0);
    plate.style.transform = "translate3d(" + ox + "px," + (-cam) + "px,0)";
  }

  function start() {
    layout();
    scrollS = scrollPrev = window.scrollY || window.pageYOffset || 0;
    cam = camFor(scrollS);
    plate.style.transform = "translate3d(" + ox + "px," + (-cam) + "px,0)";
    seedPetals(); seedButterflies(); seedKoi();
    ready = true;
    if (reduced || !initGL()) showStill();
    else render();
    root.classList.add("is-ready");
    wake();
  }

  // ------------------------------------------------------------------ boot
  var pending = 2;
  function loaded() { if (--pending === 0) start(); }
  plate.onload = loaded;
  plate.onerror = loaded;
  layout();                                // sets sizes so srcset picks the right plate
  if (reduced) { plate.src = URL_.painting; pending = 1; }
  else {
    plate.srcset = plateSrcset();
    plate.src = URL_.plate;
    atlasImg = new Image();
    atlasImg.onload = loaded;
    atlasImg.onerror = function () { glOK = false; loaded(); };
    atlasImg.src = URL_.sprites;
  }

  var relayout = 0;
  function scheduleLayout() {
    if (relayout) return;
    relayout = requestAnimationFrame(function () {
      relayout = 0;
      var oldS = s, oldOx = ox, oldCam = cam;
      layout();
      // keep airborne petals over the same part of the painting
      for (var i = 0; i < petals.length; i++) {
        var q = petals[i];
        if (q.state !== "air") continue;
        var fx = (q.x - oldOx) / oldS, fy = (q.y + oldCam) / oldS;
        q.x0 += sx(fx) - q.x; q.y0 += (fy * s - camFor(scrollS)) - q.y;
      }
      if (!running) { cam = camFor(scrollS); plate.style.transform = "translate3d(" + ox + "px," + (-cam) + "px,0)"; render(); }
    });
  }
  window.addEventListener("resize", scheduleLayout);
  if (window.ResizeObserver) new ResizeObserver(function () { readAnchors(); }).observe(document.body);
  window.addEventListener("load", readAnchors);
  window.addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) wake(); else { running = false; last = 0; } });
  window.addEventListener("pageshow", wake);
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); glOK = false; running = false; });
  canvas.addEventListener("webglcontextrestored", function () { if (initGL()) wake(); });
  if (reduceQuery) {
    // the visitor switched motion back on (or off) while the page is open
    var onChange = function () {
      reduced = reduceQuery.matches;
      if (reduced) { showStill(); return; }
      var resume = function () {
        if (glOK || initGL()) {
          canvas.style.display = "";
          plate.srcset = plateSrcset();
          plate.src = URL_.plate;
        } else showStill();
        wake();
      };
      if (atlasImg && atlasImg.complete && atlasImg.naturalWidth) resume();
      else {
        atlasImg = new Image();
        atlasImg.onload = resume;
        atlasImg.onerror = function () { showStill(); wake(); };
        atlasImg.src = URL_.sprites;
      }
    };
    if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", onChange);
    else if (reduceQuery.addListener) reduceQuery.addListener(onChange);
  }

  // small handle for tuning in the console: BOG_GARDEN.config.fall = 0.8
  window.BOG_GARDEN = { config: CFG, stats: stats, relayout: scheduleLayout };
})();
