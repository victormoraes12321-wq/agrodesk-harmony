import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuthUser } from "../../common/interfaces/auth-user.interface";
import { toJsonValue } from "../../common/utils/json-value.util";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

export interface GlobalSettings {
  companyName: string;
  defaultSlaHours: number;
  uploadLimitMb: number;
  logo: string | null;
  itContactName: string | null;
  itContactEmail: string | null;
  itContactPhone: string | null;
}

function parseSettings(value: unknown): GlobalSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const settings = value as Record<string, unknown>;

  return {
    companyName: typeof settings.companyName === "string" ? settings.companyName : "AgroDesk TI",
    defaultSlaHours: typeof settings.defaultSlaHours === "number" ? settings.defaultSlaHours : 24,
    uploadLimitMb:
      typeof settings.uploadLimitMb === "number"
        ? settings.uploadLimitMb
        : Number(process.env.UPLOAD_MAX_MB ?? 10),
    logo: typeof settings.logo === "string" ? settings.logo : null,
    itContactName: typeof settings.itContactName === "string" ? settings.itContactName : null,
    itContactEmail: typeof settings.itContactEmail === "string" ? settings.itContactEmail : null,
    itContactPhone: typeof settings.itContactPhone === "string" ? settings.itContactPhone : null,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const existing = await this.prisma.setting.findUnique({ where: { key: "global" } });
    const parsed = parseSettings(existing?.value);
    if (parsed) return parsed;

    const defaultSettings = {
      companyName: "AgroDesk TI",
      defaultSlaHours: 24,
      uploadLimitMb: Number(process.env.UPLOAD_MAX_MB ?? 10),
      logo: null,
      itContactName: null,
      itContactEmail: null,
      itContactPhone: null,
    };

    await this.prisma.setting.upsert({
      where: { key: "global" },
      create: {
        key: "global",
        value: defaultSettings,
      },
      update: { value: defaultSettings },
    });

    return defaultSettings;
  }

  async updateSettings(actor: AuthUser, dto: UpdateSettingsDto) {
    const value = {
      companyName: dto.companyName ?? "AgroDesk TI",
      logo: dto.logo ?? null,
      defaultSlaHours: dto.defaultSlaHours ?? 24,
      uploadLimitMb: dto.uploadLimitMb ?? Number(process.env.UPLOAD_MAX_MB ?? 10),
      itContactName: dto.itContactName ?? null,
      itContactEmail: dto.itContactEmail ?? null,
      itContactPhone: dto.itContactPhone ?? null,
    };

    const updated = await this.prisma.setting.upsert({
      where: { key: "global" },
      create: {
        key: "global",
        value,
      },
      update: {
        value,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.sub,
        entity: "Settings",
        entityId: updated.id,
        action: "SETTINGS_UPDATE",
        newValue: toJsonValue(dto),
      },
    });

    return value;
  }
}
