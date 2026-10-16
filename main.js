/* CarHelp — site. GSAP + ScrollTrigger + Lenis. */
(function () {
  'use strict';

  /* O site anima sempre, como o projeto de referência. Se um dia quiseres respeitar a
     preferência "reduzir movimento" do sistema operativo, muda isto para true. */
  var RESPECT_REDUCED_MOTION = false;

  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = RESPECT_REDUCED_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 1025px)');
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }
  function fmt(n) { return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var loader = $('#loader');
  var rig = $('#rig');
  var navbar = $('#navbar'), navCard = $('#navCard'), navDim = $('#navDim'), ncClose = $('#ncClose'), nbMenu = $('#nbMenu');

  /* ── Botões da Google Play ── */
  (function () {
    var url = (window.PLAY_STORE_URL || '').trim(), live = url !== '';
    $$('[data-play-link]').forEach(function (a) {
      if (live) { a.href = url; a.classList.remove('soon'); a.target = '_blank'; a.rel = 'noopener'; }
      else { a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
    });
    $$('[data-play-small]').forEach(function (e) { e.textContent = live ? 'Obter na' : 'Brevemente'; });
    $$('[data-play-note]').forEach(function (e) { e.textContent = live ? 'Disponível para Android, com 10 dias grátis.' : 'A app chega em breve à Google Play.'; });
  })();

  /* ── Botões: o círculo enche a partir do ponto onde o cursor entra ── */
  $$('.ibtn').forEach(function (b) {
    function at(e) { var r = b.getBoundingClientRect(); b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px'); }
    on(b, 'pointerenter', at); on(b, 'pointerleave', at);
  });

  /* ── FAQ ── */
  $$('.qa').forEach(function (qa) {
    var btn = $('button', qa), ans = $('.ans', qa);
    on(btn, 'click', function () {
      var open = !qa.classList.contains('open');
      $$('.qa.open').forEach(function (o) {
        if (o === qa) return;
        o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false');
        if (gsap) gsap.to($('.ans', o), { height: 0, duration: 0.6, ease: 'expo.inOut' }); else $('.ans', o).style.height = '0';
      });
      qa.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (gsap) gsap.to(ans, { height: open ? 'auto' : 0, duration: 0.7, ease: 'expo.inOut', onComplete: function () { if (ST) ST.refresh(); } });
      else ans.style.height = open ? 'auto' : '0';
    });
  });

  /* ── Planos: mensal / anual ── */
  (function () {
    var sw = $('#switch'); if (!sw) return;
    var price = $('#price'), per = $('#per'), note = $('#perNote'), val = { v: 19.99 };
    $$('button', sw).forEach(function (b) {
      on(b, 'click', function () {
        var year = b.getAttribute('data-mode') === 'year';
        sw.classList.toggle('year', year);
        $$('button', sw).forEach(function (x) { var m = x === b; x.classList.toggle('on', m); x.setAttribute('aria-pressed', m ? 'true' : 'false'); });
        per.textContent = year ? '/ ano' : '/ mês';
        note.textContent = year ? 'Equivale a 1,67 € por mês.' : 'Sem compromisso. Cancelas quando quiseres.';
        var target = year ? 19.99 : 2.99;
        if (gsap && !reduce) gsap.to(val, { v: target, duration: 0.8, ease: 'expo.out', onUpdate: function () { price.textContent = fmt(val.v) + ' €'; } });
        else { val.v = target; price.textContent = fmt(target) + ' €'; }
      });
    });
  })();

  /* ── Vídeo em ecrã inteiro ── */
  var lenis = null;
  (function () {
    var lb = $('#lightbox'), v = $('#lbVideo'), close = $('#lbClose');
    if (!lb || !v) return;
    function open() {
      var portrait = window.matchMedia('(max-width: 760px), (orientation: portrait)').matches;
      v.src = portrait ? 'media/carhelp-mobile.mp4' : 'media/carhelp-desktop.mp4';
      v.muted = false; v.currentTime = 0;
      lb.classList.add('on');
      if (lenis) lenis.stop();
      v.play().catch(function () {});
      close.focus();
    }
    function shut() {
      lb.classList.remove('on'); v.pause(); v.removeAttribute('src'); v.load();
      if (lenis) lenis.start();
    }
    $$('[data-video]').forEach(function (b) {
      on(b, 'click', function (e) { e.preventDefault(); open(); });
      on(b, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    on(close, 'click', shut);
    on(lb, 'click', function (e) { if (e.target === lb) shut(); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('on')) shut(); });
  })();

  /* ── Sem GSAP: página estática, menu simples ── */
  if (!gsap || !ST) {
    if (loader) loader.style.display = 'none';
    if (rig) rig.style.display = 'none';
    on(nbMenu, 'click', function () { navCard.classList.toggle('static-open'); ncClose.classList.toggle('static-open'); });
    on(ncClose, 'click', function () { navCard.classList.remove('static-open'); ncClose.classList.remove('static-open'); });
    return;
  }
  gsap.registerPlugin(ST);

  /* ── Scroll suave ── */
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    // até o carregamento acabar, uma paragem longa (ex.: preparar o 3D, mais de meio segundo)
    // não faz a animação saltar; frames lentos normais não a atrasam. Depois fica sincronizado
    // com o scroll suave (lagSmoothing 0)
    gsap.ticker.lagSmoothing(500, 33);
  }
  function scrollToEl(el) {
    if (el === 0) { if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ── Barra: encolhe ao descer, abre ao subir ou ao passar o rato ── */
  var mini = false, menuOpen = false, lastY = 0, hovering = false;
  function setMini(v) { if (v === mini || !navbar) return; mini = v; navbar.classList.toggle('mini', v); }
  on(window, 'scroll', function () {
    var y = window.pageYOffset || 0;
    if (!menuOpen) {
      if (y < 120) setMini(false);
      else if (y > lastY + 6 && !hovering) setMini(true);
      else if (y < lastY - 12) setMini(false);
    }
    lastY = y;
  }, { passive: true });
  on(navbar, 'pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; setMini(false); } });
  on(navbar, 'pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; if ((window.pageYOffset || 0) > 120 && !menuOpen) setMini(true); } });
  on(navbar, 'click', function (e) { if (mini) { e.preventDefault(); setMini(false); } });

  /* ── Menu: a barra transforma-se num cartão ── */
  var cardItems = navCard ? $$('.nc-links a, .nc-mark, hr, .nc-small, .nc-cta', navCard) : [];
  function currentSection() {
    var best = null, vh = window.innerHeight;
    $$('.nc-links a', navCard).forEach(function (a) {
      var t = a.getAttribute('href') === '#topo' ? $('.hero') : $(a.getAttribute('href'));
      if (t && t.getBoundingClientRect().top <= vh * 0.45) best = a;
    });
    return best;
  }
  function openMenu() {
    if (menuOpen || !navCard) return;
    menuOpen = true;
    if (lenis) lenis.stop();
    nbMenu.setAttribute('aria-expanded', 'true');
    navCard.setAttribute('aria-hidden', 'false');
    $$('.nc-links a', navCard).forEach(function (a) { a.classList.remove('cur'); });
    var cur = currentSection(); if (cur) cur.classList.add('cur');
    var r = navbar.getBoundingClientRect(), vh = window.innerHeight;
    var inner = $('.nc-inner', navCard);
    var w = Math.min(inner.offsetWidth, window.innerWidth - 32), h = inner.offsetHeight;
    var b0 = vh - r.bottom;
    gsap.killTweensOf([navCard, navDim, ncClose].concat(cardItems));
    gsap.set(navCard, { visibility: 'visible', width: r.width, height: r.height, bottom: b0, borderRadius: r.height / 2 });
    gsap.set(cardItems, { autoAlpha: 0, y: 14 });
    navbar.classList.add('hold');
    navDim.style.pointerEvents = 'auto';
    gsap.timeline()
      .to(navDim, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(navCard, { width: w, height: h, bottom: b0 + r.height + 14, borderRadius: 40, duration: 0.8, ease: 'expo.inOut' }, 0)
      .to(cardItems, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.035, ease: 'power3.out' }, 0.45)
      .fromTo(ncClose, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.5);
  }
  function closeMenu(after) {
    if (!menuOpen) { if (after) after(); return; }
    menuOpen = false;
    nbMenu.setAttribute('aria-expanded', 'false');
    navCard.setAttribute('aria-hidden', 'true');
    var r = navbar.getBoundingClientRect(), vh = window.innerHeight;
    gsap.killTweensOf([navCard, navDim, ncClose].concat(cardItems));
    gsap.timeline({ onComplete: function () {
      gsap.set(navCard, { visibility: 'hidden' });
      navbar.classList.remove('hold');
      navDim.style.pointerEvents = 'none';
      if (lenis) lenis.start();
      if (after) after();
    } })
      .to(cardItems, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 0)
      .to(ncClose, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: 'power2.in' }, 0)
      .to(navCard, { width: r.width, height: r.height, bottom: vh - r.bottom, borderRadius: r.height / 2, duration: 0.7, ease: 'expo.inOut' }, 0.12)
      .to(navDim, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.3);
  }
  on(nbMenu, 'click', function (e) { e.stopPropagation(); if (!mini) openMenu(); });
  on(ncClose, 'click', function () { closeMenu(); });
  on(navDim, 'click', function () { closeMenu(); });
  on(document, 'keydown', function (e) { if (e.key === 'Escape' && menuOpen) closeMenu(); });

  /* ── Âncoras internas ── */
  $$('a[data-scroll]').forEach(function (a) {
    on(a, 'click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      e.preventDefault();
      if (mini && navbar.contains(a)) return; // a barra encolhida primeiro abre
      var target = id === '#topo' ? 0 : $(id);
      if (menuOpen) closeMenu(function () { scrollToEl(target); });
      else scrollToEl(target);
    });
  });

  /* ── Transição para as outras páginas ── */
  var curtain = $('#curtain');
  $$('a[data-page]').forEach(function (a) {
    on(a, 'click', function (e) {
      if (reduce || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      var href = a.getAttribute('href');
      var go = function () { gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: function () { window.location.href = href; } }); };
      if (menuOpen) closeMenu(go); else go();
    });
  });
  on(window, 'pageshow', function () { gsap.set(curtain, { yPercent: 100 }); });

  /* ── Estados iniciais ── */
  var heroTitle = $('.hero .top h1');
  var heroLines = $$('.hero [data-split] .line > span');
  var otherSplits = $$('[data-split]').filter(function (h) { return !h.closest('.hero'); });
  if (!reduce) {
    gsap.set(heroLines, { yPercent: 115 });
    gsap.set('[data-hero-in]', { autoAlpha: 0, y: 30 });
    if (navbar) navbar.classList.add('hide');
  }

  /* ── Telemóvel 3D (WebGL): percurso ligado ao scroll ──
     Entre secções vem para o centro, cresce e dá uma cambalhota (mostra as costas);
     o ecrã troca exatamente quando está de costas (rotação nos 180°), por isso a
     mudança nunca se vê; pousa de frente na coluna da direita, longe do texto. */
  var phoneEngine = (function () {
    var rigEl = rig, canvas = $('#phoneCanvas');
    if (!rigEl || !canvas) return null;
    var p3 = null;

    var SCREENS = ['media/screen-inicio.jpg', 'media/screen-analise.jpg', 'media/screen-garagem.jpg'];
    function withScreens(cb) {
      // aberto com duplo clique (file://), o WebGL recusa imagens locais: usa as mesmas imagens embutidas
      if (location.protocol !== 'file:') { cb(SCREENS); return; }
      if (window.CARHELP_SCREENS) { cb(window.CARHELP_SCREENS); return; }
      var sc = document.createElement('script');
      sc.src = 'media/screens-data.js';
      sc.onload = function () { cb(window.CARHELP_SCREENS || SCREENS); };
      sc.onerror = function () { cb(SCREENS); };
      document.head.appendChild(sc);
    }

    var phonePx = 600;
    function sizePhone() {
      var fs = parseFloat(window.getComputedStyle(document.body).fontSize) || 16;
      phonePx = Math.min(window.innerHeight * 0.76, fs * 46);
      if (p3) p3.resize();
    }

    function init() {
      if (p3 || !desktop.matches) return;
      p3 = window.CarHelpPhone3D ? window.CarHelpPhone3D.create(canvas) : null;
      if (!p3) { document.documentElement.classList.add('no-webgl'); rigEl.style.display = 'none'; return; }
      withScreens(function (list) { p3.loadScreens(list); });
      sizePhone();
      // compila os shaders enquanto o carregamento ainda está no ecrã
      p3.warmup();
    }

    var secs = [$('.hero'), $('#orcamentos'), $('#garagem')];
    // dx/dy em fração do ecrã; rotações em graus (contínuas: cada secção = +360°)
    var S = {
      rest0: { dx: 0, dy: 0.02, rx: 10, ry: -24, rz: 16, s: 1, o: 1 },
      apex1: { dx: -0.06, dy: -0.02, rx: 4, ry: 180, rz: -8, s: 1.14, o: 1 },
      rest1: { dx: 0, dy: 0, rx: 4, ry: 348, rz: 7, s: 1.02, o: 1 },
      apex2: { dx: -0.085, dy: 0.01, rx: 10, ry: 540, rz: 38, s: 1.2, o: 1 },
      rest2: { dx: 0.01, dy: 0, rx: 6, ry: 704, rz: -6, s: 1, o: 1 },
      exit: { dx: 0.02, dy: -1.15, rx: 26, ry: 880, rz: 24, s: 0.84, o: 0 }
    };
    var ORDER = ['rest0', 'apex1', 'rest1', 'apex2', 'rest2', 'exit'];
    var kf = [];

    function measure() {
      var vh = window.innerHeight, y = window.pageYOffset || 0;
      if (!secs[1] || !secs[2]) return;
      function top(el) { return el.getBoundingClientRect().top + y; }
      var t1 = top(secs[1]), h1 = secs[1].offsetHeight, t2 = top(secs[2]), h2 = secs[2].offsetHeight;
      var go1 = vh * 0.08, land1 = t1 - vh * 0.06;
      var go2 = t1 + h1 - vh * 0.92, land2 = t2 - vh * 0.06;
      var pts = [
        [0, 'rest0', 'hold'], [go1, 'rest0', 'in'], [(go1 + land1) / 2, 'apex1', 'out'],
        [land1, 'rest1', 'hold'], [go2, 'rest1', 'in'], [(go2 + land2) / 2, 'apex2', 'out'],
        [land2, 'rest2', 'hold'], [t2 + h2 - vh * 0.95, 'rest2', 'inout'], [t2 + h2 - vh * 0.1, 'exit', 'hold']
      ];
      var last = -1;
      kf = pts.map(function (p) { var pos = Math.max(p[0], last + 1); last = pos; return { pos: pos, st: p[1], ease: p[2] }; });
    }

    var EASE = {
      hold: function (t) { return t; },
      in: function (t) { return t * t; },
      out: function (t) { return 1 - (1 - t) * (1 - t); },
      inout: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    };
    function target(y) {
      if (!kf.length) measure();
      var i = 0;
      while (i < kf.length - 2 && y >= kf[i + 1].pos) i++;
      var a = kf[i], b = kf[i + 1] || a;
      var t = b.pos > a.pos ? Math.max(0, Math.min(1, (y - a.pos) / (b.pos - a.pos))) : 1;
      var e = (EASE[a.ease] || EASE.inout)(t), A = S[a.st], B = S[b.st], out = {};
      for (var k in A) out[k] = A[k] + (B[k] - A[k]) * e;
      return out;
    }

    var cur = null, intro = { p: reduce ? 1 : 0 }, visible = null;
    var fl = { rx: 0, ry: 0, y: 0 };

    function render(dt) {
      if (!desktop.matches || !p3) { if (visible !== false) { visible = false; rigEl.style.visibility = 'hidden'; } return; }
      var tg = target(window.pageYOffset || 0);
      if (!cur || reduce) { cur = {}; for (var k0 in tg) cur[k0] = tg[k0]; }
      else {
        var k = 1 - Math.pow(1 - 0.1, Math.max(1, dt * 60));
        for (var key in tg) cur[key] += (tg[key] - cur[key]) * k;
      }
      var e = intro.p;
      var ry = reduce ? -14 : cur.ry - (1 - e) * 380;
      var rx = cur.rx + (1 - e) * 35;
      var dy = cur.dy + (1 - e) * 0.6;
      var s = cur.s * (0.78 + 0.22 * e);
      var op = cur.o * Math.min(1, e * 2.5);
      rigEl.style.opacity = op.toFixed(3);
      var vis = op > 0.01;
      if (vis !== visible) { visible = vis; rigEl.style.visibility = vis ? 'visible' : 'hidden'; }
      if (!vis) return;
      // os ângulos acima usam a convenção do CSS (eixo Y para baixo): no 3D, X e Z trocam de sinal
      p3.setPose({ x: 0.75 + cur.dx, y: 0.5 + dy, rx: -rx, ry: ry, rz: -cur.rz, s: s, px: phonePx });
      p3.setFloat(fl);
      p3.setScreen(Math.max(0, Math.min(2, Math.floor((ry + 180) / 360))));
      p3.render();
    }

    init();
    measure();
    on(window, 'resize', function () { init(); measure(); sizePhone(); });
    on(window, 'load', measure);
    ST.addEventListener('refresh', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); sizePhone(); });
    gsap.ticker.add(function (time, deltaTime) { render((deltaTime || 16) / 1000); });

    // flutua devagar e inclina-se um pouco para o lado do rato
    if (!reduce) {
      gsap.to(fl, { y: 3, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      var qx = gsap.quickTo(fl, 'rx', { duration: 1.2, ease: 'power3.out' });
      var qy = gsap.quickTo(fl, 'ry', { duration: 1.2, ease: 'power3.out' });
      on(window, 'pointermove', function (ev) {
        qx((ev.clientY / window.innerHeight - 0.5) * 8);
        qy((ev.clientX / window.innerWidth - 0.5) * 12);
      }, { passive: true });
    }

    return {
      start: function (dur) { if (!reduce) gsap.to(intro, { p: 1, duration: dur || 2.2, ease: 'power3.out' }); },
      measure: measure
    };
  })();

  /* ── Entrada do hero (o título sobe até ao lugar, o telemóvel entra a rodar) ── */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (heroTitle) tl.fromTo(heroTitle, { y: function () { return window.innerHeight * 0.32; } }, { y: 0, duration: 1.6 }, 0);
    tl.to(heroLines, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0.05)
      .to('[data-hero-in]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.45)
      .add(function () { if (navbar) navbar.classList.remove('hide'); }, 0.8);
    if (phoneEngine) tl.add(function () { phoneEngine.start(2.4); }, 0.15);
    return tl;
  }

  /* ── Carregamento: contador que rola, ecrãs da app ao centro, texto em baixo ── */
  function runLoader() {
    if (lenis) lenis.stop();
    var cols = $$('.ld-col', loader), ldImg = $('#ldImg'), shots = $$('img', ldImg);
    var textLines = $$('.ld-text .line > span', loader);
    var strips = cols.map(function (col) {
      var st = document.createElement('span'); st.className = 'strip';
      for (var k = 0; k < 30; k++) { var s = document.createElement('span'); s.textContent = k % 10; st.appendChild(s); }
      col.appendChild(st);
      return { el: st, idx: 0 };
    });
    function stepH() { var f = strips[0] && strips[0].el.firstChild; return f ? f.getBoundingClientRect().height : 0; }
    function count(v, dur) {
      return function () {
        var digits = [Math.floor(v / 10) % 10, v % 10];
        strips.forEach(function (s, i) {
          var d = digits[i], step = (d - (s.idx % 10) + 10) % 10;
          if (i === 1) step += 10;                 // as unidades dão uma volta extra
          if (s.idx + step > 29) { s.idx = s.idx % 10; gsap.set(s.el, { y: -s.idx * stepH() }); }
          s.idx += step;
          gsap.to(s.el, { y: -s.idx * stepH(), duration: dur, ease: 'expo.inOut', delay: i * 0.07 });
        });
      };
    }
    function show(i) {
      return function () {
        shots.forEach(function (im, k) {
          if (k === i) gsap.fromTo(im, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
          else gsap.to(im, { autoAlpha: 0, duration: 0.45 });
        });
      };
    }
    gsap.set(textLines, { yPercent: 115 });
    gsap.set('.ld-brand, .ld-mark', { autoAlpha: 0 });
    gsap.set(ldImg, { autoAlpha: 0, scale: 0.8 });
    gsap.set(shots, { autoAlpha: 0 });
    gsap.timeline()
      .to(textLines, { yPercent: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.2)
      .to('.ld-brand, .ld-mark', { autoAlpha: 1, duration: 0.6 }, 0.25)
      .add(count(13, 0.9), 0.25)
      .to(ldImg, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' }, 0.35)
      .add(show(0), 0.35)
      .add(count(35, 1), 1.0)
      .add(count(45, 1), 2.0).add(show(1), 2.0)
      .add(count(76, 1), 3.0).add(show(2), 3.0)
      .add(count(98, 0.9), 3.9)
      .to(textLines, { yPercent: -115, duration: 0.7, stagger: 0.05, ease: 'expo.in' }, 4.4)
      .to(ldImg, { autoAlpha: 0, scale: 0.85, duration: 0.6, ease: 'power2.in' }, 4.4)
      .to('.ld-brand, .ld-mark', { autoAlpha: 0, duration: 0.4 }, 4.45)
      .to('.ld-count', { yPercent: -100, autoAlpha: 0, duration: 0.8, ease: 'expo.inOut' }, 4.75)
      .add(function () { intro(); }, 4.75)
      .to(loader, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 4.85)
      .add(function () { loader.style.display = 'none'; gsap.ticker.lagSmoothing(0); if (lenis) lenis.start(); goHash(); }, 5.75);
  }

  /* ligações vindas de outras páginas (ex.: index.html#planos): vai à secção depois da entrada */
  function goHash() {
    var id = location.hash && location.hash.slice(1);
    var el = id && document.getElementById(id);
    if (!el || id === 'topo') return;
    ST.refresh();
    setTimeout(function () { scrollToEl(el); }, 60);
  }
  if (location.hash && 'scrollRestoration' in history) { history.scrollRestoration = 'manual'; window.scrollTo(0, 0); }

  // o carregamento completo só aparece na primeira visita da sessão; ao voltar das outras
  // páginas do site entra com a cortina (como as páginas legais)
  var seen = false;
  try { seen = sessionStorage.getItem('carhelp-loaded') === '1'; sessionStorage.setItem('carhelp-loaded', '1'); } catch (e) {}

  if (reduce || !loader) {
    gsap.ticker.lagSmoothing(0);
    if (loader) loader.style.display = 'none';
    if (navbar) navbar.classList.remove('hide');
    if (!reduce) intro();
    goHash();
  } else if (seen) {
    loader.style.display = 'none';
    gsap.ticker.lagSmoothing(0);
    gsap.fromTo(curtain, { yPercent: 0 }, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', onComplete: function () { gsap.set(curtain, { yPercent: 100 }); } });
    gsap.delayedCall(0.35, function () { intro(); goHash(); });
  } else {
    runLoader();
  }

  /* ── Telemóveis "no sítio" (tablet e telemóvel): flutuam e inclinam com o scroll ── */
  if (!reduce && !desktop.matches) {
    $$('[data-mphone] img').forEach(function (img, i) {
      gsap.to(img, { y: -10, duration: 3 + i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.fromTo(img, { rotation: -2 }, { rotation: 2, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ── "Ainda mais": o scroll vertical desloca os cartões na horizontal ── */
  (function () {
    var box = $('.more .pinbox'), track = $('#track');
    if (!box || !track || !desktop.matches || reduce) return;
    function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: box, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  })();

  /* ── Títulos: linhas a subir; blocos a aparecer ── */
  if (!reduce) {
    otherSplits.forEach(function (h) {
      var lines = $$('.line > span', h);
      gsap.set(lines, { yPercent: 115 });
      ST.create({ trigger: h, start: 'top 88%', once: true, onEnter: function () {
        gsap.to(lines, { yPercent: 0, duration: 1.25, stagger: 0.09, ease: 'expo.out' });
      } });
    });

    $$('[data-fade]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 46, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    $$('.callouts').forEach(function (box) {
      gsap.from($$('[data-pop]', box), { autoAlpha: 0, scale: 0.82, y: 50, duration: 1.1, stagger: 0.14, ease: 'expo.out',
        scrollTrigger: { trigger: box.parentNode, start: 'top 60%', once: true } });
    });

    gsap.to('.hero .top, .hero .bottom', { yPercent: -18, autoAlpha: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    $$('.aurora').forEach(function (a) {
      gsap.to(a, { yPercent: 40, ease: 'none', scrollTrigger: { trigger: a.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    gsap.fromTo('#mediaCard', { rotationX: 28, scale: 0.84, yPercent: 6 },
      { rotationX: 0, scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#mediaCard', start: 'top bottom', end: 'top 20%', scrub: 1 } });

    gsap.from('.who-card', { y: 100, autoAlpha: 0, duration: 1.2, stagger: 0.07, ease: 'expo.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.who-grid', start: 'top 82%', once: true } });

    gsap.from('.tcard', { y: 100, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.trio', start: 'top 82%', once: true } });

    gsap.from('.mcard', { y: 90, autoAlpha: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out',
      scrollTrigger: { trigger: '#track', start: 'top 88%', once: true } });


    gsap.from('footer .word', { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ── Cartões "para quem é": brilho que segue o rato ── */
  $$('.who-card').forEach(function (c) {
    on(c, 'pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── Perguntas: notificações da app a vaguear pela secção ── */
  (function () {
    var field = $('#nfField'); if (!field) return;
    var section = field.parentNode;
    var wraps = $$('.nf-wrap', field), cards = $$('.nf', field);
    var big = desktop.matches;
    var amp = big ? { x: 30, y: 22, r: 2.4 } : { x: 7, y: 5, r: 1.1 };
    var DEPTH = [0.7, 1, 0.55, 0.9, 0.8, 0.6, 0.45, 1.1];
    var active = false;

    // cada notificação anda à deriva por um caminho próprio, sempre diferente
    cards.forEach(function (c) {
      function wander() {
        c._t = gsap.to(c, {
          x: gsap.utils.random(-amp.x, amp.x), y: gsap.utils.random(-amp.y, amp.y), rotation: gsap.utils.random(-amp.r, amp.r),
          duration: gsap.utils.random(3.6, 6.4), ease: 'sine.inOut', onComplete: wander
        });
        if (!active) c._t.pause();
      }
      wander();
      // ao passar o rato, para e aproxima-se (para ler com calma)
      on(c, 'pointerenter', function () { if (c._t) c._t.pause(); gsap.to(c, { scale: 1.04, duration: 0.4, ease: 'power3.out' }); });
      on(c, 'pointerleave', function () { gsap.to(c, { scale: 1, duration: 0.5, ease: 'power3.out' }); if (c._t && active) c._t.resume(); });
    });

    // chegam como notificações: deslizam de cima, desfasadas
    gsap.set(wraps, { autoAlpha: 0, yPercent: -60, scale: 0.9 });
    ST.create({ trigger: section, start: 'top 72%', once: true, onEnter: function () {
      gsap.to(wraps, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.9, ease: 'back.out(1.6)', stagger: { each: 0.12, from: 'random' } });
    } });

    // profundidade: cada uma mexe a uma velocidade diferente com o scroll e com o rato
    if (big) {
      wraps.forEach(function (w, i) {
        var d = DEPTH[i % DEPTH.length];
        gsap.fromTo(w, { y: 90 * d }, { y: -90 * d, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
        w._qx = gsap.quickTo(w, 'x', { duration: 1.4, ease: 'power3.out' });
        w._d = d;
      });
      on(window, 'pointermove', function (ev) {
        if (!active) return;
        var mx = ev.clientX / window.innerWidth - 0.5;
        wraps.forEach(function (w) { w._qx(-mx * 40 * w._d); });
      }, { passive: true });
    }

    // de vez em quando, uma "acabou de chegar"
    var pingTimer = null;
    function ping() {
      var c = cards[Math.floor(Math.random() * cards.length)];
      if (!c.offsetParent) return;
      c.classList.remove('ping'); void c.offsetWidth; c.classList.add('ping');
    }
    ST.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: function (s) {
      active = s.isActive;
      cards.forEach(function (c) { if (c._t) { if (active) c._t.resume(); else c._t.pause(); } });
      if (active && !pingTimer) pingTimer = setInterval(ping, 3200);
      if (!active && pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    } });
  })();

  /* ── Vídeo do cartão grande: só toca quando visível ── */
  $$('video[data-lazyplay]').forEach(function (v) {
    if (window.matchMedia('(max-width: 760px), (orientation: portrait)').matches) {
      v.src = 'media/carhelp-mobile.mp4'; v.poster = 'media/poster-mobile.jpg';
    }
    ST.create({ trigger: v, start: 'top 90%', end: 'bottom 10%',
      onToggle: function (s) { if (s.isActive && !reduce) { v.preload = 'auto'; v.play().catch(function () {}); } else v.pause(); } });
  });

  /* ── Contador ("Em 60 s") ── */
  $$('[data-odo]').forEach(function (el) {
    var digits = String(el.getAttribute('data-odo')).split('');
    el.setAttribute('aria-label', el.getAttribute('data-odo'));
    var cols = digits.map(function (d) {
      var col = document.createElement('span'); col.className = 'col';
      for (var k = 0; k < 20; k++) { var s = document.createElement('span'); s.textContent = k % 10; col.appendChild(s); }
      el.appendChild(col);
      return { col: col, target: 10 + (+d) };
    });
    function stepH(c) { var f = c.col.firstChild; return f ? f.getBoundingClientRect().height : 0; }
    function place(p) { cols.forEach(function (c) { gsap.set(c.col, { y: -c.target * stepH(c) * p }); }); }
    if (reduce) { place(1); on(window, 'resize', function () { place(1); }); return; }
    var done = false;
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
      cols.forEach(function (c, i) {
        var o = { p: 0 };
        gsap.to(o, { p: 1, duration: 2.2 + i * 0.35, ease: 'expo.out',
          onUpdate: function () { gsap.set(c.col, { y: -c.target * stepH(c) * o.p }); },
          onComplete: function () { done = true; } });
      });
    } });
    on(window, 'resize', function () { if (done) place(1); });
  });

  /* ── Faixa "Perguntas?" ── */
  (function () {
    var m = $('#marquee'); if (!m) return;
    Array.prototype.slice.call(m.children).forEach(function (s) { m.appendChild(s.cloneNode(true)); });
    if (reduce) return;
    var loop = gsap.to(m, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
    ST.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
      var v = Math.min(4, 1 + Math.abs(s.getVelocity()) / 600);
      gsap.to(loop, { timeScale: s.direction < 0 ? -v : v, duration: 0.3, overwrite: true });
    } });
  })();

  /* ── Recalcular quando as letras e imagens carregarem ── */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  on(window, 'load', function () { ST.refresh(); });
})();
