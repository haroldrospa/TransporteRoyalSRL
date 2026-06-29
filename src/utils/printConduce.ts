import { Conduce } from '@/types/conduces';

export const printConduce = (conduce: Conduce, imagen?: string) => {
  const img = imagen || conduce.imagen;
  if (!img) {
    alert('Este conduce no tiene imagen para imprimir.');
    return;
  }

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  const titulo = `Conduce ${conduce.numeroConduce || conduce.numeroFactura || ''}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${titulo}</title>
<style>
  @page { size: auto; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; }
  @media print {
    body { min-height: auto; }
    img { max-height: none; width: 100%; height: auto; }
  }
</style>
</head>
<body>
  <img id="doc" src="${img}" alt="Conduce" />
  <script>
    const img = document.getElementById('doc');
    const go = () => setTimeout(() => { window.focus(); window.print(); }, 150);
    if (img.complete) go(); else { img.onload = go; img.onerror = go; }
  </script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
};
