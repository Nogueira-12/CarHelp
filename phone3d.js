/* CarHelp — telemóvel 3D em WebGL (Three.js r147).
   É geometria 3D real (não é uma imagem nem CSS): moldura de alumínio com arestas
   arredondadas, vidro traseiro fosco, vidro frontal com o ecrã da app e reflexos de
   estúdio, três câmaras com revestimento iridescente, flash, sensor, botões laterais,
   porta USB-C, grelha do altifalante e linhas de antena. Medidas em milímetros, com as
   proporções de um Android topo de gama atual. */
(function () {
  'use strict';

  var D = { W: 71.6, H: 152.4, T: 8.2, R: 11.2, BT: 1.2, BS: 1.05 }; // largura, altura, espessura, raio, bisel
  var SCREEN_ASPECT = 720 / 1600;                                     // as capturas da app

  function rad(d) { return d * Math.PI / 180; }

  function roundedRect(THREE, w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r);
    s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r);
    s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }

  // plano com a forma dada e UVs normalizados (0..1) dentro da janela [v0, v1]
  function shapePlane(THREE, shape, w, h, segs, v0, v1, u0, u1) {
    var g = new THREE.ShapeGeometry(shape, segs || 40);
    var uv = g.attributes.uv, pos = g.attributes.position;
    v0 = v0 === undefined ? 0 : v0; v1 = v1 === undefined ? 1 : v1;
    u0 = u0 === undefined ? 0 : u0; u1 = u1 === undefined ? 1 : u1;
    for (var i = 0; i < uv.count; i++) {
      var u = pos.getX(i) / w + 0.5, v = pos.getY(i) / h + 0.5;
      uv.setXY(i, u0 + u * (u1 - u0), v0 + v * (v1 - v0));
    }
    uv.needsUpdate = true;
    return g;
  }

  /* Estúdio fotográfico para os reflexos: caixas de luz suaves e tiras verticais,
     com um toque violeta/azul atrás (as cores do site). */
  function studioEnvironment(THREE, renderer) {
    var env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(80, 40, 80), new THREE.MeshBasicMaterial({ color: 0x07070a, side: THREE.BackSide })));
    function panel(w, h, hex, k, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    }
    // como num estúdio de produto: luzes de lado e por cima, zona escura atrás da câmara
    panel(26, 4, 0xffffff, 5, 0, 19, -2);       // caixa de luz por cima
    panel(3, 24, 0xffffff, 8, -24, 0, 3);       // tira vertical à esquerda
    panel(2.2, 24, 0xffffff, 5, 24, 0, 1);      // tira vertical à direita
    panel(16, 12, 0x8a5cff, 4, -17, 3, -20);    // violeta atrás
    panel(16, 12, 0x3b6bff, 4, 18, -3, -18);    // azul atrás
    panel(30, 4, 0xffffff, 0.6, 0, -17, -4);    // enchimento muito suave por baixo
    panel(46, 14, 0xffffff, 0.35, 0, 10, 28);   // luz difusa e fraca atrás da câmara (dá gradiente ao vidro)
    var pmrem = new THREE.PMREMGenerator(renderer);
    var tex = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
    return tex;
  }

  function buildPhone(THREE, maxAniso) {
    var W = D.W, H = D.H, T = D.T, BS = D.BS, BT = D.BT;
    var g = new THREE.Group();

    var M = {
      frame: new THREE.MeshPhysicalMaterial({ color: 0xc5c8d2, metalness: 1, roughness: 0.26 }),
      frameGloss: new THREE.MeshPhysicalMaterial({ color: 0xe0e2ea, metalness: 1, roughness: 0.12 }),
      back: new THREE.MeshPhysicalMaterial({ color: 0x34363f, metalness: 0, roughness: 0.3, envMapIntensity: 0.9, clearcoat: 0.5, clearcoatRoughness: 0.1 }),
      frontGlass: new THREE.MeshPhysicalMaterial({ color: 0x020203, metalness: 0, roughness: 0.035, clearcoat: 1, clearcoatRoughness: 0.03 }),
      glassFx: new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.03, envMapIntensity: 0.95, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      lens: new THREE.MeshPhysicalMaterial({ color: 0x020203, metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [260, 680] }),
      lensInner: new THREE.MeshPhysicalMaterial({ color: 0x161b33, metalness: 0, roughness: 0.05, emissive: 0x05070f, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 520] }),
      coat: new THREE.MeshPhysicalMaterial({ color: 0x0d1020, metalness: 0.3, roughness: 0.1, iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [380, 760] }),
      barrel: new THREE.MeshPhysicalMaterial({ color: 0x2e313b, metalness: 0.9, roughness: 0.22 }),
      hole: new THREE.MeshBasicMaterial({ color: 0x000000 }),
      flash: new THREE.MeshStandardMaterial({ color: 0xeee4cc, roughness: 0.62, metalness: 0, emissive: 0x231d12 }),
      antenna: new THREE.MeshStandardMaterial({ color: 0x3b3e47, roughness: 0.55, metalness: 0.1 })
    };

    /* corpo: moldura metálica (laterais e biséis) + vidro traseiro (tampa) */
    var cw = W - 2 * BS, ch = H - 2 * BS, cr = D.R - BS, depth = T - 2 * BT;
    var outline = roundedRect(THREE, cw, ch, cr);
    var bodyGeo = new THREE.ExtrudeGeometry(outline, { depth: depth, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 8, curveSegments: 48 });
    bodyGeo.translate(0, 0, -depth / 2);
    g.add(new THREE.Mesh(bodyGeo, [M.back, M.frame]));

    /* frente: vidro preto, ecrã, furo da câmara e camada de reflexos */
    var zf = T / 2;
    var front = new THREE.Mesh(shapePlane(THREE, outline, cw, ch, 48), M.frontGlass);
    front.position.z = zf + 0.03; g.add(front);

    var bez = 1.35, sw = cw - 2 * bez, sh = ch - 2 * bez, sr = cr - bez * 0.75;
    var sa = sw / sh, v0 = 0, v1 = 1, u0 = 0, u1 = 1;
    if (sa > SCREEN_ASPECT) { var f = SCREEN_ASPECT / sa; v0 = (1 - f) / 2; v1 = 1 - v0; }
    else { var f2 = sa / SCREEN_ASPECT; u0 = (1 - f2) / 2; u1 = 1 - u0; }
    var screenGeo = shapePlane(THREE, roundedRect(THREE, sw, sh, sr), sw, sh, 48, v0, v1, u0, u1);
    var screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x0f1014, toneMapped: false }));
    screen.position.z = zf + 0.06; g.add(screen);

    var holeY = sh / 2 - 4.9;
    var hole = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40), M.hole); hole.position.set(0, holeY, zf + 0.09); g.add(hole);
    var holeRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.78, 40), M.barrel); holeRing.position.set(0, holeY, zf + 0.085); g.add(holeRing);
    var holeLens = new THREE.Mesh(new THREE.CircleGeometry(0.62, 28), M.lensInner); holeLens.position.set(0, holeY, zf + 0.1); g.add(holeLens);

    var fx = new THREE.Mesh(shapePlane(THREE, outline, cw, ch, 48), M.glassFx);
    fx.position.z = zf + 0.14; fx.renderOrder = 2; g.add(fx);

    /* traseira: três câmaras na vertical, flash e sensor */
    var zb = -T / 2;
    function onBack(mesh, x, y, z) { mesh.rotation.y = Math.PI; mesh.position.set(x, y, z); g.add(mesh); return mesh; }
    var lx = W / 2 - 12.8, ly = H / 2 - 15.6, gap = 13.6;
    for (var i = 0; i < 3; i++) {
      var y = ly - i * gap;
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, 1.4, 64, 1, true), M.frameGloss);
      ring.rotation.x = Math.PI / 2; ring.position.set(lx, y, zb - 0.7); g.add(ring);
      var lip = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.4, 20, 72), M.frameGloss);
      lip.position.set(lx, y, zb - 1.4); g.add(lip);
      onBack(new THREE.Mesh(new THREE.CircleGeometry(4.55, 64), M.lens), lx, y, zb - 1.36);
      onBack(new THREE.Mesh(new THREE.RingGeometry(3.25, 4.1, 64), M.coat), lx, y, zb - 1.375);
      onBack(new THREE.Mesh(new THREE.RingGeometry(2.55, 3.05, 64), M.barrel), lx, y, zb - 1.38);
      onBack(new THREE.Mesh(new THREE.CircleGeometry(2.55, 64), M.lensInner), lx, y, zb - 1.385);
      onBack(new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), M.hole), lx, y, zb - 1.39);
    }
    var fxX = W / 2 - 23.6;
    onBack(new THREE.Mesh(new THREE.CircleGeometry(1.85, 40), M.flash), fxX, ly, zb - 0.06);
    onBack(new THREE.Mesh(new THREE.RingGeometry(1.85, 2.25, 40), M.frameGloss), fxX, ly, zb - 0.055);
    onBack(new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), M.frontGlass), fxX, ly - 7.6, zb - 0.06);
    onBack(new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 32), M.barrel), fxX, ly - 7.6, zb - 0.055);

    /* botões (lado direito, visto de frente): volume e ligar */
    function button(len, y) {
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(1.05, len, 8, 24), M.frameGloss);
      b.scale.set(1, 1, 1.3); b.position.set(W / 2 - 0.45, y, 0); g.add(b);
    }
    button(19.5, 37); button(9, 13);

    /* em baixo: USB-C, altifalante e microfone; em cima: microfone */
    var port = new THREE.Mesh(shapePlane(THREE, roundedRect(THREE, 8.6, 3.05, 1.5), 8.6, 3.05, 24), M.hole);
    port.rotation.x = Math.PI / 2; port.position.set(0, -H / 2 - 0.02, 0); g.add(port);
    for (var s = 0; s < 6; s++) {
      var sp = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), M.hole);
      sp.rotation.x = Math.PI / 2; sp.position.set(9.2 + s * 1.45, -H / 2 - 0.02, 0); g.add(sp);
    }
    var mic = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), M.hole);
    mic.rotation.x = Math.PI / 2; mic.position.set(-8.8, -H / 2 - 0.02, 0); g.add(mic);
    var mic2 = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), M.hole);
    mic2.rotation.x = -Math.PI / 2; mic2.position.set(10, H / 2 + 0.02, 0); g.add(mic2);

    /* linhas de antena na moldura */
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) {
      var a = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, depth + 0.6), M.antenna);
      a.position.set(p[0] * (W / 2 + 0.01), p[1] * (H / 2 - 17.5), 0); g.add(a);
      var b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, depth + 0.6), M.antenna);
      b.position.set(p[0] * (W / 2 - 21), p[1] * (H / 2 + 0.01), 0); g.add(b);
    });

    return { group: g, screen: screen, materials: M };
  }

  /* opts: { pixelRatio, preserve (para exportar imagens) } */
  function create(canvas, opts) {
    var THREE = window.THREE;
    if (!THREE || !canvas) return null;
    opts = opts || {};
    // as cores em hexadecimal passam a ser lidas como sRGB (como num editor de imagem)
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    scene.environment = studioEnvironment(THREE, renderer);
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    var key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-300, 420, 600); scene.add(key);
    var rimV = new THREE.PointLight(0x8a5cff, 2.4); rimV.position.set(-280, 140, -240); scene.add(rimV);
    var rimB = new THREE.PointLight(0x4f7bff, 2.1); rimB.position.set(320, -120, -220); scene.add(rimB);

    var FOV = 24, DIST = 460;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 10, 5000);
    camera.position.set(0, 0, DIST);

    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    var built = buildPhone(THREE, maxAniso);
    var root = new THREE.Group(), floatG = new THREE.Group();
    root.rotation.order = 'XZY';
    floatG.add(built.group); root.add(floatG); scene.add(root);

    /* ecrãs da app: um material por ecrã (trocar não recompila nada) */
    var screenMats = [], current = -1, wanted = 0, dirty = true;
    function setScreen(i) {
      wanted = i;
      if (i === current || !screenMats[i]) return;
      current = i; built.screen.material = screenMats[i]; dirty = true;
    }
    function loadScreens(list) {
      var loader = new THREE.TextureLoader();
      list.forEach(function (src, i) {
        loader.load(src, function (t) {
          t.encoding = THREE.sRGBEncoding;
          t.anisotropy = Math.min(8, maxAniso);
          screenMats[i] = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
          if (i === wanted) { current = -1; setScreen(i); }
          dirty = true;
          if (opts.onScreen) opts.onScreen(i);
        });
      });
    }

    var size = { w: 1, h: 1 };
    function resize(w, h) {
      size.w = w || canvas.clientWidth || window.innerWidth;
      size.h = h || canvas.clientHeight || window.innerHeight;
      renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      dirty = true;
    }

    /* pose: x/y = âncora no ecrã (0..1), rx/ry/rz em graus, s = escala,
       px = altura do telemóvel no ecrã, em píxeis */
    var pose = { x: 0.5, y: 0.5, rx: 0, ry: 0, rz: 0, s: 1, px: 600 };
    var floatState = { rx: 0, ry: 0, y: 0 };
    function setPose(p) { for (var k in p) pose[k] = p[k]; dirty = true; }
    function setFloat(p) { for (var k in p) floatState[k] = p[k]; dirty = true; }

    function render(force) {
      if (!dirty && !force) return;
      dirty = false;
      var hw = 2 * DIST * Math.tan(rad(FOV / 2)), ww = hw * camera.aspect;
      root.position.set((pose.x - 0.5) * ww, (0.5 - pose.y) * hw, 0);
      root.rotation.set(rad(pose.rx), rad(pose.ry), rad(pose.rz));
      var k = (pose.px / size.h) * hw / D.H;
      root.scale.setScalar(k * pose.s);
      floatG.rotation.set(rad(floatState.rx), rad(floatState.ry), 0);
      floatG.position.y = floatState.y;
      renderer.render(scene, camera);
    }

    resize();

    /* compila os materiais já (durante o carregamento), para o telemóvel não dar um
       solavanco na primeira vez que aparece */
    function warmup() {
      try { renderer.compile(scene, camera); } catch (e) {}
      render(true);
    }

    return {
      warmup: warmup,
      renderer: renderer, canvas: canvas,
      loadScreens: loadScreens, setScreen: setScreen, setPose: setPose, setFloat: setFloat,
      resize: resize, render: render,
      ready: function () { return screenMats.length > 0; },
      materials: built.materials,
      dims: D
    };
  }

  window.CarHelpPhone3D = { create: create };
})();
