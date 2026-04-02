import { useEffect, useMemo, useState } from 'react';
import AsistenciaTable from '../components/asistencia/AsistenciaTable';
import PromptModal from '../components/presentaciones/PromptModal';
import { useAsistencia } from '../hooks/useAsistencia';
import { useNavigate } from 'react-router-dom';
import presentacionApi from '../api/presentacionApi';
import { ANIO_ACTUAL } from '../config/constants';
import { notificarError, notificarExito } from '../utils/notify';

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
    mapaEtiquetasMetricas,
    eliminar,
    cambiarFiltro,
    exportarRegistro,
    exportarInforme
  } = useAsistencia();
  const [modalPromptVisible, setModalPromptVisible] = useState(false);
  const [enviandoPrompt, setEnviandoPrompt] = useState(false);
  const [presentacionesExistentes, setPresentacionesExistentes] = useState([]);
  const [filtrosPrompt, setFiltrosPrompt] = useState({
    culto: '',
    anio: String(ANIO_ACTUAL),
    mes: ''
  });

  // Al editar, navegar a la pagina de registro
  const manejarEditar = (registro) => {
    // Guardar el registro en sessionStorage para que RegistroPage lo cargue
    sessionStorage.setItem('editarRegistro', JSON.stringify(registro));
    navigate('/registro');
  };

  const abrirModalPrompt = () => {
    const mesActual = String(new Date().getMonth() + 1);
    setFiltrosPrompt({
      culto: filtros.culto || '',
      anio: String(filtros.anio || ANIO_ACTUAL),
      mes: String(filtros.mes || mesActual)
    });
    setModalPromptVisible(true);
  };

  const cambiarFiltroPrompt = (campo, valor) => {
    setFiltrosPrompt((prev) => ({ ...prev, [campo]: valor }));
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

  const mesEstaBloqueado = (mes) => {
    const mesNumero = Number(mes || 0);
    const cultoSeleccionado = String(filtrosPrompt.culto || '').trim();

    return presentacionesExistentes.some((item) => {
      const mismoAnio = Number(item?.anio || 0) === Number(filtrosPrompt.anio || 0);
      const mismoMes = Number(item?.mes || 0) === mesNumero;
      if (!mismoAnio || !mismoMes) return false;

      const cultoExistente = String(item?.culto_codigo || '').trim();

      if (!cultoSeleccionado) {
        return true;
      }

      return cultoExistente === cultoSeleccionado || cultoExistente === '';
    });
  };

  const mesesBloqueados = useMemo(() => {
    return new Set(
      presentacionesExistentes
        .filter((item) => {
          const mismoAnio = Number(item?.anio || 0) === Number(filtrosPrompt.anio || 0);
          if (!mismoAnio) return false;

          const cultoSeleccionado = String(filtrosPrompt.culto || '').trim();
          const cultoExistente = String(item?.culto_codigo || '').trim();

          if (!cultoSeleccionado) {
            return true;
          }

          return cultoExistente === cultoSeleccionado || cultoExistente === '';
        })
        .map((item) => String(Number(item?.mes || 0)))
        .filter(Boolean)
    );
  }, [filtrosPrompt.anio, filtrosPrompt.culto, presentacionesExistentes]);

  useEffect(() => {
    if (!filtrosPrompt.mes) return;
    if (!mesesBloqueados.has(String(filtrosPrompt.mes))) return;

    setFiltrosPrompt((prev) => ({ ...prev, mes: '' }));
  }, [filtrosPrompt.mes, mesesBloqueados]);

  const generarPresentacion = async () => {
    if (!filtrosPrompt.anio || !filtrosPrompt.mes) {
      notificarError('Debe seleccionar anio y mes para generar la presentacion.');
      return;
    }

    if (mesEstaBloqueado(filtrosPrompt.mes)) {
      notificarError('Ya existe una presentación para ese período con el culto seleccionado.');
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
        cultos={cultos}
        mesesBloqueados={mesesBloqueados}
        onClose={() => !enviandoPrompt && setModalPromptVisible(false)}
        onCambiarFiltro={cambiarFiltroPrompt}
        onEnviar={generarPresentacion}
      />
    </>
  );
}
