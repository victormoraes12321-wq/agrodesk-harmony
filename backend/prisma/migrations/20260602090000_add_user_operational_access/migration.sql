ALTER TABLE "User"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "canReceiveTickets" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_canReceiveTickets_isActive_idx" ON "User"("canReceiveTickets", "isActive");
