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
