/* CarHelp — o logo da app em 3D (Three.js).
   Peças reais do ícone (pick-up, linha de batimento, coração) montam-se à entrada,
   batem como um coração, e separam-se em "vista explodida" ao longo do scroll.
   A cena é uma função do tempo e do scroll: sem estado escondido. */
(function () {
  'use strict';

  function create(canvas, opts) {
    var THREE = window.THREE;
    if (!THREE || !canvas) return null;
    var reduce = !!opts.reduce, coarse = !!opts.coarse;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    scene.add(new THREE.AmbientLight(0x93a6ff, 0.62));
    var key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(2, 4, 7); scene.add(key);
    var blue = new THREE.PointLight(0x4f7bff, 2.8, 40); blue.position.set(4, 3, 5); scene.add(blue);
    var violet = new THREE.PointLight(0xa855f7, 2.2, 40); violet.position.set(-4, -2, 4); scene.add(violet);

    /* ── Geometria em "unidades de desenho" (0..1000, y para baixo, como o ícone) ── */
    var K = 3.4 / 1000;                       // 1000 unidades = 3,4 unidades de mundo
    function flip(y) { return 1000 - y; }
    function poly(pts) {
      var sh = new THREE.Shape();
      pts.forEach(function (p, i) { if (i === 0) sh.moveTo(p[0], flip(p[1])); else sh.lineTo(p[0], flip(p[1])); });
      sh.closePath();
      return sh;
    }
    function rrect(x0, y0, x1, y1, r) {
      var Y0 = flip(y1), Y1 = flip(y0), sh = new THREE.Shape();
      sh.moveTo(x0 + r, Y0); sh.lineTo(x1 - r, Y0); sh.quadraticCurveTo(x1, Y0, x1, Y0 + r);
      sh.lineTo(x1, Y1 - r); sh.quadraticCurveTo(x1, Y1, x1 - r, Y1);
      sh.lineTo(x0 + r, Y1); sh.quadraticCurveTo(x0, Y1, x0, Y1 - r);
      sh.lineTo(x0, Y0 + r); sh.quadraticCurveTo(x0, Y0, x0 + r, Y0);
      return sh;
    }
    function heart(s) {
      var sh = new THREE.Shape();
      sh.moveTo(0, s * 0.35);
      sh.bezierCurveTo(0, s * 0.7, -s * 0.6, s * 0.7, -s * 0.6, s * 0.25);
      sh.bezierCurveTo(-s * 0.6, -s * 0.15, -s * 0.15, -s * 0.35, 0, -s * 0.6);
      sh.bezierCurveTo(s * 0.15, -s * 0.35, s * 0.6, -s * 0.15, s * 0.6, s * 0.25);
      sh.bezierCurveTo(s * 0.6, s * 0.7, 0, s * 0.7, 0, s * 0.35);
      return sh;
    }
    function extrude(shape, depth, bevel) {
      return new THREE.ExtrudeGeometry(shape, {
        depth: depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18
      });
    }

    var mTile = new THREE.MeshPhysicalMaterial({ color: 0x2450e0, roughness: 0.32, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.2 });
    var mWhite = new THREE.MeshStandardMaterial({ color: 0xf6f6fa, roughness: 0.35, metalness: 0.05 });
    var mNavy = new THREE.MeshStandardMaterial({ color: 0x0e1850, roughness: 0.5, metalness: 0.3 });
    var mWin = new THREE.MeshStandardMaterial({ color: 0x2846d7, roughness: 0.2, metalness: 0.3, emissive: 0x1a2f9a, emissiveIntensity: 0.6 });
    var mRed = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.35, emissive: 0xe63946, emissiveIntensity: 0.55 });

    var root = new THREE.Group();            // posição / escala / rotação
    var model = new THREE.Group();           // centra o desenho
    model.position.set(-500, -500, -60);
    root.add(model);
    root.scale.setScalar(K);
    scene.add(root);

    // cada "peça" tem um grupo, um z de repouso e um vetor de explosão
    var parts = [];
    function part(name, ex, from, delay) {
      var g = new THREE.Group();
      model.add(g);
      var p = { name: name, g: g, ex: ex, from: from, delay: delay, base: { x: 0, y: 0, z: 0 } };
      parts.push(p);
      return p;
    }
    var Z0 = 84; // frente da base

    var pTile = part('tile', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -3600, ry: -1.6 }, 0.0);
    pTile.g.add(new THREE.Mesh(extrude(rrect(0, 0, 1000, 1000, 230), 70, 14), mTile));

    var pBody = part('body', { x: 0, y: -10, z: 190 }, { x: -3000, y: 0, z: 0, rz: 0.5 }, 0.2);
    var body = new THREE.Mesh(extrude(rrect(130, 478, 785, 568, 40), 50, 6), mWhite);
    body.position.z = Z0; pBody.g.add(body);

    var pCab = part('cab', { x: 20, y: 40, z: 290 }, { x: 0, y: 3000, z: 0, rz: -0.4 }, 0.38);
    var cab = new THREE.Mesh(extrude(poly([[318, 484], [392, 336], [660, 336], [785, 484]]), 50, 6), mWhite);
    cab.position.z = Z0; pCab.g.add(cab);

    var pWin = part('window', { x: 30, y: 60, z: 420 }, { x: 0, y: 0, z: 3400 }, 0.56);
    var win = new THREE.Mesh(extrude(poly([[446, 368], [598, 368], [640, 470], [446, 470]]), 8, 2), mWin);
    win.position.z = Z0 + 54; pWin.g.add(win);

    var wheels = [];
    [260, 650].forEach(function (cx, i) {
      var pw = part('wheel' + i, { x: i ? 60 : -60, y: -90, z: 240 }, { x: 0, y: -3000, z: 0, rx: 3 }, 0.74 + i * 0.1);
      var w = new THREE.Mesh(new THREE.CylinderGeometry(64, 64, 56, 36), mNavy);
      w.rotation.x = Math.PI / 2; w.position.set(cx, flip(640), Z0 + 28);
      var hub = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 8, 24), mWhite);
      hub.rotation.x = Math.PI / 2; hub.position.set(cx, flip(640), Z0 + 58);
      pw.g.add(w); pw.g.add(hub);
      wheels.push(w);
    });

    // linha de batimento: tubo que se "desenha" sozinho
    var ecgPts = [[135, 525], [300, 525], [345, 455], [405, 610], [465, 510], [510, 525], [780, 525]]
      .map(function (p) { return new THREE.Vector3(p[0], flip(p[1]), 0); });
    var ecgPath = new THREE.CurvePath();
    for (var e = 0; e < ecgPts.length - 1; e++) ecgPath.add(new THREE.LineCurve3(ecgPts[e], ecgPts[e + 1]));
    var ecgGeo = new THREE.TubeGeometry(ecgPath, 160, 11, 10, false);
    var pEcg = part('ecg', { x: 0, y: 0, z: 560 }, { x: 0, y: 0, z: 600 }, 1.0);
    var ecg = new THREE.Mesh(ecgGeo, mRed);
    ecg.position.z = Z0 + 66; pEcg.g.add(ecg);
    var ecgTotal = ecgGeo.index ? ecgGeo.index.count : 0;

    var tracer = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    tracer.position.z = Z0 + 70;
    pEcg.g.add(tracer);

    var pBadge = part('badge', { x: 90, y: 90, z: 760 }, { x: 3200, y: 1800, z: 0, rz: 2 }, 0.9);
    var badge = new THREE.Mesh(new THREE.CylinderGeometry(160, 160, 40, 48), mWhite);
    badge.rotation.x = Math.PI / 2; badge.position.set(770, flip(262), Z0 + 20);
    pBadge.g.add(badge);

    var pHeart = part('heart', { x: 110, y: 110, z: 980 }, { x: 0, y: 0, z: 0, s: 0 }, 1.4);
    var heartMesh = new THREE.Mesh(extrude(heart(185), 24, 5), mRed);
    heartMesh.position.set(770, flip(262), Z0 + 42);
    pHeart.g.add(heartMesh);

    // ondas de choque do coração
    var rings = [];
    for (var r = 0; r < 3; r++) {
      var rm = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64), new THREE.MeshBasicMaterial({ color: r === 1 ? 0xa855f7 : 0x6f93ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      rm.position.set(770, flip(262), Z0 + 60);
      rm.scale.setScalar(1);
      model.add(rm);
      rings.push({ m: rm, born: -10 });
    }

    // ── Partículas ──
    var count = coarse ? 420 : 1100;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -8 + Math.random() * 10;
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var points = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0x7c9bff, size: 0.045, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(points);

    /* ── Estados ao longo da página ── */
    var STATES_WIDE = [
      { x: 2.3, y: 0.05, s: 1.0, ry: -0.38, rx: 0.12, ex: 0.0, op: 1.0 },   // 0 hero
      { x: 3.9, y: 1.15, s: 0.55, ry: -0.9, rx: 0.2, ex: 0.85, op: 0.6 },   // 1 manómetro
      { x: -3.9, y: 1.1, s: 0.55, ry: 0.8, rx: -0.15, ex: 1.0, op: 0.5 },   // 2 telemóvel
      { x: 3.8, y: -0.7, s: 0.6, ry: -0.6, rx: 0.1, ex: 0.7, op: 0.4 },     // 3 funcionalidades
      { x: 0, y: 0, s: 0.5, ry: 0, rx: 0, ex: 0.4, op: 0.0 },               // 4 cinema
      { x: 4.0, y: -1.2, s: 0.55, ry: -0.5, rx: 0.1, ex: 0.5, op: 0.35 },   // 5 planos
      { x: 0, y: 0.35, s: 1.3, ry: 0, rx: 0, ex: 0.0, op: 0.6 }             // 6 final
    ];
    var STATES_NARROW = [
      { x: 0, y: 1.55, s: 0.8, ry: -0.3, rx: 0.1, ex: 0.0, op: 1.0 },
      { x: 0, y: 2.0, s: 0.42, ry: -0.6, rx: 0.1, ex: 0.8, op: 0.35 },
      { x: 0, y: 2.0, s: 0.42, ry: 0.6, rx: 0.1, ex: 1.0, op: 0.3 },
      { x: 0, y: 2.0, s: 0.42, ry: -0.4, rx: 0.1, ex: 0.7, op: 0.2 },
      { x: 0, y: 0, s: 0.4, ry: 0, rx: 0, ex: 0.4, op: 0.0 },
      { x: 0, y: 2.0, s: 0.42, ry: -0.4, rx: 0.1, ex: 0.5, op: 0.2 },
      { x: 0, y: 0.5, s: 0.95, ry: 0, rx: 0, ex: 0.0, op: 0.55 }
    ];

    var anchors = [];                         // posição (px) onde começa cada estado
    var SELECTORS = ['.hero', '#manometro', '#app', '#funcionalidades', '#pinVideo', '#planos', '.final'];
    var aspect = 1, vh = 800;
    function measure() {
      vh = window.innerHeight;
      var y = window.pageYOffset || 0;
      anchors = SELECTORS.map(function (s) {
        var el = document.querySelector(s);
        return el ? el.getBoundingClientRect().top + y : null;
      });
      // garante ordem crescente mesmo que algum seletor falhe
      var last = 0;
      anchors = anchors.map(function (a, i) { if (a === null || a < last) a = last + (i ? vh : 0); last = a; return a; });
    }
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      measure();
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('load', measure);

    function ease(t) { return t * t * (3 - 2 * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

    function stateAt(y) {
      var S = aspect > 1.05 ? STATES_WIDE : STATES_NARROW;
      var probe = y + vh * 0.55;               // muda de estado a meio do ecrã
      var i = 0;
      while (i < anchors.length - 1 && probe >= anchors[i + 1]) i++;
      var j = Math.min(i + 1, S.length - 1);
      var span = Math.max(1, (anchors[i + 1] !== undefined ? anchors[i + 1] : anchors[i] + vh) - anchors[i]);
      var f = ease(clamp((probe - anchors[i]) / span, 0, 1));
      // só começa a transição na 2ª metade do troço, para o logo "ficar" em cada secção
      f = ease(clamp((f - 0.45) / 0.55, 0, 1));
      var a = S[Math.min(i, S.length - 1)], b = S[j], o = {};
      for (var k in a) o[k] = lerp(a[k], b[k], f);
      return o;
    }

    /* ── Ciclo ── */
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!coarse) {
      window.addEventListener('pointermove', function (ev) {
        mouse.x = (ev.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (ev.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    var cur = { x: 0, y: 0, s: 1, ry: 0, rx: 0, ex: 0, op: 1 };
    var scrollVel = 0, lastY = 0, spin = 0;
    var BEAT = 1.15, lastBeat = -1;
    var INTRO = reduce ? 0 : 3.2;

    function applyParts(t, ex) {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], g = p.g;
        var k = INTRO ? clamp((t - p.delay) / 1.0, 0, 1) : 1;
        var e = easeOutCubic(k);
        var f = p.from;
        // chega da posição "from" para a de repouso + explosão
        g.position.set(
          lerp(f.x || 0, 0, e) + p.ex.x * ex,
          lerp(f.y || 0, 0, e) + p.ex.y * ex,
          lerp(f.z || 0, 0, e) + p.ex.z * ex
        );
        g.rotation.set(lerp(f.rx || 0, 0, e), lerp(f.ry || 0, 0, e), lerp(f.rz || 0, 0, e));
        var s = f.s === 0 ? easeOutBack(clamp((t - p.delay - 0.4) / 0.7, 0, 1)) : 1;
        if (!INTRO) s = 1;
        g.scale.setScalar(Math.max(0.0001, s));
        g.visible = k > 0 || !INTRO ? true : false;
      }
    }

    function frame(now, t) {
      var y = window.pageYOffset || 0;
      scrollVel = lerp(scrollVel, (y - lastY) * 0.004, 0.2); lastY = y;
      mouse.tx = lerp(mouse.tx, mouse.x, 0.06); mouse.ty = lerp(mouse.ty, mouse.y, 0.06);

      var st = stateAt(y);
      var kk = reduce ? 1 : 0.07;
      for (var kn in st) cur[kn] = lerp(cur[kn], st[kn], kk);

      // batimento: "lub-dub"
      var ph = (t % BEAT) / BEAT;
      var beat = Math.exp(-Math.pow((ph - 0.05) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.23) / 0.06, 2));
      var beatNo = Math.floor(t / BEAT);
      if (t > INTRO + 0.8 && beatNo !== lastBeat) {
        lastBeat = beatNo;
        var r0 = rings[beatNo % rings.length];
        r0.born = t;
      }
      var introDone = t > INTRO;
      var ex = cur.ex + (reduce ? 0 : Math.sin(t * 0.8) * 0.05);
      applyParts(t, introDone || reduce ? ex : ex * clamp((t - 1.6) / 1.6, 0, 1));

      // linha de batimento a desenhar-se + traçador luminoso
      var drawK = INTRO ? clamp((t - 1.0) / 1.1, 0, 1) : 1;
      ecgGeo.setDrawRange(0, Math.floor(ecgTotal * ease(drawK) / 3) * 3);
      var u = (t * 0.28) % 1;
      var tp = ecgPath.getPointAt(u);
      tracer.position.set(tp.x, tp.y, Z0 + 70);
      tracer.visible = drawK >= 1;

      // ondas de choque
      rings.forEach(function (r) {
        var age = t - r.born;
        if (age < 0 || age > 1.6) { r.m.material.opacity = 0; return; }
        var k = age / 1.6;
        r.m.scale.setScalar(lerp(170, 640, easeOutCubic(k)));
        r.m.material.opacity = (1 - k) * 0.55;
      });

      // rodas giram
      spin += (0.04 + scrollVel * 0.5);
      wheels.forEach(function (w) { w.rotation.y = spin; });

      var pulse = 1 + 0.035 * beat;
      var sc = cur.s * pulse * K;
      root.scale.setScalar(sc);
      root.position.set(cur.x + mouse.tx * 0.15, cur.y + Math.sin(t * 0.9) * 0.07 - mouse.ty * 0.1, 0);
      root.rotation.set(cur.rx + mouse.ty * 0.22 + Math.sin(t * 0.37) * 0.04, cur.ry + mouse.tx * 0.45 + Math.sin(t * 0.5) * 0.1 + scrollVel * 0.6, 0);

      points.rotation.y += 0.0009 + scrollVel * 0.01;
      blue.position.x = 4 + mouse.tx * 2; blue.position.y = 3 - mouse.ty * 2;

      // o logo aparece com a montagem
      var fadeIn = INTRO ? clamp(t / 0.4, 0, 1) : 1;
      canvas.style.opacity = (cur.op * fadeIn).toFixed(3);
      renderer.render(scene, camera);
    }

    var raf = 0, t0 = performance.now();
    function loop(now) {
      raf = requestAnimationFrame(loop);
      frame(now, (now - t0) / 1000);
    }
    function start() { if (!raf && !reduce) { t0 = performance.now() - (lastT * 1000); raf = requestAnimationFrame(loop); } }
    var lastT = 0;
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { lastT = (performance.now() - t0) / 1000; stop(); } else start();
    });

    // estado inicial já "chegado" quando o movimento está reduzido
    var s0 = stateAt(window.pageYOffset || 0);
    for (var k0 in s0) cur[k0] = s0[k0];
    if (reduce) { frame(0, 6); } else { start(); }

    return {
      renderOnce: function () { frame(0, 6); },
      start: start,
      stop: stop
    };
  }

  window.CarHelpLogo3D = { create: create };
})();
