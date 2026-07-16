import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import SidebarGestion from '../components/SidebarGestion';
import ConfirmDialog from '../components/ConfirmDialog';

import {
    listarInmueblesPublicables,
    crearPublicacionGestion,
    subirFotoPublicacion,
    publicarPublicacionGestion,
    eliminarBorradorPublicacionGestion,
    eliminarPublicacionGestion,
    type InmueblePublicable,
    type PublicacionFormData
} from '../services/publicacionService';
import { isDateNotAbsurd, todayDateOnly } from '../utils/dateValidators';
import { isValidImageFile } from '../utils/validators';

type AccionConfirmacion =
    | 'publicarNuevo'
    | 'publicarBorrador'
    | 'eliminarBorrador'
    | 'eliminarPublicacion'
    | null;

function GestionPublicacion() {
    const inputFotoRef = useRef<HTMLInputElement | null>(null);

    const [inmuebles, setInmuebles] = useState<InmueblePublicable[]>([]);
    const [fotoSeleccionada, setFotoSeleccionada] = useState<File | null>(null);
    const [previewFoto, setPreviewFoto] = useState('');

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const [cargandoInmuebles, setCargandoInmuebles] = useState(false);
    const [publicando, setPublicando] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState<{
        abierto: boolean;
        titulo: string;
        descripcion: string;
        textoConfirmar: string;
        tipo: 'normal' | 'danger' | 'success';
        accion: AccionConfirmacion;
        publicacionId?: number;
    }>({
        abierto: false,
        titulo: '',
        descripcion: '',
        textoConfirmar: 'Confirmar',
        tipo: 'normal',
        accion: null
    });

    const [form, setForm] = useState<PublicacionFormData>({
        inmueble_id: 0,
        titulo: '',
        descripcion_corta: '',
        descripcion_larga: '',
        precio_publicado_mensual: '',
        moneda: 'PEN',
        condiciones_arrendamiento: '',
        disponible_desde: '',
        acepta_reservas: true,
        es_destacado: false
    });

    const cargarInmuebles = async () => {
        try {
            setCargandoInmuebles(true);
            setError('');

            const data = await listarInmueblesPublicables();
            setInmuebles(data.inmuebles || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar inmuebles');
        } finally {
            setCargandoInmuebles(false);
        }
    };

    useEffect(() => {
        cargarInmuebles();
    }, []);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;

        setForm({
            ...form,
            [name]: checked
        });
    };

    const handleFoto = (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];

        if (!archivo) {
            setFotoSeleccionada(null);
            setPreviewFoto('');
            return;
        }

        if (!isValidImageFile(archivo)) {
            setError('La foto debe ser JPG, PNG o WEBP y no superar 5 MB.');
            setFotoSeleccionada(null);
            setPreviewFoto('');
            return;
        }

        setFotoSeleccionada(archivo);
        setPreviewFoto(URL.createObjectURL(archivo));
    };

    const limpiarFoto = () => {
        setFotoSeleccionada(null);
        setPreviewFoto('');

        if (inputFotoRef.current) {
            inputFotoRef.current.value = '';
        }
    };

    const limpiarFormulario = () => {
        setForm({
            inmueble_id: 0,
            titulo: '',
            descripcion_corta: '',
            descripcion_larga: '',
            precio_publicado_mensual: '',
            moneda: 'PEN',
            condiciones_arrendamiento: '',
            disponible_desde: '',
            acepta_reservas: true,
            es_destacado: false
        });

        limpiarFoto();
    };

    const validarFormulario = () => {
        if (!form.inmueble_id || Number(form.inmueble_id) <= 0) {
            setError('Selecciona un inmueble para publicar.');
            return false;
        }

        if (!form.titulo.trim()) {
            setError('El título de la publicación es obligatorio.');
            return false;
        }

        if (
            !form.precio_publicado_mensual ||
            Number(form.precio_publicado_mensual) <= 0
        ) {
            setError('El precio mensual debe ser mayor a 0.');
            return false;
        }

        if (form.titulo.trim().length > 200) {
            setError('El título no puede superar los 200 caracteres.');
            return false;
        }

        if (form.descripcion_corta.trim().length > 500) {
            setError('La descripción corta no puede superar los 500 caracteres.');
            return false;
        }

        if (form.disponible_desde) {
            if (!isDateNotAbsurd(form.disponible_desde, { maxFutureYears: 3 })) {
                setError('La fecha de disponibilidad está fuera del rango permitido.');
                return false;
            }

            if (form.disponible_desde < todayDateOnly()) {
                setError('La fecha de disponibilidad no puede ser una fecha pasada.');
                return false;
            }
        }

        if (!fotoSeleccionada) {
            setError('Selecciona una foto principal del inmueble.');
            return false;
        }

        return true;
    };

    const abrirConfirmDialog = (config: {
        titulo: string;
        descripcion: string;
        textoConfirmar: string;
        tipo: 'normal' | 'danger' | 'success';
        accion: Exclude<AccionConfirmacion, null>;
        publicacionId?: number;
    }) => {
        setConfirmDialog({
            abierto: true,
            ...config
        });
    };

    const cerrarConfirmDialog = (forzar = false) => {
        if (publicando && !forzar) return;

        setConfirmDialog({
            abierto: false,
            titulo: '',
            descripcion: '',
            textoConfirmar: 'Confirmar',
            tipo: 'normal',
            accion: null
        });
    };

    const publicarInmueble = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (publicando) return;

        setMensaje('');
        setError('');

        if (!validarFormulario()) return;

        abrirConfirmDialog({
            titulo: 'Publicar inmueble',
            descripcion:
                'Se creará la publicación, se guardará la foto principal y el inmueble será visible para los inquilinos.',
            textoConfirmar: 'Publicar inmueble',
            tipo: 'success',
            accion: 'publicarNuevo'
        });
    };

    const publicarBorradorExistente = (publicacionId: number) => {
        abrirConfirmDialog({
            titulo: 'Publicar borrador',
            descripcion:
                'Este borrador pasará a estar visible para los inquilinos en la búsqueda pública.',
            textoConfirmar: 'Publicar',
            tipo: 'success',
            accion: 'publicarBorrador',
            publicacionId
        });
    };

    const eliminarBorradorExistente = (publicacionId: number) => {
        abrirConfirmDialog({
            titulo: 'Eliminar borrador',
            descripcion:
                'Se eliminará este borrador y sus fotos registradas. Esta acción no se puede deshacer.',
            textoConfirmar: 'Eliminar',
            tipo: 'danger',
            accion: 'eliminarBorrador',
            publicacionId
        });
    };

    const eliminarPublicacionExistente = (publicacionId: number) => {
        abrirConfirmDialog({
            titulo: 'Eliminar publicación',
            descripcion:
                'La publicación dejará de ser visible para los inquilinos y se eliminarán sus fotos registradas.',
            textoConfirmar: 'Eliminar',
            tipo: 'danger',
            accion: 'eliminarPublicacion',
            publicacionId
        });
    };

    const ejecutarAccionConfirmada = async () => {
        if (!confirmDialog.accion) return;

        try {
            setMensaje('');
            setError('');
            setPublicando(true);

            if (confirmDialog.accion === 'publicarNuevo') {
                const dataPublicacion = await crearPublicacionGestion({
                    ...form,
                    inmueble_id: Number(form.inmueble_id)
                });

                const publicacionId = dataPublicacion.publicacion.publicacion_id;

                await subirFotoPublicacion(
                    publicacionId,
                    fotoSeleccionada as File,
                    true,
                    1
                );

                await publicarPublicacionGestion(publicacionId);

                setMensaje('Publicado correctamente.');
                limpiarFormulario();
                await cargarInmuebles();
            }

            if (
                confirmDialog.accion === 'publicarBorrador' &&
                confirmDialog.publicacionId
            ) {
                await publicarPublicacionGestion(confirmDialog.publicacionId);

                setMensaje('Publicado correctamente.');
                await cargarInmuebles();
            }

            if (
                confirmDialog.accion === 'eliminarBorrador' &&
                confirmDialog.publicacionId
            ) {
                await eliminarBorradorPublicacionGestion(confirmDialog.publicacionId);

                setMensaje('Borrador eliminado correctamente.');
                await cargarInmuebles();
            }

            if (
                confirmDialog.accion === 'eliminarPublicacion' &&
                confirmDialog.publicacionId
            ) {
                await eliminarPublicacionGestion(confirmDialog.publicacionId);

                setMensaje('Publicación eliminada correctamente.');
                await cargarInmuebles();
            }

            cerrarConfirmDialog(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al ejecutar la acción');
            cerrarConfirmDialog(true);
        } finally {
            setPublicando(false);
        }
    };

    const inmueblesDisponibles = inmuebles.filter(
        (item) => item.puede_crear_publicacion
    );

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <div className="gestion-header-card">
                    <h1>Publicación de Inmueble</h1>
                    <p>
                        Crea una publicación con descripción, precio y foto principal
                        para que sea visible a los inquilinos.
                    </p>
                </div>

                {mensaje && <div className="mensaje-exito">{mensaje}</div>}
                {error && <div className="mensaje-error">{error}</div>}

                <section className="gestion-card">
                    <h2>Nueva publicación</h2>

                    {cargandoInmuebles ? (
                        <p>Cargando inmuebles publicables...</p>
                    ) : inmueblesDisponibles.length === 0 ? (
                        <p>No tienes inmuebles disponibles para crear nuevas publicaciones.</p>
                    ) : (
                        <form className="gestion-form" onSubmit={publicarInmueble}>
                            <div className="gestion-form-grid">
                                <div className="gestion-field">
                                    <label>Inmueble</label>
                                    <select
                                        name="inmueble_id"
                                        value={form.inmueble_id}
                                        onChange={handleChange}
                                    >
                                        <option value={0}>Selecciona un inmueble</option>

                                        {inmueblesDisponibles.map((inmueble) => (
                                            <option
                                                key={inmueble.inmueble_id}
                                                value={inmueble.inmueble_id}
                                            >
                                                {inmueble.codigo} - {inmueble.tipo_inmueble} - {inmueble.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="gestion-field">
                                    <label>Título</label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={form.titulo}
                                        onChange={handleChange}
                                        placeholder="Ej. Local comercial en Miraflores"
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Precio mensual</label>
                                    <input
                                        type="number"
                                        name="precio_publicado_mensual"
                                        value={form.precio_publicado_mensual}
                                        onChange={handleChange}
                                        min="1"
                                        placeholder="Ej. 2500"
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Moneda</label>
                                    <select
                                        name="moneda"
                                        value={form.moneda}
                                        onChange={handleChange}
                                    >
                                        <option value="PEN">PEN</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>

                                <div className="gestion-field">
                                    <label>Disponible desde</label>
                                    <input
                                        type="date"
                                        name="disponible_desde"
                                        value={form.disponible_desde}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Foto principal</label>
                                    <input
                                        ref={inputFotoRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFoto}
                                    />
                                </div>
                            </div>

                            <div className="gestion-field">
                                <label>Descripción corta</label>
                                <textarea
                                    name="descripcion_corta"
                                    value={form.descripcion_corta}
                                    onChange={handleChange}
                                    placeholder="Resumen breve que aparecerá en la búsqueda."
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Descripción larga</label>
                                <textarea
                                    name="descripcion_larga"
                                    value={form.descripcion_larga}
                                    onChange={handleChange}
                                    placeholder="Describe el inmueble, su ubicación, condiciones y beneficios."
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Condiciones de arrendamiento</label>
                                <textarea
                                    name="condiciones_arrendamiento"
                                    value={form.condiciones_arrendamiento}
                                    onChange={handleChange}
                                    placeholder="Ej. Contrato mínimo de 6 meses, evaluación previa, etc."
                                />
                            </div>

                            <div className="publicacion-checks">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="acepta_reservas"
                                        checked={form.acepta_reservas}
                                        onChange={handleCheckbox}
                                    />
                                    Acepta solicitudes de reserva
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        name="es_destacado"
                                        checked={form.es_destacado}
                                        onChange={handleCheckbox}
                                    />
                                    Marcar como destacado
                                </label>
                            </div>

                            {previewFoto && (
                                <div className="preview-foto-publicacion">
                                    <img src={previewFoto} alt="Vista previa" />

                                    <button
                                        type="button"
                                        className="btn-gestion-secondary"
                                        onClick={limpiarFoto}
                                        disabled={publicando}
                                    >
                                        Quitar foto
                                    </button>
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={limpiarFormulario}
                                    disabled={publicando}
                                >
                                    Limpiar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-gestion-primary"
                                    disabled={publicando}
                                >
                                    {publicando ? 'Publicando...' : 'Publicar inmueble'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="gestion-card">
                    <h2>Inmuebles con publicación</h2>

                    {inmuebles.filter((item) => item.publicacion_id).length === 0 ? (
                        <p>Aún no tienes publicaciones registradas.</p>
                    ) : (
                        <div className="tabla-responsive">
                            <table className="gestion-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Tipo</th>
                                        <th>Nombre</th>
                                        <th>Publicación</th>
                                        <th>Estado</th>
                                        <th>Precio</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {inmuebles
                                        .filter((item) => item.publicacion_id)
                                        .map((item) => (
                                            <tr key={item.inmueble_id}>
                                                <td>{item.codigo}</td>
                                                <td>{item.tipo_inmueble}</td>
                                                <td>{item.nombre}</td>
                                                <td>{item.titulo_publicacion}</td>
                                                <td>{item.estado_publicacion}</td>
                                                <td>
                                                    {item.precio_publicado_mensual
                                                        ? `S/ ${item.precio_publicado_mensual}`
                                                        : '-'}
                                                </td>
                                                <td>
                                                    {item.estado_publicacion === 'BORRADOR' ? (
                                                        <div className="acciones-publicacion">
                                                            <button
                                                                type="button"
                                                                className="btn-gestion-primary"
                                                                onClick={() =>
                                                                    publicarBorradorExistente(
                                                                        item.publicacion_id as number
                                                                    )
                                                                }
                                                                disabled={publicando}
                                                            >
                                                                Publicar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-gestion-danger"
                                                                onClick={() =>
                                                                    eliminarBorradorExistente(
                                                                        item.publicacion_id as number
                                                                    )
                                                                }
                                                                disabled={publicando}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    ) : item.estado_publicacion === 'PUBLICADO' ? (
                                                        <button
                                                            type="button"
                                                            className="btn-gestion-danger"
                                                            onClick={() =>
                                                                eliminarPublicacionExistente(
                                                                    item.publicacion_id as number
                                                                )
                                                            }
                                                            disabled={publicando}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    ) : (
                                                        <span>{item.estado_publicacion}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <ConfirmDialog
                abierto={confirmDialog.abierto}
                titulo={confirmDialog.titulo}
                descripcion={confirmDialog.descripcion}
                textoConfirmar={confirmDialog.textoConfirmar}
                tipo={confirmDialog.tipo}
                cargando={publicando}
                onCerrar={() => cerrarConfirmDialog(false)}
                onConfirmar={ejecutarAccionConfirmada}
            />
        </div>
    );
}

export default GestionPublicacion;
