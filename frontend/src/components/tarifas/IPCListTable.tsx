import type { IPC } from '../../types/tarifa.types';

interface IPCListTableProps {
  ipcLista: IPC[];
  formatearFecha: (fecha?: string | null) => string;
}

function IPCListTable({ ipcLista, formatearFecha }: IPCListTableProps) {
  return (
    <section className="tarifas-card">
      <h2>IPC registrados</h2>

      <div className="tarifas-table-wrapper">
        <table className="tarifas-table">
          <thead>
            <tr>
              <th>Año</th>
              <th>Porcentaje</th>
              <th>Publicación</th>
            </tr>
          </thead>

          <tbody>
            {ipcLista.length === 0 ? (
              <tr>
                <td colSpan={3}>No hay IPC registrados.</td>
              </tr>
            ) : (
              ipcLista.map((ipc) => (
                <tr key={ipc.indice_ipc_id}>
                  <td>{ipc.anio}</td>
                  <td>{Number(ipc.porcentaje_anual).toFixed(3)}%</td>
                  <td>{formatearFecha(ipc.fecha_publicacion)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default IPCListTable;