import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchChoferesBudget, deleteChoferBudget, ChoferBudget } from '@/services/budgetService';
import { fetchUsers } from '@/services/api/userService';
import { Usuario } from '@/types/usuarios';
import Layout from '@/components/Layout';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Truck, DollarSign, Calendar, MapPin, TrendingUp, Activity, Trash2 } from 'lucide-react';

const COLORS = ['#0A1F44', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

const ChoferesDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<ChoferBudget[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, Usuario>>({});
  const [selectedChofer, setSelectedChofer] = useState<string>('todos');

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [data, usersData] = await Promise.all([
        fetchChoferesBudget(),
        fetchUsers()
      ]);
      setBudgets(data);
      
      const uMap: Record<string, Usuario> = {};
      usersData.forEach(u => {
        uMap[u.id] = u;
      });
      setUsersMap(uMap);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      return;
    }
    
    const success = await deleteChoferBudget(id);
    if (success) {
      setBudgets(budgets.filter(b => b.id !== id));
      toast({
        title: "Registro eliminado",
        description: "El presupuesto fue eliminado correctamente.",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro. Verifica tu conexión.",
        variant: "destructive",
      });
    }
  };

  // Filter by selected driver
  const filteredBudgets = useMemo(() => {
    if (selectedChofer === 'todos') return budgets;
    return budgets.filter(b => (b.chofer_id || b.chofer_nombre) === selectedChofer);
  }, [budgets, selectedChofer]);

  // Process data for charts
  const todayBudgets = filteredBudgets.filter(b => isToday(parseISO(b.fecha)));
  const thisMonthBudgets = filteredBudgets.filter(b => {
    const date = parseISO(b.fecha);
    const now = new Date();
    return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
  });

  const totalCostoHoy = todayBudgets.reduce((sum, b) => sum + Number(b.combustible_costo), 0);
  const totalCostoMes = thisMonthBudgets.reduce((sum, b) => sum + Number(b.combustible_costo), 0);
  const totalKmHoy = todayBudgets.reduce((sum, b) => sum + Number(b.total_distancia_km), 0);
  const totalKmMes = thisMonthBudgets.reduce((sum, b) => sum + Number(b.total_distancia_km), 0);

  // Helper to format driver name with truck
  const getDisplayName = (choferId: string, choferNombre: string) => {
    if (choferNombre?.toLowerCase().includes('almacen')) return 'Almacén';
    
    const user = usersMap[choferId];
    if (user?.camion && !user.camion.toLowerCase().includes('almacen')) {
      return `${user.camion} - ${choferNombre}`;
    }
    return choferNombre || 'Chofer Desconocido';
  };

  // List of all unique drivers for the dropdown (from original un-filtered budgets)
  const uniqueChoferes = useMemo(() => {
    const choferesMap = new Map<string, string>();
    budgets.forEach(b => {
      const id = b.chofer_id || b.chofer_nombre;
      const displayName = getDisplayName(b.chofer_id, b.chofer_nombre);
      choferesMap.set(id, displayName);
    });
    return Array.from(choferesMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [budgets, usersMap]);

  // Group by chofer for the month
  const groupedByChofer = thisMonthBudgets.reduce((acc, curr) => {
    const id = curr.chofer_id || curr.chofer_nombre;
    const displayName = getDisplayName(curr.chofer_id, curr.chofer_nombre);
    
    if (!acc[id]) {
      acc[id] = { id, name: displayName, costo: 0, km: 0, viajes: 0 };
    }
    acc[id].costo += Number(curr.combustible_costo);
    acc[id].km += Number(curr.total_distancia_km);
    acc[id].viajes += 1;
    return acc;
  }, {} as Record<string, any>);

  const chartDataChoferes = Object.values(groupedByChofer).sort((a, b) => b.costo - a.costo);

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-royal-blue/10 dark:bg-royal-blue/20 rounded-lg">
                  <Activity className="h-6 w-6 text-royal-blue dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Presupuesto y Combustible
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm ml-12">
                Resumen financiero y logístico de las rutas de entrega.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <Select value={selectedChofer} onValueChange={setSelectedChofer}>
                <SelectTrigger className="w-full sm:w-[280px] h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm rounded-full text-sm font-medium">
                  <SelectValue placeholder="Todos los Choferes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Choferes</SelectItem>
                  {uniqueChoferes.map((chofer) => (
                    <SelectItem key={chofer.id} value={chofer.id}>
                      {chofer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm h-9 w-full sm:w-auto">
                <Calendar className="h-4 w-4" />
                <span>Datos al {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue"></div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* KPIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gasto Hoy</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                          <span className="text-lg text-slate-500 font-semibold mr-1">RD$</span>
                          {totalCostoHoy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-royal-blue shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gasto Mes ({format(new Date(), 'MMMM', { locale: es })})</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                          <span className="text-lg text-slate-500 font-semibold mr-1">RD$</span>
                          {totalCostoMes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-royal-blue dark:text-blue-400 rounded-xl">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Distancia Hoy</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                          {totalKmHoy.toFixed(1)} <span className="text-lg text-slate-500 font-semibold">km</span>
                        </h3>
                      </div>
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <MapPin className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Distancia Mes</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                          {totalKmMes.toFixed(1)} <span className="text-lg text-slate-500 font-semibold">km</span>
                        </h3>
                      </div>
                      <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Truck className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Costo por Chofer (Mes)</CardTitle>
                    <CardDescription>Distribución del gasto en combustible.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] pt-4">
                    {chartDataChoferes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataChoferes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            tickFormatter={(val) => `RD$ ${val}`} 
                            dx={-10}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`RD$ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Costo']} 
                          />
                          <Bar 
                            dataKey="costo" 
                            fill="#0A1F44" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">No hay datos para este mes.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Distancia por Chofer (Mes)</CardTitle>
                    <CardDescription>Kilómetros recorridos este mes.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] pt-4">
                    {chartDataChoferes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartDataChoferes}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="km"
                            nameKey="name"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                          >
                            {chartDataChoferes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distancia']} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">No hay datos para este mes.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de Historial */}
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-lg">Historial de Rutas</CardTitle>
                  <CardDescription>Detalle cronológico de todas las rutas guardadas.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                        <th className="px-6 py-4 font-semibold">Chofer</th>
                        <th className="px-6 py-4 font-semibold text-center">Bultos</th>
                        <th className="px-6 py-4 font-semibold text-center">Conduces</th>
                        <th className="px-6 py-4 font-semibold text-right">Distancia</th>
                        <th className="px-6 py-4 font-semibold text-right">Galones</th>
                        <th className="px-6 py-4 font-semibold text-right">Costo Estimado</th>
                        <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBudgets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col items-center gap-2">
                              <Truck className="h-8 w-8 text-slate-300" />
                              <p>No hay rutas registradas todavía para este filtro.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredBudgets.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {format(parseISO(b.fecha), "dd MMM yyyy, h:mm a", { locale: es })}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {getDisplayName(b.chofer_id, b.chofer_nombre)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-medium">
                                {b.total_bultos}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-medium">
                                {b.total_conduces}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                              {Number(b.total_distancia_km).toFixed(1)} km
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                              {Number(b.combustible_galones).toFixed(1)} gal
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              RD$ {Number(b.combustible_costo).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => handleDelete(b.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChoferesDashboard;
