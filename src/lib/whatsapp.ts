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
  const requesterName = collapseWhitespace(ticket.requesterName) || "colaborador(a)";
  const protocol = ticket.protocol;
  const assignee = collapseWhitespace(context.assigneeName) || "Equipe de TI";
  const department = collapseWhitespace(context.departmentName) || "Não informado";
  const branch = collapseWhitespace(context.branchName) || "Não informado";
  const category = collapseWhitespace(context.categoryName) || "Não informada";
  const title = collapseWhitespace(ticket.title) || "Chamado de Suporte";
  const summary = compactText(ticket.description, 160);
  const note = collapseWhitespace(context.statusSpecificNote);
  const solution = compactText(ticket.solution, 160);
  const waitingMessage =
    note || collapseWhitespace(ticket.waitingRequesterMessage) || "Por favor, responda com as informações necessárias.";

  let statusHeader = "";
  let actionText = "";

  switch (status) {
    case "ABERTO":
      statusHeader = `🟡 *OS #${protocol} REGISTRADA*`;
      actionText = `Sua Ordem de Serviço foi recebida com sucesso e aguarda triagem da equipe de TI.`;
      break;

    case "EM_ANALISE":
      statusHeader = `🔵 *OS #${protocol} EM ANÁLISE*`;
      actionText = `Sua OS está em análise técnica para diagnóstico inicial.`;
      break;

    case "EM_ATENDIMENTO":
      statusHeader = `🟢 *OS #${protocol} EM ATENDIMENTO*`;
      actionText = `Técnico responsável: *${assignee}*.\nO atendimento já está em andamento.`;
      break;

    case "AGUARDANDO_USUARIO":
      statusHeader = `🟧 *OS #${protocol} - AGUARDANDO SUA RESPOSTA*`;
      actionText = `Precisamos de informações adicionais para prosseguir com o atendimento:\n👉 *${waitingMessage}*`;
      break;

    case "AGUARDANDO_PECA":
      statusHeader = `🟨 *OS #${protocol} - AGUARDANDO PEÇA / TERCEIROS*`;
      actionText = `O atendimento aguarda chegada de componente ou liberação de fornecedor terceiro. Retomaremos assim que disponível.`;
      break;

    case "RESOLVIDO":
      statusHeader = `✅ *OS #${protocol} RESOLVIDA*`;
      actionText = `Solução aplicada: ${solution || "Atendimento concluído com sucesso."}\n\nCaso o problema persista, responda esta mensagem para reabrirmos a OS.`;
      break;

    case "FINALIZADO":
      statusHeader = `🏁 *OS #${protocol} FINALIZADA*`;
      actionText = `Atendimento encerrado. Agradecemos o contato com o AgroDesk TI!`;
      break;

    case "CANCELADO":
      statusHeader = `❌ *OS #${protocol} CANCELADA*`;
      actionText = note
        ? `Motivo do cancelamento: ${note}`
        : `Esta Ordem de Serviço foi cancelada. Entre em contato com a TI se necessitar de novo chamado.`;
      break;

    case "REABERTO":
      statusHeader = `🔄 *OS #${protocol} REABERTA*`;
      actionText = `Sua OS foi reaberta e voltou para a fila prioritária de atendimento da TI.`;
      break;

    default:
      statusHeader = `📌 *ATUALIZAÇÃO DA OS #${protocol}*`;
      actionText = `Status atual: ${status}`;
      break;
  }

  const sections = [
    `Olá, *${requesterName}*!`,
    ``,
    statusHeader,
    ``,
    `📋 *Assunto:* ${title}`,
    `🏢 *Unidade/Setor:* ${branch} | ${department}`,
    `🏷️ *Categoria:* ${category}`,
    ``,
    `ℹ️ *Atualização:*`,
    actionText,
    ``,
    `— *AgroDesk TI Harmony* | Suporte Casa do Campo`,
  ];

  return sections.join("\n");
}

export function buildQuickDirectWhatsAppUrl(
  ticket: Ticket,
  context: { technicianName?: string; customMessage?: string } = {},
): string | null {
  const phone = ticket.requesterPhone;
  if (!phone) return null;

  const tech = collapseWhitespace(context.technicianName) || "da equipe de T.I.";
  const title = collapseWhitespace(ticket.title) || "Chamado Técnico";
  const protocol = ticket.protocol;
  const requester = collapseWhitespace(ticket.requesterName) || "colaborador(a)";

  const defaultMsg = `Olá, *${requester}*! Aqui é o *${tech}* da TI da Casa do Campo sobre a sua OS *#${protocol}* (${title}). Podemos falar sobre este chamado?`;

  return buildWhatsAppUrl(phone, context.customMessage || defaultMsg);
}
