import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PRIORITY_LEVELS } from "@/app/constants";
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
import { priorityLabel } from "@/lib/format";
import type { Category } from "@/types";

export const Route = createFileRoute("/app/categorias")({
  head: () => ({ meta: [{ title: "Gestao de Categorias | AgroDesk TI" }] }),
  component: CategoriesRoute,
});

function CategoriesRoute() {
  const app = useApp();
  return (
    <AdminOnly user={app.currentUser}>
      <CategoriesPage />
    </AdminOnly>
  );
}

function CategoriesPage() {
  const { categories, upsertCategory } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Category>({
    id: "",
    name: "",
    description: "",
    defaultSlaHours: 8,
    defaultPriority: "MEDIA",
    active: true,
  });

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const createNew = () => {
    setDraft({
      id: "",
      name: "",
      description: "",
      defaultSlaHours: 8,
      defaultPriority: "MEDIA",
      active: true,
    });
    setOpen(true);
  };

  const edit = (category: Category) => {
    setDraft(category);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    try {
      await upsertCategory({
        ...draft,
        name: draft.name.trim(),
        description: draft.description?.trim() || undefined,
        defaultSlaHours: Number.isFinite(draft.defaultSlaHours) ? draft.defaultSlaHours : 8,
      });
      toast.success("Categoria salva");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar a categoria.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Categorias"
        description="Categorias de OS com SLA padrao e prioridade recomendada."
        actions={
          <Button onClick={createNew}>
            <Plus className="size-4" /> Nova categoria
          </Button>
        }
      />

      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="lg:hidden divide-y">
          {sorted.map((category) => (
            <article key={category.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.description || "Sem descricao"}
                  </p>
                </div>
                <Badge variant={category.active ? "default" : "outline"}>
                  {category.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-1">
                  SLA {category.defaultSlaHours}h
                </span>
                <span className="rounded-full border px-2 py-1">
                  {priorityLabel[category.defaultPriority]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(category)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void upsertCategory({ ...category, active: !category.active })}
                >
                  {category.active ? "Inativar" : "Ativar"}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3">Descricao</th>
                <th className="text-left px-4 py-3">SLA padrao</th>
                <th className="text-left px-4 py-3">Prioridade padrao</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {category.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{category.defaultSlaHours}h</td>
                  <td className="px-4 py-3 text-sm">{priorityLabel[category.defaultPriority]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={category.active ? "default" : "outline"}>
                      {category.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => edit(category)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void upsertCategory({ ...category, active: !category.active })
                        }
                      >
                        {category.active ? "Inativar" : "Ativar"}
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
            <DialogTitle>{draft.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>Configure dados padrao da categoria.</DialogDescription>
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
              <Label>Descricao</Label>
              <Input
                value={draft.description ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>SLA padrao (h)</Label>
                <Input
                  type="number"
                  value={draft.defaultSlaHours}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultSlaHours: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Prioridade padrao</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.defaultPriority}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultPriority: event.target.value as Category["defaultPriority"],
                    }))
                  }
                >
                  {PRIORITY_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {priorityLabel[item]}
                    </option>
                  ))}
                </select>
              </div>
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
