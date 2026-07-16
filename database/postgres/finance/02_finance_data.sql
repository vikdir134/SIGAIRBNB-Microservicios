--
-- PostgreSQL database dump
--

\restrict vcpX2ClLm4CsFkexsZ0fLWbHVpaoFdJJeaWeWylqYFufZohnsWNAPK5P4UmOoea

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

--
-- Data for Name: banco; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.banco (banco_id, nombre, codigo, activo, created_at) VALUES (1, 'BCP', 'BCP', true, '2026-07-14 05:59:02.962405');
INSERT INTO public.banco (banco_id, nombre, codigo, activo, created_at) VALUES (2, 'BCP', 'BCP', true, '2026-07-14 06:53:35.182957');


--
-- Data for Name: categoria_movimiento; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categoria_movimiento (categoria_movimiento_id, nombre, naturaleza, descripcion, activo, created_at) VALUES (1, 'Mantenimiento', 'EGRESO', 'Gastos por mantenimiento, reparación o servicios del inmueble', true, '2026-07-14 05:59:02.968804');
INSERT INTO public.categoria_movimiento (categoria_movimiento_id, nombre, naturaleza, descripcion, activo, created_at) VALUES (2, 'Ingreso por alquiler', 'INGRESO', 'Ingresos recibidos por alquileres o boletas', true, '2026-07-14 06:53:35.179302');


--
-- Data for Name: concepto_cobro; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.concepto_cobro (concepto_cobro_id, codigo, nombre, descripcion, tipo_concepto, es_obligatorio, aplica_igv, monto_default, orden_impresion, activo, created_at) VALUES (1, 'RENTA_RESERVA', 'Renta de reserva', 'Cobro proporcional de renta por los días reservados', 'INGRESO', true, true, 0.00, 1, true, '2026-07-14 06:15:22.001504');


--
-- Data for Name: configuracion_cobro_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: cuenta_bancaria; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cuenta_bancaria (cuenta_bancaria_id, empresa_id, banco_id, nombre_cuenta, numero_cuenta, cci, moneda, tipo_cuenta, saldo_inicial, saldo_actual, activa, created_at) VALUES (1, 1, 1, 'Cuenta principal mantenimiento', '000-111-222', '00200011122233344455', 'PEN', 'AHORROS', 5000.00, 5000.00, true, '2026-07-14 05:59:02.970523');


--
-- Data for Name: cuenta_cobro_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cuenta_cobro_inmueble (cuenta_cobro_inmueble_id, inmueble_id, numero_recibo_base, dia_vencimiento, activo, created_at) VALUES (1, 2, 'REC-2-EDIF-3360160', 5, true, '2026-07-14 06:37:32.043769');


--
-- Data for Name: indice_ipc; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.indice_ipc (indice_ipc_id, anio, porcentaje_anual, fecha_publicacion, activo, created_at) VALUES (1, 2026, 3.5000, '2026-07-14', true, '2026-07-14 05:53:58.790038');


--
-- Data for Name: recibo; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recibo (recibo_id, cuenta_cobro_inmueble_id, reserva_id, periodo_anio, periodo_mes, fecha_emision, fecha_vencimiento, estado_recibo, subtotal, igv_total, total, saldo_pendiente, generado_desde_recibo_id, emitido_por_usuario_id, pdf_url, observaciones, created_at, updated_at) VALUES (1, 1, 1, 2026, 5, '2026-07-14', '2026-07-14', 'PENDIENTE', 749.97, 134.99, 884.96, 884.96, NULL, 4, NULL, 'Boleta generada desde finance-service con PostgreSQL', '2026-07-14 06:37:32.043769', '2026-07-14 06:37:32.043769');


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: movimiento_bancario; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: recibo_detalle; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recibo_detalle (recibo_detalle_id, recibo_id, concepto_cobro_id, descripcion, cantidad, precio_unitario, importe, orden_impresion, created_at) VALUES (1, 1, 1, 'Renta de reserva por 9 día(s)', 9.00, 83.33, 749.97, 1, '2026-07-14 06:37:32.043769');


--
-- Data for Name: tarifa_inmueble; Type: TABLE DATA; Schema: public; Owner: -
--



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
-- PostgreSQL database dump complete
--

\unrestrict vcpX2ClLm4CsFkexsZ0fLWbHVpaoFdJJeaWeWylqYFufZohnsWNAPK5P4UmOoea

