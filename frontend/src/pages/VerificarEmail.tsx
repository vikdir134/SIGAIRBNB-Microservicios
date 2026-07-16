import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API_URL from '../services/api';

function VerificarEmail() {
    const [searchParams] = useSearchParams();

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [verificado, setVerificado] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [modoEspera, setModoEspera] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setModoEspera(true);
            setMensaje('Hemos enviado un enlace de confirmación a tu correo electrónico.');
            setError('');
            setVerificado(false);
            setCargando(false);
            return;
        }

        const verificarCorreo = async () => {
            setModoEspera(false);
            setCargando(true);
            setMensaje('Verificando tu correo electrónico...');
            setError('');

            try {
                const response = await fetch(`${API_URL}/auth/verify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.mensaje || 'No se pudo verificar el correo.');
                    setMensaje('');
                    setVerificado(false);
                    return;
                }

                setMensaje(data.mensaje || 'Correo verificado correctamente.');
                setVerificado(true);

            } catch (error) {
                setError('No se pudo conectar con el servidor.');
                setMensaje('');
                setVerificado(false);
            } finally {
                setCargando(false);
            }
        };

        verificarCorreo();
    }, [searchParams]);

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
                </header>

                <main className="login-main">
                    <div className="login-container">

                        <div>
                            <span style={{ fontSize: '3rem' }}>
                                {cargando ? '⏳' : verificado ? '✅' : modoEspera ? '✉️' : '⚠️'}
                            </span>
                        </div>

                        <h2>
                            {cargando
                                ? 'Verificando...'
                                : verificado
                                    ? '¡Correo verificado!'
                                    : modoEspera
                                        ? 'Verifica tu email'
                                        : 'No se pudo verificar'}
                        </h2>

                        {mensaje && (
                            <p className={verificado ? 'success-message' : ''}>
                                {mensaje}
                            </p>
                        )}

                        {modoEspera && (
                            <div>
                                <p>
                                    Por favor, revisa tu <strong>bandeja de entrada</strong> y haz clic en el enlace para activar tu cuenta.
                                </p>

                                <p>
                                    Si no encuentras el correo, revisa tu <strong>spam</strong> o <strong>correo no deseado</strong>.
                                </p>

                                <Link to="/Login" className="btn btn-primary btn-block">
                                    Ir al Inicio de Sesión
                                </Link>
                            </div>
                        )}

                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}

                        {verificado && (
                            <div>
                                <p>
                                    Tu cuenta ya fue activada. Ahora puedes iniciar sesión.
                                </p>

                                <Link to="/Login" className="btn btn-primary btn-block">
                                    Ir al Inicio de Sesión
                                </Link>
                            </div>
                        )}

                        {!modoEspera && !verificado && !cargando && error && (
                            <div>
                                <Link to="/Registro" className="btn btn-primary btn-block">
                                    Volver al Registro
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

export default VerificarEmail;