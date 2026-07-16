export interface IPC {
  indice_ipc_id: number;
  anio: number;
  porcentaje_anual: number;
  fecha_publicacion: string | null;
  activo: boolean;
  created_at: string;
}

export interface InmuebleTarifa {
  inmueble_id: number;
  empresa_id?: number;
  codigo?: string | null;
  tipo_inmueble?: string | null;
  nombre?: string | null;
  direccion_linea1?: string | null;
  distrito?: string | null;
  ciudad?: string | null;
  renta_base_mensual: number;
  moneda?: string | null;
  estado_operativo?: string | null;
  activo?: boolean;
  publicacion_id?: number | null;
  titulo_publicacion?: string | null;
  precio_publicado_mensual?: number | null;
  estado_publicacion?: string | null;
}

export interface RegistrarIPCData {
  anio: number;
  porcentaje_anual: number;
  fecha_publicacion?: string | null;
}

export interface PrevisualizarIPCData {
  anio: number;
  inmueble_ids: number[];
}

export interface AplicarIPCData {
  anio: number;
  inmueble_ids: number[];
  aplicar_a_publicacion: boolean;
  motivo?: string;
}

export interface PreviewTarifa {
  inmueble_id: number;
  codigo?: string | null;
  nombre?: string | null;
  tipo_inmueble?: string | null;
  direccion_linea1?: string | null;
  distrito?: string | null;
  ciudad?: string | null;
  moneda?: string | null;
  anio_ipc: number;
  indice_ipc_id: number;
  porcentaje_ipc: number;
  renta_actual: number;
  monto_incremento: number;
  nueva_renta: number;
  ya_aplicado: boolean;
}

export interface HistorialTarifa {
  tarifa_inmueble_id: number;
  inmueble_id: number;
  indice_ipc_id: number | null;
  anio: number | null;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  renta_base_mensual: number;
  porcentaje_ipc_aplicado: number;
  monto_incremento: number;
  motivo: string | null;
  aplicado_por_usuario_id?: number | null;
  aplicado_por_nombres?: string | null;
  aplicado_por_apellidos?: string | null;
  created_at: string;
}

export interface IPCResponse {
  mensaje: string;
  ipc: IPC[];
}

export interface IPCRegistroResponse {
  mensaje: string;
  ipc: IPC;
}

export interface InmueblesTarifaResponse {
  mensaje: string;
  inmuebles: InmuebleTarifa[];
}

export interface PrevisualizarIPCResponse {
  mensaje: string;
  advertencia: string;
  ipc: IPC;
  previsualizacion: PreviewTarifa[];
}

export interface AplicarIPCResponse {
  mensaje: string;
  advertencia: string;
  resumen: {
    total_actualizados: number;
    actualizados: PreviewTarifa[];
  };
}

export interface HistorialTarifasResponse {
  mensaje: string;
  inmueble: InmuebleTarifa;
  historial: HistorialTarifa[];
}