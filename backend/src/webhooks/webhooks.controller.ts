import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";
import {
  AnomalyWebhookDto,
  AnalyticsAnomalyWebhookDto,
} from "./dto/anomaly-webhook.dto";
import { ConfigService } from "@nestjs/config";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService
  ) {}

  @Post("anomalies")
  @ApiOperation({ summary: "Receive anomaly alerts from analytics service" })
  @ApiHeader({
    name: "X-ANALYTICS-TOKEN",
    description: "Analytics service authentication token",
    required: false,
  })
  @ApiResponse({ status: 201, description: "Anomaly recorded successfully" })
  @ApiResponse({ status: 400, description: "Invalid payload" })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async handleAnomaly(
    @Body() dto: AnalyticsAnomalyWebhookDto,
    @Headers("x-analytics-token") token?: string
  ) {
    // Validate analytics token if configured
    const expectedToken = this.configService.get<string>(
      "ANALYTICS_WEBHOOK_TOKEN"
    );
    if (expectedToken && token !== expectedToken) {
      throw new UnauthorizedException("Invalid analytics token");
    }

    return this.webhooksService.handleAnalyticsAnomaly(dto);
  }

  @Get("anomalies")
  @ApiOperation({ summary: "List recent anomalies (for testing/monitoring)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Max results (default 10)" })
  @ApiQuery({ name: "resolved", required: false, type: Boolean, description: "Filter by resolved status" })
  @ApiResponse({ status: 200, description: "List of anomalies" })
  async listAnomalies(
    @Query("limit") limit?: string,
    @Query("resolved") resolved?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedResolved = resolved === "true" ? true : resolved === "false" ? false : undefined;
    return this.webhooksService.listAnomalies(parsedLimit, parsedResolved);
  }
}
