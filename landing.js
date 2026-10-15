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

  /* ── 10. Cena WebGL: roda 3D + partículas ─────────────────────────────── */
  var gl = (function () {
    var canvas = $('#gl');
    if (!canvas || !window.THREE) { doc.classList.add('no-gl'); if (canvas) canvas.style.display = 'none'; return null; }
    var THREE = window.THREE, renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) { doc.classList.add('no-gl'); canvas.style.display = 'none'; return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    scene.add(new THREE.AmbientLight(0x8fa2ff, 0.55));
    var l1 = new THREE.PointLight(0x4f7bff, 2.6, 40); l1.position.set(4, 3, 5); scene.add(l1);
    var l2 = new THREE.PointLight(0xa855f7, 2.0, 40); l2.position.set(-4, -2, 4); scene.add(l2);
    var l3 = new THREE.DirectionalLight(0xffffff, 0.9); l3.position.set(0, 5, 6); scene.add(l3);

    // ── A roda ──
    var wheel = new THREE.Group();   // posição / inclinação
    var spin = new THREE.Group();    // rotação sobre o eixo
    wheel.add(spin);

    var rubber = new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.85, metalness: 0.1 });
    var metal = new THREE.MeshStandardMaterial({ color: 0xaab6d6, roughness: 0.28, metalness: 0.85 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x1a2036, roughness: 0.5, metalness: 0.6 });

    var tire = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 32, 96), rubber);
    spin.add(tire);

    // blocos do piso
    var treadGeo = new THREE.BoxGeometry(0.14, 0.2, 0.58);
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2;
      var blk = new THREE.Mesh(treadGeo, rubber);
      blk.position.set(Math.cos(a) * 1.91, Math.sin(a) * 1.91, 0);
      blk.rotation.z = a;
      spin.add(blk);
    }

    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.62, 64, 1, true), metal);
    barrel.rotation.x = Math.PI / 2; barrel.material.side = THREE.DoubleSide;
    spin.add(barrel);

    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 48), dark);
    disc.rotation.x = Math.PI / 2; disc.position.z = 0.06;
    spin.add(disc);

    var spokeGeo = new THREE.BoxGeometry(0.24, 0.98, 0.09);
    spokeGeo.translate(0, 0.6, 0);
    for (var s = 0; s < 5; s++) {
      var sp = new THREE.Mesh(spokeGeo, metal);
      sp.rotation.z = (s / 5) * Math.PI * 2;
      sp.position.z = 0.26;
      spin.add(sp);
    }
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 32), metal);
    hub.rotation.x = Math.PI / 2; hub.position.z = 0.32;
    spin.add(hub);

    var nutGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 6);
    for (var nn = 0; nn < 5; nn++) {
      var na = (nn / 5) * Math.PI * 2 + 0.3;
      var nut = new THREE.Mesh(nutGeo, dark);
      nut.rotation.x = Math.PI / 2;
      nut.position.set(Math.cos(na) * 0.18, Math.sin(na) * 0.18, 0.4);
      spin.add(nut);
    }
    var neon = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.028, 16, 128), new THREE.MeshBasicMaterial({ color: 0x6f93ff }));
    neon.position.z = 0.3;
    spin.add(neon);
    var neon2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.012, 12, 128), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    neon2.position.z = 0.42;
    spin.add(neon2);

    wheel.rotation.set(0.18, -0.55, 0);
    scene.add(wheel);

    // ── Partículas ──
    var count = coarse ? 450 : 1100;
    var pos = new Float32Array(count * 3);
    for (var p = 0; p < count; p++) {
      pos[p * 3] = (Math.random() - 0.5) * 18;
      pos[p * 3 + 1] = (Math.random() - 0.5) * 11;
      pos[p * 3 + 2] = -7 + Math.random() * 9;
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pm = new THREE.PointsMaterial({ color: 0x7c9bff, size: 0.04, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    var points = new THREE.Points(pg, pm);
    scene.add(points);

    // ── Estado ──
    var state = { mx: 0, my: 0, tx: 0, ty: 0, scroll: 0, last: 0, vel: 0, spin: 0 };
    var aspect = 1, docH = 0;

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      docH = Math.max(document.documentElement.scrollHeight, h + 1);
    }
    resize();
    on(window, 'resize', resize);
    on(window, 'load', resize);
    if (!coarse) {
      on(window, 'pointermove', function (e) {
        state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
        state.my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    // posição/opacidade da roda conforme o scroll
    function place(y) {
      var vh = window.innerHeight;
      if (!docH) docH = Math.max(document.documentElement.scrollHeight, vh + 1);
      var hero = ease(clamp(y / (vh * 0.9), 0, 1));
      var end = ease(clamp((y - (docH - vh * 2.6)) / (vh * 1.3), 0, 1));
      var wide = aspect > 1.05;
      var x0 = wide ? 2.5 : 0, x1 = wide ? 4.1 : 2.8;
      var x = lerp(lerp(x0, x1, hero), 0, end);
      var yy = lerp(lerp(wide ? 0 : 0.8, -0.4, hero), 0, end);
      var sc = lerp(lerp(wide ? 1 : 0.8, 0.9, hero), 1.05, end);
      var op = lerp(lerp(1, wide ? 0.5 : 0.3, hero), 0.95, end);
      return { x: x, y: yy, s: sc, o: op };
    }

    var running = !reduce, raf = 0, t0 = performance.now(), prev = t0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      var y = window.pageYOffset || 0;
      state.vel = lerp(state.vel, (y - state.last) * 0.0025, 0.2);
      state.last = y;
      state.tx = lerp(state.tx, state.mx, 0.06);
      state.ty = lerp(state.ty, state.my, 0.06);

      var pl = place(y);
      wheel.position.x = lerp(wheel.position.x, pl.x, 0.08);
      wheel.position.y = lerp(wheel.position.y, pl.y, 0.08);
      var sc = lerp(wheel.scale.x, pl.s, 0.08); wheel.scale.set(sc, sc, sc);
      canvas.style.opacity = pl.o.toFixed(3);

      state.spin += dt * 0.55 + state.vel;
      spin.rotation.z = -state.spin;
      wheel.rotation.y = -0.55 + state.tx * 0.45 + Math.sin(now * 0.0004) * 0.08;
      wheel.rotation.x = 0.18 + state.ty * 0.25;
      points.rotation.y += dt * 0.025 + state.vel * 0.1;
      points.rotation.x = state.ty * 0.05;
      l1.position.x = 4 + state.tx * 2; l1.position.y = 3 - state.ty * 2;
      renderer.render(scene, camera);
    }
    function start() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    if (running) start(); else { renderer.render(scene, camera); }
    on(document, 'visibilitychange', function () { if (document.hidden) stop(); else if (running) start(); });
    return { renderOnce: function () { renderer.render(scene, camera); } };
  })();

  /* ── 11. Motor de scroll (um só rAF para tudo) ────────────────────────── */
  var navEl = $('.nav'), progEl = $('.progress');
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
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progEl) progEl.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    if (navEl) navEl.classList.toggle('solid', y > 40);

    if (gauge && inView(gauge.root)) gauge.update(reduce ? 1 : pinProgress(gauge.root));
    if (phone && inView(phone.root)) phone.update(reduce ? 0 : pinProgress(phone.root));
    if (cinema && inView(cinema.root)) cinema.update(reduce ? 1 : pinProgress(cinema.root));

    if (!reduce) {
      tracks.forEach(function (t) {
        if (!t.w) return;
        var off = (y * 0.35) % t.w;
        var x = t.dir < 0 ? -off : -t.w + off;
        t.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }
    if (reduce && gl) gl.renderOnce();
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  on(window, 'scroll', schedule, { passive: true });
  on(window, 'resize', function () { measureTracks(); schedule(); });
  on(window, 'load', function () { measureTracks(); update(); });
  measureTracks();
  update();
})();
