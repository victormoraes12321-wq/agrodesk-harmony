import type { Ticket } from "@/types";

export interface FormattedWhatsAppPhone {
  raw: string;
  digits: string;
  normalized: string;
  valid: boolean;
  reason?: string;
}

export interface WhatsAppMessageContext {
  assigneeName?: string;
  departmentName?: string;
  branchName?: string;
  categoryName?: string;
  statusOverride?: Ticket["status"];
  statusSpecificNote?: string;
}

const GENERIC_NEXT_STEP = "A equipe de TI continuara acompanhando e atualizando este chamado.";

function collapseWhitespace(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function compactText(value?: string, max = 140): string {
  const text = collapseWhitespace(value);
  if (!text) return "-";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export function formatPhoneForWhatsApp(phone: string): FormattedWhatsAppPhone {
  const raw = phone ?? "";
  const digitsOnly = raw.replace(/\D/g, "");

  if (!digitsOnly) {
    return {
      raw,
      digits: "",
      normalized: "",
      valid: false,
      reason: "Telefone vazio.",
    };
  }

  let digits = digitsOnly;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length > 11) digits = digits.replace(/^0+/, "");

  if (digits.length === 10 || digits.length === 11) {
    return {
      raw,
      digits,
      normalized: `55${digits}`,
      valid: true,
    };
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return {
      raw,
      digits,
      normalized: digits,
      valid: true,
    };
  }

  return {
    raw,
    digits,
    normalized: digits,
    valid: false,
    reason: "Telefone fora do padrao esperado para WhatsApp.",
  };
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const parsed = formatPhoneForWhatsApp(phone);
  if (!parsed.valid || !parsed.normalized) return null;
  return `https://wa.me/${parsed.normalized}?text=${encodeURIComponent(message)}`;
}

export function generateWhatsAppMessage(
  ticket: Ticket,
  context: WhatsAppMessageContext = {},
): string {
  const status = context.statusOverride ?? ticket.status;
  const requesterName = collapseWhitespace(ticket.requesterName) || "colaborador";
  const protocol = ticket.protocol;
  const assignee = collapseWhitespace(context.assigneeName) || "Equipe TI";
  const department = collapseWhitespace(context.departmentName) || "Nao informado";
  const branch = collapseWhitespace(context.branchName) || "Nao informado";
  const category = collapseWhitespace(context.categoryName) || "Nao informada";
  const summary = compactText(ticket.description, 180);
  const waitingReason =
    collapseWhitespace(context.statusSpecificNote) ||
    collapseWhitespace(ticket.waitingRequesterMessage) ||
    "Envie os dados solicitados para continuarmos.";
  const solution = compactText(ticket.solution, 180);

  let statusMessage = "";
  let nextStep = GENERIC_NEXT_STEP;

  if (status === "ABERTO") {
    statusMessage = `Sua OS #${protocol} foi registrada com sucesso.`;
    nextStep = "Nossa equipe de T.I. vai analisar e retornar com os proximos passos.";
  } else if (status === "EM_ANALISE") {
    statusMessage = `Sua OS #${protocol} esta em analise pela equipe de T.I.`;
    nextStep = "Estamos validando as informacoes para definir o melhor atendimento.";
  } else if (status === "EM_ATENDIMENTO") {
    statusMessage = `Sua OS #${protocol} esta em atendimento ativo.`;
    nextStep = `Responsavel atual: ${assignee}.`;
  } else if (status === "AGUARDANDO_USUARIO") {
    statusMessage = `Para continuarmos sua OS #${protocol}, precisamos da sua resposta.`;
    nextStep = `Retorno esperado: ${waitingReason}`;
  } else if (status === "AGUARDANDO_PECA") {
    statusMessage = `Sua OS #${protocol} esta aguardando peca, liberacao ou suporte de terceiro.`;
    nextStep = "Assim que houver atualizacao, retomamos o atendimento imediatamente.";
  } else if (status === "RESOLVIDO") {
    statusMessage = `Sua OS #${protocol} foi marcada como resolvida.`;
    nextStep = `Solucao aplicada: ${solution}. Se persistir, responda por aqui para ajustarmos.`;
  } else if (status === "FINALIZADO") {
    statusMessage = `Sua OS #${protocol} foi finalizada.`;
    nextStep = "Se precisar de novo suporte, abra uma nova OS no AgroDesk TI.";
  } else if (status === "CANCELADO") {
    statusMessage = `Sua OS #${protocol} foi cancelada.`;
    nextStep = context.statusSpecificNote
      ? `Motivo: ${compactText(context.statusSpecificNote, 160)}`
      : "Se ainda precisar de suporte, entre em contato com a T.I. ou abra nova OS.";
  } else if (status === "REABERTO") {
    statusMessage = `Sua OS #${protocol} foi reaberta e voltou para atendimento da T.I.`;
    nextStep = "Vamos seguir com novos testes e te atualizar por aqui.";
  }

  const lines = [
    `Ola, ${requesterName}.`,
    statusMessage,
    `Status atual: ${status}.`,
    `Setor: ${department} | Filial/local: ${branch}.`,
    `Categoria: ${category}.`,
    `Resumo do problema: ${summary}`,
    `Proxima acao: ${nextStep}`,
  ];

  return lines.filter((line) => collapseWhitespace(line).length > 0).join("\n");
}
