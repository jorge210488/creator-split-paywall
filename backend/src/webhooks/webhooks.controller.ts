import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";
import { AnomalyWebhookDto } from "./dto/anomaly-webhook.dto";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("anomalies")
  @ApiOperation({ summary: "Receive anomaly alerts from analytics service" })
  @ApiResponse({ status: 201, description: "Anomaly recorded successfully" })
  @ApiResponse({ status: 400, description: "Invalid payload" })
  async handleAnomaly(@Body() dto: AnomalyWebhookDto) {
    return this.webhooksService.handleAnomaly(dto);
  }
}
