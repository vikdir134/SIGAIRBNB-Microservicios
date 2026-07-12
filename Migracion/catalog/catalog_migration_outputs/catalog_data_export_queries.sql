/*
  Consultas para exportar datos del dominio catalog desde la BD original.
  Ejecutar en Azure SQL / base original.

  Orden recomendado para cargar en staype_catalog_db:
  1. catalog.Inmueble
  2. catalog.Caracteristica
  3. catalog.Publicacion
  4. catalog.InmuebleFoto
  5. catalog.BloqueoDisponibilidad
  6. catalog.InmuebleCaracteristica

  Si importas con INSERT manual conservando IDs, usa SET IDENTITY_INSERT ON/OFF por tabla.
*/

SELECT *
FROM catalog.Inmueble
ORDER BY
  CASE WHEN edificio_id IS NULL THEN 0 ELSE 1 END,
  inmueble_id;

SELECT *
FROM catalog.Caracteristica
ORDER BY caracteristica_id;

SELECT *
FROM catalog.Publicacion
ORDER BY publicacion_id;

SELECT *
FROM catalog.InmuebleFoto
ORDER BY publicacion_id, orden_visual, inmueble_foto_id;

SELECT *
FROM catalog.BloqueoDisponibilidad
ORDER BY
  CASE WHEN bloqueo_padre_id IS NULL THEN 0 ELSE 1 END,
  bloqueo_disponibilidad_id;

SELECT *
FROM catalog.InmuebleCaracteristica
ORDER BY inmueble_caracteristica_id;
