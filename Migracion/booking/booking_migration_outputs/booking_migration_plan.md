# Migración de booking-service a MySQL

## Objetivo

Separar `booking-service` de la base compartida original y mover sus tablas propias a MySQL.

## Base destino

- Motor: MySQL 8
- Base: `staype_booking_db`
- Servicio dueño: `booking-service`

## Tablas propias

- `reserva`
- `reserva_evento`
- `evaluacion_inquilino`
- `solicitud_extension`

## Referencias lógicas

No se crean foreign keys hacia otros microservicios. Los siguientes campos se conservan como IDs externos:

- `reserva.inmueble_id` -> `catalog-service`
- `reserva.inquilino_id` -> `auth-service`
- `reserva.gestionado_por_usuario_id` -> `auth-service`
- `reserva.checkin_confirmado_por` -> `auth-service`
- `reserva.checkout_confirmado_por` -> `auth-service`
- `reserva.cancelado_por_usuario_id` -> `auth-service`
- `reserva_evento.usuario_id` -> `auth-service`
- `evaluacion_inquilino.evaluado_por_usuario_id` -> `auth-service`
- `solicitud_extension.solicitante_usuario_id` -> `auth-service`
- `solicitud_extension.decidido_por_usuario_id` -> `auth-service`

## Orden de trabajo

1. Agregar MySQL al `docker-compose.yml`.
2. Levantar `booking-mysql`.
3. Ejecutar `booking_schema_mysql.sql`.
4. Exportar datos desde Azure SQL usando `booking_data_export_queries.sql`.
5. Importar CSV en MySQL conservando IDs.
6. Cambiar `booking-service` para usar `mysql2`.
7. Convertir queries de `reserva.model.js` de SQL Server a MySQL.
8. Reemplazar joins externos con clientes internos:
   - `auth.client.js`
   - `catalog.client.js`
   - `finance.client.js`
9. Probar endpoints de reservas.

## Endpoints a validar primero

- `GET /api/reservas/internal/rango`
- `GET /api/reservas/mis-solicitudes`
- `GET /api/reservas/gestion/solicitudes`
- `POST /api/reservas/solicitudes`
