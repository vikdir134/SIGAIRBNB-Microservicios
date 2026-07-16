import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import GestionConceptosCobro from './GestionConceptosCobro';

import {
    actualizarConceptoCobro,
    cambiarEstadoConceptoCobro,
    crearConceptoCobro,
    listarConceptosCobro
} from '../services/conceptosCobroService';

import type { ConceptoCobro } from '../services/conceptosCobroService';

vi.mock('../components/SidebarGestion', () => ({
    default: () => <aside data-testid="sidebar-gestion">Sidebar Gestión</aside>
}));

vi.mock('../services/conceptosCobroService', () => ({
    listarConceptosCobro: vi.fn(),
    crearConceptoCobro: vi.fn(),
    actualizarConceptoCobro: vi.fn(),
    cambiarEstadoConceptoCobro: vi.fn()
}));

const listarConceptosCobroMock = vi.mocked(listarConceptosCobro);
const crearConceptoCobroMock = vi.mocked(crearConceptoCobro);
const actualizarConceptoCobroMock = vi.mocked(actualizarConceptoCobro);
const cambiarEstadoConceptoCobroMock = vi.mocked(cambiarEstadoConceptoCobro);

const crearConceptoMock = (
    overrides: Partial<ConceptoCobro> = {}
): ConceptoCobro => ({
    concepto_cobro_id: 2,
    codigo: 'LIMPIEZA_FINAL',
    nombre: 'Limpieza final',
    descripcion: 'Cobro por limpieza final del inmueble',
    tipo_concepto: 'SERVICIO',
    categoria: 'LIMPIEZA',
    metodo_calculo: 'MONTO_FIJO',
    aplica_en: 'RESERVA',
    aplica_desde_dias: 1,
    aplica_igv: true,
    monto_default: 120,
    orden_impresion: 2,
    es_obligatorio: false,
    prorrateable: false,
    permite_pago_online: true,
    es_sistema: false,
    editable: true,
    activo: true,
    ...overrides
});

describe('HU17 - GestionConceptosCobro Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU17-FE-PAGE-01 muestra estado de carga inicial', async () => {
        listarConceptosCobroMock.mockReturnValueOnce(new Promise(() => {}));

        render(<GestionConceptosCobro />);

        expect(screen.getByText('Cargando conceptos...')).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-02 carga y muestra conceptos de cobro', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([
            crearConceptoMock(),
            crearConceptoMock({
                concepto_cobro_id: 1,
                codigo: 'RENTA_RESERVA',
                nombre: 'Renta de reserva',
                descripcion: 'Cobro principal de alquiler',
                categoria: 'RENTA',
                tipo_concepto: 'FIJO',
                metodo_calculo: 'RENTA_RESERVA',
                es_sistema: true,
                editable: false
            })
        ]);

        render(<GestionConceptosCobro />);

        expect(
            await screen.findByText('Gestión de conceptos')
        ).toBeInTheDocument();

        expect(await screen.findByText('LIMPIEZA_FINAL')).toBeInTheDocument();
        expect(screen.getByText('Limpieza final')).toBeInTheDocument();
        expect(screen.getAllByText('RENTA_RESERVA').length).toBeGreaterThan(0);
        expect(screen.getByText('Sistema')).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-03 muestra estado vacío si no hay conceptos', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([]);

        render(<GestionConceptosCobro />);

        expect(
            await screen.findByText('No hay conceptos registrados.')
        ).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-04 abre modal para crear nuevo concepto', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([]);

        render(<GestionConceptosCobro />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Nuevo concepto'
            })
        );

        expect(
            screen.getByRole('heading', {
                name: 'Nuevo concepto'
            })
        ).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Ej: COCHERA')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ej: Cochera')).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-05 crea concepto de cobro correctamente', async () => {
        const conceptoCreado = crearConceptoMock({
            concepto_cobro_id: 5,
            codigo: 'COCHERA',
            nombre: 'Cochera',
            descripcion: 'Cobro por cochera',
            monto_default: 200
        });

        listarConceptosCobroMock
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([conceptoCreado]);

        crearConceptoCobroMock.mockResolvedValueOnce(conceptoCreado);

        render(<GestionConceptosCobro />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Nuevo concepto'
            })
        );

        fireEvent.change(screen.getByPlaceholderText('Ej: COCHERA'), {
            target: {
                value: 'COCHERA'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej: Cochera'), {
            target: {
                value: 'Cochera'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Descripción del concepto'), {
            target: {
                value: 'Cobro por cochera'
            }
        });

        fireEvent.change(screen.getByDisplayValue('0'), {
            target: {
                value: '200'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Guardar'
            })
        );

        await waitFor(() => {
            expect(crearConceptoCobroMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    codigo: 'COCHERA',
                    nombre: 'Cochera',
                    descripcion: 'Cobro por cochera',
                    monto_default: 200
                })
            );
        });

        expect(
            await screen.findByText('Concepto creado correctamente.')
        ).toBeInTheDocument();

        expect(await screen.findByText('COCHERA')).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-06 abre modal de edición para concepto editable', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([crearConceptoMock()]);

        render(<GestionConceptosCobro />);

        const botonesEditar = await screen.findAllByRole('button', {
            name: 'Editar'
        });

        fireEvent.click(botonesEditar[0]);

        expect(
            screen.getByRole('heading', {
                name: 'Editar concepto'
            })
        ).toBeInTheDocument();

        expect(screen.getByDisplayValue('Limpieza final')).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('Ej: COCHERA')
        ).not.toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-07 actualiza concepto de cobro correctamente', async () => {
        const conceptoActualizado = crearConceptoMock({
            nombre: 'Limpieza profunda',
            monto_default: 150
        });

        listarConceptosCobroMock
            .mockResolvedValueOnce([crearConceptoMock()])
            .mockResolvedValueOnce([conceptoActualizado]);

        actualizarConceptoCobroMock.mockResolvedValueOnce(conceptoActualizado);

        render(<GestionConceptosCobro />);

        const botonesEditar = await screen.findAllByRole('button', {
            name: 'Editar'
        });

        fireEvent.click(botonesEditar[0]);

        fireEvent.change(screen.getByDisplayValue('Limpieza final'), {
            target: {
                value: 'Limpieza profunda'
            }
        });

        fireEvent.change(screen.getByDisplayValue('120'), {
            target: {
                value: '150'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Guardar'
            })
        );

        await waitFor(() => {
            expect(actualizarConceptoCobroMock).toHaveBeenCalledWith(
                2,
                expect.objectContaining({
                    nombre: 'Limpieza profunda',
                    monto_default: 150
                })
            );
        });

        expect(
            await screen.findByText('Concepto actualizado correctamente.')
        ).toBeInTheDocument();

        expect(await screen.findByText('Limpieza profunda')).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-08 bloquea acciones de concepto del sistema', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([
            crearConceptoMock({
                concepto_cobro_id: 1,
                codigo: 'RENTA_RESERVA',
                nombre: 'Renta de reserva',
                es_sistema: true,
                editable: false
            })
        ]);

        render(<GestionConceptosCobro />);

        expect(await screen.findByText('RENTA_RESERVA')).toBeInTheDocument();

        const botonEditar = screen.getByRole('button', {
            name: 'Editar'
        });

        const botonDesactivar = screen.getByRole('button', {
            name: 'Desactivar'
        });

        expect(botonEditar).toBeDisabled();
        expect(botonDesactivar).toBeDisabled();
    });

    test('CP-HU17-FE-PAGE-09 desactiva concepto editable correctamente', async () => {
        const conceptoDesactivado = crearConceptoMock({
            activo: false
        });

        listarConceptosCobroMock
            .mockResolvedValueOnce([crearConceptoMock()])
            .mockResolvedValueOnce([conceptoDesactivado]);

        cambiarEstadoConceptoCobroMock.mockResolvedValueOnce(conceptoDesactivado);

        render(<GestionConceptosCobro />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Desactivar'
            })
        );

        await waitFor(() => {
            expect(cambiarEstadoConceptoCobroMock).toHaveBeenCalledWith(
                2,
                false
            );
        });

        expect(
            await screen.findByText('Concepto desactivado correctamente.')
        ).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-10 reactiva concepto editable correctamente', async () => {
        const conceptoInactivo = crearConceptoMock({
            activo: false
        });

        const conceptoReactivado = crearConceptoMock({
            activo: true
        });

        listarConceptosCobroMock
            .mockResolvedValueOnce([conceptoInactivo])
            .mockResolvedValueOnce([conceptoReactivado]);

        cambiarEstadoConceptoCobroMock.mockResolvedValueOnce(conceptoReactivado);

        render(<GestionConceptosCobro />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Reactivar'
            })
        );

        await waitFor(() => {
            expect(cambiarEstadoConceptoCobroMock).toHaveBeenCalledWith(
                2,
                true
            );
        });

        expect(
            await screen.findByText('Concepto reactivado correctamente.')
        ).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-11 muestra error si falla la carga de conceptos', async () => {
        listarConceptosCobroMock.mockRejectedValueOnce(
            new Error('Error interno al listar conceptos de cobro.')
        );

        render(<GestionConceptosCobro />);

        expect(
            await screen.findByText('Error interno al listar conceptos de cobro.')
        ).toBeInTheDocument();
    });

    test('CP-HU17-FE-PAGE-12 muestra error si falla el guardado del concepto', async () => {
        listarConceptosCobroMock.mockResolvedValueOnce([]);

        crearConceptoCobroMock.mockRejectedValueOnce(
            new Error('Ya existe un concepto con ese código.')
        );

        render(<GestionConceptosCobro />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Nuevo concepto'
            })
        );

        fireEvent.change(screen.getByPlaceholderText('Ej: COCHERA'), {
            target: {
                value: 'COCHERA'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej: Cochera'), {
            target: {
                value: 'Cochera'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Guardar'
            })
        );

        expect(
            await screen.findByText('Ya existe un concepto con ese código.')
        ).toBeInTheDocument();
    });
});