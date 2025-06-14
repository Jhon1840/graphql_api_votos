/**
 * Formatea un UUID al formato estándar con guiones
 * @param uuid - El UUID a formatear (con o sin guiones)
 * @returns El UUID formateado con guiones en formato estándar (8-4-4-4-12)
 */
export const formatearUUID = (uuid: string): string => {
  // Remover cualquier guión existente y convertir a minúsculas
  const uuidSinGuiones = uuid.replace(/-/g, '').toLowerCase();
  
  // Validar que sea un UUID válido
  if (!esUUIDValido(uuidSinGuiones)) {
    throw new Error(`UUID inválido: ${uuid}`);
  }
  
  // Formatear con guiones en las posiciones estándar
  return `${uuidSinGuiones.slice(0, 8)}-${uuidSinGuiones.slice(8, 12)}-${uuidSinGuiones.slice(12, 16)}-${uuidSinGuiones.slice(16, 20)}-${uuidSinGuiones.slice(20)}`;
};

/**
 * Valida si un string es un UUID válido (con o sin guiones)
 * @param uuid - El UUID a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export const esUUIDValido = (uuid: string): boolean => {
  // Remover guiones para la validación
  const uuidSinGuiones = uuid.replace(/-/g, '');
  
  // Validar que sea una cadena de 32 caracteres hexadecimales
  const uuidRegex = /^[0-9a-f]{32}$/i;
  return uuidRegex.test(uuidSinGuiones);
}; 