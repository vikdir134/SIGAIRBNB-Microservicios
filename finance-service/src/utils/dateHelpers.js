const obtenerFecha = (valor) => {
  if (!valor) return null;

  if (valor instanceof Date) {
    return valor;
  }

  return new Date(valor);
};

const isDateNotAbsurd = (
  valor,
  {
    minYear = 1900,
    maxFutureYears = 5
  } = {}
) => {
  const fecha = obtenerFecha(valor);

  if (!fecha || Number.isNaN(fecha.getTime())) {
    return false;
  }

  const anio = fecha.getFullYear();
  const anioActual = new Date().getFullYear();

  return anio >= minYear && anio <= anioActual + maxFutureYears;
};

const validateYearAllowed = (
  anio,
  {
    minYear = 1900,
    maxFutureYears = 5
  } = {}
) => {
  const anioNumero = Number(anio);

  if (!Number.isInteger(anioNumero)) {
    return false;
  }

  const anioActual = new Date().getFullYear();

  return anioNumero >= minYear && anioNumero <= anioActual + maxFutureYears;
};

module.exports = {
  isDateNotAbsurd,
  validateYearAllowed
};