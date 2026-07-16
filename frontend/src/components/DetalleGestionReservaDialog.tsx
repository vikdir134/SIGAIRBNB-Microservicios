import {
    useCallback,
    useEffect,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
    aprobarSolicitudExtensionGestion,
    obtenerEventosReservaGestion,
    rechazarSolicitudExtensionGestion,
    type EventoReserva,
    type SolicitudExtensionGestion
} from '../services/reservaService';

import {
    descargarReciboPdf,
    generarReciboReservaGestion,
    listarRecibosReserva,
    obtenerNumeroVisualRecibo,
    previsualizarReciboReservaGestion,
    verReciboPdf,
    type ConceptoEditadoRecibo,
    type ReciboReserva,
    type VistaPreviaRecibo
} from '../services/reciboService';

import ConfirmDialog from './ConfirmDialog';

interface DetalleGestionReservaDialogProps {
    abierto: boolean;
    reservaId: number | null;
    onCerrar: () => void;
}

function DetalleGestionReservaDialog({
    abierto,
    reservaId,
    onCerrar
}: DetalleGestionReservaDialogProps) {
    const navigate = useNavigate();

    const [eventos, setEventos] =
        useState<EventoReserva[]>([]);

    const [reserva, setReserva] =
        useState<any>(null);

    const [
        extensionPendiente,
        setExtensionPendiente
    ] = useState<SolicitudExtensionGestion | null>(
        null
    );

    const [
        comentarioDecision,
        setComentarioDecision
    ] = useState('');

    const [cargando, setCargando] =
        useState(false);

    const [
        procesandoExtension,
        setProcesandoExtension
    ] = useState(false);

    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [recibos, setRecibos] =
        useState<ReciboReserva[]>([]);

    const [procesandoRecibo, setProcesandoRecibo] =
        useState(false);

    const [descargandoRecibo, setDescargandoRecibo] =
        useState(false);

    const [previewRecibo, setPreviewRecibo] =
        useState<VistaPreviaRecibo | null>(null);

    const [previewAbierto, setPreviewAbierto] =
        useState(false);

    const [cargandoPreviewRecibo, setCargandoPreviewRecibo] =
        useState(false);

    const [errorBoleta, setErrorBoleta] =
        useState('');

    const [accionConfirmacion, setAccionConfirmacion] =
        useState<'aprobar' | 'rechazar' | null>(null);

    const obtenerMensajeErrorApi = (
        err: unknown,
        mensajePorDefecto: string
    ) => {
        const errorApi = err as {
            response?: {
                data?: {
                    mensaje?: string;
                    codigo?: string;
                };
            };
            message?: string;
        };

        return (
            errorApi.response?.data?.mensaje ||
            errorApi.message ||
            mensajePorDefecto
        );
    };

    const formatearFecha = (
        fecha?: string | null
    ) => {
        if (!fecha) return 'No especificada';

        const fechaTexto = String(fecha).slice(0, 10);
        const partes = fechaTexto.split('-');

        if (partes.length !== 3) {
            return 'No especificada';
        }

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}/${anio}`;
    };

    const formatearFechaHora = (
        fecha?: string | null
    ) => {
        if (!fecha) return 'No especificada';

        const fechaDate = new Date(fecha);

        if (Number.isNaN(fechaDate.getTime())) {
            return 'No especificada';
        }

        return fechaDate.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const textoEvento = (
        tipo: string,
        descripcion?: string | null
    ) => {
        if (
            tipo === 'NOTA' &&
            descripcion
                ?.toLowerCase()
                .includes('evaluación de vetting')
        ) {
            return 'Evaluación de vetting';
        }

        switch (tipo) {
            case 'SOLICITUD':
                return 'Solicitud enviada';

            case 'APROBACION':
                return 'Solicitud aprobada';

            case 'RECHAZO':
                return 'Solicitud rechazada';

            case 'CANCELACION':
                return 'Solicitud cancelada';

            case 'CHECKIN':
                return 'Check-in';

            case 'CHECKOUT':
                return 'Check-out';

            case 'EXTENSION':
                return 'Extensión de reserva';

            case 'NOTA':
                return 'Nota de gestión';

            default:
                return tipo;
        }
    };

    const cargarDetalle = useCallback(async () => {
        if (!abierto || !reservaId) return;

        try {
            setCargando(true);
            setError('');
            setErrorBoleta('');

            const response =
                await obtenerEventosReservaGestion(
                    reservaId
                );

            setReserva(response.reserva);
            setEventos(response.eventos || []);

            setExtensionPendiente(
                response
                    .solicitud_extension_pendiente ||
                    null
            );

            const responseRecibos =
                await listarRecibosReserva(reservaId);

            setRecibos(responseRecibos.recibos || []);
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'Error al cargar el historial de la reserva.'
            );

            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    }, [abierto, reservaId]);

    useEffect(() => {
        void cargarDetalle();
    }, [cargarDetalle]);

    const solicitarConfirmacionAprobacion = () => {
        if (!extensionPendiente) return;

        setError('');
        setMensaje('');
        setErrorBoleta('');
        setAccionConfirmacion('aprobar');
    };

    const solicitarConfirmacionRechazo = () => {
        if (!extensionPendiente) return;

        if (!comentarioDecision.trim()) {
            setError(
                'Debes ingresar el motivo del rechazo.'
            );
            return;
        }

        setError('');
        setMensaje('');
        setErrorBoleta('');
        setAccionConfirmacion('rechazar');
    };

    const aprobarExtension = async () => {
        if (!extensionPendiente) return;

        try {
            setProcesandoExtension(true);
            setError('');
            setMensaje('');
            setErrorBoleta('');

            const response =
                await aprobarSolicitudExtensionGestion(
                    extensionPendiente
                        .solicitud_extension_id,
                    comentarioDecision
                );

            setMensaje(response.mensaje);
            setComentarioDecision('');
            setAccionConfirmacion(null);

            await cargarDetalle();
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'No se pudo aprobar la extensión.'
            );

            setError(mensajeError);
            setAccionConfirmacion(null);
        } finally {
            setProcesandoExtension(false);
        }
    };

    const rechazarExtension = async () => {
        if (!extensionPendiente) return;

        const comentarioLimpio =
            comentarioDecision.trim();

        if (!comentarioLimpio) {
            setError(
                'Debes ingresar el motivo del rechazo.'
            );
            setAccionConfirmacion(null);
            return;
        }

        try {
            setProcesandoExtension(true);
            setError('');
            setMensaje('');
            setErrorBoleta('');

            const response =
                await rechazarSolicitudExtensionGestion(
                    extensionPendiente.solicitud_extension_id,
                    comentarioLimpio
                );

            setMensaje(response.mensaje);
            setComentarioDecision('');
            setAccionConfirmacion(null);

            await cargarDetalle();
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'No se pudo rechazar la extensión.'
            );

            setError(mensajeError);
            setAccionConfirmacion(null);
        } finally {
            setProcesandoExtension(false);
        }
    };

    const puedeGenerarRecibo = () => {
        if (!reserva) return false;

        const estadosPermitidos = [
            'APROBADA',
            'ACTIVA',
            'FINALIZADA'
        ];

        return (
            estadosPermitidos.includes(
                reserva.estado_reserva
            ) && recibos.length === 0
        );
    };

    const abrirPreviewBoletaDigital = async () => {
        if (!reservaId) return;

        try {
            setCargandoPreviewRecibo(true);
            setError('');
            setMensaje('');
            setErrorBoleta('');

            const response =
                await previsualizarReciboReservaGestion(
                    reservaId
                );

            setPreviewRecibo({
                reserva: response.reserva,
                conceptos: response.conceptos,
                subtotal: response.subtotal,
                igv_total: response.igv_total,
                total: response.total,
                dias_reserva: response.dias_reserva,
                fecha_vencimiento:
                    response.fecha_vencimiento
            });

            setPreviewAbierto(true);
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'No se pudo generar la vista previa de la boleta.'
            );

            setPreviewAbierto(false);
            setPreviewRecibo(null);
            setErrorBoleta(mensajeError);
        } finally {
            setCargandoPreviewRecibo(false);
        }
    };

    const cerrarPreviewBoletaDigital = () => {
        if (procesandoRecibo) return;

        setPreviewAbierto(false);
        setPreviewRecibo(null);
        setErrorBoleta('');
    };

    const actualizarConceptoPreview = (
    conceptoCobroId: number,
    campo: 'cantidad' | 'precio_unitario',
    valor: string
) => {
    if (!previewRecibo) return;

    const valorNumerico = Number(valor);

    if (Number.isNaN(valorNumerico) || valorNumerico < 0) {
        return;
    }

    const conceptosActualizados =
        previewRecibo.conceptos.map((concepto) => {
            if (
                concepto.concepto_cobro_id !== conceptoCobroId ||
                !concepto.editable
            ) {
                return concepto;
            }

            const cantidad =
                campo === 'cantidad'
                    ? valorNumerico
                    : Number(concepto.cantidad || 0);

            const precioUnitario =
                campo === 'precio_unitario'
                    ? valorNumerico
                    : Number(concepto.precio_unitario || 0);

            const importe = Number(
                (cantidad * precioUnitario).toFixed(2)
            );

            const igv = concepto.aplica_igv
                ? Number((importe * 0.18).toFixed(2))
                : 0;

            const totalLinea = Number(
                (importe + igv).toFixed(2)
            );

            return {
                ...concepto,
                cantidad,
                precio_unitario: precioUnitario,
                importe,
                igv,
                total_linea: totalLinea
            };
        });

    const subtotal = Number(
        conceptosActualizados
            .reduce((total, concepto) => {
                return total + Number(concepto.importe || 0);
            }, 0)
            .toFixed(2)
    );

    const igvTotal = Number(
        conceptosActualizados
            .reduce((total, concepto) => {
                return total + Number(concepto.igv || 0);
            }, 0)
            .toFixed(2)
    );

    const total = Number((subtotal + igvTotal).toFixed(2));

    setPreviewRecibo({
        ...previewRecibo,
        conceptos: conceptosActualizados,
        subtotal,
        igv_total: igvTotal,
        total
    });
};
  const confirmarEmisionBoletaDigital = async () => {
    if (!reservaId || !previewRecibo) return;

    try {
        setProcesandoRecibo(true);
        setError('');
        setMensaje('');
        setErrorBoleta('');

        const conceptosEditados: ConceptoEditadoRecibo[] =
            previewRecibo.conceptos
                .filter((concepto) => concepto.editable)
                .map((concepto) => ({
                    concepto_cobro_id:
                        concepto.concepto_cobro_id,
                    cantidad: Number(concepto.cantidad || 0),
                    precio_unitario: Number(
                        concepto.precio_unitario || 0
                    )
                }));

        const response =
            await generarReciboReservaGestion(
                reservaId,
                'Boleta digital emitida luego de revisión de conceptos de cobro.',
                conceptosEditados
            );

        setMensaje(response.mensaje);
        setPreviewAbierto(false);
        setPreviewRecibo(null);
        setErrorBoleta('');

        await cargarDetalle();
    } catch (err) {
        const mensajeError = obtenerMensajeErrorApi(
            err,
            'No se pudo generar la boleta digital.'
        );

        setErrorBoleta(mensajeError);
    } finally {
        setProcesandoRecibo(false);
    }
};

    const descargarBoletaDigital = async (
        reciboId: number
    ) => {
        try {
            setDescargandoRecibo(true);
            setError('');
            setMensaje('');
            setErrorBoleta('');

            await descargarReciboPdf(reciboId);
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'No se pudo descargar la boleta digital.'
            );

            setError(mensajeError);
        } finally {
            setDescargandoRecibo(false);
        }
    };

    const verBoletaDigital = async (
        reciboId: number
    ) => {
        try {
            setDescargandoRecibo(true);
            setError('');
            setMensaje('');
            setErrorBoleta('');

            await verReciboPdf(reciboId);
        } catch (err) {
            const mensajeError = obtenerMensajeErrorApi(
                err,
                'No se pudo abrir la boleta digital.'
            );

            setError(mensajeError);
        } finally {
            setDescargandoRecibo(false);
        }
    };

    const irAGestionConceptosCobro = () => {
        setPreviewAbierto(false);
        setPreviewRecibo(null);
        cerrar();

        navigate('/gestion/conceptos-cobro');
    };

    const cerrar = () => {
        if (
            procesandoExtension ||
            procesandoRecibo ||
            descargandoRecibo ||
            cargandoPreviewRecibo
        ) return;

        setReserva(null);
        setEventos([]);
        setExtensionPendiente(null);
        setComentarioDecision('');
        setAccionConfirmacion(null);
        setRecibos([]);
        setPreviewRecibo(null);
        setPreviewAbierto(false);
        setError('');
        setMensaje('');
        setErrorBoleta('');

        onCerrar();
    };

    if (!abierto) return null;

    return (
        <>
            <div className="detalle-solicitud-overlay">
                <div className="detalle-solicitud-dialog">
                    <div className="detalle-solicitud-header">
                        <div>
                            <p className="detalle-solicitud-subtitle">
                                Historial de gestión
                            </p>

                            <h2>
                                Reserva #
                                {reserva?.reserva_id ||
                                    reservaId}
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="detalle-solicitud-close"
                            onClick={cerrar}
                            disabled={
                                procesandoExtension ||
                                procesandoRecibo ||
                                descargandoRecibo ||
                                cargandoPreviewRecibo
                            }
                        >
                            ×
                        </button>
                    </div>

                    {cargando && (
                        <div className="gestion-card gestion-empty-card">
                            Cargando historial...
                        </div>
                    )}

                    {error && (
                        <div className="gestion-alert gestion-alert-error">
                            {error}
                        </div>
                    )}

                    {mensaje && (
                        <div className="extension-alert extension-alert-success">
                            {mensaje}
                        </div>
                    )}

                    {!cargando && reserva && (
                        <section className="detalle-solicitud-card">
                            <h3>Resumen de la reserva</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Inmueble:</strong>{' '}
                                    {reserva.nombre_inmueble}
                                </p>

                                <p>
                                    <strong>Tipo:</strong>{' '}
                                    {reserva.tipo_inmueble}
                                </p>

                                <p>
                                    <strong>Estado:</strong>{' '}
                                    {reserva.estado_reserva}
                                </p>

                                <p>
                                    <strong>Código:</strong>{' '}
                                    {reserva.codigo_inmueble}
                                </p>

                                <p>
                                    <strong>Fecha inicial:</strong>{' '}
                                    {formatearFecha(
                                        reserva.fecha_inicio
                                    )}
                                </p>

                                <p>
                                    <strong>Fecha final:</strong>{' '}
                                    {formatearFecha(
                                        reserva.fecha_fin
                                    )}
                                </p>
                            </div>
                        </section>
                    )}

                    {!cargando && reserva && (
                        <section className="detalle-solicitud-card">
                            <div className="gestion-extension-header">
                                <div>
                                    <p className="detalle-solicitud-subtitle">
                                        Documento de cobro
                                    </p>

                                    <h3>Boleta digital</h3>
                                </div>

                                {recibos.length > 0 && (
                                    <span className="gestion-extension-badge">
                                        EMITIDA
                                    </span>
                                )}
                            </div>

                            {recibos.length === 0 ? (
                                <>
                                    <p>
                                        Esta reserva todavía no tiene una boleta
                                        digital generada.
                                    </p>

                                    <div className="gestion-extension-actions">
                                        <button
                                            type="button"
                                            className="extension-button-primary"
                                            onClick={abrirPreviewBoletaDigital}
                                            disabled={
                                                !puedeGenerarRecibo() ||
                                                procesandoRecibo ||
                                                procesandoExtension ||
                                                cargandoPreviewRecibo
                                            }
                                        >
                                            {cargandoPreviewRecibo
                                                ? 'Cargando...'
                                                : 'Revisar boleta'}
                                        </button>
                                    </div>

                                    {errorBoleta && (
                                        <div className="recibo-error-box">
                                            <strong>
                                                No se puede generar la boleta
                                            </strong>

                                            <p>{errorBoleta}</p>
                                        </div>
                                    )}

                                    {!puedeGenerarRecibo() && (
                                        <small className="extension-character-count">
                                            Solo se puede generar boleta para
                                            reservas aprobadas, activas o
                                            finalizadas.
                                        </small>
                                    )}
                                </>
                            ) : (
                                <div className="detalle-solicitud-timeline">
                                    {recibos.map((recibo) => (
                                        <div
                                            key={recibo.recibo_id}
                                            className="detalle-solicitud-evento evento-nota"
                                        >
                                            <div className="detalle-solicitud-dot" />

                                            <div>
                                                <strong>
                                                    Boleta digital{' '}
                                                    {obtenerNumeroVisualRecibo(
                                                        recibo
                                                    )}
                                                </strong>

                                                <p>
                                                    Total:{' '}
                                                    {recibo.moneda === 'USD'
                                                        ? '$'
                                                        : 'S/'}{' '}
                                                    {Number(
                                                        recibo.total || 0
                                                    ).toFixed(2)}
                                                    {' · '}
                                                    Estado:{' '}
                                                    {recibo.estado_recibo}
                                                </p>

                                                <small>
                                                    Periodo:{' '}
                                                    {recibo.periodo_mes}/
                                                    {recibo.periodo_anio}
                                                </small>

                                                <div className="gestion-extension-actions">
                                                    <button
                                                        type="button"
                                                        className="extension-button-secondary"
                                                        onClick={() =>
                                                            verBoletaDigital(
                                                                recibo.recibo_id
                                                            )
                                                        }
                                                        disabled={
                                                            descargandoRecibo ||
                                                            procesandoRecibo
                                                        }
                                                    >
                                                        Ver PDF
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="extension-button-primary"
                                                        onClick={() =>
                                                            descargarBoletaDigital(
                                                                recibo.recibo_id
                                                            )
                                                        }
                                                        disabled={
                                                            descargandoRecibo ||
                                                            procesandoRecibo
                                                        }
                                                    >
                                                        {descargandoRecibo
                                                            ? 'Descargando...'
                                                            : 'Descargar PDF'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {!cargando && extensionPendiente && (
                        <section className="detalle-solicitud-card gestion-extension-card">
                            <div className="gestion-extension-header">
                                <div>
                                    <p className="detalle-solicitud-subtitle">
                                        Acción pendiente
                                    </p>

                                    <h3>
                                        Solicitud de extensión
                                    </h3>
                                </div>

                                <span className="gestion-extension-badge">
                                    PENDIENTE
                                </span>
                            </div>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>
                                        Fecha final actual:
                                    </strong>{' '}
                                    {formatearFecha(
                                        extensionPendiente
                                            .fecha_fin_actual
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Nueva fecha solicitada:
                                    </strong>{' '}
                                    {formatearFecha(
                                        extensionPendiente
                                            .nueva_fecha_fin
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Fecha de solicitud:
                                    </strong>{' '}
                                    {formatearFechaHora(
                                        extensionPendiente
                                            .fecha_solicitud
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Solicitante:
                                    </strong>{' '}
                                    {extensionPendiente
                                        .nombres_inquilino ||
                                        'Inquilino'}{' '}
                                    {extensionPendiente
                                        .apellidos_inquilino ||
                                        ''}
                                </p>
                            </div>

                            <div className="gestion-extension-motivo">
                                <strong>
                                    Motivo de la extensión
                                </strong>

                                <p>
                                    {extensionPendiente.motivo ||
                                        'El inquilino no indicó un motivo.'}
                                </p>
                            </div>

                            <div className="extension-form-group">
                                <label htmlFor="comentario_extension">
                                    Comentario de decisión
                                </label>

                                <textarea
                                    id="comentario_extension"
                                    rows={3}
                                    maxLength={500}
                                    value={comentarioDecision}
                                    onChange={(event) =>
                                        setComentarioDecision(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Escribe un comentario. Es obligatorio para rechazar."
                                    disabled={
                                        procesandoExtension
                                    }
                                />

                                <small className="extension-character-count">
                                    {comentarioDecision.length}
                                    /500
                                </small>
                            </div>

                            <div className="gestion-extension-actions">
                                <button
                                    type="button"
                                    className="gestion-extension-reject"
                                    onClick={solicitarConfirmacionRechazo}
                                    disabled={procesandoExtension}
                                >
                                    Rechazar extensión
                                </button>

                                <button
                                    type="button"
                                    className="extension-button-primary"
                                    onClick={solicitarConfirmacionAprobacion}
                                    disabled={procesandoExtension}
                                >
                                    Aprobar extensión
                                </button>
                            </div>
                        </section>
                    )}

                    {!cargando && !extensionPendiente && reserva && (
                        <div className="extension-alert extension-alert-success">
                            No existen solicitudes de extensión
                            pendientes para esta reserva.
                        </div>
                    )}

                    {!cargando && (
                        <section className="detalle-solicitud-card">
                            <h3>Eventos registrados</h3>

                            {eventos.length === 0 ? (
                                <p>
                                    No hay eventos registrados.
                                </p>
                            ) : (
                                <div className="detalle-solicitud-timeline">
                                    {eventos.map((evento) => (
                                        <div
                                            key={
                                                evento.reserva_evento_id
                                            }
                                            className={`detalle-solicitud-evento evento-${evento.tipo_evento.toLowerCase()}`}
                                        >
                                            <div className="detalle-solicitud-dot" />

                                            <div>
                                                <strong>
                                                    {textoEvento(
                                                        evento.tipo_evento,
                                                        evento.descripcion
                                                    )}
                                                </strong>

                                                <p>
                                                    {evento.descripcion ||
                                                        'Evento registrado.'}
                                                </p>

                                                <small>
                                                    {formatearFechaHora(
                                                        evento.fecha_evento
                                                    )}
                                                </small>

                                                {(evento.nombres_usuario ||
                                                    evento.correo_usuario) && (
                                                    <small>
                                                        Registrado por:{' '}
                                                        {evento.nombres_usuario ||
                                                            'Usuario'}{' '}
                                                        {evento.apellidos_usuario ||
                                                            ''}
                                                        {evento.correo_usuario
                                                            ? ` (${evento.correo_usuario})`
                                                            : ''}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {previewAbierto && previewRecibo && (
                <div className="recibo-preview-overlay">
                    <div className="recibo-preview-modal">
                        <div className="recibo-preview-header">
                            <div>
                                <p className="detalle-solicitud-subtitle">
                                    Revisión previa
                                </p>

                                <h3>Boleta digital</h3>
                            </div>

                            <button
                                type="button"
                                className="detalle-solicitud-close"
                                onClick={cerrarPreviewBoletaDigital}
                                disabled={procesandoRecibo}
                            >
                                ×
                            </button>
                        </div>

                        <div className="recibo-preview-info">
                            <p>
                                Antes de emitir la boleta, revisa los conceptos
                                de cobro que se aplicarán a esta reserva. Estos
                                conceptos se obtienen desde la configuración de
                                Conceptos de cobro.
                            </p>

                            <small>
                                Días de reserva:{' '}
                                {previewRecibo.dias_reserva}
                                {' · '}
                                Vencimiento:{' '}
                                {new Date(
                                    previewRecibo.fecha_vencimiento
                                ).toLocaleDateString('es-PE')}
                            </small>
                        </div>

                        {errorBoleta && (
                            <div className="recibo-error-box">
                                <strong>
                                    No se pudo emitir la boleta
                                </strong>

                                <p>{errorBoleta}</p>
                            </div>
                        )}

                        <div className="recibo-preview-table-wrapper">
                            <table className="recibo-preview-table">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Cant.</th>
                                        <th>Precio unit.</th>
                                        <th>Subtotal</th>
                                        <th>IGV</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {previewRecibo.conceptos.map(
                                        (concepto) => (
                                            <tr
                                                key={
                                                    concepto.concepto_cobro_id
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {concepto.descripcion}
                                                    </strong>

                                                    <span>
                                                        {concepto.codigo}
                                                        {concepto.obligatorio
                                                            ? ' · Obligatorio'
                                                            : ' · Concepto adicional'}
                                                    </span>
                                                </td>

                                                <td>
                                        {concepto.editable ? (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={concepto.cantidad}
                                                onChange={(event) =>
                                                    actualizarConceptoPreview(
                                                        concepto.concepto_cobro_id,
                                                        'cantidad',
                                                        event.target.value
                                                    )
                                                }
                                                disabled={procesandoRecibo}
                                                className="recibo-preview-input"
                                            />
                                        ) : (
                                            Number(concepto.cantidad).toFixed(2)
                                        )}
                                    </td>

                                    <td>
                                        {concepto.editable ? (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={concepto.precio_unitario}
                                                onChange={(event) =>
                                                    actualizarConceptoPreview(
                                                        concepto.concepto_cobro_id,
                                                        'precio_unitario',
                                                        event.target.value
                                                    )
                                                }
                                                disabled={procesandoRecibo}
                                                className="recibo-preview-input"
                                            />
                                        ) : (
                                            <>S/ {Number(concepto.precio_unitario).toFixed(2)}</>
                                        )}
                                    </td>

                                    <td>
                                        S/{' '}
                                        {Number(
                                            concepto.importe
                                        ).toFixed(2)}
                                    </td>

                                                <td>
                                                    S/{' '}
                                                    {Number(
                                                        concepto.igv
                                                    ).toFixed(2)}
                                                </td>

                                                <td>
                                                    <strong>
                                                        S/{' '}
                                                        {Number(
                                                            concepto.total_linea
                                                        ).toFixed(2)}
                                                    </strong>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="recibo-preview-note">
                            <strong>Nota:</strong> La renta de reserva es
                            obligatoria y se calcula desde la reserva. Los
                            conceptos adicionales se toman desde la configuración
                            activa de Conceptos de cobro.
                        </div>

                        <div className="recibo-preview-summary">
                            <div>
                                <span>Subtotal</span>

                                <strong>
                                    S/{' '}
                                    {Number(
                                        previewRecibo.subtotal
                                    ).toFixed(2)}
                                </strong>
                            </div>

                            <div>
                                <span>IGV 18%</span>

                                <strong>
                                    S/{' '}
                                    {Number(
                                        previewRecibo.igv_total
                                    ).toFixed(2)}
                                </strong>
                            </div>

                            <div className="recibo-preview-total">
                                <span>Total</span>

                                <strong>
                                    S/{' '}
                                    {Number(
                                        previewRecibo.total
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        </div>

                        <div className="recibo-preview-actions">
                            <button
                                type="button"
                                className="recibo-preview-button-secondary"
                                onClick={cerrarPreviewBoletaDigital}
                                disabled={procesandoRecibo}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="recibo-preview-button-secondary"
                                onClick={irAGestionConceptosCobro}
                                disabled={procesandoRecibo}
                            >
                                Gestionar conceptos
                            </button>

                            <button
                                type="button"
                                className="recibo-preview-button-primary"
                                onClick={confirmarEmisionBoletaDigital}
                                disabled={procesandoRecibo}
                            >
                                {procesandoRecibo
                                    ? 'Emitiendo...'
                                    : 'Confirmar emisión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                abierto={accionConfirmacion !== null}
                titulo={
                    accionConfirmacion === 'aprobar'
                        ? 'Aprobar extensión'
                        : 'Rechazar extensión'
                }
                descripcion={
                    accionConfirmacion === 'aprobar'
                        ? `¿Confirmas que deseas extender la reserva hasta el ${
                            extensionPendiente
                                ? formatearFecha(
                                    extensionPendiente.nueva_fecha_fin
                                )
                                : ''
                        }?`
                        : '¿Confirmas que deseas rechazar esta solicitud de extensión?'
                }
                textoConfirmar={
                    accionConfirmacion === 'aprobar'
                        ? 'Aprobar extensión'
                        : 'Rechazar extensión'
                }
                textoCancelar="Cancelar"
                tipo={
                    accionConfirmacion === 'aprobar'
                        ? 'success'
                        : 'danger'
                }
                cargando={procesandoExtension}
                onConfirmar={
                    accionConfirmacion === 'aprobar'
                        ? aprobarExtension
                        : rechazarExtension
                }
                onCerrar={() => {
                    if (!procesandoExtension) {
                        setAccionConfirmacion(null);
                    }
                }}
            />
        </>
    );
}

export default DetalleGestionReservaDialog;