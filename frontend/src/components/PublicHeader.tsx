import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificacionesCampana from './NotificacionesCampana';

interface PublicHeaderProps {
    mostrarFiltros?: boolean;
    onAbrirFiltros?: () => void;
}

function PublicHeader({
    mostrarFiltros = false,
    onAbrirFiltros
}: PublicHeaderProps) {
    const navigate = useNavigate();

    const [usuarioSesion, setUsuarioSesion] = useState<any>(null);
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');

        if (usuarioGuardado) {
            try {
                const usuario = JSON.parse(usuarioGuardado);
                setUsuarioSesion(usuario);
            } catch (error) {
                console.error('No se pudo leer el usuario del localStorage:', error);
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        setUsuarioSesion(null);
        setMenuAbierto(false);

        navigate('/');
    };

    const obtenerInicial = () => {
        if (!usuarioSesion?.correo) {
            return 'U';
        }

        return usuarioSesion.correo.charAt(0).toUpperCase();
    };

    const roles: string[] = Array.isArray(usuarioSesion?.roles)
        ? usuarioSesion.roles
        : [];

    const esCliente = roles.includes('CLIENTE');
    const esSecretario = roles.includes('SECRETARIO');
    const esAdmin = roles.includes('ADMIN');

    const puedeEntrarGestion = esAdmin || esSecretario;

    const textoRol = esAdmin
        ? 'Administrador'
        : esSecretario
            ? 'Secretario'
            : esCliente
                ? 'Cliente'
                : 'Usuario';

    return (
        <header className="main-header">
            <div className="logo-section">
                <Link to="/">
                    <span className="logo-text">
                        Stay<span className="logo-dot-pe">.pe</span>
                    </span>
                </Link>
            </div>

            <nav className="main-nav">
                <a href="#buscar">Buscar</a>
                <a href="#categorias">Categorías</a>
                <a href="#destacados">Inmuebles</a>
                <a href="#propietarios">Propietarios</a>
            </nav>

            <div className="header-actions">
                {mostrarFiltros && (
                    <button
                        type="button"
                        className="btn btn-light header-filter-button"
                        onClick={onAbrirFiltros}
                    >
                        Filtros
                    </button>
                )}

                {(!usuarioSesion || esAdmin) && (
                    <Link
                        to={esAdmin ? '/GestionEdificio' : '/Login'}
                        className="btn btn-light"
                    >
                        Publica tu inmueble
                    </Link>
                )}

                {!usuarioSesion && (
                    <>
                        <Link to="/Registro" className="btn btn-light">
                            Crear cuenta
                        </Link>

                        <Link to="/Login" className="btn btn-primary">
                            Iniciar sesión
                        </Link>
                    </>
                )}

                {usuarioSesion && (
                    <NotificacionesCampana />
                )}

                {usuarioSesion && (
                    <div className="user-menu-wrapper">
                        <button
                            type="button"
                            className="user-menu-button"
                            onClick={() => setMenuAbierto(!menuAbierto)}
                        >
                            <span className="user-avatar-small">
                                {obtenerInicial()}
                            </span>

                            <span className="user-menu-name">
                                Mi cuenta
                            </span>
                        </button>

                        {menuAbierto && (
                            <div className="user-dropdown">
                                <div className="user-dropdown-header">
                                    <div className="user-avatar-large">
                                        {obtenerInicial()}
                                    </div>

                                    <div>
                                        <strong>{usuarioSesion.correo}</strong>
                                        <p>{textoRol}</p>
                                    </div>
                                </div>

                                <div className="user-dropdown-divider" />

                                <button
                                    type="button"
                                    className="user-dropdown-item"
                                    onClick={() => {
                                        setMenuAbierto(false);
                                        navigate('/Perfil');
                                    }}
                                >
                                    Mi perfil público
                                </button>

                                {esCliente && (
                                    <>
                                        <button
                                            type="button"
                                            className="user-dropdown-item"
                                            onClick={() => {
                                                setMenuAbierto(false);
                                                navigate('/MisSolicitudesReserva');
                                            }}
                                        >
                                            Mis reservas
                                        </button>

                                        <button
                                            type="button"
                                            className="user-dropdown-item"
                                            onClick={() => {
                                                setMenuAbierto(false);
                                                navigate('/MisPagos');
                                            }}
                                        >
                                            Mis pagos
                                        </button>
                                    </>
                                )}

                                {puedeEntrarGestion && (
                                    <button
                                        type="button"
                                        className="user-dropdown-item"
                                        onClick={() => {
                                            setMenuAbierto(false);

                                            navigate(
                                                esAdmin
                                                    ? '/GestionReportes'
                                                    : '/GestionSolicitudesReserva'
                                            );
                                        }}
                                    >
                                        {esAdmin
                                            ? 'Panel de gestión'
                                            : 'Control de ocupación'}
                                    </button>
                                )}

                                {esAdmin && (
                                    <button
                                        type="button"
                                        className="user-dropdown-item"
                                        onClick={() => {
                                            setMenuAbierto(false);
                                            navigate('/GestionAdmin');
                                        }}
                                    >
                                        Mantenimiento Admin
                                    </button>
                                )}

                                <div className="user-dropdown-divider" />

                                <button
                                    type="button"
                                    className="user-dropdown-item logout-item"
                                    onClick={cerrarSesion}
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default PublicHeader;