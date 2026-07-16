import { useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../services/api';
import { isValidEmail } from '../utils/validators';

function RecuperarPassword() {
    const [correo, setCorreo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setMensaje('');
        setError('');

        const correoNormalizado = correo.trim().toLowerCase();

        if (!isValidEmail(correoNormalizado)) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo: correoNormalizado })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.mensaje || 'No se pudo enviar el enlace');
                return;
            }

            setMensaje(data.mensaje);
            setCorreo('');

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
                            <span style={{ fontSize: '3rem' }}>🔑</span>
                        </div>

                        <h2>¿Olvidaste tu contraseña?</h2>
                        <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.</p>

                        <form onSubmit={handleSubmit}>
                            <div className="search-item">
                                <label htmlFor="email-recovery">Correo electrónico</label>
                                <input
                                    type="email"
                                    id="email-recovery"
                                    name="correo"
                                    placeholder="ejemplo@correo.com"
                                    required
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-margin"
                                disabled={cargando}
                            >
                                {cargando ? 'Enviando...' : 'Enviar enlace'}
                            </button>

                            {mensaje && <p className="success-message">{mensaje}</p>}
                            {error && <p className="error-message">{error}</p>}
                        </form>

                        <div>
                            <p>¿Recordaste tu contraseña? <Link to="/Login" className="login-link">Inicia Sesión</Link></p>
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

export default RecuperarPassword;
