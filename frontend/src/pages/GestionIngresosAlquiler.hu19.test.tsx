import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import GestionIngresosAlquiler from './GestionIngresosAlquiler';

import {
    obtenerDatosFormularioIngreso,
    listarIngresosAlquiler,
    registrarIngresoAlquiler,
    type CategoriaIngreso,
    type CuentaIngreso,
    type ReciboPendienteIngreso,
    type IngresoAlquiler
} from '../services/ingresoAlquilerService';

vi.mock('../components/SidebarGestion', () => ({
    default: () => <aside data-testid="sidebar-gestion">Sidebar Gestión</aside>
}));

vi.mock('../services/ingresoAlquilerService', () => ({
    obtenerDatosFormularioIngreso: vi.fn(),
    listarIngresosAlquiler: vi.fn(),
    registrarIngresoAlquiler: vi.fn()
}));

const obtenerDatosFormularioIngresoMock = vi.mocked(obtenerDatosFormularioIngreso);
const listarIngresosAlquilerMock = vi.mocked(listarIngresosAlquiler);
const registrarIngresoAlquilerMock = vi.mocked(registrarIngresoAlquiler);

const crearCategoriaMock = (): CategoriaIngreso => ({
    categoria_movimiento_id: 8,
    nombre: 'Alquiler',
    naturaleza: 'INGRESO',
    descripcion: 'Ingresos por renta de inmuebles',
    activo: true
});

const crearCuentaMock = (): CuentaIngreso => ({
    cuenta_bancaria_id: 3,
    empresa_id: 6,
    nombre_cuenta: 'Caja Principal',
    numero_cuenta: 'CAJA-EMP-6',
    moneda: 'PEN',
    tipo_cuenta: 'CORRIENTE',
    saldo_actual: 1500,
    banco: 'Caja Interna',
    codigo_banco: 'CAJA'
});

const crearReciboPendienteMock = (): ReciboPendienteIngreso => ({
    recibo_id: 15,
    reserva_id: 44,
    periodo_anio: 2026,
    periodo_mes: 7,
    fecha_emision: '2026-07-01T00:00:00.000Z',
    fecha_vencimiento: '2026-07-10T00:00:00.000Z',
    estado_recibo: 'EMITIDO',
    subtotal: 500,
    igv_total: 90,
    total: 590,
    saldo_pendiente: 590,
    observaciones: null,
    inquilino_id: 13,
    fecha_inicio: '2026-07-01T00:00:00.000Z',
    fecha_fin: '2026-07-31T00:00:00.000Z',
    moneda: 'PEN',
    inmueble_id: 10,
    empresa_id: 6,
    codigo_inmueble: 'DEP-101',
    nombre_inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    direccion_linea1: 'Av. Principal 123',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    nombres_inquilino: 'Carlos',
    apellidos_inquilino: 'Ramos',
    numero_documento: '12345678',
    telefono_inquilino: '999999999',
    correo_inquilino: 'carlos@test.com'
});

const crearIngresoMock = (): IngresoAlquiler => ({
    pago_id: 50,
    movimiento_bancario_id: 70,
    recibo_id: 15,
    reserva_id: 44,
    usuario_pagador_id: 13,
    inquilino_id: 13,
    metodo_pago: 'TRANSFERENCIA',
    referencia: 'OP-001',
    referencia_externa: 'OP-001',
    importe: 590,
    monto: 590,
    moneda: 'PEN',
    estado_pago: 'CONFIRMADO',
    fecha_pago: '2026-07-15T00:00:00.000Z',
    fecha_confirmacion: '2026-07-15T00:00:00.000Z',
    fecha_movimiento: '2026-07-15T00:00:00.000Z',
    concepto: 'Ingreso por alquiler julio',
    descripcion: 'Cobro de alquiler del inmueble Departamento 101.',
    observaciones: 'Pago registrado manualmente',
    saldo_anterior: 1000,
    saldo_posterior: 1590,
    estado_recibo: 'PAGADO',
    total_recibo: 590,
    saldo_pendiente: 0,
    inmueble_id: 10,
    codigo_inmueble: 'DEP-101',
    inmueble: 'Departamento 101',
    tipo_inmueble: 'LOCAL',
    nombres_inquilino: 'Carlos',
    apellidos_inquilino: 'Ramos',
    tiene_movimiento_tesoreria: true
});

const configurarMocksBase = ({
    categorias = [crearCategoriaMock()],
    cuentas = [crearCuentaMock()],
    recibos = [crearReciboPendienteMock()],
    ingresos = [crearIngresoMock()]
}: {
    categorias?: CategoriaIngreso[];
    cuentas?: CuentaIngreso[];
    recibos?: ReciboPendienteIngreso[];
    ingresos?: IngresoAlquiler[];
} = {}) => {
    obtenerDatosFormularioIngresoMock.mockResolvedValue({
        categorias,
        cuentas,
        recibos_pendientes: recibos
    });

    listarIngresosAlquilerMock.mockResolvedValue(ingresos);

    registrarIngresoAlquilerMock.mockResolvedValue(crearIngresoMock());
};

describe('HU19 - GestionIngresosAlquiler Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configurarMocksBase();
    });

    test('CP-HU19-FE-PAGE-01 muestra estado de carga inicial', async () => {
        obtenerDatosFormularioIngresoMock.mockReturnValueOnce(new Promise(() => {}));
        listarIngresosAlquilerMock.mockResolvedValueOnce([]);

        render(<GestionIngresosAlquiler />);

        expect(await screen.findByText('Actualizando...')).toBeInTheDocument();
    });

    test('CP-HU19-FE-PAGE-02 carga formulario, recibos pendientes e ingresos registrados', async () => {
        render(<GestionIngresosAlquiler />);

        expect(
            await screen.findByRole('heading', {
                name: 'Registro de Ingresos de Alquiler'
            })
        ).toBeInTheDocument();

        expect(await screen.findByText('Registrar cobro manual')).toBeInTheDocument();
        expect(screen.getAllByText('Recibos pendientes').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Cobros registrados').length).toBeGreaterThan(0);

        expect(screen.getAllByText('Departamento 101').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Carlos Ramos').length).toBeGreaterThan(0);
        expect(screen.getByText('Ingreso por alquiler julio')).toBeInTheDocument();
        expect(screen.getAllByText('DEP-101').length).toBeGreaterThan(0);

        expect(obtenerDatosFormularioIngresoMock).toHaveBeenCalled();
        expect(listarIngresosAlquilerMock).toHaveBeenCalled();
    });

    test('CP-HU19-FE-PAGE-03 muestra estado vacío cuando no hay recibos ni ingresos', async () => {
        configurarMocksBase({
            recibos: [],
            ingresos: []
        });

        render(<GestionIngresosAlquiler />);

        expect(await screen.findByText('No hay recibos pendientes.')).toBeInTheDocument();
        expect(screen.getByText('Todavía no hay cobros registrados.')).toBeInTheDocument();
    });

    test('CP-HU19-FE-PAGE-04 valida recibo obligatorio antes de registrar cobro', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar cobro'
            })
        );

        expect(
            await screen.findByText('Selecciona un recibo pendiente.')
        ).toBeInTheDocument();

        expect(registrarIngresoAlquilerMock).not.toHaveBeenCalled();
    });

    test('CP-HU19-FE-PAGE-05 valida importe mayor a cero', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: {
                value: '0'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar cobro'
            })
        );

        expect(
            await screen.findByText('El importe debe ser mayor a cero.')
        ).toBeInTheDocument();

        expect(registrarIngresoAlquilerMock).not.toHaveBeenCalled();
    });

    test('CP-HU19-FE-PAGE-06 valida que el importe no supere el saldo pendiente', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('0.00'), {
            target: {
                value: '1000'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar cobro'
            })
        );

        expect(
            await screen.findByText(
                'El importe no puede superar el saldo pendiente del recibo.'
            )
        ).toBeInTheDocument();

        expect(registrarIngresoAlquilerMock).not.toHaveBeenCalled();
    });

    test('CP-HU19-FE-PAGE-07 muestra detalle del recibo seleccionado', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        expect(await screen.findByText('Recibo:')).toBeInTheDocument();
        expect(screen.getAllByText('#15').length).toBeGreaterThan(0);
        expect(screen.getAllByText('DEP-101').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Carlos Ramos').length).toBeGreaterThan(0);
        expect(screen.getByText('Monto pendiente:')).toBeInTheDocument();
    });

    test('CP-HU19-FE-PAGE-08 registra cobro manual correctamente', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        fireEvent.change(selects[1], {
            target: {
                value: 'EFECTIVO'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej. OP-123456'), {
            target: {
                value: 'OP-001'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Detalle adicional del cobro...'), {
            target: {
                value: 'Pago registrado manualmente'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar cobro'
            })
        );

        await waitFor(() => {
            expect(registrarIngresoAlquilerMock).toHaveBeenCalledWith({
                cuenta_bancaria_id: 3,
                categoria_movimiento_id: 8,
                recibo_id: 15,
                importe: 590,
                metodo_pago: 'EFECTIVO',
                referencia_externa: 'OP-001',
                observaciones: 'Pago registrado manualmente'
            });
        });

        expect(
            await screen.findByText('Cobro registrado correctamente.')
        ).toBeInTheDocument();

        expect(obtenerDatosFormularioIngresoMock).toHaveBeenCalledTimes(2);
        expect(listarIngresosAlquilerMock).toHaveBeenCalledTimes(2);
    });

    test('CP-HU19-FE-PAGE-09 limpia el formulario de cobro', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        fireEvent.change(screen.getByPlaceholderText('Ej. OP-123456'), {
            target: {
                value: 'OP-001'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Limpiar'
            })
        );

        expect((selects[0] as HTMLSelectElement).value).toBe('');
        expect((screen.getByPlaceholderText('0.00') as HTMLInputElement).value).toBe('');
        expect(
            (screen.getByPlaceholderText('Ej. OP-123456') as HTMLInputElement).value
        ).toBe('');
    });

    test('CP-HU19-FE-PAGE-10 muestra error si falla la carga de datos', async () => {
        obtenerDatosFormularioIngresoMock.mockRejectedValueOnce(
            new Error('Error interno al obtener los datos del formulario.')
        );

        render(<GestionIngresosAlquiler />);

        expect(
            await screen.findByText('Error interno al obtener los datos del formulario.')
        ).toBeInTheDocument();
    });

    test('CP-HU19-FE-PAGE-11 muestra error si falla el registro del cobro', async () => {
        registrarIngresoAlquilerMock.mockRejectedValueOnce(
            new Error('El importe no puede superar el saldo pendiente del recibo.')
        );

        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[0], {
            target: {
                value: '15'
            }
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Registrar cobro'
            })
        );

        expect(
            await screen.findByText(
                'El importe no puede superar el saldo pendiente del recibo.'
            )
        ).toBeInTheDocument();
    });

    test('CP-HU19-FE-PAGE-12 recarga datos al hacer click en Actualizar', async () => {
        render(<GestionIngresosAlquiler />);

        await screen.findByText('Registrar cobro manual');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Actualizar'
            })
        );

        await waitFor(() => {
            expect(obtenerDatosFormularioIngresoMock).toHaveBeenCalledTimes(2);
            expect(listarIngresosAlquilerMock).toHaveBeenCalledTimes(2);
        });
    });
});