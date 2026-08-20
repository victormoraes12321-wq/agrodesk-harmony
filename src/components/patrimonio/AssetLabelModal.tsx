import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
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
import { Printer, QrCode, Sliders, Check, Copy } from "lucide-react";
import type { Branch, Department } from "@/types";
import type { Asset } from "@/services/patrimonio-api";
import { toast } from "sonner";

interface AssetLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
}

export type LabelSize = "thermal-small" | "thermal-large" | "sheet-a4";

export function AssetLabelModal({
  open,
  onOpenChange,
  assets,
  branches,
  departments,
}: AssetLabelModalProps) {
  const [size, setSize] = useState<LabelSize>("thermal-small");
  const [includeHostname, setIncludeHostname] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  // Generate QR codes for all selected assets
  useEffect(() => {
    if (!open || assets.length === 0) return;

    let isMounted = true;
    const generateCodes = async () => {
      const results: Record<string, string> = {};
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

      for (const asset of assets) {
        try {
          // The QR code contains a quick link to open OS or view asset details
          const qrPayload = `${baseUrl}/app/nova-os?assetCode=${encodeURIComponent(asset.code)}`;
          const dataUrl = await QRCode.toDataURL(qrPayload, {
            width: 256,
            margin: 1,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });
          results[asset.id] = dataUrl;
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }

      if (isMounted) {
        setQrCodes(results);
      }
    };

    void generateCodes();

    return () => {
      isMounted = false;
    };
  }, [open, assets]);

  const getBranchName = (branchId?: string) => {
    return branches.find((b) => b.id === branchId)?.name ?? "Matriz";
  };

  const getDeptName = (deptId?: string) => {
    return departments.find((d) => d.id === deptId)?.name ?? "Geral";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permita popups no navegador para imprimir etiquetas.");
      return;
    }

    const printContent = printRef.current?.innerHTML ?? "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiquetas de Patrimônio - AgroDesk TI</title>
          <meta charset="utf-8" />
          <style>
            @page {
              margin: 0;
              ${size === "thermal-small" ? "size: 50mm 30mm;" : size === "thermal-large" ? "size: 70mm 40mm;" : "size: A4 portrait; margin: 10mm;"}
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000000;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: ${size === "sheet-a4" ? "4mm" : "0"};
              padding: ${size === "sheet-a4" ? "0" : "0"};
            }
            .label-card {
              box-sizing: border-box;
              page-break-inside: avoid;
              break-inside: avoid;
              border: 1px solid #000;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: space-between;
              overflow: hidden;
            }

            /* Small Thermal: 50mm x 30mm */
            .label-thermal-small {
              width: 50mm;
              height: 30mm;
              padding: 2mm;
              margin: 0;
              page-break-after: always;
            }
            .label-thermal-small .header-title {
              font-size: 7pt;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #1e293b;
            }
            .label-thermal-small .code-box {
              font-size: 10pt;
              font-weight: 900;
              font-family: monospace;
              letter-spacing: 0.5px;
              color: #000;
            }
            .label-thermal-small .asset-name {
              font-size: 6.5pt;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 28mm;
            }
            .label-thermal-small .sub-info {
              font-size: 5.5pt;
              color: #334155;
            }
            .label-thermal-small img.qr {
              width: 17mm;
              height: 17mm;
            }

            /* Large Thermal: 70mm x 40mm */
            .label-thermal-large {
              width: 70mm;
              height: 40mm;
              padding: 3mm;
              page-break-after: always;
            }
            .label-thermal-large .header-title {
              font-size: 9pt;
              font-weight: 900;
              text-transform: uppercase;
            }
            .label-thermal-large .code-box {
              font-size: 13pt;
              font-weight: 900;
              font-family: monospace;
            }
            .label-thermal-large .asset-name {
              font-size: 8.5pt;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 42mm;
            }
            .label-thermal-large .sub-info {
              font-size: 7pt;
              color: #334155;
            }
            .label-thermal-large img.qr {
              width: 24mm;
              height: 24mm;
            }

            /* Sheet A4: Grid of labels */
            .label-sheet-a4 {
              width: 63.5mm;
              height: 38mm;
              padding: 2.5mm;
              border-radius: 2mm;
            }
            .label-sheet-a4 .header-title {
              font-size: 8pt;
              font-weight: 900;
              text-transform: uppercase;
            }
            .label-sheet-a4 .code-box {
              font-size: 11pt;
              font-weight: 900;
              font-family: monospace;
            }
            .label-sheet-a4 .asset-name {
              font-size: 7.5pt;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 36mm;
            }
            .label-sheet-a4 .sub-info {
              font-size: 6pt;
              color: #334155;
            }
            .label-sheet-a4 img.qr {
              width: 20mm;
              height: 20mm;
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <QrCode className="size-5 text-primary" />
            Impressão de Etiquetas de Patrimônio
          </DialogTitle>
          <DialogDescription>
            Gere e imprima etiquetas térmicas ou em folha A4 com QR Code para escaneamento rápido e
            abertura de chamados.
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Bar */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border/70 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Formato da Etiqueta
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={size === "thermal-small" ? "default" : "outline"}
                  onClick={() => setSize("thermal-small")}
                  className="text-xs h-8"
                >
                  Térmica 50x30 mm
                </Button>
                <Button
                  size="sm"
                  variant={size === "thermal-large" ? "default" : "outline"}
                  onClick={() => setSize("thermal-large")}
                  className="text-xs h-8"
                >
                  Térmica 70x40 mm
                </Button>
                <Button
                  size="sm"
                  variant={size === "sheet-a4" ? "default" : "outline"}
                  onClick={() => setSize("sheet-a4")}
                  className="text-xs h-8"
                >
                  Grade Folha A4
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium pt-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHostname}
                  onChange={(e) => setIncludeHostname(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-4"
                />
                Incluir Hostname
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLocation}
                  onChange={(e) => setIncludeLocation(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-4"
                />
                Incluir Setor/Filial
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span>
              <strong>{assets.length}</strong> equipamento(s) selecionado(s) para impressão.
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="size-3.5" /> QR Code escaneável integrado
            </span>
          </div>
        </div>

        {/* Live Preview Area */}
        <div className="border border-border/80 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/40 overflow-x-auto min-h-[220px]">
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Pré-Visualização das Etiquetas
          </div>

          <div
            ref={printRef}
            className={`flex flex-wrap gap-4 items-start ${
              size === "sheet-a4" ? "justify-start" : "justify-center"
            }`}
          >
            {assets.map((asset) => {
              const qrImage = qrCodes[asset.id];
              return (
                <div
                  key={asset.id}
                  className={`label-card ${
                    size === "thermal-small"
                      ? "label-thermal-small w-[260px] h-[155px] p-3"
                      : size === "thermal-large"
                        ? "label-thermal-large w-[340px] h-[190px] p-4"
                        : "label-sheet-a4 w-[300px] h-[170px] p-3.5"
                  } bg-white text-slate-900 border-2 border-slate-800 rounded-lg shadow-sm flex items-center justify-between shrink-0 select-none`}
                >
                  <div className="flex flex-col justify-between h-full pr-2 overflow-hidden flex-1">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                        <span>🌱 AGRODESK TI</span>
                      </div>
                      <div className="font-mono font-black text-slate-950 tracking-tight text-base leading-tight mt-0.5">
                        {asset.code}
                      </div>
                      <div className="font-bold text-slate-800 text-xs truncate mt-0.5">
                        {asset.name}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 space-y-0.5 mt-1 border-t border-slate-200 pt-1">
                      {includeHostname && asset.hostname && (
                        <div className="truncate">
                          <strong>Host:</strong> {asset.hostname}
                        </div>
                      )}
                      {includeLocation && (
                        <div className="truncate">
                          <strong>Loc:</strong> {getDeptName(asset.departmentId)} (
                          {getBranchName(asset.branchId)})
                        </div>
                      )}
                      {asset.brand && asset.model && (
                        <div className="truncate text-[9px] text-slate-500">
                          {asset.brand} {asset.model}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center shrink-0 pl-1 border-l border-dashed border-slate-300">
                    {qrImage ? (
                      <img
                        src={qrImage}
                        alt={`QR Code ${asset.code}`}
                        className="qr size-20 object-contain rounded bg-white"
                      />
                    ) : (
                      <div className="size-20 bg-slate-100 animate-pulse rounded" />
                    )}
                    <span className="text-[7.5px] font-semibold text-slate-500 uppercase mt-0.5 tracking-tighter">
                      ESCANEAR P/ OS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
            >
              <Printer className="size-4" />
              Imprimir {assets.length} Etiqueta(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
