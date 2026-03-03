import AsistenciaForm from '../components/asistencia/AsistenciaForm';
import AsistenciaTable from '../components/asistencia/AsistenciaTable';
import { useAsistencia } from '../hooks/useAsistencia';

/**
 * Pagina del modulo de asistencia
 */
export default function AsistenciaPage() {
  const {
    registros,
    cultos,
    formulario,
    editandoId,
    cargando,
    errores,
    filtros,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario,
    cambiarFiltro
  } = useAsistencia();

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Registro de Asistencia</h2>

      {/* Formulario */}
      <AsistenciaForm
        formulario={formulario}
        cultos={cultos}
        editandoId={editandoId}
        errores={errores}
        cargando={cargando}
        onCambiarCampo={cambiarCampo}
        onGuardar={guardar}
        onLimpiar={limpiarFormulario}
      />

      {/* Tabla con filtros */}
      <AsistenciaTable
        registros={registros}
        cultos={cultos}
        filtros={filtros}
        cargando={cargando}
        onCambiarFiltro={cambiarFiltro}
        onEditar={editar}
        onEliminar={eliminar}
      />
    </div>
  );
}
