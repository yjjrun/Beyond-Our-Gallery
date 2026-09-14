/* ============================================================
   Impasto painting generator
   ------------------------------------------------------------
   The previous attempt scattered 900 thin random strokes, which
   reads as static rather than paint. Real palette-knife work is a
   small number of LARGE, deliberate, directional ribbons, each with
   a lit edge and a shadowed edge, layered dark → mid → light.
   Returns { colour, height } canvases that share one stroke set so
   the relief lines up with the pigment exactly.
   ============================================================ */
window.BOGPaint = (function () {
  'use strict';

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* a ribbon: a swept bezier with width, drawn as a filled outline so
     it can carry a cross-section gradient (ridge light → valley dark) */
  function ribbon(cx, cy, angle, len, wid, curve) {
    var pts = [], steps = 26;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var bend = Math.sin(t * Math.PI) * curve;
      var a = angle + bend * .9;
      var d = (t - .5) * len;
      pts.push({
        x: cx + Math.cos(angle) * d - Math.sin(angle) * bend * len * .22,
        y: cy + Math.sin(angle) * d + Math.cos(angle) * bend * len * .22,
        w: wid * (0.35 + Math.sin(t * Math.PI) * 0.85),
        a: a
      });
    }
    return pts;
  }

  function ribbonPath(x, pts, side) {
    x.beginPath();
    var i, p, nx, ny;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      nx = -Math.sin(p.a); ny = Math.cos(p.a);
      var px = p.x + nx * p.w * side, py = p.y + ny * p.w * side;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    for (i = pts.length - 1; i >= 0; i--) {
      p = pts[i];
      nx = -Math.sin(p.a); ny = Math.cos(p.a);
      x.lineTo(p.x, p.y);
    }
    x.closePath();
  }

  function fullPath(x, pts) {
    x.beginPath();
    var i, p, nx, ny;
    for (i = 0; i < pts.length; i++) {
      p = pts[i]; nx = -Math.sin(p.a); ny = Math.cos(p.a);
      var px = p.x + nx * p.w, py = p.y + ny * p.w;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    for (i = pts.length - 1; i >= 0; i--) {
      p = pts[i]; nx = -Math.sin(p.a); ny = Math.cos(p.a);
      x.lineTo(p.x - nx * p.w, p.y - ny * p.w);
    }
    x.closePath();
  }

  function build(S) {
    S = S || 1400;
    var col = document.createElement('canvas'); col.width = col.height = S;
    var hgt = document.createElement('canvas'); hgt.width = hgt.height = S;
    var c = col.getContext('2d'), h = hgt.getContext('2d');

    /* ---- ground: near-black green, scraped ---- */
    var bg = c.createLinearGradient(0, 0, S, S);
    bg.addColorStop(0, '#08211c');
    bg.addColorStop(.5, '#0d2f28');
    bg.addColorStop(1, '#061a17');
    c.fillStyle = bg; c.fillRect(0, 0, S, S);
    h.fillStyle = '#7a7a7a'; h.fillRect(0, 0, S, S);

    /* broad scrapes to break the ground up */
    for (var s = 0; s < 40; s++) {
      var p = ribbon(rnd(0, S), rnd(0, S), rnd(0, 6.28), rnd(S * .5, S * 1.3), rnd(40, 130), rnd(-.5, .5));
      c.globalAlpha = rnd(.10, .28);
      c.fillStyle = Math.random() > .5 ? '#123f34' : '#0a2a26';
      fullPath(c, p); c.fill();
    }
    c.globalAlpha = 1;

    var GREENS = ['#0f4a3c', '#14miss', '#136b55', '#0d7377', '#1a8a6b', '#0b3b31'];
    GREENS[1] = '#175c49';
    var PINKS = ['#e07ea0', '#ef91b1', '#c6658c', '#8f5177', '#f3b3c6'];

    var strokes = [];

    /* ---- layer 1: the big green sweep, lower-left to upper-right ---- */
    for (var i = 0; i < 16; i++) {
      var t = i / 15;
      strokes.push({
        pts: ribbon(
          S * (0.18 + t * 0.62) + rnd(-70, 70),
          S * (0.78 - t * 0.58) + rnd(-70, 70),
          rnd(-0.95, -0.45),
          rnd(S * .42, S * .78),
          rnd(34, 92),
          rnd(-.45, .45)
        ),
        col: GREENS[(Math.random() * GREENS.length) | 0],
        lift: rnd(.5, 1)
      });
    }

    /* ---- layer 2: the pink counter-sweep through the middle ---- */
    for (i = 0; i < 13; i++) {
      var u = i / 12;
      strokes.push({
        pts: ribbon(
          S * (0.30 + u * 0.42) + rnd(-80, 80),
          S * (0.30 + u * 0.40) + rnd(-80, 80),
          rnd(0.25, 1.05),
          rnd(S * .3, S * .62),
          rnd(28, 76),
          rnd(-.5, .5)
        ),
        col: PINKS[(Math.random() * PINKS.length) | 0],
        lift: rnd(.6, 1)
      });
    }

    /* ---- layer 3: short accents, both families ---- */
    for (i = 0; i < 22; i++) {
      strokes.push({
        pts: ribbon(rnd(S * .12, S * .88), rnd(S * .12, S * .88), rnd(0, 6.28),
          rnd(S * .1, S * .28), rnd(16, 46), rnd(-.7, .7)),
        col: Math.random() > .45
          ? GREENS[(Math.random() * GREENS.length) | 0]
          : PINKS[(Math.random() * PINKS.length) | 0],
        lift: rnd(.4, 1)
      });
    }

    /* ---- paint them: body, shadow edge, lit edge ---- */
    strokes.forEach(function (st) {
      // body
      c.globalAlpha = rnd(.82, 1);
      c.fillStyle = st.col;
      fullPath(c, st.pts); c.fill();

      // shadowed side
      c.globalAlpha = .34;
      c.fillStyle = '#03100e';
      ribbonPath(c, st.pts, 1); c.fill();

      // lit side — a paler mix of the stroke's own colour
      c.globalAlpha = .42;
      c.fillStyle = '#ffffff';
      ribbonPath(c, st.pts, -1); c.fill();
      c.globalAlpha = 1;

      // height: the whole ribbon stands proud, its lit edge highest
      h.globalAlpha = .55 * st.lift;
      h.fillStyle = '#c9c9c9';
      fullPath(h, st.pts); h.fill();
      h.globalAlpha = .8 * st.lift;
      h.fillStyle = '#ffffff';
      ribbonPath(h, st.pts, -1); h.fill();
      h.globalAlpha = .7 * st.lift;
      h.fillStyle = '#2a2a2a';
      ribbonPath(h, st.pts, 1); h.fill();
      h.globalAlpha = 1;
    });

    /* ---- knife chatter: tiny flecks catching light on the ridges ---- */
    for (i = 0; i < 520; i++) {
      var fx = rnd(0, S), fy = rnd(0, S), fw = rnd(2, 9), fh = rnd(2, 6);
      var lit = Math.random() > .42;
      c.globalAlpha = rnd(.08, .3);
      c.fillStyle = lit ? '#ffffff' : '#000000';
      c.fillRect(fx, fy, fw, fh);
      h.globalAlpha = rnd(.2, .5);
      h.fillStyle = lit ? '#ffffff' : '#3a3a3a';
      h.fillRect(fx, fy, fw, fh);
    }
    c.globalAlpha = 1; h.globalAlpha = 1;

    /* ---- canvas weave, only in the height map ---- */
    h.globalAlpha = .1;
    for (i = 0; i < S; i += 4) {
      h.strokeStyle = i % 8 ? '#ffffff' : '#000000';
      h.lineWidth = 1;
      h.beginPath(); h.moveTo(i, 0); h.lineTo(i, S); h.stroke();
      h.beginPath(); h.moveTo(0, i); h.lineTo(S, i); h.stroke();
    }
    h.globalAlpha = 1;

    /* ---- vignette so the composition has a centre ---- */
    var vg = c.createRadialGradient(S * .46, S * .44, S * .12, S * .5, S * .5, S * .78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.5)');
    c.fillStyle = vg; c.fillRect(0, 0, S, S);

    return { colour: col, height: hgt };
  }

  return { build: build };
})();
