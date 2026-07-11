const {
  obtenerResumenFinancieroMensual,
  obtenerDetalleMovimientosMensuales,
  obtenerDashboardKpisMensual,
  listarPagosDeudoresPorPeriodo
} = require('../models/reporte.model');

const obtenerUsuarioRequest = (req) => {
  return req.usuario || req.user || null;
};

const obtenerRolesUsuario = (usuario) => {
  if (!usuario) return [];

  const posiblesRoles = usuario.roles || usuario.rol || usuario.nombre_rol || [];

  if (Array.isArray(posiblesRoles)) {
    return posiblesRoles
      .map((rol) => {
        if (typeof rol === 'string') return rol;
        return rol.nombre || rol.nombre_rol || rol.rol || '';
      })
      .filter(Boolean)
      .map((rol) => rol.toUpperCase());
  }

  if (typeof posiblesRoles === 'string') {
    return [posiblesRoles.toUpperCase()];
  }

  return [];
};

const usuarioTieneRolPermitido = (usuario) => {
  const roles = obtenerRolesUsuario(usuario);

  return roles.some((rol) =>
    ['SECRETARIO', 'ADMIN', 'ADMIN_EMPRESA'].includes(rol)
  );
};

const validarFiltrosReporte = (anio, mes) => {
  const anioNumber = Number(anio);
  const mesNumber = Number(mes);

  if (!anio || Number.isNaN(anioNumber)) {
    return {
      valido: false,
      mensaje: 'El año es obligatorio y debe ser numérico.'
    };
  }

  if (!mes || Number.isNaN(mesNumber)) {
    return {
      valido: false,
      mensaje: 'El mes es obligatorio y debe ser numérico.'
    };
  }

  if (!Number.isInteger(anioNumber) || anioNumber < 2000 || anioNumber > 2100) {
    return {
      valido: false,
      mensaje: 'El año debe ser válido.'
    };
  }

  if (!Number.isInteger(mesNumber) || mesNumber < 1 || mesNumber > 12) {
    return {
      valido: false,
      mensaje: 'El mes debe estar entre 1 y 12.'
    };
  }

  return {
    valido: true,
    anio: anioNumber,
    mes: mesNumber
  };
};

const validarFiltrosPagosDeudores = ({
  fecha_inicio,
  fecha_fin,
  estado
}) => {
  if (!fecha_inicio || !fecha_fin) {
    return {
      valido: false,
      mensaje: 'La fecha de inicio y la fecha de fin son obligatorias.'
    };
  }

  const fechaInicio = new Date(`${fecha_inicio}T00:00:00`);
  const fechaFin = new Date(`${fecha_fin}T00:00:00`);

  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return {
      valido: false,
      mensaje: 'Las fechas deben tener un formato válido YYYY-MM-DD.'
    };
  }

  if (fechaInicio > fechaFin) {
    return {
      valido: false,
      mensaje: 'La fecha de inicio no puede ser mayor que la fecha de fin.'
    };
  }

  const estadoNormalizado = String(estado || 'TODOS')
    .trim()
    .toUpperCase();

  const estadosPermitidos = [
    'TODOS',
    'PAGADO',
    'PENDIENTE',
    'VENCIDO',
    'DEUDOR'
  ];

  if (!estadosPermitidos.includes(estadoNormalizado)) {
    return {
      valido: false,
      mensaje: 'El estado debe ser TODOS, PAGADO, PENDIENTE, VENCIDO o DEUDOR.'
    };
  }

  return {
    valido: true,
    fecha_inicio,
    fecha_fin,
    estado: estadoNormalizado
  };
};

const validarPaginacionReporte = ({
  pagina,
  limite
}) => {
  const paginaNumber = Number(pagina || 1);
  const limiteNumber = Number(limite || 10);

  if (
    !Number.isInteger(paginaNumber) ||
    paginaNumber <= 0
  ) {
    return {
      valido: false,
      mensaje: 'La página debe ser un número entero mayor a 0.'
    };
  }

  if (
    !Number.isInteger(limiteNumber) ||
    limiteNumber <= 0 ||
    limiteNumber > 100
  ) {
    return {
      valido: false,
      mensaje: 'El límite debe ser un número entero entre 1 y 100.'
    };
  }

  return {
    valido: true,
    pagina: paginaNumber,
    limite: limiteNumber
  };
};

const construirResumenPagosDeudores = (registros) => {
  const resumen = {
    total_registros: registros.length,

    cantidad_pagados: 0,
    cantidad_pendientes: 0,
    cantidad_vencidos: 0,
    cantidad_deudores: 0,

    total_pagado: 0,
    total_pagado_periodo: 0,
    total_deuda: 0,
    total_deuda_pendiente: 0,
    total_deuda_vencida: 0,

    totales_por_moneda: {}
  };

  registros.forEach((registro) => {
    const estadoReporte = String(registro.estado_reporte || '').toUpperCase();
    const moneda = registro.moneda || 'PEN';

    const montoPagado = Number(registro.monto_pagado || 0);
    const montoPagadoPeriodo = Number(registro.monto_pagado_periodo || 0);
    const montoDeuda = Number(registro.monto_deuda || 0);

    if (!resumen.totales_por_moneda[moneda]) {
      resumen.totales_por_moneda[moneda] = {
        total_pagado: 0,
        total_pagado_periodo: 0,
        total_deuda: 0,
        total_deuda_pendiente: 0,
        total_deuda_vencida: 0
      };
    }

    if (estadoReporte === 'PAGADO') {
      resumen.cantidad_pagados += 1;
    }

    if (estadoReporte === 'PENDIENTE') {
      resumen.cantidad_pendientes += 1;
      resumen.cantidad_deudores += 1;
      resumen.total_deuda_pendiente += montoDeuda;
      resumen.totales_por_moneda[moneda].total_deuda_pendiente += montoDeuda;
    }

    if (estadoReporte === 'VENCIDO') {
      resumen.cantidad_vencidos += 1;
      resumen.cantidad_deudores += 1;
      resumen.total_deuda_vencida += montoDeuda;
      resumen.totales_por_moneda[moneda].total_deuda_vencida += montoDeuda;
    }

    resumen.total_pagado += montoPagado;
    resumen.total_pagado_periodo += montoPagadoPeriodo;
    resumen.total_deuda += montoDeuda;

    resumen.totales_por_moneda[moneda].total_pagado += montoPagado;
    resumen.totales_por_moneda[moneda].total_pagado_periodo += montoPagadoPeriodo;
    resumen.totales_por_moneda[moneda].total_deuda += montoDeuda;
  });

  resumen.total_pagado = Number(resumen.total_pagado.toFixed(2));
  resumen.total_pagado_periodo = Number(resumen.total_pagado_periodo.toFixed(2));
  resumen.total_deuda = Number(resumen.total_deuda.toFixed(2));
  resumen.total_deuda_pendiente = Number(resumen.total_deuda_pendiente.toFixed(2));
  resumen.total_deuda_vencida = Number(resumen.total_deuda_vencida.toFixed(2));

  Object.keys(resumen.totales_por_moneda).forEach((moneda) => {
    resumen.totales_por_moneda[moneda].total_pagado = Number(
      resumen.totales_por_moneda[moneda].total_pagado.toFixed(2)
    );

    resumen.totales_por_moneda[moneda].total_pagado_periodo = Number(
      resumen.totales_por_moneda[moneda].total_pagado_periodo.toFixed(2)
    );

    resumen.totales_por_moneda[moneda].total_deuda = Number(
      resumen.totales_por_moneda[moneda].total_deuda.toFixed(2)
    );

    resumen.totales_por_moneda[moneda].total_deuda_pendiente = Number(
      resumen.totales_por_moneda[moneda].total_deuda_pendiente.toFixed(2)
    );

    resumen.totales_por_moneda[moneda].total_deuda_vencida = Number(
      resumen.totales_por_moneda[moneda].total_deuda_vencida.toFixed(2)
    );
  });

  return resumen;
};

const construirResumenPorInquilino = (registros) => {
  const mapaInquilinos = new Map();

  registros.forEach((registro) => {
    const inquilinoId = registro.inquilino_id;

    if (!mapaInquilinos.has(inquilinoId)) {
      mapaInquilinos.set(inquilinoId, {
        inquilino_id: inquilinoId,
        nombres_inquilino: registro.nombres_inquilino,
        apellidos_inquilino: registro.apellidos_inquilino,
        correo_inquilino: registro.correo_inquilino,
        telefono_inquilino: registro.telefono_inquilino,

        total_recibos: 0,
        cantidad_pagados: 0,
        cantidad_pendientes: 0,
        cantidad_vencidos: 0,

        total_pagado: 0,
        total_pagado_periodo: 0,
        total_deuda: 0,
        total_deuda_pendiente: 0,
        total_deuda_vencida: 0,

        estado_general: 'PAGADO',
        inmuebles: [],
        recibos: []
      });
    }

    const inquilino = mapaInquilinos.get(inquilinoId);

    const estadoReporte = String(registro.estado_reporte || '').toUpperCase();
    const montoPagado = Number(registro.monto_pagado || 0);
    const montoPagadoPeriodo = Number(registro.monto_pagado_periodo || 0);
    const montoDeuda = Number(registro.monto_deuda || 0);

    inquilino.total_recibos += 1;
    inquilino.total_pagado += montoPagado;
    inquilino.total_pagado_periodo += montoPagadoPeriodo;
    inquilino.total_deuda += montoDeuda;

    if (estadoReporte === 'PAGADO') {
      inquilino.cantidad_pagados += 1;
    }

    if (estadoReporte === 'PENDIENTE') {
      inquilino.cantidad_pendientes += 1;
      inquilino.total_deuda_pendiente += montoDeuda;
    }

    if (estadoReporte === 'VENCIDO') {
      inquilino.cantidad_vencidos += 1;
      inquilino.total_deuda_vencida += montoDeuda;
    }

    const yaExisteInmueble = inquilino.inmuebles.some(
      (inmueble) => inmueble.inmueble_id === registro.inmueble_id
    );

    if (!yaExisteInmueble) {
      inquilino.inmuebles.push({
        inmueble_id: registro.inmueble_id,
        codigo_inmueble: registro.codigo_inmueble,
        nombre_inmueble: registro.nombre_inmueble
      });
    }

    inquilino.recibos.push({
      recibo_id: registro.recibo_id,
      reserva_id: registro.reserva_id,
      estado_reporte: registro.estado_reporte,
      fecha_emision: registro.fecha_emision,
      fecha_vencimiento: registro.fecha_vencimiento,
      fecha_referencia_reporte: registro.fecha_referencia_reporte,
      tipo_referencia_reporte: registro.tipo_referencia_reporte,
      total_recibo: registro.total_recibo,
      monto_pagado: registro.monto_pagado,
      monto_pagado_periodo: registro.monto_pagado_periodo,
      monto_deuda: registro.monto_deuda,
      moneda: registro.moneda
    });
  });

  const inquilinos = Array.from(mapaInquilinos.values()).map((inquilino) => {
    if (inquilino.cantidad_vencidos > 0) {
      inquilino.estado_general = 'VENCIDO';
    } else if (inquilino.cantidad_pendientes > 0) {
      inquilino.estado_general = 'PENDIENTE';
    } else {
      inquilino.estado_general = 'PAGADO';
    }

    return {
      ...inquilino,
      total_pagado: Number(inquilino.total_pagado.toFixed(2)),
      total_pagado_periodo: Number(inquilino.total_pagado_periodo.toFixed(2)),
      total_deuda: Number(inquilino.total_deuda.toFixed(2)),
      total_deuda_pendiente: Number(inquilino.total_deuda_pendiente.toFixed(2)),
      total_deuda_vencida: Number(inquilino.total_deuda_vencida.toFixed(2))
    };
  });

  return inquilinos.sort((a, b) => {
    const prioridad = {
      VENCIDO: 1,
      PENDIENTE: 2,
      PAGADO: 3
    };

    return prioridad[a.estado_general] - prioridad[b.estado_general];
  });
};

const paginarRegistros = ({
  registros,
  pagina,
  limite
}) => {
  const totalRegistros = registros.length;
  const totalPaginas = Math.ceil(totalRegistros / limite) || 1;

  const inicio = (pagina - 1) * limite;
  const fin = inicio + limite;

  return {
    registros_paginados: registros.slice(inicio, fin),
    paginacion: {
      pagina_actual: pagina,
      limite,
      total_registros: totalRegistros,
      total_paginas: totalPaginas,
      tiene_pagina_anterior: pagina > 1,
      tiene_pagina_siguiente: pagina < totalPaginas
    }
  };
};

const obtenerReporteFinancieroMensual = async (req, res) => {
  try {
    const usuario = obtenerUsuarioRequest(req);

    if (!usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado.'
      });
    }

    if (!usuarioTieneRolPermitido(usuario)) {
      return res.status(403).json({
        message: 'No tiene permisos para consultar reportes financieros.'
      });
    }

    const empresaId = usuario.empresa_id;

    if (!empresaId) {
      return res.status(400).json({
        message: 'El usuario no tiene una empresa asociada.'
      });
    }

    const validacion = validarFiltrosReporte(req.query.anio, req.query.mes);

    if (!validacion.valido) {
      return res.status(400).json({
        message: validacion.mensaje
      });
    }

    const resumen = await obtenerResumenFinancieroMensual(
      empresaId,
      validacion.anio,
      validacion.mes
    );

    const totalIngresos = Number(resumen?.total_ingresos || 0);
    const totalGastos = Number(resumen?.total_gastos || 0);
    const balanceNeto = Number(resumen?.balance_neto || 0);

    return res.json({
      message: 'Reporte financiero mensual obtenido correctamente.',
      data: {
        anio: validacion.anio,
        mes: validacion.mes,
        total_ingresos: totalIngresos,
        total_gastos: totalGastos,
        balance_neto: balanceNeto,
        estado_balance:
          balanceNeto > 0 ? 'POSITIVO' : balanceNeto < 0 ? 'NEGATIVO' : 'NEUTRO'
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte financiero mensual:', error);

    return res.status(500).json({
      message: 'Error interno al obtener el reporte financiero mensual.'
    });
  }
};

const obtenerDetalleMovimientosMensualesController = async (req, res) => {
  try {
    const usuario = obtenerUsuarioRequest(req);

    if (!usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado.'
      });
    }

    if (!usuarioTieneRolPermitido(usuario)) {
      return res.status(403).json({
        message: 'No tiene permisos para consultar el detalle financiero.'
      });
    }

    const empresaId = usuario.empresa_id;

    if (!empresaId) {
      return res.status(400).json({
        message: 'El usuario no tiene una empresa asociada.'
      });
    }

    const validacion = validarFiltrosReporte(req.query.anio, req.query.mes);

    if (!validacion.valido) {
      return res.status(400).json({
        message: validacion.mensaje
      });
    }

    const movimientos = await obtenerDetalleMovimientosMensuales(
      empresaId,
      validacion.anio,
      validacion.mes
    );

    return res.json({
      message: 'Detalle de movimientos mensuales obtenido correctamente.',
      data: {
        anio: validacion.anio,
        mes: validacion.mes,
        total_movimientos: movimientos.length,
        movimientos
      }
    });
  } catch (error) {
    console.error('Error al obtener detalle de movimientos mensuales:', error);

    return res.status(500).json({
      message: 'Error interno al obtener el detalle de movimientos mensuales.'
    });
  }
};
const obtenerDashboardKpis = async (req, res) => {
  try {
    const usuario = obtenerUsuarioRequest(req);

    if (!usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado.'
      });
    }

    if (!usuarioTieneRolPermitido(usuario)) {
      return res.status(403).json({
        message: 'No tiene permisos para consultar el dashboard de KPIs.'
      });
    }

    const empresaId = usuario.empresa_id;

    if (!empresaId) {
      return res.status(400).json({
        message: 'El usuario no tiene una empresa asociada.'
      });
    }

    const validacion = validarFiltrosReporte(req.query.anio, req.query.mes);

    if (!validacion.valido) {
      return res.status(400).json({
        message: validacion.mensaje
      });
    }

   const dashboard = await obtenerDashboardKpisMensual(
  empresaId,
  validacion.anio,
  validacion.mes
);

return res.json({
  message: 'Dashboard de KPIs obtenido correctamente.',
  data: dashboard
});

  } catch (error) {
    console.error('Error al obtener dashboard de KPIs:', error);

    return res.status(500).json({
      message: 'Error interno al obtener el dashboard de KPIs.'
    });
  }
};

const obtenerReportePagosDeudores = async (req, res) => {
  try {
    const usuario = obtenerUsuarioRequest(req);

    if (!usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado.'
      });
    }

    if (!usuarioTieneRolPermitido(usuario)) {
      return res.status(403).json({
        message: 'No tiene permisos para consultar el reporte de pagos y deudores.'
      });
    }

    const empresaId = usuario.empresa_id;

    if (!empresaId) {
      return res.status(400).json({
        message: 'El usuario no tiene una empresa asociada.'
      });
    }

    const validacion = validarFiltrosPagosDeudores({
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      estado: req.query.estado
    });

    if (!validacion.valido) {
      return res.status(400).json({
        message: validacion.mensaje
      });
    }

    const validacionPaginacion = validarPaginacionReporte({
      pagina: req.query.pagina,
      limite: req.query.limite
    });

    if (!validacionPaginacion.valido) {
      return res.status(400).json({
        message: validacionPaginacion.mensaje
      });
    }

    const reporte = await listarPagosDeudoresPorPeriodo({
      empresa_id: empresaId,
      fecha_inicio: validacion.fecha_inicio,
      fecha_fin: validacion.fecha_fin,
      estado: validacion.estado
    });

    const resumen = construirResumenPagosDeudores(reporte);
    const inquilinos = construirResumenPorInquilino(reporte);

    const {
      registros_paginados,
      paginacion
    } = paginarRegistros({
      registros: reporte,
      pagina: validacionPaginacion.pagina,
      limite: validacionPaginacion.limite
    });

    return res.status(200).json({
      message: 'Reporte de pagos y deudores obtenido correctamente.',
      data: {
        fecha_inicio: validacion.fecha_inicio,
        fecha_fin: validacion.fecha_fin,
        estado: validacion.estado,
        resumen,
        total_inquilinos: inquilinos.length,
        inquilinos,
        paginacion,
        registros: registros_paginados
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de pagos y deudores:', error);

    return res.status(500).json({
      message: 'Error interno al obtener el reporte de pagos y deudores.'
    });
  }
};

module.exports = {
  obtenerReporteFinancieroMensual,
  obtenerDetalleMovimientosMensuales: obtenerDetalleMovimientosMensualesController,
  obtenerDashboardKpis,
  obtenerReportePagosDeudores
};