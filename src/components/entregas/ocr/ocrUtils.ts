
export function extractConduceNumber(text: string): string | null {
  console.log('🔍 Analizando texto para código de conduce:', text.substring(0, 100));
  
  // Limpiar el texto de caracteres especiales y espacios extra
  const cleanedText = text.replace(/[^\d\s]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('🧹 Texto limpio:', cleanedText);
  
  // Patrones específicos para códigos de barras que empiezan con 8080 o 8081
  const conducePatterns = [
    // Patrón específico para códigos que empiezan con 8080 (8 dígitos)
    /\b8080\d{4}\b/gi,
    // Patrón específico para códigos que empiezan con 8081 (8 dígitos)
    /\b8081\d{4}\b/gi,
    // Secuencias separadas por espacios para 8080
    /\b8\s*0\s*8\s*0\s*(\d)\s*(\d)\s*(\d)\s*(\d)\b/gi,
    // Secuencias separadas por espacios para 8081
    /\b8\s*0\s*8\s*1\s*(\d)\s*(\d)\s*(\d)\s*(\d)\b/gi
  ];
  
  // Buscar coincidencias con prioridad
  for (let i = 0; i < conducePatterns.length; i++) {
    const pattern = conducePatterns[i];
    const matches = cleanedText.match(pattern);
    
    if (matches && matches.length > 0) {
      console.log(`✅ Patrón ${i + 1} encontró coincidencias:`, matches);
      
      for (const match of matches) {
        // Limpiar el match de espacios internos
        const cleanMatch = match.replace(/\s+/g, '');
        
        // Validar que es un número válido
        if (cleanMatch.length >= 6 && cleanMatch.length <= 10 && /^\d+$/.test(cleanMatch)) {
          console.log('🎯 Código de conduce seleccionado:', cleanMatch);
          return cleanMatch;
        }
      }
    }
  }
  
  // Búsqueda adicional SOLO para números que empiecen con 8080 o 8081
  const allNumbers = cleanedText.match(/\d+/g);
  if (allNumbers && allNumbers.length > 0) {
    console.log('🔢 Números encontrados:', allNumbers);
    
    // Buscar números que empiecen específicamente con 8080 o 8081
    for (const num of allNumbers) {
      if ((num.startsWith('8080') || num.startsWith('8081')) && num.length === 8) {
        console.log('🎯 Código de conduce válido encontrado:', num);
        return num;
      }
    }
  }
  
  console.log('❌ No se encontraron patrones de código de conduce');
  return null;
}

export function extractFacturaNumber(text: string): string | null {
  console.log('🔍 Analizando texto para número de factura:', text.substring(0, 100));
  
  // Limpiar el texto de caracteres especiales y espacios extra
  const cleanedText = text.replace(/[^\d\s]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('🧹 Texto limpio para factura:', cleanedText);
  
  // Patrones específicos para números de factura que empiezan con 90 o 91
  const facturaPatterns = [
    // Patrón específico para facturas que empiezan con 90
    /\b90\d{6,8}\b/gi,
    // Patrón específico para facturas que empiezan con 91
    /\b91\d{6,8}\b/gi,
    // Secuencias separadas por espacios para 90
    /\b9\s*0\s*(\d{6,8})\b/gi,
    // Secuencias separadas por espacios para 91
    /\b9\s*1\s*(\d{6,8})\b/gi
  ];
  
  for (const pattern of facturaPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      console.log('📄 Coincidencias de factura encontradas:', matches);
      
      for (const match of matches) {
        // Limpiar el match de espacios internos
        const cleanMatch = match.replace(/\s+/g, '');
        
        // Validar que empiece con 90 o 91 y tenga el formato correcto
        if ((cleanMatch.startsWith('90') || cleanMatch.startsWith('91')) && 
            cleanMatch.length >= 8 && cleanMatch.length <= 10 && 
            /^\d+$/.test(cleanMatch)) {
          console.log('🎯 Número de factura seleccionado:', cleanMatch);
          return cleanMatch;
        }
      }
    }
  }
  
  console.log('❌ No se encontraron patrones de número de factura');
  return null;
}

export function extractBultoNumber(text: string): number | null {
  // Patrones mejorados para cantidad de bultos
  const bultoPatterns = [
    /bultos?\s*[-_:]?\s*(\d+)/gi,
    /(\d+)\s*bultos?/gi,
    /cantidad\s*[-_:]?\s*(\d+)/gi,
    /(\d+)\s*paquetes?/gi
  ];
  
  for (const pattern of bultoPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (count > 0 && count < 1000) { // Rango ampliado pero razonable
        console.log('📦 Cantidad de bultos encontrada:', count);
        return count;
      }
    }
  }
  
  return null;
}
