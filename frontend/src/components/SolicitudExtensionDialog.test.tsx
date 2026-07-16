import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import SolicitudExtensionDialog from './SolicitudExtensionDialog';

import {
    solicitarExtensionReserva
} from '../services/reservaService';

import type {
    SolicitudReserva,
    SolicitudExtension
} from '../services/reservaService';

vi.mock('../services/reservaService', () => ({
    solicitarExtensionReserva: vi.fn()
}));

const crearSolicitudMock = (): SolicitudReserva => ({
    reserva_id: 17,
    inmueble_id: 6,
    inquilino_id: 8,
    estado_reserva: 'APROBADA',

    fecha_solicitud: '2026-07-01T00:00:00.000Z',
    fecha_inicio: '2026-07-09',
    fecha_fin: '2026-07-10',

    renta_pactada_mensual: 1500,
    monto_total_estimado: null,
    deposito_garantia: null,
    moneda: 'PEN',

    observacion_inquilino: null,
    observacion_gestor: null,
    motivo_rechazo: null,
    fecha_decision: null,

    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',

    codigo_inmueble: 'LOC-101',
    nombre_inmueble: 'Local 101',
    tipo_inmueble: 'LOCAL',
    titulo_publicacion: 'Local comercial'
});

const crearExtensionPendienteMock = (): SolicitudExtension => ({
    solicitud_extension_id: 5,
    reserva_id: 17,
    solicitante_usuario_id: 8,
    nueva_fecha_fin: '2026-07-13',
    motivo: 'Necesito más días',
    estado: 'PENDIENTE',
    fecha_solicitud: '2026-07-02T00:00:00.000Z',
    fecha_decision: null,
    decidido_por_usuario_id: null,
    comentario_decision: null
});

describe('HU13 - SolicitudExtensionDialog', () => {
    const onCerrarMock = vi.fn();
    const onRegistradaMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('HU13-FE-COMP-01: Debe renderizar el diálogo cuando está abierto', () => {
        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        expect(
            screen.getByRole('dialog')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Solicitar extensión')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Local 101')
        ).toBeInTheDocument();

        expect(
            screen.getByText('10/07/2026')
        ).toBeInTheDocument();

        expect(
            screen.getByText('APROBADA')
        ).toBeInTheDocument();
    });

    test('HU13-FE-COMP-02: No debe renderizar si el diálogo está cerrado', () => {
        render(
            <SolicitudExtensionDialog
                abierto={false}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        expect(
            screen.queryByRole('dialog')
        ).not.toBeInTheDocument();
    });

    test('HU13-FE-COMP-03: Debe cargar como fecha mínima el día siguiente a la fecha final actual', () => {
        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        const inputFecha = screen.getByLabelText(
            'Nueva fecha de finalización'
        ) as HTMLInputElement;

        expect(inputFecha.value).toBe('2026-07-11');
        expect(inputFecha.min).toBe('2026-07-11');
    });

    test('HU13-FE-COMP-04: Debe registrar una solicitud de extensión válida', async () => {
        vi.mocked(solicitarExtensionReserva).mockResolvedValue({
            mensaje: 'Solicitud de extensión enviada correctamente',
            reserva: {
                reserva_id: 17,
                inmueble_id: 6,
                estado_reserva: 'APROBADA',
                fecha_inicio: '2026-07-09',
                fecha_fin_actual: '2026-07-10',
                codigo_inmueble: 'LOC-101',
                nombre_inmueble: 'Local 101',
                titulo_publicacion: 'Local comercial'
            },
            solicitud_extension: {
                solicitud_extension_id: 1,
                reserva_id: 17,
                solicitante_usuario_id: 8,
                nueva_fecha_fin: '2026-07-13',
                motivo: 'Necesito quedarme unos días más',
                estado: 'PENDIENTE',
                fecha_solicitud: '2026-07-02T00:00:00.000Z',
                fecha_decision: null,
                decidido_por_usuario_id: null,
                comentario_decision: null
            },
            evento: {
                reserva_evento_id: 200,
                reserva_id: 17,
                usuario_id: 8,
                tipo_evento: 'EXTENSION',
                descripcion: 'El inquilino envió una solicitud de extensión de la reserva.',
                fecha_evento: '2026-07-02T00:00:00.000Z'
            }
        });

        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        const inputFecha = screen.getByLabelText(
            'Nueva fecha de finalización'
        );

        const textareaMotivo = screen.getByLabelText(
            'Motivo de la extensión'
        );

        fireEvent.change(inputFecha, {
            target: {
                value: '2026-07-13'
            }
        });

        fireEvent.change(textareaMotivo, {
            target: {
                value: 'Necesito quedarme unos días más'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Enviar solicitud'
            })
        );

        await waitFor(() => {
            expect(solicitarExtensionReserva).toHaveBeenCalledWith(
                17,
                {
                    nueva_fecha_fin: '2026-07-13',
                    motivo: 'Necesito quedarme unos días más'
                }
            );
        });

        await waitFor(() => {
            expect(onRegistradaMock).toHaveBeenCalled();
        });

        expect(
            screen.getByText('Solicitud de extensión enviada correctamente')
        ).toBeInTheDocument();
    });

    test('HU13-FE-COMP-05: Debe enviar motivo undefined si el motivo está vacío', async () => {
        vi.mocked(solicitarExtensionReserva).mockResolvedValue({
            mensaje: 'Solicitud de extensión enviada correctamente',
            reserva: {
                reserva_id: 17,
                inmueble_id: 6,
                estado_reserva: 'APROBADA',
                fecha_inicio: '2026-07-09',
                fecha_fin_actual: '2026-07-10',
                codigo_inmueble: 'LOC-101',
                nombre_inmueble: 'Local 101',
                titulo_publicacion: 'Local comercial'
            },
            solicitud_extension: {
                solicitud_extension_id: 1,
                reserva_id: 17,
                solicitante_usuario_id: 8,
                nueva_fecha_fin: '2026-07-13',
                motivo: null,
                estado: 'PENDIENTE',
                fecha_solicitud: '2026-07-02T00:00:00.000Z',
                fecha_decision: null,
                decidido_por_usuario_id: null,
                comentario_decision: null
            },
            evento: {
                reserva_evento_id: 200,
                reserva_id: 17,
                usuario_id: 8,
                tipo_evento: 'EXTENSION',
                descripcion: 'El inquilino envió una solicitud de extensión de la reserva.',
                fecha_evento: '2026-07-02T00:00:00.000Z'
            }
        });

        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        fireEvent.change(
            screen.getByLabelText('Nueva fecha de finalización'),
            {
                target: {
                    value: '2026-07-13'
                }
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Enviar solicitud'
            })
        );

        await waitFor(() => {
            expect(solicitarExtensionReserva).toHaveBeenCalledWith(
                17,
                {
                    nueva_fecha_fin: '2026-07-13',
                    motivo: undefined
                }
            );
        });
    });

    test('HU13-FE-COMP-06: No debe enviar la solicitud si la nueva fecha no es posterior a la fecha actual', () => {
        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        const inputFecha = screen.getByLabelText(
            'Nueva fecha de finalización'
        ) as HTMLInputElement;

        fireEvent.change(inputFecha, {
            target: {
                value: '2026-07-10'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Enviar solicitud'
            })
        );

        expect(inputFecha.value).toBe('2026-07-10');
        expect(inputFecha.min).toBe('2026-07-11');

        expect(
            screen.getByText(/Debe ser posterior al/i)
        ).toBeInTheDocument();

        expect(solicitarExtensionReserva).not.toHaveBeenCalled();
    });

    test('HU13-FE-COMP-07: Debe mostrar alerta si ya existe una solicitud pendiente', () => {
        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={crearExtensionPendienteMock()}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        expect(
            screen.getByText(/Ya existe una solicitud pendiente/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Enviar solicitud'
            })
        ).toBeDisabled();
    });

    test('HU13-FE-COMP-08: Debe mostrar error si el backend rechaza la solicitud', async () => {
        vi.mocked(solicitarExtensionReserva).mockRejectedValue(
            new Error('Ya existe una solicitud pendiente para esta reserva')
        );

        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        fireEvent.change(
            screen.getByLabelText('Nueva fecha de finalización'),
            {
                target: {
                    value: '2026-07-13'
                }
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Enviar solicitud'
            })
        );

        expect(
            await screen.findByText(
                'Ya existe una solicitud pendiente para esta reserva'
            )
        ).toBeInTheDocument();

        expect(onRegistradaMock).not.toHaveBeenCalled();
    });

    test('HU13-FE-COMP-09: Debe cerrar el diálogo al presionar Cancelar', () => {
        render(
            <SolicitudExtensionDialog
                abierto={true}
                solicitud={crearSolicitudMock()}
                extensionPendiente={null}
                onCerrar={onCerrarMock}
                onRegistrada={onRegistradaMock}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancelar'
            })
        );

        expect(onCerrarMock).toHaveBeenCalled();
    });
});