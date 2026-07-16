import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import type { FiltrosPublicacion } from '../services/publicacionService';

function HomePage() {
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);

    const [filtros, setFiltros] = useState<FiltrosPublicacion>({
        ubicacion: '',
        tipo_inmueble: '',
        fecha_inicio: '',
        fecha_fin: '',
        precio_min: '',
        precio_max: '',
        capacidad_personas: ''
    });

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFiltros({
            ...filtros,
            [name]: value
        });
    };

    const construirRutaBusqueda = (filtrosBusqueda: FiltrosPublicacion) => {
        const params = new URLSearchParams();

        Object.entries(filtrosBusqueda).forEach(([clave, valor]) => {
            if (valor && String(valor).trim() !== '') {
                params.append(clave, String(valor).trim());
            }
        });

        const queryString = params.toString();

        return queryString ? `/Busqueda?${queryString}` : '/Busqueda';
    };

    const validarFiltros = () => {
        if (
            (filtros.fecha_inicio && !filtros.fecha_fin) ||
            (!filtros.fecha_inicio && filtros.fecha_fin)
        ) {
            setError('Para filtrar por disponibilidad debes ingresar fecha ingreso y fecha salida.');
            return false;
        }

        if (
            filtros.fecha_inicio &&
            filtros.fecha_fin &&
            filtros.fecha_fin < filtros.fecha_inicio
        ) {
            setError('La fecha salida no puede ser menor que la fecha ingreso.');
            return false;
        }

        return true;
    };

    const buscarConFiltros = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!validarFiltros()) return;

        navigate(construirRutaBusqueda(filtros));
    };

    const aplicarFiltrosModal = () => {
        setError('');

        if (!validarFiltros()) return;

        setModalFiltrosAbierto(false);
        navigate(construirRutaBusqueda(filtros));
    };

    const limpiarFiltros = () => {
        setFiltros({
            ubicacion: '',
            tipo_inmueble: '',
            fecha_inicio: '',
            fecha_fin: '',
            precio_min: '',
            precio_max: '',
            capacidad_personas: ''
        });

        setError('');
    };

    const irACategoria = (tipo: 'EDIFICIO' | 'PISO' | 'LOCAL' | '') => {
        const nuevosFiltros: FiltrosPublicacion = {
            ...filtros,
            tipo_inmueble: tipo
        };

        setFiltros(nuevosFiltros);
        navigate(construirRutaBusqueda(nuevosFiltros));
    };

    return (
        <>
            <PublicHeader />

            <main>
                <section className="hero hero-home-limpio">
                    <div className="container-home">
                        <h1>Encuentra el inmueble ideal para ti</h1>

                        <p className="hero-description">
                            Explora edificios, pisos y locales disponibles para alquilar.
                        </p>

                        {error && <div className="mensaje-error">{error}</div>}

                        <form className="search-bar search-bar-limpio" onSubmit={buscarConFiltros}>
                            <div className="search-item">
                                <label htmlFor="ubicacion">Dónde</label>
                                <input
                                    type="text"
                                    id="ubicacion"
                                    name="ubicacion"
                                    value={filtros.ubicacion}
                                    onChange={handleChange}
                                    placeholder="Distrito, ciudad o dirección"
                                />
                            </div>

                            <div className="search-item">
                                <label htmlFor="fecha_inicio">Fecha ingreso</label>
                                <input
                                    type="date"
                                    id="fecha_inicio"
                                    name="fecha_inicio"
                                    value={filtros.fecha_inicio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="search-item">
                                <label htmlFor="tipo_inmueble">Tipo</label>
                                <select
                                    id="tipo_inmueble"
                                    name="tipo_inmueble"
                                    value={filtros.tipo_inmueble}
                                    onChange={handleChange}
                                >
                                    <option value="">Todos</option>
                                    <option value="EDIFICIO">Edificio</option>
                                    <option value="PISO">Piso</option>
                                    <option value="LOCAL">Local</option>
                                </select>
                            </div>

                            <div className="search-button-box search-actions-home">
                                <button
                                    type="button"
                                    className="btn btn-light btn-filtros-home"
                                    onClick={() => setModalFiltrosAbierto(true)}
                                >
                                    Filtros
                                </button>

                                <button type="submit" className="btn btn-accent">
                                    Buscar
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="container-home section">
                    <h2>Explora por categoría</h2>

                    <p className="section-description">
                        Elige el tipo de inmueble que deseas revisar.
                    </p>

                    <div className="categories">
                        <button
                            type="button"
                            className="category-chip"
                            onClick={() => irACategoria('EDIFICIO')}
                        >
                            Edificios
                        </button>

                        <button
                            type="button"
                            className="category-chip"
                            onClick={() => irACategoria('PISO')}
                        >
                            Pisos
                        </button>

                        <button
                            type="button"
                            className="category-chip"
                            onClick={() => irACategoria('LOCAL')}
                        >
                            Locales
                        </button>

                        <button
                            type="button"
                            className="category-chip"
                            onClick={() => irACategoria('')}
                        >
                            Ver todos
                        </button>
                    </div>
                </section>

                <section className="container-home section">
                    <h2>Inmuebles destacados</h2>

                    <p className="section-description">
                        Busca publicaciones activas y revisa sus detalles antes de solicitar una reserva.
                    </p>

                    <div className="property-grid">
                        <article className="property-card">
                            <div className="property-image">
                                <img
                                    src="/images/local-jesus-maria.jpg"
                                    alt="Locales comerciales"
                                />
                            </div>

                            <div className="property-info">
                                <h3>Locales comerciales</h3>
                                <p>Espacios ideales para oficinas, tiendas o negocios.</p>
                                <p className="property-location">
                                    Busca por distrito, ciudad o dirección.
                                </p>

                                <div className="property-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => irACategoria('LOCAL')}
                                    >
                                        Ver locales
                                    </button>
                                </div>
                            </div>
                        </article>

                        <article className="property-card">
                            <div className="property-image">
                                <img
                                    src="/images/local-jesus-maria.jpg"
                                    alt="Pisos disponibles"
                                />
                            </div>

                            <div className="property-info">
                                <h3>Pisos disponibles</h3>
                                <p>Unidades dentro de edificios para alquiler mensual.</p>
                                <p className="property-location">
                                    Filtra por fechas, tipo y capacidad.
                                </p>

                                <div className="property-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => irACategoria('PISO')}
                                    >
                                        Ver pisos
                                    </button>
                                </div>
                            </div>
                        </article>

                        <article className="property-card">
                            <div className="property-image">
                                <img
                                    src="/images/local-jesus-maria.jpg"
                                    alt="Edificios completos"
                                />
                            </div>

                            <div className="property-info">
                                <h3>Edificios completos</h3>
                                <p>Inmuebles completos disponibles para operaciones más grandes.</p>
                                <p className="property-location">
                                    Explora publicaciones activas.
                                </p>

                                <div className="property-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => irACategoria('EDIFICIO')}
                                    >
                                        Ver edificios
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section className="container-home section host-section">
                    <div className="host-box">
                        <h2>¿Tienes un inmueble para alquilar?</h2>

                        <p>
                            Ingresa al panel de gestión para administrar tus edificios,
                            unidades, disponibilidad y publicaciones.
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate('/Login')}
                        >
                            Comenzar a publicar
                        </button>
                    </div>
                </section>
            </main>

            <footer className="main-footer">
                &copy; 2026 Stay.pe - Sistema Integral de Gestión de Inmuebles
            </footer>

            {modalFiltrosAbierto && (
                <div className="modal-filtros-overlay">
                    <div className="modal-filtros-card">
                        <div className="modal-filtros-header">
                            <h2>Filtros</h2>

                            <button
                                type="button"
                                onClick={() => setModalFiltrosAbierto(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-filtros-body">
                            <div className="filtro-modal-grupo">
                                <label htmlFor="fecha_fin_modal">Fecha salida</label>
                                <input
                                    type="date"
                                    id="fecha_fin_modal"
                                    name="fecha_fin"
                                    value={filtros.fecha_fin}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="filtro-modal-grupo">
                                <label htmlFor="capacidad_personas_modal">Capacidad de personas</label>
                                <input
                                    type="number"
                                    id="capacidad_personas_modal"
                                    name="capacidad_personas"
                                    value={filtros.capacidad_personas}
                                    onChange={handleChange}
                                    placeholder="Ej. 2"
                                    min="0"
                                />
                            </div>

                            <div className="filtro-modal-resumen">
                                <h3>Resumen de búsqueda</h3>

                                <p>
                                    <strong>Ubicación:</strong>{' '}
                                    {filtros.ubicacion || 'Cualquier ubicación'}
                                </p>

                                <p>
                                    <strong>Fecha ingreso:</strong>{' '}
                                    {filtros.fecha_inicio || 'Sin seleccionar'}
                                </p>

                                <p>
                                    <strong>Tipo:</strong>{' '}
                                    {filtros.tipo_inmueble || 'Todos'}
                                </p>
                            </div>
                        </div>

                        <div className="modal-filtros-actions">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={limpiarFiltros}
                            >
                                Limpiar filtros
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={aplicarFiltrosModal}
                            >
                                Aplicar filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default HomePage;