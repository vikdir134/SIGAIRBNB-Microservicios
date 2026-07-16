import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export type EdificioFormData = {
    codigo: string;
    nombre: string;
    descripcion: string;
    direccion_linea1: string;
    direccion_linea2: string;
    numero: string;
    distrito: string;
    ciudad: string;
    provincia: string;
    departamento: string;
    codigo_postal: string;
    pais: string;
    area_m2: string;
    latitud: string;
    longitud: string;
};

export type EdificioListado = {
    inmueble_id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    direccion_linea1: string;
    direccion_linea2?: string;
    numero?: string;
    distrito?: string;
    ciudad?: string;
    provincia?: string;
    departamento?: string;
    codigo_postal?: string;
    pais?: string;
    area_m2?: number;
    estado_operativo: string;
    activo: boolean;
    created_at: string;
};

export type UnidadFormData = {
    edificio_id: string;
    codigo: string;
    tipo_inmueble: string;
    nombre: string;
    subtipo_unidad: string;
    descripcion: string;
    planta: string;
    letra: string;
    area_m2: string;
    num_habitaciones: string;
    num_banos: string;
    capacidad_personas: string;
    renta_base_mensual: string;
    moneda: string;
};

export type UnidadListado = {
    inmueble_id: number;
    edificio_id: number;
    codigo_edificio: string;
    nombre_edificio: string;

    codigo: string;
    tipo_inmueble: string;
    nombre: string;
    subtipo_unidad?: string;
    descripcion?: string;
    planta: string;
    letra: string;

    area_m2?: number;
    num_habitaciones?: number;
    num_banos?: number;
    capacidad_personas?: number;
    renta_base_mensual?: number;
    moneda: string;

    estado_operativo: string;
    es_publicable: boolean;
    activo: boolean;
    created_at: string;
};

export interface InmuebleMantenimiento {
    inmueble_id: number;
    empresa_id: number;
    edificio_id: number | null;
    codigo_edificio?: string | null;
    nombre_edificio?: string | null;

    codigo: string;
    tipo_inmueble: 'EDIFICIO' | 'PISO' | 'LOCAL';
    nombre: string;
    subtipo_unidad?: string | null;
    descripcion?: string | null;

    direccion_linea1?: string | null;
    direccion_linea2?: string | null;
    numero?: string | null;
    distrito?: string | null;
    ciudad?: string | null;
    provincia?: string | null;
    departamento?: string | null;
    codigo_postal?: string | null;
    pais?: string | null;

    planta?: string | null;
    letra?: string | null;
    area_m2?: number | null;
    num_habitaciones?: number | null;
    num_banos?: number | null;
    capacidad_personas?: number | null;
    renta_base_mensual?: number | null;
    moneda?: string | null;

    latitud?: number | null;
    longitud?: number | null;
    estado_operativo: string;
    es_publicable: boolean;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CaracteristicaCatalogo {
    caracteristica_id: number;
    nombre: string;
    tipo_dato: 'BOOLEAN' | 'TEXTO' | 'NUMERO';
    descripcion?: string | null;
    activo: boolean;
}

export interface CaracteristicaInmueble {
    inmueble_caracteristica_id?: number;
    inmueble_id?: number;
    caracteristica_id: number;
    nombre?: string;
    tipo_dato?: 'BOOLEAN' | 'TEXTO' | 'NUMERO';
    descripcion?: string | null;
    valor_texto?: string | null;
    valor_numero?: number | null;
    valor_boolean?: boolean | null;
}

export interface ActualizarInmuebleData {
    nombre: string;
    descripcion?: string;
    direccion_linea1?: string;
    direccion_linea2?: string;
    numero?: string;
    distrito?: string;
    ciudad?: string;
    provincia?: string;
    departamento?: string;
    codigo_postal?: string;
    pais?: string;
    subtipo_unidad?: string;
    planta?: string;
    letra?: string;
    area_m2?: string | number | null;
    num_habitaciones?: string | number | null;
    num_banos?: string | number | null;
    capacidad_personas?: string | number | null;
    renta_base_mensual?: string | number | null;
    moneda?: string;
    latitud?: string | number | null;
    longitud?: string | number | null;
    estado_operativo: string;
    es_publicable: boolean;
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
    mensajeDefault: string
): Promise<T> => {
    try {
        const response = await peticion;
        return response.data;
    } catch (error) {
        throw new Error(obtenerMensajeError(error, mensajeDefault));
    }
};

export const registrarEdificio = async (formData: EdificioFormData) => {
    return manejarPeticion(
        apiClient.post('/edificios', formData),
        'Error al registrar edificio'
    );
};

export const listarEdificios = async () => {
    return manejarPeticion(
        apiClient.get('/edificios'),
        'Error al listar edificios'
    );
};

export const registrarUnidad = async (formData: UnidadFormData) => {
    return manejarPeticion(
        apiClient.post('/edificios/unidades', formData),
        'Error al registrar piso/local'
    );
};

export const listarUnidadesPorEdificio = async (
    edificioId: number | string
) => {
    return manejarPeticion(
        apiClient.get(`/edificios/${edificioId}/unidades`),
        'Error al listar pisos/locales'
    );
};

export const obtenerUnidadPorId = async (
    unidadId: number | string
) => {
    return manejarPeticion(
        apiClient.get(`/edificios/unidades/${unidadId}`),
        'Error al obtener piso/local'
    );
};

export const listarInmueblesMantenimiento = async () => {
    return manejarPeticion(
        apiClient.get('/edificios/mantenimiento/inmuebles'),
        'Error al listar inmuebles para mantenimiento'
    );
};

export const obtenerInmuebleMantenimientoPorId = async (
    inmuebleId: number | string
) => {
    return manejarPeticion(
        apiClient.get(`/edificios/mantenimiento/inmuebles/${inmuebleId}`),
        'Error al obtener inmueble'
    );
};

export const actualizarInmuebleMantenimiento = async (
    inmuebleId: number | string,
    formData: ActualizarInmuebleData
) => {
    return manejarPeticion(
        apiClient.put(
            `/edificios/mantenimiento/inmuebles/${inmuebleId}`,
            formData
        ),
        'Error al actualizar inmueble'
    );
};

export const darBajaInmueble = async (
    inmuebleId: number | string
) => {
    return manejarPeticion(
        apiClient.patch(
            `/edificios/mantenimiento/inmuebles/${inmuebleId}/baja`
        ),
        'Error al dar de baja inmueble'
    );
};

export const listarCatalogoCaracteristicas = async () => {
    return manejarPeticion(
        apiClient.get('/edificios/mantenimiento/caracteristicas'),
        'Error al listar características'
    );
};

export const obtenerCaracteristicasInmueble = async (
    inmuebleId: number | string
) => {
    return manejarPeticion(
        apiClient.get(
            `/edificios/mantenimiento/inmuebles/${inmuebleId}/caracteristicas`
        ),
        'Error al obtener características del inmueble'
    );
};

export const actualizarCaracteristicasInmueble = async (
    inmuebleId: number | string,
    caracteristicas: CaracteristicaInmueble[]
) => {
    return manejarPeticion(
        apiClient.put(
            `/edificios/mantenimiento/inmuebles/${inmuebleId}/caracteristicas`,
            { caracteristicas }
        ),
        'Error al actualizar características'
    );
};