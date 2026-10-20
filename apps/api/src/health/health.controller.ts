import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiHealthResponse } from "@ripple/shared-types";
import { Public } from "../common/decorators/public.decorator";
import { HealthService } from "./health.service";

@ApiTags("health")
@Public()
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "Service health",
    description: "Reports API, PostgreSQL, and simulation-engine availability.",
  })
  @ApiOkResponse({ description: "Health report for the API and its dependencies." })
  getHealth(): Promise<ApiHealthResponse> {
    return this.healthService.getHealth();
  }
}
