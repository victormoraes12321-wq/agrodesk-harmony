import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetMaintenanceDto } from './create-asset-maintenance.dto';

export class UpdateAssetMaintenanceDto extends PartialType(CreateAssetMaintenanceDto) {}