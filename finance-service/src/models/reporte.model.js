const { getPostgresPool } = require('../config/postgresDb');

const {
  obtenerReservaFinance
} = require('../clients/booking.client');

const {
  obtenerPublicacionPorInmuebleCatalog,
  listarInmueblesConRentaCatalog
} = require('../clients/catalog.client');

const convertirNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Number(numero.toFixed(2)) : 0;
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

  return meses[Number(mes) - 1] || '';
};

const obtenerRangoMes = (anio, mes) => {
  const mesTexto = String(mes).padStart(2, '0');
  const inicio = `${anio}-${mesTexto}-01`;

  const fechaFin = new Date(Number(anio), Number(mes), 1);
  const finAnio = fechaFin.getFullYear();
  const finMes = String(fechaFin.getMonth() + 1).padStart(2, '0');
  const fin = `${finAnio}-${finMes}-01`;

  return {
    inicio,
    fin
  };
};

const obtenerPublicacionSegura = async (inmueble_id) => {
  try {
    if (!inmueble_id) return null;

    return await obtenerPublicacionPorInmuebleCatalog(inmueble_id);
  } catch (error) {
    console.error('Error obteniendo inmueble desde catalog-service:', error.message);
    return null;
  }
};

const obtenerMapaInmueblesEmpresa = async (empresaId) => {
  try {
    const inmuebles = await listarInmueblesConRentaCatalog(empresaId);

    return new Map(
      inmuebles.map((item) => [
        Number(item.inmueble_id),
        item
      ])
    );
  } catch (error) {
    console.error('Error obteniendo inmuebles para reporte:', error.message);
    return new Map();
  }
};

const obtenerResumenFinancieroMensual = async (empresaId, anio, mes) => {
  const pool = getPostgresPool();
  const { inicio, fin } = obtenerRangoMes(anio, mes);

  const result = await pool.query(
    `
    SELECT
      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'INGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS total_ingresos,

      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'EGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS total_gastos
    FROM movimiento_bancario mb
    INNER JOIN cuenta_bancaria cb
      ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
    WHERE cb.empresa_id = $1
      AND mb.fecha_movimiento >= $2
      AND mb.fecha_movimiento < $3;
    `,
    [
      empresaId,
      inicio,
      fin
    ]
  );

  const row = result.rows[0] || {};

  const totalIngresos = convertirNumero(row.total_ingresos);
  const totalGastos = convertirNumero(row.total_gastos);
  const balanceNeto = convertirNumero(totalIngresos - totalGastos);

  return {
    empresa_id: Number(empresaId),
    anio: Number(anio),
    mes: Number(mes),
    nombre_mes: obtenerNombreMes(mes),
    total_ingresos: totalIngresos,
    total_gastos: totalGastos,
    balance_neto: balanceNeto
  };
};

const obtenerDetalleMovimientosMensuales = async (empresaId, anio, mes) => {
  const pool = getPostgresPool();
  const { inicio, fin } = obtenerRangoMes(anio, mes);
  const inmueblesMap = await obtenerMapaInmueblesEmpresa(empresaId);

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
      AND mb.fecha_movimiento >= $2
      AND mb.fecha_movimiento < $3
    ORDER BY mb.fecha_movimiento DESC, mb.movimiento_bancario_id DESC;
    `,
    [
      empresaId,
      inicio,
      fin
    ]
  );

  return result.rows.map((item) => {
    const inmueble = item.inmueble_id
      ? inmueblesMap.get(Number(item.inmueble_id))
      : null;

    return {
      ...item,
      importe: convertirNumero(item.importe),
      saldo_anterior: convertirNumero(item.saldo_anterior),
      saldo_posterior: convertirNumero(item.saldo_posterior),
      codigo_inmueble:
        inmueble?.codigo_inmueble ||
        inmueble?.codigo ||
        null,
      inmueble:
        inmueble?.nombre_inmueble ||
        inmueble?.nombre ||
        inmueble?.titulo ||
        null
    };
  });
};

const obtenerTendenciaRentabilidad = async (empresaId, anio, mes) => {
  const pool = getPostgresPool();

  const fechaBase = new Date(Number(anio), Number(mes) - 1, 1);
  fechaBase.setMonth(fechaBase.getMonth() - 5);

  const inicio = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}-01`;
  const { fin } = obtenerRangoMes(anio, mes);

  const result = await pool.query(
    `
    SELECT
      EXTRACT(YEAR FROM mb.fecha_movimiento)::int AS anio,
      EXTRACT(MONTH FROM mb.fecha_movimiento)::int AS mes,

      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'INGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS total_ingresos,

      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'EGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS total_gastos
    FROM movimiento_bancario mb
    INNER JOIN cuenta_bancaria cb
      ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
    WHERE cb.empresa_id = $1
      AND mb.fecha_movimiento >= $2
      AND mb.fecha_movimiento < $3
    GROUP BY
      EXTRACT(YEAR FROM mb.fecha_movimiento),
      EXTRACT(MONTH FROM mb.fecha_movimiento)
    ORDER BY anio ASC, mes ASC;
    `,
    [
      empresaId,
      inicio,
      fin
    ]
  );

  return result.rows.map((item) => {
    const totalIngresos = convertirNumero(item.total_ingresos);
    const totalGastos = convertirNumero(item.total_gastos);

    return {
      anio: Number(item.anio),
      mes: Number(item.mes),
      nombre_mes: obtenerNombreMes(item.mes),
      total_ingresos: totalIngresos,
      total_gastos: totalGastos,
      balance_neto: convertirNumero(totalIngresos - totalGastos)
    };
  });
};

const obtenerUtilidadPorInmueble = async (empresaId, anio, mes) => {
  const pool = getPostgresPool();
  const { inicio, fin } = obtenerRangoMes(anio, mes);
  const inmueblesMap = await obtenerMapaInmueblesEmpresa(empresaId);

  const result = await pool.query(
    `
    SELECT
      mb.inmueble_id,

      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'INGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS ingresos,

      COALESCE(SUM(
        CASE
          WHEN UPPER(mb.tipo_movimiento) = 'EGRESO'
          THEN mb.importe
          ELSE 0
        END
      ), 0) AS gastos
    FROM movimiento_bancario mb
    INNER JOIN cuenta_bancaria cb
      ON cb.cuenta_bancaria_id = mb.cuenta_bancaria_id
    WHERE cb.empresa_id = $1
      AND mb.fecha_movimiento >= $2
      AND mb.fecha_movimiento < $3
      AND mb.inmueble_id IS NOT NULL
    GROUP BY mb.inmueble_id
    ORDER BY ingresos DESC;
    `,
    [
      empresaId,
      inicio,
      fin
    ]
  );

  return result.rows.map((item) => {
    const inmueble = inmueblesMap.get(Number(item.inmueble_id));
    const ingresos = convertirNumero(item.ingresos);
    const gastos = convertirNumero(item.gastos);

    return {
      inmueble_id: Number(item.inmueble_id),
      codigo:
        inmueble?.codigo_inmueble ||
        inmueble?.codigo ||
        null,
      nombre:
        inmueble?.nombre_inmueble ||
        inmueble?.nombre ||
        inmueble?.titulo ||
        `Inmueble ${item.inmueble_id}`,
      ingresos,
      gastos,
      rentabilidad_neta: convertirNumero(ingresos - gastos)
    };
  });
};

const obtenerResumenRecibosPendientesEmpresa = async (empresaId) => {
  const pool = getPostgresPool();
  const inmueblesMap = await obtenerMapaInmueblesEmpresa(empresaId);
  const idsInmuebles = [...inmueblesMap.keys()];

  if (idsInmuebles.length === 0) {
    return {
      total_recibos_pendientes: 0,
      monto_pendiente: 0,
      por_inmueble: []
    };
  }

  const result = await pool.query(
    `
    SELECT
      cc.inmueble_id,
      COUNT(*) AS cantidad,
      COALESCE(SUM(r.saldo_pendiente), 0) AS monto_pendiente
    FROM recibo r
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE r.estado_recibo IN ('PENDIENTE', 'PARCIAL')
      AND r.saldo_pendiente > 0
      AND cc.inmueble_id = ANY($1::int[])
    GROUP BY cc.inmueble_id
    ORDER BY monto_pendiente DESC;
    `,
    [idsInmuebles]
  );

  const porInmueble = result.rows.map((item) => {
    const inmueble = inmueblesMap.get(Number(item.inmueble_id));

    return {
      inmueble_id: Number(item.inmueble_id),
      codigo:
        inmueble?.codigo_inmueble ||
        inmueble?.codigo ||
        null,
      nombre:
        inmueble?.nombre_inmueble ||
        inmueble?.nombre ||
        inmueble?.titulo ||
        `Inmueble ${item.inmueble_id}`,
      cantidad: Number(item.cantidad || 0),
      monto_pendiente: convertirNumero(item.monto_pendiente)
    };
  });

  return {
    total_recibos_pendientes: porInmueble.reduce(
      (total, item) => total + Number(item.cantidad || 0),
      0
    ),
    monto_pendiente: convertirNumero(
      porInmueble.reduce(
        (total, item) => total + Number(item.monto_pendiente || 0),
        0
      )
    ),
    por_inmueble: porInmueble
  };
};

const obtenerDashboardKpisMensual = async (empresaId, anio, mes) => {
  const resumen = await obtenerResumenFinancieroMensual(empresaId, anio, mes);
  const rentabilidadMensual = await obtenerTendenciaRentabilidad(empresaId, anio, mes);
  const utilidadPorInmueble = await obtenerUtilidadPorInmueble(empresaId, anio, mes);
  const recibosPendientes = await obtenerResumenRecibosPendientesEmpresa(empresaId);

  const totalIngresos = convertirNumero(resumen.total_ingresos);
  const totalGastos = convertirNumero(resumen.total_gastos);
  const balanceNeto = convertirNumero(resumen.balance_neto);

  const margenRentabilidad =
    totalIngresos > 0
      ? convertirNumero((balanceNeto / totalIngresos) * 100)
      : 0;

  const alertasDashboard = [];

  if (balanceNeto < 0) {
    alertasDashboard.push({
      tipo: 'RENTABILIDAD_NEGATIVA',
      mensaje: 'Los gastos superan a los ingresos del periodo.'
    });
  }

  if (recibosPendientes.monto_pendiente > 0) {
    alertasDashboard.push({
      tipo: 'RECIBOS_PENDIENTES',
      mensaje: 'Existen recibos pendientes de cobro.'
    });
  }

  return {
    resumen: {
      ...resumen,
      margen_rentabilidad: margenRentabilidad
    },
    rentabilidad_mensual: rentabilidadMensual,
    utilidad_por_inmueble: utilidadPorInmueble,

    ocupacion_general: {
      porcentaje_ocupacion: 0,
      reservas_confirmadas: 0,
      dias_ocupados: 0,
      dias_disponibles: 0,
      nota: 'La ocupación se calcula actualmente desde booking-service; en este reporte se prioriza la información financiera migrada.'
    },

    ocupacion_por_inmueble: [],
    reservas_activas: {
      total_reservas_activas: 0
    },

    recibos_pendientes: {
      total: recibosPendientes.total_recibos_pendientes,
      monto_pendiente: recibosPendientes.monto_pendiente
    },
    recibos_pendientes_por_inmueble: recibosPendientes.por_inmueble,

    alertas: alertasDashboard,
    tiene_datos:
      totalIngresos > 0 ||
      totalGastos > 0 ||
      recibosPendientes.monto_pendiente > 0
  };
};

const determinarEstadoReporte = (recibo) => {
  const saldoPendiente = convertirNumero(recibo.saldo_pendiente);

  if (saldoPendiente <= 0 || String(recibo.estado_recibo).toUpperCase() === 'PAGADO') {
    return 'PAGADO';
  }

  const hoy = new Date();
  const vencimiento = recibo.fecha_vencimiento
    ? new Date(recibo.fecha_vencimiento)
    : null;

  if (vencimiento && vencimiento < hoy) {
    return 'VENCIDO';
  }

  return 'PENDIENTE';
};

const cumpleFiltroEstado = (estadoFiltro, estadoReporte) => {
  const estado = String(estadoFiltro || 'TODOS').toUpperCase();

  if (estado === 'TODOS') return true;
  if (estado === 'DEUDOR') return ['PENDIENTE', 'VENCIDO'].includes(estadoReporte);

  return estado === estadoReporte;
};

const listarPagosDeudoresPorPeriodo = async ({
  empresa_id,
  fecha_inicio,
  fecha_fin,
  estado = 'TODOS',
  busqueda = ''
}) => {
  const pool = getPostgresPool();
  const inmueblesMap = await obtenerMapaInmueblesEmpresa(empresa_id);
  const idsInmuebles = [...inmueblesMap.keys()];

  if (idsInmuebles.length === 0) {
    return [];
  }

  const inicio = fecha_inicio || '1900-01-01';
  const fin = fecha_fin || '2999-12-31';
  const busquedaNormalizada = String(busqueda || '').trim().toUpperCase();

  const result = await pool.query(
    `
    SELECT
      r.recibo_id,
      r.reserva_id,
      r.periodo_anio,
      r.periodo_mes,
      r.fecha_emision,
      r.fecha_vencimiento,
      r.estado_recibo,
      r.total,
      r.saldo_pendiente,

      cc.inmueble_id,
      cc.numero_recibo_base,

      COALESCE((
        SELECT SUM(p.monto)
        FROM pago p
        WHERE p.recibo_id = r.recibo_id
          AND p.estado_pago = 'CONFIRMADO'
      ), 0) AS total_pagado,

      COALESCE((
        SELECT SUM(p2.monto)
        FROM pago p2
        WHERE p2.recibo_id = r.recibo_id
          AND p2.estado_pago = 'CONFIRMADO'
          AND p2.fecha_pago::date >= $2::date
          AND p2.fecha_pago::date <= $3::date
      ), 0) AS total_pagado_periodo,

      (
        SELECT MAX(p3.fecha_pago)
        FROM pago p3
        WHERE p3.recibo_id = r.recibo_id
          AND p3.estado_pago = 'CONFIRMADO'
      ) AS ultima_fecha_pago

    FROM recibo r
    INNER JOIN cuenta_cobro_inmueble cc
      ON cc.cuenta_cobro_inmueble_id = r.cuenta_cobro_inmueble_id
    WHERE cc.inmueble_id = ANY($1::int[])
      AND (
        r.fecha_emision::date BETWEEN $2::date AND $3::date
        OR r.fecha_vencimiento::date BETWEEN $2::date AND $3::date
        OR EXISTS (
          SELECT 1
          FROM pago px
          WHERE px.recibo_id = r.recibo_id
            AND px.fecha_pago::date BETWEEN $2::date AND $3::date
        )
      )
    ORDER BY r.fecha_vencimiento ASC, r.recibo_id ASC;
    `,
    [
      idsInmuebles,
      inicio,
      fin
    ]
  );

  const registros = [];

  for (const recibo of result.rows) {
    const estadoReporte = determinarEstadoReporte(recibo);

    if (!cumpleFiltroEstado(estado, estadoReporte)) {
      continue;
    }

    const inmueble = inmueblesMap.get(Number(recibo.inmueble_id));

    const reserva = recibo.reserva_id
      ? await obtenerReservaFinance(recibo.reserva_id)
      : null;

    const inquilinoId = reserva?.inquilino_id || null;
    const inquilino = inquilinoId
      ? `Usuario ${inquilinoId}`
      : 'Sin inquilino';

    const textoBusqueda = [
      recibo.recibo_id,
      recibo.numero_recibo_base,
      inmueble?.codigo,
      inmueble?.nombre,
      inmueble?.titulo,
      inquilino
    ].join(' ').toUpperCase();

    if (
      busquedaNormalizada &&
      !textoBusqueda.includes(busquedaNormalizada)
    ) {
      continue;
    }

    const totalRecibo = convertirNumero(recibo.total);
    const montoPagado = convertirNumero(recibo.total_pagado);
    const montoPagadoPeriodo = convertirNumero(recibo.total_pagado_periodo);
    const deuda = convertirNumero(recibo.saldo_pendiente);

    registros.push({
      recibo_id: Number(recibo.recibo_id),
      reserva_id: recibo.reserva_id ? Number(recibo.reserva_id) : null,

      inmueble_id: Number(recibo.inmueble_id),
      codigo_inmueble:
        inmueble?.codigo_inmueble ||
        inmueble?.codigo ||
        null,
      inmueble:
        inmueble?.nombre_inmueble ||
        inmueble?.nombre ||
        inmueble?.titulo ||
        `Inmueble ${recibo.inmueble_id}`,

      inquilino_id: inquilinoId,
      inquilino,

      periodo_anio: Number(recibo.periodo_anio),
      periodo_mes: Number(recibo.periodo_mes),

      fecha_emision: recibo.fecha_emision,
      fecha_vencimiento: recibo.fecha_vencimiento,
      fecha_referencia_reporte: recibo.ultima_fecha_pago || recibo.fecha_vencimiento,
      tipo_referencia_reporte: recibo.ultima_fecha_pago ? 'PAGO' : 'VENCIMIENTO',

      estado_recibo: recibo.estado_recibo,
      estado_reporte: estadoReporte,

      total_recibo: totalRecibo,
      total: totalRecibo,
      monto_pagado: montoPagado,
      monto_pagado_periodo: montoPagadoPeriodo,
      deuda,

      moneda: reserva?.moneda || 'PEN'
    });
  }

  return registros;
};

module.exports = {
  obtenerResumenFinancieroMensual,
  obtenerDetalleMovimientosMensuales,
  obtenerDashboardKpisMensual,
  listarPagosDeudoresPorPeriodo
};