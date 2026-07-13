import { Module } from '@nestjs/common';
import { AssetMaintenancesService } from './asset-maintenances.service';
import { AssetMaintenancesController } from './asset-maintenances.controller';

@Module({
  controllers: [AssetMaintenancesController],
  providers: [AssetMaintenancesService],
})
export class AssetMaintenancesModule {}
