# Figuras isométricas de las fichas

Las figuras en perspectiva isométrica que abre el botón «Ver el banco en 3D»
se generan aquí y se pegan en `fat-sat-fichas.html` como plantillas `<template>`.

- `kit/` es el núcleo de dibujo de la skill **Anatomy** (MIT, ver `kit/LICENSE`):
  cámara isométrica, sólidos, tornos (`lathe`) y tuberías (`tube`).
- `fig-pd.mjs` construye el banco de ensayo de descargas parciales.

```sh
node fig-pd.mjs --light          # escribe pd-light.html con la figura suelta
```

Para llevarla a la app se extrae el `<svg>` del HTML generado y se sustituye el
contenido de `<template id="fig-pd">`. El CSS del kit ya está en la hoja de
estilos de la app, con la paleta del papel de las fichas.
