import { ANIO_OPCIONES, MES_OPCIONES } from '../config/constants';
import { usePresentaciones } from '../hooks/usePresentaciones';

function formatearFechaHora(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function SeccionPresentacion({ seccion }) {
  const titulo = seccion.id === 'kpis_clave' ? 'Indicadores Clave' : seccion.titulo;

  return (
    <div className="presentacion-seccion card shadow-sm">
      <div className="card-body">
        <h6 className="presentacion-seccion-titulo">{titulo}</h6>
        <p className="mb-2">{seccion.resumen}</p>
        <ul className="mb-0">
          {Array.isArray(seccion.puntos) && seccion.puntos.map((punto, idx) => (
            <li key={`${seccion.id}-${idx}`}>{punto}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PresentacionesPage() {
  const {
    esAdmin,
    cultos,
    usuarios,
    filtros,
    presentaciones,
    meta,
    seleccionadaId,
    detalle,
    cargandoLista,
    cargandoDetalle,
    cambiarFiltro,
    setSeleccionadaId,
    irPagina,
    etiquetaMes
  } = usePresentaciones();

  const aplicarScrollLista = presentaciones.length > 8;

  const secciones = detalle?.presentacion?.secciones || [];
  const periodo = detalle?.presentacion?.periodo || {};

  const exportarPdf = async () => {
    if (!detalle) return;
    const { jsPDF } = await import('jspdf');

    const tituloPeriodo = `${etiquetaMes(periodo.mes || detalle.mes)} ${periodo.anio || detalle.anio}`;
    const culto = periodo.culto_codigo || detalle.culto_codigo || 'TODOS';
    const generado = formatearFechaHora(detalle.creado_en);
    const totalRegistros = periodo.total_registros ?? detalle?.metricas?.resumen?.total_registros ?? 0;
    const totalAsistentes = periodo.total_asistentes ?? detalle?.metricas?.resumen?.total_asistentes ?? 0;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 14;
    let y = margin;

    const asegurarEspacio = (altoNecesario) => {
      if (y + altoNecesario > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const escribirTexto = (texto, opciones = {}) => {
      const {
        fuente = 'normal',
        tamano = 11,
        sangria = 0,
        espacioDespues = 8
      } = opciones;

      doc.setFont('helvetica', fuente);
      doc.setFontSize(tamano);

      const ancho = pageWidth - (margin * 2) - sangria;
      const lineas = doc.splitTextToSize(String(texto ?? ''), ancho);
      asegurarEspacio((lineas.length * lineHeight) + espacioDespues);
      doc.text(lineas, margin + sangria, y);
      y += (lineas.length * lineHeight) + espacioDespues;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Presentacion Mensual', margin, y);
    y += 24;

    escribirTexto(`Periodo: ${tituloPeriodo}`, { tamano: 11, espacioDespues: 4 });
    escribirTexto(`Culto: ${culto}`, { tamano: 11, espacioDespues: 4 });
    escribirTexto(`Generado: ${generado}`, { tamano: 11, espacioDespues: 10 });
    escribirTexto(`Total registros: ${totalRegistros} | Total asistentes: ${totalAsistentes}`, { tamano: 11, espacioDespues: 14 });

    secciones.forEach((seccion) => {
      const titulo = seccion.id === 'kpis_clave' ? 'Indicadores Clave' : (seccion.titulo || 'Seccion');
      escribirTexto(titulo, { fuente: 'bold', tamano: 13, espacioDespues: 6 });
      escribirTexto(seccion.resumen || '', { tamano: 11, espacioDespues: 6 });

      if (Array.isArray(seccion.puntos)) {
        seccion.puntos.forEach((punto) => {
          escribirTexto(`- ${punto}`, { tamano: 10, sangria: 12, espacioDespues: 4 });
        });
      }

      y += 4;
    });

    const anio = String(periodo.anio || detalle.anio || '');
    const mes = String(periodo.mes || detalle.mes || '').padStart(2, '0');
    const cultoSafe = String(culto).replace(/[^A-Za-z0-9_-]/g, '_');
    doc.save(`presentacion_${anio}_${mes}_${cultoSafe}.pdf`);
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-3">Presentaciones</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label htmlFor="pres-anio" className="form-label fw-semibold">Año</label>
              <select
                id="pres-anio"
                className="form-select"
                value={filtros.anio}
                onChange={(e) => cambiarFiltro('anio', e.target.value)}
              >
                <option value="">Todos</option>
                {ANIO_OPCIONES.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="pres-mes" className="form-label fw-semibold">Mes</label>
              <select
                id="pres-mes"
                className="form-select"
                value={filtros.mes}
                onChange={(e) => cambiarFiltro('mes', e.target.value)}
              >
                <option value="">Todos</option>
                {MES_OPCIONES.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>{mes.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="pres-culto" className="form-label fw-semibold">Culto</label>
              <select
                id="pres-culto"
                className="form-select"
                value={filtros.culto}
                onChange={(e) => cambiarFiltro('culto', e.target.value)}
              >
                <option value="">Todos</option>
                {cultos.map((culto) => (
                  <option key={culto.codigo} value={culto.codigo}>{culto.nombre}</option>
                ))}
              </select>
            </div>

            {esAdmin && (
              <div className="col-12 col-md-3">
                <label htmlFor="pres-usuario" className="form-label fw-semibold">Usuario</label>
                <select
                  id="pres-usuario"
                  className="form-select"
                  value={filtros.usuario_id}
                  onChange={(e) => cambiarFiltro('usuario_id', e.target.value)}
                >
                  <option value="">Todos</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Historial</h5>
              <span className="badge bg-light text-dark">{meta.total} items</span>
            </div>
            <div className="card-body">
              {cargandoLista && (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-iasd" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              )}

              {!cargandoLista && presentaciones.length === 0 && (
                <div className="alert alert-iasd mb-0">No hay presentaciones para los filtros seleccionados.</div>
              )}

              {!cargandoLista && presentaciones.length > 0 && (
                <div className={aplicarScrollLista ? 'presentaciones-lista-scroll' : ''}>
                  <div className="list-group">
                    {presentaciones.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`list-group-item list-group-item-action presentacion-item ${seleccionadaId === item.id ? 'presentacion-item-activo' : ''}`}
                        onClick={() => setSeleccionadaId(item.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold">
                              {etiquetaMes(item.mes)} {item.anio}
                              {item.culto_codigo ? ` - ${item.culto_codigo}` : ' - TODOS'}
                            </div>
                            <small className="text-muted d-block">{item.usuario_nombre}</small>
                          </div>
                          <small className="text-muted text-nowrap">{formatearFechaHora(item.creado_en)}</small>
                        </div>
                        <p className="mb-0 mt-2 text-muted presentacion-item-resumen">{item.resumen || 'Sin resumen disponible.'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={meta.page <= 1}
                  onClick={() => irPagina(meta.page - 1)}
                >
                  Anterior
                </button>
                <small className="text-muted">Pagina {meta.page} de {meta.total_pages}</small>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={meta.page >= meta.total_pages}
                  onClick={() => irPagina(meta.page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Detalle</h5>
            </div>
            <div className="card-body">
              {cargandoDetalle && (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-iasd" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              )}

              {!cargandoDetalle && !detalle && (
                <div className="alert alert-iasd mb-0">Seleccione una presentacion para ver su contenido.</div>
              )}

              {!cargandoDetalle && detalle && (
                <>
                  <div className="presentacion-detalle-head mb-3 d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h6 className="mb-1">Plantilla {detalle.prompt_version} - {detalle.modelo}</h6>
                      <p className="mb-0 text-muted">
                        {etiquetaMes(periodo.mes || detalle.mes)} {periodo.anio || detalle.anio}
                        {' - '}
                        {(periodo.culto_codigo || detalle.culto_codigo || 'TODOS')}
                        {' - generado el '}
                        {formatearFechaHora(detalle.creado_en)}
                      </p>
                    </div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={exportarPdf}>
                      <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>
                      Exportar PDF
                    </button>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6 col-md-6">
                      <div className="card bg-light">
                        <div className="card-body py-2">
                          <small className="text-muted d-block">Total registros</small>
                          <strong>{periodo.total_registros ?? detalle?.metricas?.resumen?.total_registros ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-6">
                      <div className="card bg-light">
                        <div className="card-body py-2">
                          <small className="text-muted d-block">Total asistentes</small>
                          <strong>{periodo.total_asistentes ?? detalle?.metricas?.resumen?.total_asistentes ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    {secciones.map((seccion) => (
                      <SeccionPresentacion key={seccion.id} seccion={seccion} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
