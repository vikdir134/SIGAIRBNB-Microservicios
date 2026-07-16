import type { SolicitudReservaGestion } from '../services/reservaService';

interface ConfirmOcupacionReservaDialogProps {
    abierto: boolean;
    tipo: 'CHECKIN' | 'CHECKOUT';
    solicitud: SolicitudReservaGestion | null;
    procesando: boolean;
    onCerrar: () => void;
    onConfirmar: () => void;
}

function ConfirmOcupacionReservaDialog({
    abierto,
    tipo,
    solicitud,
    procesando,
    onCerrar,
    onConfirmar
}: ConfirmOcupacionReservaDialogProps) {
    if (!abierto || !solicitud) {
        return null;
    }

    const esCheckin = tipo === 'CHECKIN';

    const nombreInquilino = `
        ${solicitud.nombres_inquilino || ''}
        ${solicitud.apellidos_inquilino || ''}
    `.trim() || solicitud.correo_inquilino;

    const nombreInmueble =
        solicitud.nombre_inmueble ||
        solicitud.codigo_inmueble ||
        'Inmueble';

    const formatearFecha = (fecha?: string | null) => {
        if (!fecha) {
            return 'No especificada';
        }

        const fechaNormalizada = fecha.slice(0, 10);
        const [anio, mes, dia] = fechaNormalizada.split('-');

        if (!anio || !mes || !dia) {
            return fecha;
        }

        return `${dia}/${mes}/${anio}`;
    };

    const fechaProgramada = esCheckin
        ? solicitud.fecha_inicio
        : solicitud.fecha_fin;

    const cerrarDesdeFondo = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        if (
            event.target === event.currentTarget &&
            !procesando
        ) {
            onCerrar();
        }
    };

    return (
        <div
            className="modal-overlay"
            onMouseDown={cerrarDesdeFondo}
        >
            <div
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ocupacion-dialog-title"
            >
                <p className="gestion-section-label">
                    Control de ocupación
                </p>

                <h2 id="ocupacion-dialog-title">
                    {esCheckin
                        ? 'Confirmar check-in'
                        : 'Confirmar check-out'}
                </h2>

                <p>
                    {esCheckin
                        ? 'Confirma el ingreso del inquilino al inmueble.'
                        : 'Confirma la salida del inquilino del inmueble.'}
                </p>

                <div className="detalle-confirmacion">
                    <p>
                        <strong>Inquilino:</strong>{' '}
                        {nombreInquilino}
                    </p>

                    <p>
                        <strong>Inmueble:</strong>{' '}
                        {nombreInmueble}
                    </p>

                    <p>
                        <strong>
                            {esCheckin
                                ? 'Fecha de ingreso:'
                                : 'Fecha de salida:'}
                        </strong>{' '}
                        {formatearFecha(fechaProgramada)}
                    </p>
                </div>

                <p className="ocupacion-dialog-warning">
                    {esCheckin
                        ? 'La reserva pasará a ACTIVA y el inmueble quedará OCUPADO.'
                        : 'La reserva pasará a FINALIZADA y el inmueble quedará DISPONIBLE.'}
                </p>

                <div className="form-actions modal-actions">
                    <button
                        type="button"
                        className={
                            esCheckin
                                ? 'gestion-btn-checkin'
                                : 'gestion-btn-checkout'
                        }
                        onClick={onConfirmar}
                        disabled={procesando}
                    >
                        {procesando
                            ? 'Procesando...'
                            : esCheckin
                                ? 'Confirmar check-in'
                                : 'Confirmar check-out'}
                    </button>

                    <button
                        type="button"
                        className="btn-gestion-secondary"
                        onClick={onCerrar}
                        disabled={procesando}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmOcupacionReservaDialog;