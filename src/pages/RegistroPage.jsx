import AsistenciaForm from '../components/asistencia/AsistenciaForm';
import { useAsistencia } from '../hooks/useAsistencia';

/**
 * Pagina de nuevo registro de asistencia (solo el formulario)
 */
export default function RegistroPage() {
  const {
    cultos,
    formulario,
    editandoId,
    cargando,
    errores,
    cambiarCampo,
    guardar,
    limpiarFormulario
  } = useAsistencia();

  return (
    <div className="container-fluid py-4">
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
    </div>
  );
}
