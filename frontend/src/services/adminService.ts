import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export type UsuarioAdmin = {
    usuario_id: number;
    empresa_id: number;
    correo: string;
    estado: string;
    email_verificado: boolean;
    activo: boolean;
    created_at: string;
    ultimo_acceso?: string | null;

    nombres?: string | null;
    apellidos?: string | null;
    telefono?: string | null;
    tipo_documento?: string | null;
    numero_documento?: string | null;

    roles?: string | null;
};

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface ListarUsuariosAdminResponse {
    mensaje?: string;
    usuarios: UsuarioAdmin[];
}

interface UsuarioAdminResponse {
    mensaje: string;
    usuario?: UsuarioAdmin;
}

const validarSesion = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No hay sesión activa. Inicia sesión nuevamente.');
    }
};

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

export const listarUsuariosAdmin = async (): Promise<ListarUsuariosAdminResponse> => {
    validarSesion();

    return manejarPeticion<ListarUsuariosAdminResponse>(
        apiClient.get('/admin/usuarios'),
        'Error al listar usuarios'
    );
};

export const inactivarUsuarioAdmin = async (
    usuarioId: number | string
): Promise<UsuarioAdminResponse> => {
    validarSesion();

    return manejarPeticion<UsuarioAdminResponse>(
        apiClient.patch(`/admin/usuarios/${usuarioId}/inactivar`),
        'Error al inactivar usuario'
    );
};

export const reactivarUsuarioAdmin = async (
    usuarioId: number | string
): Promise<UsuarioAdminResponse> => {
    validarSesion();

    return manejarPeticion<UsuarioAdminResponse>(
        apiClient.patch(`/admin/usuarios/${usuarioId}/reactivar`),
        'Error al reactivar usuario'
    );
};