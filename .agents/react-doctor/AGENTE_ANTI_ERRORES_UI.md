# Agente Anti Errores UI (2026-03-11)

## Objetivo

Evitar repetir errores de ejecucion y de UX en modulos futuros, especialmente cuando el prompt se reutiliza entre pantallas.

## Errores cometidos y correccion aplicada

### E1) Contexto inicial mal resuelto por ruta

- Que paso: al iniciar discovery se intento leer archivos desde una ruta padre incorrecta.
- Impacto: perdida de tiempo inicial y riesgo de asumir contexto incompleto.
- Regla preventiva:
  1. Validar `cwd` real con `Get-ChildItem`.
  2. Confirmar existencia de cada archivo solicitado antes de analizar contenido.
  3. Si hay estructura anidada (`repo/repo`), fijar workdir definitivo y mantenerlo.

### E2) Exceso de formularios abiertos en una sola pantalla

- Que paso: setup del administrador mostraba varios bloques pesados simultaneamente.
- Impacto: exceso de scroll, peor experiencia en telefono.
- Regla preventiva:
  1. Usar patron de "una accion visible por vez".
  2. Mover acciones de apertura a topbar contextual.
  3. Cada panel debe tener cierre explicito y retorno a vista resumen.

### E3) Jerarquia visual poco eficiente

- Que paso: textos y alertas largas competian con acciones principales.
- Impacto: sensacion de ruido visual.
- Regla preventiva:
  1. Reducir bloques informativos a notas compactas.
  2. Priorizar estado + accion principal en primer viewport.
  3. Evitar repetir titulos si el contexto ya lo da la topbar.

### E4) Alineacion de acciones incompleta

- Que paso: badge y boton no quedaban alineados verticalmente con el bloque de estado.
- Impacto: desbalance visual en escritorio.
- Regla preventiva:
  1. En layouts de dos columnas usar `align-items-stretch`.
  2. En columna de acciones usar `h-100` + `justify-content: space-between`.
  3. Verificar alineacion superior e inferior antes de cerrar tarea.

### E5) Mensaje tecnico importante, pero invasivo

- Que paso: la regla de puntualidad se mostraba como alerta grande.
- Impacto: ocupaba espacio util del formulario.
- Regla preventiva:
  1. Convertir reglas fijas en "nota compacta" con icono.
  2. Mantener legible la regla sin competir con inputs/tabla.
  3. Si la regla no cambia, no usar formato de alerta prominente.

### E6) Cierre de panel sin manejo de cambios no guardados

- Que paso: al cerrar paneles se mantenian cambios locales sin confirmar, dando sensacion de "guardado automatico".
- Impacto: confusion funcional y riesgo de decisiones erradas del usuario.
- Regla preventiva:
  1. Si hay cambios pendientes, al cerrar panel solicitar confirmacion de descarte.
  2. Si se confirma descarte, restaurar snapshot base del panel.
  3. Si se cancela descarte, mantener panel abierto sin alterar datos.

### E7) Botones de guardado visibles sin cambios pendientes

- Que paso: se mostraban botones `Guardar` aun cuando no habia modificaciones.
- Impacto: ruido visual y acciones sin valor.
- Regla preventiva:
  1. Mantener firma/base por seccion (`cultos`, `metricas`, `procedencias`).
  2. Mostrar `Guardar` solo cuando `tieneCambiosX === true`.
  3. Agregar boton `Limpiar` para restaurar cambios locales de inmediato (sin confirmacion).

### E8) Inconsistencia ortografica en labels y mensajes

- Que paso: textos visibles mezclaban ortografia sin acentos en terminos clave.
- Impacto: menor calidad percibida y experiencia menos profesional.
- Regla preventiva:
  1. Revisar ortografia y acentuacion de labels finales antes de cerrar ticket.
  2. Priorizar consistencia en terminos repetidos (`Métricas`, `configuracion`, `revision`, etc.).
  3. Evitar introducir variantes distintas del mismo termino en una misma pantalla.

### E9) Barrido obligatorio de tildes y letra ñ

- Que paso: quedaron textos funcionalmente correctos, pero con faltantes de tildes o sin `ñ`.
- Impacto: baja calidad editorial y retrabajo en iteraciones cortas.
- Regla preventiva:
  1. Antes de entregar, hacer barrido de copy en pantalla, toasts y mensajes de confirmacion.
  2. Verificar explicitamente tildes (`áéíóú`) y uso correcto de `ñ` en palabras que lo requieren.
  3. Corregir tambien labels de botones, titulos de columnas y mensajes de estados vacios.
  4. No cerrar ticket sin este barrido cuando se haya tocado texto UI.

### E10) Limites de longitud no aplicados en campos clave

- Que paso: campos visibles permitian mas caracteres de los esperados por UX.
- Impacto: entradas largas, interfaz desordenada y validaciones tardias.
- Regla preventiva:
  1. Definir limite maximo por campo funcional antes de implementar.
  2. Aplicar limite en dos capas: `maxLength` en input + validacion en hook/validator.
  3. Para `Nombre de culto`, usar rango obligatorio de 3 a 20 caracteres.
  4. Mantener mensaje de error explicito con el rango permitido.

### E11) Exposicion de campos internos (`clave`, `orden`) al usuario final

- Que paso: se mostraron campos tecnicos que no agregan valor funcional al administrador.
- Impacto: confusion, riesgo de errores de configuracion y soporte innecesario.
- Regla preventiva:
  1. `clave` y `orden` deben manejarse en logica interna, no como input editable.
  2. Generar/normalizar `clave` automaticamente al guardar.
  3. Derivar `orden` por posicion visual de la lista.
  4. Si hay dependencias, usar `select` controlado; nunca texto libre para claves internas.

### E12) Falta de blindaje para metricas base del sistema

- Que paso: metricas definidas como base quedaron expuestas a edicion/eliminacion.
- Impacto: perdida de configuracion canonica y alto retrabajo para recomponerla.
- Regla preventiva:
  1. Toda metrica base debe marcarse como `es_fija`.
  2. En metricas fijas, bloquear edicion estructural (`etiqueta`, `depende_de_clave`, `regla_dependencia`) y bloqueo total de eliminar.
  3. Permitir unicamente `habilitado` y `obligatorio` en metricas fijas.
  4. Si `habilitado=false`, forzar `obligatorio=false` en tiempo real y previo a persistir.

### E13) Falta de foco contextual al crear filas nuevas

- Que paso: al presionar `Agregar metrica`, el usuario debia buscar manualmente la nueva fila.
- Impacto: friccion de uso, especialmente en movil con tablas largas.
- Regla preventiva:
  1. Toda accion `Agregar X` debe devolver identificador de la nueva fila (`ui_id`).
  2. Al renderizar la fila, hacer `focus()` en el primer input editable.
  3. Acompanarlo con `scrollIntoView({ block: 'center' })` para llevar al usuario al punto exacto.

### E14) Guardar visible aun cuando el usuario vuelve al estado inicial

- Que paso: en metricas, despues de interactuar y regresar al valor original, podia mantenerse visible `Guardar`.
- Impacto: confusion sobre si hay cambios reales pendientes.
- Regla preventiva:
  1. La deteccion dirty debe basarse en firma normalizada, no en referencia de objetos.
  2. Si una regla de negocio fuerza cambios derivados (`habilitado` -> `obligatorio`), debe conservar/restaurar estado previo para permitir volver al baseline.
  3. Mostrar botones `Guardar` solo cuando la firma actual difiere de la base.

### E15) Regla clave sin suficiente jerarquia visual

- Que paso: una regla importante (metricas opcionales) no destacaba frente al resto del listado.
- Impacto: riesgo de que el usuario interprete que crear metricas extra es obligatorio.
- Regla preventiva:
  1. Reglas de alto impacto deben llevar estilo destacado (fondo, borde lateral, icono).
  2. Mantener copy breve y accionable.
  3. Evitar que una regla critica quede visualmente igual al resto.

## Protocolo reutilizable para nuevos modulos

1. Discovery breve
- Identificar estado actual y componentes reales.
- Confirmar restricciones de rol/setup/rutas.

2. Definicion UI antes de tocar logica
- Decidir vista predeterminada.
- Definir acciones contextuales (topbar o seccion).
- Definir regla "una vista activa".

3. Implementacion en orden
- Estructura visual.
- Estados de apertura/cierre.
- Manejo de cambios pendientes (dirty-state + descarte/restauracion).
- Pulido responsive (desktop y movil).
- Ajustes de copy y jerarquia visual.

4. Validacion minima obligatoria
- `npx eslint <archivos_modificados>`
- `npm run build`
- `npx -y react-doctor@latest . --verbose --diff`

5. Cierre
- Confirmar alineaciones finales pedidas por el owner.
- Evitar introducir texto extra no solicitado.
- Entregar cambios con ruta exacta de archivos.

## Checklist rapido previo a entregar

- [ ] Solo un formulario/panel visible.
- [ ] Botones principales dentro del primer viewport.
- [ ] Sin bloques informativos que estorben flujo.
- [ ] Uso comodo en telefono (scroll controlado).
- [ ] Mensajes importantes cortos y accionables.
- [ ] Botones Guardar solo visibles con cambios pendientes.
- [ ] Cierre de panel no conserva cambios sin confirmacion.
- [ ] Ortografia de labels validada en UI final.
- [ ] Barrido final de tildes y letra ñ ejecutado en textos visibles.
- [ ] Limites de longitud validados en UI y en logica.
- [ ] `Clave` y `orden` no expuestos como input editable.
- [ ] Dependencias de metricas con `select` (sin texto libre).
- [ ] Metricas base protegidas contra edicion estructural y eliminacion.
- [ ] `habilitado=false` fuerza `obligatorio=false`.
- [ ] `Agregar` en tablas largas aplica foco y scroll al nuevo input.
- [ ] Si el usuario vuelve al estado inicial, `Guardar` desaparece.
- [ ] Reglas de alto impacto con destacado visual.
- [ ] Lint/build/react-doctor ejecutados.
