(function () {
  document.documentElement.classList.add('js');

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var chip = document.getElementById('status-chip');
  if (chip) {
    var h = new Date().getHours();
    var open = h >= 8 && h < 22;
    chip.textContent = open ? 'Abierto ahora' : 'Cerrado';
    chip.classList.toggle('is-closed', !open);
  }

  var pills = document.querySelectorAll('.day-pills span');
  if (pills.length) {
    var jsDay = new Date().getDay();
    var idx = jsDay === 0 ? 6 : jsDay - 1;
    if (pills[idx]) pills[idx].classList.add('today');
  }

  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', st > 400);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var filterBtns = document.querySelectorAll('.filter-btn');
  var productCards = document.querySelectorAll('.product-card');

  if (filterBtns.length && productCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        var f = btn.getAttribute('data-filter');
        productCards.forEach(function (card) {
          var match = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }
})();
