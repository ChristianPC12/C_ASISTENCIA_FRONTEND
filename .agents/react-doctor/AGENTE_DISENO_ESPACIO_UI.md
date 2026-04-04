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
- En chips/KPIs compactos, la tipografía debe respetar el contenedor: evitar `nowrap` y truncados rígidos cuando el mismo bloque puede resolverlo mejor con wrapping controlado.
- En `Comparaciones`, mover `Detalles generales` y `Top nombres` a botones de toolbar + modal libera suficiente altura para que la tabla principal respire sin perder información.
- En móvil, si esos botones auxiliares todavía consumen demasiada altura dentro del módulo, subirlos al topbar contextual junto a acciones globales es mejor que dejar una fila extra antes de la tabla principal.
- Si una acción principal ya está bien resuelta en topbar, no repetirla abajo en sidebar móvil; duplicar controles solo recarga el layout.
- En pantallas de login, el foco de inputs debe acompañar la tarjeta, no competir con ella; preferir borde limpio sobre glow/halo llamativo.
- Si una tabla anal�tica necesita scroll en ambos ejes, reutilizar el mismo patr�n visual/estructural de `Administrador`; no improvisar otra variante porque rompe el gesto horizontal en tel�fono.
- En ese patr�n, el wrapper horizontal debe verse serio y estable, mientras el contenido vertical vive dentro; el usuario no debe sentir que est� arrastrando la tabla completa como una tarjeta suelta.
- Los cierres de modales compactos deben vivir en la esquina superior derecha del modal, alineados con el borde y sin consumir una columna extra del header.
- Cuando una tabla central de un m�dulo anal�tico queda demasiado baja en tel�fono, es v�lido sumar una acci�n en topbar para verla completa en modal; eso libera altura sin sacrificar acceso inmediato.
- Las acciones duplicadas solo deben existir si resuelven contextos distintos: por ejemplo, `Cerrar sesi�n` puede reaparecer en escritorio si ah� ayuda, pero no debe volver a cargar el dise�o m�vil si ya est� mejor resuelto arriba.
- Si una tabla ya se resolvi� mejor dentro de un modal, la pantalla base debe confiar en esa decisi�n y liberar altura; no dejar la misma tabla visible debajo por inercia.
- En m�vil, si un bot�n queda solo con icono, la forma preferida es redonda; reservar pills rectangulares para cuando todav�a viven con texto visible.
- Los cierres de modales hermanos deben verse sim�tricos entre s�; no basta con que �no est�n pegados�, deben compartir referencia visual y anclaje.
- Si un panel administrativo usa bot�n `X` en header, debe compartir exactamente la misma geometr�a icon-only del resto del sistema, especialmente en tel�fono.
- Si un modal muestra chips de contexto bajo el t�tulo, no basta con empujar la `X`; el bloque del t�tulo/chips debe reservarse su propio ancho para que el contenido respire y no se vea montado.
- En desktop, no esconder tablas grandes si todav�a caben bien y eran parte del flujo principal; reservar la estrategia de tabla-por-modal para m�vil cuando el viewport realmente lo justifica.
- La forma de botones icon-only tambi�n puede cambiar por breakpoint: desktop puede conservar geometr�a m�s cuadrada y m�vil priorizar redondos para limpieza visual.
- El mismo control puede tener distinta geometr�a seg�n breakpoint si mantiene coherencia con su contexto: logout superior m�s cuadrado en desktop, m�s redondo en celular.
- Cuando un header de modal tiene t�tulo + chips + cierre absoluto, la separaci�n visual debe venir del layout del header, no de empujar el contenido de abajo a ciegas.

### D20) Superadmin con topbar adaptado por breakpoint
- En `Superadmin`, escritorio puede unificar `Campos y distritos` porque ambos catálogos son pequeños y caben bien en una sola vista.
- En móvil, esos mismos catálogos deben seguir separados para no abrir un panel excesivamente largo.
- Si el botón de acción principal (`Crear nueva instancia`) necesita contexto en escritorio, mostrar texto; en móvil basta icon-only.
- El mantenimiento de superadministradores debe sentirse como un panel propio del módulo, no como un detalle secundario perdido dentro de organizaciones.
- Los formularios de catálogos pequeños deben ocultar cualquier campo técnico irrelevante (`código`) y priorizar solo el dato que el usuario entiende (`nombre`).
- En modulos misioneros nuevos, la prioridad espacial es operativa: filtros compactos, KPIs cortos y un panel de detalle con vistas internas. El usuario no debe bajar toda la pagina para registrar una noche, un asistente o una decision.
- Si un modulo nuevo necesita varias tablas (`Campanas`), usar alturas fijas razonables con scroll interno invisible y header sticky; reservar el scroll de pagina para cambios de seccion, no para perseguir filas.
- En desktop, un layout 4/8 o 5/7 con columna izquierda de captura y columna derecha de detalle suele resolver mejor estos modulos que una pila larga de cards del mismo peso.
- En modulos de seguimiento pastoral como `Estudios Biblicos`, la prioridad de espacio es operativa: filtros compactos, KPIs cortos y un panel de detalle que concentre sesiones, decisiones y asignaciones sin sacar al usuario de contexto.
- Si una columna izquierda mezcla formulario y listado, mantener la derecha como zona de lectura/accion y no repartir el ancho en tres bloques pequenos; el patron 4/8 o similar sigue siendo el mas util.
- Cuando un modulo nuevo hereda la estructura de `Campanas`, puede reutilizar la misma densidad visual y el mismo tipo de scroll interno; no hace falta redisenar si el patron ya resolvio usabilidad real.
- En `Pequenas Congregaciones (PC)`, el detalle debe sentirse como una consola de seguimiento del grupo: resumen corto arriba y tabs internas para participantes, reuniones, resultados y liderazgo; no apilar secciones largas que obliguen a perder contexto.
- En modulos misioneros donde una reunion tenga asistencia por persona (`PC`, futuras `Campanas` mas profundas), reservar altura fija para la tabla interna y mantener el scroll invisible; el usuario debe sentir registro rapido, no una pagina que se estira.- En `Juntas de Iglesia`, la columna izquierda debe concentrar captura y listado; la derecha debe quedar para el detalle vivo de la junta con tabs internas (`Resumen`, `Agenda`, `Pendientes`, `Acta`).
- Si una vista de secretaria necesita agenda y votos a la vez, resolverlos dentro del mismo detalle con tablas de altura fija y scroll interno; no abrir otra pantalla para votar un punto.
## Nota de accion cruzada
- En tablas operativas largas, acciones de integracion como 'A estudio' deben usar patron compacto de tabla para no romper ancho ni forzar scroll extra innecesario.

