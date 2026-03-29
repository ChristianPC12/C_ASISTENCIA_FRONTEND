# Contexto Actual Frontend (2026-03-12)

## Estado general vigente

- Frontend: React 19 + Vite 7 + Bootstrap 5.
- Backend: PHP 8 sin framework (`C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`).
- Escalabilidad nacional frontend: fases F0..F7 cerradas.
- Modulo de superadmin cerrado para esta etapa funcional.
- Backlog futuro: F8 (discovery de modulos nacionales).

## Estado funcional real en codigo

Rutas activas:

- `/superadmin` (solo `SUPERADMIN`)
- `/administrador` (solo `ADMIN`, setup inicial)
- `/registro` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/registros` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/estadisticas` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/comparaciones` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/presentaciones` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/usuarios` (solo `ADMIN`, bloqueada si setup pendiente)

## Superadmin consolidado (2026-03-11)

- Alta de organizacion exige `campo` y `distrito`.
- Gestion de catalogos de `campos` y `distritos` desde UI (crear/editar/eliminar).
- Filtros de tabla por campo, distrito, tipo, anio y estado de admin.
- Tabla de organizaciones con encabezado fijo y scroll interno.
- Exportacion de tabla a Excel (`.xlsx`) basada en el filtrado actual.
- Estados de admin temporal visibles:
  - `ADMIN activo` (turquesa),
  - `ADMIN expirado` (amarillo),
  - `Sin ADMIN` (rojo).
- Detalle de admin/correo en acordeon dentro de la misma fila (toggle al reseleccionar).
- Formularios de accion compactados:
  - solo una accion visible a la vez (`Crear instancia`, `Crear ADMIN temporal`, `Editar organizacion`, `Gestionar campos`, `Gestionar distritos`).
- `correo_destino` se autocompleta desde organizacion y se bloquea en UI.
- Mensajeria de resultado via notificaciones flotantes (sin banners persistentes).

## Contrato consumido en frontend (superadmin)

- `GET /v2/superadmin/organizaciones`
- `POST /v2/superadmin/organizaciones`
- `PUT /v2/superadmin/organizaciones/{organizacion_id}`
- `POST /v2/superadmin/organizaciones/{organizacion_id}/admin-temporal`
- `GET /v2/superadmin/campos`
- `POST /v2/superadmin/campos`
- `PUT /v2/superadmin/campos/{codigo}`
- `DELETE /v2/superadmin/campos/{codigo}`
- `GET /v2/superadmin/distritos`
- `POST /v2/superadmin/distritos`
- `PUT /v2/superadmin/distritos/{codigo}`
- `DELETE /v2/superadmin/distritos/{codigo}`

## Cierre por fases

- F0: decisiones base de identidad/login/contrato v2 cerradas.
- F1: scoping tenant UI y prueba funcional de aislamiento cerradas.
- F2: superadmin UI (acceso, alta, admin temporal, edicion organizacion) cerrada.
- F3: login canonico + sesion tenant-aware cerradas.
- F4: setup inicial por tenant + bloqueo visual de modulos cerrados.
- F5: formulario/reportes/estadisticas/comparaciones/presentaciones dinamicas cerrados.
- F6: UI de cupos por rol + UX de excedentes cerrada.
- F7: hardening frontend (admin temporal, 401/403/429, checklist salida) cerrado.

## Ajustes recientes en Administrador (2026-03-12)

- Setup de administrador reorganizado para UX movil/desktop con una sola vista activa por panel.
- Topbar de admin simplificada: `Cultos`, `Metricas`, `Procedencias` (sin panel separado de reglas).
- Cambio de panel con cambios locales pendientes restaura snapshot base (no persiste sin `Guardar`).
- Boton `Limpiar` restablece estado local sin confirmacion adicional.
- Botones `Guardar` visibles solo cuando existe diff real contra baseline por seccion.
- Modelo de metricas migrado en UI a `categoria`:
  - se elimina exposicion de `depende_de_clave`, `regla_dependencia`, `orden`;
  - metricas base protegidas para evitar edicion estructural y eliminacion.
- Reglas de consistencia permanecen en logica:
  - `llegaron_antes_hora` / `llegaron_despues_hora` en par;
  - `total_asistentes` coherente con puntualidad.
- Copy del modulo administrador normalizado (tildes, `Ã±`, textos de confirmacion y labels).
- `Nombre de culto` limitado a 20 caracteres en UI y validado en hook.

## Ajustes recientes en Registro de asistencia (2026-03-22)

- El formulario ya no despliega todas las categorias al elegir `Culto`.
- Nuevo flujo compacto:
  - `Culto` y `Fecha` quedan visibles como contexto fijo.
  - Las categorias activas se recorren una por vez con flechas izquierda/derecha.
- Regla de prerequisito vigente:
  - sin `Culto`, no aparece `Fecha`;
  - sin `Culto + Fecha`, no aparecen categorias ni navegaciÃ³n.
- Si `Total de asistentes` es manual, se prioriza al inicio del wizard; si es autocalculado, se excluye de la navegaciÃ³n para no bloquear el flujo.
- Los inputs numericos se compactan mejor para reducir scroll y mejorar el uso en movil.
- En `Visitas`, `cantidad` y `nombres` ahora se presentan como pareja visual por procedencia.
- `Nombres de visitas` queda en una sola linea, con scroll interno del input y limite de 20 caracteres por nombre separado por coma.
- Los errores logicos inmediatos migran a notificacion flotante tipo `advertencia` (amarillo), manteniendo solo resalte visual del campo.
- El avance entre flechas ya no depende solo de campos tocados:
  - valida campos obligatorios vacios,
  - usa validacion completa del formulario para dependencias con `total_asistentes`,
  - bloquea el paso si la categoria actual tiene inconsistencias reales.
- En `Procedencia`, si la suma ya coincide exactamente con `Total de asistentes`, los inputs vacÃ­os restantes se normalizan automÃ¡ticamente a `0`.
- Cada categorÃ­a del wizard usa ahora `max-height` con scroll interno invisible; si una secciÃ³n tiene pocos inputs, el panel colapsa sin dejar espacio en blanco innecesario.
- El tÃ­tulo de la categorÃ­a se muestra una sola vez en el switch superior; el panel interno ya no repite encabezados como `Visitas` o `6 campos`.
- El botÃ³n `Guardar` solo aparece en el Ãºltimo paso del wizard y el `submit` queda bloqueado en pasos intermedios.
- La bandera `obligatorio` deja de formar parte del flujo activo de mÃ©tricas:
  - ya no se muestra en setup,
  - frontend y backend la neutralizan en `false`,
  - el registro se valida solo por relaciones lÃ³gicas reales entre categorÃ­as.
- Si `Total de asistentes` depende de `InformaciÃ³n del culto`, el wizard bloquea desde esa categorÃ­a cuando sigue vacÃ­a; si el total es manual, el bloqueo ocurre en el propio paso `Total de asistentes`.
- `Permanencia` ya no lanza error de total mientras toda la categorÃ­a siga vacÃ­a.
- Si `InformaciÃ³n del culto`, `Procedencia` o `Permanencia` ya suman exactamente `Total de asistentes`, los vacÃ­os restantes de esa misma categorÃ­a se normalizan automÃ¡ticamente a `0`.
- `Limpiar` en el wizard de registro reinicia tambiÃ©n la categorÃ­a activa al primer paso visible y devuelve el foco al inicio del formulario.
- Reglas duras de captura se bloquean antes de entrar al estado local:
  - composicion no puede superar total,
  - procedencia no puede superar total,
  - permanencia no puede superar total,
  - visitas no puede superar procedencia.
- Los errores cruzados de `Total de asistentes` ya no bloquean `ComposiciÃ³n de asistentes`; solo se propagan a categorÃ­as realmente dependientes (`Procedencia`, `Permanencia`).
- El scroll vertical del panel vive en un wrapper interno y el contenedor externo queda con `overflow: visible` para no atrapar calendario/popovers.
- `AsistenciaPage` vuelve a pasar `fechasRegistradas` al formulario para mantener el bloqueo coherente de fechas repetidas.

## Validaciones tecnicas vigentes

- `npm run build` -> OK.
- `npx eslint src/pages/SuperadminPage.jsx` -> OK.
- `npx eslint` sobre archivos modificados de administrador/setup -> OK.
- `react-doctor` (`--diff`, cambios actuales) -> 100/100.
- Flujo runtime API comprobado:
  - `401` auth sin token.
  - `429` rate limit de login.
  - `403 SETUP_REQUIRED` manejado en UI por evento global + bloqueo visual.

## Riesgos tecnicos abiertos

- Chunk `LoginPage` mayor a 500 kB en build (warning Vite), sin fallo funcional.
- Token continua en `localStorage` (riesgo XSS conocido; mitigacion futura recomendada).
- `SuperadminPage.jsx` sigue siendo un componente grande (deuda de modularizacion).

## Archivos clave de esta etapa

- `src/pages/SuperadminPage.jsx`
- `src/hooks/useSuperadminOrganizaciones.js`
- `src/api/superadminApi.js`
- `src/components/layout/Sidebar.jsx`
- `src/config/events.js`
- `src/config/api.js`
- `src/components/asistencia/AsistenciaForm.jsx`
- `src/hooks/useAsistencia.js`
- `src/utils/notify.js`
- `src/components/ui/ToastContainer.jsx`

## Proximo foco

- F8 discovery UX (Campanas, Pequenas Congregaciones, Estudios Biblicos), definido por owner.

## Ajustes recientes de diseÃ±o

- Panel `Usuarios` en administrador:
  - se removiÃ³ el header interno redundante de `Nuevo Usuario` / `Editar Usuario`,
  - la franja de `Rol` ahora comparte lÃ­nea visual con `cupo`, `estado activo` y acciones principales,
  - el formulario quedÃ³ compactado para escritorio y mejor apilado para telÃ©fono.
- Vista resumen de administrador:
  - se eliminÃ³ el bloque `alert-secondary admin-setup-help` con accesos rÃ¡pidos por consumir altura sin aportar valor suficiente.
- Vista resumen de administrador:
  - los estados principales (`Cultos`, `Procedencias`, `MÃ©tricas`, `Usuarios`) ahora se muestran en carrusel liviano de 2 en 2,
  - rota automÃ¡ticamente cada 8 segundos,
  - admite swipe horizontal tÃ¡ctil sin controles visibles extra.
- Regla visual nueva aplicada:
  - en mÃ³vil, barras de acciones/navegaciÃ³n priorizan iconos consistentes para ahorrar espacio,
  - `agregar`, `limpiar`, `guardar` y `cerrar` deben conservar el mismo icono en mÃ³dulos equivalentes.
- Se creÃ³ el documento `.agents/react-doctor/AGENTE_DISENO_ESPACIO_UI.md` como guÃ­a especÃ­fica para aprovechar espacio, reducir ruido visual y mantener una UI limpia/profesional.
- Setup ADMIN: `Cultos de la instancia` ahora tiene tope de 10 cultos por organizacion. El boton `Agregar culto` se deshabilita al llegar al maximo y backend/frontend validan el mismo limite.
- Setup ADMIN: strings visibles de cultos/dias y validaciones tocadas quedaron normalizadas para evitar textos con tildes rotas en este flujo.
- Usuarios ADMIN: crear/editar usuario ahora exige `password` + `password_confirmacion` cuando se define una nueva contraseÃ±a; el payload enviado a API sigue mandando solo `password`.
- Ajuste responsive en `Administrador`:
  - `Cultos` y `Procedencias` ahora usan anchos por columna mas compactos para movil/tablet.
  - `Procedencias` limita `Nombre` a 25 caracteres en UI y hook.
  - `Informacion` cambio a carrusel de 2 tarjetas por vista, con rotacion automatica cada 8 segundos y swipe tactil.
  - Los selectores de `Informacion` y `Usuarios` se movieron al header del panel para ahorrar altura util.
  - Se hizo prueba de centrado vertical medido en vistas cortas de `Administrador` para compensar espacio vacio inferior cuando no existe scroll.
- Ajuste global del layout:
  - el contenedor principal ya no usa un tope fijo que deje huecos junto al sidebar o a la derecha en monitores anchos/ultraanchos.
- Afinado responsive adicional en `Administrador`:
  - `Cultos` ahora permite hasta 25 caracteres en nombre y compacta mejor la columna para no tapar `Acciones`.
  - `Procedencias` mantiene 25 caracteres maximos y reduce el ancho visual de `Nombre`/`Activo`.
  - `MÃ©tricas` limita `Etiqueta` a 40 caracteres en UI + hook y compacta la columna `CategorÃ­a`.
  - `Usuarios del sistema` ahora tiene altura fija con scroll interno.
  - El formulario de `Usuarios` alinea mejor `Rol` con acciones en escritorio y elimina el hueco grande entre metadatos y botones en mÃ³vil.
- Ajuste fino adicional en mÃ³vil:
  - `Usuarios` vuelve a usar botones compactos con icono en la franja de acciones del formulario para evitar huecos grandes.
  - El header de `Usuarios` dentro de `Administrador` se compactÃ³ para que tÃ­tulo + tabs internas no queden descoordinados ni con saltos raros.

- Leccion ya validada para futuras tablas moviles:
  - separar scroll horizontal y vertical en wrappers distintos si funciona,
  - pero solo si en movil la tabla puede crecer a width: max-content con min-width real por tabla,
  - mantener width: 100% en ese breakpoint impedia el scroll horizontal aunque el wrapper externo existiera,
  - restringir touch-action tambien llego a bloquear el gesto lateral y tuvo que revertirse.
- Estado actual de tablas responsive en admin:
  - Cultos, Procedencias, Metricas y Usuarios del sistema ya usan ese patron,
  - Usuarios del sistema ademas simplifica headers a Nombre y Expira,
  - acciones de tabla en Usuarios del sistema pasan a iconos para mantener coherencia con el responsive movil del resto del sistema.
