import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BlockchainService } from "./blockchain.service";
import { BlockchainStatusDto } from "./dto/blockchain-status.dto";

@ApiTags("blockchain")
@Controller("blockchain")
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get("status")
  @ApiOperation({
    summary: "Get blockchain ingestion status",
    description:
      "Returns current state of blockchain event ingestion including RPC connectivity, polling status, and processing metrics",
  })
  @ApiResponse({
    status: 200,
    description: "Blockchain status retrieved successfully",
    type: BlockchainStatusDto,
  })
  async getStatus(): Promise<BlockchainStatusDto> {
    return this.blockchainService.getIngestionStatus();
  }
}
