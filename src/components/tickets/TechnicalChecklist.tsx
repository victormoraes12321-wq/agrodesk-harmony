import React, { useState, useEffect } from "react";
import { CheckSquare, Square, CheckCircle2, ListChecks, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface TechnicalChecklistProps {
  categoryName?: string;
  ticketId: string;
  initialChecked?: string[];
  onSaveChecklist?: (items: string[], progressPercent: number) => Promise<void>;
}

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  computador: [
    "Backup prévio de dados e arquivos locais",
    "Verificação de integridade de disco (SMART/SSD)",
    "Diagnóstico de memória RAM e processador",
    "Remoção de malwares / Verificação de antivírus",
    "Atualização de drivers e sistema operacional",
    "Teste de conexão de rede cabeada e Wi-Fi",
    "Limpeza física interna e troca de pasta térmica",
    "Teste final de inicialização e periféricos",
  ],
  impressora: [
    "Verificação de nível de toner / cartucho",
    "Limpeza de roletes de tração e fusor",
    "Teste de cabo USB ou conexão de rede IP",
    "Reinstalação do driver correto do fabricante",
    "Impressão de página de auto-teste",
    "Configuração de impressora padrão no Windows",
  ],
  internet: [
    "Checagem de cabos de rede e patch cords",
    "Verificação de link no switch / porta do patch panel",
    "Teste de ping para gateway padrão e DNS (8.8.8.8)",
    "Renovação de IP / DNS (ipconfig /release /renew)",
    "Teste de velocidade e estabilidade de conexão",
  ],
  acesso: [
    "Validação de identidade do solicitante",
    "Reset de senha no Active Directory / Sistema",
    "Definição de expiração e troca no próximo logon",
    "Teste de login e permissões de perfil",
    "Notificação segura ao solicitante",
  ],
  padrao: [
    "Identificação e isolamento do problema",
    "Execução do procedimento técnico corretivo",
    "Validação de funcionamento com o usuário",
    "Registro da causa raiz e peças utilizadas",
  ],
};

export function TechnicalChecklist({
  categoryName,
  ticketId,
  initialChecked = [],
  onSaveChecklist,
}: TechnicalChecklistProps) {
  const normalizedCat = (categoryName || "").toLowerCase();
  let checklistKey = "padrao";
  if (normalizedCat.includes("computador") || normalizedCat.includes("notebook")) checklistKey = "computador";
  else if (normalizedCat.includes("impressora")) checklistKey = "impressora";
  else if (normalizedCat.includes("internet") || normalizedCat.includes("rede")) checklistKey = "internet";
  else if (normalizedCat.includes("acesso") || normalizedCat.includes("senha")) checklistKey = "acesso";

  const checklistItems = DEFAULT_CHECKLISTS[checklistKey] || DEFAULT_CHECKLISTS.padrao;

  // Local state for checked items
  const [checkedItems, setCheckedItems] = useState<string[]>(initialChecked);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Try reading saved checklist from localStorage if available
    try {
      const saved = localStorage.getItem(`ticket_checklist_${ticketId}`);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch {}
  }, [ticketId]);

  const toggleItem = (item: string) => {
    setCheckedItems((prev) => {
      const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
      try {
        localStorage.setItem(`ticket_checklist_${ticketId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const progressPercent = Math.round((checkedItems.length / checklistItems.length) * 100);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSaveChecklist) {
        await onSaveChecklist(checkedItems, progressPercent);
      }
      toast.success("Checklist técnico salvo com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao salvar checklist: ${err?.message || "Ocorreu um erro"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ListChecks className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              Checklist Técnico Recomendado
              <Badge variant="secondary" className="text-[10px] font-mono">
                {checkedItems.length}/{checklistItems.length} concluídos
              </Badge>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Procedimentos operacionais recomendados para {categoryName || "esta categoria"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSaveChecklist && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="text-xs h-7 gap-1"
            >
              <Save className="size-3" /> Salvar Progresso
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Progresso do Atendimento</span>
          <span className={progressPercent === 100 ? "text-emerald-600 font-bold" : ""}>
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Items list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {checklistItems.map((item, idx) => {
          const isDone = checkedItems.includes(item);
          return (
            <div
              key={idx}
              onClick={() => toggleItem(item)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                  : "bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckSquare className="size-4 text-emerald-600" />
                ) : (
                  <Square className="size-4 text-muted-foreground/60" />
                )}
              </div>
              <span
                className={`text-xs leading-tight ${
                  isDone ? "line-through text-muted-foreground font-medium" : "font-normal"
                }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
