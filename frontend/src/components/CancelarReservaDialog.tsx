import { useState } from 'react';

interface CancelarReservaDialogProps {
    abierto: boolean;
    cargando?: boolean;
    titulo?: string;
    descripcion?: string;
    onConfirmar: (motivo: string) => void;
    onCerrar: () => void;
}

function CancelarReservaDialog({
    abierto,
    cargando = false,
    titulo = 'Cancelar reserva',
    descripcion = 'Al cancelar esta reserva, el anfitrión recibirá una notificación.',
    onConfirmar,
    onCerrar
}: CancelarReservaDialogProps) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    if (!abierto) return null;

    const confirmar = () => {
        const motivoLimpio = motivo.trim();

        if (motivoLimpio.length > 500) {
            setError('El motivo no puede superar los 500 caracteres.');
            return;
        }

        setError('');
        onConfirmar(motivoLimpio);
    };

    return (
        <div className="cancel-modal-overlay">
            <div className="cancel-modal-card">
                <div className="cancel-modal-icon">
                    !
                </div>

                <h3>{titulo}</h3>

                <p className="cancel-modal-description">
                    {descripcion}
                </p>

                <div className="cancel-modal-field">
                    <label htmlFor="motivo-cancelacion">
                        Motivo de cancelación
                    </label>

                    <textarea
                        id="motivo-cancelacion"
                        value={motivo}
                        onChange={(e) => {
                            setMotivo(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Ejemplo: Cambio de planes del viaje"
                        disabled={cargando}
                        maxLength={500}
                        rows={4}
                    />
                    <small>{motivo.length}/500</small>
                    {error && <p className="error-message">{error}</p>}
                </div>

                <div className="cancel-modal-actions">
                    <button
                        type="button"
                        className="cancel-modal-btn secondary"
                        onClick={onCerrar}
                        disabled={cargando}
                    >
                        Volver
                    </button>

                    <button
                        type="button"
                        className="cancel-modal-btn danger"
                        onClick={confirmar}
                        disabled={cargando}
                    >
                        {cargando ? 'Cancelando...' : 'Cancelar reserva'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CancelarReservaDialog;
