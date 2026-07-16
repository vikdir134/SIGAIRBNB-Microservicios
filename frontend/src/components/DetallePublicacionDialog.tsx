import type {
    PublicacionDetalle,
    PublicacionListado,
    FotoPublicacion
} from '../services/publicacionService';

interface DetallePublicacionDialogProps {
    detalle: PublicacionDetalle | null;
    fotos: FotoPublicacion[];
    cargando: boolean;
    onCerrar: () => void;
    onReservar: (publicacion: PublicacionDetalle | PublicacionListado) => void;
}

function DetallePublicacionDialog({
    detalle,
    fotos,
    cargando,
    onCerrar,
    onReservar
}: DetallePublicacionDialogProps) {
    if (!detalle) {
        return null;
    }

    const obtenerImagen = (url: string | null) => {
        return url || '/images/local-jesus-maria.jpg';
    };

    const obtenerUbicacion = (publicacion: PublicacionDetalle) => {
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
        <div className="modal-overlay">
            <div className="modal-card modal-card-publicacion">
                <h2>{detalle.titulo}</h2>

                {cargando ? (
                    <p>Cargando detalle...</p>
                ) : (
                    <>
                        <div className="detalle-publicacion-imagen">
                            <img
                                src={obtenerImagen(
                                    fotos[0]?.url_foto || detalle.foto_principal
                                )}
                                alt={detalle.titulo}
                            />
                        </div>

                        <p>
                            {detalle.descripcion_larga ||
                                detalle.descripcion_corta ||
                                'Sin descripción detallada.'}
                        </p>

                        <div className="detalle-datos-publicacion">
                            <p>
                                <strong>Tipo:</strong> {detalle.tipo_inmueble}
                            </p>

                            <p>
                                <strong>Ubicación:</strong> {obtenerUbicacion(detalle)}
                            </p>

                            <p>
                                <strong>Dirección:</strong>{' '}
                                {detalle.direccion_linea1} {detalle.numero || ''}
                            </p>

                            <p>
                                <strong>Precio:</strong>{' '}
                                {formatearPrecio(
                                    detalle.precio_publicado_mensual,
                                    detalle.moneda
                                )}{' '}
                                / mes
                            </p>

                            {detalle.area_m2 !== null && (
                                <p>
                                    <strong>Área:</strong> {detalle.area_m2} m²
                                </p>
                            )}

                            {detalle.capacidad_personas !== null && (
                                <p>
                                    <strong>Capacidad:</strong>{' '}
                                    {detalle.capacidad_personas} personas
                                </p>
                            )}

                            {detalle.num_habitaciones !== null && (
                                <p>
                                    <strong>Habitaciones:</strong>{' '}
                                    {detalle.num_habitaciones}
                                </p>
                            )}

                            {detalle.num_banos !== null && (
                                <p>
                                    <strong>Baños:</strong>{' '}
                                    {detalle.num_banos}
                                </p>
                            )}

                            {detalle.condiciones_arrendamiento && (
                                <p>
                                    <strong>Condiciones:</strong>{' '}
                                    {detalle.condiciones_arrendamiento}
                                </p>
                            )}
                        </div>

                        <div className="property-actions">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={onCerrar}
                            >
                                Cerrar
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => onReservar(detalle)}
                            >
                                Reservar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DetallePublicacionDialog;