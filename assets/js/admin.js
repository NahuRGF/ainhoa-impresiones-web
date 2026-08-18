/* Panel de administración de JOYAS ARA (oculto, sin enlaces públicos).
   Lee y escribe directo a Supabase; los cambios se ven al instante. */
(function () {
  var PIN = '1234';
  var SESSION_KEY = 'ara_admin_ok';

  var products = [];
  var client = null;
  var saving = false;

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

  /* ---------- Supabase client ---------- */
  function getClient() {
    if (client) return client;
    if (!window.SUPABASE_URL || window.SUPABASE_URL.indexOf('TU_') === 0) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return client;
  }

  /* ---------- Session ---------- */
  function unlock() { sessionStorage.setItem(SESSION_KEY, '1'); }
  function isUnlocked() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  function lock() { sessionStorage.removeItem(SESSION_KEY); }

  /* ---------- Status bar ---------- */
  function setStatus(msg, type) {
    var el = $('statusBar');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' status-' + type : '');
    if (type === 'ok') setTimeout(function () { el.textContent = ''; el.className = 'status-bar'; }, 3000);
  }

  /* ---------- Image normalization ---------- */
  function normalizeImage(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v)) return v;
    if (/^assets\/img\//i.test(v)) return v;
    return 'assets/img/' + v;
  }

  /* ---------- DB operations ---------- */
  function dbLoad() {
    var db = getClient();
    if (!db) return Promise.reject('Supabase not configured');
    return db.from('productos').select('*').order('orden').then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  }

  function dbInsert(p) {
    var db = getClient();
    if (!db) return Promise.reject('Supabase not configured');
    var maxOrden = products.reduce(function (m, x) { return Math.max(m, x.orden || 0); }, 0);
    var row = {
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      imagen: p.imagen || '',
      orden: maxOrden + 1
    };
    return db.from('productos').insert(row).select().then(function (res) {
      if (res.error) throw res.error;
      return res.data[0];
    });
  }

  function dbUpdate(id, p) {
    var db = getClient();
    if (!db) return Promise.reject('Supabase not configured');
    return db.from('productos').update({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      imagen: p.imagen || ''
    }).eq('id', id).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  function dbDelete(id) {
    var db = getClient();
    if (!db) return Promise.reject('Supabase not configured');
    return db.from('productos').delete().eq('id', id).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  function dbReorder(id, newOrden) {
    var db = getClient();
    if (!db) return Promise.reject('Supabase not configured');
    return db.from('productos').update({ orden: newOrden }).eq('id', id).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  /* ---------- UI rendering ---------- */
  function thumb(p) {
    if (p.imagen) {
      return '<img class="product-thumb" src="' + p.imagen + '" alt="" loading="lazy">';
    }
    return '<span class="product-thumb product-thumb--icon">' + (ICONOS[p.categoria] || ICONOS.sets) + '</span>';
  }

  function renderPreview() {
    var text = JSON.stringify(products.map(function (p) {
      var o = { nombre: p.nombre, categoria: p.categoria, precio: p.precio };
      if (p.imagen) o.imagen = p.imagen;
      return o;
    }), null, 2);
    $('jsonPreview').textContent = text;
  }

  function renderList() {
    var list = $('productList');
    list.innerHTML = '';
    products.forEach(function (p, i) {
      var item = document.createElement('div');
      item.className = 'product-item';
      var actions = '';
      actions += '<button class="btn btn-sm" data-act="edit" data-i="' + i + '" type="button">Editar</button>';
      actions += '<button class="btn btn-sm" data-act="dup" data-i="' + i + '" type="button">Duplicar</button>';
      if (i > 0) actions += '<button class="btn btn-sm" data-act="up" data-i="' + i + '" type="button">↑</button>';
      if (i < products.length - 1) actions += '<button class="btn btn-sm" data-act="down" data-i="' + i + '" type="button">↓</button>';
      actions += '<button class="btn btn-sm btn-danger" data-act="del" data-i="' + i + '" type="button">✕</button>';
      item.innerHTML =
        thumb(p) +
        '<div class="product-info">' +
          '<strong></strong>' +
          '<span></span>' +
        '</div>' +
        '<div class="product-actions">' + actions + '</div>';
      item.querySelector('.product-info strong').textContent = p.nombre;
      item.querySelector('.product-info span').textContent =
        (CAT_LABELS[p.categoria] || p.categoria) + ' · $' + (p.precio || '') +
        (p.imagen ? ' · con foto' : ' · ícono');
      list.appendChild(item);
    });
    $('listCount').textContent = products.length;
    $('productCount').textContent = products.length + ' producto(s)';
    renderPreview();
  }

  function resetForm() {
    $('productForm').reset();
    $('editIndex').value = '-1';
    $('formTitle').textContent = 'Nuevo producto';
    $('saveBtn').textContent = 'Agregar producto';
    $('cancelEditBtn').hidden = true;
    clearPhotoPreview();
  }

  function startEdit(i) {
    var p = products[i];
    $('editIndex').value = String(i);
    $('fNombre').value = p.nombre || '';
    $('fCategoria').value = p.categoria || 'anillos';
    $('fPrecio').value = p.precio || '';
    $('fImagen').value = p.imagen || '';
    $('formTitle').textContent = 'Editar: ' + (p.nombre || '');
    $('saveBtn').textContent = 'Guardar cambios';
    $('cancelEditBtn').hidden = false;
    clearPhotoPreview();
    if (p.imagen) {
      showPhotoPreview(p.imagen);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Actions ---------- */
  function doAdd(p) {
    if (saving) return;
    saving = true;
    setStatus('Guardando…');
    uploadPhoto(p.nombre).then(function (url) {
      if (url) p.imagen = url;
      return dbInsert(p);
    }).then(function (row) {
      products.push(row);
      renderList();
      resetForm();
      setStatus('Producto agregado', 'ok');
      saving = false;
    }).catch(function (e) {
      setStatus('Error: ' + (e.message || e), 'error');
      saving = false;
    });
  }

  function doUpdate(i, p) {
    if (saving) return;
    saving = true;
    setStatus('Guardando…');
    uploadPhoto(p.nombre).then(function (url) {
      if (url) p.imagen = url;
      var id = products[i].id;
      return dbUpdate(id, p);
    }).then(function () {
      products[i].nombre = p.nombre;
      products[i].categoria = p.categoria;
      products[i].precio = p.precio;
      if (p.imagen) products[i].imagen = p.imagen;
      renderList();
      resetForm();
      setStatus('Cambios guardados', 'ok');
      saving = false;
    }).catch(function (e) {
      setStatus('Error: ' + (e.message || e), 'error');
      saving = false;
    });
  }

  function doDuplicate(i) {
    if (saving) return;
    saving = true;
    setStatus('Duplicando…');
    var orig = products[i];
    var data = {
      nombre: orig.nombre + ' (copia)',
      categoria: orig.categoria,
      precio: orig.precio,
      imagen: orig.imagen || ''
    };
    dbInsert(data).then(function (row) {
      products.push(row);
      renderList();
      setStatus('Producto duplicado', 'ok');
      saving = false;
    }).catch(function (e) {
      setStatus('Error: ' + (e.message || e), 'error');
      saving = false;
    });
  }

  function doDelete(i) {
    if (saving) return;
    var nombre = products[i].nombre;
    if (!confirm('¿Eliminar "' + nombre + '"?')) return;
    saving = true;
    setStatus('Eliminando…');
    dbDelete(products[i].id).then(function () {
      products.splice(i, 1);
      renderList();
      setStatus('Eliminado: ' + nombre, 'ok');
      saving = false;
    }).catch(function (e) {
      setStatus('Error: ' + (e.message || e), 'error');
      saving = false;
    });
  }

  function doMove(i, dir) {
    if (saving) return;
    var j = i + dir;
    if (j < 0 || j >= products.length) return;
    saving = true;
    setStatus('Reordenando…');
    var tmpOrden = products[i].orden;
    products[i].orden = products[j].orden;
    products[j].orden = tmpOrden;
    var idA = products[i].id;
    var ordenA = products[i].orden;
    var idB = products[j].id;
    var ordenB = products[j].orden;
    Promise.all([
      dbReorder(idA, ordenA),
      dbReorder(idB, ordenB)
    ]).then(function () {
      var tmp = products[i];
      products[i] = products[j];
      products[j] = tmp;
      renderList();
      setStatus('Reordenado', 'ok');
      saving = false;
    }).catch(function (e) {
      setStatus('Error: ' + (e.message || e), 'error');
      saving = false;
    });
  }

  /* ---------- Photo upload ---------- */
  var pendingPhotoFile = null;
  var pendingPhotoURL = null;

  function compressImage(file, maxW, quality) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          c.toBlob(function (blob) { resolve(blob || file); }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showPhotoPreview(url) {
    $('photoPreviewImg').src = url;
    $('photoPreview').hidden = false;
  }

  function clearPhotoPreview() {
    $('photoPreview').hidden = true;
    $('photoPreviewImg').src = '';
    $('fImagen').value = '';
    pendingPhotoFile = null;
    pendingPhotoURL = null;
  }

  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setStatus('Procesando foto…');
    compressImage(file, 1200, 0.8).then(function (blob) {
      pendingPhotoFile = blob;
      pendingPhotoURL = URL.createObjectURL(blob);
      showPhotoPreview(pendingPhotoURL);
      $('fImagen').value = '(se sube al guardar)';
      setStatus('Foto lista. Guarda el producto para subirla.', 'ok');
    });
  }

  function uploadPhoto(productName) {
    if (!pendingPhotoFile) return Promise.resolve(null);
    var db = getClient();
    if (!db) return Promise.resolve(null);
    var slug = (productName || 'foto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var ts = Date.now();
    var path = slug + '-' + ts + '.jpg';
    return db.storage.from('productos').upload(path, pendingPhotoFile, { contentType: 'image/jpeg' }).then(function (res) {
      if (res.error) throw res.error;
      var publicURL = db.storage.from('productos').getPublicUrl(path).data.publicUrl;
      clearPhotoPreview();
      return publicURL;
    });
  }

  function bindPhotoButtons() {
    $('takePhotoBtn').addEventListener('click', function () { $('photoCamera').click(); });
    $('pickPhotoBtn').addEventListener('click', function () { $('photoGallery').click(); });
    $('photoCamera').addEventListener('change', function (e) { if (e.target.files[0]) handlePhotoFile(e.target.files[0]); e.target.value = ''; });
    $('photoGallery').addEventListener('change', function (e) { if (e.target.files[0]) handlePhotoFile(e.target.files[0]); e.target.value = ''; });
    $('removePhotoBtn').addEventListener('click', clearPhotoPreview);
  }

  /* ---------- Event binding ---------- */
  function bind() {
    bindPhotoButtons();
    $('pinBtn').addEventListener('click', tryLogin);
    $('pinInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryLogin();
    });

    $('logoutBtn').addEventListener('click', function () {
      lock();
      location.reload();
    });

    $('refreshBtn').addEventListener('click', function () {
      setStatus('Recargando…');
      dbLoad().then(function (list) {
        products = list;
        renderList();
        setStatus('Actualizado', 'ok');
      }).catch(function (e) {
        setStatus('Error: ' + (e.message || e), 'error');
      });
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
      if (idx >= 0) doUpdate(idx, data); else doAdd(data);
    });

    $('cancelEditBtn').addEventListener('click', resetForm);

    $('productList').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-i'), 10);
      var act = btn.getAttribute('data-act');
      if (act === 'edit') startEdit(i);
      else if (act === 'dup') doDuplicate(i);
      else if (act === 'del') doDelete(i);
      else if (act === 'up') doMove(i, -1);
      else if (act === 'down') doMove(i, 1);
    });
  }

  /* ---------- Login ---------- */
  function tryLogin() {
    var v = $('pinInput').value.trim();
    console.log('PIN attempt:', v, 'expected:', PIN, 'match:', v === PIN);
    if (v === PIN) {
      unlock();
      $('pinScreen').style.display = 'none';
      $('panel').style.display = 'block';
      $('pinError').hidden = true;
      $('pinInput').value = '';
    } else {
      $('pinError').textContent = 'PIN incorrecto';
      $('pinError').hidden = false;
    }
  }

  /* ---------- Init ---------- */
  function init() {
    bind();
    if (isUnlocked()) {
      $('pinScreen').style.display = 'none';
      $('panel').style.display = 'block';
    }
    connectDB(0);
  }

  function connectDB(attempt) {
    var db = getClient();
    if (!db) {
      if (attempt < 10) {
        setTimeout(function () { connectDB(attempt + 1); }, 300);
        return;
      }
      $('productCount').textContent = 'Supabase no configurado';
      setStatus('Editá assets/js/supabase-config.js con tu URL y key de Supabase', 'error');
      renderList();
      return;
    }
    setStatus('Conectando…');
    dbLoad().then(function (list) {
      products = list;
      renderList();
      setStatus('Conectado a Supabase', 'ok');
    }).catch(function (e) {
      $('productCount').textContent = 'Error de conexión';
      setStatus('Error: ' + (e.message || e), 'error');
    });
  }

  init();
})();
