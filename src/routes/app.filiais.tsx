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
import type { Branch } from "@/types";

export const Route = createFileRoute("/app/filiais")({
  head: () => ({ meta: [{ title: "Gestao de Filiais | AgroDesk TI" }] }),
  component: BranchesRoute,
});

function BranchesRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <BranchesPage />
    </AdminOnly>
  );
}

function BranchesPage() {
  const { branches, upsertBranch } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Branch>({ id: "", name: "", city: "", active: true });

  const sorted = useMemo(
    () => [...branches].sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );

  const createNew = () => {
    setDraft({ id: "", name: "", city: "", active: true });
    setOpen(true);
  };

  const edit = (branch: Branch) => {
    setDraft(branch);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome da filial/local");
      return;
    }
    try {
      await upsertBranch({
        ...draft,
        name: draft.name.trim(),
        city: draft.city?.trim() || undefined,
      });
      toast.success("Filial/local salvo");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar a filial/local.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Filiais/Locais"
        description="Cadastre e mantenha os locais de atendimento ativos."
        actions={
          <Button onClick={createNew}>
            <Plus className="size-4" /> Nova filial/local
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="lg:hidden divide-y">
          {sorted.map((branch) => (
            <article key={branch.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{branch.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {branch.city || "Cidade nao informada"}
                  </p>
                </div>
                <Badge variant={branch.active ? "default" : "outline"}>
                  {branch.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(branch)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void upsertBranch({ ...branch, active: !branch.active })}
                >
                  {branch.active ? "Inativar" : "Ativar"}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Filial/local</th>
                <th className="text-left px-4 py-3">Cidade</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((branch) => (
                <tr key={branch.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{branch.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{branch.city || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={branch.active ? "default" : "outline"}>
                      {branch.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => edit(branch)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void upsertBranch({ ...branch, active: !branch.active })}
                      >
                        {branch.active ? "Inativar" : "Ativar"}
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
            <DialogTitle>{draft.id ? "Editar filial/local" : "Nova filial/local"}</DialogTitle>
            <DialogDescription>Configure os locais de atendimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input
                value={draft.city ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>
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
