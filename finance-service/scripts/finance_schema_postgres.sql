DROP TABLE IF EXISTS movimiento_bancario CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS recibo_detalle CASCADE;
DROP TABLE IF EXISTS recibo CASCADE;
DROP TABLE IF EXISTS tarifa_inmueble CASCADE;
DROP TABLE IF EXISTS configuracion_cobro_inmueble CASCADE;
DROP TABLE IF EXISTS indice_ipc CASCADE;
DROP TABLE IF EXISTS cuenta_cobro_inmueble CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria CASCADE;
DROP TABLE IF EXISTS concepto_cobro CASCADE;
DROP TABLE IF EXISTS categoria_movimiento CASCADE;
DROP TABLE IF EXISTS banco CASCADE;

CREATE TABLE banco (
  banco_id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(30),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categoria_movimiento (
  categoria_movimiento_id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  naturaleza VARCHAR(20) NOT NULL,
  descripcion VARCHAR(300),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE concepto_cobro (
  concepto_cobro_id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(300),
  tipo_concepto VARCHAR(20) NOT NULL,
  es_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_igv BOOLEAN NOT NULL DEFAULT FALSE,
  monto_default NUMERIC(12,2) NOT NULL DEFAULT 0,
  orden_impresion INT NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuenta_bancaria (
  cuenta_bancaria_id SERIAL PRIMARY KEY,

  -- ID lógico de empresa. Pertenece a auth/core, por eso NO tiene FK física.
  empresa_id INT NOT NULL,

  banco_id INT NOT NULL REFERENCES banco(banco_id),

  nombre_cuenta VARCHAR(150) NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  cci VARCHAR(50),
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  tipo_cuenta VARCHAR(20) NOT NULL,
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuenta_cobro_inmueble (
  cuenta_cobro_inmueble_id SERIAL PRIMARY KEY,

  -- ID lógico de inmueble. Pertenece a catalog-service.
  inmueble_id INT NOT NULL,

  numero_recibo_base VARCHAR(50) NOT NULL,
  dia_vencimiento SMALLINT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indice_ipc (
  indice_ipc_id SERIAL PRIMARY KEY,
  anio INT NOT NULL UNIQUE,
  porcentaje_anual NUMERIC(8,4) NOT NULL,
  fecha_publicacion DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion_cobro_inmueble (
  configuracion_cobro_id SERIAL PRIMARY KEY,

  -- ID lógico de inmueble. Pertenece a catalog-service.
  inmueble_id INT NOT NULL,

  concepto_cobro_id INT NOT NULL REFERENCES concepto_cobro(concepto_cobro_id),

  monto_configurado NUMERIC(12,2) NOT NULL DEFAULT 0,
  es_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  vigencia_desde DATE NOT NULL,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tarifa_inmueble (
  tarifa_inmueble_id SERIAL PRIMARY KEY,

  -- ID lógico de inmueble. Pertenece a catalog-service.
  inmueble_id INT NOT NULL,

  vigencia_desde DATE NOT NULL,
  vigencia_hasta DATE,
  renta_base_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
  porcentaje_ipc_aplicado NUMERIC(8,4) NOT NULL DEFAULT 0,
  monto_incremento NUMERIC(12,2) NOT NULL DEFAULT 0,
  motivo VARCHAR(300),

  -- ID lógico de usuario. Pertenece a auth-service.
  aplicado_por_usuario_id INT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recibo (
  recibo_id SERIAL PRIMARY KEY,

  cuenta_cobro_inmueble_id INT NOT NULL
    REFERENCES cuenta_cobro_inmueble(cuenta_cobro_inmueble_id),

  -- ID lógico de reserva. Pertenece a booking-service.
  reserva_id INT,

  periodo_anio INT NOT NULL,
  periodo_mes SMALLINT NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado_recibo VARCHAR(20) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  igv_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0,

  generado_desde_recibo_id INT REFERENCES recibo(recibo_id),

  -- ID lógico de usuario. Pertenece a auth-service.
  emitido_por_usuario_id INT,

  pdf_url VARCHAR(500),
  observaciones VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recibo_detalle (
  recibo_detalle_id SERIAL PRIMARY KEY,

  recibo_id INT NOT NULL REFERENCES recibo(recibo_id) ON DELETE CASCADE,
  concepto_cobro_id INT NOT NULL REFERENCES concepto_cobro(concepto_cobro_id),

  descripcion VARCHAR(200),
  cantidad NUMERIC(12,2) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  importe NUMERIC(12,2) NOT NULL DEFAULT 0,
  orden_impresion INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pago (
  pago_id SERIAL PRIMARY KEY,

  recibo_id INT NOT NULL REFERENCES recibo(recibo_id),

  -- ID lógico de reserva. Pertenece a booking-service.
  reserva_id INT,

  -- ID lógico de usuario. Pertenece a auth-service.
  usuario_pagador_id INT NOT NULL,

  metodo_pago VARCHAR(20) NOT NULL,
  proveedor_pasarela VARCHAR(100),
  transaccion_externa VARCHAR(150),
  referencia VARCHAR(150),
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  estado_pago VARCHAR(20) NOT NULL,
  fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_confirmacion TIMESTAMP,
  observaciones VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimiento_bancario (
  movimiento_bancario_id SERIAL PRIMARY KEY,

  cuenta_bancaria_id INT NOT NULL REFERENCES cuenta_bancaria(cuenta_bancaria_id),
  categoria_movimiento_id INT NOT NULL REFERENCES categoria_movimiento(categoria_movimiento_id),

  tipo_movimiento VARCHAR(20) NOT NULL,

  -- IDs lógicos externos.
  inmueble_id INT,
  reserva_id INT,

  recibo_id INT REFERENCES recibo(recibo_id),
  pago_id INT REFERENCES pago(pago_id),

  fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  concepto VARCHAR(200) NOT NULL,
  descripcion VARCHAR(500),
  importe NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_anterior NUMERIC(12,2),
  saldo_posterior NUMERIC(12,2),
  referencia_externa VARCHAR(150),
  observaciones VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuenta_bancaria_empresa ON cuenta_bancaria(empresa_id);
CREATE INDEX idx_cuenta_cobro_inmueble ON cuenta_cobro_inmueble(inmueble_id);
CREATE INDEX idx_configuracion_cobro_inmueble ON configuracion_cobro_inmueble(inmueble_id);
CREATE INDEX idx_tarifa_inmueble ON tarifa_inmueble(inmueble_id);
CREATE INDEX idx_recibo_reserva ON recibo(reserva_id);
CREATE INDEX idx_recibo_estado ON recibo(estado_recibo);
CREATE INDEX idx_pago_recibo ON pago(recibo_id);
CREATE INDEX idx_pago_reserva ON pago(reserva_id);
CREATE INDEX idx_movimiento_reserva ON movimiento_bancario(reserva_id);
CREATE INDEX idx_movimiento_recibo ON movimiento_bancario(recibo_id);
CREATE INDEX idx_movimiento_pago ON movimiento_bancario(pago_id);