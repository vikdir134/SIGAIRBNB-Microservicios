import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export type PerfilData = {
    usuario_id: number;
    correo: string;
    estado: string;
    email_verificado: boolean;
    perfil_usuario_id: number;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    foto_url: string | null;
    biografia: string | null;
    direccion: string | null;
    distrito: string | null;
    ciudad: string | null;
    pais: string | null;
    recibe_notif_email: boolean;
    recibe_notif_push: boolean;
    recibe_notif_sms: boolean;
    updated_at?: string;
};

export type PerfilFormData = {
    nombres: string;
    apellidos: string;
    telefono: string;
    foto_url: string;
    biografia: string;
    direccion: string;
    distrito: string;
    ciudad: string;
    pais: string;
};

export type NotificacionesData = {
    recibe_notif_email: boolean;
    recibe_notif_push: boolean;
    recibe_notif_sms: boolean;
};

interface ErrorBackend {
    mensaje?: string;
    error?: string;
}

interface PerfilResponse {
    mensaje?: string;
    perfil: PerfilData;
}

const validarSesion = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No hay token de autenticación');
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

export const obtenerPerfil = async (): Promise<PerfilData> => {
    validarSesion();

    const data = await manejarPeticion<PerfilResponse>(
        apiClient.get('/perfil'),
        'No se pudo obtener el perfil'
    );

    return data.perfil;
};

export const actualizarPerfil = async (
    perfil: PerfilFormData
): Promise<PerfilData> => {
    validarSesion();

    const data = await manejarPeticion<PerfilResponse>(
        apiClient.put('/perfil', perfil),
        'No se pudo actualizar el perfil'
    );

    return data.perfil;
};

export const actualizarNotificaciones = async (
    notificaciones: NotificacionesData
): Promise<PerfilData> => {
    validarSesion();

    const data = await manejarPeticion<PerfilResponse>(
        apiClient.put('/perfil/notificaciones', notificaciones),
        'No se pudieron actualizar las notificaciones'
    );

    return data.perfil;
};