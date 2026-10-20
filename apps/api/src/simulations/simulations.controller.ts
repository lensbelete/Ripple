import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SimulationRunDetailDto, SimulationRunDto } from "@ripple/shared-types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { RunSimulationDto } from "./dto/run-simulation.dto";
import { SimulationsService } from "./simulations.service";

@ApiTags("simulations")
@Controller()
export class SimulationsController {
  constructor(private readonly simulations: SimulationsService) {}

  @Post("models/:id/simulate")
  @ApiOperation({ summary: "Run a deterministic simulation against a saved model snapshot" })
  run(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: RunSimulationDto,
  ): Promise<SimulationRunDetailDto> {
    return this.simulations.run(id, user.id, body);
  }

  @Get("models/:id/simulations")
  @ApiOperation({ summary: "List simulations for a model" })
  list(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<SimulationRunDto[]> {
    return this.simulations.listForModel(id, user.id);
  }

  @Get("simulations/:id")
  @ApiOperation({ summary: "Get a stored simulation, including the model snapshot used" })
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<SimulationRunDetailDto> {
    return this.simulations.get(id, user.id);
  }
}
