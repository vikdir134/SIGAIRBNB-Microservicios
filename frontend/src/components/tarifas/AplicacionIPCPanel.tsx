import type { IPC } from '../../types/tarifa.types';

interface AplicacionIPCPanelProps {
  ipcLista: IPC[];
  anioAplicacion: string;
  motivo: string;
  aplicarAPublicacion: boolean;
  inmueblesSeleccionados: number[];
  totalInmuebles: number;
  cargandoPreview: boolean;
  cargandoAplicacion: boolean;
  hayPreview: boolean;
  onChangeAnioAplicacion: (value: string) => void;
  onChangeMotivo: (value: string) => void;
  onChangeAplicarAPublicacion: (value: boolean) => void;
  onSeleccionarTodos: () => void;
  onPrevisualizar: () => void;
  onAbrirConfirmacion: () => void;
}

function AplicacionIPCPanel({
  ipcLista,
  anioAplicacion,
  motivo,
  aplicarAPublicacion,
  inmueblesSeleccionados,
  totalInmuebles,
  cargandoPreview,
  cargandoAplicacion,
  hayPreview,
  onChangeAnioAplicacion,
  onChangeMotivo,
  onChangeAplicarAPublicacion,
  onSeleccionarTodos,
  onPrevisualizar,
  onAbrirConfirmacion
}: AplicacionIPCPanelProps) {
  return (
    <section className="tarifas-card">
      <div className="tarifas-section-header">
        <div>
          <h2>Aplicar IPC a inmuebles</h2>
          <p>Selecciona los inmuebles que tendrán una nueva renta base.</p>
        </div>

        <button
          type="button"
          className="tarifas-btn tarifas-btn-secondary"
          onClick={onSeleccionarTodos}
          disabled={totalInmuebles === 0}
        >
          {inmueblesSeleccionados.length === totalInmuebles
            ? 'Quitar selección'
            : 'Seleccionar todos'}
        </button>
      </div>

      <div className="tarifas-form tarifas-form-aplicar">
        <div className="tarifas-form-row">
          <label>
            Año IPC
            <select
              value={anioAplicacion}
              onChange={(e) => onChangeAnioAplicacion(e.target.value)}
            >
              <option value="">Seleccionar IPC</option>
              {ipcLista.map((ipc) => (
                <option key={ipc.indice_ipc_id} value={ipc.anio}>
                  {ipc.anio} - {Number(ipc.porcentaje_anual).toFixed(3)}%
                </option>
              ))}
            </select>
          </label>

          <label>
            Motivo
            <input
              type="text"
              value={motivo}
              onChange={(e) => onChangeMotivo(e.target.value)}
              placeholder="Ej. Actualización anual por IPC"
            />
          </label>

          <label className="tarifas-check">
            <input
              type="checkbox"
              checked={aplicarAPublicacion}
              onChange={(e) => onChangeAplicarAPublicacion(e.target.checked)}
            />
            Aplicar también a publicación
          </label>
        </div>

        <div className="tarifas-actions">
          <button
            type="button"
            className="tarifas-btn tarifas-btn-primary"
            onClick={onPrevisualizar}
            disabled={cargandoPreview}
          >
            {cargandoPreview ? 'Calculando...' : 'Previsualizar'}
          </button>

          <button
            type="button"
            className="tarifas-btn tarifas-btn-success"
            onClick={onAbrirConfirmacion}
            disabled={!hayPreview || cargandoAplicacion}
          >
            Aplicar IPC
          </button>
        </div>
      </div>
    </section>
  );
}

export default AplicacionIPCPanel;