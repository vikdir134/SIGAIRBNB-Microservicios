interface ConfirmAplicarIPCDialogProps {
  abierto: boolean;
  cantidadInmuebles: number;
  cargando: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

function ConfirmAplicarIPCDialog({
  abierto,
  cantidadInmuebles,
  cargando,
  onConfirmar,
  onCerrar
}: ConfirmAplicarIPCDialogProps) {
  if (!abierto) return null;

  return (
    <div className="tarifas-modal-overlay">
      <div className="tarifas-modal">
        <h2>Confirmar actualización de tarifas</h2>

        <p>
          Esta acción actualizará las rentas futuras de los inmuebles seleccionados.
          No modificará recibos anteriores ni pagos registrados.
        </p>

        <div className="tarifas-modal-summary">
          <span>Inmuebles seleccionados:</span>
          <strong>{cantidadInmuebles}</strong>
        </div>

        <div className="tarifas-modal-actions">
          <button
            type="button"
            className="tarifas-btn tarifas-btn-secondary"
            onClick={onCerrar}
            disabled={cargando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="tarifas-btn tarifas-btn-success"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Aplicando...' : 'Sí, aplicar IPC'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAplicarIPCDialog;