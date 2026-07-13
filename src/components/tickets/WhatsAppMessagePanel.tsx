import { Copy, ExternalLink, MessageCircle, Phone, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppUrl, formatPhoneForWhatsApp, generateWhatsAppMessage } from "@/lib/whatsapp";
import type { Ticket } from "@/types";

type WhatsAppMessagePanelProps = {
  ticket: Ticket;
  assigneeName: string;
  departmentName: string;
  branchName: string;
  categoryName: string;
  onPrepared: (input: {
    message: string;
    phoneUsed: string;
    statusAtMoment: Ticket["status"];
  }) => Promise<void>;
};

export function WhatsAppMessagePanel({
  ticket,
  assigneeName,
  departmentName,
  branchName,
  categoryName,
  onPrepared,
}: WhatsAppMessagePanelProps) {
  const defaultMessage = useMemo(
    () =>
      generateWhatsAppMessage(ticket, {
        assigneeName,
        departmentName,
        branchName,
        categoryName,
      }),
    [ticket, assigneeName, departmentName, branchName, categoryName],
  );

  const [message, setMessage] = useState(defaultMessage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage, ticket.id, ticket.status]);

  const phoneInfo = useMemo(
    () => formatPhoneForWhatsApp(ticket.requesterPhone),
    [ticket.requesterPhone],
  );

  const registerPreparation = async (phoneUsed: string, content: string) => {
    setSaving(true);
    try {
      await onPrepared({
        message: content,
        phoneUsed,
        statusAtMoment: ticket.status,
      });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Nao foi possivel registrar auditoria do WhatsApp.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyMessage = async () => {
    const content = message.trim();
    if (!content) {
      toast.error("A mensagem esta vazia.");
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      await registerPreparation(
        phoneInfo.normalized || ticket.requesterPhone || "SEM_TELEFONE",
        content,
      );
      toast.success("Mensagem copiada para area de transferencia.");
    } catch {
      toast.error("Nao foi possivel copiar a mensagem.");
    }
  };

  const openWhatsApp = async () => {
    const content = message.trim();
    if (!content) {
      toast.error("A mensagem esta vazia.");
      return;
    }

    const url = buildWhatsAppUrl(ticket.requesterPhone, content);
    if (!url) {
      toast.warning("Numero invalido para abrir WhatsApp. Corrija o telefone no chamado.");
      return;
    }

    await registerPreparation(phoneInfo.normalized || ticket.requesterPhone, content);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp aberto com mensagem pre-preenchida.");
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="size-4" /> Comunicacao com solicitante
        </CardTitle>
        <CardDescription>
          A mensagem pode ser revisada antes de abrir o WhatsApp. O sistema registra "mensagem
          preparada", sem confirmar envio real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/25 p-3 text-sm">
          <p className="font-medium flex items-center gap-2">
            <Phone className="size-4" /> Telefone usado: {ticket.requesterPhone || "Nao informado"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Numero para wa.me: {phoneInfo.normalized || "invalido"}
          </p>
          {!phoneInfo.valid && (
            <p className="text-xs text-warning-foreground mt-2 flex items-center gap-1.5">
              <TriangleAlert className="size-3.5" />
              {phoneInfo.reason ||
                "Numero invalido para WhatsApp. Ainda e possivel copiar a mensagem."}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Preview da mensagem</Label>
          <Textarea
            rows={10}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Mensagem para o solicitante"
          />
          <p className="text-xs text-muted-foreground">
            Voce pode editar esta mensagem temporariamente antes de abrir o WhatsApp. Isso nao
            altera o historico tecnico do chamado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setMessage(defaultMessage)}>
            <RefreshCw className="size-4" /> Restaurar modelo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyMessage()}
            disabled={saving}
          >
            <Copy className="size-4" /> Copiar mensagem
          </Button>
          <Button type="button" onClick={() => void openWhatsApp()} disabled={saving}>
            <ExternalLink className="size-4" /> Abrir WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
