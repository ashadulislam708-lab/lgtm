import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator.js';
import { Roles } from '@core/decorators/roles.decorator.js';
import { RolesGuard } from '@core/guards/roles.guard.js';
import { RolesEnum } from '@shared/enums/role.enum.js';
import { SuccessResponseDto } from '@shared/dtos/response.dto.js';
import { PaymentService } from '../services/payment.service.js';
import { ProcessPaymentDto } from '../dto/process-payment.dto.js';
import { PaymentStatusResponseDto } from '../dto/payment-status-response.dto.js';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    /**
     * Enqueue payment processing
     * Access: Admin only
     */
    @Post('process')
    @Roles(RolesEnum.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Payment',
        operation: 'custom',
        summary: 'Enqueue payment processing',
        requestDto: ProcessPaymentDto,
        requiresAuth: true,
    })
    async processPayment(
        @Body() dto: ProcessPaymentDto,
    ): Promise<SuccessResponseDto<{ jobId: string; message: string }>> {
        const result = await this.paymentService.processPayment(dto.orderId);
        return new SuccessResponseDto(result, result.message);
    }

    /**
     * Get payment status for an order
     * Access: Customer (own) / Admin
     */
    @Get(':orderId/status')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Payment Status',
        operation: 'custom',
        summary: 'Get payment status for an order',
        responseDto: PaymentStatusResponseDto,
        requiresAuth: true,
    })
    async getPaymentStatus(
        @Param('orderId', ParseUUIDPipe) orderId: string,
    ): Promise<SuccessResponseDto<PaymentStatusResponseDto>> {
        const status = await this.paymentService.getPaymentStatus(orderId);
        return new SuccessResponseDto(status, 'Payment status retrieved');
    }
}
