const { getMySqlPool } = require('../config/mysqlDb');

const listarReservasPorRangoInternoMysqlModel = async ({
  inmueble_id,
  fecha_inicio,
  fecha_fin,
  estados
}) => {
  const pool = getMySqlPool();

  const estadosPermitidos = [
    'SOLICITADA',
    'APROBADA',
    'ACTIVA',
    'FINALIZADA',
    'CANCELADA',
    'RECHAZADA',
    'EXPIRADA'
  ];

  const estadosFiltrados = Array.isArray(estados)
    ? estados.filter((estado) => estadosPermitidos.includes(estado))
    : ['SOLICITADA', 'APROBADA', 'ACTIVA'];

  if (estadosFiltrados.length === 0) {
    return [];
  }

  const placeholders = estadosFiltrados.map(() => '?').join(', ');

  const query = `
    SELECT
      r.reserva_id,
      r.inmueble_id,
      r.inquilino_id,
      r.estado_reserva,
      r.fecha_solicitud,
      r.fecha_inicio,
      r.fecha_fin,
      r.renta_pactada_mensual,
      r.monto_total_estimado,
      r.moneda,
      r.observacion_inquilino
    FROM reserva r
    WHERE r.inmueble_id = ?
      AND r.estado_reserva IN (${placeholders})
      AND (
        ? <= r.fecha_fin
        AND ? >= r.fecha_inicio
      )
    ORDER BY r.fecha_inicio ASC;
  `;

  const params = [
    inmueble_id,
    ...estadosFiltrados,
    fecha_inicio,
    fecha_fin
  ];

  const [rows] = await pool.execute(query, params);

  return rows;
};

const listarSolicitudesPorInquilinoMysqlModel = async (inquilino_id) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      r.reserva_id,
      r.inmueble_id,
      r.inquilino_id,
      r.estado_reserva,
      r.fecha_solicitud,
      r.fecha_inicio,
      r.fecha_fin,
      r.renta_pactada_mensual,
      r.monto_total_estimado,
      r.deposito_garantia,
      r.moneda,
      r.observacion_inquilino,
      r.observacion_gestor,
      r.motivo_rechazo,
      r.fecha_decision,
      r.created_at
    FROM reserva r
    WHERE r.inquilino_id = ?
    ORDER BY r.fecha_solicitud DESC;
  `;

  const [rows] = await pool.execute(query, [inquilino_id]);

  return rows;
};

module.exports = {
  listarReservasPorRangoInternoMysqlModel,
  listarSolicitudesPorInquilinoMysqlModel
};