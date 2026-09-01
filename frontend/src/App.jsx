import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { NotFound } from "./pages/NotFound";
import { DashboardPage } from "./modules/dashboard/pages/DashboardPage";
import { UsuariosPage } from "./modules/usuarios/pages/UsuariosPage";
import { RolesPage } from "./modules/roles/pages/RolesPage";
import { ClientesPage } from "./modules/clientes/pages/ClientesPage";
import { CompaniasPage } from "./modules/companias/pages/CompaniasPage";
import { ModulosPage } from "./modules/modulos/pages/ModulosPage";
import { LicenciasPage } from "./modules/licencias/pages/LicenciasPage";
import { LicenciaDetallePage } from "./modules/licencias/pages/LicenciaDetallePage";
import { ToastProvider } from "./store/ToastContext";
import { ThemeProvider } from "./store/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Raíz: redirige a /licencias si hay sesión, si no a /login */}
          <Route path="/" element={<Navigate to="/licencias" replace />} />

          {/* Rutas públicas */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Rutas protegidas */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/companias" element={<CompaniasPage />} />
            <Route path="/modulos" element={<ModulosPage />} />
            <Route path="/licencias" element={<LicenciasPage />} />
            <Route path="/licencias/:id" element={<LicenciaDetallePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </ThemeProvider>
  );
}

