import { Module } from '@nestjs/common';
import { DeviceTemplatesController } from './device-templates.controller';
import { DeviceTemplatesService } from './device-templates.service';

@Module({
  controllers: [DeviceTemplatesController],
  providers: [DeviceTemplatesService],
  exports: [DeviceTemplatesService],
})
export class DeviceTemplatesModule {}
