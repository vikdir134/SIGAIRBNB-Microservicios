import type { AxiosError } from 'axios';
import apiClient from './apiClient';

export interface ReciboPendiente {
    recibo_id: number;
    reserva_id: number;
    periodo_anio: number;
    periodo_mes: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado_recibo: string;
    subtotal: number;
    igv_total: number;
    total: number;
    saldo_pendiente: number;
    pdf_url?: string | null;
    observaciones?: string | null;

    inmueble_id: number;
    empresa_id: number;
    codigo_inmueble: string;
    nombre_inmueble: string;
    direccion_linea1?: string;
    distrito?: string;
    ciudad?: string;

    numero_recibo_base?: string;
    nombres_inquilino?: string;
    apellidos_inquilino?: string;
}

export interface Pago {
    pago_id: number;
    recibo_id: number;
    reserva_id: number;
    metodo_pago: string;
    proveedor_pasarela?: string | null;
    transaccion_externa?: string | null;
    referencia?: string | null;
    monto: number;
    moneda: string;
    estado_pago: string;
    fecha_pago: string;
    fecha_confirmacion?: string | null;
    observaciones?: string | null;

    periodo_anio?: number;
    periodo_mes?: number;
    estado_recibo?: string;

    inmueble_id?: number;
    empresa_id?: number;
    codigo_inmueble?: string;
    nombre_inmueble?: string;
}

export type MetodoPago = 'ONLINE' | 'TARJETA' | 'TRANSFERENCIA';

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface RecibosPendientesResponse {
    mensaje?: string;
    recibos?: ReciboPendiente[];
}

interface DetalleReciboResponse {
    mensaje?: string;
    recibo: ReciboPendiente;
}

interface PagarReciboResponse {
    pago: Pago;
    monto_pagado: number;
    mensaje: string;
}

interface MisPagosResponse {
    mensaje?: string;
    pagos?: Pago[];
}

const obtenerMensajeError = (error: unknown, mensajeDefault: string) => {
    const axiosError = error as AxiosError<ErrorBackend>;

    return (
        axiosError.response?.data?.mensaje ||
        axiosError.response?.data?.error ||
        mensajeDefault
    );
};

export const obtenerMisRecibosPendientes = async (): Promise<ReciboPendiente[]> => {
    try {
        const response = await apiClient.get<RecibosPendientesResponse>(
            '/pagos/mis-recibos-pendientes'
        );

        return response.data.recibos || [];
    } catch (error) {
        throw new Error(
            obtenerMensajeError(error, 'Error al obtener los recibos pendientes.')
        );
    }
};

export const obtenerDetalleReciboParaPago = async (
    recibo_id: number
): Promise<ReciboPendiente> => {
    try {
        const response = await apiClient.get<DetalleReciboResponse>(
            `/pagos/recibos/${recibo_id}`
        );

        return response.data.recibo;
    } catch (error) {
        throw new Error(
            obtenerMensajeError(error, 'Error al obtener el detalle del recibo.')
        );
    }
};

export const pagarReciboOnline = async (
    recibo_id: number,
    metodo_pago: MetodoPago = 'ONLINE'
): Promise<PagarReciboResponse> => {
    try {
        const metodoNormalizado = metodo_pago.toUpperCase() as MetodoPago;

        const response = await apiClient.post<PagarReciboResponse>(
            `/pagos/recibos/${recibo_id}/pagar-online`,
            {
                metodo_pago: metodoNormalizado,
                proveedor_pasarela:
                    metodoNormalizado === 'ONLINE' || metodoNormalizado === 'TARJETA'
                        ? 'SIMULADO'
                        : null,
                referencia: `PAGO-WEB-HU16-${metodoNormalizado}-${recibo_id}-${Date.now()}`
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(
            obtenerMensajeError(error, 'Error al procesar el pago.')
        );
    }
};

export const obtenerMisPagos = async (): Promise<Pago[]> => {
    try {
        const response = await apiClient.get<MisPagosResponse>(
            '/pagos/mis-pagos'
        );

        return response.data.pagos || [];
    } catch (error) {
        throw new Error(
            obtenerMensajeError(error, 'Error al obtener el historial de pagos.')
        );
    }
};