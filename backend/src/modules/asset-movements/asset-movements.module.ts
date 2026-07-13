import { Module } from '@nestjs/common';
import { AssetMovementsService } from './asset-movements.service';
import { AssetMovementsController } from './asset-movements.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [AssetMovementsController],
  providers: [AssetMovementsService],
})
export class AssetMovementsModule {}
