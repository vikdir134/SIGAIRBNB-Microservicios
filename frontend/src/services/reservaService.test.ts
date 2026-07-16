import { describe, test, expect, vi, beforeEach } from 'vitest';
import apiClient from './apiClient';

import {
    confirmarCheckinReservaGestion,
    confirmarCheckoutReservaGestion,
    solicitarExtensionReserva,
    aprobarSolicitudExtensionGestion,
    rechazarSolicitudExtensionGestion
} from './reservaService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn()
    }
}));

describe('HU12 - reservaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('HU12-FE-SERVICE-01: Debe llamar al endpoint de check-in', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue({
            data: {
                mensaje: 'Check-in confirmado correctamente',
                reserva: {
                    reserva_id: 15,
                    estado_reserva: 'ACTIVA'
                },
                evento: {
                    reserva_evento_id: 100,
                    reserva_id: 15,
                    usuario_id: 1,
                    tipo_evento: 'CHECKIN',
                    descripcion: 'El gestor confirmó el check-in del inquilino.',
                    fecha_evento: '2026-06-28T00:00:00.000Z'
                }
            }
        });

        const response = await confirmarCheckinReservaGestion(15);

        expect(apiClient.patch).toHaveBeenCalledWith(
            '/reservas/gestion/solicitudes/15/checkin',
            {}
        );

        expect(response.mensaje).toBe('Check-in confirmado correctamente');
        expect(response.reserva.estado_reserva).toBe('ACTIVA');
        expect(response.evento.tipo_evento).toBe('CHECKIN');
    });

    test('HU12-FE-SERVICE-02: Debe llamar al endpoint de check-out', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue({
            data: {
                mensaje: 'Check-out confirmado correctamente',
                reserva: {
                    reserva_id: 15,
                    estado_reserva: 'FINALIZADA'
                },
                evento: {
                    reserva_evento_id: 101,
                    reserva_id: 15,
                    usuario_id: 1,
                    tipo_evento: 'CHECKOUT',
                    descripcion: 'El gestor confirmó el check-out del inquilino.',
                    fecha_evento: '2026-06-28T00:00:00.000Z'
                }
            }
        });

        const response = await confirmarCheckoutReservaGestion(15);

        expect(apiClient.patch).toHaveBeenCalledWith(
            '/reservas/gestion/solicitudes/15/checkout',
            {}
        );

        expect(response.mensaje).toBe('Check-out confirmado correctamente');
        expect(response.reserva.estado_reserva).toBe('FINALIZADA');
        expect(response.evento.tipo_evento).toBe('CHECKOUT');
    });
});

describe('HU13 - reservaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('HU13-FE-SERVICE-01: Debe llamar al endpoint para solicitar extensión de reserva', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({
            data: {
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
                    fecha_solicitud: '2026-06-28T00:00:00.000Z',
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
                    fecha_evento: '2026-06-28T00:00:00.000Z'
                }
            }
        });

        const response = await solicitarExtensionReserva(17, {
            nueva_fecha_fin: '2026-07-13',
            motivo: 'Necesito quedarme unos días más'
        });

        expect(apiClient.post).toHaveBeenCalledWith(
            '/reservas/mis-solicitudes/17/extensiones',
            {
                nueva_fecha_fin: '2026-07-13',
                motivo: 'Necesito quedarme unos días más'
            }
        );

        expect(response.mensaje).toBe('Solicitud de extensión enviada correctamente');
        expect(response.solicitud_extension.estado).toBe('PENDIENTE');
        expect(response.solicitud_extension.nueva_fecha_fin).toBe('2026-07-13');
        expect(response.evento.tipo_evento).toBe('EXTENSION');
    });

    test('HU13-FE-SERVICE-02: Debe llamar al endpoint para aprobar una extensión con comentario', async () => {
        vi.mocked(apiClient.put).mockResolvedValue({
            data: {
                mensaje: 'Solicitud de extensión aprobada correctamente',
                solicitud_extension: {
                    solicitud_extension_id: 1,
                    reserva_id: 17,
                    solicitante_usuario_id: 8,
                    nueva_fecha_fin: '2026-07-13',
                    motivo: 'Necesito quedarme unos días más',
                    estado: 'APROBADA',
                    fecha_solicitud: '2026-06-28T00:00:00.000Z',
                    fecha_decision: '2026-06-28T01:00:00.000Z',
                    decidido_por_usuario_id: 1,
                    comentario_decision: 'Extensión aprobada',
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
                    reserva_evento_id: 201,
                    reserva_id: 17,
                    usuario_id: 1,
                    tipo_evento: 'EXTENSION',
                    descripcion: 'La solicitud de extensión fue aprobada.',
                    fecha_evento: '2026-06-28T01:00:00.000Z'
                }
            }
        });

        const response = await aprobarSolicitudExtensionGestion(
            1,
            'Extensión aprobada'
        );

        expect(apiClient.put).toHaveBeenCalledWith(
            '/reservas/gestion/extensiones/1/aprobar',
            {
                comentario_decision: 'Extensión aprobada'
            }
        );

        expect(response.mensaje).toBe('Solicitud de extensión aprobada correctamente');
        expect(response.solicitud_extension.estado).toBe('APROBADA');
        expect(response.reserva?.fecha_fin).toBe('2026-07-13');
        expect(response.evento.tipo_evento).toBe('EXTENSION');
    });

    test('HU13-FE-SERVICE-03: Debe enviar comentario null al aprobar si no se escribe comentario', async () => {
        vi.mocked(apiClient.put).mockResolvedValue({
            data: {
                mensaje: 'Solicitud de extensión aprobada correctamente',
                solicitud_extension: {
                    solicitud_extension_id: 1,
                    reserva_id: 17,
                    solicitante_usuario_id: 8,
                    nueva_fecha_fin: '2026-07-13',
                    motivo: null,
                    estado: 'APROBADA',
                    fecha_solicitud: '2026-06-28T00:00:00.000Z',
                    fecha_decision: '2026-06-28T01:00:00.000Z',
                    decidido_por_usuario_id: 1,
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
                evento: {
                    reserva_evento_id: 202,
                    reserva_id: 17,
                    usuario_id: 1,
                    tipo_evento: 'EXTENSION',
                    descripcion: 'La solicitud de extensión fue aprobada.',
                    fecha_evento: '2026-06-28T01:00:00.000Z'
                }
            }
        });

        const response = await aprobarSolicitudExtensionGestion(1, '   ');

        expect(apiClient.put).toHaveBeenCalledWith(
            '/reservas/gestion/extensiones/1/aprobar',
            {
                comentario_decision: null
            }
        );

        expect(response.solicitud_extension.estado).toBe('APROBADA');
    });

    test('HU13-FE-SERVICE-04: Debe llamar al endpoint para rechazar una extensión', async () => {
        vi.mocked(apiClient.put).mockResolvedValue({
            data: {
                mensaje: 'Solicitud de extensión rechazada correctamente',
                solicitud_extension: {
                    solicitud_extension_id: 1,
                    reserva_id: 17,
                    solicitante_usuario_id: 8,
                    nueva_fecha_fin: '2026-07-13',
                    motivo: 'Necesito quedarme unos días más',
                    estado: 'RECHAZADA',
                    fecha_solicitud: '2026-06-28T00:00:00.000Z',
                    fecha_decision: '2026-06-28T01:00:00.000Z',
                    decidido_por_usuario_id: 1,
                    comentario_decision: 'No hay disponibilidad',
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
                evento: {
                    reserva_evento_id: 203,
                    reserva_id: 17,
                    usuario_id: 1,
                    tipo_evento: 'EXTENSION',
                    descripcion: 'La solicitud de extensión de la reserva fue rechazada.',
                    fecha_evento: '2026-06-28T01:00:00.000Z'
                }
            }
        });

        const response = await rechazarSolicitudExtensionGestion(
            1,
            '  No hay disponibilidad  '
        );

        expect(apiClient.put).toHaveBeenCalledWith(
            '/reservas/gestion/extensiones/1/rechazar',
            {
                comentario_decision: 'No hay disponibilidad'
            }
        );

        expect(response.mensaje).toBe('Solicitud de extensión rechazada correctamente');
        expect(response.solicitud_extension.estado).toBe('RECHAZADA');
        expect(response.solicitud_extension.comentario_decision).toBe('No hay disponibilidad');
        expect(response.evento.tipo_evento).toBe('EXTENSION');
    });
});