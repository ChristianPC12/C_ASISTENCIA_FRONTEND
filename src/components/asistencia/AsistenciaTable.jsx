import { TRIMESTRE_OPCIONES, ANIO_OPCIONES } from '../../config/constants';

/**
 * Tabla de registros de asistencia con filtros
 * Props:
 *  - registros: array de registros de asistencia
 *  - cultos: array de cultos disponibles
 *  - filtros: { culto, anio, trimestre }
 *  - cargando: boolean
 *  - onCambiarFiltro: funcion (campo, valor)
 *  - onEditar: funcion (registro)
 *  - onEliminar: funcion (id)
 */
export default function AsistenciaTable({
  registros,
  cultos,
  filtros,
  cargando,
  onCambiarFiltro,
  onEditar,
  onEliminar
}) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Registros de Asistencia</h5>
        <span className="badge bg-light text-dark">{registros.length} registros</span>
      </div>
      <div className="card-body">

        {/* Filtros */}
        <div className="filtros-container">
          <div className="row g-3 align-items-end">
            {/* Filtro por culto */}
            <div className="col-md-4">
              <label htmlFor="filtro-culto" className="form-label fw-semibold">Culto</label>
              <select
                id="filtro-culto"
                className="form-select"
                value={filtros.culto}
                onChange={(e) => onCambiarFiltro('culto', e.target.value)}
              >
                <option value="">Todos los cultos</option>
                {cultos.map((culto) => (
                  <option key={culto.codigo} value={culto.codigo}>
                    {culto.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por anio */}
            <div className="col-md-4">
              <label htmlFor="filtro-anio" className="form-label fw-semibold">Año</label>
              <select
                id="filtro-anio"
                className="form-select"
                value={filtros.anio}
                onChange={(e) => onCambiarFiltro('anio', e.target.value)}
              >
                <option value="">Todos los años</option>
                {ANIO_OPCIONES.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            {/* Filtro por trimestre */}
            <div className="col-md-4">
              <label htmlFor="filtro-trimestre" className="form-label fw-semibold">Trimestre</label>
              <select
                id="filtro-trimestre"
                className="form-select"
                value={filtros.trimestre}
                onChange={(e) => onCambiarFiltro('trimestre', e.target.value)}
              >
                <option value="">Todos los trimestres</option>
                {TRIMESTRE_OPCIONES.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Spinner de carga */}
        {cargando && (
          <div className="text-center py-4">
            <div className="spinner-border spinner-iasd" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {/* Mensaje si no hay registros */}
        {!cargando && registros.length === 0 && (
          <div className="alert alert-iasd text-center">
            No se encontraron registros de asistencia con los filtros seleccionados.
          </div>
        )}

        {/* Tabla de registros */}
        {!cargando && registros.length > 0 && (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Culto</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Niños</th>
                  <th className="text-center">Jóvenes</th>
                  <th className="text-center">Antes</th>
                  <th className="text-center">Después</th>
                  <th className="text-center">Barrio</th>
                  <th className="text-center">Guayabo</th>
                  <th className="text-center">Visitas B.</th>
                  <th className="text-center">Visitas G.</th>
                  <th className="text-center">Retiros</th>
                  <th className="text-center">Quedaron</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((reg) => (
                  <tr key={reg.id}>
                    <td className="fw-semibold">{formatearFecha(reg.fecha)}</td>
                    <td>
                      <span className="badge bg-primary">{reg.culto_nombre || reg.culto_codigo}</span>
                    </td>
                    <td className="text-center fw-bold">{reg.total_asistentes}</td>
                    <td className="text-center">{reg.ninos}</td>
                    <td className="text-center">{reg.jovenes}</td>
                    <td className="text-center">{reg.llegaron_antes_hora}</td>
                    <td className="text-center">{reg.llegaron_despues_hora}</td>
                    <td className="text-center">{reg.proc_barrio}</td>
                    <td className="text-center">{reg.proc_guayabo}</td>
                    <td className="text-center">{reg.visitas_barrio}</td>
                    <td className="text-center">{reg.visitas_guayabo}</td>
                    <td className="text-center">{reg.retiros_antes_terminar}</td>
                    <td className="text-center">{reg.se_quedaron_todo}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onEditar(reg)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => onEliminar(reg.id)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
