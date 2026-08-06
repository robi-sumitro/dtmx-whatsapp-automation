import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './common/security.module';
import { AIModule } from './ai/ai.module';
import { WaModule } from './wa/wa.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    PrismaModule,
    SecurityModule,
    AIModule,
    WaModule,
    PaymentModule,
  ],
})
export class AppModule {}