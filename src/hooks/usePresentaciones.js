import { useCallback, useEffect, useMemo, useState } from 'react';
import presentacionApi from '../api/presentacionApi';
import cultoApi from '../api/cultoApi';
import usuarioApi from '../api/usuarioApi';
import { ANIO_ACTUAL, MES_OPCIONES } from '../config/constants';
import { notificarError } from '../utils/notify';
import { useAuth } from './useAuth';

const MAPA_MESES = Object.fromEntries(
  MES_OPCIONES.map((item) => [String(item.valor), item.etiqueta])
);

const META_INICIAL = {
  total: 0,
  page: 1,
  limit: 20,
  total_pages: 1
};

export function usePresentaciones() {
  const { esAdmin } = useAuth();

  const [cultos, setCultos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [filtros, setFiltros] = useState({
    anio: String(ANIO_ACTUAL),
    mes: '',
    culto: '',
    usuario_id: ''
  });

  const [presentaciones, setPresentaciones] = useState([]);
  const [meta, setMeta] = useState(META_INICIAL);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const [cargandoLista, setCargandoLista] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    try {
      const resCultos = await cultoApi.listar();
      if (resCultos.exito) {
        setCultos(resCultos.datos || []);
      }
    } catch {
      setCultos([]);
    }

    if (!esAdmin) {
      setUsuarios([]);
      return;
    }

    try {
      const resUsuarios = await usuarioApi.listar();
      if (resUsuarios.exito) {
        setUsuarios(resUsuarios.datos || []);
      }
    } catch {
      setUsuarios([]);
    }
  }, [esAdmin]);

  const cargarPresentaciones = useCallback(async () => {
    setCargandoLista(true);
    try {
      const params = {
        page: meta.page,
        limit: meta.limit
      };

      if (filtros.anio) params.anio = filtros.anio;
      if (filtros.mes) params.mes = filtros.mes;
      if (filtros.culto) params.culto = filtros.culto;
      if (esAdmin && filtros.usuario_id) params.usuario_id = filtros.usuario_id;

      const res = await presentacionApi.listar(params);
      if (res.exito) {
        const data = res.datos || {};
        const items = data.items || [];
        const nuevaMeta = data.meta || META_INICIAL;

        setPresentaciones(items);
        setMeta((prev) => ({
          ...prev,
          total: Number(nuevaMeta.total || 0),
          page: Number(nuevaMeta.page || prev.page),
          limit: Number(nuevaMeta.limit || prev.limit),
          total_pages: Number(nuevaMeta.total_pages || 1)
        }));

        setSeleccionadaId((prev) => {
          if (items.length === 0) return null;
          const existeActual = items.some((item) => item.id === prev);
          return existeActual ? prev : items[0].id;
        });
      }
    } catch (error) {
      setPresentaciones([]);
      setMeta((prev) => ({ ...prev, total: 0, total_pages: 1 }));
      setSeleccionadaId(null);
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el listado de presentaciones.');
    } finally {
      setCargandoLista(false);
    }
  }, [esAdmin, filtros.anio, filtros.culto, filtros.mes, filtros.usuario_id, meta.limit, meta.page]);

  const cargarDetalle = useCallback(async (id) => {
    if (!id) {
      setDetalle(null);
      return;
    }

    setCargandoDetalle(true);
    try {
      const res = await presentacionApi.obtenerPorId(id);
      if (res.exito) {
        setDetalle(res.datos || null);
      }
    } catch (error) {
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle de la presentacion.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarPresentaciones();
  }, [cargarPresentaciones]);

  useEffect(() => {
    cargarDetalle(seleccionadaId);
  }, [cargarDetalle, seleccionadaId]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setMeta((prev) => ({ ...prev, page: 1 }));
  }, []);

  const irPagina = useCallback((page) => {
    setMeta((prev) => ({ ...prev, page }));
  }, []);

  const etiquetaMes = useMemo(() => {
    return (valor) => MAPA_MESES[String(valor)] || `Mes ${valor}`;
  }, []);

  return {
    esAdmin,
    cultos,
    usuarios,
    filtros,
    presentaciones,
    meta,
    seleccionadaId,
    detalle,
    cargandoLista,
    cargandoDetalle,
    cambiarFiltro,
    setSeleccionadaId,
    irPagina,
    etiquetaMes
  };
}

