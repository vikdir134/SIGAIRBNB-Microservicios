import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export interface InmuebleDisponibilidad {
    inmueble_id: number;
    empresa_id: number;
    edificio_id: number | null;
    codigo_edificio: string | null;
    nombre_edificio: string | null;
    codigo: string;
    tipo_inmueble: 'EDIFICIO' | 'PISO' | 'LOCAL';
    nombre: string;
    subtipo_unidad: string | null;
    direccion_linea1: string;
    numero: string | null;
    distrito: string | null;
    ciudad: string | null;
    provincia: string | null;
    departamento: string | null;
    planta: string | null;
    letra: string | null;
    estado_operativo: string;
    es_publicable: boolean;
    activo: boolean;
    created_at: string;
}

export interface BloqueoDisponibilidad {
    bloqueo_disponibilidad_id: number;
    bloqueo_padre_id: number | null;
    inmueble_id: number;
    codigo_inmueble?: string;
    nombre_inmueble?: string;
    tipo_inmueble?: string;
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string | null;
    origen: 'MANUAL' | 'MANTENIMIENTO' | 'OTRO';
    activo: boolean;
    created_at: string;
}

export interface BloqueoFormData {
    inmueble_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string;
    origen: 'MANUAL' | 'MANTENIMIENTO' | 'OTRO';
}

export interface EditarBloqueoFormData {
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string;
    origen: 'MANUAL' | 'MANTENIMIENTO' | 'OTRO';
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
    mensajeDefault = 'Ocurrió un error en la solicitud'
): Promise<T> => {
    try {
        const response = await peticion;
        return response.data;
    } catch (error) {
        throw new Error(obtenerMensajeError(error, mensajeDefault));
    }
};

export const listarInmueblesDisponibilidad = async () => {
    return manejarPeticion(
        apiClient.get('/disponibilidad/inmuebles'),
        'Error al listar inmuebles para disponibilidad'
    );
};

export const listarBloqueosPorInmueble = async (
    inmuebleId: number
) => {
    return manejarPeticion(
        apiClient.get(`/disponibilidad/inmuebles/${inmuebleId}/bloqueos`),
        'Error al listar bloqueos del inmueble'
    );
};

export const obtenerCalendarioDisponibilidad = async (
    inmuebleId: number,
    fechaInicio: string,
    fechaFin: string
) => {
    return manejarPeticion(
        apiClient.get(
            `/disponibilidad/inmuebles/${inmuebleId}/calendario`,
            {
                params: {
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin
                }
            }
        ),
        'Error al obtener calendario de disponibilidad'
    );
};

export const crearBloqueoDisponibilidad = async (
    formData: BloqueoFormData
) => {
    return manejarPeticion(
        apiClient.post('/disponibilidad/bloqueos', formData),
        'Error al crear bloqueo de disponibilidad'
    );
};

export const editarBloqueoDisponibilidad = async (
    bloqueoId: number,
    formData: EditarBloqueoFormData
) => {
    return manejarPeticion(
        apiClient.put(`/disponibilidad/bloqueos/${bloqueoId}`, formData),
        'Error al editar bloqueo de disponibilidad'
    );
};

export const eliminarBloqueoDisponibilidad = async (
    bloqueoId: number
) => {
    return manejarPeticion(
        apiClient.delete(`/disponibilidad/bloqueos/${bloqueoId}`),
        'Error al eliminar bloqueo de disponibilidad'
    );
};