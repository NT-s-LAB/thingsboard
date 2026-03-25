import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';

@Module({
  imports: [forwardRef(() => AdminSettingsModule)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
