import { useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import apiClient from '../services/apiClient';
import '../NotificacionesCampana.css';

interface Notificacion {
    notificacion_id: number;
    empresa_id: number;
    usuario_origen_id: number | null;
    usuario_destino_id: number;
    tipo_notificacion: string;
    titulo: string;
    mensaje: string;
    referencia_tipo: string | null;
    referencia_id: number | null;
    leida: boolean;
    fecha_creacion: string;
    fecha_lectura: string | null;
    activo: boolean;
}

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface ContadorNotificacionesResponse {
    total_no_leidas?: number;
}

interface ListarNotificacionesResponse {
    notificaciones?: Notificacion[];
}

const obtenerMensajeError = (
    error: unknown,
    mensajeDefault: string
): string => {
    const axiosError = error as AxiosError<ErrorBackend>;

    return (
        axiosError.response?.data?.mensaje ||
        axiosError.response?.data?.error ||
        mensajeDefault
    );
};

function NotificacionesCampana() {
    const [abierto, setAbierto] = useState(false);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [totalNoLeidas, setTotalNoLeidas] = useState(0);
    const [cargando, setCargando] = useState(false);
    const contenedorRef = useRef<HTMLDivElement | null>(null);

    const haySesionActiva = () => {
        return Boolean(localStorage.getItem('token'));
    };

    const cargarContador = async () => {
        if (!haySesionActiva()) return;

        try {
            const response = await apiClient.get<ContadorNotificacionesResponse>(
                '/notificaciones/contador/no-leidas'
            );

            setTotalNoLeidas(response.data.total_no_leidas || 0);
        } catch (error) {
            console.error(
                obtenerMensajeError(
                    error,
                    'Error al cargar contador de notificaciones'
                )
            );
        }
    };

    const cargarNotificaciones = async () => {
        if (!haySesionActiva()) return;

        try {
            setCargando(true);

            const response = await apiClient.get<ListarNotificacionesResponse>(
                '/notificaciones',
                {
                    params: {
                        limite: 8
                    }
                }
            );

            setNotificaciones(response.data.notificaciones || []);
        } catch (error) {
            console.error(
                obtenerMensajeError(
                    error,
                    'Error al cargar notificaciones'
                )
            );
        } finally {
            setCargando(false);
        }
    };

    const abrirCampana = async () => {
        const nuevoEstado = !abierto;
        setAbierto(nuevoEstado);

        if (nuevoEstado) {
            await cargarNotificaciones();
            await cargarContador();
        }
    };

    const marcarComoLeida = async (notificacion_id: number) => {
        if (!haySesionActiva()) return;

        try {
            await apiClient.patch(
                `/notificaciones/${notificacion_id}/leer`
            );

            setNotificaciones((prev) =>
                prev.map((notificacion) =>
                    notificacion.notificacion_id === notificacion_id
                        ? {
                              ...notificacion,
                              leida: true,
                              fecha_lectura: new Date().toISOString()
                          }
                        : notificacion
                )
            );

            await cargarContador();
        } catch (error) {
            console.error(
                obtenerMensajeError(
                    error,
                    'Error al marcar notificación como leída'
                )
            );
        }
    };

    const marcarTodasComoLeidas = async () => {
        if (!haySesionActiva()) return;

        try {
            await apiClient.patch('/notificaciones/leer-todas');

            setNotificaciones((prev) =>
                prev.map((notificacion) => ({
                    ...notificacion,
                    leida: true,
                    fecha_lectura: new Date().toISOString()
                }))
            );

            setTotalNoLeidas(0);
        } catch (error) {
            console.error(
                obtenerMensajeError(
                    error,
                    'Error al marcar todas como leídas'
                )
            );
        }
    };

    const formatearFecha = (fecha: string) => {
        const fechaNotificacion = new Date(fecha);

        return fechaNotificacion.toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        cargarContador();

        const intervalo = setInterval(() => {
            cargarContador();
        }, 30000);

        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        const cerrarAlHacerClickFuera = (event: MouseEvent) => {
            if (
                contenedorRef.current &&
                !contenedorRef.current.contains(event.target as Node)
            ) {
                setAbierto(false);
            }
        };

        document.addEventListener('mousedown', cerrarAlHacerClickFuera);

        return () => {
            document.removeEventListener('mousedown', cerrarAlHacerClickFuera);
        };
    }, []);

    return (
        <div className="notificaciones-wrapper" ref={contenedorRef}>
            <button
                type="button"
                className="notificaciones-boton"
                onClick={abrirCampana}
                title="Notificaciones"
            >
                <span className="notificaciones-icono">🔔</span>

                {totalNoLeidas > 0 && (
                    <span className="notificaciones-badge">
                        {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="notificaciones-dropdown">
                    <div className="notificaciones-header">
                        <div>
                            <h3>Notificaciones</h3>
                            <p>{totalNoLeidas} sin leer</p>
                        </div>

                        {notificaciones.length > 0 && (
                            <button
                                type="button"
                                className="notificaciones-leer-todas"
                                onClick={marcarTodasComoLeidas}
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>

                    <div className="notificaciones-lista">
                        {cargando ? (
                            <div className="notificaciones-estado">
                                Cargando notificaciones...
                            </div>
                        ) : notificaciones.length === 0 ? (
                            <div className="notificaciones-vacia">
                                <span>🔕</span>
                                <p>No tienes notificaciones por ahora.</p>
                            </div>
                        ) : (
                            notificaciones.map((notificacion) => (
                                <button
                                    type="button"
                                    key={notificacion.notificacion_id}
                                    className={`notificacion-item ${
                                        !notificacion.leida ? 'no-leida' : ''
                                    }`}
                                    onClick={() =>
                                        marcarComoLeida(
                                            notificacion.notificacion_id
                                        )
                                    }
                                >
                                    <div className="notificacion-contenido">
                                        <div className="notificacion-titulo-linea">
                                            <h4>{notificacion.titulo}</h4>

                                            {!notificacion.leida && (
                                                <span className="notificacion-punto"></span>
                                            )}
                                        </div>

                                        <p>{notificacion.mensaje}</p>

                                        <span className="notificacion-fecha">
                                            {formatearFecha(
                                                notificacion.fecha_creacion
                                            )}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificacionesCampana;