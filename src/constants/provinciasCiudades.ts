export const PROVINCIAS_CIUDADES: Record<string, string[]> = {
  "Distrito Nacional": ["Santo Domingo (Distrito Nacional)", "Santo Domingo", "Distrito Nacional"],
  "Azua": [
    "Azua de Compostela",
    "Azua",
    "Estebanía",
    "Guayabal",
    "Las Charcas",
    "Las Yayas de Viajama",
    "Padre Las Casas",
    "Peralta",
    "Pueblo Viejo",
    "Sabana Yegua",
    "Tábara Arriba"
  ],
  "Bahoruco": [
    "Neiba",
    "Galván",
    "Los Ríos",
    "Tamayo",
    "Villa Jaragua"
  ],
  "Barahona": [
    "Barahona",
    "Cabral",
    "El Peñón",
    "Enriquillo",
    "Jaquimeyes",
    "Las Salinas",
    "Paraíso",
    "Polo",
    "Vicente Noble"
  ],
  "Dajabón": [
    "Dajabón",
    "El Pino",
    "Loma de Cabrera",
    "Partido",
    "Restauración"
  ],
  "Duarte": [
    "San Francisco de Macorís",
    "San Francisco",
    "Arenoso",
    "Castillo",
    "Las Guáranas",
    "Pimentel",
    "Villa Riva"
  ],
  "El Seibo": [
    "Santa Cruz de El Seibo",
    "El Seibo",
    "Miches"
  ],
  "Elías Piña": [
    "Comendador",
    "Bánica",
    "El Llano",
    "Hondo Valle",
    "Juan Santiago",
    "Pedro Santana"
  ],
  "Espaillat": [
    "Moca",
    "Cayetano Germosén",
    "Gaspar Hernández",
    "Jamao al Norte"
  ],
  "Hato Mayor": [
    "Hato Mayor del Rey",
    "Hato Mayor",
    "El Valle",
    "Sabana de la Mar"
  ],
  "Hermanas Mirabal": [
    "Salcedo",
    "Tenares",
    "Villa Tapia"
  ],
  "Independencia": [
    "Jimaní",
    "Cristóbal",
    "Duvergé",
    "La Descubierta",
    "Mella",
    "Postrer Río"
  ],
  "La Altagracia": [
    "Higüey",
    "Punta Cana",
    "Bávaro",
    "San Rafael del Yuma",
    "Verón"
  ],
  "La Romana": [
    "La Romana",
    "Guaymate",
    "Villa Hermosa"
  ],
  "La Vega": [
    "Concepción de La Vega",
    "La Vega",
    "Constanza",
    "Jarabacoa",
    "Jima Abajo"
  ],
  "María Trinidad Sánchez": [
    "Nagua",
    "Cabrera",
    "El Factor",
    "Río San Juan"
  ],
  "Monseñor Nouel": [
    "Bonao",
    "Maimón",
    "Piedra Blanca"
  ],
  "Monte Cristi": [
    "San Fernando de Monte Cristi",
    "Monte Cristi",
    "Castañuelas",
    "Guayubín",
    "Las Matas de Santa Cruz",
    "Pepillo Salcedo",
    "Villa Vásquez"
  ],
  "Monte Plata": [
    "Monte Plata",
    "Bayaguana",
    "Peralvillo",
    "Sabana Grande de Boyá",
    "Yamasá"
  ],
  "Pedernales": [
    "Pedernales",
    "Oviedo"
  ],
  "Peravia": [
    "Baní",
    "Matanzas",
    "Nizao"
  ],
  "Puerto Plata": [
    "San Felipe de Puerto Plata",
    "Puerto Plata",
    "Altamira",
    "Guananico",
    "Imbert",
    "Los Hidalgos",
    "Luperón",
    "Sosúa",
    "Cabarete",
    "Villa Isabela",
    "Villa Montellano"
  ],
  "Samaná": [
    "Samaná",
    "Las Terrenas",
    "Sánchez"
  ],
  "San Cristóbal": [
    "San Cristóbal",
    "Bajos de Haina",
    "Haina",
    "Cambita Garabitos",
    "Los Cacaos",
    "Sabana Grande de Palenque",
    "San Gregorio de Nigua",
    "Villa Altagracia",
    "Yaguate"
  ],
  "San José de Ocoa": [
    "San José de Ocoa",
    "Rancho Arriba",
    "Sabana Larga"
  ],
  "San Juan": [
    "San Juan de la Maguana",
    "San Juan",
    "Bohechío",
    "El Cercado",
    "Juan de Herrera",
    "Las Matas de Farfán",
    "Vallejuelo"
  ],
  "San Pedro de Macorís": [
    "San Pedro de Macorís",
    "Consuelo",
    "El Puerto",
    "Quisqueya",
    "Ramón Santana",
    "San José de los Llanos"
  ],
  "Sánchez Ramírez": [
    "Cotuí",
    "Cevicos",
    "Fantino",
    "Villa La Mata"
  ],
  "Santiago": [
    "Santiago de los Caballeros",
    "Santiago",
    "Bisonó",
    "Jánico",
    "Licey al Medio",
    "Puñal",
    "Sabana Iglesia",
    "San José de las Matas",
    "Tamboril",
    "Villa González"
  ],
  "Santiago Rodríguez": [
    "San Ignacio de Sabaneta",
    "Sabaneta",
    "Santiago Rodríguez",
    "Monción",
    "Villa Los Almácigos"
  ],
  "Santo Domingo": [
    "Santo Domingo Este",
    "Santo Domingo Oeste",
    "Santo Domingo Norte",
    "Boca Chica",
    "Los Alcarrizos",
    "Pedro Brand",
    "San Antonio de Guerra"
  ],
  "Valverde": [
    "Mao",
    "Esperanza",
    "Laguna Salada"
  ]
};

export const LISTA_PROVINCIAS = Object.keys(PROVINCIAS_CIUDADES).sort();

export interface ProvinciaCiudadesData {
  provincia: string;
  ciudad: string;
}

/**
 * Intenta encontrar a qué provincia pertenece una ciudad dada.
 * Realiza una búsqueda insensible a mayúsculas/minúsculas y elimina acentos para mayor flexibilidad.
 */
export function encontrarProvinciaPorCiudad(ciudadNombre: string): string | null {
  if (!ciudadNombre) return null;
  
  const normalizar = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const ciudadNorm = normalizar(ciudadNombre);

  // Primero buscamos una coincidencia exacta normalizada
  for (const [provincia, ciudades] of Object.entries(PROVINCIAS_CIUDADES)) {
    if (ciudades.some(c => normalizar(c) === ciudadNorm)) {
      return provincia;
    }
  }

  // Si no hay coincidencia exacta, probamos si contiene o está contenida
  for (const [provincia, ciudades] of Object.entries(PROVINCIAS_CIUDADES)) {
    if (ciudades.some(c => {
      const cNorm = normalizar(c);
      return cNorm.includes(ciudadNorm) || ciudadNorm.includes(cNorm);
    })) {
      return provincia;
    }
  }

  return null;
}
