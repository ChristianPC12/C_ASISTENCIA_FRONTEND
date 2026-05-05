import { useState } from 'react';

const TIPO_OPCIONES = [
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'INTERESADO', etiqueta: 'Interesado' }
];

const ETARIA_OPCIONES = [
  { valor: '', etiqueta: 'Sin clasificar' },
  { valor: 'NINO', etiqueta: 'Niño' },
  { valor: 'JOVEN', etiqueta: 'Joven' },
  { valor: 'ADULTO', etiqueta: 'Adulto' }
];

const SEGUIMIENTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'ESTUDIO_BIBLICO', etiqueta: 'Estudio bíblico' },
  { valor: 'NO_LOCALIZABLE', etiqueta: 'No localizable' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' }
];

const FORM_INICIAL = {
  nombre_completo: '',
  telefono: '',
  telefono_internacional: false,
  correo: '',
  direccion: '',
  barrio_comunidad: '',
  procedencia: '',
  tipo_asistente: 'VISITA',
  clasificacion_etaria: '',
  primera_vez: true,
  observaciones: '',
  estado_seguimiento: 'PENDIENTE'
};

const LIMITES_VISITA = {
  correo: 70,
  procedencia: 40,
  direccion: 80,
  barrio: 45,
  observaciones: 120,
  telefonoLocal: 9,
  telefonoInternacional: 20
};

const TELEFONO_CR_REGEX = /^\d{4}-\d{4}$/;

const formatearTelefonoCostaRica = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 4) return digitos;
  return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
};

const normalizarTelefonoInternacional = (valor) => (
  String(valor || '')
    .replace(/[^\d+\-()\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, LIMITES_VISITA.telefonoInternacional)
);

const normalizarCorreo = (valor) => (
  String(valor || '')
    .replace(/\s/g, '')
    .replace(/[^A-Za-z0-9._%+\-@]/g, '')
    .slice(0, LIMITES_VISITA.correo)
);

const crearFormInicial = (valorInicial) => {
  const base = { ...FORM_INICIAL, ...(valorInicial || {}) };
  const esInternacional = Boolean(
    base.telefono_internacional
    || (base.telefono && !TELEFONO_CR_REGEX.test(String(base.telefono)))
  );

  return {
    ...base,
    telefono: esInternacional
      ? normalizarTelefonoInternacional(base.telefono)
      : formatearTelefonoCostaRica(base.telefono),
    telefono_internacional: esInternacional
  };
};

export default function VisitaFormModal({ editandoId, valorInicial, onCerrar, onGuardar, guardando }) {
  const estadoInicial = crearFormInicial(valorInicial);
  const [form, setForm] = useState(estadoInicial);
  const [mostrarMas, setMostrarMas] = useState(Boolean(editandoId));
  const [telefonoInternacional, setTelefonoInternacional] = useState(Boolean(estadoInicial.telefono_internacional));

  const cambiarTelefono = (valor) => {
    setForm(p => ({
      ...p,
      telefono: telefonoInternacional
        ? normalizarTelefonoInternacional(valor)
        : formatearTelefonoCostaRica(valor)
    }));
  };

  const alternarTelefonoInternacional = () => {
    const nuevoValor = !telefonoInternacional;
    setTelefonoInternacional(nuevoValor);
    setForm(p => ({
      ...p,
      telefono: nuevoValor
        ? normalizarTelefonoInternacional(p.telefono)
        : formatearTelefonoCostaRica(p.telefono),
      telefono_internacional: nuevoValor
    }));
  };

  return (
    <div className="prompt-overlay-iasd" onClick={onCerrar}>
      <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>
            {editandoId ? 'Editar visita' : 'Registrar nueva visita'}
          </h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>

        <div style={{ padding: '1rem 0', maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="row g-2 visita-form-grid">
            <div className="col-12 col-md-6">
              <label className="form-label form-label-sm">Nombre</label>
              <input className="form-control form-control-sm" value={form.nombre_completo} onChange={(e) => setForm(p => ({ ...p, nombre_completo: e.target.value }))} maxLength={45} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label form-label-sm">Tipo</label>
              <select className="form-select form-select-sm" value={form.tipo_asistente} onChange={(e) => setForm(p => ({ ...p, tipo_asistente: e.target.value }))}>
                {TIPO_OPCIONES.map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label form-label-sm">Teléfono</label>
              <div className="input-group input-group-sm visitas-phone-group">
                <input
                  type="tel"
                  className="form-control form-control-sm"
                  value={form.telefono}
                  onChange={(e) => cambiarTelefono(e.target.value)}
                  maxLength={telefonoInternacional ? LIMITES_VISITA.telefonoInternacional : LIMITES_VISITA.telefonoLocal}
                  inputMode={telefonoInternacional ? 'tel' : 'numeric'}
                  placeholder={telefonoInternacional ? '+1 555 0100' : '8888-8888'}
                />
                <button
                  type="button"
                  className={`btn ${telefonoInternacional ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={alternarTelefonoInternacional}
                  title="Solo para números extranjeros"
                  aria-label="Activar formato para números extranjeros"
                  aria-pressed={telefonoInternacional}
                >
                  <i className="bi bi-globe2" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {mostrarMas && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Correo</label>
                  <input type="email" inputMode="email" className="form-control form-control-sm" value={form.correo} onChange={(e) => setForm(p => ({ ...p, correo: normalizarCorreo(e.target.value) }))} maxLength={LIMITES_VISITA.correo} placeholder="correo@dominio.com" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Procedencia</label>
                  <input className="form-control form-control-sm" value={form.procedencia} onChange={(e) => setForm(p => ({ ...p, procedencia: e.target.value }))} maxLength={LIMITES_VISITA.procedencia} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Clasificación</label>
                  <select className="form-select form-select-sm" value={form.clasificacion_etaria} onChange={(e) => setForm(p => ({ ...p, clasificacion_etaria: e.target.value }))}>
                    {ETARIA_OPCIONES.map(o => <option key={o.valor || 'ninguna'} value={o.valor}>{o.etiqueta}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Seguimiento</label>
                  <select className="form-select form-select-sm" value={form.estado_seguimiento} onChange={(e) => setForm(p => ({ ...p, estado_seguimiento: e.target.value }))}>
                    {SEGUIMIENTO_OPCIONES.map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Dirección</label>
                  <input className="form-control form-control-sm" value={form.direccion} onChange={(e) => setForm(p => ({ ...p, direccion: e.target.value }))} maxLength={LIMITES_VISITA.direccion} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Barrio / comunidad</label>
                  <input className="form-control form-control-sm" value={form.barrio_comunidad} onChange={(e) => setForm(p => ({ ...p, barrio_comunidad: e.target.value }))} maxLength={LIMITES_VISITA.barrio} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Observaciones</label>
                  <input className="form-control form-control-sm" value={form.observaciones} onChange={(e) => setForm(p => ({ ...p, observaciones: e.target.value }))} maxLength={LIMITES_VISITA.observaciones} />
                </div>
              </>
            )}

            <div className="col-12">
              <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted" onClick={() => setMostrarMas(!mostrarMas)}>
                <i className={`bi ${mostrarMas ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                <span>{mostrarMas ? 'Menos datos' : 'Más datos de la visita'}</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onGuardar({ ...form, telefono_internacional: telefonoInternacional })} disabled={guardando}>
            <i className="bi bi-floppy me-1"></i>
            {guardando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar visita')}
          </button>
        </div>
      </div>
    </div>
  );
}
