export interface ReporteFinancieroMensualFiltros {
  anio: number | '';
  mes: number | '';
}

export interface ResumenFinancieroMensual {
  anio: number;
  mes: number;
  total_ingresos: number;
  total_gastos: number;
  balance_neto: number;
  estado_balance: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
}

export interface MovimientoMensual {
  movimiento_bancario_id: number;
  fecha_movimiento: string;
  tipo_movimiento: 'INGRESO' | 'GASTO';
  concepto: string;
  descripcion: string | null;
  importe: number;
  referencia_externa: string | null;
  observaciones: string | null;

  categoria: string;
  naturaleza: 'INGRESO' | 'GASTO';

  cuenta_bancaria_id: number;
  nombre_cuenta: string;
  numero_cuenta: string;
  moneda: string;

  banco: string;

  inmueble_id: number | null;
  codigo_inmueble: string | null;
  inmueble: string | null;
}

export interface DetalleMovimientosMensuales {
  anio: number;
  mes: number;
  total_movimientos: number;
  movimientos: MovimientoMensual[];
}

export interface ReporteResumenResponse {
  message: string;
  data: ResumenFinancieroMensual;
}

export interface ReporteDetalleResponse {
  message: string;
  data: DetalleMovimientosMensuales;
}

export interface DashboardKpisResumen {
  total_ingresos: number;
  total_gastos: number;
  balance_neto: number;
  margen_rentabilidad: number;
  ocupacion_general: number;
  dias_ocupados: number;
  dias_disponibles: number;
  recibos_pendientes: number;
  cantidad_recibos_pendientes: number;
  recibos_vencidos: number;
  reservas_activas: number;
}

export interface RentabilidadMensual {
  anio: number;
  mes: number;
  periodo: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
}

export interface UtilidadPorInmueble {
  inmueble_id: number;
  codigo_inmueble: string;
  inmueble: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
}

export interface OcupacionPorInmueble {
  inmueble_id: number;
  codigo_inmueble: string;
  inmueble: string;
  dias_ocupados: number;
  dias_disponibles: number;
  ocupacion: number;
}

export interface ReciboPendientePorInmueble {
  inmueble_id: number;
  codigo_inmueble: string;
  inmueble: string;
  cantidad_recibos_pendientes: number;
  monto_pendiente: number;
}

export interface DistribucionIngresosGastos {
  categoria: string;
  monto: number;
}

export interface AlertaDashboardKpis {
tipo: 'INFO' | 'ADVERTENCIA' | 'CRITICO';
  mensaje: string;
}

export interface DashboardKpisData {
  anio: number;
  mes: number;
  periodo_nombre: string;
  fecha_ultima_actualizacion: string;
estado_dashboard: 'SALUDABLE' | 'ATENCION' | 'CRITICO' | 'NEUTRO';
  tiene_datos: boolean;
  resumen: DashboardKpisResumen;
  rentabilidad_mensual: RentabilidadMensual[];
  utilidad_por_inmueble: UtilidadPorInmueble[];
  ocupacion_por_inmueble: OcupacionPorInmueble[];
  recibos_pendientes_por_inmueble: ReciboPendientePorInmueble[];
  distribucion_ingresos_gastos: DistribucionIngresosGastos[];
  alertas: AlertaDashboardKpis[];
}

export interface DashboardKpisResponse {
  message: string;
  data: DashboardKpisData;
}

export type EstadoReportePagos =
  | 'TODOS'
  | 'PAGADO'
  | 'PENDIENTE'
  | 'VENCIDO'
  | 'DEUDOR';

export interface FiltrosReportePagosDeudores {
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoReportePagos;
  pagina: number;
  limite: number;
}

export interface ResumenPagosDeudores {
  total_registros: number;
  cantidad_pagados: number;
  cantidad_pendientes: number;
  cantidad_vencidos: number;
  cantidad_deudores: number;
  total_pagado: number;
  total_pagado_periodo: number;
  total_deuda: number;
  total_deuda_pendiente: number;
  total_deuda_vencida: number;
  totales_por_moneda: Record<string, {
    total_pagado: number;
    total_pagado_periodo: number;
    total_deuda: number;
    total_deuda_pendiente: number;
    total_deuda_vencida: number;
  }>;
}

export interface RegistroPagoDeudor {
  recibo_id: number;
  reserva_id: number;
  periodo_anio: number;
  periodo_mes: number;

  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_referencia_reporte: string;
  tipo_referencia_reporte: string;

  estado_recibo: string;
  estado_reporte: string;

  total_recibo: number;
  monto_pagado: number;
  monto_pagado_total: number;
  monto_pagado_periodo: number;
  saldo_pendiente: number;
  monto_deuda: number;

  cantidad_pagos: number;
  cantidad_pagos_periodo: number;

  fecha_ultimo_pago: string | null;
  fecha_ultimo_pago_periodo: string | null;

  ultimo_metodo_pago: string | null;
  proveedor_pasarela: string | null;
  referencia_pago: string | null;

  moneda: string;

  inquilino_id: number;
  correo_inquilino: string;
  nombres_inquilino: string | null;
  apellidos_inquilino: string | null;
  telefono_inquilino: string | null;

  inmueble_id: number;
  codigo_inmueble: string;
  nombre_inmueble: string;
  direccion_linea1: string | null;
  distrito: string | null;
  ciudad: string | null;

  dias_vencido: number;
}

export interface InquilinoReportePagos {
  inquilino_id: number;
  nombres_inquilino: string | null;
  apellidos_inquilino: string | null;
  correo_inquilino: string;
  telefono_inquilino: string | null;

  total_recibos: number;
  cantidad_pagados: number;
  cantidad_pendientes: number;
  cantidad_vencidos: number;

  total_pagado: number;
  total_pagado_periodo: number;
  total_deuda: number;
  total_deuda_pendiente: number;
  total_deuda_vencida: number;

  estado_general: string;
}

export interface PaginacionReportePagos {
  pagina_actual: number;
  limite: number;
  total_registros: number;
  total_paginas: number;
  tiene_pagina_anterior: boolean;
  tiene_pagina_siguiente: boolean;
}

export interface ReportePagosDeudoresData {
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoReportePagos;

  resumen: ResumenPagosDeudores;

  total_inquilinos: number;
  inquilinos: InquilinoReportePagos[];

  paginacion: PaginacionReportePagos;
  registros: RegistroPagoDeudor[];
}

export interface ReportePagosDeudoresResponse {
  message: string;
  data: ReportePagosDeudoresData;
}