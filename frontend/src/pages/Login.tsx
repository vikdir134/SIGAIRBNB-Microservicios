import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../services/api';
import { isValidEmail } from '../utils/validators';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'jorge.chavezg@unmsm.edu.pe';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'J0rge1201';

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        correo: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const usarCredencialesDemo = () => {
        setForm({
            correo: DEMO_EMAIL,
            password: DEMO_PASSWORD
        });
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setError('');

        const correo = form.correo.trim().toLowerCase();

        if (!isValidEmail(correo)) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...form,
                    correo
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.mensaje || 'Error al iniciar sesión');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            const roles: string[] = Array.isArray(data.usuario?.roles)
                ? data.usuario.roles.map((rol: unknown) =>
                    String(rol).toUpperCase()
                )
                : [];

            if (roles.includes('ADMIN')) {
                navigate('/GestionReportes');
                return;
            }

            if (roles.includes('SECRETARIO')) {
                navigate('/GestionSolicitudesReserva');
                return;
            }

            navigate('/');


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
                        <h2>¡Bienvenido de nuevo!</h2>
                        <p>Ingresa tus credenciales para acceder</p>

                        <div className="demo-credentials-box">
                            <div>
                                <strong>Credenciales de prueba</strong>
                                <p>Usa esta cuenta para probar el sistema completo.</p>
                            </div>

                            <div className="demo-credentials-row">
                                <span>Usuario:</span>
                                <code>{DEMO_EMAIL}</code>
                            </div>

                            <div className="demo-credentials-row">
                                <span>Contraseña:</span>
                                <code>{DEMO_PASSWORD}</code>
                            </div>

                            <button
                                type="button"
                                className="demo-credentials-button"
                                onClick={usarCredencialesDemo}
                            >
                                Usar credenciales
                            </button>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="search-item">
                                <label htmlFor="correo">Correo electrónico</label>
                                <input
                                    type="email"
                                    id="correo"
                                    name="correo"
                                    placeholder="ejemplo@correo.com"
                                    required
                                    value={form.correo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="search-item">
                                <label htmlFor="password">Contraseña</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Link to="/RecuperarPassword" className="login-link">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-margin"
                                disabled={cargando}
                            >
                                {cargando ? 'Ingresando...' : 'Ingresar'}
                            </button>

                            {error && <p className="error-message">{error}</p>}
                        </form>

                        <div>
                            <p>¿No tienes una cuenta? <Link to="/Registro" className="login-link auth-link">Regístrate aquí</Link></p>
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

export default Login;
