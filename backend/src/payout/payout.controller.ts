import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { PayoutService } from "./payout.service";

@ApiTags("payouts")
@Controller("payouts")
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get(":address")
  @ApiOperation({ summary: "Get payout history for a payee address" })
  @ApiParam({
    name: "address",
    description: "Ethereum address of the payee",
    example: "0x5EEa7805E1920Ed024dBa8fC8c65A1fda2411fEB",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page (default: 10, max: 100)",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Payout history retrieved successfully",
  })
  async getPayoutHistory(
    @Param("address") address: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.payoutService.getPayoutHistory(address, page, limit);
  }

  @Get()
  @ApiOperation({ summary: "Get all payouts (paginated)" })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page (default: 10, max: 100)",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "All payouts retrieved successfully",
  })
  async getAllPayouts(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.payoutService.getAllPayouts(page, limit);
  }
}
