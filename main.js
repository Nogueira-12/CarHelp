/* CarHelp — site. GSAP + ScrollTrigger + Lenis.
   Sem estas bibliotecas (ou com "reduzir movimento") a página fica estática e legível. */
(function () {
  'use strict';

  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 1025px)');
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }
  function fmt(n) { return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var loader = $('#loader');
  var rig = $('.rig');

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
    on(b, 'pointerenter', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px');
      b.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
    on(b, 'pointerleave', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px');
      b.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* ── FAQ (funciona mesmo sem GSAP) ── */
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

  /* ── Sem GSAP: página estática ── */
  if (!gsap || !ST) {
    if (loader) loader.style.display = 'none';
    if (rig) rig.style.display = 'none';
    var tb = $('#topbar'); if (tb) tb.classList.add('on');
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

  /* ── Menu ── */
  var menu = $('#menu'), menuOpen = false;
  var menuTl = gsap.timeline({ paused: true })
    .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' })
    .from($$('nav .line > span', menu), { yPercent: 110, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, '-=0.35')
    .from($$('nav small, .foot', menu), { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.04 }, '-=0.7');
  function toggleMenu(open) {
    menuOpen = open;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { menuTl.timeScale(1).play(); if (lenis) lenis.stop(); }
    else { menuTl.timeScale(1.6).reverse(); if (lenis) lenis.start(); }
  }
  on($('#menuOpen'), 'click', function () { toggleMenu(true); });
  on($('#menuClose'), 'click', function () { toggleMenu(false); });
  on(document, 'keydown', function (e) { if (e.key === 'Escape' && menuOpen) toggleMenu(false); });

  /* ── Âncoras internas ── */
  $$('a[data-scroll]').forEach(function (a) {
    on(a, 'click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      e.preventDefault();
      var target = id === '#topo' ? 0 : $(id);
      if (menuOpen) { toggleMenu(false); setTimeout(function () { scrollToEl(target); }, 450); }
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
      gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: function () { window.location.href = href; } });
    });
  });
  on(window, 'pageshow', function () { gsap.set(curtain, { yPercent: 100 }); });

  /* ── Estados iniciais ── */
  var heroLines = $$('.hero [data-split] .line > span');
  var otherSplits = $$('[data-split]').filter(function (h) { return !h.closest('.hero'); });
  if (!reduce) {
    gsap.set(heroLines, { yPercent: 115 });
    gsap.set('[data-hero-in]', { autoAlpha: 0, y: 30 });
  }

  /* ── Telemóvel 3D: percurso ligado ao scroll ──
     Entre cada secção dá uma volta completa sobre si próprio; o ecrã troca
     exatamente quando está de costas (rotação a passar pelos 180°), por isso
     a mudança nunca se vê. Fica sempre na coluna da direita, longe do texto. */
  var phoneEngine = (function () {
    var rigEl = $('#rig'), phoneEl = $('#phone'), floatEl = $('#phoneFloat');
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
    // rotações contínuas em graus: -16 → 344 → 704 (uma volta inteira por secção)
    var STATES = [
      { dx: 0, dy: 0, rx: 6, ry: -16, rz: -3, s: 1, o: 1 },
      { dx: -0.025, dy: 0, rx: 3, ry: 344, rz: 3, s: 1.02, o: 1 },
      { dx: 0.012, dy: 0, rx: 7, ry: 704, rz: -3, s: 1, o: 1 },
      { dx: 0, dy: -1.2, rx: 28, ry: 900, rz: 10, s: 0.82, o: 0 }
    ];
    var kf = [];

    function measure() {
      var vh = window.innerHeight, y = window.pageYOffset || 0;
      if (!secs[1] || !secs[2]) return;
      function top(el) { return el.getBoundingClientRect().top + y; }
      var t1 = top(secs[1]), h1 = secs[1].offsetHeight, t2 = top(secs[2]), h2 = secs[2].offsetHeight;
      var pts = [
        [0, 0], [vh * 0.1, 0],                       // hero: parado
        [t1 - vh * 0.06, 1], [t1 + h1 - vh * 0.92, 1], // volta 1 → orçamentos, e fica
        [t2 - vh * 0.06, 2], [t2 + h2 - vh * 0.95, 2], // volta 2 → garagem, e fica
        [t2 + h2 - vh * 0.1, 3]                        // sai por cima
      ];
      var last = -1;
      kf = pts.map(function (p) { var pos = Math.max(p[0], last + 1); last = pos; return { pos: pos, st: p[1] }; });
    }

    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function target(y) {
      if (!kf.length) measure();
      var i = 0;
      while (i < kf.length - 2 && y >= kf[i + 1].pos) i++;
      var a = kf[i], b = kf[i + 1] || a;
      var t = b.pos > a.pos ? Math.max(0, Math.min(1, (y - a.pos) / (b.pos - a.pos))) : 1;
      var e = easeInOut(t), A = STATES[a.st], B = STATES[b.st], out = {};
      for (var k in A) out[k] = A[k] + (B[k] - A[k]) * e;
      out.idx = a.st + (b.st - a.st) * t;
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
        var k = 1 - Math.pow(1 - 0.11, Math.max(1, dt * 60));
        for (var key in tg) cur[key] += (tg[key] - cur[key]) * k;
      }
      var e = intro.p, vh = window.innerHeight, vw = window.innerWidth;
      // a meio de cada volta: cresce um pouco e inclina-se (dá peso ao movimento)
      var frac = cur.idx - Math.floor(cur.idx), mid = reduce ? 0 : Math.sin(Math.PI * frac);
      var ry = reduce ? -14 : cur.ry - (1 - e) * 380;
      var rx = cur.rx - 9 * mid + (1 - e) * 35;
      var dy = (cur.dy + (1 - e) * 0.55) * vh;
      var dx = cur.dx * vw;
      var s = cur.s * (1 + 0.07 * mid) * (0.78 + 0.22 * e);
      var op = cur.o * Math.min(1, e * 2.5);
      phoneEl.style.transform = 'translate(-50%, -50%) translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) +
        'deg) rotateZ(' + cur.rz.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      rigEl.style.opacity = op.toFixed(3);
      var vis = op > 0.01;
      if (vis !== visible) { visible = vis; rigEl.style.visibility = vis ? 'visible' : 'hidden'; }
      var idx = reduce ? Math.round(cur.idx) : Math.floor((ry + 180) / 360);
      setScreen(Math.max(0, Math.min(imgs.length - 1, idx)));
    }

    measure();
    on(window, 'resize', measure);
    on(window, 'load', measure);
    ST.addEventListener('refresh', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    gsap.ticker.add(function (time, deltaTime) { render((deltaTime || 16) / 1000); });

    // flutua e inclina-se um pouco para o rato (camada interior, não interfere com o percurso)
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
      start: function () { if (!reduce) gsap.to(intro, { p: 1, duration: 2.4, ease: 'power2.inOut' }); },
      measure: measure
    };
  })();

  /* ── Carregamento + entrada do hero ── */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroLines, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0)
      .to('[data-hero-in]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.25);
    if (phoneEngine) tl.add(function () { phoneEngine.start(); }, 0.5);
    return tl;
  }

  if (reduce || !loader) {
    if (loader) loader.style.display = 'none';
    if (!reduce) intro();
  } else {
    if (lenis) lenis.stop();
    var num = $('#loaderNum'), bar = $('#loaderBar'), c = { v: 0 };
    gsap.timeline()
      .to(c, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: function () {
        num.textContent = Math.round(c.v);
        bar.style.transform = 'scaleX(' + (c.v / 100) + ')';
      } })
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
      .add(function () { intro(); if (lenis) lenis.start(); }, '-=0.55')
      .set(loader, { display: 'none' });
  }

  /* ── Telemóveis "no sítio" (tablet e telemóvel): rodam um pouco ao passar ── */
  if (!reduce && !desktop.matches) {
    $$('[data-mphone] .m-frame').forEach(function (f) {
      gsap.fromTo(f, { rotationY: -24, rotationX: 10 }, { rotationY: 24, rotationX: -6, ease: 'none',
        scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ── Títulos: linhas a subir ── */
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

    // hero sai para cima ao fazer scroll
    gsap.to('.hero .top, .hero .bottom', { yPercent: -18, autoAlpha: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // luzes difusas com paralaxe
    $$('.aurora').forEach(function (a) {
      gsap.to(a, { yPercent: 40, ease: 'none', scrollTrigger: { trigger: a.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // cartão grande: deita-se para trás e endireita
    gsap.fromTo('#mediaCard', { rotationX: 28, scale: 0.84, yPercent: 6 },
      { rotationX: 0, scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#mediaCard', start: 'top bottom', end: 'top 20%', scrub: 1 } });

    // cartões "para quem é"
    gsap.from('.who-card', { y: 120, autoAlpha: 0, rotation: 3, duration: 1.3, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.who-grid', start: 'top 82%', once: true } });

    gsap.from('.tcard', { y: 100, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.trio', start: 'top 82%', once: true } });

    // perguntas que entram de lado
    gsap.from('.q', { x: 80, autoAlpha: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: '.qlist', start: 'top 78%', once: true } });

    // nome gigante no rodapé
    gsap.from('footer .word', { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ── Vídeo do cartão grande: só toca quando visível ── */
  $$('video[data-lazyplay]').forEach(function (v) {
    // ecrãs verticais recebem o vídeo 9:16 (o 16:9 ficaria muito cortado)
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
    // a deslocação é medida em píxeis (altura real de cada dígito)
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

  /* ── Carrossel arrastável ── */
  (function () {
    var track = $('#track'); if (!track) return;
    var x = 0, startX = 0, startPos = 0, dragging = false;
    function limits() { return Math.min(0, window.innerWidth - track.scrollWidth); }
    function go(nx, dur) { x = Math.max(limits(), Math.min(0, nx)); gsap.to(track, { x: x, duration: dur === undefined ? 0.9 : dur, ease: 'expo.out' }); }
    function step() { var c = $('.mcard', track); return c ? c.getBoundingClientRect().width + 8 : 300; }
    on($('#moreNext'), 'click', function () { go(x - step()); });
    on($('#morePrev'), 'click', function () { go(x + step()); });
    on(track, 'pointerdown', function (e) { dragging = true; startX = e.clientX; startPos = x; track.classList.add('drag'); track.setPointerCapture(e.pointerId); });
    on(track, 'pointermove', function (e) { if (!dragging) return; go(startPos + (e.clientX - startX) * 1.1, 0.35); });
    function end() { dragging = false; track.classList.remove('drag'); }
    on(track, 'pointerup', end); on(track, 'pointercancel', end);
    on(window, 'resize', function () { go(x, 0); });
    if (!reduce) gsap.from('.mcard', { x: 160, autoAlpha: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
  })();

  /* ── Barra flutuante depois do hero ── */
  var topbar = $('#topbar');
  ST.create({ trigger: '.hero', start: 'bottom 75%', onEnter: function () { topbar.classList.add('on'); }, onLeaveBack: function () { topbar.classList.remove('on'); } });

  /* ── Recalcular quando as letras e imagens carregarem ── */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  on(window, 'load', function () { ST.refresh(); });
})();
