import { describe, test, expect, vi, beforeEach } from 'vitest';

import apiClient from './apiClient';

import {
    obtenerDatosFormularioIngreso,
    listarRecibosPendientesIngreso,
    listarIngresosAlquiler,
    registrarIngresoAlquiler,
    type CategoriaIngreso,
    type CuentaIngreso,
    type ReciboPendienteIngreso,
    type IngresoAlquiler,
    type RegistrarIngresoPayload
} from './ingresoAlquilerService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

const apiClientMock = vi.mocked(apiClient);

const crearCategoriaMock = (): CategoriaIngreso => ({
    categoria_movimiento_id: 8,
    nombre: 'Alquiler',
    naturaleza: 'INGRESO',
    descripcion: 'Ingresos por renta de inmuebles',
    activo: true
});

const crearCuentaMock = (): CuentaIngreso => ({
    cuenta_bancaria_id: 3,
    empresa_id: 6,
    nombre_cuenta: 'Caja Principal',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    tipo_cuenta: 'CORRIENTE',
    saldo_actual: 1500,
    banco: 'Caja Interna',
    codigo_banco: 'CAJA'
});

const crearReciboPendienteMock = (): ReciboPendienteIngreso => ({
    recibo_id: 15,
    reserva_id: 44,
    periodo_anio: 2026,
    periodo_mes: 7,
    fecha_emision: '2026-07-01T00:00:00.000Z',
    fecha_vencimiento: '2026-07-10T00:00:00.000Z',
    estado_recibo: 'EMITIDO',
    subtotal: 500,
    igv_total: 90,
    total: 590,
    saldo_pendiente: 590,
    observaciones: null,
    inquilino_id: 13,
    fecha_inicio: '2026-07-01T00:00:00.000Z',
    fecha_fin: '2026-07-31T00:00:00.000Z',
    moneda: 'PEN',
    inmueble_id: 10,
    empresa_id: 6,
    codigo_inmueble: 'DEP-101',
    nombre_inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    nombres_inquilino: 'Carlos',
    apellidos_inquilino: 'Ramos',
    numero_documento: '12345678',
    telefono_inquilino: '999999999',
    correo_inquilino: 'carlos@test.com'
});

const crearIngresoMock = (): IngresoAlquiler => ({
    pago_id: 50,
    movimiento_bancario_id: 70,
    recibo_id: 15,
    reserva_id: 44,
    usuario_pagador_id: 13,
    inquilino_id: 13,
    metodo_pago: 'TRANSFERENCIA',
    referencia: 'OP-001',
    referencia_externa: 'OP-001',
    importe: 590,
    monto: 590,
    moneda: 'PEN',
    estado_pago: 'CONFIRMADO',
    fecha_pago: '2026-07-15T00:00:00.000Z',
    fecha_confirmacion: '2026-07-15T00:00:00.000Z',
    fecha_movimiento: '2026-07-15T00:00:00.000Z',
    concepto: 'Ingreso por alquiler julio',
    descripcion: 'Cobro de alquiler del inmueble Departamento 101.',
    observaciones: 'Pago registrado manualmente',
    saldo_anterior: 1000,
    saldo_posterior: 1590,
    estado_recibo: 'PAGADO',
    total_recibo: 590,
    saldo_pendiente: 0,
    inmueble_id: 10,
    codigo_inmueble: 'DEP-101',
    inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    nombres_inquilino: 'Carlos',
    apellidos_inquilino: 'Ramos',
    tiene_movimiento_tesoreria: true
});

const crearPayloadMock = (): RegistrarIngresoPayload => ({
    cuenta_bancaria_id: 3,
    categoria_movimiento_id: 8,
    recibo_id: 15,
    importe: 590,
    metodo_pago: 'TRANSFERENCIA',
    fecha_movimiento: '2026-07-15',
    concepto: 'Ingreso por alquiler julio',
    descripcion: 'Pago de alquiler correspondiente a julio',
    referencia_externa: 'OP-001',
    observaciones: 'Pago registrado manualmente'
});

describe('HU19 - ingresoAlquilerService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU19-FE-SRV-01 obtiene datos del formulario de ingreso correctamente', async () => {
        const categoriasMock = [crearCategoriaMock()];
        const cuentasMock = [crearCuentaMock()];
        const recibosMock = [crearReciboPendienteMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Datos para el formulario de ingreso obtenidos correctamente.',
                categorias: categoriasMock,
                cuentas: cuentasMock,
                recibos_pendientes: recibosMock
            }
        });

        const resultado = await obtenerDatosFormularioIngreso();

        expect(apiClientMock.get).toHaveBeenCalledWith(
            '/ingresos-alquiler/formulario'
        );

        expect(resultado).toEqual({
            categorias: categoriasMock,
            cuentas: cuentasMock,
            recibos_pendientes: recibosMock
        });
    });

    test('CP-HU19-FE-SRV-02 retorna arreglos vacíos si el formulario no trae datos', async () => {
        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Datos para el formulario de ingreso obtenidos correctamente.'
            }
        });

        const resultado = await obtenerDatosFormularioIngreso();

        expect(resultado).toEqual({
            categorias: [],
            cuentas: [],
            recibos_pendientes: []
        });
    });

    test('CP-HU19-FE-SRV-03 lista recibos pendientes de ingreso correctamente', async () => {
        const recibosMock = [crearReciboPendienteMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Recibos pendientes de ingreso obtenidos correctamente.',
                recibos: recibosMock
            }
        });

        const resultado = await listarRecibosPendientesIngreso();

        expect(apiClientMock.get).toHaveBeenCalledWith(
            '/ingresos-alquiler/recibos-pendientes'
        );

        expect(resultado).toEqual(recibosMock);
    });

    test('CP-HU19-FE-SRV-04 retorna arreglo vacío si no hay recibos pendientes', async () => {
        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Recibos pendientes de ingreso obtenidos correctamente.'
            }
        });

        const resultado = await listarRecibosPendientesIngreso();

        expect(resultado).toEqual([]);
    });

    test('CP-HU19-FE-SRV-05 lista ingresos de alquiler correctamente', async () => {
        const ingresosMock = [crearIngresoMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Ingresos de alquiler obtenidos correctamente.',
                ingresos: ingresosMock
            }
        });

        const resultado = await listarIngresosAlquiler();

        expect(apiClientMock.get).toHaveBeenCalledWith(
            '/ingresos-alquiler/ingresos'
        );

        expect(resultado).toEqual(ingresosMock);
    });

    test('CP-HU19-FE-SRV-06 retorna arreglo vacío si no hay ingresos registrados', async () => {
        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Ingresos de alquiler obtenidos correctamente.'
            }
        });

        const resultado = await listarIngresosAlquiler();

        expect(resultado).toEqual([]);
    });

    test('CP-HU19-FE-SRV-07 registra ingreso de alquiler correctamente', async () => {
        const payloadMock = crearPayloadMock();
        const ingresoMock = crearIngresoMock();

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'Ingreso de alquiler registrado correctamente.',
                ingreso: ingresoMock
            }
        });

        const resultado = await registrarIngresoAlquiler(payloadMock);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/ingresos-alquiler/ingresos',
            payloadMock
        );

        expect(resultado).toEqual(ingresoMock);
    });

    test('CP-HU19-FE-SRV-08 captura error con campo mensaje del backend', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'El importe no puede superar el saldo pendiente del recibo.'
                }
            }
        });

        await expect(
            registrarIngresoAlquiler({
                ...crearPayloadMock(),
                importe: 1000
            })
        ).rejects.toThrow(
            'El importe no puede superar el saldo pendiente del recibo.'
        );
    });

    test('CP-HU19-FE-SRV-09 captura error con campo error del backend', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {
                    error: 'Error interno al listar los ingresos de alquiler.'
                }
            }
        });

        await expect(listarIngresosAlquiler()).rejects.toThrow(
            'Error interno al listar los ingresos de alquiler.'
        );
    });

    test('CP-HU19-FE-SRV-10 captura errores de validación enviados como arreglo', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    errores: [
                        'La cuenta bancaria es obligatoria.',
                        'El recibo es obligatorio.',
                        'El importe debe ser mayor a cero.'
                    ]
                }
            }
        });

        await expect(
            registrarIngresoAlquiler({
                ...crearPayloadMock(),
                cuenta_bancaria_id: 0,
                recibo_id: 0,
                importe: 0
            })
        ).rejects.toThrow(
            'La cuenta bancaria es obligatoria., El recibo es obligatorio., El importe debe ser mayor a cero.'
        );
    });

    test('CP-HU19-FE-SRV-11 usa mensaje por defecto si backend no responde mensaje', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(obtenerDatosFormularioIngreso()).rejects.toThrow(
            'Error al obtener los datos del formulario de ingresos.'
        );
    });
});