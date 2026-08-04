# AINHOA IMPRESIONES · Web

Sitio web de dos páginas:

- **`index.html`** — AINHOA IMPRESIONES: impresiones, copias y escaneos (precios, servicios, horarios y contacto).
- **`catalogo.html`** — JOYAS ARA: catálogo de acero quirúrgico con filtros por categoría y consulta por WhatsApp.

## Estructura

```
├── index.html              → Página principal (Ainhoa Impresiones)
├── catalogo.html           → Catálogo (Joyas Ara)
├── assets/
│   ├── css/
│   │   ├── base.css        → Tokens y componentes compartidos
│   │   ├── main.css        → Estilos de Ainhoa Impresiones
│   │   └── catalogo.css    → Estilos del catálogo de joyas
│   ├── js/
│   │   └── main.js         → Interacciones compartidas (reveal, filtros, reloj, etc.)
│   └── img/
│       └── logo.jpg        → Logo compartido por ambas páginas
```

## Publicación

Se publica con **GitHub Pages** desde la rama `main` (carpeta raíz).

## Personalización rápida

- **WhatsApp / teléfonos**: buscá `wa.me/` y `tel:` en los HTML.
- **Precios del catálogo**: editá `.product-price` en `catalogo.html`.
- **Logo**: reemplazá `assets/img/logo.jpg`.
- **Horarios**: se calculan automáticamente (08:00–22:00, todos los días) en `assets/js/main.js`.
