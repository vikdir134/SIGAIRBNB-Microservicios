import { useEffect, useMemo, useState } from 'react';
import SidebarGestion from '../components/SidebarGestion';

import IPCForm from '../components/tarifas/IPCForm';
import IPCListTable from '../components/tarifas/IPCListTable';
import AplicacionIPCPanel from '../components/tarifas/AplicacionIPCPanel';
import InmueblesTarifaTable from '../components/tarifas/InmueblesTarifaTable';
import PreviewTarifasTable from '../components/tarifas/PreviewTarifasTable';
import HistorialTarifasTable from '../components/tarifas/HistorialTarifasTable';
import ConfirmAplicarIPCDialog from '../components/tarifas/ConfirmAplicarIPCDialog';

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
  PreviewTarifa,
  RegistrarIPCData
} from '../types/tarifa.types';

import '../styles/pages/gestionTarifas.css';

function GestionTarifas() {
  const [ipcLista, setIpcLista] = useState<IPC[]>([]);
  const [inmuebles, setInmuebles] = useState<InmuebleTarifa[]>([]);
  const [preview, setPreview] = useState<PreviewTarifa[]>([]);
  const [historial, setHistorial] = useState<HistorialTarifa[]>([]);

  const [anioAplicacion, setAnioAplicacion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [aplicarAPublicacion, setAplicarAPublicacion] = useState(false);

  const [inmueblesSeleccionados, setInmueblesSeleccionados] = useState<number[]>([]);
  const [inmuebleHistorialId, setInmuebleHistorialId] = useState<number | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [cargandoAplicacion, setCargandoAplicacion] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const hayPreview = preview.length > 0;

  const hayDuplicadosEnPreview = useMemo(() => {
    return preview.some((item) => item.ya_aplicado);
  }, [preview]);

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  const formatearMoneda = (
    valor: number | string | null | undefined,
    moneda: string | null = 'PEN'
  ) => {
    const numero = Number(valor || 0);

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'PEN'
    }).format(numero);
  };

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const cargarDatosIniciales = async () => {
    try {
      setCargandoDatos(true);

      const [ipcResp, inmueblesResp] = await Promise.all([
        listarIPC(),
        listarInmueblesConRenta()
      ]);

      setIpcLista(ipcResp.ipc || []);
      setInmuebles(inmueblesResp.inmuebles || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos de tarifas.');
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleRegistrarIPC = async (data: RegistrarIPCData) => {
    try {
      limpiarMensajes();
      setCargandoRegistro(true);

      const resp = await registrarIPC(data);

      await cargarDatosIniciales();

      setMensaje(resp.mensaje || 'IPC registrado correctamente.');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar IPC.');
    } finally {
      setCargandoRegistro(false);
    }
  };

  const handleCambiarAnioAplicacion = (value: string) => {
    limpiarMensajes();
    setAnioAplicacion(value);
    setPreview([]);
  };

  const handleCambiarMotivo = (value: string) => {
    setMotivo(value);
  };

  const handleCambiarAplicarAPublicacion = (value: boolean) => {
    setAplicarAPublicacion(value);
  };

  const handleToggleSeleccion = (inmuebleId: number) => {
    limpiarMensajes();
    setPreview([]);

    setInmueblesSeleccionados((prev) => {
      if (prev.includes(inmuebleId)) {
        return prev.filter((id) => id !== inmuebleId);
      }

      return [...prev, inmuebleId];
    });
  };

  const handleSeleccionarTodos = () => {
    limpiarMensajes();
    setPreview([]);

    if (inmueblesSeleccionados.length === inmuebles.length) {
      setInmueblesSeleccionados([]);
      return;
    }

    setInmueblesSeleccionados(inmuebles.map((inmueble) => inmueble.inmueble_id));
  };

  const handlePrevisualizar = async () => {
    try {
      limpiarMensajes();

      const anio = Number(anioAplicacion);

      if (!anioAplicacion || !Number.isInteger(anio)) {
        setError('Debe seleccionar un año IPC válido.');
        return;
      }

      if (inmueblesSeleccionados.length === 0) {
        setError('Debe seleccionar al menos un inmueble para aplicar IPC.');
        return;
      }

      setCargandoPreview(true);

      const resp = await previsualizarAplicacionIPC({
        anio,
        inmueble_ids: inmueblesSeleccionados
      });

      setPreview(resp.previsualizacion || []);
      setMensaje(resp.advertencia || 'Previsualización generada correctamente.');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al previsualizar IPC.');
    } finally {
      setCargandoPreview(false);
    }
  };

  const handleAbrirConfirmacion = () => {
    limpiarMensajes();

    if (!hayPreview) {
      setError('Primero debes generar la previsualización.');
      return;
    }

    if (hayDuplicadosEnPreview) {
      setError('Hay inmuebles donde este IPC ya fue aplicado. No se puede continuar.');
      return;
    }

    setMostrarConfirmacion(true);
  };

  const handleAplicarIPC = async () => {
    try {
      limpiarMensajes();

      const anio = Number(anioAplicacion);

      if (!hayPreview) {
        setError('No se puede aplicar IPC sin previsualizar.');
        return;
      }

      if (!Number.isInteger(anio)) {
        setError('Debe seleccionar un año IPC válido.');
        return;
      }

      setCargandoAplicacion(true);

      const resp = await aplicarIPC({
        anio,
        inmueble_ids: inmueblesSeleccionados,
        aplicar_a_publicacion: aplicarAPublicacion,
        motivo: motivo.trim() || 'Actualización anual por IPC'
      });

      await cargarDatosIniciales();

      setMensaje(resp.mensaje || 'IPC aplicado correctamente.');
      setPreview([]);
      setInmueblesSeleccionados([]);
      setMotivo('');
      setAplicarAPublicacion(false);
      setMostrarConfirmacion(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar IPC.');
    } finally {
      setCargandoAplicacion(false);
    }
  };

  const handleVerHistorial = async (inmuebleId: number) => {
    try {
      limpiarMensajes();

      setInmuebleHistorialId(inmuebleId);
      setHistorial([]);
      setCargandoHistorial(true);

      const resp = await listarHistorialTarifas(inmuebleId);

      setHistorial(resp.historial || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial.');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleCerrarHistorial = () => {
    setInmuebleHistorialId(null);
    setHistorial([]);
  };

  return (
    <div className="gestion-layout">
      <SidebarGestion />

      <main className="tarifas-page">
        <section className="tarifas-header">
          <div>
            <p className="tarifas-subtitle">HU20 - Gestión de Tarifas / IPC</p>
            <h1>Gestión de Tarifas e IPC</h1>
            <p>
              Registra el IPC anual y actualiza rentas futuras de forma masiva o selectiva.
            </p>
          </div>
        </section>

        {mensaje && (
          <div className="tarifas-alert tarifas-alert-success">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="tarifas-alert tarifas-alert-error">
            {error}
          </div>
        )}

        <section className="tarifas-warning">
          Esta acción actualizará rentas futuras, no recibos anteriores.
        </section>

        <div className="tarifas-grid">
          <IPCForm
            cargando={cargandoRegistro}
            onRegistrar={handleRegistrarIPC}
          />

          <IPCListTable
            ipcLista={ipcLista}
            formatearFecha={formatearFecha}
          />
        </div>

        <AplicacionIPCPanel
          ipcLista={ipcLista}
          anioAplicacion={anioAplicacion}
          motivo={motivo}
          aplicarAPublicacion={aplicarAPublicacion}
          inmueblesSeleccionados={inmueblesSeleccionados}
          totalInmuebles={inmuebles.length}
          cargandoPreview={cargandoPreview}
          cargandoAplicacion={cargandoAplicacion}
          hayPreview={hayPreview}
          onChangeAnioAplicacion={handleCambiarAnioAplicacion}
          onChangeMotivo={handleCambiarMotivo}
          onChangeAplicarAPublicacion={handleCambiarAplicarAPublicacion}
          onSeleccionarTodos={handleSeleccionarTodos}
          onPrevisualizar={handlePrevisualizar}
          onAbrirConfirmacion={handleAbrirConfirmacion}
        />

        <InmueblesTarifaTable
          inmuebles={inmuebles}
          inmueblesSeleccionados={inmueblesSeleccionados}
          cargando={cargandoDatos}
          onToggleSeleccion={handleToggleSeleccion}
          onVerHistorial={handleVerHistorial}
          formatearMoneda={formatearMoneda}
        />

        <PreviewTarifasTable
          preview={preview}
          formatearMoneda={formatearMoneda}
        />

        {cargandoHistorial && (
          <div className="tarifas-alert tarifas-alert-info">
            Cargando historial de tarifas...
          </div>
        )}

        <HistorialTarifasTable
          inmuebleHistorialId={inmuebleHistorialId}
          historial={historial}
          onCerrar={handleCerrarHistorial}
          formatearFecha={formatearFecha}
          formatearMoneda={formatearMoneda}
        />

        <ConfirmAplicarIPCDialog
          abierto={mostrarConfirmacion}
          cantidadInmuebles={inmueblesSeleccionados.length}
          cargando={cargandoAplicacion}
          onConfirmar={handleAplicarIPC}
          onCerrar={() => setMostrarConfirmacion(false)}
        />
      </main>
    </div>
  );
}

export default GestionTarifas;