import { useEffect, useState } from 'react';
import VisitasGeneralView from '../components/campanas/VisitasGeneralView';
import campanaApi from '../api/campanaApi';
import { useAuth } from '../hooks/useAuth';

/**
 * Seccion independiente de Visitas (personas visitantes de campanas, estudios y cultos).
 */
export default function VisitasPage() {
  const { puedeEditar } = useAuth();
  const [campanas, setCampanas] = useState([]);

  useEffect(() => {
    let cancelado = false;

    const cargarCampanas = async () => {
      try {
        const res = await campanaApi.listar();
        if (!cancelado) setCampanas(res?.exito ? (res.datos?.items || []) : []);
      } catch {
        if (!cancelado) setCampanas([]);
      }
    };

    cargarCampanas();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="container-fluid py-4">
      <VisitasGeneralView campanas={campanas} soloLectura={!puedeEditar('visitas')} />
    </div>
  );
}
