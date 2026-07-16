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
    fireEvent
} from '@testing-library/react';

import PagoOnlineDialog from './PagoOnlineDialog';

import type {
    ReciboPendiente,
    MetodoPago
} from '../services/pagoService';

const crearReciboMock = (): ReciboPendiente => ({
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

describe('HU16 - PagoOnlineDialog', () => {
    const onCambiarMetodoPagoMock = vi.fn();
    const onCerrarMock = vi.fn();
    const onConfirmarMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU16-FE-COMP-01 no renderiza el diálogo cuando está cerrado', () => {
        render(
            <PagoOnlineDialog
                abierto={false}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        expect(
            screen.queryByText('Confirmar pago')
        ).not.toBeInTheDocument();
    });

    test('CP-HU16-FE-COMP-02 no renderiza el diálogo si no hay recibo seleccionado', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={null}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        expect(
            screen.queryByText('Confirmar pago')
        ).not.toBeInTheDocument();
    });

    test('CP-HU16-FE-COMP-03 muestra la información del recibo pendiente', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        expect(
            screen.getByRole('heading', {
                name: 'Confirmar pago'
            })
        ).toBeInTheDocument();

        expect(screen.getByText('#25')).toBeInTheDocument();
        expect(screen.getByText('Departamento 101')).toBeInTheDocument();
        expect(screen.getByText('7/2026')).toBeInTheDocument();
        expect(screen.getByText('S/ 590.00')).toBeInTheDocument();
    });

    test('CP-HU16-FE-COMP-04 cambia el método de pago a tarjeta', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        fireEvent.change(screen.getByRole('combobox'), {
            target: {
                value: 'TARJETA' as MetodoPago
            }
        });

        expect(onCambiarMetodoPagoMock).toHaveBeenCalledWith('TARJETA');
    });

    test('CP-HU16-FE-COMP-05 cambia el método de pago a transferencia', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        fireEvent.change(screen.getByRole('combobox'), {
            target: {
                value: 'TRANSFERENCIA' as MetodoPago
            }
        });

        expect(onCambiarMetodoPagoMock).toHaveBeenCalledWith('TRANSFERENCIA');
    });

    test('CP-HU16-FE-COMP-06 confirma el pago desde el diálogo', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Confirmar pago'
            })
        );

        expect(onConfirmarMock).toHaveBeenCalled();
    });

    test('CP-HU16-FE-COMP-07 cierra el diálogo al cancelar', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={false}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancelar'
            })
        );

        expect(onCerrarMock).toHaveBeenCalled();
    });

    test('CP-HU16-FE-COMP-08 deshabilita acciones mientras procesa el pago', () => {
        render(
            <PagoOnlineDialog
                abierto={true}
                recibo={crearReciboMock()}
                procesando={true}
                metodoPago="ONLINE"
                onCambiarMetodoPago={onCambiarMetodoPagoMock}
                onCerrar={onCerrarMock}
                onConfirmar={onConfirmarMock}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Procesando...'
            })
        ).toBeDisabled();

        expect(
            screen.getByRole('button', {
                name: 'Cancelar'
            })
        ).toBeDisabled();

        expect(screen.getByRole('combobox')).toBeDisabled();
    });
});