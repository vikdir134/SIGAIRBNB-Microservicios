import {
  Building2,
  CalendarCheck,
  RefreshCw,
  TrendingUp,
  WalletCards
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useMemo, useState } from 'react';

import SidebarGestion from '../components/SidebarGestion';

import {
  obtenerDashboardKpis,
  obtenerDetalleMovimientosMensuales,
  obtenerReporteFinancieroMensual
} from '../services/reporteService';

import type {
  DashboardKpisData,
  MovimientoMensual,
  ReporteFinancieroMensualFiltros,
  ResumenFinancieroMensual
} from '../types/reporte';

import '../styles/pages/GestionReporte.css';

const meses = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(monto || 0);
};

const formatearFecha = (fecha: string) => {
  if (!fecha) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(fecha));
};

const formatearNumeroCompacto = (valor: number) => {
  return new Intl.NumberFormat('es-PE', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(valor || 0);
};

const formatearPorcentaje = (valor: number) => {
  return `${Number(valor || 0).toFixed(2)}%`;
};

const coloresDistribucion = ['#16a34a', '#dc2626'];
  const limitarPorcentaje = (valor: number) => {
  if (valor < 0) return 0;
  if (valor > 100) return 100;
  return valor;
};

const obtenerTextoEstadoDashboard = (estado: string) => {
  if (estado === 'SALUDABLE') return 'El periodo muestra buenos indicadores.';
  if (estado === 'ATENCION') return 'Existen indicadores que requieren revisión.';
  if (estado === 'CRITICO') return 'El periodo presenta indicadores críticos.';
  return 'El periodo se mantiene sin variaciones relevantes.';
};
const obtenerMensajeBalance = (balance: number) => {
  if (balance > 0) return 'Balance positivo';
  if (balance < 0) return 'Balance negativo';
  return 'Balance neutro';
};

const GestionReportes = () => {
  const anioActual = new Date().getFullYear();

  const [filtros, setFiltros] = useState<ReporteFinancieroMensualFiltros>({
    anio: anioActual,
    mes: ''
  });

  const [resumen, setResumen] = useState<ResumenFinancieroMensual | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoMensual[]>([]);
  const [dashboardKpis, setDashboardKpis] = useState<DashboardKpisData | null>(
    null
  );

  const [cargando, setCargando] = useState(false);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);
  const [error, setError] = useState('');
  const [consultado, setConsultado] = useState(false);

  const filtrosValidos = useMemo(() => {
    if (!filtros.anio || !filtros.mes) return false;

    const anio = Number(filtros.anio);
    const mes = Number(filtros.mes);

    return !Number.isNaN(anio) && !Number.isNaN(mes) && mes >= 1 && mes <= 12;
  }, [filtros]);

  const hayInformacion = useMemo(() => {
    if (!resumen) return false;

    return (
      resumen.total_ingresos > 0 ||
      resumen.total_gastos > 0 ||
      resumen.balance_neto !== 0 ||
      movimientos.length > 0 ||
      Boolean(dashboardKpis?.tiene_datos)
    );
  }, [resumen, movimientos, dashboardKpis]);

 const resumenPorInmueble = useMemo(() => {
  if (!dashboardKpis) return [];

  const mapa = new Map<
    number,
    {
      inmueble_id: number;
      codigo_inmueble: string;
      inmueble: string;
      ingresos: number;
      gastos: number;
      utilidad: number;
      ocupacion: number;
      monto_pendiente: number;
      estado: string;
    }
  >();

  dashboardKpis.utilidad_por_inmueble.forEach((item) => {
    mapa.set(item.inmueble_id, {
      inmueble_id: item.inmueble_id,
      codigo_inmueble: item.codigo_inmueble,
      inmueble: item.inmueble,
      ingresos: item.ingresos,
      gastos: item.gastos,
      utilidad: item.utilidad,
      ocupacion: 0,
      monto_pendiente: 0,
      estado: 'Sin movimiento'
    });
  });

  dashboardKpis.ocupacion_por_inmueble.forEach((item) => {
    const existente = mapa.get(item.inmueble_id);

    if (existente) {
      existente.ocupacion = item.ocupacion;
    } else {
      mapa.set(item.inmueble_id, {
        inmueble_id: item.inmueble_id,
        codigo_inmueble: item.codigo_inmueble,
        inmueble: item.inmueble,
        ingresos: 0,
        gastos: 0,
        utilidad: 0,
        ocupacion: item.ocupacion,
        monto_pendiente: 0,
        estado: 'Sin movimiento'
      });
    }
  });

  dashboardKpis.recibos_pendientes_por_inmueble.forEach((item) => {
    const existente = mapa.get(item.inmueble_id);

    if (existente) {
      existente.monto_pendiente = item.monto_pendiente;
    } else {
      mapa.set(item.inmueble_id, {
        inmueble_id: item.inmueble_id,
        codigo_inmueble: item.codigo_inmueble,
        inmueble: item.inmueble,
        ingresos: 0,
        gastos: 0,
        utilidad: 0,
        ocupacion: 0,
        monto_pendiente: item.monto_pendiente,
        estado: 'Sin movimiento'
      });
    }
  });

  return Array.from(mapa.values())
    .map((item) => {
      let estado = 'Sin movimiento';

      if (item.monto_pendiente > 0) {
        estado = 'Revisar cobros';
      } else if (item.utilidad > 0 && item.ocupacion >= 60) {
        estado = 'Alto rendimiento';
      } else if (item.ocupacion < 30) {
        estado = 'Baja ocupación';
      } else if (item.utilidad > 0) {
        estado = 'Rentable';
      }

      return {
        ...item,
        estado
      };
    })
    .sort((a, b) => b.utilidad - a.utilidad);
}, [dashboardKpis]);

const lecturaRapidaDashboard = useMemo(() => {
  if (!dashboardKpis) {
    return {
      inmuebleMasRentable: null,
      inmuebleMenorOcupacion: null,
      inmuebleMayorPendiente: null
    };
  }

  const inmuebleMasRentable =
    dashboardKpis.utilidad_por_inmueble.length > 0
      ? dashboardKpis.utilidad_por_inmueble[0]
      : null;

  const inmuebleMenorOcupacion =
    dashboardKpis.ocupacion_por_inmueble.length > 0
      ? [...dashboardKpis.ocupacion_por_inmueble].sort(
          (a, b) => a.ocupacion - b.ocupacion
        )[0]
      : null;

  const inmuebleMayorPendiente =
    dashboardKpis.recibos_pendientes_por_inmueble.length > 0
      ? dashboardKpis.recibos_pendientes_por_inmueble[0]
      : null;

  return {
    inmuebleMasRentable,
    inmuebleMenorOcupacion,
    inmuebleMayorPendiente
  };
}, [dashboardKpis]);

  const handleFiltroChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFiltros((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };



  const consultarReporte = async () => {
    if (!filtrosValidos) {
      setError('Complete el año y el mes antes de consultar.');
      return;
    }

    try {
      setCargando(true);
      setCargandoDashboard(true);
      setError('');
      setConsultado(true);

      const [resumenResponse, detalleResponse, dashboardResponse] =
        await Promise.all([
          obtenerReporteFinancieroMensual(filtros),
          obtenerDetalleMovimientosMensuales(filtros),
          obtenerDashboardKpis(filtros)
        ]);

      setResumen(resumenResponse);
      setMovimientos(detalleResponse.movimientos || []);
      setDashboardKpis(dashboardResponse);
    } catch (err) {
      console.error('Error al consultar reporte financiero:', err);

      setResumen(null);
      setMovimientos([]);
      setDashboardKpis(null);
      setError('No se pudo consultar el reporte financiero mensual.');
    } finally {
      setCargando(false);
      setCargandoDashboard(false);
    }
  };

  const actualizarDashboardKpis = async () => {
    if (!filtrosValidos) {
      setError('Complete el año y el mes antes de actualizar el dashboard.');
      return;
    }

    try {
      setCargandoDashboard(true);
      setError('');

      const dashboardResponse = await obtenerDashboardKpis(filtros);
      setDashboardKpis(dashboardResponse);
    } catch (err) {
      console.error('Error al actualizar dashboard de KPIs:', err);
      setError('No se pudo actualizar el dashboard de KPIs.');
    } finally {
      setCargandoDashboard(false);
    }
  };

  return (
    <div className="gestion-reportes-layout">
      <SidebarGestion />

      <main className="gestion-reportes-main">
        <section className="gestion-reportes-header">
          <div>
            <h1>Reporte financiero mensual</h1>
            <p>
              Consulta el resumen consolidado de ingresos, gastos y balance neto
              de un periodo mensual.
            </p>
          </div>
        </section>

        <section className="reportes-card filtros-card">
          <div className="filtros-header">
            <div>
              <h2>Filtros de consulta</h2>
              <p>Seleccione el año y mes que desea revisar.</p>
            </div>
          </div>

          <div className="filtros-grid">
            <div className="form-group">
              <label htmlFor="anio">Año</label>
              <input
                id="anio"
                name="anio"
                type="number"
                min="2000"
                max="2100"
                value={filtros.anio}
                onChange={handleFiltroChange}
                placeholder="Ej. 2026"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mes">Mes</label>
              <select
                id="mes"
                name="mes"
                value={filtros.mes}
                onChange={handleFiltroChange}
              >
                <option value="">Seleccione un mes</option>
                {meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtros-actions">
              <button
                type="button"
                className="btn-consultar"
                onClick={consultarReporte}
                disabled={!filtrosValidos || cargando}
              >
                {cargando ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          </div>

          {!filtrosValidos && (
            <p className="validacion-filtros">
              Complete el año y seleccione un mes válido para consultar.
            </p>
          )}

          {error && <p className="mensaje-error">{error}</p>}
        </section>

        {cargando && (
          <section className="reportes-card estado-card">
            <p>Cargando reporte financiero mensual...</p>
          </section>
        )}

        {!cargando && resumen && (
          <section className="resumen-grid">
            <article className="resumen-card ingresos-card">
              <p>Total de ingresos</p>
              <h3>{formatearMoneda(resumen.total_ingresos)}</h3>
            </article>

            <article className="resumen-card gastos-card">
              <p>Total de gastos</p>
              <h3>{formatearMoneda(resumen.total_gastos)}</h3>
            </article>

            <article
              className={`resumen-card balance-card ${
                resumen.balance_neto > 0
                  ? 'balance-positivo'
                  : resumen.balance_neto < 0
                    ? 'balance-negativo'
                    : 'balance-neutro'
              }`}
            >
              <p>{obtenerMensajeBalance(resumen.balance_neto)}</p>
              <h3>{formatearMoneda(resumen.balance_neto)}</h3>
            </article>
          </section>
        )}

        {!cargando && dashboardKpis && (
          <section className="reportes-card dashboard-kpis-card">
            <div className="dashboard-kpis-header">
              <div>
                <h2>Dashboard de KPIs</h2>
                <p>
                  Indicadores clave de rentabilidad y ocupación del periodo{' '}
                  {dashboardKpis.periodo_nombre}.
                </p>
              </div>

              <button
                type="button"
                className="btn-refresh-dashboard"
                onClick={actualizarDashboardKpis}
                disabled={cargandoDashboard}
              >
                <RefreshCw
                  size={18}
                  className={
                    cargandoDashboard ? 'refresh-icon spin' : 'refresh-icon'
                  }
                />
                {cargandoDashboard ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            <div className="dashboard-status-row">
              <span
                className={`dashboard-status ${dashboardKpis.estado_dashboard}`}
              >
                Estado: {dashboardKpis.estado_dashboard}
              </span>

              <small>
                Última actualización:{' '}
                {new Date(
                  dashboardKpis.fecha_ultima_actualizacion
                ).toLocaleString('es-PE')}
              </small>
            </div>

            {dashboardKpis.alertas.length > 0 && (
              <div className="dashboard-alertas">
                {dashboardKpis.alertas.map((alerta, index) => (
                  <p key={`${alerta.tipo}-${index}`}>
                    <strong>{alerta.tipo}:</strong> {alerta.mensaje}
                  </p>
                ))}
              </div>
            )}

            <div className="kpis-grid">
  <article className="kpi-card kpi-card-destacada">
    <div className="kpi-card-header">
      <TrendingUp size={22} />
      <p>Margen de rentabilidad</p>
    </div>

    <h3>{dashboardKpis.resumen.margen_rentabilidad}%</h3>

    <div className="kpi-progress">
      <span
        style={{
          width: `${limitarPorcentaje(
            dashboardKpis.resumen.margen_rentabilidad
          )}%`
        }}
      />
    </div>

    <small>
      Balance: {formatearMoneda(dashboardKpis.resumen.balance_neto)}
    </small>
  </article>

  <article className="kpi-card">
    <div className="kpi-card-header">
      <Building2 size={22} />
      <p>Ocupación general</p>
    </div>

    <h3>{dashboardKpis.resumen.ocupacion_general}%</h3>

    <div className="kpi-progress ocupacion-progress">
      <span
        style={{
          width: `${limitarPorcentaje(
            dashboardKpis.resumen.ocupacion_general
          )}%`
        }}
      />
    </div>

    <small>
      {dashboardKpis.resumen.dias_ocupados} de{' '}
      {dashboardKpis.resumen.dias_disponibles} días ocupados
    </small>
  </article>

  <article className="kpi-card">
    <div className="kpi-card-header">
      <WalletCards size={22} />
      <p>Recibos pendientes</p>
    </div>

    <h3>{formatearMoneda(dashboardKpis.resumen.recibos_pendientes)}</h3>

    <small>
      {dashboardKpis.resumen.cantidad_recibos_pendientes} recibos pendientes
    </small>
  </article>

  <article className="kpi-card">
    <div className="kpi-card-header">
      <CalendarCheck size={22} />
      <p>Reservas activas</p>
    </div>

    <h3>{dashboardKpis.resumen.reservas_activas}</h3>

    <small>{dashboardKpis.resumen.recibos_vencidos} recibos vencidos</small>
  </article>
</div>
<div className="dashboard-lectura-rapida">
  <div className="lectura-card">
    <span>Estado del periodo</span>
    <strong>{dashboardKpis.estado_dashboard}</strong>
    <p>{obtenerTextoEstadoDashboard(dashboardKpis.estado_dashboard)}</p>
  </div>

  <div className="lectura-card">
    <span>Inmueble más rentable</span>
    <strong>
      {lecturaRapidaDashboard.inmuebleMasRentable
        ? lecturaRapidaDashboard.inmuebleMasRentable.codigo_inmueble
        : 'Sin datos'}
    </strong>
    <p>
      {lecturaRapidaDashboard.inmuebleMasRentable
        ? formatearMoneda(lecturaRapidaDashboard.inmuebleMasRentable.utilidad)
        : 'No hay utilidad registrada.'}
    </p>
  </div>

  <div className="lectura-card">
    <span>Menor ocupación</span>
    <strong>
      {lecturaRapidaDashboard.inmuebleMenorOcupacion
        ? lecturaRapidaDashboard.inmuebleMenorOcupacion.codigo_inmueble
        : 'Sin datos'}
    </strong>
    <p>
      {lecturaRapidaDashboard.inmuebleMenorOcupacion
        ? `${lecturaRapidaDashboard.inmuebleMenorOcupacion.ocupacion}% de ocupación`
        : 'No hay ocupación registrada.'}
    </p>
  </div>

  <div className="lectura-card">
    <span>Mayor pendiente</span>
    <strong>
      {lecturaRapidaDashboard.inmuebleMayorPendiente
        ? lecturaRapidaDashboard.inmuebleMayorPendiente.codigo_inmueble
        : 'Sin datos'}
    </strong>
    <p>
      {lecturaRapidaDashboard.inmuebleMayorPendiente
        ? formatearMoneda(
            lecturaRapidaDashboard.inmuebleMayorPendiente.monto_pendiente
          )
        : 'No hay cobros pendientes.'}
    </p>
  </div>
</div>
            <div className="dashboard-graficos-grid">
  <article className="dashboard-chart-card chart-card-wide">
    <div className="chart-header">
      <h3>Rentabilidad mensual</h3>
      <p>Comparación de ingresos, gastos y utilidad neta.</p>
    </div>

    {dashboardKpis.rentabilidad_mensual.length === 0 ? (
      <div className="chart-empty">
        No hay datos de rentabilidad mensual para graficar.
      </div>
    ) : (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dashboardKpis.rentabilidad_mensual}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" />
            <YAxis
              tickFormatter={(value) => `S/ ${formatearNumeroCompacto(Number(value))}`}
            />
            <Tooltip
              formatter={(value) => formatearMoneda(Number(value))}
              labelFormatter={(label) => `Periodo: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="gastos"
              name="Gastos"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="utilidad"
              name="Utilidad"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </article>

  <article className="dashboard-chart-card">
    <div className="chart-header">
      <h3>Utilidad por inmueble</h3>
      <p>Ranking de inmuebles según utilidad neta.</p>
    </div>

    {dashboardKpis.utilidad_por_inmueble.length === 0 ? (
      <div className="chart-empty">
        No hay utilidad por inmueble para mostrar.
      </div>
    ) : (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardKpis.utilidad_por_inmueble}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="codigo_inmueble" />
            <YAxis
              tickFormatter={(value) => `S/ ${formatearNumeroCompacto(Number(value))}`}
            />
            <Tooltip
              formatter={(value) => formatearMoneda(Number(value))}
              labelFormatter={(label) => `Inmueble: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="utilidad"
              name="Utilidad neta"
              fill="#2563eb"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </article>

  <article className="dashboard-chart-card">
    <div className="chart-header">
      <h3>Ocupación por inmueble</h3>
      <p>Porcentaje de ocupación de cada inmueble.</p>
    </div>

    {dashboardKpis.ocupacion_por_inmueble.length === 0 ? (
      <div className="chart-empty">
        No hay datos de ocupación por inmueble.
      </div>
    ) : (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardKpis.ocupacion_por_inmueble}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="codigo_inmueble" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value) => formatearPorcentaje(Number(value))}
              labelFormatter={(label) => `Inmueble: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="ocupacion"
              name="Ocupación"
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </article>
  <article className="dashboard-chart-card">
  <div className="chart-header">
    <h3>Recibos pendientes por inmueble</h3>
    <p>Monto pendiente de cobro agrupado por inmueble.</p>
  </div>

  {dashboardKpis.recibos_pendientes_por_inmueble.length === 0 ? (
    <div className="chart-empty">
      No existen recibos pendientes por inmueble.
    </div>
  ) : (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={dashboardKpis.recibos_pendientes_por_inmueble}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) =>
              `S/ ${formatearNumeroCompacto(Number(value))}`
            }
          />
          <YAxis
            type="category"
            dataKey="codigo_inmueble"
            width={90}
          />
          <Tooltip
            formatter={(value) => formatearMoneda(Number(value))}
            labelFormatter={(label) => `Inmueble: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="monto_pendiente"
            name="Monto pendiente"
            fill="#9333ea"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</article>

<article className="dashboard-chart-card">
  <div className="chart-header">
    <h3>Distribución ingresos vs gastos</h3>
    <p>Comparación visual del dinero ingresado y gastado.</p>
  </div>

  {dashboardKpis.distribucion_ingresos_gastos.every(
    (item) => Number(item.monto || 0) === 0
  ) ? (
    <div className="chart-empty">
      No hay ingresos ni gastos para graficar.
    </div>
  ) : (
    <div className="chart-container chart-container-pie">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dashboardKpis.distribucion_ingresos_gastos}
            dataKey="monto"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            outerRadius={95}
            label={({ name, value }) =>
              `${name}: ${formatearMoneda(Number(value))}`
            }
          >
            {dashboardKpis.distribucion_ingresos_gastos.map((_, index) => (
              <Cell
                key={`distribucion-${index}`}
                fill={coloresDistribucion[index % coloresDistribucion.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatearMoneda(Number(value))}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</article>
</div>
<div className="dashboard-tabla-inmuebles">
  <div className="tabla-header">
    <div>
      <h2>Resumen por inmueble</h2>
      <p>
        Consolidado de ingresos, gastos, utilidad, ocupación y cobros
        pendientes por inmueble.
      </p>
    </div>
  </div>

  {resumenPorInmueble.length === 0 ? (
    <div className="tabla-vacia">
      No hay información por inmueble para el periodo seleccionado.
    </div>
  ) : (
    <div className="tabla-responsive">
      <table className="tabla-movimientos tabla-kpis-inmuebles">
        <thead>
          <tr>
            <th>Inmueble</th>
            <th>Código</th>
            <th className="text-right">Ingresos</th>
            <th className="text-right">Gastos</th>
            <th className="text-right">Utilidad</th>
            <th className="text-right">Ocupación</th>
            <th className="text-right">Pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {resumenPorInmueble.map((item) => (
            <tr key={item.inmueble_id}>
              <td>
                <strong>{item.inmueble}</strong>
              </td>

              <td>{item.codigo_inmueble}</td>

              <td className="text-right">
                {formatearMoneda(item.ingresos)}
              </td>

              <td className="text-right">
                {formatearMoneda(item.gastos)}
              </td>

              <td
                className={`text-right ${
                  item.utilidad >= 0 ? 'utilidad-positiva' : 'utilidad-negativa'
                }`}
              >
                {formatearMoneda(item.utilidad)}
              </td>

              <td className="text-right">{item.ocupacion}%</td>

              <td className="text-right">
                {formatearMoneda(item.monto_pendiente)}
              </td>

              <td>
                <span
                  className={`badge-estado-inmueble ${
                    item.estado === 'Alto rendimiento'
                      ? 'estado-alto'
                      : item.estado === 'Revisar cobros'
                        ? 'estado-cobros'
                        : item.estado === 'Baja ocupación'
                          ? 'estado-baja'
                          : item.estado === 'Rentable'
                            ? 'estado-rentable'
                            : 'estado-neutro'
                  }`}
                >
                  {item.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
  

</div>

          </section>
        )}

        {!cargando && consultado && resumen && !hayInformacion && (
          <section className="reportes-card estado-card">
            <h3>No hay información para el periodo seleccionado</h3>
            <p>
              No se encontraron movimientos bancarios para el año y mes
              consultados. El sistema muestra los valores consolidados en cero.
            </p>
          </section>
        )}

        {!cargando && resumen && (
          <section className="reportes-card tabla-card">
            <div className="tabla-header">
              <div>
                <h2>Tabla de movimientos del mes</h2>
                <p>
                  Detalle de ingresos y gastos registrados en movimientos
                  bancarios.
                </p>
              </div>
            </div>

            {movimientos.length === 0 ? (
              <div className="tabla-vacia">
                No existen movimientos para el periodo seleccionado.
              </div>
            ) : (
              <div className="tabla-responsive">
                <table className="tabla-movimientos">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Concepto</th>
                      <th>Cuenta</th>
                      <th>Inmueble</th>
                      <th className="text-right">Importe</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.movimiento_bancario_id}>
                        <td>{formatearFecha(movimiento.fecha_movimiento)}</td>

                        <td>
                          <span
                            className={`badge-movimiento ${
                              movimiento.tipo_movimiento === 'INGRESO'
                                ? 'badge-ingreso'
                                : 'badge-gasto'
                            }`}
                          >
                            {movimiento.tipo_movimiento}
                          </span>
                        </td>

                        <td>{movimiento.categoria}</td>

                        <td>
                          <strong>{movimiento.concepto}</strong>
                          {movimiento.descripcion && (
                            <span className="descripcion-movimiento">
                              {movimiento.descripcion}
                            </span>
                          )}
                        </td>

                        <td>
                          <span>{movimiento.banco}</span>
                          <small>{movimiento.nombre_cuenta}</small>
                        </td>

                        <td>
                          {movimiento.inmueble ? (
                            <>
                              <span>{movimiento.inmueble}</span>
                              <small>{movimiento.codigo_inmueble}</small>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="text-right">
                          {formatearMoneda(Number(movimiento.importe))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default GestionReportes;