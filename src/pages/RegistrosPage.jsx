import AsistenciaTable from '../components/asistencia/AsistenciaTable';
import { useAsistencia } from '../hooks/useAsistencia';
import { useNavigate } from 'react-router-dom';

/**
 * Pagina para ver los registros de asistencia existentes
 */
export default function RegistrosPage() {
  const navigate = useNavigate();
  const {
    registros,
    cultos,
    cargando,
    filtros,
    eliminar,
    cambiarFiltro,
    exportarRegistro
  } = useAsistencia();

  // Al editar, navegar a la pagina de registro
  const manejarEditar = (registro) => {
    // Guardar el registro en sessionStorage para que RegistroPage lo cargue
    sessionStorage.setItem('editarRegistro', JSON.stringify(registro));
    navigate('/registro');
  };

  return (
    <div className="container-fluid py-4">
      <AsistenciaTable
        registros={registros}
        cultos={cultos}
        filtros={filtros}
        cargando={cargando}
        onCambiarFiltro={cambiarFiltro}
        onEditar={manejarEditar}
        onEliminar={eliminar}
        onExportar={exportarRegistro}
      />
    </div>
  );
}
