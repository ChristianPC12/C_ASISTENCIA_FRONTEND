import { useCallback, useState } from 'react';
import UsuarioForm from '../components/usuario/UsuarioForm';
import UsuarioTable from '../components/usuario/UsuarioTable';
import { useUsuario } from '../hooks/useUsuario';

export const SECCION_USUARIOS = 'USUARIOS_SISTEMA';
export const SECCION_FORMULARIO = 'AGREGAR_USUARIO';

export const OPCIONES_USUARIO = [
  {
    valor: SECCION_USUARIOS,
    etiqueta: 'Usuarios del sistema',
    icono: 'bi-people'
  },
  {
    valor: SECCION_FORMULARIO,
    etiqueta: 'Agregar usuario',
    icono: 'bi-person-plus'
  }
];

/**
 * Módulo de usuarios (solo ADMIN).
 * - modo="pagina": se usa como ruta independiente (compatibilidad).
 * - modo="panel": se usa dentro de Administrador.
 */
export default function UsuarioPage({
  modo = 'pagina',
  seccionActiva: seccionActivaExterna,
  onCambiarSeccion,
  mostrarSelector = true
}) {
  const esPanel = modo === 'panel';
  const {
    usuarios,
    formulario,
    editandoId,
    cargando,
    errores,
    limite,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario
  } = useUsuario();

  const [seccionActivaInterna, setSeccionActivaInterna] = useState(SECCION_USUARIOS);
  const seccionActiva = seccionActivaExterna ?? seccionActivaInterna;
  const setSeccionActiva = useCallback((valor) => {
    if (typeof onCambiarSeccion === 'function') {
      onCambiarSeccion(valor);
      return;
    }
    setSeccionActivaInterna(valor);
  }, [onCambiarSeccion]);

  const totalUsuarios = usuarios.length;

  const abrirEdicion = useCallback((usuario) => {
    editar(usuario);
    setSeccionActiva(SECCION_FORMULARIO);
  }, [editar, setSeccionActiva]);

  const limpiarFormularioConRetorno = useCallback(() => {
    limpiarFormulario();
    if (esPanel) {
      setSeccionActiva(SECCION_USUARIOS);
    }
  }, [esPanel, limpiarFormulario, setSeccionActiva]);

  return (
    <div className={esPanel ? 'admin-usuarios-shell' : 'container-fluid py-4'}>
      {!esPanel && (
        <p className="text-muted small mb-3">
          Administre los usuarios de la iglesia y sus permisos por sección.
        </p>
      )}

      {mostrarSelector && (
        <div className="admin-usuarios-switch mb-3">
          {OPCIONES_USUARIO.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={`admin-usuarios-switch-btn ${seccionActiva === opcion.valor ? 'is-active' : ''}`}
              onClick={() => setSeccionActiva(opcion.valor)}
              title={opcion.etiqueta}
              aria-label={opcion.etiqueta}
            >
              <i className={`bi ${opcion.icono}`} aria-hidden="true"></i>
              <span className="admin-usuarios-switch-btn-label">{opcion.etiqueta}</span>
            </button>
          ))}
        </div>
      )}

      {seccionActiva === SECCION_USUARIOS && (
        <>
          <div className="admin-usuarios-resumen mb-3">
            <div className="admin-usuarios-resumen-item">
              <span className="admin-usuarios-resumen-label">Total</span>
              <strong className="admin-usuarios-resumen-value">{totalUsuarios}</strong>
            </div>
            <div className="admin-usuarios-resumen-item" title={`Máximo ${limite.maximo} usuarios activos por cuenta`}>
              <span className="admin-usuarios-resumen-label">Activos</span>
              <strong className="admin-usuarios-resumen-value">{limite.activos} / {limite.maximo}</strong>
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
          onCambiarCampo={cambiarCampo}
          onGuardar={guardar}
          onLimpiar={limpiarFormularioConRetorno}
        />
      )}
    </div>
  );
}
