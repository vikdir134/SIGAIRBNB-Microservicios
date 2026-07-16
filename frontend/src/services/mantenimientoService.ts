import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export interface CategoriaGasto {
    categoria_movimiento_id: number;
    nombre: string;
    naturaleza: string;
    descripcion: string | null;
    activo: boolean;
}

export interface CuentaMantenimiento {
    cuenta_bancaria_id: number;
    empresa_id: number;
    nombre_cuenta: string;
    numero_cuenta: string;
    moneda: string;
    tipo_cuenta: string;
    saldo_actual: number;
    banco: string;
    codigo_banco: string;
}

export interface InmuebleGasto {
    inmueble_id: number;
    codigo: string;
    nombre: string;
    tipo_inmueble: string;
    direccion_linea1: string;
    distrito: string | null;
    ciudad: string | null;
    estado_operativo: string;
}

export interface GastoMantenimiento {
    movimiento_bancario_id: number;
    fecha_movimiento: string;
    concepto: string;
    descripcion: string | null;
    importe: number;
    referencia_externa: string | null;
    observaciones: string | null;
    saldo_anterior: number;
    saldo_posterior: number;

    categoria_movimiento_id?: number;
    categoria?: string;

    cuenta_bancaria_id?: number;
    nombre_cuenta?: string;
    numero_cuenta?: string;
    moneda?: string;

    inmueble_id?: number | null;
    codigo_inmueble?: string | null;
    inmueble?: string | null;
    tipo_inmueble?: string | null;
}

export interface FormularioGastoResponse {
    mensaje: string;
    categorias: CategoriaGasto[];
    cuentas: CuentaMantenimiento[];
    inmuebles: InmuebleGasto[];
}

export interface ListarGastosResponse {
    mensaje: string;
    gastos: GastoMantenimiento[];
}

export interface RegistrarGastoForm {
    cuenta_bancaria_id: number;
    categoria_movimiento_id: number;
    inmueble_id?: number | null;
    fecha_movimiento: string;
    concepto: string;
    descripcion?: string;
    importe: number;
    referencia_externa?: string;
    observaciones?: string;
}

export interface RegistrarGastoResponse {
    mensaje: string;
    gasto: GastoMantenimiento;
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

export const obtenerDatosFormularioGasto =
    async (): Promise<FormularioGastoResponse> => {
        return manejarPeticion<FormularioGastoResponse>(
            apiClient.get('/mantenimiento/formulario'),
            'Error al obtener los datos del formulario de gasto.'
        );
    };

export const listarGastosMantenimiento =
    async (): Promise<ListarGastosResponse> => {
        return manejarPeticion<ListarGastosResponse>(
            apiClient.get('/mantenimiento/gastos'),
            'Error al listar los gastos de mantenimiento.'
        );
    };

export const registrarGastoMantenimiento = async (
    form: RegistrarGastoForm
): Promise<RegistrarGastoResponse> => {
    return manejarPeticion<RegistrarGastoResponse>(
        apiClient.post('/mantenimiento/gastos', form),
        'Error al registrar el gasto de mantenimiento.'
    );
};