import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API_URL from '../services/api';
import { isStrongPassword } from '../utils/validators';

function RestablecerPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setMensaje('');
        setError('');

        if (!token) {
            setError('El enlace de recuperación no contiene token');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener como mínimo 6 caracteres');
            return;
        }

        if (!isStrongPassword(password)) {
            setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
            return;
        }

        if (password !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.mensaje || 'No se pudo restablecer la contraseña');
                return;
            }

            setMensaje(data.mensaje);

            setTimeout(() => {
                navigate('/Login');
            }, 1500);

        } catch (error) {
            setError('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            <div className="auth-body">
                <header className="main-header">
                    <div className="logo-section">
                        <Link to="/">
                            <span className="logo-text">Stay<span className="logo-dot-pe">.pe</span></span>
                        </Link>
                    </div>
                </header>

                <main className="login-main">
                    <div className="login-container">

                        <div>
                            <span style={{ fontSize: '3rem' }}>🔐</span>
                        </div>

                        <h2>Restablecer contraseña</h2>
                        <p>Ingresa una nueva contraseña para tu cuenta.</p>

                        {!token && (
                            <p className="error-message">
                                El enlace no es válido porque no contiene token.
                            </p>
                        )}

                        {token && (
                            <form onSubmit={handleSubmit}>
                                <div className="search-item">
                                    <label htmlFor="password">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="search-item">
                                    <label htmlFor="confirmarPassword">Confirmar contraseña</label>
                                    <input
                                        type="password"
                                        id="confirmarPassword"
                                        placeholder="Repite tu contraseña"
                                        required
                                        value={confirmarPassword}
                                        onChange={(e) => setConfirmarPassword(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block btn-margin"
                                    disabled={cargando}
                                >
                                    {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
                                </button>

                                {mensaje && <p className="success-message">{mensaje}</p>}
                                {error && <p className="error-message">{error}</p>}
                            </form>
                        )}

                        <div>
                            <p><Link to="/Login" className="login-link">Volver al inicio de sesión</Link></p>
                        </div>
                    </div>
                </main>

                <footer className="main-footer">
                    &copy; 2026 Stay.pe - Sistema Integral de Gestión de Inmuebles
                </footer>
            </div>
        </>
    );
}

export default RestablecerPassword;
