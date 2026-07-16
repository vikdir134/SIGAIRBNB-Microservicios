import { describe, test, expect, vi, beforeEach } from 'vitest';

import apiClient from './apiClient';

import {
    registrarIPC,
    listarIPC,
    listarInmueblesConRenta,
    previsualizarAplicacionIPC,
    aplicarIPC,
    listarHistorialTarifas
} from './tarifaService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

const apiClientMock = vi.mocked(apiClient);

const crearIPCMock = () => ({
    indice_ipc_id: 4,
    anio: 2026,
    porcentaje_anual: 3.5,
    fecha_publicacion: '2026-01-15',
    activo: true,
    created_at: '2026-01-15T00:00:00.000Z'
});

const crearInmuebleMock = () => ({
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

const crearPrevisualizacionMock = () => ({
    inmueble_id: 10,
    codigo: 'DEP-101',
    nombre: 'Departamento 101',
    renta_actual: 1000,
    porcentaje_ipc: 3.5,
    monto_incremento: 35,
    nueva_renta: 1035,
    ya_aplicado: false
});

const crearAplicacionMock = () => ({
    inmueble_id: 10,
    nombre: 'Departamento 101',
    renta_anterior: 1000,
    porcentaje_ipc_aplicado: 3.5,
    monto_incremento: 35,
    nueva_renta: 1035,
    tarifa: {
        tarifa_inmueble_id: 20,
        inmueble_id: 10,
        indice_ipc_id: 4,
        renta_base_mensual: 1035,
        porcentaje_ipc_aplicado: 3.5,
        monto_incremento: 35,
        motivo: 'IPC 2026 - Actualización anual'
    }
});

const crearHistorialMock = () => ({
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

describe('HU20 - tarifaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU20-FE-SRV-01 registra IPC correctamente', async () => {
        const ipcMock = crearIPCMock();

        const payload = {
            anio: 2026,
            porcentaje_anual: 3.5,
            fecha_publicacion: '2026-01-15'
        };

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'IPC registrado correctamente.',
                ipc: ipcMock
            }
        });

        const resultado = await registrarIPC(payload);

        expect(apiClientMock.post).toHaveBeenCalledWith('/tarifas/ipc', payload);

        expect(resultado).toEqual({
            mensaje: 'IPC registrado correctamente.',
            ipc: ipcMock
        });
    });

    test('CP-HU20-FE-SRV-02 lista IPC registrados correctamente', async () => {
        const ipcMock = [crearIPCMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'IPC registrados obtenidos correctamente.',
                ipc: ipcMock
            }
        });

        const resultado = await listarIPC();

        expect(apiClientMock.get).toHaveBeenCalledWith('/tarifas/ipc');

        expect(resultado).toEqual({
            mensaje: 'IPC registrados obtenidos correctamente.',
            ipc: ipcMock
        });
    });

    test('CP-HU20-FE-SRV-03 lista inmuebles con renta correctamente', async () => {
        const inmueblesMock = [crearInmuebleMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Inmuebles con renta obtenidos correctamente.',
                inmuebles: inmueblesMock
            }
        });

        const resultado = await listarInmueblesConRenta();

        expect(apiClientMock.get).toHaveBeenCalledWith('/tarifas/inmuebles');

        expect(resultado).toEqual({
            mensaje: 'Inmuebles con renta obtenidos correctamente.',
            inmuebles: inmueblesMock
        });
    });

    test('CP-HU20-FE-SRV-04 previsualiza aplicación de IPC correctamente', async () => {
        const payload = {
            anio: 2026,
            inmueble_ids: [10]
        };

        const previsualizacionMock = [crearPrevisualizacionMock()];

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'Previsualización generada correctamente.',
                advertencia: 'Esta acción actualizará rentas futuras, no recibos anteriores.',
                previsualizacion: previsualizacionMock
            }
        });

        const resultado = await previsualizarAplicacionIPC(payload);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/tarifas/previsualizar-ipc',
            payload
        );

        expect(resultado).toEqual({
            mensaje: 'Previsualización generada correctamente.',
            advertencia: 'Esta acción actualizará rentas futuras, no recibos anteriores.',
            previsualizacion: previsualizacionMock
        });
    });

    test('CP-HU20-FE-SRV-05 aplica IPC correctamente', async () => {
        const payload = {
            anio: 2026,
            inmueble_ids: [10],
            aplicar_a_publicacion: true,
            motivo: 'Actualización anual'
        };

        const aplicacionMock = [crearAplicacionMock()];

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'IPC aplicado correctamente. Las rentas futuras fueron actualizadas.',
                advertencia: 'Esta acción actualizó rentas futuras, no recibos anteriores.',
                resumen: {
                    total_actualizados: 1,
                    actualizados: aplicacionMock
                }
            }
        });

        const resultado = await aplicarIPC(payload);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/tarifas/aplicar-ipc',
            payload
        );

        expect(resultado).toEqual({
            mensaje: 'IPC aplicado correctamente. Las rentas futuras fueron actualizadas.',
            advertencia: 'Esta acción actualizó rentas futuras, no recibos anteriores.',
            resumen: {
                total_actualizados: 1,
                actualizados: aplicacionMock
            }
        });
    });

    test('CP-HU20-FE-SRV-06 lista historial de tarifas correctamente', async () => {
        const inmuebleMock = crearInmuebleMock();
        const historialMock = [crearHistorialMock()];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Historial de tarifas obtenido correctamente.',
                inmueble: inmuebleMock,
                historial: historialMock
            }
        });

        const resultado = await listarHistorialTarifas(10);

        expect(apiClientMock.get).toHaveBeenCalledWith(
            '/tarifas/inmueble/10/historial'
        );

        expect(resultado).toEqual({
            mensaje: 'Historial de tarifas obtenido correctamente.',
            inmueble: inmuebleMock,
            historial: historialMock
        });
    });

    test('CP-HU20-FE-SRV-07 captura error con campo mensaje del backend', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Ya existe un IPC registrado para el año 2026.'
                }
            }
        });

        await expect(
            registrarIPC({
                anio: 2026,
                porcentaje_anual: 3.5,
                fecha_publicacion: '2026-01-15'
            })
        ).rejects.toThrow('Ya existe un IPC registrado para el año 2026.');
    });

    test('CP-HU20-FE-SRV-08 captura error con campo error del backend', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {
                    error: 'Error interno al listar IPC.'
                }
            }
        });

        await expect(listarIPC()).rejects.toThrow('Error interno al listar IPC.');
    });

    test('CP-HU20-FE-SRV-09 usa mensaje por defecto al fallar listado de inmuebles', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(listarInmueblesConRenta()).rejects.toThrow(
            'Error al listar los inmuebles con renta.'
        );
    });

    test('CP-HU20-FE-SRV-10 usa mensaje por defecto al fallar previsualización', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(
            previsualizarAplicacionIPC({
                anio: 2026,
                inmueble_ids: [10]
            })
        ).rejects.toThrow('Error al previsualizar la aplicación del IPC.');
    });

    test('CP-HU20-FE-SRV-11 usa mensaje por defecto al fallar aplicación de IPC', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(
            aplicarIPC({
                anio: 2026,
                inmueble_ids: [10],
                aplicar_a_publicacion: true,
                motivo: 'Actualización anual'
            })
        ).rejects.toThrow('Error al aplicar el IPC.');
    });

    test('CP-HU20-FE-SRV-12 usa mensaje por defecto al fallar historial de tarifas', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(listarHistorialTarifas(10)).rejects.toThrow(
            'Error al listar el historial de tarifas.'
        );
    });
});