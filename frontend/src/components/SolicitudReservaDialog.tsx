import { useState } from 'react';
import {
    solicitarReserva,
    type SolicitudReservaFormData
} from '../services/reservaService';
import { todayDateOnly, validateDateRange } from '../utils/dateValidators';

interface PublicacionSolicitudInfo {
    publicacion_id: number;
    titulo: string;
    nombre_inmueble?: string;
    tipo_inmueble?: string;
    precio_publicado_mensual?: number;
    moneda?: string;
    disponible_desde?: string | null;
}

interface SolicitudReservaDialogProps {
    abierto: boolean;
    publicacion: PublicacionSolicitudInfo | null;
    onCerrar: () => void;
    onSolicitudCreada?: () => void;
}

function SolicitudReservaDialog({
    abierto,
    publicacion,
    onCerrar,
    onSolicitudCreada
}: SolicitudReservaDialogProps) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [observacion, setObservacion] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    if (!abierto || !publicacion) {
        return null;
    }

    const limpiarFormulario = () => {
        setFechaInicio('');
        setFechaFin('');
        setObservacion('');
        setMensaje('');
        setError('');
    };

    const cerrarDialog = () => {
        limpiarFormulario();
        onCerrar();
    };

    const validarFormulario = () => {
        if (!fechaInicio || !fechaFin) {
            setError('Debe seleccionar la fecha de inicio y la fecha de fin.');
            return false;
        }

        if (fechaFin <= fechaInicio) {
            setError('La fecha de fin debe ser mayor que la fecha de inicio.');
            return false;
        }

        const errorFechas = validateDateRange({
            start: fechaInicio,
            end: fechaFin,
            allowPast: false,
            maxDays: 730,
            maxFutureYears: 3
        });

        if (errorFechas) {
            setError(errorFechas);
            return false;
        }

        if (observacion.trim().length > 500) {
            setError('La observación no puede superar los 500 caracteres.');
            return false;
        }

        return true;
    };

    const enviarSolicitud = async (e: React.FormEvent) => {
        e.preventDefault();

        setMensaje('');
        setError('');

        if (!validarFormulario()) {
            return;
        }

        try {
            setCargando(true);

            const data: SolicitudReservaFormData = {
                publicacion_id: publicacion.publicacion_id,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                observacion_inquilino: observacion.trim() || undefined
            };

            const response = await solicitarReserva(data);

            setMensaje(response.mensaje || 'Solicitud enviada correctamente.');

            if (onSolicitudCreada) {
                onSolicitudCreada();
            }

            setTimeout(() => {
                cerrarDialog();
            }, 1200);

        } catch (err) {
            const mensajeError =
                err instanceof Error
                    ? err.message
                    : 'Error al enviar la solicitud de reserva.';

            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };
const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return 'No especificada';

    const fechaSolo = fecha.slice(0, 10);
    const [anio, mes, dia] = fechaSolo.split('-');

    if (!anio || !mes || !dia) {
        return 'No especificada';
    }

    return `${dia}/${mes}/${anio}`;
};

const obtenerFechaMinima = () => {
    const hoy = todayDateOnly();

    if (!publicacion.disponible_desde) return hoy;

    const disponibleDesde = publicacion.disponible_desde.slice(0, 10);

    return disponibleDesde > hoy ? disponibleDesde : hoy;
};

    return (
        <div className="reserva-dialog-overlay">
            <div className="reserva-dialog">
                <div className="reserva-dialog-header">
                    <div>
                        <p className="reserva-dialog-subtitle">
                            Solicitud de reserva
                        </p>
                        <h2>{publicacion.titulo}</h2>
                    </div>

                    <button
                        type="button"
                        className="reserva-dialog-close"
                        onClick={cerrarDialog}
                        disabled={cargando}
                    >
                        ×
                    </button>
                </div>

                <div className="reserva-dialog-info">
                    <p>
                        <strong>Inmueble:</strong>{' '}
                        {publicacion.nombre_inmueble || 'No especificado'}
                    </p>

                    <p>
                        <strong>Tipo:</strong>{' '}
                        {publicacion.tipo_inmueble || 'No especificado'}
                    </p>

                    <p>
                        <strong>Precio mensual:</strong>{' '}
                        {publicacion.precio_publicado_mensual
                            ? `${publicacion.moneda || 'PEN'} ${publicacion.precio_publicado_mensual}`
                            : 'No especificado'}
                    </p>

                    <p>
                        <strong>Disponible desde:</strong>{' '}
                        {formatearFecha(publicacion.disponible_desde)}
                    </p>
                </div>

                <form onSubmit={enviarSolicitud} className="reserva-form">
                    <div className="reserva-form-grid">
                        <div className="reserva-field">
                            <label>Fecha de inicio</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                min={obtenerFechaMinima()}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                disabled={cargando}
                            />
                        </div>

                        <div className="reserva-field">
                            <label>Fecha de fin</label>
                            <input
                                type="date"
                                value={fechaFin}
                                min={fechaInicio || obtenerFechaMinima()}
                                onChange={(e) => setFechaFin(e.target.value)}
                                disabled={cargando}
                            />
                        </div>
                    </div>

                    <div className="reserva-field">
                        <label>Observación para el anfitrión</label>
                        <textarea
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            placeholder="Ejemplo: Estoy interesado en reservar este inmueble para uso personal o comercial."
                            maxLength={500}
                            disabled={cargando}
                        />
                        <small>{observacion.length}/500 caracteres</small>
                    </div>

                    {error && (
                        <div className="reserva-alert reserva-alert-error">
                            {error}
                        </div>
                    )}

                    {mensaje && (
                        <div className="reserva-alert reserva-alert-success">
                            {mensaje}
                        </div>
                    )}

                    <div className="reserva-dialog-actions">
                        <button
                            type="button"
                            className="reserva-btn reserva-btn-secondary"
                            onClick={cerrarDialog}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="reserva-btn reserva-btn-primary"
                            disabled={cargando}
                        >
                            {cargando ? 'Enviando...' : 'Enviar solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SolicitudReservaDialog;
