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

  /* ── Telemóvel ── */
  var phone = $('#phone'), float = $('#phoneFloat');
  var screens = $$('[data-screen]');
  function showScreen(i) { screens.forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-screen') === i); }); }
  function vw(n) { return function () { return window.innerWidth * n / 100; }; }
  function vh(n) { return function () { return window.innerHeight * n / 100; }; }
  var S0 = { x: vw(10), y: vh(3), rotationY: -24, rotationX: 10, rotationZ: -7, scale: 0.92 };

  /* ── Carregamento + entrada do hero ── */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroLines, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0)
      .to('[data-hero-in]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.25);
    if (desktop.matches && rig) {
      gsap.set(rig, { visibility: 'visible' });
      tl.fromTo(phone, { x: vw(10), y: vh(70), rotationX: 50, rotationY: -40, rotationZ: -20, scale: 0.7, autoAlpha: 0 },
        { x: S0.x, y: S0.y, rotationY: S0.rotationY, rotationX: S0.rotationX, rotationZ: S0.rotationZ, scale: S0.scale, autoAlpha: 1, duration: 1.8, ease: 'expo.out', onComplete: setupPhone }, 0.1);
    }
    return tl;
  }

  if (reduce || !loader) {
    if (loader) loader.style.display = 'none';
    if (reduce) { if (rig) gsap.set(rig, { visibility: 'visible' }); gsap.set(phone, S0); setupPhoneStatic(); }
    else intro();
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

  function setupPhoneStatic() {
    $$('[data-phone]').forEach(function (sec) {
      var i = +sec.getAttribute('data-phone');
      if (i < 0) return;
      ST.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { if (s.isActive) showScreen(i); } });
    });
  }

  function setupPhone() {
    if (!desktop.matches) return;
    // flutua suavemente e segue o rato
    gsap.to(float, { y: -14, rotationZ: 1.2, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    var rx = gsap.quickTo(float, 'rotationX', { duration: 1.2, ease: 'power3.out' });
    var ry = gsap.quickTo(float, 'rotationY', { duration: 1.2, ease: 'power3.out' });
    on(window, 'pointermove', function (e) {
      rx(-(e.clientY / window.innerHeight - 0.5) * 10);
      ry((e.clientX / window.innerWidth - 0.5) * 14);
    }, { passive: true });

    // percurso ao longo das três primeiras secções
    var tl = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', endTrigger: '.media-sec', end: 'top 30%', scrub: 1.2, invalidateOnRefresh: true }
    });
    tl.to(phone, { x: vw(24), y: vh(2), rotationY: -12, rotationX: 4, rotationZ: 5, scale: 1.04, ease: 'power2.inOut', duration: 1 })
      .to(phone, { x: vw(22), y: 0, rotationY: 20, rotationX: 6, rotationZ: -5, scale: 1, ease: 'power2.inOut', duration: 1 })
      .to(phone, { y: vh(-115), rotationX: 35, rotationY: 30, scale: 0.8, ease: 'power2.in', duration: 1 });
    setupPhoneStatic();
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

    // perguntas que entram de lado
    gsap.from('.q', { x: 80, autoAlpha: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: '.qlist', start: 'top 78%', once: true } });

    // nome gigante no rodapé
    gsap.from('footer .word', { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ── Vídeo do cartão grande: só toca quando visível ── */
  $$('video[data-lazyplay]').forEach(function (v) {
    ST.create({ trigger: v, start: 'top 90%', end: 'bottom 10%',
      onToggle: function (s) { if (s.isActive && !reduce) { v.preload = 'auto'; v.play().catch(function () {}); } else v.pause(); } });
  });

  /* ── Contador ("Em 60 s") ── */
  $$('[data-odo]').forEach(function (el) {
    var digits = String(el.getAttribute('data-odo')).split('');
    var cols = digits.map(function (d) {
      var col = document.createElement('span'); col.className = 'col';
      for (var k = 0; k < 20; k++) { var s = document.createElement('span'); s.textContent = k % 10; col.appendChild(s); }
      el.appendChild(col);
      return { col: col, target: 10 + (+d) };
    });
    el.setAttribute('aria-label', el.getAttribute('data-odo'));
    if (reduce) { cols.forEach(function (c) { gsap.set(c.col, { yPercent: -(c.target / 20) * 100 }); }); return; }
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
      cols.forEach(function (c, i) {
        gsap.fromTo(c.col, { yPercent: 0 }, { yPercent: -(c.target / 20) * 100, duration: 2.2 + i * 0.35, ease: 'expo.out' });
      });
    } });
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
