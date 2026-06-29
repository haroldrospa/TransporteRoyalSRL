
import { Conduce } from '@/types/conduces';

// Función para obtener los datos por mes (filtrado por año)
export const getBultosPerMonth = (conduces: Conduce[], year?: number): any[] => {
  // Objeto para almacenar conteo de bultos por mes
  const monthMap: { [key: string]: { count: number, total: number } } = {};
  
  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Año para filtrar (por defecto el actual)
  const targetYear = year ?? new Date().getFullYear();
  
  // Procesar cada conduce - solo los entregados
  conduces.forEach(conduce => {
    // Solo contar conduces con estado "Entregado"
    if (conduce.estado !== 'Entregado') return;

    // Obtener mes y año de la fecha de entrega
    const dateInfo = getMonthAndYearFromDate(conduce.fechaEntrega);
    if (!dateInfo) return;
    
    // Solo incluir datos del año seleccionado
    if (dateInfo.year !== targetYear) return;
    
    const month = dateInfo.month;
    
    // Si el mes no existe en el mapa, inicializarlo
    if (!monthMap[month]) {
      monthMap[month] = { count: 0, total: 0 };
    }
    
    // Incrementar el conteo de bultos para este mes
    monthMap[month].count += conduce.cantidadBultos;
    monthMap[month].total += 1;
  });
  
  // Calcular el total de bultos para determinar porcentajes
  const totalBultos = Object.values(monthMap).reduce((sum, data) => sum + data.count, 0);
  
  // Convertir el mapa a un array de datos para el gráfico
  const chartData = Object.entries(monthMap)
    .map(([month, data]) => {
      const monthIndex = parseInt(month, 10);
      return {
        name: monthNames[monthIndex],
        bultos: data.count,
        count: data.total,
        percentage: totalBultos > 0 ? Math.round((data.count / totalBultos) * 100) : 0
      };
    })
    .sort((a, b) => monthNames.indexOf(a.name) - monthNames.indexOf(b.name));
  
  return chartData;
};

// Función auxiliar para extraer el mes y año de una fecha en formato string
const getMonthAndYearFromDate = (dateString: string): { month: number; year: number } | null => {
  if (!dateString) return null;
  
  // Primero intentar con formato DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
  let dateParts = dateString.split(' ')[0].split('/');
  if (dateParts.length === 3) {
    const month = parseInt(dateParts[1]) - 1; // Restar 1 porque los meses van de 0-11
    const year = parseInt(dateParts[2]);
    return { month, year };
  }
  
  // Si no funciona, intentar con formato ISO
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return { month: date.getMonth(), year: date.getFullYear() };
    }
  } catch (e) {
    console.error('Error parsing date:', dateString);
  }
  
  return null;
};
