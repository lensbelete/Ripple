import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { WorkspaceDto } from "@ripple/shared-types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { WorkspacesService } from "./workspaces.service";

@ApiTags("workspaces")
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: "List workspaces owned by the current user" })
  list(@CurrentUser() user: AuthUser): Promise<WorkspaceDto[]> {
    return this.workspacesService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a workspace" })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateWorkspaceDto): Promise<WorkspaceDto> {
    return this.workspacesService.create(user.id, body.name, body.description);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a workspace" })
  async get(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<WorkspaceDto> {
    return this.workspacesService.toDto(await this.workspacesService.getForUser(id, user.id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a workspace" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    return this.workspacesService.update(id, user.id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a workspace" })
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.workspacesService.remove(id, user.id);
  }
}
