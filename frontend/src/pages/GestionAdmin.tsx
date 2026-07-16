import { useEffect, useState, type FormEvent } from 'react';
import SidebarGestion from '../components/SidebarGestion';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    listarUsuariosAdmin,
    inactivarUsuarioAdmin,
    reactivarUsuarioAdmin,
    type UsuarioAdmin
} from '../services/adminService';

import {
    obtenerSecretariosEmpresa,
    asignarSecretarioEmpresa,
    revocarSecretarioEmpresa,
    eliminarSecretarioRevocado,
    reactivarSecretarioEmpresa,
    type SecretarioAsignado
} from '../services/secretarioService';

function GestionAdmin() {
    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(null);

    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [accionConfirmacion, setAccionConfirmacion] = useState<'INACTIVAR' | 'REACTIVAR' | null>(null);

    const [secretarios, setSecretarios] = useState<SecretarioAsignado[]>([]);
    const [correoSecretario, setCorreoSecretario] = useState('');
    const [cargandoSecretarios, setCargandoSecretarios] = useState(false);

    const [secretarioAEliminar, setSecretarioAEliminar] =
    useState<SecretarioAsignado | null>(null);

const [confirmEliminarAbierto, setConfirmEliminarAbierto] =
    useState(false);

    const [secretarioSeleccionado, setSecretarioSeleccionado] =
        useState<SecretarioAsignado | null>(null);

    const [mostrarConfirmacionRevocar, setMostrarConfirmacionRevocar] =
        useState(false);

    const cargarUsuarios = async () => {
        try {
            setCargando(true);
            setMensaje('');
            setError('');

            const data = await listarUsuariosAdmin();
            setUsuarios(data.usuarios || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        } finally {
            setCargando(false);
        }
    };

    const cargarSecretarios = async () => {
        try {
            setCargandoSecretarios(true);
            setError('');

            const data = await obtenerSecretariosEmpresa();
            setSecretarios(data.secretarios || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar los secretarios'
            );
        } finally {
            setCargandoSecretarios(false);
        }
    };

    const manejarAsignacionSecretario = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        const correoNormalizado = correoSecretario
            .trim()
            .toLowerCase();

        if (!correoNormalizado) {
            setError('Ingresa el correo del usuario que será secretario');
            return;
        }

        try {
            setCargandoSecretarios(true);
            setMensaje('');
            setError('');

            const respuesta = await asignarSecretarioEmpresa(
                correoNormalizado
            );

            setCorreoSecretario('');

            await cargarSecretarios();

            setMensaje(respuesta.mensaje);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al asignar el secretario'
            );
        } finally {
            setCargandoSecretarios(false);
        }
    };

    const abrirConfirmacionRevocar = (
        secretario: SecretarioAsignado
    ) => {
        setSecretarioSeleccionado(secretario);
        setMostrarConfirmacionRevocar(true);
        setMensaje('');
        setError('');
    };

    const cerrarConfirmacionRevocar = () => {
        setSecretarioSeleccionado(null);
        setMostrarConfirmacionRevocar(false);
    };

    const ejecutarRevocacionSecretario = async () => {
        if (!secretarioSeleccionado) {
            return;
        }

        try {
            setCargandoSecretarios(true);
            setMensaje('');
            setError('');

            const respuesta = await revocarSecretarioEmpresa(
                secretarioSeleccionado.empresa_secretario_id
            );

            cerrarConfirmacionRevocar();

            await cargarSecretarios();

            setMensaje(respuesta.mensaje);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al revocar el acceso del secretario'
            );
        } finally {
            setCargandoSecretarios(false);
        }
    };


    const ejecutarReactivacionSecretario = async (
        secretario: SecretarioAsignado
    ) => {
        try {
            setCargandoSecretarios(true);
            setMensaje('');
            setError('');

            const respuesta = await reactivarSecretarioEmpresa(
                secretario.empresa_secretario_id
            );

            await cargarSecretarios();

            setMensaje(respuesta.mensaje);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al reactivar el acceso del secretario'
            );
        } finally {
            setCargandoSecretarios(false);
        }
    };

   const abrirConfirmacionEliminarSecretario = (
    secretario: SecretarioAsignado
) => {
    setSecretarioAEliminar(secretario);
    setConfirmEliminarAbierto(true);
};

const cerrarConfirmacionEliminarSecretario = () => {
    setSecretarioAEliminar(null);
    setConfirmEliminarAbierto(false);
};

const ejecutarEliminacionSecretarioRevocado = async () => {
    if (!secretarioAEliminar) return;

    try {
        setCargandoSecretarios(true);
        setMensaje('');
        setError('');

        const respuesta = await eliminarSecretarioRevocado(
            secretarioAEliminar.empresa_secretario_id
        );

        await cargarSecretarios();

        setMensaje(respuesta.mensaje);
        cerrarConfirmacionEliminarSecretario();
    } catch (err) {
        setError(
            err instanceof Error
                ? err.message
                : 'Error al quitar el secretario revocado'
        );
    } finally {
        setCargandoSecretarios(false);
    }
};

    useEffect(() => {
        cargarUsuarios();
        cargarSecretarios();
    }, []);

    const abrirConfirmacion = (usuario: UsuarioAdmin, accion: 'INACTIVAR' | 'REACTIVAR') => {
        setUsuarioSeleccionado(usuario);
        setAccionConfirmacion(accion);
        setMostrarConfirmacion(true);
        setMensaje('');
        setError('');
    };

    const ejecutarAccion = async () => {
        if (!usuarioSeleccionado || !accionConfirmacion) return;

        try {
            setCargando(true);
            setMensaje('');
            setError('');

            if (accionConfirmacion === 'INACTIVAR') {
                await inactivarUsuarioAdmin(usuarioSeleccionado.usuario_id);
                setMensaje('Usuario inactivado correctamente');
            }

            if (accionConfirmacion === 'REACTIVAR') {
                await reactivarUsuarioAdmin(usuarioSeleccionado.usuario_id);
                setMensaje('Usuario reactivado correctamente');
            }

            setMostrarConfirmacion(false);
            setUsuarioSeleccionado(null);
            setAccionConfirmacion(null);

            await cargarUsuarios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al ejecutar la acción');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <section className="gestion-header-card">
                    <h1>Mantenimiento Admin</h1>
                    <p>
                        Administra los usuarios de tu empresa. Puedes visualizar sus datos,
                        revisar sus roles y activar o inactivar cuentas.
                    </p>
                </section>

                {mensaje && <div className="alert-success">{mensaje}</div>}
                {error && <div className="alert-error">{error}</div>}

                <section className="gestion-card">
                    <div className="section-title-row">
                        <div>
                            <h2>Gestión de secretarios</h2>
                            <p>
                                Asigna usuarios para que puedan controlar el check-in
                                y check-out de los inmuebles de tu empresa.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-gestion-secondary"
                            onClick={cargarSecretarios}
                            disabled={cargandoSecretarios}
                        >
                            Actualizar
                        </button>
                    </div>

                    <form
                        onSubmit={manejarAsignacionSecretario}
                        className="secretario-asignacion-form"
                    >
                        <div className="search-item">
                            <label htmlFor="correoSecretario">
                                Correo del usuario
                            </label>

                            <input
                                type="email"
                                id="correoSecretario"
                                value={correoSecretario}
                                placeholder="secretario@correo.com"
                                onChange={(e) =>
                                    setCorreoSecretario(e.target.value)
                                }
                                disabled={cargandoSecretarios}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-gestion-primary"
                            disabled={cargandoSecretarios}
                        >
                            {cargandoSecretarios
                                ? 'Procesando...'
                                : 'Asignar secretario'}
                        </button>
                    </form>

                    {cargandoSecretarios && (
                        <p>Cargando secretarios...</p>
                    )}

                    {!cargandoSecretarios && secretarios.length === 0 && (
                        <p>
                            Todavía no tienes secretarios asignados a tu empresa.
                        </p>
                    )}

                    {secretarios.length > 0 && (
                        <div className="tabla-responsive">
                            <table className="gestion-table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Correo</th>
                                        <th>Fecha de asignación</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {secretarios.map((secretario) => {
                                        const nombreCompleto = `
                                            ${secretario.nombres || ''}
                                            ${secretario.apellidos || ''}
                                        `.trim();

                                        return (
                                            <tr
                                                key={
                                                    secretario.empresa_secretario_id
                                                }
                                            >
                                                <td>
                                                    {nombreCompleto || '-'}
                                                </td>

                                                <td>
                                                    {secretario.correo_secretario}
                                                </td>

                                                <td>
                                                    {secretario.fecha_asignacion
                                                        ? new Date(
                                                            secretario.fecha_asignacion
                                                        ).toLocaleString()
                                                        : '-'}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            secretario.activo
                                                                ? 'estado-badge estado-activo'
                                                                : 'estado-badge estado-inactivo'
                                                        }
                                                    >
                                                        {secretario.activo
                                                            ? 'Activo'
                                                            : 'Revocado'}
                                                    </span>
                                                </td>

                                                <td>
                                                   {secretario.activo ? (
                                                <button
                                                    type="button"
                                                    className="btn-danger btn-tabla"
                                                    onClick={() =>
                                                        abrirConfirmacionRevocar(secretario)
                                                    }
                                                    disabled={cargandoSecretarios}
                                                >
                                                    Revocar acceso
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn-gestion-primary btn-tabla"
                                                        onClick={() =>
                                                            ejecutarReactivacionSecretario(secretario)
                                                        }
                                                        disabled={cargandoSecretarios}
                                                    >
                                                        {cargandoSecretarios
                                                            ? 'Procesando...'
                                                            : 'Reactivar acceso'}
                                                    </button>

                                                   <button
                                                    type="button"
                                                    className="btn-danger btn-tabla"
                                                    onClick={() =>
                                                        abrirConfirmacionEliminarSecretario(secretario)
                                                    }
                                                    disabled={cargandoSecretarios}
                                                    title="Quitar de la lista"
                                                >
                                                    ✕
                                                </button>
                                                </div>
                                            )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="gestion-card">
                    <div className="section-title-row">
                        <div>
                            <h2>Usuarios de la empresa</h2>
                            <p>Listado de usuarios asociados a tu empresa actual.</p>
                        </div>

                        <button
                            type="button"
                            className="btn-gestion-secondary"
                            onClick={cargarUsuarios}
                            disabled={cargando}
                        >
                            Actualizar
                        </button>
                    </div>

                    {cargando && <p>Cargando usuarios...</p>}

                    {!cargando && usuarios.length === 0 && (
                        <p>No hay usuarios registrados en esta empresa.</p>
                    )}

                    {usuarios.length > 0 && (
                        <div className="tabla-responsive">
                            <table className="gestion-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Correo</th>
                                        <th>Roles</th>
                                        <th>Estado</th>
                                        <th>Activo</th>
                                        <th>Último acceso</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {usuarios.map((usuario) => {
                                        const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();

                                        return (
                                            <tr key={usuario.usuario_id}>
                                                <td>{usuario.usuario_id}</td>
                                                <td>{nombreCompleto || '-'}</td>
                                                <td>{usuario.correo}</td>
                                                <td>{usuario.roles || '-'}</td>
                                                <td>{usuario.estado}</td>
                                                <td>{usuario.activo ? 'Sí' : 'No'}</td>
                                                <td>
                                                    {usuario.ultimo_acceso
                                                        ? new Date(usuario.ultimo_acceso).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td>
                                                    {usuario.activo ? (
                                                        <button
                                                            type="button"
                                                            className="btn-danger btn-tabla"
                                                            onClick={() => abrirConfirmacion(usuario, 'INACTIVAR')}
                                                            disabled={cargando}
                                                        >
                                                            Inactivar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn-gestion-primary btn-tabla"
                                                            onClick={() => abrirConfirmacion(usuario, 'REACTIVAR')}
                                                            disabled={cargando}
                                                        >
                                                            Reactivar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {mostrarConfirmacion && usuarioSeleccionado && accionConfirmacion && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2>
                                {accionConfirmacion === 'INACTIVAR'
                                    ? 'Confirmar inactivación'
                                    : 'Confirmar reactivación'}
                            </h2>

                            <p>
                                {accionConfirmacion === 'INACTIVAR'
                                    ? '¿Seguro que deseas inactivar este usuario?'
                                    : '¿Seguro que deseas reactivar este usuario?'}
                            </p>

                            <div className="detalle-confirmacion">
                                <p><strong>ID:</strong> {usuarioSeleccionado.usuario_id}</p>
                                <p><strong>Usuario:</strong> {(usuarioSeleccionado.nombres || '') + ' ' + (usuarioSeleccionado.apellidos || '')}</p>
                                <p><strong>Correo:</strong> {usuarioSeleccionado.correo}</p>
                                <p><strong>Estado actual:</strong> {usuarioSeleccionado.estado}</p>
                            </div>

                            <div className="form-actions modal-actions">
                                <button
                                    type="button"
                                    className={accionConfirmacion === 'INACTIVAR' ? 'btn-danger' : 'btn-gestion-primary'}
                                    onClick={ejecutarAccion}
                                    disabled={cargando}
                                >
                                    {accionConfirmacion === 'INACTIVAR'
                                        ? 'Confirmar inactivación'
                                        : 'Confirmar reactivación'}
                                </button>

                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={() => {
                                        setMostrarConfirmacion(false);
                                        setUsuarioSeleccionado(null);
                                        setAccionConfirmacion(null);
                                    }}
                                    disabled={cargando}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarConfirmacionRevocar && secretarioSeleccionado && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2>Revocar acceso de secretario</h2>

                            <p>
                                ¿Seguro que deseas quitarle el acceso a los
                                inmuebles de tu empresa?
                            </p>

                            <div className="detalle-confirmacion">
                                <p>
                                    <strong>Usuario:</strong>{' '}
                                    {`${secretarioSeleccionado.nombres || ''} ${
                                        secretarioSeleccionado.apellidos || ''
                                    }`.trim() || '-'}
                                </p>

                                <p>
                                    <strong>Correo:</strong>{' '}
                                    {secretarioSeleccionado.correo_secretario}
                                </p>

                                <p>
                                    <strong>Estado:</strong>{' '}
                                    {secretarioSeleccionado.activo
                                        ? 'Activo'
                                        : 'Revocado'}
                                </p>
                            </div>

                            <div className="form-actions modal-actions">
                                <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={ejecutarRevocacionSecretario}
                                    disabled={cargandoSecretarios}
                                >
                                    {cargandoSecretarios
                                        ? 'Revocando...'
                                        : 'Confirmar revocación'}
                                </button>

                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={cerrarConfirmacionRevocar}
                                    disabled={cargandoSecretarios}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmDialog
    abierto={confirmEliminarAbierto}
    titulo="Quitar secretario revocado"
    descripcion={
        secretarioAEliminar
            ? `¿Quieres quitar de la lista a ${
                `${secretarioAEliminar.nombres || ''} ${secretarioAEliminar.apellidos || ''}`.trim() ||
                secretarioAEliminar.correo_secretario
            }? Esta acción no elimina su cuenta, solo quita la asignación revocada de la lista.`
            : '¿Quieres quitar este secretario revocado de la lista?'
    }
    textoConfirmar="Quitar de la lista"
    textoCancelar="Cancelar"
    tipo="danger"
    cargando={cargandoSecretarios}
    onConfirmar={ejecutarEliminacionSecretarioRevocado}
    onCerrar={cerrarConfirmacionEliminarSecretario}
/>
            </main>
        </div>
    );
}

export default GestionAdmin;