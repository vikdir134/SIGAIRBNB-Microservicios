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

const mapReciboPago = async (recibo, reserva = null) => {
  let reservaFinal = reserva;

  if (!reservaFinal && recibo.reserva_id) {
    reservaFinal = await obtenerReservaFinance(recibo.reserva_id);
  }

  let publicacion = null;

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
    moneda: reservaFinal?.moneda || 'PEN',

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

    reserva: reservaFinal || null,
    inquilino_id: reservaFinal?.inquilino_id || null,
    fecha_inicio: reservaFinal?.fecha_inicio || null,
    fecha_fin: reservaFinal?.fecha_fin || null
  };
};

const obtenerReciboBasePorId = async (clientOrPool, recibo_id) => {
  const result = await clientOrPool.query(
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
      r.generado_desde_recibo_id,
      r.emitido_por_usuario_id,
      r.pdf_url,
      r.observaciones,
      r.created_at,
      r.updated_at,

      cc.inmueble_id,
      cc.numero_recibo_base
    FROM recibo r
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE r.recibo_id = $1;
    `,
    [recibo_id]
  );

  return result.rows[0] || null;
};

const validarReciboPerteneceAUsuario = async (recibo, usuario_id) => {
  if (!recibo || !recibo.reserva_id) return null;

  const reserva = await obtenerReservaFinance(recibo.reserva_id);

  if (!reserva) return null;

  if (Number(reserva.inquilino_id) !== Number(usuario_id)) {
    return null;
  }

  return reserva;
};

const listarRecibosPendientesInquilino = async (empresa_id, usuario_id) => {
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
    WHERE r.estado_recibo = 'PENDIENTE'
      AND r.saldo_pendiente > 0
    ORDER BY r.fecha_vencimiento ASC, r.recibo_id ASC;
  `);

  const recibos = [];

  for (const recibo of result.rows) {
    const reserva = await validarReciboPerteneceAUsuario(recibo, usuario_id);

    if (!reserva) continue;

    recibos.push(await mapReciboPago(recibo, reserva));
  }

  return recibos;
};

const obtenerReciboPendienteParaPago = async (empresa_id, usuario_id, recibo_id) => {
  const pool = getPostgresPool();

  const recibo = await obtenerReciboBasePorId(pool, recibo_id);

  if (!recibo) return null;

  const reserva = await validarReciboPerteneceAUsuario(recibo, usuario_id);

  if (!reserva) return null;

  if (String(recibo.estado_recibo).toUpperCase() !== 'PENDIENTE') {
    return null;
  }

  if (Number(recibo.saldo_pendiente || 0) <= 0) {
    return null;
  }

  return await mapReciboPago(recibo, reserva);
};

const asegurarCategoriaIngreso = async (client) => {
  const existente = await client.query(
    `
    SELECT
      categoria_movimiento_id,
      nombre,
      naturaleza
    FROM categoria_movimiento
    WHERE UPPER(naturaleza) = 'INGRESO'
      AND activo = TRUE
    ORDER BY categoria_movimiento_id ASC
    LIMIT 1;
    `
  );

  if (existente.rows[0]) {
    return existente.rows[0];
  }

  const creado = await client.query(
    `
    INSERT INTO categoria_movimiento (
      nombre,
      naturaleza,
      descripcion,
      activo,
      created_at
    )
    VALUES (
      'Ingreso por alquiler',
      'INGRESO',
      'Ingresos recibidos por pago de boletas o alquileres',
      TRUE,
      CURRENT_TIMESTAMP
    )
    RETURNING
      categoria_movimiento_id,
      nombre,
      naturaleza;
    `
  );

  return creado.rows[0];
};

const asegurarCuentaIngresoEmpresa = async (client, empresa_id) => {
  const cuentaExistente = await client.query(
    `
    SELECT
      cb.cuenta_bancaria_id,
      cb.empresa_id,
      cb.banco_id,
      cb.nombre_cuenta,
      cb.saldo_actual
    FROM cuenta_bancaria cb
    WHERE cb.empresa_id = $1
      AND cb.activa = TRUE
    ORDER BY cb.cuenta_bancaria_id ASC
    LIMIT 1
    FOR UPDATE;
    `,
    [empresa_id]
  );

  if (cuentaExistente.rows[0]) {
    return cuentaExistente.rows[0];
  }

  let bancoResult = await client.query(
    `
    SELECT banco_id
    FROM banco
    WHERE codigo = 'BCP'
    LIMIT 1;
    `
  );

  let banco = bancoResult.rows[0];

  if (!banco) {
    bancoResult = await client.query(
      `
      INSERT INTO banco (
        nombre,
        codigo,
        activo,
        created_at
      )
      VALUES (
        'BCP',
        'BCP',
        TRUE,
        CURRENT_TIMESTAMP
      )
      RETURNING banco_id;
      `
    );

    banco = bancoResult.rows[0];
  }

  const cuentaCreada = await client.query(
    `
    INSERT INTO cuenta_bancaria (
      empresa_id,
      banco_id,
      nombre_cuenta,
      numero_cuenta,
      cci,
      moneda,
      tipo_cuenta,
      saldo_inicial,
      saldo_actual,
      activa,
      created_at
    )
    VALUES (
      $1,
      $2,
      'Cuenta principal de ingresos',
      '000-INGRESOS',
      NULL,
      'PEN',
      'AHORROS',
      0,
      0,
      TRUE,
      CURRENT_TIMESTAMP
    )
    RETURNING
      cuenta_bancaria_id,
      empresa_id,
      banco_id,
      nombre_cuenta,
      saldo_actual;
    `,
    [
      empresa_id,
      banco.banco_id
    ]
  );

  return cuentaCreada.rows[0];
};

const registrarPagoOnline = async ({
  empresa_id,
  usuario_id,
  recibo_id,
  metodo_pago,
  proveedor_pasarela,
  referencia,
  observaciones
}) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const recibo = await obtenerReciboBasePorId(client, recibo_id);

    if (!recibo) {
      throw new Error('RECIBO_NO_VALIDO');
    }

    const reserva = await validarReciboPerteneceAUsuario(recibo, usuario_id);

    if (!reserva) {
      throw new Error('RECIBO_NO_VALIDO');
    }

    const estadoRecibo = String(recibo.estado_recibo || '').toUpperCase();

    if (estadoRecibo === 'PAGADO') {
      throw new Error('RECIBO_YA_PAGADO');
    }

    if (estadoRecibo === 'ANULADO') {
      throw new Error('RECIBO_ANULADO');
    }

    if (estadoRecibo !== 'PENDIENTE') {
      throw new Error('RECIBO_NO_VALIDO');
    }

    const monto = redondear2(recibo.saldo_pendiente);

    if (monto <= 0) {
      throw new Error('RECIBO_YA_PAGADO');
    }

    const metodoPagoNormalizado = String(metodo_pago || 'ONLINE')
      .trim()
      .toUpperCase();

    const metodosPermitidos = [
      'ONLINE',
      'TARJETA',
      'TRANSFERENCIA'
    ];

    if (!metodosPermitidos.includes(metodoPagoNormalizado)) {
      throw new Error('METODO_PAGO_INVALIDO');
    }

    const publicacion = await obtenerPublicacionSegura(recibo.inmueble_id);

    const empresaOperacionId = Number(
      publicacion?.empresa_id ||
      empresa_id ||
      1
    );

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
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, 'CONFIRMADO',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        $10, CURRENT_TIMESTAMP
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
        usuario_id,
        metodoPagoNormalizado,
        proveedor_pasarela || 'SIMULADO',
        `TX-${Date.now()}`,
        referencia || null,
        monto,
        reserva.moneda || 'PEN',
        observaciones || null
      ]
    );

    const pago = pagoResult.rows[0];

    const categoria = await asegurarCategoriaIngreso(client);
    const cuenta = await asegurarCuentaIngresoEmpresa(client, empresaOperacionId);

    const saldoAnterior = redondear2(cuenta.saldo_actual);
    const saldoPosterior = redondear2(saldoAnterior + monto);

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
        CURRENT_TIMESTAMP,
        $7, $8, $9, $10, $11, $12, $13,
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
        `Pago de recibo B-${String(recibo.recibo_id).padStart(6, '0')}`,
        `Pago confirmado mediante ${metodoPagoNormalizado}`,
        monto,
        saldoAnterior,
        saldoPosterior,
        referencia || null,
        observaciones || null
      ]
    );

    await client.query(
      `
      UPDATE cuenta_bancaria
      SET saldo_actual = $1
      WHERE cuenta_bancaria_id = $2;
      `,
      [
        saldoPosterior,
        cuenta.cuenta_bancaria_id
      ]
    );

    await client.query(
      `
      UPDATE recibo
      SET
        estado_recibo = 'PAGADO',
        saldo_pendiente = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE recibo_id = $1;
      `,
      [recibo.recibo_id]
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
      monto_pagado: monto
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarMisPagos = async (empresa_id, usuario_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      p.pago_id,
      p.recibo_id,
      p.reserva_id,
      p.usuario_pagador_id,
      p.metodo_pago,
      p.proveedor_pasarela,
      p.transaccion_externa,
      p.referencia,
      p.monto,
      p.moneda,
      p.estado_pago,
      p.fecha_pago,
      p.fecha_confirmacion,
      p.observaciones,
      p.created_at,

      r.periodo_anio,
      r.periodo_mes,
      r.estado_recibo,
      r.total,
      r.saldo_pendiente,

      cc.inmueble_id,
      cc.numero_recibo_base
    FROM pago p
    INNER JOIN recibo r
      ON r.recibo_id = p.recibo_id
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE p.usuario_pagador_id = $1
    ORDER BY p.fecha_pago DESC, p.pago_id DESC;
    `,
    [usuario_id]
  );

  const pagos = [];

  for (const pago of result.rows) {
    const publicacion = pago.inmueble_id
      ? await obtenerPublicacionSegura(pago.inmueble_id)
      : null;

    pagos.push({
      ...pago,
      monto: redondear2(pago.monto),
      total: redondear2(pago.total),
      saldo_pendiente: redondear2(pago.saldo_pendiente),
      numero_recibo: `B-${String(pago.recibo_id).padStart(6, '0')}`,
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

  return pagos;
};

const generarReciboPendientePrueba = async () => {
  throw new Error(
    'La generación de recibos de prueba fue reemplazada por el módulo de recibos.'
  );
};

module.exports = {
  listarRecibosPendientesInquilino,
  obtenerReciboPendienteParaPago,
  registrarPagoOnline,
  listarMisPagos,
  generarReciboPendientePrueba
};