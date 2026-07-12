# Migración limpia de catalog-service a base independiente SQL Server

## Decisión

El `catalog-service` usará una base SQL Server independiente:

```txt
staype_catalog_db
```

El servicio solo será dueño de las tablas del dominio `catalog`.

## Tablas propias del catalog-service

```txt
catalog.Inmueble
catalog.Publicacion
catalog.InmuebleFoto
catalog.BloqueoDisponibilidad
catalog.Caracteristica
catalog.InmuebleCaracteristica
```

## Relaciones que se mantienen como foreign keys físicas

Estas relaciones son internas del dominio `catalog`, por eso sí pueden mantenerse:

```txt
Publicacion.inmueble_id -> Inmueble.inmueble_id
InmuebleFoto.publicacion_id -> Publicacion.publicacion_id
BloqueoDisponibilidad.inmueble_id -> Inmueble.inmueble_id
BloqueoDisponibilidad.bloqueo_padre_id -> BloqueoDisponibilidad.bloqueo_disponibilidad_id
Inmueble.edificio_id -> Inmueble.inmueble_id
InmuebleCaracteristica.inmueble_id -> Inmueble.inmueble_id
InmuebleCaracteristica.caracteristica_id -> Caracteristica.caracteristica_id
```

## Relaciones que pasan a ser referencias lógicas

Estas relaciones ya no deben ser foreign keys físicas porque pertenecen a otros dominios:

```txt
Inmueble.empresa_id -> auth/core service
Publicacion.publicado_por_usuario_id -> auth-service
```

Los campos se conservan, pero sin FK.

## Problema detectado en los models

El `catalog-service` todavía consulta directamente `booking.Reserva` en:

```txt
src/models/publicacion.model.js
src/models/disponibilidad.model.js
```

Esto rompe la separación limpia porque `booking.Reserva` será propiedad del `booking-service`.

## Solución limpia

Crear un cliente interno:

```txt
src/clients/booking.client.js
```

Ese cliente consultará endpoints internos del `booking-service`.

Endpoints sugeridos en booking-service:

```txt
GET /api/internal/reservas/conflictos?inmueble_id=:id&fecha_inicio=:fecha_inicio&fecha_fin=:fecha_fin&estados=APROBADA,ACTIVA
GET /api/internal/reservas/rango?empresa_id=:empresa_id&inmueble_id=:id&fecha_inicio=:fecha_inicio&fecha_fin=:fecha_fin
```

## Orden de trabajo

1. Ejecutar `catalog_schema_sqlserver_limpio.sql`.
2. Migrar datos de las tablas catalog desde la BD original.
3. Apuntar `catalog-service/.env` a `staype_catalog_db`.
4. Probar endpoints que solo usan catalog.
5. Crear `booking.client.js`.
6. Reemplazar las consultas directas a `booking.Reserva`.
7. Probar endpoints de publicaciones y disponibilidad con filtros de fecha.
