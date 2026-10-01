/**
 * Limpia y normaliza texto para crear identificadores empresariales
 */
export const cleanStringForCredentials = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
    .replace(/[^a-z0-9]/g, ''); // Solo caracteres alfanuméricos
};

/**
 * Genera un correo y contraseña corporativa estándar a partir de nombre y apellido
 */
export const generateCorporateCredentials = (
  nombre: string = '',
  apellido: string = ''
): { email: string; password: string } => {
  const firstName = (nombre.trim().split(/\s+/)[0] || '').toLowerCase();
  const cleanLastName = cleanStringForCredentials(apellido.trim());
  const cleanFirstName = cleanStringForCredentials(firstName);

  let email = '';
  if (cleanFirstName && cleanLastName) {
    email = `${cleanFirstName.charAt(0)}${cleanLastName}@transroyal.com`;
  } else if (cleanFirstName) {
    email = `${cleanFirstName}@transroyal.com`;
  }

  const currentYear = new Date().getFullYear();
  const capNombre = cleanFirstName 
    ? cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1) 
    : 'Royal';
  const password = `Royal${capNombre}${currentYear}*`;

  return { email, password };
};
