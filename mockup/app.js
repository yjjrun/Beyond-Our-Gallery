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
        artVideo = document.getElementById('artVideo'),
        visitor = document.getElementById('visitor'),
        masthead = document.getElementById('masthead'),
        greenWash = document.getElementById('greenWash'),
        scrollCue = document.getElementById('scrollCue'),
        scrollFill = document.getElementById('scrollFill');

    gsap.set(stagewrap, { xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(masthead, { yPercent: -112 });
    gsap.set(greenWash, { opacity: 0 });

    var videoPlayhead = { progress: 0 };
    function syncArtVideo() {
      if (!artVideo || artVideo.readyState < 1) return;
      var duration = Number.isFinite(artVideo.duration) ? artVideo.duration : 6;
      artVideo.currentTime = Math.min(Math.max(0, duration - .04), videoPlayhead.progress * duration);
    }
    if (artVideo) {
      artVideo.pause();
      artVideo.addEventListener('loadedmetadata', syncArtVideo, { once: true });
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#act1', start: 'top top', end: 'bottom bottom', scrub: .5,
        onUpdate: function (self) {
          stagewrap.style.zIndex = self.progress >= .28 ? '7' : '5';
          if (scrollFill) scrollFill.style.transform = 'scaleX(' + Math.max(.08, self.progress).toFixed(3) + ')';
        }
      }
    });

    /* The title owns the first frame; the canvas then crosses in front. */
    tl.to(room, { scale: 1.045, yPercent: -1.5, ease: 'none', duration: 100 }, 0)
      .to(mega, { yPercent: -6, xPercent: 1.5, ease: 'none', duration: 56 }, 0)
      .to(visitor, { xPercent: 142, yPercent: -2, opacity: 0, ease: 'power1.in', duration: 28 }, 2)
      .to(stagewrap, { scale: 1.12, xPercent: -50, yPercent: -51, ease: 'power1.inOut', duration: 52 }, 12)
      .to(videoPlayhead, { progress: 1, ease: 'none', duration: 48, onUpdate: syncArtVideo }, 18)
      .to(mega, { opacity: .92, ease: 'none', duration: 34 }, 18)
      .to(mega, { opacity: 0, yPercent: -24, ease: 'power1.in', duration: 17 }, 55)
      .to(stagewrap, { scale: .94, yPercent: -58, opacity: 0, ease: 'power1.inOut', duration: 23 }, 66)
      .to(room, { opacity: 0, ease: 'none', duration: 24 }, 68)
      .to(greenWash, { opacity: 1, ease: 'none', duration: 23 }, 67)
      .to(scrollCue, { opacity: 0, y: 10, ease: 'power1.in', duration: 13 }, 73)
      .to(masthead, { yPercent: 0, ease: 'power2.out', duration: 18 }, 79);

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

  var cueButton = document.getElementById('scrollCue');
  if (cueButton) {
    cueButton.addEventListener('click', function (event) {
      var target = document.getElementById('homePanel');
      if (!target) return;
      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 66;
      window.scrollTo({ top: top, behavior: REDUCE ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', '#homePanel');
    });
  }

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
