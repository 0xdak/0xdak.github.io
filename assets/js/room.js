/* Pixel-art room scene. Usage: Room.mount(el, { crop: { below: 640, x: 64, w: 240 } }) -> { repaint }
   Theme comes from <html data-theme> (or prefers-color-scheme); the scene repaints when it changes. */
(function () {
'use strict';
window.Room = { mount: function (container, opts) {
  opts = opts || {};
  var api = { repaint: function () {} };
  var HOTS = [
    { id: 'oscp', href: 'https://credentials.offsec.com/21070920-f49d-4e30-a9d0-e420e69a5f6c', tag: 'OSCP credential ↗', cls: 'below' },
    { id: 'm4', href: 'https://dakcyber.com', tag: 'nmap · DAKCYBER pentest ↗', cls: 'below' },
    { id: 'm1', href: 'https://dakcyber.com/hizmetler/icerik-uretimi', tag: 'OffSec labs · 53 machines ↗' },
    { id: 'm2', href: 'https://github.com/0xdak?tab=repositories&q=CVE', tag: '16 CVE exploits · GitHub ↗' },
    { id: 'm3', href: 'https://vulntracker.io', tag: 'VulnTracker ↗' },
    { id: 'm5', href: 'https://getbowerbird.app', tag: 'Bowerbird ↗', end: true },
    { id: 'tea', tea: true, tag: 'çaylan' }
  ];
  var LABEL = 'Pixel art of a room in Istanbul. Seen from behind, a person in a hoodie and headphones sits at a desk with four monitors and a laptop. A Turkish double teapot and a glass of tea steam on the desk, a cat sleeps on the windowsill, a portrait of Mustafa Kemal Atatürk hangs beside a framed OSCP certificate and a TSE certificate, and the window looks out on Galata Tower, the Bosphorus bridge and a mosque on the far shore.';
  var d = document, H = d.documentElement;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var DARK = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: true };
  function isNight() { return (H.dataset.theme || (DARK.matches ? 'dark' : 'light')) === 'dark'; }
  var stage = container, scene = d.createElement('div'), cv = d.createElement('canvas');
  stage.classList.add('stage'); scene.className = 'scene'; cv.width = 384; cv.height = 216;
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', opts.label || LABEL);
  scene.appendChild(cv); stage.appendChild(scene);
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return api;
  function paintHook() { paint(); }
  api.repaint = paintHook;
  new MutationObserver(paintHook).observe(H, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- buffers, palette, ramps ---------- */
  var W = 384, HT = 216, N = W * HT;
  var buf = d.createElement('canvas'); buf.width = W; buf.height = HT; var bctx = buf.getContext('2d');
  var img = bctx.createImageData(W, HT), out = new Uint32Array(img.data.buffer);
  var M = new Uint8Array(N), V = new Float32Array(N), K = new Uint8Array(N);
  var M0 = new Uint8Array(N), V0 = new Float32Array(N), K0 = new Uint8Array(N), LT = new Float32Array(N);
  // 32 colours, DAKCYBER based
  var PC = '0b0809 141011 221a1a 352a2c 4f4245 8a817c c8c0bb f6f1ec 2c1f27 4a3338 8c6b64 d9c2b4 3a0f18 6e1423 9b2d43 e0556b 4f8a55 2e1d1a 4f3026 7a4a33 a8704a cf9a6c e8b896 b4452a f3a64a ffe3a3 1d1a33 3b3a63 6f86a8 a9c6db 2f5e3d 7fc8a0'
    .split(' ').map(function (h) { var n = parseInt(h, 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; });
  // material ramps (dark -> light); material 0 = emissive (V holds a palette index)
  var RAMP = [null,
    [1, 8, 9, 10, 11, 7],     // 1 wall
    [0, 17, 18, 19, 20, 21],  // 2 wood
    [0, 12, 13, 14, 15, 15],  // 3 hoodie / bordo
    [0, 1, 2, 3, 18, 19],     // 4 hair
    [0, 1, 2, 3, 4, 5],       // 5 dark plastic
    [1, 3, 4, 5, 6, 7],       // 6 steel / glass
    [17, 18, 19, 21, 22, 22], // 7 skin
    [0, 1, 30, 16, 31, 31],   // 8 leaves
    [0, 26, 27, 28, 29, 29],  // 9 blue
    [12, 13, 23, 24, 25, 25], // 10 tea
    [8, 9, 10, 11, 7, 7],     // 11 paper / linen
    [18, 19, 20, 24, 25, 25]  // 12 amber
  ];
  var WALL = 1, WOOD = 2, HOOD = 3, HAIR = 4, DARK5 = 5, STEEL = 6, SKIN = 7, GRN = 8, BLU = 9, TEA = 10, PAP = 11, AMB = 12;
  var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return v / 16; });
  var LY = 0, CL = null;
  var DITH = [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];

  function p(x, y, m, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= HT) return; var i = y * W + x; M[i] = m; V[i] = v; K[i] = LY; }
  function e(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (CL && (x < CL[0] || y < CL[1] || x >= CL[2] || y >= CL[3])) return; p(x, y, 0, c); }
  function rect(x, y, w, h, m, v) { for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) p(i, j, m, v); }
  function er(x, y, w, h, c) { for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) e(i, j, c); }
  function ve(x, y, c) { if (x < 0 || y < 0 || x >= W || y >= HT) return; var i = y * W + x; if (K[i] === 9) { M[i] = 0; V[i] = c; } }
  function hs(a, b, c) { var h = (a * 374761393 + b * 668265263 + c * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function sd(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; var qx = ax + t * dx - px, qy = ay + t * dy - py; return Math.sqrt(qx * qx + qy * qy); }
  function ln(x0, y0, x1, y1, f) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er2 = dx + dy; for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; var e2 = 2 * er2; if (e2 >= dy) { er2 += dy; x0 += sx; } if (e2 <= dx) { er2 += dx; y0 += sy; } } }

  // shape(): fill a region from a shade function, with a 1px outline where the shape meets the outside.
  // fn returns a shade (0..5), a value >= 10 for the dark material, or null for outside.
  var SB = new Float32Array(130 * 130);
  function shape(m, x0, y0, x1, y1, fn, ol) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    var w = x1 - x0 + 1, h = y1 - y0 + 1, x, y, v, j;
    if (w * h > SB.length) return;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { v = fn(x0 + x, y0 + y); SB[y * w + x] = v == null ? -99 : v; }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      j = y * w + x; v = SB[j]; if (v === -99) continue;
      var mm = m; if (v >= 10 && m) { mm = DARK5; v -= 10; }
      if (ol != null && (x === 0 || y === 0 || x === w - 1 || y === h - 1 || SB[j - 1] === -99 || SB[j + 1] === -99 || SB[j - w] === -99 || SB[j + w] === -99)) v = ol;
      p(x0 + x, y0 + y, mm, v);
    }
  }
  function seg(m, ax, ay, bx, by, r, v, ol) { shape(m, Math.min(ax, bx) - r - 1, Math.min(ay, by) - r - 1, Math.max(ax, bx) + r + 1, Math.max(ay, by) + r + 1, function (x, y) { return sd(x + .5, y + .5, ax, ay, bx, by) <= r ? v : null; }, ol); }
  function ell(m, cx, cy, rx, ry, fn, ol) { shape(m, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, function (x, y) { var u = (x + .5 - cx) / rx, w = (y + .5 - cy) / ry; return u * u + w * w <= 1 ? (typeof fn === 'number' ? fn : fn(u, w, x, y)) : null; }, ol); }
  function cable(x0, y0, x1, y1, sag, m, v) { var n = Math.ceil(Math.abs(x1 - x0) + Math.abs(y1 - y0)) + 2, px = null, py = null; for (var k = 0; k <= n; k++) { var f = k / n, x = Math.round(x0 + (x1 - x0) * f), y = Math.round(y0 + (y1 - y0) * f + sag * 4 * f * (1 - f)); if (x !== px || y !== py) p(x, y, m, v); px = x; py = y; } }

  /* ---------- 3x5 pixel font ---------- */
  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111101101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010', 9: '010101011001110',
    '.': '000000000000010', ':': '000010000010000', '-': '000000111000000', '_': '000000000000111', '/': '001001010100100', '[': '110100100100110', ']': '011001001001011', '+': '000010111010000', '*': '000101010101000', '(': '010100100100010', ')': '010001001001010', '=': '000111000111000', '>': '100010001010100', '~': '000011110000000' };
  function tx(s, x, y, c, m) { s = String(s).toUpperCase(); for (var k = 0; k < s.length; k++) { var g = F[s.charAt(k)]; if (!g) continue; for (var b = 0; b < 15; b++) if (g.charCodeAt(b) === 49) { if (m) p(x + k * 4 + b % 3, y + (b / 3 | 0), m, c); else e(x + k * 4 + b % 3, y + (b / 3 | 0), c); } } }

  /* ---------- layout ---------- */
  var PX = 206;
  var MON = { m1: [122, 50, 42, 66], m2: [168, 62, 88, 52], m3: [260, 66, 64, 46], m4: [190, 12, 80, 44], m5: [330, 98, 42, 28] };
  var HOT = { m1: MON.m1, m2: MON.m2, m3: MON.m3, m4: MON.m4, m5: [330, 98, 42, 34], tea: [62, 94, 52, 42], oscp: [124, 15, 39, 29] };
  var BULBS = [];
  (function () { for (var k = 0; k < 16; k++) { var x = 16 + k * 6, mid = x < 61 ? 37.5 : 84.5, half = 23.5; BULBS.push([x, Math.round(8 + 4 * (1 - Math.pow((x - mid) / half, 2)))]); } })();

  /* ---------- lights ---------- */
  function addRect(x0, y0, w, h, rad, amt) {
    for (var y = Math.max(0, y0 - rad); y < Math.min(HT, y0 + h + rad); y++) for (var x = Math.max(0, x0 - rad); x < Math.min(W, x0 + w + rad); x++) {
      var dx = Math.max(x0 - x, 0, x - (x0 + w)), dy = Math.max(y0 - y, 0, y - (y0 + h)), dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < rad) { var f = 1 - dd / rad; LT[y * W + x] += amt * f * f; }
    }
  }
  function lights(night) {
    LT.fill(0);
    var k;
    if (night) {
      for (k in MON) { var r = MON[k]; addRect(r[0] + 2, r[1] + 2, r[2] - 4, r[3] - 4, k === 'm5' ? 30 : 46, k === 'm5' ? 1.2 : 1.6); }
      addRect(54, 98, 2, 2, 26, 1.6);
      for (var y = 96; y < HT; y++) for (var x = 0; x < 210; x++) {
        var dx = x - 55, dy = y - 99, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 4 || dd > 90) continue;
        var c = (dx * .45 + dy * .89) / dd; if (c > .78) LT[y * W + x] += 2.6 * Math.min(1, (c - .78) * 9) * (1 - dd / 90);
      }
      BULBS.forEach(function (b) { addRect(b[0], b[1], 1, 1, 8, .5); });
      addRect(13, 13, 96, 80, 34, .8);
      addRect(285, 6, 24, 34, 6, 2); addRect(291, 4, 12, 1, 8, .8);
      addRect(302, 162, 1, 34, 14, .9);
    } else {
      addRect(13, 13, 96, 80, 70, .9);
      for (var y2 = 121; y2 < 142; y2++) for (var x2 = 0; x2 < W; x2++) { var a = 34 + (y2 - 121) * 1.6; if (x2 > a && x2 < a + 96) LT[y2 * W + x2] += .75; }
      for (k in MON) { var r2 = MON[k]; addRect(r2[0], r2[1], r2[2], r2[3], 12, .35); }
    }
    for (var i = 0; i < N; i++) LT[i] = Math.round(LT[i] * 4) / 4;
  }

  /* ---------- static room (built once per theme) ---------- */
  function metal(u) { return 4 + (u < -.35 ? 1 : 0) - (u > .35 ? 1 : 0) - (u > .75 ? .75 : 0); }
  var KP = [8.5, 9.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10.5, 10, 9, 7.5, 6, 5, 4.5, 4.5];
  function ketF(lx, ly) {
    var hh = -ly;
    if (sd(lx, ly, 8, -9, 15, -19) < 1.4) return 4;
    var hd = Math.sqrt((lx + 11) * (lx + 11) + (ly + 10) * (ly + 10)); if (lx < -9.5 && hd > 3.6 && hd < 5.2) return 12;
    if (hh < 0 || hh >= 20) return null; var hw = KP[hh | 0]; if (Math.abs(lx) > hw) return null; var u = lx / hw;
    if (hh >= 18) return 3 + (u < -.3 ? 1 : 0);
    return metal(u) - (hh < 1 ? 1 : 0) - (hh > 13 && hh < 15 ? .5 : 0);
  }
  var DP = [3.5, 5, 6, 6.5, 6.5, 6.5, 6.5, 6.5, 6, 5, 4, 4.5, 3.5, 1.5, 1];
  function demF(lx, ly) {
    var hh = -ly;
    if (sd(lx, ly, 5, -4.5, 10.5, -11) < 1.1) return 4;
    var hd = Math.sqrt((lx + 7.5) * (lx + 7.5) + (ly + 6) * (ly + 6)); if (lx < -5.5 && hd > 2 && hd < 3.3) return 12;
    if (hh < 0 || hh >= 15) return null; var hw = DP[hh | 0]; if (Math.abs(lx) > hw) return null; var u = lx / hw;
    if (hh >= 13) return 13;
    if (hh >= 11) return 3.5 + (u < -.3 ? 1 : 0);
    return metal(u);
  }
  function bezel(r) {
    var x = r[0], y = r[1], w = r[2], h = r[3];
    shape(DARK5, x, y, x + w - 1, y + h - 1, function (px, py) { var cx = px === x || px === x + w - 1, cy = py === y || py === y + h - 1; if (cx && cy) return null; return py === y + 1 ? 3 : 2; }, 0);
  }
  function stand(cx, y0, bw) {
    rect(cx - 2, y0, 4, 121 - y0, DARK5, 2); rect(cx - 2, y0, 1, 121 - y0, DARK5, 3);
    shape(DARK5, cx - bw / 2, 121, cx + bw / 2, 123, function (x, y) { return y === 121 ? 3 : 2; }, 1);
    rect(cx - bw / 2 - 1, 124, bw + 3, 1, WOOD, 2.6);
  }
  var NEON = ['.ooo..ooo..o...o', 'o........o.o...o', 'o.....oooo.o...o', 'o....o...o.o...o', '.ooo..oooo..oooo', '..o............o', '.oo.........ooo.'];

  function build(night) {
    var x, y, k;
    LY = 0; CL = null;
    // wall, ceiling shade, under-desk, floor
    for (y = 0; y < 150; y++) for (x = 0; x < W; x++) p(x, y, WALL, 4 - (y < 6 ? (6 - y) * .17 : 0) - (x < 3 || x > 380 ? .5 : 0));
    rect(0, 150, W, 46, WALL, 1.7); rect(0, 150, W, 6, WALL, 1.2);
    rect(0, 196, W, 4, WALL, 2.8); rect(0, 196, W, 1, WALL, 3.6);
    for (y = 200; y < HT; y++) for (x = 0; x < W; x++) p(x, y, WOOD, y === 200 ? 1.6 : ((x + (y > 207 ? 21 : 0)) % 42 === 0 ? 1.8 : 2.8 - (y > 208 ? .25 : 0)));

    // window: view mask, frame, mullion, sill
    LY = 9; rect(13, 13, 96, 80, 0, 1); LY = 0;
    rect(10, 10, 102, 3, PAP, 4); rect(10, 93, 102, 3, PAP, 4); rect(10, 13, 3, 80, PAP, 4); rect(109, 13, 3, 80, PAP, 4); rect(59, 13, 3, 80, PAP, 4);
    rect(10, 10, 102, 1, PAP, 4.6); rect(59, 13, 1, 80, PAP, 4.6); rect(61, 13, 1, 80, PAP, 3.2); rect(12, 12, 98, 1, PAP, 3.2); rect(12, 92, 98, 1, PAP, 3.4);
    rect(9, 9, 104, 1, PAP, 2.4); rect(9, 9, 1, 88, PAP, 2.4); rect(112, 9, 1, 88, PAP, 2.4);
    rect(4, 96, 114, 4, PAP, 4); rect(4, 96, 114, 1, PAP, 5); rect(4, 99, 114, 1, PAP, 2.8); rect(6, 100, 110, 2, WALL, 3);
    // curtain rod, curtains
    rect(0, 4, 124, 2, DARK5, 3); rect(0, 4, 124, 1, DARK5, 4); ell(DARK5, 1.5, 5, 2, 2, 4, 1); ell(DARK5, 123, 5, 2, 2, 4, 1);
    [[0, 13], [108, 121]].forEach(function (c) {
      var a = c[0], b = c[1], mid = (a + b) / 2;
      shape(PAP, a - 2, 6, b + 2, 116, function (px, py) {
        var flare = py > 100 ? (py - 100) * .12 : 0, hw = (b - a) / 2 + flare - (py < 12 ? 0 : (py < 50 ? (py - 12) * .02 : .76) - .76);
        if (Math.abs(px + .5 - mid) > hw || py > 113 + (Math.abs(px - mid) > 3 ? 1 : 0)) return null;
        var f = Math.sin((px - a) * 1.25 + (py > 90 ? (py - 90) * .05 : 0));
        return 3.6 + (f > .45 ? .9 : f < -.5 ? -.8 : 0) + (py > 110 ? -.6 : 0);
      }, 1.5);
    });
    // fairy-light wire
    for (x = 14; x <= 108; x++) { var mid2 = x < 61 ? 37.5 : 84.5; p(x, Math.round(7 + 4 * (1 - Math.pow((x - mid2) / 23.5, 2))), DARK5, 2); }

    // OSCP certificate
    shape(WOOD, 124, 15, 162, 43, function (px, py) { return (px < 126 || px > 160 || py < 17 || py > 41) ? (py < 17 || px < 126 ? 3 : 2) : 2; }, 1);
    rect(126, 17, 35, 25, PAP, 5); rect(127, 18, 33, 23, PAP, 4.6);
    tx('OSCP', 135, 21, 3, HOOD);
    rect(131, 28, 25, 1, PAP, 2.6); rect(133, 31, 21, 1, PAP, 3); rect(135, 33, 17, 1, PAP, 3);
    ln(130, 38, 133, 36, function (a, b) { p(a, b, DARK5, 3); }); ln(133, 36, 137, 38, function (a, b) { p(a, b, DARK5, 3); }); ln(137, 38, 141, 36, function (a, b) { p(a, b, DARK5, 3); });
    ell(AMB, 153.5, 36.5, 2.6, 2.6, function (u, w) { return u + w < -.4 ? 4 : 3; }, 2); p(152, 39, HOOD, 3); p(155, 39, HOOD, 3); p(152, 40, HOOD, 2); p(155, 40, HOOD, 2);
    for (k = 0; k < 6; k++) p(128 + k * 5, 19 + k * 4, PAP, 5);

    // TSE certificate
    shape(WOOD, 166, 15, 188, 43, function (px, py) { return (px < 168 || px > 186 || py < 17 || py > 41) ? (py < 17 || px < 168 ? 3 : 2) : 2; }, 1);
    rect(168, 17, 19, 25, PAP, 5); rect(169, 18, 17, 23, PAP, 4.6);
    ell(HOOD, 177.5, 26, 8, 8, function (u, w) { var q = u * u + w * w; return q > .78 ? 2.6 : 3.4; }, 2);
    tx('TSE', 172, 24, 5, PAP);
    rect(171, 37, 13, 1, PAP, 2.6); rect(173, 39, 9, 1, PAP, 3); p(170, 37, HOOD, 3.4); p(184, 37, HOOD, 3.4);

    // portrait of Mustafa Kemal Atatürk: gilt frame, black-and-white studio photograph, brass picture light
    shape(AMB, 284, 5, 309, 41, function (px, py) {
      var r = Math.min(px - 284, 309 - px, py - 5, 41 - py);
      if (r === 1) return (px === 285 || py === 6) ? ((px === 285 && py === 6) ? 4.4 : 3.6) : 2.4;
      return r === 2 ? 1.6 : 2;
    }, 1);
    [[285, 6], [308, 6], [285, 40], [308, 40]].forEach(function (c) { p(c[0], c[1], AMB, 4.4); });
    // 20x31 grayscale map downsampled from a public-domain 1932 photograph (Wikimedia Commons: File:Ataturk1930s.jpg)
    var ATA = [4.0,4.1,4.2,4.4,4.5,4.6,4.8,4.3,3.7,3.3,2.9,3.3,4.1,4.1,4.0,4.0,4.0,4.0,3.9,3.9,4.0,4.1,4.2,4.3,4.6,4.4,2.5,1.7,2.0,2.3,1.7,1.3,2.0,3.2,4.1,3.9,3.8,3.9,3.9,3.9,4.0,4.0,4.1,4.3,4.2,1.5,1.2,2.9,4.2,4.4,4.2,3.3,3.1,2.1,2.8,3.9,3.8,3.8,3.7,3.6,4.0,4.0,4.2,4.4,2.2,1.1,3.1,4.3,4.4,4.4,4.4,4.4,4.4,4.1,2.2,3.2,3.7,3.8,3.7,3.4,3.8,4.1,4.2,4.0,1.0,1.4,3.5,4.4,4.5,4.4,4.4,4.4,4.3,4.4,3.2,2.7,3.7,3.7,3.6,3.6,3.9,4.2,4.3,4.2,1.5,0.8,2.7,4.2,4.4,4.4,4.4,4.4,4.3,4.3,3.8,2.5,3.4,3.5,3.5,3.6,4.0,4.2,4.2,4.4,2.1,1.4,3.4,4.2,4.4,4.5,4.5,4.4,4.4,4.5,4.2,2.6,3.1,3.4,3.4,3.3,4.2,4.2,4.2,4.3,3.0,2.0,3.5,4.1,3.4,3.6,3.6,3.9,4.4,3.8,2.8,1.7,3.0,3.3,3.3,3.2,4.4,4.4,4.3,4.2,4.2,4.0,3.8,4.1,3.5,3.1,2.0,3.4,4.1,2.7,2.3,1.6,3.0,3.1,3.1,3.2,4.3,4.4,4.4,4.4,4.0,3.8,3.5,4.0,4.4,4.4,4.0,4.2,4.2,3.7,3.9,2.8,2.4,2.8,2.8,2.9,4.1,4.2,4.3,4.4,4.1,4.0,3.3,3.2,4.2,4.4,4.5,4.3,4.3,3.7,3.7,2.0,2.0,2.3,2.4,2.5,4.1,4.1,4.2,4.2,4.2,3.9,3.3,3.2,3.6,4.0,4.2,3.9,4.1,3.2,1.8,1.1,1.8,2.1,2.1,2.2,4.1,4.0,4.0,4.2,4.3,3.8,2.7,3.6,3.7,4.0,4.2,4.3,3.8,2.3,1.3,1.0,1.4,1.7,1.8,2.1,4.1,3.9,4.0,4.1,4.2,4.0,2.0,3.1,3.8,4.0,3.9,3.9,3.3,2.2,2.0,0.8,1.1,1.5,1.6,1.9,4.0,3.9,3.9,3.9,4.2,4.4,3.3,2.4,3.2,3.6,4.1,3.8,3.2,2.2,0.9,0.7,1.0,1.2,1.5,1.9,3.9,4.0,4.0,4.0,4.1,2.8,4.6,3.5,2.1,2.5,3.5,3.9,3.2,1.7,0.6,0.8,1.0,1.1,1.5,1.9,4.0,4.2,4.0,3.0,1.2,1.5,4.7,4.8,3.9,1.9,1.1,1.7,2.5,3.0,0.7,0.7,1.0,1.1,1.4,1.9,3.8,2.7,1.3,0.5,0.3,1.8,4.7,4.6,4.7,4.4,3.3,4.1,4.7,4.4,1.3,0.4,0.7,1.1,1.5,1.8,0.7,0.4,0.5,0.6,0.4,1.8,4.8,4.6,4.6,4.6,4.7,4.6,4.6,4.7,2.1,0.4,0.5,0.6,1.0,1.4,0.5,0.5,0.6,0.6,0.4,2.0,4.8,4.6,4.5,4.5,4.6,4.5,4.6,4.6,2.6,0.3,0.5,0.5,0.5,0.5,0.5,0.6,0.6,0.6,0.4,2.3,4.8,4.6,4.5,4.5,4.6,4.6,4.5,4.6,3.1,0.3,0.5,0.5,0.5,0.5,0.5,0.6,0.5,0.6,0.4,2.4,4.8,4.6,4.5,4.5,4.5,4.5,4.5,4.6,3.6,0.4,0.5,0.5,0.5,0.6,0.5,0.5,0.5,0.6,0.4,2.4,4.8,4.6,4.5,4.5,4.5,4.5,4.5,4.6,3.9,0.6,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,2.2,4.7,4.5,4.5,4.5,4.5,4.5,4.5,4.6,4.1,0.7,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,2.0,4.7,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.3,0.9,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,1.9,4.7,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.4,1.0,0.4,0.6,0.6,0.5,0.5,0.5,0.5,0.5,0.4,1.7,4.6,4.5,4.5,4.5,4.2,4.5,4.5,4.5,4.5,1.2,0.4,0.5,0.5,0.6,0.5,0.5,0.5,0.5,0.4,1.6,4.6,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,1.4,0.4,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,1.3,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.6,1.5,0.4,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,1.2,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.6,1.6,0.4,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,1.0,4.4,4.5,4.5,4.5,4.5,4.5,4.5,4.5,4.6,1.6,0.3,0.3,0.3,0.3];
    for (y = 0; y < 31; y++) for (x = 0; x < 20; x++) p(287 + x, 8 + y, STEEL, ATA[y * 20 + x]);
    rect(290, 2, 14, 2, AMB, 3); rect(290, 2, 14, 1, AMB, 4); rect(296, 4, 2, 1, DARK5, 2.5);
    if (night) for (x = 291; x < 303; x++) if (x < 296 || x > 297) p(x, 4, 0, x % 2 ? 25 : 24);


    // shelf, books, duck, pot
    rect(328, 38, 56, 3, WOOD, 4); rect(328, 38, 56, 1, WOOD, 5); rect(328, 40, 56, 1, WOOD, 2.5); rect(328, 41, 56, 1, WALL, 3);
    [334, 377].forEach(function (bx) { rect(bx, 41, 2, 4, DARK5, 3); rect(bx - 2, 44, 4, 1, DARK5, 2); });
    var BK = [[330, 3, 13, HOOD, 3], [333, 4, 11, BLU, 3], [337, 3, 14, GRN, 3], [340, 3, 10, AMB, 3], [343, 5, 12, PAP, 4], [348, 3, 13, DARK5, 4], [351, 4, 9, HOOD, 2]];
    BK.forEach(function (b) { for (var yy = 38 - b[2]; yy < 38; yy++) for (var xx = b[0]; xx < b[0] + b[1]; xx++) { var v = b[4] + (xx === b[0] ? .8 : 0) - (xx === b[0] + b[1] - 1 ? .8 : 0); if (yy === 40 - b[2] || yy === 34) v += .9; if (yy === 38 - b[2]) v -= .6; p(xx, yy, b[3], v); } });
    shape(BLU, 354, 26, 362, 37, function (px, py) { var o = (px + .5 - 355) - (37.5 - py) * .45; return o >= 0 && o <= 3.2 ? (o < 1 ? 4.6 : 3.6) : null; }, 1);
    ell(AMB, 366, 35, 3.6, 2.4, function (u, w) { return w < -.3 && u < .2 ? 4 : 3.2; }, 1.5);
    ell(AMB, 364, 31.5, 2.2, 2.2, function (u, w) { return w < -.2 ? 4 : 3.2; }, 1.5);
    p(361, 32, TEA, 2.6); p(362, 32, TEA, 2.6); p(363, 31, DARK5, 0);
    shape(TEA, 369, 31, 381, 37, function (px, py) { var hw = py === 31 ? 6.5 : 5.5 - (py - 32) * .35; return Math.abs(px + .5 - 375) <= hw ? (py === 31 ? 3 : px > 377 ? 1.5 : 2.2) : null; }, 1);
    [[371, 29, 2.4], [375, 26, 2.6], [379, 28, 2.4], [381, 31, 2], [369, 31, 2], [376, 30, 2.2], [373, 24, 1.8]].forEach(function (l) { ell(GRN, l[0], l[1], l[2], l[2] * .7, function (u, w) { return u + w < -.5 ? 4 : u + w > .6 ? 2.4 : 3.2; }, 1.4); });

    // cork board with notes and a red thread
    shape(WOOD, 334, 50, 378, 88, function (px, py) { if (px < 336 || px > 376 || py < 52 || py > 86) return (py < 52 || px < 336) ? 3 : 2.2; var h = hs(px, py, 3); return 3.6 + (h < .18 ? -.8 : h > .9 ? .8 : 0); }, 1);
    var NOTES = [[338, 55, 11, 10, HOOD, 5], [352, 54, 10, 9, PAP, 5], [365, 56, 10, 10, AMB, 3.4], [339, 70, 10, 11, GRN, 4], [353, 68, 12, 13, PAP, 5], [367, 72, 8, 9, HOOD, 4]];
    NOTES.forEach(function (n, i) {
      for (var yy = n[1]; yy < n[1] + n[3]; yy++) for (var xx = n[0]; xx < n[0] + n[2]; xx++) { var v = n[5] - (yy === n[1] + n[3] - 1 ? .8 : 0); p(xx, yy, n[4], v); }
      if (i === 4) { rect(n[0] + 1, n[1] + 1, n[2] - 2, 8, BLU, 3); rect(n[0] + 1, n[1] + 6, n[2] - 2, 3, BLU, 2); rect(n[0] + 3, n[1] + 3, 2, 3, PAP, 4); }
      else for (var r = n[1] + 3; r < n[1] + n[3] - 2; r += 2) for (var xx2 = n[0] + 2; xx2 < n[0] + n[2] - 2; xx2++) if (hs(xx2, r, i) < .72) p(xx2, r, n[4], n[5] - 1.6);
      p(n[0] + (n[2] >> 1), n[1], HOOD, 3);
    });
    ln(343, 55, 357, 54, function (a, b) { p(a, b, HOOD, 3.4); }); ln(357, 54, 371, 72, function (a, b) { p(a, b, HOOD, 3.4); }); ln(344, 70, 359, 68, function (a, b) { p(a, b, HOOD, 3.4); });

    // desk
    for (y = 120; y < 142; y++) for (x = 0; x < W; x++) {
      var g = Math.sin(x * .045 + y * 1.9 + Math.sin(x * .011 + y) * 3);
      p(x, y, WOOD, y === 120 ? 2.4 : y === 121 ? 3.3 : 4 - (g > .82 ? .7 : 0) + (g < -.95 ? .4 : 0));
    }
    rect(0, 142, W, 1, WOOD, 5); rect(0, 143, W, 6, WOOD, 3); rect(0, 149, W, 1, WOOD, 1.6);
    // monitors + stands
    rect(228, 56, 2, 7, DARK5, 3);
    for (k in MON) if (k !== 'm5') bezel(MON[k]);
    stand(143, 116, 18); stand(212, 114, 22); stand(292, 112, 18);
    p(141, 114, 0, 31); p(210, 112, 0, 31); p(290, 110, 0, night ? 15 : 31); p(230, 54, 0, 31);
    // lamp
    ell(HOOD, 38, 134, 8, 2.2, function (u, w) { return w < -.2 ? 3.6 : 2.6; }, 1);
    seg(HOOD, 38, 132, 30, 107, 1.1, 3, null); seg(HOOD, 30, 107, 49, 92, 1.1, 3.2, null);
    ell(DARK5, 30, 107, 1.8, 1.8, 3.5, 1); ell(DARK5, 49, 92, 1.8, 1.8, 3.5, 1);
    shape(HOOD, 42, 86, 66, 108, function (px, py) { var dx = px + .5 - 49, dy = py + .5 - 91.5, a = dx * .45 + dy * .89, b = -dx * .89 + dy * .45; if (a < -1 || a > 10) return null; var hw = 2.2 + a * .42; if (Math.abs(b) > hw) return null; if (a > 8.6) return 5.2; return 3.2 + (b > .6 ? .9 : 0) - (b < -hw + 1.2 ? .7 : 0); }, 1);
    if (night) for (y = 92; y < 108; y++) for (x = 46; x < 66; x++) { var dx3 = x + .5 - 49, dy3 = y + .5 - 91.5, a3 = dx3 * .45 + dy3 * .89, b3 = -dx3 * .89 + dy3 * .45; if (a3 > 8.6 && a3 <= 10 && Math.abs(b3) <= 2.2 + a3 * .42 - 1) p(x, y, 0, 25); }
    cable(31, 135, 16, 141, 1, DARK5, 1); cable(16, 142, 20, 198, 4, DARK5, 1);
    // kettle (lower pot)
    shape(STEEL, 62, 112, 96, 135, function (px, py) { return ketF(px + .5 - 78, py + .5 - 134); }, 1);
    // saucer, spoon, sugar
    rect(94, 131, 13, 1, PAP, 5); rect(93, 132, 15, 1, PAP, 4); rect(95, 133, 11, 1, PAP, 2.6); p(93, 132, AMB, 3); p(107, 132, AMB, 3); p(94, 131, AMB, 3.4); p(106, 131, AMB, 3.4);
    ln(104, 131, 108, 128, function (a, b) { p(a, b, STEEL, 5); });
    rect(111, 131, 3, 3, PAP, 4); rect(111, 131, 3, 1, PAP, 5); rect(114, 132, 3, 3, PAP, 4); rect(114, 132, 3, 1, PAP, 5);
    // phone
    shape(DARK5, 125, 128, 133, 134, function () { return 1.5; }, 0); p(126, 129, DARK5, 3.4);
    // keyboard
    shape(DARK5, 160, 129, 228, 137, function (px, py) { if ((px === 160 || px === 228) && (py === 129 || py === 137)) return null; return (py % 2 === 0 && px % 2 === 1 && px > 161 && px < 227 && py < 137) ? 4 : 2; }, 1);
    p(163, 130, HOOD, 4); if (night) for (x = 162; x < 227; x++) p(x, 138, 0, 13);
    // mouse pad + mouse
    rect(240, 128, 35, 12, DARK5, 1.4); for (x = 240; x < 275; x += 2) { p(x, 128, HOOD, 2.6); p(x, 139, HOOD, 2.6); }
    ell(DARK5, 257, 134, 3, 3.6, function (u, w) { return u < -.2 && w < 0 ? 4 : 3; }, 1); p(257, 131, HOOD, 4.5);
    // notebook + pen
    rect(292, 129, 24, 10, PAP, 5); for (y = 131; y < 139; y += 2) rect(296, y, 18, 1, PAP, 3.6); rect(292, 138, 24, 1, PAP, 3); for (y = 130; y < 138; y += 2) p(293, y, DARK5, 3);
    seg(HOOD, 300, 127, 315, 135, .8, 3.2, null); p(315, 135, STEEL, 5); p(316, 136, STEEL, 4);
    // laptop
    bezel(MON.m5);
    for (y = 126; y < 132; y++) { var ex = y - 126; for (x = 327 - ex; x <= 375 + ex; x++) { var v2 = y === 126 ? 2 : y === 131 ? 2.4 : 4.2 + (x < 330 - ex ? .8 : 0) - (x > 372 + ex ? .8 : 0); if (y > 126 && y < 130 && x % 2 === 0 && x > 333 && x < 369) v2 = 3.2; if (y === 130 && x > 345 && x < 357) v2 = 3.6; p(x, y, STEEL, v2); } }
    cable(327, 129, 320, 142, 1, DARK5, 1); cable(320, 143, 262, 199, 10, DARK5, 1);
    // under desk: legs, pc, power strip, cables
    [4, 376].forEach(function (lx) { rect(lx, 150, 5, 50, DARK5, 2.5); rect(lx, 150, 1, 50, DARK5, 3.6); });
    shape(DARK5, 298, 158, 330, 200, function (px, py) { return py === 158 ? 3.4 : ((px + py) % 3 === 0 ? 1.6 : 2.4); }, 0);
    for (y = 162; y < 196; y++) p(302, y, 0, night ? 15 : 14);
    ell(DARK5, 316, 178, 7, 7, function (u, w) { var q = u * u + w * w; return q > .7 ? 3 : q < .1 ? 3 : 1.6; }, null);
    if (night) ell(0, 316, 178, 7, 7, function (u, w) { return u * u + w * w > .72 ? 14 : null; }, null);
    p(326, 162, 0, 31);
    rect(232, 199, 32, 3, PAP, 4); rect(232, 199, 32, 1, PAP, 5); for (x = 236; x < 260; x += 5) p(x, 200, DARK5, 1); p(234, 200, 0, 15);
    cable(212, 150, 238, 199, 7, DARK5, 1); cable(290, 150, 250, 199, 9, DARK5, 1); cable(143, 150, 244, 199, 16, DARK5, .5);

    M0.set(M); V0.set(V); K0.set(K);
    lights(night);
  }

  /* ---------- window view ---------- */
  var STARS = [[18, 17], [27, 24], [41, 15], [52, 29], [64, 18], [71, 33], [80, 15], [104, 38], [16, 36], [47, 39], [88, 41], [33, 31], [57, 14], [101, 16], [68, 25], [24, 44], [83, 27]];
  var HOUSES = [[13, 8, 81], [21, 6, 79], [27, 7, 85], [34, 7, 80], [41, 8, 84], [49, 7, 79], [56, 7, 86]];
  var LED = [15, 28, 24, 31, 14];
  function view(night, t) {
    var x, y, k;
    for (y = 13; y < 93; y++) for (x = 13; x < 109; x++) {
      var s = (y - 13) / 46 * 2.4 + BAY[(y & 3) * 4 + (x & 3)];
      ve(x, y, night ? (s < 1 ? 26 : s < 2.1 ? 27 : 9) : (s < .7 ? 28 : s < 1.6 ? 29 : s < 2.5 ? 7 : 11));
    }
    if (night) {
      STARS.forEach(function (st, i) { var tw = Math.sin(t * 1.7 + i * 2.1); ve(st[0], st[1], tw > .6 ? 7 : tw > -.4 ? 6 : 5); });
      for (y = 18; y < 31; y++) for (x = 88; x < 102; x++) { var a = (x + .5 - 95) * (x + .5 - 95) + (y + .5 - 24) * (y + .5 - 24), b = (x + .5 - 97.5) * (x + .5 - 97.5) + (y + .5 - 22.5) * (y + .5 - 22.5); if (a <= 21 && b > 17) ve(x, y, a > 15 ? 6 : 7); }
    } else {
      for (y = 18; y < 33; y++) for (x = 89; x < 106; x++) { var q = Math.sqrt((x + .5 - 97) * (x + .5 - 97) + (y + .5 - 25) * (y + .5 - 25)); if (q <= 4.6) ve(x, y, 25); else if (q <= 6.4 && BAY[(y & 3) * 4 + (x & 3)] < .5) ve(x, y, 7); }
      [[0, 30, 18], [70, 22, 12], [40, 40, 14]].forEach(function (c) {
        var cx = Math.round(13 + ((t * 1.1 + c[0]) % 140) - 22), cy = c[1], w = c[2];
        for (x = 2; x < w - 2; x++) ve(cx + x, cy, 7);
        for (x = 0; x < w; x++) ve(cx + x, cy + 1, 7);
        for (x = 1; x < w - 1; x++) ve(cx + x, cy + 2, 6);
      });
      for (k = 0; k < 3; k++) {
        var gx = Math.round(13 + ((t * 7 + k * 41) % 120) - 10), gy = Math.round(30 + k * 7 + Math.sin(t * .9 + k) * 3), fl = Math.floor(t * 3 + k) % 2;
        if (fl) { ve(gx, gy, 4); ve(gx + 1, gy + 1, 4); ve(gx + 2, gy + 1, 4); ve(gx + 3, gy + 1, 4); ve(gx + 4, gy, 4); ve(gx + 2, gy + 2, 5); }
        else { ve(gx, gy + 1, 4); ve(gx + 1, gy, 4); ve(gx + 2, gy + 1, 4); ve(gx + 3, gy, 4); ve(gx + 4, gy + 1, 4); }
      }
    }
    // Asian shore hills + lights
    for (x = 13; x < 109; x++) {
      var hy = Math.round(57 - 2.5 * Math.sin(x * .055 + .4) - 1.5 * Math.sin(x * .16 + 2));
      for (y = hy; y < 65; y++) ve(x, y, night ? (hs(x, y, 7) < .07 && y > hy + 1 ? 24 : 1) : (hs(x, y, 5) < .12 ? 27 : 28));
    }
    // mosque on the hill
    var mc = night ? 21 : 10, ms = night ? 20 : 9, mt = night ? 25 : 9;
    for (y = 50; y < 64; y++) for (x = 86; x < 109; x++) {
      var ins = false, sh = false;
      if (y >= 56 && x >= 89 && x <= 105) { ins = true; sh = x > 99; }
      var u = (x + .5 - 97) / 6, w = (y + .5 - 56) / 5; if (y < 56 && u * u + w * w <= 1) { ins = true; sh = x > 98; }
      [[91, 57], [103, 57]].forEach(function (c) { var uu = (x + .5 - c[0]) / 2.6, ww = (y + .5 - c[1]) / 2.4; if (y < 58 && uu * uu + ww * ww <= 1) { ins = true; sh = x > c[0]; } });
      if (ins) ve(x, y, sh ? ms : mc);
    }
    ve(97, 50, mt); ve(97, 49, mt);
    [[87, 39], [107, 39], [92, 45], [102, 45]].forEach(function (m) { for (y = m[1]; y < 63; y++) ve(m[0], y, mc); ve(m[0], m[1] - 1, mt); ve(m[0], m[1] - 2, mt); ve(m[0] - 1, m[1] + 6, mc); ve(m[0] + 1, m[1] + 6, mc); if (m[1] < 42) { ve(m[0] - 1, m[1] + 12, mc); ve(m[0] + 1, m[1] + 12, mc); } });
    if (night) for (x = 90; x < 105; x += 3) ve(x, 60, 25);
    // water
    for (y = 65; y < 93; y++) for (x = 13; x < 109; x++) {
      var c2 = night ? (y > 84 && BAY[(y & 3) * 4 + (x & 3)] > .5 ? 1 : 26) : (y < 68 ? 27 : 28);
      var h = hs(x >> 2, y, Math.floor(t * 1.5) + (x & 3));
      if (!night && y > 67 && h < .012) c2 = h < .004 ? 7 : 29;
      if (night) {
        var fall = (y - 65) / 28;
        if (x >= 90 && x <= 104 && h < .3 - fall * .2) c2 = 20;
        else if (x >= 24 && x <= 31 && y > 86 && h < .35) c2 = 24;
        else if (x >= 34 && x <= 77 && (x & 1) && h < .18 - fall * .12) c2 = LED[(Math.floor(x / 5 + t * 3)) % 5];
      }
      ve(x, y, c2);
    }
    // bridge
    for (x = 13; x < 109; x++) {
      var cy2 = x < 34 ? 58 - (x - 13) / 21 * 14 : x <= 77 ? 59 - 15 * Math.pow((x - 55.5) / 21.5, 2) : 44 + (x - 77) / 31 * 14;
      var cyr = Math.round(cy2);
      if (!night && x % 3 === 0) for (y = cyr + 1; y < 62; y++) ve(x, y, 6);
      ve(x, cyr, night ? (x % 2 ? 2 : LED[(Math.floor(x / 6 + t * 2.5)) % 5]) : 4);
      ve(x, 62, night ? 2 : 4); ve(x, 63, night ? 1 : 3);
      if (night && x % 4 === 0) ve(x, 62, 25);
    }
    [34, 76].forEach(function (tx0) { for (y = 43; y < 64; y++) { ve(tx0, y, night ? 2 : 4); ve(tx0 + 1, y, night ? 3 : 5); } ve(tx0, 47, night ? 3 : 3); ve(tx0 + 1, 47, night ? 3 : 3); if (night) { ve(tx0, 42, 15); } });
    // ferry
    var fx = Math.round(13 + ((t * 2.4) % 140) - 20), fy = 78;
    for (x = 0; x < 16; x++) { ve(fx + x, fy, night ? (x > 1 && x < 14 && x % 2 ? 25 : 3) : (x > 1 && x < 14 && x % 2 ? 4 : 7)); if (x > 0 && x < 15) ve(fx + x, fy + 1, 1); }
    for (x = 3; x < 13; x++) { ve(fx + x, fy - 2, night ? 3 : 7); ve(fx + x, fy - 1, x % 2 ? (night ? 25 : 4) : (night ? 3 : 7)); }
    for (y = fy - 5; y < fy - 2; y++) { ve(fx + 7, y, 1); ve(fx + 8, y, 1); }
    for (x = 1; x < 6; x++) if (x % 2) ve(fx - x, fy + 1, night ? 27 : 29);
    // Galata tower + houses
    for (y = 45; y < 93; y++) for (x = 23; x < 33; x++) { var col = x <= 24 ? 0 : x >= 30 ? 2 : 1; ve(x, y, night ? [19, 20, 21][col] : [10, 11, 7][col]); }
    for (y = 31; y < 45; y++) { var rr = y - 31, hw2 = .5 + rr * .42; for (x = 21; x < 35; x++) if (Math.abs(x + .5 - 28) <= hw2) ve(x, y, night ? (x >= 28 ? 3 : 2) : (x >= 28 ? 5 : 4)); }
    ve(27, 30, night ? 24 : 4); ve(27, 29, night ? 24 : 4); ve(27, 28, night ? 25 : 4);
    for (x = 23; x < 33; x += 2) { ve(x, 46, night ? 25 : 3); ve(x, 47, night ? 25 : 3); }
    for (x = 21; x < 35; x++) ve(x, 49, night ? 3 : 4);
    [57, 66, 75].forEach(function (wy) { ve(27, wy, night ? 24 : 3); ve(28, wy, night ? 24 : 3); ve(27, wy + 1, night ? 24 : 3); ve(28, wy + 1, night ? 24 : 3); });
    HOUSES.forEach(function (hh, i) {
      for (y = hh[2]; y < 93; y++) for (x = hh[0]; x < hh[0] + hh[1]; x++) {
        var c3 = y === hh[2] ? (night ? 1 : 23) : night ? 2 : [11, 7, 10, 11, 7, 6, 11][i];
        if (y > hh[2] + 1 && (y - hh[2]) % 3 === 0 && (x - hh[0]) % 2 === 1 && x < hh[0] + hh[1] - 1) c3 = night ? (hs(x, y, i) < .55 ? (hs(x, y, 9) < .3 ? 25 : 24) : 3) : 4;
        ve(x, y, c3);
      }
    });
    if (!night) for (y = 76; y < 93; y++) { var cw = y < 79 ? 0 : 1; for (x = 46 - cw; x <= 46 + cw; x++) ve(x, y, x < 46 ? 30 : 16); }
  }

  /* ---------- screens ---------- */
  var MACH = ['WIREGUARD', 'DOKPLOY', 'SIYUAN', 'COMFYUI', 'JELLYSTAT', 'KYUUBI', 'FLUENTD', 'KOTAEMON', 'PERSPECTIVE', 'NUXT', 'AVIDEO', 'AIRFLOW', 'FEAST', 'GPT-SOVITS', 'TWIG', 'FREESCOUT', 'CRAWL4AI', 'METABASE', 'COCKPIT', 'DOKKU', 'KESTRA', 'PORTAINER', 'GOTENBERG', 'BESZEL', 'ADGUARD'];
  var REV = [4, 9, 14, 19, 23];
  var LOG = [['> CVE-2026-9198.PY', 0], ['[*] LANGFLOW 1.10.0', 1], ['[*] GET /AUTO_LOGIN', 1], ['[+] SUPERUSER JWT', 2], ['[+] RCE CONFIRMED', 2], ['UID=0(ROOT)', 3], ['> CVE-2026-68771.PY', 0], ['[*] COMFYUI LOADER', 1], ['[+] PICKLE FIRED', 2], ['> CVE-2026-53595.SH', 0], ['[*] FREESCOUT INVITE', 1], ['[+] ADMIN SESSION', 2], ['[+] SHELL WWW-DATA', 2], ['> CVE-2026-32136.PY', 0], ['[*] ADGUARD H2C', 1], ['[+] API NO AUTH', 2]];
  var LOGT = [], LOGC = 0;
  LOG.forEach(function (l) { var dur = l[1] === 0 ? l[0].length * .08 + .5 : .35; LOGT.push([LOGC, dur]); LOGC += dur; });
  LOGC += 3;
  var CVE = [['2026-9198', 15], ['2026-32136', 15], ['2026-44881', 24], ['2026-56121', 24], ['2026-59243', 24], ['2025-32463', 28]];
  var PORTS = [['22', 'SSH'], ['80', 'HTTP'], ['389', 'LDAP'], ['443', 'HTTPS'], ['445', 'SMB']];
  var NG = [[236, 25], [249, 21], [261, 27], [244, 33], [258, 38], [238, 44], [251, 48]], NE = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [3, 5], [4, 6], [5, 6], [1, 3]];
  function eline(x0, y0, x1, y1, c) { ln(x0, y0, x1, y1, function (a, b) { e(a, b, c); }); }

  function screens(t, hov) {
    var X, Y, k, y;
    // m1 portrait: OffSec machine list
    X = 124; Y = 52; CL = [X, Y, X + 38, Y + 62]; er(X, Y, 38, 62, hov === 'm1' ? 2 : 1);
    er(X, Y, 38, 7, 12); tx('OFFSEC', X + 2, Y + 1, 15); tx('53', X + 29, Y + 1, 7);
    tx('39 LIVE', X + 2, Y + 9, 31); er(X + 2, Y + 15, 34, 1, 3); er(X + 2, Y + 15, 25, 1, 31);
    CL = [X, Y + 18, X + 38, Y + 62];
    var n = MACH.length, off = (t * 4) % (n * 6), sel = Math.floor(t / 1.6) % n;
    for (k = 0; k < n; k++) {
      y = Math.round(Y + 19 + k * 6 - off); if (y < Y + 12) y += n * 6; if (y > Y + 62) continue;
      if (k === sel) er(X, y - 1, 38, 7, hov === 'm1' ? 3 : 2);
      er(X + 1, y, 1, 5, REV.indexOf(k) < 0 ? 31 : 24);
      tx(MACH[k].slice(0, 9), X + 3, y, k === sel ? 7 : 6);
    }
    // m2 centre: exploit output
    X = 170; Y = 64; CL = [X, Y, X + 84, Y + 48]; er(X, Y, 84, 48, hov === 'm2' ? 2 : 1);
    er(X, Y, 84, 7, 2); e(X + 2, Y + 3, 15); e(X + 5, Y + 3, 24); e(X + 8, Y + 3, 31); tx('~/EXPLOITS', X + 14, Y + 1, 5);
    var lt = t % LOGC, j = 0, part = 1;
    for (k = 0; k < LOG.length; k++) if (lt >= LOGT[k][0]) { j = k; part = Math.min(1, (lt - LOGT[k][0]) / LOGT[k][1]); }
    var lines = [];
    for (k = 0; k <= j; k++) { var s = LOG[k][0]; if (k === j && LOG[k][1] === 0) s = s.slice(0, Math.max(2, Math.floor(s.length * part))); lines.push([s, LOG[k][1]]); }
    if (j === LOG.length - 1 && lt > LOGT[j][0] + LOGT[j][1]) lines.push(['> ', 0]);
    lines = lines.slice(-6);
    lines.forEach(function (l, i) {
      var yy = Y + 9 + i * 6, s2 = l[0];
      if (l[1] === 0) { tx('>', X + 2, yy, 15); tx(s2.slice(2), X + 10, yy, 7); }
      else if (l[1] === 3) tx(s2, X + 2, yy, 15);
      else { tx(s2.slice(0, 3), X + 2, yy, l[1] === 2 ? 31 : 5); tx(s2.slice(4), X + 18, yy, 6); }
      if (i === lines.length - 1 && Math.floor(t * 2.5) % 2) { var cx = X + 2 + (l[1] === 0 ? 8 + (s2.length - 2) * 4 : s2.length * 4); er(cx, yy, 3, 5, 7); }
    });
    // m3 VulnTracker
    X = 262; Y = 68; CL = [X, Y, X + 60, Y + 42]; er(X, Y, 60, 42, hov === 'm3' ? 2 : 1);
    er(X, Y, 60, 7, 13); tx('VULNTRACKER', X + 2, Y + 1, 7); if (Math.floor(t * 2) % 2) er(X + 55, Y + 2, 2, 2, 31);
    var st = Math.floor(t / 2.5) % CVE.length;
    for (k = 0; k < 4; k++) {
      var cvi = CVE[(st + k) % CVE.length]; y = Y + 9 + k * 6;
      if (k === 0) er(X, y - 1, 60, 7, hov === 'm3' ? 3 : 2);
      tx(cvi[0], X + 2, y, k === 0 ? 7 : 6); er(X + 45, y, 12, 5, cvi[1]); if (cvi[1] === 28) tx('KEV', X + 45, y, 1);
    }
    for (k = 0; k < 14; k++) { var bh = Math.max(1, Math.min(8, Math.round(4 + 2.5 * Math.sin(k * .9 + t * 1.5) + 1.5 * Math.sin(k * .37 - t * .7)))); er(X + 2 + k * 4, Y + 41 - bh, 3, bh, k === 13 ? 15 : 14); }
    // m4 top: nmap + network graph
    X = 192; Y = 14; CL = [X, Y, X + 76, Y + 40]; er(X, Y, 76, 40, hov === 'm4' ? 2 : 1);
    tx('>', X + 2, Y + 2, 15); tx('NMAP -SV LAB', X + 6, Y + 2, 7);
    var cyc = t % 9, shown = Math.min(5, Math.floor(cyc / 1.1));
    for (k = 0; k < shown; k++) { tx(PORTS[k][0], X + 2, Y + 9 + k * 6, 31); tx(PORTS[k][1], X + 16, Y + 9 + k * 6, 6); }
    if (shown < 5) er(X + 2, Y + 13 + shown * 6, 1 + (Math.floor(t * 4) % 4) * 3, 1, 5);
    NE.forEach(function (ed) { eline(NG[ed[0]][0], NG[ed[0]][1], NG[ed[1]][0], NG[ed[1]][1], 3); });
    var pe = NE[Math.floor(t * 1.4) % NE.length], pf = (t * 1.4) % 1;
    e(Math.round(NG[pe[0]][0] + (NG[pe[1]][0] - NG[pe[0]][0]) * pf), Math.round(NG[pe[0]][1] + (NG[pe[1]][1] - NG[pe[0]][1]) * pf), 31);
    NG.forEach(function (nd, i) { er(nd[0] - 1, nd[1] - 1, 2, 2, i === 3 ? (Math.floor(t * 2) % 2 ? 15 : 14) : 28); });
    er(X + 2, Y + 38, 40, 1, 3); er(X + 2, Y + 38, Math.round(40 * Math.min(1, cyc / 6)), 1, 15);
    // m5 laptop: Bowerbird shelves
    X = 332; Y = 100; CL = [X, Y, X + 38, Y + 24]; er(X, Y, 38, 24, hov === 'm5' ? 6 : 7);
    tx('BOWERBIRD', X + 1, Y + 1, 14);
    var hop = Math.floor(t / 1.5) % 5, A = [15, 24, 28, 31, 14], B = [21, 29, 13, 16, 23];
    for (k = 0; k < 5; k++) er(X + 2 + k * 7, Y + 8 - (k === hop ? 1 : 0), 5, 5, A[k]);
    er(X + 1, Y + 14, 36, 1, 10);
    var sl = Math.max(0, 30 * (1 - (t % 8) / 1.2));
    for (k = 0; k < 5; k++) er(Math.round(X + 2 + k * 7 + (k === 4 ? sl : 0)), Y + 16, 5, 5, B[k]);
    er(X + 1, Y + 22, 36, 1, 10);
    CL = null;
    var r = hov && (MON[hov] || (hov === 'oscp' ? HOT.oscp : null)); if (r) { er(r[0] - 1, r[1] - 1, r[2] + 2, 1, 15); er(r[0] - 1, r[1] + r[3], r[2] + 2, 1, 15); er(r[0] - 1, r[1], 1, r[3], 15); er(r[0] + r[2], r[1], 1, r[3], 15); }
  }

  /* ---------- live bits: lights, cat, plant, tea, person ---------- */
  function bulbs(night, t) {
    BULBS.forEach(function (b, i) {
      if (night) { var c = [24, 15, 25, 31][i % 4]; if (Math.sin(t * 1.3 + i * 1.7) < -.7) c = [20, 13, 24, 30][i % 4]; p(b[0], b[1] + 1, 0, c); }
      else p(b[0], b[1] + 1, STEEL, 4.4);
    });
  }
  function cat(t) {
    var br = (Math.floor(t * .9) % 2) * .4, sw = Math.sin(t * 1.1) > .3 ? Math.round(Math.sin(t * 5) * 1.4) : 0;
    shape(WOOD, 86, 93, 98, 112, function (x, y) { var px = x + .5, py = y + .5; var dd = Math.min(sd(px, py, 89, 94, 92, 99), sd(px, py, 92, 99, 93 + sw * .5, 104), sd(px, py, 93 + sw * .5, 104, 92 + sw, 108)); return dd <= 1.1 ? (py > 105 ? 3 : 4) : null; }, 1);
    ell(WOOD, 81, 92, 10, 4.6 + br, function (u, w, x, y) { if (y > 95) return null; return 4 + (w < -.55 ? .8 : 0) - (w > .45 ? .8 : 0) - ((x + (y >> 1)) % 4 === 0 && w < .5 ? 1 : 0); }, 1);
    ell(WOOD, 70, 91, 4.4, 3.9, function (u, w) { return 4.2 + (w < -.4 ? .7 : 0) - (u > .55 ? .6 : 0); }, 1);
    p(66, 86, WOOD, 1); p(66, 87, WOOD, 3); p(67, 87, WOOD, 1); p(65, 87, WOOD, 1); p(73, 86, WOOD, 1); p(73, 87, WOOD, 3); p(72, 87, WOOD, 1); p(74, 87, WOOD, 1);
    p(68, 91, DARK5, 0); p(67, 90, DARK5, 1); p(72, 91, DARK5, 0); p(73, 90, DARK5, 1); p(70, 92, HOOD, 4);
    ell(WOOD, 67.5, 94.5, 2.2, 1.4, 5, 1);
  }
  function vines(t) {
    [[[372, 40], [371, 48], [369, 56], [370, 64], [368, 72], [369, 79]], [[379, 40], [380, 47], [378, 54], [379, 61]]].forEach(function (v, vi) {
      for (var k = 1; k < v.length; k++) {
        var a = v[k - 1], b = v[k], swa = Math.sin(t * 1.1 + a[1] * .15 + vi) * (a[1] - 40) / 40, swb = Math.sin(t * 1.1 + b[1] * .15 + vi) * (b[1] - 40) / 40;
        ln(a[0] + swa, a[1], b[0] + swb, b[1], function (x, y) { p(x, y, GRN, 2); });
        var lx = Math.round(b[0] + swb) + (k % 2 ? -2 : 1), ly = b[1] - 1;
        p(lx, ly, GRN, 3); p(lx + 1, ly, GRN, 4); p(lx, ly + 1, GRN, 2.6); p(lx + 1, ly + 1, GRN, 3.2); p(lx + (k % 2 ? -1 : 2), ly + 1, GRN, 2.6);
      }
    });
  }
  var GP = [2.5, 2.8, 3.2, 3.4, 3.3, 3, 2.6, 2.3, 2.4, 2.7, 3, 3.3, 3.6, 3.8];
  function glass(bx, by, lvl) {
    var fillH = lvl > .02 ? 1 + lvl * 11.5 : 0;
    for (var hh = 0; hh < 14; hh++) {
      var y = by - hh, hw = GP[hh];
      for (var x = Math.floor(bx - hw); x <= Math.ceil(bx + hw); x++) {
        var u = x + .5 - bx; if (Math.abs(u) > hw) continue;
        var edge = Math.abs(u) > hw - 1;
        if (hh === 0) p(x, y, STEEL, 5);
        else if (hh <= fillH && !edge) p(x, y, TEA, hh >= fillH - 1 ? 2.6 : (u > hw - 2 ? 1.2 : u < -hw + 2 ? 2.6 : hh < 3 ? 1.3 : 1.7));
        else if (edge) p(x, y, STEEL, u < 0 ? 5 : hh === 13 ? 5 : 4);
        else if (hh > fillH && u < -hw + 2 && hh % 2) p(x, y, STEEL, 5);
      }
    }
  }
  function steam(x0, y0, t, n) {
    var f = Math.floor(t * 6);
    for (var w = 0; w < n; w++) for (var k = 0; k < 12; k++) {
      if (((k - f - w * 2) % 4 + 4) % 4 === 0) continue;
      p(x0 + w * 2 - 1 + Math.round(Math.sin(k * .45 + t * 2.2 + w * 2) * 1.3), y0 - k, STEEL, k > 7 ? 4.4 : 5.2);
    }
  }
  function ease(k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return k * k * (3 - 2 * k); }
  function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

  var slurped = false, AC = null, wantCine = false, cine = null, CINE = 5.6, CZ = 2.4, CAM = [168, 110], level = .2, pourT = null, sipT = null, nextSip = 26, pourFrom = .2, sipFrom = 1, autoPour = 1.2, pourSndAt = null, introAt = 0;
  var GRIP = [101, 124], KEYL = [PX - 36, 135], MOUTH = [PX - 13, 105], CMOUTH = [PX - 20, 117];
  function demlik(o, a) {
    var c = Math.cos(a), s = Math.sin(a);
    shape(STEEL, o[0] - 18, o[1] - 18, o[0] + 18, o[1] + 6, function (x, y) { var dx = x + .5 - o[0], dy = y + .5 - o[1]; return demF(dx * c + dy * s, -dx * s + dy * c); }, 1);
  }
  function tea(t) {
    var o = [78, 114], a = 0, stream = false;
    if (pourT != null) {
      var s = (t - pourT) / 4.5, T = [85, 108];
      if (s >= 1) { pourT = null; level = 1; }
      else {
        if (s < .18) o = lerp(o, T, ease(s / .18));
        else if (s < .82) { o = T; a = s < .28 ? .8 * ease((s - .18) / .1) : s < .72 ? .8 : .8 * (1 - ease((s - .72) / .1)); }
        else o = lerp(T, o, ease((s - .82) / .18));
        if (s > .3 && s < .74) { stream = true; level = pourFrom + (1 - pourFrom) * ease((s - .3) / .4); }
      }
    }
    demlik([Math.round(o[0]), Math.round(o[1])], a);
    var held = sipT != null && (t - sipT) / 4 >= .3 && (t - sipT) / 4 < .86;
    if (!held) glass(100, 130, level);
    if (stream) {
      var c = Math.cos(a), sn = Math.sin(a), sx = Math.round(o[0] + 10.5 * c + 11 * sn), sy = Math.round(o[1] + 10.5 * sn - 11 * c);
      var top = Math.round(130 - (1 + level * 11.5));
      for (var y = sy + 1; y < top; y++) { p(sx, y, TEA, 3); if (y > sy + 2) p(sx - 1, y, TEA, 2); }
      p(sx - 2, top, TEA, 3); p(sx + 1, top, TEA, 3);
    }
    if (!held && level > .2 && !stream) steam(100, 116, t, 2);
    steam(94, 112, t + 1.3, 1);
  }
  function pose(t) {
    var c = t % 24, hx = 0, hy = 0, typing = false, hl = KEYL.slice(), hr = [PX + 50, 134], g = null, turn = 0;
    if (c < 8 || (c >= 16 && c < 22)) typing = true;
    else if (c < 14) hy = Math.floor(t * 3.2) % 2;
    else if (c < 16) hy = -1;
    else hx = 1;
    var f = Math.floor(t * 12);
    if (typing) { if ((f * 7) % 3 === 0) hl[1] -= 1; if (f % 5 === 0) hr[0] += 1; }
    else if (Math.floor(t * 1.5) % 3 === 0) hr[1] -= .5;
    if (sipT != null && t >= sipT) {
      var s = (t - sipT) / 4, mo = cine != null ? CMOUTH : MOUTH;
      if (s >= 1) { sipT = null; if (level < .35) autoPour = t + 2; }
      else {
        if (cine != null) { turn = s < .14 ? ease(s / .14) : s < .84 ? 1 : 1 - ease((s - .84) / .12); typing = false; hl = KEYL.slice(); hx = -Math.round(turn * 2); hy = 0; hr = [PX + 50 - turn * 6, 134 + turn * 2]; }
        if (s < .22) hl = lerp(KEYL, GRIP, ease(s / .22));
        else if (s < .3) hl = GRIP;
        else if (s < .5) hl = lerp(GRIP, mo, ease((s - .3) / .2));
        else if (s < .68) { hl = mo; hy = -1; if (cine == null) hx = -1; level = Math.max(0, sipFrom - .3 * ease((s - .5) / .18)); }
        else if (s < .86) hl = lerp(mo, GRIP, ease((s - .68) / .18));
        else hl = lerp(GRIP, KEYL, ease((s - .86) / .14));
        if (s >= .3 && s < .86) g = [Math.round(hl[0] - 1), Math.round(hl[1] + 6)];
      }
    }
    return { hx: hx, hy: hy, hl: hl, hr: hr, g: g, turn: turn };
  }
  function torsoFn(x, y) {
    var dx = x + .5 - PX, a = Math.abs(dx), top;
    if (a <= 9) top = 122; else if (a <= 27) top = 122 + (a - 9) * .36; else if (a <= 34) top = 128.5 + Math.pow((a - 27) / 7, 2) * 10; else return null;
    var hw = 34 - Math.max(0, y - 138) * .16; if (y + .5 < top || a > hw) return null;
    var v = 2.2 - dx / 34 * .25;
    if (y + .5 - top < 2.5) v += .8;
    var ac = 25 + (y - 136) * .04; if (y > 136 && Math.abs(a - ac) < .6) v = 1.3;
    if (y > 134 && y < 150 && a > 14 && a < 24 && Math.abs((a - 18) - (y - 134) * .8) < .5) v -= .6;
    if (y > 150) v -= .3;
    return v;
  }
  function arm(from, h, side) {
    seg(HOOD, from[0], from[1], h[0] + 2 * side, h[1] + 3, 3.6, 2.3, 1);
    var ux = h[0] - from[0], uy = h[1] - from[1], l = Math.sqrt(ux * ux + uy * uy) || 1; ux /= l; uy /= l;
    seg(HOOD, h[0] - ux * 5, h[1] - uy * 5 + 1, h[0] - ux * 2.5, h[1] - uy * 2.5 + 1, 3, 1.6, 1);
    ell(SKIN, h[0], h[1], 3.4, 2.6, function (u, w) { return 3 + (w < -.3 && u < .3 ? 1 : 0) - (u > .5 ? .7 : 0); }, 1);
  }
  function hairAt(cx, cy, x, y) {
    var dx = (x + .5 - cx) / 11, dy = (y + .5 - cy) / 13.2, ang = Math.atan2(dy, dx), r = 1;
    if (dy < 0) r += .06 * Math.sin(ang * 7 + 1.3) + .03 * Math.sin(ang * 13);
    if (dx * dx + dy * dy > r * r) return null;
    if (dy > .72 && Math.abs(dx) > (1 - (dy - .72) * 2.2) * .75) return null;
    var lit = -dx * .45 - dy * .8, v = 1.8 + (lit > .35 ? 1 : 0) + (lit > .7 ? .8 : 0);
    if (dy > .5) v -= .5;
    if ((x * 3 + y * 2) % 7 === 0 && lit > -.2) v -= .8;
    return v;
  }
  function faceAt(cx, cy, x, y) {
    var dx = (x + .5 - cx) / 11, dy = (y + .5 - cy) / 13.2;
    if (dy < -.3 || dx * dx + dy * dy > 1.02) return false;
    return dx < -.32 + Math.max(0, dy - .35) * 1.1;
  }
  function cup(x, y, rx) { ell(DARK5, x, y, rx, 5.2, function (u, w) { return 2.6 + (u < -.3 ? 1 : 0) + (w < -.5 ? .5 : 0); }, 0); ell(HOOD, x - rx * .1, y, Math.max(.8, rx * .37), 2.5, 4, null); }
  function head(cx, cy, turn) {
    var side = turn > .66;
    ell(DARK5, cx + 11, cy + 3.5, side ? 2.2 : 3.2, 5, 2.5, 0);
    shape(HAIR, cx - 12, cy - 15, cx + 12, cy + 14, function (x, y) { return side && faceAt(cx, cy, x, y) ? null : hairAt(cx, cy, x, y); }, 0);
    if (side) {
      /* 3/4 left profile: cheek and jaw in skin, nose and chin as one-tone silhouette */
      shape(SKIN, cx - 15, cy - 5, cx, cy + 14, function (x, y) { if (!faceAt(cx, cy, x, y)) return null; var dy = (y + .5 - cy) / 13.2; return dy > .5 || x > cx - 5 ? 2 : 3; }, 0);
      [[-13, 0], [-13, 1], [-14, 1], [-13, 2], [-14, 2], [-12, 3], [-12, 6], [-11, 7], [-11, 9], [-10, 9], [-10, 10], [-9, 10]].forEach(function (q) { p(cx + q[0], cy + q[1], SKIN, 2); });
      p(cx - 11, cy - 2, HAIR, 1); p(cx - 10, cy - 2, HAIR, 1); p(cx - 10, cy - 1, HAIR, .6);
      seg(DARK5, cx - 1, cy - 2, cx + 1, cy - 12, 1, 2.6, 0); seg(DARK5, cx + 1, cy - 12, cx + 7, cy - 14.5, 1, 3.4, 0);
      cup(cx - 1, cy + 3, 3.2);
    } else {
      shape(DARK5, cx - 13, cy - 15, cx + 13, cy + 4, function (x, y) { var dx = (x + .5 - cx) / 12.7, dy = (y + .5 - cy - .3) / 14.5, q = Math.sqrt(dx * dx + dy * dy); if (dy > .22 || q < .86 || q > 1) return null; return q > .95 ? 3.6 : 2.3; }, null);
      if (turn > .33) { for (var k = 4; k < 9; k++) p(cx - 12, cy + k, SKIN, 2); cup(cx - 9.5, cy + 4, 3); }
      else cup(cx - 11.6, cy + 4, 3.5);
    }
  }
  function person(t) {
    var ps = pose(t), hx = ps.hx, hy = ps.hy;
    LY = 1;
    if (ps.g) glass(ps.g[0], ps.g[1], level);
    arm([PX + 26 - ps.turn * 3, 152], ps.hr, -1);
    arm([PX - 26, 152], ps.hl, 1);
    shape(HOOD, PX - 40, 118, PX + 40, 220, torsoFn, 1);
    ell(HOOD, PX - 1, 124.5, 10, 5, .8, null);
    rect(PX - 5, 113, 8, 11, SKIN, 2);
    head(PX - 1 + hx, 108.5 + hy, ps.turn);
    shape(HOOD, PX - 22, 119, PX + 20, 142, function (x, y) {
      var dx = x + .5 - (PX - 1), dy = y + .5 - 131, o = (dx / 19.5) * (dx / 19.5) + (dy / 10.5) * (dy / 10.5); if (o > 1) return null;
      var ix = dx / 10.2, iy = (y + .5 - 124.5) / 5.4; if (ix * ix + iy * iy < 1) return null;
      var v = 2.4 - dx / 40; if (dy < -6) v += .9; if (Math.sin(dx * .8 + dy * .6) > .8) v -= .7; return v;
    }, 1);
    LY = 2;
    shape(DARK5, PX - 29, 164, PX + 29, 220, function (x, y) {
      var dx = x + .5 - PX, a = Math.abs(dx), top = 166 + Math.pow(dx / 28, 2) * 4; if (a > 28 || y + .5 < top) return null;
      if (a > 22 && y + .5 < top + (a - 22) * 1.4) return null;
      if (y + .5 - top < 1.5) return 4; if (a > 25.5) return 3; if (y >= 193 && y <= 197) return 2.9; return (x + y) % 2 === 0 ? 2.5 : 2;
    }, 0);
    LY = 0;
  }
  function rim(night) {
    for (var y = 92; y < HT; y++) for (var x = 90; x < 300; x++) {
      var i = y * W + x; if (K[i] !== 1) continue;
      var up = K[i - W] === 0, side = y < 140 && (K[i - 1] === 0 || K[i + 1] === 0);
      if (night) { if (up || side) { var m = M[i]; if (m === HAIR || m === DARK5) { M[i] = 0; V[i] = 28; } else if (m === HOOD) { M[i] = 0; V[i] = 14; } else if (m === SKIN) { M[i] = 0; V[i] = 20; } } }
      else if (K[i - 1] === 0 && x < PX && M[i]) V[i] += 1;
    }
  }

  /* ---------- frame ---------- */
  var curNight = null, hov = null;
  function draw(t) {
    var night = isNight();
    if (night !== curNight) { curNight = night; build(night); }
    if (!RM.matches) {
      if (autoPour && t > autoPour && pourT == null && sipT == null) { autoPour = 0; pourT = t; pourFrom = level; }
      if (wantCine && sipT == null && pourT == null) {
        if (level > .95) { wantCine = false; slurped = false; cine = t; sipT = t + .8; sipFrom = level; nextSip = t + 30 + Math.random() * 12; }
        else { pourT = t; pourFrom = level; autoPour = 0; }
      }
      if (introAt && t > introAt) { introAt = 0; if (!wantCine && cine == null) { wantCine = true; scene.classList.add('cine'); } }
      /* sounds follow the animation: pour clip covers the visible stream (s .3-.74 of 4.5 s), slurp covers glass-at-lips (s .3-.86 of 4 s) */
      if (pourT != null && pourSndAt !== pourT && (t - pourT) / 4.5 >= .3) { pourSndAt = pourT; pourSound(); }
      if (cine != null && sipT != null && !slurped && t - sipT >= 1.2) { slurped = true; slurp(); }
      if (cine != null && t - cine >= CINE) { cine = null; scene.classList.remove('cine'); }
      if (sipT == null && pourT == null && t > nextSip && level > .3) { sipT = t; sipFrom = level; nextSip = t + 28 + Math.random() * 12; }
    }
    M.set(M0); V.set(V0); K.set(K0);
    view(night, t); bulbs(night, t); screens(t, hov); cat(t); vines(t); tea(t); person(t); rim(night);
    var amb = night ? -2 : 0, pamb = night ? -1.3 : 0;
    for (var y = 0, i = 0; y < HT; y++) { var br = (y & 3) * 4; for (var x = 0; x < W; x++, i++) {
      var m = M[i], c;
      if (m === 0) c = V[i]; else { var s = V[i] + (K[i] === 1 ? pamb + LT[i] * .35 : amb + LT[i]) + (DITH[m] ? BAY[br + (x & 3)] : .5); s = s < 0 ? 0 : s > 5 ? 5 : s | 0; c = RAMP[m][s]; }
      out[i] = PC[c];
    } }
    bctx.putImageData(img, 0, 0);
    camera(t);
  }
  /* camera: scale the 384x216 frame onto a backing store of whole device pixels; zoom snaps to a whole pixel size when it settles */
  var KK = 1;
  function camera(t) {
    var k = 0;
    if (cine != null) { var u = t - cine; k = u < .8 ? ease(u / .8) : u < CINE - .8 ? 1 : ease((CINE - u) / .8); }
    var zf = Math.round(KK * CZ) / KK, S = KK * (1 + (zf - 1) * k), cw = cv.width, ch = cv.height;
    var fx0 = VX + VW / 2, fx = fx0 + (CAM[0] - fx0) * k, fy = HT / 2 + (CAM[1] - HT / 2) * k;
    var ox = Math.round(cw / 2 - fx * S), oy = Math.round(ch / 2 - fy * S);
    ox = Math.min(0, Math.max(cw - Math.ceil(W * S), ox)); oy = Math.min(0, Math.max(ch - Math.ceil(HT * S), oy));
    ctx.imageSmoothingEnabled = false;
    if (k === 0 && VW === W) ctx.drawImage(buf, 0, 0, cw, ch); else ctx.drawImage(buf, ox, oy, W * S, HT * S);
  }

  /* ---------- loop, sizing, events ---------- */
  var t0 = performance.now(), last = 0, raf = 0, onScreen = true, tNow = 0, STILL = 5.2;
  function loop(now) { raf = requestAnimationFrame(loop); if (now - last < 83) return; last = now; tNow = (now - t0) / 1000; draw(tNow); }
  function start() { if (!raf && !RM.matches && !d.hidden && onScreen) { t0 = performance.now() - tNow * 1000; raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function paint() { if (!raf) draw(RM.matches ? STILL : tNow); }
  if (RM.matches) level = 1;
  d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(stage);
  if (RM.addEventListener) RM.addEventListener('change', function () { stop(); if (RM.matches) { level = 1; pourT = sipT = cine = null; wantCine = false; scene.classList.remove('cine'); } paint(); start(); });
  if (DARK.addEventListener) DARK.addEventListener('change', paint);

  var CROP = opts.crop || null, mq = CROP && window.matchMedia ? matchMedia('(max-width: ' + (CROP.below - .02) + 'px)') : null, VX = 0, VW = W;
  var hotEls = {};
  HOTS.forEach(function (h) {
    var el = d.createElement(h.tea ? 'button' : 'a');
    el.className = 'hot' + (h.cls ? ' ' + h.cls : ''); el.id = 'h-' + h.id;
    if (h.tea) { el.type = 'button'; el.setAttribute('aria-label', 'Have a sip of tea'); } else { el.href = h.href; el.target = '_blank'; el.rel = 'noopener'; }
    var tg = d.createElement('span'); tg.className = 'tag'; tg.textContent = h.tag; if (h.tea) tg.setAttribute('aria-hidden', 'true');
    el.appendChild(tg); scene.appendChild(el); hotEls[h.id] = el;
    function on() { if (scene.classList.contains('cine')) return; hov = h.id; paint(); } function off() { if (hov === h.id) hov = null; paint(); }
    el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off); el.addEventListener('focus', on); el.addEventListener('blur', off);
  });
  function layout() {
    var crop = mq && mq.matches;
    VX = crop ? CROP.x : 0; VW = crop ? CROP.w : W;
    HOTS.forEach(function (h) {
      var el = hotEls[h.id], r = HOT[h.id], x0 = Math.max(r[0], VX), x1 = Math.min(r[0] + r[2], VX + VW);
      if (x1 - x0 < 8) { el.style.display = 'none'; el.tabIndex = -1; return; }
      el.style.display = ''; el.removeAttribute('tabindex');
      el.style.left = ((x0 - VX) / VW * 100) + '%'; el.style.top = (r[1] / HT * 100) + '%'; el.style.width = ((x1 - x0) / VW * 100) + '%'; el.style.height = (r[3] / HT * 100) + '%';
      el.classList.toggle('end', !!h.end || (crop && (x0 + x1) / 2 - VX > VW * .6));
      el.classList.toggle('beg', !!crop && (x0 + x1) / 2 - VX < VW * .25);
    });
  }
  var KKold = 0;
  function fit() {
    layout();
    var cw = stage.clientWidth, dpr = window.devicePixelRatio || 1, k = Math.floor(cw * dpr / VW), css = k * VW / dpr;
    scene.style.width = (k >= 1 && css >= cw * .8 ? css : cw) + 'px';
    var kk = Math.max(1, Math.min(6, k || 1));
    if (kk !== KK || cv.width !== VW * kk) { KK = kk; cv.width = VW * kk; cv.height = HT * kk; paint(); }
  }
  window.addEventListener('resize', fit);
  if (mq && mq.addEventListener) mq.addEventListener('change', fit);

  /* "hüüp": synthesized tea slurp (WebAudio, no files). Browsers only allow sound after a user gesture. */
  function audio() {
    try { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === 'suspended') AC.resume(); } catch (e) {}
    return AC;
  }
  /* recorded clips: pour = Pixabay (freesound_community "tea"), sip = Freesound #447388 by florianreichelt (CC0) */
  var CLIP = {}, want = {};
  function loadClips() {
    var a = audio(); if (!a || !window.fetch) return;
    ['pour', 'sip'].forEach(function (k) {
      if (CLIP[k] !== undefined) return; CLIP[k] = null;
      fetch('/assets/audio/tea-' + k + '.mp3?v=3').then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, no) { a.decodeAudioData(b, ok, no); }); })
        .then(function (buf) { CLIP[k] = buf; if (want[k] && Date.now() - want[k] < 1500) play(k); want[k] = 0; }, function () { delete CLIP[k]; });
    });
  }
  function play(k) {
    var a = AC; if (!a) return false;
    if (!CLIP[k] || a.state !== 'running') { want[k] = Date.now(); return false; }
    want[k] = 0;
    try { var src = a.createBufferSource(), g = a.createGain(); src.buffer = CLIP[k]; g.gain.value = .6; src.connect(g); g.connect(a.destination); src.start(); return true; } catch (e) { return false; }
  }
  function pourSound() { play('pour'); }
  function noise(a, dur) {
    var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = a.createBufferSource(); s.buffer = buf; return s;
  }
  function slurp() {
    if (CLIP.sip && play('sip')) return;
    var a = audio(); if (!a || a.state !== 'running') return;
    try {
      var t0 = a.currentTime + .03, dur = 1.05, out = a.createGain(); out.gain.value = .5; out.connect(a.destination);
      /* "hüüü": airy inhale through hot tea, pitch rising, with a bubbly flutter */
      var src = noise(a, dur);
      var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5;
      bp.frequency.setValueAtTime(450, t0); bp.frequency.exponentialRampToValueAtTime(1500, t0 + .55); bp.frequency.exponentialRampToValueAtTime(2600, t0 + dur - .1);
      var hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
      var trem = a.createGain(); trem.gain.value = .6;
      var lfo = a.createOscillator(); lfo.frequency.setValueAtTime(14, t0); lfo.frequency.linearRampToValueAtTime(30, t0 + dur);
      var lg = a.createGain(); lg.gain.value = .4; lfo.connect(lg); lg.connect(trem.gain);
      var g = a.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.35, t0 + .12); g.gain.linearRampToValueAtTime(.6, t0 + dur - .15); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur - .02);
      src.connect(hp); hp.connect(bp); bp.connect(trem); trem.connect(g); g.connect(out);
      src.start(t0); src.stop(t0 + dur); lfo.start(t0); lfo.stop(t0 + dur);
      /* "p": lips close — a short low pop at the end */
      var tp = t0 + dur - .03, o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(180, tp); o.frequency.exponentialRampToValueAtTime(70, tp + .07);
      var pg = a.createGain(); pg.gain.setValueAtTime(.0001, tp); pg.gain.exponentialRampToValueAtTime(.7, tp + .006); pg.gain.exponentialRampToValueAtTime(.0001, tp + .09);
      o.connect(pg); pg.connect(out); o.start(tp); o.stop(tp + .1);
    } catch (e) {}
  }

  /* first interaction anywhere unlocks sound and plays one sip, so the "hüüp" is actually heard */
  var unlocked = false;
  function unlock(e) {
    if (unlocked) return; unlocked = true;
    document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true);
    audio(); loadClips(); introAt = 0;
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    if (!RM.matches && !wantCine && cine == null && !(hotEls.tea.contains(e && e.target))) { wantCine = true; hov = null; scene.classList.add('cine'); }
  }
  document.addEventListener('touchend', function () { audio(); }, { capture: true, passive: true });
  document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);

  hotEls.tea.addEventListener('click', function () {
    audio();
    if (RM.matches) { level = 1; paint(); return; }
    if (wantCine || cine != null) return;
    wantCine = true; hov = null; scene.classList.add('cine');
  });

  /* intro waits for the first click/tap/key so its pour and sip can be heard; plays silently after 8 s if nobody interacts */
  if (opts && opts.intro && !RM.matches) { autoPour = 0; introAt = 8; }
  fit(); draw(RM.matches ? STILL : 0);
  start();
  return api;
} };
})();
