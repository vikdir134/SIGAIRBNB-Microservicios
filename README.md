# SIGAIRBNB / Stay.pe - Arquitectura de Microservicios

Este repositorio contiene la versión basada en microservicios del sistema **SIGAIRBNB / Stay.pe**, desarrollado originalmente como una aplicación monolítica con Node.js, Express, React y SQL Server.

La arquitectura fue reorganizada para separar responsabilidades por dominio, usando servicios independientes, un API Gateway, un servicio de configuración centralizada y un registro de servicios similar a Eureka.

Además, el sistema puede desplegarse localmente de dos formas:

```txt
1. Docker Compose
2. Kubernetes local con Docker Desktop
```

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
├── k8s
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

Ruta de prueba en Docker Compose:

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

Ruta de prueba en Docker Compose:

```txt
GET http://localhost:8761/services
```

---

### api-gateway

Es la **entrada única** hacia todos los microservicios.

El frontend ya no consume directamente a cada servicio, sino que todas las peticiones entran por el API Gateway:

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
registry-service
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
GET  http://localhost:8080/api/recibos/test
GET  http://localhost:8080/api/conceptos-cobro
GET  http://localhost:8080/api/pagos/mis-pagos
GET  http://localhost:8080/api/reportes/financiero-mensual
POST http://localhost:8080/api/pagos/recibos/:recibo_id/pagar-online
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

En Docker Compose, solo se exponen hacia la máquina local:

```txt
config-service
registry-service
api-gateway
```

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

Los archivos `.env` no deben subirse al repositorio porque contienen credenciales sensibles.

---

## Archivos `.env` requeridos

Cada integrante debe tener localmente estos archivos:

```txt
auth-service/.env
catalog-service/.env
booking-service/.env
finance-service/.env
```

Estos archivos son necesarios tanto para Docker Compose como para Kubernetes.

---

# Ejecución con Docker Compose

## Construir y levantar todos los servicios

```bash
docker compose up -d --build
```

## Levantar sin reconstruir

```bash
docker compose up -d
```

## Detener los servicios

```bash
docker compose down
```

## Ver estado de los contenedores

```bash
docker compose ps
```

## Ver logs

```bash
docker compose logs -f
```

## Ver servicios registrados

```txt
http://localhost:8761/services
```

## Probar el Gateway

```txt
http://localhost:8080/health
```

## Probar finance-service por Gateway

```txt
http://localhost:8080/api/recibos/test
```

Respuesta esperada:

```json
{
  "message": "Finance Service funcionando correctamente",
  "service": "finance-service"
}
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

# Despliegue Local con Kubernetes

Además de Docker Compose, el proyecto incluye una carpeta:

```txt
k8s/
```

Esta carpeta contiene los archivos YAML necesarios para desplegar los microservicios en Kubernetes local usando Docker Desktop.

Estructura:

```txt
k8s
├── namespace.yaml
├── config-service.yaml
├── registry-service.yaml
├── api-gateway.yaml
├── auth-service.yaml
├── catalog-service.yaml
├── booking-service.yaml
└── finance-service.yaml
```

---

## Requisitos para Kubernetes

Cada integrante debe tener:

```txt
Docker Desktop
Kubernetes habilitado en Docker Desktop
kubectl instalado
Archivos .env locales
Imágenes Docker construidas localmente
```

Para verificar Kubernetes:

```bash
kubectl version --client
```

```bash
kubectl get nodes
```

Debe aparecer un nodo en estado `Ready`.

Ejemplo:

```txt
desktop-control-plane   Ready
```

---

## Construcción de Imágenes Docker

Kubernetes utilizará las imágenes locales generadas por Docker.

Antes de aplicar los YAML, construir las imágenes:

```bash
docker compose build
```

También se puede usar:

```bash
docker compose up -d --build
docker compose down
```

Las imágenes esperadas son:

```txt
sigairbnb-microservicios-config-service
sigairbnb-microservicios-registry-service
sigairbnb-microservicios-api-gateway
sigairbnb-microservicios-auth-service
sigairbnb-microservicios-catalog-service
sigairbnb-microservicios-booking-service
sigairbnb-microservicios-finance-service
```

---

## Crear Namespace

```bash
kubectl apply -f .\k8s\namespace.yaml
```

El namespace utilizado es:

```txt
staype
```

---

## Crear ConfigMap

El `config-service` necesita leer el archivo:

```txt
config-repo/gateway.json
```

Para eso se crea un ConfigMap:

```bash
kubectl create configmap config-repo `
  --from-file=gateway.json=.\config-repo\gateway.json `
  -n staype `
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## Crear Secrets desde los `.env`

Los archivos YAML no contienen credenciales directamente.

Las variables sensibles se cargan mediante Secrets creados desde los archivos `.env`.

```bash
kubectl create secret generic auth-env `
  --from-env-file=.\auth-service\.env `
  -n staype `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic catalog-env `
  --from-env-file=.\catalog-service\.env `
  -n staype `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic booking-env `
  --from-env-file=.\booking-service\.env `
  -n staype `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic finance-env `
  --from-env-file=.\finance-service\.env `
  -n staype `
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## Aplicar los YAML de Kubernetes

```bash
kubectl apply -f .\k8s\
```

---

## Verificar Pods

```bash
kubectl get pods -n staype
```

Resultado esperado:

```txt
api-gateway        1/1 Running
auth-service       1/1 Running
booking-service    1/1 Running
catalog-service    1/1 Running
config-service     1/1 Running
finance-service    1/1 Running
registry-service   1/1 Running
```

---

## Verificar Services

```bash
kubectl get svc -n staype
```

Resultado esperado:

```txt
api-gateway        NodePort    8080:30080/TCP
registry-service   NodePort    8761:30761/TCP
auth-service       ClusterIP   8081/TCP
catalog-service    ClusterIP   8082/TCP
booking-service    ClusterIP   8083/TCP
finance-service    ClusterIP   8084/TCP
config-service     ClusterIP   8888/TCP
```

---

## Tipos de Service en Kubernetes

En este proyecto se usan principalmente dos tipos:

### ClusterIP

Se usa para microservicios internos:

```txt
auth-service
catalog-service
booking-service
finance-service
config-service
```

Estos servicios solo son accesibles dentro del clúster.

### NodePort

Se usa para servicios que necesitamos probar desde la computadora local:

```txt
api-gateway
registry-service
```

El `api-gateway` es la entrada principal al sistema.

El `registry-service` se expone para poder ver los servicios registrados durante las pruebas.

---

## Pruebas con port-forward

En algunos entornos de Docker Desktop, el acceso directo por NodePort puede no funcionar correctamente desde el navegador. Por eso se recomienda usar `kubectl port-forward`.

### Terminal 1: Registry

```bash
kubectl port-forward -n staype svc/registry-service 18761:8761
```

Abrir en navegador:

```txt
http://localhost:18761/services
```

Resultado esperado:

```json
{
  "message": "Servicios registrados",
  "total": 4,
  "data": {
    "auth-service": {},
    "catalog-service": {},
    "booking-service": {},
    "finance-service": {}
  }
}
```

### Terminal 2: API Gateway

```bash
kubectl port-forward -n staype svc/api-gateway 18080:8080
```

Probar en navegador:

```txt
http://localhost:18080/api/recibos/test
```

Respuesta esperada:

```json
{
  "message": "Finance Service funcionando correctamente",
  "service": "finance-service"
}
```

---

## Problema común: Registry vacío

En Kubernetes puede ocurrir que el registry aparezca así:

```json
{
  "message": "Servicios registrados",
  "total": 0,
  "data": {}
}
```

Esto ocurre porque Kubernetes no tiene `depends_on` como Docker Compose.

Algunos microservicios pueden iniciar antes de que el `registry-service` esté listo, intentan registrarse, fallan y no vuelven a intentarlo automáticamente.

Solución:

```bash
kubectl rollout restart deployment/auth-service -n staype
kubectl rollout restart deployment/catalog-service -n staype
kubectl rollout restart deployment/booking-service -n staype
kubectl rollout restart deployment/finance-service -n staype
kubectl rollout restart deployment/api-gateway -n staype
```

Luego revisar:

```bash
kubectl get pods -n staype
```

Y volver a probar:

```txt
http://localhost:18761/services
```

---

## Apagar y volver a probar Kubernetes

Cerrar las terminales donde corre `port-forward` no elimina Kubernetes.

Solo se corta el acceso temporal desde la máquina local.

Para volver a probar:

```bash
kubectl get pods -n staype
```

Si los pods siguen en `Running`, solo abrir nuevamente los port-forward:

```bash
kubectl port-forward -n staype svc/registry-service 18761:8761
```

```bash
kubectl port-forward -n staype svc/api-gateway 18080:8080
```

---

## Eliminar el despliegue de Kubernetes

Para eliminar todos los recursos del proyecto en Kubernetes:

```bash
kubectl delete namespace staype
```

Esto elimina:

```txt
Pods
Deployments
Services
ConfigMaps
Secrets
```

Para volver a desplegar, repetir:

```txt
1. Crear namespace
2. Crear ConfigMap
3. Crear Secrets
4. Aplicar los YAML
5. Verificar pods y services
6. Abrir port-forward
```

---

# Integración con Frontend

El frontend debe apuntar al API Gateway.

Para Docker Compose:

```env
VITE_API_URL=http://localhost:8080/api
```

Para Kubernetes usando port-forward:

```env
VITE_API_URL=http://localhost:18080/api
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

# Ejemplo de Trazabilidad

## Consulta de publicaciones

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

## Login

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

## Reservas

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

## Pagos

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

# Pruebas Básicas

## Config Service

```txt
GET http://localhost:8888/health
GET http://localhost:8888/config/gateway
```

## Registry Service

Docker Compose:

```txt
GET http://localhost:8761/health
GET http://localhost:8761/services
```

Kubernetes con port-forward:

```txt
GET http://localhost:18761/services
```

## API Gateway

Docker Compose:

```txt
GET http://localhost:8080/health
```

Kubernetes con port-forward:

```txt
GET http://localhost:18080/health
```

## Auth Service

Docker Compose:

```txt
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/perfil
```

Kubernetes con port-forward:

```txt
POST http://localhost:18080/api/auth/login
GET  http://localhost:18080/api/perfil
```

## Catalog Service

Docker Compose:

```txt
GET http://localhost:8080/api/publicaciones
GET http://localhost:8080/api/edificios
```

Kubernetes con port-forward:

```txt
GET http://localhost:18080/api/publicaciones
GET http://localhost:18080/api/edificios
```

## Booking Service

Docker Compose:

```txt
GET http://localhost:8080/api/reservas/mis-solicitudes
GET http://localhost:8080/api/reservas/gestion/solicitudes
```

Kubernetes con port-forward:

```txt
GET http://localhost:18080/api/reservas/mis-solicitudes
GET http://localhost:18080/api/reservas/gestion/solicitudes
```

## Finance Service

Docker Compose:

```txt
GET http://localhost:8080/api/recibos/test
GET http://localhost:8080/api/pagos/mis-pagos
GET http://localhost:8080/api/reportes/financiero-mensual
```

Kubernetes con port-forward:

```txt
GET http://localhost:18080/api/recibos/test
GET http://localhost:18080/api/pagos/mis-pagos
GET http://localhost:18080/api/reportes/financiero-mensual
```

---

# Resumen de la Arquitectura

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

# Estado Final

Con esta arquitectura, el sistema queda dividido por responsabilidades:

```txt
auth-service      → identidad, usuarios y notificaciones
catalog-service   → catálogo de inmuebles, publicaciones y disponibilidad
booking-service   → reservas, vetting, check-in, check-out y extensiones
finance-service   → conceptos de cobro, recibos, pagos, tarifas y reportes
```

El `api-gateway` centraliza el acceso, el `registry-service` mantiene el registro de servicios activos y el `config-service` centraliza la configuración de rutas.

Además, el sistema puede ejecutarse localmente mediante:

```txt
Docker Compose
Kubernetes local
```

Esta estructura permite escalar, mantener y desplegar cada módulo de forma más independiente.