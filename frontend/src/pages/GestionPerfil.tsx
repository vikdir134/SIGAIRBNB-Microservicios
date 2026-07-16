import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarGestion from '../components/SidebarGestion';

import {
    obtenerPerfil,
    actualizarPerfil,
    actualizarNotificaciones,
    type PerfilFormData,
    type NotificacionesData
} from '../services/perfilService';
import {
    isValidHttpUrl,
    isValidPersonName,
    isValidPhone,
    onlyDigits
} from '../utils/validators';

function GestionPerfil() {
    const navigate = useNavigate();

    //Estados
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [correo, setCorreo] = useState('');
    const [guardando, setGuardando] = useState(false);

    const [form, setForm] = useState<PerfilFormData>({
        nombres: '',
        apellidos: '',
        telefono: '',
        foto_url: '',
        biografia: '',
        direccion: '',
        distrito: '',
        ciudad: '',
        pais: 'Perú'
    });

    const [notificaciones, setNotificaciones] = useState<NotificacionesData>({
        recibe_notif_email: true,
        recibe_notif_push: true,
        recibe_notif_sms: false
    });

    const cargarPerfil = async () => {
        setCargando(true);
        setError('');
        setExito('');

        try {
            const perfil = await obtenerPerfil();

            setCorreo(perfil.correo);

            setForm({
                nombres: perfil.nombres || '',
                apellidos: perfil.apellidos || '',
                telefono: perfil.telefono || '',
                foto_url: perfil.foto_url || '',
                biografia: perfil.biografia || '',
                direccion: perfil.direccion || '',
                distrito: perfil.distrito || '',
                ciudad: perfil.ciudad || '',
                pais: perfil.pais || 'Perú'
            });

            setNotificaciones({
                recibe_notif_email: perfil.recibe_notif_email,
                recibe_notif_push: perfil.recibe_notif_push,
                recibe_notif_sms: perfil.recibe_notif_sms
            });

        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'No se pudo cargar el perfil';

            if (mensaje === 'No hay token de autenticación') {
                navigate('/Login');
                return;
            }

            setError(mensaje);
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.name === 'telefono'
                ? onlyDigits(e.target.value)
                : e.target.value
        });
    };

    const handleNotificacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNotificaciones({
            ...notificaciones,
            [e.target.name]: e.target.checked
        });
    };

    const guardarCambios = async () => {
        setError('');
        setExito('');

        if (!form.nombres.trim() || !form.apellidos.trim()) {
            setError('Los nombres y apellidos son obligatorios');
            return;
        }

        if (form.nombres.trim().length < 2) {
            setError('El nombre debe tener como mínimo 2 caracteres');
            return;
        }

        if (form.apellidos.trim().length < 2) {
            setError('El apellido debe tener como mínimo 2 caracteres');
            return;
        }

        const confirmar = window.confirm('¿Deseas guardar los cambios de tu perfil?');

        if (!confirmar) {
            return;
        }

        if (!isValidPersonName(form.nombres) || !isValidPersonName(form.apellidos)) {
            setError('Nombres y apellidos deben contener solo letras y tener entre 2 y 80 caracteres.');
            return;
        }

        if (!isValidPhone(form.telefono)) {
            setError('El teléfono debe contener entre 7 y 15 dígitos y no puede ser un número repetido.');
            return;
        }

        if (!isValidHttpUrl(form.foto_url)) {
            setError('La URL de foto debe iniciar con http:// o https://.');
            return;
        }

        if (form.biografia.trim().length > 500) {
            setError('La biografía no debe superar los 500 caracteres.');
            return;
        }

        setGuardando(true);

        try {
            await actualizarPerfil({
                nombres: form.nombres.trim(),
                apellidos: form.apellidos.trim(),
                telefono: form.telefono.trim(),
                foto_url: form.foto_url.trim(),
                biografia: form.biografia.trim(),
                direccion: form.direccion.trim(),
                distrito: form.distrito.trim(),
                ciudad: form.ciudad.trim(),
                pais: form.pais.trim() || 'Perú'
            });

            await actualizarNotificaciones(notificaciones);

            setExito('Perfil actualizado correctamente');

            await cargarPerfil();

        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'No se pudo guardar el perfil';
            setError(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    useEffect(() => {
        cargarPerfil();
    }, []);

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <section className="gestion-header-card">
                    <h1>Modificar Perfil</h1>
                    <p>Actualiza tu información personal para mantener tus datos al día dentro de la plataforma.</p>
                </section>

                {cargando && (
                    <section className="gestion-card">
                        <p>Cargando información del perfil...</p>
                    </section>
                )}

                {error && (
                    <section className="gestion-card">
                        <p className="error-message">{error}</p>
                    </section>
                )}

                {exito && (
                    <section className="gestion-card">
                        <p className="success-message">{exito}</p>
                    </section>
                )}

                {!cargando && (
                    <>
                        <section className="gestion-card">
                            <h2>Datos básicos</h2>
                            <p>Edita la información principal de tu cuenta.</p>

                            <div className="gestion-form-grid">
                                <div className="gestion-field">
                                    <label>Nombres</label>
                                    <input
                                        type="text"
                                        name="nombres"
                                        value={form.nombres}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Apellidos</label>
                                    <input
                                        type="text"
                                        name="apellidos"
                                        value={form.apellidos}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={correo}
                                        disabled
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={form.telefono}
                                        onChange={handleChange}
                                        placeholder="999 999 888"
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Ciudad</label>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        value={form.ciudad}
                                        onChange={handleChange}
                                        placeholder="Lima"
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>País</label>
                                    <input
                                        type="text"
                                        name="pais"
                                        value={form.pais}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Distrito</label>
                                    <input
                                        type="text"
                                        name="distrito"
                                        value={form.distrito}
                                        onChange={handleChange}
                                        placeholder="Cercado de Lima"
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={form.direccion}
                                        onChange={handleChange}
                                        placeholder="Av. Principal 123"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="gestion-card">
                            <h2>Foto de perfil</h2>
                            <p>Por ahora se guardará la URL de la imagen. La subida de archivo físico puede quedar para una mejora posterior.</p>

                            <div className="gestion-field">
                                <label>URL de foto</label>
                                <input
                                    type="text"
                                    name="foto_url"
                                    value={form.foto_url}
                                    onChange={handleChange}
                                    placeholder="https://ejemplo.com/foto.jpg"
                                />
                            </div>

                            {form.foto_url && (
                                <div className="photo-box">
                                    <div>
                                        <strong>Vista previa</strong>
                                        <p>Esta imagen se usará como foto de perfil.</p>
                                    </div>

                                    <img
                                        src={form.foto_url}
                                        alt="Vista previa del perfil"
                                        style={{
                                            width: '90px',
                                            height: '90px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                            )}
                        </section>

                        <section className="gestion-card">
                            <h2>Biografía</h2>
                            <p>Agrega una breve descripción sobre ti.</p>

                            <div className="gestion-field">
                                <label>Biografía</label>
                                <textarea
                                    name="biografia"
                                    value={form.biografia}
                                    onChange={handleChange}
                                    placeholder="Escribe una breve descripción..."
                                    rows={4}
                                />
                            </div>
                        </section>

                        <section className="gestion-card">
                            <h2>Notificaciones</h2>
                            <p>Configura cómo deseas recibir avisos de la plataforma.</p>

                            <div className="preference-row">
                                <div>
                                    <strong>Recibir notificaciones por correo</strong>
                                    <p>Avisos de reservas, cambios en inmuebles y actividad importante.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    name="recibe_notif_email"
                                    checked={notificaciones.recibe_notif_email}
                                    onChange={handleNotificacionChange}
                                />
                            </div>

                            <div className="preference-row">
                                <div>
                                    <strong>Recibir notificaciones push</strong>
                                    <p>Recordatorios y alertas dentro del sistema.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    name="recibe_notif_push"
                                    checked={notificaciones.recibe_notif_push}
                                    onChange={handleNotificacionChange}
                                />
                            </div>

                            <div className="preference-row">
                                <div>
                                    <strong>Recibir notificaciones SMS</strong>
                                    <p>Avisos importantes enviados al número registrado.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    name="recibe_notif_sms"
                                    checked={notificaciones.recibe_notif_sms}
                                    onChange={handleNotificacionChange}
                                />
                            </div>
                        </section>

                        <div className="gestion-actions">
                            <button
                                className="btn-save"
                                type="button"
                                onClick={guardarCambios}
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>

                            <button
                                className="btn-reset"
                                type="button"
                                onClick={cargarPerfil}
                            >
                                Restablecer
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default GestionPerfil;
