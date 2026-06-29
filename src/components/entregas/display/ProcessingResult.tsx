
import React from 'react';
import { CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { ProcessResult } from '../ocr/ocrProcessor';

interface ProcessingResultProps {
  result: ProcessResult;
  debugInfo?: any;
}

export const ProcessingResult = ({ result, debugInfo }: ProcessingResultProps) => {
  return (
    <div className={`p-3 rounded-lg border ${
      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={`font-medium ${
          result.success ? 'text-green-800' : 'text-red-800'
        }`}>
          {result.success ? '✅ Código detectado' : '❌ Sin código detectado'}
        </span>
      </div>
      
      {result.success && (
        <div className="text-sm text-green-700">
          {result.conduceNumber && (
            <p><strong>Código de barras:</strong> {result.conduceNumber}</p>
          )}
          {result.facturaNumber && (
            <p><strong>Número de factura:</strong> {result.facturaNumber}</p>
          )}
          {result.detectionType && (
            <p><strong>Tipo de detección:</strong> {result.detectionType === 'conduce' ? 'Código de barras' : 'Número de factura'}</p>
          )}
          {result.bultoCount && (
            <p><strong>Bultos:</strong> {result.bultoCount}</p>
          )}
          {debugInfo?.processingTime && (
            <p><strong>Tiempo:</strong> {debugInfo.processingTime}ms</p>
          )}
          {debugInfo?.confidence && (
            <p><strong>Confianza:</strong> {Math.round(debugInfo.confidence)}%</p>
          )}
          {debugInfo?.attemptsTotal && (
            <p><strong>Intentos:</strong> {debugInfo.attemptsTotal}</p>
          )}
        </div>
      )}
      
      {!result.success && (
        <div className="text-sm text-red-700">
          <p className="mb-2">Intenta con una imagen más clara del código de barras o número de factura</p>
          <div className="bg-red-100 p-2 rounded text-xs">
            <p className="font-medium mb-1">💡 Consejos para mejor detección:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Asegúrate de que el código de barras o número de factura esté bien iluminado</li>
              <li>Evita reflejos y sombras sobre el documento</li>
              <li>Mantén la cámara estable y enfocada</li>
              <li>El código puede estar en cualquier orientación</li>
              <li>También puedes capturar el número de factura si es visible</li>
            </ul>
          </div>
          {debugInfo?.processingTime && (
            <p className="mt-2">Tiempo de análisis: {debugInfo.processingTime}ms</p>
          )}
          {debugInfo?.attemptsTotal && (
            <p>Intentos realizados: {debugInfo.attemptsTotal}</p>
          )}
        </div>
      )}

      {debugInfo && process.env.NODE_ENV === 'development' && (
        <details className="text-xs mt-2">
          <summary className="cursor-pointer flex items-center gap-1 text-gray-600">
            <Info className="h-3 w-3" />
            Debug info (tiempo: {debugInfo.processingTime}ms, intentos: {debugInfo.attemptsTotal})
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
