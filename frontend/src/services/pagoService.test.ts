import {
    describe,
    test,
    expect,
    vi,
    beforeEach,
    afterEach
} from 'vitest';

import apiClient from './apiClient';

import {
    obtenerMisRecibosPendientes,
    obtenerDetalleReciboParaPago,
    pagarReciboOnline,
    obtenerMisPagos
} from './pagoService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

describe('HU16 - pagoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(1710000000000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('CP-HU16-FE-SRV-01 obtiene los recibos pendientes del inquilino', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Recibos pendientes obtenidos correctamente.',
                recibos: [
                    {
                        recibo_id: 25,
                        reserva_id: 15,
                        periodo_anio: 2026,
                        periodo_mes: 7,
                        fecha_emision: '2026-07-10',
                        fecha_vencimiento: '2026-07-15',
                        estado_recibo: 'EMITIDO',
                        subtotal: 500,
                        igv_total: 90,
                        total: 590,
                        saldo_pendiente: 590,
                        inmueble_id: 6,
                        empresa_id: 6,
                        codigo_inmueble: 'DEP-101',
                        nombre_inmueble: 'Departamento 101'
                    }
                ]
            }
        } as any);

        const resultado = await obtenerMisRecibosPendientes();

        expect(apiClient.get).toHaveBeenCalledWith(
            '/pagos/mis-recibos-pendientes'
        );

        expect(resultado).toHaveLength(1);
        expect(resultado[0].recibo_id).toBe(25);
        expect(resultado[0].saldo_pendiente).toBe(590);
    });

    test('CP-HU16-FE-SRV-02 retorna arreglo vacío si no hay recibos pendientes', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Recibos pendientes obtenidos correctamente.'
            }
        } as any);

        const resultado = await obtenerMisRecibosPendientes();

        expect(resultado).toEqual([]);
    });

    test('CP-HU16-FE-SRV-03 obtiene el detalle del recibo para pago', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Detalle del recibo obtenido correctamente.',
                recibo: {
                    recibo_id: 25,
                    reserva_id: 15,
                    periodo_anio: 2026,
                    periodo_mes: 7,
                    fecha_emision: '2026-07-10',
                    fecha_vencimiento: '2026-07-15',
                    estado_recibo: 'EMITIDO',
                    subtotal: 500,
                    igv_total: 90,
                    total: 590,
                    saldo_pendiente: 590,
                    inmueble_id: 6,
                    empresa_id: 6,
                    codigo_inmueble: 'DEP-101',
                    nombre_inmueble: 'Departamento 101'
                }
            }
        } as any);

        const resultado = await obtenerDetalleReciboParaPago(25);

        expect(apiClient.get).toHaveBeenCalledWith(
            '/pagos/recibos/25'
        );

        expect(resultado.recibo_id).toBe(25);
        expect(resultado.nombre_inmueble).toBe('Departamento 101');
    });

    test('CP-HU16-FE-SRV-04 procesa pago online con método ONLINE por defecto', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: {
                mensaje: 'Pago procesado correctamente.',
                monto_pagado: 590,
                pago: {
                    pago_id: 40,
                    recibo_id: 25,
                    reserva_id: 15,
                    metodo_pago: 'ONLINE',
                    proveedor_pasarela: 'SIMULADO',
                    monto: 590,
                    moneda: 'PEN',
                    estado_pago: 'CONFIRMADO',
                    fecha_pago: '2026-07-10'
                }
            }
        } as any);

        const resultado = await pagarReciboOnline(25);

        expect(apiClient.post).toHaveBeenCalledWith(
            '/pagos/recibos/25/pagar-online',
            {
                metodo_pago: 'ONLINE',
                proveedor_pasarela: 'SIMULADO',
                referencia: 'PAGO-WEB-HU16-ONLINE-25-1710000000000'
            }
        );

        expect(resultado.mensaje).toBe('Pago procesado correctamente.');
        expect(resultado.monto_pagado).toBe(590);
        expect(resultado.pago.estado_pago).toBe('CONFIRMADO');
    });

    test('CP-HU16-FE-SRV-05 procesa pago con tarjeta', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: {
                mensaje: 'Pago procesado correctamente.',
                monto_pagado: 700,
                pago: {
                    pago_id: 41,
                    recibo_id: 26,
                    reserva_id: 16,
                    metodo_pago: 'TARJETA',
                    proveedor_pasarela: 'SIMULADO',
                    monto: 700,
                    moneda: 'PEN',
                    estado_pago: 'CONFIRMADO',
                    fecha_pago: '2026-07-10'
                }
            }
        } as any);

        const resultado = await pagarReciboOnline(26, 'TARJETA');

        expect(apiClient.post).toHaveBeenCalledWith(
            '/pagos/recibos/26/pagar-online',
            {
                metodo_pago: 'TARJETA',
                proveedor_pasarela: 'SIMULADO',
                referencia: 'PAGO-WEB-HU16-TARJETA-26-1710000000000'
            }
        );

        expect(resultado.pago.metodo_pago).toBe('TARJETA');
    });

    test('CP-HU16-FE-SRV-06 procesa transferencia bancaria con proveedor null', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: {
                mensaje: 'Pago procesado correctamente.',
                monto_pagado: 800,
                pago: {
                    pago_id: 42,
                    recibo_id: 27,
                    reserva_id: 17,
                    metodo_pago: 'TRANSFERENCIA',
                    proveedor_pasarela: null,
                    monto: 800,
                    moneda: 'PEN',
                    estado_pago: 'CONFIRMADO',
                    fecha_pago: '2026-07-10'
                }
            }
        } as any);

        const resultado = await pagarReciboOnline(27, 'TRANSFERENCIA');

        expect(apiClient.post).toHaveBeenCalledWith(
            '/pagos/recibos/27/pagar-online',
            {
                metodo_pago: 'TRANSFERENCIA',
                proveedor_pasarela: null,
                referencia: 'PAGO-WEB-HU16-TRANSFERENCIA-27-1710000000000'
            }
        );

        expect(resultado.pago.metodo_pago).toBe('TRANSFERENCIA');
    });

    test('CP-HU16-FE-SRV-07 obtiene el historial de pagos del inquilino', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Pagos obtenidos correctamente.',
                pagos: [
                    {
                        pago_id: 40,
                        recibo_id: 25,
                        reserva_id: 15,
                        metodo_pago: 'ONLINE',
                        monto: 590,
                        moneda: 'PEN',
                        estado_pago: 'CONFIRMADO',
                        fecha_pago: '2026-07-10',
                        nombre_inmueble: 'Departamento 101'
                    }
                ]
            }
        } as any);

        const resultado = await obtenerMisPagos();

        expect(apiClient.get).toHaveBeenCalledWith('/pagos/mis-pagos');

        expect(resultado).toHaveLength(1);
        expect(resultado[0].pago_id).toBe(40);
        expect(resultado[0].estado_pago).toBe('CONFIRMADO');
    });

    test('CP-HU16-FE-SRV-08 retorna arreglo vacío si no hay pagos registrados', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Pagos obtenidos correctamente.'
            }
        } as any);

        const resultado = await obtenerMisPagos();

        expect(resultado).toEqual([]);
    });

    test('CP-HU16-FE-SRV-09 muestra mensaje de error del backend al obtener recibos pendientes', async () => {
        vi.mocked(apiClient.get).mockRejectedValue({
            response: {
                data: {
                    mensaje: 'No se pudo identificar al usuario autenticado.'
                }
            }
        });

        await expect(
            obtenerMisRecibosPendientes()
        ).rejects.toThrow('No se pudo identificar al usuario autenticado.');
    });

    test('CP-HU16-FE-SRV-10 muestra mensaje de error del backend al pagar recibo', async () => {
        vi.mocked(apiClient.post).mockRejectedValue({
            response: {
                data: {
                    mensaje: 'Este recibo ya fue pagado anteriormente.'
                }
            }
        });

        await expect(
            pagarReciboOnline(25)
        ).rejects.toThrow('Este recibo ya fue pagado anteriormente.');
    });
});