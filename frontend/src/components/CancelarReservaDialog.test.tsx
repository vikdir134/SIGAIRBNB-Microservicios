import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import CancelarReservaDialog from './CancelarReservaDialog';

describe('HU14 - CancelarReservaDialog', () => {
    test('no renderiza el modal cuando abierto es false', () => {
        render(
            <CancelarReservaDialog
                abierto={false}
                onConfirmar={vi.fn()}
                onCerrar={vi.fn()}
            />
        );

        expect(
            screen.queryByRole('heading', { name: /cancelar reserva/i })
        ).not.toBeInTheDocument();
    });

    test('muestra el título, descripción, textarea y botones cuando está abierto', () => {
        render(
            <CancelarReservaDialog
                abierto={true}
                onConfirmar={vi.fn()}
                onCerrar={vi.fn()}
            />
        );

        expect(
            screen.getByRole('heading', { name: /cancelar reserva/i })
        ).toBeInTheDocument();

        expect(
            screen.getByText(/al cancelar esta reserva/i)
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/motivo de cancelación/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /volver/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /cancelar reserva/i })
        ).toBeInTheDocument();
    });

    test('envía el motivo recortado al confirmar la cancelación', async () => {
        const user = userEvent.setup();
        const onConfirmar = vi.fn();

        render(
            <CancelarReservaDialog
                abierto={true}
                onConfirmar={onConfirmar}
                onCerrar={vi.fn()}
            />
        );

        await user.type(
            screen.getByLabelText(/motivo de cancelación/i),
            '   Cambio de planes del viaje   '
        );

        await user.click(
            screen.getByRole('button', { name: /cancelar reserva/i })
        );

        expect(onConfirmar).toHaveBeenCalledWith(
            'Cambio de planes del viaje'
        );
    });

    test('ejecuta onCerrar al presionar el botón Volver', async () => {
        const user = userEvent.setup();
        const onCerrar = vi.fn();

        render(
            <CancelarReservaDialog
                abierto={true}
                onConfirmar={vi.fn()}
                onCerrar={onCerrar}
            />
        );

        await user.click(
            screen.getByRole('button', { name: /volver/i })
        );

        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    test('bloquea los controles cuando cargando es true', () => {
        render(
            <CancelarReservaDialog
                abierto={true}
                cargando={true}
                onConfirmar={vi.fn()}
                onCerrar={vi.fn()}
            />
        );

        expect(
            screen.getByLabelText(/motivo de cancelación/i)
        ).toBeDisabled();

        expect(
            screen.getByRole('button', { name: /volver/i })
        ).toBeDisabled();

        expect(
            screen.getByRole('button', { name: /cancelando/i })
        ).toBeDisabled();
    });
});