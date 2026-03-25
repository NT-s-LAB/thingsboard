import { Module, forwardRef } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => EmailModule)],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
