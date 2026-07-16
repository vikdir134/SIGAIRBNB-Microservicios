import { useEffect, useMemo, useState } from 'react';

import {
    solicitarExtensionReserva,
    type SolicitudReserva,
    type SolicitudExtension
} from '../services/reservaService';

interface SolicitudExtensionDialogProps {
    abierto: boolean;
    solicitud: SolicitudReserva | null;
    extensionPendiente: SolicitudExtension | null;
    onCerrar: () => void;
    onRegistrada: () => void | Promise<void>;
}

const obtenerFechaYYYYMMDD = (
    valor?: string | null
): string => {
    if (!valor) return '';

    return String(valor).slice(0, 10);
};

const sumarUnDia = (fecha: string): string => {
    if (!fecha) return '';

    const partes = fecha.split('-').map(Number);

    if (
        partes.length !== 3 ||
        partes.some((parte) => Number.isNaN(parte))
    ) {
        return '';
    }

    const [anio, mes, dia] = partes;

    const fechaUTC = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    fechaUTC.setUTCDate(fechaUTC.getUTCDate() + 1);

    return fechaUTC.toISOString().slice(0, 10);
};

const formatearFecha = (
    valor?: string | null
): string => {
    const fecha = obtenerFechaYYYYMMDD(valor);

    if (!fecha) return 'No especificada';

    const [anio, mes, dia] = fecha.split('-');

    return `${dia}/${mes}/${anio}`;
};

function SolicitudExtensionDialog({
    abierto,
    solicitud,
    extensionPendiente,
    onCerrar,
    onRegistrada
}: SolicitudExtensionDialogProps) {
    const [nuevaFechaFin, setNuevaFechaFin] =
        useState('');

    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [registrada, setRegistrada] = useState(false);

    const fechaFinActual = useMemo(() => {
        return obtenerFechaYYYYMMDD(
            solicitud?.fecha_fin
        );
    }, [solicitud?.fecha_fin]);

    const fechaMinima = useMemo(() => {
        return sumarUnDia(fechaFinActual);
    }, [fechaFinActual]);

    useEffect(() => {
        if (!abierto) return;

        setNuevaFechaFin(fechaMinima);
        setMotivo('');
        setError('');
        setMensaje('');
        setEnviando(false);
        setRegistrada(false);
    }, [
        abierto,
        solicitud?.reserva_id,
        fechaMinima
    ]);

    if (!abierto || !solicitud) {
        return null;
    }

    const cerrarDialogo = () => {
        if (enviando) return;

        onCerrar();
    };

    const manejarSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError('');
        setMensaje('');

        if (extensionPendiente) {
            setError(
                'Ya existe una solicitud de extensión pendiente para esta reserva.'
            );
            return;
        }

        if (!nuevaFechaFin) {
            setError(
                'Debes seleccionar la nueva fecha de finalización.'
            );
            return;
        }

        if (
            fechaFinActual &&
            nuevaFechaFin <= fechaFinActual
        ) {
            setError(
                'La nueva fecha debe ser posterior a la fecha final actual.'
            );
            return;
        }

        const motivoLimpio = motivo.trim();

        if (motivoLimpio.length > 500) {
            setError(
                'El motivo no puede superar los 500 caracteres.'
            );
            return;
        }

        try {
            setEnviando(true);

            const response =
                await solicitarExtensionReserva(
                    solicitud.reserva_id,
                    {
                        nueva_fecha_fin: nuevaFechaFin,
                        motivo:
                            motivoLimpio || undefined
                    }
                );

            setMensaje(response.mensaje);
            setRegistrada(true);

            await onRegistrada();

        } catch (errorSolicitud) {
            const mensajeError =
                errorSolicitud instanceof Error
                    ? errorSolicitud.message
                    : 'No se pudo registrar la solicitud de extensión.';

            setError(mensajeError);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div
            className="extension-dialog-overlay"
            onMouseDown={cerrarDialogo}
        >
            <div
                className="extension-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-extension"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="extension-dialog-header">
                    <div>
                        <h2 id="titulo-extension">
                            Solicitar extensión
                        </h2>

                        <p>
                            Solicita ampliar la fecha final
                            de tu reserva.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="extension-dialog-close"
                        onClick={cerrarDialogo}
                        disabled={enviando}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>

                <div className="extension-reserva-resumen">
                    <div>
                        <span>Inmueble</span>
                        <strong>
                            {solicitud.nombre_inmueble ||
                                solicitud.titulo_publicacion ||
                                `Reserva #${solicitud.reserva_id}`}
                        </strong>
                    </div>

                    <div>
                        <span>Fecha final actual</span>
                        <strong>
                            {formatearFecha(
                                solicitud.fecha_fin
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Estado</span>
                        <strong>
                            {solicitud.estado_reserva}
                        </strong>
                    </div>
                </div>

                {extensionPendiente && (
                    <div className="extension-alert extension-alert-warning">
                        Ya existe una solicitud pendiente
                        hasta el{' '}
                        <strong>
                            {formatearFecha(
                                extensionPendiente.nueva_fecha_fin
                            )}
                        </strong>
                        .
                    </div>
                )}

                {error && (
                    <div className="extension-alert extension-alert-error">
                        {error}
                    </div>
                )}

                {mensaje && (
                    <div className="extension-alert extension-alert-success">
                        {mensaje}
                    </div>
                )}

                {!registrada && (
                    <form
                        onSubmit={manejarSubmit}
                        className="extension-form"
                    >
                        <div className="extension-form-group">
                            <label htmlFor="nueva_fecha_fin">
                                Nueva fecha de finalización
                            </label>

                            <input
                                id="nueva_fecha_fin"
                                name="nueva_fecha_fin"
                                type="date"
                                min={fechaMinima}
                                value={nuevaFechaFin}
                                onChange={(event) =>
                                    setNuevaFechaFin(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    enviando ||
                                    Boolean(
                                        extensionPendiente
                                    )
                                }
                                required
                            />

                            <small>
                                Debe ser posterior al{' '}
                                {formatearFecha(
                                    solicitud.fecha_fin
                                )}
                                .
                            </small>
                        </div>

                        <div className="extension-form-group">
                            <label htmlFor="motivo_extension">
                                Motivo de la extensión
                            </label>

                            <textarea
                                id="motivo_extension"
                                name="motivo"
                                rows={4}
                                maxLength={500}
                                value={motivo}
                                onChange={(event) =>
                                    setMotivo(
                                        event.target.value
                                    )
                                }
                                placeholder="Describe brevemente por qué necesitas ampliar tu estadía."
                                disabled={
                                    enviando ||
                                    Boolean(
                                        extensionPendiente
                                    )
                                }
                            />

                            <small className="extension-character-count">
                                {motivo.length}/500
                            </small>
                        </div>

                        <div className="extension-dialog-actions">
                            <button
                                type="button"
                                className="extension-button-secondary"
                                onClick={cerrarDialogo}
                                disabled={enviando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="extension-button-primary"
                                disabled={
                                    enviando ||
                                    Boolean(
                                        extensionPendiente
                                    )
                                }
                            >
                                {enviando
                                    ? 'Enviando...'
                                    : 'Enviar solicitud'}
                            </button>
                        </div>
                    </form>
                )}

                {registrada && (
                    <div className="extension-dialog-actions">
                        <button
                            type="button"
                            className="extension-button-primary"
                            onClick={cerrarDialogo}
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SolicitudExtensionDialog;