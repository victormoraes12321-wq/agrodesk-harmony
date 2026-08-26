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
                  <p className="font-semibold text-base">{category.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.description || "Sem descrição"}
                  </p>
                </div>
                <Badge variant={category.active ? "default" : "outline"}>
                  {category.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              {category.subcategories && category.subcategories.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Subcategorias ({category.subcategories.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {category.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-[11px] bg-muted/60 text-foreground px-2 py-0.5 rounded-md border font-medium"
                      >
                        {sub.name} {sub.defaultSlaHours ? `(${sub.defaultSlaHours}h)` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-1">
                  SLA Padrão: {category.defaultSlaHours}h
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
                <th className="text-left px-4 py-3">Subcategorias & Serviços</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-left px-4 py-3">SLA Padrão</th>
                <th className="text-left px-4 py-3">Prioridade</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 max-w-[340px]">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.slice(0, 4).map((sub) => (
                          <span
                            key={sub.id}
                            className="text-[11px] bg-muted/70 text-foreground px-1.5 py-0.5 rounded border"
                            title={`${sub.name} (SLA: ${sub.defaultSlaHours ?? category.defaultSlaHours}h)`}
                          >
                            {sub.name}
                          </span>
                        ))}
                        {category.subcategories.length > 4 && (
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">
                            +{category.subcategories.length - 4} mais
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {category.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-semibold">
                    {category.defaultSlaHours}h úteis
                  </td>
                  <td className="px-4 py-3 text-xs">{priorityLabel[category.defaultPriority]}</td>
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
            <div className="space-y-2">
              <Label>SLA Padrão (Horas de Prazo)</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[2, 4, 8, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, defaultSlaHours: h }))}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      draft.defaultSlaHours === h
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted"
                    }`}
                  >
                    {h}h {h === 8 ? "(1 dia útil)" : h === 24 ? "(24h)" : h === 48 ? "(2 dias)" : ""}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={draft.defaultSlaHours}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    defaultSlaHours: Number(event.target.value || 1),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prioridade Padrão</Label>
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
