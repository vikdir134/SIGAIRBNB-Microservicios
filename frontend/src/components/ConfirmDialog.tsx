interface ConfirmDialogProps {
    abierto: boolean;
    titulo: string;
    descripcion: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    tipo?: 'normal' | 'danger' | 'success';
    cargando?: boolean;
    onConfirmar: () => void;
    onCerrar: () => void;
}

function ConfirmDialog({
    abierto,
    titulo,
    descripcion,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    tipo = 'normal',
    cargando = false,
    onConfirmar,
    onCerrar
}: ConfirmDialogProps) {
    if (!abierto) return null;

    return (
        <div className="confirm-overlay">
            <div className="confirm-card">
                <div className={`confirm-icon confirm-icon-${tipo}`}>
                    {tipo === 'danger' ? '!' : tipo === 'success' ? '✓' : '?'}
                </div>

                <h2>{titulo}</h2>

                <p>{descripcion}</p>

                <div className="confirm-actions">
                    <button type="button" 
                    className="btn-confirm-cancel" 
                    onClick={onCerrar}
                    disabled={cargando} 
                    > 
                    {textoCancelar} 
                    </button>

                    <button
                        type="button"
                        className={ tipo === 'danger' 
                            ? 'btn-gestion-danger' 
                            : tipo === 'success' 
                            ? 'btn-confirm-success' 
                            : 'btn-gestion-primary' }
                        onClick={onConfirmar}
                        disabled={cargando}
                    >
                        {cargando ? 'Procesando...' : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;