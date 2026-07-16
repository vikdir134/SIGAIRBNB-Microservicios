import type { PreviewTarifa } from '../../types/tarifa.types';

interface PreviewTarifasTableProps {
  preview: PreviewTarifa[];
  formatearMoneda: (
    valor: number | string | null | undefined,
    moneda?: string | null
  ) => string;
}

function PreviewTarifasTable({
  preview,
  formatearMoneda
}: PreviewTarifasTableProps) {
  if (preview.length === 0) return null;

  return (
    <section className="tarifas-card">
      <h2>Vista previa de actualización</h2>

      <div className="tarifas-table-wrapper">
        <table className="tarifas-table">
          <thead>
            <tr>
              <th>Inmueble</th>
              <th>IPC</th>
              <th>Renta actual</th>
              <th>Incremento</th>
              <th>Nueva renta</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {preview.map((item) => (
              <tr
                key={item.inmueble_id}
                className={item.ya_aplicado ? 'tarifas-row-warning' : ''}
              >
                <td>
                  <strong>{item.nombre || `Inmueble ${item.inmueble_id}`}</strong>
                  <span>{item.codigo || '-'}</span>
                </td>

                <td>
                  {item.anio_ipc} - {Number(item.porcentaje_ipc).toFixed(3)}%
                </td>

                <td>{formatearMoneda(item.renta_actual, item.moneda)}</td>

                <td>{formatearMoneda(item.monto_incremento, item.moneda)}</td>

                <td>
                  <strong>
                    {formatearMoneda(item.nueva_renta, item.moneda)}
                  </strong>
                </td>

                <td>
                  {item.ya_aplicado ? (
                    <span className="tarifas-badge tarifas-badge-warning">
                      Ya aplicado
                    </span>
                  ) : (
                    <span className="tarifas-badge tarifas-badge-success">
                      Listo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PreviewTarifasTable;