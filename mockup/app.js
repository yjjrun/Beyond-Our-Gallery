/* ============================================================
   Beyond Our Gallery — landing concept
   ------------------------------------------------------------
   Engine responsibilities (kept strictly separate so that no two
   libraries ever write to the same element's transform):

     WebGL (three.js) ... the painting, its lighting, particles, camera
     GSAP ScrollTrigger  the pinned hero timeline: wall, visitor,
                         opening titles, HUD, and the WebGL state object
     CSS + small JS ..... post-hero UI: cards, toggle, rings, accordion

   GSAP animates the hero DOM layers and a plain JS object (view) that
   the render loop reads. It never touches a .card/.vt/.cat, and the
   post-hero CSS never touches a hero layer.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ----------------------------------------------------------
     Shared scroll-driven state. GSAP writes it; WebGL reads it.
     ---------------------------------------------------------- */
  var view = {
    spin: 0,        // 0 → 1 : painting rotates 180°
    dolly: 0,       // 0 → 1 : camera pushes in and finally through
    scatter: 1,     // 1 = paint particles, 0 = data lattice
    glow: 0,        // rim/emissive lift
    through: 0      // 0 → 1 : pass through the canvas
  };

  /* ============================================================
     1. THE PAINTING (three.js)
     ============================================================ */
  var three = null;

  /* one shared set of brush strokes, used by both the colour and bump maps
     so the relief lines up exactly with the paint */
  var strokes = (function () {
    var out = [];
    for (var i = 0; i < 900; i++) {
      var sx = Math.random() * 1024, sy = Math.random() * 1024;
      var a = Math.random() * Math.PI * 2, len = 24 + Math.random() * 150;
      out.push({
        x: sx, y: sy,
        cx: sx + Math.cos(a) * len * .6 + (Math.random() - .5) * 50,
        cy: sy + Math.sin(a) * len * .6 + (Math.random() - .5) * 50,
        ex: sx + Math.cos(a) * len,
        ey: sy + Math.sin(a) * len,
        w: 1.5 + Math.random() * 9,
        a: Math.random(),
        lit: Math.random() > .5
      });
    }
    return out;
  })();

  function paintTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 1024;
    var x = c.getContext('2d');

    x.fillStyle = '#123a31';
    x.fillRect(0, 0, 1024, 1024);

    // green ground, worked with a palette knife
    var i, g;
    for (i = 0; i < 300; i++) {
      g = x.createLinearGradient(0, 0, 1024, 1024);
      var t = Math.random();
      g.addColorStop(0, t > .5 ? 'rgba(22,78,66,.92)' : 'rgba(11,94,92,.8)');
      g.addColorStop(1, 'rgba(8,44,38,.9)');
      x.fillStyle = g;
      x.save();
      x.translate(Math.random() * 1024, Math.random() * 1024);
      x.rotate(Math.random() * Math.PI);
      x.fillRect(-140, -16, 280, 32);
      x.restore();
    }

    // pink worked through the middle as knife strokes, not fog
    for (i = 0; i < 260; i++) {
      var cx = 512 + (Math.random() - .5) * 700;
      var cy = 512 + (Math.random() - .5) * 700;
      var d = 1 - Math.min(1, Math.hypot(cx - 512, cy - 512) / 560);
      if (Math.random() > .32 + d * .3) continue;   // spread, don't clump
      x.save();
      x.translate(cx, cy);
      x.rotate(Math.random() * Math.PI);
      var pink = Math.random() > .55
        ? 'rgba(224,126,160,' + (.42 + Math.random() * .34) + ')'
        : 'rgba(128,70,105,' + (.4 + Math.random() * .38) + ')';
      x.fillStyle = pink;
      var bw = 34 + Math.random() * 150, bh = 10 + Math.random() * 30;
      x.beginPath();
      if (x.roundRect) x.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
      else x.rect(-bw / 2, -bh / 2, bw, bh);
      x.fill();
      x.restore();
    }

    // a few soft blooms to hold the composition together
    for (i = 0; i < 26; i++) {
      var bx = 512 + (Math.random() - .5) * 560;
      var by = 512 + (Math.random() - .5) * 560;
      var br = 80 + Math.random() * 190;
      g = x.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, 'rgba(239,145,177,.22)');
      g.addColorStop(1, 'rgba(239,145,177,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(bx, by, br, 0, 6.2832); x.fill();
    }

    /* Only a whisper of tonal variation in the COLOUR map. The ridges
       that catch the light live in the bump map instead — painting white
       highlights into the colour map blows the artwork out once lit. */
    x.lineCap = 'round';
    strokes.forEach(function (s) {
      x.strokeStyle = s.lit
        ? 'rgba(255,255,255,' + (.03 + s.a * .09) + ')'
        : 'rgba(0,0,0,' + (.04 + s.a * .16) + ')';
      x.lineWidth = s.w;
      x.beginPath();
      x.moveTo(s.x, s.y);
      x.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
      x.stroke();
    });
    return c;
  }

  /* the same strokes, rendered as height, so light rakes across them */
  function bumpTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 1024;
    var x = c.getContext('2d');
    x.fillStyle = '#808080';
    x.fillRect(0, 0, 1024, 1024);
    x.lineCap = 'round';
    strokes.forEach(function (s) {
      x.strokeStyle = s.lit
        ? 'rgba(255,255,255,' + (.35 + s.a * .5) + ')'
        : 'rgba(0,0,0,' + (.3 + s.a * .45) + ')';
      x.lineWidth = s.w;
      x.beginPath();
      x.moveTo(s.x, s.y);
      x.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
      x.stroke();
    });
    // canvas weave
    x.globalAlpha = .16;
    for (var i = 0; i < 1024; i += 3) {
      x.strokeStyle = i % 6 ? '#ffffff' : '#000000';
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1024); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(1024, i); x.stroke();
    }
    x.globalAlpha = 1;
    return c;
  }

  /* the reverse of the canvas: the research */
  function dataTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 1024;
    var x = c.getContext('2d');
    x.fillStyle = '#06211e';
    x.fillRect(0, 0, 1024, 1024);

    // faint grid
    x.strokeStyle = 'rgba(255,255,255,.06)';
    x.lineWidth = 1;
    for (var i = 0; i <= 16; i++) {
      var p = (i / 16) * 1024;
      x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 1024); x.stroke();
      x.beginPath(); x.moveTo(0, p); x.lineTo(1024, p); x.stroke();
    }

    // headline
    x.fillStyle = '#ef91b1';
    x.font = '700 30px Manrope, sans-serif';
    x.fillText('BEYOND OUR GALLERY', 88, 130);
    x.fillStyle = '#ffffff';
    x.font = '600 64px Georgia, serif';
    x.fillText('Research score', 88, 214);

    // a rising series
    var pts = [.18, .30, .24, .46, .40, .58, .66, .62, .80, .88];
    var x0 = 96, y0 = 800, w = 832, h = 420;
    x.strokeStyle = '#25b4a6';
    x.lineWidth = 7;
    x.lineJoin = x.lineCap = 'round';
    x.beginPath();
    pts.forEach(function (v, k) {
      var px = x0 + (k / (pts.length - 1)) * w;
      var py = y0 - v * h;
      k ? x.lineTo(px, py) : x.moveTo(px, py);
    });
    x.stroke();

    // area under it
    x.lineTo(x0 + w, y0); x.lineTo(x0, y0); x.closePath();
    x.fillStyle = 'rgba(37,180,166,.16)';
    x.fill();

    // columns
    var bars = [.30, .52, .40, .68, .58, .82];
    bars.forEach(function (v, k) {
      var bw = 78, gap = 52;
      var bx = x0 + k * (bw + gap);
      x.fillStyle = k % 2 ? 'rgba(239,145,177,.85)' : 'rgba(143,81,119,.85)';
      x.fillRect(bx, y0 + 40, bw, v * 120);
    });

    x.fillStyle = 'rgba(255,255,255,.55)';
    x.font = '600 22px Manrope, sans-serif';
    x.fillText('FY2021        FY2022        FY2023        FY2024        FY2025', 96, 990);
    return c;
  }

  /* a small studio, baked into an environment map for real reflections */
  function environment(renderer) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(.45, '#efe6e8');
    g.addColorStop(1, '#c9bcc1');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    // two soft gallery lights
    [[130, 60, 70], [370, 48, 54]].forEach(function (l) {
      var rg = x.createRadialGradient(l[0], l[1], 0, l[0], l[1], l[2]);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = rg;
      x.beginPath(); x.arc(l[0], l[1], l[2], 0, 6.2832); x.fill();
    });
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose(); tex.dispose();
    return env;
  }

  function initThree() {
    var canvas = document.getElementById('gl');
    if (!canvas || typeof THREE === 'undefined') return null;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return null; }
    if (!renderer.getContext()) return null;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    /* ACES desaturates hard and lifts the midtones; on a green/pink
       artwork it drains the colour out entirely. Linear keeps the paint. */
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = .92;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, .1, 100);
    camera.position.set(0, 0, 7.4);

    var env = environment(renderer);
    scene.environment = env;

    // ---- the painting -------------------------------------------------
    var group = new THREE.Group();
    scene.add(group);

    var front = new THREE.CanvasTexture(paintTexture());
    front.anisotropy = renderer.capabilities.getMaxAnisotropy();
    /* colour maps must declare sRGB, or the renderer treats them as
       linear and the artwork washes out to near-white. */
    front.encoding = THREE.sRGBEncoding;
    var bump = new THREE.CanvasTexture(bumpTexture());
    bump.anisotropy = front.anisotropy;
    var back = new THREE.CanvasTexture(dataTexture());
    back.anisotropy = front.anisotropy;
    back.encoding = THREE.sRGBEncoding;

    var W = 2.5, H = 3.15, D = .13;

    var faceFront = new THREE.MeshPhysicalMaterial({
      map: front, roughness: .46, metalness: 0,
      clearcoat: .8, clearcoatRoughness: .24,
      envMapIntensity: .3,
      bumpMap: bump, bumpScale: .055
    });
    var faceBack = new THREE.MeshPhysicalMaterial({
      map: back, roughness: .52, metalness: .05,
      clearcoat: .5, clearcoatRoughness: .3,
      envMapIntensity: .7
    });
    var edge = new THREE.MeshPhysicalMaterial({ color: '#f2ece9', roughness: .7, metalness: 0 });

    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    var canvasMesh = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, D),
      [edge, edge, edge, edge, faceFront, faceBack]
    );
    group.add(canvasMesh);

    // slim gallery frame — warm off-white, so it reads against the paint
    var frameMat = new THREE.MeshPhysicalMaterial({
      color: '#efe7e2', roughness: .32, metalness: .12,
      clearcoat: .6, clearcoatRoughness: .25, envMapIntensity: 1.3
    });
    var fT = .1, fD = .22;
    [
      [0, H / 2 + fT / 2, 0, W + fT * 2, fT, fD],
      [0, -H / 2 - fT / 2, 0, W + fT * 2, fT, fD],
      [-W / 2 - fT / 2, 0, 0, fT, H, fD],
      [W / 2 + fT / 2, 0, 0, fT, H, fD]
    ].forEach(function (s) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(s[3], s[4], s[5]), frameMat);
      m.position.set(s[0], s[1], s[2]);
      group.add(m);
    });

    // ---- particles: paint motes that become a data lattice -------------
    var N = 420;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var homeA = new Float32Array(N * 3); // scattered in the air
    var homeB = new Float32Array(N * 3); // ordered lattice
    var seed = new Float32Array(N);
    var cGreen = new THREE.Color('#25b4a6');
    var cPink = new THREE.Color('#ef91b1');
    var cPlum = new THREE.Color('#8f5177');

    for (var i = 0; i < N; i++) {
      var a = Math.random() * Math.PI * 2;
      var rr = 1.35 + Math.random() * 1.35;              // hug the canvas
      homeA[i * 3] = Math.cos(a) * rr;
      homeA[i * 3 + 1] = (Math.random() - .5) * 3.6;
      homeA[i * 3 + 2] = Math.sin(a) * rr * .42 + .25 + Math.random() * .7;

      var cols = 21, row = Math.floor(i / cols), cl = i % cols;
      homeB[i * 3] = (cl / (cols - 1) - .5) * (W * .92);
      homeB[i * 3 + 1] = (row / (N / cols - 1) - .5) * (H * .9);
      homeB[i * 3 + 2] = D / 2 + .06 + Math.random() * .05;

      pos[i * 3] = homeA[i * 3];
      pos[i * 3 + 1] = homeA[i * 3 + 1];
      pos[i * 3 + 2] = homeA[i * 3 + 2];

      var mix = Math.random();
      var c = mix < .42 ? cGreen : (mix < .8 ? cPink : cPlum);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      seed[i] = Math.random() * 6.2832;
    }

    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // soft round sprite, so motes read as paint rather than pixels
    var sprite = (function () {
      var s = document.createElement('canvas'); s.width = s.height = 64;
      var sx = s.getContext('2d');
      var rg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(.35, 'rgba(255,255,255,.65)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      sx.fillStyle = rg; sx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(s);
    })();
    var points = new THREE.Points(pg, new THREE.PointsMaterial({
      size: .085, map: sprite, vertexColors: true, transparent: true, opacity: .62,
      depthWrite: false, sizeAttenuation: true
    }));
    group.add(points);

    // ---- lights --------------------------------------------------------
    /* Lighting is deliberately restrained: the paint should read as paint.
       Over-bright point lights turn a glossy surface into two smeared
       highlights and hide the texture entirely. */
    scene.add(new THREE.AmbientLight('#ffffff', .5));
    var key = new THREE.SpotLight('#fff6f2', 2.2, 30, .62, .75, 1.2);
    key.position.set(2.4, 6.0, 6.2); scene.add(key);
    var fillPink = new THREE.PointLight('#ef91b1', 1.6, 18);
    fillPink.position.set(-3.6, 1.4, 3.6); scene.add(fillPink);
    var fillTeal = new THREE.PointLight('#25b4a6', 1.3, 18);
    fillTeal.position.set(3.4, -1.6, 3.4); scene.add(fillTeal);
    var rim = new THREE.DirectionalLight('#ffffff', .7);
    rim.position.set(-1.8, 2.2, -3.4); scene.add(rim);

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);

    // gentle pointer response — the picture notices you
    var px = 0, py = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });

    var clock = new THREE.Clock();
    var parr = pg.attributes.position.array;

    function frame() {
      requestAnimationFrame(frame);
      var t = clock.getElapsedTime();

      px += (tx - px) * .05;
      py += (ty - py) * .05;

      // rotation: idle drift, then the deliberate 180° turn
      var idle = Math.sin(t * .34) * .1;
      group.rotation.y = idle * (1 - view.spin) + view.spin * Math.PI + px * .14 * (1 - view.spin);
      group.rotation.x = Math.sin(t * .27) * .035 - py * .07 * (1 - view.spin);

      // scale and camera push
      var s = 1 + view.dolly * .5;
      group.scale.setScalar(s);
      camera.position.z = 7.4 - view.dolly * 3.1 - view.through * 3.6;
      camera.position.x = px * .18 * (1 - view.dolly);
      camera.position.y = -py * .12 * (1 - view.dolly);
      camera.lookAt(0, 0, 0);

      // particles drift, then settle into the lattice
      for (var i = 0; i < N; i++) {
        var i3 = i * 3, k = view.scatter;
        var wob = Math.sin(t * .7 + seed[i]) * .12 * k;
        parr[i3] = homeA[i3] * k + homeB[i3] * (1 - k) + wob;
        parr[i3 + 1] = (homeA[i3 + 1] + Math.sin(t * .5 + seed[i]) * .18) * k + homeB[i3 + 1] * (1 - k);
        parr[i3 + 2] = homeA[i3 + 2] * k + homeB[i3 + 2] * (1 - k);
      }
      pg.attributes.position.needsUpdate = true;
      points.material.opacity = .38 + .34 * (1 - Math.abs(view.scatter - .5) * 1.1) + view.glow * .22;
      points.material.size = .085 - (1 - view.scatter) * .042;

      fillPink.intensity = 9 + view.glow * 14;
      fillTeal.intensity = 8 + view.glow * 10;
      renderer.toneMappingExposure = .92 + view.glow * .25;

      renderer.render(scene, camera);
    }
    frame();

    return { renderer: renderer, resize: resize };
  }

  three = initThree();
  if (!three) {
    var fb = document.getElementById('glFallback');
    var gl = document.getElementById('gl');
    if (fb) fb.hidden = false;
    if (gl) gl.style.display = 'none';
  }

  /* ============================================================
     2. THE SCROLL SCREENPLAY (GSAP ScrollTrigger)
     ============================================================ */
  var counted = new WeakSet();
  function countTo(el) {
    if (counted.has(el)) return;
    counted.add(el);
    var target = parseFloat(el.dataset.count);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var dec = (String(target).split('.')[1] || '').length;
    var t0 = performance.now(), D = 1300;
    (function step(now) {
      var p = Math.min(1, (now - t0) / D);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  if (hasGSAP && !REDUCE) {
    var wall = document.getElementById('wall');
    var visitor = document.getElementById('visitor');
    var opening = document.getElementById('opening');
    var hud = document.getElementById('hud');
    var hudRing = document.getElementById('hudRing');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stage',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.1
      }
    });

    /* 0–20% — depth. The wall drifts; the visitor and her shadow move
       faster, so the room gains a front and a back.                     */
    tl.to(wall, { yPercent: -4, scale: 1.05, ease: 'none', duration: 20 }, 0)
      .to(visitor, { yPercent: -1, xPercent: -6, ease: 'none', duration: 20 }, 0)
      .to(opening, { yPercent: -8, ease: 'none', duration: 20 }, 0);

    /* 20–45% — she walks out to the right; the painting swells.         */
    tl.to(visitor, { xPercent: 165, opacity: .1, ease: 'power1.in', duration: 25 }, 20)
      .to(opening, { opacity: 0, yPercent: -26, ease: 'power1.in', duration: 16 }, 20)
      .to(wall, { opacity: .55, scale: 1.14, ease: 'none', duration: 25 }, 20)
      .to(view, { dolly: .55, ease: 'none', duration: 25 }, 20);

    /* 45–70% — the turn. Paint motes resolve into data points.          */
    tl.to(view, { spin: 1, ease: 'power2.inOut', duration: 25 }, 45)
      .to(view, { scatter: 0, ease: 'power1.inOut', duration: 22 }, 47)
      .to(view, { glow: 1, ease: 'sine.inOut', duration: 14 }, 50)
      .to(wall, { opacity: .18, ease: 'none', duration: 25 }, 45);

    /* 70–90% — the figures arrive and count; the score ring fills.      */
    tl.to(hud, { opacity: 1, ease: 'power2.out', duration: 8 }, 70)
      .to(view, { dolly: .9, ease: 'none', duration: 20 }, 70);

    ScrollTrigger.create({
      trigger: '#stage',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) {
        var p = self.progress;
        if (p > .72) {
          hud.querySelectorAll('[data-count]').forEach(countTo);
          if (hudRing) hudRing.style.strokeDashoffset = String(327 - 327 * 0.593);
        }
        var fill = document.getElementById('routeFill');
        if (fill) fill.style.width = (p * 100 * 0.55) + '%';
      }
    });

    /* 90–100% — through the canvas, and out into the platform.          */
    tl.to(view, { through: 1, ease: 'power2.in', duration: 10 }, 90)
      .to(hud, { opacity: 0, ease: 'power1.in', duration: 6 }, 91)
      .to('.stage-pin', { opacity: 0, ease: 'power1.in', duration: 6 }, 94);

  } else {
    // reduced motion / no GSAP: hand the reader a static, legible stage
    var hudEl = document.getElementById('hud');
    if (hudEl) {
      hudEl.style.opacity = 1;
      hudEl.querySelectorAll('[data-count]').forEach(function (el) {
        var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
        el.textContent = pre + el.dataset.count + suf;
      });
      var r = document.getElementById('hudRing');
      if (r) r.style.strokeDashoffset = String(327 - 327 * 0.593);
    }
    view.spin = 0; view.scatter = 1;
  }

  /* whole-page progress line */
  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var fill = document.getElementById('routeFill');
    if (fill && max > 0) fill.style.width = (window.scrollY / max * 100) + '%';
  }, { passive: true });

  /* ============================================================
     3. THE PLATFORM — cards, toggle, rings, accordion
     ============================================================ */
  var COMPANIES = [
    {
      name: 'Kingsmen Creatives', ticker: 'SGX: 5MZ', sector: 'Experiential',
      img: '../assets/strategy-visitors.jpg',
      alt: 'Visitors inside an immersive exhibition',
      blurb: 'Experience-design group with regional exhibitions, museums and brand activation exposure.',
      thesis: 'Design-and-build for the experience economy — margin, not volume, is what moves earnings.',
      score: 59.3, href: '../kingsmen-creatives.html',
      bars: [['Fin', 61], ['Mkt', 54], ['Grw', 61], ['Risk', 60]],
      series: [.30, .42, .38, .55, .49, .62, .58, .71]
    },
    {
      name: 'Straco Corporation', ticker: 'SGX: S85', sector: 'Attractions',
      img: '../assets/straco-flyer-skyline.webp',
      alt: 'The Singapore Flyer at dusk above the city skyline',
      blurb: 'Owner-operator of tourism attractions where visitor recovery supports a patient quality case.',
      thesis: 'Exceptional balance sheet and asset economics, held back by concentration and cyclicality.',
      score: 67.3, href: '../straco-corporation.html',
      bars: [['Fin', 88], ['Mkt', 58], ['Grw', 42], ['Risk', 65]],
      series: [.22, .18, .52, .60, .56, .48, .40, .46]
    },
    {
      name: 'mm2 Asia', ticker: 'SGX: 1B0', sector: 'Film & Media',
      img: '../assets/rd-bicentennial.jpg',
      alt: 'A projected immersive gallery interior',
      blurb: 'Content and cinema platform with restructuring optionality and a still-speculative risk profile.',
      thesis: 'Rights and cinema assets remain relevant; leverage and execution decide the outcome.',
      score: 68, href: '../index.html#company-gallery',
      bars: [['Fin', 52], ['Mkt', 70], ['Grw', 74], ['Risk', 56]],
      series: [.60, .44, .30, .38, .34, .46, .52, .58]
    }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';
  function sparkline(series) {
    var w = 260, h = 56, n = series.length;
    var pts = series.map(function (v, i) {
      return [(i / (n - 1)) * w, h - v * (h - 8) - 4];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('');
    var area = d + 'L' + w + ',' + h + 'L0,' + h + 'Z';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'spark');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    var pa = document.createElementNS(SVG_NS, 'path');
    pa.setAttribute('class', 'ar'); pa.setAttribute('d', area);
    var pl = document.createElementNS(SVG_NS, 'path');
    pl.setAttribute('class', 'ln'); pl.setAttribute('d', d);
    svg.appendChild(pa); svg.appendChild(pl);
    pts.forEach(function (p, i) {
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 4);
      c.dataset.label = 'FY' + (2018 + i);
      c.dataset.value = Math.round(series[i] * 100) + ' index';
      svg.appendChild(c);
    });
    // draw once
    var len = pl.getTotalLength ? 0 : 0;
    return { svg: svg, line: pl };
  }

  var cardsEl = document.getElementById('cards');
  var lines = [];
  if (cardsEl) {
    COMPANIES.forEach(function (co, idx) {
      var card = document.createElement('article');
      card.className = 'card';
      card.style.transitionDelay = (idx * 90) + 'ms';

      var tilt = document.createElement('div');
      tilt.className = 'card-tilt';

      var media = document.createElement('div');
      media.className = 'card-media';
      media.innerHTML =
        '<img src="' + co.img + '" alt="' + co.alt + '" loading="lazy">' +
        '<span class="card-sector">' + co.sector + '</span>' +
        '<div class="card-veil">' +
        '<span class="tk">' + co.ticker + '</span>' +
        '<div class="sc"><b>' + co.score.toFixed(1) + '</b><span>Weighted score</span></div>' +
        '<p class="th">' + co.thesis + '</p>' +
        '</div>';

      var body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML =
        '<span class="tk">' + co.ticker + '</span>' +
        '<h3>' + co.name + '</h3>' +
        '<p>' + co.blurb + '</p>' +
        '<div class="ringwrap">' +
        '<svg class="ring" viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/>' +
        '<circle class="fg" cx="30" cy="30" r="26"/></svg>' +
        '<div><div class="v">' + co.score.toFixed(1) + '</div><div class="l">out of 100</div></div>' +
        '</div>';

      var analyst = document.createElement('div');
      analyst.className = 'card-analyst';
      analyst.innerHTML = '<div class="bars">' + co.bars.map(function (b) {
        return '<div class="bar"><span>' + b[0] + '</span><i><b data-w="' + b[1] + '"></b></i><em>' + b[1] + '</em></div>';
      }).join('') + '</div>';
      var sp = sparkline(co.series);
      analyst.appendChild(sp.svg);
      lines.push(sp.line);

      tilt.appendChild(media);
      tilt.appendChild(body);
      tilt.appendChild(analyst);
      card.appendChild(tilt);

      var link = document.createElement('a');
      link.href = co.href;
      link.setAttribute('aria-label', 'Read the ' + co.name + ' analysis');
      link.style.cssText = 'position:absolute;inset:0;z-index:3';
      card.appendChild(link);

      card.dataset.score = co.score;
      cardsEl.appendChild(card);
    });
  }

  /* reveal + ring fill + bar fill, once each */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      var fg = el.querySelector ? el.querySelector('.ring .fg') : null;
      if (fg && el.dataset.score) {
        var C = 163;
        fg.style.strokeDashoffset = String(C - C * (parseFloat(el.dataset.score) / 100));
      }
      el.querySelectorAll && el.querySelectorAll('.bar i b').forEach(function (b) {
        b.style.width = b.dataset.w + '%';
      });
      var ln = el.querySelector && el.querySelector('.spark .ln');
      if (ln && ln.getTotalLength) {
        var L = ln.getTotalLength();
        ln.style.strokeDasharray = L;
        ln.style.strokeDashoffset = L;
        ln.getBoundingClientRect();
        ln.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.8,.25,1)';
        ln.style.strokeDashoffset = '0';
      }
      io.unobserve(el);
    });
  }, { threshold: .2, rootMargin: '0px 0px -40px 0px' });

  function activate(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    var fg = el.querySelector('.ring .fg');
    if (fg && el.dataset.score) {
      var C = 163;
      fg.style.strokeDashoffset = String(C - C * (parseFloat(el.dataset.score) / 100));
    }
    el.querySelectorAll('.bar i b').forEach(function (b) { b.style.width = b.dataset.w + '%'; });
    var ln = el.querySelector('.spark .ln');
    if (ln && ln.getTotalLength) {
      var L = ln.getTotalLength();
      ln.style.strokeDasharray = L;
      ln.style.strokeDashoffset = L;
      ln.getBoundingClientRect();
      ln.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.8,.25,1)';
      ln.style.strokeDashoffset = '0';
    }
  }

  var watched = [];
  document.querySelectorAll('.reveal, .card').forEach(function (el) {
    if (REDUCE) { activate(el); return; }
    watched.push(el);
    io.observe(el);
  });

  /* IntersectionObserver is the fast path, but it does not deliver in every
     context (a background or non-painting tab, for one). A cheap sweep on
     scroll guarantees nothing is ever left stranded at opacity 0. */
  function sweep() {
    if (!watched.length) return;
    var vh = window.innerHeight;
    watched = watched.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > 0) { activate(el); io.unobserve(el); return false; }
      return true;
    });
  }
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep);
  sweep();
  setTimeout(sweep, 300);
  if (REDUCE) {
    document.querySelectorAll('.card').forEach(function (el) {
      var fg = el.querySelector('.ring .fg');
      if (fg) fg.style.strokeDashoffset = String(163 - 163 * (parseFloat(el.dataset.score) / 100));
      el.querySelectorAll('.bar i b').forEach(function (b) { b.style.width = b.dataset.w + '%'; });
    });
  }

  /* cursor tilt — CSS transform on .card-tilt only, never on .card */
  if (!REDUCE && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      var tiltEl = card.querySelector('.card-tilt');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5;
        var dy = (e.clientY - r.top) / r.height - .5;
        tiltEl.style.transform =
          'perspective(900px) rotateY(' + (dx * 6).toFixed(2) + 'deg) rotateX(' + (-dy * 6).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { tiltEl.style.transform = ''; });
    });
  }

  /* gallery / analyst toggle */
  var pill = document.querySelector('.vt-pill');
  var vts = Array.prototype.slice.call(document.querySelectorAll('.vt'));
  function movePill(btn) {
    if (!pill || !btn) return;
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + (btn.offsetLeft - 5) + 'px)';
  }
  vts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      vts.forEach(function (b) { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-selected', b === btn); });
      document.body.dataset.view = btn.dataset.view;
      movePill(btn);
    });
  });
  if (vts.length) { document.body.dataset.view = 'gallery'; requestAnimationFrame(function () { movePill(vts[0]); }); }
  window.addEventListener('resize', function () {
    var on = document.querySelector('.vt.is-on');
    movePill(on);
  });

  /* method accordion */
  var CATS = [
    { w: 40, n: 'Financial Strength', s: 'Balance sheet, cash generation and profitability trend', rows: [['Five-year revenue CAGR', 6], ['Median net margin', 7], ['Median ROIC', 9], ['Cash-flow stability', 9], ['Balance-sheet strength', 9]] },
    { w: 20, n: 'Market Position', s: 'Brand, competitive advantage and client concentration', rows: [['Brand recognition', 2], ['Competitive advantage', 7], ['Market share', 4], ['Customer relationships', 5], ['Geographic reach', 2]] },
    { w: 25, n: 'Growth Opportunities', s: 'Industry direction, technology and expansion pipeline', rows: [['Industry growth potential', 6], ['Technology adoption', 4], ['New-market expansion', 6], ['Revenue diversification', 5], ['Strategic partnerships', 4]] },
    { w: 15, n: 'Risk Resilience', s: 'Economic, customer, technology and regulatory resilience', rows: [['Economic sensitivity', 3], ['Customer diversification', 4], ['Technological resilience', 3], ['Regulatory resilience', 2], ['Operational resilience', 3]] }
  ];
  var catsEl = document.getElementById('cats');
  if (catsEl) {
    CATS.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'cat';
      d.innerHTML =
        '<button class="cat-head" aria-expanded="false">' +
        '<span class="w">' + c.w + '</span>' +
        '<span class="n">' + c.n + '<small>' + c.s + '</small></span>' +
        '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>' +
        '</button>' +
        '<div class="cat-body"><div class="cat-inner"><table><thead><tr><th>Component</th><th>Weight</th></tr></thead><tbody>' +
        c.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
      catsEl.appendChild(d);

      var head = d.querySelector('.cat-head');
      var bodyEl = d.querySelector('.cat-body');
      var inner = d.querySelector('.cat-inner');
      head.addEventListener('click', function () {
        var open = d.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (REDUCE) { bodyEl.style.height = open ? 'auto' : '0'; return; }
        var target = open ? inner.offsetHeight : 0;
        bodyEl.style.transition = 'height .38s cubic-bezier(.22,.8,.25,1)';
        bodyEl.style.height = target + 'px';
      });
    });
  }

  /* sparkline tooltips — charts animate once, then answer questions */
  var tip = document.getElementById('tip');
  document.addEventListener('pointerover', function (e) {
    var c = e.target.closest && e.target.closest('.spark circle');
    if (!c || !tip) return;
    tip.innerHTML = '<b>' + c.dataset.label + '</b>' + c.dataset.value;
    tip.style.opacity = '1';
  });
  document.addEventListener('pointermove', function (e) {
    if (!tip || tip.style.opacity !== '1') return;
    var x = e.clientX + 14, w = tip.offsetWidth;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    tip.style.left = x + 'px';
    tip.style.top = (e.clientY + 16) + 'px';
  });
  document.addEventListener('pointerout', function (e) {
    if (e.target.closest && e.target.closest('.spark circle') && tip) tip.style.opacity = '0';
  });

})();
