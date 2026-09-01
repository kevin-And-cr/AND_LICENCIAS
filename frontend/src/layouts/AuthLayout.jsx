import { Outlet } from "react-router-dom";

/** Layout para páginas públicas (login, registro, etc.) */
export function AuthLayout() {
  return <Outlet />;
}
