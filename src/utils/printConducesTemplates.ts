import { Conduce } from '@/types/conduces';

/**
 * Generates and prints A4 format sheets for the created conduces.
 */
export const printConducesA4 = (conduces: Conduce[]) => {
  if (!conduces || conduces.length === 0) {
    alert('No hay conduces para imprimir.');
    return;
  }

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  const style = `
    @page { 
      size: letter; 
      margin: 10mm; 
    }
    @media print {
      .page-break { 
        page-break-after: always; 
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    html, body { 
      margin: 0; 
      padding: 0; 
      background: #fff; 
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.5;
    }
    .conduce-container {
      padding: 10px 10px 20px 10px;
      min-height: 130mm; /* Half page height */
      max-height: 135mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      border-bottom: 1px dashed #cbd5e1;
      margin-bottom: 5mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 3px solid #0A1F44;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .company-title {
      font-size: 26px;
      font-weight: 900;
      color: #0A1F44;
      text-transform: uppercase;
      margin: 0;
      letter-spacing: 1px;
      line-height: 1;
    }
    .company-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #F5B942;
      margin: 6px 0 0 0;
      letter-spacing: 1px;
    }
    .barcode-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .barcode-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0A1F44;
      margin-bottom: 2px;
      padding-left: 2px;
    }
    .barcode {
      font-family: 'Libre Barcode 39', cursive;
      font-size: 52px;
      line-height: 1;
      color: #0A1F44;
    }
    .barcode-number {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 5px;
      color: #0A1F44;
      margin-top: 2px;
      padding-left: 5px;
    }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .panel {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      background-color: #f8fafc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .panel-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 900;
      color: #0A1F44;
      margin: 0 0 12px 0;
      border-bottom: 2px solid #F5B942;
      padding-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .data-row {
      display: flex;
      margin-bottom: 8px;
    }
    .data-label {
      width: 120px;
      font-weight: 700;
      color: #64748b;
      flex-shrink: 0;
      font-size: 11px;
      text-transform: uppercase;
    }
    .data-value {
      color: #0A1F44;
      font-weight: 700;
      font-size: 12px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .details-table th {
      background-color: #0A1F44;
      color: #F5B942;
      text-align: left;
      padding: 12px 14px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #0A1F44;
      font-weight: 500;
    }
    .bultos-alert {
      background-color: #fffbeb;
      border: 2px dashed #F5B942;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      font-weight: 900;
      font-size: 15px;
      color: #0A1F44;
      margin-bottom: 40px;
      letter-spacing: 0.5px;
    }
    .signatures-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: auto;
      padding-top: 30px;
    }
    .signature-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 12px;
      background-color: #f8fafc;
    }
    .signature-line {
      width: 80%;
      border-top: 1px solid #0A1F44;
      margin-bottom: 6px;
    }
    .signature-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0A1F44;
      text-align: center;
      letter-spacing: 0.5px;
    }
  `;

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Impresión de Conduces</title>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      <style>${style}</style>
    </head>
    <body>
  `;

  conduces.forEach((conduce, index) => {
    const isLast = index === conduces.length - 1;
    // Break page after every 2 conduces, unless it's the last one
    const needsPageBreak = !isLast && (index % 2 === 1);
    
    const formattedDate = conduce.fechaCarga 
      ? new Date(conduce.fechaCarga).toLocaleDateString('es-DO', { timeZone: 'UTC' }) 
      : new Date().toLocaleDateString('es-DO');

    htmlContent += `
      <div class="conduce-container ${needsPageBreak ? 'page-break' : ''}">
        <div>
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <h1 class="company-title">${conduce.laboratorio || 'LABORATORIO NO ESPECIFICADO'}</h1>
              <p class="company-subtitle">CONDUCE DE ENTREGA DE MEDICAMENTOS</p>
            </div>
            <div class="header-right">
              <div class="barcode-container">
                <div class="barcode-title">NÚMERO DE CONDUCE</div>
                <div class="barcode">*${conduce.numeroConduce}*</div>
                <div class="barcode-number">${conduce.numeroConduce}</div>
              </div>
            </div>
          </div>

          <!-- Section Information -->
          <div class="section-grid">
            <!-- Origen -->
            <div class="panel">
              <h3 class="panel-title">Información de Origen</h3>
              <div class="data-row">
                <span class="data-label">Laboratorio:</span>
                <span class="data-value">${conduce.laboratorio}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Fecha de Carga:</span>
                <span class="data-value">${formattedDate}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Región Destino:</span>
                <span class="data-value">${conduce.region}</span>
              </div>
            </div>

            <!-- Destinatario -->
            <div class="panel">
              <h3 class="panel-title">Información de Destino</h3>
              <div class="data-row">
                <span class="data-label">Razón Social:</span>
                <span class="data-value" style="font-weight: 700;">${conduce.razonSocial || 'Cliente General'}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Código Cliente:</span>
                <span class="data-value">${conduce.numeroCliente || 'N/A'}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Ciudad:</span>
                <span class="data-value">${conduce.ciudad || 'N/A'}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Dirección:</span>
                <span class="data-value">${conduce.ubicacion || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Detalles de Carga -->
          <table class="details-table">
            <thead>
              <tr>
                <th style="width: 25%;">No. Factura</th>
                <th style="width: 25%;">No. Conduce</th>
                <th style="width: 30%;">Descripción de Carga</th>
                <th style="width: 20%; text-align: right;">Bultos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${conduce.numeroFactura || conduce.numeroConduce}</td>
                <td>${conduce.numeroConduce}</td>
                <td>Bultos de Medicamentos - ${conduce.laboratorio}</td>
                <td style="text-align: right; font-weight: 700;">${conduce.cantidadBultos}</td>
              </tr>
            </tbody>
          </table>

          <!-- Alerta de Bultos -->
          <div class="bultos-alert">
            TOTAL DE BULTOS A ENTREGAR: ${conduce.cantidadBultos} BULTO(S)
          </div>
        </div>

        <!-- Firmas -->
        <div class="signatures-container">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Despachado por (Lab)</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Transportista (Royal)</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p class="signature-label">Recibido por Cliente</p>
          </div>
        </div>
      </div>
    `;
  });

  htmlContent += `
      <script>
        window.focus();
        setTimeout(() => { window.print(); }, 250);
      </script>
    </body>
    </html>
  `;

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
};

/**
 * Generates and prints sticky labels for each individual package (bulto).
 * E.g., if a Conduce has 3 bultos, it generates 3 individual label printouts.
 */
export const printConduceLabels = (conduces: Conduce[]) => {
  if (!conduces || conduces.length === 0) {
    alert('No hay conduces para imprimir etiquetas.');
    return;
  }

  const w = window.open('', '_blank', 'width=750,height=550');
  if (!w) return;

  const style = `
    @page { 
      size: 100mm 76mm; 
      margin: 0; 
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    html, body { 
      margin: 0; 
      padding: 0; 
      background: #fff; 
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #000;
      box-sizing: border-box;
      width: 100mm;
      height: 76mm;
    }
    .label-container {
      width: 100mm;
      height: 76mm;
      padding: 3mm 4mm 3mm 4mm;
      box-sizing: border-box;
      background-color: #fff;
      overflow: hidden;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .label-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .label-tiny {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      color: #000;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .brand-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #000;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .brand-logo {
      height: 9mm;
      filter: grayscale(100%) invert(100%) contrast(500%);
    }
    .meta-info {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .bulto-box {
      font-size: 17px;
      font-weight: 900;
      background: #fff;
      color: #000;
      padding: 1px 8px;
      border: 2.5px solid #000;
      border-radius: 5px;
      letter-spacing: 1px;
    }

    .sender-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 3px solid #000;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    .sender-left {
      flex: 1;
      overflow: hidden;
      padding-right: 2mm;
    }
    .sender-name-large {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.1;
    }
    .date-text-new {
      font-size: 9px;
      font-weight: 800;
      margin-bottom: 1.5px;
    }

    .dest-section {
      display: flex;
      justify-content: space-between;
      border-bottom: 3px solid #000;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    .dest-main {
      flex: 1;
      padding-right: 3mm;
    }
    .recipient-name {
      font-size: 16px;
      font-weight: 900;
      line-height: 1.1;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .recipient-address {
      font-size: 9px;
      font-weight: 600;
      line-height: 1.3;
      margin-top: 2px;
      height: 2.6em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .recipient-rnc {
      font-size: 8.5px;
      font-weight: 800;
      margin-top: 2px;
    }
    .dest-city {
      width: 40mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-left: 3px solid #000;
      padding-left: 2mm;
    }
    .city-label {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .city-box {
      font-size: 18px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      word-break: break-word;
      line-height: 1.1;
      letter-spacing: 1px;
    }

    .barcode-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      overflow: hidden;
    }
    .barcode-title {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      margin-bottom: 2px;
      color: #000;
      padding-left: 2.5px;
    }
    .barcode {
      font-family: 'Libre Barcode 39', cursive;
      font-size: 64px;
      line-height: 1;
      color: #000;
      text-align: center;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
    }
    .barcode-number {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 6px;
      margin-top: 1px;
      text-align: center;
      padding-left: 6px;
    }
  `;

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Impresión de Etiquetas</title>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      <style>${style}</style>
    </head>
    <body>
  `;

  conduces.forEach(conduce => {
    const totalBultos = conduce.cantidadBultos || 1;
    
    for (let bultoIdx = 1; bultoIdx <= totalBultos; bultoIdx++) {
      const formattedDate = conduce.fechaCarga 
        ? new Date(conduce.fechaCarga).toLocaleDateString('es-DO', { timeZone: 'UTC' }) 
        : new Date().toLocaleDateString('es-DO');

      htmlContent += `
        <div class="label-container">
          <!-- Section 1: Brand -->
          <div class="brand-section">
            <div class="brand-left">
              <img src="${window.location.origin}/lovable-uploads/logo.png" class="brand-logo" onerror="this.onerror=null; this.src='${window.location.origin}/logo.svg';" />
            </div>
            <div class="meta-info">
              <div class="bulto-box">BULTO ${bultoIdx} / ${totalBultos}</div>
            </div>
          </div>

          <!-- Section 1.5: Sender -->
          <div class="sender-section">
            <div class="sender-left">
              <div class="label-tiny">REMITENTE (LABORATORIO):</div>
              <div class="sender-name-large">${conduce.laboratorio || 'N/A'}</div>
            </div>
            <div class="date-text-new">FECHA: ${formattedDate}</div>
          </div>

          <!-- Section 2: Destination -->
          <div class="dest-section">
            <div class="dest-main">
              <div class="label-tiny">DESTINATARIO:</div>
              <div class="recipient-name">${conduce.razonSocial || 'Cliente General'}</div>
              <div class="recipient-address">${conduce.ubicacion || 'N/A'}</div>
              <div class="recipient-rnc">RNC: ${conduce.numeroCliente || 'N/A'}</div>
            </div>
            <div class="dest-city">
              <div class="city-label">DESTINO</div>
              <div class="city-box">${conduce.ciudad || 'N/A'}</div>
            </div>
          </div>

          <!-- Section 3: Barcode -->
          <div class="barcode-section">
            <div class="barcode-title">NÚMERO DE CONDUCE</div>
            <div class="barcode">*${conduce.numeroConduce}*</div>
            <div class="barcode-number">${conduce.numeroConduce}</div>
          </div>
        </div>
      `;
    }
  });

  htmlContent += `
      <script>
        window.focus();
        setTimeout(() => { window.print(); }, 250);
      </script>
    </body>
    </html>
  `;

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
};
