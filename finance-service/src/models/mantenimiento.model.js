const { getPostgresPool } = require('../config/postgresDb');

const {
  listarInmueblesConRentaCatalog,
  obtenerInmuebleConRentaCatalog
} = require('../clients/catalog.client');

const mapNumero = (valor) => Number(valor || 0);

const listarCategoriasGasto = async () => {
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
      AND UPPER(naturaleza) = 'EGRESO'
    ORDER BY nombre ASC;
  `);

  return result.rows;
};

const listarCuentasMantenimientoPorEmpresa = async (empresa_id) => {
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

  return result.rows.map((cuenta) => ({
    ...cuenta,
    saldo_inicial: mapNumero(cuenta.saldo_inicial),
    saldo_actual: mapNumero(cuenta.saldo_actual)
  }));
};

const listarInmueblesParaGasto = async (empresa_id) => {
  const inmuebles = await listarInmueblesConRentaCatalog(empresa_id);

  return inmuebles.map((inmueble) => ({
    inmueble_id: inmueble.inmueble_id,
    empresa_id: inmueble.empresa_id,
    codigo: inmueble.codigo,
    nombre: inmueble.nombre,
    tipo_inmueble: inmueble.tipo_inmueble,
    direccion_linea1: inmueble.direccion_linea1,
    numero: inmueble.numero,
    distrito: inmueble.distrito,
    ciudad: inmueble.ciudad,
    departamento: inmueble.departamento
  }));
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

  const cuenta = result.rows[0];

  if (!cuenta) return null;

  return {
    ...cuenta,
    saldo_inicial: mapNumero(cuenta.saldo_inicial),
    saldo_actual: mapNumero(cuenta.saldo_actual)
  };
};

const obtenerCategoriaGastoPorId = async (categoria_movimiento_id) => {
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
      AND UPPER(naturaleza) = 'EGRESO';
    `,
    [categoria_movimiento_id]
  );

  return result.rows[0] || null;
};

const obtenerInmueblePorEmpresa = async (empresa_id, inmueble_id) => {
  const inmueble = await obtenerInmuebleConRentaCatalog(empresa_id, inmueble_id);

  if (!inmueble) return null;

  return {
    inmueble_id: inmueble.inmueble_id,
    empresa_id: inmueble.empresa_id,
    codigo: inmueble.codigo,
    nombre: inmueble.nombre,
    tipo_inmueble: inmueble.tipo_inmueble,
    direccion_linea1: inmueble.direccion_linea1,
    numero: inmueble.numero,
    distrito: inmueble.distrito,
    ciudad: inmueble.ciudad,
    departamento: inmueble.departamento
  };
};

const registrarGastoMantenimiento = async (empresa_id, data) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
      throw new Error('CUENTA_INVALIDA');
    }

    const saldoAnterior = mapNumero(cuenta.saldo_actual);
    const importe = mapNumero(data.importe);
    const saldoPosterior = saldoAnterior - importe;

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
        $1, $2, 'EGRESO', $3, $4, NULL, NULL,
        $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP
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
        data.cuenta_bancaria_id,
        data.categoria_movimiento_id,
        data.inmueble_id || null,
        data.reserva_id || null,
        data.fecha_movimiento || new Date(),
        data.concepto,
        data.descripcion || null,
        importe,
        saldoAnterior,
        saldoPosterior,
        data.referencia_externa || null,
        data.observaciones || null
      ]
    );

    await client.query(
      `
      UPDATE cuenta_bancaria
      SET saldo_actual = $1
      WHERE cuenta_bancaria_id = $2;
      `,
      [saldoPosterior, data.cuenta_bancaria_id]
    );

    await client.query('COMMIT');

    const movimiento = movimientoResult.rows[0];

    return {
      ...movimiento,
      importe: mapNumero(movimiento.importe),
      saldo_anterior: mapNumero(movimiento.saldo_anterior),
      saldo_posterior: mapNumero(movimiento.saldo_posterior)
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarGastosMantenimiento = async (empresa_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
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
      cm.naturaleza,

      cb.empresa_id,
      cb.nombre_cuenta,
      cb.numero_cuenta,
      cb.moneda,
      b.nombre AS banco
    FROM movimiento_bancario mb
    INNER JOIN categoria_movimiento cm
      ON cm.categoria_movimiento_id = mb.categoria_movimiento_id
    INNER JOIN cuenta_bancaria cb
      ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
    INNER JOIN banco b
      ON b.banco_id = cb.banco_id
    WHERE cb.empresa_id = $1
      AND UPPER(mb.tipo_movimiento) = 'EGRESO'
    ORDER BY mb.fecha_movimiento DESC, mb.movimiento_bancario_id DESC;
    `,
    [empresa_id]
  );

  let inmueblesMap = new Map();

  try {
    const inmuebles = await listarInmueblesConRentaCatalog(empresa_id);

    inmueblesMap = new Map(
      inmuebles.map((inmueble) => [
        Number(inmueble.inmueble_id),
        inmueble
      ])
    );
  } catch (error) {
    console.error('No se pudieron obtener inmuebles desde catalog-service:', error.message);
  }

  return result.rows.map((gasto) => {
    const inmueble = gasto.inmueble_id
      ? inmueblesMap.get(Number(gasto.inmueble_id))
      : null;

    return {
      ...gasto,
      importe: mapNumero(gasto.importe),
      saldo_anterior: mapNumero(gasto.saldo_anterior),
      saldo_posterior: mapNumero(gasto.saldo_posterior),
      inmueble_codigo: inmueble?.codigo || null,
      inmueble_nombre: inmueble?.nombre || null,
      inmueble: inmueble?.nombre || null
    };
  });
};

module.exports = {
  listarCategoriasGasto,
  listarCuentasMantenimientoPorEmpresa,
  listarInmueblesParaGasto,
  obtenerCuentaPorEmpresa,
  obtenerCategoriaGastoPorId,
  obtenerInmueblePorEmpresa,
  registrarGastoMantenimiento,
  listarGastosMantenimiento
};