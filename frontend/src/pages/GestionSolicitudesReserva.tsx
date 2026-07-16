import { useEffect, useMemo, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';
import DetalleGestionReservaDialog from '../components/DetalleGestionReservaDialog';
import ConfirmDecisionReservaDialog from '../components/ConfirmDecisionReservaDialog';
import VettingInquilinoDialog from '../components/VettingInquilinoDialog';
import ConfirmOcupacionReservaDialog from '../components/ConfirmOcupacionReservaDialog';
import {
    listarSolicitudesGestion,
    aprobarSolicitudReservaGestion,
    rechazarSolicitudReservaGestion,
    obtenerResumenVettingGestion,
    confirmarCheckinReservaGestion,
    confirmarCheckoutReservaGestion,
    type SolicitudReservaGestion
} from '../services/reservaService';

interface JwtPayload {
    roles?: string[];
}
const SOLICITUDES_POR_PAGINA = 5;

const obtenerRolesDesdeToken = (): string[] => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            return [];
        }

        const partes = token.split('.');

        if (partes.length !== 3) {
            return [];
        }

        const payloadBase64 = partes[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const payloadConRelleno = payloadBase64.padEnd(
            Math.ceil(payloadBase64.length / 4) * 4,
            '='
        );

        const payload = JSON.parse(
            atob(payloadConRelleno)
        ) as JwtPayload;

        return Array.isArray(payload.roles)
            ? payload.roles
            : [];
    } catch (error) {
        console.error('No se pudieron leer los roles del token:', error);
        return [];
    }
};

function GestionSolicitudesReserva() {
    const [solicitudes, setSolicitudes] = useState<SolicitudReservaGestion[]>([]);
    const [resumenVetting, setResumenVetting] = useState<{
        total_solicitudes: number;
        pendientes_vetting: number;
        vetting_aprobado: number;
        vetting_observado: number;
        vetting_rechazado: number;
        puede_aprobar: number;
        no_puede_aprobar: number;
        solicitudes_solicitadas: number;
        solicitudes_aprobadas: number;
        solicitudes_rechazadas: number;
    } | null>(null);

    const rolesUsuario = obtenerRolesDesdeToken();

    const puedeControlarOcupacion = rolesUsuario.some((rol) =>
        ['SECRETARIO', 'ADMIN'].includes(rol)
    );

    const esAdmin = rolesUsuario.includes('ADMIN');
    
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [estadoFiltro, setEstadoFiltro] = useState(
        esAdmin ? 'SOLICITADA' : 'APROBADA'
    );
    const [estadoVettingFiltro, setEstadoVettingFiltro] = useState('TODOS');
    const [paginaActual, setPaginaActual] = useState(1);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [reservaDetalleId, setReservaDetalleId] = useState<number | null>(null);

    const [vettingAbierto, setVettingAbierto] = useState(false);
    const [reservaVettingId, setReservaVettingId] = useState<number | null>(null);

    const [decisionAbierta, setDecisionAbierta] = useState(false);
    const [tipoDecision, setTipoDecision] = useState<'APROBAR' | 'RECHAZAR'>('APROBAR');
    const [solicitudDecision, setSolicitudDecision] = useState<SolicitudReservaGestion | null>(null);

    const [ocupacionAbierta, setOcupacionAbierta] =
        useState(false);

    const [tipoOcupacion, setTipoOcupacion] =
        useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');

    const [solicitudOcupacion, setSolicitudOcupacion] =
        useState<SolicitudReservaGestion | null>(null);

    const cargarSolicitudes = async (
        limpiarMensaje = true,
        estadoActual = estadoFiltro
    ) => {
        try {
            setCargando(true);
            setError('');

            if (limpiarMensaje) {
                setMensaje('');
            }

            const estadoParaEnviar =
                estadoActual === 'TODAS' ? undefined : estadoActual;

            const estadoVettingParaEnviar =
                esAdmin && estadoVettingFiltro !== 'TODOS'
                    ? estadoVettingFiltro
                    : undefined;

            const response = await listarSolicitudesGestion(
                estadoParaEnviar,
                estadoVettingParaEnviar
            );

            const nuevasSolicitudes = response.solicitudes || [];

            setSolicitudes(nuevasSolicitudes);

            setPaginaActual((paginaPrevia) => {
                const totalPaginasNuevo = Math.max(
                    1,
                    Math.ceil(nuevasSolicitudes.length / SOLICITUDES_POR_PAGINA)
                );

                return Math.min(paginaPrevia, totalPaginasNuevo);
            });

                if (esAdmin) {
                    await cargarResumenVetting();
                } else {
                    setResumenVetting(null);
                }
        } catch (err) {
            const mensajeError =
                err instanceof Error
                    ? err.message
                    : 'Error al cargar las solicitudes de reserva.';

            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };

    const cargarResumenVetting = async () => {
        try {
            const response = await obtenerResumenVettingGestion();
            setResumenVetting(response.resumen);
        } catch (err) {
            console.error('Error al cargar resumen de vetting:', err);
        }
    };

    const abrirDialogAprobar = (solicitud: SolicitudReservaGestion) => {
        if (!solicitud.estado_vetting?.puede_aprobar) {
            setError('Primero debes registrar una evaluación de vetting con resultado APROBADO.');
            return;
        }

        setTipoDecision('APROBAR');
        setSolicitudDecision(solicitud);
        setDecisionAbierta(true);
    };

    const abrirDialogRechazar = (solicitud: SolicitudReservaGestion) => {
        setTipoDecision('RECHAZAR');
        setSolicitudDecision(solicitud);
        setDecisionAbierta(true);
    };

    const abrirDialogVetting = (solicitud: SolicitudReservaGestion) => {
        setReservaVettingId(solicitud.reserva_id);
        setVettingAbierto(true);
    };

    const aplicarFiltroRapidoVetting = (
        estadoVetting: 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO',
        estadoReserva: string = 'TODAS'
    ) => {
        setPaginaActual(1);
        setEstadoFiltro(estadoReserva);
        setEstadoVettingFiltro(estadoVetting);
    };

    const cerrarDialogDecision = () => {
        if (procesandoId !== null) return;

        setDecisionAbierta(false);
        setSolicitudDecision(null);
    };

    const confirmarDecisionReserva = async (data: {
        motivo_rechazo?: string;
        observacion_gestor?: string;
    }) => {
        if (!solicitudDecision) return;

        try {
            setProcesandoId(solicitudDecision.reserva_id);
            setError('');
            setMensaje('');

            if (tipoDecision === 'APROBAR') {
                const response = await aprobarSolicitudReservaGestion(
                    solicitudDecision.reserva_id,
                    {
                        observacion_gestor:
                            data.observacion_gestor ||
                            'Solicitud aprobada desde el panel de gestión.'
                    }
                );

                await cargarSolicitudes(false);
                setMensaje(response.mensaje || 'Solicitud aprobada correctamente.');
            }

            if (tipoDecision === 'RECHAZAR') {
                const response = await rechazarSolicitudReservaGestion(
                    solicitudDecision.reserva_id,
                    {
                        motivo_rechazo: data.motivo_rechazo || '',
                        observacion_gestor:
                            data.observacion_gestor ||
                            'Solicitud rechazada desde el panel de gestión.'
                    }
                );

                await cargarSolicitudes(false);
                setMensaje(response.mensaje || 'Solicitud rechazada correctamente.');
            }

            setDecisionAbierta(false);
            setSolicitudDecision(null);

        } catch (err) {
            const mensajeError =
                err instanceof Error
                    ? err.message
                    : 'Error al procesar la solicitud de reserva.';

            setError(mensajeError);
        } finally {
            setProcesandoId(null);
        }
    };

    const abrirDialogOcupacion = (
        solicitud: SolicitudReservaGestion,
        tipo: 'CHECKIN' | 'CHECKOUT'
    ) => {
        setTipoOcupacion(tipo);
        setSolicitudOcupacion(solicitud);
        setOcupacionAbierta(true);
        setMensaje('');
        setError('');
    };

    const cerrarDialogOcupacion = () => {
        if (procesandoId !== null) {
            return;
        }

        setOcupacionAbierta(false);
        setSolicitudOcupacion(null);
    };

    const confirmarOcupacionReserva = async () => {
        if (!solicitudOcupacion) {
            return;
        }

        try {
            setProcesandoId(solicitudOcupacion.reserva_id);
            setMensaje('');
            setError('');

            if (tipoOcupacion === 'CHECKIN') {
                const response =
                    await confirmarCheckinReservaGestion(
                        solicitudOcupacion.reserva_id
                    );

                setMensaje(
                    response.mensaje ||
                    'Check-in confirmado correctamente.'
                );
            } else {
                const response =
                    await confirmarCheckoutReservaGestion(
                        solicitudOcupacion.reserva_id
                    );

                setMensaje(
                    response.mensaje ||
                    'Check-out confirmado correctamente.'
                );
            }

            setOcupacionAbierta(false);
            setSolicitudOcupacion(null);

            await cargarSolicitudes(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `No se pudo confirmar el ${
                        tipoOcupacion === 'CHECKIN'
                            ? 'check-in'
                            : 'check-out'
                    }.`
            );
        } finally {
            setProcesandoId(null);
        }
    };

    useEffect(() => {
        setPaginaActual(1);
        cargarSolicitudes();
    }, [estadoFiltro, estadoVettingFiltro]);

    const formatearFecha = (fecha?: string | null) => {
        if (!fecha) return 'No especificada';

        const fechaSolo = fecha.slice(0, 10);
        const [anio, mes, dia] = fechaSolo.split('-');

        if (!anio || !mes || !dia) {
            return 'No especificada';
        }

        return `${dia}/${mes}/${anio}`;
    };

    const formatearFechaHora = (fecha?: string | null) => {
        if (!fecha) return 'Pendiente';

        const fechaDate = new Date(fecha);

        if (Number.isNaN(fechaDate.getTime())) {
            return 'No especificada';
        }

        return fechaDate.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const obtenerUrlFoto = (foto?: string | null) => {
        if (!foto) return '/images/local-jesus-maria.jpg';

        if (foto.startsWith('http')) {
            return foto;
        }

        return foto;
    };

    const obtenerTextoVetting = (solicitud: SolicitudReservaGestion) => {
        const estadoVetting = solicitud.estado_vetting;

        if (!estadoVetting) {
            return 'Sin información de vetting';
        }

        if (estadoVetting.requiere_evaluacion) {
            return 'Pendiente de vetting';
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

    const obtenerClaseVetting = (solicitud: SolicitudReservaGestion) => {
        const estadoVetting = solicitud.estado_vetting;

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
    
    const esReservaCancelada = (solicitud: SolicitudReservaGestion) => {
        return solicitud.estado_reserva === 'CANCELADA';
    };

    const totalSolicitudes = solicitudes.length;

    const totalPaginas = Math.max(
        1,
        Math.ceil(totalSolicitudes / SOLICITUDES_POR_PAGINA)
    );

    const indiceInicio = (paginaActual - 1) * SOLICITUDES_POR_PAGINA;

    const indiceFin = Math.min(
        indiceInicio + SOLICITUDES_POR_PAGINA,
        totalSolicitudes
    );

    const solicitudesPaginadas = useMemo(() => {
        return solicitudes.slice(indiceInicio, indiceFin);
    }, [solicitudes, indiceInicio, indiceFin]);

    const irPaginaAnterior = () => {
        setPaginaActual((pagina) => Math.max(1, pagina - 1));
    };

    const irPaginaSiguiente = () => {
        setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1));
    };

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <section className="gestion-header-card">
                    <div>
                        <p className="gestion-section-label">
                            {esAdmin
                                ? 'Gestión de solicitudes'
                                : 'Control de ocupación'}
                        </p>

                        <h1>
                            {esAdmin
                                ? 'Solicitudes de reserva'
                                : 'Reservas y ocupación'}
                        </h1>

                        <p>
                            {esAdmin
                                ? 'Revisa el vetting y decide si las solicitudes deben aprobarse o rechazarse.'
                                : 'Consulta las reservas aprobadas y activas para confirmar el check-in y check-out del inquilino.'}
                        </p>
                    </div>
            
                    <button
                        type="button"
                        className="gestion-refresh-btn"
                        onClick={() => cargarSolicitudes()}
                        disabled={cargando}
                    >
                        {cargando ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </section>

                <section className="gestion-filter-card">
                    <div>
                        <label htmlFor="estadoFiltro">Filtrar por estado</label>
                        <select
                            id="estadoFiltro"
                            value={estadoFiltro}
                            onChange={(e) => {
                                setPaginaActual(1);
                                setEstadoFiltro(e.target.value);
                            }}
                            disabled={cargando}
                        >
                            {esAdmin && (
                                <option value="SOLICITADA">
                                    Pendientes
                                </option>
                            )}

                            <option value="APROBADA">
                                Aprobadas
                            </option>

                            <option value="ACTIVA">
                                Activas / Ocupadas
                            </option>

                            <option value="FINALIZADA">
                                Finalizadas
                            </option>

                            {esAdmin && (
                                <>
                                    <option value="RECHAZADA">
                                        Rechazadas
                                    </option>

                                    <option value="CANCELADA">
                                        Canceladas
                                    </option>

                                    <option value="EXPIRADA">
                                        Expiradas
                                    </option>

                                    <option value="TODAS">
                                        Todas
                                    </option>
                                </>
                            )}
                        </select>
                    </div>

                    {esAdmin && (
                        <div>
                            <label htmlFor="estadoVettingFiltro">
                                Filtrar por vetting
                            </label>

                            <select
                                id="estadoVettingFiltro"
                                value={estadoVettingFiltro}
                                onChange={(e) => {
                                    setPaginaActual(1);
                                    setEstadoVettingFiltro(e.target.value);
                                }}
                                disabled={cargando}
                            >
                                <option value="TODOS">Todos</option>
                                <option value="PENDIENTE">
                                    Pendiente de vetting
                                </option>
                                <option value="APROBADO">
                                    Vetting aprobado
                                </option>
                                <option value="OBSERVADO">
                                    Vetting observado
                                </option>
                                <option value="RECHAZADO">
                                    Vetting rechazado
                                </option>
                            </select>
                        </div>
                    )}

                    <p>
                        Filtros activos:{' '}
                        <strong>
                            Estado reserva: {estadoFiltro === 'TODAS' ? 'Todas' : estadoFiltro}
                        </strong>
                        {' '}|{' '}
                        <strong>
                            Vetting: {estadoVettingFiltro === 'TODOS' ? 'Todos' : estadoVettingFiltro}
                        </strong>
                    </p>

                    <button
                        type="button"
                        className="gestion-btn-secondary"
                        onClick={() => {
                            setPaginaActual(1);
                            setEstadoFiltro(esAdmin ? 'SOLICITADA' : 'APROBADA');
                            setEstadoVettingFiltro('TODOS');
                        }}
                        disabled={cargando}
                    >
                        Limpiar filtros
                    </button>
                </section>

                {esAdmin && resumenVetting && (
                    <section className="gestion-vetting-summary">
                        <button
                            type="button"
                            className="gestion-vetting-summary-card"
                            onClick={() => aplicarFiltroRapidoVetting('TODOS', 'TODAS')}
                        >
                            <span>Total solicitudes</span>
                            <strong>{resumenVetting.total_solicitudes}</strong>
                        </button>

                        <button
                            type="button"
                            className="gestion-vetting-summary-card resumen-pendiente"
                            onClick={() => aplicarFiltroRapidoVetting('PENDIENTE', 'SOLICITADA')}
                        >
                            <span>Pendientes de vetting</span>
                            <strong>{resumenVetting.pendientes_vetting}</strong>
                        </button>

                        <button
                            type="button"
                            className="gestion-vetting-summary-card resumen-aprobado"
                            onClick={() => aplicarFiltroRapidoVetting('APROBADO', 'TODAS')}
                        >
                            <span>Vetting aprobado</span>
                            <strong>{resumenVetting.vetting_aprobado}</strong>
                        </button>

                        <button
                            type="button"
                            className="gestion-vetting-summary-card resumen-observado"
                            onClick={() => aplicarFiltroRapidoVetting('OBSERVADO', 'TODAS')}
                        >
                            <span>Observadas</span>
                            <strong>{resumenVetting.vetting_observado}</strong>
                        </button>

                        <button
                            type="button"
                            className="gestion-vetting-summary-card resumen-rechazado"
                            onClick={() => aplicarFiltroRapidoVetting('RECHAZADO', 'TODAS')}
                        >
                            <span>Rechazadas por vetting</span>
                            <strong>{resumenVetting.vetting_rechazado}</strong>
                        </button>

                        <button
                            type="button"
                            className="gestion-vetting-summary-card resumen-puede-aprobar"
                            onClick={() => aplicarFiltroRapidoVetting('APROBADO', 'SOLICITADA')}
                        >
                            <span>Listas para aprobar</span>
                            <strong>{resumenVetting.puede_aprobar}</strong>
                        </button>
                    </section>
                )}

                {error && (
                    <div className="gestion-alert gestion-alert-error">
                        {error}
                    </div>
                )}

                {mensaje && (
                    <div className="gestion-alert gestion-alert-success">
                        {mensaje}
                    </div>
                )}

                {cargando && (
                    <div className="gestion-card gestion-empty-card">
                        Cargando solicitudes pendientes...
                    </div>
                )}

                {!cargando && solicitudes.length === 0 && !error && (
                    <div className="gestion-card gestion-empty-card">
                        <h2>No hay solicitudes para los filtros seleccionados</h2>
                        <p>
                            No se encontraron solicitudes con estado{' '}
                            <strong>{estadoFiltro === 'TODAS' ? 'Todas' : estadoFiltro}</strong>{' '}
                            y vetting{' '}
                            <strong>{estadoVettingFiltro === 'TODOS' ? 'Todos' : estadoVettingFiltro}</strong>.
                        </p>

                        <button
                            type="button"
                            className="gestion-btn-secondary"
                            onClick={() => {
                                setPaginaActual(1);
                                setEstadoFiltro(esAdmin ? 'SOLICITADA' : 'APROBADA');
                                setEstadoVettingFiltro('TODOS');
                            }}
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {!cargando && solicitudes.length > 0 && (
                    <>
                        <div className="gestion-pagination-info">
                            Mostrando {indiceInicio + 1} - {indiceFin} de {totalSolicitudes} solicitudes
                        </div>

                        <section className="gestion-solicitudes-list">
                            {solicitudesPaginadas.map((solicitud) => (
                            <article
                                key={solicitud.reserva_id}
                                className="gestion-solicitud-card"
                            >
                                <div className="gestion-solicitud-img">
                                    <img
                                        src={obtenerUrlFoto(solicitud.foto_principal)}
                                        alt={solicitud.titulo_publicacion || 'Inmueble solicitado'}
                                    />
                                </div>

                                <div className="gestion-solicitud-content">
                                    <div className="gestion-solicitud-top">
                                        <div>
                                            <span
                                                className={`gestion-solicitud-status estado-${solicitud.estado_reserva.toLowerCase()}`}
                                            >
                                                {solicitud.estado_reserva === 'SOLICITADA'
                                                    ? 'Pendiente'
                                                    : solicitud.estado_reserva === 'APROBADA'
                                                        ? 'Aprobada'
                                                        : solicitud.estado_reserva === 'ACTIVA'
                                                            ? 'Ocupada'
                                                            : solicitud.estado_reserva === 'FINALIZADA'
                                                                ? 'Finalizada'
                                                                : solicitud.estado_reserva === 'RECHAZADA'
                                                                    ? 'Rechazada'
                                                                    : solicitud.estado_reserva === 'CANCELADA'
                                                                        ? 'Cancelada'
                                                                        : solicitud.estado_reserva === 'EXPIRADA'
                                                                            ? 'Expirada'
                                                                            : solicitud.estado_reserva}
                                            </span>

                                                 {!esReservaCancelada(solicitud) && (
                                            <span className={`gestion-vetting-status ${obtenerClaseVetting(solicitud)}`}>
                                                {obtenerTextoVetting(solicitud)}
                                            </span>
                                        )}
                                            <h2>
                                                {solicitud.titulo_publicacion ||
                                                    solicitud.nombre_inmueble}
                                            </h2>

                                            <p>
                                                {solicitud.distrito}, {solicitud.ciudad},{' '}
                                                {solicitud.departamento}
                                            </p>
                                        </div>

                                        <div className="gestion-solicitud-price">
                                            <strong>
                                                {solicitud.moneda}{' '}
                                                {solicitud.renta_pactada_mensual}
                                            </strong>
                                            <span>/ mes</span>
                                        </div>
                                    </div>

                                    <div className="gestion-solicitud-grid">
                                        <p>
                                            <strong>Inmueble:</strong>{' '}
                                            {solicitud.nombre_inmueble}
                                        </p>

                                        <p>
                                            <strong>Tipo:</strong>{' '}
                                            {solicitud.tipo_inmueble}
                                        </p>

                                        <p>
                                            <strong>Inicio:</strong>{' '}
                                            {formatearFecha(solicitud.fecha_inicio)}
                                        </p>

                                        <p>
                                            <strong>Fin:</strong>{' '}
                                            {formatearFecha(solicitud.fecha_fin)}
                                        </p>
                                    </div>

                                    {[
                                        'APROBADA',
                                        'ACTIVA',
                                        'FINALIZADA'
                                    ].includes(solicitud.estado_reserva) && (
                                        <div
                                            className={`gestion-solicitud-note ${
                                                solicitud.estado_reserva === 'ACTIVA'
                                                    ? 'gestion-solicitud-note-success'
                                                    : ''
                                            }`}
                                        >
                                            <strong>Control de ocupación</strong>

                                            <div className="gestion-solicitud-grid">
                                                <p>
                                                    <strong>Check-in confirmado:</strong>{' '}
                                                    {formatearFechaHora(solicitud.fecha_checkin)}
                                                </p>

                                                <p>
                                                    <strong>Check-out confirmado:</strong>{' '}
                                                    {formatearFechaHora(solicitud.fecha_checkout)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="gestion-prospecto-box">
                                        <h3>Datos del prospecto</h3>

                                        <div className="gestion-solicitud-grid">
                                            <p>
                                                <strong>Nombre:</strong>{' '}
                                                {solicitud.nombres_inquilino || 'No registrado'}{' '}
                                                {solicitud.apellidos_inquilino || ''}
                                            </p>

                                            <p>
                                                <strong>Correo:</strong>{' '}
                                                {solicitud.correo_inquilino}
                                            </p>

                                            <p>
                                                <strong>Teléfono:</strong>{' '}
                                                {solicitud.telefono_inquilino ||
                                                    'No registrado'}
                                            </p>

                                            <p>
                                                <strong>Documento:</strong>{' '}
                                                {solicitud.tipo_documento || 'No registrado'}{' '}
                                                {solicitud.numero_documento || ''}
                                            </p>

                                            <p>
                                                <strong>Ingreso referencial:</strong>{' '}
                                                {solicitud.ingreso_mensual_referencial
                                                    ? `PEN ${solicitud.ingreso_mensual_referencial}`
                                                    : 'No registrado'}
                                            </p>

                                            <p>
                                                <strong>Garantías:</strong>{' '}
                                                {solicitud.tiene_aval_bancario ||
                                                solicitud.tiene_contrato_trabajo ||
                                                solicitud.tiene_garante
                                                    ? 'Cuenta con información de respaldo'
                                                    : 'Sin información de respaldo'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {esAdmin && !esReservaCancelada(solicitud) && (
    <div className={`gestion-vetting-box ${obtenerClaseVetting(solicitud)}`}>
        <h3>Estado de vetting</h3>

                                            <p>
                                                <strong>Resultado:</strong>{' '}
                                                {solicitud.estado_vetting?.resultado || 'Pendiente de evaluación'}
                                            </p>

                                            <p>
                                                <strong>Score de riesgo:</strong>{' '}
                                                {solicitud.estado_vetting?.score_riesgo !== null &&
                                                solicitud.estado_vetting?.score_riesgo !== undefined
                                                    ? `${solicitud.estado_vetting.score_riesgo}/100`
                                                    : 'No registrado'}
                                            </p>

                                            <p>
                                                <strong>Mensaje:</strong>{' '}
                                                {solicitud.estado_vetting?.mensaje || 'Aún no se ha registrado evaluación.'}
                                            </p>

                                            {solicitud.estado_reserva === 'SOLICITADA' &&
                                                !solicitud.estado_vetting?.puede_aprobar && (
                                                    <p className="gestion-vetting-hint">
                                                        Para aprobar esta solicitud, primero registra una evaluación con resultado APROBADO.
                                                    </p>
                                                )}
                                        </div>
                                    )}

                                    {solicitud.observacion_inquilino && (
                                        <div className="gestion-solicitud-note">
                                            <strong>Observación del inquilino:</strong>
                                            <p>{solicitud.observacion_inquilino}</p>
                                        </div>
                                    )}

                                    {solicitud.estado_reserva === 'APROBADA' && solicitud.observacion_gestor && (
                                        <div className="gestion-solicitud-note gestion-solicitud-note-success">
                                            <strong>Observación del gestor:</strong>
                                            <p>{solicitud.observacion_gestor}</p>
                                        </div>
                                    )}

                                    {solicitud.estado_reserva === 'RECHAZADA' && (
                                        <div className="gestion-solicitud-note gestion-solicitud-note-error">
                                            <strong>Motivo del rechazo:</strong>
                                            <p>
                                                {solicitud.motivo_rechazo ||
                                                    'No se registró un motivo específico.'}
                                            </p>
                                        </div>
                                    )}
                                    <div className="gestion-solicitud-actions">
                                        <button
                                            type="button"
                                            className="gestion-btn-secondary"
                                            onClick={() => {
                                                setReservaDetalleId(solicitud.reserva_id);
                                                setDetalleAbierto(true);
                                            }}
                                        >
                                            Ver historial
                                        </button>

                                        {esAdmin && !esReservaCancelada(solicitud) && (
                                        <button
                                            type="button"
                                            className={
                                                solicitud.estado_vetting?.requiere_evaluacion
                                                    ? 'gestion-btn-warning'
                                                    : 'gestion-btn-secondary'
                                            }
                                            onClick={() => abrirDialogVetting(solicitud)}
                                        >
                                            {solicitud.estado_vetting?.requiere_evaluacion
                                                ? 'Evaluar inquilino'
                                                : 'Ver vetting'}
                                        </button>
                                    )}

                                        {esAdmin &&
                                            solicitud.estado_reserva === 'SOLICITADA' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="gestion-btn-secondary"
                                                    onClick={() => abrirDialogRechazar(solicitud)}
                                                    disabled={procesandoId === solicitud.reserva_id}
                                                >
                                                    {procesandoId === solicitud.reserva_id
                                                        ? 'Rechazando...'
                                                        : 'Rechazar'}
                                                </button>

                                                {solicitud.estado_vetting?.puede_aprobar ? (
                                                    <button
                                                        type="button"
                                                        className="gestion-btn-primary"
                                                        onClick={() => abrirDialogAprobar(solicitud)}
                                                        disabled={procesandoId === solicitud.reserva_id}
                                                    >
                                                        {procesandoId === solicitud.reserva_id
                                                            ? 'Aprobando...'
                                                            : 'Aprobar'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="gestion-btn-disabled"
                                                        disabled
                                                        title="Primero debes registrar una evaluación de vetting aprobada"
                                                    >
                                                        Aprobar bloqueado
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {puedeControlarOcupacion &&
                                            solicitud.estado_reserva === 'APROBADA' && (
                                                <button
                                                    type="button"
                                                    className="gestion-btn-checkin"
                                                    onClick={() =>
                                                        abrirDialogOcupacion(solicitud, 'CHECKIN')
                                                    }
                                                    disabled={procesandoId === solicitud.reserva_id}
                                                >
                                                    {procesandoId === solicitud.reserva_id
                                                        ? 'Confirmando check-in...'
                                                        : 'Confirmar check-in'}
                                                </button>
                                            )
                                        }

                                        {puedeControlarOcupacion &&
                                            solicitud.estado_reserva === 'ACTIVA' && (
                                                <button
                                                    type="button"
                                                    className="gestion-btn-checkout"
                                                    onClick={() =>
                                                        abrirDialogOcupacion(
                                                            solicitud,
                                                            'CHECKOUT'
                                                        )
                                                    }
                                                    disabled={procesandoId === solicitud.reserva_id}
                                                >
                                                    {procesandoId === solicitud.reserva_id
                                                        ? 'Confirmando check-out...'
                                                        : 'Confirmar check-out'}
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>
                            </article>
                            ))}
                        </section>

                        {totalPaginas > 1 && (
                            <div className="gestion-pagination">
                                <button
                                    type="button"
                                    className="gestion-btn-secondary"
                                    onClick={irPaginaAnterior}
                                    disabled={paginaActual === 1}
                                >
                                    Anterior
                                </button>

                                <span>
                                    Página {paginaActual} de {totalPaginas}
                                </span>

                                <button
                                    type="button"
                                    className="gestion-btn-secondary"
                                    onClick={irPaginaSiguiente}
                                    disabled={paginaActual === totalPaginas}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <DetalleGestionReservaDialog
                abierto={detalleAbierto}
                reservaId={reservaDetalleId}
                onCerrar={() => {
                    setDetalleAbierto(false);
                    setReservaDetalleId(null);
                }}
            />

            {esAdmin && (
                <VettingInquilinoDialog
                    abierto={vettingAbierto}
                    reservaId={reservaVettingId}
                    onCerrar={() => {
                        setVettingAbierto(false);
                        setReservaVettingId(null);
                    }}
                    onEvaluacionRegistrada={async () => {
                        await cargarSolicitudes(false);
                        await cargarResumenVetting();
                    }}
                />
            )}

            {esAdmin && (
                <ConfirmDecisionReservaDialog
                    abierto={decisionAbierta}
                    tipo={tipoDecision}
                    solicitud={solicitudDecision}
                    cargando={procesandoId !== null}
                    onCerrar={cerrarDialogDecision}
                    onConfirmar={confirmarDecisionReserva}
                />
            )}

            <ConfirmOcupacionReservaDialog
                abierto={ocupacionAbierta}
                tipo={tipoOcupacion}
                solicitud={solicitudOcupacion}
                procesando={
                    solicitudOcupacion !== null &&
                    procesandoId === solicitudOcupacion.reserva_id
                }
                onCerrar={cerrarDialogOcupacion}
                onConfirmar={confirmarOcupacionReserva}
            />

        </div>
    );
}

export default GestionSolicitudesReserva;