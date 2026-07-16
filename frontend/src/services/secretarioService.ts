import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export interface SecretarioAsignado {
    empresa_secretario_id: number;
    empresa_id: number;
    secretario_usuario_id: number;
    asignado_por_usuario_id: number;
    activo: boolean;
    fecha_asignacion: string;
    fecha_revocacion: string | null;
    updated_at: string;
    correo_secretario: string;
    nombres: string | null;
    apellidos: string | null;
    correo_asignador?: string;
    razon_social?: string;
    nombre_comercial?: string;
}

interface EliminarSecretarioResponse {
    mensaje: string;
    asignacion: SecretarioAsignado;
}

interface ListaSecretariosResponse {
    mensaje: string;
    cantidad: number;
    secretarios: SecretarioAsignado[];
}

interface AsignarSecretarioResponse {
    mensaje: string;
    asignacion: SecretarioAsignado;
}

interface RevocarSecretarioResponse {
    mensaje: string;
    asignacion: SecretarioAsignado;
    rol_secretario_removido: boolean;
}

interface ReactivarSecretarioResponse {
    mensaje: string;
    asignacion: SecretarioAsignado;
}

interface ErrorBackend {
    mensaje?: string;
    error?: string;
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
    mensajeDefault = 'Ocurrió un error al procesar la solicitud'
): Promise<T> => {
    try {
        const response = await peticion;
        return response.data;
    } catch (error) {
        throw new Error(obtenerMensajeError(error, mensajeDefault));
    }
};

export const obtenerSecretariosEmpresa =
    async (): Promise<ListaSecretariosResponse> => {
        return manejarPeticion<ListaSecretariosResponse>(
            apiClient.get('/secretarios/asignaciones'),
            'Error al obtener los secretarios asignados.'
        );
    };

export const asignarSecretarioEmpresa = async (
    correo: string
): Promise<AsignarSecretarioResponse> => {
    return manejarPeticion<AsignarSecretarioResponse>(
        apiClient.post('/secretarios/asignaciones', {
            correo: correo.trim().toLowerCase()
        }),
        'Error al asignar secretario.'
    );
};

export const revocarSecretarioEmpresa = async (
    empresaSecretarioId: number
): Promise<RevocarSecretarioResponse> => {
    return manejarPeticion<RevocarSecretarioResponse>(
        apiClient.patch(
            `/secretarios/asignaciones/${empresaSecretarioId}/revocar`
        ),
        'Error al revocar secretario.'
    );
};

export const eliminarSecretarioRevocado = async (
    empresaSecretarioId: number
): Promise<EliminarSecretarioResponse> => {
    return manejarPeticion<EliminarSecretarioResponse>(
        apiClient.delete(
            `/secretarios/asignaciones/${empresaSecretarioId}`
        ),
        'Error al eliminar secretario revocado.'
    );
};

export const reactivarSecretarioEmpresa = async (
    empresaSecretarioId: number
): Promise<ReactivarSecretarioResponse> => {
    return manejarPeticion<ReactivarSecretarioResponse>(
        apiClient.patch(
            `/secretarios/asignaciones/${empresaSecretarioId}/reactivar`
        ),
        'Error al reactivar secretario.'
    );
};