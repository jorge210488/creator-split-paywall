import { IsEthereumAddress, IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GetStatusDto {
  @ApiProperty({
    description: "Ethereum wallet address",
    example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  })
  @IsEthereumAddress()
  address: string;
}

export class GetHistoryDto {
  @ApiProperty({
    description: "Ethereum wallet address",
    example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  })
  @IsEthereumAddress()
  address: string;

  @ApiPropertyOptional({ description: "Page number", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
