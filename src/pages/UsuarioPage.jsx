import UsuarioForm from '../components/usuario/UsuarioForm';
import UsuarioTable from '../components/usuario/UsuarioTable';
import UsuarioCuposCard from '../components/usuario/UsuarioCuposCard';
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
    cuposRoles,
    resumenCupos,
    cargandoCupos,
    guardandoCupos,
    cupoRolSeleccionado,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario,
    cambiarCupoRol,
    guardarCupos
  } = useUsuario();

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Gestion de Usuarios</h2>

      <UsuarioCuposCard
        cuposRoles={cuposRoles}
        resumen={resumenCupos}
        cargando={cargandoCupos}
        guardando={guardandoCupos}
        onCambiarCupo={cambiarCupoRol}
        onGuardar={guardarCupos}
      />

      {/* Formulario */}
      <UsuarioForm
        formulario={formulario}
        editandoId={editandoId}
        errores={errores}
        cargando={cargando}
        cupoRolSeleccionado={cupoRolSeleccionado}
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
