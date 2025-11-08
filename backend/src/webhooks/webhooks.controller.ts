import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
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
}
