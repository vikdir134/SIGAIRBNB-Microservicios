import { useEffect, useState } from 'react';
import {
    obtenerVettingInquilinoGestion,
    registrarEvaluacionInquilinoGestion,
    obtenerEvaluacionesInquilinoGestion,
    type VettingInquilinoResponse,
    type EvaluacionInquilino
} from '../services/reservaService';

interface VettingInquilinoDialogProps {
    abierto: boolean;
    reservaId: number | null;
    onCerrar: () => void;
    onEvaluacionRegistrada?: () => void;
}

function VettingInquilinoDialog({
    abierto,
    reservaId,
    onCerrar,
    onEvaluacionRegistrada
}: VettingInquilinoDialogProps) {
    const [vetting, setVetting] = useState<VettingInquilinoResponse | null>(null);
    const [evaluaciones, setEvaluaciones] = useState<EvaluacionInquilino[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const [scoreRiesgo, setScoreRiesgo] = useState('');
    const [resultado, setResultado] = useState<'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO'>('OBSERVADO');
    const [observaciones, setObservaciones] = useState('');
    const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
    const [mensajeEvaluacion, setMensajeEvaluacion] = useState('');
    const [advertenciasEvaluacion, setAdvertenciasEvaluacion] = useState<
        { tipo: string; nivel: string; mensaje: string }[]
    >([]);

    const formatearFecha = (fecha?: string | null) => {
        if (!fecha) return 'No especificada';

        const fechaSolo = fecha.slice(0, 10);
        const [anio, mes, dia] = fechaSolo.split('-');

        if (!anio || !mes || !dia) return 'No especificada';

        return `${dia}/${mes}/${anio}`;
    };

    const formatearMoneda = (valor?: number | null) => {
        if (valor === null || valor === undefined) return 'No registrado';
        return `PEN ${valor}`;
    };

    useEffect(() => {
        const cargarVetting = async () => {
            if (!abierto || !reservaId) return;

            try {
                setCargando(true);
                setError('');

                const response = await obtenerVettingInquilinoGestion(reservaId);
                const responseEvaluaciones = await obtenerEvaluacionesInquilinoGestion(reservaId);

                setVetting(response);
                setEvaluaciones(responseEvaluaciones.evaluaciones || []);

                if (!response.evaluacion_inquilino) {
                    setScoreRiesgo(String(response.evaluacion_sugerida.score_riesgo_sugerido));
                    setResultado(response.evaluacion_sugerida.resultado_sugerido);
                    setObservaciones(response.evaluacion_sugerida.mensaje || '');
                }
            } catch (err) {
                const mensajeError =
                    err instanceof Error
                        ? err.message
                        : 'Error al cargar el vetting del inquilino.';

                setError(mensajeError);
            } finally {
                setCargando(false);
            }
        };

        cargarVetting();
    }, [abierto, reservaId]);

    const cerrar = () => {
        setVetting(null);
        setEvaluaciones([]);
        setError('');
        setMensajeEvaluacion('');
        setAdvertenciasEvaluacion([]);
        setScoreRiesgo('');
        setResultado('OBSERVADO');
        setObservaciones('');
        onCerrar();
    };

    const obtenerClaseResultadoEvaluacion = () => {
        if (resultado === 'APROBADO') return 'resultado-aprobado';
        if (resultado === 'OBSERVADO') return 'resultado-observado';
        if (resultado === 'RECHAZADO') return 'resultado-rechazado';
        return 'resultado-pendiente';
    };

    const obtenerAdvertenciaLocalEvaluacion = () => {
        const scoreNumero = Number(scoreRiesgo);

        if (Number.isNaN(scoreNumero)) {
            return null;
        }

        if (resultado === 'APROBADO' && scoreNumero >= 70) {
            return 'Estás marcando como APROBADO a un inquilino con riesgo alto.';
        }

        if (resultado === 'RECHAZADO' && scoreNumero <= 30) {
            return 'Estás marcando como RECHAZADO a un inquilino con riesgo bajo.';
        }

        if (resultado === 'OBSERVADO' && scoreNumero <= 20) {
            return 'El score es muy bajo para una evaluación OBSERVADA. Revisa si corresponde APROBADO.';
        }

        return null;
    };

    const usarEvaluacionSugerida = () => {
        if (!vetting?.evaluacion_sugerida) return;

        setScoreRiesgo(String(vetting.evaluacion_sugerida.score_riesgo_sugerido));
        setResultado(vetting.evaluacion_sugerida.resultado_sugerido);
        setObservaciones(vetting.evaluacion_sugerida.mensaje || '');
        setMensajeEvaluacion('');
        setAdvertenciasEvaluacion([]);
    };

    const guardarEvaluacion = async () => {
        if (!reservaId) return;

        setError('');
        setMensajeEvaluacion('');
        setAdvertenciasEvaluacion([]);

        const scoreNumero = Number(scoreRiesgo);

        if (Number.isNaN(scoreNumero) || scoreNumero < 0 || scoreNumero > 100) {
            setError('El score de riesgo debe ser un número entre 0 y 100.');
            return;
        }

        if (observaciones.trim().length > 500) {
            setError('Las observaciones no pueden superar los 500 caracteres.');
            return;
        }

        try {
            setGuardandoEvaluacion(true);

            const response = await registrarEvaluacionInquilinoGestion(reservaId, {
                score_riesgo: scoreNumero,
                resultado,
                observaciones: observaciones.trim() || undefined
            });

            setMensajeEvaluacion(response.mensaje || 'Evaluación registrada correctamente.');
            setAdvertenciasEvaluacion(response.advertencias || []);

            const vettingActualizado = await obtenerVettingInquilinoGestion(reservaId);
            const evaluacionesActualizadas = await obtenerEvaluacionesInquilinoGestion(reservaId);

            setVetting(vettingActualizado);
            setEvaluaciones(evaluacionesActualizadas.evaluaciones || []);

            onEvaluacionRegistrada?.();

        } catch (err) {
            const mensajeError =
                err instanceof Error
                    ? err.message
                    : 'Error al registrar la evaluación del inquilino.';

            setError(mensajeError);
        } finally {
            setGuardandoEvaluacion(false);
        }
    };

    if (!abierto) return null;

    const advertenciaLocal = obtenerAdvertenciaLocalEvaluacion();

    const puedeAprobarSolicitud =
        vetting?.solicitud.estado_reserva === 'SOLICITADA' &&
        vetting?.evaluacion_inquilino?.resultado === 'APROBADO';

    const perfil = vetting?.inquilino.perfil;
    const vettingBasico = vetting?.inquilino.vetting_basico;
    const resumen = vetting?.resumen_automatico;
    const evaluacionSugerida = vetting?.evaluacion_sugerida;
    const evaluacionActual = vetting?.evaluacion_inquilino;

    return (
        <div className="detalle-solicitud-overlay">
            <div className="detalle-solicitud-dialog vetting-dialog">
                <div className="detalle-solicitud-header">
                    <div>
                        <p className="detalle-solicitud-subtitle">
                            Revision de inquilino
                        </p>
                        <h2>
                            {perfil?.nombres || 'Inquilino'} {perfil?.apellidos || ''}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="detalle-solicitud-close"
                        onClick={cerrar}
                    >
                        ×
                    </button>
                </div>

                {cargando && (
                    <div className="gestion-card gestion-empty-card">
                        Cargando vetting del inquilino...
                    </div>
                )}

                {error && (
                    <div className="gestion-alert gestion-alert-error">
                        {error}
                    </div>
                )}

                {!cargando && vetting && (
                    <>
                        <section className="detalle-solicitud-card">
                            <h3>Solicitud actual</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Reserva:</strong> #{vetting.solicitud.reserva_id}
                                </p>

                                <p>
                                    <strong>Estado:</strong> {vetting.solicitud.estado_reserva}
                                </p>

                                <p>
                                    <strong>Ingreso:</strong>{' '}
                                    {formatearFecha(vetting.solicitud.fecha_inicio)}
                                </p>

                                <p>
                                    <strong>Salida:</strong>{' '}
                                    {formatearFecha(vetting.solicitud.fecha_fin)}
                                </p>

                                <p>
                                    <strong>Inmueble:</strong>{' '}
                                    {vetting.inmueble.nombre}
                                </p>

                                <p>
                                    <strong>Renta:</strong>{' '}
                                    {vetting.solicitud.moneda} {vetting.solicitud.renta_pactada_mensual}
                                </p>
                            </div>
                        </section>

                        <section className="detalle-solicitud-card">
                            <h3>Perfil básico del inquilino</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Correo:</strong>{' '}
                                    {vetting.inquilino.correo}
                                </p>

                                <p>
                                    <strong>Email verificado:</strong>{' '}
                                    {vetting.inquilino.email_verificado ? 'Sí' : 'No'}
                                </p>

                                <p>
                                    <strong>Documento:</strong>{' '}
                                    {perfil?.tipo_documento || 'No registrado'}{' '}
                                    {perfil?.numero_documento || ''}
                                </p>

                                <p>
                                    <strong>Teléfono:</strong>{' '}
                                    {perfil?.telefono || 'No registrado'}
                                </p>

                                <p>
                                    <strong>Dirección:</strong>{' '}
                                    {perfil?.direccion || 'No registrada'}
                                </p>

                                <p>
                                    <strong>Ciudad:</strong>{' '}
                                    {perfil?.ciudad || 'No registrada'}
                                </p>
                            </div>
                        </section>

                        <section className="detalle-solicitud-card">
                            <h3>Vetting básico</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Ingreso mensual:</strong>{' '}
                                    {formatearMoneda(vettingBasico?.ingreso_mensual_referencial)}
                                </p>

                                <p>
                                    <strong>Aval bancario:</strong>{' '}
                                    {vettingBasico?.tiene_aval_bancario ? 'Sí' : 'No'}
                                </p>

                                <p>
                                    <strong>Contrato de trabajo:</strong>{' '}
                                    {vettingBasico?.tiene_contrato_trabajo ? 'Sí' : 'No'}
                                </p>

                                <p>
                                    <strong>Garante:</strong>{' '}
                                    {vettingBasico?.tiene_garante ? 'Sí' : 'No'}
                                </p>
                            </div>
                        </section>

                        <section className="detalle-solicitud-card vetting-resumen-card">
                            <h3>Resumen automático</h3>

                            <p>
                                <strong>Nivel sugerido:</strong>{' '}
                                {resumen?.nivel_riesgo_sugerido}
                            </p>

                            <p>
                                <strong>Recomendación:</strong>{' '}
                                {resumen?.recomendacion}
                            </p>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Alertas:</strong>{' '}
                                    {resumen?.total_alertas}
                                </p>

                                <p>
                                    <strong>Puntos fuertes:</strong>{' '}
                                    {resumen?.total_puntos_fuertes}
                                </p>
                            </div>

                            {resumen?.alertas && resumen.alertas.length > 0 && (
                                <div className="vetting-alertas-list">
                                    {resumen.alertas.map((alerta) => (
                                        <div
                                            key={`${alerta.tipo}-${alerta.mensaje}`}
                                            className={`vetting-alerta-item alerta-${alerta.nivel.toLowerCase()}`}
                                        >
                                            <strong>{alerta.nivel}</strong>
                                            <span>{alerta.mensaje}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="detalle-solicitud-card">
                            <h3>Evaluación sugerida</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Resultado sugerido:</strong>{' '}
                                    {evaluacionSugerida?.resultado_sugerido}
                                </p>

                                <p>
                                    <strong>Score sugerido:</strong>{' '}
                                    {evaluacionSugerida?.score_riesgo_sugerido}/100
                                </p>
                            </div>

                            <p>{evaluacionSugerida?.mensaje}</p>
                        </section>

                        {vetting.solicitud.estado_reserva === 'SOLICITADA' && (
                            <section className="detalle-solicitud-card vetting-form-card">
                                <h3>Registrar evaluación del inquilino</h3>

                                <div className="vetting-form-sugerencia">
                                    <div>
                                        <strong>Sugerencia automática</strong>
                                        <p>
                                            Resultado sugerido: {vetting.evaluacion_sugerida.resultado_sugerido} · 
                                            Score {vetting.evaluacion_sugerida.score_riesgo_sugerido}/100
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="gestion-btn-secondary"
                                        onClick={usarEvaluacionSugerida}
                                        disabled={guardandoEvaluacion}
                                    >
                                        Usar sugerencia
                                    </button>
                                </div>

                                <div className="detalle-solicitud-grid">
                                    <div className="vetting-form-field">
                                        <label>Score de riesgo</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={scoreRiesgo}
                                            onChange={(e) => setScoreRiesgo(e.target.value)}
                                            disabled={guardandoEvaluacion}
                                        />
                                        <small>Valor entre 0 y 100.</small>
                                    </div>

                                    <div className="vetting-form-field">
                                        <label>Resultado</label>
                                        <select
                                            value={resultado}
                                            onChange={(e) =>
                                                setResultado(
                                                    e.target.value as 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO'
                                                )
                                            }
                                            disabled={guardandoEvaluacion}
                                        >
                                            <option value="APROBADO">APROBADO</option>
                                            <option value="OBSERVADO">OBSERVADO</option>
                                            <option value="RECHAZADO">RECHAZADO</option>
                                            <option value="PENDIENTE">PENDIENTE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="vetting-form-field">
                                    <label>Observaciones</label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        maxLength={500}
                                        disabled={guardandoEvaluacion}
                                        placeholder="Describe brevemente el criterio usado para evaluar al inquilino."
                                    />
                                    <small>{observaciones.length}/500 caracteres</small>
                                </div>

                                <div className={`vetting-preview-evaluacion ${obtenerClaseResultadoEvaluacion()}`}>
                                    <div>
                                        <strong>Vista previa de evaluación</strong>
                                        <p>
                                            Resultado: {resultado} · Score:{' '}
                                            {scoreRiesgo || 'No definido'}/100
                                        </p>
                                    </div>

                                    {advertenciaLocal && (
                                        <div className="vetting-preview-warning">
                                            {advertenciaLocal}
                                        </div>
                                    )}
                                </div>

                                {mensajeEvaluacion && (
                                    <div className="gestion-alert gestion-alert-success">
                                        {mensajeEvaluacion}
                                    </div>
                                )}

                                {advertenciasEvaluacion.length > 0 && (
                                    <div className="vetting-alertas-list">
                                        {advertenciasEvaluacion.map((advertencia) => (
                                            <div
                                                key={`${advertencia.tipo}-${advertencia.mensaje}`}
                                                className={`vetting-alerta-item alerta-${advertencia.nivel.toLowerCase()}`}
                                            >
                                                <strong>{advertencia.nivel}</strong>
                                                <span>{advertencia.mensaje}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="gestion-btn-primary"
                                    onClick={guardarEvaluacion}
                                    disabled={guardandoEvaluacion}
                                >
                                    {guardandoEvaluacion ? 'Guardando evaluación...' : 'Guardar evaluación'}
                                </button>
                            </section>
                        )}

                        <section className="detalle-solicitud-card">
                            <h3>Evaluación registrada</h3>

                            {evaluacionActual ? (
                                <div className="detalle-solicitud-grid">
                                    <p>
                                        <strong>Resultado:</strong>{' '}
                                        {evaluacionActual.resultado}
                                    </p>

                                    <p>
                                        <strong>Score:</strong>{' '}
                                        {evaluacionActual.score_riesgo}/100
                                    </p>

                                    <p>
                                        <strong>Historial:</strong>{' '}
                                        {evaluacionActual.historial_reservas ?? 0} solicitud(es)
                                    </p>

                                    <p>
                                        <strong>Fecha:</strong>{' '}
                                        {formatearFecha(evaluacionActual.fecha_evaluacion)}
                                    </p>

                                    <p>
                                        <strong>Observaciones:</strong>{' '}
                                        {evaluacionActual.observaciones || 'Sin observaciones'}
                                    </p>
                                </div>
                            ) : (
                                <p>No se ha registrado una evaluación para esta solicitud.</p>
                            )}
                        </section>

                        {puedeAprobarSolicitud && (
                            <section className="detalle-solicitud-card vetting-ready-card">
                                <h3>Solicitud lista para aprobación</h3>

                                <p>
                                    El inquilino ya cuenta con una evaluación de vetting aprobada.
                                    Puedes cerrar este modal y aprobar la solicitud desde la lista principal.
                                </p>

                                <button
                                    type="button"
                                    className="gestion-btn-primary"
                                    onClick={cerrar}
                                >
                                    Cerrar y volver a solicitudes
                                </button>
                            </section>
                        )}

                        <section className="detalle-solicitud-card">
                            <h3>Historial de evaluaciones</h3>

                            {evaluaciones.length === 0 ? (
                                <p>No hay evaluaciones registradas para esta solicitud.</p>
                            ) : (
                                <div className="vetting-evaluaciones-list">
                                    {evaluaciones.map((evaluacion) => (
                                        <div
                                            key={evaluacion.evaluacion_inquilino_id}
                                            className={`vetting-evaluacion-item resultado-${evaluacion.resultado.toLowerCase()}`}
                                        >
                                            <div>
                                                <strong>
                                                    {evaluacion.resultado} · Score {evaluacion.score_riesgo}/100
                                                </strong>

                                                <p>
                                                    {evaluacion.observaciones || 'Sin observaciones registradas.'}
                                                </p>

                                                <small>
                                                    Evaluado por:{' '}
                                                    {evaluacion.nombres_evaluador || 'Usuario'}{' '}
                                                    {evaluacion.apellidos_evaluador || ''}
                                                    {' '}· {formatearFecha(evaluacion.fecha_evaluacion)}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="detalle-solicitud-card">
                            <h3>Historial del inquilino</h3>

                            <div className="detalle-solicitud-grid">
                                <p>
                                    <strong>Total solicitudes:</strong>{' '}
                                    {vetting.resumen_historial.total_solicitudes}
                                </p>

                                <p>
                                    <strong>Aprobadas:</strong>{' '}
                                    {vetting.resumen_historial.total_aprobadas}
                                </p>

                                <p>
                                    <strong>Rechazadas:</strong>{' '}
                                    {vetting.resumen_historial.total_rechazadas}
                                </p>

                                <p>
                                    <strong>Finalizadas:</strong>{' '}
                                    {vetting.resumen_historial.total_finalizadas}
                                </p>
                            </div>

                            {vetting.historial_reservas.length > 0 && (
                                <div className="vetting-historial-list">
                                    {vetting.historial_reservas.map((reserva) => (
                                        <div
                                            key={reserva.reserva_id}
                                            className="vetting-historial-item"
                                        >
                                            <strong>
                                                #{reserva.reserva_id} - {reserva.estado_reserva}
                                            </strong>
                                            <span>
                                                {reserva.nombre_inmueble} | {formatearFecha(reserva.fecha_inicio)} - {formatearFecha(reserva.fecha_fin)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default VettingInquilinoDialog;