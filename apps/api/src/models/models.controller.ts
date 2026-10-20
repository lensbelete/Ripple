import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { GraphValidationResult, SystemModelDto, SystemModelGraphDto } from "@ripple/shared-types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateModelDto } from "./dto/create-model.dto";
import { SaveGraphDto } from "./dto/save-graph.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { ModelsService } from "./models.service";

@ApiTags("models")
@Controller()
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get("workspaces/:workspaceId/models")
  @ApiOperation({ summary: "List models in a workspace" })
  list(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
  ): Promise<SystemModelDto[]> {
    return this.modelsService.listForWorkspace(workspaceId, user.id);
  }

  @Post("workspaces/:workspaceId/models")
  @ApiOperation({ summary: "Create a system model" })
  create(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateModelDto,
  ): Promise<SystemModelDto> {
    return this.modelsService.create(workspaceId, user.id, body.name, body.description);
  }

  @Get("models/:id")
  @ApiOperation({ summary: "Get a model and its graph" })
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<SystemModelGraphDto> {
    return this.modelsService.getGraph(id, user.id);
  }

  @Patch("models/:id")
  @ApiOperation({ summary: "Update model metadata" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateModelDto,
  ): Promise<SystemModelDto> {
    return this.modelsService.update(id, user.id, body);
  }

  @Delete("models/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a model" })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.modelsService.remove(id, user.id);
  }

  @Put("models/:id/graph")
  @ApiOperation({ summary: "Replace the saved graph for a model" })
  saveGraph(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: SaveGraphDto,
  ): Promise<SystemModelGraphDto> {
    return this.modelsService.saveGraph(id, user.id, body);
  }

  @Post("models/:id/validate")
  @HttpCode(200)
  @ApiOperation({ summary: "Validate the saved graph without changing it" })
  validate(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<GraphValidationResult> {
    return this.modelsService.validate(id, user.id);
  }
}
