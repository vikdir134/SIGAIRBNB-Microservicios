import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent
} from 'react';

import SidebarGestion from '../components/SidebarGestion';

import {
    obtenerDatosFormularioIngreso,
    listarIngresosAlquiler,
    registrarIngresoAlquiler,
    type CategoriaIngreso,
    type CuentaIngreso,
    type ReciboPendienteIngreso,
    type IngresoAlquiler,
    type RegistrarIngresoPayload
} from '../services/ingresoAlquilerService';

function GestionIngresosAlquiler() {
    const [categorias, setCategorias] = useState<CategoriaIngreso[]>([]);
    const [cuentas, setCuentas] = useState<CuentaIngreso[]>([]);
    const [recibosPendientes, setRecibosPendientes] = useState<ReciboPendienteIngreso[]>([]);
    const [ingresos, setIngresos] = useState<IngresoAlquiler[]>([]);

    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const [formulario, setFormulario] = useState({
        cuenta_bancaria_id: '',
        categoria_movimiento_id: '',
        recibo_id: '',
        importe: '',
        metodo_pago: 'TRANSFERENCIA',
        referencia_externa: '',
        observaciones: ''
    });

    const reciboSeleccionado = useMemo(() => {
        if (!formulario.recibo_id) return null;

        return (
            recibosPendientes.find(
                (recibo) => recibo.recibo_id === Number(formulario.recibo_id)
            ) || null
        );
    }, [formulario.recibo_id, recibosPendientes]);

    const formatearMoneda = (valor?: number | string | null, moneda = 'PEN') => {
        const numero = Number(valor || 0);

        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: moneda || 'PEN'
        }).format(numero);
    };

    const formatearFecha = (fecha?: string | null) => {
        if (!fecha) return '-';

        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const obtenerNombreInquilino = (
        nombres?: string | null,
        apellidos?: string | null
    ) => {
        const nombreCompleto = `${nombres || ''} ${apellidos || ''}`.trim();

        return nombreCompleto || 'Inquilino sin perfil';
    };

    const obtenerCategoriaAlquiler = (categoriasData: CategoriaIngreso[]) => {
        return (
            categoriasData.find((categoria) =>
                categoria.nombre.toLowerCase().includes('alquiler')
            ) || categoriasData[0]
        );
    };

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            const [datosFormulario, ingresosData] = await Promise.all([
                obtenerDatosFormularioIngreso(),
                listarIngresosAlquiler()
            ]);

            const cuentaPrincipal = datosFormulario.cuentas[0];
            const categoriaAlquiler = obtenerCategoriaAlquiler(datosFormulario.categorias);

            setCategorias(datosFormulario.categorias);
            setCuentas(datosFormulario.cuentas);
            setRecibosPendientes(datosFormulario.recibos_pendientes);
            setIngresos(ingresosData);

            setFormulario((prev) => ({
                ...prev,
                cuenta_bancaria_id:
                    prev.cuenta_bancaria_id ||
                    String(cuentaPrincipal?.cuenta_bancaria_id || ''),
                categoria_movimiento_id:
                    prev.categoria_movimiento_id ||
                    String(categoriaAlquiler?.categoria_movimiento_id || '')
            }));
        } catch (error: any) {
            setError(error.message || 'No se pudieron cargar los datos de ingresos.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const manejarCambio = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        if (name === 'recibo_id') {
            const recibo = recibosPendientes.find(
                (item) => item.recibo_id === Number(value)
            );

            setFormulario((prev) => ({
                ...prev,
                recibo_id: value,
                importe: recibo ? String(recibo.saldo_pendiente || recibo.total || '') : ''
            }));

            return;
        }

        setFormulario((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const limpiarFormulario = () => {
        setFormulario((prev) => ({
            ...prev,
            recibo_id: '',
            importe: '',
            metodo_pago: 'TRANSFERENCIA',
            referencia_externa: '',
            observaciones: ''
        }));
    };

    const registrarIngreso = async (event: FormEvent) => {
        event.preventDefault();

        try {
            setGuardando(true);
            setError(null);
            setMensaje(null);

            if (!formulario.cuenta_bancaria_id) {
                throw new Error('No se encontró una caja principal para registrar el ingreso.');
            }

            if (!formulario.categoria_movimiento_id) {
                throw new Error('No se encontró la categoría de ingreso por alquiler.');
            }

            if (!formulario.recibo_id) {
                throw new Error('Selecciona un recibo pendiente.');
            }

            const importe = Number(formulario.importe);

            if (!Number.isFinite(importe) || importe <= 0) {
                throw new Error('El importe debe ser un número válido mayor a cero.');
            }

            if (
                reciboSeleccionado &&
                importe > Number(reciboSeleccionado.saldo_pendiente)
            ) {
                throw new Error('El importe no puede superar el saldo pendiente del recibo.');
            }

            if (formulario.referencia_externa.trim().length > 100) {
                throw new Error('La referencia externa no debe superar los 100 caracteres.');
            }

            if (formulario.observaciones.trim().length > 500) {
                throw new Error('Las observaciones no deben superar los 500 caracteres.');
            }

            const payload: RegistrarIngresoPayload = {
                cuenta_bancaria_id: Number(formulario.cuenta_bancaria_id),
                categoria_movimiento_id: Number(formulario.categoria_movimiento_id),
                recibo_id: Number(formulario.recibo_id),
                importe,
                metodo_pago: formulario.metodo_pago as RegistrarIngresoPayload['metodo_pago'],
                referencia_externa: formulario.referencia_externa.trim() || undefined,
                observaciones: formulario.observaciones.trim() || undefined
            };

            await registrarIngresoAlquiler(payload);

            setMensaje('Cobro registrado correctamente.');
            limpiarFormulario();
            await cargarDatos();
        } catch (error: any) {
            setError(error.message || 'No se pudo registrar el cobro.');
        } finally {
            setGuardando(false);
        }
    };

    const totalCobrado = ingresos.reduce(
        (total, ingreso) => total + Number(ingreso.importe || ingreso.monto || 0),
        0
    );

    const totalPendiente = recibosPendientes.reduce(
        (total, recibo) => total + Number(recibo.saldo_pendiente || 0),
        0
    );

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main ingresos-alquiler-page">
                <div className="gestion-header-card">
                    <div className="section-title-row">
                        <div>
                            <h1>Registro de Ingresos de Alquiler</h1>
                            <p>
                                Registra cobros manuales y consulta todos los ingresos de alquiler
                                confirmados, incluyendo los pagos realizados por el inquilino.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="gestion-refresh-btn"
                            onClick={cargarDatos}
                            disabled={cargando}
                        >
                            {cargando ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                {error && <div className="mensaje-error">{error}</div>}
                {mensaje && <div className="mensaje-exito">{mensaje}</div>}

                <div className="ingresos-resumen-grid">
                    <div className="dashboard-card">
                        <h3>Cobros registrados</h3>
                        <p>{ingresos.length}</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Total cobrado</h3>
                        <p>{formatearMoneda(totalCobrado)}</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Recibos pendientes</h3>
                        <p>{recibosPendientes.length}</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Pendiente por cobrar</h3>
                        <p>{formatearMoneda(totalPendiente)}</p>
                    </div>
                </div>

                <div className="mantenimiento-grid">
                    <section className="gestion-card">
                        <div className="section-title-row">
                            <div>
                                <h2>Registrar cobro manual</h2>
                                <p>
                                    Usa este formulario cuando el cobro no fue realizado desde
                                    el pago online del inquilino.
                                </p>
                            </div>
                        </div>

                        <form className="gestion-form" onSubmit={registrarIngreso}>
                            <div className="form-grid">
                                <div>
                                    <label>Recibo pendiente</label>
                                    <select
                                        name="recibo_id"
                                        value={formulario.recibo_id}
                                        onChange={manejarCambio}
                                        disabled={guardando}
                                    >
                                        <option value="">Selecciona un recibo</option>
                                        {recibosPendientes.map((recibo) => (
                                            <option key={recibo.recibo_id} value={recibo.recibo_id}>
                                                #{recibo.recibo_id} - {recibo.nombre_inmueble} -{' '}
                                                {obtenerNombreInquilino(
                                                    recibo.nombres_inquilino,
                                                    recibo.apellidos_inquilino
                                                )}{' '}
                                                - Pendiente:{' '}
                                                {formatearMoneda(
                                                    recibo.saldo_pendiente,
                                                    recibo.moneda
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Importe cobrado</label>
                                    <input
                                        type="number"
                                        name="importe"
                                        min="0"
                                        step="0.01"
                                        value={formulario.importe}
                                        onChange={manejarCambio}
                                        disabled={guardando}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label>Forma de cobro</label>
                                    <select
                                        name="metodo_pago"
                                        value={formulario.metodo_pago}
                                        onChange={manejarCambio}
                                        disabled={guardando}
                                    >
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TARJETA">Tarjeta</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Referencia / operación</label>
                                    <input
                                        type="text"
                                        name="referencia_externa"
                                        value={formulario.referencia_externa}
                                        onChange={manejarCambio}
                                        disabled={guardando}
                                        placeholder="Ej. OP-123456"
                                    />
                                </div>

                                <div>
                                    <label>Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        value={formulario.observaciones}
                                        onChange={manejarCambio}
                                        disabled={guardando}
                                        placeholder="Detalle adicional del cobro..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {reciboSeleccionado && (
                                <div className="detalle-confirmacion">
                                    <p>
                                        <strong>Recibo:</strong> #{reciboSeleccionado.recibo_id}
                                    </p>

                                    <p>
                                        <strong>Inmueble:</strong>{' '}
                                        {reciboSeleccionado.codigo_inmueble} -{' '}
                                        {reciboSeleccionado.nombre_inmueble}
                                    </p>

                                    <p>
                                        <strong>Inquilino:</strong>{' '}
                                        {obtenerNombreInquilino(
                                            reciboSeleccionado.nombres_inquilino,
                                            reciboSeleccionado.apellidos_inquilino
                                        )}
                                    </p>

                                    <p>
                                        <strong>Monto pendiente:</strong>{' '}
                                        {formatearMoneda(
                                            reciboSeleccionado.saldo_pendiente,
                                            reciboSeleccionado.moneda
                                        )}
                                    </p>

                                    <p>
                                        <strong>Vencimiento:</strong>{' '}
                                        {formatearFecha(reciboSeleccionado.fecha_vencimiento)}
                                    </p>
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={limpiarFormulario}
                                    disabled={guardando}
                                >
                                    Limpiar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-gestion-primary"
                                    disabled={guardando || cuentas.length === 0 || categorias.length === 0}
                                >
                                    {guardando ? 'Registrando...' : 'Registrar cobro'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="gestion-card">
                        <div className="section-title-row">
                            <div>
                                <h2>Recibos pendientes</h2>
                                <p>Recibos emitidos que aún tienen monto por cobrar.</p>
                            </div>
                        </div>

                        <div className="tabla-responsive">
                            <table className="gestion-table">
                                <thead>
                                    <tr>
                                        <th>Recibo</th>
                                        <th>Inmueble</th>
                                        <th>Inquilino</th>
                                        <th>Pendiente</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recibosPendientes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="empty-row">
                                                No hay recibos pendientes.
                                            </td>
                                        </tr>
                                    ) : (
                                        recibosPendientes.map((recibo) => (
                                            <tr key={recibo.recibo_id}>
                                                <td>#{recibo.recibo_id}</td>

                                                <td>
                                                    <strong>{recibo.nombre_inmueble}</strong>
                                                    <br />
                                                    <small>{recibo.codigo_inmueble}</small>
                                                </td>

                                                <td>
                                                    {obtenerNombreInquilino(
                                                        recibo.nombres_inquilino,
                                                        recibo.apellidos_inquilino
                                                    )}
                                                </td>

                                                <td>
                                                    {formatearMoneda(
                                                        recibo.saldo_pendiente,
                                                        recibo.moneda
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="badge estado-solicitada">
                                                        {recibo.estado_recibo}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <section className="gestion-card">
                    <div className="section-title-row">
                        <div>
                            <h2>Cobros registrados</h2>
                            <p>
                                Historial general de cobros confirmados: pagos online y cobros manuales.
                            </p>
                        </div>
                    </div>

                    <div className="tabla-responsive">
                        <table className="gestion-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Inmueble</th>
                                    <th>Inquilino</th>
                                    <th>Forma</th>
                                    <th>Importe</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ingresos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="empty-row">
                                            Todavía no hay cobros registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    ingresos.map((ingreso) => {
                                        const referencia =
                                            ingreso.referencia_externa || ingreso.referencia;

                                        return (
                                            <tr
                                                key={
                                                    ingreso.pago_id ||
                                                    ingreso.movimiento_bancario_id ||
                                                    `${ingreso.recibo_id}-${ingreso.fecha_pago}`
                                                }
                                            >
                                                <td>
                                                    {formatearFecha(
                                                        ingreso.fecha_pago || ingreso.fecha_movimiento
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>
                                                        {ingreso.concepto ||
                                                            `Cobro de alquiler - Recibo #${ingreso.recibo_id}`}
                                                    </strong>

                                                    {referencia && (
                                                        <>
                                                            <br />
                                                            <small>Ref: {referencia}</small>
                                                        </>
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>{ingreso.inmueble || '-'}</strong>
                                                    {ingreso.codigo_inmueble && (
                                                        <>
                                                            <br />
                                                            <small>{ingreso.codigo_inmueble}</small>
                                                        </>
                                                    )}
                                                </td>

                                                <td>
                                                    {obtenerNombreInquilino(
                                                        ingreso.nombres_inquilino,
                                                        ingreso.apellidos_inquilino
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="badge badge-system">
                                                        {ingreso.metodo_pago || '-'}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatearMoneda(ingreso.importe, ingreso.moneda)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default GestionIngresosAlquiler;
