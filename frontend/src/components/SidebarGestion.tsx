import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { obtenerPerfil } from '../services/perfilService';
import '../styles/SidebarGestion.css';

function SidebarGestion() {
    const navigate = useNavigate();

    const [nombreUsuario, setNombreUsuario] = useState('Usuario');
    const [iniciales, setIniciales] = useState('U');
    const [esAdmin, setEsAdmin] = useState(false);
    const [esSecretario, setEsSecretario] = useState(false);
    const [esCliente, setEsCliente] = useState(false);
    const [sidebarContraido, setSidebarContraido] = useState(false);

    const cargarRolesDesdeStorage = () => {
        const usuarioGuardado = localStorage.getItem('usuario');

        if (!usuarioGuardado) return;

        try {
            const usuario = JSON.parse(usuarioGuardado);

            const roles: string[] = Array.isArray(usuario.roles)
                ? usuario.roles
                : [];

            setEsCliente(roles.includes('CLIENTE'));
            setEsSecretario(roles.includes('SECRETARIO'));
            setEsAdmin(
                roles.includes('ADMIN') ||
                roles.includes('ADMIN_EMPRESA')
            );
        } catch (error) {
            console.error('No se pudo leer el usuario del localStorage:', error);
        }
    };

    const cargarDatosUsuario = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        cargarRolesDesdeStorage();

        try {
            const perfil = await obtenerPerfil();

            const nombres = perfil.nombres || '';
            const apellidos = perfil.apellidos || '';

            const nombreCompleto = `${nombres} ${apellidos}`.trim();

            if (nombreCompleto) {
                setNombreUsuario(nombreCompleto);
            }

            const inicialNombre = nombres.charAt(0).toUpperCase();
            const inicialApellido = apellidos.charAt(0).toUpperCase();

            const nuevasIniciales = `${inicialNombre}${inicialApellido}`.trim();

            setIniciales(nuevasIniciales || 'U');
        } catch (error) {
            console.error('No se pudo cargar el perfil en el sidebar:', error);
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/Login');
    };

    const cambiarEstadoSidebar = () => {
        setSidebarContraido((estadoActual) => !estadoActual);
    };

    useEffect(() => {
        cargarDatosUsuario();
    }, []);

    useEffect(() => {
        document.body.classList.add('gestion-con-sidebar');

        document.documentElement.style.setProperty(
            '--sidebar-current-width',
            sidebarContraido ? '88px' : '270px'
        );

        return () => {
            document.body.classList.remove('gestion-con-sidebar');
            document.documentElement.style.removeProperty('--sidebar-current-width');
        };
    }, [sidebarContraido]);

    return (
        <aside className={`gestion-sidebar ${sidebarContraido ? 'sidebar-collapsed' : ''}`}>
            <button
                type="button"
                className="sidebar-toggle"
                onClick={cambiarEstadoSidebar}
                aria-label={sidebarContraido ? 'Expandir sidebar' : 'Contraer sidebar'}
                title={sidebarContraido ? 'Expandir menú' : 'Contraer menú'}
            >
                {sidebarContraido ? '›' : '‹'}
            </button>

            <div className="gestion-sidebar-top">
                <p className="sidebar-title">PERFIL</p>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">{iniciales}</div>

                    <div className="sidebar-user-info">
                        <p className="sidebar-user-name">{nombreUsuario}</p>
                        <span className="sidebar-user-role">
                            {esAdmin
                                ? 'Administrador'
                                : esSecretario
                                    ? 'Secretario'
                                    : esCliente
                                        ? 'Cliente'
                                        : 'Usuario'}
                        </span>
                    </div>
                </div>

                <nav className="sidebar-menu">
                    <NavLink to="/" end title="Volver al inicio">
                        <span className="sidebar-link-icon">I</span>
                        <span className="sidebar-link-text">Volver al inicio</span>
                    </NavLink>

                    {esCliente && (
                        <>
                            <NavLink to="/Busqueda" title="Buscar inmuebles">
                                <span className="sidebar-link-icon">B</span>
                                <span className="sidebar-link-text">Buscar inmuebles</span>
                            </NavLink>

                            <NavLink to="/MisSolicitudesReserva" title="Mis solicitudes">
                                <span className="sidebar-link-icon">M</span>
                                <span className="sidebar-link-text">Mis solicitudes</span>
                            </NavLink>
                        </>
                    )}

                    {esAdmin && (
                        <>
                          

                            <NavLink to="/GestionEdificio" title="Registrar Edificio">
                                <span className="sidebar-link-icon">E</span>
                                <span className="sidebar-link-text">Registrar Edificio</span>
                            </NavLink>

                            <NavLink to="/GestionUnidad" title="Registrar Piso / Local">
                                <span className="sidebar-link-icon">U</span>
                                <span className="sidebar-link-text">Registrar Piso / Local</span>
                            </NavLink>

                            <NavLink to="/GestionMantenimiento" title="Mantenimiento">
                                <span className="sidebar-link-icon">M</span>
                                <span className="sidebar-link-text">Mantenimiento</span>
                            </NavLink>

                            <NavLink to="/GestionDisponibilidad" title="Disponibilidad">
                                <span className="sidebar-link-icon">D</span>
                                <span className="sidebar-link-text">Disponibilidad</span>
                            </NavLink>

                            <NavLink to="/GestionPublicacion" title="Publicar inmueble">
                                <span className="sidebar-link-icon">P</span>
                                <span className="sidebar-link-text">Publicar inmueble</span>
                            </NavLink>

                            <NavLink to="/GestionSolicitudesReserva" title="Solicitudes de reserva">
                                <span className="sidebar-link-icon">S</span>
                                <span className="sidebar-link-text">Solicitudes de reserva</span>
                            </NavLink>

                            <NavLink to="/gestion/conceptos-cobro" title="Conceptos de cobro">
                                <span className="sidebar-link-icon">C</span>
                                <span className="sidebar-link-text">Conceptos de cobro</span>
                            </NavLink>

                            <NavLink to="/gestion/ingresos-alquiler" title="Ingresos de alquiler">
                                <span className="sidebar-link-icon">I</span>
                                <span className="sidebar-link-text">Ingresos de alquiler</span>
                            </NavLink>

                            <NavLink to="/GestionTarifas" title="Tarifas / IPC">
                                <span className="sidebar-link-icon">T</span>
                                <span className="sidebar-link-text">Tarifas / IPC</span>
                            </NavLink>

                            <NavLink end to="/GestionReportes" title="Reportes financieros">
                                <span className="sidebar-link-icon">R</span>
                                <span className="sidebar-link-text">Reportes financieros</span>
                            </NavLink>

                            <NavLink to="/GestionReportes/PagosDeudores" title="Pagos y deudores">
                                <span className="sidebar-link-icon">D</span>
                                <span className="sidebar-link-text">Pagos y deudores</span>
                            </NavLink>

                            <NavLink to="/GestionAdmin" title="Mantenimiento Admin">
                                <span className="sidebar-link-icon">A</span>
                                <span className="sidebar-link-text">Mantenimiento Admin</span>
                            </NavLink>
                        </>
                    )}

                    {esSecretario && !esAdmin && (
                        <>
                            <NavLink to="/GestionSolicitudesReserva" title="Control de ocupación">
                                <span className="sidebar-link-icon">O</span>
                                <span className="sidebar-link-text">Control de ocupación</span>
                            </NavLink>

                            <NavLink to="/gestion/conceptos-cobro" title="Conceptos de cobro">
                                <span className="sidebar-link-icon">C</span>
                                <span className="sidebar-link-text">Conceptos de cobro</span>
                            </NavLink>

                            <NavLink to="/gestion/ingresos-alquiler" title="Ingresos de alquiler">
                                <span className="sidebar-link-icon">I</span>
                                <span className="sidebar-link-text">Ingresos de alquiler</span>
                            </NavLink>

                            <NavLink to="/GestionTarifas" title="Tarifas / IPC">
                                <span className="sidebar-link-icon">T</span>
                                <span className="sidebar-link-text">Tarifas / IPC</span>
                            </NavLink>

                            <NavLink end to="/GestionReportes" title="Reportes financieros">
                                <span className="sidebar-link-icon">R</span>
                                <span className="sidebar-link-text">Reportes financieros</span>
                            </NavLink>

                            <NavLink to="/GestionReportes/PagosDeudores" title="Pagos y deudores">
                                <span className="sidebar-link-icon">D</span>
                                <span className="sidebar-link-text">Pagos y deudores</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/GestionPerfil" title="Perfil">
                        <span className="sidebar-link-icon">P</span>
                        <span className="sidebar-link-text">Perfil</span>
                    </NavLink>
                </nav>
            </div>

            <button
                type="button"
                onClick={cerrarSesion}
                className="sidebar-logout"
                title="Cerrar sesión"
            >
                <span className="sidebar-link-icon">X</span>
                <span className="sidebar-link-text">Cerrar Sesión</span>
            </button>
        </aside>
    );
}

export default SidebarGestion;