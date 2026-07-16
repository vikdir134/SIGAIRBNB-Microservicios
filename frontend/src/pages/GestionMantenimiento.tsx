import { useEffect, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';

import {
    listarInmueblesMantenimiento,
    darBajaInmueble,
    actualizarInmuebleMantenimiento,
    listarCatalogoCaracteristicas,
    obtenerCaracteristicasInmueble,
    actualizarCaracteristicasInmueble,
    type InmuebleMantenimiento,
    type CaracteristicaCatalogo,
    type CaracteristicaInmueble
} from '../services/edificioService';

import {
    obtenerDatosFormularioGasto,
    listarGastosMantenimiento,
    registrarGastoMantenimiento,
    type CategoriaGasto,
    type CuentaMantenimiento,
    type InmuebleGasto,
    type GastoMantenimiento,
    type RegistrarGastoForm
} from '../services/mantenimientoService';
import { isDateNotAbsurd } from '../utils/dateValidators';

const obtenerFechaActualInput = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
};

function GestionMantenimiento() {
    const [inmuebles, setInmuebles] = useState<InmuebleMantenimiento[]>([]);
    const [inmuebleSeleccionado, setInmuebleSeleccionado] = useState<InmuebleMantenimiento | null>(null);

    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [formEdicion, setFormEdicion] = useState<any>(null);
    const [catalogoCaracteristicas, setCatalogoCaracteristicas] = useState<CaracteristicaCatalogo[]>([]);
    const [caracteristicasForm, setCaracteristicasForm] = useState<CaracteristicaInmueble[]>([]);
    const [mostrarConfirmacionBaja, setMostrarConfirmacionBaja] = useState(false);

    const [categoriasGasto, setCategoriasGasto] = useState<CategoriaGasto[]>([]);
    const [cuentasMantenimiento, setCuentasMantenimiento] = useState<CuentaMantenimiento[]>([]);
    const [inmueblesFormularioGasto, setInmueblesFormularioGasto] = useState<InmuebleGasto[]>([]);
    const [gastosMantenimiento, setGastosMantenimiento] = useState<GastoMantenimiento[]>([]);
    const [cargandoGastos, setCargandoGastos] = useState(false);

    const [guardandoGasto, setGuardandoGasto] = useState(false);

    const [formGasto, setFormGasto] = useState<RegistrarGastoForm>({
        cuenta_bancaria_id: 0,
        categoria_movimiento_id: 0,
        inmueble_id: null,
        fecha_movimiento: obtenerFechaActualInput(),
        concepto: '',
        descripcion: '',
        importe: 0,
        referencia_externa: '',
        observaciones: ''
    });

    const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoMantenimiento | null>(null);

    const [filtroTextoGasto, setFiltroTextoGasto] = useState('');
    const [filtroCategoriaGasto, setFiltroCategoriaGasto] = useState('');
    const [filtroInmuebleGasto, setFiltroInmuebleGasto] = useState('');

    const cargarInmuebles = async () => {
        try {
            setCargando(true);
            setError('');
            setMensaje('');

            const data = await listarInmueblesMantenimiento();
            setInmuebles(data.inmuebles || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar inmuebles');
        } finally {
            setCargando(false);
        }
    };

    const cargarDatosGastosMantenimiento = async () => {
        try {
            setCargandoGastos(true);
            setError('');

            const [formularioData, gastosData] = await Promise.all([
                obtenerDatosFormularioGasto(),
                listarGastosMantenimiento()
            ]);

            setCategoriasGasto(formularioData.categorias || []);
            setCuentasMantenimiento(formularioData.cuentas || []);
            setInmueblesFormularioGasto(formularioData.inmuebles || []);
            setGastosMantenimiento(gastosData.gastos || []);

            setFormGasto((prev) => ({
                ...prev,
                cuenta_bancaria_id:
                    prev.cuenta_bancaria_id ||
                    formularioData.cuentas?.[0]?.cuenta_bancaria_id ||
                    0,
                categoria_movimiento_id:
                    prev.categoria_movimiento_id ||
                    formularioData.categorias?.[0]?.categoria_movimiento_id ||
                    0
            }));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar datos de gastos de mantenimiento'
            );
        } finally {
            setCargandoGastos(false);
        }
    };

    useEffect(() => {
        cargarInmuebles();
        cargarDatosGastosMantenimiento();
    }, []);

    const seleccionarInmueble = (inmueble: InmuebleMantenimiento) => {
        setInmuebleSeleccionado(inmueble);
        setMensaje('');
        setError('');
    };

    const abrirEdicion = async () => {
        if (!inmuebleSeleccionado) return;

        setFormEdicion({
            nombre: inmuebleSeleccionado.nombre || '',
            descripcion: inmuebleSeleccionado.descripcion || '',
            direccion_linea1: inmuebleSeleccionado.direccion_linea1 || '',
            direccion_linea2: inmuebleSeleccionado.direccion_linea2 || '',
            numero: inmuebleSeleccionado.numero || '',
            distrito: inmuebleSeleccionado.distrito || '',
            ciudad: inmuebleSeleccionado.ciudad || '',
            provincia: inmuebleSeleccionado.provincia || '',
            departamento: inmuebleSeleccionado.departamento || '',
            codigo_postal: inmuebleSeleccionado.codigo_postal || '',
            pais: inmuebleSeleccionado.pais || 'Perú',
            subtipo_unidad: inmuebleSeleccionado.subtipo_unidad || '',
            planta: inmuebleSeleccionado.planta || '',
            letra: inmuebleSeleccionado.letra || '',
            area_m2: inmuebleSeleccionado.area_m2 || '',
            num_habitaciones: inmuebleSeleccionado.num_habitaciones || '',
            num_banos: inmuebleSeleccionado.num_banos || '',
            capacidad_personas: inmuebleSeleccionado.capacidad_personas || '',
            renta_base_mensual: inmuebleSeleccionado.renta_base_mensual || '',
            moneda: inmuebleSeleccionado.moneda || 'PEN',
            latitud: inmuebleSeleccionado.latitud || '',
            longitud: inmuebleSeleccionado.longitud || '',
            estado_operativo: inmuebleSeleccionado.estado_operativo || 'DISPONIBLE',
            es_publicable: inmuebleSeleccionado.es_publicable
        });

        try {
            setCargando(true);
            setError('');

            const catalogoData = await listarCatalogoCaracteristicas();
            const caracteristicasData = await obtenerCaracteristicasInmueble(inmuebleSeleccionado.inmueble_id);

            setCatalogoCaracteristicas(catalogoData.caracteristicas || []);
            setCaracteristicasForm(caracteristicasData.caracteristicas || []);

            setModoEdicion(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar características');
        } finally {
            setCargando(false);
        }
    };

    const guardarEdicion = async () => {
        if (!inmuebleSeleccionado || !formEdicion) return;

        try {
            setCargando(true);
            setError('');
            setMensaje('');

            await actualizarInmuebleMantenimiento(
                inmuebleSeleccionado.inmueble_id,
                formEdicion
            );

            await actualizarCaracteristicasInmueble(
                inmuebleSeleccionado.inmueble_id,
                caracteristicasForm
            );

            setMensaje('Inmueble actualizado correctamente');
            setModoEdicion(false);
            setFormEdicion(null);
            setInmuebleSeleccionado(null);

            await cargarInmuebles();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar inmueble');
        } finally {
            setCargando(false);
        }
    };

    const cambiarCaracteristica = (
        caracteristica: CaracteristicaCatalogo,
        valor: string | number | boolean
    ) => {
        const existentes = caracteristicasForm.filter(
            (item) => item.caracteristica_id !== caracteristica.caracteristica_id
        );

        const nuevaCaracteristica: CaracteristicaInmueble = {
            caracteristica_id: caracteristica.caracteristica_id
        };

        if (caracteristica.tipo_dato === 'BOOLEAN') {
            nuevaCaracteristica.valor_boolean = Boolean(valor);
        }

        if (caracteristica.tipo_dato === 'TEXTO') {
            nuevaCaracteristica.valor_texto = String(valor);
        }

        if (caracteristica.tipo_dato === 'NUMERO') {
            nuevaCaracteristica.valor_numero = valor === '' ? null : Number(valor);
        }

        setCaracteristicasForm([...existentes, nuevaCaracteristica]);
    };

    const confirmarBaja = async () => {
        if (!inmuebleSeleccionado) return;

        try {
            setCargando(true);
            setError('');
            setMensaje('');

            await darBajaInmueble(inmuebleSeleccionado.inmueble_id);

            setMensaje('Inmueble dado de baja correctamente');
            setMostrarConfirmacionBaja(false);
            setInmuebleSeleccionado(null);

            await cargarInmuebles();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al dar de baja inmueble');
        } finally {
            setCargando(false);
        }
    };

    const limpiarFormularioGasto = () => {
        setFormGasto({
            cuenta_bancaria_id:
                cuentasMantenimiento[0]?.cuenta_bancaria_id || 0,
            categoria_movimiento_id:
                categoriasGasto[0]?.categoria_movimiento_id || 0,
            inmueble_id: null,
            fecha_movimiento: obtenerFechaActualInput(),
            concepto: '',
            descripcion: '',
            importe: 0,
            referencia_externa: '',
            observaciones: ''
        });
    };

    const registrarNuevoGasto = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setGuardandoGasto(true);
            setError('');
            setMensaje('');

            if (!formGasto.cuenta_bancaria_id) {
                setError('Selecciona una cuenta para registrar el gasto.');
                return;
            }

            if (!formGasto.categoria_movimiento_id) {
                setError('Selecciona una categoría de gasto.');
                return;
            }

            if (!formGasto.concepto.trim()) {
                setError('Ingresa el concepto del gasto.');
                return;
            }

            const importe = Number(formGasto.importe);
            const fechaMovimiento = formGasto.fecha_movimiento.slice(0, 10);

            if (!Number.isFinite(importe) || importe <= 0) {
                setError('El importe debe ser un número válido mayor a cero.');
                return;
            }

            if (!isDateNotAbsurd(fechaMovimiento, { minYear: 2000, maxFutureYears: 1 })) {
                setError('La fecha del movimiento está fuera del rango permitido.');
                return;
            }

            if (formGasto.concepto.trim().length > 150) {
                setError('El concepto no debe superar los 150 caracteres.');
                return;
            }

            if ((formGasto.referencia_externa || '').trim().length > 100) {
                setError('La referencia externa no debe superar los 100 caracteres.');
                return;
            }

            if ((formGasto.descripcion || '').trim().length > 500) {
                setError('La descripción no debe superar los 500 caracteres.');
                return;
            }

            if ((formGasto.observaciones || '').trim().length > 500) {
                setError('Las observaciones no deben superar los 500 caracteres.');
                return;
            }

            await registrarGastoMantenimiento({
                ...formGasto,
                cuenta_bancaria_id: Number(formGasto.cuenta_bancaria_id),
                categoria_movimiento_id: Number(formGasto.categoria_movimiento_id),
                inmueble_id: formGasto.inmueble_id
                    ? Number(formGasto.inmueble_id)
                    : null,
                importe
            });

            setMensaje('Gasto de mantenimiento registrado correctamente.');
            limpiarFormularioGasto();

            await cargarDatosGastosMantenimiento();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al registrar el gasto de mantenimiento'
            );
        } finally {
            setGuardandoGasto(false);
        }
    };

    const formatearFechaGasto = (fecha: string) => {
        if (!fecha) return '-';

        const fechaObj = new Date(fecha);

        if (Number.isNaN(fechaObj.getTime())) {
            return '-';
        }

        return fechaObj.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatearMonto = (
        monto: number,
        moneda: string = 'PEN'
    ) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: moneda
        }).format(Number(monto || 0));
    };

    const totalGastosMantenimiento = gastosMantenimiento.reduce(
        (total, gasto) => total + Number(gasto.importe || 0),
        0
    );

    const gastosFiltrados = gastosMantenimiento.filter((gasto) => {
        const texto = filtroTextoGasto.trim().toLowerCase();

        const coincideTexto =
            !texto ||
            gasto.concepto.toLowerCase().includes(texto) ||
            (gasto.categoria || '').toLowerCase().includes(texto) ||
            (gasto.inmueble || '').toLowerCase().includes(texto) ||
            (gasto.referencia_externa || '').toLowerCase().includes(texto);

        const coincideCategoria =
            !filtroCategoriaGasto ||
            String(gasto.categoria_movimiento_id) === filtroCategoriaGasto;

        const coincideInmueble =
            !filtroInmuebleGasto ||
            String(gasto.inmueble_id || '') === filtroInmuebleGasto;

        return coincideTexto && coincideCategoria && coincideInmueble;
    });

    const totalGastosFiltrados = gastosFiltrados.reduce(
        (total, gasto) => total + Number(gasto.importe || 0),
        0
    );

    const limpiarFiltrosGasto = () => {
        setFiltroTextoGasto('');
        setFiltroCategoriaGasto('');
        setFiltroInmuebleGasto('');
    };

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <section className="gestion-header-card">
                    <h1>Mantenimiento de Datos</h1>
                    <p>
                        Modifica o da de baja inmuebles registrados para mantener actualizada
                        la oferta disponible de la empresa.
                    </p>
                </section>

                {mensaje && <div className="alert-success">{mensaje}</div>}
                {error && <div className="alert-error">{error}</div>}

                <section className="mantenimiento-grid">
                    <div className="gestion-card">
                        <div className="section-title-row">
                            <div>
                                <h2>Inmuebles registrados</h2>
                                <p>Selecciona un edificio, piso o local para gestionarlo.</p>
                            </div>

                            <button
                                type="button"
                                className="btn-gestion-secondary"
                                onClick={cargarInmuebles}
                                disabled={cargando}
                            >
                                Actualizar
                            </button>
                        </div>

                        {cargando && <p>Cargando inmuebles...</p>}

                        {!cargando && inmuebles.length === 0 && (
                            <p>No hay inmuebles registrados.</p>
                        )}

                        <div className="mantenimiento-lista">
                            {inmuebles.map((inmueble) => (
                                <button
                                    key={inmueble.inmueble_id}
                                    type="button"
                                    className={
                                        inmuebleSeleccionado?.inmueble_id === inmueble.inmueble_id
                                            ? 'inmueble-item activo'
                                            : 'inmueble-item'
                                    }
                                    onClick={() => seleccionarInmueble(inmueble)}
                                >
                                    <div>
                                        <strong>{inmueble.codigo} - {inmueble.nombre}</strong>
                                        <span>
                                            {inmueble.tipo_inmueble}
                                            {inmueble.nombre_edificio
                                                ? ` · ${inmueble.nombre_edificio}`
                                                : ''}
                                        </span>
                                    </div>

                                    <span className={
                                        inmueble.estado_operativo === 'DISPONIBLE'
                                            ? 'estado-pill disponible'
                                            : 'estado-pill'
                                    }>
                                        {inmueble.estado_operativo}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="gestion-card">
                        <h2>Detalle del inmueble</h2>

                        {!inmuebleSeleccionado && (
                            <p>Selecciona un inmueble para ver sus datos.</p>
                        )}

                        {inmuebleSeleccionado && (
                            <div className="mantenimiento-detalle-inmueble">
                                <div className="mantenimiento-detalle-header">
                                    <div>
                                        <h3>{inmuebleSeleccionado.nombre}</h3>
                                        <p>{inmuebleSeleccionado.codigo}</p>
                                    </div>

                                    <span className="tipo-pill">
                                        {inmuebleSeleccionado.tipo_inmueble}
                                    </span>
                                </div>

                                <div className="mantenimiento-detalle-datos">
                                    <p><strong>Estado:</strong> {inmuebleSeleccionado.estado_operativo}</p>
                                    <p><strong>Dirección:</strong> {inmuebleSeleccionado.direccion_linea1 || '-'}</p>
                                    <p><strong>Número:</strong> {inmuebleSeleccionado.numero || '-'}</p>
                                    <p><strong>Distrito:</strong> {inmuebleSeleccionado.distrito || '-'}</p>
                                    <p><strong>Ciudad:</strong> {inmuebleSeleccionado.ciudad || '-'}</p>
                                    <p><strong>Área:</strong> {inmuebleSeleccionado.area_m2 || '-'} m²</p>

                                    {inmuebleSeleccionado.tipo_inmueble !== 'EDIFICIO' && (
                                        <>
                                            <p><strong>Edificio:</strong> {inmuebleSeleccionado.nombre_edificio || '-'}</p>
                                            <p><strong>Planta:</strong> {inmuebleSeleccionado.planta || '-'}</p>
                                            <p><strong>Letra:</strong> {inmuebleSeleccionado.letra || '-'}</p>
                                            <p><strong>Renta:</strong> {inmuebleSeleccionado.moneda || 'PEN'} {inmuebleSeleccionado.renta_base_mensual || '-'}</p>
                                        </>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-gestion-primary"
                                        onClick={abrirEdicion}
                                    >
                                        Editar datos
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => setMostrarConfirmacionBaja(true)}
                                        disabled={cargando}
                                    >
                                        Dar de baja
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="gestion-card">
                    <div className="section-title-row">
                        <div>
                            <h2>Gastos de mantenimiento</h2>
                            <p>
                                Registro financiero interno de reparaciones, servicios técnicos
                                y otros gastos asociados a inmuebles.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-gestion-secondary"
                            onClick={cargarDatosGastosMantenimiento}
                            disabled={cargandoGastos}
                        >
                            Actualizar gastos
                        </button>
                    </div>

                    <form className="gestion-form" onSubmit={registrarNuevoGasto}>
                        <div className="gestion-form-grid">
                            <div className="gestion-field">
                                <label>Cuenta</label>
                                <select
                                    value={formGasto.cuenta_bancaria_id}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            cuenta_bancaria_id: Number(e.target.value)
                                        })
                                    }
                                    disabled={guardandoGasto}
                                >
                                    <option value={0}>Selecciona una cuenta</option>
                                    {cuentasMantenimiento.map((cuenta) => (
                                        <option
                                            key={cuenta.cuenta_bancaria_id}
                                            value={cuenta.cuenta_bancaria_id}
                                        >
                                            {cuenta.nombre_cuenta} - {cuenta.moneda}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="gestion-field">
                                <label>Categoría</label>
                                <select
                                    value={formGasto.categoria_movimiento_id}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            categoria_movimiento_id: Number(e.target.value)
                                        })
                                    }
                                    disabled={guardandoGasto}
                                >
                                    <option value={0}>Selecciona una categoría</option>
                                    {categoriasGasto.map((categoria) => (
                                        <option
                                            key={categoria.categoria_movimiento_id}
                                            value={categoria.categoria_movimiento_id}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="gestion-field">
                                <label>Inmueble asociado</label>
                                <select
                                    value={formGasto.inmueble_id || ''}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            inmueble_id: e.target.value
                                                ? Number(e.target.value)
                                                : null
                                        })
                                    }
                                    disabled={guardandoGasto}
                                    className={!formGasto.inmueble_id ? 'select-placeholder' : ''}
                                >
                                    <option value="" disabled hidden>
                                        Selecciona un inmueble asociado
                                    </option>

                                    {inmueblesFormularioGasto.map((inmueble) => (
                                        <option
                                            key={inmueble.inmueble_id}
                                            value={inmueble.inmueble_id}
                                        >
                                            {inmueble.codigo} - {inmueble.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="gestion-field">
                                <label>Fecha del gasto</label>
                                <input
                                    type="datetime-local"
                                    value={formGasto.fecha_movimiento}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            fecha_movimiento: e.target.value
                                        })
                                    }
                                    disabled={guardandoGasto}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Concepto</label>
                                <input
                                    value={formGasto.concepto}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            concepto: e.target.value
                                        })
                                    }
                                    placeholder="Ej: Reparación de tubería"
                                    disabled={guardandoGasto}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Importe</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formGasto.importe}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            importe: Number(e.target.value)
                                        })
                                    }
                                    disabled={guardandoGasto}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Referencia externa</label>
                                <input
                                    value={formGasto.referencia_externa || ''}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            referencia_externa: e.target.value
                                        })
                                    }
                                    placeholder="Ej: BOLETA-001"
                                    disabled={guardandoGasto}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Descripción</label>
                                <textarea
                                    value={formGasto.descripcion || ''}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            descripcion: e.target.value
                                        })
                                    }
                                    placeholder="Describe brevemente el servicio o reparación."
                                    disabled={guardandoGasto}
                                />
                            </div>

                            <div className="gestion-field">
                                <label>Observaciones</label>
                                <textarea
                                    value={formGasto.observaciones || ''}
                                    onChange={(e) =>
                                        setFormGasto({
                                            ...formGasto,
                                            observaciones: e.target.value
                                        })
                                    }
                                    placeholder="Notas internas adicionales."
                                    disabled={guardandoGasto}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-gestion-primary"
                                disabled={guardandoGasto}
                            >
                                {guardandoGasto ? 'Registrando...' : 'Registrar gasto'}
                            </button>

                            <button
                                type="button"
                                className="btn-gestion-secondary"
                                onClick={limpiarFormularioGasto}
                                disabled={guardandoGasto}
                            >
                                Limpiar
                            </button>
                        </div>
                    </form>

                    {cargandoGastos && <p>Cargando gastos de mantenimiento...</p>}

                    {!cargandoGastos && (
                        <>
                            <div className="dashboard-grid">
                                <div className="dashboard-card">
                                    <h3>Categorías</h3>
                                    <p>{categoriasGasto.length} disponibles</p>
                                </div>

                                <div className="dashboard-card">
                                    <h3>Cuentas</h3>
                                    <p>{cuentasMantenimiento.length} disponibles</p>
                                </div>

                                <div className="dashboard-card">
                                    <h3>Gastos registrados</h3>
                                    <p>{gastosMantenimiento.length} movimientos</p>
                                    <strong>
                                        {formatearMonto(totalGastosMantenimiento)}
                                    </strong>
                                </div>
                            </div>

                            <div className="gestion-filter-card">
                                <div>
                                    <label>Buscar gasto</label>
                                    <input
                                        value={filtroTextoGasto}
                                        onChange={(e) => setFiltroTextoGasto(e.target.value)}
                                        placeholder="Buscar por concepto, referencia, categoría o inmueble"
                                    />
                                </div>

                                <div>
                                    <label>Categoría</label>
                                    <select
                                        value={filtroCategoriaGasto}
                                        onChange={(e) => setFiltroCategoriaGasto(e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {categoriasGasto.map((categoria) => (
                                            <option
                                                key={categoria.categoria_movimiento_id}
                                                value={categoria.categoria_movimiento_id}
                                            >
                                                {categoria.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Inmueble</label>
                                    <select
                                        value={filtroInmuebleGasto}
                                        onChange={(e) => setFiltroInmuebleGasto(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {inmueblesFormularioGasto.map((inmueble) => (
                                            <option
                                                key={inmueble.inmueble_id}
                                                value={inmueble.inmueble_id}
                                            >
                                                {inmueble.codigo} - {inmueble.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <p>
                                        <strong>{gastosFiltrados.length}</strong> resultado(s)
                                    </p>
                                    <p>
                                        Total filtrado:{' '}
                                        <strong>{formatearMonto(totalGastosFiltrados)}</strong>
                                    </p>

                                    <button
                                        type="button"
                                        className="btn-gestion-secondary"
                                        onClick={limpiarFiltrosGasto}
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>

                            <div className="tabla-responsive">
                                <table className="gestion-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Concepto</th>
                                            <th>Categoría</th>
                                            <th>Inmueble</th>
                                            <th>Importe</th>
                                            <th>Referencia</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {gastosFiltrados.length === 0 && (
                                            <tr>
                                                <td colSpan={7}>
                                                    No hay gastos de mantenimiento registrados.
                                                </td>
                                            </tr>
                                        )}

                                        {gastosFiltrados.map((gasto) => (
                                            <tr key={gasto.movimiento_bancario_id}>
                                                <td>
                                                    {formatearFechaGasto(gasto.fecha_movimiento)}
                                                </td>
                                                <td>{gasto.concepto}</td>
                                                <td>{gasto.categoria || '-'}</td>
                                                <td>
                                                    {gasto.inmueble
                                                        ? `${gasto.codigo_inmueble || ''} ${gasto.inmueble}`
                                                        : 'Sin inmueble asociado'}
                                                </td>
                                                <td>
                                                    {formatearMonto(
                                                        Number(gasto.importe),
                                                        gasto.moneda || 'PEN'
                                                    )}
                                                </td>
                                                <td>{gasto.referencia_externa || '-'}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-gestion-secondary btn-tabla"
                                                        onClick={() => setGastoSeleccionado(gasto)}
                                                    >
                                                        Ver detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </section>

                {gastoSeleccionado && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-card-wide">
                            <div className="modal-header">
                                <div>
                                    <h2>Detalle del gasto</h2>
                                    <p>
                                        Información completa del movimiento financiero registrado.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => setGastoSeleccionado(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="detalle-confirmacion">
                                <p>
                                    <strong>Fecha:</strong>{' '}
                                    {formatearFechaGasto(gastoSeleccionado.fecha_movimiento)}
                                </p>

                                <p>
                                    <strong>Concepto:</strong>{' '}
                                    {gastoSeleccionado.concepto}
                                </p>

                                <p>
                                    <strong>Categoría:</strong>{' '}
                                    {gastoSeleccionado.categoria || '-'}
                                </p>

                                <p>
                                    <strong>Importe:</strong>{' '}
                                    {formatearMonto(
                                        Number(gastoSeleccionado.importe),
                                        gastoSeleccionado.moneda || 'PEN'
                                    )}
                                </p>

                                <p>
                                    <strong>Referencia:</strong>{' '}
                                    {gastoSeleccionado.referencia_externa || '-'}
                                </p>
                            </div>

                            <div className="detalle-confirmacion">
                                <p>
                                    <strong>Cuenta:</strong>{' '}
                                    {gastoSeleccionado.nombre_cuenta || '-'}
                                </p>

                                <p>
                                    <strong>Número de cuenta:</strong>{' '}
                                    {gastoSeleccionado.numero_cuenta || '-'}
                                </p>

                                <p>
                                    <strong>Saldo anterior:</strong>{' '}
                                    {formatearMonto(
                                        Number(gastoSeleccionado.saldo_anterior),
                                        gastoSeleccionado.moneda || 'PEN'
                                    )}
                                </p>

                                <p>
                                    <strong>Saldo posterior:</strong>{' '}
                                    {formatearMonto(
                                        Number(gastoSeleccionado.saldo_posterior),
                                        gastoSeleccionado.moneda || 'PEN'
                                    )}
                                </p>
                            </div>

                            <div className="detalle-confirmacion">
                                <p>
                                    <strong>Inmueble asociado:</strong>{' '}
                                    {gastoSeleccionado.inmueble
                                        ? `${gastoSeleccionado.codigo_inmueble || ''} ${gastoSeleccionado.inmueble}`
                                        : 'Sin inmueble asociado'}
                                </p>

                                <p>
                                    <strong>Tipo de inmueble:</strong>{' '}
                                    {gastoSeleccionado.tipo_inmueble || '-'}
                                </p>
                            </div>

                            <div className="detalle-confirmacion">
                                <p>
                                    <strong>Descripción:</strong>
                                </p>
                                <p>
                                    {gastoSeleccionado.descripcion || 'Sin descripción registrada.'}
                                </p>

                                <p>
                                    <strong>Observaciones:</strong>
                                </p>
                                <p>
                                    {gastoSeleccionado.observaciones || 'Sin observaciones registradas.'}
                                </p>
                            </div>

                            <div className="form-actions modal-actions">
                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={() => setGastoSeleccionado(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {modoEdicion && formEdicion && inmuebleSeleccionado && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-card-wide">
                            <h2>Editar inmueble</h2>
                            <p>
                                Modificando: <strong>{inmuebleSeleccionado.codigo} - {inmuebleSeleccionado.nombre}</strong>
                            </p>

                            <div className="gestion-form-grid">
                                <div className="gestion-field">
                                    <label>Nombre</label>
                                    <input
                                        name="nombre"
                                        value={formEdicion.nombre}
                                        onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Estado operativo</label>
                                    <select
                                        value={formEdicion.estado_operativo}
                                        onChange={(e) => setFormEdicion({ ...formEdicion, estado_operativo: e.target.value })}
                                    >
                                        <option value="DISPONIBLE">DISPONIBLE</option>
                                        <option value="RESERVADO">RESERVADO</option>
                                        <option value="OCUPADO">OCUPADO</option>
                                        <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                                        <option value="INACTIVO">INACTIVO</option>
                                    </select>
                                </div>

                                <div className="gestion-field">
                                    <label>Descripción</label>
                                    <textarea
                                        value={formEdicion.descripcion}
                                        onChange={(e) => setFormEdicion({ ...formEdicion, descripcion: e.target.value })}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Área m²</label>
                                    <input
                                        value={formEdicion.area_m2}
                                        onChange={(e) => setFormEdicion({ ...formEdicion, area_m2: e.target.value })}
                                    />
                                </div>

                                {inmuebleSeleccionado.tipo_inmueble === 'EDIFICIO' && (
                                    <>
                                        <div className="gestion-field">
                                            <label>Dirección principal</label>
                                            <input
                                                value={formEdicion.direccion_linea1}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, direccion_linea1: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Número</label>
                                            <input
                                                value={formEdicion.numero}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, numero: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Distrito</label>
                                            <input
                                                value={formEdicion.distrito}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, distrito: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Código postal</label>
                                            <input
                                                value={formEdicion.codigo_postal}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, codigo_postal: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                {inmuebleSeleccionado.tipo_inmueble !== 'EDIFICIO' && (
                                    <>
                                        <div className="gestion-field">
                                            <label>Subtipo</label>
                                            <input
                                                value={formEdicion.subtipo_unidad}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, subtipo_unidad: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Planta</label>
                                            <input
                                                value={formEdicion.planta}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, planta: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Letra</label>
                                            <input
                                                value={formEdicion.letra}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, letra: e.target.value })}
                                            />
                                        </div>

                                        <div className="gestion-field">
                                            <label>Renta mensual</label>
                                            <input
                                                value={formEdicion.renta_base_mensual}
                                                onChange={(e) => setFormEdicion({ ...formEdicion, renta_base_mensual: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="caracteristicas-box">
                                <h3>Características del inmueble</h3>
                                <p>Actualiza las características visibles del inmueble.</p>

                                {catalogoCaracteristicas.length === 0 && (
                                    <p>No hay características registradas en el catálogo.</p>
                                )}

                                <div className="caracteristicas-grid">
                                    {catalogoCaracteristicas.map((caracteristica) => {
                                        const valorActual = caracteristicasForm.find(
                                            (item) => item.caracteristica_id === caracteristica.caracteristica_id
                                        );

                                        return (
                                            <div key={caracteristica.caracteristica_id} className="caracteristica-item">
                                                <label>{caracteristica.nombre}</label>

                                                {caracteristica.tipo_dato === 'BOOLEAN' && (
                                                    <select
                                                        value={valorActual?.valor_boolean ? 'true' : 'false'}
                                                        onChange={(e) =>
                                                            cambiarCaracteristica(
                                                                caracteristica,
                                                                e.target.value === 'true'
                                                            )
                                                        }
                                                    >
                                                        <option value="false">No</option>
                                                        <option value="true">Sí</option>
                                                    </select>
                                                )}

                                                {caracteristica.tipo_dato === 'TEXTO' && (
                                                    <input
                                                        value={valorActual?.valor_texto || ''}
                                                        onChange={(e) =>
                                                            cambiarCaracteristica(caracteristica, e.target.value)
                                                        }
                                                    />
                                                )}

                                                {caracteristica.tipo_dato === 'NUMERO' && (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={valorActual?.valor_numero ?? ''}
                                                        onChange={(e) =>
                                                            cambiarCaracteristica(caracteristica, e.target.value)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-actions modal-actions">
                                <button
                                    type="button"
                                    className="btn-gestion-primary"
                                    onClick={guardarEdicion}
                                    disabled={cargando}
                                >
                                    Guardar cambios
                                </button>

                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={() => setModoEdicion(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {mostrarConfirmacionBaja && inmuebleSeleccionado && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2>Confirmar baja</h2>
                            <p>
                                ¿Seguro que deseas dar de baja este inmueble?
                            </p>

                            <div className="detalle-confirmacion">
                                <p><strong>Código:</strong> {inmuebleSeleccionado.codigo}</p>
                                <p><strong>Nombre:</strong> {inmuebleSeleccionado.nombre}</p>
                                <p><strong>Tipo:</strong> {inmuebleSeleccionado.tipo_inmueble}</p>
                            </div>

                            <div className="form-actions modal-actions">
                                <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={confirmarBaja}
                                    disabled={cargando}
                                >
                                    Confirmar baja
                                </button>

                                <button
                                    type="button"
                                    className="btn-gestion-secondary"
                                    onClick={() => setMostrarConfirmacionBaja(false)}
                                    disabled={cargando}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default GestionMantenimiento;
