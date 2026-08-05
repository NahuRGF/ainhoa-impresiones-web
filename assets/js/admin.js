/* Panel de administración de JOYAS ARA (oculto, sin enlaces públicos).
   Trabaja sobre productos.json en memoria y lo exporta; la publicación
   online la hace publicar.ps1 (git commit + push). */
(function () {
  var PIN = 'ARA2024';
  var SESSION_KEY = 'ara_admin_ok';

  var products = [];
  var lastFiltered = [];

  var ICONOS = {
    anillos: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="40" cy="44" r="16"/><circle cx="40" cy="27" r="7" fill="#D3D8DE" stroke="none"/></svg>',
    cadenas: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 66c6-40 46-40 52 0"/><path d="M20 52l3 3M26 44l3 3M38 38l3 3M44 46l3-3M56 54l3-3"/></svg>',
    pulseras: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><path d="M14 52c10-14 42-14 52 0"/><rect x="10" y="48" width="9" height="9" rx="2" fill="#D3D8DE" stroke="none"/></svg>',
    aros: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="27" cy="46" r="13"/><circle cx="53" cy="46" r="13"/><path d="M27 33v-6M53 33v-6"/></svg>',
    sets: '<svg viewBox="0 0 80 80" fill="none" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"><circle cx="24" cy="50" r="13"/><circle cx="56" cy="50" r="13"/><circle cx="40" cy="22" r="9" fill="#D3D8DE" stroke="none"/></svg>'
  };

  var CAT_LABELS = {
    anillos: 'Anillos', cadenas: 'Cadenas', pulseras: 'Pulseras',
    aros: 'Aros', sets: 'Sets'
  };

  function $(id) { return document.getElementById(id); }

  /* ---------- Sesión ---------- */
  function unlock() { sessionStorage.setItem(SESSION_KEY, '1'); }
  function isUnlocked() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  function lock() { sessionStorage.removeItem(SESSION_KEY); }

  /* ---------- Datos ---------- */
  function loadProducts() {
    return fetch('assets/data/productos.json')
      .then(function (r) {
        if (!r.ok) throw new Error('no json');
        return r.json();
      })
      .catch(function () {
        var d = window.PRODUCTOS_DEFAULT || [];
        return JSON.parse(JSON.stringify(d));
      });
  }

  function normalizeImage(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v)) return v;
    if (/^assets\/img\//i.test(v)) return v;
    return 'assets/img/' + v;
  }

  function serialize() {
    return products.map(function (p) {
      var o = { nombre: p.nombre, categoria: p.categoria, precio: p.precio };
      if (p.imagen) o.imagen = p.imagen;
      return o;
    });
  }

  function renderPreview() {
    var text = JSON.stringify(serialize(), null, 2);
    $('jsonPreview').textContent = text;
  }

  function thumb(p) {
    if (p.imagen) {
      return '<img class="product-thumb" src="' + p.imagen + '" alt="" loading="lazy">';
    }
    return '<span class="product-thumb product-thumb--icon">' + (ICONOS[p.categoria] || ICONOS.sets) + '</span>';
  }

  function renderList() {
    var list = $('productList');
    list.innerHTML = '';
    products.forEach(function (p, i) {
      var item = document.createElement('div');
      item.className = 'product-item';
      item.innerHTML =
        thumb(p) +
        '<div class="product-info">' +
          '<strong></strong>' +
          '<span></span>' +
        '</div>' +
        '<div class="product-actions">' +
          '<button class="btn" data-act="edit" data-i="' + i + '" type="button">Editar</button>' +
          '<button class="btn" data-act="dup" data-i="' + i + '" type="button">Duplicar</button>' +
          '<button class="btn" data-act="del" data-i="' + i + '" type="button">Eliminar</button>' +
        '</div>';
      item.querySelector('.product-info strong').textContent = p.nombre;
      item.querySelector('.product-info span').textContent =
        (CAT_LABELS[p.categoria] || p.categoria) + ' · $' + (p.precio || '') +
        (p.imagen ? ' · con foto' : ' · ícono');
      list.appendChild(item);
    });
    $('listCount').textContent = products.length;
    $('productCount').textContent = products.length + ' producto(s) cargado(s)';
    renderPreview();
  }

  function resetForm() {
    $('productForm').reset();
    $('editIndex').value = '-1';
    $('formTitle').textContent = 'Nuevo producto';
    $('saveBtn').textContent = 'Agregar producto';
    $('cancelEditBtn').hidden = true;
  }

  function startEdit(i) {
    var p = products[i];
    $('editIndex').value = String(i);
    $('fNombre').value = p.nombre || '';
    $('fCategoria').value = p.categoria || 'anillos';
    $('fPrecio').value = p.precio || '';
    $('fImagen').value = p.imagen ? p.imagen.replace(/^assets\/img\//, '') : '';
    $('formTitle').textContent = 'Editar producto';
    $('saveBtn').textContent = 'Guardar cambios';
    $('cancelEditBtn').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Eventos ---------- */
  function bind() {
    $('pinBtn').addEventListener('click', tryLogin);
    $('pinInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryLogin();
    });

    $('logoutBtn').addEventListener('click', function () {
      lock();
      location.reload();
    });

    $('productForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var idx = parseInt($('editIndex').value, 10);
      var nombre = $('fNombre').value.trim();
      var precio = $('fPrecio').value.trim();
      if (!nombre || !precio) return;
      var data = {
        nombre: nombre,
        categoria: $('fCategoria').value,
        precio: precio,
        imagen: normalizeImage($('fImagen').value)
      };
      if (idx >= 0) products[idx] = data; else products.push(data);
      resetForm();
      renderList();
    });

    $('cancelEditBtn').addEventListener('click', resetForm);

    $('productList').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-i'), 10);
      var act = btn.getAttribute('data-act');
      if (act === 'edit') startEdit(i);
      else if (act === 'dup') {
        var copy = JSON.parse(JSON.stringify(products[i]));
        copy.nombre = copy.nombre + ' (copia)';
        products.push(copy);
        renderList();
      } else if (act === 'del') {
        if (confirm('¿Eliminar "' + products[i].nombre + '"?')) {
          products.splice(i, 1);
          renderList();
        }
      }
    });

    $('downloadBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'productos.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });

    $('copyBtn').addEventListener('click', function () {
      var text = JSON.stringify(serialize(), null, 2);
      function done() {
        $('copyBtn').textContent = 'Copiado ✓';
        setTimeout(function () { $('copyBtn').textContent = 'Copiar JSON'; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function tryLogin() {
    var v = $('pinInput').value.trim();
    if (v === PIN) {
      unlock();
      $('pinScreen').hidden = true;
      $('panel').hidden = false;
      $('pinError').hidden = true;
      $('pinInput').value = '';
    } else {
      $('pinError').hidden = false;
    }
  }

  function init() {
    bind();
    if (isUnlocked()) {
      $('pinScreen').hidden = true;
      $('panel').hidden = false;
    }
    loadProducts().then(function (list) {
      products = list.filter(function (p) { return p && p.nombre; });
      renderList();
    });
  }

  init();
})();
