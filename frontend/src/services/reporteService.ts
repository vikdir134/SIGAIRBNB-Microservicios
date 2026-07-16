import apiClient from './apiClient';

import type {
  DashboardKpisResponse,
  ReporteFinancieroMensualFiltros,
  ReporteResumenResponse,
  ReporteDetalleResponse,
  FiltrosReportePagosDeudores,
  ReportePagosDeudoresResponse
} from '../types/reporte';

const validarFiltros = (filtros: ReporteFinancieroMensualFiltros) => {
  if (!filtros.anio) {
    throw new Error('El año es obligatorio.');
  }

  if (!filtros.mes) {
    throw new Error('El mes es obligatorio.');
  }

  const anio = Number(filtros.anio);
  const mes = Number(filtros.mes);

  if (Number.isNaN(anio)) {
    throw new Error('El año debe ser numérico.');
  }

  if (Number.isNaN(mes)) {
    throw new Error('El mes debe ser numérico.');
  }

  if (mes < 1 || mes > 12) {
    throw new Error('El mes debe estar entre 1 y 12.');
  }

  return {
    anio,
    mes
  };
};

const validarFiltrosPagosDeudores = (
  filtros: FiltrosReportePagosDeudores
) => {
  if (!filtros.fecha_inicio) {
    throw new Error('La fecha de inicio es obligatoria.');
  }

  if (!filtros.fecha_fin) {
    throw new Error('La fecha de fin es obligatoria.');
  }

  const fechaInicio = new Date(`${filtros.fecha_inicio}T00:00:00`);
  const fechaFin = new Date(`${filtros.fecha_fin}T00:00:00`);

  if (
    Number.isNaN(fechaInicio.getTime()) ||
    Number.isNaN(fechaFin.getTime())
  ) {
    throw new Error('Las fechas no tienen un formato válido.');
  }

  if (fechaInicio > fechaFin) {
    throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin.');
  }

  const estadosPermitidos = [
    'TODOS',
    'PAGADO',
    'PENDIENTE',
    'VENCIDO',
    'DEUDOR'
  ];

  if (!estadosPermitidos.includes(filtros.estado)) {
    throw new Error('El estado seleccionado no es válido.');
  }

  return {
    fecha_inicio: filtros.fecha_inicio,
    fecha_fin: filtros.fecha_fin,
    estado: filtros.estado,
    pagina: filtros.pagina || 1,
    limite: filtros.limite || 10
  };
};

export const obtenerReporteFinancieroMensual = async (
  filtros: ReporteFinancieroMensualFiltros
) => {
  const filtrosValidados = validarFiltros(filtros);

  const response = await apiClient.get<ReporteResumenResponse>(
    '/reportes/financiero-mensual',
    {
      params: filtrosValidados
    }
  );

  return response.data.data;
};

export const obtenerDetalleMovimientosMensuales = async (
  filtros: ReporteFinancieroMensualFiltros
) => {
  const filtrosValidados = validarFiltros(filtros);

  const response = await apiClient.get<ReporteDetalleResponse>(
    '/reportes/financiero-mensual/detalle',
    {
      params: filtrosValidados
    }
  );

  return response.data.data;
};

export const obtenerDashboardKpis = async (
  filtros: ReporteFinancieroMensualFiltros
) => {
  const filtrosValidados = validarFiltros(filtros);

  const response = await apiClient.get<DashboardKpisResponse>(
    '/reportes/dashboard-kpis',
    {
      params: filtrosValidados
    }
  );

  return response.data.data;
};

export const obtenerReportePagosDeudores = async (
  filtros: FiltrosReportePagosDeudores
) => {
  const filtrosValidados = validarFiltrosPagosDeudores(filtros);

  const response = await apiClient.get<ReportePagosDeudoresResponse>(
    '/reportes/pagos-deudores',
    {
      params: filtrosValidados
    }
  );

  return response.data.data;
};