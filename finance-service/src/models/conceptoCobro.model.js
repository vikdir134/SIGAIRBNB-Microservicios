const { getPostgresPool } = require('../config/postgresDb');

const mapConcepto = (row) => {
  if (!row) return null;

  return {
    ...row,

    monto_default: Number(row.monto_default || 0),

    // Compatibilidad con el controller/frontend actual.
    // En tu tabla original de SQL Server no existen estas columnas,
    // pero el controller pregunta por "editable".
    categoria: row.categoria || 'GENERAL',
    metodo_calculo: row.metodo_calculo || 'MONTO_FIJO',
    aplica_en: row.aplica_en || 'RECIBO',
    aplica_desde_dias: Number(row.aplica_desde_dias || 0),
    prorrateable: Boolean(row.prorrateable || false),
    permite_pago_online: Boolean(row.permite_pago_online ?? true),
    es_sistema: Boolean(row.es_sistema || false),
    editable: Boolean(row.editable ?? true)
  };
};

const listarConceptosCobro = async () => {
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable

    FROM concepto_cobro
    ORDER BY orden_impresion ASC, nombre ASC;
  `);

  return result.rows.map(mapConcepto);
};

const obtenerConceptoCobroPorId = async (concepto_cobro_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable

    FROM concepto_cobro
    WHERE concepto_cobro_id = $1;
    `,
    [concepto_cobro_id]
  );

  return mapConcepto(result.rows[0]);
};

const obtenerConceptoCobroPorCodigo = async (codigo) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable

    FROM concepto_cobro
    WHERE UPPER(codigo) = UPPER($1);
    `,
    [codigo]
  );

  return mapConcepto(result.rows[0]);
};

const crearConceptoCobro = async (data) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    INSERT INTO concepto_cobro (
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, TRUE, CURRENT_TIMESTAMP
    )
    RETURNING
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable;
    `,
    [
      data.codigo,
      data.nombre,
      data.descripcion || null,
      data.tipo_concepto,
      Boolean(data.es_obligatorio),
      Boolean(data.aplica_igv),
      Number(data.monto_default || 0),
      Number(data.orden_impresion || 1)
    ]
  );

  return mapConcepto(result.rows[0]);
};

const actualizarConceptoCobro = async (concepto_cobro_id, data) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    UPDATE concepto_cobro
    SET
      nombre = $2,
      descripcion = $3,
      tipo_concepto = $4,
      es_obligatorio = $5,
      aplica_igv = $6,
      monto_default = $7,
      orden_impresion = $8
    WHERE concepto_cobro_id = $1
    RETURNING
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable;
    `,
    [
      concepto_cobro_id,
      data.nombre,
      data.descripcion || null,
      data.tipo_concepto,
      Boolean(data.es_obligatorio),
      Boolean(data.aplica_igv),
      Number(data.monto_default || 0),
      Number(data.orden_impresion || 1)
    ]
  );

  return mapConcepto(result.rows[0]);
};

const cambiarEstadoConceptoCobro = async (concepto_cobro_id, activo) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    UPDATE concepto_cobro
    SET activo = $2
    WHERE concepto_cobro_id = $1
    RETURNING
      concepto_cobro_id,
      codigo,
      nombre,
      descripcion,
      tipo_concepto,
      es_obligatorio,
      aplica_igv,
      monto_default,
      orden_impresion,
      activo,
      created_at,

      'GENERAL'::varchar AS categoria,
      'MONTO_FIJO'::varchar AS metodo_calculo,
      'RECIBO'::varchar AS aplica_en,
      0::int AS aplica_desde_dias,
      false::boolean AS prorrateable,
      true::boolean AS permite_pago_online,
      false::boolean AS es_sistema,
      true::boolean AS editable;
    `,
    [
      concepto_cobro_id,
      Boolean(activo)
    ]
  );

  return mapConcepto(result.rows[0]);
};

module.exports = {
  listarConceptosCobro,
  obtenerConceptoCobroPorId,
  obtenerConceptoCobroPorCodigo,
  crearConceptoCobro,
  actualizarConceptoCobro,
  cambiarEstadoConceptoCobro
};