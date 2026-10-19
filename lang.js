/* CarHelp — idioma do site (português / inglês).
   Carregado no <head> de todas as páginas, antes de tudo o resto:
   1) quem já escolheu uma língua e chega de fora (Google, uma ligação) vai direto para ela;
   2) os botões PT / EN guardam a escolha e, na página principal, mantêm a secção onde estavas;
   3) a quem tem o navegador noutra língua, mostra um aviso discreto com a outra versão.
   As traduções são páginas próprias (/en/…), ligadas por <link rel="alternate" hreflang>,
   por isso o Google indexa as duas; os robôs nunca são redirecionados (não guardam escolhas). */
(function () {
  'use strict';
  var KEY = 'carhelp-lang';
  var html = document.documentElement;
  var lang = /^en/i.test(html.getAttribute('lang') || '') ? 'en' : 'pt';
  var other = lang === 'en' ? 'pt' : 'en';
  var me = document.currentScript;
  var root = me && me.src ? me.src.slice(0, me.src.lastIndexOf('/') + 1) : '';
  var live = /(^|\.)carhelp\.pt$/.test(location.hostname);

  function stored(v) {
    try {
      if (v) localStorage.setItem(KEY, v);
      return localStorage.getItem(KEY);
    } catch (e) { return null; }
  }

  /* endereço da página equivalente na outra língua (no site publicado é o do hreflang;
     em testes locais, o mesmo caminho a partir da pasta do site) */
  function urlFor(l) {
    var link = document.querySelector('link[rel="alternate"][hreflang="' + (l === 'en' ? 'en' : 'pt-PT') + '"]');
    if (!link) return null;
    var href = link.getAttribute('href');
    if (live) return href;
    var path = href.replace(/^https?:\/\/[^/]+\//, '');
    if (path === '' || path.charAt(path.length - 1) === '/') path += 'index.html';
    return root + path;
  }

  // 1) já escolheu a outra língua e não veio de uma página do próprio site
  var pref = stored();
  var ref = document.referrer || '';
  var fromSite = ref !== '' && location.host !== '' && ref.indexOf(location.host) > -1;
  if (pref === other && !fromSite) {
    var dest = urlFor(other);
    if (dest) { location.replace(dest + location.hash); return; }
  }

  var api = {
    lang: lang,
    /* troca de página; o main.js / legal.js substituem isto pela transição com cortina */
    go: function (href) { window.location.href = href; },
    remember: function (l) { stored(l); },
    hint: hint
  };
  window.CarHelpLang = api;

  /* secção da página principal que está no ecrã, para a outra língua abrir no mesmo sítio */
  function currentSection() {
    var best = null, line = window.innerHeight * 0.45;
    var secs = document.querySelectorAll('main > section[id]');
    for (var i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top <= line) best = secs[i].id;
    return best;
  }

  function wire() {
    var links = document.querySelectorAll('a[data-lang]');
    for (var i = 0; i < links.length; i++) {
      var base = links[i].getAttribute('href').split('#')[0];
      // aberto com duplo clique (file://), uma pasta não abre o index.html sozinha
      if (location.protocol === 'file:' && (base === '' || base.charAt(base.length - 1) === '/')) base += 'index.html';
      links[i].setAttribute('href', base);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  // na fase de captura: corre antes da transição de página, para a cortina já levar o endereço final
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-lang]') : null;
    if (!a) return;
    stored(a.getAttribute('data-lang'));
    var sec = currentSection();
    a.setAttribute('href', a.getAttribute('href').split('#')[0] + (sec ? '#' + sec : ''));
  }, true);

  /* 3) aviso: só a quem ainda não escolheu e tem o navegador noutra língua */
  var hinted = false;
  function wants() {
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    var first = String(list[0] || '').toLowerCase();
    if (lang === 'pt') {
      for (var i = 0; i < list.length; i++) if (/^pt/i.test(list[i])) return false;
      return first !== '';
    }
    return /^pt/.test(first);
  }
  function hint(delay) {
    if (hinted || stored() || !wants()) return;
    var target = urlFor(other);
    if (!target) return;
    hinted = true;
    var T = other === 'en'
      ? { t: 'This site is also in English', a: 'English', x: 'Close' }
      : { t: 'Este site também está em português', a: 'Português', x: 'Fechar' };
    var box = document.createElement('div');
    box.className = 'lang-hint';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('lang', other === 'en' ? 'en' : 'pt-PT');
    box.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' +
      '<span></span><a></a><button type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    box.querySelector('span').textContent = T.t;
    var a = box.querySelector('a'), x = box.querySelector('button');
    a.textContent = T.a;
    a.href = target;
    a.setAttribute('hreflang', other === 'en' ? 'en' : 'pt-PT');
    x.setAttribute('aria-label', T.x);
    function close() { box.classList.remove('on'); setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 900); }
    a.addEventListener('click', function (e) {
      e.preventDefault();
      stored(other);
      var sec = currentSection();
      close();
      api.go(target + (sec ? '#' + sec : ''));
    });
    x.addEventListener('click', function () { stored(lang); close(); });
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('on'); }, delay == null ? 400 : delay);
    // sai sozinho passado um bocado (sem guardar escolha: volta a aparecer na próxima visita)
    var over = false;
    box.addEventListener('pointerenter', function () { over = true; });
    box.addEventListener('pointerleave', function () { over = false; });
    (function wait() { setTimeout(function () { if (over) wait(); else close(); }, 14000); })();
  }
})();
