const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8888;

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE CONFIG SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Configuracion centralizada');
  console.log('========================================');
  console.log('');
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'config-service',
    timestamp: new Date().toISOString()
  });
});

/*
  Este endpoint cumple el rol del Config Server.
  Los demas servicios pueden pedir su configuracion por nombre.

  Ejemplo:
  GET /config/gateway
*/
app.get('/config/:serviceName', (req, res) => {
  const { serviceName } = req.params;

  const configFilePath = path.join(
    __dirname,
    '..',
    '..',
    'config-repo',
    `${serviceName}.json`
  );

  if (!fs.existsSync(configFilePath)) {
    return res.status(404).json({
      message: `No existe configuracion para el servicio: ${serviceName}`
    });
  }

  const fileContent = fs.readFileSync(configFilePath, 'utf8');
  const config = JSON.parse(fileContent);

  res.json({
    message: 'Configuracion obtenida correctamente',
    data: config
  });
});

app.listen(PORT, () => {
  printBanner();
  console.log(`[CONFIG-SERVICE] Ejecutandose en http://localhost:${PORT}`);
});