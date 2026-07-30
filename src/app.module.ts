import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UserModule } from './modules/user/user.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        // Only enable SSL if explicitly enabled via env (e.g., Render/production cloud DBs)
        const useSsl = configService.get<string>('DB_SSL') === 'true';

        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: false,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    UserModule,
    TenantModule,
    ProductModule,
    OrderModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
