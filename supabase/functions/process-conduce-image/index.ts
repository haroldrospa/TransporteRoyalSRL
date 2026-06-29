
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionResponse {
  responses: Array<{
    textAnnotations: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    error?: {
      code: number;
      message: string;
      status: string;
    };
  }>;
}

function extractConduceNumber(text: string): string | null {
  console.log('Analyzing text for conduce number (barcode):', text);
  
  // Limpiar el texto de caracteres especiales y espacios extra
  const cleanedText = text.replace(/[^\d\s]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('Cleaned text:', cleanedText);
  
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
  
  const foundMatches = [];
  
  for (const pattern of conducePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log(`Pattern ${pattern} found matches:`, matches);
      foundMatches.push(...matches);
    }
  }
  
  if (foundMatches.length > 0) {
    // Limpiar matches de espacios y validar que empiecen con 8080 o 8081
    for (const match of foundMatches) {
      const cleanMatch = match.replace(/\s+/g, '');
      
      if ((cleanMatch.startsWith('8080') || cleanMatch.startsWith('8081')) && 
          cleanMatch.length === 8 && /^\d+$/.test(cleanMatch)) {
        console.log('Selected valid conduce number:', cleanMatch);
        return cleanMatch;
      }
    }
  }
  
  // Búsqueda adicional SOLO para números que empiecen con 8080 o 8081
  const allNumbers = cleanedText.match(/\d+/g);
  if (allNumbers && allNumbers.length > 0) {
    console.log('All found numbers:', allNumbers);
    
    // Buscar números que empiecen específicamente con 8080 o 8081
    for (const num of allNumbers) {
      if ((num.startsWith('8080') || num.startsWith('8081')) && num.length === 8) {
        console.log('Valid conduce number found in general search:', num);
        return num;
      }
    }
  }
  
  console.log('No conduce number patterns found');
  return null;
}

function extractClienteNumber(text: string): string | null {
  console.log('Analyzing text for cliente number...');
  
  // Patrones para código de cliente en el documento
  const clientePatterns = [
    /(?:código|codigo|cod)\s*[-_:]?\s*(\d{5,6})/gi,
    /(?:cliente|client|clie)\s*[-_:]?\s*(\d{5,6})/gi,
    // Buscar el código específico que aparece en el documento (como 101512)
    /\b\d{6}\b/gi
  ];
  
  for (const pattern of clientePatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      console.log('Found cliente number:', match[1]);
      return match[1];
    }
  }
  
  console.log('No cliente number found');
  return null;
}

function extractBultoNumber(text: string): number | null {
  console.log('Analyzing text for bulto number...');
  
  // Patrones para cantidad de bultos
  const bultoPatterns = [
    /(?:cant\.?\s*bultos?|cantidad\s*bultos?)\s*[-_:]?\s*(\d+)/gi,
    /(\d+)\s*bultos?/gi,
    // Buscar "Cant. Bultos : 1" como en el documento
    /bultos?\s*[-_:]?\s*(\d+)/gi
  ];
  
  for (const pattern of bultoPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (count > 0 && count < 1000) { // Rango razonable
        console.log('Found bulto count:', count);
        return count;
      }
    }
  }
  
  console.log('No bulto number found');
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Processing conduce image request ===');

  try {
    const requestBody = await req.json();
    const { imageData } = requestBody;
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    const googleApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleApiKey) {
      console.error('Google Vision API key not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API key no configurada. Por favor configura la clave en Supabase.',
          errorType: 'API_KEY_MISSING'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limpiar datos de imagen base64
    let base64Image = imageData;
    if (imageData.startsWith('data:')) {
      base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    // Validar formato base64
    try {
      atob(base64Image);
    } catch (e) {
      throw new Error('Formato de imagen inválido');
    }

    const visionRequestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 50
            }
          ]
        }
      ]
    };

    console.log('Calling Google Vision API...');
    
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequestBody)
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error response:', errorText);
      
      // Manejo específico de errores de API key
      if (visionResponse.status === 400 && errorText.includes('API key not valid')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'La API key de Google Vision no es válida. Por favor verifica que:\n1. La clave sea correcta\n2. Google Vision API esté habilitada en tu proyecto\n3. La clave no tenga restricciones que impidan su uso',
            errorType: 'INVALID_API_KEY',
            details: 'API key authentication failed'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Manejo mejorado de errores de facturación
      if (visionResponse.status === 403 && errorText.includes('billing')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '🔧 ACCIÓN REQUERIDA: Necesitas habilitar la facturación en Google Cloud\n\n' +
                   '1. Ve a https://console.cloud.google.com/\n' +
                   '2. Selecciona tu proyecto #751827104528\n' +
                   '3. Ve a "Billing" y habilita la facturación\n' +
                   '4. Asegúrate de que Google Vision API esté habilitada\n\n' +
                   'La API de Vision requiere una cuenta de facturación activa.',
            errorType: 'BILLING_REQUIRED',
            details: 'Google Cloud billing must be enabled',
            actionRequired: true,
            billingUrl: 'https://console.developers.google.com/billing/enable?project=751827104528'
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
    }

    const visionData: VisionResponse = await visionResponse.json();

    // Verificar errores en la respuesta
    if (visionData.responses?.[0]?.error) {
      const apiError = visionData.responses[0].error;
      console.error('Vision API returned error:', apiError);
      throw new Error(`Vision API error: ${apiError.code} - ${apiError.message}`);
    }

    if (!visionData.responses?.[0]?.textAnnotations?.[0]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se detectó texto en la imagen. Asegúrate de que la imagen sea clara y contenga texto legible.',
          detectedText: ''
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const detectedText = visionData.responses[0].textAnnotations[0].description;
    console.log('Full detected text:', detectedText);

    // Extraer información específica del código de barras
    const conduceNumber = extractConduceNumber(detectedText);
    const clienteNumber = extractClienteNumber(detectedText);
    const bultoCount = extractBultoNumber(detectedText);

    console.log('Extraction results:', { 
      conduceNumber, 
      clienteNumber,
      bultoCount
    });

    if (!conduceNumber) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo detectar el número del código de barras en la imagen. Asegúrate de que el código de barras sea visible.',
          detectedText: detectedText.substring(0, 500),
          clienteNumber,
          bultoCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        conduceNumber,
        clienteNumber,
        bultoCount,
        detectedText: detectedText.substring(0, 1000)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== ERROR in process-conduce-image ===');
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error procesando la imagen',
        errorType: error.constructor.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
