import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

import type {
  AplicarIPCData,
  AplicarIPCResponse,
  HistorialTarifasResponse,
  InmueblesTarifaResponse,
  IPCRegistroResponse,
  IPCResponse,
  PrevisualizarIPCData,
  PrevisualizarIPCResponse,
  RegistrarIPCData
} from '../types/tarifa.types';

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
  mensajeDefault = 'Ocurrió un error en la solicitud.'
): Promise<T> => {
  try {
    const response = await peticion;
    return response.data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error, mensajeDefault));
  }
};

export const registrarIPC = async (
  data: RegistrarIPCData
): Promise<IPCRegistroResponse> => {
  return manejarPeticion<IPCRegistroResponse>(
    apiClient.post('/tarifas/ipc', data),
    'Error al registrar el IPC.'
  );
};

export const listarIPC = async (): Promise<IPCResponse> => {
  return manejarPeticion<IPCResponse>(
    apiClient.get('/tarifas/ipc'),
    'Error al listar los registros IPC.'
  );
};

export const listarInmueblesConRenta = async (): Promise<InmueblesTarifaResponse> => {
  return manejarPeticion<InmueblesTarifaResponse>(
    apiClient.get('/tarifas/inmuebles'),
    'Error al listar los inmuebles con renta.'
  );
};

export const previsualizarAplicacionIPC = async (
  data: PrevisualizarIPCData
): Promise<PrevisualizarIPCResponse> => {
  return manejarPeticion<PrevisualizarIPCResponse>(
    apiClient.post('/tarifas/previsualizar-ipc', data),
    'Error al previsualizar la aplicación del IPC.'
  );
};

export const aplicarIPC = async (
  data: AplicarIPCData
): Promise<AplicarIPCResponse> => {
  return manejarPeticion<AplicarIPCResponse>(
    apiClient.post('/tarifas/aplicar-ipc', data),
    'Error al aplicar el IPC.'
  );
};

export const listarHistorialTarifas = async (
  inmuebleId: number
): Promise<HistorialTarifasResponse> => {
  return manejarPeticion<HistorialTarifasResponse>(
    apiClient.get(`/tarifas/inmueble/${inmuebleId}/historial`),
    'Error al listar el historial de tarifas.'
  );
};