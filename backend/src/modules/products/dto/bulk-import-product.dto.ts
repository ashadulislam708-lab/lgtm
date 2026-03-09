import { Type } from 'class-transformer';
import { ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class BulkImportProductDto {
    @ApiProperty({
        description: 'Array of products to import',
        type: [CreateProductDto],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateProductDto)
    products: CreateProductDto[];
}
