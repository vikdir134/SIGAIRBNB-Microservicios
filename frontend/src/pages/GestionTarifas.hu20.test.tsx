import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import GestionTarifas from './GestionTarifas';

import {
    aplicarIPC,
    listarHistorialTarifas,
    listarIPC,
    listarInmueblesConRenta,
    previsualizarAplicacionIPC,
    registrarIPC
} from '../services/tarifaService';

import type {
    HistorialTarifa,
    InmuebleTarifa,
    IPC,
    PreviewTarifa
} from '../types/tarifa.types';

vi.mock('../components/SidebarGestion', () => ({
    default: () => <aside data-testid="sidebar-gestion">Sidebar Gestión</aside>
}));

vi.mock('../services/tarifaService', () => ({
    aplicarIPC: vi.fn(),
    listarHistorialTarifas: vi.fn(),
    listarIPC: vi.fn(),
    listarInmueblesConRenta: vi.fn(),
    previsualizarAplicacionIPC: vi.fn(),
    registrarIPC: vi.fn()
}));

const aplicarIPCMock = vi.mocked(aplicarIPC);
const listarHistorialTarifasMock = vi.mocked(listarHistorialTarifas);
const listarIPCMock = vi.mocked(listarIPC);
const listarInmueblesConRentaMock = vi.mocked(listarInmueblesConRenta);
const previsualizarAplicacionIPCMock = vi.mocked(previsualizarAplicacionIPC);
const registrarIPCMock = vi.mocked(registrarIPC);

const crearIPCMock = (): IPC => ({
    indice_ipc_id: 4,
    anio: 2026,
    porcentaje_anual: 3.5,
    fecha_publicacion: '2026-01-15',
    activo: true,
    created_at: '2026-01-15T00:00:00.000Z'
});

const crearInmuebleMock = (): InmuebleTarifa => ({
    inmueble_id: 10,
    empresa_id: 6,
    codigo: 'DEP-101',
    tipo_inmueble: 'LOCAL',
    nombre: 'Departamento 101',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    renta_base_mensual: 1000,
    moneda: 'PEN',
    estado_operativo: 'DISPONIBLE',
    activo: true,
    publicacion_id: 5,
    titulo_publicacion: 'Departamento amoblado',
    precio_publicado_mensual: 1000,
    estado_publicacion: 'PUBLICADA'
});

const crearPreviewMock = (
    overrides: Partial<PreviewTarifa> = {}
): PreviewTarifa => ({
    inmueble_id: 10,
    codigo: 'DEP-101',
    nombre: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    moneda: 'PEN',
    anio_ipc: 2026,
    indice_ipc_id: 4,
    porcentaje_ipc: 3.5,
    renta_actual: 1000,
    monto_incremento: 35,
    nueva_renta: 1035,
    ya_aplicado: false,
    ...overrides
});

const crearHistorialMock = (): HistorialTarifa => ({
    tarifa_inmueble_id: 20,
    inmueble_id: 10,
    indice_ipc_id: 4,
    anio: 2026,
    vigencia_desde: '2026-07-01',
    vigencia_hasta: null,
    renta_base_mensual: 1035,
    porcentaje_ipc_aplicado: 3.5,
    monto_incremento: 35,
    motivo: 'IPC 2026 - Actualización anual',
    aplicado_por_usuario_id: 1,
    aplicado_por_nombres: 'Admin',
    aplicado_por_apellidos: 'Sistema',
    created_at: '2026-07-01T00:00:00.000Z'
});

const configurarMocksBase = ({
    ipc = [crearIPCMock()],
    inmuebles = [crearInmuebleMock()],
    preview = [crearPreviewMock()],
    historial = [crearHistorialMock()]
}: {
    ipc?: IPC[];
    inmuebles?: InmuebleTarifa[];
    preview?: PreviewTarifa[];
    historial?: HistorialTarifa[];
} = {}) => {
    listarIPCMock.mockResolvedValue({
        mensaje: 'IPC registrados obtenidos correctamente.',
        ipc
    });

    listarInmueblesConRentaMock.mockResolvedValue({
        mensaje: 'Inmuebles con renta obtenidos correctamente.',
        inmuebles
    });

    registrarIPCMock.mockResolvedValue({
        mensaje: 'IPC registrado correctamente.',
        ipc: crearIPCMock()
    });

    previsualizarAplicacionIPCMock.mockResolvedValue({
        mensaje: 'Previsualización generada correctamente.',
        advertencia: 'Esta acción actualizará rentas futuras, no recibos anteriores.',
        ipc: crearIPCMock(),
        previsualizacion: preview
    });

    aplicarIPCMock.mockResolvedValue({
        mensaje: 'IPC aplicado correctamente. Las rentas futuras fueron actualizadas.',
        advertencia: 'Esta acción actualizó rentas futuras, no recibos anteriores.',
        resumen: {
            total_actualizados: preview.length,
            actualizados: preview
        }
    });

    listarHistorialTarifasMock.mockResolvedValue({
        mensaje: 'Historial de tarifas obtenido correctamente.',
        inmueble: crearInmuebleMock(),
        historial
    });
};

describe('HU20 - GestionTarifas Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configurarMocksBase();
    });

    test('CP-HU20-FE-PAGE-01 muestra estado de carga inicial de inmuebles', async () => {
        listarIPCMock.mockReturnValueOnce(new Promise(() => {}) as any);
        listarInmueblesConRentaMock.mockReturnValueOnce(new Promise(() => {}) as any);

        render(<GestionTarifas />);

        expect(await screen.findByText('Cargando inmuebles...')).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-02 carga IPC e inmuebles con renta correctamente', async () => {
        render(<GestionTarifas />);

        expect(
            await screen.findByRole('heading', {
                name: 'Gestión de Tarifas e IPC'
            })
        ).toBeInTheDocument();

        expect(screen.getByText('Registrar IPC anual')).toBeInTheDocument();
        expect(screen.getByText('IPC registrados')).toBeInTheDocument();
        expect(screen.getByText('Aplicar IPC a inmuebles')).toBeInTheDocument();
        expect(screen.getByText('Inmuebles con renta actual')).toBeInTheDocument();

        expect(screen.getAllByText('2026').length).toBeGreaterThan(0);
        expect(screen.getByText('3.500%')).toBeInTheDocument();
        expect(screen.getByText('Departamento 101')).toBeInTheDocument();
        expect(screen.getByText('DEP-101')).toBeInTheDocument();

        expect(listarIPCMock).toHaveBeenCalled();
        expect(listarInmueblesConRentaMock).toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-03 muestra estados vacíos si no hay IPC ni inmuebles', async () => {
        configurarMocksBase({
            ipc: [],
            inmuebles: []
        });

        render(<GestionTarifas />);

        expect(await screen.findByText('No hay IPC registrados.')).toBeInTheDocument();
        expect(screen.getByText('No hay inmuebles con renta registrada.')).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-04 registra IPC correctamente desde el formulario', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Registrar IPC anual');

        fireEvent.change(screen.getByPlaceholderText('Ej. 2026'), {
            target: {
                value: '2027'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej. 3.25'), {
            target: {
                value: '4.25'
            }
        });

        fireEvent.change(screen.getByLabelText('Fecha de publicación'), {
            target: {
                value: '2027-01-20'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar IPC'
            })
        );

        await waitFor(() => {
            expect(registrarIPCMock).toHaveBeenCalledWith({
                anio: 2027,
                porcentaje_anual: 4.25,
                fecha_publicacion: '2027-01-20'
            });
        });

        expect(await screen.findByText('IPC registrado correctamente.')).toBeInTheDocument();
        expect(listarIPCMock).toHaveBeenCalledTimes(2);
        expect(listarInmueblesConRentaMock).toHaveBeenCalledTimes(2);
    });

    test('CP-HU20-FE-PAGE-05 valida año obligatorio al registrar IPC', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<GestionTarifas />);

        await screen.findByText('Registrar IPC anual');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar IPC'
            })
        );

        expect(alertMock).toHaveBeenCalledWith(
            'El año es obligatorio y debe ser un número entero.'
        );

        expect(registrarIPCMock).not.toHaveBeenCalled();

        alertMock.mockRestore();
    });

    test('CP-HU20-FE-PAGE-06 valida porcentaje negativo al registrar IPC', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Registrar IPC anual');

        fireEvent.change(screen.getByPlaceholderText('Ej. 2026'), {
            target: {
                value: '2027'
            }
        });

        const porcentajeInput = screen.getByPlaceholderText(
            'Ej. 3.25'
        ) as HTMLInputElement;

        fireEvent.change(porcentajeInput, {
            target: {
                value: '-1'
            }
        });

        expect(porcentajeInput.validity.valid).toBe(false);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar IPC'
            })
        );

        expect(registrarIPCMock).not.toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-07 valida previsualización sin año IPC', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('Debe seleccionar un año IPC válido.')
        ).toBeInTheDocument();

        expect(previsualizarAplicacionIPCMock).not.toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-08 valida previsualización sin inmuebles seleccionados', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('Debe seleccionar al menos un inmueble para aplicar IPC.')
        ).toBeInTheDocument();

        expect(previsualizarAplicacionIPCMock).not.toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-09 previsualiza aplicación de IPC correctamente', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        await waitFor(() => {
            expect(previsualizarAplicacionIPCMock).toHaveBeenCalledWith({
                anio: 2026,
                inmueble_ids: [10]
            });
        });

        expect(
            await screen.findByText('Vista previa de actualización')
        ).toBeInTheDocument();

        expect(screen.getByText('Listo')).toBeInTheDocument();
        expect(screen.getAllByText('Departamento 101').length).toBeGreaterThan(0);
        expect(screen.getAllByText('DEP-101').length).toBeGreaterThan(0);
    });

    test('CP-HU20-FE-PAGE-10 abre confirmación y aplica IPC correctamente', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej. Actualización anual por IPC'), {
            target: {
                value: 'Actualización anual'
            }
        });

        fireEvent.click(screen.getByLabelText('Aplicar también a publicación'));

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('Vista previa de actualización')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Aplicar IPC'
            })
        );

        expect(
            await screen.findByText('Confirmar actualización de tarifas')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Sí, aplicar IPC'
            })
        );

        await waitFor(() => {
            expect(aplicarIPCMock).toHaveBeenCalledWith({
                anio: 2026,
                inmueble_ids: [10],
                aplicar_a_publicacion: true,
                motivo: 'Actualización anual'
            });
        });

        expect(
            await screen.findByText(
                'IPC aplicado correctamente. Las rentas futuras fueron actualizadas.'
            )
        ).toBeInTheDocument();

        expect(listarIPCMock).toHaveBeenCalledTimes(2);
        expect(listarInmueblesConRentaMock).toHaveBeenCalledTimes(2);
    });

    test('CP-HU20-FE-PAGE-11 bloquea aplicación si el IPC ya fue aplicado', async () => {
        configurarMocksBase({
            preview: [
                crearPreviewMock({
                    ya_aplicado: true
                })
            ]
        });

        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(await screen.findByText('Ya aplicado')).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Aplicar IPC'
            })
        );

        expect(
            await screen.findByText(
                'Hay inmuebles donde este IPC ya fue aplicado. No se puede continuar.'
            )
        ).toBeInTheDocument();

        expect(aplicarIPCMock).not.toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-12 permite cancelar la confirmación de aplicación IPC', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('Vista previa de actualización')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Aplicar IPC'
            })
        );

        expect(
            await screen.findByText('Confirmar actualización de tarifas')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancelar'
            })
        );

        expect(
            screen.queryByText('Confirmar actualización de tarifas')
        ).not.toBeInTheDocument();

        expect(aplicarIPCMock).not.toHaveBeenCalled();
    });

    test('CP-HU20-FE-PAGE-13 muestra historial de tarifas del inmueble', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Ver'
            })
        );

        await waitFor(() => {
            expect(listarHistorialTarifasMock).toHaveBeenCalledWith(10);
        });

        expect(await screen.findByText('Historial de tarifas')).toBeInTheDocument();
        expect(screen.getByText('Inmueble ID: 10')).toBeInTheDocument();
        expect(screen.getByText('IPC 2026 - Actualización anual')).toBeInTheDocument();
        expect(screen.getByText('Admin Sistema')).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-14 cierra historial de tarifas', async () => {
        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Ver'
            })
        );

        expect(await screen.findByText('Historial de tarifas')).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cerrar historial'
            })
        );

        expect(screen.queryByText('Historial de tarifas')).not.toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-15 muestra error si falla la carga inicial', async () => {
        listarIPCMock.mockRejectedValueOnce(
            new Error('Error interno al listar IPC.')
        );

        render(<GestionTarifas />);

        expect(await screen.findByText('Error interno al listar IPC.')).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-16 muestra error si falla el registro IPC', async () => {
        registrarIPCMock.mockRejectedValueOnce(
            new Error('Ya existe un IPC registrado para el año 2026.')
        );

        render(<GestionTarifas />);

        await screen.findByText('Registrar IPC anual');

        fireEvent.change(screen.getByPlaceholderText('Ej. 2026'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej. 3.25'), {
            target: {
                value: '3.5'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar IPC'
            })
        );

        expect(
            await screen.findByText('Ya existe un IPC registrado para el año 2026.')
        ).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-17 muestra error si falla la previsualización', async () => {
        previsualizarAplicacionIPCMock.mockRejectedValueOnce(
            new Error('No existe IPC registrado para el año 2026.')
        );

        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('No existe IPC registrado para el año 2026.')
        ).toBeInTheDocument();
    });

    test('CP-HU20-FE-PAGE-18 muestra error si falla la aplicación IPC', async () => {
        aplicarIPCMock.mockRejectedValueOnce(
            new Error('No se puede aplicar el mismo IPC más de una vez.')
        );

        render(<GestionTarifas />);

        await screen.findByText('Departamento 101');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Seleccionar todos'
            })
        );

        fireEvent.change(screen.getByLabelText('Año IPC'), {
            target: {
                value: '2026'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previsualizar'
            })
        );

        expect(
            await screen.findByText('Vista previa de actualización')
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Aplicar IPC'
            })
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Sí, aplicar IPC'
            })
        );

        expect(
            await screen.findByText('No se puede aplicar el mismo IPC más de una vez.')
        ).toBeInTheDocument();
    });
});