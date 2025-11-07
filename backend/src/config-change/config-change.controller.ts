import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ConfigChangeService } from "./config-change.service";

@ApiTags("config-changes")
@Controller("config-changes")
export class ConfigChangeController {
  constructor(private readonly configChangeService: ConfigChangeService) {}

  @Get()
  @ApiOperation({
    summary: "Get configuration change history (price & duration updates)",
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
  @ApiQuery({
    name: "type",
    required: false,
    description: "Filter by change type (price_updated or duration_updated)",
    example: "price_updated",
  })
  @ApiResponse({
    status: 200,
    description: "Configuration change history retrieved successfully",
  })
  async getConfigChanges(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("type") type?: string
  ) {
    return this.configChangeService.getConfigChanges(page, limit, type);
  }
}
