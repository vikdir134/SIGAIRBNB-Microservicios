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

import DetalleGestionReservaDialog from './DetalleGestionReservaDialog';

import {
    aprobarSolicitudExtensionGestion,
    obtenerEventosReservaGestion,
    rechazarSolicitudExtensionGestion
} from '../services/reservaService';

import {
    descargarReciboPdf,
    generarReciboReservaGestion,
    listarRecibosReserva,
    obtenerNumeroVisualRecibo,
    previsualizarReciboReservaGestion,
    verReciboPdf
} from '../services/reciboService';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock
}));

vi.mock('../services/reservaService', () => ({
    obtenerEventosReservaGestion: vi.fn(),
    aprobarSolicitudExtensionGestion: vi.fn(),
    rechazarSolicitudExtensionGestion: vi.fn()
}));

vi.mock('../services/reciboService', () => ({
    previsualizarReciboReservaGestion: vi.fn(),
    generarReciboReservaGestion: vi.fn(),
    listarRecibosReserva: vi.fn(),
    descargarReciboPdf: vi.fn(),
    verReciboPdf: vi.fn(),
    obtenerNumeroVisualRecibo: vi.fn((recibo) => {
        if (
            recibo.serie_empresa &&
            recibo.correlativo_empresa
        ) {
            return `${recibo.serie_empresa}-${String(
                recibo.correlativo_empresa
            ).padStart(6, '0')}`;
        }

        return `B-${String(recibo.recibo_id).padStart(6, '0')}`;
    })
}));

const crearReservaMock = () => ({
    reserva_id: 15,
    inmueble_id: 6,
    inquilino_id: 8,
    estado_reserva: 'APROBADA',
    fecha_inicio: '2026-07-10',
    fecha_fin: '2026-07-15',
    codigo_inmueble: 'DEP-101',
    nombre_inmueble: 'Departamento 101',
    tipo_inmueble: 'DEPARTAMENTO'
});

const crearEventosResponseMock = () => ({
    mensaje: 'Eventos obtenidos correctamente',
    reserva: crearReservaMock(),
    eventos: [
        {
            reserva_evento_id: 1,
            reserva_id: 15,
            usuario_id: 3,
            tipo_evento: 'APROBACION',
            descripcion: 'Reserva aprobada por el administrador.',
            fecha_evento: '2026-07-01T10:00:00.000Z',
            nombres_usuario: 'Administrador',
            apellidos_usuario: 'Sistema',
            correo_usuario: 'admin@test.com'
        }
    ],
    solicitud_extension_pendiente: null
});

const crearPreviewMock = () => ({
    mensaje: 'Vista previa de boleta generada correctamente',
    reserva: crearReservaMock(),
    conceptos: [
        {
            concepto_cobro_id: 1,
            codigo: 'RENTA_RESERVA',
            descripcion: 'Renta de reserva (5 día(s))',
            cantidad: 5,
            precio_unitario: 100,
            importe: 500,
            aplica_igv: true,
            orden_impresion: 1,
            igv: 90,
            total_linea: 590,
            obligatorio: true,
            editable: false
        },
        {
            concepto_cobro_id: 2,
            codigo: 'LIMPIEZA',
            descripcion: 'Limpieza final',
            cantidad: 1,
            precio_unitario: 50,
            importe: 50,
            aplica_igv: true,
            orden_impresion: 2,
            igv: 9,
            total_linea: 59,
            obligatorio: false,
            editable: true
        }
    ],
    subtotal: 550,
    igv_total: 99,
    total: 649,
    dias_reserva: 5,
    fecha_vencimiento: '2026-07-16'
});

const crearReciboMock = () => ({
    recibo_id: 25,
    cuenta_cobro_inmueble_id: 10,
    reserva_id: 15,
    periodo_anio: 2026,
    periodo_mes: 7,
    fecha_emision: '2026-07-10',
    fecha_vencimiento: '2026-07-16',
    estado_recibo: 'EMITIDO',
    subtotal: 550,
    igv_total: 99,
    total: 649,
    saldo_pendiente: 649,
    moneda: 'PEN',
    serie_empresa: 'B001',
    correlativo_empresa: 25
});

describe('HU15 - DetalleGestionReservaDialog', () => {
    const onCerrarMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue(
            crearEventosResponseMock() as any
        );

        vi.mocked(listarRecibosReserva).mockResolvedValue({
            mensaje: 'Boletas de la reserva obtenidas correctamente',
            recibos: []
        } as any);

        vi.mocked(previsualizarReciboReservaGestion).mockResolvedValue(
            crearPreviewMock() as any
        );

        vi.mocked(generarReciboReservaGestion).mockResolvedValue({
            mensaje: 'Boleta digital generada correctamente.',
            recibo: crearReciboMock(),
            detalles: []
        } as any);

        vi.mocked(descargarReciboPdf).mockResolvedValue();
        vi.mocked(verReciboPdf).mockResolvedValue();

        vi.mocked(aprobarSolicitudExtensionGestion).mockResolvedValue(
            {} as any
        );

        vi.mocked(rechazarSolicitudExtensionGestion).mockResolvedValue(
            {} as any
        );
    });

    test('CP-HU15-FE-COMP-01 no renderiza el diálogo cuando está cerrado', () => {
        render(
            <DetalleGestionReservaDialog
                abierto={false}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            screen.queryByText('Boleta digital')
        ).not.toBeInTheDocument();
    });

    test('CP-HU15-FE-COMP-02 carga el historial y muestra la sección de boleta digital', async () => {
        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            await screen.findByText('Departamento 101')
        ).toBeInTheDocument();

        expect(obtenerEventosReservaGestion).toHaveBeenCalledWith(15);
        expect(listarRecibosReserva).toHaveBeenCalledWith(15);

        expect(
            screen.getByText('Esta reserva todavía no tiene una boleta digital generada.')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Revisar boleta'
            })
        ).toBeEnabled();
    });

    test('CP-HU15-FE-COMP-03 abre la vista previa de la boleta digital', async () => {
        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        const botonRevisar = await screen.findByRole('button', {
            name: 'Revisar boleta'
        });

        fireEvent.click(botonRevisar);

        await waitFor(() => {
            expect(previsualizarReciboReservaGestion).toHaveBeenCalledWith(15);
        });

        expect(
            await screen.findByText('Revisión previa')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Renta de reserva (5 día(s))')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Limpieza final')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Confirmar emisión'
            })
        ).toBeInTheDocument();
    });

    test('CP-HU15-FE-COMP-04 confirma la emisión de la boleta enviando conceptos editables', async () => {
        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Revisar boleta'
            })
        );

        expect(
            await screen.findByText('Limpieza final')
        ).toBeInTheDocument();

        const inputsNumericos = screen.getAllByRole(
            'spinbutton'
        ) as HTMLInputElement[];

        fireEvent.change(inputsNumericos[0], {
            target: {
                value: '2'
            }
        });

        fireEvent.change(inputsNumericos[1], {
            target: {
                value: '60'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Confirmar emisión'
            })
        );

        await waitFor(() => {
            expect(generarReciboReservaGestion).toHaveBeenCalledWith(
                15,
                'Boleta digital emitida luego de revisión de conceptos de cobro.',
                [
                    {
                        concepto_cobro_id: 2,
                        cantidad: 2,
                        precio_unitario: 60
                    }
                ]
            );
        });

        expect(
            await screen.findByText('Boleta digital generada correctamente.')
        ).toBeInTheDocument();
    });

    test('CP-HU15-FE-COMP-05 muestra error si falla la vista previa de la boleta', async () => {
        vi.mocked(previsualizarReciboReservaGestion).mockRejectedValue(
            new Error('La reserva ya tiene una boleta digital generada.')
        );

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Revisar boleta'
            })
        );

        expect(
            await screen.findByText('La reserva ya tiene una boleta digital generada.')
        ).toBeInTheDocument();

        expect(
            screen.getByText('No se puede generar la boleta')
        ).toBeInTheDocument();
    });

    test('CP-HU15-FE-COMP-06 muestra una boleta emitida y permite ver y descargar PDF', async () => {
        vi.mocked(listarRecibosReserva).mockResolvedValue({
            mensaje: 'Boletas de la reserva obtenidas correctamente',
            recibos: [crearReciboMock()]
        } as any);

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        expect(
            await screen.findByText('Boleta digital B001-000025')
        ).toBeInTheDocument();

        expect(obtenerNumeroVisualRecibo).toHaveBeenCalledWith(
            expect.objectContaining({
                recibo_id: 25,
                serie_empresa: 'B001',
                correlativo_empresa: 25
            })
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Ver PDF'
            })
        );

        await waitFor(() => {
            expect(verReciboPdf).toHaveBeenCalledWith(25);
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Descargar PDF'
            })
        );

        await waitFor(() => {
            expect(descargarReciboPdf).toHaveBeenCalledWith(25);
        });
    });

    test('CP-HU15-FE-COMP-07 deshabilita la generación si la reserva no está en estado permitido', async () => {
        vi.mocked(obtenerEventosReservaGestion).mockResolvedValue({
            ...crearEventosResponseMock(),
            reserva: {
                ...crearReservaMock(),
                estado_reserva: 'SOLICITADA'
            }
        } as any);

        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        const botonRevisar = await screen.findByRole('button', {
            name: 'Revisar boleta'
        });

        expect(botonRevisar).toBeDisabled();

        expect(
            screen.getByText(/Solo se puede generar boleta para reservas aprobadas/i)
        ).toBeInTheDocument();
    });

    test('CP-HU15-FE-COMP-08 navega a gestión de conceptos desde la vista previa', async () => {
        render(
            <DetalleGestionReservaDialog
                abierto={true}
                reservaId={15}
                onCerrar={onCerrarMock}
            />
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Revisar boleta'
            })
        );

        expect(
            await screen.findByText('Revisión previa')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Gestionar conceptos'
            })
        );

        expect(onCerrarMock).toHaveBeenCalled();
        expect(navigateMock).toHaveBeenCalledWith(
            '/gestion/conceptos-cobro'
        );
    });
});