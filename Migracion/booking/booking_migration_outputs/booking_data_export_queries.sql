-- ============================================================
-- Consultas para exportar datos desde Azure SQL / SQL Server original.
-- Ejecutar sobre la base original y exportar cada resultado a CSV.
-- Luego importar cada CSV en MySQL en el mismo orden.
-- ============================================================

-- 1. Exportar booking.Reserva -> reserva.csv
SELECT
  reserva_id,
  inmueble_id,
  inquilino_id,
  estado_reserva,
  fecha_solicitud,
  fecha_inicio,
  fecha_fin,
  renta_pactada_mensual,
  monto_total_estimado,
  deposito_garantia,
  moneda,
  observacion_inquilino,
  observacion_gestor,
  motivo_rechazo,
  motivo_cancelacion,
  fecha_decision,
  gestionado_por_usuario_id,
  fecha_checkin,
  fecha_checkout,
  checkin_confirmado_por,
  checkout_confirmado_por,
  cancelado_por_usuario_id,
  fecha_cancelacion,
  created_at,
  updated_at
FROM booking.Reserva
ORDER BY reserva_id;

-- 2. Exportar booking.ReservaEvento -> reserva_evento.csv
SELECT
  reserva_evento_id,
  reserva_id,
  usuario_id,
  tipo_evento,
  descripcion,
  fecha_evento
FROM booking.ReservaEvento
ORDER BY reserva_evento_id;

-- 3. Exportar booking.EvaluacionInquilino -> evaluacion_inquilino.csv
SELECT
  evaluacion_inquilino_id,
  reserva_id,
  evaluado_por_usuario_id,
  score_riesgo,
  historial_reservas,
  observaciones,
  resultado,
  fecha_evaluacion
FROM booking.EvaluacionInquilino
ORDER BY evaluacion_inquilino_id;

-- 4. Exportar booking.SolicitudExtension -> solicitud_extension.csv
SELECT
  solicitud_extension_id,
  reserva_id,
  solicitante_usuario_id,
  nueva_fecha_fin,
  motivo,
  estado,
  fecha_solicitud,
  fecha_decision,
  decidido_por_usuario_id,
  comentario_decision
FROM booking.SolicitudExtension
ORDER BY solicitud_extension_id;
