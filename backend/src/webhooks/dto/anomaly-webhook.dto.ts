import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsEthereumAddress,
  IsNumber,
  IsNotEmpty,
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

export class AnalyticsAnomalyWebhookDto {
  @ApiProperty({ description: "Ethereum address that triggered anomaly" })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: "Transaction hash" })
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @ApiProperty({ description: "Amount in wei (as string)" })
  @IsString()
  @IsNotEmpty()
  amountWei: string;

  @ApiProperty({ description: "Block number" })
  @IsNumber()
  blockNumber: number;

  @ApiProperty({ description: "Log index in block" })
  @IsNumber()
  logIndex: number;

  @ApiProperty({
    description: "Detection rule used",
    enum: ["IQR", "ZSCORE", "ISOLATION_FOREST"],
  })
  @IsString()
  @IsNotEmpty()
  rule: string;

  @ApiProperty({ description: "Anomaly score" })
  @IsNumber()
  score: number;

  @ApiProperty({ description: "Deduplication key" })
  @IsString()
  @IsNotEmpty()
  dedupeKey: string;

  @ApiProperty({ description: "Timestamp ISO string" })
  @IsString()
  @IsNotEmpty()
  ts: string;

  @ApiProperty({ description: "Additional metadata" })
  @IsObject()
  meta: {
    amountEth: number;
    ratio: number;
    delta_t?: number;
    batchCountForAddress: number;
  };
}
