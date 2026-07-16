import { describe, test, expect, vi, beforeEach } from 'vitest';

import apiClient from './apiClient';

import {
    listarConceptosCobro,
    crearConceptoCobro,
    actualizarConceptoCobro,
    cambiarEstadoConceptoCobro,
    type ConceptoCobro,
    type ConceptoCobroForm
} from './conceptosCobroService';

vi.mock('./apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn()
    }
}));

const apiClientMock = vi.mocked(apiClient);

const crearConceptoMock = (): ConceptoCobro => ({
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
    activo: true
});

const crearFormMock = (): ConceptoCobroForm => ({
    codigo: 'LIMPIEZA_FINAL',
    nombre: 'Limpieza final',
    descripcion: 'Cobro por limpieza final del inmueble',
    tipo_concepto: 'SERVICIO',
    categoria: 'LIMPIEZA',
    metodo_calculo: 'MONTO_FIJO',
    aplica_en: 'RESERVA',
    aplica_desde_dias: 1,
    monto_default: 120,
    orden_impresion: 2,
    es_obligatorio: false,
    aplica_igv: true,
    prorrateable: false,
    permite_pago_online: true
});

describe('HU17 - conceptosCobroService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-HU17-FE-SRV-01 lista conceptos de cobro correctamente', async () => {
        const conceptosMock = [
            crearConceptoMock(),
            {
                ...crearConceptoMock(),
                concepto_cobro_id: 3,
                codigo: 'PENALIDAD_MORA',
                nombre: 'Penalidad por mora',
                categoria: 'PENALIDAD'
            }
        ];

        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Conceptos de cobro obtenidos correctamente.',
                conceptos: conceptosMock
            }
        });

        const resultado = await listarConceptosCobro();

        expect(apiClientMock.get).toHaveBeenCalledWith('/conceptos-cobro');
        expect(resultado).toEqual(conceptosMock);
    });

    test('CP-HU17-FE-SRV-02 retorna arreglo vacío si no hay conceptos', async () => {
        apiClientMock.get.mockResolvedValueOnce({
            data: {
                mensaje: 'Conceptos de cobro obtenidos correctamente.'
            }
        });

        const resultado = await listarConceptosCobro();

        expect(resultado).toEqual([]);
    });

    test('CP-HU17-FE-SRV-03 crea concepto de cobro correctamente', async () => {
        const formMock = crearFormMock();
        const conceptoMock = crearConceptoMock();

        apiClientMock.post.mockResolvedValueOnce({
            data: {
                mensaje: 'Concepto de cobro creado correctamente.',
                concepto: conceptoMock
            }
        });

        const resultado = await crearConceptoCobro(formMock);

        expect(apiClientMock.post).toHaveBeenCalledWith(
            '/conceptos-cobro',
            formMock
        );

        expect(resultado).toEqual(conceptoMock);
    });

    test('CP-HU17-FE-SRV-04 actualiza concepto de cobro correctamente', async () => {
        const formMock = {
            ...crearFormMock(),
            nombre: 'Limpieza profunda',
            monto_default: 150
        };

        const conceptoActualizadoMock = {
            ...crearConceptoMock(),
            nombre: 'Limpieza profunda',
            monto_default: 150
        };

        apiClientMock.put.mockResolvedValueOnce({
            data: {
                mensaje: 'Concepto de cobro actualizado correctamente.',
                concepto: conceptoActualizadoMock
            }
        });

        const resultado = await actualizarConceptoCobro(2, formMock);

        expect(apiClientMock.put).toHaveBeenCalledWith(
            '/conceptos-cobro/2',
            formMock
        );

        expect(resultado).toEqual(conceptoActualizadoMock);
    });

    test('CP-HU17-FE-SRV-05 desactiva concepto de cobro correctamente', async () => {
        const conceptoDesactivadoMock = {
            ...crearConceptoMock(),
            activo: false
        };

        apiClientMock.patch.mockResolvedValueOnce({
            data: {
                mensaje: 'Concepto de cobro desactivado correctamente.',
                concepto: conceptoDesactivadoMock
            }
        });

        const resultado = await cambiarEstadoConceptoCobro(2, false);

        expect(apiClientMock.patch).toHaveBeenCalledWith(
            '/conceptos-cobro/2/estado',
            {
                activo: false
            }
        );

        expect(resultado).toEqual(conceptoDesactivadoMock);
    });

    test('CP-HU17-FE-SRV-06 reactiva concepto de cobro correctamente', async () => {
        const conceptoReactivadoMock = {
            ...crearConceptoMock(),
            activo: true
        };

        apiClientMock.patch.mockResolvedValueOnce({
            data: {
                mensaje: 'Concepto de cobro reactivado correctamente.',
                concepto: conceptoReactivadoMock
            }
        });

        const resultado = await cambiarEstadoConceptoCobro(2, true);

        expect(apiClientMock.patch).toHaveBeenCalledWith(
            '/conceptos-cobro/2/estado',
            {
                activo: true
            }
        );

        expect(resultado).toEqual(conceptoReactivadoMock);
    });

    test('CP-HU17-FE-SRV-07 captura error del backend al listar conceptos', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Error interno al listar conceptos de cobro.'
                }
            }
        });

        await expect(listarConceptosCobro()).rejects.toThrow(
            'Error interno al listar conceptos de cobro.'
        );
    });

    test('CP-HU17-FE-SRV-08 captura error del backend al crear concepto', async () => {
        apiClientMock.post.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Ya existe un concepto con ese código.'
                }
            }
        });

        await expect(crearConceptoCobro(crearFormMock())).rejects.toThrow(
            'Ya existe un concepto con ese código.'
        );
    });

    test('CP-HU17-FE-SRV-09 captura error del backend al actualizar concepto', async () => {
        apiClientMock.put.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Este concepto es del sistema y no puede editarse.'
                }
            }
        });

        await expect(
            actualizarConceptoCobro(1, crearFormMock())
        ).rejects.toThrow('Este concepto es del sistema y no puede editarse.');
    });

    test('CP-HU17-FE-SRV-10 captura error del backend al cambiar estado', async () => {
        apiClientMock.patch.mockRejectedValueOnce({
            response: {
                data: {
                    mensaje: 'Este concepto es del sistema y no puede desactivarse.'
                }
            }
        });

        await expect(cambiarEstadoConceptoCobro(1, false)).rejects.toThrow(
            'Este concepto es del sistema y no puede desactivarse.'
        );
    });

    test('CP-HU17-FE-SRV-11 usa mensaje por defecto si backend no envía mensaje', async () => {
        apiClientMock.get.mockRejectedValueOnce({
            response: {
                data: {}
            }
        });

        await expect(listarConceptosCobro()).rejects.toThrow(
            'Error al listar conceptos de cobro'
        );
    });
});