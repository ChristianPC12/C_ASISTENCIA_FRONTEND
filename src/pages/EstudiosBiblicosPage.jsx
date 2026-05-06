import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchInput from '../components/ui/SearchInput';
import VisitasGeneralView from '../components/campanas/VisitasGeneralView';
import { useEstudiosBiblicos } from '../hooks/useEstudiosBiblicos';
import campanaApi from '../api/campanaApi';
import estudioBiblicoApi from '../api/estudioBiblicoApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../config/constants';
import { notificarError } from '../utils/notify';
import {
  EVENT_ESTUDIOS_ABRIR_ASIGNAR,
  EVENT_ESTUDIOS_ABRIR_INSTRUCTORES,
  EVENT_ESTUDIOS_ABRIR_LISTA,
  EVENT_ESTUDIOS_ABRIR_REGISTRO,
  EVENT_ESTUDIOS_ABRIR_VISITAS,
  EVENT_ESTUDIOS_VISTA_ACTIVA
} from '../config/events';

const VISTA_VISITAS = 'VISITAS';
const VISTA_ESTUDIOS = 'ESTUDIOS';
const VISTA_INSTRUCTORES = 'INSTRUCTORES';
const VISTA_ASIGNAR = 'ASIGNAR';
const VISTA_REGISTRO = 'REGISTRO';
const INSTRUCTORES_LISTA = 'INSTRUCTORES_LISTA';
const INSTRUCTORES_FORMULARIO = 'INSTRUCTORES_FORMULARIO';
const INSTRUCTOR_NOMBRE_MAX = 35;
const ASIGNAR_OBSERVACIONES_MAX_CARACTERES = 110;
const ASIGNAR_OBSERVACIONES_MAX_SALTOS = 3;
const REGISTRO_OBSERVACIONES_MAX = 500;
const REGISTRO_OBSERVACIONES_MAX_SALTOS = 2;
const REGISTRO_JUSTIFICACION_MAX = 300;
const MS_DIA = 24 * 60 * 60 * 1000;

const ESTADO_FINALIZADO = 'CERRADO';
const ESTADOS_CERRADOS = ['NO_CONTINUA', 'BAUTIZADO', ESTADO_FINALIZADO];

const AVANCE_GENERAL_OPCIONES = [
  { valor: 'SIN_CAMBIOS', etiqueta: 'Sin cambios', progreso: 0 },
  { valor: 'INTERES_INICIAL', etiqueta: 'Interes inicial', progreso: 15 },
  { valor: 'RECEPTIVO', etiqueta: 'Receptivo', progreso: 30 },
  { valor: 'PARTICIPATIVO', etiqueta: 'Participativo', progreso: 50 },
  { valor: 'COMPROMETIDO', etiqueta: 'Comprometido', progreso: 70 },
  { valor: 'PREPARANDO_DECISION', etiqueta: 'Preparando decision', progreso: 88 },
  { valor: 'DECISION_TOMADA', etiqueta: 'Decision tomada', progreso: 100 }
];
const AVANCE_GENERAL_INICIAL = 'RECEPTIVO';

function progresoSugeridoAvance(valor, fallback = 0) {
  const opcion = AVANCE_GENERAL_OPCIONES.find((item) => item.valor === valor);
  return opcion ? opcion.progreso : fallback;
}

const ESTADO_OPCIONES = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'ASIGNADO', etiqueta: 'Asignado' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'PAUSADO', etiqueta: 'Pausado' },
  { valor: ESTADO_FINALIZADO, etiqueta: 'Finalizado' }
];

const ESTADO_ETIQUETAS = {
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  PAUSADO: 'Pausado',
  [ESTADO_FINALIZADO]: 'Finalizado'
};

const FRECUENCIA_OPCIONES = [
  { valor: 'SEMANA', etiqueta: 'Semana' },
  { valor: 'MES', etiqueta: 'Mes' },
  { valor: 'TRIMESTRE', etiqueta: 'Trimestre' }
];

function hoyFechaHoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function hoyFechaLocal() {
  return hoyFechaHoraLocal().slice(0, 10);
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

function obtenerEstadoExpiracion(fechaExpira) {
  if (!fechaExpira) return { texto: 'Sin fecha', clase: 'bg-secondary' };

  const hoy = new Date();
  const expira = new Date(fechaExpira);
  const diffMs = expira.getTime() - hoy.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return { texto: 'Expirada', clase: 'bg-danger' };
  if (diffDias <= 7) return { texto: 'Por vencer', clase: 'bg-warning text-dark' };
  return { texto: 'Vigente', clase: 'bg-success' };
}

function normalizarEstadoEstudio(estado) {
  const valor = String(estado || '').toUpperCase();
  if (ESTADOS_CERRADOS.includes(valor)) return ESTADO_FINALIZADO;
  if (valor === 'PAUSADO') return 'PAUSADO';
  if (['CONTACTADO', 'EN_PROCESO', 'LISTO_DECISION', 'CANDIDATO_BAUTISMAL'].includes(valor)) return 'EN_PROCESO';
  return 'ASIGNADO';
}

function etiquetaEstado(estado) {
  return ESTADO_ETIQUETAS[normalizarEstadoEstudio(estado)] || ESTADO_ETIQUETAS.ASIGNADO;
}

function claseEstado(estado) {
  const estadoVista = normalizarEstadoEstudio(estado);
  if (estadoVista === ESTADO_FINALIZADO) {
    return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
  }
  if (estadoVista === 'PAUSADO') {
    return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
  }
  if (estadoVista === 'ASIGNADO') {
    return 'bg-info-subtle text-info-emphasis border-info-subtle';
  }
  return 'bg-success-subtle text-success-emphasis border-success-subtle';
}

function normalizarTextoBusqueda(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function valorTexto(item, ...campos) {
  for (const campo of campos) {
    const valor = item?.[campo];
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      return String(valor).trim();
    }
  }
  return '';
}

function filtrarVisitasLocal(items, q) {
  const termino = normalizarTextoBusqueda(q);
  if (!termino) return items;
  return items.filter((item) => normalizarTextoBusqueda([
    item.nombre_snapshot,
    item.nombre_completo,
    item.telefono_snapshot,
    item.contacto_telefono,
    item.procedencia,
    item.contacto_correo,
    item.contacto_direccion,
    item.contacto_barrio_comunidad
  ].filter(Boolean).join(' ')).includes(termino));
}

function ordenarSeleccionadosPrimero(items, seleccionados) {
  const posicionSeleccion = new Map((seleccionados || []).map((item, index) => [String(item.id), index]));

  return [...items]
    .map((item, index) => ({ item, index, posicion: posicionSeleccion.get(String(item.id)) }))
    .sort((a, b) => {
      const aSeleccionado = a.posicion !== undefined;
      const bSeleccionado = b.posicion !== undefined;

      if (aSeleccionado && bSeleccionado) return a.posicion - b.posicion;
      if (aSeleccionado) return -1;
      if (bSeleccionado) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function etiquetaSeguimientoVisita(clave) {
  const etiquetas = {
    PENDIENTE: 'Pendiente',
    CONTACTADO: 'Contactado',
    ESTUDIO_BIBLICO: 'Estudio biblico',
    NO_LOCALIZABLE: 'No localizable',
    CERRADO: 'Cerrado'
  };
  return etiquetas[clave] || clave || '-';
}

function nombreVisitaAsignar(visita) {
  return valorTexto(visita, 'nombre_snapshot', 'nombre_completo') || `Visita ${visita?.id || ''}`.trim();
}

function visitaTieneEstudioActivo(visita) {
  return Number(visita?.estudio_biblico_activo_id || 0) > 0;
}

function mensajeVisitaActiva(visita) {
  return `La visita "${nombreVisitaAsignar(visita)}" ya tiene un estudio biblico activo. Quitela para continuar.`;
}

function limitarObservacionesAsignar(valor) {
  const texto = String(valor || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lineas = texto.split('\n').slice(0, ASIGNAR_OBSERVACIONES_MAX_SALTOS + 1);
  return lineas.join('\n').slice(0, ASIGNAR_OBSERVACIONES_MAX_CARACTERES);
}

function limitarObservacionesRegistro(valor) {
  const texto = String(valor || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lineas = texto.split('\n').slice(0, REGISTRO_OBSERVACIONES_MAX_SALTOS + 1);
  return lineas.join('\n').slice(0, REGISTRO_OBSERVACIONES_MAX);
}

function textoObservacionEstudio(estudio) {
  const texto = String(estudio?.observaciones || '').trim();
  return /^Visitas del estudio:\s.+\.$/i.test(texto) ? '' : texto;
}

function tieneObservacionEstudio(estudio) {
  return textoObservacionEstudio(estudio) !== '';
}

function etiquetaFrecuencia(estudio) {
  const periodo = FRECUENCIA_OPCIONES.find((op) => op.valor === estudio?.frecuencia_periodo)?.etiqueta || 'Semana';
  const cantidad = Number(estudio?.frecuencia_cantidad || 1);
  return `${cantidad} por ${periodo.toLowerCase()}`;
}

function crearFechaLocal(valor, finDelDia = false) {
  if (valor instanceof Date) {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  const texto = String(valor || '').trim();
  if (!texto) return null;
  const normalizado = texto.replace(' ', 'T');
  const base = normalizado.includes('T')
    ? normalizado
    : `${normalizado.slice(0, 10)}T${finDelDia ? '23:59:59' : '00:00:00'}`;
  const fecha = new Date(base);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function inicioDia(fecha) {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function sumarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function sumarMesesAnclado(fecha, meses) {
  const copia = new Date(fecha);
  const dia = copia.getDate();
  copia.setDate(1);
  copia.setMonth(copia.getMonth() + meses);
  const ultimoDia = new Date(copia.getFullYear(), copia.getMonth() + 1, 0).getDate();
  copia.setDate(Math.min(dia, ultimoDia));
  return copia;
}

function mesesDesdeInicio(inicio, fecha) {
  let meses = (fecha.getFullYear() - inicio.getFullYear()) * 12 + (fecha.getMonth() - inicio.getMonth());
  if (meses < 0) return -1;
  while (sumarMesesAnclado(inicio, meses + 1).getTime() <= fecha.getTime()) {
    meses += 1;
  }
  while (meses > 0 && sumarMesesAnclado(inicio, meses).getTime() > fecha.getTime()) {
    meses -= 1;
  }
  return meses;
}

function etiquetaPeriodoEstudio(estudio, indice) {
  const periodo = String(estudio?.frecuencia_periodo || 'SEMANA').toUpperCase();
  if (periodo === 'MES') return `Mes ${indice + 1}`;
  if (periodo === 'TRIMESTRE') return `Trimestre ${indice + 1}`;
  return `Semana ${indice + 1}`;
}

function obtenerPeriodoEstudioPorIndice(estudio, indice) {
  const inicio = crearFechaLocal(estudio?.fecha_inicio);
  if (!inicio || indice < 0) return null;
  const periodo = String(estudio?.frecuencia_periodo || 'SEMANA').toUpperCase();
  let inicioPeriodo;
  let siguientePeriodo;

  if (periodo === 'MES' || periodo === 'TRIMESTRE') {
    const mesesPorPeriodo = periodo === 'TRIMESTRE' ? 3 : 1;
    inicioPeriodo = sumarMesesAnclado(inicio, indice * mesesPorPeriodo);
    siguientePeriodo = sumarMesesAnclado(inicio, (indice + 1) * mesesPorPeriodo);
  } else {
    inicioPeriodo = sumarDias(inicio, indice * 7);
    siguientePeriodo = sumarDias(inicioPeriodo, 7);
  }

  return {
    indice,
    inicio: inicioPeriodo,
    fin: new Date(siguientePeriodo.getTime() - 1000),
    etiqueta: etiquetaPeriodoEstudio(estudio, indice)
  };
}

function obtenerPeriodoEstudio(estudio, valorFecha = new Date()) {
  const inicio = crearFechaLocal(estudio?.fecha_inicio);
  const fecha = crearFechaLocal(valorFecha);
  if (!inicio || !fecha || fecha.getTime() < inicio.getTime()) return null;

  const periodo = String(estudio?.frecuencia_periodo || 'SEMANA').toUpperCase();
  let indice = 0;
  if (periodo === 'MES' || periodo === 'TRIMESTRE') {
    const meses = mesesDesdeInicio(inicio, fecha);
    indice = Math.floor(meses / (periodo === 'TRIMESTRE' ? 3 : 1));
  } else {
    const dias = Math.floor((inicioDia(fecha).getTime() - inicioDia(inicio).getTime()) / MS_DIA);
    indice = Math.floor(dias / 7);
  }

  return obtenerPeriodoEstudioPorIndice(estudio, indice);
}

function esSesionJustificada(sesion) {
  return String(sesion?.asistencia || '').toUpperCase() === 'JUSTIFICADA';
}

function sesionesDePeriodo(sesiones, periodo) {
  if (!periodo) return [];
  return (sesiones || []).filter((sesion) => {
    const fecha = crearFechaLocal(sesion?.fecha);
    return fecha && fecha.getTime() >= periodo.inicio.getTime() && fecha.getTime() <= periodo.fin.getTime();
  });
}

function resumenPeriodoEstudio(estudio, sesiones, periodo, periodoActual) {
  const sesionesPeriodo = sesionesDePeriodo(sesiones, periodo);
  const justificadas = sesionesPeriodo.filter(esSesionJustificada).length;
  const registradas = Math.max(0, sesionesPeriodo.length - justificadas);
  const requeridas = Math.max(1, Number(estudio?.frecuencia_cantidad || 1));
  const cubiertas = registradas + justificadas;
  const faltantes = Math.max(0, requeridas - cubiertas);
  const esActual = periodoActual && periodo.indice === periodoActual.indice;
  const esVencido = periodoActual && periodo.indice < periodoActual.indice;
  let estado = 'pendiente';

  if (faltantes === 0 && justificadas > 0 && registradas < requeridas) {
    estado = 'justificado';
  } else if (faltantes === 0) {
    estado = 'completo';
  } else if (esVencido) {
    estado = 'vencido';
  } else if (esActual) {
    estado = 'actual';
  }

  return {
    ...periodo,
    requeridas,
    registradas,
    justificadas,
    cubiertas,
    faltantes,
    estado,
    esActual,
    esVencido
  };
}

function crearResumenRegistro(estudio, sesiones) {
  const periodoActual = obtenerPeriodoEstudio(estudio);
  if (!estudio || !periodoActual) {
    return { periodoActual: null, periodos: [], pendientes: [], primerJustificable: null };
  }

  const periodos = Array.from({ length: periodoActual.indice + 1 }, (_, indice) => (
    resumenPeriodoEstudio(estudio, sesiones, obtenerPeriodoEstudioPorIndice(estudio, indice), periodoActual)
  )).filter(Boolean);
  const pendientes = periodos.filter((periodo) => periodo.faltantes > 0);
  const primerJustificable = pendientes.find((periodo) => periodo.esVencido) || pendientes.find((periodo) => periodo.esActual) || null;

  return { periodoActual, periodos, pendientes, primerJustificable };
}

function fechaHoraLocalDesdeFecha(fecha) {
  const copia = new Date(fecha);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 16);
}

function fechaHoraDentroPeriodo(periodo) {
  if (!periodo) return hoyFechaHoraLocal();
  const ahora = crearFechaLocal(hoyFechaHoraLocal());
  if (ahora && ahora.getTime() >= periodo.inicio.getTime() && ahora.getTime() <= periodo.fin.getTime()) {
    return hoyFechaHoraLocal();
  }
  return fechaHoraLocalDesdeFecha(periodo.inicio);
}

function fechaEstaEnPeriodo(valor, periodo) {
  const fecha = crearFechaLocal(valor);
  return Boolean(
    fecha
    && periodo
    && fecha.getTime() >= periodo.inicio.getTime()
    && fecha.getTime() <= periodo.fin.getTime()
  );
}

function formatearFechaDesdeDate(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '-';
  const copia = new Date(fecha);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return formatearFecha(copia.toISOString().slice(0, 10));
}

function normalizarDetalleEstudioRespuesta(res) {
  return res?.datos?.item || res?.datos || null;
}

function nombreVisitaEstudio(estudio, visita = null) {
  return valorTexto(visita || {}, 'contacto_nombre', 'nombre_snapshot', 'nombre_completo')
    || valorTexto(estudio || {}, 'contacto_nombre', 'nombre_snapshot', 'persona_nombre')
    || 'Visita del estudio';
}

function crearVisitaDetalleEstudio(estudio, visita = null) {
  const base = estudio || {};
  const item = visita || {};
  return {
    ...base,
    ...item,
    contacto_nombre: nombreVisitaEstudio(base, item),
    contacto_telefono: valorTexto(item, 'contacto_telefono', 'telefono_snapshot', 'telefono') || base.contacto_telefono,
    contacto_correo: valorTexto(item, 'contacto_correo', 'correo') || base.contacto_correo,
    contacto_direccion: valorTexto(item, 'contacto_direccion', 'direccion') || base.contacto_direccion,
    contacto_barrio_comunidad: valorTexto(item, 'contacto_barrio_comunidad', 'barrio_comunidad') || base.contacto_barrio_comunidad
  };
}

function visitasDetalleEstudio(estudio) {
  if (!estudio) return [];
  const visitas = Array.isArray(estudio.visitas) ? estudio.visitas : [];
  if (visitas.length === 0) {
    return [crearVisitaDetalleEstudio(estudio)];
  }
  return visitas.map((visita) => crearVisitaDetalleEstudio(estudio, visita));
}

function responsablesDetalleEstudio(estudio) {
  const responsables = Array.isArray(estudio?.responsables) ? estudio.responsables : [];
  if (responsables.length > 0) {
    return responsables.reduce((lista, item) => {
      const responsable = {
        id: Number(item.responsable_usuario_id || item.id || 0),
        nombre: valorTexto(item, 'nombre_completo', 'responsable_usuario_nombre', 'usuario') || 'Instructor asignado',
        usuario: valorTexto(item, 'usuario')
      };
      if (responsable.id > 0 || responsable.nombre) {
        lista.push(responsable);
      }
      return lista;
    }, []);
  }

  const responsableId = Number(estudio?.responsable_usuario_id || 0);
  if (!responsableId && !estudio?.responsable_usuario_nombre) return [];
  return [{
    id: responsableId,
    nombre: valorTexto(estudio, 'responsable_usuario_nombre') || 'Instructor asignado',
    usuario: ''
  }];
}

function nombreUsuarioSesion(usuario) {
  return valorTexto(usuario || {}, 'nombre_completo', 'usuario') || 'este instructor';
}

function estudioTienePendienteLista(estudio) {
  const periodoActual = obtenerPeriodoEstudio(estudio);
  if (!periodoActual) return false;

  const frecuencia = Math.max(1, Number(estudio?.frecuencia_cantidad || 1));
  const totalSesiones = Math.max(0, Number(estudio?.total_sesiones_responsable ?? estudio?.total_sesiones ?? 0));
  const requeridasAcumuladas = frecuencia * (periodoActual.indice + 1);
  if (totalSesiones < requeridasAcumuladas) return true;

  const ultimaSesion = crearFechaLocal(estudio?.fecha_ultima_sesion);
  return !ultimaSesion || ultimaSesion.getTime() < periodoActual.inicio.getTime();
}

function crearPasosPeriodoActual(periodo) {
  if (!periodo) return [];
  const total = Math.max(1, Number(periodo.requeridas || 1));
  const registradas = Math.min(total, Math.max(0, Number(periodo.registradas || 0)));
  const justificadas = Math.min(total - registradas, Math.max(0, Number(periodo.justificadas || 0)));

  return Array.from({ length: total }, (_, index) => {
    const posicion = index + 1;
    if (index < registradas) {
      return { id: `registro-${posicion}`, estado: 'registrado', etiqueta: `Registro ${posicion}` };
    }
    if (index < registradas + justificadas) {
      return { id: `justificado-${posicion}`, estado: 'justificado', etiqueta: `Justificado ${posicion}` };
    }
    return { id: `pendiente-${posicion}`, estado: 'pendiente', etiqueta: `Pendiente ${posicion}` };
  });
}

function KpiCard({ label, value, icon, action = null }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm estudios-kpi-card h-100">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="estudios-kpi-label">{label}</span>
            <span className="d-inline-flex align-items-center gap-1">
              {action}
              <i className={`bi ${icon} text-primary ${action ? 'd-none d-md-inline-block' : ''}`} aria-hidden="true"></i>
            </span>
          </div>
          <div className="estudios-kpi-value">{Number(value || 0).toLocaleString('es-CR')}</div>
        </div>
      </div>
    </div>
  );
}

function EstudiosFiltrosContent({ idPrefix, filtros, cambiarFiltro }) {
  return (
    <div className="row g-2 align-items-end">
      <div className="col-12 col-lg-5">
        <label htmlFor={`${idPrefix}-busqueda`} className="form-label form-label-sm">Buscar</label>
        <SearchInput
          id={`${idPrefix}-busqueda`}
          value={filtros.q}
          onChange={(valor) => cambiarFiltro('q', valor)}
          placeholder="Visita, instructor, telefono o material"
        />
      </div>
      <div className="col-6 col-lg-3">
        <label htmlFor={`${idPrefix}-estado`} className="form-label form-label-sm">Estado</label>
        <select id={`${idPrefix}-estado`} className="form-select form-select-sm" value={filtros.estado_general} onChange={(e) => cambiarFiltro('estado_general', e.target.value)}>
          {ESTADO_OPCIONES.map((opcion) => (
            <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
          ))}
        </select>
      </div>
      <div className="col-6 col-lg-2">
        <label htmlFor={`${idPrefix}-desde`} className="form-label form-label-sm">Desde</label>
        <input id={`${idPrefix}-desde`} type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
      </div>
      <div className="col-6 col-lg-2">
        <label htmlFor={`${idPrefix}-hasta`} className="form-label form-label-sm">Hasta</label>
        <input id={`${idPrefix}-hasta`} type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
      </div>
    </div>
  );
}

function MobileFilterSheet({ abierto, titulo, onCerrar, children }) {
  if (!abierto) return null;

  return (
    <div
      className="mobile-filter-overlay d-md-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="mobile-filter-sheet-head">
          <h5 className="mb-0">{titulo}</h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="mobile-filter-sheet-body">{children}</div>
      </div>
    </div>
  );
}

function ObservacionEstudioModal({ estudio, onCerrar }) {
  if (!estudio || !tieneObservacionEstudio(estudio)) return null;
  const observacion = textoObservacionEstudio(estudio);

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onCerrar();
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar observacion del estudio"
    >
      <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '560px', width: '95%' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom">
          <div>
            <h5 className="mb-0">ObservaciÃ³n del estudio</h5>
            <div className="small text-muted">{estudio.contacto_nombre || 'Estudio bÃ­blico'}</div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="py-3">
          <p className="mb-0 estudios-observacion-modal-text">{observacion}</p>
        </div>
        <div className="pt-3 border-top text-end">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function DetalleVisitaModal({ estudio, onCerrar }) {
  if (!estudio) return null;

  const filas = [
    ['Nombre', estudio.contacto_nombre],
    ['TelÃ©fono', estudio.contacto_telefono],
    ['Correo', estudio.contacto_correo],
    ['DirecciÃ³n', estudio.contacto_direccion],
    ['Barrio / comunidad', estudio.contacto_barrio_comunidad],
    ['Instructor', estudio.responsable_usuario_nombre],
    ['Cargo', estudio.responsable_usuario_cargo],
    ['Frecuencia', etiquetaFrecuencia(estudio)],
    ['Inicio', formatearFecha(estudio.fecha_inicio)]
  ].filter(([, valor]) => String(valor || '').trim() !== '');

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onCerrar();
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar detalle de la visita"
    >
      <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '560px', width: '95%' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom">
          <h5 className="mb-0">Detalle de la visita</h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="py-3 d-flex flex-column gap-2">
          {filas.map(([label, value]) => (
            <div key={label} className="estudios-detalle-row">
              <span className="text-muted">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="pt-3 border-top text-end">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function EstudiosMainView({
  filtros,
  cambiarFiltro,
  dashboard,
  estudios,
  cargando,
  seleccionadoId,
  setSeleccionadoId,
  cambiarEstadoEstudio
}) {
  const [detalleVisita, setDetalleVisita] = useState(null);
  const [observacionEstudio, setObservacionEstudio] = useState(null);
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);

  return (
    <>
      <div className="row g-2 g-md-3 mb-3 estudios-top-row estudios-mobile-kpi-row">
        <KpiCard label="Total" value={dashboard.total_estudios ?? estudios.length} icon="bi-journals" />
        <KpiCard label="Activos trimestre" value={dashboard.total_activos_trimestre} icon="bi-calendar3" />
        <KpiCard label="Pausados" value={dashboard.total_pausados} icon="bi-pause-circle" />
        <KpiCard
          label="Finalizados"
          value={dashboard.total_concluidos}
          icon="bi-check2-circle"
          action={(
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-circle d-md-none align-items-center justify-content-center estudios-mobile-filter-btn"
              onClick={() => setMostrarFiltrosMovil(true)}
              title="Filtros"
              aria-label="Abrir filtros de estudios"
            >
              <i className="bi bi-funnel" aria-hidden="true"></i>
            </button>
          )}
        />
      </div>

      <div className="card shadow-sm mb-3 estudios-filtros-card estudios-filtros-card-desktop">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-5">
              <label htmlFor="estudios-busqueda" className="form-label form-label-sm">Buscar</label>
              <SearchInput
                id="estudios-busqueda"
                value={filtros.q}
                onChange={(valor) => cambiarFiltro('q', valor)}
                placeholder="Visita, instructor, telÃ©fono o material"
              />
            </div>
            <div className="col-6 col-lg-3">
              <label htmlFor="estudios-filtro-estado" className="form-label form-label-sm">Estado</label>
              <select id="estudios-filtro-estado" className="form-select form-select-sm" value={filtros.estado_general} onChange={(e) => cambiarFiltro('estado_general', e.target.value)}>
                {ESTADO_OPCIONES.map((opcion) => (
                  <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="estudios-filtro-desde" className="form-label form-label-sm">Desde</label>
              <input id="estudios-filtro-desde" type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="estudios-filtro-hasta" className="form-label form-label-sm">Hasta</label>
              <input id="estudios-filtro-hasta" type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <MobileFilterSheet abierto={mostrarFiltrosMovil} titulo="Filtros" onCerrar={() => setMostrarFiltrosMovil(false)}>
        <EstudiosFiltrosContent idPrefix="estudios-mobile" filtros={filtros} cambiarFiltro={cambiarFiltro} />
      </MobileFilterSheet>

      <div className="card shadow-sm estudios-lista-card">
        <div className="card-body p-0">
          <div className="tabla-registros-scroll estudios-tabla-scroll">
              <table className="table table-striped table-hover align-middle mb-0 tabla-registros estudios-lista-table">
                <thead className="tabla-registros-thead">
                  <tr>
                    <th>Visita</th>
                    <th>Instructor</th>
                    <th>Frecuencia</th>
                    <th>Inicio</th>
                    <th>Ãšltima sesiÃ³n</th>
                    <th>Estado</th>
                    <th className="text-start">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando && (
                    <tr><td colSpan="7" className="text-center text-muted py-4">Cargando...</td></tr>
                  )}
                  {!cargando && estudios.length === 0 && (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No hay estudios con esos filtros.</td></tr>
                  )}
                  {!cargando && estudios.map((item) => {
                    const estadoVista = normalizarEstadoEstudio(item.estado_general);
                    const cerrado = estadoVista === ESTADO_FINALIZADO;
                    const pausado = estadoVista === 'PAUSADO';
                    return (
                      <tr key={item.id} className={seleccionadoId === item.id ? 'table-active' : ''}>
                        <td>
                          <button type="button" className="estudios-visita-link" onClick={() => setSeleccionadoId(item.id)}>
                            {item.contacto_nombre}
                          </button>
                          <div className="small text-muted">{item.contacto_telefono || 'Sin telÃ©fono'}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.responsable_usuario_nombre || 'Sin instructor'}</div>
                          {item.responsable_usuario_cargo && <div className="small text-muted">{item.responsable_usuario_cargo}</div>}
                        </td>
                        <td>{etiquetaFrecuencia(item)}</td>
                        <td>{formatearFecha(item.fecha_inicio)}</td>
                        <td>{formatearFecha(item.fecha_ultima_sesion)}</td>
                        <td><span className={`badge ${claseEstado(item.estado_general)}`}>{etiquetaEstado(item.estado_general)}</span></td>
                        <td className="text-start">
                          <div className="d-inline-flex gap-2">
                            {tieneObservacionEstudio(item) && (
                              <button type="button" className="btn btn-outline-primary btn-sm rounded-circle estudios-icon-btn" onClick={() => setObservacionEstudio(item)} title="Ver observaciÃ³n" aria-label="Ver observaciÃ³n del estudio">
                                <i className="bi bi-question-lg" aria-hidden="true"></i>
                              </button>
                            )}
                            <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => setDetalleVisita(item)} title="Ver visita" aria-label="Ver visita">
                              <i className="bi bi-search" aria-hidden="true"></i>
                            </button>
                            {cerrado ? (
                              <button type="button" className="btn btn-outline-success btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'EN_PROCESO', 'Reactivado desde estudios bÃ­blicos.')} title="Reactivar" aria-label="Reactivar estudio">
                                <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                              </button>
                            ) : (
                              <>
                                {pausado ? (
                                  <button type="button" className="btn btn-outline-success btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'EN_PROCESO', 'Reanudado desde estudios bÃ­blicos.')} title="Reanudar" aria-label="Reanudar estudio">
                                    <i className="bi bi-play-fill" aria-hidden="true"></i>
                                  </button>
                                ) : (
                                  <button type="button" className="btn btn-outline-warning btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'PAUSADO', 'Pausado desde estudios bÃ­blicos.')} title="Pausar" aria-label="Pausar estudio">
                                    <i className="bi bi-pause-fill" aria-hidden="true"></i>
                                  </button>
                                )}
                                <button type="button" className="btn btn-outline-danger btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, ESTADO_FINALIZADO, 'Finalizado desde estudios bÃ­blicos.')} title="Finalizar" aria-label="Finalizar estudio">
                                  <i className="bi bi-flag" aria-hidden="true"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      <DetalleVisitaModal estudio={detalleVisita} onCerrar={() => setDetalleVisita(null)} />
      <ObservacionEstudioModal estudio={observacionEstudio} onCerrar={() => setObservacionEstudio(null)} />
    </>
  );
}

function InstructorPanelHeader({ seccionActiva, editandoInstructorId, onMostrarLista, onMostrarFormulario }) {
  return (
    <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
      <div className="admin-panel-header-top">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Instructores bÃ­blicos</h5>
        <div className="admin-panel-header-actions">
          <button
            type="button"
            className={`admin-usuarios-switch-btn ${seccionActiva === INSTRUCTORES_LISTA ? 'is-active' : ''}`}
            onClick={onMostrarLista}
            title="Instructores"
            aria-label="Instructores"
          >
            <i className="bi bi-people" aria-hidden="true"></i>
            <span className="admin-usuarios-switch-btn-label">Instructores</span>
          </button>
          <button
            type="button"
            className={`admin-usuarios-switch-btn ${seccionActiva === INSTRUCTORES_FORMULARIO ? 'is-active' : ''}`}
            onClick={onMostrarFormulario}
            title={editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}
            aria-label={editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}
          >
            <i className="bi bi-person-plus" aria-hidden="true"></i>
            <span className="admin-usuarios-switch-btn-label">{editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructoresLista({ instructores, resumen, onEditar, onEliminar }) {
  return (
    <>
      <div className="admin-usuarios-resumen estudios-instructores-resumen mb-3">
        <div className="admin-usuarios-resumen-item">
          <span className="admin-usuarios-resumen-label">Total</span>
          <strong className="admin-usuarios-resumen-value">{resumen.total}</strong>
        </div>
        <div className="admin-usuarios-resumen-item">
          <span className="admin-usuarios-resumen-label">Activos</span>
          <strong className="admin-usuarios-resumen-value">{resumen.activos}</strong>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Usuarios instructores</h5>
          <span className="badge bg-light text-dark">{instructores.length} instructores</span>
        </div>
        <div className="card-body">
          {instructores.length === 0 ? (
            <div className="alert alert-iasd text-center">No hay instructores registrados.</div>
          ) : (
            <div className="table-responsive admin-tabla-scroll-x admin-usuarios-table-scroll-x">
              <div className="admin-usuarios-table-wrap estudios-instructores-table-wrap">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Cargo</th>
                      <th className="text-center">Rol</th>
                      <th className="text-center">Estado</th>
                      <th className="text-center">Expira</th>
                      <th>Creado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructores.map((item) => {
                      const estadoExpiracion = obtenerEstadoExpiracion(item.password_expira_en);
                      const rol = item.rol || 'INSTRUCTOR_BIBLICO';

                      return (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td className="fw-semibold">{item.nombre_completo}</td>
                          <td>{item.usuario}</td>
                          <td>{item.cargo || '-'}</td>
                          <td className="text-center">
                            <span className="badge bg-secondary">
                              {rol}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${item.activo ? 'bg-success' : 'bg-danger'}`}>
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="text-center">
                            {item.password_expira_en ? (
                              <div className="d-flex flex-column align-items-center gap-1">
                                <span className="small text-nowrap">{formatearFecha(item.password_expira_en)}</span>
                                <span className={`badge ${estadoExpiracion.clase}`}>
                                  {estadoExpiracion.texto}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted small">No disponible</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{formatearFechaHora(item.creado_en)}</td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <button type="button" className="btn btn-outline-primary btn-sm admin-table-icon-btn" onClick={() => onEditar(item)} title="Editar" aria-label="Editar instructor">
                                <i className="bi bi-pencil-square" aria-hidden="true"></i>
                              </button>
                              {item.activo && (
                                <button type="button" className="btn btn-outline-danger btn-sm admin-table-icon-btn" onClick={() => onEliminar(item.id)} title="Desactivar" aria-label="Desactivar instructor">
                                  <i className="bi bi-person-x" aria-hidden="true"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InstructorFormPanel({
  instructorForm,
  errores,
  refs,
  editandoInstructorId,
  requeridoPassword,
  guardando,
  cambiar,
  intentarGuardarInstructor,
  limpiarInstructor
}) {
  return (
    <div className="card shadow-sm mb-4 usuario-form-card">
      <div className="card-body usuario-form-body">
        <div className="usuario-form">
          <div className="row g-3 usuario-form-grid">
            <div className="col-md-6">
              <label htmlFor="instructor-nombre" className="form-label">Nombre completo <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.nombre_completo} id="instructor-nombre" className={`form-control ${errores.nombre_completo ? 'is-invalid' : ''}`} value={instructorForm.nombre_completo} onChange={(e) => cambiar('nombre_completo', e.target.value.slice(0, INSTRUCTOR_NOMBRE_MAX))} placeholder="Nombre completo del instructor" maxLength={INSTRUCTOR_NOMBRE_MAX} disabled={guardando} />
              {errores.nombre_completo && <div className="invalid-feedback">{errores.nombre_completo}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-usuario" className="form-label">Usuario <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.usuario} id="instructor-usuario" className={`form-control ${errores.usuario ? 'is-invalid' : ''}`} value={instructorForm.usuario} onChange={(e) => cambiar('usuario', e.target.value)} placeholder="Nombre de usuario" maxLength={50} autoComplete="off" disabled={guardando} />
              {errores.usuario && <div className="invalid-feedback">{errores.usuario}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-cargo" className="form-label">Cargo <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.cargo} id="instructor-cargo" className={`form-control ${errores.cargo ? 'is-invalid' : ''}`} value={instructorForm.cargo} onChange={(e) => cambiar('cargo', e.target.value)} placeholder="Pastor, laico, director..." maxLength={120} disabled={guardando} />
              {errores.cargo && <div className="invalid-feedback">{errores.cargo}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-password" className="form-label">
                {editandoInstructorId ? 'Nueva contraseÃ±a ' : 'ContraseÃ±a '}
                {requeridoPassword && <span className="text-danger" aria-hidden="true">*</span>}
                {editandoInstructorId && <small className="text-muted">(opcional)</small>}
              </label>
              <input ref={refs.password} id="instructor-password" type="password" className={`form-control ${errores.password ? 'is-invalid' : ''}`} value={instructorForm.password} onChange={(e) => cambiar('password', e.target.value)} placeholder={editandoInstructorId ? 'Nueva contraseÃ±a' : 'ContraseÃ±a'} minLength={12} maxLength={64} autoComplete="new-password" disabled={guardando} />
              {errores.password ? <div className="invalid-feedback">{errores.password}</div> : <div className="form-text">Debe contener 12-64 caracteres.</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-password-confirmacion" className="form-label">Confirmar contraseÃ±a {requeridoPassword && <span className="text-danger" aria-hidden="true">*</span>}</label>
              <input ref={refs.password_confirmacion} id="instructor-password-confirmacion" type="password" className={`form-control ${errores.password_confirmacion ? 'is-invalid' : ''}`} value={instructorForm.password_confirmacion} onChange={(e) => cambiar('password_confirmacion', e.target.value)} placeholder="Repita la contraseÃ±a" minLength={12} maxLength={64} autoComplete="new-password" disabled={guardando} />
              {errores.password_confirmacion && <div className="invalid-feedback">{errores.password_confirmacion}</div>}
            </div>
            <div className="col-12">
              <div className="usuario-form-toolbar">
                <div className="usuario-form-toolbar-top estudios-instructor-toolbar-top">
                  <div></div>
                  <div className="usuario-form-actions">
                    <button type="button" className="btn btn-primary usuario-form-action-btn admin-responsive-action-btn" onClick={() => { void intentarGuardarInstructor(); }} disabled={guardando} title={editandoInstructorId ? 'Actualizar instructor' : 'Crear instructor'} aria-label={editandoInstructorId ? 'Actualizar instructor' : 'Crear instructor'}>
                      <i className={`bi ${editandoInstructorId ? 'bi-floppy' : 'bi-person-plus'}`} aria-hidden="true"></i>
                      {guardando ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span className="admin-responsive-btn-label">Guardando...</span>
                        </>
                      ) : <span className="admin-responsive-btn-label">{editandoInstructorId ? 'Actualizar' : 'Crear instructor'}</span>}
                    </button>
                    <button type="button" className="btn btn-outline-secondary usuario-form-action-btn admin-responsive-action-btn" onClick={limpiarInstructor} disabled={guardando} title={editandoInstructorId ? 'Cancelar' : 'Limpiar'} aria-label={editandoInstructorId ? 'Cancelar' : 'Limpiar'}>
                      <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                      <span className="admin-responsive-btn-label">{editandoInstructorId ? 'Cancelar' : 'Limpiar'}</span>
                    </button>
                  </div>
                </div>
                <div className="usuario-form-toolbar-meta">
                  {editandoInstructorId && (
                    <div className="form-check usuario-form-activo-check">
                      <input id="instructor-activo" type="checkbox" className="form-check-input" checked={Boolean(instructorForm.activo)} onChange={(e) => cambiar('activo', e.target.checked)} disabled={guardando} />
                      <label className="form-check-label" htmlFor="instructor-activo">Usuario activo</label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructoresView({
  instructores,
  instructorForm,
  setInstructorForm,
  editandoInstructorId,
  editarInstructor,
  resetInstructorForm,
  guardarInstructor,
  eliminarInstructor,
  guardando
}) {
  const [seccionActiva, setSeccionActiva] = useState(INSTRUCTORES_LISTA);
  const [errores, setErrores] = useState({});
  const nombreRef = useRef(null);
  const usuarioRef = useRef(null);
  const cargoRef = useRef(null);
  const passwordRef = useRef(null);
  const passwordConfirmacionRef = useRef(null);
  const refs = useMemo(() => ({
    nombre_completo: nombreRef,
    usuario: usuarioRef,
    cargo: cargoRef,
    password: passwordRef,
    password_confirmacion: passwordConfirmacionRef
  }), []);
  const resumen = useMemo(() => ({
    total: instructores.length,
    activos: instructores.filter((item) => item.activo).length
  }), [instructores]);
  const requeridoPassword = !editandoInstructorId;

  const cambiar = (campo, valor) => {
    setInstructorForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  const enfocarPrimerError = (nuevosErrores) => {
    const primerCampo = ['nombre_completo', 'usuario', 'cargo', 'password', 'password_confirmacion'].find((campo) => nuevosErrores[campo]);
    if (!primerCampo) return;
    setTimeout(() => refs[primerCampo]?.current?.focus({ preventScroll: false }), 0);
  };

  const validarInstructor = () => {
    const nuevosErrores = {};
    const password = instructorForm.password || '';
    const confirmacion = instructorForm.password_confirmacion || '';

    const nombreInstructor = String(instructorForm.nombre_completo || '').trim();

    if (!nombreInstructor) nuevosErrores.nombre_completo = 'El nombre es obligatorio.';
    if (nombreInstructor.length > INSTRUCTOR_NOMBRE_MAX) nuevosErrores.nombre_completo = `El nombre no puede superar ${INSTRUCTOR_NOMBRE_MAX} caracteres.`;
    if (!String(instructorForm.usuario || '').trim()) nuevosErrores.usuario = 'El usuario es obligatorio.';
    if (!String(instructorForm.cargo || '').trim()) nuevosErrores.cargo = 'El cargo es obligatorio.';
    if (requeridoPassword && !password) nuevosErrores.password = 'La contraseÃ±a es obligatoria.';
    if (requeridoPassword && !confirmacion) nuevosErrores.password_confirmacion = 'Confirme la contraseÃ±a.';
    if (password && password.length < 12) nuevosErrores.password = 'Use al menos 12 caracteres.';
    if ((password || confirmacion) && password !== confirmacion) nuevosErrores.password_confirmacion = 'Las contraseÃ±as no coinciden.';

    return nuevosErrores;
  };

  const intentarGuardarInstructor = async () => {
    const nuevosErrores = validarInstructor();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      enfocarPrimerError(nuevosErrores);
      notificarError('Complete los campos obligatorios del instructor.');
      return;
    }

    setErrores({});
    const ok = await guardarInstructor();
    if (ok) setSeccionActiva(INSTRUCTORES_LISTA);
  };

  const limpiarInstructor = () => {
    setErrores({});
    resetInstructorForm();
    setSeccionActiva(INSTRUCTORES_LISTA);
  };

  const mostrarFormulario = () => {
    if (!editandoInstructorId) setErrores({});
    setSeccionActiva(INSTRUCTORES_FORMULARIO);
  };

  const editarInstructorDesdeTabla = (item) => {
    setErrores({});
    editarInstructor(item);
    setSeccionActiva(INSTRUCTORES_FORMULARIO);
  };

  return (
    <div className="card shadow-sm mb-4 admin-setup-panel estudios-instructores-panel">
      <InstructorPanelHeader
        seccionActiva={seccionActiva}
        editandoInstructorId={editandoInstructorId}
        onMostrarLista={() => setSeccionActiva(INSTRUCTORES_LISTA)}
        onMostrarFormulario={mostrarFormulario}
      />
      <div className="card-body">
        {seccionActiva === INSTRUCTORES_LISTA ? (
          <InstructoresLista
            instructores={instructores}
            resumen={resumen}
            onEditar={editarInstructorDesdeTabla}
            onEliminar={eliminarInstructor}
          />
        ) : (
          <InstructorFormPanel
            instructorForm={instructorForm}
            errores={errores}
            refs={refs}
            editandoInstructorId={editandoInstructorId}
            requeridoPassword={requeridoPassword}
            guardando={guardando}
            cambiar={cambiar}
            intentarGuardarInstructor={intentarGuardarInstructor}
            limpiarInstructor={limpiarInstructor}
          />
        )}
      </div>
    </div>
  );
}

function VisitaSelector({ seleccionadaId, onSeleccionar }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await campanaApi.listarVisitas(q ? { q } : {});
      setItems(res?.exito ? (res?.datos?.items || []) : []);
    } catch {
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => { void cargar(); }, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div className="card shadow-sm estudios-section-card h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Seleccionar visita</h5>
      </div>
      <div className="card-body">
        <label htmlFor="estudios-visitas-selector" className="form-label form-label-sm">Buscar</label>
        <SearchInput id="estudios-visitas-selector" value={q} onChange={setQ} placeholder="Nombre, telÃ©fono o procedencia" />
      </div>
      <div className="card-body p-0">
        <div className="estudios-table-shell">
          <div className="estudios-table-scroll estudios-selector-scroll">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Visita</th>
                  <th>Seguimiento</th>
                  <th className="text-end">Elegir</th>
                </tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan="3" className="text-center text-muted py-4">Cargando...</td></tr>}
                {!cargando && items.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-4">No hay visitas.</td></tr>}
                {!cargando && items.map((item) => (
                  <tr key={item.id} className={String(seleccionadaId) === String(item.id) ? 'table-active' : ''}>
                    <td>
                      <div className="fw-semibold">{item.nombre_snapshot}</div>
                      <div className="small text-muted">{item.telefono_snapshot || item.procedencia || 'Sin telÃ©fono'}</div>
                    </td>
                    <td><span className="badge text-bg-light border">{item.estado_seguimiento || '-'}</span></td>
                    <td className="text-end">
                      <button type="button" className="btn btn-outline-primary btn-sm rounded-circle estudios-icon-btn" onClick={() => onSeleccionar(item)} title="Seleccionar" aria-label="Seleccionar visita">
                        <i className="bi bi-check2" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsignarEstudioView({ asignarForm, setAsignarForm, instructores, guardarAsignarEstudio, guardando }) {
  const cambiar = (campo, valor) => setAsignarForm((prev) => ({ ...prev, [campo]: valor }));
  const hoy = useMemo(() => hoyFechaLocal(), []);
  const instructoresActivos = useMemo(() => instructores.filter((item) => item.activo), [instructores]);

  return (
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <VisitaSelector
          seleccionadaId={asignarForm.visita_id}
          onSeleccionar={(visita) => setAsignarForm((prev) => ({
            ...prev,
            visita_id: visita.id,
            visita_nombre: visita.nombre_snapshot || ''
          }))}
        />
      </div>
      <div className="col-12 col-xl-5">
        <div className="card shadow-sm estudios-form-card">
          <div className="card-header bg-white">
            <h5 className="mb-0">Asignar estudio</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="asignar-visita" className="form-label form-label-sm">Visita</label>
                <input id="asignar-visita" className="form-control form-control-sm" value={asignarForm.visita_nombre || ''} readOnly />
              </div>
              <div className="col-12">
                <label htmlFor="asignar-instructor" className="form-label form-label-sm">Instructor responsable</label>
                <select id="asignar-instructor" className="form-select form-select-sm" value={asignarForm.responsable_usuario_id} onChange={(e) => cambiar('responsable_usuario_id', e.target.value)}>
                  <option value="">Seleccione</option>
                  {instructoresActivos.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre_completo}{item.cargo ? ` - ${item.cargo}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="asignar-fecha-inicio" className="form-label form-label-sm">Fecha inicio</label>
                <input id="asignar-fecha-inicio" type="date" min={hoy} className="form-control form-control-sm" value={asignarForm.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="asignar-frecuencia-cantidad" className="form-label form-label-sm">Veces</label>
                <input id="asignar-frecuencia-cantidad" type="number" min="1" max="31" className="form-control form-control-sm" value={asignarForm.frecuencia_cantidad} onChange={(e) => cambiar('frecuencia_cantidad', e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="asignar-frecuencia-periodo" className="form-label form-label-sm">Periodo</label>
                <select id="asignar-frecuencia-periodo" className="form-select form-select-sm" value={asignarForm.frecuencia_periodo} onChange={(e) => cambiar('frecuencia_periodo', e.target.value)}>
                  {FRECUENCIA_OPCIONES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label htmlFor="asignar-observaciones" className="form-label form-label-sm">Observaciones</label>
                <textarea id="asignar-observaciones" className="form-control form-control-sm" rows="3" value={asignarForm.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} maxLength={800} />
              </div>
              <div className="col-12">
                <button type="button" className="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={guardarAsignarEstudio} disabled={guardando}>
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span>Asignar estudio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetalleVisitaAsignarModal({ visita, onCerrar }) {
  if (!visita) return null;

  const filas = [
    ['Nombre', valorTexto(visita, 'nombre_snapshot', 'nombre_completo'), true],
    ['Telefono', valorTexto(visita, 'telefono_snapshot', 'contacto_telefono')],
    ['Correo', valorTexto(visita, 'correo', 'contacto_correo')],
    ['Procedencia', valorTexto(visita, 'procedencia')],
    ['Tipo', valorTexto(visita, 'tipo_asistente')],
    ['Clasificacion', valorTexto(visita, 'clasificacion_etaria')],
    ['Direccion', valorTexto(visita, 'direccion', 'contacto_direccion')],
    ['Barrio / comunidad', valorTexto(visita, 'barrio_comunidad', 'contacto_barrio_comunidad')],
    ['Seguimiento', etiquetaSeguimientoVisita(visita.estado_seguimiento), true],
    ['CampaÃ±a', valorTexto(visita, 'campana_lema', 'campana_nombre'), true],
    ['Observaciones', valorTexto(visita, 'observaciones')],
    ['Registrada', formatearFechaHora(visita.creado_en), true],
    ['Actualizada', formatearFechaHora(visita.actualizado_en), true]
  ].filter(([, valor, siempre]) => siempre || String(valor || '').trim() !== '');

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onCerrar();
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar informacion de la visita"
    >
      <div className="prompt-modal-iasd estudios-visita-info-modal" role="dialog" aria-modal="true" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="estudios-visita-info-modal-head d-flex align-items-center justify-content-between gap-2 border-bottom">
          <h5 className="mb-0">InformaciÃ³n de la visita</h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="estudios-visita-info-modal-body d-flex flex-column gap-2">
          {filas.map(([label, value]) => (
            <div key={label} className="estudios-detalle-row">
              <span className="text-muted">{label}</span>
              <strong>{value || '-'}</strong>
            </div>
          ))}
        </div>
        <div className="estudios-visita-info-modal-footer border-top text-end">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function VisitaSelectorMultiple({ seleccionadas, onToggle, onVerDetalle }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const seleccionadasIds = useMemo(() => new Set((seleccionadas || []).map((item) => String(item.id))), [seleccionadas]);
  const itemsOrdenados = useMemo(() => ordenarSeleccionadosPrimero(items, seleccionadas), [items, seleccionadas]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await campanaApi.listarVisitas(q ? { q } : {});
      let lista = res?.exito ? (res?.datos?.items || []) : [];

      if (q && lista.length === 0) {
        const fallback = await campanaApi.listarVisitas();
        lista = fallback?.exito ? filtrarVisitasLocal(fallback?.datos?.items || [], q) : [];
      }

      setItems(filtrarVisitasLocal(lista, q));
    } catch {
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => { void cargar(); }, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div className="card shadow-sm estudios-section-card h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Seleccionar visita</h5>
      </div>
      <div className="card-body">
        <label htmlFor="estudios-visitas-selector-multiple" className="form-label form-label-sm">Buscar</label>
        <SearchInput id="estudios-visitas-selector-multiple" value={q} onChange={setQ} placeholder="Nombre, telefono o procedencia" />
      </div>
      <div className="card-body p-0">
        <div className="estudios-table-shell">
          <div className="estudios-table-scroll estudios-selector-scroll">
            <table className="table table-sm align-middle mb-0 estudios-selector-table">
              <thead>
                <tr>
                  <th>Visita</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan="2" className="text-center text-muted py-4">Cargando...</td></tr>}
                {!cargando && items.length === 0 && <tr><td colSpan="2" className="text-muted py-4 ps-3">No hay visitas con ese criterio.</td></tr>}
                {!cargando && itemsOrdenados.map((item) => {
                  const seleccionada = seleccionadasIds.has(String(item.id));
                  const tieneEstudioActivo = visitaTieneEstudioActivo(item);
                  return (
                    <tr key={item.id} className={`estudios-selector-row ${seleccionada ? 'table-active is-selected' : ''} ${tieneEstudioActivo ? 'has-active-study' : ''}`}>
                      <td>
                        <div className="fw-semibold">{nombreVisitaAsignar(item)}</div>
                        <div className="small text-muted">{tieneEstudioActivo ? 'Estudio activo' : (valorTexto(item, 'telefono_snapshot', 'contacto_telefono', 'procedencia') || 'Sin telefono')}</div>
                      </td>
                      <td className="text-end">
                        <div className="estudios-selector-actions">
                          <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => onVerDetalle(item)} title="InformaciÃ³n" aria-label="Ver informacion de la visita">
                            <i className="bi bi-search" aria-hidden="true"></i>
                          </button>
                          <button type="button" className={`btn btn-sm rounded-circle estudios-icon-btn ${seleccionada ? 'btn-danger' : tieneEstudioActivo ? 'btn-outline-secondary' : 'btn-outline-primary'}`} onClick={() => onToggle(item)} title={tieneEstudioActivo ? 'Ya tiene estudio activo' : seleccionada ? 'Quitar' : 'Seleccionar'} aria-label={tieneEstudioActivo ? 'Visita con estudio activo' : seleccionada ? 'Quitar visita' : 'Seleccionar visita'}>
                            <i className={`bi ${seleccionada ? 'bi-x-lg' : tieneEstudioActivo ? 'bi-slash-circle' : 'bi-check2'}`} aria-hidden="true"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructorSelectorMultiple({ instructores, seleccionados, onToggle }) {
  const [q, setQ] = useState('');
  const seleccionadosIds = useMemo(() => new Set((seleccionados || []).map((item) => String(item.id))), [seleccionados]);
  const items = useMemo(() => {
    const termino = normalizarTextoBusqueda(q);
    return instructores.filter((item) => (
      item.activo
      && (!termino || normalizarTextoBusqueda(`${item.nombre_completo || ''} ${item.usuario || ''} ${item.cargo || ''}`).includes(termino))
    ));
  }, [instructores, q]);
  const itemsOrdenados = useMemo(() => ordenarSeleccionadosPrimero(items, seleccionados), [items, seleccionados]);

  return (
    <div className="card shadow-sm estudios-section-card h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Seleccionar instructor</h5>
      </div>
      <div className="card-body">
        <label htmlFor="estudios-instructor-selector-multiple" className="form-label form-label-sm">Buscar</label>
        <SearchInput id="estudios-instructor-selector-multiple" value={q} onChange={setQ} placeholder="Nombre, usuario o cargo" />
      </div>
      <div className="card-body p-0">
        <div className="estudios-table-shell">
          <div className="estudios-table-scroll estudios-selector-scroll">
            <table className="table table-sm align-middle mb-0 estudios-selector-table">
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan="2" className="text-muted py-4 ps-3">No hay instructores con ese criterio.</td></tr>}
                {itemsOrdenados.map((item) => {
                  const seleccionado = seleccionadosIds.has(String(item.id));
                  return (
                    <tr key={item.id} className={`estudios-selector-row ${seleccionado ? 'table-active is-selected' : ''}`}>
                      <td>
                        <div className="fw-semibold">{item.nombre_completo}</div>
                        <div className="small text-muted">{item.cargo || item.usuario || 'Instructor biblico'}</div>
                      </td>
                      <td className="text-end">
                        <button type="button" className={`btn btn-sm rounded-circle estudios-icon-btn ${seleccionado ? 'btn-danger' : 'btn-outline-primary'}`} onClick={() => onToggle(item)} title={seleccionado ? 'Quitar' : 'Seleccionar'} aria-label={seleccionado ? 'Quitar instructor' : 'Seleccionar instructor'}>
                          <i className={`bi ${seleccionado ? 'bi-x-lg' : 'bi-check2'}`} aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenSeleccionAsignar({ id, singular, plural, items, getLabel, action = null }) {
  const [indice, setIndice] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (indice >= total) setIndice(0);
  }, [indice, total]);

  const etiqueta = total === 1 ? singular : plural;
  const actual = total > 0 ? items[indice] : null;

  const mover = (direccion) => {
    if (total < 2) return;
    setIndice((prev) => (prev + direccion + total) % total);
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between gap-2">
        <label htmlFor={id} className="form-label form-label-sm">{etiqueta} <span className="badge text-bg-light border ms-1">{total}</span></label>
        {action}
      </div>
      <div className="input-group input-group-sm estudios-selection-carousel">
        <button type="button" className="btn btn-outline-secondary" onClick={() => mover(-1)} disabled={total < 2} title="Anterior" aria-label="Anterior">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <input id={id} className="form-control" value={actual ? getLabel(actual) : 'Seleccione'} readOnly />
        <span className="input-group-text estudios-selection-index">{total > 0 ? `${indice + 1}/${total}` : '0'}</span>
        <button type="button" className="btn btn-outline-secondary" onClick={() => mover(1)} disabled={total < 2} title="Siguiente" aria-label="Siguiente">
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}

function alternarSeleccionAsignar(lista, item) {
  const id = String(item.id);
  return lista.some((actual) => String(actual.id) === id)
    ? lista.filter((actual) => String(actual.id) !== id)
    : [item, ...lista];
}

function AsignarEstudioMultipleView({ asignarForm, setAsignarForm, instructores, guardarAsignarEstudio, guardando }) {
  const cambiar = (campo, valor) => setAsignarForm((prev) => ({ ...prev, [campo]: valor }));
  const hoy = useMemo(() => hoyFechaLocal(), []);
  const [detalleVisita, setDetalleVisita] = useState(null);
  const [selectorMovil, setSelectorMovil] = useState(null);
  const visitasSeleccionadas = asignarForm.visitas || [];
  const instructoresSeleccionados = asignarForm.responsables || [];

  const cambiarVisitas = (siguientes) => {
    const ids = siguientes.map((item) => item.id);
    const nombres = siguientes.flatMap((item) => {
      const nombre = valorTexto(item, 'nombre_snapshot', 'nombre_completo');
      return nombre ? [nombre] : [];
    });
    setAsignarForm((prev) => ({
      ...prev,
      visitas: siguientes,
      visita_ids: ids,
      visita_id: ids[0] || '',
      visita_nombre: nombres.join(', ')
    }));
  };

  const cambiarInstructores = (siguientes) => {
    const ids = siguientes.map((item) => item.id);
    setAsignarForm((prev) => ({
      ...prev,
      responsables: siguientes,
      responsable_usuario_ids: ids,
      responsable_usuario_id: ids[0] || ''
    }));
  };

  return (
    <div className="row g-3 estudios-asignar-layout">
      <div className="col-12 col-xl-4 estudios-asignar-selector-col">
        <VisitaSelectorMultiple
          seleccionadas={visitasSeleccionadas}
          onToggle={(visita) => {
            const yaSeleccionada = visitasSeleccionadas.some((item) => String(item.id) === String(visita.id));
            if (!yaSeleccionada && visitaTieneEstudioActivo(visita)) {
              notificarError(mensajeVisitaActiva(visita));
              return;
            }
            cambiarVisitas(alternarSeleccionAsignar(visitasSeleccionadas, visita));
          }}
          onVerDetalle={setDetalleVisita}
        />
      </div>
      <div className="col-12 col-xl-4">
        <div className="card shadow-sm estudios-form-card estudios-asignar-form-card">
          <div className="card-header bg-white">
            <h5 className="mb-0">Asignar estudio</h5>
          </div>
          <div className="card-body estudios-asignar-form-body">
            <div className="row g-3 estudios-asignar-form-grid">
              <div className="col-12">
                <ResumenSeleccionAsignar
                  id="asignar-visita"
                  singular="Visita"
                  plural="Visitas"
                  items={visitasSeleccionadas}
                  getLabel={(item) => valorTexto(item, 'nombre_snapshot', 'nombre_completo') || `Visita ${item.id}`}
                  action={(
                    <button type="button" className="btn btn-outline-primary btn-sm estudios-asignar-mobile-picker-btn d-md-none" onClick={() => setSelectorMovil('visitas')}>
                      <i className="bi bi-search" aria-hidden="true"></i>
                      <span>Seleccionar</span>
                    </button>
                  )}
                />
              </div>
              <div className="col-12">
                <ResumenSeleccionAsignar
                  id="asignar-instructor"
                  singular="Instructor responsable"
                  plural="Instructores responsables"
                  items={instructoresSeleccionados}
                  getLabel={(item) => item.nombre_completo || item.usuario || `Instructor ${item.id}`}
                  action={(
                    <button type="button" className="btn btn-outline-primary btn-sm estudios-asignar-mobile-picker-btn d-md-none" onClick={() => setSelectorMovil('instructores')}>
                      <i className="bi bi-search" aria-hidden="true"></i>
                      <span>Seleccionar</span>
                    </button>
                  )}
                />
              </div>
              <div className="col-12 col-md-5">
                <label htmlFor="asignar-fecha-inicio" className="form-label form-label-sm">Fecha inicio</label>
                <input id="asignar-fecha-inicio" type="date" min={hoy} className="form-control form-control-sm" value={asignarForm.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)} />
              </div>
              <div className="col-4 col-md-2">
                <label htmlFor="asignar-frecuencia-cantidad" className="form-label form-label-sm">Veces</label>
                <input id="asignar-frecuencia-cantidad" type="number" min="1" max="31" className="form-control form-control-sm" value={asignarForm.frecuencia_cantidad} onChange={(e) => cambiar('frecuencia_cantidad', e.target.value)} />
              </div>
              <div className="col-8 col-md-5">
                <label htmlFor="asignar-frecuencia-periodo" className="form-label form-label-sm">Periodo</label>
                <select id="asignar-frecuencia-periodo" className="form-select form-select-sm" value={asignarForm.frecuencia_periodo} onChange={(e) => cambiar('frecuencia_periodo', e.target.value)}>
                  {FRECUENCIA_OPCIONES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 estudios-asignar-observaciones-col">
                <label htmlFor="asignar-observaciones" className="form-label form-label-sm">Observaciones</label>
                <textarea id="asignar-observaciones" className="form-control form-control-sm estudios-asignar-observaciones" rows="5" value={limitarObservacionesAsignar(asignarForm.observaciones)} onChange={(e) => cambiar('observaciones', limitarObservacionesAsignar(e.target.value))} maxLength={ASIGNAR_OBSERVACIONES_MAX_CARACTERES} />
                <div className="form-text text-end">{limitarObservacionesAsignar(asignarForm.observaciones).length}/{ASIGNAR_OBSERVACIONES_MAX_CARACTERES}</div>
              </div>
              <div className="col-12 estudios-asignar-submit">
                <button type="button" className="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={guardarAsignarEstudio} disabled={guardando}>
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span>Asignar estudio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-xl-4 estudios-asignar-selector-col">
        <InstructorSelectorMultiple
          instructores={instructores}
          seleccionados={instructoresSeleccionados}
          onToggle={(instructor) => cambiarInstructores(alternarSeleccionAsignar(instructoresSeleccionados, instructor))}
        />
      </div>
      <MobileFilterSheet abierto={selectorMovil === 'visitas'} titulo="Seleccionar visita" onCerrar={() => setSelectorMovil(null)}>
        <VisitaSelectorMultiple
          seleccionadas={visitasSeleccionadas}
          onToggle={(visita) => {
            const yaSeleccionada = visitasSeleccionadas.some((item) => String(item.id) === String(visita.id));
            if (!yaSeleccionada && visitaTieneEstudioActivo(visita)) {
              notificarError(mensajeVisitaActiva(visita));
              return;
            }
            cambiarVisitas(alternarSeleccionAsignar(visitasSeleccionadas, visita));
          }}
          onVerDetalle={setDetalleVisita}
        />
      </MobileFilterSheet>
      <MobileFilterSheet abierto={selectorMovil === 'instructores'} titulo="Seleccionar instructor" onCerrar={() => setSelectorMovil(null)}>
        <InstructorSelectorMultiple
          instructores={instructores}
          seleccionados={instructoresSeleccionados}
          onToggle={(instructor) => cambiarInstructores(alternarSeleccionAsignar(instructoresSeleccionados, instructor))}
        />
      </MobileFilterSheet>
      <DetalleVisitaAsignarModal visita={detalleVisita} onCerrar={() => setDetalleVisita(null)} />
    </div>
  );
}

function JustificacionSesionModal({ periodo, texto, onTexto, onCerrar, onConfirmar, guardando }) {
  if (!periodo) return null;

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '560px', width: '95%' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom">
          <div>
            <h5 className="mb-0">Justificar falta</h5>
            <div className="small text-muted">
              {periodo.etiqueta} - {formatearFechaDesdeDate(periodo.inicio)} al {formatearFechaDesdeDate(periodo.fin)}
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="py-3">
          <label htmlFor="registro-justificacion" className="form-label form-label-sm">Motivo</label>
          <textarea
            id="registro-justificacion"
            className="form-control form-control-sm"
            rows="4"
            value={texto}
            onChange={(e) => onTexto(e.target.value.slice(0, REGISTRO_JUSTIFICACION_MAX))}
            maxLength={REGISTRO_JUSTIFICACION_MAX}
            placeholder="Explique brevemente por que no se pudo dar el estudio."
          />
          <div className="form-text text-end">{texto.length}/{REGISTRO_JUSTIFICACION_MAX}</div>
        </div>
        <div className="pt-3 border-top d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="button" className="btn btn-warning btn-sm d-inline-flex align-items-center gap-2" onClick={onConfirmar} disabled={guardando}>
            <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
            <span>Guardar justificacion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmarFinalizarModal({ estudio, onCerrar, onConfirmar, guardando }) {
  if (!estudio) return null;

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCerrar();
      }}
      role="presentation"
    >
      <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '520px', width: '95%' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom">
          <div>
            <h5 className="mb-0">Finalizar estudio</h5>
            <div className="small text-muted">{estudio.contacto_nombre || 'Estudio biblico'}</div>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <p className="py-3 mb-0">
          Esta accion marcara el estudio como finalizado. Puede reactivarse despues desde la vista principal si fuera necesario.
        </p>
        <div className="pt-3 border-top d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="button" className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2" onClick={onConfirmar} disabled={guardando}>
            <i className="bi bi-flag" aria-hidden="true"></i>
            <span>Finalizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistroSesionesView({ estudios, guardarSesionDirecta, cambiarEstadoEstudio, guardando }) {
  const { usuario } = useAuth();
  const activos = useMemo(() => estudios.filter((item) => !ESTADOS_CERRADOS.includes(item.estado_general)), [estudios]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [cargandoDetalleRegistro, setCargandoDetalleRegistro] = useState(false);
  const [detalleVisita, setDetalleVisita] = useState(null);
  const [periodoJustificacion, setPeriodoJustificacion] = useState(null);
  const [textoJustificacion, setTextoJustificacion] = useState('');
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [visitaIndice, setVisitaIndice] = useState(0);
  const [form, setForm] = useState({
    fecha: hoyFechaHoraLocal(),
    tema_leccion: '',
    resumen_breve: '',
    percepcion_avance: AVANCE_GENERAL_INICIAL,
    progreso_bautismo: progresoSugeridoAvance(AVANCE_GENERAL_INICIAL, 0)
  });

  useEffect(() => {
    if (!seleccionado && activos.length > 0) {
      setSeleccionado(activos[0]);
    }
    if (seleccionado && !activos.some((item) => item.id === seleccionado.id)) {
      setSeleccionado(activos[0] || null);
    }
  }, [activos, seleccionado]);

  const cargarDetalleRegistro = useCallback(async (id) => {
    if (!id) {
      setDetalleSeleccionado(null);
      return;
    }

    setCargandoDetalleRegistro(true);
    try {
      const res = await estudioBiblicoApi.obtenerPorId(id);
      if (res?.exito) {
        setDetalleSeleccionado(normalizarDetalleEstudioRespuesta(res));
      }
    } catch (error) {
      setDetalleSeleccionado(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle del estudio.');
    } finally {
      setCargandoDetalleRegistro(false);
    }
  }, []);

  useEffect(() => {
    if (seleccionado?.id) {
      void cargarDetalleRegistro(seleccionado.id);
    } else {
      setDetalleSeleccionado(null);
    }
  }, [seleccionado?.id, cargarDetalleRegistro]);

  const estudioActual = useMemo(() => {
    if (!seleccionado) return null;
    if (detalleSeleccionado && String(detalleSeleccionado.id) === String(seleccionado.id)) {
      return { ...seleccionado, ...detalleSeleccionado };
    }
    return seleccionado;
  }, [detalleSeleccionado, seleccionado]);
  const sesionesActuales = useMemo(() => (
    Array.isArray(estudioActual?.sesiones) ? estudioActual.sesiones : []
  ), [estudioActual]);
  const sesionesInstructorActual = useMemo(() => {
    const usuarioId = Number(usuario?.id || 0);
    if (!usuarioId || usuario?.rol !== ROLES.INSTRUCTOR_BIBLICO) return sesionesActuales;
    return sesionesActuales.filter((sesion) => Number(sesion?.responsable_usuario_id || 0) === usuarioId);
  }, [sesionesActuales, usuario?.id, usuario?.rol]);
  const resumenRegistro = useMemo(() => crearResumenRegistro(estudioActual, sesionesInstructorActual), [estudioActual, sesionesInstructorActual]);
  const periodoFormulario = useMemo(() => obtenerPeriodoEstudio(estudioActual, form.fecha), [estudioActual, form.fecha]);
  const resumenFormulario = useMemo(() => (
    periodoFormulario && resumenRegistro.periodoActual
      ? resumenPeriodoEstudio(estudioActual, sesionesInstructorActual, periodoFormulario, resumenRegistro.periodoActual)
      : null
  ), [estudioActual, sesionesInstructorActual, periodoFormulario, resumenRegistro.periodoActual]);
  const periodoActualResumen = useMemo(() => {
    if (!resumenRegistro.periodoActual) return null;
    return resumenRegistro.periodos.find((periodo) => periodo.indice === resumenRegistro.periodoActual.indice) || null;
  }, [resumenRegistro.periodoActual, resumenRegistro.periodos]);
  const periodoActualVista = useMemo(() => {
    if (!periodoActualResumen) return null;
    const requeridas = Math.max(1, Number(periodoActualResumen.requeridas || 1));
    const registradas = Math.min(requeridas, Math.max(0, Number(periodoActualResumen.registradas || 0)));
    const justificadas = Math.min(Math.max(0, requeridas - registradas), Math.max(0, Number(periodoActualResumen.justificadas || 0)));
    const faltantes = Math.max(0, requeridas - registradas - justificadas);
    return { ...periodoActualResumen, requeridas, registradas, justificadas, faltantes, cubiertas: registradas + justificadas };
  }, [periodoActualResumen]);
  const pasosPeriodoActual = useMemo(() => crearPasosPeriodoActual(periodoActualVista), [periodoActualVista]);
  const visitasCarrusel = useMemo(() => visitasDetalleEstudio(estudioActual), [estudioActual]);
  const visitaCarruselActual = visitasCarrusel[visitaIndice] || visitasCarrusel[0] || null;
  const responsablesEstudio = useMemo(() => responsablesDetalleEstudio(estudioActual), [estudioActual]);
  const otrosResponsables = useMemo(() => (
    responsablesEstudio.filter((item) => Number(item.id) !== Number(usuario?.id || 0))
  ), [responsablesEstudio, usuario?.id]);
  const estudioYaInicio = Boolean(estudioActual && resumenRegistro.periodoActual);
  const hayPendientesRegistro = estudioYaInicio && resumenRegistro.pendientes.length > 0;
  const hayPendienteActual = Boolean(periodoActualVista && periodoActualVista.faltantes > 0);
  const puedeRegistrarSesion = estudioYaInicio && hayPendienteActual;
  const puedeJustificarFalta = estudioYaInicio && Boolean(resumenRegistro.primerJustificable);
  const estudioAlDia = estudioYaInicio && !hayPendientesRegistro;
  const periodoInputMin = periodoActualVista ? fechaHoraLocalDesdeFecha(periodoActualVista.inicio) : '';
  const periodoInputMax = periodoActualVista ? fechaHoraLocalDesdeFecha(periodoActualVista.fin) : '';

  useEffect(() => {
    setVisitaIndice(0);
  }, [estudioActual?.id]);

  useEffect(() => {
    if (!estudioActual?.id) return;
    setForm({
      fecha: periodoActualVista ? fechaHoraDentroPeriodo(periodoActualVista) : hoyFechaHoraLocal(),
      tema_leccion: '',
      resumen_breve: '',
      percepcion_avance: AVANCE_GENERAL_INICIAL,
      progreso_bautismo: progresoSugeridoAvance(AVANCE_GENERAL_INICIAL, 0)
    });
  }, [estudioActual?.id, periodoActualVista?.indice]);

  useEffect(() => {
    if (visitasCarrusel.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setVisitaIndice((prev) => (prev + 1) % visitasCarrusel.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [visitasCarrusel.length]);

  const moverVisita = (direccion) => {
    if (visitasCarrusel.length <= 1) return;
    setVisitaIndice((prev) => (prev + direccion + visitasCarrusel.length) % visitasCarrusel.length);
  };

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  const cambiarAvanceGeneral = (valor) => {
    setForm((prev) => ({
      ...prev,
      percepcion_avance: valor,
      progreso_bautismo: progresoSugeridoAvance(valor, prev.progreso_bautismo)
    }));
  };

  const validarRegistro = () => {
    if (!estudioActual) return 'Seleccione un estudio.';
    if (!estudioYaInicio) return 'Este estudio biblico todavia no ha iniciado.';
    if (!puedeRegistrarSesion) return 'Este estudio no tiene sesiones pendientes para registrar en el periodo actual.';
    if (!fechaEstaEnPeriodo(form.fecha, periodoActualVista)) return 'La fecha debe estar dentro del periodo actual del estudio.';
    if (!String(form.tema_leccion || '').trim()) return 'Indique el tema o leccion antes de registrar.';
    if (!periodoFormulario || !resumenFormulario) return 'La fecha seleccionada no pertenece al calendario del estudio.';
    if (!resumenFormulario.esActual) return 'Solo puede registrar sesiones del periodo actual. Use justificar para periodos vencidos.';
    if (resumenFormulario.cubiertas >= resumenFormulario.requeridas) {
      return `${resumenFormulario.etiqueta} ya tiene el maximo de registros permitidos.`;
    }
    return '';
  };

  const registrar = async () => {
    const error = validarRegistro();
    if (error) {
      notificarError(error);
      return;
    }

    const ok = await guardarSesionDirecta(estudioActual.id, {
      fecha: form.fecha,
      tema_leccion: form.tema_leccion.trim(),
      resumen_breve: form.resumen_breve.trim(),
      dudas_surgidas: '',
      asistencia: 'SI',
      percepcion_avance: form.percepcion_avance,
      progreso_bautismo: form.progreso_bautismo,
      responsable_usuario_id: usuario?.id || null,
      proxima_accion: '',
      proxima_fecha_sugerida: ''
    });

    if (ok) {
      setForm({
        fecha: hoyFechaHoraLocal(),
        tema_leccion: '',
        resumen_breve: '',
        percepcion_avance: AVANCE_GENERAL_INICIAL,
        progreso_bautismo: progresoSugeridoAvance(AVANCE_GENERAL_INICIAL, 0)
      });
      await cargarDetalleRegistro(estudioActual.id);
    }
  };

  const abrirJustificacion = () => {
    if (!puedeJustificarFalta) {
      notificarError('No hay faltas pendientes por justificar.');
      return;
    }
    if (!resumenRegistro.primerJustificable) {
      notificarError('No hay faltas pendientes por justificar.');
      return;
    }
    setTextoJustificacion('');
    setPeriodoJustificacion(resumenRegistro.primerJustificable);
  };

  const guardarJustificacion = async () => {
    if (!estudioActual || !periodoJustificacion) return;
    const texto = textoJustificacion.trim();
    if (!texto) {
      notificarError('Indique el motivo de la justificacion.');
      return;
    }

    const fechaJustificacion = periodoJustificacion.esVencido
      ? fechaHoraLocalDesdeFecha(periodoJustificacion.fin)
      : hoyFechaHoraLocal();
    const ok = await guardarSesionDirecta(estudioActual.id, {
      fecha: fechaJustificacion,
      tema_leccion: `Justificacion ${periodoJustificacion.etiqueta}`,
      resumen_breve: texto,
      dudas_surgidas: '',
      asistencia: 'JUSTIFICADA',
      percepcion_avance: form.percepcion_avance,
      progreso_bautismo: form.progreso_bautismo,
      responsable_usuario_id: usuario?.id || null,
      proxima_accion: '',
      proxima_fecha_sugerida: ''
    });

    if (ok) {
      setPeriodoJustificacion(null);
      setTextoJustificacion('');
      await cargarDetalleRegistro(estudioActual.id);
    }
  };

  const finalizarEstudio = async () => {
    if (!estudioActual) return;
    const ok = await cambiarEstadoEstudio(estudioActual.id, 'CERRADO', 'Finalizado por instructor.');
    if (ok) {
      setConfirmarFinalizar(false);
    }
  };

  return (
    <div className="row g-3 estudios-registro-layout">
      <div className="col-12 col-xl-5">
        <div className="card shadow-sm estudios-lista-card estudios-registro-card">
          <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
            <h5 className="mb-0">Mis estudios</h5>
            <span className="badge text-bg-light border">{activos.length}</span>
          </div>
          <div className="card-body p-0">
            <div className="estudios-registro-list">
              {activos.length === 0 && (
                <div className="text-center text-muted py-4 px-3">No hay estudios activos asignados.</div>
              )}
              {activos.map((item) => {
                const activo = String(seleccionado?.id || '') === String(item.id);
                const pendiente = activo ? hayPendientesRegistro : estudioTienePendienteLista(item);
                return (
                <button
                  key={item.id}
                  type="button"
                  className={`estudios-registro-item ${activo ? 'is-active' : ''} ${pendiente ? 'is-pending' : ''}`}
                  onClick={() => setSeleccionado(item)}
                >
                  <span>
                    <strong>{item.contacto_nombre}</strong>
                    <small>{etiquetaFrecuencia(item)} - ultima sesion {formatearFecha(item.fecha_ultima_sesion)}</small>
                  </span>
                  <span className="estudios-registro-item-meta">
                    {pendiente && !activo && <small className="estudios-registro-pending-badge">Pendiente</small>}
                    <i className="bi bi-chevron-right" aria-hidden="true"></i>
                  </span>
                </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-7">
        <div className="card shadow-sm estudios-form-card estudios-registro-form-card">
          <div className="card-header bg-white d-flex align-items-start justify-content-between gap-2">
            <div className="estudios-registro-header-main">
              <div className="estudios-visita-carousel">
                {visitasCarrusel.length > 1 && (
                  <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => moverVisita(-1)} title="Visita anterior" aria-label="Visita anterior">
                    <i className="bi bi-chevron-left" aria-hidden="true"></i>
                  </button>
                )}
                <h5 className="mb-0">{visitaCarruselActual ? nombreVisitaEstudio(estudioActual, visitaCarruselActual) : 'Registrar sesion'}</h5>
                {visitasCarrusel.length > 1 && (
                  <>
                    <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => moverVisita(1)} title="Siguiente visita" aria-label="Siguiente visita">
                      <i className="bi bi-chevron-right" aria-hidden="true"></i>
                    </button>
                    <span className="badge text-bg-light border estudios-visita-counter">{visitaIndice + 1}/{visitasCarrusel.length} visitas</span>
                  </>
                )}
              </div>
              <div className="small text-muted">
                {estudioActual
                  ? `Fecha de inicio: ${formatearFecha(estudioActual.fecha_inicio)} - ${etiquetaFrecuencia(estudioActual)}`
                  : '-'}
              </div>
            </div>
            {estudioActual && (
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => setDetalleVisita(visitaCarruselActual || estudioActual)} title="Ver visita" aria-label="Ver visita">
                <i className="bi bi-search" aria-hidden="true"></i>
              </button>
            )}
          </div>
          <div className="card-body">
            {estudioActual && !estudioYaInicio && (
              <div className="estudios-periodos-panel estudios-periodo-espera-panel mb-3">
                <div className="estudios-registro-state-icon">
                  <i className="bi bi-calendar2-week" aria-hidden="true"></i>
                </div>
                <div>
                  <strong>Este estudio todavia no ha empezado</strong>
                  <p>
                    Iniciara el {formatearFecha(estudioActual.fecha_inicio)} con frecuencia de {etiquetaFrecuencia(estudioActual).toLowerCase()}.
                  </p>
                </div>
              </div>
            )}

            {estudioActual && estudioYaInicio && periodoActualVista && (
              <div className="estudios-periodos-panel estudios-periodo-actual-panel mb-3">
                <div className="estudios-periodo-actual-head">
                  <div className="estudios-periodo-info-line">
                    <span className="estudios-periodo-eyebrow">Periodo actual</span>
                    <span className="estudios-periodo-separador" aria-hidden="true"></span>
                    <strong>{periodoActualVista.etiqueta}</strong>
                    <span className="estudios-periodo-separador" aria-hidden="true"></span>
                    <small>{formatearFechaDesdeDate(periodoActualVista.inicio)} al {formatearFechaDesdeDate(periodoActualVista.fin)}</small>
                  </div>
                  <div className="estudios-periodo-status" aria-label="Pendientes del periodo actual">
                    <span>Pendientes</span>
                    <strong className={periodoActualVista.faltantes > 0 ? 'is-pending' : 'is-clear'}>
                      {periodoActualVista.faltantes > 0 ? `Faltan ${periodoActualVista.faltantes}` : 'Sin pendientes'}
                    </strong>
                  </div>
                </div>
                <div className="estudios-periodo-timeline" aria-label={`${periodoActualVista.etiqueta}: ${periodoActualVista.cubiertas} de ${periodoActualVista.requeridas}`}>
                  {pasosPeriodoActual.map((paso) => (
                    <div key={paso.id} className={`estudios-periodo-step is-${paso.estado}`}>
                      <span className="estudios-periodo-step-dot">
                        <i className={`bi ${paso.estado === 'registrado' ? 'bi-check-lg' : paso.estado === 'justificado' ? 'bi-exclamation-lg' : 'bi-circle'}`} aria-hidden="true"></i>
                      </span>
                      <small>{paso.etiqueta}</small>
                    </div>
                  ))}
                </div>
                <div className="estudios-periodo-resumen">
                  <span><i className="bi bi-circle-fill text-success" aria-hidden="true"></i>{periodoActualVista.registradas} registradas</span>
                  <span><i className="bi bi-circle-fill text-warning" aria-hidden="true"></i>{periodoActualVista.justificadas} justificadas</span>
                  <span><i className="bi bi-circle-fill text-secondary" aria-hidden="true"></i>{periodoActualVista.faltantes} pendientes</span>
                </div>
              </div>
            )}

            {puedeRegistrarSesion && responsablesEstudio.length > 1 && (
              <div className="alert alert-warning estudios-instructor-asistencia-note" role="status">
                <strong>Asistencia individual:</strong> este registro quedara a nombre de {nombreUsuarioSesion(usuario)}.
                {otrosResponsables.length > 0 && (
                  <span> Faltaria registrar a {otrosResponsables.map((item) => item.nombre).join(', ')} si tambien asistieron.</span>
                )}
              </div>
            )}

            {estudioActual && !estudioYaInicio && (
              <div className="estudios-registro-state estudios-registro-state-waiting">
                <div className="estudios-registro-state-icon">
                  <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                </div>
                <div>
                  <h6>Todavia no se puede registrar sesion</h6>
                  <p>El formulario se habilitara cuando llegue la fecha de inicio del estudio biblico.</p>
                </div>
              </div>
            )}

            {estudioAlDia && (
              <div className="estudios-registro-state estudios-registro-state-clear">
                <div className="estudios-registro-state-icon">
                  <i className="bi bi-check2-circle" aria-hidden="true"></i>
                </div>
                <div>
                  <h6>Este estudio esta al dia</h6>
                  <p>No hay sesiones pendientes para el periodo actual.</p>
                  <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2" onClick={() => setConfirmarFinalizar(true)} disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                    <i className="bi bi-flag" aria-hidden="true"></i>
                    <span>Finalizar estudio</span>
                  </button>
                </div>
              </div>
            )}

            {estudioYaInicio && !puedeRegistrarSesion && hayPendientesRegistro && (
              <div className="estudios-registro-state estudios-registro-state-pending">
                <div className="estudios-registro-state-icon">
                  <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                </div>
                <div>
                  <h6>Hay faltas pendientes por justificar</h6>
                  <p>El periodo actual esta cubierto; revise primero las faltas anteriores.</p>
                  {puedeJustificarFalta && (
                    <button type="button" className="btn btn-outline-warning btn-sm d-inline-flex align-items-center justify-content-center gap-2" onClick={abrirJustificacion} disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                      <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                      <span>Justificar falta</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2" onClick={() => setConfirmarFinalizar(true)} disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                    <i className="bi bi-flag" aria-hidden="true"></i>
                    <span>Finalizar estudio</span>
                  </button>
                </div>
              </div>
            )}

            {puedeRegistrarSesion && (
              <div className="row g-3">
                <div className="col-12 col-md-5">
                  <label htmlFor="registro-fecha" className="form-label form-label-sm">Fecha y hora</label>
                  <input
                    id="registro-fecha"
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={form.fecha}
                    min={periodoInputMin}
                    max={periodoInputMax}
                    onChange={(e) => cambiar('fecha', e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-7">
                  <label htmlFor="registro-tema" className="form-label form-label-sm">Tema / leccion</label>
                  <input
                    id="registro-tema"
                    className="form-control form-control-sm"
                    value={form.tema_leccion}
                    onChange={(e) => cambiar('tema_leccion', e.target.value)}
                    maxLength={180}
                    placeholder="Tema o leccion estudiada"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label htmlFor="registro-avance" className="form-label form-label-sm">Avance general</label>
                  <select id="registro-avance" className="form-select form-select-sm" value={form.percepcion_avance} onChange={(e) => cambiarAvanceGeneral(e.target.value)}>
                    {AVANCE_GENERAL_OPCIONES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-8 estudios-progreso-field">
                  <label htmlFor="registro-progreso" className="form-label form-label-sm">Cerca del bautismo</label>
                  <div className="estudios-progreso-control d-flex align-items-center gap-2">
                    <input id="registro-progreso" type="range" className="form-range flex-grow-1" min="0" max="100" value={form.progreso_bautismo} onChange={(e) => cambiar('progreso_bautismo', e.target.value)} />
                    <span className="badge text-bg-light border estudios-progress-badge">{form.progreso_bautismo}%</span>
                  </div>
                </div>
                <div className="col-12">
                  <label htmlFor="registro-observaciones" className="form-label form-label-sm">Observaciones</label>
                  <textarea
                    id="registro-observaciones"
                    className="form-control form-control-sm estudios-registro-observaciones"
                    rows="3"
                    value={form.resumen_breve}
                    onChange={(e) => cambiar('resumen_breve', limitarObservacionesRegistro(e.target.value))}
                    maxLength={REGISTRO_OBSERVACIONES_MAX}
                  />
                  <div className="form-text text-end">{form.resumen_breve.length}/{REGISTRO_OBSERVACIONES_MAX}</div>
                </div>
                <div className="col-12 d-flex align-items-end justify-content-end gap-2 flex-wrap">
                  {puedeJustificarFalta && (
                    <button type="button" className="btn btn-outline-warning btn-sm d-inline-flex align-items-center justify-content-center gap-2" onClick={abrirJustificacion} disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                      <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                      <span>Justificar falta</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center justify-content-center gap-2 estudios-registro-submit" onClick={registrar} disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                    <i className="bi bi-journal-check" aria-hidden="true"></i>
                    <span>Registrar sesion</span>
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm rounded-circle estudios-icon-btn" onClick={() => setConfirmarFinalizar(true)} title="Finalizar estudio" aria-label="Finalizar estudio" disabled={!estudioActual || guardando || cargandoDetalleRegistro}>
                    <i className="bi bi-flag" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DetalleVisitaModal estudio={detalleVisita} onCerrar={() => setDetalleVisita(null)} />
      <JustificacionSesionModal
        periodo={periodoJustificacion}
        texto={textoJustificacion}
        onTexto={setTextoJustificacion}
        onCerrar={() => setPeriodoJustificacion(null)}
        onConfirmar={guardarJustificacion}
        guardando={guardando}
      />
      <ConfirmarFinalizarModal
        estudio={confirmarFinalizar ? estudioActual : null}
        onCerrar={() => setConfirmarFinalizar(false)}
        onConfirmar={finalizarEstudio}
        guardando={guardando}
      />
    </div>
  );
}

export default function EstudiosBiblicosPage() {
  const { usuario } = useAuth();
  const esInstructor = usuario?.rol === ROLES.INSTRUCTOR_BIBLICO;
  const vistaInicial = esInstructor ? VISTA_REGISTRO : VISTA_ESTUDIOS;
  const [vistaActiva, setVistaActiva] = useState(vistaInicial);

  const {
    filtros,
    dashboard,
    estudios,
    instructores,
    campanas,
    seleccionadoId,
    setSeleccionadoId,
    cargando,
    guardando,
    instructorForm,
    setInstructorForm,
    editandoInstructorId,
    asignarForm,
    setAsignarForm,
    cambiarFiltro,
    cargarInstructores,
    editarInstructor,
    resetInstructorForm,
    guardarInstructor,
    eliminarInstructor,
    guardarAsignarEstudio,
    guardarSesionDirecta,
    cambiarEstadoEstudio,
    recargar
  } = useEstudiosBiblicos();

  useEffect(() => {
    setVistaActiva(esInstructor ? VISTA_REGISTRO : VISTA_ESTUDIOS);
  }, [esInstructor]);

  useEffect(() => {
    const irA = (vista) => {
      setVistaActiva(esInstructor ? VISTA_REGISTRO : vista);
    };
    const abrirVisitas = () => irA(VISTA_VISITAS);
    const abrirLista = () => irA(VISTA_ESTUDIOS);
    const abrirInstructores = () => irA(VISTA_INSTRUCTORES);
    const abrirAsignar = () => irA(VISTA_ASIGNAR);
    const abrirRegistro = () => setVistaActiva(VISTA_REGISTRO);

    window.addEventListener(EVENT_ESTUDIOS_ABRIR_VISITAS, abrirVisitas);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_LISTA, abrirLista);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_INSTRUCTORES, abrirInstructores);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_ASIGNAR, abrirAsignar);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_REGISTRO, abrirRegistro);
    return () => {
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_VISITAS, abrirVisitas);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_LISTA, abrirLista);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_INSTRUCTORES, abrirInstructores);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_ASIGNAR, abrirAsignar);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_REGISTRO, abrirRegistro);
    };
  }, [esInstructor]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_VISTA_ACTIVA, { detail: { vista: vistaActiva } }));
    if ([VISTA_INSTRUCTORES, VISTA_ASIGNAR].includes(vistaActiva)) {
      void cargarInstructores();
    }
    if (vistaActiva === VISTA_ESTUDIOS || vistaActiva === VISTA_REGISTRO) {
      void recargar();
    }
  }, [vistaActiva, cargarInstructores, recargar]);

  const contenido = (() => {
    if (!esInstructor && vistaActiva === VISTA_VISITAS) {
      return <VisitasGeneralView campanas={campanas} />;
    }
    if (!esInstructor && vistaActiva === VISTA_INSTRUCTORES) {
      return (
        <InstructoresView
          instructores={instructores}
          instructorForm={instructorForm}
          setInstructorForm={setInstructorForm}
          editandoInstructorId={editandoInstructorId}
          editarInstructor={editarInstructor}
          resetInstructorForm={resetInstructorForm}
          guardarInstructor={guardarInstructor}
          eliminarInstructor={eliminarInstructor}
          guardando={guardando}
        />
      );
    }
    if (!esInstructor && vistaActiva === VISTA_ASIGNAR) {
      return (
        <AsignarEstudioMultipleView
          asignarForm={asignarForm}
          setAsignarForm={setAsignarForm}
          instructores={instructores}
          guardarAsignarEstudio={guardarAsignarEstudio}
          guardando={guardando}
        />
      );
    }
    if (esInstructor || vistaActiva === VISTA_REGISTRO) {
      return (
        <RegistroSesionesView
          estudios={estudios}
          guardarSesionDirecta={guardarSesionDirecta}
          cambiarEstadoEstudio={cambiarEstadoEstudio}
          guardando={guardando}
        />
      );
    }
    return (
      <EstudiosMainView
        filtros={filtros}
        cambiarFiltro={cambiarFiltro}
        dashboard={dashboard}
        estudios={estudios}
        cargando={cargando}
        seleccionadoId={seleccionadoId}
        setSeleccionadoId={setSeleccionadoId}
        cambiarEstadoEstudio={cambiarEstadoEstudio}
      />
    );
  })();

  return (
    <div
      className={`container-fluid py-3 py-lg-4 estudios-page ${esInstructor ? 'estudios-page-instructor' : ''}`}
      data-vista={vistaActiva}
    >
      {contenido}
    </div>
  );
}
