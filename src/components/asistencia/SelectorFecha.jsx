import { useState, useRef, useEffect } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

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

/**
 * Selector de fecha personalizado con filtro por dia de la semana.
 *
 * Props:
 *  - value: string YYYY-MM-DD
 *  - onChange: (valorYYYYMMDD: string) => void
 *  - diaPermitido: number (0=Dom,...,6=Sab) o null para todos
 *  - disabled: boolean
 *  - className: clases adicionales para el input
 *  - placeholder: texto del placeholder
 *  - nombreDia: nombre del dia para mostrar (ej: "sabado")
 */
export default function SelectorFecha({
  value,
  onChange,
  diaPermitido = null,
  disabled = false,
  className = '',
  placeholder = 'Seleccionar fecha',
  nombreDia = ''
}) {
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

  // Navegar meses
  const mesAnterior = () => {
    if (mesVista === 0) {
      setMesVista(11);
      setAnioVista(a => a - 1);
    } else {
      setMesVista(m => m - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesVista === 11) {
      setMesVista(0);
      setAnioVista(a => a + 1);
    } else {
      setMesVista(m => m + 1);
    }
  };

  // Generar las celdas del calendario
  const generarDias = () => {
    const primerDia = new Date(anioVista, mesVista, 1);
    const inicioDia = primerDia.getDay(); // 0=Dom
    const diasEnMes = new Date(anioVista, mesVista + 1, 0).getDate();
    const diasMesAnterior = new Date(anioVista, mesVista, 0).getDate();

    const celdas = [];

    // Dias del mes anterior (relleno)
    for (let i = inicioDia - 1; i >= 0; i--) {
      celdas.push({ dia: diasMesAnterior - i, esteMs: false, habilitado: false });
    }

    // Dias del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(anioVista, mesVista, d);
      const diaSemana = fecha.getDay();
      const habilitado = diaPermitido === null || diaPermitido === undefined || diaSemana === diaPermitido;
      const esHoy = d === hoy.getDate() && mesVista === hoy.getMonth() && anioVista === hoy.getFullYear();
      const esSeleccionado = fechaSeleccionada &&
        d === fechaSeleccionada.dia &&
        mesVista === fechaSeleccionada.mes &&
        anioVista === fechaSeleccionada.anio;

      celdas.push({ dia: d, esteMs: true, habilitado, esHoy, esSeleccionado });
    }

    // Relleno final para completar la cuadricula (filas de 7)
    const restante = 7 - (celdas.length % 7);
    if (restante < 7) {
      for (let i = 1; i <= restante; i++) {
        celdas.push({ dia: i, esteMs: false, habilitado: false });
      }
    }

    return celdas;
  };

  const seleccionarDia = (dia) => {
    const valor = formatear(anioVista, mesVista, dia);
    onChange(valor);
    setAbierto(false);
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Texto a mostrar en el input
  const textoMostrado = value
    ? new Date(anioVista, fechaSeleccionada?.mes ?? 0, fechaSeleccionada?.dia ?? 1)
        .toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const celdas = generarDias();

  return (
    <div ref={refContenedor} style={{ position: 'relative' }}>
      {/* Input que muestra la fecha y abre el calendario */}
      <div
        className={`form-control d-flex align-items-center justify-content-between ${disabled ? 'bg-light' : ''} ${className}`}
        onClick={() => !disabled && setAbierto(!abierto)}
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
            <i
              className="bi bi-x-circle text-secondary"
              style={{ cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={limpiar}
              title="Limpiar fecha"
            ></i>
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
            {/* Encabezado: navegacion de mes */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                onClick={mesAnterior}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <strong className="text-capitalize" style={{ color: 'var(--iasd-azul, #003366)' }}>
                {MESES[mesVista]} {anioVista}
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                onClick={mesSiguiente}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            {/* Indicador de dia permitido */}
            {nombreDia && (
              <div className="text-center mb-2">
                <small className="badge" style={{ backgroundColor: 'var(--iasd-dorado, #C5A028)', color: '#fff' }}>
                  Solo dias {nombreDia}
                </small>
              </div>
            )}

            {/* Encabezados de dias de la semana */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                gap: '2px',
                marginBottom: '4px'
              }}
            >
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--iasd-texto-sec, #636E72)',
                    padding: '4px 0'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas de dias */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                gap: '2px'
              }}
            >
              {celdas.map((celda, i) => {
                if (!celda.esteMs) {
                  return (
                    <div
                      key={`r-${i}`}
                      style={{
                        padding: '6px 0',
                        fontSize: '0.85rem',
                        color: '#ccc',
                        borderRadius: '4px'
                      }}
                    >
                      {celda.dia}
                    </div>
                  );
                }

                if (!celda.habilitado) {
                  return (
                    <div
                      key={`d-${celda.dia}`}
                      style={{
                        padding: '6px 0',
                        fontSize: '0.85rem',
                        color: '#ccc',
                        textDecoration: 'line-through',
                        borderRadius: '4px',
                        cursor: 'not-allowed'
                      }}
                      title={`No disponible — solo dias ${nombreDia || ''}`}
                    >
                      {celda.dia}
                    </div>
                  );
                }

                return (
                  <div
                    key={`d-${celda.dia}`}
                    onClick={() => seleccionarDia(celda.dia)}
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
              })}
            </div>

            {/* Boton Hoy */}
            <div className="text-center mt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setMesVista(hoy.getMonth());
                  setAnioVista(hoy.getFullYear());
                }}
              >
                Hoy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
