import React, { useState } from "react";
import * as XLSX from "xlsx";
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
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Check,
  ArrowRight,
} from "lucide-react";
import type { Branch, Department } from "@/types";
import type { Asset } from "@/services/patrimonio-api";
import { toast } from "sonner";

interface AssetImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  branches: Branch[];
  onImportAssets: (assets: any[]) => Promise<void>;
}

interface ParsedRow {
  code?: string;
  name: string;
  hostname?: string;
  brand?: string;
  model?: string;
  processor?: string;
  ram?: string;
  disk?: string;
  location?: string;
  monitors?: string;
  keyboard?: string;
  mouse?: string;
  nobreak?: string;
  departmentId?: string;
  branchId?: string;
}

export function AssetImportModal({
  open,
  onOpenChange,
  departments,
  branches,
  onImportAssets,
}: AssetImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (rawData.length === 0) {
          toast.error("A planilha está vazia.");
          return;
        }

        // Map column variations dynamically
        const mapped: ParsedRow[] = rawData.map((row, idx) => {
          const findVal = (...keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(
                (k) => k.trim().toLowerCase() === key.toLowerCase(),
              );
              if (matchedKey && row[matchedKey]) return String(row[matchedKey]).trim();
            }
            return "";
          };

          const hostname = findVal("hostname", "host", "nome pc", "computador");
          const brand = findVal("brand", "marca", "fabricante") || "Dell";
          const model = findVal("model", "modelo") || "OptiPlex";
          const location = findVal("location", "setor", "departamento", "localização", "local");
          const code =
            findVal("code", "patrimonio", "patrimônio", "etiqueta", "código") ||
            `PAT-IMP-${String(idx + 1).padStart(4, "0")}`;

          // Match department ID
          const matchedDept = departments.find(
            (d) =>
              d.name.toLowerCase().includes(location.toLowerCase()) ||
              location.toLowerCase().includes(d.name.toLowerCase()),
          );

          const name = hostname ? `Computador ${hostname}` : `${brand} ${model}`;

          return {
            code,
            name,
            hostname: hostname || undefined,
            brand,
            model,
            processor: findVal("processor", "processador", "cpu"),
            ram: findVal("ram", "memoria", "memória"),
            disk: findVal("disk", "disco", "armazenamento", "ssd", "hd"),
            monitors: findVal("monitors", "monitor", "monitores", "telas"),
            keyboard: findVal("keyboard", "teclado"),
            mouse: findVal("mouse"),
            nobreak: findVal("nobreak", "estabilizador"),
            location,
            departmentId: matchedDept?.id || departments[0]?.id,
            branchId: branches[0]?.id,
          };
        });

        setParsedRows(mapped);
        toast.success(`${mapped.length} equipamento(s) identificado(s) na planilha!`);
      } catch (err: any) {
        toast.error(`Erro ao processar planilha: ${err?.message || "Arquivo inválido"}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      await onImportAssets(parsedRows);
      setProgress(100);
      toast.success("Importação de inventário concluída com sucesso!");
      setTimeout(() => {
        onOpenChange(false);
        setParsedRows([]);
        setFileName(null);
        setProgress(0);
        setImporting(false);
      }, 1000);
    } catch (err: any) {
      toast.error(`Erro ao importar: ${err?.message || "Ocorreu um erro"}`);
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            Importador Inteligente de Inventário (Excel / CSV)
          </DialogTitle>
          <DialogDescription>
            Importe seu parque de computadores e periféricos em lote diretamente de planilhas Excel
            (.xlsx) ou CSV com mapeamento automático.
          </DialogDescription>
        </DialogHeader>

        {parsedRows.length === 0 ? (
          <div className="py-8">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-2xl p-10 cursor-pointer transition">
              <UploadCloud className="size-12 text-emerald-600 mb-3 animate-bounce" />
              <span className="font-bold text-foreground text-sm">
                Clique para selecionar ou arraste sua planilha aqui
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Suporta arquivos Excel (.xlsx, .xls) e planilhas CSV
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <div className="mt-4 p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground space-y-1">
              <strong>Colunas reconhecidas automaticamente:</strong>
              <p>
                Hostname, Marca, Modelo, Processador, Memória RAM, Disco/SSD, Setor/Localização,
                Monitores, Teclado, Mouse, Nobreak e Código de Patrimônio.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="size-4" />
                <span>
                  Arquivo: <strong>{fileName}</strong> ({parsedRows.length} computadores prontos
                  para cadastro)
                </span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setParsedRows([]);
                  setFileName(null);
                }}
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                Trocar arquivo
              </Button>
            </div>

            {/* Table Preview */}
            <div className="border border-border/80 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/80 sticky top-0 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Patrimônio</th>
                    <th className="p-2.5">Hostname</th>
                    <th className="p-2.5">Marca/Modelo</th>
                    <th className="p-2.5">Hardware</th>
                    <th className="p-2.5">Setor</th>
                    <th className="p-2.5">Periféricos Vinculados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-2.5 font-mono font-bold text-foreground">{row.code}</td>
                      <td className="p-2.5 font-semibold text-foreground">
                        {row.hostname || "-"}
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {row.brand} {row.model}
                      </td>
                      <td className="p-2.5 text-[11px] text-muted-foreground">
                        {row.processor} • {row.ram} • {row.disk}
                      </td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-[10px]">
                          {row.location || "Geral"}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {[row.monitors, row.keyboard, row.mouse, row.nobreak]
                          .filter(Boolean)
                          .join(", ") || "Nenhum"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importing && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Importando ativos e vinculando periféricos...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>

          {parsedRows.length > 0 && (
            <Button
              onClick={handleStartImport}
              disabled={importing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
            >
              <Check className="size-4" />
              Confirmar Importação de {parsedRows.length} Ativo(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
