import { Module } from '@nestjs/common';
import { WaService } from './wa.service';
import { WaController } from './wa.controller';
import { WaWebhookController } from './wa-webhook.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [WaController, WaWebhookController],
  providers: [WaService],
  exports: [WaService],
})
export class WaModule {}