//reservaService
import type { AxiosError, AxiosResponse } from 'axios';
import apiClient from './apiClient';

export interface SolicitudReservaFormData {
    publicacion_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    observacion_inquilino?: string;
}

export interface SolicitudReserva {
    reserva_id: number;
    inmueble_id: number;
    inquilino_id: number;
    estado_reserva: string;

    fecha_solicitud: string;
    fecha_inicio: string;
    fecha_fin: string;

    renta_pactada_mensual: number;
    monto_total_estimado: number | null;
    deposito_garantia: number | null;
    moneda: string;

    observacion_inquilino: string | null;
    observacion_gestor: string | null;
    motivo_rechazo: string | null;
    fecha_decision: string | null;

    // HU12
    fecha_checkin?: string | null;
    fecha_checkout?: string | null;
    checkin_confirmado_por?: number | null;
    checkout_confirmado_por?: number | null;

    created_at: string;
    updated_at?: string;

    codigo_inmueble?: string;
    nombre_inmueble?: string;
    tipo_inmueble?: string;
    subtipo_unidad?: string | null;

    direccion_linea1?: string;
    numero?: string | null;
    distrito?: string | null;
    ciudad?: string | null;
    provincia?: string | null;
    departamento?: string | null;

    publicacion_id?: number;
    titulo_publicacion?: string;
    descripcion_corta?: string | null;
    precio_publicado_mensual?: number;
    foto_principal?: string | null;
}

export interface EventoReserva {
    reserva_evento_id: number;
    reserva_id: number;
    usuario_id: number | null;
    tipo_evento: string;
    descripcion: string | null;
    fecha_evento: string;

    correo_usuario?: string | null;
    nombres_usuario?: string | null;
    apellidos_usuario?: string | null;
}

export interface SolicitarReservaResponse {
    mensaje: string;
    publicacion: {
        publicacion_id: number;
        inmueble_id: number;
        titulo: string;
        codigo_inmueble: string;
        nombre_inmueble: string;
        tipo_inmueble: string;
    };
    reserva: SolicitudReserva;
}

export interface MisSolicitudesResponse {
    mensaje: string;
    total: number;
    solicitudes: SolicitudReserva[];
}

export interface DetalleMiSolicitudResponse {
    mensaje: string;
    solicitud: SolicitudReserva;
    solicitud_extension_pendiente: SolicitudExtension | null;
    total_eventos: number;
    eventos: EventoReserva[];
}

// HU13 - Solicitud de extensión

export interface SolicitudExtensionFormData {
    nueva_fecha_fin: string;
    motivo?: string;
}

export interface SolicitudExtension {
    solicitud_extension_id: number;
    reserva_id: number;
    solicitante_usuario_id: number;
    nueva_fecha_fin: string;
    motivo: string | null;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
    fecha_solicitud: string;
    fecha_decision: string | null;
    decidido_por_usuario_id: number | null;
    comentario_decision: string | null;
}

export interface SolicitarExtensionReservaResponse {
    mensaje: string;

    reserva: {
        reserva_id: number;
        inmueble_id: number;
        estado_reserva: string;
        fecha_inicio: string;
        fecha_fin_actual: string;
        codigo_inmueble: string;
        nombre_inmueble: string;
        titulo_publicacion: string | null;
    };

    solicitud_extension: SolicitudExtension;
    evento: EventoReserva;
}

export interface EstadoVettingSolicitud {
    tiene_evaluacion: boolean;
    resultado: string | null;
    score_riesgo: number | null;
    fecha_evaluacion: string | null;
    observaciones: string | null;
    puede_aprobar: boolean;
    requiere_evaluacion: boolean;
    mensaje: string;
}

export interface EvaluacionInquilino {
    evaluacion_inquilino_id: number;
    reserva_id: number;
    evaluado_por_usuario_id: number;
    score_riesgo: number;
    historial_reservas: number | null;
    observaciones: string | null;
    resultado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';
    fecha_evaluacion: string;

    correo_evaluador?: string | null;
    nombres_evaluador?: string | null;
    apellidos_evaluador?: string | null;
}

export interface RegistrarEvaluacionInquilinoData {
    score_riesgo: number;
    resultado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';
    observaciones?: string;
}

export interface RegistrarEvaluacionInquilinoResponse {
    mensaje: string;
    evaluacion: EvaluacionInquilino;
    evento?: EventoReserva;
    advertencias?: {
        tipo: string;
        nivel: string;
        mensaje: string;
    }[];
    total_advertencias?: number;
}

export interface EvaluacionesInquilinoResponse {
    mensaje: string;
    reserva: {
        reserva_id: number;
        estado_reserva: string;
        inquilino_id: number;
        inmueble_id: number;
        codigo_inmueble: string;
        nombre_inmueble: string;
        tipo_inmueble: string;
    };
    total: number;
    evaluaciones: EvaluacionInquilino[];
}

export interface ResumenVettingGestionResponse {
    mensaje: string;
    resumen: {
        total_solicitudes: number;
        pendientes_vetting: number;
        vetting_aprobado: number;
        vetting_observado: number;
        vetting_rechazado: number;
        puede_aprobar: number;
        no_puede_aprobar: number;
        solicitudes_solicitadas: number;
        solicitudes_aprobadas: number;
        solicitudes_rechazadas: number;
    };
}

interface ErrorBackend {
    mensaje?: string;
    error?: string;
    codigo?: string;
    recibo?: {
        recibo_id: number;
        estado_recibo: string;
        total: number;
        saldo_pendiente: number;
    };
}

export interface ErrorCancelacionReserva extends Error {
    codigo?: string;
    recibo?: {
        recibo_id: number;
        estado_recibo: string;
        total: number;
        saldo_pendiente: number;
    };
}
const obtenerMensajeError = (
    error: unknown,
    mensajeDefault: string
): string => {
    const axiosError = error as AxiosError<ErrorBackend>;

    return (
        axiosError.response?.data?.mensaje ||
        axiosError.response?.data?.error ||
        mensajeDefault
    );
};

const manejarPeticion = async <T>(
    peticion: Promise<AxiosResponse<T>>,
    mensajeDefault = 'Error en la solicitud'
): Promise<T> => {
    try {
        const response = await peticion;
        return response.data;
    } catch (error) {
        throw new Error(obtenerMensajeError(error, mensajeDefault));
    }
};

export const solicitarReserva = async (
    data: SolicitudReservaFormData
): Promise<SolicitarReservaResponse> => {
    return manejarPeticion<SolicitarReservaResponse>(
        apiClient.post('/reservas/solicitudes', data)
    );
};

export const listarMisSolicitudes = async (): Promise<MisSolicitudesResponse> => {
    return manejarPeticion<MisSolicitudesResponse>(
        apiClient.get('/reservas/mis-solicitudes')
    );
};

export const obtenerDetalleMiSolicitud = async (
    reservaId: number
): Promise<DetalleMiSolicitudResponse> => {
    return manejarPeticion<DetalleMiSolicitudResponse>(
        apiClient.get(`/reservas/mis-solicitudes/${reservaId}`)
    );
};

export const cancelarReservaInquilino = async (
    reservaId: number,
    motivo?: string
): Promise<{
    mensaje: string;
    reserva: SolicitudReserva;
    notificacion?: unknown;
}> => {
    try {
        const response = await apiClient.patch(
            `/reservas/${reservaId}/cancelar`,
            {
                motivo: motivo?.trim() || null
            }
        );

        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<ErrorBackend>;
        const data = axiosError.response?.data;

        const errorCancelacion = new Error(
            data?.mensaje || data?.error || 'No se pudo cancelar la reserva.'
        ) as ErrorCancelacionReserva;

        errorCancelacion.codigo = data?.codigo;
        errorCancelacion.recibo = data?.recibo;

        throw errorCancelacion;
    }
};

/* HU13 */
export const solicitarExtensionReserva = async (
    reservaId: number,
    data: SolicitudExtensionFormData
): Promise<SolicitarExtensionReservaResponse> => {
    return manejarPeticion<SolicitarExtensionReservaResponse>(
        apiClient.post(
            `/reservas/mis-solicitudes/${reservaId}/extensiones`,
            data
        )
    );
};

export interface SolicitudReservaGestion extends SolicitudReserva {
    gestionado_por_usuario_id: number | null;

    correo_inquilino: string;
    nombres_inquilino: string | null;
    apellidos_inquilino: string | null;
    telefono_inquilino: string | null;

    tipo_documento: string | null;
    numero_documento: string | null;

    ingreso_mensual_referencial: number | null;
    tiene_aval_bancario: boolean;
    tiene_contrato_trabajo: boolean;
    tiene_garante: boolean;

    evaluacion_inquilino_id?: number | null;
    resultado_evaluacion?: string | null;
    score_riesgo?: number | null;
    fecha_evaluacion?: string | null;
    observaciones_evaluacion?: string | null;

    estado_vetting?: EstadoVettingSolicitud;
}

export interface SolicitudesGestionResponse {
    mensaje: string;
    filtros?: {
        estado_reserva: string | null;
        estado_vetting: string | null;
    };
    total: number;
    solicitudes: SolicitudReservaGestion[];
}

export interface AprobarSolicitudResponse {
    mensaje: string;
    reserva: SolicitudReserva;
}

export interface RechazarSolicitudResponse {
    mensaje: string;
    reserva: SolicitudReserva;
}

export interface ControlOcupacionReservaResponse {
    mensaje: string;
    reserva: SolicitudReserva;
    evento: EventoReserva;
}

export interface AprobarSolicitudData {
    observacion_gestor?: string;
}

export interface RechazarSolicitudData {
    motivo_rechazo: string;
    observacion_gestor?: string;
}

export const listarSolicitudesGestion = async (
    estadoReserva?: string,
    estadoVetting?: string
): Promise<SolicitudesGestionResponse> => {
    const params = new URLSearchParams();

    if (estadoReserva) {
        params.append('estado_reserva', estadoReserva);
    }

    if (estadoVetting) {
        params.append('estado_vetting', estadoVetting);
    }

    const query = params.toString() ? `?${params.toString()}` : '';

    return manejarPeticion<SolicitudesGestionResponse>(
        apiClient.get(`/reservas/gestion/solicitudes${query}`)
    );
};

export const aprobarSolicitudReservaGestion = async (
    reservaId: number,
    data: AprobarSolicitudData
): Promise<AprobarSolicitudResponse> => {
    return manejarPeticion<AprobarSolicitudResponse>(
        apiClient.patch(
            `/reservas/gestion/solicitudes/${reservaId}/aprobar`,
            data
        )
    );
};

export const rechazarSolicitudReservaGestion = async (
    reservaId: number,
    data: RechazarSolicitudData
): Promise<RechazarSolicitudResponse> => {
    return manejarPeticion<RechazarSolicitudResponse>(
        apiClient.patch(
            `/reservas/gestion/solicitudes/${reservaId}/rechazar`,
            data
        )
    );
};

export const confirmarCheckinReservaGestion = async (
    reservaId: number
): Promise<ControlOcupacionReservaResponse> => {
    return manejarPeticion<ControlOcupacionReservaResponse>(
        apiClient.patch(
            `/reservas/gestion/solicitudes/${reservaId}/checkin`,
            {}
        )
    );
};

export const confirmarCheckoutReservaGestion = async (
    reservaId: number
): Promise<ControlOcupacionReservaResponse> => {
    return manejarPeticion<ControlOcupacionReservaResponse>(
        apiClient.patch(
            `/reservas/gestion/solicitudes/${reservaId}/checkout`,
            {}
        )
    );
};

export interface SolicitudExtensionGestion {
    solicitud_extension_id: number;
    reserva_id: number;
    solicitante_usuario_id: number;

    nueva_fecha_fin: string;
    motivo: string | null;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
    fecha_solicitud: string;

    fecha_decision: string | null;
    decidido_por_usuario_id: number | null;
    comentario_decision: string | null;

    fecha_inicio: string;
    fecha_fin_actual: string;
    estado_reserva: string;
    inmueble_id: number;

    codigo_inmueble: string;
    nombre_inmueble: string;

    nombres_inquilino: string | null;
    apellidos_inquilino: string | null;
    correo_inquilino: string;
}

export interface EventosGestionReservaResponse {
    mensaje: string;
    reserva: {
        reserva_id: number;
        inmueble_id: number;
        inquilino_id: number;
        estado_reserva: string;
        fecha_inicio: string;
        fecha_fin: string;
        codigo_inmueble: string;
        nombre_inmueble: string;
        tipo_inmueble: string;
    };
    solicitud_extension_pendiente: SolicitudExtensionGestion | null;
    total: number;
    eventos: EventoReserva[];
}

export const obtenerEventosReservaGestion = async (
    reservaId: number
): Promise<EventosGestionReservaResponse> => {
    return manejarPeticion<EventosGestionReservaResponse>(
        apiClient.get(`/reservas/gestion/solicitudes/${reservaId}/eventos`)
    );
};

export interface GestionSolicitudExtensionResponse {
    mensaje: string;
    solicitud_extension: SolicitudExtensionGestion;
    reserva?: {
        reserva_id: number;
        inmueble_id: number;
        inquilino_id: number;
        estado_reserva: string;
        fecha_inicio: string;
        fecha_fin: string;
        updated_at: string;
    };
    evento: EventoReserva;
}

export const aprobarSolicitudExtensionGestion = async (
    solicitudExtensionId: number,
    comentarioDecision?: string
): Promise<GestionSolicitudExtensionResponse> => {
    return manejarPeticion<GestionSolicitudExtensionResponse>(
        apiClient.put(
            `/reservas/gestion/extensiones/${solicitudExtensionId}/aprobar`,
            {
                comentario_decision:
                    comentarioDecision?.trim() || null
            }
        )
    );
};

export const rechazarSolicitudExtensionGestion = async (
    solicitudExtensionId: number,
    comentarioDecision: string
): Promise<GestionSolicitudExtensionResponse> => {
    return manejarPeticion<GestionSolicitudExtensionResponse>(
        apiClient.put(
            `/reservas/gestion/extensiones/${solicitudExtensionId}/rechazar`,
            {
                comentario_decision: comentarioDecision.trim()
            }
        )
    );
};

export interface VettingInquilinoResponse {
    mensaje: string;

    solicitud: {
        reserva_id: number;
        estado_reserva: string;
        fecha_solicitud: string;
        fecha_inicio: string;
        fecha_fin: string;
        renta_pactada_mensual: number;
        monto_total_estimado: number | null;
        deposito_garantia: number | null;
        moneda: string;
        observacion_inquilino: string | null;
    };

    inmueble: {
        inmueble_id: number;
        codigo: string;
        nombre: string;
        tipo_inmueble: string;
        subtipo_unidad: string | null;
        direccion_linea1: string;
        numero: string | null;
        distrito: string | null;
        ciudad: string | null;
        provincia: string | null;
        departamento: string | null;
    };

    publicacion: {
        publicacion_id: number;
        titulo: string;
        precio_publicado_mensual: number;
    };

    inquilino: {
        usuario_id: number;
        correo: string;
        estado_usuario: string;
        email_verificado: boolean;
        perfil: {
            perfil_usuario_id: number | null;
            nombres: string | null;
            apellidos: string | null;
            tipo_documento: string | null;
            numero_documento: string | null;
            telefono: string | null;
            fecha_nacimiento: string | null;
            sexo: string | null;
            foto_url: string | null;
            biografia: string | null;
            direccion: string | null;
            distrito: string | null;
            ciudad: string | null;
            pais: string | null;
        };
        vetting_basico: {
            ingreso_mensual_referencial: number | null;
            tiene_aval_bancario: boolean;
            tiene_contrato_trabajo: boolean;
            tiene_garante: boolean;
            nombre_garante: string | null;
            contacto_garante: string | null;
        };
    };

    resumen_historial: {
        total_solicitudes: number;
        total_solicitadas: number;
        total_aprobadas: number;
        total_rechazadas: number;
        total_canceladas: number;
        total_activas: number;
        total_finalizadas: number;
        ultima_solicitud: string | null;
    };

    historial_reservas: SolicitudReserva[];

    evaluacion_inquilino: EvaluacionInquilino | null;

    resumen_automatico: {
        nivel_riesgo_sugerido: string;
        recomendacion: string;
        total_alertas: number;
        total_puntos_fuertes: number;
        alertas: {
            tipo: string;
            nivel: string;
            mensaje: string;
        }[];
        puntos_fuertes: {
            tipo: string;
            mensaje: string;
        }[];
    };

    evaluacion_sugerida: {
        score_riesgo_sugerido: number;
        resultado_sugerido: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';
        mensaje: string;
    };
}

export const obtenerVettingInquilinoGestion = async (
    reservaId: number
): Promise<VettingInquilinoResponse> => {
    return manejarPeticion<VettingInquilinoResponse>(
        apiClient.get(`/reservas/gestion/solicitudes/${reservaId}/vetting`)
    );
};

export const registrarEvaluacionInquilinoGestion = async (
    reservaId: number,
    data: RegistrarEvaluacionInquilinoData
): Promise<RegistrarEvaluacionInquilinoResponse> => {
    return manejarPeticion<RegistrarEvaluacionInquilinoResponse>(
        apiClient.post(
            `/reservas/gestion/solicitudes/${reservaId}/evaluacion`,
            data
        )
    );
};

export const obtenerEvaluacionesInquilinoGestion = async (
    reservaId: number
): Promise<EvaluacionesInquilinoResponse> => {
    return manejarPeticion<EvaluacionesInquilinoResponse>(
        apiClient.get(`/reservas/gestion/solicitudes/${reservaId}/evaluaciones`)
    );
};

export const obtenerResumenVettingGestion =
    async (): Promise<ResumenVettingGestionResponse> => {
        return manejarPeticion<ResumenVettingGestionResponse>(
            apiClient.get('/reservas/gestion/vetting/resumen')
        );
    };