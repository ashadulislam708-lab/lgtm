import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { I18nHelper } from '@core/utils/i18n.helper';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    controllers: [ProductController],
    providers: [ProductRepository, ProductService, I18nHelper],
    exports: [ProductService, ProductRepository],
})
export class ProductsModule {}
