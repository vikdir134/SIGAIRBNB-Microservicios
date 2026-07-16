import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

/* ================================
   HU07 - TIPOS PARA BÚSQUEDA PÚBLICA
================================ */

export interface PublicacionListado {
    publicacion_id: number;
    inmueble_id: number;
    titulo: string;
    descripcion_corta: string | null;
    precio_publicado_mensual: number;
    moneda: string;
    disponible_desde: string | null;
    es_destacado: boolean;
    acepta_reservas: boolean;
    fecha_publicacion: string | null;

    codigo_inmueble: string;
    tipo_inmueble: 'EDIFICIO' | 'PISO' | 'LOCAL';
    nombre_inmueble: string;
    subtipo_unidad: string | null;

    direccion_linea1: string;
    numero: string | null;
    distrito: string | null;
    ciudad: string | null;
    provincia: string | null;
    departamento: string | null;

    area_m2: number | null;
    num_habitaciones: number | null;
    num_banos: number | null;
    capacidad_personas: number | null;
    estado_operativo: string;

    foto_principal: string | null;
}

export interface FotoPublicacion {
    inmueble_foto_id: number;
    publicacion_id: number;
    url_foto: string;
    nombre_archivo: string | null;
    orden_visual: number;
    es_principal: boolean;
    created_at: string;
}

export interface PublicacionDetalle extends PublicacionListado {
    descripcion_larga: string | null;
    condiciones_arrendamiento: string | null;
    estado_publicacion: string;

    descripcion_inmueble: string | null;
    direccion_linea2: string | null;
    codigo_postal: string | null;
    pais: string;
    planta: string | null;
    letra: string | null;
    renta_base_mensual: number | null;
    moneda_inmueble: string;
    es_publicable: boolean;
    activo: boolean;
}

export interface FiltrosPublicacion {
    ubicacion?: string;
    tipo_inmueble?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    precio_min?: string;
    precio_max?: string;
    capacidad_personas?: string;
}

/* ================================
   HU08 - TIPOS PARA GESTIÓN
================================ */

export interface InmueblePublicable {
    inmueble_id: number;
    empresa_id?: number;
    edificio_id?: number | null;

    codigo_edificio?: string | null;
    nombre_edificio?: string | null;

    codigo: string;
    tipo_inmueble: 'EDIFICIO' | 'PISO' | 'LOCAL';
    nombre: string;
    subtipo_unidad?: string | null;
    descripcion?: string | null;

    direccion_linea1?: string | null;
    numero?: string | null;
    distrito: string | null;
    ciudad: string | null;
    provincia?: string | null;
    departamento?: string | null;

    area_m2?: number | null;
    num_habitaciones?: number | null;
    num_banos?: number | null;
    capacidad_personas?: number | null;
    renta_base_mensual?: number | null;
    moneda?: string | null;

    estado_operativo: string;
    es_publicable?: boolean;
    activo?: boolean;

    publicacion_id: number | null;
    titulo_publicacion: string | null;
    estado_publicacion: string | null;
    precio_publicado_mensual: number | null;
    acepta_reservas?: boolean | null;
    fecha_publicacion?: string | null;

    puede_crear_publicacion: boolean;
}

export interface PublicacionFormData {
    inmueble_id: number;
    titulo: string;
    descripcion_corta: string;
    descripcion_larga: string;
    precio_publicado_mensual: string;
    moneda: 'PEN' | 'USD';
    condiciones_arrendamiento: string;
    disponible_desde: string;
    acepta_reservas: boolean;
    es_destacado: boolean;
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

const limpiarFiltros = (filtros: FiltrosPublicacion) => {
    const params: Record<string, string> = {};

    Object.entries(filtros).forEach(([clave, valor]) => {
        if (
            valor !== undefined &&
            valor !== null &&
            String(valor).trim() !== ''
        ) {
            params[clave] = String(valor).trim();
        }
    });

    return params;
};

/* ================================
   HU07 - BÚSQUEDA PÚBLICA
================================ */

export const listarPublicaciones = async (
    filtros: FiltrosPublicacion = {}
) => {
    return manejarPeticion(
        apiClient.get('/publicaciones', {
            params: limpiarFiltros(filtros)
        }),
        'Error al listar publicaciones'
    );
};

export const obtenerDetallePublicacion = async (
    publicacionId: number
) => {
    return manejarPeticion(
        apiClient.get(`/publicaciones/${publicacionId}`),
        'Error al obtener detalle de publicación'
    );
};

/* ================================
   HU08 - GESTIÓN DE PUBLICACIÓN
================================ */

export const listarInmueblesPublicables = async () => {
    return manejarPeticion(
        apiClient.get('/publicaciones/gestion/inmuebles-publicables'),
        'Error al listar inmuebles publicables'
    );
};

export const crearPublicacionGestion = async (
    formData: PublicacionFormData
) => {
    return manejarPeticion(
        apiClient.post('/publicaciones/gestion', {
            ...formData,
            inmueble_id: Number(formData.inmueble_id),
            precio_publicado_mensual: Number(
                formData.precio_publicado_mensual
            )
        }),
        'Error al crear publicación'
    );
};

export const subirFotoPublicacion = async (
    publicacionId: number,
    foto: File,
    esPrincipal: boolean = true,
    ordenVisual: number = 1
) => {
    const formData = new FormData();

    formData.append('foto', foto);
    formData.append('es_principal', String(esPrincipal));
    formData.append('orden_visual', String(ordenVisual));

    return manejarPeticion(
        apiClient.post(
            `/publicaciones/gestion/${publicacionId}/fotos`,
            formData
        ),
        'Error al subir foto de publicación'
    );
};

export const publicarPublicacionGestion = async (
    publicacionId: number
) => {
    return manejarPeticion(
        apiClient.patch(
            `/publicaciones/gestion/${publicacionId}/publicar`
        ),
        'Error al publicar publicación'
    );
};

export const eliminarBorradorPublicacionGestion = async (
    publicacionId: number
) => {
    return manejarPeticion(
        apiClient.delete(
            `/publicaciones/gestion/${publicacionId}/borrador`
        ),
        'Error al eliminar borrador de publicación'
    );
};

export const eliminarPublicacionGestion = async (
    publicacionId: number
) => {
    return manejarPeticion(
        apiClient.delete(
            `/publicaciones/gestion/${publicacionId}`
        ),
        'Error al eliminar publicación'
    );
};