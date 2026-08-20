import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, RotateCcw, Check, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface DigitalSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketProtocol: string;
  requesterName: string;
  onConfirmSignature: (dataUrl: string, signerName: string, documentId?: string) => Promise<void>;
}

export function DigitalSignatureModal({
  open,
  onOpenChange,
  ticketProtocol,
  requesterName,
  onConfirmSignature,
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(requesterName);
  const [signerDoc, setSignerDoc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSignerName(requesterName);
      setHasDrawn(false);
      // Initialize canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f172a";
      }, 100);
    }
  }, [open, requesterName]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = async () => {
    if (!hasDrawn) {
      toast.error("Por favor, colete a assinatura desenhada no campo abaixo.");
      return;
    }
    if (!signerName.trim()) {
      toast.error("Informe o nome do recebedor.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

    setSaving(true);
    try {
      await onConfirmSignature(dataUrl, signerName, signerDoc || undefined);
      toast.success("Assinatura digital registrada com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Erro ao registrar assinatura: ${err?.message || "Ocorreu um erro"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <PenTool className="size-5 text-emerald-600" />
            Assinatura Digital de Recebimento
          </DialogTitle>
          <DialogDescription>
            Coleta de assinatura digital para confirmação de entrega do equipamento ou encerramento
            da ordem de serviço <strong>{ticketProtocol}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="signer-name" className="text-xs font-semibold">
                Nome do Recebedor *
              </Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nome completo do solicitante"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="signer-doc" className="text-xs font-semibold">
                CPF / Matrícula (Opcional)
              </Label>
              <Input
                id="signer-doc"
                value={signerDoc}
                onChange={(e) => setSignerDoc(e.target.value)}
                placeholder="Ex: 000.000.000-00"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Signature Canvas Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Desenhe a assinatura no quadro abaixo (touchscreen ou mouse)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" /> Limpar
              </Button>
            </div>

            <div className="border-2 border-dashed border-slate-400 dark:border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner relative touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={180}
                className="w-full h-[180px] cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                  Assine aqui com o dedo ou mouse
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border flex items-center gap-2">
            <UserCheck className="size-4 text-primary shrink-0" />
            <span>
              Ao confirmar, a assinatura com carimbo de data/hora será vinculada permanentemente ao
              laudo da OS.
            </span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !hasDrawn}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
          >
            <Check className="size-4" />
            Confirmar e Salvar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
