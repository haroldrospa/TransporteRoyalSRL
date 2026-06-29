
# Plan: Eliminar Limitación de Conduces y Permitir Acceso a Todos los Datos

## Problema Identificado

El sistema tiene varias limitaciones que impiden mostrar todos los conduces de la base de datos:

1. **Filtrado por laboratorio exclusivo**: La página LAM solo carga conduces donde `laboratorio = 'LAM'` (1,034 registros), excluyendo 22,851 conduces que tienen el campo `laboratorio` vacío o sin asignar.

2. **Filtro de fecha predeterminado restrictivo**: Al cargar la página, se inicializa un `dateRange` que filtra al mes actual, lo que oculta datos de meses anteriores.

3. **Límite de Supabase de 1,000 filas**: Aunque ya existe una estrategia de paginación, no se está usando correctamente para todos los escenarios.

4. **Inconsistencia entre fechas del calendario y datos**: Cuando el usuario selecciona octubre/noviembre 2025 en el calendario, no hay datos porque las consultas no están sincronizadas.

---

## Solución Propuesta

### Cambio 1: Modificar la función de carga para obtener TODOS los conduces

**Archivo**: `src/services/conduces/progressiveFetchConduces.ts`

- Agregar nueva función `fetchAllConducesNoLimit()` que obtenga todos los conduces sin filtrar por laboratorio
- Usar paginación automática para superar el límite de 1,000 registros de Supabase
- Mantener la caché para evitar recargas innecesarias

### Cambio 2: Actualizar el hook de contenido LAM

**Archivo**: `src/hooks/useLAMContent.ts`

- Modificar para que cargue TODOS los conduces por defecto (no solo los de LAM)
- Añadir opción de filtrar por laboratorio como filtro opcional en la UI

### Cambio 3: Eliminar filtro de fecha predeterminado

**Archivo**: `src/hooks/lam/useLAMDates.ts`

- Inicializar `dateRange` como `undefined` en lugar del mes actual
- Permitir que todos los conduces se muestren cuando no hay filtro de fecha activo
- Mostrar un aviso visual cuando no hay filtros de fecha aplicados

### Cambio 4: Mejorar el filtro de búsqueda para ignorar fechas

**Archivo**: `src/utils/lam/filterUtils.ts`

- Ya existe lógica para ignorar filtros de fecha cuando hay búsqueda activa (línea 141)
- Verificar que funcione correctamente con todos los datos

### Cambio 5: Añadir contador total de conduces visible

**Archivos**: `src/components/lam/ConducesTableSection.tsx` y `src/components/lam/LAMFilters.tsx`

- Mostrar el total de conduces cargados vs los filtrados
- Ejemplo: "Mostrando 287 de 23,885 conduces"

---

## Detalles Técnicos

### Estrategia de paginación para cargar todos los datos

```typescript
// Cargar todos los conduces en bloques de 1000
async function fetchAllConducesNoPagination(): Promise<Conduce[]> {
  const pageSize = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data);
      hasMore = data.length === pageSize;
      page++;
    }
  }
  
  return allData.map(mapDbConduceToConduce);
}
```

### Nuevo estado inicial de fechas

```typescript
// En useLAMDates.ts - cambiar de:
const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
  from: startOfMonth(currentMonth),
  to: endOfMonth(currentMonth)
}));

// A:
const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
```

### Indicador visual de conduces totales

```text
┌─────────────────────────────────────────────────┐
│ 📊 Mostrando 287 conduces de 23,885 totales     │
│    Filtro: Febrero 2026 | Búsqueda: "FARMACIA"  │
└─────────────────────────────────────────────────┘
```

---

## Orden de Implementación

1. Actualizar `progressiveFetchConduces.ts` con función para todos los conduces
2. Modificar `useLAMContent.ts` para usar la nueva función
3. Actualizar `useLAMDates.ts` para iniciar sin filtro de fecha
4. Agregar indicador de total de conduces en la tabla
5. Probar búsqueda y filtrado con todos los datos

---

## Consideraciones de Rendimiento

- **Memoria**: Cargar ~24,000 conduces consume aproximadamente 5-10MB de memoria
- **Red**: La carga inicial puede tomar 3-5 segundos con conexión normal
- **Caché**: La caché de 2 minutos evita recargas frecuentes
- **Paginación virtual**: Considerar implementar virtualización en la tabla para mejor rendimiento visual
