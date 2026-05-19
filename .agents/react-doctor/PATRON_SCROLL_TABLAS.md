# Patron de scroll para tablas operativas

Fecha: 2026-05-18

## Problema que ya ocurrio

En telefono y tablet, varias tablas de Campanas y Estudios Biblicos quedaron con uno de estos fallos:

- La tabla se podia arrastrar en diagonal, como si toda la tarjeta se moviera libremente.
- El scroll vertical funcionaba, pero el horizontal no.
- El scroll horizontal funcionaba, pero el vertical quedaba bloqueado cuando el gesto iniciaba sobre la tabla.

La causa principal fue mezclar `overflow-x` y `overflow-y` en el mismo contenedor o dejar que el contenedor interno heredara `max-width: 100%`.

## Regla obligatoria

Toda tabla operativa que necesite scroll horizontal y vertical debe tener dos wrappers:

```jsx
<div className="tabla-scroll-x">
  <div className="tabla-scroll-y">
    <table className="tabla-con-min-width">
      ...
    </table>
  </div>
</div>
```

## CSS aprobado

Wrapper externo, solo eje horizontal:

```css
.tabla-scroll-x {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  overscroll-behavior-y: none;
  touch-action: auto;
}
```

Wrapper interno, solo eje vertical:

```css
.tabla-scroll-y {
  width: max-content;
  min-width: 100%;
  max-width: none;
  max-height: clamp(300px, 44vh, 390px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: auto;
}
```

Tabla:

```css
.tabla-con-min-width {
  min-width: 46rem; /* ajustar segun columnas reales */
}
```

## Detalles criticos

- `max-width: none` en el wrapper interno es obligatorio. Sin esto, el contenedor puede quedarse limitado a `100%` y el scroll horizontal desaparece.
- No usar `touch-action: pan-x` en tablas administrativas; puede bloquear el scroll vertical.
- No poner `overflow-x: auto` y `overflow-y: auto` en el mismo wrapper cuando la tabla se usa en telefono.
- El `thead` sticky debe vivir dentro del wrapper vertical.
- El `min-width` de la tabla debe responder a sus columnas reales, no a un numero generico.

## Verificacion manual antes de entregar

- En telefono, la tabla se desliza horizontalmente cuando hace falta.
- En telefono, la tabla conserva scroll vertical dentro del alto definido.
- La tabla no se siente arrastrable en diagonal.
- Los encabezados y acciones siguen legibles.

## Implementaciones ya ajustadas

- Campanas: tablas principales, visitas, sesiones y decisiones.
- Estudios Biblicos: tabla principal de estudios y tablas selectoras que usan `estudios-table-shell`.
