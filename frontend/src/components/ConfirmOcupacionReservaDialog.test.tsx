import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import ConfirmOcupacionReservaDialog from './ConfirmOcupacionReservaDialog';
import type { SolicitudReservaGestion } from '../services/reservaService';

const solicitudMock: SolicitudReservaGestion = {
    reserva_id: 15,
    inmueble_id: 6,
    inquilino_id: 8,
    estado_reserva: 'APROBADA',

    fecha_solicitud: '2026-06-20T00:00:00.000Z',
    fecha_inicio: '2026-06-28T00:00:00.000Z',
    fecha_fin: '2026-06-30T00:00:00.000Z',

    renta_pactada_mensual: 1200,
    monto_total_estimado: 1200,
    deposito_garantia: null,
    moneda: 'PEN',

    observacion_inquilino: null,
    observacion_gestor: null,
    motivo_rechazo: null,
    fecha_decision: null,

    created_at: '2026-06-20T00:00:00.000Z',

    gestionado_por_usuario_id: null,

    correo_inquilino: 'inquilino@test.com',
    nombres_inquilino: 'Victor',
    apellidos_inquilino: 'Camargo',
    telefono_inquilino: null,

    tipo_documento: null,
    numero_documento: null,

    ingreso_mensual_referencial: null,
    tiene_aval_bancario: false,
    tiene_contrato_trabajo: false,
    tiene_garante: false,

    codigo_inmueble: 'INM-001',
    nombre_inmueble: 'Departamento Miraflores',
    tipo_inmueble: 'DEPARTAMENTO'
};

describe('HU12 - ConfirmOcupacionReservaDialog', () => {
    test('HU12-FE-01: Debe mostrar el modal de confirmación de check-in', () => {
        render(
            <ConfirmOcupacionReservaDialog
                abierto={true}
                tipo="CHECKIN"
                solicitud={solicitudMock}
                procesando={false}
                onCerrar={() => {}}
                onConfirmar={() => {}}
            />
        );

        expect(
            screen.getByRole('heading', {
                name: 'Confirmar check-in'
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Confirma el ingreso del inquilino al inmueble.')
        ).toBeInTheDocument();

        expect(screen.getByText('Victor Camargo')).toBeInTheDocument();
        expect(screen.getByText('Departamento Miraflores')).toBeInTheDocument();

        expect(
            screen.getByText('La reserva pasará a ACTIVA y el inmueble quedará OCUPADO.')
        ).toBeInTheDocument();
    });

    test('HU12-FE-02: Debe mostrar el modal de confirmación de check-out', () => {
        render(
            <ConfirmOcupacionReservaDialog
                abierto={true}
                tipo="CHECKOUT"
                solicitud={{
                    ...solicitudMock,
                    estado_reserva: 'ACTIVA'
                }}
                procesando={false}
                onCerrar={() => {}}
                onConfirmar={() => {}}
            />
        );

        expect(
            screen.getByRole('heading', {
                name: 'Confirmar check-out'
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Confirma la salida del inquilino del inmueble.')
        ).toBeInTheDocument();

        expect(
            screen.getByText('La reserva pasará a FINALIZADA y el inmueble quedará DISPONIBLE.')
        ).toBeInTheDocument();
    });

    test('HU12-FE-03: Debe ejecutar onConfirmar al hacer clic en Confirmar check-in', async () => {
        const user = userEvent.setup();
        const onConfirmar = vi.fn();

        render(
            <ConfirmOcupacionReservaDialog
                abierto={true}
                tipo="CHECKIN"
                solicitud={solicitudMock}
                procesando={false}
                onCerrar={() => {}}
                onConfirmar={onConfirmar}
            />
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmar check-in'
            })
        );

        expect(onConfirmar).toHaveBeenCalledTimes(1);
    });

    test('HU12-FE-04: Debe ejecutar onCerrar al hacer clic en Cancelar', async () => {
        const user = userEvent.setup();
        const onCerrar = vi.fn();

        render(
            <ConfirmOcupacionReservaDialog
                abierto={true}
                tipo="CHECKIN"
                solicitud={solicitudMock}
                procesando={false}
                onCerrar={onCerrar}
                onConfirmar={() => {}}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    test('HU12-FE-05: Debe mostrar Procesando cuando se confirma la ocupación', () => {
        render(
            <ConfirmOcupacionReservaDialog
                abierto={true}
                tipo="CHECKIN"
                solicitud={solicitudMock}
                procesando={true}
                onCerrar={() => {}}
                onConfirmar={() => {}}
            />
        );

        expect(screen.getByText('Procesando...')).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Procesando...'
            })
        ).toBeDisabled();

        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });

    test('HU12-FE-06: No debe renderizar nada si abierto es false', () => {
        const { container } = render(
            <ConfirmOcupacionReservaDialog
                abierto={false}
                tipo="CHECKIN"
                solicitud={solicitudMock}
                procesando={false}
                onCerrar={() => {}}
                onConfirmar={() => {}}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});