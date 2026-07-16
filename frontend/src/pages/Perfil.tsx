import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import apiClient from '../services/apiClient';

type PerfilUsuario = {
    nombres: string;
    apellidos: string;
    telefono?: string | null;
    tipo_documento?: string | null;
    numero_documento?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    foto_url?: string | null;
};

type Usuario = {
    usuario_id: number;
    correo: string;
    estado: string;
    email_verificado: boolean;
    roles: string[];
    perfil: PerfilUsuario;
};

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface AuthMeResponse {
    mensaje?: string;
    usuario: Usuario;
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

function Perfil() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const obtenerPerfil = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/Login');
            return;
        }

        try {
            setCargando(true);
            setError('');

            const response = await apiClient.get<AuthMeResponse>('/auth/me');

            setUsuario(response.data.usuario);
        } catch (error) {
            setError(
                obtenerMensajeError(
                    error,
                    'No se pudo conectar con el servidor'
                )
            );
        } finally {
            setCargando(false);
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/Login');
    };

    useEffect(() => {
        obtenerPerfil();
    }, []);

    return (
        <>
            <div className="auth-body">
                <header className="main-header">
                    <div className="logo-section">
                        <Link to="/">
                            <span className="logo-text">
                                Stay<span className="logo-dot-pe">.pe</span>
                            </span>
                        </Link>
                    </div>

                    <button onClick={cerrarSesion} className="btn btn-secondary">
                        Cerrar sesión
                    </button>
                </header>

                <main className="login-main">
                    <div className="login-container">
                        <h2>Mi perfil</h2>
                        <p>Información de tu cuenta en Stay.pe</p>

                        {cargando && <p>Cargando perfil...</p>}

                        {error && <p className="error-message">{error}</p>}

                        {usuario && (
                            <div className="profile-box">
                                <div className="search-item">
                                    <label>Correo</label>
                                    <input type="text" value={usuario.correo} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Estado de cuenta</label>
                                    <input type="text" value={usuario.estado} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Roles</label>
                                    <input type="text" value={usuario.roles.join(', ')} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Nombres</label>
                                    <input type="text" value={usuario.perfil?.nombres || ''} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Apellidos</label>
                                    <input type="text" value={usuario.perfil?.apellidos || ''} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Teléfono</label>
                                    <input type="text" value={usuario.perfil?.telefono || 'No registrado'} disabled />
                                </div>

                                <div className="search-item">
                                    <label>Documento</label>
                                    <input
                                        type="text"
                                        value={
                                            usuario.perfil?.numero_documento
                                                ? `${usuario.perfil.tipo_documento || ''} ${usuario.perfil.numero_documento}`
                                                : 'No registrado'
                                        }
                                        disabled
                                    />
                                </div>

                                <div className="search-item">
                                    <label>Ubicación</label>
                                    <input
                                        type="text"
                                        value={`${usuario.perfil?.ciudad || 'No registrada'} - ${usuario.perfil?.pais || 'Perú'}`}
                                        disabled
                                    />
                                </div>

                                <Link to="/" className="btn btn-primary btn-block btn-margin">
                                    Volver al inicio
                                </Link>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="main-footer">
                    &copy; 2026 Stay.pe - Sistema Integral de Gestión de Inmuebles
                </footer>
            </div>
        </>
    );
}

export default Perfil;