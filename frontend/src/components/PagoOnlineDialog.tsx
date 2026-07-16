import type {
    ReciboPendiente,
    MetodoPago
} from '../services/pagoService';

interface PagoOnlineDialogProps {
    abierto: boolean;
    recibo: ReciboPendiente | null;
    procesando: boolean;
    metodoPago: MetodoPago;
    onCambiarMetodoPago: (metodo: MetodoPago) => void;
    onCerrar: () => void;
    onConfirmar: () => void;
}

function PagoOnlineDialog({
    abierto,
    recibo,
    procesando,
    metodoPago,
    onCambiarMetodoPago,
    onCerrar,
    onConfirmar
}: PagoOnlineDialogProps) {
    if (!abierto || !recibo) return null;

    const formatearMoneda = (monto: number | string | null | undefined) => {
        const valor = Number(monto || 0);

        return valor.toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });
    };

    const formatearFecha = (fecha: string | null | undefined) => {
        if (!fecha) return '-';

        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const obtenerTextoMetodo = () => {
        if (metodoPago === 'ONLINE') return 'Pago online';
        if (metodoPago === 'TARJETA') return 'Tarjeta';
        if (metodoPago === 'TRANSFERENCIA') return 'Transferencia bancaria';
        return 'Pago online';
    };

    return (
        <div className="pago-online-overlay">
            <div className="pago-online-dialog">
                <button
                    type="button"
                    className="pago-online-close"
                    onClick={onCerrar}
                    disabled={procesando}
                >
                    ×
                </button>

                <div className="pago-online-header">
                    <div className="pago-online-icon">
                        💳
                    </div>

                    <div>
                        <h2>Confirmar pago</h2>
                        <p>Revisa los datos de la boleta antes de continuar.</p>
                    </div>
                </div>

                <div className="pago-online-content">
                    <div className="pago-online-row">
                        <span>Boleta</span>
                        <strong>#{recibo.recibo_id}</strong>
                    </div>

                    <div className="pago-online-row">
                        <span>Inmueble</span>
                        <strong>{recibo.nombre_inmueble}</strong>
                    </div>

                    <div className="pago-online-row">
                        <span>Periodo</span>
                        <strong>
                            {recibo.periodo_mes}/{recibo.periodo_anio}
                        </strong>
                    </div>

                    <div className="pago-online-row">
                        <span>Vencimiento</span>
                        <strong>{formatearFecha(recibo.fecha_vencimiento)}</strong>
                    </div>

                    <div className="pago-online-total">
                        <span>Total a pagar</span>
                        <strong>{formatearMoneda(recibo.saldo_pendiente)}</strong>
                    </div>

                    <div className="pago-online-metodo">
                        <label>Método de pago</label>

                        <select
                            value={metodoPago}
                            onChange={(e) => onCambiarMetodoPago(e.target.value as MetodoPago)}
                            disabled={procesando}
                        >
                            <option value="ONLINE">Pago online</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia bancaria</option>
                            
                        </select>
                    </div>
                </div>

                <div className="pago-online-info">
                    Se registrará el pago con el método: <strong>{obtenerTextoMetodo()}</strong>.
                    El pago será registrado al confirmar la operación.
                </div>

                <div className="pago-online-actions">
                    <button
                        type="button"
                        className="btn-pago-cancelar"
                        onClick={onCerrar}
                        disabled={procesando}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="btn-pago-confirmar"
                        onClick={onConfirmar}
                        disabled={procesando}
                    >
                        {procesando ? 'Procesando...' : 'Confirmar pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PagoOnlineDialog;