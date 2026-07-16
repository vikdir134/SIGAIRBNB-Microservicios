import {
    describe,
    test,
    expect,
    vi,
    beforeEach
} from 'vitest';

import {
    render,
    screen,
    fireEvent,
    waitFor
} from '@testing-library/react';

import MisPagos from './MisPagos';

import {
    obtenerMisRecibosPendientes,
    obtenerMisPagos,
    pagarReciboOnline
} from '../services/pagoService';

vi.mock('../services/pagoService', () => ({
    obtenerMisRecibosPendientes: vi.fn(),
    obtenerMisPagos: vi.fn(),
    pagarReciboOnline: vi.fn()
}));

const crearReciboPendienteMock = () => ({
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
    nombre_inmueble: 'Departamento 101',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima'
});

const crearPagoMock = () => ({
    pago_id: 40,
    recibo_id: 25,
    reserva_id: 15,
    metodo_pago: 'ONLINE',
    proveedor_pasarela: 'SIMULADO',
    monto: 590,
    moneda: 'PEN',
    estado_pago: 'CONFIRMADO',
    fecha_pago: '2026-07-10',
    nombre_inmueble: 'Departamento 101'
});

describe('HU16 - MisPagos', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(obtenerMisRecibosPendientes).mockResolvedValue([
            crearReciboPendienteMock()
        ] as any);

        vi.mocked(obtenerMisPagos).mockResolvedValue([
            crearPagoMock()
        ] as any);

        vi.mocked(pagarReciboOnline).mockResolvedValue({
            mensaje: 'Pago procesado correctamente.',
            monto_pagado: 590,
            pago: crearPagoMock()
        } as any);
    });

    test('CP-HU16-FE-PAGE-01 muestra estado de carga inicial', () => {
        render(<MisPagos />);

        expect(
            screen.getByText('Cargando información de pagos...')
        ).toBeInTheDocument();
    });

    test('CP-HU16-FE-PAGE-02 carga recibos pendientes e historial de pagos', async () => {
        render(<MisPagos />);

        expect(
            await screen.findByText('Boleta #25')
        ).toBeInTheDocument();

        expect(screen.getAllByText('Departamento 101').length).toBeGreaterThan(0);
        expect(screen.getByText('Boletas pendientes')).toBeInTheDocument();
        expect(screen.getByText('Historial de pagos')).toBeInTheDocument();

        expect(obtenerMisRecibosPendientes).toHaveBeenCalled();
        expect(obtenerMisPagos).toHaveBeenCalled();
    });

    test('CP-HU16-FE-PAGE-03 muestra mensajes vacíos si no hay recibos ni pagos', async () => {
        vi.mocked(obtenerMisRecibosPendientes).mockResolvedValue([]);
        vi.mocked(obtenerMisPagos).mockResolvedValue([]);

        render(<MisPagos />);

        expect(
            await screen.findByText('No tienes boletas pendientes de pago.')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Aún no tienes pagos registrados.')
        ).toBeInTheDocument();
    });

    test('CP-HU16-FE-PAGE-04 abre el diálogo de pago al hacer click en Pagar', async () => {
        render(<MisPagos />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Pagar'
            })
        );

        expect(
            await screen.findByRole('heading', {
                name: 'Confirmar pago'
            })
        ).toBeInTheDocument();

        expect(screen.getAllByText('#25').length).toBeGreaterThan(0);
        expect(screen.getByText('Total a pagar')).toBeInTheDocument();
    });

    test('CP-HU16-FE-PAGE-05 cambia el método de pago y confirma pago', async () => {
        render(<MisPagos />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Pagar'
            })
        );

        fireEvent.change(screen.getByRole('combobox'), {
            target: {
                value: 'TARJETA'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Confirmar pago'
            })
        );

        await waitFor(() => {
            expect(pagarReciboOnline).toHaveBeenCalledWith(25, 'TARJETA');
        });

        expect(
            await screen.findByText('Pago procesado correctamente.')
        ).toBeInTheDocument();

        expect(obtenerMisRecibosPendientes).toHaveBeenCalledTimes(2);
        expect(obtenerMisPagos).toHaveBeenCalledTimes(2);
    });

    test('CP-HU16-FE-PAGE-06 muestra error si falla la carga de datos', async () => {
        vi.mocked(obtenerMisRecibosPendientes).mockRejectedValue(
            new Error('Error al obtener los recibos pendientes.')
        );

        render(<MisPagos />);

        expect(
            await screen.findByText('Error al obtener los recibos pendientes.')
        ).toBeInTheDocument();
    });

    test('CP-HU16-FE-PAGE-07 muestra error si falla el pago', async () => {
        vi.mocked(pagarReciboOnline).mockRejectedValue(
            new Error('Este recibo ya fue pagado anteriormente.')
        );

        render(<MisPagos />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Pagar'
            })
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Confirmar pago'
            })
        );

        expect(
            await screen.findByText('Este recibo ya fue pagado anteriormente.')
        ).toBeInTheDocument();
    });

    test('CP-HU16-FE-PAGE-08 recarga datos al hacer click en Actualizar', async () => {
        render(<MisPagos />);

        const botonActualizar = await screen.findByRole('button', {
            name: 'Actualizar'
        });

        fireEvent.click(botonActualizar);

        await waitFor(() => {
            expect(obtenerMisRecibosPendientes).toHaveBeenCalledTimes(2);
            expect(obtenerMisPagos).toHaveBeenCalledTimes(2);
        });
    });
});