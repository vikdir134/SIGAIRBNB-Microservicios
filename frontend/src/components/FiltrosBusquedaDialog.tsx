import type { ChangeEvent } from 'react';
import type { FiltrosPublicacion } from '../services/publicacionService';

interface FiltrosBusquedaDialogProps {
    abierto: boolean;
    filtros: FiltrosPublicacion;
    cargando: boolean;
    onCerrar: () => void;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onAplicar: () => void;
    onLimpiar: () => void;
}

function FiltrosBusquedaDialog({
    abierto,
    filtros,
    cargando,
    onCerrar,
    onChange,
    onAplicar,
    onLimpiar
}: FiltrosBusquedaDialogProps) {
    if (!abierto) {
        return null;
    }

    return (
        <div className="modal-filtros-overlay">
            <div className="modal-filtros-card">
                <div className="modal-filtros-header">
                    <h2>Filtros de búsqueda</h2>

                    <button type="button" onClick={onCerrar}>
                        ×
                    </button>
                </div>

                <div className="modal-filtros-body">
                    <div className="filtro-modal-grupo">
                        <label>Ubicación</label>
                        <input
                            type="text"
                            name="ubicacion"
                            value={filtros.ubicacion}
                            onChange={onChange}
                            placeholder="Distrito, ciudad o dirección"
                        />
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Tipo de inmueble</label>
                        <select
                            name="tipo_inmueble"
                            value={filtros.tipo_inmueble}
                            onChange={onChange}
                        >
                            <option value="">Todos</option>
                            <option value="EDIFICIO">Edificio</option>
                            <option value="PISO">Piso</option>
                            <option value="LOCAL">Local</option>
                        </select>
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Fecha ingreso</label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            value={filtros.fecha_inicio}
                            onChange={onChange}
                        />
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Fecha salida</label>
                        <input
                            type="date"
                            name="fecha_fin"
                            value={filtros.fecha_fin}
                            onChange={onChange}
                        />
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Precio mínimo</label>
                        <input
                            type="number"
                            name="precio_min"
                            value={filtros.precio_min}
                            onChange={onChange}
                            min="0"
                            placeholder="Ej. 1000"
                        />
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Precio máximo</label>
                        <input
                            type="number"
                            name="precio_max"
                            value={filtros.precio_max}
                            onChange={onChange}
                            min="0"
                            placeholder="Ej. 3000"
                        />
                    </div>

                    <div className="filtro-modal-grupo">
                        <label>Capacidad de personas</label>
                        <input
                            type="number"
                            name="capacidad_personas"
                            value={filtros.capacidad_personas}
                            onChange={onChange}
                            min="0"
                            placeholder="Ej. 2"
                        />
                    </div>
                </div>

                <div className="modal-filtros-actions">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={onLimpiar}
                    >
                        Limpiar filtros
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onAplicar}
                        disabled={cargando}
                    >
                        {cargando ? 'Buscando...' : 'Aplicar filtros'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FiltrosBusquedaDialog;