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
    descargarReciboPdf,
    generarReciboReservaGestion,
    listarRecibosReserva,
    obtenerDetalleRecibo,
    obtenerNumeroVisualRecibo,
    previsualizarReciboReservaGestion,
    verReciboPdf
} from './reciboService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

describe('HU15 - reciboService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window.URL, 'createObjectURL', {
            writable: true,
            value: vi.fn(() => 'blob:boleta-digital')
        });

        Object.defineProperty(window.URL, 'revokeObjectURL', {
            writable: true,
            value: vi.fn()
        });

        vi.spyOn(window, 'open').mockImplementation(() => null);
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
            () => {}
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('CP-HU15-FE-SRV-01 previsualiza la boleta de una reserva', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Vista previa de boleta generada correctamente',
                reserva: {
                    reserva_id: 15
                },
                conceptos: [
                    {
                        concepto_cobro_id: 1,
                        codigo: 'RENTA_RESERVA',
                        descripcion: 'Renta de reserva',
                        cantidad: 5,
                        precio_unitario: 100,
                        importe: 500,
                        aplica_igv: true,
                        orden_impresion: 1,
                        igv: 90,
                        total_linea: 590,
                        obligatorio: true,
                        editable: false
                    }
                ],
                subtotal: 500,
                igv_total: 90,
                total: 590,
                dias_reserva: 5,
                fecha_vencimiento: '2026-07-15'
            }
        });

        const resultado = await previsualizarReciboReservaGestion(15);

        expect(apiClient.get).toHaveBeenCalledWith(
            '/recibos/reservas/15/preview'
        );

        expect(resultado.total).toBe(590);
        expect(resultado.conceptos).toHaveLength(1);
    });

    test('CP-HU15-FE-SRV-02 genera una boleta digital desde gestión', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: {
                mensaje: 'Boleta digital generada correctamente.',
                recibo: {
                    recibo_id: 25,
                    cuenta_cobro_inmueble_id: 10,
                    reserva_id: 15,
                    periodo_anio: 2026,
                    periodo_mes: 7,
                    fecha_emision: '2026-07-10',
                    fecha_vencimiento: '2026-07-15',
                    estado_recibo: 'EMITIDO',
                    subtotal: 500,
                    igv_total: 90,
                    total: 590,
                    saldo_pendiente: 590
                },
                detalles: []
            }
        });

        const resultado = await generarReciboReservaGestion(
            15,
            'Boleta emitida desde prueba',
            [
                {
                    concepto_cobro_id: 2,
                    cantidad: 1,
                    precio_unitario: 50
                }
            ]
        );

        expect(apiClient.post).toHaveBeenCalledWith(
            '/recibos/reservas/15/generar',
            {
                observaciones: 'Boleta emitida desde prueba',
                conceptos_editados: [
                    {
                        concepto_cobro_id: 2,
                        cantidad: 1,
                        precio_unitario: 50
                    }
                ]
            }
        );

        expect(resultado.mensaje).toBe(
            'Boleta digital generada correctamente.'
        );
        expect(resultado.recibo.recibo_id).toBe(25);
    });

    test('CP-HU15-FE-SRV-03 lista las boletas de una reserva', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Boletas de la reserva obtenidas correctamente',
                recibos: [
                    {
                        recibo_id: 25,
                        cuenta_cobro_inmueble_id: 10,
                        reserva_id: 15,
                        periodo_anio: 2026,
                        periodo_mes: 7,
                        fecha_emision: '2026-07-10',
                        fecha_vencimiento: '2026-07-15',
                        estado_recibo: 'EMITIDO',
                        subtotal: 500,
                        igv_total: 90,
                        total: 590,
                        saldo_pendiente: 590
                    }
                ]
            }
        });

        const resultado = await listarRecibosReserva(15);

        expect(apiClient.get).toHaveBeenCalledWith(
            '/recibos/reservas/15'
        );

        expect(resultado.recibos).toHaveLength(1);
        expect(resultado.recibos[0].estado_recibo).toBe('EMITIDO');
    });

    test('CP-HU15-FE-SRV-04 obtiene el detalle de una boleta', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            data: {
                mensaje: 'Detalle de boleta obtenido correctamente',
                recibo: {
                    recibo_id: 25,
                    cuenta_cobro_inmueble_id: 10,
                    reserva_id: 15,
                    periodo_anio: 2026,
                    periodo_mes: 7,
                    fecha_emision: '2026-07-10',
                    fecha_vencimiento: '2026-07-15',
                    estado_recibo: 'EMITIDO',
                    subtotal: 500,
                    igv_total: 90,
                    total: 590,
                    saldo_pendiente: 590
                },
                detalles: [
                    {
                        recibo_detalle_id: 1,
                        recibo_id: 25,
                        concepto_cobro_id: 1,
                        descripcion: 'Renta de reserva',
                        cantidad: 5,
                        precio_unitario: 100,
                        importe: 500,
                        orden_impresion: 1,
                        codigo_concepto: 'RENTA_RESERVA',
                        nombre_concepto: 'Renta de reserva',
                        aplica_igv: true
                    }
                ]
            }
        });

        const resultado = await obtenerDetalleRecibo(25);

        expect(apiClient.get).toHaveBeenCalledWith('/recibos/25');

        expect(resultado.recibo.recibo_id).toBe(25);
        expect(resultado.detalles[0].descripcion).toBe('Renta de reserva');
    });

    test('CP-HU15-FE-SRV-05 abre el PDF de la boleta en modo visualización', async () => {
        const blob = new Blob(['PDF simulado'], {
            type: 'application/pdf'
        });

        vi.mocked(apiClient.get).mockResolvedValue({
            data: blob
        });

        await verReciboPdf(25);

        expect(apiClient.get).toHaveBeenCalledWith(
            '/recibos/25/pdf?modo=ver',
            {
                responseType: 'blob'
            }
        );

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(window.open).toHaveBeenCalledWith(
            'blob:boleta-digital',
            '_blank',
            'noopener,noreferrer'
        );
    });

    test('CP-HU15-FE-SRV-06 descarga el PDF de la boleta', async () => {
        const blob = new Blob(['PDF simulado'], {
            type: 'application/pdf'
        });

        vi.mocked(apiClient.get).mockResolvedValue({
            data: blob
        });

        await descargarReciboPdf(25);

        expect(apiClient.get).toHaveBeenCalledWith(
            '/recibos/25/pdf',
            {
                responseType: 'blob'
            }
        );

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(
            'blob:boleta-digital'
        );
    });

    test('CP-HU15-FE-SRV-07 obtiene mensaje de error enviado por el backend', async () => {
        vi.mocked(apiClient.get).mockRejectedValue({
            response: {
                data: {
                    mensaje: 'La reserva ya tiene una boleta generada'
                }
            }
        });

        await expect(
            previsualizarReciboReservaGestion(15)
        ).rejects.toThrow('La reserva ya tiene una boleta generada');
    });

    test('CP-HU15-FE-SRV-08 obtiene mensaje de error desde Blob al abrir PDF', async () => {
        const blobError = new Blob(
            [
                JSON.stringify({
                    mensaje:
                        'No se encontró la boleta o no tienes permiso para descargarla'
                })
            ],
            {
                type: 'application/json'
            }
        );

        vi.mocked(apiClient.get).mockRejectedValue({
            response: {
                data: blobError
            }
        });

        await expect(verReciboPdf(99)).rejects.toThrow(
            'No se encontró la boleta o no tienes permiso para descargarla'
        );
    });

    test('CP-HU15-FE-SRV-09 formatea el número visual de la boleta con serie y correlativo', () => {
        const numero = obtenerNumeroVisualRecibo({
            recibo_id: 25,
            serie_empresa: 'B001',
            correlativo_empresa: 25
        });

        expect(numero).toBe('B001-000025');
    });

    test('CP-HU15-FE-SRV-10 formatea el número visual usando recibo_id si no hay serie', () => {
        const numero = obtenerNumeroVisualRecibo({
            recibo_id: 25,
            serie_empresa: undefined,
            correlativo_empresa: undefined
        });

        expect(numero).toBe('B-000025');
    });
});