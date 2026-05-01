import { Controller, Get } from "@nestjs/common";
import { API_HEALTH_PATH, createHealthResponse, type ApiHealthResponse } from "@cryptopoker/contracts";

@Controller()
export class HealthController {
  @Get(API_HEALTH_PATH)
  health(): ApiHealthResponse {
    return createHealthResponse("ok");
  }
}
