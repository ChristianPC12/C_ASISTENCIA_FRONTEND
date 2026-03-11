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
- [ ] Lint/build/react-doctor ejecutados.
