import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { SubscriptionService } from "./subscription.service";

@ApiTags("subscriptions")
@Controller("subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get(":address/status")
  @ApiOperation({ summary: "Get subscription status for a wallet address" })
  @ApiParam({ name: "address", description: "Ethereum wallet address" })
  @ApiResponse({
    status: 200,
    description: "Subscription status retrieved successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid address format" })
  async getStatus(@Param("address") address: string) {
    return this.subscriptionService.getStatus(address);
  }

  @Get(":address/history")
  @ApiOperation({
    summary: "Get subscription and payment history for a wallet address",
  })
  @ApiParam({ name: "address", description: "Ethereum wallet address" })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page (default: 10)",
  })
  @ApiResponse({ status: 200, description: "History retrieved successfully" })
  @ApiResponse({ status: 400, description: "Invalid parameters" })
  async getHistory(
    @Param("address") address: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.subscriptionService.getHistory(address, page, limit);
  }

  @Get("creator/:id/metrics")
  @ApiOperation({ summary: "Get metrics for a creator (placeholder)" })
  @ApiParam({ name: "id", description: "Creator ID" })
  @ApiResponse({ status: 200, description: "Metrics retrieved successfully" })
  async getCreatorMetrics(@Param("id") id: string) {
    return this.subscriptionService.getCreatorMetrics(id);
  }
}
