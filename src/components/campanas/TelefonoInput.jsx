const MAX_LOCAL = 9;
const MAX_INTERNACIONAL = 20;

export const formatearTelefonoCostaRica = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 4) return digitos;
  return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
};

export const normalizarTelefonoInternacional = (valor) => (
  String(valor || '')
    .replace(/[^\d+\-()\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, MAX_INTERNACIONAL)
);

/**
 * Telefono de Costa Rica (0000-0000, solo digitos y guion) con boton del mundo
 * para activar el formato de numeros extranjeros.
 * onChange recibe { telefono, telefono_internacional }.
 */
export default function TelefonoInput({ telefono, internacional = false, onChange }) {
  const cambiarValor = (valor) => {
    onChange({
      telefono: internacional ? normalizarTelefonoInternacional(valor) : formatearTelefonoCostaRica(valor),
      telefono_internacional: internacional
    });
  };

  const alternar = () => {
    const nuevo = !internacional;
    onChange({
      telefono: nuevo ? normalizarTelefonoInternacional(telefono) : formatearTelefonoCostaRica(telefono),
      telefono_internacional: nuevo
    });
  };

  return (
    <div className="input-group input-group-sm visitas-phone-group">
      <input
        type="tel"
        className="form-control form-control-sm"
        value={telefono || ''}
        onChange={(e) => cambiarValor(e.target.value)}
        maxLength={internacional ? MAX_INTERNACIONAL : MAX_LOCAL}
        inputMode={internacional ? 'tel' : 'numeric'}
        placeholder={internacional ? '+1 555 0100' : '8888-8888'}
      />
      <button
        type="button"
        className={`btn ${internacional ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={alternar}
        title="Solo para números extranjeros"
        aria-label="Activar formato para números extranjeros"
        aria-pressed={internacional}
      >
        <i className="bi bi-globe2" aria-hidden="true"></i>
      </button>
    </div>
  );
}
