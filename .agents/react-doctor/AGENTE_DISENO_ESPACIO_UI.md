# Agente de Diseño y Aprovechamiento de Espacio UI (2026-03-24)

## Objetivo

Mantener una UI limpia, profesional y eficiente en espacio, especialmente en módulos administrativos con muchos controles.

## Principios base

- Priorizar información útil y acciones principales en el primer viewport.
- Eliminar títulos redundantes si el contexto ya está claro por topbar, tabs o botones activos.
- Evitar bloques informativos grandes cuando solo repiten lo que ya comunica la interfaz.
- Diseñar cada sección para escritorio, tablet y teléfono desde el mismo momento, no como ajuste tardío.
- Reducir scroll innecesario y evitar “aire vacío” sin propósito.

## Reglas visuales obligatorias

### D1) No desperdiciar altura

- No introducir headers internos redundantes como `Nuevo Usuario`, `Editar Usuario`, `Administración de instancia`, etc., si la vista ya deja claro dónde está el usuario.
- Si una tarjeta solo contiene formulario, usar el `card-body` directamente y reservar el header solo cuando aporte contexto real.
- Si un bloque secundario no aporta acción nueva, debe salir.

### D2) Acciones donde el usuario las necesita

- Botones como `Guardar`, `Crear`, `Limpiar`, `Cancelar` deben vivir junto al contexto que los justifica.
- Si una acción depende de un selector o resumen cercano, deben alinearse en la misma franja visual.
- Evitar mandar acciones importantes hasta el fondo de formularios largos si eso obliga a scroll extra.

### D3) Formularios compactos y legibles

- Agrupar campos relacionados por filas lógicas.
- Los campos cortos no deben ocupar ancho excesivo.
- Los metadatos de apoyo (`cupo`, `estado`, `disponibles`) deben verse como apoyo compacto, no como bloque pesado.
- Si una ayuda cabe como texto corto debajo del campo, no usar `alert` o `div` de alto impacto.

### D4) Móvil primero en formularios administrativos

- En escritorio: alinear bloques para aprovechar ancho horizontal.
- En tablet: permitir wrap controlado sin romper jerarquía.
- En teléfono: apilar con orden claro, botones a ancho completo si mejora tap targets.
- Ningún control debe quedar comprimido al punto de parecer roto ni provocar scroll horizontal.
- En móvil, preferir botones con ícono cuando el texto vuelva pesada la barra de acciones o navegación.

### D5) Evitar ruido visual

- No duplicar explicación + botones + estado si una sola pieza ya comunica lo necesario.
- No usar `alert-secondary`, cajas de ayuda grises o bloques informativos largos por costumbre.
- Toda nota visual debe justificar el espacio que ocupa.

### D6) Consistencia de iconografía

- La misma acción debe usar el mismo icono en todo el sistema.
- `Agregar` no debe cambiar de icono entre módulos.
- `Limpiar` no debe cambiar de icono entre módulos.
- `Guardar` no debe cambiar de icono entre módulos.
- `Cerrar` no debe cambiar de icono entre módulos.
- Si un icono ya quedó entendido por el usuario, reutilizarlo antes de inventar otro.

### D7) Profesionalismo visual

- Mantener alineaciones limpias.
- Repetir patrones ya aprobados en el sistema antes de inventar uno nuevo.
- Si una pantalla “funciona” pero todavía se siente apretada, alta o desordenada, no está terminada.

## Checklist corto antes de entregar

- ¿Hay algún título redundante que se pueda quitar?
- ¿Las acciones principales están cerca del campo o estado que controlan?
- ¿Se puede entender la vista sin un bloque extra de ayuda?
- ¿En móvil se apila limpio y sin scroll horizontal?
- ¿La pantalla se siente más ligera que antes?

### D8) Tablas administrativas por contenido real

- `Nombre` no debe quedarse con el mismo ancho si `Dia`, `Hora`, `Activo` o `Acciones` son mucho mas cortos.
- Definir ancho por tabla y por columna, no con un `min-width` unico para todos los paneles.
- En movil, primero compactar columnas y topes de caracteres antes de aceptar scroll horizontal.

### D9) Carruseles informativos compactos

- Si una seccion informativa tiene varias tarjetas, mostrar 2 por vista antes de apilar una lista larga.
- Rotacion automatica: 8 segundos.
- Debe aceptar swipe manual en movil sin agregar controles pesados.
- Los selectores de bloque (`Metricas`, `Roles`, etc.) deben vivir en el header cuando asi se ahorre altura util.

### D10) Espacio vertical sobrante

- Si un panel queda corto y deja demasiado vacio abajo, no dejar todo pegado arriba por costumbre.
- Medir si realmente sobra altura; si sobra bastante y no hay scroll, centrar verticalmente el bloque principal.
- Esta regla se aplica solo cuando mejora la sensacion visual; si aparece scroll, no forzar centrado.

### D11) Layout global en pantallas anchas

- El layout compartido no debe volver a separarse del sidebar en desktop grande.
- Tampoco debe dejar un bloque centrado con hueco muerto a la derecha en monitores ultraanchos.
- En anchos extremos, el contenedor principal debe aprovechar todo el espacio disponible despues del sidebar.

### D12) El ancho visible debe respetar el tope real del campo

- Si `Nombre` o `Etiqueta` tienen limite corto, su columna no debe ocupar medio panel por costumbre.
- Primero reducir ancho de columnas largas antes de aceptar scroll horizontal que esconda `Acciones`.
- En tablas compactas, `Activo` y `Acciones` deben ocupar solo el espacio exacto que necesitan.

### D13) Formularios de usuarios sin huecos artificiales

- `Rol` y acciones principales deben compartir franja visual en escritorio.
- En móvil, `cupo/estado` no debe quedar separado por un hueco grande de `Crear` y `Limpiar`.
- Si el select tiene opciones cortas (`Administrador`, `Secretario/a`), no debe renderizarse con ancho exagerado.

### D14) Listados internos con altura controlada

- Tablas como `Usuarios del sistema` deben tener alto fijo con scroll interno cuando crecen.
- Nunca permitir que un listado embebido arrastre todo el panel hacia abajo si puede resolverse dentro de su propio contenedor.
- En móvil, los formularios compactos no deben reactivar texto en botones si eso rompe la alineación con el campo principal.
- Si hay `titulo + tabs + cerrar`, la prioridad es mantener una sola franja coordinada antes que aceptar un wrap desordenado.

### D15) Patron estable para tablas moviles con doble scroll

- Si una tabla necesita scroll horizontal y vertical, separar ambos ejes:
  - wrapper externo: scroll horizontal
  - wrapper interno: scroll vertical
- El header sticky vive en el wrapper vertical y debe conservar fondo solido.
- En movil, permitir que la tabla crezca a max-content con un min-width concreto por tabla; no forzar width:100% si eso impide el scroll lateral.
- Antes de dar por buena una tabla responsive, comprobar tres cosas:
  - se puede deslizar horizontalmente cuando hace falta,
  - no se siente arrastrable en diagonal,
  - Dia, Hora, Categoria y Acciones siguen siendo legibles en vertical.
### D16) Carruseles de resumen con utilidad real
- Si el setup sigue pendiente y ya existe una lista clara de Pendientes por completar, ocultar tarjetas-resumen duplicadas hasta que el estado quede completo.
- Si el carrusel debe envolver del ultimo al primero, hacerlo con continuidad visual; el usuario no debe sentir que el bloque se devuelve de golpe.
- Para ese wrap continuo, preferir clones + reposicion silenciosa antes que un cambio directo de indice con modulo.
### D17) Parejas de campos alineadas en movil
- Si dos inputs viven en la misma fila y sus labels tienen longitudes distintas, la fila debe verse simetrica aunque una etiqueta ocupe dos lineas.
- No dejar que un label largo empuje solo su input hacia abajo; reservar una altura comun para las etiquetas de esa pareja.
- Esta regla aplica especialmente a bloques como Cantidad + Nombres en Visitas.

### D18) Listados de registros sin columnas estorbo

- Si una tabla de registros tiene poco espacio horizontal, primero quitar columnas-resumen redundantes antes de aceptar scroll extra.
- `Fecha exacta` no debe ocupar media fila; usar ancho compacto y compartir esa franja con estado corto y exportacion.
- Cuando el detalle completo de una fila consume demasiada altura dentro de la tabla, preferir modal bloqueante y limpio antes que expandir otra tabla debajo.
- En esa barra compacta, acciones globales como cantidad y exportacion deben alinearse a la derecha, separadas del input para no mezclar jerarquias.
- Si la tabla se aprieta en movil, la exportacion individual debe salir de la fila y mudarse al modal del registro.
- En móvil, los botones de edición/cierre/guardado dentro de formularios de registro deben seguir la misma convención icon-only del resto del sistema.
- Si una fila tiene pocas columnas, compactar el ancho desde la columna que sobra; no aceptar huecos artificiales entre `Culto`, `Total` y `Acciones`.
- En el modal de detalle, mostrar solo valores significativos; un `0` de una métrica no seleccionada genera ruido visual, no información.
- En listados como `Registros`, la tabla debe tener alto fijo desde pocos elementos; mostrar unas 4 filas y después usar scroll interno es mejor que alargar toda la vista.
- Si un botón global de Excel vive en escritorio, el copy corto `Excel` suele funcionar mejor que `Informe Excel`; el contexto ya lo da la barra de filtros.

### D19) Estadísticas con foco visual único

- En `Estadísticas`, la pantalla principal debe priorizar filtros, resumen corto, KPIs compactos y tabla principal.
- `Composición`, `Puntualidad`, `Procedencia`, `Tendencia` y `Visitas` pueden vivir en un modal de detalle si están consumiendo demasiada altura.
- Antes de dejar un módulo analítico con mucho scroll vertical, mover el análisis secundario a una capa modal y comprimir los KPIs en una sola franja.
- Si los KPIs todavía ocupan demasiada altura, convertirlos en chips/resumen dentro de la barra superior del módulo en vez de dejarlos como cuatro tarjetas completas.
- En un modal analítico, el contenido con más riesgo de crecer (`Top nombres`, listados, tablas pequeñas) debe tener su propio scroll fijo.
- En toolbars compactas de módulos analíticos, un botón auxiliar como `Detalle` no debe ocupar una fila completa en móvil; compartir línea con el resumen corto es mejor uso del espacio.
