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
    gsap.ticker.lagSmoothing(0);
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

  /* ── Telemóvel 3D: percurso ligado ao scroll ──
     Entre secções vem para o centro, cresce e dá uma cambalhota (mostra as costas);
     o ecrã troca exatamente quando está de costas (rotação nos 180°), por isso a
     mudança nunca se vê; pousa de frente na coluna da direita, longe do texto. */
  var phoneEngine = (function () {
    var rigEl = rig, phoneEl = $('#phone'), floatEl = $('#phoneFloat');
    if (!rigEl || !phoneEl) return null;
    var imgs = $$('[data-screen]', phoneEl);

    // espessura: camadas empilhadas de 1 px (aguenta bem a vista de lado)
    var layers = $('.p-layers', phoneEl);
    if (layers && !layers.children.length) {
      for (var z = -7; z <= 7; z++) {
        var li = document.createElement('i');
        li.style.transform = 'translateZ(' + z + 'px)';
        layers.appendChild(li);
      }
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
      out.idx = ORDER.indexOf(a.st) + (ORDER.indexOf(b.st) - ORDER.indexOf(a.st)) * t;
      return out;
    }

    var cur = null, intro = { p: reduce ? 1 : 0 }, shown = -1, visible = null;
    function setScreen(i) {
      if (i === shown) return;
      shown = i;
      imgs.forEach(function (im) { im.classList.toggle('on', +im.getAttribute('data-screen') === i); });
    }

    function render(dt) {
      if (!desktop.matches) { if (visible !== false) { visible = false; rigEl.style.visibility = 'hidden'; } return; }
      var tg = target(window.pageYOffset || 0);
      if (!cur || reduce) { cur = {}; for (var k0 in tg) cur[k0] = tg[k0]; }
      else {
        var k = 1 - Math.pow(1 - 0.1, Math.max(1, dt * 60));
        for (var key in tg) cur[key] += (tg[key] - cur[key]) * k;
      }
      var e = intro.p, vh = window.innerHeight, vw = window.innerWidth;
      var ry = reduce ? -14 : cur.ry - (1 - e) * 380;
      var rx = cur.rx + (1 - e) * 35;
      var dy = (cur.dy + (1 - e) * 0.6) * vh;
      var dx = cur.dx * vw;
      var s = cur.s * (0.78 + 0.22 * e);
      var op = cur.o * Math.min(1, e * 2.5);
      phoneEl.style.transform = 'translate(-50%, -50%) translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) +
        'deg) rotateZ(' + cur.rz.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      rigEl.style.opacity = op.toFixed(3);
      var vis = op > 0.01;
      if (vis !== visible) { visible = vis; rigEl.style.visibility = vis ? 'visible' : 'hidden'; }
      var idx = reduce ? Math.round(cur.idx / 2) : Math.floor((ry + 180) / 360);
      setScreen(Math.max(0, Math.min(imgs.length - 1, idx)));
    }

    measure();
    on(window, 'resize', measure);
    on(window, 'load', measure);
    ST.addEventListener('refresh', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    gsap.ticker.add(function (time, deltaTime) { render((deltaTime || 16) / 1000); });

    // flutua e inclina-se para o rato (camada interior, não interfere com o percurso)
    if (!reduce && floatEl) {
      gsap.to(floatEl, { y: -12, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      var qx = gsap.quickTo(floatEl, 'rotationX', { duration: 1.2, ease: 'power3.out' });
      var qy = gsap.quickTo(floatEl, 'rotationY', { duration: 1.2, ease: 'power3.out' });
      on(window, 'pointermove', function (ev) {
        qx(-(ev.clientY / window.innerHeight - 0.5) * 8);
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
      .add(function () { loader.style.display = 'none'; if (lenis) lenis.start(); }, 5.75);
  }

  if (reduce || !loader) {
    if (loader) loader.style.display = 'none';
    if (navbar) navbar.classList.remove('hide');
    if (!reduce) intro();
  } else {
    runLoader();
  }

  /* ── Telemóveis "no sítio" (tablet e telemóvel): rodam um pouco ao passar ── */
  if (!reduce && !desktop.matches) {
    $$('[data-mphone] .m-frame').forEach(function (f) {
      gsap.fromTo(f, { rotationY: -24, rotationX: 10 }, { rotationY: 24, rotationX: -6, ease: 'none',
        scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
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

    gsap.from('.who-card', { y: 120, autoAlpha: 0, rotation: 3, duration: 1.3, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.who-grid', start: 'top 82%', once: true } });

    gsap.from('.tcard', { y: 100, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.trio', start: 'top 82%', once: true } });

    gsap.from('.mcard', { y: 90, autoAlpha: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out',
      scrollTrigger: { trigger: '#track', start: 'top 88%', once: true } });

    gsap.from('.q', { x: 80, autoAlpha: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: '.qlist', start: 'top 78%', once: true } });

    gsap.from('footer .word', { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

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
