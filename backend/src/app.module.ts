import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule } from '@nestjs/throttler';
//DB
import { TypeOrmModule } from '@nestjs/typeorm';
import { appDataSource } from './config/db.config';

//Config
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { CorsMiddleware, CorrelationIdMiddleware } from './core/middleware';
import { UserModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './core/guards';
import { OtpModule } from '@modules/otp/otp.module';
import { ProductsModule } from './modules/products/products.module';
import { HealthModule } from './modules/health';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChaosModule } from './modules/chaos';
import { InventoryModule } from './modules/inventory';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TelemetryModule } from '@infrastructure/telemetry';

import { LanguageEnum } from '@shared/enums';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'src/shared/icons'),
            serveRoot: '/diagnosis-icons',
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'src', 'test'),
            serveRoot: '/test',
        }),
        ConfigModule.forRoot({
            load: [jwtConfig],
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(appDataSource.options),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        I18nModule.forRoot({
            fallbackLanguage: LanguageEnum.KOREAN,
            loaderOptions: {
                path: join(process.cwd(), 'src/i18n'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
            ],
            typesOutputPath: join(
                process.cwd(),
                'src/generated/i18n.generated.ts',
            ),
            formatter: (template: string, ...args: any[]) => {
                let result = template;
                if (args[0]) {
                    Object.keys(args[0]).forEach((key) => {
                        result = result.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            args[0][key],
                        );
                        result = result.replace(
                            new RegExp(`\\{${key}\\}`, 'g'),
                            args[0][key],
                        );
                    });
                }
                return result;
            },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TelemetryModule,
        UserModule,
        AuthModule,
        OtpModule,
        ProductsModule,
        HealthModule,
        NotificationsModule,
        ChaosModule,
        InventoryModule,
        OrdersModule,
        PaymentsModule,
        ReportsModule,
    ],
    controllers: [AppController],
    providers: [AppService, JwtStrategy],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorsMiddleware, CorrelationIdMiddleware).forRoutes('*');
    }
}
