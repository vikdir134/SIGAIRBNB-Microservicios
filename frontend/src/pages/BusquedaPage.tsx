import { useEffect, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import FiltrosBusquedaDialog from '../components/FiltrosBusquedaDialog';
import DetallePublicacionDialog from '../components/DetallePublicacionDialog';
import SolicitudReservaDialog from '../components/SolicitudReservaDialog';

import {
    listarPublicaciones,
    obtenerDetallePublicacion,
    type PublicacionListado,
    type PublicacionDetalle,
    type FotoPublicacion,
    type FiltrosPublicacion
} from '../services/publicacionService';

function BusquedaPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [publicaciones, setPublicaciones] = useState<PublicacionListado[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);

    const [detalle, setDetalle] = useState<PublicacionDetalle | null>(null);
    const [fotosDetalle, setFotosDetalle] = useState<FotoPublicacion[]>([]);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
    const [publicacionParaReserva, setPublicacionParaReserva] = useState<
        PublicacionListado | PublicacionDetalle | null
    >(null);

    const [filtros, setFiltros] = useState<FiltrosPublicacion>({
        ubicacion: searchParams.get('ubicacion') || '',
        tipo_inmueble: searchParams.get('tipo_inmueble') || '',
        fecha_inicio: searchParams.get('fecha_inicio') || '',
        fecha_fin: searchParams.get('fecha_fin') || '',
        precio_min: searchParams.get('precio_min') || '',
        precio_max: searchParams.get('precio_max') || '',
        capacidad_personas: searchParams.get('capacidad_personas') || ''
    });

    const cargarPublicaciones = async (filtrosBusqueda: FiltrosPublicacion) => {
        try {
            setCargando(true);
            setError('');

            const data = await listarPublicaciones(filtrosBusqueda);
            setPublicaciones(data.publicaciones || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar publicaciones');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPublicaciones(filtros);
    }, []);

    const handleChangeFiltros = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFiltros({
            ...filtros,
            [name]: value
        });
    };

    const validarFiltros = () => {
        if (
            (filtros.fecha_inicio && !filtros.fecha_fin) ||
            (!filtros.fecha_inicio && filtros.fecha_fin)
        ) {
            setError('Para filtrar por fechas debes ingresar fecha inicio y fecha fin.');
            return false;
        }

        if (
            filtros.fecha_inicio &&
            filtros.fecha_fin &&
            filtros.fecha_fin < filtros.fecha_inicio
        ) {
            setError('La fecha fin no puede ser menor que la fecha inicio.');
            return false;
        }

        if (
            filtros.precio_min &&
            filtros.precio_max &&
            Number(filtros.precio_max) < Number(filtros.precio_min)
        ) {
            setError('El precio máximo no puede ser menor que el precio mínimo.');
            return false;
        }

        return true;
    };

    const actualizarQueryParams = (filtrosBusqueda: FiltrosPublicacion) => {
        const params = new URLSearchParams();

        Object.entries(filtrosBusqueda).forEach(([clave, valor]) => {
            if (valor && String(valor).trim() !== '') {
                params.append(clave, String(valor).trim());
            }
        });

        setSearchParams(params);
    };

    const aplicarFiltros = async () => {
        setError('');

        if (!validarFiltros()) {
            return;
        }

        actualizarQueryParams(filtros);
        await cargarPublicaciones(filtros);
        setModalFiltrosAbierto(false);
    };

    const limpiarFiltros = async () => {
        const filtrosLimpios: FiltrosPublicacion = {
            ubicacion: '',
            tipo_inmueble: '',
            fecha_inicio: '',
            fecha_fin: '',
            precio_min: '',
            precio_max: '',
            capacidad_personas: ''
        };

        setFiltros(filtrosLimpios);
        setSearchParams({});
        setError('');

        await cargarPublicaciones(filtrosLimpios);
        setModalFiltrosAbierto(false);
    };

    const abrirDetalle = async (publicacionId: number) => {
        try {
            setCargandoDetalle(true);
            setError('');

            const data = await obtenerDetallePublicacion(publicacionId);

            setDetalle(data.publicacion);
            setFotosDetalle(data.fotos || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener detalle');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setDetalle(null);
        setFotosDetalle([]);
    };

    const reservar = (publicacion: PublicacionListado | PublicacionDetalle) => {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Debes iniciar sesión para enviar una solicitud de reserva.');
            navigate('/Login');
            return;
        }

        setPublicacionParaReserva(publicacion);
        setModalSolicitudAbierto(true);
    };

    const obtenerImagen = (url: string | null) => {
        return url || '/images/local-jesus-maria.jpg';
    };

    const obtenerUbicacion = (publicacion: PublicacionListado | PublicacionDetalle) => {
        const partes = [
            publicacion.distrito,
            publicacion.ciudad,
            publicacion.departamento
        ].filter(Boolean);

        return partes.length > 0 ? partes.join(', ') : 'Ubicación no especificada';
    };

    const formatearPrecio = (precio: number, moneda: string) => {
        return `${moneda} ${Number(precio).toFixed(2)}`;
    };

    return (
        <>
            <PublicHeader
                mostrarFiltros
                onAbrirFiltros={() => setModalFiltrosAbierto(true)}
            />

            <main className="busqueda-page" id="buscar">
                <section className="busqueda-topbar">
                    <div>
                        <h1>Resultados de búsqueda</h1>
                        <p>
                            Explora inmuebles publicados y disponibles para solicitar alquiler.
                        </p>
                    </div>

                    <span>{publicaciones.length} inmueble(s)</span>
                </section>

                {error && <div className="mensaje-error busqueda-alerta">{error}</div>}

                <section className="busqueda-layout busqueda-layout-sin-panel">
                    <div className="busqueda-resultados">
                        {cargando ? (
                            <p>Cargando inmuebles...</p>
                        ) : publicaciones.length === 0 ? (
                            <div className="sin-resultados">
                                <h2>No hay resultados</h2>
                                <p>Prueba cambiando los filtros de búsqueda.</p>
                            </div>
                        ) : (
                            <div className="property-grid busqueda-grid">
                                {publicaciones.map((publicacion) => (
                                    <article
                                        key={publicacion.publicacion_id}
                                        className="property-card"
                                    >
                                        <div className="property-image">
                                            <img
                                                src={obtenerImagen(publicacion.foto_principal)}
                                                alt={publicacion.titulo}
                                            />
                                        </div>

                                        <div className="property-info">
                                            <h3>{publicacion.titulo}</h3>

                                            <p className="property-location">
                                                {obtenerUbicacion(publicacion)}
                                            </p>

                                            <p>
                                                <strong>Tipo:</strong> {publicacion.tipo_inmueble}
                                            </p>

                                            <p>
                                                 <strong>Disponible desde:</strong>{' '}
                                            {publicacion.disponible_desde
                                                ? `${publicacion.disponible_desde.slice(8, 10)}/${publicacion.disponible_desde.slice(5, 7)}/${publicacion.disponible_desde.slice(0, 4)}`
                                                : 'No especificada'}
                                            </p>

                                            {publicacion.area_m2 !== null && (
                                                <p>
                                                    <strong>Área:</strong> {publicacion.area_m2} m²
                                                </p>
                                            )}

                                            {publicacion.capacidad_personas !== null && (
                                                <p>
                                                    <strong>Capacidad:</strong>{' '}
                                                    {publicacion.capacidad_personas} personas
                                                </p>
                                            )}

                                            <p className="property-price">
                                                {formatearPrecio(
                                                    publicacion.precio_publicado_mensual,
                                                    publicacion.moneda
                                                )}{' '}
                                                / mes
                                            </p>

                                            <div className="property-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-light"
                                                    onClick={() => abrirDetalle(publicacion.publicacion_id)}
                                                >
                                                    Ver detalle
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => reservar(publicacion)}
                                                >
                                                    Reservar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <FiltrosBusquedaDialog
                abierto={modalFiltrosAbierto}
                filtros={filtros}
                cargando={cargando}
                onCerrar={() => setModalFiltrosAbierto(false)}
                onChange={handleChangeFiltros}
                onAplicar={aplicarFiltros}
                onLimpiar={limpiarFiltros}
            />

            <DetallePublicacionDialog
                detalle={detalle}
                fotos={fotosDetalle}
                cargando={cargandoDetalle}
                onCerrar={cerrarDetalle}
                onReservar={reservar}
            />

            <SolicitudReservaDialog
                abierto={modalSolicitudAbierto}
                publicacion={
                    publicacionParaReserva
                        ? {
                            publicacion_id: publicacionParaReserva.publicacion_id,
                            titulo: publicacionParaReserva.titulo,
                            nombre_inmueble: publicacionParaReserva.nombre_inmueble,
                            tipo_inmueble: publicacionParaReserva.tipo_inmueble,
                            precio_publicado_mensual:
                                publicacionParaReserva.precio_publicado_mensual,
                            moneda: publicacionParaReserva.moneda,
                            disponible_desde: publicacionParaReserva.disponible_desde
                        }
                        : null
                }
                onCerrar={() => {
                    setModalSolicitudAbierto(false);
                    setPublicacionParaReserva(null);
                }}
                onSolicitudCreada={() => {
                    setModalSolicitudAbierto(false);
                    setPublicacionParaReserva(null);
                    navigate('/MisSolicitudesReserva');
                }}
            />
                    </>
    );
}

export default BusquedaPage;