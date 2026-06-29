
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/providers/DataContextProvider";

import Index from "./pages/Index";
import Login from "./pages/Login";
import LAM from "./pages/LAM";
import Fersuaz from "./pages/Fersuaz";
import Taapharmaceutica from "./pages/Taapharmaceutica";
import InnovacionQuimica from "./pages/InnovacionQuimica";
import NotFound from "./pages/NotFound";
import ControlBultos from "./pages/ControlBultos";
import CargarCamiones from "./pages/CargarCamiones";
import ControlConduces from "./pages/ControlConduces";
import Clientes from "./pages/Clientes";
import Usuarios from "./pages/Usuarios";
import Entregas from "./pages/Entregas";
import CrearConduces from "./pages/CrearConduces";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route path="/lam" element={<LAM />} />
            <Route path="/fersuaz" element={<Fersuaz />} />
            <Route path="/taapharmaceutica" element={<Taapharmaceutica />} />
            <Route path="/innovacion-quimica" element={<InnovacionQuimica />} />
            <Route path="/entregas" element={<Entregas />} />
            <Route path="/control-bultos" element={<ControlBultos />} />
            <Route path="/cargar-camiones" element={<CargarCamiones />} />
            <Route path="/control-conduces" element={<ControlConduces />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/crear-conduces" element={<CrearConduces />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
