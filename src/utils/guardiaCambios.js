// Guardia de cambios sin guardar: una pantalla registra una funcion que decide
// si se puede salir; el menu lateral y la barra superior la consultan antes de navegar.

let guardiaActual = null;

/**
 * @param {() => Promise<boolean>} guardia Devuelve true si se puede salir.
 * @returns {() => void} Quita la guardia.
 */
export function registrarGuardiaCambios(guardia) {
  guardiaActual = guardia;
  return () => {
    if (guardiaActual === guardia) guardiaActual = null;
  };
}

/** @returns {Promise<boolean>} true si no hay cambios pendientes o el usuario decide descartarlos. */
export async function puedeAbandonarPantalla() {
  if (!guardiaActual) return true;
  return guardiaActual();
}

export function hayGuardiaActiva() {
  return guardiaActual !== null;
}
