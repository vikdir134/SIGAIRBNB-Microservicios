const { getConnection, sql } = require('../config/db');

const obtenerPool = async () => {
  return await getConnection();
};

const convertirNumero = (valor) => {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
};

const obtenerNombreMes = (mes) => {
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

  return meses[mes - 1] || 'Mes inválido';
};

const obtenerResumenFinancieroMensual = async (empresaId, anio, mes) => {
  const pool = await obtenerPool();

  if (!pool || typeof pool.request !== 'function') {
    throw new Error('La conexión SQL no es válida. Revisa src/config/db.js');
  }

  const result = await pool.request()
    .input('empresa_id', sql.Int, empresaId)
    .input('anio', sql.Int, anio)
    .input('mes', sql.Int, mes)
    .query(`
      SELECT
        empresa_id,
        anio,
        mes,
        ISNULL(total_ingresos, 0) AS total_ingresos,
        ISNULL(total_gastos, 0) AS total_gastos,
        ISNULL(balance_neto, 0) AS balance_neto
      FROM reporting.v_ResumenFinancieroMensual
      WHERE empresa_id = @empresa_id
        AND anio = @anio
        AND mes = @mes;
    `);

  return result.recordset[0] || null;
};

const obtenerDetalleMovimientosMensuales = async (empresaId, anio, mes) => {
  const pool = await obtenerPool();

  if (!pool || typeof pool.request !== 'function') {
    throw new Error('La conexión SQL no es válida. Revisa src/config/db.js');
  }

  const result = await pool.request()
    .input('empresa_id', sql.Int, empresaId)
    .input('anio', sql.Int, anio)
    .input('mes', sql.Int, mes)
    .query(`
      SELECT
        mb.movimiento_bancario_id,
        mb.fecha_movimiento,
        mb.tipo_movimiento,
        mb.concepto,
        mb.descripcion,
        mb.importe,
        mb.referencia_externa,
        mb.observaciones,

        cm.nombre AS categoria,
        cm.naturaleza,

        cb.cuenta_bancaria_id,
        cb.nombre_cuenta,
        cb.numero_cuenta,
        cb.moneda,

        b.nombre AS banco,

        i.inmueble_id,
        i.codigo AS codigo_inmueble,
        i.nombre AS inmueble
      FROM finance.MovimientoBancario mb
      INNER JOIN finance.CuentaBancaria cb
        ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
      INNER JOIN finance.CategoriaMovimiento cm
        ON cm.categoria_movimiento_id = mb.categoria_movimiento_id
      INNER JOIN finance.Banco b
        ON b.banco_id = cb.banco_id
      LEFT JOIN catalog.Inmueble i
        ON i.inmueble_id = mb.inmueble_id
      WHERE cb.empresa_id = @empresa_id
        AND YEAR(mb.fecha_movimiento) = @anio
        AND MONTH(mb.fecha_movimiento) = @mes
      ORDER BY mb.fecha_movimiento DESC, mb.movimiento_bancario_id DESC;
    `);

  return result.recordset;
};

const obtenerDashboardKpisMensual = async (empresaId, anio, mes) => {
  const pool = await obtenerPool();

  if (!pool || typeof pool.request !== 'function') {
    throw new Error('La conexión SQL no es válida. Revisa src/config/db.js');
  }

  const resumen = await obtenerResumenFinancieroMensual(empresaId, anio, mes);

  const totalIngresos = Number(resumen?.total_ingresos || 0);
  const totalGastos = Number(resumen?.total_gastos || 0);
  const balanceNeto = Number(resumen?.balance_neto || 0);

  const margenRentabilidad =
    totalIngresos > 0
      ? Number(((balanceNeto / totalIngresos) * 100).toFixed(2))
      : 0;

  const fechaBase = new Date(anio, mes - 1, 1);
  const fechaInicio = new Date(fechaBase);
  fechaInicio.setMonth(fechaInicio.getMonth() - 5);
  const fechaInicioMes = new Date(anio, mes - 1, 1);
const fechaFinMes = new Date(anio, mes, 0);

  const rentabilidadMensualResult = await pool.request()
    .input('empresa_id', sql.Int, empresaId)
    .input('fecha_inicio', sql.Date, fechaInicio)
    .input('fecha_fin', sql.Date, fechaBase)
    .query(`
      SELECT
        anio,
        mes,
        CONCAT(anio, '-', RIGHT('0' + CAST(mes AS VARCHAR(2)), 2)) AS periodo,
        ISNULL(total_ingresos, 0) AS ingresos,
        ISNULL(total_gastos, 0) AS gastos,
        ISNULL(balance_neto, 0) AS utilidad
      FROM reporting.v_ResumenFinancieroMensual
      WHERE empresa_id = @empresa_id
        AND DATEFROMPARTS(anio, mes, 1) BETWEEN @fecha_inicio AND @fecha_fin
      ORDER BY anio ASC, mes ASC;
    `);

  const utilidadPorInmuebleResult = await pool.request()
    .input('empresa_id', sql.Int, empresaId)
    .input('anio', sql.Int, anio)
    .input('mes', sql.Int, mes)
    .query(`
      SELECT TOP 10
        ISNULL(i.inmueble_id, 0) AS inmueble_id,
        ISNULL(i.codigo, 'SIN-CODIGO') AS codigo_inmueble,
        ISNULL(i.nombre, 'Sin inmueble asociado') AS inmueble,

        SUM(
          CASE
            WHEN UPPER(cm.naturaleza) = 'INGRESO'
              THEN ABS(ISNULL(mb.importe, 0))
            ELSE 0
          END
        ) AS ingresos,

        SUM(
          CASE
            WHEN UPPER(cm.naturaleza) = 'GASTO'
              THEN ABS(ISNULL(mb.importe, 0))
            ELSE 0
          END
        ) AS gastos,

        SUM(
          CASE
            WHEN UPPER(cm.naturaleza) = 'INGRESO'
              THEN ABS(ISNULL(mb.importe, 0))
            ELSE 0
          END
        )
        -
        SUM(
          CASE
            WHEN UPPER(cm.naturaleza) = 'GASTO'
              THEN ABS(ISNULL(mb.importe, 0))
            ELSE 0
          END
        ) AS utilidad
      FROM finance.MovimientoBancario mb
      INNER JOIN finance.CuentaBancaria cb
        ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
      INNER JOIN finance.CategoriaMovimiento cm
        ON cm.categoria_movimiento_id = mb.categoria_movimiento_id
      LEFT JOIN catalog.Inmueble i
        ON i.inmueble_id = mb.inmueble_id
      WHERE cb.empresa_id = @empresa_id
        AND YEAR(mb.fecha_movimiento) = @anio
        AND MONTH(mb.fecha_movimiento) = @mes
      GROUP BY
        i.inmueble_id,
        i.codigo,
        i.nombre
      ORDER BY utilidad DESC;
    `);
    const ocupacionGeneralResult = await pool.request()
  .input('empresa_id', sql.Int, empresaId)
  .input('fecha_inicio_mes', sql.Date, fechaInicioMes)
  .input('fecha_fin_mes', sql.Date, fechaFinMes)
  .query(`
    WITH InmueblesEmpresa AS (
      SELECT
        inmueble_id
      FROM catalog.Inmueble
      WHERE empresa_id = @empresa_id
        AND ISNULL(activo, 1) = 1
    ),
    ReservasPeriodo AS (
      SELECT
        r.reserva_id,
        r.inmueble_id,
        CASE
          WHEN r.fecha_inicio < @fecha_inicio_mes THEN @fecha_inicio_mes
          ELSE r.fecha_inicio
        END AS fecha_inicio_calculada,
        CASE
          WHEN r.fecha_fin > @fecha_fin_mes THEN @fecha_fin_mes
          ELSE r.fecha_fin
        END AS fecha_fin_calculada
      FROM booking.Reserva r
      INNER JOIN InmueblesEmpresa i
        ON i.inmueble_id = r.inmueble_id
      WHERE r.estado_reserva IN ('APROBADA', 'ACTIVA', 'FINALIZADA')
        AND r.fecha_inicio <= @fecha_fin_mes
        AND r.fecha_fin >= @fecha_inicio_mes
    ),
    DiasOcupados AS (
      SELECT
        ISNULL(SUM(
          DATEDIFF(
            DAY,
            fecha_inicio_calculada,
            fecha_fin_calculada
          ) + 1
        ), 0) AS dias_ocupados
      FROM ReservasPeriodo
    ),
    BaseCalculo AS (
      SELECT
        COUNT(*) AS total_inmuebles,
        DAY(EOMONTH(@fecha_inicio_mes)) AS dias_mes
      FROM InmueblesEmpresa
    )
    SELECT
      d.dias_ocupados,
      b.total_inmuebles,
      b.dias_mes,
      b.total_inmuebles * b.dias_mes AS dias_disponibles,
      CASE
        WHEN b.total_inmuebles * b.dias_mes > 0 THEN
          CAST(
            (d.dias_ocupados * 100.0) /
            (b.total_inmuebles * b.dias_mes)
            AS DECIMAL(10,2)
          )
        ELSE 0
      END AS ocupacion_general
    FROM BaseCalculo b
    CROSS JOIN DiasOcupados d;
  `);

  const reservasActivasResult = await pool.request()
  .input('empresa_id', sql.Int, empresaId)
  .input('fecha_inicio_mes', sql.Date, fechaInicioMes)
  .input('fecha_fin_mes', sql.Date, fechaFinMes)
  .query(`
    SELECT
      COUNT(*) AS reservas_activas
    FROM booking.Reserva r
    INNER JOIN catalog.Inmueble i
      ON i.inmueble_id = r.inmueble_id
    WHERE i.empresa_id = @empresa_id
      AND r.estado_reserva = 'ACTIVA'
      AND r.fecha_inicio <= @fecha_fin_mes
      AND r.fecha_fin >= @fecha_inicio_mes;
  `);

  const ocupacionPorInmuebleResult = await pool.request()
  .input('empresa_id', sql.Int, empresaId)
  .input('fecha_inicio_mes', sql.Date, fechaInicioMes)
  .input('fecha_fin_mes', sql.Date, fechaFinMes)
  .query(`
    WITH ReservasPeriodo AS (
      SELECT
        r.inmueble_id,
        SUM(
          DATEDIFF(
            DAY,
            CASE
              WHEN r.fecha_inicio < @fecha_inicio_mes THEN @fecha_inicio_mes
              ELSE r.fecha_inicio
            END,
            CASE
              WHEN r.fecha_fin > @fecha_fin_mes THEN @fecha_fin_mes
              ELSE r.fecha_fin
            END
          ) + 1
        ) AS dias_ocupados
      FROM booking.Reserva r
      WHERE r.estado_reserva IN ('APROBADA', 'ACTIVA', 'FINALIZADA')
        AND r.fecha_inicio <= @fecha_fin_mes
        AND r.fecha_fin >= @fecha_inicio_mes
      GROUP BY r.inmueble_id
    )
    SELECT TOP 10
      i.inmueble_id,
      ISNULL(i.codigo, 'SIN-CODIGO') AS codigo_inmueble,
      ISNULL(i.nombre, 'Sin nombre') AS inmueble,
      ISNULL(rp.dias_ocupados, 0) AS dias_ocupados,
      DAY(EOMONTH(@fecha_inicio_mes)) AS dias_disponibles,
      CASE
        WHEN DAY(EOMONTH(@fecha_inicio_mes)) > 0 THEN
          CAST(
            (ISNULL(rp.dias_ocupados, 0) * 100.0) /
            DAY(EOMONTH(@fecha_inicio_mes))
            AS DECIMAL(10,2)
          )
        ELSE 0
      END AS ocupacion
    FROM catalog.Inmueble i
    LEFT JOIN ReservasPeriodo rp
      ON rp.inmueble_id = i.inmueble_id
    WHERE i.empresa_id = @empresa_id
      AND ISNULL(i.activo, 1) = 1
    ORDER BY ocupacion DESC, i.nombre ASC;
  `);

  const recibosPendientesResult = await pool.request()
  .input('empresa_id', sql.Int, empresaId)
  .input('anio', sql.Int, anio)
  .input('mes', sql.Int, mes)
  .query(`
    SELECT
      COUNT(rec.recibo_id) AS cantidad_recibos_pendientes,
      ISNULL(SUM(rec.saldo_pendiente), 0) AS recibos_pendientes,
      SUM(
        CASE
          WHEN rec.fecha_vencimiento < CAST(GETDATE() AS DATE)
            THEN 1
          ELSE 0
        END
      ) AS recibos_vencidos
    FROM finance.Recibo rec
    INNER JOIN booking.Reserva r
      ON r.reserva_id = rec.reserva_id
    INNER JOIN catalog.Inmueble i
      ON i.inmueble_id = r.inmueble_id
    WHERE i.empresa_id = @empresa_id
      AND rec.periodo_anio = @anio
      AND rec.periodo_mes = @mes
      AND rec.estado_recibo NOT IN ('PAGADO', 'ANULADO')
      AND rec.saldo_pendiente > 0;
  `);
  const recibosPendientesPorInmuebleResult = await pool.request()
  .input('empresa_id', sql.Int, empresaId)
  .input('anio', sql.Int, anio)
  .input('mes', sql.Int, mes)
  .query(`
    SELECT TOP 10
      i.inmueble_id,
      ISNULL(i.codigo, 'SIN-CODIGO') AS codigo_inmueble,
      ISNULL(i.nombre, 'Sin nombre') AS inmueble,
      COUNT(rec.recibo_id) AS cantidad_recibos_pendientes,
      ISNULL(SUM(rec.saldo_pendiente), 0) AS monto_pendiente
    FROM finance.Recibo rec
    INNER JOIN booking.Reserva r
      ON r.reserva_id = rec.reserva_id
    INNER JOIN catalog.Inmueble i
      ON i.inmueble_id = r.inmueble_id
    WHERE i.empresa_id = @empresa_id
      AND rec.periodo_anio = @anio
      AND rec.periodo_mes = @mes
      AND rec.estado_recibo NOT IN ('PAGADO', 'ANULADO')
      AND rec.saldo_pendiente > 0
    GROUP BY
      i.inmueble_id,
      i.codigo,
      i.nombre
    ORDER BY monto_pendiente DESC;
  `);

 const rentabilidadMensual = rentabilidadMensualResult.recordset.map((item) => ({
  anio: convertirNumero(item.anio),
  mes: convertirNumero(item.mes),
  periodo: item.periodo,
  ingresos: convertirNumero(item.ingresos),
  gastos: convertirNumero(item.gastos),
  utilidad: convertirNumero(item.utilidad)
}));

const utilidadPorInmueble = utilidadPorInmuebleResult.recordset.map((item) => ({
  inmueble_id: convertirNumero(item.inmueble_id),
  codigo_inmueble: item.codigo_inmueble,
  inmueble: item.inmueble,
  ingresos: convertirNumero(item.ingresos),
  gastos: convertirNumero(item.gastos),
  utilidad: convertirNumero(item.utilidad)
}));
  const ocupacionGeneral = ocupacionGeneralResult.recordset[0] || {};
const reservasActivas = reservasActivasResult.recordset[0] || {};

const ocupacionPorInmueble = ocupacionPorInmuebleResult.recordset.map((item) => ({
  inmueble_id: convertirNumero(item.inmueble_id),
  codigo_inmueble: item.codigo_inmueble,
  inmueble: item.inmueble,
  dias_ocupados: convertirNumero(item.dias_ocupados),
  dias_disponibles: convertirNumero(item.dias_disponibles),
  ocupacion: convertirNumero(item.ocupacion)
}));

const recibosPendientes = recibosPendientesResult.recordset[0] || {};

const recibosPendientesPorInmueble =
  recibosPendientesPorInmuebleResult.recordset.map((item) => ({
    inmueble_id: convertirNumero(item.inmueble_id),
    codigo_inmueble: item.codigo_inmueble,
    inmueble: item.inmueble,
    cantidad_recibos_pendientes: convertirNumero(item.cantidad_recibos_pendientes),
    monto_pendiente: convertirNumero(item.monto_pendiente)
  }));

  const resumenDashboard = {
  total_ingresos: convertirNumero(totalIngresos),
  total_gastos: convertirNumero(totalGastos),
  balance_neto: convertirNumero(balanceNeto),
  margen_rentabilidad: convertirNumero(margenRentabilidad),

  ocupacion_general: convertirNumero(ocupacionGeneral.ocupacion_general),
  dias_ocupados: convertirNumero(ocupacionGeneral.dias_ocupados),
  dias_disponibles: convertirNumero(ocupacionGeneral.dias_disponibles),

  recibos_pendientes: convertirNumero(recibosPendientes.recibos_pendientes),
  cantidad_recibos_pendientes: convertirNumero(
    recibosPendientes.cantidad_recibos_pendientes
  ),
  recibos_vencidos: convertirNumero(recibosPendientes.recibos_vencidos),

  reservas_activas: convertirNumero(reservasActivas.reservas_activas)
};

const tieneDatos =
  resumenDashboard.total_ingresos > 0 ||
  resumenDashboard.total_gastos > 0 ||
  resumenDashboard.balance_neto !== 0 ||
  resumenDashboard.ocupacion_general > 0 ||
  resumenDashboard.recibos_pendientes > 0 ||
  rentabilidadMensual.length > 0 ||
  utilidadPorInmueble.length > 0 ||
  ocupacionPorInmueble.length > 0 ||
  recibosPendientesPorInmueble.length > 0;

let estadoDashboard = 'NEUTRO';

if (
  resumenDashboard.balance_neto > 0 &&
  resumenDashboard.margen_rentabilidad >= 30 &&
  resumenDashboard.ocupacion_general >= 50
) {
  estadoDashboard = 'SALUDABLE';
} else if (
  resumenDashboard.balance_neto < 0 ||
  resumenDashboard.margen_rentabilidad < 0
) {
  estadoDashboard = 'CRITICO';
} else if (
  resumenDashboard.ocupacion_general < 30 ||
  resumenDashboard.recibos_pendientes > 0
) {
  estadoDashboard = 'ATENCION';
}

const alertasDashboard = [];

if (!tieneDatos) {
  alertasDashboard.push({
    tipo: 'INFO',
    mensaje: 'No hay datos suficientes para generar KPIs en el periodo seleccionado.'
  });
}

if (resumenDashboard.total_ingresos === 0) {
  alertasDashboard.push({
    tipo: 'INFO',
    mensaje: 'No se registran ingresos para el periodo seleccionado.'
  });
}

if (resumenDashboard.balance_neto < 0) {
  alertasDashboard.push({
    tipo: 'CRITICO',
    mensaje: 'El balance neto del periodo es negativo.'
  });
}

if (resumenDashboard.ocupacion_general < 30) {
  alertasDashboard.push({
    tipo: 'ADVERTENCIA',
    mensaje: 'La ocupación general es baja para el periodo seleccionado.'
  });
}

if (resumenDashboard.recibos_pendientes > 0) {
  alertasDashboard.push({
    tipo: 'ADVERTENCIA',
    mensaje: 'Existen recibos pendientes de cobro.'
  });
}

if (resumenDashboard.recibos_vencidos > 0) {
  alertasDashboard.push({
    tipo: 'CRITICO',
    mensaje: 'Existen recibos vencidos pendientes de pago.'
  });
}
 return {
  anio,
  mes,
  periodo_nombre: `${obtenerNombreMes(mes)} ${anio}`,
  fecha_ultima_actualizacion: new Date().toISOString(),
  estado_dashboard: estadoDashboard,
  tiene_datos: tieneDatos,

  resumen: resumenDashboard,

  rentabilidad_mensual: rentabilidadMensual,
  utilidad_por_inmueble: utilidadPorInmueble,
  ocupacion_por_inmueble: ocupacionPorInmueble,
  recibos_pendientes_por_inmueble: recibosPendientesPorInmueble,

  distribucion_ingresos_gastos: [
    {
      categoria: 'Ingresos',
      monto: convertirNumero(totalIngresos)
    },
    {
      categoria: 'Gastos',
      monto: convertirNumero(totalGastos)
    }
  ],

  alertas: alertasDashboard
};
};

const listarPagosDeudoresPorPeriodo = async ({
  empresa_id,
  fecha_inicio,
  fecha_fin,
  estado = 'TODOS'
}) => {
  const pool = await getConnection();

  const estadoNormalizado = String(estado || 'TODOS')
    .trim()
    .toUpperCase();

  const result = await pool.request()
    .input('empresa_id', sql.Int, Number(empresa_id))
    .input('fecha_inicio', sql.Date, fecha_inicio)
    .input('fecha_fin', sql.Date, fecha_fin)
    .input('estado', sql.NVarChar(20), estadoNormalizado)
    .query(`
      WITH pagos_confirmados AS (
        SELECT
          p.recibo_id,
          COUNT(*) AS cantidad_pagos,
          SUM(CASE 
                WHEN p.estado_pago = 'CONFIRMADO' THEN p.monto 
                ELSE 0 
              END) AS monto_pagado_total,
          MAX(CASE 
                WHEN p.estado_pago = 'CONFIRMADO' THEN p.fecha_pago 
                ELSE NULL 
              END) AS fecha_ultimo_pago
        FROM finance.Pago p
        WHERE p.estado_pago = 'CONFIRMADO'
        GROUP BY p.recibo_id
      ),
      pagos_confirmados_periodo AS (
        SELECT
          p.recibo_id,
          COUNT(*) AS cantidad_pagos_periodo,
          SUM(CASE 
                WHEN p.estado_pago = 'CONFIRMADO' THEN p.monto 
                ELSE 0 
              END) AS monto_pagado_periodo,
          MAX(CASE 
                WHEN p.estado_pago = 'CONFIRMADO' THEN p.fecha_pago 
                ELSE NULL 
              END) AS fecha_ultimo_pago_periodo
        FROM finance.Pago p
        WHERE p.estado_pago = 'CONFIRMADO'
          AND CAST(p.fecha_pago AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
        GROUP BY p.recibo_id
      ),
      base_reporte AS (
        SELECT
          r.recibo_id,
          r.reserva_id,
          r.periodo_anio,
          r.periodo_mes,
          CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE) AS fecha_emision,
          CAST(r.fecha_vencimiento AS DATE) AS fecha_vencimiento,
          r.estado_recibo,

          r.total AS total_recibo,
          r.saldo_pendiente,
          COALESCE(pc.monto_pagado_total, 0) AS monto_pagado_total,
          COALESCE(pcp.monto_pagado_periodo, 0) AS monto_pagado_periodo,
          COALESCE(pc.monto_pagado_total, 0) AS monto_pagado,

          COALESCE(pc.cantidad_pagos, 0) AS cantidad_pagos,
          COALESCE(pcp.cantidad_pagos_periodo, 0) AS cantidad_pagos_periodo,

          pc.fecha_ultimo_pago,
          pcp.fecha_ultimo_pago_periodo,

          CASE
            WHEN pcp.fecha_ultimo_pago_periodo IS NOT NULL
              THEN CAST(pcp.fecha_ultimo_pago_periodo AS DATE)

            WHEN CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
              THEN CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE)

            WHEN CAST(r.fecha_vencimiento AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
              THEN CAST(r.fecha_vencimiento AS DATE)

            ELSE CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE)
          END AS fecha_referencia_reporte,

          CASE
            WHEN pcp.fecha_ultimo_pago_periodo IS NOT NULL
              THEN 'PAGO_EN_PERIODO'

            WHEN CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
              THEN 'EMISION_EN_PERIODO'

            WHEN CAST(r.fecha_vencimiento AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
              THEN 'VENCIMIENTO_EN_PERIODO'

            ELSE 'REGISTRO_RELACIONADO'
          END AS tipo_referencia_reporte,

          ultimo_pago.metodo_pago AS ultimo_metodo_pago,
          ultimo_pago.proveedor_pasarela,
          ultimo_pago.referencia AS referencia_pago,

          res.inquilino_id,
          u.correo AS correo_inquilino,
          pu.nombres AS nombres_inquilino,
          pu.apellidos AS apellidos_inquilino,
          pu.telefono AS telefono_inquilino,

          i.inmueble_id,
          i.codigo AS codigo_inmueble,
          i.nombre AS nombre_inmueble,
          i.direccion_linea1,
          i.distrito,
          i.ciudad,
          COALESCE(res.moneda, i.moneda, 'PEN') AS moneda,

          CASE
            WHEN r.estado_recibo = 'PAGADO'
              OR COALESCE(r.saldo_pendiente, 0) <= 0
              THEN 'PAGADO'

            WHEN COALESCE(r.saldo_pendiente, 0) > 0
              AND (
                r.estado_recibo = 'VENCIDO'
                OR CAST(r.fecha_vencimiento AS DATE) < CAST(SYSDATETIME() AS DATE)
              )
              THEN 'VENCIDO'

            WHEN COALESCE(r.saldo_pendiente, 0) > 0
              THEN 'PENDIENTE'

            ELSE r.estado_recibo
          END AS estado_reporte,

          CASE
            WHEN COALESCE(r.saldo_pendiente, 0) > 0
              THEN r.saldo_pendiente
            ELSE 0
          END AS monto_deuda,

          CASE
            WHEN COALESCE(r.saldo_pendiente, 0) > 0
              AND CAST(r.fecha_vencimiento AS DATE) < CAST(SYSDATETIME() AS DATE)
              THEN DATEDIFF(DAY, CAST(r.fecha_vencimiento AS DATE), CAST(SYSDATETIME() AS DATE))
            ELSE 0
          END AS dias_vencido

        FROM finance.Recibo r

        INNER JOIN finance.CuentaCobroInmueble cc
          ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id

        INNER JOIN catalog.Inmueble i
          ON i.inmueble_id = cc.inmueble_id

        INNER JOIN booking.Reserva res
          ON res.reserva_id = r.reserva_id

        INNER JOIN auth.Usuario u
          ON u.usuario_id = res.inquilino_id

        LEFT JOIN core.PerfilUsuario pu
          ON pu.usuario_id = res.inquilino_id

        LEFT JOIN pagos_confirmados pc
          ON pc.recibo_id = r.recibo_id

        LEFT JOIN pagos_confirmados_periodo pcp
          ON pcp.recibo_id = r.recibo_id

        OUTER APPLY (
          SELECT TOP 1
            p2.metodo_pago,
            p2.proveedor_pasarela,
            p2.referencia,
            p2.fecha_pago
          FROM finance.Pago p2
          WHERE p2.recibo_id = r.recibo_id
            AND p2.estado_pago = 'CONFIRMADO'
          ORDER BY p2.fecha_pago DESC, p2.pago_id DESC
        ) AS ultimo_pago

        WHERE i.empresa_id = @empresa_id
          AND r.estado_recibo <> 'ANULADO'
          AND (
            CAST(COALESCE(r.fecha_emision, r.created_at) AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
            OR CAST(r.fecha_vencimiento AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
            OR CAST(pc.fecha_ultimo_pago AS DATE) BETWEEN @fecha_inicio AND @fecha_fin
          )
      )

      SELECT
        recibo_id,
        reserva_id,
        periodo_anio,
        periodo_mes,
        fecha_emision,
        fecha_vencimiento,
        fecha_referencia_reporte,
        tipo_referencia_reporte,
        estado_recibo,
        estado_reporte,

        total_recibo,
        monto_pagado,
        monto_pagado_total,
        monto_pagado_periodo,
        saldo_pendiente,
        monto_deuda,
        cantidad_pagos,
        cantidad_pagos_periodo,
        fecha_ultimo_pago,
        fecha_ultimo_pago_periodo,
        ultimo_metodo_pago,
        proveedor_pasarela,
        referencia_pago,
        moneda,

        inquilino_id,
        correo_inquilino,
        nombres_inquilino,
        apellidos_inquilino,
        telefono_inquilino,

        inmueble_id,
        codigo_inmueble,
        nombre_inmueble,
        direccion_linea1,
        distrito,
        ciudad,

        dias_vencido
      FROM base_reporte
      WHERE @estado = 'TODOS'
        OR estado_reporte = @estado
        OR (
          @estado = 'DEUDOR'
          AND estado_reporte IN ('PENDIENTE', 'VENCIDO')
        )
      ORDER BY
        CASE estado_reporte
          WHEN 'VENCIDO' THEN 1
          WHEN 'PENDIENTE' THEN 2
          WHEN 'PAGADO' THEN 3
          ELSE 4
        END,
        fecha_vencimiento ASC,
        fecha_emision DESC,
        recibo_id DESC;
    `);

  return result.recordset.map((registro) => ({
    ...registro,
    total_recibo: Number(registro.total_recibo || 0),
    monto_pagado: Number(registro.monto_pagado || 0),
    monto_pagado_total: Number(registro.monto_pagado_total || 0),
    monto_pagado_periodo: Number(registro.monto_pagado_periodo || 0),
    saldo_pendiente: Number(registro.saldo_pendiente || 0),
    monto_deuda: Number(registro.monto_deuda || 0),
    cantidad_pagos: Number(registro.cantidad_pagos || 0),
    cantidad_pagos_periodo: Number(registro.cantidad_pagos_periodo || 0),
    dias_vencido: Number(registro.dias_vencido || 0)
  }));
};

module.exports = {
  obtenerResumenFinancieroMensual,
  obtenerDetalleMovimientosMensuales,
  obtenerDashboardKpisMensual,
  listarPagosDeudoresPorPeriodo
};