const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8761;

/*
  Este objeto funcionara como un registro en memoria.
  Es el equivalente conceptual de Eureka.

  Ejemplo:
  services["catalog-service"] = {
    name: "catalog-service",
    host: "catalog-service",
    port: 8082,
    healthUrl: "http://catalog-service:8082/health",
    registeredAt: "..."
  }
*/
const services = {};

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE REGISTRY SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Registro de microservicios');
  console.log('========================================');
  console.log('');
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'registry-service',
    timestamp: new Date().toISOString()
  });
});

/*
  Endpoint para registrar un microservicio.
*/
app.post('/register', (req, res) => {
  const { name, host, port, healthUrl } = req.body;

  if (!name || !host || !port) {
    return res.status(400).json({
      message: 'Faltan datos obligatorios: name, host o port'
    });
  }

  services[name] = {
    name,
    host,
    port,
    healthUrl,
    registeredAt: new Date().toISOString()
  };

  console.log(`[REGISTRY-SERVICE] Servicio registrado: ${name} -> ${host}:${port}`);

  res.status(201).json({
    message: 'Servicio registrado correctamente',
    data: services[name]
  });
});

/*
  Lista todos los microservicios registrados.
*/
app.get('/services', (req, res) => {
  res.json({
    message: 'Servicios registrados',
    total: Object.keys(services).length,
    data: services
  });
});

/*
  Busca un microservicio por nombre.
*/
app.get('/services/:name', (req, res) => {
  const { name } = req.params;
  const service = services[name];

  if (!service) {
    return res.status(404).json({
      message: `Servicio no encontrado: ${name}`
    });
  }

  res.json({
    message: 'Servicio encontrado',
    data: service
  });
});

app.listen(PORT, () => {
  printBanner();
  console.log(`[REGISTRY-SERVICE] Ejecutandose en http://localhost:${PORT}`);
});