import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import GestionMantenimiento from './GestionMantenimiento';

import {
    listarInmueblesMantenimiento,
    darBajaInmueble,
    actualizarInmuebleMantenimiento,
    listarCatalogoCaracteristicas,
    obtenerCaracteristicasInmueble,
    actualizarCaracteristicasInmueble
} from '../services/edificioService';

import {
    obtenerDatosFormularioGasto,
    listarGastosMantenimiento,
    registrarGastoMantenimiento,
    type CategoriaGasto,
    type CuentaMantenimiento,
    type InmuebleGasto,
    type GastoMantenimiento
} from '../services/mantenimientoService';

vi.mock('../components/SidebarGestion', () => ({
    default: () => <aside data-testid="sidebar-gestion">Sidebar Gestión</aside>
}));

vi.mock('../services/edificioService', () => ({
    listarInmueblesMantenimiento: vi.fn(),
    darBajaInmueble: vi.fn(),
    actualizarInmuebleMantenimiento: vi.fn(),
    listarCatalogoCaracteristicas: vi.fn(),
    obtenerCaracteristicasInmueble: vi.fn(),
    actualizarCaracteristicasInmueble: vi.fn()
}));

vi.mock('../services/mantenimientoService', () => ({
    obtenerDatosFormularioGasto: vi.fn(),
    listarGastosMantenimiento: vi.fn(),
    registrarGastoMantenimiento: vi.fn()
}));

const listarInmueblesMantenimientoMock = vi.mocked(listarInmueblesMantenimiento);
const darBajaInmuebleMock = vi.mocked(darBajaInmueble);
const actualizarInmuebleMantenimientoMock = vi.mocked(actualizarInmuebleMantenimiento);
const listarCatalogoCaracteristicasMock = vi.mocked(listarCatalogoCaracteristicas);
const obtenerCaracteristicasInmuebleMock = vi.mocked(obtenerCaracteristicasInmueble);
const actualizarCaracteristicasInmuebleMock = vi.mocked(actualizarCaracteristicasInmueble);

const obtenerDatosFormularioGastoMock = vi.mocked(obtenerDatosFormularioGasto);
const listarGastosMantenimientoMock = vi.mocked(listarGastosMantenimiento);
const registrarGastoMantenimientoMock = vi.mocked(registrarGastoMantenimiento);

const crearCategoriaMock = (): CategoriaGasto => ({
    categoria_movimiento_id: 5,
    nombre: 'Mantenimiento',
    naturaleza: 'GASTO',
    descripcion: 'Gastos asociados a reparaciones',
    activo: true
});

const crearCuentaMock = (): CuentaMantenimiento => ({
    cuenta_bancaria_id: 3,
    empresa_id: 6,
    nombre_cuenta: 'Caja Principal de Mantenimiento',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    tipo_cuenta: 'CORRIENTE',
    saldo_actual: 1000,
    banco: 'Caja Interna',
    codigo_banco: 'CAJA_INTERNA'
});

const crearInmuebleGastoMock = (): InmuebleGasto => ({
    inmueble_id: 10,
    codigo: 'DEP-101',
    nombre: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    estado_operativo: 'DISPONIBLE'
});

const crearGastoMock = (
    overrides: Partial<GastoMantenimiento> = {}
): GastoMantenimiento => ({
    movimiento_bancario_id: 20,
    fecha_movimiento: '2026-07-15T00:00:00.000Z',
    concepto: 'Reparación de tubería',
    descripcion: 'Servicio técnico por reparación de fuga',
    importe: 250,
    referencia_externa: 'FAC-001',
    observaciones: 'Trabajo realizado correctamente',
    saldo_anterior: 1000,
    saldo_posterior: 750,
    categoria_movimiento_id: 5,
    categoria: 'Mantenimiento',
    cuenta_bancaria_id: 3,
    nombre_cuenta: 'Caja Principal de Mantenimiento',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    inmueble_id: 10,
    codigo_inmueble: 'DEP-101',
    inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    ...overrides
});

const crearInmuebleMantenimientoMock = () => ({
    inmueble_id: 10,
    codigo: 'DEP-101',
    nombre: 'Departamento 101',
    descripcion: 'Unidad de prueba',
    tipo_inmueble: 'LOCAL',
    nombre_edificio: 'Edificio Central',
    direccion_linea1: 'Av. Principal 123',
    direccion_linea2: '',
    numero: '101',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    provincia: 'Lima',
    departamento: 'Lima',
    codigo_postal: '',
    pais: 'Perú',
    subtipo_unidad: '',
    planta: '1',
    letra: 'A',
    area_m2: 80,
    num_habitaciones: 2,
    num_banos: 1,
    capacidad_personas: 4,
    renta_base_mensual: 1200,
    moneda: 'PEN',
    latitud: '',
    longitud: '',
    estado_operativo: 'DISPONIBLE',
    es_publicable: true
});

const configurarMocksBase = ({
    gastos = [crearGastoMock()],
    inmuebles = [crearInmuebleMantenimientoMock()]
}: {
    gastos?: GastoMantenimiento[];
    inmuebles?: any[];
} = {}) => {
    listarInmueblesMantenimientoMock.mockResolvedValue({
        inmuebles
    });

    obtenerDatosFormularioGastoMock.mockResolvedValue({
        mensaje: 'Datos para el formulario de gasto obtenidos correctamente.',
        categorias: [crearCategoriaMock()],
        cuentas: [crearCuentaMock()],
        inmuebles: [crearInmuebleGastoMock()]
    });

    listarGastosMantenimientoMock.mockResolvedValue({
        mensaje: 'Gastos de mantenimiento obtenidos correctamente.',
        gastos
    });

    registrarGastoMantenimientoMock.mockResolvedValue({
        mensaje: 'Gasto de mantenimiento registrado correctamente.',
        gasto: crearGastoMock()
    });

    darBajaInmuebleMock.mockResolvedValue({} as any);
    actualizarInmuebleMantenimientoMock.mockResolvedValue({} as any);
    listarCatalogoCaracteristicasMock.mockResolvedValue({
        caracteristicas: []
    } as any);
    obtenerCaracteristicasInmuebleMock.mockResolvedValue({
        caracteristicas: []
    } as any);
    actualizarCaracteristicasInmuebleMock.mockResolvedValue({} as any);
};

describe('HU18 - GestionMantenimiento Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configurarMocksBase();
    });

    test('CP-HU18-FE-PAGE-01 muestra carga inicial de gastos de mantenimiento', async () => {
        obtenerDatosFormularioGastoMock.mockReturnValueOnce(new Promise(() => {}));

        render(<GestionMantenimiento />);

        expect(
            screen.getByText('Cargando gastos de mantenimiento...')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-02 carga formulario y listado de gastos', async () => {
        render(<GestionMantenimiento />);

        expect(
            await screen.findByText('Gastos de mantenimiento')
        ).toBeInTheDocument();

        expect(await screen.findByText('Reparación de tubería')).toBeInTheDocument();
        expect(screen.getAllByText('Mantenimiento').length).toBeGreaterThan(0);
        expect(screen.getByText('FAC-001')).toBeInTheDocument();
        expect(screen.getByText('DEP-101 Departamento 101')).toBeInTheDocument();

        expect(obtenerDatosFormularioGastoMock).toHaveBeenCalled();
        expect(listarGastosMantenimientoMock).toHaveBeenCalled();
    });

    test('CP-HU18-FE-PAGE-03 muestra estado vacío cuando no hay gastos registrados', async () => {
        configurarMocksBase({
            gastos: []
        });

        render(<GestionMantenimiento />);

        expect(
            await screen.findByText('No hay gastos de mantenimiento registrados.')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-04 valida concepto obligatorio antes de registrar gasto', async () => {
        render(<GestionMantenimiento />);

        await screen.findByText('Gastos de mantenimiento');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar gasto'
            })
        );

        expect(
            await screen.findByText('Ingresa el concepto del gasto.')
        ).toBeInTheDocument();

        expect(registrarGastoMantenimientoMock).not.toHaveBeenCalled();
    });

    test('CP-HU18-FE-PAGE-05 valida importe mayor a cero antes de registrar gasto', async () => {
        render(<GestionMantenimiento />);

        fireEvent.change(
            await screen.findByPlaceholderText('Ej: Reparación de tubería'),
            {
                target: {
                    value: 'Reparación de tubería'
                }
            }
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar gasto'
            })
        );

        expect(
            await screen.findByText('El importe debe ser mayor a cero.')
        ).toBeInTheDocument();

        expect(registrarGastoMantenimientoMock).not.toHaveBeenCalled();
    });

    test('CP-HU18-FE-PAGE-06 registra gasto de mantenimiento correctamente', async () => {
        render(<GestionMantenimiento />);

        await screen.findByText('Gastos de mantenimiento');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[2], {
            target: {
                value: '10'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej: Reparación de tubería'), {
            target: {
                value: 'Reparación de tubería'
            }
        });

        fireEvent.change(screen.getByRole('spinbutton'), {
            target: {
                value: '250'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej: BOLETA-001'), {
            target: {
                value: 'FAC-001'
            }
        });

        fireEvent.change(
            screen.getByPlaceholderText('Describe brevemente el servicio o reparación.'),
            {
                target: {
                    value: 'Servicio técnico por reparación de fuga'
                }
            }
        );

        fireEvent.change(screen.getByPlaceholderText('Notas internas adicionales.'), {
            target: {
                value: 'Trabajo realizado correctamente'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar gasto'
            })
        );

        await waitFor(() => {
            expect(registrarGastoMantenimientoMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    cuenta_bancaria_id: 3,
                    categoria_movimiento_id: 5,
                    inmueble_id: 10,
                    concepto: 'Reparación de tubería',
                    importe: 250,
                    referencia_externa: 'FAC-001',
                    descripcion: 'Servicio técnico por reparación de fuga',
                    observaciones: 'Trabajo realizado correctamente'
                })
            );
        });

        expect(
            await screen.findByText('Gasto de mantenimiento registrado correctamente.')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-07 registra gasto sin inmueble asociado', async () => {
        render(<GestionMantenimiento />);

        await screen.findByText('Gastos de mantenimiento');

        fireEvent.change(screen.getByPlaceholderText('Ej: Reparación de tubería'), {
            target: {
                value: 'Compra de materiales'
            }
        });

        fireEvent.change(screen.getByRole('spinbutton'), {
            target: {
                value: '180'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar gasto'
            })
        );

        await waitFor(() => {
            expect(registrarGastoMantenimientoMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    inmueble_id: null,
                    concepto: 'Compra de materiales',
                    importe: 180
                })
            );
        });
    });

    test('CP-HU18-FE-PAGE-08 muestra error si falla la carga de gastos', async () => {
        obtenerDatosFormularioGastoMock.mockRejectedValueOnce(
            new Error('Error interno al obtener los datos del formulario.')
        );

        render(<GestionMantenimiento />);

        expect(
            await screen.findByText('Error interno al obtener los datos del formulario.')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-09 muestra error si falla el registro del gasto', async () => {
        registrarGastoMantenimientoMock.mockRejectedValueOnce(
            new Error('La cuenta bancaria no es válida para esta empresa.')
        );

        render(<GestionMantenimiento />);

        await screen.findByText('Gastos de mantenimiento');

        fireEvent.change(screen.getByPlaceholderText('Ej: Reparación de tubería'), {
            target: {
                value: 'Reparación de tubería'
            }
        });

        fireEvent.change(screen.getByRole('spinbutton'), {
            target: {
                value: '250'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar gasto'
            })
        );

        expect(
            await screen.findByText('La cuenta bancaria no es válida para esta empresa.')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-10 abre detalle del gasto registrado', async () => {
        render(<GestionMantenimiento />);

        fireEvent.click(
            await screen.findByRole('button', {
                name: 'Ver detalle'
            })
        );

        expect(
            await screen.findByRole('heading', {
                name: 'Detalle del gasto'
            })
        ).toBeInTheDocument();

        expect(screen.getAllByText('Reparación de tubería').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Caja Principal de Mantenimiento').length).toBeGreaterThan(0);
        expect(screen.getAllByText('CAJA-EMP-6').length).toBeGreaterThan(0);
    });

    test('CP-HU18-FE-PAGE-11 filtra gastos por texto', async () => {
        render(<GestionMantenimiento />);

        expect(await screen.findByText('Reparación de tubería')).toBeInTheDocument();

        fireEvent.change(
            screen.getByPlaceholderText('Buscar por concepto, referencia, categoría o inmueble'),
            {
                target: {
                    value: 'no existe'
                }
            }
        );

        expect(
            await screen.findByText('No hay gastos de mantenimiento registrados.')
        ).toBeInTheDocument();
    });

    test('CP-HU18-FE-PAGE-12 recarga datos al hacer click en Actualizar gastos', async () => {
        render(<GestionMantenimiento />);

        await screen.findByText('Gastos de mantenimiento');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Actualizar gastos'
            })
        );

        await waitFor(() => {
            expect(obtenerDatosFormularioGastoMock).toHaveBeenCalledTimes(2);
            expect(listarGastosMantenimientoMock).toHaveBeenCalledTimes(2);
        });
    });
});