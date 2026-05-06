import { useEffect, useMemo, useState, useCallback } from 'react';
import campanaApi from '../../api/campanaApi';
import { notificarError, notificarExito } from '../../utils/notify';
import SearchInput from '../ui/SearchInput';
import VisitaFormModal from './VisitaFormModal';
import VisitasPendientesModal from './VisitasPendientesModal';
import CampanaFiltroModal from './CampanaFiltroModal';
import VisitaDuplicadaWarningModal from './VisitaDuplicadaWarningModal';

const CAMPANAS_VACIAS = [];

const SEGUIMIENTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'ESTUDIO_BIBLICO', etiqueta: 'Estudio bíblico' },
  { valor: 'NO_LOCALIZABLE', etiqueta: 'No localizable' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' }
];

const ETARIA_OPCIONES = [
  { valor: 'NINO', etiqueta: 'Niño' },
  { valor: 'JOVEN', etiqueta: 'Joven' },
  { valor: 'ADULTO', etiqueta: 'Adulto' }
];

const formatearFecha = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const etiquetaSeguimiento = (clave) => {
  const op = SEGUIMIENTO_OPCIONES.find(o => o.valor === clave);
  return op ? op.etiqueta : (clave || '-');
};

const normalizarNombre = (s) => {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parsearCampanasAsistidas = (raw) => {
  if (!raw) return [];
  return String(raw).split('||').filter(Boolean);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO_CR_REGEX = /^\d{4}-\d{4}$/;
const TELEFONO_INTERNACIONAL_REGEX = /^\+?[0-9()\-\s]{7,20}$/;

const valorContacto = (item, ...campos) => {
  for (const campo of campos) {
    const valor = item?.[campo];
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      return String(valor).trim();
    }
  }
  return '';
};

const construirFilasDetalleVisita = (visita) => {
  const campanas = parsearCampanasAsistidas(visita?.campanas_asistidas_raw).join(', ');
  return [
    ['Nombre', valorContacto(visita, 'nombre_snapshot'), true, true],
    ['Tipo', valorContacto(visita, 'tipo_asistente'), false, true],
    ['Teléfono', valorContacto(visita, 'telefono_snapshot', 'contacto_telefono')],
    ['Correo', valorContacto(visita, 'correo', 'contacto_correo')],
    ['Procedencia', valorContacto(visita, 'procedencia')],
    ['Clasificación', valorContacto(visita, 'clasificacion_etaria')],
    ['Dirección', valorContacto(visita, 'direccion', 'contacto_direccion')],
    ['Barrio / comunidad', valorContacto(visita, 'barrio_comunidad', 'contacto_barrio_comunidad')],
    ['Seguimiento', etiquetaSeguimiento(visita?.estado_seguimiento), false, true],
    ['Campañas asistidas', campanas || 'Ninguna', false, true],
    ['Observaciones', valorContacto(visita, 'observaciones')],
    ['Registrada', formatearFecha(visita?.creado_en), false, true],
    ['Última actualización', formatearFecha(visita?.actualizado_en), false, true]
  ].filter(([, value, , siempre]) => siempre || String(value || '').trim() !== '');
};

const validarPayloadVisita = (form) => {
  const telefono = String(form?.telefono || '').trim();
  const correo = String(form?.correo || '').trim();
  const internacional = Boolean(form?.telefono_internacional);

  if (telefono && !internacional && !TELEFONO_CR_REGEX.test(telefono)) {
    return 'El teléfono debe usar el formato 8888-8888.';
  }

  if (telefono && internacional && !TELEFONO_INTERNACIONAL_REGEX.test(telefono)) {
    return 'El teléfono internacional solo permite números, +, guiones, espacios y paréntesis.';
  }

  if (correo && !EMAIL_REGEX.test(correo)) {
    return 'Ingrese un correo válido.';
  }

  return '';
};

function VisitasFiltrosContent({
  idPrefix,
  filtros,
  cambiarFiltro,
  etiquetaCampanaFiltro,
  setMostrarFiltroCampana,
  abrirNueva,
  mostrarNuevaMovil = false
}) {
  return (
    <div className="row g-2 align-items-end">
      <div className="col-12 col-lg-4">
        <label className="form-label form-label-sm" htmlFor={`${idPrefix}-busqueda`}>Buscar</label>
        <div className="d-flex align-items-center gap-2">
          <SearchInput
            id={`${idPrefix}-busqueda`}
            value={filtros.q}
            onChange={(valor) => cambiarFiltro('q', valor)}
            placeholder="Nombre, telefono o procedencia"
            className="flex-grow-1 visitas-search-input"
          />
          <button
            type="button"
            className={`btn btn-primary visitas-nueva-btn align-items-center justify-content-center ${mostrarNuevaMovil ? 'd-flex' : 'd-lg-none d-flex'}`}
            onClick={abrirNueva}
            title="Registrar nueva visita"
            aria-label="Registrar nueva visita"
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div className="col-12 col-lg-3">
        <label className="form-label form-label-sm" htmlFor={`${idPrefix}-campana`}>Campana</label>
        <div className="input-group input-group-sm">
          <input
            id={`${idPrefix}-campana`}
            type="text"
            className="form-control form-control-sm"
            readOnly
            value={etiquetaCampanaFiltro}
            style={{ cursor: 'pointer', backgroundColor: '#fff' }}
            onClick={() => setMostrarFiltroCampana(true)}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setMostrarFiltroCampana(true)}
            title="Buscar campana"
            aria-label="Buscar campana"
          >
            <i className="bi bi-search" aria-hidden="true"></i>
          </button>
          {filtros.campana_id && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => cambiarFiltro('campana_id', '')}
              title="Quitar filtro"
              aria-label="Quitar filtro de campana"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </div>
      <div className="col-6 col-lg-2">
        <label className="form-label form-label-sm" htmlFor={`${idPrefix}-seguimiento`}>Seguimiento</label>
        <select id={`${idPrefix}-seguimiento`} className="form-select form-select-sm" value={filtros.estado_seguimiento} onChange={(e) => cambiarFiltro('estado_seguimiento', e.target.value)}>
          <option value="">Todos</option>
          {SEGUIMIENTO_OPCIONES.map(o => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
      </div>
      <div className="col-6 col-lg-2">
        <label className="form-label form-label-sm" htmlFor={`${idPrefix}-clasificacion`}>Clasificacion</label>
        <select id={`${idPrefix}-clasificacion`} className="form-select form-select-sm" value={filtros.clasificacion_etaria} onChange={(e) => cambiarFiltro('clasificacion_etaria', e.target.value)}>
          <option value="">Todas</option>
          {ETARIA_OPCIONES.map(o => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
      </div>
      <div className={mostrarNuevaMovil ? 'd-none' : 'col-lg-1 d-none d-lg-flex'}>
        <button
          type="button"
          className="btn btn-primary btn-sm visitas-nueva-btn w-100 d-flex align-items-center justify-content-center gap-1"
          onClick={abrirNueva}
          title="Registrar nueva visita"
        >
          <i className="bi bi-plus-lg" aria-hidden="true"></i>
          <span>Nueva</span>
        </button>
      </div>
    </div>
  );
}

function VisitasFiltrosMobileSheet({ abierto, onCerrar, children }) {
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
      <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Filtros de visitas">
        <div className="mobile-filter-sheet-head">
          <h5 className="mb-0">Filtros</h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="mobile-filter-sheet-body">{children}</div>
      </div>
    </div>
  );
}

function VisitasKpiCard({ label, value, icon, action = null, className = 'col-6 col-md-4' }) {
  return (
    <div className={className}>
      <div className="card shadow-sm estudios-kpi-card h-100">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="estudios-kpi-label">{label}</span>
            <span className="d-inline-flex align-items-center gap-1 visitas-mobile-kpi-actions">
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

export default function VisitasGeneralView({ campanas = CAMPANAS_VACIAS }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({ q: '', estado_seguimiento: '', clasificacion_etaria: '', campana_id: '' });

  const [mostrarFormModal, setMostrarFormModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [valorFormInicial, setValorFormInicial] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [visitaDetalle, setVisitaDetalle] = useState(null);
  const [campanasModal, setCampanasModal] = useState(null);

  const [mostrarFiltroCampana, setMostrarFiltroCampana] = useState(false);
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);
  const [marcandoId, setMarcandoId] = useState(null);

  const [warningSimilares, setWarningSimilares] = useState(null);
  const [pendingFormPayload, setPendingFormPayload] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
      const res = await campanaApi.listarVisitas(params);
      if (res?.exito) {
        setItems(res.datos?.items || []);
      }
    } catch (error) {
      setItems([]);
      notificarError(error?.mensaje || 'No se pudieron cargar las visitas.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const personasUnicas = useMemo(() => {
    const map = new Map();
    items.forEach(v => {
      const key = normalizarNombre(v.nombre_snapshot || '') || `id-${v.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, v);
      } else {
        const ta = v.creado_en ? new Date(v.creado_en).getTime() : 0;
        const tb = existing.creado_en ? new Date(existing.creado_en).getTime() : 0;
        if (ta > tb) map.set(key, v);
      }
    });
    return Array.from(map.values());
  }, [items]);

  const kpis = useMemo(() => {
    const total = personasUnicas.length;
    const independientes = personasUnicas.filter(v => parsearCampanasAsistidas(v.campanas_asistidas_raw).length === 0).length;
    const pendientes = personasUnicas
      .filter(v => v.estado_seguimiento === 'PENDIENTE')
      .sort((a, b) => {
        const ta = a.creado_en ? new Date(a.creado_en).getTime() : 0;
        const tb = b.creado_en ? new Date(b.creado_en).getTime() : 0;
        return ta - tb;
      });
    return { total, independientes, pendientes };
  }, [personasUnicas]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const etiquetaCampanaFiltro = useMemo(() => {
    if (!filtros.campana_id) return 'Todas las campañas';
    if (filtros.campana_id === 'SUELTAS') return 'Solo visitas sin campaña';
    const c = campanas.find(x => String(x.id) === String(filtros.campana_id));
    return c ? c.lema : 'Campaña seleccionada';
  }, [filtros.campana_id, campanas]);

  const abrirNueva = () => {
    setEditandoId(null);
    setValorFormInicial(null);
    setMostrarFormModal(true);
  };

  const abrirEdicion = (v) => {
    setEditandoId(v.id);
    setValorFormInicial({
      nombre_completo: v.nombre_snapshot || '',
      telefono: valorContacto(v, 'telefono_snapshot', 'contacto_telefono'),
      telefono_internacional: Boolean(valorContacto(v, 'telefono_snapshot', 'contacto_telefono') && !TELEFONO_CR_REGEX.test(valorContacto(v, 'telefono_snapshot', 'contacto_telefono'))),
      correo: valorContacto(v, 'correo', 'contacto_correo'),
      direccion: valorContacto(v, 'direccion', 'contacto_direccion'),
      barrio_comunidad: valorContacto(v, 'barrio_comunidad', 'contacto_barrio_comunidad'),
      procedencia: v.procedencia || '',
      tipo_asistente: v.tipo_asistente || 'VISITA',
      clasificacion_etaria: v.clasificacion_etaria || '',
      primera_vez: v.primera_vez ?? true,
      observaciones: v.observaciones || '',
      estado_seguimiento: v.estado_seguimiento || 'PENDIENTE'
    });
    setMostrarFormModal(true);
  };

  const ejecutarGuardado = async (form) => {
    setGuardando(true);
    try {
      const res = editandoId
        ? await campanaApi.actualizarAsistente(editandoId, form)
        : await campanaApi.crearVisitaSuelta(form);
      if (res?.exito) {
        notificarExito(res.mensaje || (editandoId ? 'Visita actualizada.' : 'Visita registrada.'));
        setMostrarFormModal(false);
        setWarningSimilares(null);
        setPendingFormPayload(null);
        setEditandoId(null);
        setValorFormInicial(null);
        await cargar();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la visita.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarVisita = async (form) => {
    if (!form.nombre_completo.trim()) {
      notificarError('El nombre es obligatorio.');
      return;
    }
    const errorValidacion = validarPayloadVisita(form);
    if (errorValidacion) {
      notificarError(errorValidacion);
      return;
    }
    try {
      const params = { nombre: form.nombre_completo };
      if (editandoId) params.excluir_id = editandoId;
      const resSim = await campanaApi.buscarVisitasSimilares(params);
      const similares = resSim?.exito ? (resSim.datos?.items || []) : [];
      if (similares.length > 0) {
        setPendingFormPayload(form);
        setWarningSimilares({ nombre: form.nombre_completo, similares });
        return;
      }
    } catch (error) {
      // si falla la búsqueda de similares, seguir guardando para no bloquear el flujo
    }
    await ejecutarGuardado(form);
  };

  const eliminarVisita = async (v) => {
    if (!window.confirm(`¿Está seguro de eliminar a "${v.nombre_snapshot}"?`)) return;
    try {
      const res = await campanaApi.eliminarAsistente(v.id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Visita eliminada.');
        await cargar();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo eliminar la visita.');
    }
  };

  const marcarContactado = async (v) => {
    setMarcandoId(v.id);
    try {
      const payload = {
        nombre_completo: v.nombre_snapshot || '',
        telefono: valorContacto(v, 'telefono_snapshot', 'contacto_telefono'),
        telefono_internacional: Boolean(valorContacto(v, 'telefono_snapshot', 'contacto_telefono') && !TELEFONO_CR_REGEX.test(valorContacto(v, 'telefono_snapshot', 'contacto_telefono'))),
        correo: valorContacto(v, 'correo', 'contacto_correo'),
        direccion: valorContacto(v, 'direccion', 'contacto_direccion'),
        barrio_comunidad: valorContacto(v, 'barrio_comunidad', 'contacto_barrio_comunidad'),
        procedencia: v.procedencia || '',
        tipo_asistente: v.tipo_asistente || 'VISITA',
        clasificacion_etaria: v.clasificacion_etaria || '',
        primera_vez: v.primera_vez ?? true,
        observaciones: v.observaciones || '',
        estado_seguimiento: 'CONTACTADO'
      };
      const res = await campanaApi.actualizarAsistente(v.id, payload);
      if (res?.exito) {
        notificarExito('Marcada como contactada.');
        await cargar();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar el estado.');
    } finally {
      setMarcandoId(null);
    }
  };

  return (
    <>
      <div className="row g-2 mb-3 align-items-stretch visitas-mobile-kpi-row">
        <VisitasKpiCard label="Total visitas" value={kpis.total} icon="bi-people" />
        <VisitasKpiCard label="Fuera de campaña" value={kpis.independientes} icon="bi-door-open" />
        <div className="col-12 col-md-4">
          <div className="card shadow-sm estudios-kpi-card h-100">
            <div className="card-body py-3">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span className="estudios-kpi-label">Faltan por contactar</span>
                <span className="d-inline-flex align-items-center gap-1 visitas-mobile-kpi-actions">
                {kpis.pendientes.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: '34px', height: '34px' }}
                    onClick={() => setMostrarPendientes(true)}
                    title="Ver quiénes faltan por contactar"
                    aria-label="Ver pendientes por contactar"
                  >
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </button>
                )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-circle d-md-none align-items-center justify-content-center"
                    style={{ width: '34px', height: '34px' }}
                    onClick={() => setMostrarFiltrosMovil(true)}
                    title="Filtros"
                    aria-label="Abrir filtros de visitas"
                  >
                    <i className="bi bi-funnel" aria-hidden="true"></i>
                  </button>
                </span>
              </div>
              <div className="estudios-kpi-value">{Number(kpis.pendientes.length || 0).toLocaleString('es-CR')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3 visitas-filtros-card visitas-filtros-card-desktop">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-4">
              <label htmlFor="visitas-general-busqueda" className="form-label form-label-sm">Buscar</label>
              <div className="d-flex align-items-center gap-2">
                <SearchInput
                  id="visitas-general-busqueda"
                  value={filtros.q}
                  onChange={(valor) => cambiarFiltro('q', valor)}
                  placeholder="Nombre, teléfono o procedencia"
                  className="flex-grow-1 visitas-search-input"
                />
                <button
                  type="button"
                  className="btn btn-primary visitas-nueva-btn d-lg-none d-flex align-items-center justify-content-center"
                  onClick={abrirNueva}
                  title="Registrar nueva visita"
                  aria-label="Registrar nueva visita"
                >
                  <i className="bi bi-plus-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div className="col-12 col-lg-3">
              <label htmlFor="visitas-general-campana" className="form-label form-label-sm">Campaña</label>
              <div className="input-group input-group-sm">
                <input
                  id="visitas-general-campana"
                  type="text"
                  className="form-control form-control-sm"
                  readOnly
                  value={etiquetaCampanaFiltro}
                  style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                  onClick={() => setMostrarFiltroCampana(true)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setMostrarFiltroCampana(true)}
                  title="Buscar campaña"
                  aria-label="Buscar campaña"
                >
                  <i className="bi bi-search" aria-hidden="true"></i>
                </button>
                {filtros.campana_id && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => cambiarFiltro('campana_id', '')}
                    title="Quitar filtro"
                    aria-label="Quitar filtro de campaña"
                  >
                    <i className="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="visitas-general-seguimiento" className="form-label form-label-sm">Seguimiento</label>
              <select id="visitas-general-seguimiento" className="form-select form-select-sm" value={filtros.estado_seguimiento} onChange={(e) => cambiarFiltro('estado_seguimiento', e.target.value)}>
                <option value="">Todos</option>
                {SEGUIMIENTO_OPCIONES.map(o => (
                  <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="visitas-general-clasificacion" className="form-label form-label-sm">Clasificación</label>
              <select id="visitas-general-clasificacion" className="form-select form-select-sm" value={filtros.clasificacion_etaria} onChange={(e) => cambiarFiltro('clasificacion_etaria', e.target.value)}>
                <option value="">Todas</option>
                {ETARIA_OPCIONES.map(o => (
                  <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-1 d-none d-lg-flex">
              <button
                type="button"
                className="btn btn-primary btn-sm visitas-nueva-btn w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={abrirNueva}
                title="Registrar nueva visita"
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                <span>Nueva</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <VisitasFiltrosMobileSheet abierto={mostrarFiltrosMovil} onCerrar={() => setMostrarFiltrosMovil(false)}>
        <VisitasFiltrosContent
          idPrefix="visitas-general-mobile"
          filtros={filtros}
          cambiarFiltro={cambiarFiltro}
          etiquetaCampanaFiltro={etiquetaCampanaFiltro}
          setMostrarFiltroCampana={setMostrarFiltroCampana}
          abrirNueva={abrirNueva}
          mostrarNuevaMovil
        />
      </VisitasFiltrosMobileSheet>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div style={{ maxHeight: 'clamp(300px, 44vh, 390px)', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="table table-striped table-hover align-middle mb-0" style={{ fontSize: '0.875rem', minWidth: '720px' }}>
              <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Visita</th>
                  <th className="text-center">Campañas asistidas</th>
                  <th>Campañas</th>
                  <th>Tipo</th>
                  <th>Seguimiento</th>
                  <th>Procedencia</th>
                  <th>Registrada</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr><td colSpan="8" className="text-center text-muted py-3">Cargando...</td></tr>
                )}
                {!cargando && items.length === 0 && (
                  <tr><td colSpan="8" className="text-center text-muted py-3">No hay visitas con esos filtros.</td></tr>
                )}
                {!cargando && items.map((v) => {
                  const lemas = parsearCampanasAsistidas(v.campanas_asistidas_raw);
                  const visiblesMax = 2;
                  const visibles = lemas.slice(0, visiblesMax);
                  const restantes = lemas.length - visibles.length;
                  return (
                  <tr key={v.id}>
                    <td>
                      <div className="fw-semibold">{v.nombre_snapshot}</div>
                      {v.telefono_snapshot && <div className="small text-muted">{v.telefono_snapshot}</div>}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${lemas.length > 0 ? 'bg-primary-subtle text-primary-emphasis' : 'bg-light text-muted border'}`}>
                        {lemas.length}
                      </span>
                    </td>
                    <td style={{ maxWidth: '260px' }}>
                      {lemas.length === 0 ? (
                        <span className="small text-muted">—</span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1 align-items-center">
                          {visibles.map((lema) => (
                            <span key={`${v.id}-${lema}`} className="badge bg-light text-dark border" style={{ whiteSpace: 'normal', textAlign: 'left' }}>{lema}</span>
                          ))}
                          {restantes > 0 && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-decoration-none small"
                              onClick={() => setCampanasModal({ nombre: v.nombre_snapshot, lemas })}
                            >
                              +{restantes} más
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td><span className="badge text-bg-light border">{v.tipo_asistente}</span></td>
                    <td><span className="small">{etiquetaSeguimiento(v.estado_seguimiento)}</span></td>
                    <td><span className="small text-muted">{v.procedencia || '-'}</span></td>
                    <td><span className="small text-muted">{formatearFecha(v.creado_en)}</span></td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => setVisitaDetalle(v)}
                          title="Ver detalle"
                          aria-label="Ver detalle"
                        >
                          <i className="bi bi-search" aria-hidden="true"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => abrirEdicion(v)}
                          title="Editar"
                          aria-label="Editar visita"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => eliminarVisita(v)}
                          title="Eliminar"
                          aria-label="Eliminar visita"
                        >
                          <i className="bi bi-trash" aria-hidden="true"></i>
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

      {visitaDetalle && (
        <div
          className="prompt-overlay-iasd"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVisitaDetalle(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setVisitaDetalle(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar detalle de la visita"
        >
          <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '560px', width: '95%' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0">Detalle de la visita</h5>
              <button type="button" className="btn-close" onClick={() => setVisitaDetalle(null)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="d-flex flex-column gap-2 small">
                {construirFilasDetalleVisita(visitaDetalle).map(([label, value, bold]) => (
                  <div key={label} className="d-flex flex-column flex-sm-row gap-1 gap-sm-3 pb-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div className="text-muted" style={{ minWidth: '160px' }}>{label}</div>
                    <div className={bold ? 'fw-semibold' : ''} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', flex: 1 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setVisitaDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {campanasModal && (
        <div
          className="prompt-overlay-iasd"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCampanasModal(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setCampanasModal(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar campañas asistidas"
        >
          <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '500px', width: '95%' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h6 className="mb-0">Campañas asistidas por "{campanasModal.nombre}"</h6>
              <button type="button" className="btn-close" onClick={() => setCampanasModal(null)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '0.75rem 0', maxHeight: '50vh', overflowY: 'auto' }}>
              <ul className="list-group">
                {campanasModal.lemas.map((lema) => (
                  <li key={`${campanasModal.nombre}-${lema}`} className="list-group-item small">{lema}</li>
                ))}
              </ul>
            </div>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCampanasModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarFormModal && (
        <VisitaFormModal
          editandoId={editandoId}
          valorInicial={valorFormInicial}
          onCerrar={() => { setMostrarFormModal(false); setEditandoId(null); setValorFormInicial(null); }}
          onGuardar={guardarVisita}
          guardando={guardando}
        />
      )}

      <VisitasPendientesModal
        mostrar={mostrarPendientes}
        items={kpis.pendientes}
        onCerrar={() => setMostrarPendientes(false)}
        onMarcarContactado={marcarContactado}
        marcandoId={marcandoId}
      />

      <CampanaFiltroModal
        mostrar={mostrarFiltroCampana}
        campanas={campanas}
        campanaIdSeleccionada={filtros.campana_id}
        onCerrar={() => setMostrarFiltroCampana(false)}
        onSeleccionar={(c) => { cambiarFiltro('campana_id', c.id); setMostrarFiltroCampana(false); }}
        onLimpiar={() => { cambiarFiltro('campana_id', ''); setMostrarFiltroCampana(false); }}
        onSeleccionarSueltas={() => { cambiarFiltro('campana_id', 'SUELTAS'); setMostrarFiltroCampana(false); }}
      />

      <VisitaDuplicadaWarningModal
        mostrar={Boolean(warningSimilares)}
        nombreIntentado={warningSimilares?.nombre || ''}
        similares={warningSimilares?.similares || []}
        guardando={guardando}
        onAgregarDeTodosModos={() => pendingFormPayload && ejecutarGuardado(pendingFormPayload)}
        onCancelar={() => { setWarningSimilares(null); setPendingFormPayload(null); }}
      />
    </>
  );
}
