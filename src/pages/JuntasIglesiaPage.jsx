import { useCallback, useEffect, useMemo, useState } from 'react';
import juntaApi from '../api/juntaApi';
import SearchInput from '../components/ui/SearchInput';
import {
  EVENT_JUNTAS_ABRIR_ASIGNAR,
  EVENT_JUNTAS_ABRIR_DEPARTAMENTOS,
  EVENT_JUNTAS_ABRIR_LISTA,
  EVENT_JUNTAS_ABRIR_RESPONSABLES,
  EVENT_JUNTAS_VISTA_ACTIVA
} from '../config/events';
import { useJuntasIglesia } from '../hooks/useJuntasIglesia';
import { confirmar, notificarError, notificarExito } from '../utils/notify';

const TIPO_JUNTA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'PRESENCIAL', etiqueta: 'Presencial' },
  { valor: 'VIRTUAL', etiqueta: 'Virtual' }
];

const ESTADO_JUNTA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'POR_COMENZAR', etiqueta: 'Por comenzar' },
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'CERRADA', etiqueta: 'Cerrada' },
  { valor: 'APROBADA', etiqueta: 'Aprobada' },
  { valor: 'ARCHIVADA', etiqueta: 'Archivada' }
];

const TIPO_PUNTO_OPCIONES = [
  { valor: 'NUEVO', etiqueta: 'Nuevo' },
  { valor: 'INFORMATIVO', etiqueta: 'Informativo' },
  { valor: 'VOTACION', etiqueta: 'Votación' },
  { valor: 'SEGUIMIENTO', etiqueta: 'Seguimiento' },
  { valor: 'PENDIENTE_ANTERIOR', etiqueta: 'Pendiente anterior' },
  { valor: 'APROBADO_WHATSAPP', etiqueta: 'Aprobado por WhatsApp' }
];

const ESTADO_PUNTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'DISCUTIDO', etiqueta: 'Discutido' },
  { valor: 'VOTADO', etiqueta: 'Votado' },
  { valor: 'APROBADO', etiqueta: 'Aprobado' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazado' },
  { valor: 'POSPUESTO', etiqueta: 'Pospuesto' },
  { valor: 'TRASLADADO', etiqueta: 'Trasladado' },
  { valor: 'EJECUTADO', etiqueta: 'Ejecutado' },
  { valor: 'RESUELTO_WHATSAPP', etiqueta: 'Resuelto por WhatsApp' }
];

const PRIORIDAD_OPCIONES = [
  { valor: 'BAJA', etiqueta: 'Baja' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'ALTA', etiqueta: 'Alta' }
];

const TIPO_VOTO_OPCIONES = [
  { valor: 'UNANIME', etiqueta: 'Unánime' },
  { valor: 'MAYORIA', etiqueta: 'Mayoría' },
  { valor: 'CONSENSO', etiqueta: 'Consenso' },
  { valor: 'SOLO_INFORMADO', etiqueta: 'Solo informado' }
];

const REFERENCIA_MODULO_OPCIONES = [
  { valor: '', etiqueta: 'Sin vínculo' },
  { valor: 'CAMPANAS', etiqueta: 'Campañas' },
  { valor: 'ESTUDIOS_BIBLICOS', etiqueta: 'Estudios Bíblicos' },
  { valor: 'ASISTENCIA', etiqueta: 'Asistencia' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const DETALLE_VISTAS = [
  { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
  { valor: 'AGENDA', etiqueta: 'Agenda', icono: 'bi-list-check' },
  { valor: 'PENDIENTES', etiqueta: 'Pendientes', icono: 'bi-hourglass-split' },
  { valor: 'ACTA', etiqueta: 'Acta', icono: 'bi-journal-richtext' }
];

const VISTA_RESPONSABLES = 'RESPONSABLES';
const VISTA_JUNTAS = 'JUNTAS';
const VISTA_ASIGNAR = 'ASIGNAR_JUNTA';
const STORAGE_MODERADORES = 'juntas_iglesia_moderadores';
const STORAGE_ACTAS_PERSONAS = 'juntas_iglesia_personas_acta';
const STORAGE_DEPARTAMENTOS = 'juntas_iglesia_departamentos';
const TIPOS_JUNTA_FORM = TIPO_JUNTA_OPCIONES.slice(1);
const TIPO_RESPONSABLE_OPCIONES = [
  { valor: 'MODERADOR', etiqueta: 'Moderador' },
  { valor: 'SECRETARIA', etiqueta: 'Secretaría' }
];
const FILTRO_RESPONSABLE_OPCIONES = [
  { valor: '', etiqueta: 'Todos' },
  ...TIPO_RESPONSABLE_OPCIONES
];

const PERSONA_JUNTA_INICIAL = {
  tipo: 'MODERADOR',
  nombre: '',
  departamento: '',
  telefono: '',
  correo: '',
  observaciones: ''
};

const DEPARTAMENTO_JUNTA_INICIAL = {
  nombre: '',
  director: '',
  asociados: ''
};

const PUNTO_JUNTA_INICIAL = {
  titulo: '',
  departamento_origen: ''
};
const PUNTO_JUNTA_TITULO_MAX = 65;
const JUNTAS_TEXTAREA_MAX_SALTOS = 2;
const PDF_JUNTA_COMPLETO = 'COMPLETO';
const PDF_JUNTA_SOLO_PUNTOS = 'SOLO_PUNTOS';
const ESTADOS_PUNTO_PENDIENTES = ['PENDIENTE', 'DISCUTIDO', 'VOTADO', 'POSPUESTO', 'TRASLADADO'];
const STORAGE_SESION_ASISTENTES = 'juntas_iglesia_sesion_asistentes';

const TIPOS_JUNTA_LEGACY = {
  ORDINARIA: 'PRESENCIAL',
  EXTRAORDINARIA: 'PRESENCIAL',
  SEGUIMIENTO: 'PRESENCIAL',
  CONTINUACION: 'PRESENCIAL',
  WHATSAPP: 'VIRTUAL'
};

const ESTADO_ETIQUETAS = {
  POR_COMENZAR: 'Por comenzar',
  BORRADOR: 'Borrador',
  EN_PROCESO: 'En proceso',
  CERRADA: 'Cerrada',
  APROBADA: 'Aprobada',
  ARCHIVADA: 'Archivada',
  PENDIENTE: 'Pendiente',
  DISCUTIDO: 'Discutido',
  VOTADO: 'Votado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  POSPUESTO: 'Pospuesto',
  TRASLADADO: 'Trasladado',
  EJECUTADO: 'Ejecutado',
  RESUELTO_WHATSAPP: 'Resuelto por WhatsApp'
};

function textoLimpio(valor) {
  return String(valor || '').trim();
}

function normalizarClave(valor) {
  return textoLimpio(valor).toLocaleLowerCase('es-CR');
}

function normalizarClaveFlexible(valor) {
  return textoLimpio(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-CR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function etiquetaTipoResponsable(tipo) {
  return TIPO_RESPONSABLE_OPCIONES.find((item) => item.valor === tipo)?.etiqueta || 'Responsable';
}

function normalizarTipoJunta(valor) {
  const tipo = String(valor || '').trim().toUpperCase();
  return TIPOS_JUNTA_LEGACY[tipo] || tipo || 'PRESENCIAL';
}

function etiquetaTipoJunta(valor) {
  const tipo = normalizarTipoJunta(valor);
  return TIPO_JUNTA_OPCIONES.find((item) => item.valor === tipo)?.etiqueta || tipo || '-';
}

function etiquetaEstado(valor) {
  const estado = String(valor || '').toUpperCase();
  return ESTADO_ETIQUETAS[estado] || valor || '-';
}

function normalizarAsociados(valor) {
  return String(valor || '')
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function limitarSaltosLinea(valor, maxSaltos) {
  const lineas = String(valor || '').replace(/\r\n?/g, '\n').split('\n');
  return lineas.slice(0, maxSaltos + 1).join('\n');
}

function contarSaltosLinea(valor) {
  return (String(valor || '').match(/\n/g) || []).length;
}

function fechaHoyInput() {
  return new Date().toLocaleDateString('en-CA');
}

function fechaInicioVencida(valor) {
  const fecha = String(valor || '').slice(0, 10);
  return Boolean(fecha && fecha < fechaHoyInput());
}

function fechaEsFutura(valor) {
  const fecha = String(valor || '').slice(0, 10);
  return Boolean(fecha && fecha > fechaHoyInput());
}

function fechaEsHoy(valor) {
  return String(valor || '').slice(0, 10) === fechaHoyInput();
}

function resolverEstadoJuntaPorFecha(fecha, estadoActual = '') {
  const estado = String(estadoActual || '').toUpperCase();
  if (['CERRADA', 'APROBADA', 'ARCHIVADA'].includes(estado)) return estado;

  const fechaBase = String(fecha || '').slice(0, 10);
  if (fechaBase && fechaBase > fechaHoyInput()) return 'POR_COMENZAR';
  return 'EN_PROCESO';
}

function unirCatalogos(...listas) {
  const mapa = new Map();

  listas.flat().forEach((item) => {
    const nombre = textoLimpio(item?.nombre);
    if (!nombre) return;

    const clave = normalizarClave(nombre);
    if (mapa.has(clave)) return;
    mapa.set(clave, item);
  });

  return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CR'));
}

function opcionesCatalogoConActual(catalogo, actual) {
  const nombreActual = textoLimpio(actual);
  if (!nombreActual) return catalogo;

  const existe = catalogo.some((item) => normalizarClave(item.nombre) === normalizarClave(nombreActual));
  if (existe) return catalogo;

  return [
    ...catalogo,
    {
      id: `actual-${normalizarClave(nombreActual)}`,
      nombre: nombreActual,
      departamento: 'Registro actual'
    }
  ];
}

function cargarCatalogoLocal(clave) {
  if (typeof window === 'undefined') return [];

  try {
    const valor = window.localStorage.getItem(clave);
    const datos = valor ? JSON.parse(valor) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarCatalogoLocal(clave, datos) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(clave, JSON.stringify(datos));
  } catch {
    // El registro en pantalla sigue disponible aunque el navegador bloquee localStorage.
  }
}

function formatearFecha(valor) {
  if (!valor) return '-';
  const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatearFechaHora(valor) {
  if (!valor) return '-';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatearHora(valor) {
  if (!valor) return '-';
  return String(valor).slice(0, 5);
}

function claseEstado(estado) {
  switch (estado) {
    case 'APROBADA':
    case 'APROBADO':
    case 'EJECUTADO':
      return 'bg-success-subtle text-success-emphasis border-success-subtle';
    case 'POR_COMENZAR':
    case 'BORRADOR':
    case 'PENDIENTE':
    case 'POSPUESTO':
      return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
    case 'EN_PROCESO':
    case 'DISCUTIDO':
    case 'VOTADO':
    case 'TRASLADADO':
      return 'bg-primary-subtle text-primary-emphasis border-primary-subtle';
    case 'RECHAZADO':
    case 'ARCHIVADA':
      return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
    case 'RESUELTO_WHATSAPP':
      return 'bg-info-subtle text-info-emphasis border-info-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function valorPdf(valor, fallback = '-') {
  if (valor === 0) return '0';
  if (valor === false) return 'No';
  const texto = String(valor ?? '').trim();
  return texto || fallback;
}

function nombreArchivoPdf(valor) {
  const base = valorPdf(valor, 'junta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  return base || 'junta';
}

function fechaHoraLocalInput() {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 16);
}

function numeroEnteroSeguro(valor) {
  const numero = Number.parseInt(String(valor ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(numero) ? numero : 0;
}

function claveSesionAsistentes(juntaId) {
  return `${STORAGE_SESION_ASISTENTES}:${juntaId}`;
}

function leerSesionAsistentes(juntaId) {
  if (typeof window === 'undefined' || !juntaId) return '';

  try {
    return String(window.localStorage.getItem(claveSesionAsistentes(juntaId)) || '').replace(/\D/g, '').slice(0, 4);
  } catch {
    return '';
  }
}

function guardarSesionAsistentes(juntaId, valor) {
  if (typeof window === 'undefined' || !juntaId) return;

  const limpio = String(valor || '').replace(/\D/g, '').slice(0, 4);
  try {
    if (limpio) {
      window.localStorage.setItem(claveSesionAsistentes(juntaId), limpio);
    } else {
      window.localStorage.removeItem(claveSesionAsistentes(juntaId));
    }
  } catch {
    // El modal sigue funcionando aunque el navegador bloquee localStorage.
  }
}

function eliminarSesionAsistentes(juntaId) {
  if (typeof window === 'undefined' || !juntaId) return;

  try {
    window.localStorage.removeItem(claveSesionAsistentes(juntaId));
  } catch {
    // No es critico si el navegador no permite limpiar el borrador.
  }
}

function extraerAsistentesSesion(junta) {
  const texto = String(junta?.observaciones_generales || '');
  const coincidencias = [...texto.matchAll(/Sesión:\s*(\d+)\s+asistentes/gi)];
  const ultima = coincidencias.at(-1);
  return ultima ? String(ultima[1]).slice(0, 4) : '';
}

function puntoEstaPendiente(punto) {
  const estado = String(punto?.estado || '').toUpperCase();
  return ESTADOS_PUNTO_PENDIENTES.includes(estado) || !estado;
}

function payloadPuntoSesion(punto, cambios = {}) {
  return {
    numero_orden: punto.numero_orden || '',
    titulo: punto.titulo || '',
    departamento_origen: punto.departamento_origen || '',
    presentado_por: punto.presentado_por || '',
    tipo_punto: punto.tipo_punto || 'NUEVO',
    descripcion_base: punto.descripcion_base || '',
    observacion_secretaria: punto.observacion_secretaria || '',
    discusion_resumen: punto.discusion_resumen || '',
    decision_final: punto.decision_final || '',
    estado: punto.estado || 'PENDIENTE',
    prioridad: punto.prioridad || 'MEDIA',
    confidencial: Boolean(Number(punto.confidencial || 0)),
    responsable_seguimiento_usuario_id: punto.responsable_seguimiento_usuario_id || '',
    fecha_limite: punto.fecha_limite || '',
    punto_anterior_id: punto.punto_anterior_id || '',
    pasar_proxima_junta: Boolean(Number(punto.pasar_proxima_junta || 0)),
    referencia_modulo: punto.referencia_modulo || '',
    referencia_entidad_id: punto.referencia_entidad_id || '',
    ...cambios
  };
}

function limpiarNotasPostergacion(valor) {
  return String(valor || '')
    .split(' | ')
    .map((item) => item.trim())
    .filter((item) => item && !item.toLowerCase().includes('postergado'))
    .join(' | ');
}

function unirNotaSesion(textoActual, notaSesion) {
  const actual = textoLimpio(textoActual);
  const nota = textoLimpio(notaSesion);
  if (!nota) return actual;
  return actual ? `${actual} | ${nota}` : nota;
}

function payloadJuntaSesion(junta, estado, notaSesion = '') {
  return {
    fecha: junta.fecha || junta.fecha_inicio || '',
    hora_inicio: junta.hora_inicio || '',
    hora_fin: junta.hora_fin || '',
    tipo: normalizarTipoJunta(junta.tipo),
    moderador: junta.moderador || '',
    secretario: junta.secretario || '',
    estado,
    observaciones_generales: unirNotaSesion(junta.observaciones_generales, notaSesion),
    resumen_general: junta.resumen_general || '',
    quorum_texto: junta.quorum_texto || '',
    junta_anterior_id: junta.junta_anterior_id || '',
    puntos: []
  };
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm estudios-kpi-card juntas-kpi-card h-100">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="estudios-kpi-label">{label}</span>
            <i className={`bi ${icon} text-primary`} aria-hidden="true"></i>
          </div>
          <div className="estudios-kpi-value">{Number(value || 0).toLocaleString('es-CR')}</div>
        </div>
      </div>
    </div>
  );
}

function BotonAccion({ icono, label, onClick, outline = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`btn ${outline ? 'btn-outline-secondary' : 'btn-primary'} btn-sm admin-responsive-action-btn`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <i className={`bi ${icono}`} aria-hidden="true"></i>
      <span className="admin-responsive-btn-label">{label}</span>
    </button>
  );
}

function BotonIcono({ icono, label, onClick, variant = 'outline-secondary', disabled = false }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn juntas-icon-action-btn`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <i className={`bi ${icono}`} aria-hidden="true"></i>
    </button>
  );
}

function TablaShell({ className, children }) {
  return (
    <div className="tabla-registros-scroll-x juntas-tabla-scroll-x">
      <div className="tabla-registros-scroll juntas-tabla-scroll">
        <table className={`table table-striped table-hover align-middle mb-0 tabla-registros ${className}`}>{children}</table>
      </div>
    </div>
  );
}

function CatalogoPersonasJunta({
  form,
  items,
  departamentos,
  filtroTipo,
  onFiltroTipoChange,
  onChange,
  onGuardar,
  onLimpiar,
  onEditar,
  onEliminar,
  editandoId
}) {
  const idBase = 'juntas_responsable';
  const [opcionalesAbiertos, setOpcionalesAbiertos] = useState(false);
  const esModerador = form.tipo === 'MODERADOR';

  return (
    <div className="juntas-catalogo-layout">
      <div className="card shadow-sm juntas-persona-form-card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">
              <i className="bi bi-person-lines-fill me-2" aria-hidden="true"></i>
              Nuevo responsable
            </div>
            <div className="d-flex gap-2">
              <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={onLimpiar} />
              <BotonAccion icono={editandoId ? 'bi-floppy' : 'bi-plus-lg'} label={editandoId ? 'Actualizar' : 'Agregar'} onClick={onGuardar} />
            </div>
          </div>

          <div className="row g-3">
            <div className={`col-12 ${esModerador ? 'col-md-4' : 'col-md-6'}`}>
              <label className="form-label small" htmlFor={`${idBase}_tipo`}>Tipo <span className="text-danger" aria-hidden="true">*</span></label>
              <select
                id={`${idBase}_tipo`}
                className="form-select form-select-sm"
                value={form.tipo}
                onChange={(e) => onChange('tipo', e.target.value)}
              >
                {TIPO_RESPONSABLE_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className={`col-12 ${esModerador ? 'col-md-4' : 'col-md-6'}`}>
              <label className="form-label small" htmlFor={`${idBase}_nombre`}>Nombre <span className="text-danger" aria-hidden="true">*</span></label>
              <input
                id={`${idBase}_nombre`}
                type="text"
                className="form-control form-control-sm"
                value={form.nombre}
                onChange={(e) => onChange('nombre', e.target.value)}
                maxLength={35}
              />
            </div>
            {esModerador ? (
              <div className="col-12 col-md-4">
                <label className="form-label small" htmlFor={`${idBase}_departamento`}>Departamento <span className="text-danger" aria-hidden="true">*</span></label>
                <select
                  id={`${idBase}_departamento`}
                  className="form-select form-select-sm"
                  value={form.departamento}
                  onChange={(e) => onChange('departamento', e.target.value)}
                >
                  <option value="">Seleccione</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.nombre}>{departamento.nombre}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="col-12">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm juntas-opcionales-toggle"
                onClick={() => setOpcionalesAbiertos((prev) => !prev)}
                aria-expanded={opcionalesAbiertos}
                aria-controls={`${idBase}_opcionales`}
              >
                <i className={`bi ${opcionalesAbiertos ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
                Datos opcionales
              </button>
            </div>
            {opcionalesAbiertos ? (
              <div id={`${idBase}_opcionales`} className="col-12">
                <div className="row g-3 juntas-opcionales-panel">
                  <div className="col-12 col-md-6">
                    <label className="form-label small" htmlFor={`${idBase}_telefono`}>Teléfono</label>
                    <input
                      id={`${idBase}_telefono`}
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="0000-0000"
                      value={form.telefono}
                      onChange={(e) => onChange('telefono', e.target.value)}
                      maxLength={9}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small" htmlFor={`${idBase}_correo`}>Correo</label>
                    <input
                      id={`${idBase}_correo`}
                      type="email"
                      className="form-control form-control-sm"
                      value={form.correo}
                      onChange={(e) => onChange('correo', e.target.value)}
                      maxLength={60}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small" htmlFor={`${idBase}_observaciones`}>Observaciones</label>
                    <textarea
                      id={`${idBase}_observaciones`}
                      className="form-control form-control-sm"
                      rows="2"
                      value={form.observaciones}
                      onChange={(e) => onChange('observaciones', e.target.value)}
                      maxLength={90}
                    ></textarea>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card shadow-sm juntas-persona-lista-card">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="juntas-section-title mb-0">Responsables de junta</div>
              <span className="badge text-bg-light border juntas-contador-badge">{items.length}</span>
            </div>
            <div className="juntas-responsables-filtro">
              <label className="form-label small" htmlFor="juntas_responsables_filtro">Filtro</label>
              <select
                id="juntas_responsables_filtro"
                className="form-select form-select-sm"
                value={filtroTipo}
                onChange={(e) => onFiltroTipoChange(e.target.value)}
              >
                {FILTRO_RESPONSABLE_OPCIONES.map((item) => <option key={item.valor || 'todos'} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
          </div>
          <TablaShell className="juntas-personas-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Departamento</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="badge text-bg-light border">{etiquetaTipoResponsable(item.tipo)}</span>
                  </td>
                  <td>
                    <div className="fw-semibold">{item.nombre}</div>
                    {item.observaciones ? <div className="small text-muted">{item.observaciones}</div> : null}
                  </td>
                  <td>{item.departamento || '-'}</td>
                  <td>{item.telefono || '-'}</td>
                  <td>{item.correo || '-'}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2 juntas-acciones-inline">
                      <BotonIcono
                        icono="bi-pencil-square"
                        label="Editar"
                        variant="outline-primary"
                        onClick={() => onEditar(item)}
                      />
                      <BotonIcono
                        icono="bi-trash"
                        label="Eliminar"
                        variant="outline-danger"
                        onClick={() => onEliminar(item)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No hay responsables registrados.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>
        </div>
      </div>
    </div>
  );
}

function DepartamentosModal({
  abierto,
  items,
  form,
  editandoId,
  onCerrar,
  onChange,
  onGuardar,
  onEditar,
  onEliminar,
  onLimpiar
}) {
  if (!abierto) return null;

  return (
    <div
      className="juntas-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <div className="juntas-modal-card" role="dialog" aria-modal="true" aria-labelledby="juntas-departamentos-title">
        <div className="juntas-modal-header">
          <div>
            <h5 id="juntas-departamentos-title" className="mb-0">Departamentos</h5>
            <span className="badge text-bg-light border mt-2">{items.length}</span>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm juntas-icon-action-btn" onClick={onCerrar} aria-label="Cerrar departamentos">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="juntas-modal-body">
          <div className="card shadow-sm juntas-departamento-form-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="juntas-section-title mb-0">{editandoId ? 'Editar departamento' : 'Nuevo departamento'}</div>
                <div className="d-flex gap-2">
                  <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={onLimpiar} />
                  <BotonAccion icono={editandoId ? 'bi-floppy' : 'bi-plus-lg'} label={editandoId ? 'Actualizar' : 'Agregar'} onClick={onGuardar} />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small" htmlFor="juntas_departamento_nombre">Nombre del departamento <span className="text-danger" aria-hidden="true">*</span></label>
                  <input
                    id="juntas_departamento_nombre"
                    type="text"
                    className="form-control form-control-sm"
                    value={form.nombre}
                    onChange={(event) => onChange('nombre', event.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small" htmlFor="juntas_departamento_director">Nombre del director <span className="text-danger" aria-hidden="true">*</span></label>
                  <input
                    id="juntas_departamento_director"
                    type="text"
                    className="form-control form-control-sm"
                    value={form.director}
                    onChange={(event) => onChange('director', event.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small" htmlFor="juntas_departamento_asociados">Directores asociados</label>
                  <textarea
                    id="juntas_departamento_asociados"
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="Nombre, Nombre, Nombre"
                    value={form.asociados}
                    onChange={(event) => onChange('asociados', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      const campo = event.currentTarget;
                      const seleccion = campo.value.slice(campo.selectionStart, campo.selectionEnd);
                      const saltosSinSeleccion = contarSaltosLinea(campo.value) - contarSaltosLinea(seleccion);
                      if (saltosSinSeleccion >= 2) event.preventDefault();
                    }}
                    maxLength={180}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm juntas-departamento-lista-card">
            <div className="card-body p-0">
              <TablaShell className="juntas-departamentos-table">
                <thead>
                  <tr>
                    <th>Departamento</th>
                    <th>Director</th>
                    <th>Asociados</th>
                    <th>Registrado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.nombre}</td>
                      <td>{item.director}</td>
                      <td>{item.asociados?.length ? item.asociados.join(', ') : '-'}</td>
                      <td>{formatearFechaHora(item.creado_en)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2 juntas-acciones-inline">
                          <BotonIcono icono="bi-pencil-square" label="Editar" variant="outline-primary" onClick={() => onEditar(item)} />
                          <BotonIcono icono="bi-trash" label="Eliminar" variant="outline-danger" onClick={() => onEliminar(item)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No hay departamentos registrados.</td>
                    </tr>
                  ) : null}
                </tbody>
              </TablaShell>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PuntosTemporalesModal({ abierto, puntos, onCerrar, onEditar, onEliminar }) {
  if (!abierto) return null;

  return (
    <div
      className="juntas-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <div className="juntas-modal-card juntas-puntos-modal-card" role="dialog" aria-modal="true" aria-labelledby="juntas-puntos-temporales-title">
        <div className="juntas-modal-header">
          <div>
            <h5 id="juntas-puntos-temporales-title" className="mb-0">Puntos preregistrados</h5>
            <span className="badge text-bg-light border mt-2">{puntos.length}</span>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm juntas-icon-action-btn" onClick={onCerrar} aria-label="Cerrar puntos preregistrados">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="juntas-modal-body juntas-puntos-modal-body">
          <TablaShell className="juntas-puntos-temporales-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Punto</th>
                <th>Departamento</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="fw-semibold">{item.titulo}</td>
                  <td>{item.departamento_origen || '-'}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2 juntas-acciones-inline">
                      <BotonIcono icono="bi-pencil-square" label="Editar" variant="outline-primary" onClick={() => onEditar(item)} />
                      <BotonIcono icono="bi-trash" label="Eliminar" variant="outline-danger" onClick={() => onEliminar(item)} />
                    </div>
                  </td>
                </tr>
              ))}
              {!puntos.length ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">No hay puntos preregistrados.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>
        </div>
      </div>
    </div>
  );
}

function JuntaAccionesModal({ junta, onCerrar, onVerResumen, onEditar, onEliminar, onPdf, onSesionar }) {
  if (!junta) return null;
  const puedeEditar = !fechaInicioVencida(junta.fecha);
  const puedeSesionar = fechaEsHoy(junta.fecha);
  const tieneResumen = Boolean(textoLimpio(junta.resumen_general) || textoLimpio(junta.observaciones_generales));

  return (
    <div
      className="prompt-overlay-iasd juntas-acciones-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd juntas-acciones-modal" role="dialog" aria-modal="true" aria-labelledby="juntas-acciones-title">
        <div className="juntas-acciones-head">
          <div>
            <h5 id="juntas-acciones-title" className="mb-0">Acciones</h5>
            <div className="small text-muted">{formatearFecha(junta.fecha)} · {etiquetaTipoJunta(junta.tipo)}</div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="juntas-acciones-grid">
          {tieneResumen ? (
            <button type="button" className="btn btn-outline-info btn-sm rounded-circle juntas-icon-action-btn" onClick={() => onVerResumen(junta)} title="Ver resumen y observaciones" aria-label="Ver resumen y observaciones">
              <i className="bi bi-search" aria-hidden="true"></i>
            </button>
          ) : null}
          {puedeEditar ? (
            <button type="button" className="btn btn-outline-primary btn-sm rounded-circle juntas-icon-action-btn" onClick={() => onEditar(junta)} title="Editar" aria-label="Editar junta">
              <i className="bi bi-pencil-square" aria-hidden="true"></i>
            </button>
          ) : null}
          <button type="button" className="btn btn-outline-danger btn-sm rounded-circle juntas-icon-action-btn" onClick={() => onEliminar(junta)} title="Eliminar" aria-label="Eliminar junta">
            <i className="bi bi-trash" aria-hidden="true"></i>
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm rounded-circle juntas-icon-action-btn juntas-pdf-action-btn" onClick={() => onPdf(junta)} title="PDF" aria-label="Generar PDF">
            <i className="bi bi-filetype-pdf" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-success btn-sm rounded-circle juntas-icon-action-btn"
            onClick={() => onSesionar(junta)}
            title={puedeSesionar ? 'Sesionar' : 'Solo se puede sesionar en la fecha de inicio'}
            aria-label={puedeSesionar ? 'Sesionar junta' : 'Sesionar no disponible para esta fecha'}
            disabled={!puedeSesionar}
          >
            <i className="bi bi-play-circle" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

function JuntaResumenModal({ junta, onCerrar }) {
  if (!junta) return null;
  const resumen = textoLimpio(junta.resumen_general);
  const observaciones = textoLimpio(junta.observaciones_generales);

  return (
    <div
      className="prompt-overlay-iasd juntas-acciones-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd juntas-resumen-modal" role="dialog" aria-modal="true" aria-labelledby="juntas-resumen-modal-title">
        <div className="juntas-acciones-head">
          <div>
            <h5 id="juntas-resumen-modal-title" className="mb-0">Resumen y observaciones</h5>
            <div className="small text-muted">{formatearFecha(junta.fecha)} · {etiquetaTipoJunta(junta.tipo)}</div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="juntas-resumen-modal-body">
          {resumen ? (
            <section>
              <div className="juntas-meta-label mb-1">Resumen general</div>
              <p className="mb-0 juntas-resumen-modal-text">{resumen}</p>
            </section>
          ) : null}
          {observaciones ? (
            <section>
              <div className="juntas-meta-label mb-1">Observaciones</div>
              <p className="mb-0 juntas-resumen-modal-text">{observaciones}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function JuntaPdfOpcionesModal({ junta, onCerrar, onGenerar }) {
  if (!junta) return null;

  return (
    <div
      className="prompt-overlay-iasd juntas-acciones-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd juntas-pdf-modal" role="dialog" aria-modal="true" aria-labelledby="juntas-pdf-modal-title">
        <div className="juntas-acciones-head">
          <div>
            <h5 id="juntas-pdf-modal-title" className="mb-0">Formato del PDF</h5>
            <div className="small text-muted">{formatearFecha(junta.fecha)} · {etiquetaTipoJunta(junta.tipo)}</div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="juntas-pdf-opciones">
          <button type="button" className="btn btn-danger btn-sm juntas-pdf-option-btn" onClick={() => onGenerar(junta, PDF_JUNTA_COMPLETO)}>
            <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
            <span>Ficha general y puntos</span>
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm juntas-pdf-option-btn" onClick={() => onGenerar(junta, PDF_JUNTA_SOLO_PUNTOS)}>
            <i className="bi bi-list-check" aria-hidden="true"></i>
            <span>Solo puntos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SesionarJuntaModal({ junta, onCerrar, onActualizada }) {
  const [detalleSesion, setDetalleSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [guardandoSesion, setGuardandoSesion] = useState(false);
  const [asistentes, setAsistentes] = useState('');
  const [accionesPunto, setAccionesPunto] = useState({});
  const [mostrarPostergados, setMostrarPostergados] = useState(false);

  const cargarSesion = useCallback(async () => {
    if (!junta?.id) return;

    setCargandoSesion(true);
    try {
      const res = await juntaApi.obtenerPorId(junta.id);
      if (!res?.exito) {
        throw new Error(res?.mensaje || 'No se pudo cargar la junta.');
      }
      const item = res?.datos?.item || null;
      setDetalleSesion(item);
      const asistentesGuardados = leerSesionAsistentes(junta.id) || extraerAsistentesSesion(item);
      if (asistentesGuardados) setAsistentes(asistentesGuardados);
    } catch (error) {
      setDetalleSesion(null);
      notificarError(error?.mensaje || error?.message || 'No se pudo cargar la sesión de la junta.');
    } finally {
      setCargandoSesion(false);
    }
  }, [junta?.id]);

  useEffect(() => {
    if (!junta) return;
    setDetalleSesion(null);
    setAsistentes(leerSesionAsistentes(junta.id) || extraerAsistentesSesion(junta));
    setAccionesPunto({});
    setMostrarPostergados(false);
    void cargarSesion();
  }, [junta, cargarSesion]);

  if (!junta) return null;

  const detalle = detalleSesion || junta;
  const puntos = Array.isArray(detalle?.puntos) ? detalle.puntos : [];
  const quorum = numeroEnteroSeguro(detalle?.quorum_texto || junta?.quorum_texto);
  const asistentesNumero = numeroEnteroSeguro(asistentes);
  const quorumCumplido = quorum > 0 && asistentesNumero >= quorum;
  const juntaCerrada = String(detalle?.estado || junta?.estado || '').toUpperCase() === 'CERRADA';
  const puedeReanudar = juntaCerrada && fechaEsHoy(detalle?.fecha || junta?.fecha);
  const puntosPostergados = puntos.filter((punto) => ['POSPUESTO', 'TRASLADADO'].includes(String(punto.estado || '').toUpperCase()));
  const puntosActivos = puntos.filter((punto) => puntoEstaPendiente(punto) && !['POSPUESTO', 'TRASLADADO'].includes(String(punto.estado || '').toUpperCase()));
  const puntosProcesados = puntos.filter((punto) => !puntoEstaPendiente(punto) || ['POSPUESTO', 'TRASLADADO'].includes(String(punto.estado || '').toUpperCase()));
  const puntosSinProcesar = puntosActivos;
  const todosProcesados = puntos.length > 0 && puntosActivos.length === 0;
  const puedeProcesarPuntos = !juntaCerrada && quorumCumplido && asistentesNumero > 0;
  const etiquetaFinal = todosProcesados ? 'Terminar junta' : 'Postergar junta';

  const cambiarAccionPunto = (puntoId, campo, valor) => {
    setAccionesPunto((prev) => ({
      ...prev,
      [puntoId]: {
        modo: 'VOTAR',
        votos_favor: '',
        detalle: '',
        ...(prev[puntoId] || {}),
        [campo]: valor
      }
    }));
  };

  const cambiarAsistentes = (valor) => {
    const limpio = String(valor || '').replace(/\D/g, '').slice(0, 4);
    const limite = numeroEnteroSeguro(limpio);
    guardarSesionAsistentes(detalle.id || junta.id, limpio);
    setAsistentes(limpio);
    setAccionesPunto((prev) => {
      const siguiente = {};
      Object.entries(prev).forEach(([puntoId, accion]) => {
        const votosActuales = accion?.votos_favor;
        if (votosActuales === '' || votosActuales === undefined) {
          siguiente[puntoId] = accion;
          return;
        }

        const votos = numeroEnteroSeguro(votosActuales);
        siguiente[puntoId] = {
          ...accion,
          votos_favor: limpio && votos > limite ? String(limite) : (limpio ? String(votos) : '')
        };
      });
      return siguiente;
    });
  };

  const normalizarVotosFavor = (valor) => {
    const limpio = String(valor || '').replace(/\D/g, '').slice(0, 4);
    if (!limpio) return '';

    const votos = numeroEnteroSeguro(limpio);
    if (asistentesNumero <= 0) return '';
    return String(Math.min(votos, asistentesNumero));
  };

  const registrarVoto = async (punto) => {
    if (!puedeProcesarPuntos) {
      notificarError('Para votar primero debe cumplirse el quórum.');
      return;
    }

    const accion = accionesPunto[punto.id] || {};
    if (accion.votos_favor === '' || accion.votos_favor === undefined) {
      notificarError('Indique los votos a favor antes de registrar la votación.');
      return;
    }

    const votosFavor = numeroEnteroSeguro(accion.votos_favor);
    if (votosFavor < 0 || votosFavor > asistentesNumero) {
      notificarError('Los votos a favor no pueden superar la cantidad de asistentes.');
      return;
    }

    const votosContra = Math.max(asistentesNumero - votosFavor, 0);
    const estadoResultante = votosFavor > votosContra ? 'APROBADO' : 'RECHAZADO';
    const payload = {
      requirio_voto: true,
      tipo_voto: 'MAYORIA',
      texto_voto: `Asistentes: ${asistentesNumero}. A favor: ${votosFavor}. En contra: ${votosContra}.`,
      votos_favor: votosFavor,
      votos_contra: votosContra,
      abstenciones: 0,
      fecha_voto: fechaHoraLocalInput(),
      observacion: accion.detalle || '',
      estado_resultante: estadoResultante
    };

    setGuardandoSesion(true);
    try {
      const res = await juntaApi.crearVotacion(punto.id, payload);
      if (res?.exito) {
        notificarExito(estadoResultante === 'APROBADO' ? 'Punto aprobado.' : 'Punto rechazado.');
        setAccionesPunto((prev) => ({ ...prev, [punto.id]: { modo: 'VOTAR', votos_favor: '', detalle: '' } }));
        await cargarSesion();
        await onActualizada?.(detalle.id);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la votación.');
    } finally {
      setGuardandoSesion(false);
    }
  };

  const postergarPunto = async (punto) => {
    const accion = accionesPunto[punto.id] || {};
    const detallePunto = textoLimpio(accion.detalle);
    const nota = detallePunto ? `Postergado en sesión: ${detallePunto}` : 'Postergado en sesión.';

    setGuardandoSesion(true);
    try {
      const payload = payloadPuntoSesion(punto, {
        estado: 'POSPUESTO',
        observacion_secretaria: unirNotaSesion(punto.observacion_secretaria, nota)
      });
      const res = await juntaApi.actualizarPunto(punto.id, payload);
      if (res?.exito) {
        notificarExito('Punto postergado.');
        await cargarSesion();
        await onActualizada?.(detalle.id);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo postergar el punto.');
    } finally {
      setGuardandoSesion(false);
    }
  };

  const deshacerPostergacion = async (punto) => {
    if (juntaCerrada) {
      notificarError('Primero reanude la junta para deshacer puntos postergados.');
      return;
    }

    setGuardandoSesion(true);
    try {
      const payload = payloadPuntoSesion(punto, {
        estado: 'PENDIENTE',
        observacion_secretaria: limpiarNotasPostergacion(punto.observacion_secretaria)
      });
      const res = await juntaApi.actualizarPunto(punto.id, payload);
      if (res?.exito) {
        notificarExito('Postergación deshecha.');
        await cargarSesion();
        await onActualizada?.(detalle.id);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo deshacer la postergación.');
    } finally {
      setGuardandoSesion(false);
    }
  };

  const reanudarJunta = async () => {
    if (!puedeReanudar) return;

    const ok = await confirmar('La junta volverá a quedar en proceso para realizar ajustes. ¿Desea continuar?');
    if (!ok) return;

    setGuardandoSesion(true);
    try {
      const res = await juntaApi.actualizar(detalle.id, payloadJuntaSesion(detalle, 'EN_PROCESO'));
      if (res?.exito) {
        notificarExito('Junta reanudada.');
        await cargarSesion();
        await onActualizada?.(detalle.id);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo reanudar la junta.');
    } finally {
      setGuardandoSesion(false);
    }
  };

  const cerrarSesion = async () => {
    if (!detalle?.id) return;
    const notaSesion = `Sesión: ${asistentesNumero || 0} asistentes; quórum requerido: ${quorum || 0}; ${quorumCumplido ? 'quórum cumplido' : 'quórum no cumplido'}.`;

    if (!todosProcesados) {
      const ok = await confirmar(`Quedan ${puntosSinProcesar.length} punto(s) sin procesar. Se marcarán como postergados y la junta quedará cerrada. ¿Desea continuar?`);
      if (!ok) return;
    } else {
      const ok = await confirmar('La junta quedará cerrada. ¿Desea continuar?');
      if (!ok) return;
    }

    setGuardandoSesion(true);
    try {
      if (!todosProcesados) {
        await Promise.all(puntosSinProcesar.map((punto) => (
          juntaApi.actualizarPunto(punto.id, payloadPuntoSesion(punto, {
            estado: 'POSPUESTO',
            observacion_secretaria: unirNotaSesion(punto.observacion_secretaria, 'Postergado al cerrar la sesión.')
          }))
        )));
      }

      const res = await juntaApi.actualizar(detalle.id, payloadJuntaSesion(detalle, 'CERRADA', notaSesion));
      if (res?.exito) {
        notificarExito(todosProcesados ? 'Junta terminada.' : 'Junta postergada con puntos pendientes.');
        eliminarSesionAsistentes(detalle.id);
        await onActualizada?.(detalle.id);
        onCerrar();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo cerrar la sesión de la junta.');
    } finally {
      setGuardandoSesion(false);
    }
  };

  return (
    <div
      className="prompt-overlay-iasd juntas-sesion-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !guardandoSesion) onCerrar();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !guardandoSesion) onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd juntas-sesion-modal" role="dialog" aria-modal="true" aria-labelledby="juntas-sesion-title">
        <div className="juntas-sesion-head">
          <div>
            <h4 id="juntas-sesion-title" className="mb-1">Sesionar junta</h4>
            <div className="small text-muted">{formatearFecha(detalle.fecha)} · {etiquetaTipoJunta(detalle.tipo)} · {detalle.secretario || 'Sin secretaría'}</div>
          </div>
          <div className="juntas-sesion-head-actions">
            {puntosPostergados.length ? (
              <button
                type="button"
                className="btn btn-outline-warning btn-sm juntas-sesion-postergados-btn"
                onClick={() => setMostrarPostergados(true)}
                disabled={guardandoSesion}
              >
                <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                {puntosPostergados.length} postergado{puntosPostergados.length === 1 ? '' : 's'}
              </button>
            ) : null}
            {puedeReanudar ? (
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={reanudarJunta} disabled={guardandoSesion}>
                <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                Reanudar junta
              </button>
            ) : null}
            <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar" disabled={guardandoSesion}></button>
          </div>
        </div>

        <div className="juntas-sesion-body">
          <section className="juntas-sesion-summary">
            <div>
              <span>Quórum</span>
              <strong>{quorum || '-'}</strong>
            </div>
            <div>
              <label htmlFor="juntas_sesion_asistentes">Asistentes</label>
              <input
                id="juntas_sesion_asistentes"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className="form-control form-control-sm"
                value={asistentes}
                onChange={(event) => cambiarAsistentes(event.target.value)}
                disabled={juntaCerrada || guardandoSesion}
              />
            </div>
            <div>
              <span>Estado del quórum</span>
              <strong className={quorumCumplido ? 'text-success' : 'text-danger'}>{quorumCumplido ? 'Cumple' : 'No cumple'}</strong>
            </div>
            <div>
              <span>Puntos procesados</span>
              <strong>{puntosProcesados.length}/{puntos.length}</strong>
            </div>
          </section>

          {!juntaCerrada && !quorumCumplido ? (
            <div className="alert alert-warning py-2 mb-3">
              Para votar puntos, la cantidad de asistentes debe ser igual o mayor al quórum registrado.
            </div>
          ) : null}
          {juntaCerrada ? (
            <div className="alert alert-info py-2 mb-3">
              Esta junta ya fue terminada. {puedeReanudar ? 'Puede reanudarla mientras siga siendo la fecha de la junta.' : 'La fecha de la junta ya pasó y queda solo para consulta.'}
            </div>
          ) : null}

          <section className="juntas-sesion-puntos">
            {cargandoSesion ? (
              <div className="text-center text-muted py-4">Cargando puntos de la junta…</div>
            ) : puntosActivos.map((punto, index) => {
              const accion = accionesPunto[punto.id] || {};
              const votosFavor = numeroEnteroSeguro(accion.votos_favor);
              const votosContra = Math.max(asistentesNumero - votosFavor, 0);

              return (
                <article key={punto.id} className="juntas-sesion-punto">
                  <div className="juntas-sesion-punto-head">
                    <div>
                      <div className="fw-semibold">{punto.numero_orden || index + 1}. {punto.titulo}</div>
                      <div className="small text-muted">{punto.departamento_origen || 'Sin departamento'}</div>
                    </div>
                    <span className={`badge border ${claseEstado(punto.estado)}`}>{etiquetaEstado(punto.estado || 'PENDIENTE')}</span>
                  </div>

                  <div className="juntas-sesion-punto-grid">
                    <div>
                      <label className="form-label small" htmlFor={`juntas_punto_${punto.id}_favor`}>A favor</label>
                      <input
                        id={`juntas_punto_${punto.id}_favor`}
                        type="number"
                        min="0"
                        max={asistentesNumero}
                        className="form-control form-control-sm"
                        value={accion.votos_favor || ''}
                        onChange={(event) => cambiarAccionPunto(punto.id, 'votos_favor', normalizarVotosFavor(event.target.value))}
                        disabled={!puedeProcesarPuntos || guardandoSesion}
                      />
                    </div>
                    <div>
                      <label className="form-label small" htmlFor={`juntas_punto_${punto.id}_contra`}>En contra</label>
                      <input
                        id={`juntas_punto_${punto.id}_contra`}
                        type="number"
                        className="form-control form-control-sm"
                        value={accion.votos_favor ? votosContra : ''}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="juntas-sesion-observacion">
                      <label className="form-label small" htmlFor={`juntas_punto_${punto.id}_obs`}>Detalle</label>
                      <input
                        id={`juntas_punto_${punto.id}_obs`}
                        type="text"
                        className="form-control form-control-sm"
                        value={accion.detalle || ''}
                        onChange={(event) => cambiarAccionPunto(punto.id, 'detalle', event.target.value.slice(0, 180))}
                        maxLength={180}
                        disabled={juntaCerrada || guardandoSesion}
                      />
                    </div>
                    <div className="juntas-sesion-punto-actions">
                      <button type="button" className="btn btn-success btn-sm" onClick={() => registrarVoto(punto)} disabled={!puedeProcesarPuntos || guardandoSesion}>
                        <i className="bi bi-check2-square" aria-hidden="true"></i>
                        Votar
                      </button>
                      <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => postergarPunto(punto)} disabled={juntaCerrada || guardandoSesion}>
                        <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                        Postergar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {puntos.length > 0 && !puntosActivos.length && !cargandoSesion ? (
              <div className="juntas-sesion-clear-state">
                <i className="bi bi-check2-circle" aria-hidden="true"></i>
                <div>
                  <strong>Todos los puntos de la junta fueron tratados.</strong>
                  <span>
                    {juntaCerrada
                      ? 'La junta ya quedó terminada. Si aún es la fecha de la junta, puede reanudarla para hacer ajustes.'
                      : 'Puede terminar la junta o revisar los puntos postergados desde el contador superior.'}
                  </span>
                </div>
              </div>
            ) : null}

            {!puntos.length && !cargandoSesion ? (
              <div className="text-center text-muted py-4">Esta junta no tiene puntos registrados.</div>
            ) : null}
          </section>
        </div>

        <div className="juntas-sesion-footer">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardandoSesion}>Cerrar</button>
          {!juntaCerrada ? (
            <button type="button" className={`btn btn-sm ${todosProcesados ? 'btn-success' : 'btn-warning'}`} onClick={cerrarSesion} disabled={guardandoSesion || cargandoSesion || !puntos.length}>
              <i className={`bi ${todosProcesados ? 'bi-check2-circle' : 'bi-hourglass-split'}`} aria-hidden="true"></i>
              {etiquetaFinal}
            </button>
          ) : null}
        </div>

        {mostrarPostergados ? (
          <div className="juntas-postergados-layer" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMostrarPostergados(false);
          }}>
            <div className="juntas-postergados-modal" role="dialog" aria-modal="true" aria-labelledby="juntas-postergados-title">
              <div className="juntas-postergados-head">
                <div>
                  <h5 id="juntas-postergados-title" className="mb-0">Puntos postergados</h5>
                  <div className="small text-muted">{puntosPostergados.length} punto{puntosPostergados.length === 1 ? '' : 's'}</div>
                </div>
                <button type="button" className="btn-close" aria-label="Cerrar puntos postergados" onClick={() => setMostrarPostergados(false)}></button>
              </div>
              <div className="juntas-postergados-list">
                {puntosPostergados.map((punto) => (
                  <div key={punto.id} className="juntas-postergados-item">
                    <div>
                      <div className="fw-semibold">{punto.numero_orden}. {punto.titulo}</div>
                      <div className="small text-muted">{punto.departamento_origen || 'Sin departamento'}</div>
                    </div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => deshacerPostergacion(punto)} disabled={guardandoSesion || juntaCerrada}>
                      <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                      Deshacer
                    </button>
                  </div>
                ))}
                {!puntosPostergados.length ? (
                  <div className="text-center text-muted py-4">No hay puntos postergados.</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetalleVacio() {
  return (
    <div className="d-flex align-items-center justify-content-center text-center text-muted py-5">
      Seleccione una junta para revisar su resumen, agenda, pendientes y acta.
    </div>
  );
}

function ResumenJunta({ detalle }) {
  if (!detalle) return null;
  const resumen = detalle.resumen || {};
  const timeline = detalle.timeline || [];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <KpiCard label="Puntos" value={resumen.total_puntos} icon="bi-list-check" />
        <KpiCard label="Aprobados" value={resumen.total_aprobados} icon="bi-check2-circle" />
        <KpiCard label="Pendientes" value={resumen.total_pendientes} icon="bi-hourglass-split" />
        <KpiCard label="WhatsApp" value={resumen.total_resueltos_whatsapp} icon="bi-whatsapp" />
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Ficha general</div>
          <div className="juntas-resumen-grid">
            <div>
              <span className="juntas-meta-label">Fecha</span>
              <div>{formatearFecha(detalle.fecha)}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Tipo</span>
              <div>{etiquetaTipoJunta(detalle.tipo)}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Moderador</span>
              <div>{detalle.moderador || 'Sin definir'}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Secretaría</span>
              <div>{detalle.secretario || 'Sin definir'}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Horario</span>
              <div>{formatearHora(detalle.hora_inicio)} - {formatearHora(detalle.hora_fin)}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Quórum</span>
              <div>{detalle.quorum_texto || 'No indicado'}</div>
            </div>
          </div>
          {detalle.resumen_general ? <p className="mb-0 mt-3"><strong>Resumen:</strong> {detalle.resumen_general}</p> : null}
          {detalle.observaciones_generales ? <p className="mb-0 mt-2"><strong>Observaciones:</strong> {detalle.observaciones_generales}</p> : null}
        </div>
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Movimiento reciente</div>
          <div className="d-flex flex-column gap-2">
            {timeline.length ? timeline.map((item, index) => (
              <div key={`${item.fecha ?? 'tl'}-${index}`} className="border rounded-3 p-2 bg-white">
                <div className="small text-muted">{formatearFechaHora(item.fecha || item.creado_en)}</div>
                <div className="fw-semibold">{item.titulo || item.evento || 'Movimiento registrado'}</div>
                {item.descripcion ? <div>{item.descripcion}</div> : null}
              </div>
            )) : (
              <div className="text-muted small">Todavía no hay movimientos registrados para esta junta.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaJunta({
  detalle,
  usuarios,
  referenciasPorModulo,
  puntoForm,
  setPuntoForm,
  votacionForm,
  setVotacionForm,
  guardarPunto,
  guardarVotacion,
  editandoPuntoId,
  editandoVotacionId,
  resetPuntoForm,
  resetVotacionForm,
  editarPunto,
  prepararVotacion,
  editarVotacion,
  guardando
}) {
  if (!detalle) return null;

  const referencias = referenciasPorModulo?.[puntoForm.referencia_modulo] || [];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">{editandoPuntoId ? 'Editar punto' : 'Nuevo punto de agenda'}</div>
            <div className="d-flex gap-2">
              <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={resetPuntoForm} disabled={guardando} />
              <BotonAccion icono="bi-plus-lg" label={editandoPuntoId ? 'Actualizar' : 'Agregar'} onClick={guardarPunto} disabled={guardando} />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6 col-md-2">
              <label className="form-label small">Orden</label>
              <input type="number" min="1" className="form-control form-control-sm" value={puntoForm.numero_orden} onChange={(e) => setPuntoForm((prev) => ({ ...prev, numero_orden: e.target.value }))} />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label small">Título</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.titulo} onChange={(e) => setPuntoForm((prev) => ({ ...prev, titulo: e.target.value }))} />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label small">Departamento</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.departamento_origen} onChange={(e) => setPuntoForm((prev) => ({ ...prev, departamento_origen: e.target.value }))} />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Presentado por</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.presentado_por} onChange={(e) => setPuntoForm((prev) => ({ ...prev, presentado_por: e.target.value }))} />
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small">Tipo</label>
              <select className="form-select form-select-sm" value={puntoForm.tipo_punto} onChange={(e) => setPuntoForm((prev) => ({ ...prev, tipo_punto: e.target.value }))}>
                {TIPO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small">Estado</label>
              <select className="form-select form-select-sm" value={puntoForm.estado} onChange={(e) => setPuntoForm((prev) => ({ ...prev, estado: e.target.value }))}>
                {ESTADO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Prioridad</label>
              <select className="form-select form-select-sm" value={puntoForm.prioridad} onChange={(e) => setPuntoForm((prev) => ({ ...prev, prioridad: e.target.value }))}>
                {PRIORIDAD_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Responsable</label>
              <select className="form-select form-select-sm" value={puntoForm.responsable_seguimiento_usuario_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, responsable_seguimiento_usuario_id: e.target.value }))}>
                <option value="">Sin responsable</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre_usuario}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small">Fecha límite</label>
              <input type="date" className="form-control form-control-sm" value={puntoForm.fecha_limite} onChange={(e) => setPuntoForm((prev) => ({ ...prev, fecha_limite: e.target.value }))} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small">Punto anterior</label>
              <select className="form-select form-select-sm" value={puntoForm.punto_anterior_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, punto_anterior_id: e.target.value }))}>
                <option value="">Sin referencia</option>
                {(detalle.puntos || []).map((item) => <option key={item.id} value={item.id}>{item.numero_orden}. {item.titulo}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Vínculo</label>
              <select className="form-select form-select-sm" value={puntoForm.referencia_modulo} onChange={(e) => setPuntoForm((prev) => ({ ...prev, referencia_modulo: e.target.value, referencia_entidad_id: '' }))}>
                {REFERENCIA_MODULO_OPCIONES.map((item) => <option key={item.valor || 'none'} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label small">Registro vinculado</label>
              <select className="form-select form-select-sm" value={puntoForm.referencia_entidad_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, referencia_entidad_id: e.target.value }))}>
                <option value="">Sin vínculo específico</option>
                {referencias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small">Descripción base</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.descripcion_base} onChange={(e) => setPuntoForm((prev) => ({ ...prev, descripcion_base: e.target.value }))}></textarea>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Discusión</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.discusion_resumen} onChange={(e) => setPuntoForm((prev) => ({ ...prev, discusion_resumen: e.target.value }))}></textarea>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Decisión final</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.decision_final} onChange={(e) => setPuntoForm((prev) => ({ ...prev, decision_final: e.target.value }))}></textarea>
            </div>
            <div className="col-12">
              <div className="d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input id="junta-confidencial" className="form-check-input" type="checkbox" checked={Boolean(puntoForm.confidencial)} onChange={(e) => setPuntoForm((prev) => ({ ...prev, confidencial: e.target.checked }))} />
                  <label htmlFor="junta-confidencial" className="form-check-label">Confidencial</label>
                </div>
                <div className="form-check">
                  <input id="junta-pasar-proxima" className="form-check-input" type="checkbox" checked={Boolean(puntoForm.pasar_proxima_junta)} onChange={(e) => setPuntoForm((prev) => ({ ...prev, pasar_proxima_junta: e.target.checked }))} />
                  <label htmlFor="junta-pasar-proxima" className="form-check-label">Pasar a próxima junta</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">{editandoVotacionId ? 'Editar votación' : 'Registrar votación'}</div>
            <div className="d-flex gap-2">
              <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={resetVotacionForm} disabled={guardando} />
              <BotonAccion icono="bi-check2-square" label={editandoVotacionId ? 'Actualizar' : 'Guardar'} onClick={guardarVotacion} disabled={guardando} />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small">Punto</label>
              <select className="form-select form-select-sm" value={votacionForm.punto_agenda_id} onChange={(e) => setVotacionForm((prev) => ({ ...prev, punto_agenda_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {(detalle.puntos || []).map((item) => <option key={item.id} value={item.id}>{item.numero_orden}. {item.titulo}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Tipo de voto</label>
              <select className="form-select form-select-sm" value={votacionForm.tipo_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, tipo_voto: e.target.value }))}>
                {TIPO_VOTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Estado resultante</label>
              <select className="form-select form-select-sm" value={votacionForm.estado_resultante} onChange={(e) => setVotacionForm((prev) => ({ ...prev, estado_resultante: e.target.value }))}>
                {ESTADO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small">Fecha</label>
              <input type="datetime-local" className="form-control form-control-sm" value={votacionForm.fecha_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, fecha_voto: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label small">Texto del voto o acuerdo</label>
              <textarea className="form-control form-control-sm" rows="2" value={votacionForm.texto_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, texto_voto: e.target.value }))}></textarea>
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">A favor</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.votos_favor} onChange={(e) => setVotacionForm((prev) => ({ ...prev, votos_favor: e.target.value }))} />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">En contra</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.votos_contra} onChange={(e) => setVotacionForm((prev) => ({ ...prev, votos_contra: e.target.value }))} />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">Abst.</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.abstenciones} onChange={(e) => setVotacionForm((prev) => ({ ...prev, abstenciones: e.target.value }))} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Observación</label>
              <input type="text" className="form-control form-control-sm" value={votacionForm.observacion} onChange={(e) => setVotacionForm((prev) => ({ ...prev, observacion: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card juntas-section-card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">Agenda de la junta</div>
            <span className="badge text-bg-light border">{detalle.puntos?.length || 0}</span>
          </div>
          <TablaShell className="juntas-puntos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Punto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(detalle.puntos || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.numero_orden}</td>
                  <td>
                    <div className="fw-semibold">{item.titulo}</div>
                    <div className="small text-muted">{item.departamento_origen || 'Sin departamento'}</div>
                  </td>
                  <td>{item.tipo_punto}</td>
                  <td><span className={`badge border ${claseEstado(item.estado)}`}>{etiquetaEstado(item.estado)}</span></td>
                  <td>{item.responsable_nombre || 'Sin responsable'}</td>
                  <td>{formatearFecha(item.fecha_limite)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarPunto(item)} />
                      <BotonAccion icono="bi-check2-square" label="Votar" onClick={() => prepararVotacion(item)} />
                    </div>
                  </td>
                </tr>
              ))}
              {!detalle.puntos?.length ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">Todavía no hay puntos cargados.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>

          {detalle.votaciones?.length ? (
            <>
              <div className="juntas-section-title mt-4">Votaciones registradas</div>
              <TablaShell className="juntas-votaciones-table">
                <thead>
                  <tr>
                    <th>Punto</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Acuerdo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.votaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{item.numero_orden}. {item.punto_titulo}</td>
                      <td>{item.tipo_voto}</td>
                      <td>{formatearFechaHora(item.fecha_voto || item.creado_en)}</td>
                      <td>{item.texto_voto || 'Sin texto'}</td>
                      <td>
                        <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarVotacion(item)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TablaShell>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PendientesJunta({ detalle, pendientes, prepararVotacion, editarPunto }) {
  if (!detalle) return null;
  return (
    <div className="d-flex flex-column gap-3">
      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Pendientes del sistema</div>
          <TablaShell className="juntas-pendientes-table">
            <thead>
              <tr>
                <th>Fecha junta</th>
                <th>Punto</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((item) => (
                <tr key={item.id}>
                  <td>{formatearFecha(item.junta_fecha)}</td>
                  <td>
                    <div className="fw-semibold">{item.numero_orden}. {item.titulo}</div>
                    <div className="small text-muted">{item.departamento_origen || 'Sin departamento'}</div>
                  </td>
                  <td><span className={`badge border ${claseEstado(item.estado)}`}>{etiquetaEstado(item.estado)}</span></td>
                  <td>{item.responsable_nombre || 'Sin responsable'}</td>
                  <td>{formatearFecha(item.fecha_limite)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      {Number(item.junta_id) === Number(detalle.id) ? (
                        <>
                          <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarPunto(item)} />
                          <BotonAccion icono="bi-check2-square" label="Votar" onClick={() => prepararVotacion(item)} />
                        </>
                      ) : (
                        <span className="small text-muted">Disponible en otra junta</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!pendientes.length ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No hay pendientes acumulados con los filtros actuales.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>
        </div>
      </div>
    </div>
  );
}

function ActaJunta({ detalle }) {
  if (!detalle) return null;
  const encabezado = detalle.acta?.encabezado || {};
  const items = detalle.acta?.items || [];
  return (
    <div className="card border-0 bg-light">
      <div className="card-body">
        <div className="juntas-section-title">Acta resumida</div>
        <div className="juntas-resumen-grid mb-3">
          <div>
            <span className="juntas-meta-label">Fecha</span>
            <div>{formatearFecha(encabezado.fecha)}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Tipo</span>
            <div>{etiquetaTipoJunta(encabezado.tipo)}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Moderador</span>
            <div>{encabezado.moderador || 'Sin definir'}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Secretaría</span>
            <div>{encabezado.secretario || 'Sin definir'}</div>
          </div>
        </div>
        {encabezado.quorum_texto ? (
          <p className="mb-2"><strong>Quórum:</strong> {encabezado.quorum_texto}</p>
        ) : null}
        {encabezado.resumen_general ? (
          <p className="mb-3"><strong>Resumen:</strong> {encabezado.resumen_general}</p>
        ) : null}
        <div className="juntas-acta-list">
          {items.map((item) => (
            <div key={`${item.numero_orden}-${item.titulo}`} className="juntas-acta-item">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-1">
                <div className="fw-semibold">{item.numero_orden}. {item.titulo}</div>
                <span className={`badge border ${claseEstado(item.estado)}`}>{etiquetaEstado(item.estado)}</span>
              </div>
              <div className="small text-muted mb-2">{item.tipo_punto}</div>
              {item.discusion_resumen ? <p className="mb-2">{item.discusion_resumen}</p> : null}
              {item.decision_final ? <p className="mb-0"><strong>Acuerdo:</strong> {item.decision_final}</p> : null}
            </div>
          ))}
          {!items.length ? <div className="text-muted small">Todavía no hay puntos para construir el acta.</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function JuntasIglesiaPage() {
  const {
    filtros,
    dashboard,
    juntas,
    pendientes,
    usuarios,
    referenciasPorModulo,
    seleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    detalleVista,
    setDetalleVista,
    editandoJuntaId,
    editandoPuntoId,
    editandoVotacionId,
    juntaForm,
    setJuntaForm,
    puntoForm,
    setPuntoForm,
    votacionForm,
    setVotacionForm,
    cambiarFiltro,
    setSeleccionadaId,
    guardarJunta,
    editarJunta,
    resetJuntaForm,
    eliminarJunta,
    guardarPunto,
    editarPunto,
    resetPuntoForm,
    prepararVotacion,
    guardarVotacion,
    editarVotacion,
    resetVotacionForm,
    inicializarJuntaNueva,
    refrescarJuntas
  } = useJuntasIglesia();

  const [vistaActiva, setVistaActiva] = useState(VISTA_JUNTAS);
  const [moderadoresLocales, setModeradoresLocales] = useState(() => cargarCatalogoLocal(STORAGE_MODERADORES));
  const [secretariasLocales, setSecretariasLocales] = useState(() => cargarCatalogoLocal(STORAGE_ACTAS_PERSONAS));
  const [departamentosLocales, setDepartamentosLocales] = useState(() => cargarCatalogoLocal(STORAGE_DEPARTAMENTOS));
  const [responsableForm, setResponsableForm] = useState(PERSONA_JUNTA_INICIAL);
  const [responsableEditando, setResponsableEditando] = useState(null);
  const [responsablesFiltroTipo, setResponsablesFiltroTipo] = useState('');
  const [mostrarDepartamentos, setMostrarDepartamentos] = useState(false);
  const [departamentoForm, setDepartamentoForm] = useState(DEPARTAMENTO_JUNTA_INICIAL);
  const [departamentoEditandoId, setDepartamentoEditandoId] = useState(null);
  const [puntoJuntaForm, setPuntoJuntaForm] = useState(PUNTO_JUNTA_INICIAL);
  const [puntosTemporales, setPuntosTemporales] = useState([]);
  const [puntoTemporalEditandoId, setPuntoTemporalEditandoId] = useState(null);
  const [mostrarPuntosTemporales, setMostrarPuntosTemporales] = useState(false);
  const [juntaOpcionalesAbiertos, setJuntaOpcionalesAbiertos] = useState(false);
  const [accionesJunta, setAccionesJunta] = useState(null);
  const [resumenJuntaModal, setResumenJuntaModal] = useState(null);
  const [pdfJuntaModal, setPdfJuntaModal] = useState(null);
  const [sesionJuntaModal, setSesionJuntaModal] = useState(null);

  const limpiarPuntosTemporales = useCallback(() => {
    setPuntoJuntaForm(PUNTO_JUNTA_INICIAL);
    setPuntosTemporales([]);
    setPuntoTemporalEditandoId(null);
    setMostrarPuntosTemporales(false);
  }, []);

  useEffect(() => {
    const abrirResponsables = () => setVistaActiva(VISTA_RESPONSABLES);
    const abrirLista = () => setVistaActiva(VISTA_JUNTAS);
    const abrirDepartamentos = () => setMostrarDepartamentos(true);
    const abrirAsignar = () => {
      inicializarJuntaNueva();
      setPuntoJuntaForm(PUNTO_JUNTA_INICIAL);
      setPuntosTemporales([]);
      setPuntoTemporalEditandoId(null);
      setMostrarPuntosTemporales(false);
      setVistaActiva(VISTA_ASIGNAR);
    };

    window.addEventListener(EVENT_JUNTAS_ABRIR_RESPONSABLES, abrirResponsables);
    window.addEventListener(EVENT_JUNTAS_ABRIR_LISTA, abrirLista);
    window.addEventListener(EVENT_JUNTAS_ABRIR_DEPARTAMENTOS, abrirDepartamentos);
    window.addEventListener(EVENT_JUNTAS_ABRIR_ASIGNAR, abrirAsignar);
    return () => {
      window.removeEventListener(EVENT_JUNTAS_ABRIR_RESPONSABLES, abrirResponsables);
      window.removeEventListener(EVENT_JUNTAS_ABRIR_LISTA, abrirLista);
      window.removeEventListener(EVENT_JUNTAS_ABRIR_DEPARTAMENTOS, abrirDepartamentos);
      window.removeEventListener(EVENT_JUNTAS_ABRIR_ASIGNAR, abrirAsignar);
    };
  }, [inicializarJuntaNueva]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT_JUNTAS_VISTA_ACTIVA, { detail: { vista: vistaActiva } }));
  }, [vistaActiva]);

  useEffect(() => {
    guardarCatalogoLocal(STORAGE_MODERADORES, moderadoresLocales);
  }, [moderadoresLocales]);

  useEffect(() => {
    guardarCatalogoLocal(STORAGE_ACTAS_PERSONAS, secretariasLocales);
  }, [secretariasLocales]);

  useEffect(() => {
    guardarCatalogoLocal(STORAGE_DEPARTAMENTOS, departamentosLocales);
  }, [departamentosLocales]);

  const departamentosCatalogo = useMemo(() => (
    [...departamentosLocales].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CR'))
  ), [departamentosLocales]);

  const moderadoresCatalogo = useMemo(() => unirCatalogos(
    moderadoresLocales.map((item) => ({ ...item, tipo: 'MODERADOR' }))
  ), [moderadoresLocales]);

  const secretariasCatalogo = useMemo(() => unirCatalogos(
    secretariasLocales.map((item) => ({ ...item, tipo: 'SECRETARIA' }))
  ), [secretariasLocales]);

  const responsablesCatalogo = useMemo(() => (
    [...moderadoresCatalogo, ...secretariasCatalogo]
      .sort((a, b) => {
        const tipo = etiquetaTipoResponsable(a.tipo).localeCompare(etiquetaTipoResponsable(b.tipo), 'es-CR');
        return tipo || a.nombre.localeCompare(b.nombre, 'es-CR');
      })
  ), [moderadoresCatalogo, secretariasCatalogo]);

  const responsablesFiltrados = useMemo(() => (
    responsablesFiltroTipo
      ? responsablesCatalogo.filter((item) => item.tipo === responsablesFiltroTipo)
      : responsablesCatalogo
  ), [responsablesCatalogo, responsablesFiltroTipo]);

  const opcionesModerador = useMemo(
    () => opcionesCatalogoConActual(moderadoresCatalogo, juntaForm.moderador),
    [moderadoresCatalogo, juntaForm.moderador]
  );

  const opcionesSecretaria = useMemo(
    () => opcionesCatalogoConActual(secretariasCatalogo, juntaForm.secretario),
    [secretariasCatalogo, juntaForm.secretario]
  );

  const juntaAnterior = useMemo(
    () => juntas.find((item) => String(item.id) === String(juntaForm.junta_anterior_id)),
    [juntas, juntaForm.junta_anterior_id]
  );
  const numeroPuntoSiguiente = puntoTemporalEditandoId
    ? (puntosTemporales.findIndex((item) => String(item.id) === String(puntoTemporalEditandoId)) + 1 || puntosTemporales.length + 1)
    : puntosTemporales.length + 1;
  const fechaMinimaJunta = useMemo(() => fechaHoyInput(), []);

  const cambiarJuntaForm = useCallback((campo, valor) => {
    setJuntaForm((prev) => {
      if (campo === 'quorum_texto') {
        return { ...prev, quorum_texto: String(valor || '').replace(/\D/g, '').slice(0, 4) };
      }
      if (campo === 'fecha') {
        return { ...prev, fecha: valor, estado: resolverEstadoJuntaPorFecha(valor, prev.estado) };
      }
      if (campo === 'tipo') {
        return { ...prev, tipo: normalizarTipoJunta(valor), estado: resolverEstadoJuntaPorFecha(prev.fecha, prev.estado) };
      }
      if (campo === 'resumen_general' || campo === 'observaciones_generales') {
        return { ...prev, [campo]: limitarSaltosLinea(valor, JUNTAS_TEXTAREA_MAX_SALTOS) };
      }
      return { ...prev, [campo]: valor };
    });
  }, [setJuntaForm]);

  const cambiarPuntoJuntaForm = useCallback((campo, valor) => {
    const siguienteValor = campo === 'titulo'
      ? String(valor || '').slice(0, PUNTO_JUNTA_TITULO_MAX)
      : valor;
    setPuntoJuntaForm((prev) => ({ ...prev, [campo]: siguienteValor }));
  }, []);

  const limpiarPuntoJuntaForm = useCallback(() => {
    setPuntoJuntaForm(PUNTO_JUNTA_INICIAL);
    setPuntoTemporalEditandoId(null);
  }, []);

  const guardarPuntoTemporal = useCallback(() => {
    const titulo = textoLimpio(puntoJuntaForm.titulo);
    const departamento = textoLimpio(puntoJuntaForm.departamento_origen);

    if (!titulo || !departamento) {
      notificarError('Indique el punto y el departamento representado.');
      return;
    }

    const registro = {
      id: puntoTemporalEditandoId || `punto-${Date.now()}`,
      titulo,
      departamento_origen: departamento
    };

    setPuntosTemporales((prev) => {
      if (!puntoTemporalEditandoId) return [...prev, registro];
      return prev.map((item) => (String(item.id) === String(puntoTemporalEditandoId) ? registro : item));
    });
    limpiarPuntoJuntaForm();
    notificarExito(puntoTemporalEditandoId ? 'Punto actualizado.' : 'Punto preregistrado.');
  }, [puntoJuntaForm, puntoTemporalEditandoId, limpiarPuntoJuntaForm]);

  const editarPuntoTemporal = useCallback((item) => {
    setPuntoTemporalEditandoId(item.id);
    setPuntoJuntaForm({
      titulo: item.titulo || '',
      departamento_origen: item.departamento_origen || ''
    });
    setMostrarPuntosTemporales(false);
  }, []);

  const eliminarPuntoTemporal = useCallback(async (item) => {
    const ok = await confirmar(`¿Está seguro de eliminar el punto "${item.titulo || 'seleccionado'}"?`);
    if (!ok) return;

    setPuntosTemporales((prev) => prev.filter((registro) => String(registro.id) !== String(item.id)));
    if (String(puntoTemporalEditandoId || '') === String(item.id)) {
      limpiarPuntoJuntaForm();
    }
    notificarExito('Punto eliminado.');
  }, [puntoTemporalEditandoId, limpiarPuntoJuntaForm]);

  const limpiarAsignarJunta = useCallback(() => {
    resetJuntaForm();
    limpiarPuntosTemporales();
    setJuntaOpcionalesAbiertos(false);
  }, [resetJuntaForm, limpiarPuntosTemporales]);

  const guardarAsignarJunta = useCallback(async () => {
    const requeridos = [
      [juntaForm.fecha, 'Fecha de inicio'],
      [juntaForm.tipo, 'Tipo'],
      [juntaForm.hora_inicio, 'Inicio'],
      [juntaForm.hora_fin, 'Final'],
      [juntaForm.moderador, 'Moderador'],
      [juntaForm.secretario, 'Secretaría'],
      [juntaForm.quorum_texto, 'Quórum']
    ];
    const faltante = requeridos.find(([valor]) => !textoLimpio(valor));
    if (faltante) {
      notificarError(`${faltante[1]} es obligatorio.`);
      return;
    }

    if (Number(juntaForm.quorum_texto) <= 0) {
      notificarError('Quórum debe ser mayor que cero.');
      return;
    }

    const totalPuntosExistentes = editandoJuntaId
      ? Number(juntas.find((item) => String(item.id) === String(editandoJuntaId))?.total_puntos || 0)
      : 0;
    if (totalPuntosExistentes + puntosTemporales.length === 0) {
      notificarError('Debe registrar al menos un punto para guardar la junta.');
      return;
    }

    if (juntaForm.fecha && juntaForm.fecha < fechaMinimaJunta) {
      notificarError('La fecha de inicio no puede ser anterior al día de hoy.');
      return;
    }
    if (normalizarTipoJunta(juntaForm.tipo) === 'PRESENCIAL') {
      const presencialDuplicada = juntas.find((item) => (
        String(item.fecha || '').slice(0, 10) === juntaForm.fecha
        && normalizarTipoJunta(item.tipo) === 'PRESENCIAL'
        && String(item.id) !== String(editandoJuntaId || '')
      ));
      if (presencialDuplicada) {
        notificarError(`Ya existe una junta presencial registrada para el ${formatearFecha(juntaForm.fecha)}.`);
        return;
      }
    }

    const guardado = await guardarJunta({
      puntos: puntosTemporales.map((item, index) => ({
        numero_orden: index + 1,
        titulo: item.titulo,
        departamento_origen: item.departamento_origen,
        presentado_por: '',
        tipo_punto: 'NUEVO',
        descripcion_base: '',
        observacion_secretaria: '',
        discusion_resumen: '',
        decision_final: '',
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        confidencial: false,
        responsable_seguimiento_usuario_id: '',
        fecha_limite: '',
        punto_anterior_id: '',
        pasar_proxima_junta: false,
        referencia_modulo: '',
        referencia_entidad_id: ''
      }))
    });

    if (guardado) {
      limpiarPuntosTemporales();
    }
  }, [juntaForm, fechaMinimaJunta, juntas, editandoJuntaId, guardarJunta, puntosTemporales, limpiarPuntosTemporales]);

  const cambiarResponsableForm = useCallback((campo, valor) => {
    setResponsableForm((prev) => {
      if (campo === 'telefono') {
        const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
        const telefono = digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
        return { ...prev, telefono };
      }
      if (campo === 'tipo') {
        return { ...prev, tipo: valor, departamento: valor === 'SECRETARIA' ? '' : prev.departamento };
      }
      return { ...prev, [campo]: valor };
    });
  }, []);

  const guardarPersonaCatalogo = useCallback(() => {
    const esModerador = responsableForm.tipo === 'MODERADOR';
    const form = responsableForm;
    const catalogo = esModerador ? moderadoresCatalogo : secretariasCatalogo;
    const etiqueta = esModerador ? 'Moderador' : 'Secretaría';
    const nombre = textoLimpio(form.nombre);
    const departamento = textoLimpio(form.departamento);
    const correo = textoLimpio(form.correo);

    if (!nombre || (esModerador && !departamento)) {
      notificarError(esModerador ? `${etiqueta}: nombre y departamento son obligatorios.` : `${etiqueta}: el nombre es obligatorio.`);
      return;
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      notificarError(`${etiqueta}: el correo no tiene un formato válido.`);
      return;
    }

    if (form.telefono && !/^\d{4}-\d{4}$/.test(form.telefono)) {
      notificarError(`${etiqueta}: el teléfono debe usar el formato 0000-0000.`);
      return;
    }

    const duplicado = catalogo.some((item) => (
      normalizarClave(item.nombre) === normalizarClave(nombre)
      && String(item.id) !== String(responsableEditando?.id || '')
    ));
    if (duplicado) {
      notificarError(`${etiqueta}: ya existe un registro con ese nombre.`);
      return;
    }

    const nuevoRegistro = {
      id: responsableEditando?.id || `${form.tipo.toLocaleLowerCase('es-CR')}-${Date.now()}`,
      tipo: form.tipo,
      nombre,
      departamento,
      telefono: textoLimpio(form.telefono),
      correo,
      observaciones: textoLimpio(form.observaciones)
    };

    if (responsableEditando?.id) {
      setModeradoresLocales((prev) => prev.filter((item) => String(item.id) !== String(responsableEditando.id)));
      setSecretariasLocales((prev) => prev.filter((item) => String(item.id) !== String(responsableEditando.id)));
    }

    if (esModerador) {
      setModeradoresLocales((prev) => [nuevoRegistro, ...prev]);
    } else {
      setSecretariasLocales((prev) => [nuevoRegistro, ...prev]);
    }

    setResponsableForm((prev) => ({ ...PERSONA_JUNTA_INICIAL, tipo: prev.tipo }));
    setResponsableEditando(null);
    notificarExito(responsableEditando?.id ? `${etiqueta} actualizado.` : `${etiqueta} agregado.`);
  }, [responsableForm, moderadoresCatalogo, secretariasCatalogo, responsableEditando]);

  const limpiarResponsable = useCallback(() => {
    setResponsableEditando(null);
    setResponsableForm(PERSONA_JUNTA_INICIAL);
  }, []);

  const editarResponsable = useCallback((item) => {
    setResponsableEditando(item);
    setResponsableForm({
      tipo: item.tipo || 'MODERADOR',
      nombre: item.nombre || '',
      departamento: item.departamento || '',
      telefono: item.telefono || '',
      correo: item.correo || '',
      observaciones: item.observaciones || ''
    });
  }, []);

  const eliminarResponsable = useCallback(async (item) => {
    const ok = await confirmar(`¿Está seguro de eliminar definitivamente a "${item.nombre || 'este responsable'}"?`);
    if (!ok) return;

    setModeradoresLocales((prev) => prev.filter((registro) => String(registro.id) !== String(item.id)));
    setSecretariasLocales((prev) => prev.filter((registro) => String(registro.id) !== String(item.id)));

    if (String(responsableEditando?.id || '') === String(item.id)) {
      limpiarResponsable();
    }
    notificarExito('Responsable eliminado definitivamente.');
  }, [responsableEditando, limpiarResponsable]);

  const cambiarDepartamentoForm = useCallback((campo, valor) => {
    const valorNormalizado = campo === 'asociados' ? limitarSaltosLinea(valor, 2) : valor;
    setDepartamentoForm((prev) => ({ ...prev, [campo]: valorNormalizado }));
  }, []);

  const limpiarDepartamento = useCallback(() => {
    setDepartamentoEditandoId(null);
    setDepartamentoForm(DEPARTAMENTO_JUNTA_INICIAL);
  }, []);

  const guardarDepartamento = useCallback(async () => {
    const nombre = textoLimpio(departamentoForm.nombre);
    const director = textoLimpio(departamentoForm.director);

    if (!nombre || !director) {
      notificarError('Departamento: nombre y director son obligatorios.');
      return;
    }

    const parecido = departamentosLocales.find((item) => (
      normalizarClaveFlexible(item.nombre) === normalizarClaveFlexible(nombre)
      && String(item.id) !== String(departamentoEditandoId || '')
    ));
    if (parecido) {
      const continuar = await confirmar(`Ya existe un departamento parecido o igual: "${parecido.nombre}". ¿Desea registrar "${nombre}" de todos modos?`);
      if (!continuar) return;
    }

    const item = {
      id: departamentoEditandoId || `departamento-${Date.now()}`,
      nombre,
      director,
      asociados: normalizarAsociados(departamentoForm.asociados),
      creado_en: departamentosLocales.find((registro) => String(registro.id) === String(departamentoEditandoId))?.creado_en || new Date().toISOString()
    };

    setDepartamentosLocales((prev) => [
      item,
      ...prev.filter((registro) => String(registro.id) !== String(item.id))
    ]);
    limpiarDepartamento();
    notificarExito(departamentoEditandoId ? 'Departamento actualizado.' : 'Departamento agregado.');
  }, [departamentoForm, departamentoEditandoId, departamentosLocales, limpiarDepartamento]);

  const editarDepartamento = useCallback((item) => {
    setDepartamentoEditandoId(item.id);
    setDepartamentoForm({
      nombre: item.nombre || '',
      director: item.director || '',
      asociados: Array.isArray(item.asociados) ? item.asociados.join('\n') : ''
    });
  }, []);

  const eliminarDepartamento = useCallback(async (item) => {
    const ok = await confirmar(`¿Está seguro de eliminar el departamento "${item.nombre || 'seleccionado'}"?`);
    if (!ok) return;

    setDepartamentosLocales((prev) => prev.filter((registro) => String(registro.id) !== String(item.id)));
    if (String(departamentoEditandoId || '') === String(item.id)) {
      limpiarDepartamento();
    }
    notificarExito('Departamento eliminado.');
  }, [departamentoEditandoId, limpiarDepartamento]);

  const editarDesdeJuntas = useCallback((item) => {
    setAccionesJunta(null);
    if (fechaInicioVencida(item.fecha)) {
      notificarError('No se puede editar una junta cuya fecha de inicio ya pasó.');
      return;
    }

    editarJunta(item);
    limpiarPuntosTemporales();
    setJuntaOpcionalesAbiertos(Boolean(item.resumen_general || item.observaciones_generales));
    setSeleccionadaId(item.id);
    setVistaActiva(VISTA_ASIGNAR);
  }, [editarJunta, limpiarPuntosTemporales, setSeleccionadaId]);

  const abrirAccionesJunta = useCallback((item) => {
    setSeleccionadaId(item.id);
    setAccionesJunta(item);
  }, [setSeleccionadaId]);

  const eliminarDesdeAcciones = useCallback((item) => {
    setAccionesJunta(null);
    void eliminarJunta(item);
  }, [eliminarJunta]);

  const verResumenDesdeAcciones = useCallback((item) => {
    setAccionesJunta(null);
    setResumenJuntaModal(item);
  }, []);

  const abrirPdfOpciones = useCallback((item) => {
    setAccionesJunta(null);
    setPdfJuntaModal(item);
  }, []);

  const generarPdfJunta = useCallback(async (item, modo = PDF_JUNTA_COMPLETO) => {
    setAccionesJunta(null);
    setPdfJuntaModal(null);

    if (!item?.id) {
      notificarError('No se pudo identificar la junta para generar el PDF.');
      return;
    }

    try {
      const [detalleRes, moduloPdf] = await Promise.all([
        juntaApi.obtenerPorId(item.id),
        import('jspdf')
      ]);

      if (!detalleRes?.exito) {
        throw new Error(detalleRes?.mensaje || 'No se pudo cargar el detalle de la junta.');
      }

      const junta = detalleRes?.datos?.item || item;
      const puntos = Array.isArray(junta.puntos) ? junta.puntos : [];
      const incluirFichaGeneral = modo !== PDF_JUNTA_SOLO_PUNTOS;
      const { jsPDF } = moduloPdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 38;
      const contentWidth = pageWidth - (margin * 2);
      const lineHeight = 13;
      const azul = [0, 51, 102];
      const grisTexto = [86, 96, 112];
      const grisBorde = [220, 228, 238];
      let y = margin;

      const asegurarEspacio = (altoNecesario = 40) => {
        if (y + altoNecesario > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const escribirTexto = (texto, opciones = {}) => {
        const {
          x = margin,
          ancho = contentWidth,
          fuente = 'normal',
          tamano = 10,
          color = [20, 32, 48],
          espacioDespues = 8
        } = opciones;
        const contenido = String(texto ?? '');
        const lineas = doc.splitTextToSize(contenido || '-', ancho);
        asegurarEspacio((lineas.length * lineHeight) + espacioDespues);
        doc.setFont('helvetica', fuente);
        doc.setFontSize(tamano);
        doc.setTextColor(...color);
        doc.text(lineas, x, y);
        y += (lineas.length * lineHeight) + espacioDespues;
      };

      const escribirSeccion = (titulo) => {
        asegurarEspacio(34);
        y += y === margin ? 0 : 6;
        doc.setFillColor(244, 248, 252);
        doc.setDrawColor(...grisBorde);
        doc.roundedRect(margin, y - 4, contentWidth, 26, 5, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...azul);
        doc.text(titulo, margin + 10, y + 13);
        y += 34;
      };

      const escribirGrid = (campos, columnas = 2) => {
        const gap = 10;
        const colWidth = (contentWidth - (gap * (columnas - 1))) / columnas;

        for (let index = 0; index < campos.length; index += columnas) {
          const fila = campos.slice(index, index + columnas);
          const lineasPorCampo = fila.map((campo) => (
            doc.splitTextToSize(valorPdf(campo.valor), colWidth - 16)
          ));
          const altoFila = Math.max(...lineasPorCampo.map((lineas) => 28 + (lineas.length * 11)), 42);
          asegurarEspacio(altoFila + 8);

          fila.forEach((campo, campoIndex) => {
            const x = margin + (campoIndex * (colWidth + gap));
            doc.setFillColor(250, 252, 255);
            doc.setDrawColor(...grisBorde);
            doc.roundedRect(x, y, colWidth, altoFila, 5, 5, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...grisTexto);
            doc.text(String(campo.label || '').toUpperCase(), x + 8, y + 13);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(20, 32, 48);
            doc.text(lineasPorCampo[campoIndex], x + 8, y + 29);
          });

          y += altoFila + 8;
        }
      };

      const escribirBloqueTexto = (titulo, texto) => {
        const limpio = textoLimpio(texto);
        if (!limpio) return;
        escribirTexto(titulo, { fuente: 'bold', tamano: 10, color: azul, espacioDespues: 4 });
        escribirTexto(limpio, { tamano: 9.5, color: [36, 48, 62], espacioDespues: 10 });
      };

      const escribirEncabezado = () => {
        doc.setFillColor(...azul);
        doc.rect(0, 0, pageWidth, 84, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('Junta de iglesia', margin, 36);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Registro #${valorPdf(junta.id)} - Generado: ${formatearFechaHora(new Date().toISOString())}`, margin, 57);
        y = 108;
      };

      escribirEncabezado();

      if (incluirFichaGeneral) {
        escribirSeccion('Ficha general');
        escribirGrid([
          { label: 'Fecha de inicio', valor: formatearFecha(junta.fecha || junta.fecha_inicio) },
          { label: 'Tipo', valor: etiquetaTipoJunta(junta.tipo) },
          { label: 'Hora de inicio', valor: formatearHora(junta.hora_inicio) },
          { label: 'Hora final', valor: formatearHora(junta.hora_fin) },
          { label: 'Moderador', valor: junta.moderador },
          { label: 'Secretaria', valor: junta.secretario },
          { label: 'Estado', valor: etiquetaEstado(junta.estado) },
          { label: 'Quorum', valor: junta.quorum_texto },
          {
            label: 'Junta anterior',
            valor: junta.junta_anterior_fecha
              ? formatearFecha(junta.junta_anterior_fecha)
              : (junta.junta_anterior_id ? `Registro #${junta.junta_anterior_id}` : 'Sin referencia')
          },
          { label: 'Total de puntos', valor: puntos.length }
        ]);

        if (textoLimpio(junta.resumen_general) || textoLimpio(junta.observaciones_generales)) {
          asegurarEspacio(18);
          y += 8;
        }
        escribirBloqueTexto('Resumen general', junta.resumen_general);
        escribirBloqueTexto('Observaciones generales', junta.observaciones_generales);
      }

      escribirSeccion('Agenda de puntos');
      if (!puntos.length) {
        escribirTexto('No hay puntos registrados para esta junta.', { tamano: 10, color: grisTexto });
      }

      puntos.forEach((punto, index) => {
        const orden = punto.numero_orden || index + 1;

        escribirGrid([
          { label: `Punto ${orden}`, valor: punto.titulo },
          { label: 'Departamento representado', valor: punto.departamento_origen }
        ]);
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...grisBorde);
        doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...grisTexto);
        doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
      }

      const fechaArchivo = String(junta.fecha || junta.fecha_inicio || '').slice(0, 10).replace(/[^0-9-]/g, '');
      const sufijo = incluirFichaGeneral ? 'ficha_y_puntos' : 'solo_puntos';
      doc.save(`junta_${fechaArchivo || 'sin_fecha'}_${nombreArchivoPdf(junta.id)}_${sufijo}.pdf`);
      notificarExito('PDF generado correctamente.');
    } catch (error) {
      notificarError(error?.mensaje || error?.message || 'No se pudo generar el PDF de la junta.');
    }
  }, []);

  const abrirSesionJunta = useCallback((item) => {
    setAccionesJunta(null);
    if (!fechaEsHoy(item?.fecha)) {
      if (fechaEsFutura(item?.fecha)) {
        notificarError(`Esta junta está por comenzar. Solo se podrá sesionar el ${formatearFecha(item.fecha)}.`);
      } else {
        notificarError('La fecha de esta junta ya pasó. Para sesionarla, primero edite la fecha de inicio.');
      }
      return;
    }
    setSesionJuntaModal(item);
  }, []);
  const renderFiltrosJuntas = () => (
    <div className="card shadow-sm juntas-filtros-card mb-3">
      <div className="card-body">
        <div className="row g-2 align-items-end juntas-filtros-content">
          <div className="col-12 col-xl-4">
            <label className="form-label form-label-sm" htmlFor="juntas_busqueda">Buscar</label>
            <SearchInput
              id="juntas_busqueda"
              value={filtros.q}
              onChange={(value) => cambiarFiltro('q', value)}
              placeholder="Buscar por junta, punto o departamento"
            />
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_estado">Estado</label>
            <select id="juntas_filtro_estado" className="form-select form-select-sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
              {ESTADO_JUNTA_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-4 col-xl-2">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_tipo">Tipo</label>
            <select id="juntas_filtro_tipo" className="form-select form-select-sm" value={filtros.tipo} onChange={(e) => cambiarFiltro('tipo', e.target.value)}>
              {TIPO_JUNTA_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4 col-xl-4">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_responsable">Responsable</label>
            <select id="juntas_filtro_responsable" className="form-select form-select-sm" value={filtros.responsable_usuario_id} onChange={(e) => cambiarFiltro('responsable_usuario_id', e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre_usuario}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4 col-xl-4">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_departamento">Departamento</label>
            <input id="juntas_filtro_departamento" type="text" className="form-control form-control-sm" value={filtros.departamento_origen} onChange={(e) => cambiarFiltro('departamento_origen', e.target.value)} />
          </div>
          <div className="col-6 col-md-4 col-xl-4">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_desde">Desde</label>
            <input id="juntas_filtro_desde" type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
          </div>
          <div className="col-6 col-md-4 col-xl-4">
            <label className="form-label form-label-sm" htmlFor="juntas_filtro_hasta">Hasta</label>
            <input id="juntas_filtro_hasta" type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderJuntas = () => (
    <>
      <div className="row g-2 g-md-3 mb-3 juntas-top-row estudios-mobile-kpi-row">
        <KpiCard label="Juntas" value={dashboard.total_juntas} icon="bi-people-fill" />
        <KpiCard label="Puntos tratados" value={dashboard.total_puntos_tratados} icon="bi-list-check" />
        <KpiCard label="Pendientes" value={dashboard.total_puntos_pendientes} icon="bi-hourglass-split" />
        <KpiCard label="Vencidos" value={dashboard.total_puntos_vencidos} icon="bi-exclamation-triangle" />
      </div>

      {renderFiltrosJuntas()}

      <div className="card shadow-sm juntas-lista-card">
        <div className="card-body p-0">
          <TablaShell className="juntas-lista-table">
            <thead>
              <tr>
                <th>Fecha de inicio</th>
                <th>Tipo</th>
                <th>Moderador</th>
                <th>Secretaría</th>
                <th>Estado</th>
                <th>Puntos</th>
                <th>Pendientes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">Cargando juntas…</td>
                </tr>
              ) : juntas.map((item) => {
                const accionesActivas = String(accionesJunta?.id || '') === String(item.id);
                return (
                  <tr key={item.id} className={`${item.id === seleccionadaId ? 'table-active' : ''} ${accionesActivas ? 'juntas-acciones-row-active' : ''}`.trim()}>
                    <td>
                      {formatearFecha(item.fecha)}
                    </td>
                    <td>{etiquetaTipoJunta(item.tipo)}</td>
                    <td>{item.moderador || '-'}</td>
                    <td>{item.secretario || '-'}</td>
                    <td><span className={`badge border ${claseEstado(item.estado)}`}>{etiquetaEstado(item.estado)}</span></td>
                    <td>{Number(item.total_puntos || 0).toLocaleString('es-CR')}</td>
                    <td>{Number(item.total_pendientes || 0).toLocaleString('es-CR')}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-outline-secondary btn-sm rounded-circle juntas-icon-action-btn ${accionesActivas ? 'is-active' : ''}`}
                        onClick={() => abrirAccionesJunta(item)}
                        title="Acciones de la junta"
                        aria-label={`Abrir acciones de la junta del ${formatearFecha(item.fecha)}`}
                      >
                        <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!juntas.length && !cargando ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">No hay juntas registradas con los filtros actuales.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>
        </div>
      </div>
    </>
  );

  const renderAsignarJunta = () => (
    <div className="card shadow-sm juntas-form-card juntas-asignar-card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="juntas-section-title mb-0">{editandoJuntaId ? 'Editar junta' : 'Asignar junta'}</div>
          <div className="d-flex align-items-center gap-2">
            {puntosTemporales.length ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm juntas-puntos-preview-btn"
                onClick={() => setMostrarPuntosTemporales(true)}
                title="Ver puntos preregistrados"
                aria-label="Ver puntos preregistrados"
              >
                <i className="bi bi-search" aria-hidden="true"></i>
                <span className="badge text-bg-light border">{puntosTemporales.length}</span>
              </button>
            ) : null}
            <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={limpiarAsignarJunta} disabled={guardando} />
            <BotonAccion icono="bi-floppy" label={editandoJuntaId ? 'Actualizar' : 'Guardar'} onClick={guardarAsignarJunta} disabled={guardando} />
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12 col-md-3">
            <label className="form-label small" htmlFor="junta_form_fecha">Fecha de inicio <span className="text-danger" aria-hidden="true">*</span></label>
            <input
              id="junta_form_fecha"
              type="date"
              className="form-control form-control-sm"
              min={fechaMinimaJunta}
              value={juntaForm.fecha}
              onChange={(e) => cambiarJuntaForm('fecha', e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small" htmlFor="junta_form_tipo">Tipo <span className="text-danger" aria-hidden="true">*</span></label>
            <select id="junta_form_tipo" className="form-select form-select-sm" value={normalizarTipoJunta(juntaForm.tipo)} onChange={(e) => cambiarJuntaForm('tipo', e.target.value)}>
              {TIPOS_JUNTA_FORM.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small" htmlFor="junta_form_inicio">Inicio <span className="text-danger" aria-hidden="true">*</span></label>
            <input id="junta_form_inicio" type="time" className="form-control form-control-sm" value={juntaForm.hora_inicio} onChange={(e) => cambiarJuntaForm('hora_inicio', e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small" htmlFor="junta_form_final">Final <span className="text-danger" aria-hidden="true">*</span></label>
            <input id="junta_form_final" type="time" className="form-control form-control-sm" value={juntaForm.hora_fin} onChange={(e) => cambiarJuntaForm('hora_fin', e.target.value)} />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small" htmlFor="junta_form_moderador">Moderador <span className="text-danger" aria-hidden="true">*</span></label>
            <select id="junta_form_moderador" className="form-select form-select-sm" value={juntaForm.moderador} onChange={(e) => cambiarJuntaForm('moderador', e.target.value)}>
              <option value="">Seleccione</option>
              {opcionesModerador.map((persona) => <option key={persona.id} value={persona.nombre}>{persona.nombre}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small" htmlFor="junta_form_secretaria">Secretaría <span className="text-danger" aria-hidden="true">*</span></label>
            <select id="junta_form_secretaria" className="form-select form-select-sm" value={juntaForm.secretario} onChange={(e) => cambiarJuntaForm('secretario', e.target.value)}>
              <option value="">Seleccione</option>
              {opcionesSecretaria.map((persona) => <option key={persona.id} value={persona.nombre}>{persona.nombre}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small" htmlFor="junta_form_quorum">Quórum <span className="text-danger" aria-hidden="true">*</span></label>
            <input
              id="junta_form_quorum"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className="form-control form-control-sm"
              value={juntaForm.quorum_texto}
              onChange={(e) => cambiarJuntaForm('quorum_texto', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <div className="form-label small">Junta anterior</div>
            <div className="alert alert-light border mb-0 py-2 small juntas-junta-anterior-info">
              {juntaForm.junta_anterior_id && juntaAnterior
                ? `${formatearFecha(juntaAnterior.fecha)} · ${etiquetaTipoJunta(juntaAnterior.tipo)}`
                : 'Se asignará automáticamente'}
            </div>
          </div>

          <div className="col-12">
            <div className="juntas-punto-preregistro">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-2">
                  <label className="form-label small" htmlFor="junta_punto_numero">Punto <span className="text-danger" aria-hidden="true">*</span></label>
                  <input id="junta_punto_numero" type="text" className="form-control form-control-sm" value={`Punto ${numeroPuntoSiguiente}`} disabled readOnly />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small" htmlFor="junta_punto_titulo">Detalle del punto <span className="text-danger" aria-hidden="true">*</span></label>
                  <input
                    id="junta_punto_titulo"
                    type="text"
                    className="form-control form-control-sm"
                    value={puntoJuntaForm.titulo}
                    onChange={(e) => cambiarPuntoJuntaForm('titulo', e.target.value)}
                    maxLength={PUNTO_JUNTA_TITULO_MAX}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label small" htmlFor="junta_punto_departamento">Departamento representado <span className="text-danger" aria-hidden="true">*</span></label>
                  <select
                    id="junta_punto_departamento"
                    className="form-select form-select-sm"
                    value={puntoJuntaForm.departamento_origen}
                    onChange={(e) => cambiarPuntoJuntaForm('departamento_origen', e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {departamentosCatalogo.map((departamento) => (
                      <option key={departamento.id} value={departamento.nombre}>{departamento.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-3 juntas-punto-actions-col">
                  <div className="d-flex gap-2 juntas-punto-actions">
                    <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={limpiarPuntoJuntaForm} disabled={guardando} />
                    <BotonAccion icono={puntoTemporalEditandoId ? 'bi-floppy' : 'bi-plus-lg'} label={puntoTemporalEditandoId ? 'Actualizar' : 'Agregar'} onClick={guardarPuntoTemporal} disabled={guardando} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm juntas-opcionales-toggle"
              onClick={() => setJuntaOpcionalesAbiertos((prev) => !prev)}
              aria-expanded={juntaOpcionalesAbiertos}
              aria-controls="junta_form_datos_opcionales"
            >
              <i className={`bi ${juntaOpcionalesAbiertos ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
              Datos opcionales
            </button>
          </div>
          {juntaOpcionalesAbiertos ? (
            <div id="junta_form_datos_opcionales" className="col-12">
              <div className="row g-3 juntas-opcionales-panel">
                <div className="col-12 col-lg-6">
                  <label className="form-label small" htmlFor="junta_form_resumen">Resumen general</label>
                  <textarea id="junta_form_resumen" className="form-control form-control-sm juntas-form-textarea" rows="3" value={juntaForm.resumen_general} onChange={(e) => cambiarJuntaForm('resumen_general', e.target.value)}></textarea>
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label small" htmlFor="junta_form_observaciones">Observaciones</label>
                  <textarea id="junta_form_observaciones" className="form-control form-control-sm juntas-form-textarea" rows="3" value={juntaForm.observaciones_generales} onChange={(e) => cambiarJuntaForm('observaciones_generales', e.target.value)}></textarea>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-3 juntas-page" data-vista={vistaActiva}>
      {vistaActiva === VISTA_RESPONSABLES ? (
        <CatalogoPersonasJunta
          form={responsableForm}
          items={responsablesFiltrados}
          departamentos={departamentosCatalogo}
          filtroTipo={responsablesFiltroTipo}
          onFiltroTipoChange={setResponsablesFiltroTipo}
          onChange={cambiarResponsableForm}
          onGuardar={guardarPersonaCatalogo}
          onLimpiar={limpiarResponsable}
          onEditar={editarResponsable}
          onEliminar={eliminarResponsable}
          editandoId={responsableEditando?.id || null}
        />
      ) : null}

      {vistaActiva === VISTA_JUNTAS ? renderJuntas() : null}

      <JuntaAccionesModal
        junta={accionesJunta}
        onCerrar={() => setAccionesJunta(null)}
        onVerResumen={verResumenDesdeAcciones}
        onEditar={editarDesdeJuntas}
        onEliminar={eliminarDesdeAcciones}
        onPdf={abrirPdfOpciones}
        onSesionar={abrirSesionJunta}
      />
      <JuntaResumenModal
        junta={resumenJuntaModal}
        onCerrar={() => setResumenJuntaModal(null)}
      />
      <JuntaPdfOpcionesModal
        junta={pdfJuntaModal}
        onCerrar={() => setPdfJuntaModal(null)}
        onGenerar={generarPdfJunta}
      />
      <SesionarJuntaModal
        junta={sesionJuntaModal}
        onCerrar={() => setSesionJuntaModal(null)}
        onActualizada={refrescarJuntas}
      />

      {vistaActiva === VISTA_ASIGNAR ? renderAsignarJunta() : null}

      <DepartamentosModal
        abierto={mostrarDepartamentos}
        items={departamentosCatalogo}
        form={departamentoForm}
        editandoId={departamentoEditandoId}
        onCerrar={() => setMostrarDepartamentos(false)}
        onChange={cambiarDepartamentoForm}
        onGuardar={guardarDepartamento}
        onEditar={editarDepartamento}
        onEliminar={eliminarDepartamento}
        onLimpiar={limpiarDepartamento}
      />
      <PuntosTemporalesModal
        abierto={mostrarPuntosTemporales}
        puntos={puntosTemporales}
        onCerrar={() => setMostrarPuntosTemporales(false)}
        onEditar={editarPuntoTemporal}
        onEliminar={eliminarPuntoTemporal}
      />
    </div>
  );
}

