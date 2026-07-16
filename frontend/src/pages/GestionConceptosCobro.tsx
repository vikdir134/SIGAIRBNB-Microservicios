import { useEffect, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';
import {
    actualizarConceptoCobro,
    cambiarEstadoConceptoCobro,
    crearConceptoCobro,
    listarConceptosCobro
} from '../services/conceptosCobroService';

import type {
    ConceptoCobro,
    ConceptoCobroForm
} from '../services/conceptosCobroService';


const formInicial: ConceptoCobroForm = {
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_concepto: 'FIJO',
    categoria: 'OTRO',
    metodo_calculo: 'MONTO_FIJO',
    aplica_en: 'AMBOS',
    aplica_desde_dias: 1,
    monto_default: 0,
    orden_impresion: 10,
    es_obligatorio: false,
    aplica_igv: false,
    prorrateable: false,
    permite_pago_online: false
};

function GestionConceptosCobro() {
    const [conceptos, setConceptos] = useState<ConceptoCobro[]>([]);
    const [form, setForm] = useState<ConceptoCobroForm>(formInicial);
    const [conceptoEditando, setConceptoEditando] = useState<ConceptoCobro | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cargarConceptos = async () => {
        try {
            setCargando(true);
            setError('');

            const data = await listarConceptosCobro();
            setConceptos(data);
        } catch (error: any) {
            setError(error.message || 'Error al cargar conceptos');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarConceptos();
    }, []);

    const abrirModalCrear = () => {
        setConceptoEditando(null);
        setForm(formInicial);
        setError('');
        setMensaje('');
        setModalAbierto(true);
    };

    const abrirModalEditar = (concepto: ConceptoCobro) => {
        if (!concepto.editable) return;

        setConceptoEditando(concepto);
        setForm({
            codigo: concepto.codigo,
            nombre: concepto.nombre,
            descripcion: concepto.descripcion || '',
            tipo_concepto: concepto.tipo_concepto,
            categoria: concepto.categoria,
            metodo_calculo: concepto.metodo_calculo,
            aplica_en: concepto.aplica_en,
            aplica_desde_dias: concepto.aplica_desde_dias,
            monto_default: Number(concepto.monto_default || 0),
            orden_impresion: concepto.orden_impresion,
            es_obligatorio: concepto.es_obligatorio,
            aplica_igv: concepto.aplica_igv,
            prorrateable: concepto.prorrateable,
            permite_pago_online: concepto.permite_pago_online
        });
        setError('');
        setMensaje('');
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setConceptoEditando(null);
        setForm(formInicial);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;

            setForm({
                ...form,
                [name]: checked
            });

            return;
        }

        if (
            name === 'monto_default' ||
            name === 'orden_impresion' ||
            name === 'aplica_desde_dias'
        ) {
            setForm({
                ...form,
                [name]: Number(value)
            });

            return;
        }

        setForm({
            ...form,
            [name]: value
        });
    };

    const guardarConcepto = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setCargando(true);
            setError('');
            setMensaje('');

            const erroresValidacion = [];
            const montoDefault = Number(form.monto_default);
            const ordenImpresion = Number(form.orden_impresion);
            const aplicaDesdeDias = Number(form.aplica_desde_dias);

            if (!form.nombre.trim()) erroresValidacion.push('El nombre es obligatorio.');
            if ((form.codigo || '').trim().length > 50) erroresValidacion.push('El código no debe superar los 50 caracteres.');
            if (form.nombre.trim().length > 120) erroresValidacion.push('El nombre no debe superar los 120 caracteres.');
            if ((form.descripcion || '').trim().length > 500) erroresValidacion.push('La descripción no debe superar los 500 caracteres.');
            if (!Number.isFinite(montoDefault) || montoDefault < 0) {
                erroresValidacion.push('El monto por defecto debe ser un número válido mayor o igual a cero.');
            }
            if (!Number.isInteger(ordenImpresion) || ordenImpresion <= 0) {
                erroresValidacion.push('El orden de impresión debe ser un número entero mayor a cero.');
            }
            if (!Number.isInteger(aplicaDesdeDias) || aplicaDesdeDias <= 0) {
                erroresValidacion.push('Los días de aplicación deben ser un número entero mayor a cero.');
            }

            if (erroresValidacion.length > 0) {
                setError(erroresValidacion.join(' '));
                return;
            }

            if (conceptoEditando) {
                await actualizarConceptoCobro(conceptoEditando.concepto_cobro_id, form);
                setMensaje('Concepto actualizado correctamente.');
            } else {
                await crearConceptoCobro(form);
                setMensaje('Concepto creado correctamente.');
            }

            cerrarModal();
            await cargarConceptos();
        } catch (error: any) {
            setError(error.message || 'Error al guardar concepto');
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = async (concepto: ConceptoCobro) => {
        if (!concepto.editable) return;

        try {
            setCargando(true);
            setError('');
            setMensaje('');

            await cambiarEstadoConceptoCobro(
                concepto.concepto_cobro_id,
                !concepto.activo
            );

            setMensaje(
                concepto.activo
                    ? 'Concepto desactivado correctamente.'
                    : 'Concepto reactivado correctamente.'
            );

            await cargarConceptos();
        } catch (error: any) {
            setError(error.message || 'Error al cambiar estado del concepto');
        } finally {
            setCargando(false);
        }
    };

    const formatearMonto = (monto: number) => {
        return Number(monto || 0).toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });
    };

    return (
    <div className="gestion-layout">
        <SidebarGestion />

            <main className="gestion-content conceptos-content">
                <div className="conceptos-page">
                <div className="conceptos-header">
                <div>
                    <h1>Gestión de conceptos</h1>
                    <p>
                        Administra los conceptos fijos y variables que se usarán para
                        estructurar las boletas digitales.
                    </p>
                </div>

                <button className="btn-primary" onClick={abrirModalCrear}>
                    Nuevo concepto
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {mensaje && <div className="alert alert-success">{mensaje}</div>}

            <div className="conceptos-card">
                {cargando && conceptos.length === 0 ? (
                    <p>Cargando conceptos...</p>
                ) : (
                    <table className="conceptos-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Método</th>
                                <th>Aplica en</th>
                                <th>Monto</th>
                                <th>IGV</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {conceptos.map((concepto) => (
                                <tr key={concepto.concepto_cobro_id}>
                                    <td>
                                        <strong>{concepto.codigo}</strong>
                                        {concepto.es_sistema && (
                                            <span className="badge badge-system">
                                                Sistema
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        <div className="concepto-nombre">
                                            {concepto.nombre}
                                        </div>
                                        <small>{concepto.descripcion}</small>
                                    </td>

                                    <td>{concepto.categoria}</td>
                                    <td>{concepto.tipo_concepto}</td>
                                    <td>{concepto.metodo_calculo}</td>
                                    <td>
                                        {concepto.aplica_en}
                                        <br />
                                        <small>
                                            Desde {concepto.aplica_desde_dias} día(s)
                                        </small>
                                    </td>
                                    <td>{formatearMonto(concepto.monto_default)}</td>
                                    <td>
                                        {concepto.aplica_igv ? (
                                            <span className="badge badge-yes">Sí</span>
                                        ) : (
                                            <span className="badge badge-no">No</span>
                                        )}
                                    </td>
                                    <td>
                                        {concepto.activo ? (
                                            <span className="badge badge-active">Activo</span>
                                        ) : (
                                            <span className="badge badge-inactive">Inactivo</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <button
                                                className="btn-secondary"
                                                disabled={!concepto.editable}
                                                onClick={() => abrirModalEditar(concepto)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                className={
                                                    concepto.activo
                                                        ? 'btn-danger'
                                                        : 'btn-success'
                                                }
                                                disabled={!concepto.editable}
                                                onClick={() => cambiarEstado(concepto)}
                                            >
                                                {concepto.activo ? 'Desactivar' : 'Reactivar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {conceptos.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="empty-row">
                                        No hay conceptos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-concepto">
                        <div className="modal-header">
                            <h2>
                                {conceptoEditando
                                    ? 'Editar concepto'
                                    : 'Nuevo concepto'}
                            </h2>

                            <button className="modal-close" onClick={cerrarModal}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={guardarConcepto} className="concepto-form">
                            {!conceptoEditando && (
                                <div className="form-group">
                                    <label>Código</label>
                                    <input
                                        name="codigo"
                                        value={form.codigo || ''}
                                        onChange={handleChange}
                                        placeholder="Ej: COCHERA"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Cochera"
                                    required
                                />
                            </div>

                            <div className="form-group full">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion || ''}
                                    onChange={handleChange}
                                    placeholder="Descripción del concepto"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo de concepto</label>
                                <select
                                    name="tipo_concepto"
                                    value={form.tipo_concepto}
                                    onChange={handleChange}
                                >
                                    <option value="FIJO">Fijo</option>
                                    <option value="VARIABLE">Variable</option>
                                    <option value="SERVICIO">Servicio</option>
                                    <option value="IMPUESTO">Impuesto</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Categoría</label>
                                <select
                                    name="categoria"
                                    value={form.categoria}
                                    onChange={handleChange}
                                >
                                    <option value="RENTA">Renta</option>
                                    <option value="LIMPIEZA">Limpieza</option>
                                    <option value="MANTENIMIENTO">Mantenimiento</option>
                                    <option value="SERVICIO">Servicio</option>
                                    <option value="PENALIDAD">Penalidad</option>
                                    <option value="GARANTIA">Garantía</option>
                                    <option value="AJUSTE">Ajuste</option>
                                    <option value="DESCUENTO">Descuento</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Método de cálculo</label>
                                <select
                                    name="metodo_calculo"
                                    value={form.metodo_calculo}
                                    onChange={handleChange}
                                >
                                    <option value="MONTO_FIJO">Monto fijo</option>
                                    <option value="MANUAL">Manual</option>
                                    <option value="POR_DIA">Por día</option>
                                    <option value="POR_MES">Por mes</option>
                                    <option value="POR_AREA_M2">Por área m²</option>
                                    <option value="POR_PORCENTAJE_RENTA">
                                        Por porcentaje de renta
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Aplica en</label>
                                <select
                                    name="aplica_en"
                                    value={form.aplica_en}
                                    onChange={handleChange}
                                >
                                    <option value="RESERVA">Reserva</option>
                                    <option value="MENSUAL">Mensual</option>
                                    <option value="AMBOS">Ambos</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Aplica desde días</label>
                                <input
                                    type="number"
                                    name="aplica_desde_dias"
                                    value={form.aplica_desde_dias}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </div>

                            <div className="form-group">
                                <label>Monto por defecto</label>
                                <input
                                    type="number"
                                    name="monto_default"
                                    value={form.monto_default}
                                    onChange={handleChange}
                                    min={0}
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Orden de impresión</label>
                                <input
                                    type="number"
                                    name="orden_impresion"
                                    value={form.orden_impresion}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </div>

                            <div className="checks full">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="es_obligatorio"
                                        checked={form.es_obligatorio}
                                        onChange={handleChange}
                                    />
                                    Obligatorio
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        name="aplica_igv"
                                        checked={form.aplica_igv}
                                        onChange={handleChange}
                                    />
                                    Aplica IGV
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        name="prorrateable"
                                        checked={form.prorrateable}
                                        onChange={handleChange}
                                    />
                                    Prorrateable
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        name="permite_pago_online"
                                        checked={form.permite_pago_online}
                                        onChange={handleChange}
                                    />
                                    Permite pago online
                                </label>
                            </div>

                            <div className="modal-actions full">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cerrarModal}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={cargando}
                                >
                                    {cargando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
                    </div>
        </main>
    </div>
);
}

export default GestionConceptosCobro;
