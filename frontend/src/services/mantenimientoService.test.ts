import { describe, test, expect, vi, beforeEach } from 'vitest';

import apiClient from './apiClient';

import {
    obtenerDatosFormularioGasto,
    listarGastosMantenimiento,
    registrarGastoMantenimiento,
    type CategoriaGasto,
    type CuentaMantenimiento,
    type InmuebleGasto,
    type GastoMantenimiento,
    type RegistrarGastoForm
} from './mantenimientoService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

const apiClientMock = vi.mocked(apiClient);

const crearCategoriaMock = (): CategoriaGasto => ({
    categoria_movimiento_id: 5,
    nombre: 'Mantenimiento',
    naturaleza: 'GASTO',
    descripcion: 'Gastos asociados a reparaciones',
    activo: true
});

const crearCuentaMock = (): CuentaMantenimiento => ({
    cuenta_bancaria_id: 3,
    empresa_id: 6,
    nombre_cuenta: 'Caja Principal de Mantenimiento',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    tipo_cuenta: 'CORRIENTE',
    saldo_actual: 1000,
    banco: 'Caja Interna',
    codigo_banco: 'CAJA_INTERNA'
});

const crearInmuebleMock = (): InmuebleGasto => ({
    inmueble_id: 10,
    codigo: 'DEP-101',
    nombre: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    estado_operativo: 'DISPONIBLE'
});

const crearGastoMock = (): GastoMantenimiento => ({
    movimiento_bancario_id: 20,
    fecha_movimiento: '2026-07-15T00:00:00.000Z',
    concepto: 'Reparación de tubería',
    descripcion: 'Servicio técnico por reparación de fuga',
    importe: 250,
    referencia_externa: 'FAC-001',
    observaciones: 'Trabajo realizado correctamente',
    saldo_anterior: 1000,
    saldo_posterior: 750,
    categoria_movimiento_id: 5,
    categoria: 'Mantenimiento',
    cuenta_bancaria_id: 3,
    nombre_cuenta: 'Caja Principal de Mantenimiento',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    inmueble_id: 10,
    codigo_inmueble: 'DEP-101',
    inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL'
});

const crearFormGastoMock = (): RegistrarGastoForm => ({
    cuenta_bancaria_id: 3,
    categoria_movimiento_id: 5,
    inmueble_id: 10,
    fecha_movimiento: '2026-07-15T10:00',
    concepto: 'Reparación de tubería',
    descripcion: 'Servicio técnico por reparación de fuga',
    importe: 250,
    referencia_externa: 'FAC-001',
    observaciones: 'Trabajo realizado correctamente'
});

describe('HU18 - mantenimientoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU18-FE-SRV-01 obtiene datos del formulario de gasto correctamente', async () => {
        const categoriasMock = [crearCategoriaMock()];
        const cuentasMock = [crearCuentaMock()];
        const inmueblesMock = [crearInmuebleMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Datos para el formulario de gasto obtenidos correctamente.',
                categorias: categoriasMock,
                cuentas: cuentasMock,
                inmuebles: inmueblesMock
            }
        });

        const resultado = await obtenerDatosFormularioGasto();

        expect(apiClientMock.get).toHaveBeenCalledWith('/mantenimiento/formulario');

        expect(resultado).toEqual({
            mensaje: 'Datos para el formulario de gasto obtenidos correctamente.',
            categorias: categoriasMock,
            cuentas: cuentasMock,
            inmuebles: inmueblesMock
        });
    });

    test('CP-HU18-FE-SRV-02 lista gastos de mantenimiento correctamente', async () => {
        const gastosMock = [crearGastoMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Gastos de mantenimiento obtenidos correctamente.',
                gastos: gastosMock
            }
        });

        const resultado = await listarGastosMantenimiento();

        expect(apiClientMock.get).toHaveBeenCalledWith('/mantenimiento/gastos');

        expect(resultado).toEqual({
            mensaje: 'Gastos de mantenimiento obtenidos correctamente.',
            gastos: gastosMock
        });
    });

    test('CP-HU18-FE-SRV-03 registra gasto de mantenimiento correctamente', async () => {
        const formMock = crearFormGastoMock();
        const gastoMock = crearGastoMock();

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'Gasto de mantenimiento registrado correctamente.',
                gasto: gastoMock
            }
        });

        const resultado = await registrarGastoMantenimiento(formMock);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/mantenimiento/gastos',
            formMock
        );

        expect(resultado).toEqual({
            mensaje: 'Gasto de mantenimiento registrado correctamente.',
            gasto: gastoMock
        });
    });

    test('CP-HU18-FE-SRV-04 registra gasto sin inmueble asociado', async () => {
        const formMock: RegistrarGastoForm = {
            ...crearFormGastoMock(),
            inmueble_id: null,
            concepto: 'Compra de materiales',
            importe: 180
        };

        const gastoMock: GastoMantenimiento = {
            ...crearGastoMock(),
            movimiento_bancario_id: 21,
            inmueble_id: null,
            inmueble: null,
            codigo_inmueble: null,
            concepto: 'Compra de materiales',
            importe: 180
        };

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'Gasto de mantenimiento registrado correctamente.',
                gasto: gastoMock
            }
        });

        const resultado = await registrarGastoMantenimiento(formMock);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/mantenimiento/gastos',
            formMock
        );

        expect(resultado.gasto.inmueble_id).toBeNull();
        expect(resultado.gasto.concepto).toBe('Compra de materiales');
    });

    test('CP-HU18-FE-SRV-05 captura error del backend al obtener formulario', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Error interno al obtener los datos del formulario.'
                }
            }
        });

        await expect(obtenerDatosFormularioGasto()).rejects.toThrow(
            'Error interno al obtener los datos del formulario.'
        );
    });

    test('CP-HU18-FE-SRV-06 captura error del backend al listar gastos', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Error interno al listar los gastos de mantenimiento.'
                }
            }
        });

        await expect(listarGastosMantenimiento()).rejects.toThrow(
            'Error interno al listar los gastos de mantenimiento.'
        );
    });

    test('CP-HU18-FE-SRV-07 captura error del backend al registrar gasto', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'El importe debe ser mayor a cero.'
                }
            }
        });

        await expect(
            registrarGastoMantenimiento({
                ...crearFormGastoMock(),
                importe: 0
            })
        ).rejects.toThrow('El importe debe ser mayor a cero.');
    });

    test('CP-HU18-FE-SRV-08 usa campo error si backend no envía mensaje', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    error: 'La cuenta bancaria no es válida para esta empresa.'
                }
            }
        });

        await expect(
            registrarGastoMantenimiento(crearFormGastoMock())
        ).rejects.toThrow('La cuenta bancaria no es válida para esta empresa.');
    });

    test('CP-HU18-FE-SRV-09 usa mensaje por defecto si backend no responde mensaje', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(obtenerDatosFormularioGasto()).rejects.toThrow(
            'Error al obtener los datos del formulario de gasto.'
        );
    });
});