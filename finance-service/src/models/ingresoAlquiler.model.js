const { getPostgresPool } = require('../config/postgresDb');

const {
  obtenerReservaFinance
} = require('../clients/booking.client');

const {
  obtenerPublicacionPorInmuebleCatalog
} = require('../clients/catalog.client');

const redondear2 = (valor) => {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
};

const obtenerPublicacionSegura = async (inmueble_id) => {
  try {
    return await obtenerPublicacionPorInmuebleCatalog(inmueble_id);
  } catch (error) {
    console.error('Error obteniendo inmueble desde catalog-service:', error.message);
    return null;
  }
};

const mapCuenta = (cuenta) => {
  if (!cuenta) return null;

  return {
    ...cuenta,
    saldo_inicial: redondear2(cuenta.saldo_inicial),
    saldo_actual: redondear2(cuenta.saldo_actual)
  };
};

const mapRecibo = async (recibo) => {
  let reserva = null;
  let publicacion = null;

  if (recibo.reserva_id) {
    reserva = await obtenerReservaFinance(recibo.reserva_id);
  }

  if (recibo.inmueble_id) {
    publicacion = await obtenerPublicacionSegura(recibo.inmueble_id);
  }

  return {
    ...recibo,
    subtotal: redondear2(recibo.subtotal),
    igv_total: redondear2(recibo.igv_total),
    total: redondear2(recibo.total),
    saldo_pendiente: redondear2(recibo.saldo_pendiente),

    numero_recibo: `B-${String(recibo.recibo_id).padStart(6, '0')}`,
    moneda: reserva?.moneda || 'PEN',

    inmueble_id: recibo.inmueble_id,
    codigo_inmueble:
      publicacion?.codigo_inmueble ||
      publicacion?.codigo ||
      null,
    inmueble:
      publicacion?.nombre_inmueble ||
      publicacion?.nombre ||
      publicacion?.titulo ||
      null,
    nombre_inmueble:
      publicacion?.nombre_inmueble ||
      publicacion?.nombre ||
      publicacion?.titulo ||
      null,

    empresa_id: publicacion?.empresa_id || null,
    reserva,
    inquilino_id: reserva?.inquilino_id || null
  };
};

const listarCategoriasIngreso = async () => {
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT
      categoria_movimiento_id,
      nombre,
      naturaleza,
      descripcion,
      activo,
      created_at
    FROM categoria_movimiento
    WHERE activo = TRUE
      AND UPPER(naturaleza) = 'INGRESO'
    ORDER BY nombre ASC;
  `);

  return result.rows;
};

const listarCuentasIngresoPorEmpresa = async (empresa_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      cb.cuenta_bancaria_id,
      cb.empresa_id,
      cb.banco_id,
      b.nombre AS banco,
      b.codigo AS codigo_banco,
      cb.nombre_cuenta,
      cb.numero_cuenta,
      cb.cci,
      cb.moneda,
      cb.tipo_cuenta,
      cb.saldo_inicial,
      cb.saldo_actual,
      cb.activa,
      cb.created_at
    FROM cuenta_bancaria cb
    INNER JOIN banco b
      ON b.banco_id = cb.banco_id
    WHERE cb.empresa_id = $1
      AND cb.activa = TRUE
    ORDER BY cb.nombre_cuenta ASC;
    `,
    [empresa_id]
  );

  return result.rows.map(mapCuenta);
};

const listarRecibosPendientesIngreso = async (empresa_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT
      r.recibo_id,
      r.cuenta_cobro_inmueble_id,
      r.reserva_id,
      r.periodo_anio,
      r.periodo_mes,
      r.fecha_emision,
      r.fecha_vencimiento,
      r.estado_recibo,
      r.subtotal,
      r.igv_total,
      r.total,
      r.saldo_pendiente,
      r.pdf_url,
      r.observaciones,
      r.created_at,
      r.updated_at,

      cc.inmueble_id,
      cc.numero_recibo_base
    FROM recibo r
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE r.estado_recibo IN ('PENDIENTE', 'PARCIAL')
      AND r.saldo_pendiente > 0
    ORDER BY r.fecha_vencimiento ASC, r.recibo_id ASC;
  `);

  const recibos = [];

  for (const recibo of result.rows) {
    const reciboMapeado = await mapRecibo(recibo);

    if (Number(reciboMapeado.empresa_id) === Number(empresa_id)) {
      recibos.push(reciboMapeado);
    }
  }

  return recibos;
};

const obtenerCuentaPorEmpresa = async (empresa_id, cuenta_bancaria_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      cb.cuenta_bancaria_id,
      cb.empresa_id,
      cb.banco_id,
      b.nombre AS banco,
      b.codigo AS codigo_banco,
      cb.nombre_cuenta,
      cb.numero_cuenta,
      cb.cci,
      cb.moneda,
      cb.tipo_cuenta,
      cb.saldo_inicial,
      cb.saldo_actual,
      cb.activa,
      cb.created_at
    FROM cuenta_bancaria cb
    INNER JOIN banco b
      ON b.banco_id = cb.banco_id
    WHERE cb.empresa_id = $1
      AND cb.cuenta_bancaria_id = $2
      AND cb.activa = TRUE;
    `,
    [empresa_id, cuenta_bancaria_id]
  );

  return mapCuenta(result.rows[0]);
};

const obtenerCategoriaIngresoPorId = async (categoria_movimiento_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      categoria_movimiento_id,
      nombre,
      naturaleza,
      descripcion,
      activo,
      created_at
    FROM categoria_movimiento
    WHERE categoria_movimiento_id = $1
      AND activo = TRUE
      AND UPPER(naturaleza) = 'INGRESO';
    `,
    [categoria_movimiento_id]
  );

  return result.rows[0] || null;
};

const obtenerReciboPendientePorEmpresa = async (empresa_id, recibo_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      r.recibo_id,
      r.cuenta_cobro_inmueble_id,
      r.reserva_id,
      r.periodo_anio,
      r.periodo_mes,
      r.fecha_emision,
      r.fecha_vencimiento,
      r.estado_recibo,
      r.subtotal,
      r.igv_total,
      r.total,
      r.saldo_pendiente,
      r.pdf_url,
      r.observaciones,
      r.created_at,
      r.updated_at,

      cc.inmueble_id,
      cc.numero_recibo_base
    FROM recibo r
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE r.recibo_id = $1
      AND r.estado_recibo IN ('PENDIENTE', 'PARCIAL')
      AND r.saldo_pendiente > 0;
    `,
    [recibo_id]
  );

  const recibo = result.rows[0];

  if (!recibo) return null;

  const reciboMapeado = await mapRecibo(recibo);

  if (Number(reciboMapeado.empresa_id) !== Number(empresa_id)) {
    return null;
  }

  return reciboMapeado;
};

const registrarIngresoAlquiler = async (
  empresa_id,
  data,
  usuario_registrador_id
) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const metodoPagoNormalizado = String(data.metodo_pago || '')
      .trim()
      .toUpperCase();

    const metodosPermitidos = [
      'ONLINE',
      'TARJETA',
      'TRANSFERENCIA',
      'EFECTIVO',
      'DEPOSITO'
    ];

    if (!metodosPermitidos.includes(metodoPagoNormalizado)) {
      throw new Error('METODO_PAGO_NO_VALIDO');
    }

    const cuentaResult = await client.query(
      `
      SELECT
        cuenta_bancaria_id,
        empresa_id,
        saldo_actual
      FROM cuenta_bancaria
      WHERE empresa_id = $1
        AND cuenta_bancaria_id = $2
        AND activa = TRUE
      FOR UPDATE;
      `,
      [empresa_id, data.cuenta_bancaria_id]
    );

    const cuenta = cuentaResult.rows[0];

    if (!cuenta) {
      throw new Error('CUENTA_NO_VALIDA');
    }

    const categoriaResult = await client.query(
      `
      SELECT
        categoria_movimiento_id,
        nombre,
        naturaleza
      FROM categoria_movimiento
      WHERE categoria_movimiento_id = $1
        AND activo = TRUE
        AND UPPER(naturaleza) = 'INGRESO';
      `,
      [data.categoria_movimiento_id]
    );

    const categoria = categoriaResult.rows[0];

    if (!categoria) {
      throw new Error('CATEGORIA_NO_VALIDA');
    }

    const reciboResult = await client.query(
      `
      SELECT
        r.recibo_id,
        r.cuenta_cobro_inmueble_id,
        r.reserva_id,
        r.estado_recibo,
        r.total,
        r.saldo_pendiente,
        r.fecha_emision,
        cc.inmueble_id
      FROM recibo r
      INNER JOIN cuenta_cobro_inmueble cc
        ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
      WHERE r.recibo_id = $1
      FOR UPDATE;
      `,
      [data.recibo_id]
    );

    const recibo = reciboResult.rows[0];

    if (!recibo) {
      throw new Error('RECIBO_NO_VALIDO');
    }

    const publicacion = await obtenerPublicacionSegura(recibo.inmueble_id);

    if (Number(publicacion?.empresa_id) !== Number(empresa_id)) {
      throw new Error('RECIBO_NO_VALIDO');
    }

    if (String(recibo.estado_recibo).toUpperCase() === 'ANULADO') {
      throw new Error('RECIBO_ANULADO');
    }

    if (
      String(recibo.estado_recibo).toUpperCase() === 'PAGADO' ||
      Number(recibo.saldo_pendiente) <= 0
    ) {
      throw new Error('RECIBO_YA_PAGADO');
    }

    const importe = redondear2(data.importe);
    const saldoPendienteActual = redondear2(recibo.saldo_pendiente);

    if (importe <= 0) {
      throw new Error('IMPORTE_INVALIDO');
    }

    if (importe > saldoPendienteActual) {
      throw new Error('IMPORTE_SUPERA_SALDO');
    }

    const nuevoSaldoPendiente = redondear2(saldoPendienteActual - importe);
    const nuevoEstadoRecibo = nuevoSaldoPendiente <= 0 ? 'PAGADO' : 'PARCIAL';

    const reserva = recibo.reserva_id
      ? await obtenerReservaFinance(recibo.reserva_id)
      : null;

    const saldoAnteriorCuenta = redondear2(cuenta.saldo_actual);
    const saldoPosteriorCuenta = redondear2(saldoAnteriorCuenta + importe);

    const referencia = data.referencia_externa
      ? String(data.referencia_externa).trim()
      : null;

    const observacionesPago = data.observaciones
      ? String(data.observaciones).trim()
      : null;

    const fechaMovimiento = data.fecha_movimiento
      ? new Date(data.fecha_movimiento)
      : new Date();

    const pagoResult = await client.query(
      `
      INSERT INTO pago (
        recibo_id,
        reserva_id,
        usuario_pagador_id,
        metodo_pago,
        proveedor_pasarela,
        transaccion_externa,
        referencia,
        monto,
        moneda,
        estado_pago,
        fecha_pago,
        fecha_confirmacion,
        observaciones,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, 'MANUAL',
        $5, $6, $7, $8, 'CONFIRMADO',
        $9, $9, $10, CURRENT_TIMESTAMP
      )
      RETURNING
        pago_id,
        recibo_id,
        reserva_id,
        usuario_pagador_id,
        metodo_pago,
        proveedor_pasarela,
        transaccion_externa,
        referencia,
        monto,
        moneda,
        estado_pago,
        fecha_pago,
        fecha_confirmacion,
        observaciones,
        created_at;
      `,
      [
        recibo.recibo_id,
        recibo.reserva_id,
        reserva?.inquilino_id || usuario_registrador_id || null,
        metodoPagoNormalizado,
        `MANUAL-HU19-${Date.now()}-${recibo.recibo_id}`,
        referencia,
        importe,
        reserva?.moneda || 'PEN',
        fechaMovimiento,
        observacionesPago
      ]
    );

    const pago = pagoResult.rows[0];

    const movimientoResult = await client.query(
      `
      INSERT INTO movimiento_bancario (
        cuenta_bancaria_id,
        categoria_movimiento_id,
        tipo_movimiento,
        inmueble_id,
        reserva_id,
        recibo_id,
        pago_id,
        fecha_movimiento,
        concepto,
        descripcion,
        importe,
        saldo_anterior,
        saldo_posterior,
        referencia_externa,
        observaciones,
        created_at
      )
      VALUES (
        $1, $2, 'INGRESO',
        $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14,
        CURRENT_TIMESTAMP
      )
      RETURNING
        movimiento_bancario_id,
        cuenta_bancaria_id,
        categoria_movimiento_id,
        tipo_movimiento,
        inmueble_id,
        reserva_id,
        recibo_id,
        pago_id,
        fecha_movimiento,
        concepto,
        descripcion,
        importe,
        saldo_anterior,
        saldo_posterior,
        referencia_externa,
        observaciones,
        created_at;
      `,
      [
        cuenta.cuenta_bancaria_id,
        categoria.categoria_movimiento_id,
        recibo.inmueble_id || null,
        recibo.reserva_id || null,
        recibo.recibo_id,
        pago.pago_id,
        fechaMovimiento,
        data.concepto || `Ingreso de alquiler - Recibo B-${String(recibo.recibo_id).padStart(6, '0')}`,
        data.descripcion || `Ingreso registrado por ${metodoPagoNormalizado}`,
        importe,
        saldoAnteriorCuenta,
        saldoPosteriorCuenta,
        referencia,
        observacionesPago
      ]
    );

    await client.query(
      `
      UPDATE cuenta_bancaria
      SET saldo_actual = $1
      WHERE cuenta_bancaria_id = $2;
      `,
      [saldoPosteriorCuenta, cuenta.cuenta_bancaria_id]
    );

    await client.query(
      `
      UPDATE recibo
      SET
        saldo_pendiente = $1,
        estado_recibo = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE recibo_id = $3;
      `,
      [
        nuevoSaldoPendiente,
        nuevoEstadoRecibo,
        recibo.recibo_id
      ]
    );

    await client.query('COMMIT');

    return {
      pago: {
        ...pago,
        monto: redondear2(pago.monto)
      },
      movimiento: {
        ...movimientoResult.rows[0],
        importe: redondear2(movimientoResult.rows[0].importe),
        saldo_anterior: redondear2(movimientoResult.rows[0].saldo_anterior),
        saldo_posterior: redondear2(movimientoResult.rows[0].saldo_posterior)
      },
      recibo: {
        recibo_id: recibo.recibo_id,
        estado_recibo: nuevoEstadoRecibo,
        saldo_pendiente: nuevoSaldoPendiente
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarIngresosAlquiler = async (empresa_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT
      mb.movimiento_bancario_id,
      mb.cuenta_bancaria_id,
      mb.categoria_movimiento_id,
      mb.tipo_movimiento,
      mb.inmueble_id,
      mb.reserva_id,
      mb.recibo_id,
      mb.pago_id,
      mb.fecha_movimiento,
      mb.concepto,
      mb.descripcion,
      mb.importe,
      mb.saldo_anterior,
      mb.saldo_posterior,
      mb.referencia_externa,
      mb.observaciones,
      mb.created_at,

      cm.nombre AS categoria,
      cb.empresa_id,
      cb.nombre_cuenta,
      cb.numero_cuenta,
      cb.moneda,
      b.nombre AS banco,

      p.metodo_pago,
      p.estado_pago,
      p.fecha_confirmacion
    FROM movimiento_bancario mb
    INNER JOIN categoria_movimiento cm
      ON cm.categoria_movimiento_id = mb.categoria_movimiento_id
    INNER JOIN cuenta_bancaria cb
      ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
    INNER JOIN banco b
      ON b.banco_id = cb.banco_id
    LEFT JOIN pago p
      ON p.pago_id = mb.pago_id
    WHERE cb.empresa_id = $1
      AND UPPER(mb.tipo_movimiento) = 'INGRESO'
    ORDER BY mb.fecha_movimiento DESC, mb.movimiento_bancario_id DESC;
  `, [empresa_id]);

  const ingresos = [];

  for (const ingreso of result.rows) {
    const publicacion = ingreso.inmueble_id
      ? await obtenerPublicacionSegura(ingreso.inmueble_id)
      : null;

    ingresos.push({
      ...ingreso,
      importe: redondear2(ingreso.importe),
      saldo_anterior: redondear2(ingreso.saldo_anterior),
      saldo_posterior: redondear2(ingreso.saldo_posterior),
      codigo_inmueble:
        publicacion?.codigo_inmueble ||
        publicacion?.codigo ||
        null,
      inmueble:
        publicacion?.nombre_inmueble ||
        publicacion?.nombre ||
        publicacion?.titulo ||
        null
    });
  }

  return ingresos;
};

module.exports = {
  listarCategoriasIngreso,
  listarCuentasIngresoPorEmpresa,
  listarRecibosPendientesIngreso,
  obtenerCuentaPorEmpresa,
  obtenerCategoriaIngresoPorId,
  obtenerReciboPendientePorEmpresa,
  registrarIngresoAlquiler,
  listarIngresosAlquiler
};