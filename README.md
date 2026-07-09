# SIGAIRBNB / Stay.pe - Arquitectura de Microservicios

Este repositorio contiene la versión basada en microservicios del sistema **SIGAIRBNB / Stay.pe**, desarrollado originalmente como una aplicación monolítica con Node.js, Express, React y SQL Server.

La arquitectura fue reorganizada para separar responsabilidades por dominio, usando servicios independientes, un API Gateway, un servicio de configuración centralizada y un registro de servicios similar a Eureka.

---

## Arquitectura General

La arquitectura está compuesta por microservicios de infraestructura y microservicios de negocio.

```txt
SIGAIRBNB-Microservicios
│
├── config-service
├── registry-service
├── api-gateway
│
├── auth-service
├── catalog-service
├── booking-service
├── finance-service
│
├── config-repo
└── docker-compose.yml
```

---

## Microservicios de Infraestructura

### config-service

Equivale conceptualmente a un **Config Server**.

Su función es centralizar la configuración de rutas del sistema. El Gateway no tiene las rutas escritas directamente en su código, sino que las obtiene desde el archivo:

```txt
config-repo/gateway.json
```

Ejemplo de configuración:

```json
{
  "path": "/api/publicaciones",
  "service": "catalog-service"
}
```

Esto indica que toda petición que empiece con `/api/publicaciones` debe ser enviada al microservicio `catalog-service`.

Puerto:

```txt
8888
```

Ruta de prueba:

```txt
GET http://localhost:8888/config/gateway
```

---

### registry-service

Equivale conceptualmente a **Eureka Server**.

Su función es registrar los microservicios activos y permitir que el Gateway consulte dónde se encuentra cada servicio.

Cuando un microservicio inicia, se registra automáticamente en el `registry-service`.

Ejemplo:

```json
{
  "name": "catalog-service",
  "host": "catalog-service",
  "port": 8082
}
```

Puerto:

```txt
8761
```

Ruta de prueba:

```txt
GET http://localhost:8761/services
```

---

### api-gateway

Es la **entrada única** hacia todos los microservicios.

El frontend ya no consume directamente a cada servicio, sino que todas las peticiones entran por:

```txt
http://localhost:8080/api
```

El Gateway consulta el `config-service` para saber a qué microservicio pertenece cada ruta y luego consulta el `registry-service` para obtener el host y puerto real del servicio.

Puerto:

```txt
8080
```

Ejemplo:

```txt
GET http://localhost:8080/api/publicaciones
```

Flujo:

```txt
Frontend
   ↓
api-gateway
   ↓
catalog-service
```

---

## Microservicios de Negocio

### auth-service

Microservicio encargado de la autenticación, usuarios, perfil y notificaciones.

Maneja rutas como:

```txt
/api/auth
/api/perfil
/api/notificaciones
```

Responsabilidades principales:

```txt
Login
Registro
Verificación de correo
Recuperación de contraseña
Perfil de usuario
Notificaciones
Validación JWT
```

Puerto interno:

```txt
8081
```

Ejemplos:

```txt
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/perfil
GET  http://localhost:8080/api/notificaciones/contador/no-leidas
```

---

### catalog-service

Microservicio encargado del catálogo de inmuebles y publicaciones.

Maneja rutas como:

```txt
/api/edificios
/api/publicaciones
/api/disponibilidad
```

Responsabilidades principales:

```txt
Gestión de edificios
Gestión de inmuebles
Publicaciones públicas
Fotos de publicaciones
Disponibilidad
Bloqueos de disponibilidad
```

Puerto interno:

```txt
8082
```

Ejemplos:

```txt
GET http://localhost:8080/api/publicaciones
GET http://localhost:8080/api/edificios
GET http://localhost:8080/api/disponibilidad
```

---

### booking-service

Microservicio encargado de las reservas.

Maneja rutas como:

```txt
/api/reservas
```

Responsabilidades principales:

```txt
Solicitudes de reserva
Mis solicitudes
Gestión de solicitudes
Aprobación y rechazo de reservas
Vetting de inquilinos
Evaluaciones
Check-in
Check-out
Extensiones de reserva
Cancelaciones
Historial de eventos de reserva
```

Puerto interno:

```txt
8083
```

Ejemplos:

```txt
GET  http://localhost:8080/api/reservas/mis-solicitudes
GET  http://localhost:8080/api/reservas/gestion/solicitudes
POST http://localhost:8080/api/reservas/solicitudes
PATCH http://localhost:8080/api/reservas/gestion/solicitudes/:reserva_id/checkin
PATCH http://localhost:8080/api/reservas/gestion/solicitudes/:reserva_id/checkout
```

---

### finance-service

Microservicio encargado de la parte financiera del sistema.

Maneja rutas como:

```txt
/api/conceptos-cobro
/api/recibos
/api/pagos
/api/mantenimiento
/api/ingresos-alquiler
/api/tarifas
/api/reportes
```

Responsabilidades principales:

```txt
Conceptos de cobro
Recibos digitales
Pagos online
Pagos pendientes
Historial de pagos
Gastos de mantenimiento
Ingresos por alquiler
Tarifas
IPC
Reportes financieros
Reportes de pagos y deudores
Dashboard de KPIs
```

Puerto interno:

```txt
8084
```

Ejemplos:

```txt
GET  http://localhost:8080/api/recibos
GET  http://localhost:8080/api/pagos/mis-pagos
GET  http://localhost:8080/api/reportes/financiero-mensual
POST http://localhost:8080/api/pagos/pagar-online
```

---

## Puertos Utilizados

```txt
config-service     → 8888
registry-service   → 8761
api-gateway        → 8080
auth-service       → 8081
catalog-service    → 8082
booking-service    → 8083
finance-service    → 8084
```

Solo el `api-gateway`, el `config-service` y el `registry-service` exponen puertos hacia la máquina local.

Los microservicios de negocio usan `expose`, por lo que solo son accesibles dentro de la red interna de Docker.

---

## Seguridad Interna entre Servicios

Los microservicios de negocio no deben ser consumidos directamente por el cliente.

Para eso se utiliza un middleware llamado:

```txt
validateGatewayRequest
```

Este middleware valida que la petición tenga el header:

```txt
x-gateway-secret
```

El API Gateway agrega este header automáticamente antes de reenviar la petición.

Ejemplo:

```js
proxyReq.setHeader('x-gateway-secret', GATEWAY_SECRET);
```

Si una petición intenta entrar directamente a un microservicio sin pasar por el Gateway, el servicio responde:

```json
{
  "message": "Acceso denegado. Debes ingresar mediante el API Gateway."
}
```

---

## Base de Datos

En esta fase, los microservicios siguen utilizando la base de datos principal en SQL Server / Azure SQL Database.

Esto permite migrar el sistema progresivamente sin perder datos ni romper la lógica existente.

La separación final propuesta sería:

```txt
auth-service      → Base de datos de autenticación
catalog-service   → Base de datos de catálogo
booking-service   → Base de datos de reservas
finance-service   → Base de datos financiera
```

Actualmente, los servicios se conectan a la misma base principal para mantener compatibilidad con los datos ya existentes.

---

## Variables de Entorno

Cada microservicio tiene su propio archivo `.env`.

Ejemplo general:

```env
PORT=8081
SERVICE_NAME=auth-service
REGISTRY_SERVER_URL=http://registry-service:8761
GATEWAY_SECRET=staype-secret

DB_USER=usuario_sql
DB_PASSWORD=password_sql
DB_SERVER=servidor.database.windows.net
DB_DATABASE=nombre_base_datos
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

JWT_SECRET=clave_jwt
```

Es importante que todos los microservicios que validan tokens usen el mismo:

```env
JWT_SECRET
```

---

## Ejecución con Docker Compose

Para construir y levantar todos los servicios:

```bash
docker compose up --build
```

Para detener los servicios:

```bash
docker compose down
```

Para ver los servicios registrados:

```txt
http://localhost:8761/services
```

Para probar el Gateway:

```txt
http://localhost:8080
```

---

## Orden Conceptual de Arranque

Aunque Docker Compose automatiza el proceso, el orden lógico es:

```txt
1. config-service
2. registry-service
3. auth-service
4. catalog-service
5. booking-service
6. finance-service
7. api-gateway
```

El `config-service` debe estar disponible primero porque el Gateway obtiene de ahí sus rutas.

El `registry-service` debe estar disponible antes de los microservicios de negocio porque ellos se registran ahí al iniciar.

El `api-gateway` se encarga finalmente de enrutar las peticiones hacia los microservicios registrados.

---

## Ejemplo de Trazabilidad

### Consulta de publicaciones

```txt
GET http://localhost:8080/api/publicaciones
```

Flujo:

```txt
Frontend
   ↓
api-gateway
   ↓
config-service indica que /api/publicaciones pertenece a catalog-service
   ↓
registry-service indica que catalog-service está en catalog-service:8082
   ↓
catalog-service
   ↓
SQL Server
```

---

### Login

```txt
POST http://localhost:8080/api/auth/login
```

Flujo:

```txt
Frontend
   ↓
api-gateway
   ↓
auth-service
   ↓
SQL Server
   ↓
JWT
```

---

### Reservas

```txt
GET http://localhost:8080/api/reservas/mis-solicitudes
```

Flujo:

```txt
Frontend
   ↓
api-gateway
   ↓
booking-service
   ↓
Validación JWT
   ↓
SQL Server
```

---

### Pagos

```txt
GET http://localhost:8080/api/pagos/mis-pagos
```

Flujo:

```txt
Frontend
   ↓
api-gateway
   ↓
finance-service
   ↓
Validación JWT
   ↓
SQL Server
```

---

## Pruebas Básicas

### Config Service

```txt
GET http://localhost:8888/health
GET http://localhost:8888/config/gateway
```

### Registry Service

```txt
GET http://localhost:8761/health
GET http://localhost:8761/services
```

### API Gateway

```txt
GET http://localhost:8080/health
```

### Auth Service

```txt
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/perfil
```

### Catalog Service

```txt
GET http://localhost:8080/api/publicaciones
GET http://localhost:8080/api/edificios
```

### Booking Service

```txt
GET http://localhost:8080/api/reservas/mis-solicitudes
GET http://localhost:8080/api/reservas/gestion/solicitudes
```

### Finance Service

```txt
GET http://localhost:8080/api/pagos/mis-pagos
GET http://localhost:8080/api/reportes/financiero-mensual
```

---

## Integración con Frontend

El frontend debe apuntar al API Gateway:

```ts
const API_URL = 'http://localhost:8080/api';

export default API_URL;
```

De esta forma, el frontend no necesita saber qué microservicio atiende cada ruta.

Ejemplo:

```txt
/api/auth/login           → auth-service
/api/publicaciones        → catalog-service
/api/reservas             → booking-service
/api/pagos                → finance-service
```

---

## Resumen de la Arquitectura

```txt
Frontend React
   ↓
API Gateway
   ↓
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ auth-service          │ catalog-service       │ booking-service       │ finance-service       │
│ Login                 │ Publicaciones         │ Reservas              │ Pagos                 │
│ Perfil                │ Edificios             │ Check-in/out          │ Recibos               │
│ Notificaciones        │ Disponibilidad        │ Extensiones           │ Reportes              │
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
   ↓
SQL Server / Azure SQL Database
```

---

## Estado Final Esperado

Con esta arquitectura, el sistema queda dividido por responsabilidades:

```txt
auth-service      → identidad y usuarios
catalog-service   → catálogo de inmuebles
booking-service   → reservas
finance-service   → finanzas
```

El `api-gateway` centraliza el acceso, el `registry-service` mantiene el registro de servicios activos y el `config-service` centraliza la configuración de rutas.

Esta estructura permite escalar, mantener y desplegar cada módulo de forma más independiente.