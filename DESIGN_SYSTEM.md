# Sistema de Diseño UI/UX - Transporte Royal

Este documento define la directriz visual y de experiencia de usuario para todas las vistas, modales y componentes de la aplicación.

---

## 🎨 Principios de Diseño

### 1. Minimalismo y Limpieza Visual
- Evitar cajas o tarjetas cuadradas excesivamente pesadas, con bordes gruesos o fondos saturados.
- Priorizar el espacio en blanco / espacio negativo (`gap-2`, `gap-3`, padding equilibrado) para que la información respire.

### 2. Filtros y Estados: Chips / Píldoras Horizontales (`rounded-full`)
- Los selectores de filtros por laboratorio o categoría deben estructurarse como **píldoras horizontales interactivas**:
  - `rounded-full`, `px-3.5 py-1.5`, `text-xs` o `text-sm font-medium`.
  - Distribución en línea natural (`inline-flex items-center gap-2`).
  - Separadores sutiles para métricas secundarias: `•`.
  - Iconos sutiles a la izquierda (o emojis temáticos) y badges discretos a la derecha.
  - Estado inactivo: fondo suave `bg-slate-50` o `bg-slate-100`, borde sutil `border-slate-200`, texto `text-slate-700`.
  - Estado activo: fondo oscuro o primario `bg-slate-900 text-white shadow-sm`.

### 3. Barras de Resumen y Métricas Globales
- Sustituir grids con cajas gigantes por **barras horizontales elegantes y compactas**:
  - Contenedor: `bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4`.
  - Métricas agrupadas en línea con etiquetas secundarias atenuadas (`text-slate-400 font-normal`) y valores destacados (`font-bold text-slate-800`).
  - Indicadores de estado o completitud en badges sobrios (p. ej., `bg-emerald-50 text-emerald-700 border-emerald-200`).

### 4. Tablas y Listados
- Estructura unificada y secuencial en vez de columnas fragmentadas que compriman información.
- Badges de estado delgados y estilizados (`rounded-full px-2 py-0.5 text-xs font-medium`).
- Acciones claras y no obstructivas al final de la fila.

### 5. Compatibilidad CSS
- Tener presente la regla global `button { display: inline-flex; align-items: center; }` en `index.html`.
- Para botones con contenido interactivo o filtros, estructurar siempre su contenido en flujo horizontal (`inline-flex items-center gap-2`), evitando columnas fijas internas que puedan ser aplastadas.
