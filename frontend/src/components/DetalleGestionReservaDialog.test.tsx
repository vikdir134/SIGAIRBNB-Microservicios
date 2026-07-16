import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import DetalleGestionReservaDialog from './DetalleGestionReservaDialog';

import {
    obtenerEventosReservaGestion,
    aprobarSolicitudExtensionGestion,
    rechazarSolicitudExtensionGestion
} from '../services/reservaService';

import {
    listarRecibosReserva
} from '../services/reciboService';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

vi.mock('../services/reservaService', () => ({
    obtenerEventosReservaGestion: vi.fn(),
    aprobarSolicitudExtensionGestion: vi.fn(),
    rechazarSolicitudExtensionGestion: vi.fn()
}));

vi.mock('../services/reciboService', () => ({
    listarRecibosReserva: vi.fn(),
    descargarReciboPdf: vi.fn(),
    generarReciboReservaGestion: vi.fn(),
    obtenerNumeroVisualRecibo: vi.fn(() => 'B001-000001'),
    previsualizarReciboReservaGestion: vi.fn(),
    verReciboPdf: vi.fn()
}));

vi.mock('./ConfirmDialog', () => ({
    default: ({
        abierto,
        titulo,
        descripcion,
        textoConfirmar,
        textoCancelar,
        onConfirmar,
        onCerrar
    }: {
        abierto: boolean;
        titulo: string;
        descripcion: string;
        textoConfirmar: string;
        textoCancelar: string;
        onConfirmar: () => void;
        onCerrar: () => void;
    }) => {
        if (!abierto) return null;

        return (
            <div role="dialog" aria-label={titulo}>
                <h3>{titulo}</h3>
                <p>{descripcion}</p>

                <button
                    type="button"
                    onClick={onCerrar}
                >
                    {textoCancelar}
                </button>

                <button
                    type="button"
                    data-testid="confirmar-accion-extension"
                    onClick={onConfirmar}
                >
                    {textoConfirmar}
                </button>
            </div>
        );
    }
}));

const crearRespuestaDetalleConExtension = () => ({
    mensaje: 'Eventos obtenidos correctamente',
    reserva: {
        reserva_id: 17,
        inmueble_id: 6,
        inquilino_id: 8,
        estado_reserva: 'APROBADA' as const,
        fecha_inicio: '2026-07-09',
        fecha_fin: '2026-07-10',
        codigo_inmueble: 'LOC-101',
        nombre_inmueble: 'Local 101',
        tipo_inmueble: 'LOCAL'
    },
    solicitud_extension_pendiente: {
        solicitud_extension_id: 1,
        reserva_id: 17,
        solicitante_usuario_id: 8,
        nueva_fecha_fin: '2026-07-13',
        motivo: 'Necesito quedarme unos días más',
        estado: 'PENDIENTE' as const,
        fecha_solicitud: '2026-06-28T00:00:00.000Z',
        fecha_decision: null,
        decidido_por_usuario_id: null,
        comentario_decision: null,
        fecha_inicio: '2026-07-09',
        fecha_fin_actual: '2026-07-10',
        estado_reserva: 'APROBADA',
        inmueble_id: 6,
        codigo_inmueble: 'LOC-101',
        nombre_inmueble: 'Local 101',
        nombres_inquilino: 'Víctor',
        apellidos_inquilino: 'Camargo',
        correo_inquilino: 'victor@test.com'
    },
    total: 1,
    eventos: [
        {
            reserva_evento_id: 100,
            reserva_id: 17,
            usuario_id: 8,
            tipo_evento: 'EXTENSION',
            descripcion: 'El inquilino envió una solicitud de extensión de la reserva.',
            fecha_evento: '2026-06-28T00:00:00.000Z',
            correo_usuario: 'victor@test.com',
            nombres_usuario: 'Víctor',
            apellidos_usuario: 'Camargo'
        }
    ]
});

const crearRespuestaDetalleSinExtension = () => ({
    mensaje: 'Eventos obtenidos correctamente',
    reserva: {
        reserva_id: 17,
        inmueble_id: 6,
        inquilino_id: 8,
        estado_reserva: 'APROBADA',
        fecha_inicio: '2026-07-09',
        fecha_fin: '2026-07-10',
        codigo_inmueble: 'LOC-101',
        nombre_inmueble: 'Local 101',
        tipo_inmueble: 'LOCAL'
    },
    solicitud_extension_pendiente: null,
    total: 0,
    eventos: []
});

describe('HU13 - DetalleGestionReservaDialog', () => {
    const onCerrarMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(listarRecibosReserva).mockResolvedValue({
            mensaje: 'Recibos obtenidos correctamente',
            recibos: []
        });
    });

    test('HU13-FE-GESTION-01: Debe renderizar la solicitud de extensión pendiente', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearRespuestaDetalleConExtension()
        );

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            screen.getByText('Cargando historial...')
        ).toBeInTheDocument();

        expect(
            await screen.findByText('Solicitud de extensión')
        ).toBeInTheDocument();

        expect(
            screen.getByText('PENDIENTE')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Necesito quedarme unos días más')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Aprobar extensión'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Rechazar extensión'
            })
        ).toBeInTheDocument();
    });

    test('HU13-FE-GESTION-02: Debe mostrar mensaje cuando no existe extensión pendiente', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearRespuestaDetalleSinExtension()
        );

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            await screen.findByText(/No existen solicitudes de extensión/i)
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: 'Aprobar extensión'
            })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: 'Rechazar extensión'
            })
        ).not.toBeInTheDocument();
    });

    test('HU13-FE-GESTION-03: Debe aprobar una solicitud de extensión', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearRespuestaDetalleConExtension()
        );

        vi.mocked(aprobarSolicitudExtensionGestion).mockResolvedValue({
            mensaje: 'Solicitud de extensión aprobada correctamente',
            solicitud_extension: {
                ...crearRespuestaDetalleConExtension()
                    .solicitud_extension_pendiente!,
                estado: 'APROBADA' as const,
                fecha_decision: '2026-06-28T01:00:00.000Z',
                decidido_por_usuario_id: 1,
                comentario_decision: 'Extensión aprobada'
            },
            reserva: {
                reserva_id: 17,
                inmueble_id: 6,
                inquilino_id: 8,
                estado_reserva: 'APROBADA',
                fecha_inicio: '2026-07-09',
                fecha_fin: '2026-07-13',
                updated_at: '2026-06-28T01:00:00.000Z'
            },
            evento: {
                reserva_evento_id: 101,
                reserva_id: 17,
                usuario_id: 1,
                tipo_evento: 'EXTENSION',
                descripcion: 'La solicitud de extensión fue aprobada.',
                fecha_evento: '2026-06-28T01:00:00.000Z'
            }
        });

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        await screen.findByText('Solicitud de extensión');

        fireEvent.change(
            screen.getByLabelText('Comentario de decisión'),
            {
                target: {
                    value: 'Extensión aprobada'
                }
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Aprobar extensión'
            })
        );

        fireEvent.click(
            screen.getByTestId('confirmar-accion-extension')
        );

        await waitFor(() => {
            expect(aprobarSolicitudExtensionGestion).toHaveBeenCalledWith(
                1,
                'Extensión aprobada'
            );
        });

        expect(
            await screen.findByText('Solicitud de extensión aprobada correctamente')
        ).toBeInTheDocument();
    });

    test('HU13-FE-GESTION-04: Debe bloquear rechazo si no se ingresa motivo', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearRespuestaDetalleConExtension()
        );

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        await screen.findByText('Solicitud de extensión');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Rechazar extensión'
            })
        );

        expect(
            screen.getByText('Debes ingresar el motivo del rechazo.')
        ).toBeInTheDocument();

        expect(
            rechazarSolicitudExtensionGestion
        ).not.toHaveBeenCalled();
    });

    test('HU13-FE-GESTION-05: Debe rechazar una solicitud de extensión con motivo', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearRespuestaDetalleConExtension()
        );

        vi.mocked(rechazarSolicitudExtensionGestion).mockResolvedValue({
            mensaje: 'Solicitud de extensión rechazada correctamente',
            solicitud_extension: {
                ...crearRespuestaDetalleConExtension()
                    .solicitud_extension_pendiente!,
                estado: 'RECHAZADA' as const,
                fecha_decision: '2026-06-28T01:00:00.000Z',
                decidido_por_usuario_id: 1,
                comentario_decision: 'No hay disponibilidad'
            },
            evento: {
                reserva_evento_id: 102,
                reserva_id: 17,
                usuario_id: 1,
                tipo_evento: 'EXTENSION',
                descripcion: 'La solicitud de extensión de la reserva fue rechazada.',
                fecha_evento: '2026-06-28T01:00:00.000Z'
            }
        });

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        await screen.findByText('Solicitud de extensión');

        fireEvent.change(
            screen.getByLabelText('Comentario de decisión'),
            {
                target: {
                    value: '  No hay disponibilidad  '
                }
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Rechazar extensión'
            })
        );

        fireEvent.click(
            screen.getByTestId('confirmar-accion-extension')
        );

        await waitFor(() => {
            expect(rechazarSolicitudExtensionGestion).toHaveBeenCalledWith(
                1,
                'No hay disponibilidad'
            );
        });

        expect(
            await screen.findByText('Solicitud de extensión rechazada correctamente')
        ).toBeInTheDocument();
    });

    test('HU13-FE-GESTION-06: No debe renderizar si el diálogo está cerrado', () => {
        render(
            <DetalleGestionReservaDialog
                abierto={false}
                reservaId={17}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            screen.queryByText('Historial de gestión')
        ).not.toBeInTheDocument();

        expect(
            obtenerEventosReservaGestion
        ).not.toHaveBeenCalled();
    });
});