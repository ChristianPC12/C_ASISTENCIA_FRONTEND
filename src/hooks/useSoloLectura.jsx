import { createContext, useContext } from 'react';

/**
 * Modo solo lectura de una seccion.
 * La pagina envuelve su arbol con <SoloLecturaProvider valor={!puedeEditar('seccion')}>
 * y cualquier componente hijo oculta sus controles de escritura con useSoloLectura().
 */
const SoloLecturaContext = createContext(false);

export function SoloLecturaProvider({ valor = false, children }) {
  return (
    <SoloLecturaContext.Provider value={valor}>
      {children}
    </SoloLecturaContext.Provider>
  );
}

export function useSoloLectura() {
  return useContext(SoloLecturaContext);
}
