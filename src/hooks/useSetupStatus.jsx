import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import setupApi from '../api/setupApi';
import cultoApi from '../api/cultoApi';
import { useAuth } from './useAuth';
import { obtenerMetricasActivas } from '../utils/metricasConfig';
import { EVENT_SETUP_REQUIRED } from '../config/events';

const SetupContext = createContext(null);

function getOrganizacionId(usuario, tenant) {
  const tenantId = Number(tenant?.organizacion_id);
  if (Number.isInteger(tenantId) && tenantId > 0) return tenantId;

  const usuarioId = Number(usuario?.organizacion_id);
  if (Number.isInteger(usuarioId) && usuarioId > 0) return usuarioId;

  return null;
}

function storageKey(orgId) {
  return `setup_estado_org_${orgId}`;
}

function readCache(orgId) {
  if (!orgId) return null;
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(orgId, detalle) {
  if (!orgId || !detalle) return;
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({
      detalle,
      guardado_en: new Date().toISOString()
    }));
  } catch {
    // ignorar fallos de storage
  }
}

function toBool(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase();
    if (['1', 'true', 'on', 'yes', 'si', 'sí'].includes(texto)) return true;
    if (['0', 'false', 'off', 'no'].includes(texto)) return false;
  }
  return false;
}

function resolverEstadoDesdeDetalle(detalle) {
  const estadoSetup = String(detalle?.estado_setup || '').toUpperCase();
  const bloqueada = toBool(detalle?.bloqueada_operacion);
  const completo = estadoSetup === 'COMPLETO' && !bloqueada;
  return {
    estado: completo ? 'completo' : 'pendiente',
    bloqueadaOperacion: !completo
  };
}

function buildStateDesdeDetalle(detalle, anterior) {
  const base = resolverEstadoDesdeDetalle(detalle);
  return {
    ...anterior,
    ...base,
    detalle,
    cargando: false,
    error: null,
    ultimaRevision: detalle?.ultima_revision_en || new Date().toISOString()
  };
}

export function SetupProvider({ children }) {
  const { estaAutenticado, usuario, tenant, esAdmin, esSuperadmin } = useAuth();
  const [setupState, setSetupState] = useState({
    estado: 'desconocido',
    bloqueadaOperacion: false,
    detalle: null,
    cargando: false,
    error: null,
    ultimaRevision: null
  });

  const organizacionId = useMemo(
    () => getOrganizacionId(usuario, tenant),
    [usuario, tenant]
  );

  const limpiarEstado = useCallback(() => {
    setSetupState({
      estado: 'desconocido',
      bloqueadaOperacion: false,
      detalle: null,
      cargando: false,
      error: null,
      ultimaRevision: null
    });
  }, []);

  const aplicarDetalleSetup = useCallback((detalle) => {
    setSetupState((prev) => buildStateDesdeDetalle(detalle, prev));
    writeCache(organizacionId, detalle);
  }, [organizacionId]);

  const marcarSetupPendiente = useCallback((mensaje = null) => {
    setSetupState((prev) => ({
      ...prev,
      estado: 'pendiente',
      bloqueadaOperacion: true,
      cargando: false,
      error: mensaje
    }));
  }, []);

  const recargarEstadoSetup = useCallback(async ({ silencioso = false } = {}) => {
    if (!estaAutenticado || !usuario || esSuperadmin) {
      limpiarEstado();
      return null;
    }

    if (!silencioso) {
      setSetupState((prev) => ({
        ...prev,
        cargando: true,
        error: null
      }));
    }

    try {
      if (esAdmin) {
        const res = await setupApi.obtenerEstado();
        if (res?.exito && res?.datos) {
          aplicarDetalleSetup(res.datos);
          return res.datos;
        }

        marcarSetupPendiente('No se pudo obtener el estado de setup.');
        return null;
      }

      await cultoApi.listar();
      setSetupState((prev) => ({
        ...prev,
        estado: 'completo',
        bloqueadaOperacion: false,
        cargando: false,
        error: null
      }));
      return null;
    } catch (error) {
      const codigo = String(error?.codigo || '').toUpperCase();

      if (codigo === 'SETUP_REQUIRED') {
        marcarSetupPendiente(error?.mensaje || null);
        return null;
      }

      setSetupState((prev) => ({
        ...prev,
        estado: prev.estado === 'desconocido' ? 'desconocido' : prev.estado,
        bloqueadaOperacion: prev.estado === 'pendiente',
        cargando: false,
        error: error?.mensaje || 'No se pudo verificar el estado de setup.'
      }));
      return null;
    }
  }, [
    estaAutenticado,
    usuario,
    esSuperadmin,
    esAdmin,
    limpiarEstado,
    aplicarDetalleSetup,
    marcarSetupPendiente
  ]);

  useEffect(() => {
    if (!estaAutenticado || !usuario || esSuperadmin) {
      limpiarEstado();
      return;
    }

    const cache = readCache(organizacionId);
    if (cache?.detalle && typeof cache.detalle === 'object') {
      setSetupState((prev) => buildStateDesdeDetalle(cache.detalle, prev));
      recargarEstadoSetup({ silencioso: true });
      return;
    }

    recargarEstadoSetup({ silencioso: false });
  }, [
    estaAutenticado,
    usuario,
    esSuperadmin,
    organizacionId,
    limpiarEstado,
    recargarEstadoSetup
  ]);

  useEffect(() => {
    function onSetupRequired() {
      marcarSetupPendiente();
    }

    window.addEventListener(EVENT_SETUP_REQUIRED, onSetupRequired);
    return () => window.removeEventListener(EVENT_SETUP_REQUIRED, onSetupRequired);
  }, [marcarSetupPendiente]);

  const metricasActivas = useMemo(
    () => obtenerMetricasActivas(setupState.detalle?.configuracion?.metricas),
    [setupState.detalle]
  );

  const valor = useMemo(() => ({
    ...setupState,
    organizacionId,
    metricasActivas,
    procedencias: setupState.detalle?.configuracion?.procedencias || [],
    cultosConfigurados: setupState.detalle?.configuracion?.cultos || [],
    faltantes: setupState.detalle?.faltantes || [],
    recargarEstadoSetup,
    aplicarDetalleSetup,
    marcarSetupPendiente,
    requiereSetup: setupState.estado === 'pendiente'
  }), [
    setupState,
    organizacionId,
    metricasActivas,
    recargarEstadoSetup,
    aplicarDetalleSetup,
    marcarSetupPendiente
  ]);

  return (
    <SetupContext.Provider value={valor}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetupStatus() {
  const contexto = useContext(SetupContext);
  if (!contexto) {
    throw new Error('useSetupStatus debe usarse dentro de SetupProvider.');
  }
  return contexto;
}
