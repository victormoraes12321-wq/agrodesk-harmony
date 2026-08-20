import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Users,
  Building2,
  MapPin,
  Tag,
  Laptop,
  FolderTree,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminOnly } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/app/lixeira")({
  head: () => ({ meta: [{ title: "Lixeira do Sistema | AgroDesk TI" }] }),
  component: LixeiraRoute,
});

function LixeiraRoute() {
  const { currentUser } = useApp();
  return (
    <AdminOnly user={currentUser}>
      <LixeiraPage />
    </AdminOnly>
  );
}

interface TrashedItem {
  id: string;
  name?: string;
  username?: string;
  code?: string;
  email?: string;
  address?: string;
  description?: string;
  deletedAt: string;
  entityType:
    | "USER"
    | "DEPARTMENT"
    | "BRANCH"
    | "CATEGORY"
    | "SUBCATEGORY"
    | "ASSET"
    | "ASSET_TYPE"
    | "SUPPLIER";
}

function LixeiraPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [purgeTarget, setPurgeTarget] = useState<TrashedItem | null>(null);

  const { data: trashData, isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const token = localStorage.getItem("agrodesk_token");
      const res = await fetch("/api/v1/trash", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar lixeira");
      return res.json();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (item: TrashedItem) => {
      const token = localStorage.getItem("agrodesk_token");
      const res = await fetch("/api/v1/trash/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entityType: item.entityType, id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao restaurar item");
      }
      return res.json();
    },
    onSuccess: (_, item) => {
      toast.success(`Item "${item.name || item.code || item.username || "Registro"}" restaurado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Não foi possível restaurar o item");
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async (item: TrashedItem) => {
      const token = localStorage.getItem("agrodesk_token");
      const res = await fetch("/api/v1/trash/purge", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entityType: item.entityType, id: item.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao excluir definitivamente");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Registro excluído permanentemente!");
      setPurgeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Não foi possível excluir definitivamente");
    },
  });

  if (isLoading) {
    return <PageLoading />;
  }

  const allItems: TrashedItem[] = [
    ...(trashData?.users || []),
    ...(trashData?.departments || []),
    ...(trashData?.branches || []),
    ...(trashData?.categories || []),
    ...(trashData?.subcategories || []),
    ...(trashData?.assets || []),
    ...(trashData?.assetTypes || []),
    ...(trashData?.suppliers || []),
  ];

  const filteredItems = allItems.filter((item) => {
    if (activeTab !== "ALL" && item.entityType !== activeTab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.username?.toLowerCase().includes(q) ||
      item.code?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q)
    );
  });

  const getEntityIcon = (type: TrashedItem["entityType"]) => {
    switch (type) {
      case "USER":
        return <Users className="size-4 text-blue-500" />;
      case "DEPARTMENT":
        return <Building2 className="size-4 text-indigo-500" />;
      case "BRANCH":
        return <MapPin className="size-4 text-amber-500" />;
      case "CATEGORY":
      case "SUBCATEGORY":
        return <FolderTree className="size-4 text-emerald-500" />;
      case "ASSET":
      case "ASSET_TYPE":
        return <Laptop className="size-4 text-purple-500" />;
      default:
        return <Tag className="size-4 text-muted-foreground" />;
    }
  };

  const getEntityLabel = (type: TrashedItem["entityType"]) => {
    switch (type) {
      case "USER":
        return "Usuário";
      case "DEPARTMENT":
        return "Setor";
      case "BRANCH":
        return "Filial";
      case "CATEGORY":
        return "Categoria";
      case "SUBCATEGORY":
        return "Subcategoria";
      case "ASSET":
        return "Patrimônio";
      case "ASSET_TYPE":
        return "Tipo de Ativo";
      case "SUPPLIER":
        return "Fornecedor";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lixeira & Recuperação de Registros"
        description="Recupere cadastros, filiais, setores, categorias ou patrimônios excluídos por engano."
      />

      {/* Toolbar & Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl border">
          {[
            { id: "ALL", label: `Todos (${allItems.length})` },
            { id: "USER", label: `Usuários (${trashData?.users?.length || 0})` },
            { id: "DEPARTMENT", label: `Setores (${trashData?.departments?.length || 0})` },
            { id: "BRANCH", label: `Filiais (${trashData?.branches?.length || 0})` },
            { id: "CATEGORY", label: `Categorias (${trashData?.categories?.length || 0})` },
            { id: "SUBCATEGORY", label: `Subcategorias (${trashData?.subcategories?.length || 0})` },
            { id: "ASSET", label: `Patrimônio (${trashData?.assets?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome, código..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Content List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card">
          <Trash2 className="size-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">A lixeira está vazia</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            Nenhum registro excluído encontrado para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <div
              key={`${item.entityType}-${item.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors gap-3"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  {getEntityIcon(item.entityType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {item.name || item.code || item.username || "Sem título"}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {getEntityLabel(item.entityType)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.email || item.address || item.description || (item.code ? `Código: ${item.code}` : "Sem descrição adicional")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0">
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">
                    Excluído em {formatDateTime(item.deletedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                    onClick={() => restoreMutation.mutate(item)}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="size-3.5" />
                    Restaurar
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setPurgeTarget(item)}
                    disabled={purgeMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Permanent Purge */}
      <Dialog open={Boolean(purgeTarget)} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Excluir Definitivamente?
            </DialogTitle>
            <DialogDescription>
              Esta ação é **irreversível**. O registro{" "}
              <strong>"{purgeTarget?.name || purgeTarget?.code || purgeTarget?.username}"</strong> será
              apagado permanentemente do banco de dados e não poderá mais ser recuperado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPurgeTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => purgeTarget && purgeMutation.mutate(purgeTarget)}
              disabled={purgeMutation.isPending}
            >
              Sim, Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
