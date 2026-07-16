import { useEffect, useState } from 'react';
import type { SolicitudReservaGestion } from '../services/reservaService';

interface ConfirmDecisionReservaDialogProps {
    abierto: boolean;
    tipo: 'APROBAR' | 'RECHAZAR';
    solicitud: SolicitudReservaGestion | null;
    cargando: boolean;
    onCerrar: () => void;
    onConfirmar: (data: {
        motivo_rechazo?: string;
        observacion_gestor?: string;
    }) => void;
}

function ConfirmDecisionReservaDialog({
    abierto,
    tipo,
    solicitud,
    cargando,
    onCerrar,
    onConfirmar
}: ConfirmDecisionReservaDialogProps) {
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [observacionGestor, setObservacionGestor] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (abierto) {
            setMotivoRechazo('');
            setObservacionGestor('');
            setError('');
        }
    }, [abierto, tipo]);

    if (!abierto || !solicitud) {
        return null;
    }

    const nombreProspecto = `${solicitud.nombres_inquilino || 'Prospecto'} ${solicitud.apellidos_inquilino || ''}`.trim();

    const esAprobacion = tipo === 'APROBAR';

    const estadoVetting = solicitud.estado_vetting;

    const obtenerTextoVetting = () => {
        if (!estadoVetting) {
            return 'Sin información de vetting';
        }

        if (estadoVetting.requiere_evaluacion) {
            return 'Pendiente de evaluación';
        }

        if (estadoVetting.resultado === 'APROBADO') {
            return 'Vetting aprobado';
        }

        if (estadoVetting.resultado === 'OBSERVADO') {
            return 'Vetting observado';
        }

        if (estadoVetting.resultado === 'RECHAZADO') {
            return 'Vetting rechazado';
        }

        return estadoVetting.mensaje || 'Vetting registrado';
    };

    const obtenerClaseVetting = () => {
        if (!estadoVetting || estadoVetting.requiere_evaluacion) {
            return 'vetting-pendiente';
        }

        if (estadoVetting.resultado === 'APROBADO') {
            return 'vetting-aprobado';
        }

        if (estadoVetting.resultado === 'OBSERVADO') {
            return 'vetting-observado';
        }

        if (estadoVetting.resultado === 'RECHAZADO') {
            return 'vetting-rechazado';
        }

        return 'vetting-pendiente';
    };

    const confirmar = () => {
        setError('');

        if (esAprobacion && !solicitud.estado_vetting?.puede_aprobar) {
            setError('No se puede aprobar porque la solicitud no tiene una evaluación de vetting aprobada.');
            return;
        }

        if (!esAprobacion && !motivoRechazo.trim()) {
            setError('Debe ingresar el motivo del rechazo.');
            return;
        }

        if (motivoRechazo.trim().length > 300) {
            setError('El motivo de rechazo no puede superar los 300 caracteres.');
            return;
        }

        if (observacionGestor.trim().length > 500) {
            setError('La observación del gestor no puede superar los 500 caracteres.');
            return;
        }

        onConfirmar({
            motivo_rechazo: motivoRechazo.trim() || undefined,
            observacion_gestor: observacionGestor.trim() || undefined
        });
    };

    return (
        <div className="confirm-reserva-overlay">
            <div className="confirm-reserva-dialog">
                <div className="confirm-reserva-icon">
                    {esAprobacion ? '✓' : '!'}
                </div>

                <div className="confirm-reserva-content">
                    <p className="confirm-reserva-subtitle">
                        {esAprobacion ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                    </p>

                    <h2>
                        {esAprobacion
                            ? '¿Deseas aprobar esta solicitud evaluada?'
                            : '¿Deseas rechazar esta solicitud?'}
                    </h2>

                    <p className="confirm-reserva-text">
                        Solicitud de <strong>{nombreProspecto}</strong> para el inmueble{' '}
                        <strong>{solicitud.nombre_inmueble}</strong>.
                    </p>

                    <div className="confirm-reserva-info">
                        <p>
                            <strong>Reserva:</strong> #{solicitud.reserva_id}
                        </p>
                        <p>
                            <strong>Renta:</strong> {solicitud.moneda} {solicitud.renta_pactada_mensual}
                        </p>
                    </div>

                    {esAprobacion && (
                        <div className={`confirm-vetting-box ${obtenerClaseVetting()}`}>
                            <div>
                                <strong>{obtenerTextoVetting()}</strong>
                                <p>
                                    {estadoVetting?.mensaje ||
                                        'La solicitud debe contar con evaluación aprobada antes de confirmar.'}
                                </p>
                            </div>

                            <div className="confirm-vetting-score">
                                <span>Score</span>
                                <strong>
                                    {estadoVetting?.score_riesgo !== null &&
                                    estadoVetting?.score_riesgo !== undefined
                                        ? `${estadoVetting.score_riesgo}/100`
                                        : 'N/R'}
                                </strong>
                            </div>
                        </div>
                    )}

                    {!esAprobacion && (
                        <div className="confirm-reserva-field">
                            <label>Motivo del rechazo</label>
                            <textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                placeholder="Ejemplo: El prospecto no cumple con los requisitos básicos solicitados."
                                maxLength={300}
                                disabled={cargando}
                            />
                            <small>{motivoRechazo.length}/300 caracteres</small>
                        </div>
                    )}

                    <div className="confirm-reserva-field">
                        <label>
                            Observación del gestor {esAprobacion ? '(opcional)' : '(opcional)'}
                        </label>
                        <textarea
                            value={observacionGestor}
                            onChange={(e) => setObservacionGestor(e.target.value)}
                            placeholder={
                                esAprobacion
                                    ? 'Ejemplo: Solicitud aprobada luego de revisar el vetting y el historial del inquilino.'
                                    : 'Ejemplo: Se recomienda actualizar los datos del perfil antes de volver a solicitar.'
                            }
                            maxLength={500}
                            disabled={cargando}
                        />
                        <small>{observacionGestor.length}/500 caracteres</small>
                    </div>

                    {error && (
                        <div className="confirm-reserva-error">
                            {error}
                        </div>
                    )}

                    <div className="confirm-reserva-actions">
                        <button
                            type="button"
                            className="confirm-reserva-btn-secondary"
                            onClick={onCerrar}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className={esAprobacion
                                ? 'confirm-reserva-btn-primary'
                                : 'confirm-reserva-btn-danger'}
                            onClick={confirmar}
                            disabled={cargando}
                        >
                            {cargando
                                ? 'Procesando...'
                                : esAprobacion
                                    ? 'Sí, aprobar'
                                    : 'Sí, rechazar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDecisionReservaDialog;