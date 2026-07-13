import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminOnly } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useApp } from "@/lib/store";
import type { Department } from "@/types";

export const Route = createFileRoute("/app/setores")({
  head: () => ({ meta: [{ title: "Gestao de Setores | AgroDesk TI" }] }),
  component: DepartmentsRoute,
});

function DepartmentsRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <DepartmentsPage />
    </AdminOnly>
  );
}

function DepartmentsPage() {
  const { departments, upsertDepartment } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Department>({ id: "", name: "", active: true });

  const sorted = useMemo(
    () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
    [departments],
  );

  const createNew = () => {
    setDraft({ id: "", name: "", active: true });
    setOpen(true);
  };

  const edit = (department: Department) => {
    setDraft(department);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome do setor");
      return;
    }
    try {
      await upsertDepartment({ ...draft, name: draft.name.trim() });
      toast.success("Setor salvo");
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar o setor.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Setores"
        description="Mantenha os setores ativos para classificacao de chamados."
        actions={
          <Button onClick={createNew}>
            <Plus className="size-4" /> Novo setor
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="lg:hidden divide-y">
          {sorted.map((department) => (
            <article key={department.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{department.name}</p>
                <Badge variant={department.active ? "default" : "outline"}>
                  {department.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(department)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void upsertDepartment({ ...department, active: !department.active })
                  }
                >
                  {department.active ? "Inativar" : "Ativar"}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Setor</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((department) => (
                <tr key={department.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{department.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={department.active ? "default" : "outline"}>
                      {department.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => edit(department)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void upsertDepartment({ ...department, active: !department.active })
                        }
                      >
                        {department.active ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar setor" : "Novo setor"}</DialogTitle>
            <DialogDescription>Cadastro basico do setor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome do setor</Label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void save()}>
              <Save className="size-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
