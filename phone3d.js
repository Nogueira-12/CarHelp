/* CarHelp — telemóvel 3D em WebGL (Three.js r147), ao estilo do Galaxy S26 Ultra.
   É geometria 3D real (não é uma imagem nem CSS): moldura metálica com laterais planas,
   vidro traseiro, ilha das câmaras em cápsula com três lentes grandes, duas lentes
   pequenas e flash ao lado, vidro frontal com o ecrã da app, botões, USB-C, S Pen e
   linhas de antena. Medidas em milímetros, tiradas das imagens oficiais do S26 Ultra
   (163,6 × 78,1 × 7,9 mm). Sem logótipos de marcas. */
(function () {
  'use strict';

  var D = { W: 78.1, H: 163.6, T: 7.9, R: 7.4, BT: 0.95, BS: 0.8 }; // largura, altura, espessura, raio do canto, bisel
  var SCREEN = { aspect: 720 / 1600, rows: 1600, cropTop: 8, holeRow: 43.5 };  // as capturas da app (720 × 1600)

  /* câmaras, medidas a partir do canto superior esquerdo da traseira (vista de trás) */
  var CAM = {
    island: { cx: 14.72, cy: 32.86, w: 20.3, h: 57.0, raise: 1.0 },
    big: { cx: 14.72, cy: [14.64, 32.87, 51.08], glass: 7.575, ring: 8.25, height: 1.9 },
    small: { cx: 32.76, cy: [14.66, 32.86], glass: 4.13, ring: 4.75, height: 1.5 },
    flash: { cx: 32.78, cy: 23.67, r: 1.45 }
  };

  function rad(d) { return d * Math.PI / 180; }

  function roundedRect(THREE, w, h, r, shape) {
    var s = shape || new THREE.Shape(), x = -w / 2, y = -h / 2;
    r = Math.min(r, w / 2, h / 2);
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

  /* vidro de uma lente: preto profundo, anéis dos elementos ópticos, íris azul com
     reflexos violeta/ciano e brilhos (desenhado uma vez num canvas) */
  function lensTexture(THREE) {
    var size = 512, c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d'), r = size / 2;
    function disc(rr, fill) { g.fillStyle = fill; g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.fill(); }
    function radial(x, y, r0, r1, stops) {
      var gr = g.createRadialGradient(x, y, r0, x, y, r1);
      stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
      return gr;
    }
    function glint(x, y, s, a) {
      g.fillStyle = radial(x, y, 0, s, [[0, 'rgba(255,255,255,' + a + ')'], [1, 'rgba(255,255,255,0)']]);
      g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
    }
    g.translate(r, r);
    disc(r, '#020203');
    // borda do vidro um pouco mais clara, como o tubo da objetiva visto de cima
    disc(r, radial(0, 0, r * 0.8, r, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(26,27,34,0.55)'], [0.85, 'rgba(8,8,11,0.95)'], [1, '#030304']]));
    // anel interior acinzentado (o barril dos elementos ópticos)
    disc(r * 0.66, radial(0, 0, r * 0.46, r * 0.66, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(58,61,74,0.42)'], [1, 'rgba(0,0,0,0)']]));
    [[0.76, 0.16], [0.42, 0.22]].forEach(function (k) {
      g.strokeStyle = 'rgba(80,84,100,' + k[1] + ')'; g.lineWidth = size * 0.005;
      g.beginPath(); g.arc(0, 0, r * k[0], 0, Math.PI * 2); g.stroke();
    });
    // íris pequena e escura, azul-marinho
    disc(r * 0.3, radial(-r * 0.04, -r * 0.05, r * 0.01, r * 0.3, [[0, '#0e1b4c'], [0.5, '#0a1438'], [1, '#04060d']]));
    g.save();
    g.beginPath(); g.arc(0, 0, r * 0.29, 0, Math.PI * 2); g.clip();
    g.fillStyle = radial(-r * 0.11, -r * 0.13, 0, r * 0.19, [[0, 'rgba(118,98,255,0.4)'], [1, 'rgba(118,98,255,0)']]);
    g.fillRect(-r, -r, 2 * r, 2 * r);
    g.fillStyle = radial(r * 0.1, r * 0.1, 0, r * 0.13, [[0, 'rgba(70,150,255,0.3)'], [1, 'rgba(70,150,255,0)']]);
    g.fillRect(-r, -r, 2 * r, 2 * r);
    g.restore();
    disc(r * 0.085, '#010104');
    glint(-r * 0.1, -r * 0.12, r * 0.05, 0.9);
    glint(r * 0.05, r * 0.045, r * 0.022, 0.5);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function buildPhone(THREE, maxAniso) {
    var W = D.W, H = D.H, T = D.T, BS = D.BS, BT = D.BT;
    var g = new THREE.Group();

    var lensTex = lensTexture(THREE);
    lensTex.anisotropy = Math.min(4, maxAniso || 1);

    var M = {
      frame: new THREE.MeshPhysicalMaterial({ color: 0xc5c8d2, metalness: 1, roughness: 0.26 }),
      frameGloss: new THREE.MeshPhysicalMaterial({ color: 0xe0e2ea, metalness: 1, roughness: 0.12 }),
      ring: new THREE.MeshPhysicalMaterial({ color: 0x7a7e89, metalness: 1, roughness: 0.3 }),
      back: new THREE.MeshPhysicalMaterial({ color: 0x34363f, metalness: 0, roughness: 0.3, envMapIntensity: 0.9, clearcoat: 0.5, clearcoatRoughness: 0.1 }),
      island: new THREE.MeshPhysicalMaterial({ color: 0x363842, metalness: 0, roughness: 0.24, envMapIntensity: 1, clearcoat: 0.7, clearcoatRoughness: 0.08 }),
      groove: new THREE.MeshStandardMaterial({ color: 0x4b4e58, roughness: 0.35, metalness: 0.3 }),
      frontGlass: new THREE.MeshPhysicalMaterial({ color: 0x020203, metalness: 0, roughness: 0.035, clearcoat: 1, clearcoatRoughness: 0.03 }),
      glassFx: new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.03, envMapIntensity: 0.95, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      lens: new THREE.MeshPhysicalMaterial({ map: lensTex, color: 0xffffff, metalness: 0, roughness: 0.06, envMapIntensity: 1.1, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 0.55, iridescenceIOR: 1.7, iridescenceThicknessRange: [300, 650] }),
      lensInner: new THREE.MeshPhysicalMaterial({ color: 0x161b33, metalness: 0, roughness: 0.05, emissive: 0x05070f, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 520] }),
      barrel: new THREE.MeshPhysicalMaterial({ color: 0x17181d, metalness: 0.7, roughness: 0.35 }),
      hole: new THREE.MeshBasicMaterial({ color: 0x000000 }),
      flash: new THREE.MeshStandardMaterial({ color: 0xf6e7bf, roughness: 0.55, metalness: 0, emissive: 0x3a2e14 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0x24262d, roughness: 0.55, metalness: 0.1 }),
      antenna: new THREE.MeshStandardMaterial({ color: 0x3b3e47, roughness: 0.55, metalness: 0.1 })
    };

    /* corpo: moldura metálica (laterais planas e biséis) + vidro traseiro (tampa) */
    var cw = W - 2 * BS, ch = H - 2 * BS, cr = D.R - BS, depth = T - 2 * BT;
    var outline = roundedRect(THREE, cw, ch, cr);
    var bodyGeo = new THREE.ExtrudeGeometry(outline, { depth: depth, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 8, curveSegments: 48 });
    bodyGeo.translate(0, 0, -depth / 2);
    g.add(new THREE.Mesh(bodyGeo, [M.back, M.frame]));

    /* frente: vidro preto, ecrã (direito e centrado), furo da câmara e reflexos */
    var zf = T / 2;
    var front = new THREE.Mesh(shapePlane(THREE, outline, cw, ch, 48), M.frontGlass);
    front.position.z = zf + 0.03; g.add(front);

    var bez = 1.3, sw = cw - 2 * bez, sh = ch - 2 * bez, sr = cr - bez * 0.75;
    // a imagem (20:9) é um pouco mais alta do que o ecrã (19,5:9): corta-se quase tudo em baixo,
    // onde só há a barra de gestos, e 8 px em cima (a barra de estado fica inteira)
    var sa = sw / sh, v0 = 0, v1 = 1, u0 = 0, u1 = 1, vis = 1;
    if (sa > SCREEN.aspect) {
      vis = SCREEN.aspect / sa;
      v1 = 1 - SCREEN.cropTop / SCREEN.rows;
      v0 = v1 - vis;
    } else {
      var f2 = sa / SCREEN.aspect; u0 = (1 - f2) / 2; u1 = 1 - u0;
    }
    var screenGeo = shapePlane(THREE, roundedRect(THREE, sw, sh, sr), sw, sh, 48, v0, v1, u0, u1);
    var screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x0f1014, toneMapped: false }));
    screen.position.z = zf + 0.06; g.add(screen);

    // furo da câmara frontal exatamente onde estava nas capturas (alinhado com a barra de estado)
    var holeY = sh / 2 - ((SCREEN.holeRow - SCREEN.cropTop) / (SCREEN.rows * vis)) * sh;
    var hole = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), M.hole); hole.position.set(0, holeY, zf + 0.09); g.add(hole);
    var holeRing = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.8, 40), M.barrel); holeRing.position.set(0, holeY, zf + 0.085); g.add(holeRing);
    var holeLens = new THREE.Mesh(new THREE.CircleGeometry(0.6, 28), M.lensInner); holeLens.position.set(0, holeY, zf + 0.1); g.add(holeLens);
    // ranhura do auscultador, na aresta de cima
    var ear = new THREE.Mesh(shapePlane(THREE, roundedRect(THREE, 11, 0.32, 0.16), 11, 0.32, 8), M.hole);
    ear.position.set(0, ch / 2 - 0.42, zf + 0.05); g.add(ear);

    var fx = new THREE.Mesh(shapePlane(THREE, outline, cw, ch, 48), M.glassFx);
    fx.position.z = zf + 0.14; fx.renderOrder = 2; g.add(fx);

    /* traseira: coordenadas medidas a partir do canto sup. esq. vistos de trás,
       que corresponde ao canto sup. DIREITO visto de frente (+x) */
    var zb = -T / 2;
    function bx(fromLeft) { return W / 2 - fromLeft; }
    function by(fromTop) { return H / 2 - fromTop; }
    function onBack(mesh, x, y, z) { mesh.rotation.y = Math.PI; mesh.position.set(x, y, z); g.add(mesh); return mesh; }

    // ilha das câmaras: cápsula elevada, tampo de vidro e rebordo metálico
    var I = CAM.island, ibs = 0.45, ibt = 0.45, idepth = I.raise - ibt * 2 + 0.2;
    var ishape = roundedRect(THREE, I.w - 2 * ibs, I.h - 2 * ibs, I.w / 2 - ibs);
    var islandGeo = new THREE.ExtrudeGeometry(ishape, { depth: idepth, bevelEnabled: true, bevelThickness: ibt, bevelSize: ibs, bevelSegments: 6, curveSegments: 64 });
    var island = new THREE.Mesh(islandGeo, [M.island, M.frame]);
    // depois de rodar 180°, a extrusão vai de z = +ibt (dentro do corpo) até z = −(idepth + ibt)
    var zIsland = zb - I.raise;
    island.rotation.y = Math.PI;
    island.position.set(bx(I.cx), by(I.cy), zIsland + idepth + ibt);
    g.add(island);
    // linha fina por dentro do rebordo (como nas fotografias do S26 Ultra)
    var gOut = roundedRect(THREE, I.w - 2.1, I.h - 2.1, I.w / 2 - 1.05);
    gOut.holes.push(roundedRect(THREE, I.w - 2.55, I.h - 2.55, I.w / 2 - 1.275, new THREE.Path()));
    onBack(new THREE.Mesh(new THREE.ShapeGeometry(gOut, 64), M.groove), bx(I.cx), by(I.cy), zIsland - 0.006);

    // uma lente: anel metálico com rebordo arredondado, vidro ligeiramente encastrado
    function lens(x, y, zBase, L) {
      var top = zBase - L.height, lip = 0.24, recess = 0.22;
      var wall = new THREE.Mesh(new THREE.CylinderGeometry(L.ring, L.ring, L.height, 96, 1, true), M.ring);
      wall.rotation.x = Math.PI / 2; wall.position.set(x, y, zBase - L.height / 2); g.add(wall);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(L.ring - lip, lip, 16, 96), M.ring);
      rim.position.set(x, y, top + lip * 0.15); g.add(rim);
      onBack(new THREE.Mesh(new THREE.RingGeometry(L.glass, L.ring - lip, 96), M.ring), x, y, top - lip * 0.6);
      var inner = new THREE.Mesh(new THREE.CylinderGeometry(L.glass, L.glass, recess, 96, 1, true), M.barrel);
      inner.rotation.x = Math.PI / 2; inner.position.set(x, y, top - lip * 0.6 + recess / 2); g.add(inner);
      onBack(new THREE.Mesh(new THREE.CircleGeometry(L.glass, 96), M.lens), x, y, top - lip * 0.6 + recess);
    }
    CAM.big.cy.forEach(function (cy) { lens(bx(CAM.big.cx), by(cy), zIsland, CAM.big); });
    CAM.small.cy.forEach(function (cy) { lens(bx(CAM.small.cx), by(cy), zb, CAM.small); });

    // flash LED, rente ao vidro, entre as duas lentes pequenas
    var F = CAM.flash;
    onBack(new THREE.Mesh(new THREE.CircleGeometry(F.r, 48), M.flash), bx(F.cx), by(F.cy), zb - 0.05);
    onBack(new THREE.Mesh(new THREE.RingGeometry(F.r, F.r + 0.3, 48), M.frame), bx(F.cx), by(F.cy), zb - 0.045);

    /* botões (lado direito, visto de frente): volume e ligar, nas posições do S26 Ultra */
    function button(fromTop0, fromTop1) {
      var len = fromTop1 - fromTop0, r = 1.0;
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 8, 24), M.frameGloss);
      b.scale.set(0.62, 1, 1.4); b.position.set(W / 2 - 0.05, by((fromTop0 + fromTop1) / 2), 0); g.add(b);
    }
    button(26.7, 47.6); button(55.2, 71.1);

    /* em baixo (visto de frente): S Pen, microfone, USB-C e altifalante; em cima: microfone */
    function onBottom(mesh, x) { mesh.rotation.x = Math.PI / 2; mesh.position.set(x, -H / 2 - 0.02, 0); g.add(mesh); }
    onBottom(new THREE.Mesh(shapePlane(THREE, roundedRect(THREE, 8.6, 3.0, 1.5), 8.6, 3.0, 24), M.hole), 0);
    for (var s = 0; s < 7; s++) onBottom(new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), M.hole), 9.6 + s * 1.5);
    onBottom(new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), M.hole), -7);
    onBottom(new THREE.Mesh(shapePlane(THREE, roundedRect(THREE, 6.4, 2.9, 1.3), 6.4, 2.9, 16), M.plastic), -W / 2 + 12.5);
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
