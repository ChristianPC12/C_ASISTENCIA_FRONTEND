import { useCallback, useState } from 'react';
import UsuarioForm from '../components/usuario/UsuarioForm';
import UsuarioTable from '../components/usuario/UsuarioTable';
import UsuarioCuposCard from '../components/usuario/UsuarioCuposCard';
import { useUsuario } from '../hooks/useUsuario';

const SECCION_USUARIOS = 'USUARIOS_SISTEMA';
const SECCION_FORMULARIO = 'AGREGAR_USUARIO';
const SECCION_ROLES = 'ROLES_Y_CUPOS';

const OPCIONES_USUARIO = [
  {
    valor: SECCION_USUARIOS,
    etiqueta: 'Usuarios del sistema',
    icono: 'bi-people'
  },
  {
    valor: SECCION_FORMULARIO,
    etiqueta: 'Agregar usuario',
    icono: 'bi-person-plus'
  },
  {
    valor: SECCION_ROLES,
    etiqueta: 'Roles y cupos',
    icono: 'bi-person-gear'
  }
];

/**
 * Modulo de usuarios (solo ADMIN).
 * - modo="pagina": se usa como ruta independiente (compatibilidad).
 * - modo="panel": se usa dentro de Administrador.
 */
export default function UsuarioPage({ modo = 'pagina' }) {
  const esPanel = modo === 'panel';
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

  const [seccionActiva, setSeccionActiva] = useState(SECCION_USUARIOS);

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((item) => !!item.activo).length;

  const abrirEdicion = useCallback((usuario) => {
    editar(usuario);
    setSeccionActiva(SECCION_FORMULARIO);
  }, [editar]);

  const abrirNuevoUsuario = useCallback(() => {
    limpiarFormulario();
    setSeccionActiva(SECCION_FORMULARIO);
  }, [limpiarFormulario]);

  const limpiarFormularioConRetorno = useCallback(() => {
    limpiarFormulario();
    if (esPanel) {
      setSeccionActiva(SECCION_USUARIOS);
    }
  }, [esPanel, limpiarFormulario]);

  return (
    <div className={esPanel ? 'admin-usuarios-shell' : 'container-fluid py-4'}>
      {!esPanel && (
        <p className="text-muted small mb-3">
          Administre usuarios, roles y cupos desde este módulo.
        </p>
      )}

      <div className="admin-usuarios-switch mb-3">
        {OPCIONES_USUARIO.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            className={`admin-usuarios-switch-btn ${seccionActiva === opcion.valor ? 'is-active' : ''}`}
            onClick={() => setSeccionActiva(opcion.valor)}
          >
            <i className={`bi ${opcion.icono}`} aria-hidden="true"></i>
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      {seccionActiva === SECCION_USUARIOS && (
        <>
          <div className="admin-usuarios-resumen mb-3">
            <div className="admin-usuarios-resumen-item">
              <span className="admin-usuarios-resumen-label">Total</span>
              <strong className="admin-usuarios-resumen-value">{totalUsuarios}</strong>
            </div>
            <div className="admin-usuarios-resumen-item">
              <span className="admin-usuarios-resumen-label">Activos</span>
              <strong className="admin-usuarios-resumen-value">{usuariosActivos}</strong>
            </div>
            <div className="admin-usuarios-resumen-item is-action">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={abrirNuevoUsuario}
              >
                Crear usuario
              </button>
            </div>
          </div>

          <UsuarioTable
            usuarios={usuarios}
            cargando={cargando}
            onEditar={abrirEdicion}
            onEliminar={eliminar}
          />
        </>
      )}

      {seccionActiva === SECCION_FORMULARIO && (
        <UsuarioForm
          formulario={formulario}
          editandoId={editandoId}
          errores={errores}
          cargando={cargando}
          cupoRolSeleccionado={cupoRolSeleccionado}
          onCambiarCampo={cambiarCampo}
          onGuardar={guardar}
          onLimpiar={limpiarFormularioConRetorno}
        />
      )}

      {seccionActiva === SECCION_ROLES && (
        <UsuarioCuposCard
          cuposRoles={cuposRoles}
          resumen={resumenCupos}
          cargando={cargandoCupos}
          guardando={guardandoCupos}
          onCambiarCupo={cambiarCupoRol}
          onGuardar={guardarCupos}
        />
      )}
    </div>
  );
}
