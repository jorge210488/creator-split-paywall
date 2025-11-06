import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}

  // Liveness probe: quick check to verify the app process is alive
  @Get("live")
  liveness() {
    return { status: "ok" };
  }

  // Readiness probe: checks dependencies like the database
  @Get("ready")
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }

  // Backwards-compatible root endpoint -> readiness
  @Get()
  @HealthCheck()
  check() {
    return this.readiness();
  }
}
