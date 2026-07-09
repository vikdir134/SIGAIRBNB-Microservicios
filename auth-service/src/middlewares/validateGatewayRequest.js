function validateGatewayRequest(req, res, next) {
  const gatewaySecret = req.header('x-gateway-secret');

  if (gatewaySecret !== process.env.GATEWAY_SECRET) {
    return res.status(403).json({
      message: 'Acceso denegado. Debes ingresar mediante el API Gateway.'
    });
  }

  next();
}

module.exports = validateGatewayRequest;