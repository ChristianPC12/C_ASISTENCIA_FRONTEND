import { useState, useRef, useEffect } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

/** Valor por defecto estable para evitar nueva referencia en cada render */
const FECHAS_VACIAS = [];

/**
 * Formatea una fecha como YYYY-MM-DD
 */
function formatear(anio, mes, dia) {
  const m = String(mes + 1).padStart(2, '0');
  const d = String(dia).padStart(2, '0');
  return `${anio}-${m}-${d}`;
}

/**
 * Parsea YYYY-MM-DD a { anio, mes (0-based), dia }
 */
function parsear(valor) {
  if (!valor) return null;
  const [a, m, d] = valor.split('-').map(Number);
  return { anio: a, mes: m - 1, dia: d };
}

/** Ejecuta el callback cuando se presiona Enter o Espacio */
function alPresionarTecla(callback) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(e);
    }
  };
}

/* ─── Sub-componente: Encabezado de navegacion de mes ─────── */
function EncabezadoCalendario({ mesVista, anioVista, onAnterior, onSiguiente }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <button type="button" className="btn btn-sm btn-outline-secondary border-0" onClick={onAnterior}>
        <i className="bi bi-chevron-left"></i>
      </button>
      <strong className="text-capitalize" style={{ color: 'var(--iasd-azul, #003366)' }}>
        {MESES[mesVista]} {anioVista}
      </strong>
      <button type="button" className="btn btn-sm btn-outline-secondary border-0" onClick={onSiguiente}>
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

/* ─── Sub-componente: Celda individual del calendario ──────── */
function CeldaDia({ celda, onSeleccionar, nombreDia }) {
  // Celda de relleno (mes anterior / siguiente)
  if (!celda.esteMs) {
    return (
      <div style={{ padding: '6px 0', fontSize: '0.85rem', color: '#ccc', borderRadius: '4px' }}>
        {celda.dia}
      </div>
    );
  }

  // Celda deshabilitada (dia no permitido o ya registrado)
  if (!celda.habilitado) {
    return (
      <div
        style={{
          padding: '6px 0',
          fontSize: '0.85rem',
          color: celda.yaRegistrado ? '#999' : '#ccc',
          textDecoration: celda.yaRegistrado ? 'none' : 'line-through',
          borderRadius: '4px',
          cursor: 'not-allowed',
          backgroundColor: celda.yaRegistrado ? '#e8e8e8' : 'transparent'
        }}
        title={celda.yaRegistrado ? 'Ya registrado' : `No disponible — solo dias ${nombreDia || ''}`}
      >
        {celda.dia}
        {celda.yaRegistrado && (
          <div style={{ fontSize: '0.55rem', lineHeight: 1, color: '#E74C3C' }}>✓</div>
        )}
      </div>
    );
  }

  // Celda habilitada (seleccionable)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSeleccionar(celda.dia)}
      onKeyDown={alPresionarTecla(() => onSeleccionar(celda.dia))}
      style={{
        padding: '6px 0',
        fontSize: '0.85rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: celda.esSeleccionado || celda.esHoy ? 700 : 400,
        backgroundColor: celda.esSeleccionado
          ? 'var(--iasd-azul, #003366)'
          : celda.esHoy
            ? '#e8f0fe'
            : 'transparent',
        color: celda.esSeleccionado
          ? '#fff'
          : 'var(--iasd-texto, #2D3436)',
        border: celda.esHoy && !celda.esSeleccionado
          ? '1px solid var(--iasd-azul, #003366)'
          : '1px solid transparent',
        transition: 'background-color 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!celda.esSeleccionado) {
          e.currentTarget.style.backgroundColor = 'var(--iasd-dorado, #C5A028)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (!celda.esSeleccionado) {
          e.currentTarget.style.backgroundColor = celda.esHoy ? '#e8f0fe' : 'transparent';
          e.currentTarget.style.color = 'var(--iasd-texto, #2D3436)';
        }
      }}
    >
      {celda.dia}
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────────── */

/**
 * Selector de fecha personalizado con filtro por dia de la semana.
 */
export default function SelectorFecha({
  value,
  onChange,
  diaPermitido = null,
  fechasDeshabilitadas = FECHAS_VACIAS,
  disabled = false,
  className = '',
  placeholder = 'Seleccionar fecha',
  nombreDia = ''
}) {
  const fechasOcupadas = new Set(fechasDeshabilitadas);
  const hoy = new Date();
  const fechaSeleccionada = parsear(value);

  const [mesVista, setMesVista] = useState(
    fechaSeleccionada ? fechaSeleccionada.mes : hoy.getMonth()
  );
  const [anioVista, setAnioVista] = useState(
    fechaSeleccionada ? fechaSeleccionada.anio : hoy.getFullYear()
  );
  const [abierto, setAbierto] = useState(false);
  const refContenedor = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (refContenedor.current && !refContenedor.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener('mousedown', manejarClickFuera);
    }
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, [abierto]);

  // Actualizar vista cuando cambia el valor externamente (ej: edicion)
  useEffect(() => {
    if (fechaSeleccionada) {
      setMesVista(fechaSeleccionada.mes);
      setAnioVista(fechaSeleccionada.anio);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const mesAnterior = () => {
    if (mesVista === 0) { setMesVista(11); setAnioVista(a => a - 1); }
    else { setMesVista(m => m - 1); }
  };

  const mesSiguiente = () => {
    if (mesVista === 11) { setMesVista(0); setAnioVista(a => a + 1); }
    else { setMesVista(m => m + 1); }
  };

  // Generar las celdas del calendario
  const generarDias = () => {
    const primerDia = new Date(anioVista, mesVista, 1);
    const inicioDia = primerDia.getDay();
    const diasEnMes = new Date(anioVista, mesVista + 1, 0).getDate();
    const diasMesAnterior = new Date(anioVista, mesVista, 0).getDate();
    const celdas = [];

    // Relleno inicio (dias del mes anterior)
    for (let i = inicioDia - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      celdas.push({ dia, esteMs: false, habilitado: false, clave: `prev-${dia}` });
    }

    // Dias del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(anioVista, mesVista, d);
      const diaSemana = fecha.getDay();
      const fechaStr = formatear(anioVista, mesVista, d);
      const esDiaPermitido = diaPermitido === null || diaPermitido === undefined || diaSemana === diaPermitido;
      const yaRegistrado = fechasOcupadas.has(fechaStr);

      celdas.push({
        dia: d, esteMs: true,
        habilitado: esDiaPermitido && !yaRegistrado,
        esHoy: d === hoy.getDate() && mesVista === hoy.getMonth() && anioVista === hoy.getFullYear(),
        esSeleccionado: fechaSeleccionada && d === fechaSeleccionada.dia && mesVista === fechaSeleccionada.mes && anioVista === fechaSeleccionada.anio,
        yaRegistrado,
        clave: `dia-${d}`
      });
    }

    // Relleno final
    const restante = 7 - (celdas.length % 7);
    if (restante < 7) {
      for (let i = 1; i <= restante; i++) {
        celdas.push({ dia: i, esteMs: false, habilitado: false, clave: `next-${i}` });
      }
    }

    return celdas;
  };

  const seleccionarDia = (dia) => {
    onChange(formatear(anioVista, mesVista, dia));
    setAbierto(false);
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const textoMostrado = value
    ? new Date(anioVista, fechaSeleccionada?.mes ?? 0, fechaSeleccionada?.dia ?? 1)
        .toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const celdas = generarDias();

  return (
    <div ref={refContenedor} style={{ position: 'relative' }}>
      {/* Input que muestra la fecha y abre el calendario */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`form-control d-flex align-items-center justify-content-between ${disabled ? 'bg-light' : ''} ${className}`}
        onClick={() => !disabled && setAbierto(!abierto)}
        onKeyDown={alPresionarTecla(() => !disabled && setAbierto(!abierto))}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '38px',
          userSelect: 'none'
        }}
      >
        <span className={value ? 'text-dark' : 'text-muted'}>
          {value ? textoMostrado : placeholder}
        </span>
        <span className="d-flex align-items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              className="btn btn-link p-0 border-0"
              onClick={limpiar}
              title="Limpiar fecha"
              aria-label="Limpiar fecha"
              style={{ lineHeight: 1 }}
            >
              <i className="bi bi-x-circle text-secondary" style={{ fontSize: '0.85rem' }}></i>
            </button>
          )}
          <i className="bi bi-calendar3 text-secondary"></i>
        </span>
      </div>

      {/* Dropdown del calendario */}
      {abierto && (
        <div
          className="card shadow"
          style={{
            position: 'absolute',
            zIndex: 1050,
            top: '100%',
            left: 0,
            minWidth: '300px',
            marginTop: '4px'
          }}
        >
          <div className="card-body p-2">
            <EncabezadoCalendario
              mesVista={mesVista}
              anioVista={anioVista}
              onAnterior={mesAnterior}
              onSiguiente={mesSiguiente}
            />

            {nombreDia && (
              <div className="text-center mb-2">
                <small className="badge" style={{ backgroundColor: 'var(--iasd-dorado, #C5A028)', color: '#fff' }}>
                  Solo dias {nombreDia}
                </small>
              </div>
            )}

            {/* Encabezados de dias de la semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px', marginBottom: '4px' }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--iasd-texto-sec, #636E72)', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas de dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px' }}>
              {celdas.map((celda) => (
                <CeldaDia key={celda.clave} celda={celda} onSeleccionar={seleccionarDia} nombreDia={nombreDia} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
