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
    fechasRegistradas,
    metricasActivas,
    clavePermanenciaAuto,
    permanenciaAutoBloqueada,
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
        metricasActivas={metricasActivas}
        fechasRegistradas={fechasRegistradas}
        clavePermanenciaAuto={clavePermanenciaAuto}
        permanenciaAutoBloqueada={permanenciaAutoBloqueada}
        onCambiarCampo={cambiarCampo}
        onGuardar={guardar}
        onLimpiar={limpiarFormulario}
      />
    </div>
  );
}
