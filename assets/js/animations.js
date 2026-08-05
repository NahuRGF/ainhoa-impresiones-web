/* Ports vanilla JS de react-bits (DavidHDev/react-bits):
   TextLoop, Magnet, TiltedCard y SpotlightCard, sin dependencias. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- TextLoop: texto que fluye sobre un path SVG ---------- */
  function initTextLoop(root) {
    var path = root.querySelector('.rb-tl-path');
    var head = root.querySelector('.rb-tl-head');
    var tail = root.querySelector('.rb-tl-tail');
    var measure = root.querySelector('.rb-tl-measure-path');
    if (!path || !head || !tail || !measure) return;

    var speed = parseFloat(root.getAttribute('data-speed')) || 90;
    var length = 0;
    var unitW = 0;
    var offset = 0;
    var last = null;
    var playing = true;

    function measureLoop() {
      try {
        length = path.getTotalLength();
        unitW = measure.getComputedTextLength();
      } catch (e) { return; }
      if (!length || !unitW) return;
      var reps = Math.ceil(length / unitW) + 2;
      var unit = measure.textContent;
      head.textContent = unit.repeat(reps);
      tail.textContent = unit.repeat(reps);
    }

    measureLoop();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureLoop).catch(function () {});
    }

    function apply() {
      if (!length) return;
      var o = offset % length;
      if (o < 0) o += length;
      head.setAttribute('startOffset', o.toFixed(2));
      tail.setAttribute('startOffset', (o - length).toFixed(2));
    }
    apply();

    function frame(t) {
      if (playing) {
        if (last !== null) offset += speed * (t - last) / 1000;
        last = t;
        apply();
      } else {
        last = null;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    root.addEventListener('pointerenter', function () { playing = false; });
    root.addEventListener('pointerleave', function () { playing = true; });
  }

  /* ---------- Magnet: el elemento se desplaza hacia el cursor ---------- */
  function initMagnet(el, opts) {
    opts = opts || {};
    var strength = opts.strength || 2;
    var padding = opts.padding || 60;
    var active = false;

    function onMove(e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var near = Math.abs(cx - e.clientX) < r.width / 2 + padding &&
                 Math.abs(cy - e.clientY) < r.height / 2 + padding;
      if (near) {
        active = true;
        el.style.transform = 'translate3d(' + ((e.clientX - cx) / strength) + 'px, ' +
          ((e.clientY - cy) / strength) + 'px, 0)';
      } else if (active) {
        active = false;
        el.style.transform = '';
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
  }

  /* ---------- TiltedCard: inclinación 3D con suavizado ---------- */
  function initTilt(el, opts) {
    opts = opts || {};
    var amplitude = opts.amplitude || 14;
    var scale = opts.scale || 1.05;
    var curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    var curS = 1, tgtS = 1;
    var running = false;

    function frame() {
      curX += (tgtX - curX) * 0.14;
      curY += (tgtY - curY) * 0.14;
      curS += (tgtS - curS) * 0.14;
      el.style.transform = 'perspective(720px) rotateX(' + curX.toFixed(3) + 'deg) ' +
        'rotateY(' + curY.toFixed(3) + 'deg) scale(' + curS.toFixed(4) + ')';
      if (Math.abs(tgtX - curX) > 0.02 || Math.abs(tgtY - curY) > 0.02 || Math.abs(tgtS - curS) > 0.001) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function start() {
      if (!running) { running = true; requestAnimationFrame(frame); }
    }

    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var ox = e.clientX - r.left - r.width / 2;
      var oy = e.clientY - r.top - r.height / 2;
      tgtY = (ox / (r.width / 2)) * amplitude;
      tgtX = (oy / (r.height / 2)) * -amplitude;
      tgtS = scale;
      start();
    });

    el.addEventListener('mouseleave', function () {
      tgtX = 0;
      tgtY = 0;
      tgtS = 1;
      start();
    });
  }

  /* ---------- SpotlightCard: radial que sigue al cursor ---------- */
  function initSpotlight(el, color) {
    if (el.querySelector('.rb-spot')) return;
    var spot = document.createElement('span');
    spot.className = 'rb-spot';
    spot.setAttribute('aria-hidden', 'true');
    el.appendChild(spot);
    el.classList.add('rb-spot-host');
    el.style.setProperty('--spotlight-color', color);
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
      el.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
    });
  }

  if (reduce) return;

  var bands = document.querySelectorAll('.rb-textloop');
  for (var i = 0; i < bands.length; i++) initTextLoop(bands[i]);

  var magnets = document.querySelectorAll('.magnet');
  for (var j = 0; j < magnets.length; j++) initMagnet(magnets[j]);

  var tilts = document.querySelectorAll('.product-art, .hero-icon, .hero-logo, .joya-ring svg');
  for (var k = 0; k < tilts.length; k++) {
    var t = tilts[k];
    var isArt = t.classList.contains('product-art');
    initTilt(t, { amplitude: isArt ? 16 : 12, scale: isArt ? 1.07 : 1.05 });
  }

  var spots = document.querySelectorAll('.product-card, .category-card, .memo-pad, .joya-card, .horarios-card');
  var spotColors = {
    'product-card': 'rgba(185, 192, 200, 0.6)',
    'category-card': 'rgba(230, 0, 126, 0.18)',
    'memo-pad': 'rgba(230, 0, 126, 0.16)',
    'joya-card': 'rgba(232, 181, 77, 0.3)',
    'horarios-card': 'rgba(230, 0, 126, 0.18)'
  };
  for (var m = 0; m < spots.length; m++) {
    var s = spots[m];
    var color = 'rgba(255, 255, 255, 0.4)';
    for (var c in spotColors) {
      if (s.classList.contains(c)) { color = spotColors[c]; break; }
    }
    initSpotlight(s, color);
  }
})();
