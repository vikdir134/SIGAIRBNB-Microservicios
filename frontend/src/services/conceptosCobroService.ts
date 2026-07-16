import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export interface ConceptoCobro {
    concepto_cobro_id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    tipo_concepto: string;
    categoria: string;
    metodo_calculo: string;
    aplica_en: string;
    aplica_desde_dias: number;
    aplica_igv: boolean;
    monto_default: number;
    orden_impresion: number;
    es_obligatorio: boolean;
    prorrateable: boolean;
    permite_pago_online: boolean;
    es_sistema: boolean;
    editable: boolean;
    activo: boolean;
}

export interface ConceptoCobroForm {
    codigo?: string;
    nombre: string;
    descripcion?: string;
    tipo_concepto: string;
    categoria: string;
    metodo_calculo: string;
    aplica_en: string;
    aplica_desde_dias: number;
    monto_default: number;
    orden_impresion: number;
    es_obligatorio: boolean;
    aplica_igv: boolean;
    prorrateable: boolean;
    permite_pago_online: boolean;
}

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface ListarConceptosCobroResponse {
    mensaje?: string;
    conceptos: ConceptoCobro[];
}

interface ConceptoCobroResponse {
    mensaje?: string;
    concepto: ConceptoCobro;
}

const obtenerMensajeError = (
    error: unknown,
    mensajeDefault: string
): string => {
    const axiosError = error as AxiosError<ErrorBackend>;

    return (
        axiosError.response?.data?.mensaje ||
        axiosError.response?.data?.error ||
        mensajeDefault
    );
};

const manejarPeticion = async <T>(
    peticion: Promise<AxiosResponse<T>>,
    mensajeDefault: string
): Promise<T> => {
    try {
        const response = await peticion;
        return response.data;
    } catch (error) {
        throw new Error(obtenerMensajeError(error, mensajeDefault));
    }
};

export const listarConceptosCobro = async (): Promise<ConceptoCobro[]> => {
    const data = await manejarPeticion<ListarConceptosCobroResponse>(
        apiClient.get('/conceptos-cobro'),
        'Error al listar conceptos de cobro'
    );

    return data.conceptos || [];
};

export const crearConceptoCobro = async (
    form: ConceptoCobroForm
): Promise<ConceptoCobro> => {
    const data = await manejarPeticion<ConceptoCobroResponse>(
        apiClient.post('/conceptos-cobro', form),
        'Error al crear concepto de cobro'
    );

    return data.concepto;
};

export const actualizarConceptoCobro = async (
    conceptoCobroId: number,
    form: ConceptoCobroForm
): Promise<ConceptoCobro> => {
    const data = await manejarPeticion<ConceptoCobroResponse>(
        apiClient.put(`/conceptos-cobro/${conceptoCobroId}`, form),
        'Error al actualizar concepto de cobro'
    );

    return data.concepto;
};

export const cambiarEstadoConceptoCobro = async (
    conceptoCobroId: number,
    activo: boolean
): Promise<ConceptoCobro> => {
    const data = await manejarPeticion<ConceptoCobroResponse>(
        apiClient.patch(`/conceptos-cobro/${conceptoCobroId}/estado`, {
            activo
        }),
        'Error al cambiar estado del concepto'
    );

    return data.concepto;
};