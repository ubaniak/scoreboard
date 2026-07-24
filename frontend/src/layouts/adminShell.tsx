import { Outlet } from "@tanstack/react-router";
import { GlobalNav } from "../components/nav/GlobalNav";

export const AdminShell = () => (
  <>
    <GlobalNav />
    <Outlet />
  </>
);
