ALTER TABLE "TicketAttachment"
ADD COLUMN "isInternal" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "TicketAttachment_ticketId_isInternal_createdAt_idx"
ON "TicketAttachment"("ticketId", "isInternal", "createdAt");
