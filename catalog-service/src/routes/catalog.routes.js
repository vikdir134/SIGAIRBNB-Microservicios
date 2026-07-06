const express = require('express');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({
    message: 'Catalog Service respondiendo correctamente',
    service: 'catalog-service',
    modulo: 'catalogo',
    funciones: [
      'edificios',
      'inmuebles',
      'publicaciones',
      'disponibilidad'
    ]
  });
});

router.get('/publicaciones/test', (req, res) => {
  res.json({
    message: 'Ruta de publicaciones funcionando desde catalog-service',
    flujo: 'Gateway -> Catalog Service -> respuesta'
  });
});

router.get('/edificios/test', (req, res) => {
  res.json({
    message: 'Ruta de edificios funcionando desde catalog-service',
    flujo: 'Gateway -> Catalog Service -> respuesta'
  });
});

module.exports = router;