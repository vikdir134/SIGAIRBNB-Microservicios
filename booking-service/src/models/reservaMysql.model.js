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

const listarSolicitudesGestionEmpresaMysqlModel = async (filtros = {}) => {
  const pool = getMySqlPool();

  const { estado_reserva } = filtros;

  const condiciones = [];
  const params = [];

  if (estado_reserva) {
    condiciones.push('r.estado_reserva = ?');
    params.push(estado_reserva);
  }

  const whereSql = condiciones.length
    ? `WHERE ${condiciones.join(' AND ')}`
    : '';

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
      r.gestionado_por_usuario_id,

      r.fecha_checkin,
      r.fecha_checkout,
      r.checkin_confirmado_por,
      r.checkout_confirmado_por,

      r.created_at,
      r.updated_at,

      ei.evaluacion_inquilino_id,
      ei.resultado AS resultado_evaluacion,
      ei.score_riesgo,
      ei.fecha_evaluacion,
      ei.observaciones AS observaciones_evaluacion

    FROM reserva r
    LEFT JOIN evaluacion_inquilino ei
      ON ei.evaluacion_inquilino_id = (
        SELECT ei2.evaluacion_inquilino_id
        FROM evaluacion_inquilino ei2
        WHERE ei2.reserva_id = r.reserva_id
        ORDER BY ei2.fecha_evaluacion DESC, ei2.evaluacion_inquilino_id DESC
        LIMIT 1
      )
    ${whereSql}
    ORDER BY r.fecha_solicitud DESC;
  `;

  const [rows] = await pool.execute(query, params);

  return rows;
};

const obtenerSolicitudInquilinoPorIdMysqlModel = async (
  inquilino_id,
  reserva_id
) => {
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
      r.motivo_cancelacion,
      r.fecha_decision,
      r.gestionado_por_usuario_id,
      r.fecha_checkin,
      r.fecha_checkout,
      r.checkin_confirmado_por,
      r.checkout_confirmado_por,
      r.cancelado_por_usuario_id,
      r.fecha_cancelacion,
      r.created_at,
      r.updated_at
    FROM reserva r
    WHERE r.reserva_id = ?
      AND r.inquilino_id = ?;
  `;

  const [rows] = await pool.execute(query, [reserva_id, inquilino_id]);

  return rows[0] || null;
};

const listarEventosReservaInquilinoMysqlModel = async (
  inquilino_id,
  reserva_id
) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      e.reserva_evento_id,
      e.reserva_id,
      e.usuario_id,
      e.tipo_evento,
      e.descripcion,
      e.fecha_evento
    FROM reserva_evento e
    INNER JOIN reserva r
      ON r.reserva_id = e.reserva_id
    WHERE r.reserva_id = ?
      AND r.inquilino_id = ?
    ORDER BY
      e.fecha_evento ASC,
      e.reserva_evento_id ASC;
  `;

  const [rows] = await pool.execute(query, [reserva_id, inquilino_id]);

  return rows;
};

const obtenerSolicitudExtensionPendientePorReservaMysqlModel = async (
  reserva_id
) => {
  const pool = getMySqlPool();

  const query = `
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
    FROM solicitud_extension
    WHERE reserva_id = ?
      AND estado = 'PENDIENTE'
    ORDER BY
      fecha_solicitud DESC,
      solicitud_extension_id DESC
    LIMIT 1;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows[0] || null;
};

const obtenerSolicitudGestionPorIdMysqlModel = async (reserva_id) => {
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
      r.motivo_cancelacion,
      r.fecha_decision,
      r.gestionado_por_usuario_id,
      r.fecha_checkin,
      r.fecha_checkout,
      r.checkin_confirmado_por,
      r.checkout_confirmado_por,
      r.cancelado_por_usuario_id,
      r.fecha_cancelacion,
      r.created_at,
      r.updated_at
    FROM reserva r
    WHERE r.reserva_id = ?;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows[0] || null;
};

const listarEventosReservaGestionMysqlModel = async (reserva_id) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      reserva_evento_id,
      reserva_id,
      usuario_id,
      tipo_evento,
      descripcion,
      fecha_evento
    FROM reserva_evento
    WHERE reserva_id = ?
    ORDER BY
      fecha_evento ASC,
      reserva_evento_id ASC;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows;
};

const obtenerExtensionPendienteReservaGestionMysqlModel = async (reserva_id) => {
  const pool = getMySqlPool();

  const query = `
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
    FROM solicitud_extension
    WHERE reserva_id = ?
      AND estado = 'PENDIENTE'
    ORDER BY
      fecha_solicitud DESC,
      solicitud_extension_id DESC
    LIMIT 1;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows[0] || null;
};

const listarEvaluacionesInquilinoReservaGestionMysqlModel = async (reserva_id) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      evaluacion_inquilino_id,
      reserva_id,
      evaluado_por_usuario_id,
      score_riesgo,
      historial_reservas,
      observaciones,
      resultado,
      fecha_evaluacion
    FROM evaluacion_inquilino
    WHERE reserva_id = ?
    ORDER BY
      fecha_evaluacion DESC,
      evaluacion_inquilino_id DESC;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows;
};

const obtenerUltimaEvaluacionInquilinoPorReservaMysqlModel = async (
  reserva_id
) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      evaluacion_inquilino_id,
      reserva_id,
      evaluado_por_usuario_id,
      score_riesgo,
      historial_reservas,
      observaciones,
      resultado,
      fecha_evaluacion
    FROM evaluacion_inquilino
    WHERE reserva_id = ?
    ORDER BY
      fecha_evaluacion DESC,
      evaluacion_inquilino_id DESC
    LIMIT 1;
  `;

  const [rows] = await pool.execute(query, [reserva_id]);

  return rows[0] || null;
};

const obtenerResumenHistorialInquilinoMysqlModel = async (
  inquilino_id
) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      COUNT(*) AS total_solicitudes,
      COALESCE(SUM(CASE WHEN estado_reserva = 'RECHAZADA' THEN 1 ELSE 0 END), 0) AS total_rechazadas,
      COALESCE(SUM(CASE WHEN estado_reserva = 'APROBADA' THEN 1 ELSE 0 END), 0) AS total_aprobadas,
      COALESCE(SUM(CASE WHEN estado_reserva = 'FINALIZADA' THEN 1 ELSE 0 END), 0) AS total_finalizadas,
      COALESCE(SUM(CASE WHEN estado_reserva = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS total_canceladas,
      COALESCE(SUM(CASE WHEN estado_reserva = 'ACTIVA' THEN 1 ELSE 0 END), 0) AS total_activas
    FROM reserva
    WHERE inquilino_id = ?;
  `;

  const [rows] = await pool.execute(query, [inquilino_id]);

  return rows[0] || {
    total_solicitudes: 0,
    total_rechazadas: 0,
    total_aprobadas: 0,
    total_finalizadas: 0,
    total_canceladas: 0,
    total_activas: 0
  };
};

const listarHistorialReservasInquilinoMysqlModel = async (
  inquilino_id,
  reserva_id_actual
) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      reserva_id,
      inmueble_id,
      estado_reserva,
      fecha_solicitud,
      fecha_inicio,
      fecha_fin,
      renta_pactada_mensual,
      monto_total_estimado,
      moneda
    FROM reserva
    WHERE inquilino_id = ?
      AND reserva_id <> ?
    ORDER BY fecha_solicitud DESC
    LIMIT 10;
  `;

  const [rows] = await pool.execute(query, [
    inquilino_id,
    reserva_id_actual
  ]);

  return rows;
};

const registrarEvaluacionConEventoReservaGestionMysqlModel = async ({
  reserva_id,
  evaluado_por_usuario_id,
  score_riesgo,
  historial_reservas,
  observaciones,
  resultado,
  descripcion_evento
}) => {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [evaluacionResult] = await connection.execute(
      `
      INSERT INTO evaluacion_inquilino (
        reserva_id,
        evaluado_por_usuario_id,
        score_riesgo,
        historial_reservas,
        observaciones,
        resultado,
        fecha_evaluacion
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW());
      `,
      [
        reserva_id,
        evaluado_por_usuario_id,
        score_riesgo,
        historial_reservas,
        observaciones,
        resultado
      ]
    );

    const evaluacionId = evaluacionResult.insertId;

    const [evaluacionRows] = await connection.execute(
      `
      SELECT
        evaluacion_inquilino_id,
        reserva_id,
        evaluado_por_usuario_id,
        score_riesgo,
        historial_reservas,
        observaciones,
        resultado,
        fecha_evaluacion
      FROM evaluacion_inquilino
      WHERE evaluacion_inquilino_id = ?;
      `,
      [evaluacionId]
    );

    const [eventoResult] = await connection.execute(
      `
      INSERT INTO reserva_evento (
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      )
      VALUES (?, ?, 'NOTA', ?, NOW());
      `,
      [
        reserva_id,
        evaluado_por_usuario_id,
        descripcion_evento
      ]
    );

    const eventoId = eventoResult.insertId;

    const [eventoRows] = await connection.execute(
      `
      SELECT
        reserva_evento_id,
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      FROM reserva_evento
      WHERE reserva_evento_id = ?;
      `,
      [eventoId]
    );

    await connection.commit();

    return {
      evaluacion: evaluacionRows[0],
      evento: eventoRows[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const buscarConflictosAprobacionReservaMysqlModel = async ({
  inmueble_id,
  reserva_id,
  fecha_inicio,
  fecha_fin
}) => {
  const pool = getMySqlPool();

  const query = `
    SELECT
      reserva_id,
      inmueble_id,
      inquilino_id,
      estado_reserva,
      fecha_inicio,
      fecha_fin
    FROM reserva
    WHERE inmueble_id = ?
      AND reserva_id <> ?
      AND estado_reserva IN ('APROBADA', 'ACTIVA')
      AND (
        ? <= fecha_fin
        AND ? >= fecha_inicio
      )
    ORDER BY fecha_inicio ASC;
  `;

  const [rows] = await pool.execute(query, [
    inmueble_id,
    reserva_id,
    fecha_inicio,
    fecha_fin
  ]);

  return rows;
};

const aprobarSolicitudReservaPorIdMysqlModel = async ({
  reserva_id,
  gestor_id,
  observacion_gestor
}) => {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `
      UPDATE reserva
      SET
        estado_reserva = 'APROBADA',
        observacion_gestor = ?,
        fecha_decision = NOW(),
        gestionado_por_usuario_id = ?,
        updated_at = NOW()
      WHERE reserva_id = ?
        AND estado_reserva = 'SOLICITADA';
      `,
      [
        observacion_gestor,
        gestor_id,
        reserva_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    const [reservaRows] = await connection.execute(
      `
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
        fecha_decision,
        gestionado_por_usuario_id,
        created_at,
        updated_at
      FROM reserva
      WHERE reserva_id = ?;
      `,
      [reserva_id]
    );

    const [eventoResult] = await connection.execute(
      `
      INSERT INTO reserva_evento (
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      )
      VALUES (?, ?, 'APROBACION', ?, NOW());
      `,
      [
        reserva_id,
        gestor_id,
        observacion_gestor
          ? `Solicitud aprobada. Observación: ${observacion_gestor}`
          : 'Solicitud aprobada.'
      ]
    );

    const [eventoRows] = await connection.execute(
      `
      SELECT
        reserva_evento_id,
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      FROM reserva_evento
      WHERE reserva_evento_id = ?;
      `,
      [eventoResult.insertId]
    );

    await connection.commit();

    return {
      reserva: reservaRows[0],
      evento: eventoRows[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const rechazarSolicitudReservaPorIdMysqlModel = async ({
  reserva_id,
  gestor_id,
  motivo_rechazo,
  observacion_gestor
}) => {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `
      UPDATE reserva
      SET
        estado_reserva = 'RECHAZADA',
        motivo_rechazo = ?,
        observacion_gestor = ?,
        fecha_decision = NOW(),
        gestionado_por_usuario_id = ?,
        updated_at = NOW()
      WHERE reserva_id = ?
        AND estado_reserva = 'SOLICITADA';
      `,
      [
        motivo_rechazo,
        observacion_gestor,
        gestor_id,
        reserva_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    const [reservaRows] = await connection.execute(
      `
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
        fecha_decision,
        gestionado_por_usuario_id,
        created_at,
        updated_at
      FROM reserva
      WHERE reserva_id = ?;
      `,
      [reserva_id]
    );

    const descripcionEvento = observacion_gestor
      ? `Solicitud rechazada. Motivo: ${motivo_rechazo}. Observación: ${observacion_gestor}`
      : `Solicitud rechazada. Motivo: ${motivo_rechazo}`;

    const [eventoResult] = await connection.execute(
      `
      INSERT INTO reserva_evento (
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      )
      VALUES (?, ?, 'RECHAZO', ?, NOW());
      `,
      [
        reserva_id,
        gestor_id,
        descripcionEvento.length > 500
          ? descripcionEvento.slice(0, 497) + '...'
          : descripcionEvento
      ]
    );

    const [eventoRows] = await connection.execute(
      `
      SELECT
        reserva_evento_id,
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      FROM reserva_evento
      WHERE reserva_evento_id = ?;
      `,
      [eventoResult.insertId]
    );

    await connection.commit();

    return {
      reserva: reservaRows[0],
      evento: eventoRows[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const confirmarCheckinReservaGestionMysqlModel = async ({
  reserva_id,
  gestor_id
}) => {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `
      UPDATE reserva
      SET
        estado_reserva = 'ACTIVA',
        fecha_checkin = NOW(),
        checkin_confirmado_por = ?,
        updated_at = NOW()
      WHERE reserva_id = ?
        AND estado_reserva = 'APROBADA'
        AND fecha_checkin IS NULL;
      `,
      [
        gestor_id,
        reserva_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    const [reservaRows] = await connection.execute(
      `
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
        created_at,
        updated_at
      FROM reserva
      WHERE reserva_id = ?;
      `,
      [reserva_id]
    );

    const [eventoResult] = await connection.execute(
      `
      INSERT INTO reserva_evento (
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      )
      VALUES (?, ?, 'CHECKIN', 'Check-in confirmado por el gestor.', NOW());
      `,
      [
        reserva_id,
        gestor_id
      ]
    );

    const [eventoRows] = await connection.execute(
      `
      SELECT
        reserva_evento_id,
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      FROM reserva_evento
      WHERE reserva_evento_id = ?;
      `,
      [eventoResult.insertId]
    );

    await connection.commit();

    return {
      reserva: reservaRows[0],
      evento: eventoRows[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const confirmarCheckoutReservaGestionMysqlModel = async ({
  reserva_id,
  gestor_id
}) => {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `
      UPDATE reserva
      SET
        estado_reserva = 'FINALIZADA',
        fecha_checkout = NOW(),
        checkout_confirmado_por = ?,
        updated_at = NOW()
      WHERE reserva_id = ?
        AND estado_reserva = 'ACTIVA'
        AND fecha_checkout IS NULL;
      `,
      [
        gestor_id,
        reserva_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    const [reservaRows] = await connection.execute(
      `
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
        created_at,
        updated_at
      FROM reserva
      WHERE reserva_id = ?;
      `,
      [reserva_id]
    );

    const [eventoResult] = await connection.execute(
      `
      INSERT INTO reserva_evento (
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      )
      VALUES (?, ?, 'CHECKOUT', 'Check-out confirmado por el gestor.', NOW());
      `,
      [
        reserva_id,
        gestor_id
      ]
    );

    const [eventoRows] = await connection.execute(
      `
      SELECT
        reserva_evento_id,
        reserva_id,
        usuario_id,
        tipo_evento,
        descripcion,
        fecha_evento
      FROM reserva_evento
      WHERE reserva_evento_id = ?;
      `,
      [eventoResult.insertId]
    );

    await connection.commit();

    return {
      reserva: reservaRows[0],
      evento: eventoRows[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listarReservasPorRangoInternoMysqlModel,
  listarSolicitudesPorInquilinoMysqlModel,
  listarSolicitudesGestionEmpresaMysqlModel,
  obtenerSolicitudInquilinoPorIdMysqlModel,
  listarEventosReservaInquilinoMysqlModel,
  obtenerSolicitudExtensionPendientePorReservaMysqlModel,
  obtenerSolicitudGestionPorIdMysqlModel,
  listarEventosReservaGestionMysqlModel,
  obtenerExtensionPendienteReservaGestionMysqlModel,
  listarEvaluacionesInquilinoReservaGestionMysqlModel,
  obtenerUltimaEvaluacionInquilinoPorReservaMysqlModel,
  obtenerResumenHistorialInquilinoMysqlModel,
  listarHistorialReservasInquilinoMysqlModel,
  registrarEvaluacionConEventoReservaGestionMysqlModel,
  buscarConflictosAprobacionReservaMysqlModel,
  aprobarSolicitudReservaPorIdMysqlModel,
  rechazarSolicitudReservaPorIdMysqlModel,
  confirmarCheckinReservaGestionMysqlModel,
  confirmarCheckoutReservaGestionMysqlModel
};