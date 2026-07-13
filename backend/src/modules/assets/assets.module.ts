import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
