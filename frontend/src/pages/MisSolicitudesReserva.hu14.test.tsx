import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import MisSolicitudesReserva from './MisSolicitudesReserva';
import apiClient from '../services/apiClient';
import { listarMisSolicitudes } from '../services/reservaService';

vi.mock('../components/PublicHeader', () => ({
    default: () => <header>Header público</header>
}));

vi.mock('../components/DetalleSolicitudReservaDialog', () => ({
    default: () => null
}));

vi.mock('../services/apiClient', () => ({
    default: {
        patch: vi.fn()
    }
}));

vi.mock('../services/reservaService', () => ({
    listarMisSolicitudes: vi.fn()
}));

const solicitudBase = {
    reserva_id: 15,
    inmueble_id: 4,
    inquilino_id: 8,
    estado_reserva: 'SOLICITADA',

    fecha_solicitud: '2026-06-20T00:00:00.000Z',
    fecha_inicio: '2026-07-01T00:00:00.000Z',
    fecha_fin: '2026-07-10T00:00:00.000Z',

    renta_pactada_mensual: 1200,
    monto_total_estimado: null,
    deposito_garantia: null,
    moneda: 'PEN',

    observacion_inquilino: null,
    observacion_gestor: null,
    motivo_rechazo: null,
    fecha_decision: null,

    created_at: '2026-06-20T00:00:00.000Z',
    updated_at: '2026-06-20T00:00:00.000Z',

    codigo_inmueble: 'DEP-101',
    nombre_inmueble: 'Departamento 101',
    tipo_inmueble: 'DEPARTAMENTO',
    subtipo_unidad: null,

    direccion_linea1: 'Av. Test 123',
    numero: '101',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    provincia: 'Lima',
    departamento: 'Lima',

    publicacion_id: 3,
    titulo_publicacion: 'Departamento Test',
    descripcion_corta: 'Departamento para prueba',
    precio_publicado_mensual: 1200,
    foto_principal: null
};

describe('HU14 - MisSolicitudesReserva', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        vi.mocked(listarMisSolicitudes).mockResolvedValue({
            mensaje: 'Solicitudes obtenidas correctamente',
            total: 1,
            solicitudes: [solicitudBase]
        });
    });

    test('muestra el botón Cancelar reserva cuando la solicitud está en estado SOLICITADA', async () => {
        render(<MisSolicitudesReserva />);

        expect(
            await screen.findByText('Departamento Test')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /cancelar reserva/i })
        ).toBeInTheDocument();
    });

    test('abre el modal de cancelación al presionar Cancelar reserva', async () => {
        const user = userEvent.setup();

        render(<MisSolicitudesReserva />);

        await screen.findByText('Departamento Test');

        await user.click(
            screen.getByRole('button', { name: /cancelar reserva/i })
        );

        expect(
            screen.getByRole('heading', { name: /cancelar reserva/i })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/motivo de cancelación/i)
        ).toBeInTheDocument();
    });

    test('cancela correctamente una reserva y actualiza el estado en pantalla', async () => {
        const user = userEvent.setup();

        localStorage.setItem('token', 'token-falso-prueba');

        vi.mocked(apiClient.patch).mockResolvedValue({
            data: {
                mensaje: 'Reserva cancelada correctamente',
                reserva: {
                    ...solicitudBase,
                    estado_reserva: 'CANCELADA',
                    motivo_cancelacion: 'Cambio de planes'
                },
                notificacion: null
            }
        });

        render(<MisSolicitudesReserva />);

        await screen.findByText('Departamento Test');

        await user.click(
            screen.getByRole('button', { name: /cancelar reserva/i })
        );

        await user.type(
            screen.getByLabelText(/motivo de cancelación/i),
            'Cambio de planes'
        );

        const modal = screen
            .getByRole('heading', { name: /cancelar reserva/i })
            .closest('.cancel-modal-card') as HTMLElement;

        await user.click(
            within(modal).getByRole('button', {
                name: /cancelar reserva/i
            })
        );

        await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith(
                '/reservas/15/cancelar',
                {
                    motivo: 'Cambio de planes'
                }
            );
        });

        expect(
            await screen.findByText(
                /reserva cancelada correctamente/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText('Cancelada')
        ).toBeInTheDocument();
    });

    test('muestra error si no existe token en localStorage', async () => {
        const user = userEvent.setup();

        render(<MisSolicitudesReserva />);

        await screen.findByText('Departamento Test');

        await user.click(
            screen.getByRole('button', { name: /cancelar reserva/i })
        );

        const modal = screen
            .getByRole('heading', { name: /cancelar reserva/i })
            .closest('.cancel-modal-card') as HTMLElement;

        await user.click(
            within(modal).getByRole('button', {
                name: /cancelar reserva/i
            })
        );

        expect(apiClient.patch).not.toHaveBeenCalled();

        expect(
            await screen.findByText(
                /tu sesión ha expirado/i
            )
        ).toBeInTheDocument();
    });

    test('muestra modal especial cuando la reserva ya tiene boleta pagada', async () => {
        const user = userEvent.setup();

        localStorage.setItem('token', 'token-falso-prueba');

        vi.mocked(apiClient.patch).mockRejectedValue({
            response: {
                data: {
                    codigo: 'RESERVA_CON_RECIBO_PAGADO',
                    mensaje:
                        'La reserva ya tiene una boleta pagada. No puede cancelarse directamente.',
                    recibo: {
                        recibo_id: 30,
                        estado_recibo: 'PAGADO',
                        total: 500,
                        saldo_pendiente: 0
                    }
                }
            }
        });

        render(<MisSolicitudesReserva />);

        await screen.findByText('Departamento Test');

        await user.click(
            screen.getByRole('button', { name: /cancelar reserva/i })
        );

        const modal = screen
            .getByRole('heading', { name: /cancelar reserva/i })
            .closest('.cancel-modal-card') as HTMLElement;

        await user.click(
            within(modal).getByRole('button', {
                name: /cancelar reserva/i
            })
        );

        expect(
            await screen.findByText(/no se puede cancelar directamente/i)
        ).toBeInTheDocument();

        expect(screen.getByText('PAGADO')).toBeInTheDocument();
        expect(screen.getByText('S/ 500.00')).toBeInTheDocument();
        expect(screen.getByText('S/ 0.00')).toBeInTheDocument();
    });

    test('no muestra botón Cancelar reserva para una solicitud rechazada', async () => {
        vi.mocked(listarMisSolicitudes).mockResolvedValue({
            mensaje: 'Solicitudes obtenidas correctamente',
            total: 1,
            solicitudes: [
                {
                    ...solicitudBase,
                    reserva_id: 20,
                    estado_reserva: 'RECHAZADA',
                    motivo_rechazo: 'No cumple condiciones'
                }
            ]
        });

        render(<MisSolicitudesReserva />);

        expect(
            await screen.findByText('Departamento Test')
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', { name: /cancelar reserva/i })
        ).not.toBeInTheDocument();

        expect(
            screen.getByText('Rechazada')
        ).toBeInTheDocument();
    });
});