import { Link, Navigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { User } from "@/types";

export function RequireLoggedUser({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export function AdminOnly({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "TI_ADMIN") {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="size-12 mx-auto rounded-xl bg-destructive/10 text-destructive grid place-items-center">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="text-xl font-semibold mt-4">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Esta area e exclusiva para o perfil TI_ADMIN.
          </p>
          <Button asChild className="mt-5">
            <Link to="/app/portal">Voltar ao portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
