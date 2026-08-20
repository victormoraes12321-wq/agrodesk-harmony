import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  Mouse,
  Zap,
  ArrowRightLeft,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Server,
  Laptop,
  Printer,
  QrCode,
} from "lucide-react";
import type { Branch, Department } from "@/types";
import type { Asset } from "@/services/patrimonio-api";
import { Link } from "@tanstack/react-router";

interface AssetTopologyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  allAssets: Asset[];
  departments: Department[];
  branches: Branch[];
  onOpenSwap?: (peripheral: Asset) => void;
  onOpenLabels?: (asset: Asset) => void;
}

export function AssetTopologyModal({
  open,
  onOpenChange,
  asset,
  allAssets,
  departments,
  branches,
  onOpenSwap,
  onOpenLabels,
}: AssetTopologyModalProps) {
  if (!asset) return null;

  // Find components / peripherals connected to this asset
  const components = allAssets.filter((a) => a.parentId === asset.id);

  const getDeptName = (id?: string) => departments.find((d) => d.id === id)?.name ?? "Não Definido";
  const getBranchName = (id?: string) => branches.find((b) => b.id === id)?.name ?? "Matriz";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EM_USO":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
            <CheckCircle2 className="size-3" /> Operacional
          </Badge>
        );
      case "MANUTENCAO":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
            <Wrench className="size-3" /> Em Manutenção
          </Badge>
        );
      case "ESTOQUE":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 text-[11px]">
            Estoque
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPeripheralIcon = (name: string, typeName?: string) => {
    const n = (name + " " + (typeName || "")).toLowerCase();
    if (n.includes("monitor") || n.includes("tela")) return <Monitor className="size-5 text-indigo-500" />;
    if (n.includes("teclado") || n.includes("keyboard")) return <Keyboard className="size-5 text-sky-500" />;
    if (n.includes("mouse")) return <Mouse className="size-5 text-amber-500" />;
    if (n.includes("nobreak") || n.includes("estabilizador")) return <Zap className="size-5 text-yellow-500" />;
    if (n.includes("impressora")) return <Printer className="size-5 text-emerald-500" />;
    return <Server className="size-5 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Server className="size-5 text-primary" />
              Topologia Visual & Periféricos Conectados
            </DialogTitle>
            {getStatusBadge(asset.status)}
          </div>
          <DialogDescription>
            Visualização em árvore do computador central e todos os seus periféricos, componentes e
            acessórios vinculados.
          </DialogDescription>
        </DialogHeader>

        {/* Central Topology Graph */}
        <div className="space-y-6 py-2">
          {/* Main Central Computer Hub */}
          <div className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 rounded-2xl border-2 border-primary/30 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                  {asset.name.toLowerCase().includes("notebook") ? (
                    <Laptop className="size-8" />
                  ) : (
                    <Server className="size-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {asset.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getDeptName(asset.departmentId)} • {getBranchName(asset.branchId)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">{asset.name}</h3>
                  {asset.hostname && (
                    <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Hostname: <strong>{asset.hostname}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenLabels && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenLabels(asset)}
                    className="text-xs gap-1.5"
                  >
                    <QrCode className="size-3.5" /> Etiqueta QR
                  </Button>
                )}
                <Link
                  to="/app/nova-os"
                  search={{ assetCode: asset.code } as any}
                  className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 transition shadow-sm"
                >
                  <Wrench className="size-3.5" /> Abrir OS
                </Link>
              </div>
            </div>

            {/* Hardware Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/70 text-xs">
              <div className="flex items-center gap-2 bg-background/60 p-2.5 rounded-xl border border-border/50">
                <Cpu className="size-4 text-sky-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground block">Processador</span>
                  <strong className="truncate">{asset.processor || "Não Informado"}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-background/60 p-2.5 rounded-xl border border-border/50">
                <HardDrive className="size-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground block">Memória RAM</span>
                  <strong>{asset.ram || "Não Informado"}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-background/60 p-2.5 rounded-xl border border-border/50">
                <HardDrive className="size-4 text-indigo-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground block">Armazenamento</span>
                  <strong className="truncate">{asset.disk || "Não Informado"}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-background/60 p-2.5 rounded-xl border border-border/50">
                <Server className="size-4 text-amber-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground block">Marca / Modelo</span>
                  <strong className="truncate">
                    {asset.brand} {asset.model}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Peripherals Tree */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span>Periféricos & Componentes Vinculados</span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {components.length} itens
                </Badge>
              </h4>
            </div>

            {components.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-xs">
                Nenhum periférico vinculado diretamente a este computador.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 transition flex items-center justify-between gap-3 shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {getPeripheralIcon(comp.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-foreground">
                            {comp.code}
                          </span>
                          {getStatusBadge(comp.status)}
                        </div>
                        <h5 className="text-xs font-bold truncate mt-0.5 text-foreground">
                          {comp.name}
                        </h5>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {comp.brand} {comp.model}
                        </p>
                      </div>
                    </div>

                    {onOpenSwap && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenSwap(comp)}
                        className="text-xs h-8 gap-1 opacity-80 group-hover:opacity-100 text-primary hover:bg-primary/10 shrink-0"
                        title="Substituir periférico por outro do estoque"
                      >
                        <ArrowRightLeft className="size-3.5" /> Trocar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar Topologia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
