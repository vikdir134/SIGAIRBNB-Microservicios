import type { AxiosError } from 'axios';
import apiClient from './apiClient';

export interface ReciboReserva {
    recibo_id: number;
    cuenta_cobro_inmueble_id: number;
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
    created_at?: string;
    numero_recibo_base?: string;
    moneda?: string;
    codigo_inmueble?: string;
    nombre_inmueble?: string;
    tipo_inmueble?: string;
    serie_empresa?: string;
    correlativo_empresa?: number;
}

export interface ReciboDetalle {
    recibo_detalle_id: number;
    recibo_id: number;
    concepto_cobro_id: number;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
    orden_impresion: number;
    codigo_concepto: string;
    nombre_concepto: string;
    aplica_igv: boolean;
}

export interface ConceptoPreviewRecibo {
    concepto_cobro_id: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
    aplica_igv: boolean;
    orden_impresion: number;
    igv: number;
    total_linea: number;
    obligatorio: boolean;
    editable: boolean;
}

export interface ConceptoEditadoRecibo {
    concepto_cobro_id: number;
    cantidad: number;
    precio_unitario: number;
}

export interface VistaPreviaRecibo {
    reserva: unknown;
    conceptos: ConceptoPreviewRecibo[];
    subtotal: number;
    igv_total: number;
    total: number;
    dias_reserva: number;
    fecha_vencimiento: string;
}

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface PreviewReciboResponse extends VistaPreviaRecibo {
    mensaje: string;
}

interface GenerarReciboResponse {
    mensaje: string;
    recibo: ReciboReserva;
    detalles: ReciboDetalle[];
    notificacion?: unknown;
    advertencia_notificacion?: string | null;
}

interface ListarRecibosReservaResponse {
    mensaje: string;
    recibos: ReciboReserva[];
}

interface ObtenerDetalleReciboResponse {
    mensaje: string;
    recibo: ReciboReserva;
    detalles: ReciboDetalle[];
}

const obtenerMensajeError = async (
    error: unknown,
    mensajeDefault: string
): Promise<string> => {
    const axiosError = error as AxiosError<ErrorBackend | Blob>;
    const data = axiosError.response?.data;

    if (data instanceof Blob) {
        try {
            const texto = await data.text();
            const json = JSON.parse(texto) as ErrorBackend;

            return json.mensaje || json.error || mensajeDefault;
        } catch {
            return mensajeDefault;
        }
    }

    if (data && typeof data === 'object') {
        return (
            (data as ErrorBackend).mensaje ||
            (data as ErrorBackend).error ||
            mensajeDefault
        );
    }

    return mensajeDefault;
};

export const previsualizarReciboReservaGestion = async (
    reservaId: number
): Promise<PreviewReciboResponse> => {
    try {
        const response = await apiClient.get<PreviewReciboResponse>(
            `/recibos/reservas/${reservaId}/preview`
        );

        return response.data;
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'Ocurrió un error al procesar la solicitud'
            )
        );
    }
};

export const verReciboPdf = async (
    reciboId: number
): Promise<void> => {
    try {
        const response = await apiClient.get<Blob>(
            `/recibos/${reciboId}/pdf?modo=ver`,
            {
                responseType: 'blob'
            }
        );

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);

        window.open(url, '_blank', 'noopener,noreferrer');

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'No se pudo abrir la boleta digital'
            )
        );
    }
};

export const generarReciboReservaGestion = async (
    reservaId: number,
    observaciones?: string,
    conceptosEditados: ConceptoEditadoRecibo[] = []
): Promise<GenerarReciboResponse> => {
    try {
        const response = await apiClient.post<GenerarReciboResponse>(
            `/recibos/reservas/${reservaId}/generar`,
            {
                observaciones:
                    observaciones ||
                    'Boleta digital emitida desde la gestión de reservas.',
                conceptos_editados: conceptosEditados
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'Ocurrió un error al procesar la solicitud'
            )
        );
    }
};
export const listarRecibosReserva = async (
    reservaId: number
): Promise<ListarRecibosReservaResponse> => {
    try {
        const response = await apiClient.get<ListarRecibosReservaResponse>(
            `/recibos/reservas/${reservaId}`
        );

        return response.data;
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'Ocurrió un error al procesar la solicitud'
            )
        );
    }
};

export const obtenerDetalleRecibo = async (
    reciboId: number
): Promise<ObtenerDetalleReciboResponse> => {
    try {
        const response = await apiClient.get<ObtenerDetalleReciboResponse>(
            `/recibos/${reciboId}`
        );

        return response.data;
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'Ocurrió un error al procesar la solicitud'
            )
        );
    }
};

export const descargarReciboPdf = async (
    reciboId: number
): Promise<void> => {
    try {
        const response = await apiClient.get<Blob>(
            `/recibos/${reciboId}/pdf`,
            {
                responseType: 'blob'
            }
        );

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `boleta-digital-${String(
            reciboId
        ).padStart(6, '0')}.pdf`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error(
            await obtenerMensajeError(
                error,
                'No se pudo descargar la boleta digital'
            )
        );
    }
};

export const obtenerNumeroVisualRecibo = (
    recibo: Pick<
        ReciboReserva,
        'recibo_id' | 'serie_empresa' | 'correlativo_empresa'
    >
): string => {
    if (
        recibo.serie_empresa &&
        recibo.correlativo_empresa
    ) {
        return `${recibo.serie_empresa}-${String(
            recibo.correlativo_empresa
        ).padStart(6, '0')}`;
    }

    return `B-${String(recibo.recibo_id).padStart(6, '0')}`;
};