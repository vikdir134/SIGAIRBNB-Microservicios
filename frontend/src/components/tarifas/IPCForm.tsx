import { useState, type FormEvent } from 'react';

interface IPCFormProps {
  cargando: boolean;
  onRegistrar: (data: {
    anio: number;
    porcentaje_anual: number;
    fecha_publicacion: string | null;
  }) => Promise<void>;
}

function IPCForm({ cargando, onRegistrar }: IPCFormProps) {
  const [anio, setAnio] = useState('');
  const [porcentajeAnual, setPorcentajeAnual] = useState('');
  const [fechaPublicacion, setFechaPublicacion] = useState('');
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const anioNumero = Number(anio);
    const porcentajeNumero = Number(porcentajeAnual);

    if (!anio || !Number.isInteger(anioNumero)) {
      alert('El año es obligatorio y debe ser un número entero.');
      return;
    }

    if (!porcentajeAnual || Number.isNaN(porcentajeNumero)) {
      alert('El porcentaje anual es obligatorio.');
      return;
    }

    const anioMaximo = new Date().getFullYear() + 1;

    if (anioNumero < 2000 || anioNumero > anioMaximo) {
      alert(`El año debe estar entre 2000 y ${anioMaximo}.`);
      return;
    }

    if (porcentajeNumero < 0) {
      alert('El porcentaje anual no puede ser negativo.');
      return;
    }

    if (porcentajeNumero > 100) {
      alert('El porcentaje anual no puede superar 100%.');
      return;
    }

    await onRegistrar({
      anio: anioNumero,
      porcentaje_anual: porcentajeNumero,
      fecha_publicacion: fechaPublicacion || null
    });

    setAnio('');
    setPorcentajeAnual('');
    setFechaPublicacion('');
  };

  return (
    <section className="tarifas-card">
      <h2>Registrar IPC anual</h2>

      <form onSubmit={handleSubmit} className="tarifas-form">
        <div className="tarifas-form-row">
          <label>
            Año
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              placeholder="Ej. 2026"
            />
          </label>

          <label>
            Porcentaje anual
            <input
              type="number"
              step="0.001"
              min="0"
              value={porcentajeAnual}
              onChange={(e) => setPorcentajeAnual(e.target.value)}
              placeholder="Ej. 3.25"
            />
          </label>

          <label>
            Fecha de publicación
            <input
              type="date"
              value={fechaPublicacion}
              onChange={(e) => setFechaPublicacion(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          className="tarifas-btn tarifas-btn-primary"
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : 'Registrar IPC'}
        </button>
      </form>
    </section>
  );
}

export default IPCForm;
