import UsuarioForm from '../components/usuario/UsuarioForm';
import UsuarioTable from '../components/usuario/UsuarioTable';
import { useUsuario } from '../hooks/useUsuario';

/**
 * Pagina del modulo de usuarios (solo ADMIN)
 */
export default function UsuarioPage() {
  const {
    usuarios,
    formulario,
    editandoId,
    cargando,
    errores,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario
  } = useUsuario();

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Gestion de Usuarios</h2>

      {/* Formulario */}
      <UsuarioForm
        formulario={formulario}
        editandoId={editandoId}
        errores={errores}
        cargando={cargando}
        onCambiarCampo={cambiarCampo}
        onGuardar={guardar}
        onLimpiar={limpiarFormulario}
      />

      {/* Tabla */}
      <UsuarioTable
        usuarios={usuarios}
        cargando={cargando}
        onEditar={editar}
        onEliminar={eliminar}
      />
    </div>
  );
}
