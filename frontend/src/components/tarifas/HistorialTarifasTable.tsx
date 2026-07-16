import type { HistorialTarifa } from '../../types/tarifa.types';

interface HistorialTarifasTableProps {
  inmuebleHistorialId: number | null;
  historial: HistorialTarifa[];
  onCerrar: () => void;
  formatearFecha: (fecha?: string | null) => string;
  formatearMoneda: (
    valor: number | string | null | undefined,
    moneda?: string | null
  ) => string;
}

function HistorialTarifasTable({
  inmuebleHistorialId,
  historial,
  onCerrar,
  formatearFecha,
  formatearMoneda
}: HistorialTarifasTableProps) {
  if (!inmuebleHistorialId) return null;

  return (
    <section className="tarifas-card">
      <div className="tarifas-section-header">
        <div>
          <h2>Historial de tarifas</h2>
          <p>Inmueble ID: {inmuebleHistorialId}</p>
        </div>

        <button
          type="button"
          className="tarifas-btn tarifas-btn-secondary"
          onClick={onCerrar}
        >
          Cerrar historial
        </button>
      </div>

      <div className="tarifas-table-wrapper">
        <table className="tarifas-table">
          <thead>
            <tr>
              <th>Vigencia desde</th>
              <th>Vigencia hasta</th>
              <th>Año IPC</th>
              <th>Renta</th>
              <th>Incremento</th>
              <th>Motivo</th>
              <th>Aplicado por</th>
            </tr>
          </thead>

          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay historial de tarifas para este inmueble.</td>
              </tr>
            ) : (
              historial.map((item) => (
                <tr key={item.tarifa_inmueble_id}>
                  <td>{formatearFecha(item.vigencia_desde)}</td>

                  <td>
                    {item.vigencia_hasta
                      ? formatearFecha(item.vigencia_hasta)
                      : 'Vigente'}
                  </td>

                  <td>{item.anio || '-'}</td>

                  <td>{formatearMoneda(item.renta_base_mensual)}</td>

                  <td>{formatearMoneda(item.monto_incremento)}</td>

                  <td>{item.motivo || '-'}</td>

                  <td>
                    {item.aplicado_por_nombres || item.aplicado_por_apellidos
                      ? `${item.aplicado_por_nombres || ''} ${
                          item.aplicado_por_apellidos || ''
                        }`.trim()
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HistorialTarifasTable;