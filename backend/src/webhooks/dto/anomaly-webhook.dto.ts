import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsEthereumAddress,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AnomalyType, AnomalySeverity } from "../../entities/anomaly.entity";

export class AnomalyWebhookDto {
  @ApiProperty({ enum: AnomalyType, description: "Type of anomaly detected" })
  @IsEnum(AnomalyType)
  type: AnomalyType;

  @ApiProperty({
    enum: AnomalySeverity,
    description: "Severity level",
    default: AnomalySeverity.MEDIUM,
  })
  @IsEnum(AnomalySeverity)
  severity: AnomalySeverity;

  @ApiPropertyOptional({
    description: "Ethereum wallet address involved",
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress()
  walletAddress?: string;

  @ApiProperty({ description: "Description of the anomaly" })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: "Additional metadata", required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
