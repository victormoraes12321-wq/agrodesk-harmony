import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { PasswordChangeGuard } from "./common/guards/password-change.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { SlaModule } from "./modules/sla/sla.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AssetTypesModule } from './modules/asset-types/asset-types.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AssetMovementsModule } from './modules/asset-movements/asset-movements.module';
import { AssetMaintenancesModule } from './modules/asset-maintenances/asset-maintenances.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: "global",
        ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 1200),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    BranchesModule,
    CategoriesModule,
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    SlaModule,
    NotificationsModule,
    ReportsModule,
    AuditLogsModule,
    SettingsModule,
    SuppliersModule,
    AssetTypesModule,
    AssetsModule,
    AssetMovementsModule,
    AssetMaintenancesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PasswordChangeGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
