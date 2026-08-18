/* Catálogo dinámico: lee productos de Supabase, con fallback a
   assets/data/productos.json y luego a productos por defecto. */
(function () {
  var WA = '543755642288';

  var CATEGORIAS = {
    anillos: { label: 'Anillos' },
    cadenas: { label: 'Cadenas' },
    pulseras: { label: 'Pulseras' },
    aros: { label: 'Aros' },
    sets: { label: 'Sets' }
  };

  var ICONOS = {
    anillos: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="40" cy="44" r="16"/><circle cx="40" cy="27" r="7" fill="#D3D8DE" stroke="none"/></svg>',
    cadenas: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 66c6-40 46-40 52 0"/><path d="M20 52l3 3M26 44l3 3M38 38l3 3M44 46l3-3M56 54l3-3"/></svg>',
    pulseras: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><path d="M14 52c10-14 42-14 52 0"/><rect x="10" y="48" width="9" height="9" rx="2" fill="#D3D8DE" stroke="none"/></svg>',
    aros: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="27" cy="46" r="13"/><circle cx="53" cy="46" r="13"/><path d="M27 33v-6M53 33v-6"/></svg>',
    sets: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="24" cy="50" r="13"/><circle cx="56" cy="50" r="13"/><circle cx="40" cy="22" r="9" fill="#D3D8DE" stroke="none"/></svg>'
  };

  function imgSrc(img) {
    if (!img) return '';
    if (/^(https?:)?\/\//i.test(img)) return img;
    return 'assets/img/' + img.replace(/^assets\/img\//i, '');
  }

  function waLink(nombre) {
    return 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('¡Hola! Me interesa el producto "' + nombre + '" del catálogo.');
  }

  function makeCard(p, idx) {
    var art = document.createElement('article');
    art.className = 'product-card reveal';
    art.setAttribute('data-cat', p.categoria || '');
    art.style.setProperty('--d', ((idx % 3) * 0.05).toFixed(2) + 's');

    var arte = document.createElement('span');
    arte.className = 'product-art';
    if (p.imagen) {
      var img = document.createElement('img');
      img.className = 'product-photo';
      img.src = imgSrc(p.imagen);
      img.alt = p.nombre || '';
      img.loading = 'lazy';
      arte.appendChild(img);
    } else {
      arte.innerHTML = ICONOS[p.categoria] || ICONOS.sets;
    }
    art.appendChild(arte);

    var cat = document.createElement('span');
    cat.className = 'product-cat';
    cat.textContent = (CATEGORIAS[p.categoria] || {}).label || 'Otros';
    art.appendChild(cat);

    var name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = p.nombre || '';
    art.appendChild(name);

    var price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = p.precio || '';
    art.appendChild(price);

    var a = document.createElement('a');
    a.className = 'btn-wa-sm';
    a.href = waLink(p.nombre || '');
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Consultar';
    art.appendChild(a);

    return art;
  }

  function observeReveals(scope) {
    var els = scope.querySelectorAll('.reveal:not(.rb-observed)');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      for (var i = 0; i < els.length; i++) {
        els[i].classList.add('rb-observed');
        io.observe(els[i]);
      }
    } else {
      for (var j = 0; j < els.length; j++) els[j].classList.add('visible');
    }
  }

  function bindFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      if (btn.getAttribute('data-bound') === '1') return;
      btn.setAttribute('data-bound', '1');
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        var f = btn.getAttribute('data-filter');
        document.querySelectorAll('.product-card').forEach(function (card) {
          var match = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  function render(list) {
    var grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';
    (list || []).forEach(function (p, i) {
      if (!p || !p.nombre) return;
      grid.appendChild(makeCard(p, i));
    });
    observeReveals(grid);
    bindFilters();
    if (window.RBAnims) window.RBAnims(grid);
  }

  function loadFromSupabase() {
    if (!window.SUPABASE_URL || window.SUPABASE_URL.indexOf('TU_') === 0) return Promise.reject('not configured');
    if (!window.supabase || !window.supabase.createClient) return Promise.reject('sdk not loaded');
    var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return client.from('productos').select('*').order('orden').then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  }

  function loadFromJSON() {
    return fetch('assets/data/productos.json')
      .then(function (r) {
        if (!r.ok) throw new Error('no json');
        return r.json();
      });
  }

  function loadDefault() {
    var d = window.PRODUCTOS_DEFAULT || [];
    return Promise.resolve(JSON.parse(JSON.stringify(d)));
  }

  loadFromSupabase()
    .catch(loadFromJSON)
    .catch(loadDefault)
    .then(function (list) { render(list); })
    .catch(function () { render([]); });
})();
