/* CarHelp — página inicial: 3D (Three.js), animações ligadas ao scroll e transições.
   Tudo é "melhoria progressiva": sem JavaScript a página continua legível. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function fmt(n, d) { return n.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts || false); }

  /* ── 1. Botões da Google Play ─────────────────────────────────────────── */
  (function playButtons() {
    var url = (window.PLAY_STORE_URL || '').trim();
    var live = url !== '';
    $$('[data-play-link]').forEach(function (a) {
      if (live) {
        a.href = url; a.classList.remove('is-soon');
        a.target = '_blank'; a.rel = 'noopener';
      } else {
        a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1');
      }
    });
    $$('[data-play-small]').forEach(function (el) { el.textContent = live ? 'Obter na' : 'Brevemente'; });
    $$('[data-play-btn]').forEach(function (a) {
      if (live) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Obter na Google Play'; }
    });
    $$('[data-play-note]').forEach(function (el) {
      el.textContent = live ? 'Disponível para Android, com 10 dias grátis.' : 'A app chega em breve à Google Play.';
    });
  })();

  /* ── 2. Título dividido em letras ─────────────────────────────────────── */
  (function splitTitles() {
    var counter;
    function splitNode(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'word';
            part.split('').forEach(function (chr) {
              var s = document.createElement('span');
              s.className = 'char';
              s.textContent = chr;
              s.style.setProperty('--i', counter++);
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          splitNode(ch);
        }
      });
    }
    $$('[data-split]').forEach(function (el) {
      var label = el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('aria-label', label);
      counter = 0;
      el.classList.add('split');
      splitNode(el);
      $$('.word', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
      requestAnimationFrame(function () { el.classList.add('go'); });
    });
  })();

  /* ── 3. Revelar ao entrar no ecrã ─────────────────────────────────────── */
  (function reveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ── 4. Cursor luminoso, botões magnéticos e cartões 3D ──────────────── */
  if (!coarse && !reduce) {
    (function cursor() {
      var glow = $('.cursor-glow');
      if (!glow) return;
      var tx = window.innerWidth / 2, ty = window.innerHeight / 2, x = tx, y = ty;
      on(window, 'pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.style.opacity = '1'; }, { passive: true });
      (function loop() {
        x = lerp(x, tx, 0.12); y = lerp(y, ty, 0.12);
        glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        requestAnimationFrame(loop);
      })();
    })();

    $$('.magnetic').forEach(function (el) {
      on(el, 'pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.22 + 'px,' + dy * 0.3 + 'px)';
      });
      on(el, 'pointerleave', function () { el.style.transform = ''; });
    });

    $$('.tilt').forEach(function (card) {
      on(card, 'pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      on(card, 'pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ── 5. Faixas em movimento ───────────────────────────────────────────── */
  var tracks = $$('.marquee .track').map(function (t, i) {
    // duplica os itens para o ciclo ser contínuo
    Array.prototype.slice.call(t.children).forEach(function (c) { t.appendChild(c.cloneNode(true)); });
    return { el: t, dir: i % 2 === 0 ? -1 : 1, w: 0 };
  });
  function measureTracks() { tracks.forEach(function (t) { t.w = t.el.scrollWidth / 2; }); }

  /* ── 6. Manómetro ligado ao scroll ────────────────────────────────────── */
  var gauge = (function () {
    var root = $('#manometro');
    if (!root) return null;
    var needle = $('#needle'), num = $('#gaugeNum'), verdict = $('#verdict'), g = $('#gaugeG');
    // Escala e arcos (180° = esquerda, 0° = direita)
    var NS = 'http://www.w3.org/2000/svg';
    function pt(r, deg) { var a = deg * Math.PI / 180; return [200 + r * Math.cos(a), 200 - r * Math.sin(a)]; }
    function arc(r, d0, d1) {
      var p0 = pt(r, d0), p1 = pt(r, d1);
      return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
    }
    if (g) {
      [[180, 128, '#4f7bff'], [128, 82, '#34d17a'], [82, 38, '#ffb020'], [38, 0, '#ff5a5f']].forEach(function (s) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', arc(150, s[0], s[1]));
        p.setAttribute('stroke', s[2]); p.setAttribute('stroke-width', '16'); p.setAttribute('fill', 'none');
        p.setAttribute('stroke-linecap', 'butt');
        g.appendChild(p);
      });
      for (var i = 0; i <= 24; i++) {
        var d = 180 - i * 7.5, big = i % 4 === 0;
        var a = pt(big ? 124 : 130, d), b = pt(138, d);
        var l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
        l.setAttribute('stroke', big ? '#c9d3ee' : '#56608a'); l.setAttribute('stroke-width', big ? 3 : 1.5);
        g.appendChild(l);
      }
    }
    function priceFor(angle) { return clamp(200 + (angle + 80) / 160 * 600, 200, 800); }
    return {
      root: root,
      update: function (p) {
        var a;
        if (p < 0.3) a = lerp(-82, 70, ease(p / 0.3));
        else if (p < 0.72) {
          var k = (p - 0.3) / 0.42;
          a = lerp(70, -5, ease(k)) + Math.sin(k * 26) * (1 - k) * 7;
        } else a = -5;
        if (needle) needle.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 200 200)');
        var price = p >= 0.72 ? 479.98 : priceFor(a);
        if (num) num.textContent = fmt(price, 2) + ' €';
        if (verdict) verdict.classList.toggle('on', p >= 0.74);
      }
    };
  })();

  /* ── 7. Telemóvel 3D ligado ao scroll ─────────────────────────────────── */
  var phone = (function () {
    var root = $('#app');
    if (!root) return null;
    var body = $('#phone');
    var scrs = $$('.scr', root), texts = $$('.step-t', root), dots = $$('.dots i', root);
    var n = texts.length, current = -1;
    function setStep(i) {
      if (i === current) return;
      current = i;
      texts.forEach(function (t, k) { t.classList.toggle('on', k === i); });
      if (typeof decode === 'function' && texts[i]) decode($('h3', texts[i]));
      scrs.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    setStep(0);
    return {
      root: root,
      update: function (p) {
        setStep(Math.min(n - 1, Math.floor(p * n)));
        if (!body || reduce) return;
        var ry = Math.sin(p * Math.PI * 2.0) * 26 + (p - 0.5) * 24;
        var rx = Math.cos(p * Math.PI * 2.0) * 7 - 3;
        var ty = Math.sin(p * Math.PI * 4) * 8;
        body.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      }
    };
  })();

  /* ── 8. Cinema: o vídeo expande ao fazer scroll ───────────────────────── */
  var cinema = (function () {
    var root = $('#pinVideo');
    if (!root) return null;
    var box = $('#videoBox'), video = $('#promo'), soundBtn = $('#soundBtn');
    if (!video) return null;
    var mq = window.matchMedia('(max-width: 760px), (orientation: portrait)');
    var SRC = { mobile: 'media/carhelp-mobile.mp4', desktop: 'media/carhelp-desktop.mp4' };
    var POSTER = { mobile: 'media/poster-mobile.jpg', desktop: 'media/poster-desktop.jpg' };
    var key = null;

    function pick() {
      var k = mq.matches ? 'mobile' : 'desktop';
      if (k === key) return;
      var resume = key !== null && !video.paused;
      key = k;
      video.poster = POSTER[k];
      video.src = SRC[k];
      video.load();
      if (resume) video.play().catch(function () {});
    }
    pick();
    if (mq.addEventListener) mq.addEventListener('change', pick); else if (mq.addListener) mq.addListener(pick);

    on(soundBtn, 'click', function () {
      video.muted = !video.muted;
      soundBtn.textContent = video.muted ? 'Ativar som' : 'Silenciar';
      if (video.paused) video.play().catch(function () {});
    });
    var playing = false;
    return {
      root: root,
      update: function (p) {
        var e = reduce ? 1 : ease(clamp(p / 0.4, 0, 1));
        if (box && !reduce) {
          box.style.clipPath = 'inset(' + lerp(18, 0, e).toFixed(2) + '% ' + lerp(26, 0, e).toFixed(2) + '% round ' + lerp(36, 0, e).toFixed(1) + 'px)';
        }
        var visible = p > 0.02 && p < 0.98;
        if (visible && !playing && !reduce) { playing = true; video.play().catch(function () {}); }
        if (!visible && playing) { playing = false; video.pause(); }
      }
    };
  })();

  /* ── 9. Planos: mensal / anual ────────────────────────────────────────── */
  (function plans() {
    var toggle = $('#planToggle');
    if (!toggle) return;
    var price = $('#proPrice'), per = $('#proPer'), alt = $('#proAlt');
    var btns = $$('button', toggle);
    var value = 19.99, raf = 0;
    function animateTo(target, suffix, text) {
      cancelAnimationFrame(raf);
      var from = value, t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / 520, 0, 1), v = lerp(from, target, ease(k));
        price.textContent = fmt(v, 2) + ' €';
        if (k < 1) raf = requestAnimationFrame(step); else value = target;
      })(t0);
      per.textContent = suffix;
      alt.textContent = text;
    }
    function set(mode) {
      toggle.classList.toggle('year', mode === 'year');
      btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === mode); b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false'); });
      if (mode === 'year') animateTo(19.99, '/ ano', 'Equivale a 1,67 € por mês — poupas cerca de 44%.');
      else animateTo(2.99, '/ mês', 'Sem compromisso. Cancelas quando quiseres.');
    }
    btns.forEach(function (b) { on(b, 'click', function () { set(b.getAttribute('data-mode')); }); });
  })();

  /* ── 10. Logo 3D (WebGL) ──────────────────────────────────────────────── */
  var gl = (function () {
    var canvas = $('#gl');
    var inst = null;
    if (canvas && window.THREE && window.CarHelpLogo3D) {
      try { inst = window.CarHelpLogo3D.create(canvas, { reduce: reduce, coarse: coarse }); } catch (err) { inst = null; }
    }
    if (!inst) { doc.classList.add('no-gl'); if (canvas) canvas.style.display = 'none'; }
    return inst;
  })();

  /* ── 10b. Linha ECG que se desenha com o scroll ───────────────────────── */
  var ecgTop = (function () {
    var svg = $('#ecgTop');
    if (!svg) return null;
    var path = $('#ecgPath', svg), dot = $('#ecgDot', svg);
    if (!path || !dot) return null;
    var len = 0;
    var NS = 'http://www.w3.org/2000/svg';
    function build() {
      var W = Math.max(320, window.innerWidth), y = 18, d = 'M0 ' + y, x = 0, period = 170;
      while (x < W + period) {
        d += ' L' + (x + 50) + ' ' + y + ' L' + (x + 62) + ' ' + (y - 4) + ' L' + (x + 74) + ' ' + y +
             ' L' + (x + 88) + ' ' + y + ' L' + (x + 94) + ' ' + (y + 4) + ' L' + (x + 102) + ' ' + (y - 13) +
             ' L' + (x + 111) + ' ' + (y + 11) + ' L' + (x + 120) + ' ' + y + ' L' + (x + 134) + ' ' + y +
             ' L' + (x + 148) + ' ' + (y - 5) + ' L' + (x + 160) + ' ' + y + ' L' + (x + period) + ' ' + y;
        x += period;
      }
      path.setAttribute('d', d);
      len = path.getTotalLength ? path.getTotalLength() : 0;
      path.style.strokeDasharray = len + ' ' + len;
    }
    build();
    on(window, 'resize', build);
    return {
      set: function (p) {
        if (!len) return;
        path.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
        var pt = path.getPointAtLength(len * p);
        dot.setAttribute('cx', pt.x.toFixed(1)); dot.setAttribute('cy', pt.y.toFixed(1));
      }
    };
  })();

  /* ── 10c. Títulos que se "descodificam" ───────────────────────────────── */
  var decode = (function () {
    var CH = '▮▯#%&@$01<>/+=?';
    function nodesOf(el) {
      var out = [], w = document.createTreeWalker ? document.createTreeWalker(el, 4) : null;
      if (!w) return out;
      var n; while ((n = w.nextNode())) { if (n.nodeValue.trim()) out.push(n); }
      return out;
    }
    return function run(el) {
      if (reduce || !el || el.__decoding) return;
      var nodes = nodesOf(el);
      if (!nodes.length) return;
      el.__decoding = true;
      var originals = nodes.map(function (n) { return n.nodeValue; });
      var total = originals.reduce(function (a, t) { return a + t.length; }, 0);
      var t0 = performance.now(), DUR = 650;
      (function step(now) {
        var k = clamp((now - t0) / DUR, 0, 1), reveal = k * total * 1.25, idx = 0;
        nodes.forEach(function (n, ni) {
          var src = originals[ni], out = '';
          for (var i = 0; i < src.length; i++, idx++) {
            var c = src[i];
            out += (c === ' ' || idx < reveal - 6 || k >= 1) ? c : CH[Math.floor(Math.random() * CH.length)];
          }
          n.nodeValue = out;
        });
        if (k < 1) requestAnimationFrame(step); else el.__decoding = false;
      })(t0);
    };
  })();
  $$('.h2, .final h2').forEach(function (h) { h.setAttribute('data-decode', ''); });
  if (!reduce && 'MutationObserver' in window) {
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var el = m.target;
        if (el.hasAttribute && el.hasAttribute('data-decode') && el.classList.contains('in') && !el.__decoded) {
          el.__decoded = true; decode(el);
        }
      });
    });
    $$('[data-decode]').forEach(function (h) { mo.observe(h, { attributes: true, attributeFilter: ['class'] }); });
  }

  /* ── 11. Motor de scroll (um só rAF para tudo) ────────────────────────── */
  var navEl = $('.nav');
  function pinProgress(el) {
    var r = el.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-r.top / total, 0, 1);
  }
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > -200 && r.top < window.innerHeight + 200;
  }
  /* faixas: deriva contínua + empurrão do scroll */
  var mq = $('.marquee'), mqVisible = false, autoOff = 0, mqLast = 0;
  function tickMarquee(now) {
    requestAnimationFrame(tickMarquee);
    if (!mqVisible || reduce) return;
    var dt = Math.min(50, now - mqLast); mqLast = now;
    autoOff += dt * 0.06;
    var y = window.pageYOffset || 0;
    tracks.forEach(function (t) {
      if (!t.w) return;
      var off = (autoOff + y * 0.35) % t.w;
      var x = t.dir < 0 ? -off : -t.w + off;
      t.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    });
  }
  if (mq && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { mqVisible = en[0].isIntersecting; }, { rootMargin: '200px' }).observe(mq);
    mqLast = performance.now();
    requestAnimationFrame(tickMarquee);
  }

  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (ecgTop) ecgTop.set(clamp(y / max, 0, 1));
    if (navEl) navEl.classList.toggle('solid', y > 40);

    if (gauge && inView(gauge.root)) gauge.update(reduce ? 1 : pinProgress(gauge.root));
    if (phone && inView(phone.root)) phone.update(reduce ? 0 : pinProgress(phone.root));
    if (cinema && inView(cinema.root)) cinema.update(reduce ? 1 : pinProgress(cinema.root));

    if (reduce && gl) gl.renderOnce();
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  on(window, 'scroll', schedule, { passive: true });
  on(window, 'resize', function () { measureTracks(); schedule(); });
  on(window, 'load', function () { measureTracks(); update(); });
  measureTracks();
  update();
})();
