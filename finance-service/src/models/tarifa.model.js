const { getPostgresPool } = require('../config/postgresDb');

const {
  listarInmueblesConRentaCatalog,
  obtenerInmuebleConRentaCatalog,
  actualizarRentaInmuebleCatalog
} = require('../clients/catalog.client');

const redondear2 = (numero) => {
  return Math.round((Number(numero) + Number.EPSILON) * 100) / 100;
};

const fechaYYYYMMDD = (fecha = new Date()) => {
  const d = new Date(fecha);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const mapIPC = (row) => {
  if (!row) return null;

  return {
    ...row,
    porcentaje_anual: Number(row.porcentaje_anual || 0)
  };
};

const mapTarifa = (row) => {
  if (!row) return null;

  return {
    ...row,
    renta_base_mensual: Number(row.renta_base_mensual || 0),
    porcentaje_ipc_aplicado: Number(row.porcentaje_ipc_aplicado || 0),
    monto_incremento: Number(row.monto_incremento || 0)
  };
};

const listarIPC = async () => {
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT
      indice_ipc_id,
      anio,
      porcentaje_anual,
      fecha_publicacion,
      activo,
      created_at
    FROM indice_ipc
    ORDER BY anio DESC;
  `);

  return result.rows.map(mapIPC);
};

const buscarIPCPorAnio = async (anio) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      indice_ipc_id,
      anio,
      porcentaje_anual,
      fecha_publicacion,
      activo,
      created_at
    FROM indice_ipc
    WHERE anio = $1
      AND activo = TRUE;
    `,
    [anio]
  );

  return mapIPC(result.rows[0]);
};

const buscarIPCPorId = async (indice_ipc_id) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      indice_ipc_id,
      anio,
      porcentaje_anual,
      fecha_publicacion,
      activo,
      created_at
    FROM indice_ipc
    WHERE indice_ipc_id = $1
      AND activo = TRUE;
    `,
    [indice_ipc_id]
  );

  return mapIPC(result.rows[0]);
};

const registrarIPC = async ({ anio, porcentaje_anual, fecha_publicacion }) => {
  const pool = getPostgresPool();

  const result = await pool.query(
    `
    INSERT INTO indice_ipc (
      anio,
      porcentaje_anual,
      fecha_publicacion,
      activo,
      created_at
    )
    VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
    RETURNING
      indice_ipc_id,
      anio,
      porcentaje_anual,
      fecha_publicacion,
      activo,
      created_at;
    `,
    [
      anio,
      porcentaje_anual,
      fecha_publicacion || null
    ]
  );

  return mapIPC(result.rows[0]);
};

const listarInmueblesConRenta = async (empresa_id) => {
  const inmuebles = await listarInmueblesConRentaCatalog(empresa_id);

  return inmuebles.map((inmueble) => ({
    ...inmueble,
    renta_base_mensual: Number(inmueble.renta_base_mensual || 0)
  }));
};

const obtenerInmueblePorId = async (empresa_id, inmueble_id) => {
  const inmueble = await obtenerInmuebleConRentaCatalog(
    empresa_id,
    inmueble_id
  );

  if (!inmueble) return null;

  return {
    ...inmueble,
    renta_base_mensual: Number(inmueble.renta_base_mensual || 0)
  };
};

const verificarAplicacionIPC = async (inmueble_id, indice_ipc_id) => {
  const pool = getPostgresPool();

  const ipc = await buscarIPCPorId(indice_ipc_id);

  if (!ipc) return null;

  const result = await pool.query(
    `
    SELECT
      tarifa_inmueble_id,
      inmueble_id,
      vigencia_desde,
      vigencia_hasta,
      renta_base_mensual,
      porcentaje_ipc_aplicado,
      monto_incremento,
      motivo,
      aplicado_por_usuario_id,
      created_at
    FROM tarifa_inmueble
    WHERE inmueble_id = $1
      AND porcentaje_ipc_aplicado = $2
      AND motivo ILIKE $3
    ORDER BY created_at DESC
    LIMIT 1;
    `,
    [
      inmueble_id,
      ipc.porcentaje_anual,
      `%IPC ${ipc.anio}%`
    ]
  );

  return mapTarifa(result.rows[0]);
};

const cerrarTarifaVigente = async (client, inmueble_id, fecha_cierre) => {
  await client.query(
    `
    UPDATE tarifa_inmueble
    SET vigencia_hasta = $2
    WHERE inmueble_id = $1
      AND vigencia_hasta IS NULL;
    `,
    [
      inmueble_id,
      fecha_cierre
    ]
  );
};

const crearTarifaInmueble = async (
  client,
  {
    inmueble_id,
    vigencia_desde,
    renta_base_mensual,
    porcentaje_ipc_aplicado,
    monto_incremento,
    motivo,
    aplicado_por_usuario_id
  }
) => {
  const result = await client.query(
    `
    INSERT INTO tarifa_inmueble (
      inmueble_id,
      vigencia_desde,
      vigencia_hasta,
      renta_base_mensual,
      porcentaje_ipc_aplicado,
      monto_incremento,
      motivo,
      aplicado_por_usuario_id,
      created_at
    )
    VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    RETURNING
      tarifa_inmueble_id,
      inmueble_id,
      vigencia_desde,
      vigencia_hasta,
      renta_base_mensual,
      porcentaje_ipc_aplicado,
      monto_incremento,
      motivo,
      aplicado_por_usuario_id,
      created_at;
    `,
    [
      inmueble_id,
      vigencia_desde,
      renta_base_mensual,
      porcentaje_ipc_aplicado,
      monto_incremento,
      motivo,
      aplicado_por_usuario_id || null
    ]
  );

  return mapTarifa(result.rows[0]);
};

const aplicarIPCMasivo = async ({
  empresa_id,
  usuario_id,
  usuario_gestor_id,
  aplicado_por_usuario_id,
  ipc,
  inmueble_ids,
  motivo
}) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  const actualizados = [];
  const fechaAplicacion = fechaYYYYMMDD();
  const aplicadoPor =
    aplicado_por_usuario_id ||
    usuario_id ||
    usuario_gestor_id ||
    null;

  try {
    await client.query('BEGIN');

    for (const inmueble_id of inmueble_ids) {
      const inmueble = await obtenerInmueblePorId(
        empresa_id,
        inmueble_id
      );

      if (!inmueble) {
        throw new Error(`No se encontró el inmueble ${inmueble_id}`);
      }

      const rentaActual = Number(inmueble.renta_base_mensual || 0);
      const porcentajeIPC = Number(ipc.porcentaje_anual || 0);
      const montoIncremento = redondear2(rentaActual * (porcentajeIPC / 100));
      const nuevaRenta = redondear2(rentaActual + montoIncremento);

      const motivoFinal = motivo
        ? `${motivo} - IPC ${ipc.anio}`
        : `Aplicación de IPC ${ipc.anio}`;

      await cerrarTarifaVigente(
        client,
        inmueble_id,
        fechaAplicacion
      );

      const tarifa = await crearTarifaInmueble(
        client,
        {
          inmueble_id,
          vigencia_desde: fechaAplicacion,
          renta_base_mensual: nuevaRenta,
          porcentaje_ipc_aplicado: porcentajeIPC,
          monto_incremento: montoIncremento,
          motivo: motivoFinal,
          aplicado_por_usuario_id: aplicadoPor
        }
      );

      await actualizarRentaInmuebleCatalog(
        inmueble_id,
        nuevaRenta
      );

      actualizados.push({
        inmueble_id,
        codigo: inmueble.codigo,
        nombre: inmueble.nombre,
        renta_anterior: rentaActual,
        porcentaje_ipc: porcentajeIPC,
        monto_incremento: montoIncremento,
        nueva_renta: nuevaRenta,
        tarifa
      });
    }

    await client.query('COMMIT');

    return {
      total_actualizados: actualizados.length,
      actualizados
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarHistorialTarifas = async (empresa_id, inmueble_id) => {
  const inmueble = await obtenerInmueblePorId(
    empresa_id,
    inmueble_id
  );

  if (!inmueble) return [];

  const pool = getPostgresPool();

  const result = await pool.query(
    `
    SELECT
      tarifa_inmueble_id,
      inmueble_id,
      vigencia_desde,
      vigencia_hasta,
      renta_base_mensual,
      porcentaje_ipc_aplicado,
      monto_incremento,
      motivo,
      aplicado_por_usuario_id,
      created_at
    FROM tarifa_inmueble
    WHERE inmueble_id = $1
    ORDER BY vigencia_desde DESC, tarifa_inmueble_id DESC;
    `,
    [inmueble_id]
  );

  return result.rows.map(mapTarifa);
};

module.exports = {
  listarIPC,
  buscarIPCPorAnio,
  registrarIPC,
  listarInmueblesConRenta,
  obtenerInmueblePorId,
  verificarAplicacionIPC,
  aplicarIPCMasivo,
  listarHistorialTarifas
};