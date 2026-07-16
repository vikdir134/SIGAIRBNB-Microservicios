import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCcw,
  Search,
  Users
} from 'lucide-react';

import SidebarGestion from '../components/SidebarGestion';
import { obtenerReportePagosDeudores } from '../services/reporteService';

import type {
  EstadoReportePagos,
  FiltrosReportePagosDeudores,
  ReportePagosDeudoresData
} from '../types/reporte';

import '../styles/pages/reportePagosDeudores.css';

const obtenerFechaInicialMes = () => {
  const fecha = new Date();
  fecha.setDate(1);
  return fecha.toISOString().slice(0, 10);
};

const obtenerFechaActual = () => {
  return new Date().toISOString().slice(0, 10);
};

const formatearMoneda = (valor: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda || 'PEN'
  }).format(Number(valor || 0));
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const obtenerClaseEstado = (estado: string) => {
  const estadoNormalizado = String(estado || '').toUpperCase();

  if (estadoNormalizado === 'PAGADO') return 'estado-badge estado-pagado';
  if (estadoNormalizado === 'PENDIENTE') return 'estado-badge estado-pendiente';
  if (estadoNormalizado === 'VENCIDO') return 'estado-badge estado-vencido';

  return 'estado-badge estado-normal';
};

const obtenerNombreInquilino = (
  nombres?: string | null,
  apellidos?: string | null,
  correo?: string
) => {
  const nombreCompleto = `${nombres || ''} ${apellidos || ''}`.trim();
  return nombreCompleto || correo || 'Sin nombre';
};

function ReportePagosDeudores() {
  const [filtros, setFiltros] = useState<FiltrosReportePagosDeudores>({
    fecha_inicio: obtenerFechaInicialMes(),
    fecha_fin: obtenerFechaActual(),
    estado: 'TODOS',
    pagina: 1,
    limite: 10
  });

  const [reporte, setReporte] = useState<ReportePagosDeudoresData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReporte = async (
    filtrosConsulta: FiltrosReportePagosDeudores = filtros
  ) => {
    try {
      setCargando(true);
      setError(null);

      const data = await obtenerReportePagosDeudores(filtrosConsulta);
      setReporte(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        err?.message ||
        'No se pudo obtener el reporte de pagos y deudores.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.pagina, filtros.limite]);

  const buscarConFiltros = () => {
    const nuevosFiltros = {
      ...filtros,
      pagina: 1
    };

    setFiltros(nuevosFiltros);
    cargarReporte(nuevosFiltros);
  };

  const cambiarEstado = (estado: EstadoReportePagos) => {
    setFiltros((prev) => ({
      ...prev,
      estado
    }));
  };

  const cambiarPagina = (nuevaPagina: number) => {
    setFiltros((prev) => ({
      ...prev,
      pagina: nuevaPagina
    }));
  };

  const resumen = reporte?.resumen;

  return (
    <div className="reporte-pagos-layout">
      <SidebarGestion />

      <main className="reporte-pagos-main">
        <section className="reporte-pagos-header">
          <div>
            <h1>Reporte de Pagos y Deudores</h1>
            <p>
              Lista a los inquilinos que han pagado o mantienen deuda en un periodo.
            </p>
          </div>
        </section>

        <section className="reporte-filtros-card">
          <div className="reporte-filtros-grid">
            <div className="reporte-campo">
              <label>Fecha inicio</label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fecha_inicio: e.target.value
                  }))
                }
              />
            </div>

            <div className="reporte-campo">
              <label>Fecha fin</label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fecha_fin: e.target.value
                  }))
                }
              />
            </div>

            <div className="reporte-campo">
              <label>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => cambiarEstado(e.target.value as EstadoReportePagos)}
              >
                <option value="TODOS">Todos</option>
                <option value="PAGADO">Pagados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="VENCIDO">Vencidos</option>
                <option value="DEUDOR">Deudores</option>
              </select>
            </div>

            <div className="reporte-campo">
              <label>Registros</label>
              <select
                value={filtros.limite}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    limite: Number(e.target.value),
                    pagina: 1
                  }))
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="reporte-campo reporte-campo-boton">
              <button
                type="button"
                onClick={buscarConFiltros}
                disabled={cargando}
                className="btn-buscar-reporte"
              >
                {cargando ? (
                  <RefreshCcw size={18} className="icono-girando" />
                ) : (
                  <Search size={18} />
                )}
                Buscar
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="reporte-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {resumen && (
          <>
            <section className="reporte-kpis-grid">
              <article className="reporte-kpi-card">
                <div className="kpi-icono kpi-gris">
                  <Users size={22} />
                </div>
                <span>Inquilinos</span>
                <strong>{reporte?.total_inquilinos || 0}</strong>
              </article>

              <article className="reporte-kpi-card">
                <div className="kpi-icono kpi-verde">
                  <CheckCircle size={22} />
                </div>
                <span>Pagados</span>
                <strong>{resumen.cantidad_pagados}</strong>
              </article>

              <article className="reporte-kpi-card">
                <div className="kpi-icono kpi-amarillo">
                  <Clock size={22} />
                </div>
                <span>Pendientes</span>
                <strong>{resumen.cantidad_pendientes}</strong>
              </article>

              <article className="reporte-kpi-card">
                <div className="kpi-icono kpi-rojo">
                  <AlertCircle size={22} />
                </div>
                <span>Vencidos</span>
                <strong>{resumen.cantidad_vencidos}</strong>
              </article>

              <article className="reporte-kpi-card">
                <div className="kpi-icono kpi-azul">
                  <CreditCard size={22} />
                </div>
                <span>Pagado periodo</span>
                <strong>{formatearMoneda(resumen.total_pagado_periodo)}</strong>
              </article>
            </section>

            <section className="reporte-montos-grid">
              <article className="monto-card monto-verde">
                <span>Total pagado histórico</span>
                <strong>{formatearMoneda(resumen.total_pagado)}</strong>
              </article>

              <article className="monto-card monto-amarillo">
                <span>Deuda pendiente</span>
                <strong>{formatearMoneda(resumen.total_deuda_pendiente)}</strong>
              </article>

              <article className="monto-card monto-rojo">
                <span>Deuda vencida</span>
                <strong>{formatearMoneda(resumen.total_deuda_vencida)}</strong>
              </article>
            </section>
          </>
        )}

        <section className="reporte-tabla-card">
          <div className="reporte-tabla-header">
            <div>
              <h2>Detalle de recibos</h2>
              <p>Recibos pagados, pendientes o vencidos según el periodo consultado.</p>
            </div>

            {reporte?.paginacion && (
              <span>{reporte.paginacion.total_registros} registro(s)</span>
            )}
          </div>

          <div className="reporte-tabla-contenedor">
            <table className="reporte-tabla">
              <thead>
                <tr>
                  <th>Inquilino</th>
                  <th>Inmueble</th>
                  <th>Estado</th>
                  <th>Emisión</th>
                  <th>Vencimiento</th>
                  <th className="texto-derecha">Total</th>
                  <th className="texto-derecha">Pagado periodo</th>
                  <th className="texto-derecha">Deuda</th>
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="tabla-vacia">
                      Cargando reporte...
                    </td>
                  </tr>
                ) : reporte?.registros.length ? (
                  reporte.registros.map((item) => (
                    <tr key={item.recibo_id}>
                      <td>
                        <strong>
                          {obtenerNombreInquilino(
                            item.nombres_inquilino,
                            item.apellidos_inquilino,
                            item.correo_inquilino
                          )}
                        </strong>
                        <small>{item.correo_inquilino}</small>
                      </td>

                      <td>
                        <strong>{item.nombre_inmueble}</strong>
                        <small>{item.codigo_inmueble}</small>
                      </td>

                      <td>
                        <span className={obtenerClaseEstado(item.estado_reporte)}>
                          {item.estado_reporte}
                        </span>

                        {item.dias_vencido > 0 && (
                          <small className="dias-vencido">
                            {item.dias_vencido} día(s) vencido
                          </small>
                        )}
                      </td>

                      <td>{formatearFecha(item.fecha_emision)}</td>
                      <td>{formatearFecha(item.fecha_vencimiento)}</td>

                      <td className="texto-derecha">
                        {formatearMoneda(item.total_recibo, item.moneda)}
                      </td>

                      <td className="texto-derecha texto-verde">
                        {formatearMoneda(item.monto_pagado_periodo, item.moneda)}
                      </td>

                      <td className="texto-derecha texto-rojo">
                        {formatearMoneda(item.monto_deuda, item.moneda)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="tabla-vacia">
                      No se encontraron registros para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {reporte?.paginacion && (
            <div className="reporte-paginacion">
              <p>
                Página {reporte.paginacion.pagina_actual} de{' '}
                {reporte.paginacion.total_paginas}
              </p>

              <div>
                <button
                  type="button"
                  disabled={!reporte.paginacion.tiene_pagina_anterior}
                  onClick={() => cambiarPagina(filtros.pagina - 1)}
                >
                  Anterior
                </button>

                <button
                  type="button"
                  disabled={!reporte.paginacion.tiene_pagina_siguiente}
                  onClick={() => cambiarPagina(filtros.pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ReportePagosDeudores;