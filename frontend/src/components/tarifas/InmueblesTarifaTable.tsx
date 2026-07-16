import type { InmuebleTarifa } from '../../types/tarifa.types';

interface InmueblesTarifaTableProps {
  inmuebles: InmuebleTarifa[];
  inmueblesSeleccionados: number[];
  cargando: boolean;
  onToggleSeleccion: (inmuebleId: number) => void;
  onVerHistorial: (inmuebleId: number) => void;
  formatearMoneda: (
    valor: number | string | null | undefined,
    moneda?: string | null
  ) => string;
}

function InmueblesTarifaTable({
  inmuebles,
  inmueblesSeleccionados,
  cargando,
  onToggleSeleccion,
  onVerHistorial,
  formatearMoneda
}: InmueblesTarifaTableProps) {
  return (
    <section className="tarifas-card">
      <h2>Inmuebles con renta actual</h2>

      <div className="tarifas-table-wrapper">
        <table className="tarifas-table">
          <thead>
            <tr>
              <th></th>
              <th>Inmueble</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Renta actual</th>
              <th>Publicación</th>
              <th>Historial</th>
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={7}>Cargando inmuebles...</td>
              </tr>
            ) : inmuebles.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay inmuebles con renta registrada.</td>
              </tr>
            ) : (
              inmuebles.map((inmueble) => (
                <tr key={inmueble.inmueble_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={inmueblesSeleccionados.includes(inmueble.inmueble_id)}
                      onChange={() => onToggleSeleccion(inmueble.inmueble_id)}
                    />
                  </td>

                  <td>
                    <strong>
                      {inmueble.nombre || `Inmueble ${inmueble.inmueble_id}`}
                    </strong>
                    <span>{inmueble.codigo || '-'}</span>
                  </td>

                  <td>{inmueble.tipo_inmueble || '-'}</td>

                  <td>
                    {inmueble.distrito || inmueble.ciudad
                      ? `${inmueble.distrito || ''} ${inmueble.ciudad || ''}`.trim()
                      : inmueble.direccion_linea1 || '-'}
                  </td>

                  <td>
                    {formatearMoneda(
                      inmueble.renta_base_mensual,
                      inmueble.moneda
                    )}
                  </td>

                  <td>
                    {inmueble.publicacion_id
                      ? formatearMoneda(
                          inmueble.precio_publicado_mensual,
                          inmueble.moneda
                        )
                      : 'Sin publicación'}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="tarifas-btn-link"
                      onClick={() => onVerHistorial(inmueble.inmueble_id)}
                    >
                      Ver
                    </button>
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

export default InmueblesTarifaTable;