import { useEffect, useMemo, useState } from 'react';
import AsistenciaTable from '../components/asistencia/AsistenciaTable';
import PromptModal from '../components/presentaciones/PromptModal';
import { useAsistencia } from '../hooks/useAsistencia';
import { useLocation, useNavigate } from 'react-router-dom';
import presentacionApi from '../api/presentacionApi';
import asistenciaApi from '../api/asistenciaApi';
import { ANIO_ACTUAL } from '../config/constants';
import { notificarError, notificarExito } from '../utils/notify';

/**
 * Pagina para ver los registros de asistencia existentes
 */
export default function RegistrosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    registros,
    cultos,
    cargando,
    filtros,
    mapaEtiquetasMetricas,
    eliminar,
    cambiarFiltro,
    exportarRegistro,
    exportarInforme
  } = useAsistencia();
  const [registroAAbrir, setRegistroAAbrir] = useState(null);
  const [modalPromptVisible, setModalPromptVisible] = useState(false);
  const [enviandoPrompt, setEnviandoPrompt] = useState(false);
  const [presentacionesExistentes, setPresentacionesExistentes] = useState([]);
  const [registrosPeriodo, setRegistrosPeriodo] = useState([]);
  const [cargandoPeriodo, setCargandoPeriodo] = useState(false);
  const [filtrosPrompt, setFiltrosPrompt] = useState({
    culto: null,
    anio: String(ANIO_ACTUAL),
    mes: ''
  });

  // Llegada desde el aviso de "registro nuevo": filtra por la fecha y culto exactos.
  useEffect(() => {
    const filtro = location.state?.filtroRegistro;
    if (!filtro?.fecha) return;

    const [anio, mes, dia] = String(filtro.fecha).split('-');
    const fechaTexto = `${dia}/${mes}/${anio}`;
    cambiarFiltro('culto', filtro.culto || '');
    cambiarFiltro('fecha_exacta', fechaTexto);
    setRegistroAAbrir({ fecha: filtro.fecha, fechaTexto, cultoId: filtro.cultoId || '' });
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Al editar, navegar a la pagina de registro
  const manejarEditar = (registro) => {
    // Guardar el registro en sessionStorage para que RegistroPage lo cargue
    sessionStorage.setItem('editarRegistro', JSON.stringify(registro));
    navigate('/registro');
  };

  const abrirModalPrompt = () => {
    const mesActual = String(new Date().getMonth() + 1);
    setFiltrosPrompt({
      culto: null,
      anio: String(filtros.anio || ANIO_ACTUAL),
      mes: String(filtros.mes || mesActual)
    });
    setModalPromptVisible(true);
  };

  const cambiarFiltroPrompt = (campo, valor) => {
    setFiltrosPrompt((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'anio' || campo === 'mes' ? { culto: null } : {})
    }));
  };

  useEffect(() => {
    if (!modalPromptVisible || !filtrosPrompt.anio) {
      return;
    }

    let cancelado = false;

    const cargarPresentacionesExistentes = async () => {
      try {
        const params = {
          anio: Number(filtrosPrompt.anio),
          limit: 200
        };

        const res = await presentacionApi.listar(params);
        if (cancelado) return;

        if (res?.exito) {
          const items = res?.datos?.items || [];
          setPresentacionesExistentes(items);
          return;
        }

        setPresentacionesExistentes([]);
      } catch {
        if (!cancelado) {
          setPresentacionesExistentes([]);
        }
      }
    };

    cargarPresentacionesExistentes();

    return () => {
      cancelado = true;
    };
  }, [modalPromptVisible, filtrosPrompt.anio]);

  // Cultos que tienen registros en el año y mes elegidos en la ventana de presentación.
  useEffect(() => {
    if (!modalPromptVisible || !filtrosPrompt.anio || !filtrosPrompt.mes) {
      return undefined;
    }

    let cancelado = false;

    const cargarRegistrosPeriodo = async () => {
      setCargandoPeriodo(true);
      try {
        const res = await asistenciaApi.listar({
          anio: Number(filtrosPrompt.anio),
          mes: String(filtrosPrompt.mes).padStart(2, '0')
        });
        if (!cancelado) setRegistrosPeriodo(res?.exito ? (res.datos || []) : []);
      } catch {
        if (!cancelado) setRegistrosPeriodo([]);
      } finally {
        if (!cancelado) setCargandoPeriodo(false);
      }
    };

    cargarRegistrosPeriodo();

    return () => {
      cancelado = true;
    };
  }, [modalPromptVisible, filtrosPrompt.anio, filtrosPrompt.mes]);

  const opcionesCultoPrompt = useMemo(() => {
    const conteoPorCodigo = {};
    registrosPeriodo.forEach((registro) => {
      const culto = cultos.find((item) => String(item.id) === String(registro.culto_id));
      if (culto?.codigo) {
        conteoPorCodigo[culto.codigo] = (conteoPorCodigo[culto.codigo] || 0) + 1;
      }
    });

    const generadas = presentacionesExistentes.filter((item) => (
      Number(item?.anio || 0) === Number(filtrosPrompt.anio || 0)
      && Number(item?.mes || 0) === Number(filtrosPrompt.mes || 0)
    ));
    const codigosGenerados = new Set(generadas.map((item) => String(item?.culto_codigo || '').trim()));
    const hayDeTodos = codigosGenerados.has('');

    const armar = (valor, etiqueta, total, yaGenerada) => {
      const sinRegistros = total === 0;
      return {
        valor,
        etiqueta,
        total,
        bloqueado: yaGenerada || sinRegistros,
        motivo: yaGenerada ? 'Ya tiene presentación' : 'Sin registros en este mes'
      };
    };

    return [
      armar('', 'Todos los cultos', registrosPeriodo.length, generadas.length > 0),
      ...cultos.map((culto) => armar(
        culto.codigo,
        culto.nombre,
        conteoPorCodigo[culto.codigo] || 0,
        hayDeTodos || codigosGenerados.has(culto.codigo)
      ))
    ];
  }, [registrosPeriodo, cultos, presentacionesExistentes, filtrosPrompt.anio, filtrosPrompt.mes]);

  const generarPresentacion = async () => {
    if (!filtrosPrompt.anio || !filtrosPrompt.mes) {
      notificarError('Debe seleccionar anio y mes para generar la presentacion.');
      return;
    }

    const opcionElegida = opcionesCultoPrompt.find((opcion) => opcion.valor === filtrosPrompt.culto);
    if (!opcionElegida || opcionElegida.bloqueado) {
      notificarError('Elija un culto disponible: sin presentación previa y con registros en ese mes.');
      return;
    }

    setEnviandoPrompt(true);
    try {
      const payload = {
        filtros: {
          anio: Number(filtrosPrompt.anio),
          mes: Number(filtrosPrompt.mes),
          ...(filtrosPrompt.culto ? { culto: filtrosPrompt.culto } : {})
        }
      };

      const res = await presentacionApi.generar(payload);
      if (res.exito) {
        notificarExito('Presentacion generada correctamente.');
        setModalPromptVisible(false);
        navigate('/presentaciones');
        return;
      }

      notificarError(res.mensaje || 'No fue posible generar la presentacion.');
    } catch (error) {
      notificarError(error?.mensaje || 'No fue posible generar la presentacion.');
    } finally {
      setEnviandoPrompt(false);
    }
  };

  return (
    <>
      <div className="container-fluid py-4">
        <AsistenciaTable
          registros={registros}
          cultos={cultos}
          filtros={filtros}
          cargando={cargando}
          mapaEtiquetasMetricas={mapaEtiquetasMetricas}
          onCambiarFiltro={cambiarFiltro}
          onEditar={manejarEditar}
          onEliminar={eliminar}
          onExportar={exportarRegistro}
          onExportarInforme={exportarInforme}
          registroAAbrir={registroAAbrir}
          onRegistroAbierto={() => setRegistroAAbrir(null)}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary prompt-floating-btn"
        onClick={abrirModalPrompt}
      >
        <i className="bi bi-chat-square-text me-2" aria-hidden="true"></i>
        Prompt
      </button>

      <PromptModal
        visible={modalPromptVisible}
        enviando={enviandoPrompt}
        filtros={filtrosPrompt}
        opcionesCulto={opcionesCultoPrompt}
        cargandoCultos={cargandoPeriodo}
        onClose={() => !enviandoPrompt && setModalPromptVisible(false)}
        onCambiarFiltro={cambiarFiltroPrompt}
        onEnviar={generarPresentacion}
      />
    </>
  );
}
