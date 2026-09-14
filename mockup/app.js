/* ============================================================
   Beyond Our Gallery — landing
   ------------------------------------------------------------
   GSAP ScrollTrigger owns the pinned hero and the closing wipe.
   CSS owns every post-hero reveal, hover and accordion.
   No element is written to by both.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- if no painting was supplied, generate one ---------- */
  (function ensureArt() {
    var img = document.getElementById('artImg');
    if (!img) return;
    img.addEventListener('error', function () {
      if (!window.BOGPaint) return;
      var made = BOGPaint.build(1200);
      img.replaceWith(Object.assign(made.colour, { className: 'gen-art' }));
      made.colour.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    });
  })();

  /* ---------- count-ups ---------- */
  var counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el) || !el.dataset.count) return;
    counted.add(el);
    var target = parseFloat(el.dataset.count);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var dec = (String(el.dataset.count).split('.')[1] || '').length;
    var t0 = performance.now(), D = 1500, raf = 0;
    function step(now) {
      var p = Math.min(1, (now - t0) / D);
      el.textContent = pre + (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suf;
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    // if rAF is throttled (background tab), land on the final value anyway
    setTimeout(function () {
      if (parseFloat(el.textContent.replace(/[^\d.-]/g, '')) < target) {
        cancelAnimationFrame(raf);
        el.textContent = pre + target.toFixed(dec) + suf;
      }
    }, D + 400);
  }
  window.__bogCount = countUp;

  /* ============================================================
     ACT I — the pinned gallery
     ============================================================ */
  if (hasGSAP && !REDUCE) {
    var room = document.getElementById('room'),
        mega = document.getElementById('mega'),
        stagewrap = document.getElementById('stagewrap'),
        rotor = document.getElementById('rotor'),
        front = document.querySelector('.face.front'),
        back = document.querySelector('.face.back'),
        visitor = document.getElementById('visitor'),
        claim = document.getElementById('heroClaim'),
        shadow = document.getElementById('artShadow');

    gsap.set(rotor, { rotateY: 0, rotateX: 0, rotateZ: 0 });
    gsap.set(stagewrap, { xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(front, { opacity: 1, scale: 1 });
    gsap.set(back, { opacity: 0, scale: .985, y: 18 });
    gsap.set('.hero-chart .bars rect', { transformOrigin: '50% 100%', scaleY: .12 });
    gsap.set('.hero-chart .margin-line', { strokeDasharray: 520, strokeDashoffset: 520 });
    gsap.set('.hero-chart .dots circle,.evidence-strip span,.back-stats div,.back-thesis', { opacity: 0, y: 10 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: '#act1', start: 'top top', end: 'bottom bottom', scrub: .72 }
    });

    /* 0–30% · establish one hierarchy, then complete the visitor exit. */
    tl.to(room,      { yPercent: -2.2, scale: 1.025, ease: 'none', duration: 30 }, 0)
      .to(stagewrap, { yPercent: -52, xPercent: -51, ease: 'none', duration: 30 }, 0)
      .to(visitor,   { xPercent: 168, yPercent: -5, opacity: 0, ease: 'power1.in', duration: 30 }, 0)
      .to(claim,     { yPercent: -14, opacity: .82, ease: 'none', duration: 24 }, 0)
      .to(mega,      { yPercent: -8, ease: 'none', duration: 24 }, 0);

    /* 30–58% · a fast 2.5D turn, never lingering edge-on. */
    tl.to(mega,      { opacity: 0, yPercent: -34, ease: 'power1.in', duration: 18 }, 24)
      .to(claim,     { opacity: 0, yPercent: -30, ease: 'power1.in', duration: 14 }, 26)
      .to(stagewrap, { scale: 1.1, xPercent: -55, yPercent: -52, ease: 'power1.inOut', duration: 28 }, 30)
      .to(rotor,     { rotateY: -24, rotateX: 2, rotateZ: -.6, ease: 'power2.inOut', duration: 13 }, 30)
      .to(rotor,     { rotateY: 0, rotateX: 0, rotateZ: 0, ease: 'power2.out', duration: 15 }, 43)
      .to(front,     { opacity: 0, scale: .985, ease: 'power1.inOut', duration: 19 }, 34)
      .to(back,      { opacity: 1, y: 0, scale: 1, ease: 'power1.out', duration: 21 }, 37)
      .to(shadow,    { opacity: .28, scaleX: 1.08, ease: 'none', duration: 24 }, 34)
      .to(room,      { opacity: .64, scale: 1.055, ease: 'none', duration: 28 }, 30);

    /* 58–100% · useful evidence stays on screen until the research section arrives. */
    tl.to('.back-stats div', { opacity: 1, y: 0, stagger: .04, ease: 'power1.out', duration: 9 }, 50)
      .to('.back-thesis', { opacity: 1, y: 0, ease: 'power1.out', duration: 8 }, 52)
      .to('.hero-chart .bars rect', { scaleY: 1, stagger: .035, ease: 'power2.out', duration: 14 }, 56)
      .to('.hero-chart .margin-line', { strokeDashoffset: 0, ease: 'power1.out', duration: 16 }, 59)
      .to('.hero-chart .dots circle', { opacity: 1, y: 0, stagger: .02, ease: 'power1.out', duration: 7 }, 63)
      .to('.evidence-strip span', { opacity: 1, y: 0, stagger: .035, ease: 'power1.out', duration: 10 }, 68)
      .to(stagewrap, { scale: 1.03, xPercent: -55, yPercent: -57, ease: 'none', duration: 28 }, 72)
      .to(room,      { opacity: .38, ease: 'none', duration: 28 }, 72);

    ScrollTrigger.create({
      trigger: '#act1', start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        if (self.progress > .50) {
          document.querySelectorAll('.linen [data-count]').forEach(countUp);
        }
      }
    });

    /* ---------- closing wipe: white → green ---------- */
    /* Drive the wipe and the text colour from ONE progress value. A
       separate scrubbed tween could lag or fail to converge, which would
       leave pale type on a white ground — unreadable. This cannot desync. */
    var closing = document.getElementById('closing');
    var veil = document.getElementById('closingVeil');
    ScrollTrigger.create({
      trigger: closing, start: 'top 82%', end: 'center center', scrub: true,
      onUpdate: function (s) {
        var p = s.progress;
        var eased = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        veil.style.clipPath = 'circle(' + (eased * 152).toFixed(2) + '% at 50% 100%)';
        closing.classList.toggle('lit', p > .46);
      }
    });

  } else {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '');
    });
    var cl = document.getElementById('closing');
    if (cl) cl.classList.add('lit');
  }

  /* progress hairline */
  var pf = document.getElementById('progressFill');
  function progress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (pf && max > 0) pf.style.width = (scrollY / max * 100) + '%';
  }
  addEventListener('scroll', progress, { passive: true });
  progress();

  /* ============================================================
     ACT II — the platform
     ============================================================ */
  var COMPANIES = [
    { name: 'Kingsmen Creatives', tk: 'SGX: 5MZ', sector: 'Experiential',
      img: '../assets/strategy-visitors.jpg', alt: 'Visitors inside an immersive exhibition',
      thesis: 'Design-and-build for the experience economy — margin, not volume, moves earnings.',
      score: 59.3, href: '../kingsmen-creatives.html' },
    { name: 'Straco Corporation', tk: 'SGX: S85', sector: 'Attractions',
      img: '../assets/straco-flyer-skyline.webp', alt: 'The Singapore Flyer at dusk',
      thesis: 'Exceptional balance sheet and asset economics, held back by concentration.',
      score: 67.3, href: '../straco-corporation.html' },
    { name: 'mm2 Asia', tk: 'SGX: 1B0', sector: 'Film & Media',
      img: '../assets/rd-bicentennial.jpg', alt: 'A projected immersive gallery interior',
      thesis: 'Rights and cinema assets remain relevant; leverage decides the outcome.',
      score: 68, href: '../index.html#company-gallery' }
  ];

  var cardsEl = document.getElementById('cards');
  if (cardsEl) COMPANIES.forEach(function (co, i) {
    var card = document.createElement('article');
    card.className = 'card';
    card.dataset.score = co.score;
    card.style.transitionDelay = (i * 100) + 'ms';
    card.innerHTML =
      '<div class="card-tilt">' +
        '<div class="card-media">' +
          '<img src="' + co.img + '" alt="' + co.alt + '" loading="lazy">' +
          '<div class="card-veil"><span class="tk">' + co.tk + '</span>' +
          '<p class="th">' + co.thesis + '</p></div>' +
        '</div>' +
        '<div class="card-body"><span class="tk">' + co.sector + '</span>' +
          '<h3>' + co.name + '</h3>' +
          '<div class="card-foot">' +
            '<span class="card-score" data-count="' + co.score + '">0<small>out of 100</small></span>' +
            '<svg class="row-arrow" viewBox="0 0 20 12" aria-hidden="true"><path d="M0 6h17M13 1l5 5-5 5"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>';
    var a = document.createElement('a');
    a.href = co.href; a.setAttribute('aria-label', 'Read the ' + co.name + ' analysis');
    a.style.cssText = 'position:absolute;inset:0;z-index:3';
    card.style.position = 'relative';
    card.appendChild(a);
    cardsEl.appendChild(card);
  });

  /* method accordion */
  var CATS = [
    { w: 40, n: 'Financial Strength', s: 'Balance sheet, cash generation and profitability trend',
      rows: [['Five-year revenue CAGR', 6], ['Median net margin', 7], ['Median ROIC', 9], ['Cash-flow stability', 9], ['Balance-sheet strength', 9]] },
    { w: 20, n: 'Market Position', s: 'Brand, competitive advantage and client concentration',
      rows: [['Brand recognition', 2], ['Competitive advantage', 7], ['Market share', 4], ['Customer relationships', 5], ['Geographic reach', 2]] },
    { w: 25, n: 'Growth Opportunities', s: 'Industry direction, technology and expansion pipeline',
      rows: [['Industry growth potential', 6], ['Technology adoption', 4], ['New-market expansion', 6], ['Revenue diversification', 5], ['Strategic partnerships', 4]] },
    { w: 15, n: 'Risk Resilience', s: 'Economic, customer, technology and regulatory resilience',
      rows: [['Economic sensitivity', 3], ['Customer diversification', 4], ['Technological resilience', 3], ['Regulatory resilience', 2], ['Operational resilience', 3]] }
  ];
  var catsEl = document.getElementById('cats');
  if (catsEl) CATS.forEach(function (c) {
    var d = document.createElement('div');
    d.className = 'cat';
    d.setAttribute('data-rev', '');
    d.innerHTML =
      '<button class="cat-head" aria-expanded="false"><span class="w">' + c.w + '</span>' +
      '<span class="n">' + c.n + '<small>' + c.s + '</small></span>' +
      '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg></button>' +
      '<div class="cat-body"><div class="cat-inner"><table><thead><tr><th>Component</th><th>Weight</th></tr></thead><tbody>' +
      c.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    catsEl.appendChild(d);
    var head = d.querySelector('.cat-head'), body = d.querySelector('.cat-body'), inner = d.querySelector('.cat-inner');
    head.addEventListener('click', function () {
      var open = d.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (REDUCE) { body.style.height = open ? 'auto' : '0'; return; }
      body.style.transition = 'height .4s cubic-bezier(.22,.8,.25,1)';
      body.style.height = (open ? inner.offsetHeight : 0) + 'px';
    });
  });

  /* sparkline for the featured company */
  (function spark() {
    var line = document.querySelector('.sp-line'), area = document.querySelector('.sp-area');
    if (!line) return;
    var v = [273.2, 328.4, 361.5, 388.4, 372.5];
    var lo = 250, hi = 400, W = 320, H = 110;
    var pts = v.map(function (n, i) {
      return [(i / (v.length - 1)) * W, H - ((n - lo) / (hi - lo)) * (H - 14) - 7];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('');
    line.setAttribute('d', d);
    area.setAttribute('d', d + 'L' + W + ',' + H + 'L0,' + H + 'Z');
  })();

  /* ---------- reveal: observer, with a scroll sweep as the guarantee ---------- */
  function activate(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    if (el.matches('[data-count]')) countUp(el);
    var dfg = el.querySelector('.d-fg');
    if (dfg) {
      var C = 314, s = parseFloat(dfg.dataset.score || 0);
      dfg.style.strokeDashoffset = String(C - C * (s / 100));
    }
    var line = el.querySelector('.sp-line');
    if (line && line.getTotalLength) {
      var L = line.getTotalLength();
      line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.8,.25,1)';
      line.style.strokeDashoffset = '0';
    }
  }

  var watched = Array.prototype.slice.call(document.querySelectorAll('[data-rev], .card, .row'));
  if (REDUCE) {
    watched.forEach(activate);
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } });
    }, { threshold: .16, rootMargin: '0px 0px -50px 0px' });
    watched.forEach(function (el) { io.observe(el); });

    /* IntersectionObserver does not deliver in every context (a background
       or non-painting tab). A cheap sweep makes the reveal unconditional. */
    function sweep() {
      var vh = innerHeight;
      watched = watched.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh - 40 && r.bottom > 0) { activate(el); io.unobserve(el); return false; }
        return true;
      });
    }
    addEventListener('scroll', sweep, { passive: true });
    addEventListener('resize', sweep);
    sweep(); setTimeout(sweep, 350);
  }

  /* cursor tilt — on .card-tilt only, so it never fights the reveal on .card */
  if (!REDUCE && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      var t = card.querySelector('.card-tilt');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        t.style.transform = 'perspective(900px) rotateY(' + (dx * 5).toFixed(2) + 'deg) rotateX(' + (-dy * 5).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { t.style.transform = ''; });
    });
  }

})();
