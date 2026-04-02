import { useState } from 'react';
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
  const puntos = Array.isArray(seccion.puntos) ? seccion.puntos : [];

  return (
    <div className="presentacion-seccion card shadow-sm">
      <div className="card-body">
        <h6 className="presentacion-seccion-titulo">{seccion.titulo}</h6>
        {seccion.resumen ? <p className="mb-2">{seccion.resumen}</p> : null}
        {puntos.length > 0 ? (
          <ul className="mb-0">
            {puntos.map((punto) => (
              <li key={`${seccion.id}-${punto}`}>{punto}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function BotonCarrusel({ onClick, icono, label, disabled }) {
  return (
    <button
      type="button"
      className="btn btn-outline-primary btn-sm iasd-icon-btn-round presentacion-carousel-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <i className={`bi ${icono}`} aria-hidden="true"></i>
    </button>
  );
}

function PresentacionesFiltrosCard({
  esAdmin,
  cultos,
  usuarios,
  filtros,
  onCambiarFiltro
}) {
  return (
    <div className="card shadow-sm h-100 presentaciones-filtros-card">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-6">
            <label htmlFor="pres-anio" className="form-label fw-semibold">Año</label>
            <select
              id="pres-anio"
              className="form-select"
              value={filtros.anio}
              onChange={(event) => onCambiarFiltro('anio', event.target.value)}
            >
              <option value="">Todos</option>
              {ANIO_OPCIONES.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label htmlFor="pres-mes" className="form-label fw-semibold">Mes</label>
            <select
              id="pres-mes"
              className="form-select"
              value={filtros.mes}
              onChange={(event) => onCambiarFiltro('mes', event.target.value)}
            >
              <option value="">Todos</option>
              {MES_OPCIONES.map((mes) => (
                <option key={mes.valor} value={mes.valor}>{mes.etiqueta}</option>
              ))}
            </select>
          </div>

          <div className={esAdmin ? 'col-12 col-md-6' : 'col-12'}>
            <label htmlFor="pres-culto" className="form-label fw-semibold">Culto</label>
            <select
              id="pres-culto"
              className="form-select"
              value={filtros.culto}
              onChange={(event) => onCambiarFiltro('culto', event.target.value)}
            >
              <option value="">Todos</option>
              {cultos.map((culto) => (
                <option key={culto.codigo} value={culto.codigo}>{culto.nombre}</option>
              ))}
            </select>
          </div>

          {esAdmin && (
            <div className="col-12 col-md-6">
              <label htmlFor="pres-usuario" className="form-label fw-semibold">Usuario</label>
              <select
                id="pres-usuario"
                className="form-select"
                value={filtros.usuario_id}
                onChange={(event) => onCambiarFiltro('usuario_id', event.target.value)}
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
  );
}

function PresentacionesHistorialCard({
  presentaciones,
  meta,
  seleccionadaId,
  cargandoLista,
  setSeleccionadaId,
  irPagina,
  etiquetaMes,
  onAbrirDetalle,
  detalleDisponible
}) {
  return (
    <div className="card shadow-sm h-100 presentaciones-historial-card">
      <div className="card-body d-flex flex-column">
        <div className="presentaciones-card-meta mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="presentaciones-card-label">Historial</span>
            <span className="badge bg-light text-dark">{meta.total} items</span>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm presentaciones-detalle-btn"
            onClick={onAbrirDetalle}
            disabled={!detalleDisponible}
          >
            <i className="bi bi-eye" aria-hidden="true"></i>
            <span className="presentaciones-detalle-btn-label">Detalle</span>
          </button>
        </div>

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
          <div className="presentaciones-lista-shell presentaciones-lista-scroll">
            <div className="list-group">
              {presentaciones.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`list-group-item list-group-item-action presentacion-item ${seleccionadaId === item.id ? 'presentacion-item-activo' : ''}`}
                  onClick={() => {
                    if (seleccionadaId === item.id) return;
                    setSeleccionadaId(item.id);
                  }}
                  disabled={seleccionadaId === item.id}
                  aria-pressed={seleccionadaId === item.id}
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
                  <p className="mb-0 mt-2 text-muted presentacion-item-resumen">
                    {item.resumen || 'Sin resumen disponible.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={meta.page <= 1}
            onClick={() => irPagina(meta.page - 1)}
          >
            Anterior
          </button>
          <small className="text-muted">Página {meta.page} de {meta.total_pages}</small>
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
  );
}

function PresentacionesDetalleModal({
  abierto,
  detalle,
  cargandoDetalle,
  etiquetaMes,
  onCerrar,
  onExportarPdf
}) {
  const [indiceSeccion, setIndiceSeccion] = useState(0);
  const secciones = detalle?.presentacion?.secciones || [];
  const periodo = detalle?.presentacion?.periodo || {};
  const totalSecciones = secciones.length;
  const seccionActual = secciones[indiceSeccion] || null;

  if (!abierto) return null;

  return (
    <div className="presentacion-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="presentacion-modal-titulo">
      <button
        type="button"
        className="presentacion-modal-dismiss"
        aria-label="Cerrar detalle de presentación"
        onClick={onCerrar}
      />

      <div className="presentacion-modal-iasd">
        <div className="presentacion-modal-head">
          <div className="presentacion-modal-head-main">
            <h5 id="presentacion-modal-titulo" className="mb-1">Detalle</h5>
            {!cargandoDetalle && detalle ? (
              <div className="presentacion-modal-head-tags">
                <span className="presentacion-modal-head-chip">
                  {etiquetaMes(periodo.mes || detalle.mes)} {periodo.anio || detalle.anio}
                </span>
                <span className="presentacion-modal-head-chip">
                  {periodo.culto_codigo || detalle.culto_codigo || 'Todos'}
                </span>
                <span className="presentacion-modal-head-chip">
                  {formatearFechaHora(detalle.creado_en)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="d-flex align-items-center gap-2 presentacion-modal-head-actions">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm iasd-icon-btn-round"
              onClick={onExportarPdf}
              aria-label="Exportar PDF"
              title="Exportar PDF"
              disabled={!detalle}
            >
              <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm iasd-icon-btn-round presentacion-modal-close"
              onClick={onCerrar}
              aria-label="Cerrar detalle"
              title="Cerrar"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div className="presentacion-modal-body">
          {cargandoDetalle && (
            <div className="text-center py-3">
              <div className="spinner-border spinner-iasd" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          {!cargandoDetalle && !detalle && (
            <div className="alert alert-iasd mb-0">Seleccione una presentación para ver su contenido.</div>
          )}

          {!cargandoDetalle && detalle && totalSecciones > 0 && (
            <div className="presentacion-secciones-panel">
              <div className="presentaciones-card-meta mb-3">
                <span className="presentaciones-card-label">Contenido</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">{indiceSeccion + 1} / {totalSecciones}</span>
                  <BotonCarrusel
                    onClick={() => setIndiceSeccion((prev) => (prev === 0 ? totalSecciones - 1 : prev - 1))}
                    icono="bi-chevron-left"
                    label="Ver sección anterior"
                    disabled={totalSecciones <= 1}
                  />
                  <BotonCarrusel
                    onClick={() => setIndiceSeccion((prev) => (prev === totalSecciones - 1 ? 0 : prev + 1))}
                    icono="bi-chevron-right"
                    label="Ver siguiente sección"
                    disabled={totalSecciones <= 1}
                  />
                </div>
              </div>

              {seccionActual ? (
                <div className="presentacion-seccion-shell">
                  <SeccionPresentacion seccion={seccionActual} />
                </div>
              ) : null}
            </div>
          )}
        </div>
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
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const exportarPdf = async () => {
    if (!detalle) return;
    const { jsPDF } = await import('jspdf');

    const periodo = detalle?.presentacion?.periodo || {};
    const secciones = detalle?.presentacion?.secciones || [];
    const tituloPeriodo = `${etiquetaMes(periodo.mes || detalle.mes)} ${periodo.anio || detalle.anio}`;
    const culto = periodo.culto_codigo || detalle.culto_codigo || 'TODOS';
    const generado = formatearFechaHora(detalle.creado_en);

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
    doc.text('Presentación mensual', margin, y);
    y += 24;

    escribirTexto(`Período: ${tituloPeriodo}`, { tamano: 11, espacioDespues: 4 });
    escribirTexto(`Culto: ${culto}`, { tamano: 11, espacioDespues: 4 });
    escribirTexto(`Generado: ${generado}`, { tamano: 11, espacioDespues: 14 });

    secciones.forEach((seccion) => {
      const titulo = seccion.titulo || 'Sección';
      escribirTexto(titulo, { fuente: 'bold', tamano: 13, espacioDespues: 6 });

      if (seccion.resumen) {
        escribirTexto(seccion.resumen, { tamano: 11, espacioDespues: 6 });
      }

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
      <div className="row g-3 align-items-stretch presentaciones-top-row">
        <div className="col-12 col-xl-6">
          <PresentacionesFiltrosCard
            esAdmin={esAdmin}
            cultos={cultos}
            usuarios={usuarios}
            filtros={filtros}
            onCambiarFiltro={cambiarFiltro}
          />
        </div>

        <div className="col-12 col-xl-6">
          <PresentacionesHistorialCard
            presentaciones={presentaciones}
            meta={meta}
            seleccionadaId={seleccionadaId}
            cargandoLista={cargandoLista}
            setSeleccionadaId={setSeleccionadaId}
            irPagina={irPagina}
            etiquetaMes={etiquetaMes}
            onAbrirDetalle={() => setModalDetalleAbierto(true)}
            detalleDisponible={Boolean(detalle)}
          />
        </div>
      </div>

      <PresentacionesDetalleModal
        key={`${detalle?.id || 'sin-detalle'}-${modalDetalleAbierto ? 'open' : 'closed'}`}
        abierto={modalDetalleAbierto}
        detalle={detalle}
        cargandoDetalle={cargandoDetalle}
        etiquetaMes={etiquetaMes}
        onCerrar={() => setModalDetalleAbierto(false)}
        onExportarPdf={exportarPdf}
      />
    </div>
  );
}
