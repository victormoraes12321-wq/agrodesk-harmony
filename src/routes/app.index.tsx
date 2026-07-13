import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { currentUser, loading } = useApp();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.mustChangePassword) return <Navigate to="/app/primeiro-acesso" />;
  return <Navigate to={currentUser.role === "TI_ADMIN" ? "/app/dashboard" : "/app/portal"} />;
}
