const { getPostgresPool } = require('../config/postgresDb');

const {
  obtenerReservaFinance
} = require('../clients/booking.client');

const {
  obtenerPublicacionPorInmuebleCatalog
} = require('../clients/catalog.client');

const IGV_PORCENTAJE = 0.18;

const redondear2 = (valor) => {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
};

const obtenerFechaYYYYMMDD = (valor) => {
  if (!valor) return null;

  const fecha = valor instanceof Date
    ? valor
    : new Date(valor);

  if (Number.isNaN(fecha.getTime())) return null;

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const obtenerPeriodoDesdeFecha = (fecha) => {
  const fechaTexto = obtenerFechaYYYYMMDD(fecha);
  const fechaDate = new Date(`${fechaTexto}T00:00:00`);

  return {
    anio: fechaDate.getFullYear(),
    mes: fechaDate.getMonth() + 1
  };
};

const calcularDiasReserva = (fechaInicio, fechaFin) => {
  const inicioTexto = obtenerFechaYYYYMMDD(fechaInicio);
  const finTexto = obtenerFechaYYYYMMDD(fechaFin);

  const inicio = new Date(`${inicioTexto}T00:00:00`);
  const fin = new Date(`${finTexto}T00:00:00`);

  const diferenciaMs = fin.getTime() - inicio.getTime();
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

  return Math.max(dias, 1);
};

const calcularFechaVencimientoReserva = (fechaInicio, fechaEmision = new Date()) => {
  const inicioTexto = obtenerFechaYYYYMMDD(fechaInicio);
  const emisionTexto = obtenerFechaYYYYMMDD(fechaEmision);

  const inicio = new Date(`${inicioTexto}T00:00:00`);
  const emision = new Date(`${emisionTexto}T00:00:00`);

  const fechaVencimiento = new Date(inicio);
  fechaVencimiento.setDate(fechaVencimiento.getDate() - 1);

  if (fechaVencimiento < emision) {
    return obtenerFechaYYYYMMDD(emision);
  }

  return obtenerFechaYYYYMMDD(fechaVencimiento);
};

const mapNumeroRecibo = (recibo) => {
  if (!recibo) return null;

  return {
    ...recibo,
    subtotal: redondear2(recibo.subtotal),
    igv_total: redondear2(recibo.igv_total),
    total: redondear2(recibo.total),
    saldo_pendiente: redondear2(recibo.saldo_pendiente),
    numero_recibo: `B-${String(recibo.recibo_id).padStart(6, '0')}`,
    serie_empresa: 'B001',
    correlativo_empresa: recibo.recibo_id
  };
};

const mapNumeroDetalle = (detalle) => ({
  ...detalle,
  cantidad: redondear2(detalle.cantidad),
  precio_unitario: redondear2(detalle.precio_unitario),
  importe: redondear2(detalle.importe)
});

const obtenerReservaParaReciboGestion = async ({
  usuario_gestor_id,
  reserva_id
}) => {
  const reserva = await obtenerReservaFinance(reserva_id);

  if (!reserva) return null;

  const publicacion = await obtenerPublicacionPorInmuebleCatalog(
    reserva.inmueble_id
  );

  return {
    ...reserva,
    empresa_id: publicacion?.empresa_id || null,
    codigo_inmueble: publicacion?.codigo_inmueble || publicacion?.codigo || `INM-${reserva.inmueble_id}`,
    nombre_inmueble: publicacion?.nombre_inmueble || publicacion?.nombre || publicacion?.titulo || `Inmueble ${reserva.inmueble_id}`,
    titulo_publicacion: publicacion?.titulo || null,
    precio_publicado_mensual: Number(publicacion?.precio_publicado_mensual || 0),
    usuario_gestor_id
  };
};

const obtenerCuentaCobroPorInmueble = async ({
  client,
  inmueble_id,
  codigo_inmueble
}) => {
  const cuentaExistenteResult = await client.query(
    `
    SELECT
      cuenta_cobro_inmueble_id,
      inmueble_id,
      numero_recibo_base,
      dia_vencimiento,
      activo,
      created_at
    FROM cuenta_cobro_inmueble
    WHERE inmueble_id = $1
      AND activo = TRUE
    LIMIT 1;
    `,
    [inmueble_id]
  );

  const cuentaExistente = cuentaExistenteResult.rows[0];

  if (cuentaExistente) return cuentaExistente;

  const numeroReciboBase = `REC-${inmueble_id}-${String(codigo_inmueble || 'INM').slice(0, 20)}`;

  const cuentaCreadaResult = await client.query(
    `
    INSERT INTO cuenta_cobro_inmueble (
      inmueble_id,
      numero_recibo_base,
      dia_vencimiento,
      activo,
      created_at
    )
    VALUES ($1, $2, 5, TRUE, CURRENT_TIMESTAMP)
    RETURNING
      cuenta_cobro_inmueble_id,
      inmueble_id,
      numero_recibo_base,
      dia_vencimiento,
      activo,
      created_at;
    `,
    [
      inmueble_id,
      numeroReciboBase
    ]
  );

  return cuentaCreadaResult.rows[0];
};

const obtenerConceptosActivosParaReserva = async ({ client }) => {
  const result = await client.query(`
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
      created_at
    FROM concepto_cobro
    WHERE activo = TRUE
    ORDER BY orden_impresion ASC, concepto_cobro_id ASC;
  `);

  return result.rows.map((concepto) => ({
    ...concepto,
    monto_default: redondear2(concepto.monto_default),
    metodo_calculo: concepto.codigo === 'RENTA_RESERVA'
      ? 'RENTA_PRORRATEADA'
      : 'MONTO_FIJO',
    aplica_desde_dias: 0
  }));
};

const construirLineasRecibo = ({
  reserva,
  conceptos,
  dias_reserva
}) => {
  const rentaMensual = Number(
    reserva.renta_pactada_mensual ||
    reserva.precio_publicado_mensual ||
    reserva.monto_total_estimado ||
    0
  );

  const lineas = [];

  const conceptoRenta = conceptos.find(
    (concepto) => concepto.codigo === 'RENTA_RESERVA'
  );

  if (!conceptoRenta) {
    return {
      ok: false,
      codigo: 'CONCEPTO_RENTA_NO_CONFIGURADO',
      mensaje: 'No se encontró el concepto RENTA_RESERVA.'
    };
  }

  const precioUnitarioDiario = redondear2(rentaMensual / 30);
  const importeRenta = redondear2(precioUnitarioDiario * dias_reserva);

  lineas.push({
    concepto_cobro_id: conceptoRenta.concepto_cobro_id,
    codigo: conceptoRenta.codigo,
    nombre: conceptoRenta.nombre,
    descripcion: `Renta de reserva por ${dias_reserva} día(s)`,
    cantidad: dias_reserva,
    precio_unitario: precioUnitarioDiario,
    importe: importeRenta,
    aplica_igv: Boolean(conceptoRenta.aplica_igv),
    orden_impresion: conceptoRenta.orden_impresion || 1
  });

  for (const concepto of conceptos) {
    if (concepto.codigo === 'RENTA_RESERVA') continue;

    const monto = redondear2(concepto.monto_default);

    if (monto <= 0 && !concepto.es_obligatorio) continue;

    lineas.push({
      concepto_cobro_id: concepto.concepto_cobro_id,
      codigo: concepto.codigo,
      nombre: concepto.nombre,
      descripcion: concepto.descripcion || concepto.nombre,
      cantidad: 1,
      precio_unitario: monto,
      importe: monto,
      aplica_igv: Boolean(concepto.aplica_igv),
      orden_impresion: concepto.orden_impresion || 99
    });
  }

  const subtotal = redondear2(
    lineas.reduce((total, linea) => total + Number(linea.importe || 0), 0)
  );

  const igv_total = redondear2(
    lineas.reduce((total, linea) => {
      if (!linea.aplica_igv) return total;
      return total + redondear2(Number(linea.importe || 0) * IGV_PORCENTAJE);
    }, 0)
  );

  const total = redondear2(subtotal + igv_total);

  return {
    ok: true,
    lineas,
    subtotal,
    igv_total,
    total
  };
};

const aplicarConceptosEditados = ({
  calculo,
  conceptos_editados = []
}) => {
  if (!Array.isArray(conceptos_editados) || conceptos_editados.length === 0) {
    return calculo;
  }

  const editadosPorConcepto = new Map();

  for (const item of conceptos_editados) {
    const conceptoId = Number(item.concepto_cobro_id);

    if (!conceptoId) continue;

    editadosPorConcepto.set(conceptoId, item);
  }

  const lineasActualizadas = calculo.lineas.map((linea) => {
    const editado = editadosPorConcepto.get(Number(linea.concepto_cobro_id));

    if (!editado) return linea;

    const cantidad = redondear2(editado.cantidad || linea.cantidad);
    const precioUnitario = redondear2(editado.precio_unitario || linea.precio_unitario);
    const importe = redondear2(cantidad * precioUnitario);

    return {
      ...linea,
      descripcion: editado.descripcion || linea.descripcion,
      cantidad,
      precio_unitario: precioUnitario,
      importe
    };
  });

  const subtotal = redondear2(
    lineasActualizadas.reduce((total, linea) => total + Number(linea.importe || 0), 0)
  );

  const igv_total = redondear2(
    lineasActualizadas.reduce((total, linea) => {
      if (!linea.aplica_igv) return total;
      return total + redondear2(Number(linea.importe || 0) * IGV_PORCENTAJE);
    }, 0)
  );

  const total = redondear2(subtotal + igv_total);

  return {
    lineas: lineasActualizadas,
    subtotal,
    igv_total,
    total
  };
};

const obtenerReciboCompletoPorId = async (recibo_id) => {
  const pool = getPostgresPool();

  const reciboResult = await pool.query(
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

  const reciboBase = reciboResult.rows[0];

  if (!reciboBase) return null;

  const detallesResult = await pool.query(
    `
    SELECT
      rd.recibo_detalle_id,
      rd.recibo_id,
      rd.concepto_cobro_id,
      rd.descripcion,
      rd.cantidad,
      rd.precio_unitario,
      rd.importe,
      rd.orden_impresion,
      rd.created_at,

      cc.codigo AS codigo_concepto,
      cc.nombre AS concepto,
      cc.aplica_igv
    FROM recibo_detalle rd
    INNER JOIN concepto_cobro cc
      ON cc.concepto_cobro_id = rd.concepto_cobro_id
    WHERE rd.recibo_id = $1
    ORDER BY rd.orden_impresion ASC, rd.recibo_detalle_id ASC;
    `,
    [recibo_id]
  );

  let reserva = null;
  let publicacion = null;

  if (reciboBase.reserva_id) {
    reserva = await obtenerReservaFinance(reciboBase.reserva_id);
  }

  if (reciboBase.inmueble_id) {
    publicacion = await obtenerPublicacionPorInmuebleCatalog(
      reciboBase.inmueble_id
    );
  }

  const recibo = mapNumeroRecibo({
    ...reciboBase,
    codigo_inmueble: publicacion?.codigo_inmueble || publicacion?.codigo || null,
    inmueble: publicacion?.nombre_inmueble || publicacion?.nombre || publicacion?.titulo || null,
    nombre_inmueble: publicacion?.nombre_inmueble || publicacion?.nombre || publicacion?.titulo || null,
    titulo_publicacion: publicacion?.titulo || null,

    inquilino_id: reserva?.inquilino_id || null,
    nombre_inquilino: reserva?.inquilino_id
      ? `Usuario ${reserva.inquilino_id}`
      : null,

    fecha_inicio: reserva?.fecha_inicio || null,
    fecha_fin: reserva?.fecha_fin || null,
    moneda: reserva?.moneda || 'PEN'
  });

  return {
    recibo,
    detalles: detallesResult.rows.map(mapNumeroDetalle)
  };
};

const obtenerVistaPreviaReciboReservaGestion = async ({
  usuario_gestor_id,
  reserva_id
}) => {
  const pool = getPostgresPool();

  const reserva = await obtenerReservaParaReciboGestion({
    usuario_gestor_id,
    reserva_id
  });

  if (!reserva) {
    return {
      codigo: 'RESERVA_NO_ENCONTRADA',
      mensaje: 'No se encontró la reserva.'
    };
  }

  const estadosPermitidos = ['APROBADA', 'ACTIVA', 'FINALIZADA'];

  if (!estadosPermitidos.includes(String(reserva.estado_reserva).toUpperCase())) {
    return {
      codigo: 'ESTADO_NO_PERMITIDO',
      mensaje: 'La reserva no está en un estado permitido para generar recibo.'
    };
  }

  const reciboExistenteResult = await pool.query(
    `
    SELECT recibo_id
    FROM recibo
    WHERE reserva_id = $1
    LIMIT 1;
    `,
    [reserva.reserva_id]
  );

  const reciboExistente = reciboExistenteResult.rows[0];

  if (reciboExistente) {
    const reciboCompleto = await obtenerReciboCompletoPorId(
      reciboExistente.recibo_id
    );

    return {
      codigo: 'RECIBO_EXISTENTE',
      mensaje: 'Ya existe una boleta generada para esta reserva.',
      ...reciboCompleto
    };
  }

  const diasReserva = calcularDiasReserva(
    reserva.fecha_inicio,
    reserva.fecha_fin
  );

  const clientLike = {
    query: (...args) => pool.query(...args)
  };

  const conceptos = await obtenerConceptosActivosParaReserva({
    client: clientLike
  });

  const calculo = construirLineasRecibo({
    reserva,
    conceptos,
    dias_reserva: diasReserva
  });

  if (calculo.codigo) return calculo;

  const fechaVencimiento = calcularFechaVencimientoReserva(
    reserva.fecha_inicio
  );

  const conceptosPreview = calculo.lineas.map((linea) => {
    const igv = linea.aplica_igv
      ? redondear2(Number(linea.importe || 0) * IGV_PORCENTAJE)
      : 0;

    return {
      ok: false,
      codigo: 'RESERVA_NO_ENCONTRADA',
      mensaje: 'No se encontró la reserva.'
    };
  });

  return {
    ok: true,
    reserva,
    conceptos: conceptosPreview,
    subtotal: calculo.subtotal,
    igv_total: calculo.igv_total,
    total: calculo.total,
    dias_reserva: diasReserva,
    fecha_vencimiento: fechaVencimiento
  };
};

const generarReciboReservaGestion = async ({
  usuario_gestor_id,
  reserva_id,
  observaciones,
  conceptos_editados = []
}) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reserva = await obtenerReservaParaReciboGestion({
      usuario_gestor_id,
      reserva_id
    });

    if (!reserva) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        codigo: 'RESERVA_NO_ENCONTRADA',
        mensaje: 'No se encontró la reserva.'
      };
    }

    const estadosPermitidos = ['APROBADA', 'ACTIVA', 'FINALIZADA'];

    if (!estadosPermitidos.includes(String(reserva.estado_reserva).toUpperCase())) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        codigo: 'ESTADO_NO_PERMITIDO',
        mensaje: 'La reserva no está en un estado permitido para generar recibo.'
      };
    }

    const reciboExistenteResult = await client.query(
      `
      SELECT recibo_id
      FROM recibo
      WHERE reserva_id = $1
      LIMIT 1;
      `,
      [reserva.reserva_id]
    );

    const reciboExistente = reciboExistenteResult.rows[0];

    if (reciboExistente) {
      await client.query('ROLLBACK');

      const reciboCompleto = await obtenerReciboCompletoPorId(
        reciboExistente.recibo_id
      );

      return {
        ok: false,
        codigo: 'RECIBO_EXISTENTE',
        mensaje: 'Ya existe una boleta generada para esta reserva.',
        ...reciboCompleto
      };
    }

    const cuentaCobro = await obtenerCuentaCobroPorInmueble({
      client,
      inmueble_id: reserva.inmueble_id,
      codigo_inmueble: reserva.codigo_inmueble
    });

    const { anio, mes } = obtenerPeriodoDesdeFecha(reserva.fecha_inicio);

    const diasReserva = calcularDiasReserva(
      reserva.fecha_inicio,
      reserva.fecha_fin
    );

    const conceptos = await obtenerConceptosActivosParaReserva({
      client
    });

    const calculoBase = construirLineasRecibo({
      reserva,
      conceptos,
      dias_reserva: diasReserva
    });

    if (calculoBase.codigo) {
      await client.query('ROLLBACK');
      return calculoBase;
    }

    const calculo = aplicarConceptosEditados({
      calculo: calculoBase,
      conceptos_editados
    });

    const fechaEmision = obtenerFechaYYYYMMDD(new Date());
    const fechaVencimiento = calcularFechaVencimientoReserva(
      reserva.fecha_inicio
    );

    const reciboResult = await client.query(
      `
      INSERT INTO recibo (
        cuenta_cobro_inmueble_id,
        reserva_id,
        periodo_anio,
        periodo_mes,
        fecha_emision,
        fecha_vencimiento,
        estado_recibo,
        subtotal,
        igv_total,
        total,
        saldo_pendiente,
        generado_desde_recibo_id,
        emitido_por_usuario_id,
        pdf_url,
        observaciones,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, 'PENDIENTE',
        $7, $8, $9, $9,
        NULL, $10, NULL, $11,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING
        recibo_id,
        cuenta_cobro_inmueble_id,
        reserva_id,
        periodo_anio,
        periodo_mes,
        fecha_emision,
        fecha_vencimiento,
        estado_recibo,
        subtotal,
        igv_total,
        total,
        saldo_pendiente,
        generado_desde_recibo_id,
        emitido_por_usuario_id,
        pdf_url,
        observaciones,
        created_at,
        updated_at;
      `,
      [
        cuentaCobro.cuenta_cobro_inmueble_id,
        reserva.reserva_id,
        anio,
        mes,
        fechaEmision,
        fechaVencimiento,
        calculo.subtotal,
        calculo.igv_total,
        calculo.total,
        usuario_gestor_id || null,
        observaciones || null
      ]
    );

    const recibo = reciboResult.rows[0];

    for (const linea of calculo.lineas) {
      await client.query(
        `
        INSERT INTO recibo_detalle (
          recibo_id,
          concepto_cobro_id,
          descripcion,
          cantidad,
          precio_unitario,
          importe,
          orden_impresion,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP);
        `,
        [
          recibo.recibo_id,
          linea.concepto_cobro_id,
          linea.descripcion,
          linea.cantidad,
          linea.precio_unitario,
          linea.importe,
          linea.orden_impresion
        ]
      );
    }

    await client.query('COMMIT');

    const reciboCompleto = await obtenerReciboCompletoPorId(recibo.recibo_id);

    return {
      ok: true,
      recibo: reciboCompleto.recibo,
      detalles: reciboCompleto.detalles,
      reserva
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarRecibosReservaAutorizados = async ({
  usuario_id,
  reserva_id
}) => {
  const reserva = await obtenerReservaFinance(reserva_id);

  if (!reserva) return [];

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
    WHERE r.reserva_id = $1
    ORDER BY r.created_at DESC, r.recibo_id DESC;
    `,
    [reserva_id]
  );

  return result.rows.map((recibo) => mapNumeroRecibo({
    ...recibo,
    inquilino_id: reserva.inquilino_id,
    moneda: reserva.moneda || 'PEN'
  }));
};

const obtenerReciboCompletoAutorizado = async ({
  usuario_id,
  recibo_id
}) => {
  const reciboCompleto = await obtenerReciboCompletoPorId(recibo_id);

  if (!reciboCompleto) return null;

  return reciboCompleto;
};

module.exports = {
  obtenerReservaParaReciboGestion,
  obtenerVistaPreviaReciboReservaGestion,
  generarReciboReservaGestion,
  listarRecibosReservaAutorizados,
  obtenerReciboCompletoAutorizado
};