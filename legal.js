/* Páginas legais: scroll suave, barra/menu como na página principal, índice ativo e transições. */
(function () {
  'use strict';
  var gsap = window.gsap;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }

  var navbar = $('#navbar'), navCard = $('#navCard'), navDim = $('#navDim'), ncClose = $('#ncClose'), nbMenu = $('#nbMenu');
  var curtain = $('#curtain');

  /* botões: o círculo enche a partir do ponto onde o cursor entra */
  $$('.ibtn').forEach(function (b) {
    function at(e) { var r = b.getBoundingClientRect(); b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px'); }
    on(b, 'pointerenter', at); on(b, 'pointerleave', at);
  });

  /* tabelas: cada célula guarda o nome da sua coluna (no telemóvel as linhas passam a cartões) */
  $$('.lg-table table').forEach(function (t) {
    var heads = $$('th', t).map(function (th) { return th.textContent.trim(); });
    $$('tr', t).forEach(function (tr) { $$('td', tr).forEach(function (td, i) { if (heads[i]) td.setAttribute('data-label', heads[i]); }); });
  });

  /* índice: cada secção acende a sua entrada quando está a ser lida */
  var tocLinks = $$('.lg-toc a[href^="#"]');
  var secs = tocLinks.map(function (a) { return $(a.getAttribute('href')); });
  function markToc() {
    var cur = 0, line = window.innerHeight * 0.3;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) cur = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  on(window, 'scroll', markToc, { passive: true });
  markToc();

  if (!gsap) {
    if (curtain) curtain.style.display = 'none';
    on(nbMenu, 'click', function () { navCard.classList.toggle('static-open'); ncClose.classList.toggle('static-open'); });
    on(ncClose, 'click', function () { navCard.classList.remove('static-open'); ncClose.classList.remove('static-open'); });
    return;
  }

  /* scroll suave */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', markToc);
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -30, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  }
  tocLinks.forEach(function (a) {
    on(a, 'click', function (e) { e.preventDefault(); scrollToEl($(a.getAttribute('href'))); history.replaceState(null, '', a.getAttribute('href')); });
  });
  on($('#toTop'), 'click', function () { if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* entrada: a cortina sobe e o título aparece linha a linha */
  var lines = $$('[data-split] .line > span');
  gsap.set(lines, { yPercent: 115 });
  gsap.set('[data-hero-in]', { autoAlpha: 0, y: 24 });
  if (navbar) navbar.classList.add('hide');
  gsap.timeline({ delay: 0.05 })
    .to(curtain, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 0)
    .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, 0.45)
    .to('[data-hero-in]', { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.6)
    .add(function () { if (navbar) navbar.classList.remove('hide'); }, 0.9);
  if (location.hash) setTimeout(function () { scrollToEl($(location.hash)); }, 900);

  /* blocos a aparecer ao entrar no ecrã */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        gsap.fromTo(en.target, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out' });
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('[data-fade]').forEach(function (el) { gsap.set(el, { autoAlpha: 0 }); io.observe(el); });
  }

  /* saída para outra página: a cortina desce */
  function leave(href) {
    gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: function () { window.location.href = href; } });
  }
  on(window, 'pageshow', function (e) { if (e.persisted) gsap.set(curtain, { yPercent: -100 }); });

  /* barra: encolhe ao descer, abre ao subir ou ao passar o rato */
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

  /* menu: a barra transforma-se num cartão */
  var cardItems = $$('.nc-links a, .nc-mark, hr, .nc-small, .nc-cta', navCard);
  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    if (lenis) lenis.stop();
    nbMenu.setAttribute('aria-expanded', 'true');
    navCard.setAttribute('aria-hidden', 'false');
    var r = navbar.getBoundingClientRect(), vh = window.innerHeight, inner = $('.nc-inner', navCard);
    var w = Math.min(inner.offsetWidth, window.innerWidth - 32), h = inner.offsetHeight, b0 = vh - r.bottom;
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

  /* ligações para as outras páginas do site */
  $$('a[data-page]').forEach(function (a) {
    on(a, 'click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (mini && navbar.contains(a)) { e.preventDefault(); return; }
      e.preventDefault();
      var href = a.getAttribute('href');
      if (menuOpen) closeMenu(function () { leave(href); }); else leave(href);
    });
  });

  /* nome gigante no rodapé a subir */
  if ('IntersectionObserver' in window) {
    var word = $('footer .word');
    if (word) {
      gsap.set(word, { yPercent: 40, autoAlpha: 0 });
      var io2 = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io2.disconnect(); gsap.to(word, { yPercent: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out' }); }
      }, { threshold: 0.2 });
      io2.observe(word);
    }
  }
})();
