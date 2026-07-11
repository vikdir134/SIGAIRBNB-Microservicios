const jwt = require('jsonwebtoken');

const normalizarRoles = (roles = []) => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.map((rol) => {
    if (typeof rol === 'string') {
      return rol.toUpperCase();
    }

    return String(
      rol?.nombre ||
      rol?.nombre_rol ||
      rol?.codigo ||
      rol?.codigo_rol ||
      ''
    ).toUpperCase();
  }).filter(Boolean);
};

const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        mensaje: 'No se envió token de autenticación.'
      });
    }

    const partes = authHeader.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({
        mensaje: 'Formato de token inválido.'
      });
    }

    const token = partes[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
      ...decoded,
      usuario_id: decoded.usuario_id || decoded.id,
      id: decoded.id || decoded.usuario_id,
      empresa_id: decoded.empresa_id,
      correo: decoded.correo,
      roles: decoded.roles || []
    };

    req.user = req.usuario;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado.'
    });
  }
};

const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolesUsuario = normalizarRoles(req.usuario?.roles);

    const rolesPermitidosNormalizados = rolesPermitidos.map((rol) =>
      String(rol).toUpperCase()
    );

    const tienePermiso = rolesUsuario.some((rol) =>
      rolesPermitidosNormalizados.includes(rol)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para acceder a esta opción.',
        roles_detectados: rolesUsuario
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  autorizarRoles
};