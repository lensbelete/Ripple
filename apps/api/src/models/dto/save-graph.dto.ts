import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class SaveGraphNodeDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  type!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty()
  @IsNumber()
  positionX!: number;

  @ApiProperty()
  @IsNumber()
  positionY!: number;

  @ApiProperty()
  @IsObject()
  config!: Record<string, unknown>;
}

export class SaveGraphDependencyDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  sourceNodeId!: string;

  @ApiProperty()
  @IsUUID()
  targetNodeId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  unit?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number | null;
}

export class SaveGraphDto {
  @ApiProperty({ type: [SaveGraphNodeDto] })
  @ValidateNested({ each: true })
  @Type(() => SaveGraphNodeDto)
  @ArrayMaxSize(500)
  nodes!: SaveGraphNodeDto[];

  @ApiProperty({ type: [SaveGraphDependencyDto] })
  @ValidateNested({ each: true })
  @Type(() => SaveGraphDependencyDto)
  @ArrayMaxSize(2000)
  dependencies!: SaveGraphDependencyDto[];
}
