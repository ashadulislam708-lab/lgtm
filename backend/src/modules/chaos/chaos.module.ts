import { Global, Module } from '@nestjs/common';
import { ChaosConfigService } from './services/chaos-config.service';
import { ChaosController } from './controllers/chaos.controller';

@Global()
@Module({
    controllers: [ChaosController],
    providers: [ChaosConfigService],
    exports: [ChaosConfigService],
})
export class ChaosModule {}
