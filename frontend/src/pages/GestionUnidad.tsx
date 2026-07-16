import { useEffect, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';

import {
    listarEdificios,
    registrarUnidad,
    listarUnidadesPorEdificio,
    obtenerUnidadPorId,
    type EdificioListado,
    type UnidadFormData,
    type UnidadListado
} from '../services/edificioService';

function GestionUnidad() {
    const [edificios, setEdificios] = useState<EdificioListado[]>([]);
    const [unidades, setUnidades] = useState<UnidadListado[]>([]);
    const [cargandoUnidades, setCargandoUnidades] = useState(false);
    const [unidadDetalle, setUnidadDetalle] = useState<any>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [cargandoEdificios, setCargandoEdificios] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const [formData, setFormData] = useState<UnidadFormData>({
        edificio_id: '',
        codigo: '',
        tipo_inmueble: 'PISO',
        nombre: '',
        subtipo_unidad: '',
        descripcion: '',
        planta: '',
        letra: '',
        area_m2: '',
        num_habitaciones: '',
        num_banos: '',
        capacidad_personas: '',
        renta_base_mensual: '',
        moneda: 'PEN'
    });

    useEffect(() => {
        cargarEdificios();
    }, []);

    useEffect(() => {
        if (formData.edificio_id) {
            cargarUnidadesPorEdificio(formData.edificio_id);
        } else {
            setUnidades([]);
        }
    }, [formData.edificio_id]);

    const cargarEdificios = async () => {
        try {
            setCargandoEdificios(true);
            setError('');

            const data = await listarEdificios();
            setEdificios(data.edificios || []);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Error al cargar edificios');
            }
        } finally {
            setCargandoEdificios(false);
        }
    };

    const cargarUnidadesPorEdificio = async (edificioId: string) => {
        try {
            setCargandoUnidades(true);
            setError('');

            const data = await listarUnidadesPorEdificio(edificioId);
            setUnidades(data.unidades || []);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Error al cargar pisos/locales');
            }
        } finally {
            setCargandoUnidades(false);
        }
    };

    const verDetalleUnidad = async (unidadId: number) => {
        try {
            setCargandoDetalle(true);
            setError('');
            setUnidadDetalle(null);

            const data = await obtenerUnidadPorId(unidadId);
            setUnidadDetalle(data.unidad);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Error al obtener el detalle del piso/local');
            }
        } finally {
            setCargandoDetalle(false);
        }
    };

    const manejarCambio = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'edificio_id') {
            setUnidadDetalle(null);
            setMensaje('');
            setError('');
        }
    };

    const limpiarFormulario = (conservarEdificio = false) => {
        const edificioActual = formData.edificio_id;

        setFormData({
            edificio_id: conservarEdificio ? edificioActual : '',
            codigo: '',
            tipo_inmueble: 'PISO',
            nombre: '',
            subtipo_unidad: '',
            descripcion: '',
            planta: '',
            letra: '',
            area_m2: '',
            num_habitaciones: '',
            num_banos: '',
            capacidad_personas: '',
            renta_base_mensual: '',
            moneda: 'PEN'
        });
    };

    const validarNumeroFormulario = (
        valor: string,
        nombreCampo: string,
        minimo: number,
        opciones: { entero?: boolean; maximo?: number } = {}
    ) => {
        if (!valor.trim()) {
            return null;
        }

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return `${nombreCampo} debe ser un número válido.`;
        }

        if (numero < minimo) {
            return `${nombreCampo} no puede ser menor que ${minimo}.`;
        }

        if (opciones.maximo !== undefined && numero > opciones.maximo) {
            return `${nombreCampo} no puede ser mayor que ${opciones.maximo}.`;
        }

        if (opciones.entero && !Number.isInteger(numero)) {
            return `${nombreCampo} debe ser un número entero.`;
        }

        return null;
    };

    const abrirConfirmacionRegistro = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setMensaje('');
        setError('');

        if (!formData.edificio_id) {
            setError('Debe seleccionar un edificio.');
            return;
        }

        if (!formData.codigo.trim()) {
            setError('El código es obligatorio.');
            return;
        }

        if (!formData.nombre.trim()) {
            setError('El nombre es obligatorio.');
            return;
        }

        if (!formData.planta.trim()) {
            setError('La planta es obligatoria.');
            return;
        }

        if (!formData.letra.trim()) {
            setError('La letra es obligatoria.');
            return;
        }

        if (formData.codigo.trim().length > 30) {
            setError('El código no debe superar los 30 caracteres.');
            return;
        }

        if (formData.letra.trim().length > 20) {
            setError('La letra no debe superar los 20 caracteres.');
            return;
        }

        if (formData.planta.trim().length > 20) {
            setError('La planta no debe superar los 20 caracteres.');
            return;
        }

        if (formData.moneda !== 'PEN' && formData.moneda !== 'USD') {
            setError('La moneda seleccionada no es válida.');
            return;
        }

        const erroresNumericos = [
            validarNumeroFormulario(formData.area_m2, 'El área en m²', 0.01),
            validarNumeroFormulario(formData.num_habitaciones, 'El número de habitaciones', 0, { entero: true, maximo: 100 }),
            validarNumeroFormulario(formData.num_banos, 'El número de baños', 0, { entero: true, maximo: 100 }),
            validarNumeroFormulario(formData.capacidad_personas, 'La capacidad de personas', 0, { entero: true, maximo: 1000 }),
            validarNumeroFormulario(formData.renta_base_mensual, 'La renta base mensual', 0)
        ].filter(Boolean);

        if (erroresNumericos.length > 0) {
            setError(erroresNumericos.join(' '));
            return;
        }

        setMostrarConfirmacion(true);
    };

    const registrarPisoLocal = async () => {
        setMensaje('');
        setError('');
        setMostrarConfirmacion(false);

        const edificioIdSeleccionado = formData.edificio_id;
        const tipoSeleccionado = formData.tipo_inmueble;

        if (!edificioIdSeleccionado) {
            setError('Debe seleccionar un edificio.');
            return;
        }

        if (!formData.codigo.trim()) {
            setError('El código es obligatorio.');
            return;
        }

        if (!formData.nombre.trim()) {
            setError('El nombre es obligatorio.');
            return;
        }

        if (!formData.planta.trim()) {
            setError('La planta es obligatoria.');
            return;
        }

        if (!formData.letra.trim()) {
            setError('La letra es obligatoria.');
            return;
        }

        if (formData.codigo.trim().length > 30) {
            setError('El código no debe superar los 30 caracteres.');
            return;
        }

        if (formData.letra.trim().length > 20) {
            setError('La letra no debe superar los 20 caracteres.');
            return;
        }

        if (formData.planta.trim().length > 20) {
            setError('La planta no debe superar los 20 caracteres.');
            return;
        }

        if (formData.moneda !== 'PEN' && formData.moneda !== 'USD') {
            setError('La moneda seleccionada no es válida.');
            return;
        }

        const erroresNumericos = [
            validarNumeroFormulario(formData.area_m2, 'El área en m²', 0.01),
            validarNumeroFormulario(formData.num_habitaciones, 'El número de habitaciones', 0, { entero: true, maximo: 100 }),
            validarNumeroFormulario(formData.num_banos, 'El número de baños', 0, { entero: true, maximo: 100 }),
            validarNumeroFormulario(formData.capacidad_personas, 'La capacidad de personas', 0, { entero: true, maximo: 1000 }),
            validarNumeroFormulario(formData.renta_base_mensual, 'La renta base mensual', 0)
        ].filter(Boolean);

        if (erroresNumericos.length > 0) {
            setError(erroresNumericos.join(' '));
            return;
        }

        try {
            setGuardando(true);

           const edificioIdSeleccionado = formData.edificio_id;

            console.log('Enviando unidad:', formData);

            const data = await registrarUnidad(formData);

            console.log('Respuesta registrarUnidad:', data);
            setMensaje(data.mensaje || 'Piso/local registrado correctamente.');
            setUnidadDetalle(null);
            console.log('Recargando unidades del edificio:', edificioIdSeleccionado);
            await cargarUnidadesPorEdificio(edificioIdSeleccionado);
            limpiarFormulario(true);
            
            setFormData({
                edificio_id: edificioIdSeleccionado,
                codigo: '',
                tipo_inmueble: tipoSeleccionado,
                nombre: '',
                subtipo_unidad: '',
                descripcion: '',
                planta: '',
                letra: '',
                area_m2: '',
                num_habitaciones: '',
                num_banos: '',
                capacidad_personas: '',
                renta_base_mensual: '',
                moneda: 'PEN'
            });
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Error al registrar piso/local.');
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <section className="gestion-header-card">
                    <h1>Registrar Piso / Local</h1>
                    <p>
                        Registra una unidad individual asociándola obligatoriamente a un edificio.
                    </p>
                </section>

                <section className="gestion-card">
                    <form onSubmit={abrirConfirmacionRegistro}>
                        <h2>Datos de la unidad</h2>

                        {mensaje && (
                            <div className="mensaje-exito">
                                {mensaje}
                            </div>
                        )}

                        {error && (
                            <div className="mensaje-error">
                                {error}
                            </div>
                        )}

                        <div className="gestion-form-grid">
                            <div className="gestion-field">
                                <label>Edificio *</label>
                                <select
                                    name="edificio_id"
                                    value={formData.edificio_id}
                                    onChange={manejarCambio}
                                    disabled={cargandoEdificios || guardando}
                                >
                                    <option value="">
                                        {cargandoEdificios ? 'Cargando edificios...' : 'Seleccione un edificio'}
                                    </option>

                                    {edificios.map((edificio) => (
                                        <option
                                            key={edificio.inmueble_id}
                                            value={edificio.inmueble_id}
                                        >
                                            {edificio.codigo} - {edificio.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="gestion-field">
                                <label>Tipo *</label>
                                <select
                                    name="tipo_inmueble"
                                    value={formData.tipo_inmueble}
                                    onChange={manejarCambio}
                                    disabled={guardando}
                                >
                                    <option value="PISO">Piso</option>
                                    <option value="LOCAL">Local</option>
                                </select>
                            </div>

                            <div className="gestion-field">
                                <label>Código *</label>
                                <input
                                    type="text"
                                    name="codigo"
                                    value={formData.codigo}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: PISO-001"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: Piso 1 - Oficina A"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Subtipo de unidad</label>
                                <input
                                    type="text"
                                    name="subtipo_unidad"
                                    value={formData.subtipo_unidad}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: OFICINA, LOCAL_COMERCIAL"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Planta *</label>
                                <input
                                    type="text"
                                    name="planta"
                                    value={formData.planta}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 1"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Letra *</label>
                                <input
                                    type="text"
                                    name="letra"
                                    value={formData.letra}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: A"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Área m²</label>
                                <input
                                    type="number"
                                    name="area_m2"
                                    value={formData.area_m2}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 120"
                                    min="0"
                                    step="0.01"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Número de habitaciones</label>
                                <input
                                    type="number"
                                    name="num_habitaciones"
                                    value={formData.num_habitaciones}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 3"
                                    min="0"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Número de baños</label>
                                <input
                                    type="number"
                                    name="num_banos"
                                    value={formData.num_banos}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 2"
                                    min="0"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Capacidad de personas</label>
                                <input
                                    type="number"
                                    name="capacidad_personas"
                                    value={formData.capacidad_personas}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 10"
                                    min="0"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Renta base mensual</label>
                                <input
                                    type="number"
                                    name="renta_base_mensual"
                                    value={formData.renta_base_mensual}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 2500"
                                    min="0"
                                    step="0.01"
                                    disabled={guardando}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Moneda</label>
                                <select
                                    name="moneda"
                                    value={formData.moneda}
                                    onChange={manejarCambio}
                                    disabled={guardando}
                                >
                                    <option value="PEN">PEN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div className="gestion-field">
                            <label>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={manejarCambio}
                                placeholder="Describe brevemente el piso o local"
                                rows={4}
                                disabled={guardando}
                            />
                        </div>

                        <div className="gestion-actions">
                            <button
                                type="button"
                                onClick={() => limpiarFormulario()}
                                disabled={guardando}
                                className="btn-reset"
                            >
                                Limpiar
                            </button>

                            <button
                                type="submit"
                                disabled={guardando}
                                className="btn-save"
                            >
                                {guardando ? 'Registrando...' : 'Registrar piso/local'}
                            </button>
                        </div>
                    </form>
                </section>
                {formData.edificio_id && (
                    <section className="gestion-card">
                        <div className="gestion-header-card">
                            <h2>Pisos / Locales registrados</h2>
                            <p>
                                Unidades asociadas al edificio seleccionado.
                            </p>

                            <button
                                type="button"
                                className="btn-reset"
                                onClick={() => cargarUnidadesPorEdificio(formData.edificio_id)}
                                disabled={cargandoUnidades}
                            >
                                {cargandoUnidades ? 'Actualizando...' : 'Actualizar listado'}
                            </button>
                        </div>

                        {cargandoUnidades ? (
                            <p>Cargando pisos/locales...</p>
                        ) : unidades.length === 0 ? (
                            <p>No hay pisos o locales registrados para este edificio.</p>
                        ) : (
                            <div className="tabla-responsive">
                                <table className="gestion-table">
                                    <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Tipo</th>
                                                <th>Nombre</th>
                                                <th>Planta</th>
                                                <th>Letra</th>
                                                <th>Área m²</th>
                                                <th>Renta</th>
                                                <th>Estado</th>
                                                <th>Acción</th>
                                            </tr>
                                    </thead>

                                    <tbody>
                                        {unidades.map((unidad) => (
                                            <tr key={unidad.inmueble_id}>
                                                <td>{unidad.codigo}</td>
                                                <td>{unidad.tipo_inmueble}</td>
                                                <td>{unidad.nombre}</td>
                                                <td>{unidad.planta}</td>
                                                <td>{unidad.letra}</td>
                                                <td>{unidad.area_m2 ?? '-'}</td>
                                                <td>
                                                    {unidad.renta_base_mensual
                                                        ? `${unidad.moneda} ${unidad.renta_base_mensual}`
                                                        : '-'}
                                                </td>
                                                <td>{unidad.estado_operativo}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-reset btn-tabla"
                                                        onClick={() => verDetalleUnidad(unidad.inmueble_id)}
                                                        disabled={cargandoDetalle}
                                                    >
                                                        Ver detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
                {cargandoDetalle && (
                    <section className="gestion-card">
                        <p>Cargando detalle del piso/local...</p>
                    </section>
                )}

                {unidadDetalle && (
                    <section className="gestion-card">
                        <div className="gestion-header-card">
                            <h2>Detalle del piso/local</h2>
                            <p>Información completa de la unidad seleccionada.</p>
                        </div>

                        <div className="gestion-form-grid">
                            <div className="gestion-field">
                                <label>Código</label>
                                <p>{unidadDetalle.codigo}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Tipo</label>
                                <p>{unidadDetalle.tipo_inmueble}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Nombre</label>
                                <p>{unidadDetalle.nombre}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Edificio</label>
                                <p>{unidadDetalle.codigo_edificio} - {unidadDetalle.nombre_edificio}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Planta</label>
                                <p>{unidadDetalle.planta}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Letra</label>
                                <p>{unidadDetalle.letra}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Área m²</label>
                                <p>{unidadDetalle.area_m2 ?? '-'}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Habitaciones</label>
                                <p>{unidadDetalle.num_habitaciones ?? '-'}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Baños</label>
                                <p>{unidadDetalle.num_banos ?? '-'}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Capacidad</label>
                                <p>{unidadDetalle.capacidad_personas ?? '-'}</p>
                            </div>

                            <div className="gestion-field">
                                <label>Renta mensual</label>
                                <p>
                                    {unidadDetalle.renta_base_mensual
                                        ? `${unidadDetalle.moneda} ${unidadDetalle.renta_base_mensual}`
                                        : '-'}
                                </p>
                            </div>

                            <div className="gestion-field">
                                <label>Estado</label>
                                <p>{unidadDetalle.estado_operativo}</p>
                            </div>
                        </div>

                        <div className="gestion-field">
                            <label>Descripción</label>
                            <p>{unidadDetalle.descripcion || '-'}</p>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-reset"
                                onClick={() => setUnidadDetalle(null)}
                            >
                                Cerrar detalle
                            </button>
                        </div>
                    </section>
                )}
                {mostrarConfirmacion && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2>Confirmar registro</h2>

                            <p>
                                ¿Seguro que deseas registrar este{' '}
                                <strong>{formData.tipo_inmueble.toLowerCase()}</strong>?
                            </p>

                            <div className="detalle-confirmacion">
                                <p><strong>Código:</strong> {formData.codigo}</p>
                                <p><strong>Nombre:</strong> {formData.nombre}</p>
                                <p><strong>Planta:</strong> {formData.planta}</p>
                                <p><strong>Letra:</strong> {formData.letra}</p>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-reset"
                                    onClick={() => setMostrarConfirmacion(false)}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn-save"
                                    onClick={registrarPisoLocal}
                                    disabled={guardando}
                                >
                                    {guardando ? 'Registrando...' : 'Confirmar registro'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default GestionUnidad;
