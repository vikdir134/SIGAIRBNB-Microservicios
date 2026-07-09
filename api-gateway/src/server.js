const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8080;
const CONFIG_SERVER_URL =
  process.env.CONFIG_SERVER_URL || 'http://localhost:8888';
const REGISTRY_SERVER_URL =
  process.env.REGISTRY_SERVER_URL || 'http://localhost:8761';
const GATEWAY_SECRET =
  process.env.GATEWAY_SECRET || 'staype-secret';

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('          STAY.PE API GATEWAY');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Entrada unica del sistema');
  console.log('========================================');
  console.log('');
}

async function obtenerConfiguracionGateway() {
  const response = await fetch(`${CONFIG_SERVER_URL}/config/gateway`);

  if (!response.ok) {
    throw new Error('No se pudo obtener la configuracion del Gateway');
  }

  const result = await response.json();
  return result.data;
}

async function obtenerServicio(serviceName) {
  const response = await fetch(`${REGISTRY_SERVER_URL}/services/${serviceName}`);

  if (!response.ok) {
    throw new Error(
      `Servicio no encontrado en registry-service: ${serviceName}`
    );
  }

  const result = await response.json();
  return result.data;
}

async function configurarRutas() {
  const gatewayConfig = await obtenerConfiguracionGateway();

  gatewayConfig.routes.forEach((route) => {
    /*
      El proxy se crea una sola vez por ruta.
      Antes se creaba en cada request, y eso generaba el warning
      de MaxListenersExceededWarning.
    */
    const proxy = createProxyMiddleware({
      target: 'http://localhost',
      changeOrigin: true,

      /*
        router permite cambiar el destino dinámicamente.
        El destino real se guarda en req.targetServiceUrl
        antes de ejecutar el proxy.
      */
      router: (req) => {
        return req.targetServiceUrl;
      },

      /*
        Mantiene la ruta original.
        Ejemplo:
        /api/reservas/mis-solicitudes
        llega igual al booking-service.
      */
      pathRewrite: (path, req) => {
        return req.originalUrl;
      },

      on: {
        proxyReq: (proxyReq) => {
          /*
            Header interno para que los microservicios validen
            que la petición vino desde el Gateway.
          */
          proxyReq.setHeader('x-gateway-secret', GATEWAY_SECRET);
        },

        error: (err, req, res) => {
          console.error(
            `[API-GATEWAY] Error al enrutar ${req.method} ${req.originalUrl}:`,
            err.message
          );

          if (!res.headersSent) {
            res.status(502).json({
              message: 'Error al comunicarse con el microservicio destino',
              error: err.message
            });
          }
        }
      }
    });

    app.use(route.path, async (req, res, next) => {
      try {
        const service = await obtenerServicio(route.service);
        const target = `http://${service.host}:${service.port}`;

        req.targetServiceUrl = target;

        console.log(
          `[API-GATEWAY] ${req.method} ${req.originalUrl} -> ${route.service} (${target})`
        );

        return proxy(req, res, next);
      } catch (error) {
        console.error(
          `[API-GATEWAY] No se pudo enrutar ${req.method} ${req.originalUrl}:`,
          error.message
        );

        return res.status(503).json({
          message: 'No se pudo enrutar la peticion',
          error: error.message
        });
      }
    });
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'STAY.PE API GATEWAY funcionando correctamente'
  });
});

configurarRutas()
  .then(() => {
    app.listen(PORT, () => {
      printBanner();
      console.log(`[API-GATEWAY] Ejecutandose en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[API-GATEWAY] Error al configurar rutas:', error.message);
    process.exit(1);
  });