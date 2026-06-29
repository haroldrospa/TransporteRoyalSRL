
import { createWorker, PSM, OEM } from 'tesseract.js';
import { optimizeImageForOCR } from './imageProcessor';
import { extractConduceNumber, extractFacturaNumber, extractBultoNumber } from './ocrUtils';

export interface ProcessResult {
  success: boolean;
  conduceNumber?: string;
  facturaNumber?: string;
  bultoCount?: number;
  detectedText?: string;
  textPreview?: string;
  error?: string;
  errorType?: string;
  timestamp?: string;
  detectionType?: 'conduce' | 'factura';
}

export async function processImageOCR(imageData: string): Promise<{
  result: ProcessResult;
  debugInfo: any;
}> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando procesamiento avanzado multi-orientación...');
    
    // Generar múltiples versiones optimizadas (rotaciones + optimizaciones)
    const imageVersions = await optimizeImageForOCR(imageData);
    console.log(`📐 Generadas ${imageVersions.length} versiones optimizadas`);
    
    let bestResult: { text: string; confidence?: number } | null = null;
    let conduceNumber: string | null = null;
    let facturaNumber: string | null = null;
    let attemptCount = 0;
    
    // Configuraciones OCR múltiples para diferentes tipos de imagen
    const ocrConfigs = [
      {
        name: 'Modo números y letras optimizado',
        params: {
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessedit_do_invert: '0',
          textord_heavy_nr: '1',
          classify_enable_learning: '0',
          classify_enable_adaptive_matcher: '1'
        }
      },
      {
        name: 'Modo detección agresiva',
        params: {
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: PSM.SINGLE_WORD,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessedit_do_invert: '1',
          textord_heavy_nr: '1',
          textord_noise_rejwords: '0',
          textord_noise_rejrows: '0'
        }
      },
      {
        name: 'Modo línea única',
        params: {
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          classify_bln_numeric_mode: '1',
          textord_really_old_xheight: '1'
        }
      }
    ];
    
    // Procesar versiones con diferentes configuraciones OCR
    for (let configIndex = 0; configIndex < ocrConfigs.length && !conduceNumber && !facturaNumber; configIndex++) {
      const config = ocrConfigs[configIndex];
      console.log(`🔧 Probando configuración: ${config.name}`);
      
      for (let i = 0; i < imageVersions.length && !conduceNumber && !facturaNumber; i++) {
        const versionType = Math.floor(i / 4); // 4 rotaciones por optimización
        const rotationAngle = (i % 4) * 90;
        attemptCount++;
        
        console.log(`🔄 Intento ${attemptCount}: Config ${configIndex + 1}, Optimización ${versionType + 1}, Rotación ${rotationAngle}°`);
        
        try {
          // Crear worker con logging mínimo para mejor rendimiento
          const worker = await createWorker('spa', 1, {
            logger: () => {} // Deshabilitar logs para mejor rendimiento
          });
          
          // Aplicar configuración específica
          await worker.setParameters(config.params);
          
          const { data: { text, confidence } } = await worker.recognize(imageVersions[i]);
          await worker.terminate();
          
          console.log(`📊 Confianza: ${confidence}%, Texto: "${text.substring(0, 50)}..."`);
          
          // Extraer números de conduce y factura de esta versión
          const detectedConduce = extractConduceNumber(text);
          const detectedFactura = extractFacturaNumber(text);
          
          if (detectedConduce) {
            conduceNumber = detectedConduce;
            bestResult = { text, confidence };
            console.log(`✅ ¡Código de conduce encontrado en intento ${attemptCount}!: ${conduceNumber}`);
            break;
          }
          
          if (detectedFactura) {
            facturaNumber = detectedFactura;
            bestResult = { text, confidence };
            console.log(`✅ ¡Número de factura encontrado en intento ${attemptCount}!: ${facturaNumber}`);
            break;
          }
          
          // Guardar el mejor resultado basado en confianza
          if (!bestResult || (confidence && confidence > (bestResult.confidence || 0))) {
            bestResult = { text, confidence };
          }
          
          // Si la confianza es muy baja, continuar rápidamente
          if (confidence && confidence < 30) {
            continue;
          }
          
        } catch (error) {
          console.warn(`⚠️ Error en intento ${attemptCount}:`, error);
          continue;
        }
        
        // Limitar intentos para evitar timeouts muy largos
        if (attemptCount >= 24) { // 3 configs * 8 versiones optimizadas máximo
          console.log('⏰ Límite de intentos alcanzado');
          break;
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Procesamiento completado en ${processingTime}ms (${attemptCount} intentos)`);
    
    // Usar el mejor resultado obtenido
    const finalText = bestResult?.text || '';
    const bultoCount = extractBultoNumber(finalText);

    // Ensure hasValidDetection is explicitly boolean
    const hasValidDetection = Boolean(conduceNumber || facturaNumber);
    const detectionType = conduceNumber ? 'conduce' : 'factura';

    const processResult: ProcessResult = {
      success: hasValidDetection,
      conduceNumber: conduceNumber || undefined,
      facturaNumber: facturaNumber || undefined,
      bultoCount,
      detectedText: finalText.substring(0, 500),
      timestamp: new Date().toISOString(),
      detectionType: hasValidDetection ? detectionType : undefined
    };

    const debugInfo = { 
      processingTime, 
      textLength: finalText.length,
      confidence: bestResult?.confidence,
      versionsProcessed: imageVersions.length,
      attemptsTotal: attemptCount,
      timestamp: new Date().toISOString() 
    };

    return { result: processResult, debugInfo };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error en OCR avanzado:', error);
    
    const errorResult: ProcessResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Error de procesamiento',
      errorType: 'PROCESSING_ERROR',
      timestamp: new Date().toISOString()
    };
    
    const debugInfo = { 
      processingTime, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
    
    return { result: errorResult, debugInfo };
  }
}
