// Calcula el máximo real de compañías activas que puede tener un módulo para el cliente actual.
export function getDefaultMaxCias(totalCompanias = 0) {
  const count = Number(totalCompanias);
  if (!Number.isFinite(count) || count <= 0) return 1;
  return count;
}

// Normaliza el valor ingresado para no exceder el total disponible del cliente.
export function resolveMaxCias(input, totalCompanias) {
  const cap = getDefaultMaxCias(totalCompanias);
  const parsed = Number(input);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return cap;
  }

  return Math.min(parsed, cap);
}
