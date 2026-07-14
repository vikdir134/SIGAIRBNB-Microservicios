--
-- PostgreSQL database dump
--

\restrict LQZvZKS0o7fJ9wmnB34aC2M2p1WDe3YL53zv5VmMZswkinHurKoDhiUZyL5UsZE

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.recibo DROP CONSTRAINT IF EXISTS recibo_generado_desde_recibo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo_detalle DROP CONSTRAINT IF EXISTS recibo_detalle_recibo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo_detalle DROP CONSTRAINT IF EXISTS recibo_detalle_concepto_cobro_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo DROP CONSTRAINT IF EXISTS recibo_cuenta_cobro_inmueble_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_recibo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_bancario DROP CONSTRAINT IF EXISTS movimiento_bancario_recibo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_bancario DROP CONSTRAINT IF EXISTS movimiento_bancario_pago_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_bancario DROP CONSTRAINT IF EXISTS movimiento_bancario_cuenta_bancaria_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_bancario DROP CONSTRAINT IF EXISTS movimiento_bancario_categoria_movimiento_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_bancaria DROP CONSTRAINT IF EXISTS cuenta_bancaria_banco_id_fkey;
ALTER TABLE IF EXISTS ONLY public.configuracion_cobro_inmueble DROP CONSTRAINT IF EXISTS configuracion_cobro_inmueble_concepto_cobro_id_fkey;
DROP INDEX IF EXISTS public.idx_tarifa_inmueble;
DROP INDEX IF EXISTS public.idx_recibo_reserva;
DROP INDEX IF EXISTS public.idx_recibo_estado;
DROP INDEX IF EXISTS public.idx_pago_reserva;
DROP INDEX IF EXISTS public.idx_pago_recibo;
DROP INDEX IF EXISTS public.idx_movimiento_reserva;
DROP INDEX IF EXISTS public.idx_movimiento_recibo;
DROP INDEX IF EXISTS public.idx_movimiento_pago;
DROP INDEX IF EXISTS public.idx_cuenta_cobro_inmueble;
DROP INDEX IF EXISTS public.idx_cuenta_bancaria_empresa;
DROP INDEX IF EXISTS public.idx_configuracion_cobro_inmueble;
ALTER TABLE IF EXISTS ONLY public.tarifa_inmueble DROP CONSTRAINT IF EXISTS tarifa_inmueble_pkey;
ALTER TABLE IF EXISTS ONLY public.recibo DROP CONSTRAINT IF EXISTS recibo_pkey;
ALTER TABLE IF EXISTS ONLY public.recibo_detalle DROP CONSTRAINT IF EXISTS recibo_detalle_pkey;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_pkey;
ALTER TABLE IF EXISTS ONLY public.movimiento_bancario DROP CONSTRAINT IF EXISTS movimiento_bancario_pkey;
ALTER TABLE IF EXISTS ONLY public.indice_ipc DROP CONSTRAINT IF EXISTS indice_ipc_pkey;
ALTER TABLE IF EXISTS ONLY public.indice_ipc DROP CONSTRAINT IF EXISTS indice_ipc_anio_key;
ALTER TABLE IF EXISTS ONLY public.cuenta_cobro_inmueble DROP CONSTRAINT IF EXISTS cuenta_cobro_inmueble_pkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_bancaria DROP CONSTRAINT IF EXISTS cuenta_bancaria_pkey;
ALTER TABLE IF EXISTS ONLY public.configuracion_cobro_inmueble DROP CONSTRAINT IF EXISTS configuracion_cobro_inmueble_pkey;
ALTER TABLE IF EXISTS ONLY public.concepto_cobro DROP CONSTRAINT IF EXISTS concepto_cobro_pkey;
ALTER TABLE IF EXISTS ONLY public.concepto_cobro DROP CONSTRAINT IF EXISTS concepto_cobro_codigo_key;
ALTER TABLE IF EXISTS ONLY public.categoria_movimiento DROP CONSTRAINT IF EXISTS categoria_movimiento_pkey;
ALTER TABLE IF EXISTS ONLY public.banco DROP CONSTRAINT IF EXISTS banco_pkey;
ALTER TABLE IF EXISTS public.tarifa_inmueble ALTER COLUMN tarifa_inmueble_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recibo_detalle ALTER COLUMN recibo_detalle_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recibo ALTER COLUMN recibo_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pago ALTER COLUMN pago_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.movimiento_bancario ALTER COLUMN movimiento_bancario_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.indice_ipc ALTER COLUMN indice_ipc_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cuenta_cobro_inmueble ALTER COLUMN cuenta_cobro_inmueble_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cuenta_bancaria ALTER COLUMN cuenta_bancaria_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.configuracion_cobro_inmueble ALTER COLUMN configuracion_cobro_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.concepto_cobro ALTER COLUMN concepto_cobro_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categoria_movimiento ALTER COLUMN categoria_movimiento_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.banco ALTER COLUMN banco_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.tarifa_inmueble_tarifa_inmueble_id_seq;
DROP TABLE IF EXISTS public.tarifa_inmueble;
DROP SEQUENCE IF EXISTS public.recibo_recibo_id_seq;
DROP SEQUENCE IF EXISTS public.recibo_detalle_recibo_detalle_id_seq;
DROP TABLE IF EXISTS public.recibo_detalle;
DROP TABLE IF EXISTS public.recibo;
DROP SEQUENCE IF EXISTS public.pago_pago_id_seq;
DROP TABLE IF EXISTS public.pago;
DROP SEQUENCE IF EXISTS public.movimiento_bancario_movimiento_bancario_id_seq;
DROP TABLE IF EXISTS public.movimiento_bancario;
DROP SEQUENCE IF EXISTS public.indice_ipc_indice_ipc_id_seq;
DROP TABLE IF EXISTS public.indice_ipc;
DROP SEQUENCE IF EXISTS public.cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq;
DROP TABLE IF EXISTS public.cuenta_cobro_inmueble;
DROP SEQUENCE IF EXISTS public.cuenta_bancaria_cuenta_bancaria_id_seq;
DROP TABLE IF EXISTS public.cuenta_bancaria;
DROP SEQUENCE IF EXISTS public.configuracion_cobro_inmueble_configuracion_cobro_id_seq;
DROP TABLE IF EXISTS public.configuracion_cobro_inmueble;
DROP SEQUENCE IF EXISTS public.concepto_cobro_concepto_cobro_id_seq;
DROP TABLE IF EXISTS public.concepto_cobro;
DROP SEQUENCE IF EXISTS public.categoria_movimiento_categoria_movimiento_id_seq;
DROP TABLE IF EXISTS public.categoria_movimiento;
DROP SEQUENCE IF EXISTS public.banco_banco_id_seq;
DROP TABLE IF EXISTS public.banco;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banco (
    banco_id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    codigo character varying(30),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: banco_banco_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banco_banco_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banco_banco_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banco_banco_id_seq OWNED BY public.banco.banco_id;


--
-- Name: categoria_movimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria_movimiento (
    categoria_movimiento_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    naturaleza character varying(20) NOT NULL,
    descripcion character varying(300),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categoria_movimiento_categoria_movimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categoria_movimiento_categoria_movimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categoria_movimiento_categoria_movimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categoria_movimiento_categoria_movimiento_id_seq OWNED BY public.categoria_movimiento.categoria_movimiento_id;


--
-- Name: concepto_cobro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.concepto_cobro (
    concepto_cobro_id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(300),
    tipo_concepto character varying(20) NOT NULL,
    es_obligatorio boolean DEFAULT false NOT NULL,
    aplica_igv boolean DEFAULT false NOT NULL,
    monto_default numeric(12,2) DEFAULT 0 NOT NULL,
    orden_impresion integer DEFAULT 1 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: concepto_cobro_concepto_cobro_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.concepto_cobro_concepto_cobro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: concepto_cobro_concepto_cobro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.concepto_cobro_concepto_cobro_id_seq OWNED BY public.concepto_cobro.concepto_cobro_id;


--
-- Name: configuracion_cobro_inmueble; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_cobro_inmueble (
    configuracion_cobro_id integer NOT NULL,
    inmueble_id integer NOT NULL,
    concepto_cobro_id integer NOT NULL,
    monto_configurado numeric(12,2) DEFAULT 0 NOT NULL,
    es_obligatorio boolean DEFAULT false NOT NULL,
    vigencia_desde date NOT NULL,
    vigencia_hasta date,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: configuracion_cobro_inmueble_configuracion_cobro_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuracion_cobro_inmueble_configuracion_cobro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracion_cobro_inmueble_configuracion_cobro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuracion_cobro_inmueble_configuracion_cobro_id_seq OWNED BY public.configuracion_cobro_inmueble.configuracion_cobro_id;


--
-- Name: cuenta_bancaria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuenta_bancaria (
    cuenta_bancaria_id integer NOT NULL,
    empresa_id integer NOT NULL,
    banco_id integer NOT NULL,
    nombre_cuenta character varying(150) NOT NULL,
    numero_cuenta character varying(50) NOT NULL,
    cci character varying(50),
    moneda character(3) DEFAULT 'PEN'::bpchar NOT NULL,
    tipo_cuenta character varying(20) NOT NULL,
    saldo_inicial numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_actual numeric(12,2) DEFAULT 0 NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cuenta_bancaria_cuenta_bancaria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuenta_bancaria_cuenta_bancaria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuenta_bancaria_cuenta_bancaria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuenta_bancaria_cuenta_bancaria_id_seq OWNED BY public.cuenta_bancaria.cuenta_bancaria_id;


--
-- Name: cuenta_cobro_inmueble; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuenta_cobro_inmueble (
    cuenta_cobro_inmueble_id integer NOT NULL,
    inmueble_id integer NOT NULL,
    numero_recibo_base character varying(50) NOT NULL,
    dia_vencimiento smallint NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq OWNED BY public.cuenta_cobro_inmueble.cuenta_cobro_inmueble_id;


--
-- Name: indice_ipc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indice_ipc (
    indice_ipc_id integer NOT NULL,
    anio integer NOT NULL,
    porcentaje_anual numeric(8,4) NOT NULL,
    fecha_publicacion date,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: indice_ipc_indice_ipc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.indice_ipc_indice_ipc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: indice_ipc_indice_ipc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.indice_ipc_indice_ipc_id_seq OWNED BY public.indice_ipc.indice_ipc_id;


--
-- Name: movimiento_bancario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimiento_bancario (
    movimiento_bancario_id integer NOT NULL,
    cuenta_bancaria_id integer NOT NULL,
    categoria_movimiento_id integer NOT NULL,
    tipo_movimiento character varying(20) NOT NULL,
    inmueble_id integer,
    reserva_id integer,
    recibo_id integer,
    pago_id integer,
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    concepto character varying(200) NOT NULL,
    descripcion character varying(500),
    importe numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_anterior numeric(12,2),
    saldo_posterior numeric(12,2),
    referencia_externa character varying(150),
    observaciones character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: movimiento_bancario_movimiento_bancario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimiento_bancario_movimiento_bancario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_bancario_movimiento_bancario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimiento_bancario_movimiento_bancario_id_seq OWNED BY public.movimiento_bancario.movimiento_bancario_id;


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    pago_id integer NOT NULL,
    recibo_id integer NOT NULL,
    reserva_id integer,
    usuario_pagador_id integer NOT NULL,
    metodo_pago character varying(20) NOT NULL,
    proveedor_pasarela character varying(100),
    transaccion_externa character varying(150),
    referencia character varying(150),
    monto numeric(12,2) DEFAULT 0 NOT NULL,
    moneda character(3) DEFAULT 'PEN'::bpchar NOT NULL,
    estado_pago character varying(20) NOT NULL,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_confirmacion timestamp without time zone,
    observaciones character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pago_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pago_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pago_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pago_pago_id_seq OWNED BY public.pago.pago_id;


--
-- Name: recibo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recibo (
    recibo_id integer NOT NULL,
    cuenta_cobro_inmueble_id integer NOT NULL,
    reserva_id integer,
    periodo_anio integer NOT NULL,
    periodo_mes smallint NOT NULL,
    fecha_emision date NOT NULL,
    fecha_vencimiento date NOT NULL,
    estado_recibo character varying(20) NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    igv_total numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_pendiente numeric(12,2) DEFAULT 0 NOT NULL,
    generado_desde_recibo_id integer,
    emitido_por_usuario_id integer,
    pdf_url character varying(500),
    observaciones character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recibo_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recibo_detalle (
    recibo_detalle_id integer NOT NULL,
    recibo_id integer NOT NULL,
    concepto_cobro_id integer NOT NULL,
    descripcion character varying(200),
    cantidad numeric(12,2) DEFAULT 1 NOT NULL,
    precio_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    importe numeric(12,2) DEFAULT 0 NOT NULL,
    orden_impresion integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recibo_detalle_recibo_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recibo_detalle_recibo_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recibo_detalle_recibo_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recibo_detalle_recibo_detalle_id_seq OWNED BY public.recibo_detalle.recibo_detalle_id;


--
-- Name: recibo_recibo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recibo_recibo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recibo_recibo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recibo_recibo_id_seq OWNED BY public.recibo.recibo_id;


--
-- Name: tarifa_inmueble; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarifa_inmueble (
    tarifa_inmueble_id integer NOT NULL,
    inmueble_id integer NOT NULL,
    vigencia_desde date NOT NULL,
    vigencia_hasta date,
    renta_base_mensual numeric(12,2) DEFAULT 0 NOT NULL,
    porcentaje_ipc_aplicado numeric(8,4) DEFAULT 0 NOT NULL,
    monto_incremento numeric(12,2) DEFAULT 0 NOT NULL,
    motivo character varying(300),
    aplicado_por_usuario_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tarifa_inmueble_tarifa_inmueble_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tarifa_inmueble_tarifa_inmueble_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tarifa_inmueble_tarifa_inmueble_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tarifa_inmueble_tarifa_inmueble_id_seq OWNED BY public.tarifa_inmueble.tarifa_inmueble_id;


--
-- Name: banco banco_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco ALTER COLUMN banco_id SET DEFAULT nextval('public.banco_banco_id_seq'::regclass);


--
-- Name: categoria_movimiento categoria_movimiento_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_movimiento ALTER COLUMN categoria_movimiento_id SET DEFAULT nextval('public.categoria_movimiento_categoria_movimiento_id_seq'::regclass);


--
-- Name: concepto_cobro concepto_cobro_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepto_cobro ALTER COLUMN concepto_cobro_id SET DEFAULT nextval('public.concepto_cobro_concepto_cobro_id_seq'::regclass);


--
-- Name: configuracion_cobro_inmueble configuracion_cobro_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_cobro_inmueble ALTER COLUMN configuracion_cobro_id SET DEFAULT nextval('public.configuracion_cobro_inmueble_configuracion_cobro_id_seq'::regclass);


--
-- Name: cuenta_bancaria cuenta_bancaria_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta_bancaria ALTER COLUMN cuenta_bancaria_id SET DEFAULT nextval('public.cuenta_bancaria_cuenta_bancaria_id_seq'::regclass);


--
-- Name: cuenta_cobro_inmueble cuenta_cobro_inmueble_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta_cobro_inmueble ALTER COLUMN cuenta_cobro_inmueble_id SET DEFAULT nextval('public.cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq'::regclass);


--
-- Name: indice_ipc indice_ipc_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_ipc ALTER COLUMN indice_ipc_id SET DEFAULT nextval('public.indice_ipc_indice_ipc_id_seq'::regclass);


--
-- Name: movimiento_bancario movimiento_bancario_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario ALTER COLUMN movimiento_bancario_id SET DEFAULT nextval('public.movimiento_bancario_movimiento_bancario_id_seq'::regclass);


--
-- Name: pago pago_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago ALTER COLUMN pago_id SET DEFAULT nextval('public.pago_pago_id_seq'::regclass);


--
-- Name: recibo recibo_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo ALTER COLUMN recibo_id SET DEFAULT nextval('public.recibo_recibo_id_seq'::regclass);


--
-- Name: recibo_detalle recibo_detalle_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo_detalle ALTER COLUMN recibo_detalle_id SET DEFAULT nextval('public.recibo_detalle_recibo_detalle_id_seq'::regclass);


--
-- Name: tarifa_inmueble tarifa_inmueble_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifa_inmueble ALTER COLUMN tarifa_inmueble_id SET DEFAULT nextval('public.tarifa_inmueble_tarifa_inmueble_id_seq'::regclass);


--
-- Data for Name: banco; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banco (banco_id, nombre, codigo, activo, created_at) FROM stdin;
1	BCP	BCP	t	2026-07-14 05:59:02.962405
2	BCP	BCP	t	2026-07-14 06:53:35.182957
\.


--
-- Data for Name: categoria_movimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categoria_movimiento (categoria_movimiento_id, nombre, naturaleza, descripcion, activo, created_at) FROM stdin;
1	Mantenimiento	EGRESO	Gastos por mantenimiento, reparación o servicios del inmueble	t	2026-07-14 05:59:02.968804
2	Ingreso por alquiler	INGRESO	Ingresos recibidos por alquileres o boletas	t	2026-07-14 06:53:35.179302
\.


--
-- Data for Name: concepto_cobro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.concepto_cobro (concepto_cobro_id, codigo, nombre, descripcion, tipo_concepto, es_obligatorio, aplica_igv, monto_default, orden_impresion, activo, created_at) FROM stdin;
1	RENTA_RESERVA	Renta de reserva	Cobro proporcional de renta por los días reservados	INGRESO	t	t	0.00	1	t	2026-07-14 06:15:22.001504
\.


--
-- Data for Name: configuracion_cobro_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_cobro_inmueble (configuracion_cobro_id, inmueble_id, concepto_cobro_id, monto_configurado, es_obligatorio, vigencia_desde, vigencia_hasta, activo, created_at) FROM stdin;
\.


--
-- Data for Name: cuenta_bancaria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuenta_bancaria (cuenta_bancaria_id, empresa_id, banco_id, nombre_cuenta, numero_cuenta, cci, moneda, tipo_cuenta, saldo_inicial, saldo_actual, activa, created_at) FROM stdin;
1	1	1	Cuenta principal mantenimiento	000-111-222	00200011122233344455	PEN	AHORROS	5000.00	5000.00	t	2026-07-14 05:59:02.970523
\.


--
-- Data for Name: cuenta_cobro_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuenta_cobro_inmueble (cuenta_cobro_inmueble_id, inmueble_id, numero_recibo_base, dia_vencimiento, activo, created_at) FROM stdin;
1	2	REC-2-EDIF-3360160	5	t	2026-07-14 06:37:32.043769
\.


--
-- Data for Name: indice_ipc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.indice_ipc (indice_ipc_id, anio, porcentaje_anual, fecha_publicacion, activo, created_at) FROM stdin;
1	2026	3.5000	2026-07-14	t	2026-07-14 05:53:58.790038
\.


--
-- Data for Name: movimiento_bancario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimiento_bancario (movimiento_bancario_id, cuenta_bancaria_id, categoria_movimiento_id, tipo_movimiento, inmueble_id, reserva_id, recibo_id, pago_id, fecha_movimiento, concepto, descripcion, importe, saldo_anterior, saldo_posterior, referencia_externa, observaciones, created_at) FROM stdin;
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pago (pago_id, recibo_id, reserva_id, usuario_pagador_id, metodo_pago, proveedor_pasarela, transaccion_externa, referencia, monto, moneda, estado_pago, fecha_pago, fecha_confirmacion, observaciones, created_at) FROM stdin;
\.


--
-- Data for Name: recibo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recibo (recibo_id, cuenta_cobro_inmueble_id, reserva_id, periodo_anio, periodo_mes, fecha_emision, fecha_vencimiento, estado_recibo, subtotal, igv_total, total, saldo_pendiente, generado_desde_recibo_id, emitido_por_usuario_id, pdf_url, observaciones, created_at, updated_at) FROM stdin;
1	1	1	2026	5	2026-07-14	2026-07-14	PENDIENTE	749.97	134.99	884.96	884.96	\N	4	\N	Boleta generada desde finance-service con PostgreSQL	2026-07-14 06:37:32.043769	2026-07-14 06:37:32.043769
\.


--
-- Data for Name: recibo_detalle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recibo_detalle (recibo_detalle_id, recibo_id, concepto_cobro_id, descripcion, cantidad, precio_unitario, importe, orden_impresion, created_at) FROM stdin;
1	1	1	Renta de reserva por 9 día(s)	9.00	83.33	749.97	1	2026-07-14 06:37:32.043769
\.


--
-- Data for Name: tarifa_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tarifa_inmueble (tarifa_inmueble_id, inmueble_id, vigencia_desde, vigencia_hasta, renta_base_mensual, porcentaje_ipc_aplicado, monto_incremento, motivo, aplicado_por_usuario_id, created_at) FROM stdin;
\.


--
-- Name: banco_banco_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.banco_banco_id_seq', 2, true);


--
-- Name: categoria_movimiento_categoria_movimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categoria_movimiento_categoria_movimiento_id_seq', 2, true);


--
-- Name: concepto_cobro_concepto_cobro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.concepto_cobro_concepto_cobro_id_seq', 1, true);


--
-- Name: configuracion_cobro_inmueble_configuracion_cobro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configuracion_cobro_inmueble_configuracion_cobro_id_seq', 1, false);


--
-- Name: cuenta_bancaria_cuenta_bancaria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuenta_bancaria_cuenta_bancaria_id_seq', 1, true);


--
-- Name: cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuenta_cobro_inmueble_cuenta_cobro_inmueble_id_seq', 1, true);


--
-- Name: indice_ipc_indice_ipc_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.indice_ipc_indice_ipc_id_seq', 1, true);


--
-- Name: movimiento_bancario_movimiento_bancario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimiento_bancario_movimiento_bancario_id_seq', 1, false);


--
-- Name: pago_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pago_pago_id_seq', 1, false);


--
-- Name: recibo_detalle_recibo_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recibo_detalle_recibo_detalle_id_seq', 1, true);


--
-- Name: recibo_recibo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recibo_recibo_id_seq', 1, true);


--
-- Name: tarifa_inmueble_tarifa_inmueble_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tarifa_inmueble_tarifa_inmueble_id_seq', 1, false);


--
-- Name: banco banco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco
    ADD CONSTRAINT banco_pkey PRIMARY KEY (banco_id);


--
-- Name: categoria_movimiento categoria_movimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_movimiento
    ADD CONSTRAINT categoria_movimiento_pkey PRIMARY KEY (categoria_movimiento_id);


--
-- Name: concepto_cobro concepto_cobro_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepto_cobro
    ADD CONSTRAINT concepto_cobro_codigo_key UNIQUE (codigo);


--
-- Name: concepto_cobro concepto_cobro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepto_cobro
    ADD CONSTRAINT concepto_cobro_pkey PRIMARY KEY (concepto_cobro_id);


--
-- Name: configuracion_cobro_inmueble configuracion_cobro_inmueble_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_cobro_inmueble
    ADD CONSTRAINT configuracion_cobro_inmueble_pkey PRIMARY KEY (configuracion_cobro_id);


--
-- Name: cuenta_bancaria cuenta_bancaria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_pkey PRIMARY KEY (cuenta_bancaria_id);


--
-- Name: cuenta_cobro_inmueble cuenta_cobro_inmueble_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta_cobro_inmueble
    ADD CONSTRAINT cuenta_cobro_inmueble_pkey PRIMARY KEY (cuenta_cobro_inmueble_id);


--
-- Name: indice_ipc indice_ipc_anio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_ipc
    ADD CONSTRAINT indice_ipc_anio_key UNIQUE (anio);


--
-- Name: indice_ipc indice_ipc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indice_ipc
    ADD CONSTRAINT indice_ipc_pkey PRIMARY KEY (indice_ipc_id);


--
-- Name: movimiento_bancario movimiento_bancario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario
    ADD CONSTRAINT movimiento_bancario_pkey PRIMARY KEY (movimiento_bancario_id);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (pago_id);


--
-- Name: recibo_detalle recibo_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo_detalle
    ADD CONSTRAINT recibo_detalle_pkey PRIMARY KEY (recibo_detalle_id);


--
-- Name: recibo recibo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo
    ADD CONSTRAINT recibo_pkey PRIMARY KEY (recibo_id);


--
-- Name: tarifa_inmueble tarifa_inmueble_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarifa_inmueble
    ADD CONSTRAINT tarifa_inmueble_pkey PRIMARY KEY (tarifa_inmueble_id);


--
-- Name: idx_configuracion_cobro_inmueble; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracion_cobro_inmueble ON public.configuracion_cobro_inmueble USING btree (inmueble_id);


--
-- Name: idx_cuenta_bancaria_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuenta_bancaria_empresa ON public.cuenta_bancaria USING btree (empresa_id);


--
-- Name: idx_cuenta_cobro_inmueble; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuenta_cobro_inmueble ON public.cuenta_cobro_inmueble USING btree (inmueble_id);


--
-- Name: idx_movimiento_pago; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimiento_pago ON public.movimiento_bancario USING btree (pago_id);


--
-- Name: idx_movimiento_recibo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimiento_recibo ON public.movimiento_bancario USING btree (recibo_id);


--
-- Name: idx_movimiento_reserva; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimiento_reserva ON public.movimiento_bancario USING btree (reserva_id);


--
-- Name: idx_pago_recibo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pago_recibo ON public.pago USING btree (recibo_id);


--
-- Name: idx_pago_reserva; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pago_reserva ON public.pago USING btree (reserva_id);


--
-- Name: idx_recibo_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibo_estado ON public.recibo USING btree (estado_recibo);


--
-- Name: idx_recibo_reserva; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibo_reserva ON public.recibo USING btree (reserva_id);


--
-- Name: idx_tarifa_inmueble; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarifa_inmueble ON public.tarifa_inmueble USING btree (inmueble_id);


--
-- Name: configuracion_cobro_inmueble configuracion_cobro_inmueble_concepto_cobro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_cobro_inmueble
    ADD CONSTRAINT configuracion_cobro_inmueble_concepto_cobro_id_fkey FOREIGN KEY (concepto_cobro_id) REFERENCES public.concepto_cobro(concepto_cobro_id);


--
-- Name: cuenta_bancaria cuenta_bancaria_banco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_banco_id_fkey FOREIGN KEY (banco_id) REFERENCES public.banco(banco_id);


--
-- Name: movimiento_bancario movimiento_bancario_categoria_movimiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario
    ADD CONSTRAINT movimiento_bancario_categoria_movimiento_id_fkey FOREIGN KEY (categoria_movimiento_id) REFERENCES public.categoria_movimiento(categoria_movimiento_id);


--
-- Name: movimiento_bancario movimiento_bancario_cuenta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario
    ADD CONSTRAINT movimiento_bancario_cuenta_bancaria_id_fkey FOREIGN KEY (cuenta_bancaria_id) REFERENCES public.cuenta_bancaria(cuenta_bancaria_id);


--
-- Name: movimiento_bancario movimiento_bancario_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario
    ADD CONSTRAINT movimiento_bancario_pago_id_fkey FOREIGN KEY (pago_id) REFERENCES public.pago(pago_id);


--
-- Name: movimiento_bancario movimiento_bancario_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_bancario
    ADD CONSTRAINT movimiento_bancario_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibo(recibo_id);


--
-- Name: pago pago_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibo(recibo_id);


--
-- Name: recibo recibo_cuenta_cobro_inmueble_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo
    ADD CONSTRAINT recibo_cuenta_cobro_inmueble_id_fkey FOREIGN KEY (cuenta_cobro_inmueble_id) REFERENCES public.cuenta_cobro_inmueble(cuenta_cobro_inmueble_id);


--
-- Name: recibo_detalle recibo_detalle_concepto_cobro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo_detalle
    ADD CONSTRAINT recibo_detalle_concepto_cobro_id_fkey FOREIGN KEY (concepto_cobro_id) REFERENCES public.concepto_cobro(concepto_cobro_id);


--
-- Name: recibo_detalle recibo_detalle_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo_detalle
    ADD CONSTRAINT recibo_detalle_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibo(recibo_id) ON DELETE CASCADE;


--
-- Name: recibo recibo_generado_desde_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibo
    ADD CONSTRAINT recibo_generado_desde_recibo_id_fkey FOREIGN KEY (generado_desde_recibo_id) REFERENCES public.recibo(recibo_id);


--
-- PostgreSQL database dump complete
--

\unrestrict LQZvZKS0o7fJ9wmnB34aC2M2p1WDe3YL53zv5VmMZswkinHurKoDhiUZyL5UsZE

