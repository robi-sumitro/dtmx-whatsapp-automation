import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './common/security.module';
import { AIModule } from './ai/ai.module';
import { WaModule } from './wa/wa.module';
import { PaymentModule } from './payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
ServeStaticModule.forRootAsync({
      useFactory: () => {
        // Serve built SPA from web/dist (Railway menjalankan build di root repo).
        const webDist =
          (existsSync(join(process.cwd(), 'web', 'dist')) &&
            join(process.cwd(), 'web', 'dist')) ||
          undefined;
        return [
          {
            rootPath: webDist || join(process.cwd(), 'dist', 'web'),
            serveRoot: '/',
            renderPath: '*',
            exclude: ['/api/(.*)'],
          },
        ];
      },
    }),
    PrismaModule,
    SecurityModule,
    AIModule,
    WaModule,
    PaymentModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}