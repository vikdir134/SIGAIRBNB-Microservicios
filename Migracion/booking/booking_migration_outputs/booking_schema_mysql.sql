-- ============================================================
-- STAY.PE / SIGAIRBNB
-- booking-service - MySQL schema limpio
-- Base destino: staype_booking_db
-- Motor: MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS staype_booking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE staype_booking_db;

-- ============================================================
-- Tabla principal de reservas
-- Los campos usuario_id / inmueble_id son referencias lógicas
-- hacia auth-service y catalog-service. No tienen FK física.
-- ============================================================

CREATE TABLE IF NOT EXISTS reserva (
  reserva_id INT NOT NULL AUTO_INCREMENT,
  inmueble_id INT NOT NULL,
  inquilino_id INT NOT NULL,
  estado_reserva VARCHAR(20) NOT NULL DEFAULT 'SOLICITADA',
  fecha_solicitud DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  renta_pactada_mensual DECIMAL(12,2) NULL,
  monto_total_estimado DECIMAL(12,2) NULL,
  deposito_garantia DECIMAL(12,2) NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  observacion_inquilino VARCHAR(500) NULL,
  observacion_gestor VARCHAR(500) NULL,
  motivo_rechazo VARCHAR(300) NULL,
  motivo_cancelacion VARCHAR(300) NULL,
  fecha_decision DATETIME(6) NULL,
  gestionado_por_usuario_id INT NULL,
  fecha_checkin DATETIME(6) NULL,
  fecha_checkout DATETIME(6) NULL,
  checkin_confirmado_por INT NULL,
  checkout_confirmado_por INT NULL,
  cancelado_por_usuario_id INT NULL,
  fecha_cancelacion DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (reserva_id),

  CONSTRAINT ck_reserva_estado CHECK (
    estado_reserva IN (
      'SOLICITADA',
      'APROBADA',
      'RECHAZADA',
      'CANCELADA',
      'ACTIVA',
      'FINALIZADA',
      'EXPIRADA'
    )
  ),
  CONSTRAINT ck_reserva_fechas CHECK (fecha_fin > fecha_inicio),

  INDEX idx_reserva_inmueble_fechas (inmueble_id, fecha_inicio, fecha_fin),
  INDEX idx_reserva_inquilino_estado (inquilino_id, estado_reserva),
  INDEX idx_reserva_estado (estado_reserva)
) ENGINE=InnoDB;

-- ============================================================
-- Historial de eventos de reserva
-- usuario_id es referencia lógica a auth-service.
-- ============================================================

CREATE TABLE IF NOT EXISTS reserva_evento (
  reserva_evento_id INT NOT NULL AUTO_INCREMENT,
  reserva_id INT NOT NULL,
  usuario_id INT NULL,
  tipo_evento VARCHAR(30) NOT NULL,
  descripcion VARCHAR(500) NULL,
  fecha_evento DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (reserva_evento_id),

  CONSTRAINT fk_reserva_evento_reserva
    FOREIGN KEY (reserva_id)
    REFERENCES reserva(reserva_id)
    ON DELETE CASCADE,

  CONSTRAINT ck_reserva_evento_tipo CHECK (
    tipo_evento IN (
      'SOLICITUD',
      'APROBACION',
      'RECHAZO',
      'CHECKIN',
      'CHECKOUT',
      'EXTENSION',
      'CANCELACION',
      'NOTA'
    )
  ),

  INDEX idx_reserva_evento_reserva (reserva_id),
  INDEX idx_reserva_evento_fecha (fecha_evento)
) ENGINE=InnoDB;

-- ============================================================
-- Evaluación de inquilino
-- evaluado_por_usuario_id es referencia lógica a auth-service.
-- ============================================================

CREATE TABLE IF NOT EXISTS evaluacion_inquilino (
  evaluacion_inquilino_id INT NOT NULL AUTO_INCREMENT,
  reserva_id INT NOT NULL,
  evaluado_por_usuario_id INT NOT NULL,
  score_riesgo INT NULL,
  historial_reservas INT NULL,
  observaciones VARCHAR(500) NULL,
  resultado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  fecha_evaluacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (evaluacion_inquilino_id),

  CONSTRAINT fk_evaluacion_inquilino_reserva
    FOREIGN KEY (reserva_id)
    REFERENCES reserva(reserva_id)
    ON DELETE CASCADE,

  CONSTRAINT ck_evaluacion_inquilino_resultado CHECK (
    resultado IN ('PENDIENTE', 'APROBADO', 'OBSERVADO', 'RECHAZADO')
  ),

  INDEX idx_evaluacion_inquilino_reserva (reserva_id)
) ENGINE=InnoDB;

-- ============================================================
-- Solicitudes de extensión
-- solicitante_usuario_id y decidido_por_usuario_id son referencias lógicas.
-- ============================================================

CREATE TABLE IF NOT EXISTS solicitud_extension (
  solicitud_extension_id INT NOT NULL AUTO_INCREMENT,
  reserva_id INT NOT NULL,
  solicitante_usuario_id INT NOT NULL,
  nueva_fecha_fin DATE NOT NULL,
  motivo VARCHAR(500) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  fecha_solicitud DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  fecha_decision DATETIME(6) NULL,
  decidido_por_usuario_id INT NULL,
  comentario_decision VARCHAR(500) NULL,

  PRIMARY KEY (solicitud_extension_id),

  CONSTRAINT fk_solicitud_extension_reserva
    FOREIGN KEY (reserva_id)
    REFERENCES reserva(reserva_id)
    ON DELETE CASCADE,

  CONSTRAINT ck_solicitud_extension_estado CHECK (
    estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA')
  ),

  INDEX idx_solicitud_extension_reserva (reserva_id),
  INDEX idx_solicitud_extension_estado (estado)
) ENGINE=InnoDB;
