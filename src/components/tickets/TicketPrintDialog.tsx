import { useState } from "react";
import { Printer, FileText, Receipt, X, CheckCircle2, ShieldCheck, Clock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import { getBranchName, getCategoryName, getDepartmentName } from "@/lib/helpdesk";
import type { Branch, Category, Department, Ticket } from "@/types";

interface TicketPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
  departments: Department[];
  branches: Branch[];
  categories: Category[];
  assigneeName?: string;
}

export function TicketPrintDialog({
  open,
  onOpenChange,
  ticket,
  departments,
  branches,
  categories,
  assigneeName = "Não atribuído",
}: TicketPrintDialogProps) {
  const [printFormat, setPrintFormat] = useState<"a4" | "thermal">("a4");

  const handlePrint = () => {
    window.print();
  };

  const departmentName = getDepartmentName(departments, ticket.departmentId);
  const branchName = getBranchName(branches, ticket.branchId);
  const categoryName = getCategoryName(categories, ticket.categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Printer className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Imprimir Ordem de Serviço</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  OS #{ticket.protocol} • Casa do Campo Suporte TI
                </p>
              </div>
            </div>

            {/* Alternador de Formato de Impressão */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setPrintFormat("a4")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  printFormat === "a4"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="size-3.5" /> Folha A4
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("thermal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  printFormat === "thermal"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Receipt className="size-3.5" /> Térmica 80mm
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Área de Visualização com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30 flex justify-center">
          {/* FORMATO A4 */}
          {printFormat === "a4" ? (
            <div
              id="ticket-print-area"
              className="w-full max-w-[780px] bg-white text-slate-900 p-8 rounded-2xl shadow-md border border-slate-200 text-sm space-y-6 print:p-0 print:shadow-none print:border-none print:max-w-none"
            >
              {/* Cabeçalho A4 */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/Logo_Casa_do_Campo.png"
                    alt="Casa do Campo"
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      Casa do Campo
                    </h2>
                    <p className="text-xs font-bold text-emerald-800">
                      Departamento de Tecnologia da Informação • AgroDesk TI
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-mono font-bold text-sm px-3 py-1 rounded">
                    OS #{ticket.protocol}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-mono">
                    Emissão: {formatDateTime(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Informações Principais em Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Solicitante:</span>
                  <span className="font-bold text-slate-900 text-sm">{ticket.requesterName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Telefone / Ramal:</span>
                  <span className="font-semibold text-slate-800">{ticket.requesterPhone || "Não informado"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Filial / Unidade:</span>
                  <span className="font-semibold text-slate-800">{branchName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Setor:</span>
                  <span className="font-semibold text-slate-800">{departmentName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Categoria do Chamado:</span>
                  <span className="font-semibold text-slate-800">{categoryName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Equipamento / Patrimônio:</span>
                  <span className="font-bold text-slate-900">{ticket.equipment || ticket.assetTag || "Não informado"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Data de Abertura:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(ticket.createdAt)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Status / Prioridade:</span>
                  <span className="font-bold text-slate-900">
                    {statusLabel(ticket.status)} • {priorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>

              {/* Assunto e Descrição da Solicitação */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b pb-1">
                  1. Descrição da Solicitação / Problema Relatado
                </h4>
                {ticket.title && (
                  <p className="font-bold text-sm text-slate-900">{ticket.title}</p>
                )}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Diagnóstico e Solução Técnica */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b pb-1">
                  2. Diagnóstico & Parecer Técnico da T.I.
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-3">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Diagnóstico Técnico:</span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {ticket.diagnosis || "Em processo de triagem técnica / Aguardando encerramento."}
                    </p>
                  </div>
                  {ticket.solution && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-emerald-800 block mb-0.5">Solução Aplicada:</span>
                      <p className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                        {ticket.solution}
                      </p>
                    </div>
                  )}
                  {ticket.usedParts && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">Peças / Insumos Utilizados:</span>
                      <p className="text-slate-800 font-mono text-[11px]">{ticket.usedParts}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Conclusão e Técnico */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Técnico Responsável:</span>
                  <span className="font-bold text-slate-900">{assigneeName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block">Data de Resolução / Término:</span>
                  <span className="font-semibold text-slate-800">
                    {ticket.resolvedAt || ticket.closedAt
                      ? formatDateTime(ticket.resolvedAt || ticket.closedAt)
                      : "Em andamento"}
                  </span>
                </div>
              </div>

              {/* Bloco de Assinaturas */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <p className="font-bold text-slate-900">{ticket.requesterName}</p>
                  <p className="text-[10px] text-slate-500">Assinatura do Solicitante / De Acordo</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <p className="font-bold text-slate-900">{assigneeName}</p>
                  <p className="text-[10px] text-slate-500">Técnico de T.I. / Casa do Campo</p>
                </div>
              </div>
            </div>
          ) : (
            /* FORMATO CUPOM TÉRMICO 80MM */
            <div
              id="ticket-print-area"
              className="w-[300px] bg-white text-slate-900 p-4 rounded-xl shadow-md border border-slate-200 font-mono text-[11px] space-y-3 print:p-0 print:shadow-none print:border-none print:w-full"
            >
              {/* Header Térmico */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-1">
                <p className="font-black text-sm uppercase">CASA DO CAMPO</p>
                <p className="text-[10px]">Suporte Técnico & Help Desk</p>
                <p className="font-bold text-xs bg-slate-900 text-white py-0.5 rounded">
                  OS #{ticket.protocol}
                </p>
              </div>

              {/* Informações Térmicas */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
                <p><strong>DATA:</strong> {formatDateTime(ticket.createdAt)}</p>
                <p><strong>SOLIC:</strong> {ticket.requesterName}</p>
                <p><strong>FONE:</strong> {ticket.requesterPhone || "-"}</p>
                <p><strong>FILIAL:</strong> {branchName}</p>
                <p><strong>SETOR:</strong> {departmentName}</p>
                <p><strong>CATEG:</strong> {categoryName}</p>
                <p><strong>EQUIP:</strong> {ticket.equipment || ticket.assetTag || "-"}</p>
                <p><strong>STATUS:</strong> {statusLabel(ticket.status)}</p>
              </div>

              {/* Descrição Térmica */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
                <p className="font-bold uppercase text-[10px]">SOLICITAÇÃO:</p>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Solução Térmica */}
              {ticket.solution && (
                <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
                  <p className="font-bold uppercase text-[10px]">SOLUÇÃO APLICADA:</p>
                  <p className="whitespace-pre-wrap font-sans text-[11px]">{ticket.solution}</p>
                </div>
              )}

              {/* Assinatura Térmica */}
              <div className="pt-4 text-center space-y-4">
                <div>
                  <div className="border-b border-slate-400 w-3/4 mx-auto pb-4" />
                  <p className="text-[9px] mt-1">Assinatura Solicitante</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-3/4 mx-auto pb-4" />
                  <p className="text-[9px] mt-1">Técnico: {assigneeName}</p>
                </div>
                <p className="text-[9px] text-slate-500">AgroDesk TI • Casa do Campo</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" /> Documento Oficial de Atendimento
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handlePrint} className="gap-1.5 font-bold shadow-md">
              <Printer className="size-4" /> Imprimir Comprovante
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
