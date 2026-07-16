import React, { useEffect, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';
import { validateDateRange } from '../utils/dateValidators';

import {
    listarInmueblesDisponibilidad,
    listarBloqueosPorInmueble,
    obtenerCalendarioDisponibilidad,
    crearBloqueoDisponibilidad,
    editarBloqueoDisponibilidad,
    eliminarBloqueoDisponibilidad,
    type InmuebleDisponibilidad,
    type BloqueoDisponibilidad,
    type BloqueoFormData,
    type EditarBloqueoFormData
} from '../services/disponibilidadService';

const obtenerMesActual = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');

    return `${anio}-${mes}`;
};

const formatearDosDigitos = (valor: number) => {
    return String(valor).padStart(2, '0');
};

function GestionDisponibilidad() {
    const [inmuebles, setInmuebles] = useState<InmuebleDisponibilidad[]>([]);
    const [bloqueos, setBloqueos] = useState<BloqueoDisponibilidad[]>([]);

    const [inmuebleSeleccionado, setInmuebleSeleccionado] = useState<number | ''>('');
    const [mesCalendario, setMesCalendario] = useState(obtenerMesActual());
    const [calendario, setCalendario] = useState<any>(null);

    const [form, setForm] = useState<BloqueoFormData>({
        inmueble_id: 0,
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
        origen: 'MANUAL'
    });

    const [bloqueoEditando, setBloqueoEditando] = useState<BloqueoDisponibilidad | null>(null);

    const [formEdicion, setFormEdicion] = useState<EditarBloqueoFormData>({
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
        origen: 'MANUAL'
    });

    const [editando, setEditando] = useState(false);

    const [cargandoInmuebles, setCargandoInmuebles] = useState(false);
    const [cargandoBloqueos, setCargandoBloqueos] = useState(false);
    const [cargandoCalendario, setCargandoCalendario] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const cargarInmuebles = async () => {
        try {
            setCargandoInmuebles(true);
            setError('');

            const data = await listarInmueblesDisponibilidad();

            setInmuebles(data.inmuebles || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar inmuebles');
        } finally {
            setCargandoInmuebles(false);
        }
    };

    const cargarBloqueos = async (inmuebleId: number) => {
        try {
            setCargandoBloqueos(true);
            setError('');

            const data = await listarBloqueosPorInmueble(inmuebleId);

            setBloqueos(data.bloqueos || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar bloqueos');
        } finally {
            setCargandoBloqueos(false);
        }
    };

    const obtenerRangoMes = (mes: string) => {
        const [anioTexto, mesTexto] = mes.split('-');
        const anio = Number(anioTexto);
        const mesNumero = Number(mesTexto);

        const ultimoDia = new Date(anio, mesNumero, 0).getDate();

        return {
            fechaInicio: `${anio}-${formatearDosDigitos(mesNumero)}-01`,
            fechaFin: `${anio}-${formatearDosDigitos(mesNumero)}-${formatearDosDigitos(ultimoDia)}`
        };
    };

    const cargarCalendario = async (inmuebleId: number, mes: string) => {
        try {
            setCargandoCalendario(true);
            setError('');

            const { fechaInicio, fechaFin } = obtenerRangoMes(mes);

            const data = await obtenerCalendarioDisponibilidad(
                inmuebleId,
                fechaInicio,
                fechaFin
            );

            setCalendario(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar calendario');
        } finally {
            setCargandoCalendario(false);
        }
    };

    useEffect(() => {
        cargarInmuebles();
    }, []);

    const handleSeleccionInmueble = async (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const valor = e.target.value;

        if (!valor) {
            setInmuebleSeleccionado('');
            setBloqueos([]);
            setCalendario(null);
            setForm({
                inmueble_id: 0,
                fecha_inicio: '',
                fecha_fin: '',
                motivo: '',
                origen: 'MANUAL'
            });
            return;
        }

        const inmuebleId = Number(valor);

        setInmuebleSeleccionado(inmuebleId);
        setForm({
            ...form,
            inmueble_id: inmuebleId
        });

        await cargarBloqueos(inmuebleId);
        await cargarCalendario(inmuebleId, mesCalendario);
    };

    const handleMesCalendario = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const nuevoMes = e.target.value;

        setMesCalendario(nuevoMes);

        if (inmuebleSeleccionado) {
            await cargarCalendario(Number(inmuebleSeleccionado), nuevoMes);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    const limpiarFormulario = () => {
        setForm({
            inmueble_id: inmuebleSeleccionado === '' ? 0 : inmuebleSeleccionado,
            fecha_inicio: '',
            fecha_fin: '',
            motivo: '',
            origen: 'MANUAL'
        });
    };

    const registrarBloqueo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setGuardando(true);
            setMensaje('');
            setError('');

            if (!inmuebleSeleccionado) {
                setError('Selecciona un inmueble para gestionar su disponibilidad');
                return;
            }

            if (!form.fecha_inicio || !form.fecha_fin) {
                setError('La fecha de inicio y la fecha de fin son obligatorias');
                return;
            }

            if (form.fecha_fin < form.fecha_inicio) {
                setError('La fecha de fin no puede ser menor que la fecha de inicio');
                return;
            }

            const errorFechas = validateDateRange({
                start: form.fecha_inicio,
                end: form.fecha_fin,
                allowSameDay: true,
                allowPast: false,
                maxDays: 370,
                maxFutureYears: 3
            });

            if (errorFechas) {
                setError(errorFechas);
                return;
            }

            await crearBloqueoDisponibilidad({
                ...form,
                inmueble_id: Number(inmuebleSeleccionado)
            });

            setMensaje('Bloqueo registrado correctamente');
            limpiarFormulario();

            await cargarBloqueos(Number(inmuebleSeleccionado));
            await cargarCalendario(Number(inmuebleSeleccionado), mesCalendario);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar bloqueo');
        } finally {
            setGuardando(false);
        }
    };

    const cancelarBloqueo = async (bloqueoId: number) => {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar este bloqueo de disponibilidad?'
        );

        if (!confirmar) return;

        try {
            setMensaje('');
            setError('');

            await eliminarBloqueoDisponibilidad(bloqueoId);

            setMensaje('Bloqueo cancelado correctamente');

            if (inmuebleSeleccionado) {
                await cargarBloqueos(Number(inmuebleSeleccionado));
                await cargarCalendario(Number(inmuebleSeleccionado), mesCalendario);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cancelar bloqueo');
        }
    };

    const abrirModalEdicion = (bloqueo: BloqueoDisponibilidad) => {
    setMensaje('');
    setError('');

    setBloqueoEditando(bloqueo);

    setFormEdicion({
        fecha_inicio: obtenerFechaInput(bloqueo.fecha_inicio),
        fecha_fin: obtenerFechaInput(bloqueo.fecha_fin),
        motivo: bloqueo.motivo || '',
        origen: bloqueo.origen
    });
};

const cerrarModalEdicion = () => {
    setBloqueoEditando(null);

    setFormEdicion({
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
        origen: 'MANUAL'
    });
};

const handleChangeEdicion = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
    const { name, value } = e.target;

    setFormEdicion({
        ...formEdicion,
        [name]: value
    });
};

const guardarEdicionBloqueo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!bloqueoEditando) return;

    try {
        setEditando(true);
        setMensaje('');
        setError('');

        if (!formEdicion.fecha_inicio || !formEdicion.fecha_fin) {
            setError('La fecha de inicio y la fecha de fin son obligatorias');
            return;
        }

        if (formEdicion.fecha_fin < formEdicion.fecha_inicio) {
            setError('La fecha de fin no puede ser menor que la fecha de inicio');
            return;
        }

        const errorFechas = validateDateRange({
            start: formEdicion.fecha_inicio,
            end: formEdicion.fecha_fin,
            allowSameDay: true,
            allowPast: false,
            maxDays: 370,
            maxFutureYears: 3
        });

        if (errorFechas) {
            setError(errorFechas);
            return;
        }

        await editarBloqueoDisponibilidad(
            bloqueoEditando.bloqueo_disponibilidad_id,
            formEdicion
        );

        setMensaje('Bloqueo actualizado correctamente');
        cerrarModalEdicion();

        if (inmuebleSeleccionado) {
            await cargarBloqueos(Number(inmuebleSeleccionado));
            await cargarCalendario(Number(inmuebleSeleccionado), mesCalendario);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al editar bloqueo');
    } finally {
        setEditando(false);
    }
};
    
    const obtenerInmuebleActual = () => {
        return inmuebles.find(
            (item) => item.inmueble_id === Number(inmuebleSeleccionado)
        );
    };

    const obtenerFechaInput = (fecha: string) => {
    if (!fecha) return '';
    return fecha.split('T')[0];
    };

    const formatearFechaVista = (fecha: string) => {
        if (!fecha) return '-';

        const fechaLimpia = fecha.split('T')[0];
        const [anio, mes, dia] = fechaLimpia.split('-');

        return `${mes}/${dia}/${anio}`;
    };

    const generarDiasCalendario = () => {
        const [anioTexto, mesTexto] = mesCalendario.split('-');
        const anio = Number(anioTexto);
        const mes = Number(mesTexto);

        const primerDia = new Date(anio, mes - 1, 1);
        const ultimoDia = new Date(anio, mes, 0);

        const espaciosIniciales = primerDia.getDay();
        const dias = [];

        for (let i = 0; i < espaciosIniciales; i++) {
            dias.push(null);
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fecha = `${anio}-${formatearDosDigitos(mes)}-${formatearDosDigitos(dia)}`;

            dias.push({
                dia,
                fecha
            });
        }

        return dias;
    };

    const obtenerBloqueosDelDia = (fecha: string) => {
        const bloqueosCalendario = calendario?.bloqueos || [];

        return bloqueosCalendario.filter((bloqueo: BloqueoDisponibilidad) => {
            const inicio = obtenerFechaInput(bloqueo.fecha_inicio);
            const fin = obtenerFechaInput(bloqueo.fecha_fin);

            return fecha >= inicio && fecha <= fin;
        });
    };

    const inmuebleActual = obtenerInmuebleActual();
    const diasCalendario = generarDiasCalendario();

    return (
        <div className="gestion-layout">
            <SidebarGestion />

            <main className="gestion-main">
                <div className="gestion-header">
                    <div>
                        <h1>Calendario de Disponibilidad</h1>
                        <p>
                            Gestiona los bloqueos manuales de fechas para edificios,
                            pisos y locales.
                        </p>
                    </div>
                </div>

                {mensaje && <div className="mensaje-exito">{mensaje}</div>}
                {error && <div className="mensaje-error">{error}</div>}

                <section className="gestion-card">
                    <h2>Seleccionar inmueble</h2>

                    {cargandoInmuebles ? (
                        <p>Cargando inmuebles...</p>
                    ) : (
                        <select
                            value={inmuebleSeleccionado}
                            onChange={handleSeleccionInmueble}
                        >
                            <option value="">Seleccione un inmueble</option>

                            {inmuebles.map((inmueble) => (
                                <option
                                    key={inmueble.inmueble_id}
                                    value={inmueble.inmueble_id}
                                >
                                    {inmueble.codigo} - {inmueble.tipo_inmueble} - {inmueble.nombre}
                                </option>
                            ))}
                        </select>
                    )}

                    {inmuebleActual && (
                        <div className="detalle-inmueble">
                            <p><strong>Código:</strong> {inmuebleActual.codigo}</p>
                            <p><strong>Tipo:</strong> {inmuebleActual.tipo_inmueble}</p>
                            <p><strong>Nombre:</strong> {inmuebleActual.nombre}</p>

                            {inmuebleActual.nombre_edificio && (
                                <p>
                                    <strong>Edificio padre:</strong>{' '}
                                    {inmuebleActual.nombre_edificio}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {inmuebleSeleccionado && (
                    <>
                        <section className="gestion-card">
                            <div className="calendario-header">
                                <div>
                                    <h2>Vista de calendario</h2>
                                    <p>
                                        Los días marcados indican fechas bloqueadas o no disponibles.
                                    </p>
                                </div>

                                <input
                                    type="month"
                                    value={mesCalendario}
                                    onChange={handleMesCalendario}
                                />
                            </div>

                            {cargandoCalendario ? (
                                <p>Cargando calendario...</p>
                            ) : (
                                <>
                                    {calendario && (
                                        <div className="resumen-calendario">
                                            <span>
                                                Bloqueos: {calendario.resumen?.total_bloqueos ?? 0}
                                            </span>
                                            <span>
                                                Reservas: {calendario.resumen?.total_reservas ?? 0}
                                            </span>
                                            <span>
                                                Disponible en rango:{' '}
                                                {calendario.disponible_en_rango ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="calendario-grid calendario-dias-semana">
                                        <div>Dom</div>
                                        <div>Lun</div>
                                        <div>Mar</div>
                                        <div>Mié</div>
                                        <div>Jue</div>
                                        <div>Vie</div>
                                        <div>Sáb</div>
                                    </div>

                                    <div className="calendario-grid">
                                        {diasCalendario.map((item, index) => {
                                            if (!item) {
                                                return (
                                                    <div
                                                        key={`vacio-${index}`}
                                                        className="calendario-dia calendario-vacio"
                                                    />
                                                );
                                            }

                                            const bloqueosDia = obtenerBloqueosDelDia(item.fecha);
                                            const estaBloqueado = bloqueosDia.length > 0;

                                            return (
                                                <div
                                                    key={item.fecha}
                                                    className={
                                                        estaBloqueado
                                                            ? 'calendario-dia calendario-bloqueado'
                                                            : 'calendario-dia'
                                                    }
                                                >
                                                    <strong>{item.dia}</strong>

                                                    {estaBloqueado && (
                                                        <small>
                                                            {bloqueosDia[0].origen}
                                                        </small>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="gestion-card">
                            <h2>Registrar bloqueo manual</h2>

                            <form onSubmit={registrarBloqueo} className="gestion-form">
                                <div className="form-grid">
                                    <div>
                                        <label>Fecha inicio</label>
                                        <input
                                            type="date"
                                            name="fecha_inicio"
                                            value={form.fecha_inicio}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label>Fecha fin</label>
                                        <input
                                            type="date"
                                            name="fecha_fin"
                                            value={form.fecha_fin}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label>Origen</label>
                                        <select
                                            name="origen"
                                            value={form.origen}
                                            onChange={handleChange}
                                        >
                                            <option value="MANUAL">Manual</option>
                                            <option value="MANTENIMIENTO">Mantenimiento</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label>Motivo</label>
                                    <textarea
                                        name="motivo"
                                        value={form.motivo}
                                        onChange={handleChange}
                                        placeholder="Ejemplo: mantenimiento, limpieza, reparación, cierre temporal..."
                                    />
                                </div>

                                <button type="submit" disabled={guardando}>
                                    {guardando ? 'Guardando...' : 'Registrar bloqueo'}
                                </button>
                            </form>
                        </section>

                        <section className="gestion-card">
                            <h2>Bloqueos registrados</h2>

                            {cargandoBloqueos ? (
                                <p>Cargando bloqueos...</p>
                            ) : bloqueos.length === 0 ? (
                                <p>No hay bloqueos activos para este inmueble.</p>
                            ) : (
                                <div className="tabla-contenedor">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Origen</th>
                                                <th>Motivo</th>
                                                <th>Padre</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {bloqueos.map((bloqueo) => (
                                                <tr key={bloqueo.bloqueo_disponibilidad_id}>
                                                    <td>{bloqueo.bloqueo_disponibilidad_id}</td>
                                                    <td>{formatearFechaVista(bloqueo.fecha_inicio)}</td>
                                                    <td>{formatearFechaVista(bloqueo.fecha_fin)}</td>
                                                    <td>{bloqueo.origen}</td>
                                                    <td>{bloqueo.motivo || '-'}</td>
                                                    <td>
                                                        {bloqueo.bloqueo_padre_id
                                                            ? `Bloqueo padre #${bloqueo.bloqueo_padre_id}`
                                                            : 'Principal'}
                                                    </td>
                                                    <td>
                                                        <div className="acciones-tabla">
                                                            <button
                                                            type = "button"
                                                            onClick={()=> abrirModalEdicion(bloqueo)}
                                                            >
                                                             Editar   
                                                            </button>

                                                            <button
                                                            type= "button"
                                                            onClick={() =>
                                                                cancelarBloqueo(
                                                                    bloqueo.bloqueo_disponibilidad_id
                                                                )
                                                            }
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>         
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
                                {bloqueoEditando && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h2>Editar bloqueo</h2>

                            <p>
                                Modifica las fechas, motivo u origen del bloqueo seleccionado.
                            </p>

                            <form onSubmit={guardarEdicionBloqueo} className="gestion-form">
                                <div className="gestion-field">
                                    <label>Fecha inicio</label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={formEdicion.fecha_inicio}
                                        onChange={handleChangeEdicion}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Fecha fin</label>
                                    <input
                                        type="date"
                                        name="fecha_fin"
                                        value={formEdicion.fecha_fin}
                                        onChange={handleChangeEdicion}
                                    />
                                </div>

                                <div className="gestion-field">
                                    <label>Origen</label>
                                    <select
                                        name="origen"
                                        value={formEdicion.origen}
                                        onChange={handleChangeEdicion}
                                    >
                                        <option value="MANUAL">Manual</option>
                                        <option value="MANTENIMIENTO">Mantenimiento</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>

                                <div className="gestion-field">
                                    <label>Motivo</label>
                                    <textarea
                                        name="motivo"
                                        value={formEdicion.motivo}
                                        onChange={handleChangeEdicion}
                                    />
                                </div>

                                <div className="form-actions modal-actions">
                                    <button
                                        type="button"
                                        className="btn-gestion-secondary"
                                        onClick={cerrarModalEdicion}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn-gestion-primary"
                                        disabled={editando}
                                    >
                                        {editando ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default GestionDisponibilidad;
