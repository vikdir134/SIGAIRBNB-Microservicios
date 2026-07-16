import { useEffect, useState } from 'react';
import {
    obtenerMisRecibosPendientes,
    obtenerMisPagos,
    pagarReciboOnline
} from '../services/pagoService';
import type {
    ReciboPendiente,
    Pago,
    MetodoPago
} from '../services/pagoService';
import PagoOnlineDialog from '../components/PagoOnlineDialog';
import '../MisPagos.css';

function MisPagos() {
    const [recibosPendientes, setRecibosPendientes] = useState<ReciboPendiente[]>([]);
    const [pagos, setPagos] = useState<Pago[]>([]);

    const [cargando, setCargando] = useState(true);
    const [procesandoPago, setProcesandoPago] = useState<number | null>(null);

    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
    const [reciboSeleccionado, setReciboSeleccionado] = useState<ReciboPendiente | null>(null);
    const [metodoPago, setMetodoPago] = useState<MetodoPago>('ONLINE');

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');

            const [recibosData, pagosData] = await Promise.all([
                obtenerMisRecibosPendientes(),
                obtenerMisPagos()
            ]);

            setRecibosPendientes(recibosData);
            setPagos(pagosData);
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Error al cargar los datos de pagos.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const formatearMoneda = (monto: number | string | null | undefined) => {
        const valor = Number(monto || 0);

        return valor.toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });
    };

    const formatearFecha = (fecha: string | null | undefined) => {
        if (!fecha) return '-';

        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const obtenerNombreMes = (mes: number) => {
        const meses = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre'
        ];

        return meses[mes - 1] || `Mes ${mes}`;
    };

    const obtenerTextoMetodoPago = (metodo: string) => {
        if (metodo === 'ONLINE') return 'Pago online';
        if (metodo === 'TARJETA') return 'Tarjeta';
        if (metodo === 'TRANSFERENCIA') return 'Transferencia';

        return metodo;
    };

    const abrirDialogPago = (recibo: ReciboPendiente) => {
        setReciboSeleccionado(recibo);
        setMetodoPago('ONLINE');
        setDialogPagoAbierto(true);
        setError('');
        setMensaje('');
    };

    const cerrarDialogPago = () => {
        if (procesandoPago !== null) return;

        setDialogPagoAbierto(false);
        setReciboSeleccionado(null);
    };

    const confirmarPagoOnline = async () => {
        if (!reciboSeleccionado) return;

        try {
            setProcesandoPago(reciboSeleccionado.recibo_id);
            setError('');
            setMensaje('');

            await pagarReciboOnline(reciboSeleccionado.recibo_id, metodoPago);

            setMensaje('Pago procesado correctamente.');
            setDialogPagoAbierto(false);
            setReciboSeleccionado(null);

            await cargarDatos();
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Error al procesar el pago.');
        } finally {
            setProcesandoPago(null);
        }
    };

    if (cargando) {
        return (
            <div className="mis-pagos-page">
                <div className="mis-pagos-header">
                    <h1>Mis pagos</h1>
                    <p>Consulta tus boletas pendientes y revisa tu historial de pagos.</p>
                </div>

                <div className="mis-pagos-loading">
                    Cargando información de pagos...
                </div>
            </div>
        );
    }

    return (
        <div className="mis-pagos-page">
            <div className="mis-pagos-header">
                <div>
                    <h1>Mis pagos</h1>
                    <p>Consulta tus boletas pendientes y procesa pagos.</p>
                </div>

                <button
                    type="button"
                    className="btn-recargar-pagos"
                    onClick={cargarDatos}
                >
                    Actualizar
                </button>
            </div>

            {error && (
                <div className="mis-pagos-alert mis-pagos-alert-error">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="mis-pagos-alert mis-pagos-alert-success">
                    {mensaje}
                </div>
            )}

            <section className="mis-pagos-section">
                <div className="mis-pagos-section-title">
                    <h2>Boletas pendientes</h2>
                    <span>{recibosPendientes.length} pendiente(s)</span>
                </div>

                {recibosPendientes.length === 0 ? (
                    <div className="mis-pagos-empty">
                        No tienes boletas pendientes de pago.
                    </div>
                ) : (
                    <div className="recibos-grid">
                        {recibosPendientes.map((recibo) => (
                            <article key={recibo.recibo_id} className="recibo-card">
                                <div className="recibo-card-header">
                                    <div>
                                        <h3>Boleta #{recibo.recibo_id}</h3>
                                        <p>
                                            {obtenerNombreMes(recibo.periodo_mes)} {recibo.periodo_anio}
                                        </p>
                                    </div>

                                    <span className="estado-recibo">
                                        {recibo.estado_recibo}
                                    </span>
                                </div>

                                <div className="recibo-card-body">
                                    <div className="recibo-info-row">
                                        <span>Inmueble</span>
                                        <strong>{recibo.nombre_inmueble}</strong>
                                    </div>

                                    <div className="recibo-info-row">
                                        <span>Dirección</span>
                                        <strong>
                                            {recibo.direccion_linea1 || '-'}
                                            {recibo.distrito ? `, ${recibo.distrito}` : ''}
                                        </strong>
                                    </div>

                                    <div className="recibo-info-row">
                                        <span>Fecha de emisión</span>
                                        <strong>{formatearFecha(recibo.fecha_emision)}</strong>
                                    </div>

                                    <div className="recibo-info-row">
                                        <span>Vencimiento</span>
                                        <strong>{formatearFecha(recibo.fecha_vencimiento)}</strong>
                                    </div>

                                    <div className="recibo-total-box">
                                        <span>Saldo pendiente</span>
                                        <strong>{formatearMoneda(recibo.saldo_pendiente)}</strong>
                                    </div>
                                </div>

                                <div className="recibo-card-actions">
                                    {recibo.pdf_url && (
                                        <a
                                            href={recibo.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ver-boleta"
                                        >
                                            Ver boleta
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        className="btn-pagar-online"
                                        onClick={() => abrirDialogPago(recibo)}
                                        disabled={procesandoPago === recibo.recibo_id}
                                    >
                                        {procesandoPago === recibo.recibo_id
                                            ? 'Procesando...'
                                            : 'Pagar'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="mis-pagos-section">
                <div className="mis-pagos-section-title">
                    <h2>Historial de pagos</h2>
                    <span>{pagos.length} pago(s)</span>
                </div>

                {pagos.length === 0 ? (
                    <div className="mis-pagos-empty">
                        Aún no tienes pagos registrados.
                    </div>
                ) : (
                    <div className="pagos-table-wrapper">
                        <table className="pagos-table">
                            <thead>
                                <tr>
                                    <th>Pago</th>
                                    <th>Boleta</th>
                                    <th>Inmueble</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pagos.map((pago) => (
                                    <tr key={pago.pago_id}>
                                        <td>#{pago.pago_id}</td>
                                        <td>#{pago.recibo_id}</td>
                                        <td>{pago.nombre_inmueble || '-'}</td>
                                        <td>{formatearMoneda(pago.monto)}</td>
                                        <td>{obtenerTextoMetodoPago(pago.metodo_pago)}</td>
                                        <td>
                                            <span className="estado-pago">
                                                {pago.estado_pago}
                                            </span>
                                        </td>
                                        <td>{formatearFecha(pago.fecha_pago)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <PagoOnlineDialog
                abierto={dialogPagoAbierto}
                recibo={reciboSeleccionado}
                procesando={procesandoPago !== null}
                metodoPago={metodoPago}
                onCambiarMetodoPago={setMetodoPago}
                onCerrar={cerrarDialogPago}
                onConfirmar={confirmarPagoOnline}
            />
        </div>
    );
}

export default MisPagos;